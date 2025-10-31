
import React, { useState, useEffect } from 'react';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Box, Typography, Paper, Snackbar, Alert, Stepper, Step, StepLabel, StepContent, IconButton, FormLabel, RadioGroup, Radio, FormGroup } from '@mui/material';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RichTextEditor from './RichTextEditor';
import { generateUniqueSlug } from '../utils/articleUtils';
import { stripHtml } from '../utils/textUtils';

const gsSubjects = {
    'GS1': ['History', 'Geography', 'Society', 'Art & Culture'],
    'GS2': ['Polity', 'Governance', 'International Relations', 'Social Justice'],
    'GS3': ['Economy', 'Environment', 'Science & Technology', 'Security'],
    'GS4': ['Ethics', 'Integrity', 'Aptitude', 'Case Studies']
};

const CUSTOM_CATEGORY_VALUE = 'custom';

const CATEGORY_OPTIONS = [
    { value: 'General', label: 'General Current Affairs' },
    { value: 'Telangana', label: 'Telangana Current Affairs' },
    { value: 'Andhra Pradesh', label: 'Andhra Pradesh Current Affairs' },
    { value: 'GS1', label: 'GS1 Focus' },
    { value: 'GS2', label: 'GS2 Focus' },
    { value: 'GS3', label: 'GS3 Focus' },
    { value: 'GS4', label: 'GS4 Focus' },
    { value: CUSTOM_CATEGORY_VALUE, label: 'Custom Category' }
];

const CurrentAffairsForm = ({ editingArticle, onUpdateSuccess }) => {
    const [user] = useAuthState(auth);
    const [activeStep, setActiveStep] = useState(0);
    const [currentAffairsData, setCurrentAffairsData] = useState({
        title: '',
        summary: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        category: 'General',
        examRelevance: { prelims: false, mains: false },
        domains: { gs: '', subjects: [] },
        image: null,
        imagePreview: null,
        videoUrl: '',
        pyqs: { prelims: [], mains: [] },
        slug: ''
    });
    const [categorySelection, setCategorySelection] = useState('General');
    const [customCategory, setCustomCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isPredefinedCategory = (value) =>
        CATEGORY_OPTIONS.some(option => option.value !== CUSTOM_CATEGORY_VALUE && option.value === value);

    useEffect(() => {
        if (editingArticle) {
            setCurrentAffairsData({
                ...editingArticle,
                date: editingArticle.date.toDate().toISOString().split('T')[0],
                image: null,
                imagePreview: editingArticle.imageUrl || null,
                slug: editingArticle.slug || ''
            });
            const normalizedCategory = editingArticle.category || 'General';
            if (isPredefinedCategory(normalizedCategory)) {
                setCategorySelection(normalizedCategory);
                setCustomCategory('');
            } else {
                setCategorySelection(CUSTOM_CATEGORY_VALUE);
                setCustomCategory(normalizedCategory);
            }
        } else {
            setCurrentAffairsData({
                title: '', summary: '', content: '', date: new Date().toISOString().split('T')[0],
                category: 'General', examRelevance: { prelims: false, mains: false },
                domains: { gs: '', subjects: [] }, image: null, imagePreview: null, videoUrl: '',
                pyqs: { prelims: [], mains: [] }, slug: ''
            });
            setCategorySelection('General');
            setCustomCategory('');
        }
    }, [editingArticle]);

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleImageUpload = async (file) => {
        if (!file) return null;
        const storageRef = ref(storage, `images/current-affairs/${file.name}-${Date.now()}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setSnackbar({ open: true, message: 'You must be logged in.', severity: 'error' });
            return;
        }
        if (!currentAffairsData.title || stripHtml(currentAffairsData.content).length === 0) {
            setSnackbar({ open: true, message: 'Please fill in all required fields.', severity: 'error' });
            return;
        }
        const resolvedCategory = (currentAffairsData.category || '').trim();
        if (!resolvedCategory) {
            setSnackbar({ open: true, message: 'Please select or enter a category.', severity: 'error' });
            return;
        }
        const generatedSlug = await generateUniqueSlug(
            currentAffairsData.title,
            editingArticle?.id || null
        );

        setIsSubmitting(true);
        try {
            let imageUrl = currentAffairsData.imagePreview;
            if (currentAffairsData.image) {
                imageUrl = await handleImageUpload(currentAffairsData.image);
            }

            const { image: _image, imagePreview: _imagePreview, ...rest } = currentAffairsData; // Destructure to exclude image and imagePreview
            const dataToSave = {
                ...rest, // Spread the rest of the data
                category: resolvedCategory,
                imageUrl,
                date: new Date(currentAffairsData.date),
                timestamp: serverTimestamp(),
                authorId: user.uid,
                slug: generatedSlug
            };

            if (editingArticle) {
                const articleRef = doc(db, 'current-affairs', editingArticle.id);
                await updateDoc(articleRef, dataToSave);
                setSnackbar({ open: true, message: 'Article updated successfully!', severity: 'success' });
                if (onUpdateSuccess) onUpdateSuccess();
            } else {
                await addDoc(collection(db, 'current-affairs'), dataToSave);
                setSnackbar({ open: true, message: 'Current Affairs posted successfully!', severity: 'success' });
                setCurrentAffairsData({
                    title: '', summary: '', content: '', date: new Date().toISOString().split('T')[0],
                    category: 'General', examRelevance: { prelims: false, mains: false },
                    domains: { gs: '', subjects: [] }, image: null, imagePreview: null, videoUrl: '',
                    pyqs: { prelims: [], mains: [] }, slug: ''
                });
                setCategorySelection('General');
                setCustomCategory('');
                setActiveStep(0);
            }
        } catch (error) {
            console.error('Error saving article:', error);
            setSnackbar({ open: true, message: 'Error saving article. Please try again.', severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    const handleDomainChange = (field, value) => {
        const newDomains = { ...currentAffairsData.domains, [field]: value };
        if (field === 'gs') {
            newDomains.subjects = []; // Reset subjects when GS paper changes
        }
        setCurrentAffairsData({ ...currentAffairsData, domains: newDomains });
    };

    const handleSubjectChange = (subject) => {
        const newSubjects = currentAffairsData.domains.subjects.includes(subject)
            ? currentAffairsData.domains.subjects.filter(s => s !== subject)
            : [...currentAffairsData.domains.subjects, subject];
        handleDomainChange('subjects', newSubjects);
    };

    const handleCategorySelectionChange = (event) => {
        const value = event.target.value;
        setCategorySelection(value);
        if (value === CUSTOM_CATEGORY_VALUE) {
            setCurrentAffairsData(prev => ({
                ...prev,
                category: customCategory
            }));
        } else {
            setCustomCategory('');
            setCurrentAffairsData(prev => ({
                ...prev,
                category: value
            }));
        }
    };

    const handleCustomCategoryChange = (event) => {
        const value = event.target.value;
        setCustomCategory(value);
        setCurrentAffairsData(prev => ({
            ...prev,
            category: value
        }));
    };

    // Handlers for PYQs
    const addPYQ = (type) => {
        const newPyqs = { ...currentAffairsData.pyqs };
        if (type === 'prelims') {
            newPyqs.prelims.push({ year: '', question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' });
        } else {
            newPyqs.mains.push({ year: '', question: '', answer: '', marks: '' });
        }
        setCurrentAffairsData({ ...currentAffairsData, pyqs: newPyqs });
    };

    const removePYQ = (type, index) => {
        const newPyqs = { ...currentAffairsData.pyqs };
        if (type === 'prelims') {
            newPyqs.prelims.splice(index, 1);
        } else {
            newPyqs.mains.splice(index, 1);
        }
        setCurrentAffairsData({ ...currentAffairsData, pyqs: newPyqs });
    };

    const handlePYQChange = (type, index, field, value) => {
        const newPyqs = { ...currentAffairsData.pyqs };
        newPyqs[type][index][field] = value;
        setCurrentAffairsData({ ...currentAffairsData, pyqs: newPyqs });
    };

    const handleOptionChange = (index, optionIndex, value) => {
        const newPyqs = { ...currentAffairsData.pyqs };
        newPyqs.prelims[index].options[optionIndex] = value;
        setCurrentAffairsData({ ...currentAffairsData, pyqs: newPyqs });
    };

    const handleContentChange = (content) => {
        setCurrentAffairsData(prev => ({
            ...prev,
            content: content
        }));
    };

    return (
        <Paper elevation={3} sx={{ padding: '2rem', borderRadius: '1rem' }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
                {editingArticle ? 'Edit Article' : 'Post Current Affairs'}
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
                <Step>
                    <StepLabel>Main Content</StepLabel>
                    <StepContent>
                        <Box sx={{ display: 'grid', gap: '1.5rem', mt: 2 }}>
                            <TextField label="Title" fullWidth value={currentAffairsData.title} onChange={(e) => setCurrentAffairsData({ ...currentAffairsData, title: e.target.value })} required />
                            <TextField label="Summary" fullWidth multiline rows={3} value={currentAffairsData.summary} onChange={(e) => setCurrentAffairsData({ ...currentAffairsData, summary: e.target.value })} required />
                            <FormControl fullWidth>
                                <FormLabel component="legend" sx={{ mb: 1 }}>Detailed Content</FormLabel>
                                <RichTextEditor
                                    value={currentAffairsData.content}
                                    onChange={handleContentChange}
                                    uploadFolder="current-affairs/content"
                                    minHeight={320}
                                />
                            </FormControl>
                            <TextField type="date" label="Date" value={currentAffairsData.date} onChange={(e) => setCurrentAffairsData({ ...currentAffairsData, date: e.target.value })} InputLabelProps={{ shrink: true }} required />
                            <FormControl fullWidth>
                                <InputLabel id="current-affairs-category-label">Category</InputLabel>
                                <Select
                                    labelId="current-affairs-category-label"
                                    value={categorySelection}
                                    label="Category"
                                    onChange={handleCategorySelectionChange}
                                >
                                    {CATEGORY_OPTIONS.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {categorySelection === CUSTOM_CATEGORY_VALUE && (
                                <TextField
                                    label="Custom Category"
                                    value={customCategory}
                                    onChange={handleCustomCategoryChange}
                                    fullWidth
                                    required
                                    placeholder="Enter category name"
                                />
                            )}

                            <FormControl fullWidth>
                                <FormLabel component="legend">Article Image</FormLabel>
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="article-image-upload"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        setCurrentAffairsData({ ...currentAffairsData, image: file, imagePreview: file ? URL.createObjectURL(file) : null });
                                    }}
                                />
                                <label htmlFor="article-image-upload">
                                    <Button variant="outlined" component="span" startIcon={<AddIcon />}>
                                        Upload Image
                                    </Button>
                                </label>
                                {currentAffairsData.imagePreview && (
                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                                        <img src={currentAffairsData.imagePreview} alt="Article Preview" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                                        <IconButton onClick={() => setCurrentAffairsData({ ...currentAffairsData, image: null, imagePreview: null })} color="error" sx={{ ml: 2 }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                )}
                            </FormControl>

                            <FormControl component="fieldset">
                                <FormLabel component="legend">GS Paper</FormLabel>
                                <RadioGroup row name="gs-paper" value={currentAffairsData.domains.gs} onChange={(e) => handleDomainChange('gs', e.target.value)}>
                                    {Object.keys(gsSubjects).map(gs => (
                                        <FormControlLabel key={gs} value={gs} control={<Radio />} label={gs} />
                                    ))}
                                </RadioGroup>
                            </FormControl>

                            {currentAffairsData.domains.gs && (
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">Subjects</FormLabel>
                                    <FormGroup row>
                                        {gsSubjects[currentAffairsData.domains.gs].map(subject => (
                                            <FormControlLabel
                                                key={subject}
                                                control={<Checkbox checked={currentAffairsData.domains.subjects.includes(subject)} onChange={() => handleSubjectChange(subject)} name={subject} />}
                                                label={subject}
                                            />
                                        ))}
                                    </FormGroup>
                                </FormControl>
                            )}

                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={handleNext}>Next</Button>
                        </Box>
                    </StepContent>
                </Step>
                <Step>
                    <StepLabel>Previous Year Questions</StepLabel>
                    <StepContent>
                        <Typography variant="h6">Prelims PYQs</Typography>
                        {currentAffairsData.pyqs.prelims.map((pyq, index) => (
                            <Paper key={`prelims-${index}`} sx={{ p: 2, my: 2, border: '1px solid #ddd' }}>
                                <TextField label="Year" value={pyq.year} onChange={(e) => handlePYQChange('prelims', index, 'year', e.target.value)} sx={{ mb: 1 }} />
                                <TextField label="Question" multiline rows={2} fullWidth value={pyq.question} onChange={(e) => handlePYQChange('prelims', index, 'question', e.target.value)} sx={{ mb: 1 }} />
                                {pyq.options.map((opt, oIndex) => (
                                    <TextField key={oIndex} label={`Option ${oIndex + 1}`} value={opt} onChange={(e) => handleOptionChange(index, oIndex, e.target.value)} sx={{ mb: 1 }} />
                                ))}
                                <TextField label="Correct Answer" value={pyq.correctAnswer} onChange={(e) => handlePYQChange('prelims', index, 'correctAnswer', e.target.value)} sx={{ mb: 1 }} />
                                <TextField label="Explanation" multiline rows={2} fullWidth value={pyq.explanation} onChange={(e) => handlePYQChange('prelims', index, 'explanation', e.target.value)} sx={{ mb: 1 }} />
                                <IconButton onClick={() => removePYQ('prelims', index)}><DeleteIcon /></IconButton>
                            </Paper>
                        ))}
                        <Button startIcon={<AddIcon />} onClick={() => addPYQ('prelims')}>Add Prelims PYQ</Button>

                        <Typography variant="h6" sx={{ mt: 3 }}>Mains PYQs</Typography>
                        {currentAffairsData.pyqs.mains.map((pyq, index) => (
                            <Paper key={`mains-${index}`} sx={{ p: 2, my: 2, border: '1px solid #ddd' }}>
                                <TextField label="Year" value={pyq.year} onChange={(e) => handlePYQChange('mains', index, 'year', e.target.value)} sx={{ mb: 1 }} />
                                <TextField label="Question" multiline rows={2} fullWidth value={pyq.question} onChange={(e) => handlePYQChange('mains', index, 'question', e.target.value)} sx={{ mb: 1 }} />
                                <TextField label="Model Answer" multiline rows={4} fullWidth value={pyq.answer} onChange={(e) => handlePYQChange('mains', index, 'answer', e.target.value)} sx={{ mb: 1 }} />
                                <TextField label="Marks" type="number" value={pyq.marks} onChange={(e) => handlePYQChange('mains', index, 'marks', e.target.value)} sx={{ mb: 1 }} />
                                <IconButton onClick={() => removePYQ('mains', index)}><DeleteIcon /></IconButton>
                            </Paper>
                        ))}
                        <Button startIcon={<AddIcon />} onClick={() => addPYQ('mains')}>Add Mains PYQ</Button>

                        <Box sx={{ mt: 2 }}>
                            <Button onClick={handleBack} sx={{ mr: 1 }}>Back</Button>
                            <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : (editingArticle ? 'Save Changes' : 'Submit Current Affairs')}
                            </Button>
                            {editingArticle && (
                                <Button variant="outlined" size="large" onClick={() => onUpdateSuccess()}>
                                    Cancel
                                </Button>
                            )}
                        </Box>
                    </StepContent>
                </Step>
            </Stepper>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default CurrentAffairsForm;
