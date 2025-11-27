
import React, { useState, useEffect } from 'react';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Box, Typography, Paper, Snackbar, Alert, Stepper, Step, StepLabel, StepContent, IconButton, FormLabel, RadioGroup, Radio, FormGroup } from '@mui/material';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RichTextEditor from './RichTextEditor';
import SeoPreview from './SeoPreview';
import { generateUniqueSlug } from '../utils/articleUtils';
import { stripHtml } from '../utils/textUtils';

const gsSubjects = {
    'GS1': ['History', 'Geography', 'Society', 'Art & Culture'],
    'GS2': ['Polity', 'Governance', 'International Relations', 'Social Justice'],
    'GS3': ['Economy', 'Environment', 'Science & Technology', 'Security'],
    'GS4': ['Ethics', 'Integrity', 'Aptitude', 'Case Studies']
};

// Example APPSC groups and subjects. Adjust these lists as needed.
const appscGroups = {
    'GroupI': ['Polity', 'History', 'Economy', 'Geography'],
    'GroupII': ['General Science', 'Maths', 'Current Affairs'],
    'GroupIII': ['Public Administration', 'Ethics']
};

// Example TGPSC groups and subjects. Adjust these lists as needed.
const tgpscGroups = {
    'GroupA': ['Telangana Polity', 'Telangana Economy', 'Telangana History'],
    'GroupB': ['Local Governance', 'Environment', 'Science & Tech']
};

const CUSTOM_CATEGORY_VALUE = 'custom';

// Top-level category types (three sections: National, International, State)
const CATEGORY_TYPES = [
    { value: 'National', label: 'National' },
    { value: 'International', label: 'International' },
    { value: 'State', label: 'State/Regional' }
];

const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date =
        value instanceof Date
            ? value
            : typeof value?.toDate === 'function'
                ? value.toDate()
                : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const tzAdjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return tzAdjusted.toISOString().slice(0, 16);
};

const parseDateTimeLocal = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const defaultDateString = () => new Date().toISOString().split('T')[0];

const toDateTimeLocalString = (value) => {
    if (!value) return '';
    const resolved = value instanceof Date
        ? value
        : typeof value?.toDate === 'function'
            ? value.toDate()
            : new Date(value);
    if (Number.isNaN(resolved.getTime())) return '';
    const local = new Date(resolved.getTime() - resolved.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};

const CurrentAffairsForm = ({ editingArticle, onUpdateSuccess }) => {
    const [user] = useAuthState(auth);
    const [activeStep, setActiveStep] = useState(0);
    const [currentAffairsData, setCurrentAffairsData] = useState({
        title: '',
        summary: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        scheduledAt: '',
        publishedAt: null,
        category: 'General',
        examRelevance: { prelims: false, mains: false },
        domains: {
            categoryType: 'National',
            exams: {
                upsc: { enabled: false, gs: '', subjects: [] },
                appsc: { enabled: false, group: '', subjects: [] },
                tgpsc: { enabled: false, group: '', subjects: [] }
            }
        },
        image: null,
        imagePreview: null,
        videoUrl: '',
        pyqs: { prelims: [], mains: [] },
        seo: { metaTitle: '', metaDescription: '', ogImage: '' },
        slug: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (editingArticle) {
            // Map legacy domains -> new domains shape when possible
            const legacyDomains = editingArticle.domains || {};
            const domains = {
                categoryType: (editingArticle.category || 'National'),
                exams: {
                    upsc: { enabled: false, gs: '', subjects: [] },
                    appsc: { enabled: false, group: '', subjects: [] },
                    tgpsc: { enabled: false, group: '', subjects: [] }
                }
            };

            if (legacyDomains.gs || (legacyDomains.subjects && legacyDomains.subjects.length)) {
                domains.exams.upsc.enabled = true;
                domains.exams.upsc.gs = legacyDomains.gs || '';
                domains.exams.upsc.subjects = legacyDomains.subjects || [];
            }

            // If editingArticle has an exams shape already, prefer it
            if (legacyDomains.exams) {
                domains.categoryType = legacyDomains.categoryType || domains.categoryType;
                domains.exams = { ...domains.exams, ...legacyDomains.exams };
            }

            setCurrentAffairsData({
                ...editingArticle,
                date: editingArticle.date && typeof editingArticle.date.toDate === 'function' ? editingArticle.date.toDate().toISOString().split('T')[0] : (editingArticle.date || new Date().toISOString().split('T')[0]),
                image: null,
                imagePreview: editingArticle.imageUrl || null,
                slug: editingArticle.slug || '',
                domains
            });
        } else {
            setCurrentAffairsData({
                title: '', summary: '', content: '', date: new Date().toISOString().split('T')[0],
                category: 'General', examRelevance: { prelims: false, mains: false },
                domains: {
                    categoryType: 'National',
                    exams: {
                        upsc: { enabled: false, gs: '', subjects: [] },
                        appsc: { enabled: false, group: '', subjects: [] },
                        tgpsc: { enabled: false, group: '', subjects: [] }
                    }
                }, image: null, imagePreview: null, videoUrl: '',
                pyqs: { prelims: [], mains: [] }, slug: ''
            });
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
                        domains: {
                            categoryType: 'National',
                            exams: {
                                upsc: { enabled: false, gs: '', subjects: [] },
                                appsc: { enabled: false, group: '', subjects: [] },
                                tgpsc: { enabled: false, group: '', subjects: [] }
                            }
                        }, image: null, imagePreview: null, videoUrl: '',
                        pyqs: { prelims: [], mains: [] }, slug: ''
                    });
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

    // Category type change (National / International / State)
    const handleCategoryTypeChange = (event) => {
        const value = event.target.value;
        setCurrentAffairsData(prev => ({ ...prev, category: value, domains: { ...prev.domains, categoryType: value } }));
    };

    // Toggle exam relevance (enable/disable exam block)
    const handleExamToggle = (examKey) => {
        setCurrentAffairsData(prev => ({
            ...prev,
            domains: {
                ...prev.domains,
                exams: {
                    ...prev.domains.exams,
                    [examKey]: {
                        ...prev.domains.exams[examKey],
                        enabled: !prev.domains.exams[examKey].enabled
                    }
                }
            }
        }));
    };

    const handleUPSCChangePaper = (value) => {
        setCurrentAffairsData(prev => ({
            ...prev,
            domains: {
                ...prev.domains,
                exams: {
                    ...prev.domains.exams,
                    upsc: { ...prev.domains.exams.upsc, gs: value, subjects: [] }
                }
            }
        }));
    };

    const handleAPPSCGroupChange = (value) => {
        setCurrentAffairsData(prev => ({
            ...prev,
            domains: {
                ...prev.domains,
                exams: {
                    ...prev.domains.exams,
                    appsc: { ...prev.domains.exams.appsc, group: value, subjects: [] }
                }
            }
        }));
    };

    const handleTGPSCGroupChange = (value) => {
        setCurrentAffairsData(prev => ({
            ...prev,
            domains: {
                ...prev.domains,
                exams: {
                    ...prev.domains.exams,
                    tgpsc: { ...prev.domains.exams.tgpsc, group: value, subjects: [] }
                }
            }
        }));
    };

    const handleExamSubjectToggle = (examKey, subject) => {
        setCurrentAffairsData(prev => {
            const exam = prev.domains.exams[examKey];
            const exists = exam.subjects.includes(subject);
            const newSubjects = exists ? exam.subjects.filter(s => s !== subject) : [...exam.subjects, subject];
            return {
                ...prev,
                domains: {
                    ...prev.domains,
                    exams: {
                        ...prev.domains.exams,
                        [examKey]: { ...exam, subjects: newSubjects }
                    }
                }
            };
        });
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
                                <InputLabel id="current-affairs-category-type-label">Category Type</InputLabel>
                                <Select
                                    labelId="current-affairs-category-type-label"
                                    value={currentAffairsData.domains.categoryType}
                                    label="Category Type"
                                    onChange={handleCategoryTypeChange}
                                >
                                    {CATEGORY_TYPES.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl component="fieldset" sx={{ mt: 1 }}>
                                <FormLabel component="legend">Target Exams</FormLabel>
                                <FormGroup row>
                                    <FormControlLabel control={<Checkbox checked={currentAffairsData.domains.exams.upsc.enabled} onChange={() => handleExamToggle('upsc')} />} label="UPSC" />
                                    <FormControlLabel control={<Checkbox checked={currentAffairsData.domains.exams.appsc.enabled} onChange={() => handleExamToggle('appsc')} />} label="APPSC" />
                                    <FormControlLabel control={<Checkbox checked={currentAffairsData.domains.exams.tgpsc.enabled} onChange={() => handleExamToggle('tgpsc')} />} label="TGPSC" />
                                </FormGroup>
                            </FormControl>

                            {/* UPSC block */}
                            {currentAffairsData.domains.exams.upsc.enabled && (
                                <Box sx={{ mt: 1 }}>
                                    <FormControl fullWidth>
                                        <InputLabel id="upsc-gs-label">UPSC GS Paper</InputLabel>
                                        <Select
                                            labelId="upsc-gs-label"
                                            value={currentAffairsData.domains.exams.upsc.gs}
                                            label="UPSC GS Paper"
                                            onChange={(e) => handleUPSCChangePaper(e.target.value)}
                                        >
                                            {Object.keys(gsSubjects).map(gs => (
                                                <MenuItem key={gs} value={gs}>{gs}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {currentAffairsData.domains.exams.upsc.gs && (
                                        <FormControl component="fieldset" sx={{ mt: 1 }}>
                                            <FormLabel component="legend">UPSC Subjects</FormLabel>
                                            <FormGroup row>
                                                {gsSubjects[currentAffairsData.domains.exams.upsc.gs].map(subject => (
                                                    <FormControlLabel
                                                        key={subject}
                                                        control={<Checkbox checked={currentAffairsData.domains.exams.upsc.subjects.includes(subject)} onChange={() => handleExamSubjectToggle('upsc', subject)} />}
                                                        label={subject}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </FormControl>
                                    )}
                                </Box>
                            )}

                            {/* APPSC block */}
                            {currentAffairsData.domains.exams.appsc.enabled && (
                                <Box sx={{ mt: 1 }}>
                                    <FormControl fullWidth>
                                        <InputLabel id="appsc-group-label">APPSC Group</InputLabel>
                                        <Select
                                            labelId="appsc-group-label"
                                            value={currentAffairsData.domains.exams.appsc.group}
                                            label="APPSC Group"
                                            onChange={(e) => handleAPPSCGroupChange(e.target.value)}
                                        >
                                            {Object.keys(appscGroups).map(g => (
                                                <MenuItem key={g} value={g}>{g}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {currentAffairsData.domains.exams.appsc.group && (
                                        <FormControl component="fieldset" sx={{ mt: 1 }}>
                                            <FormLabel component="legend">APPSC Subjects</FormLabel>
                                            <FormGroup row>
                                                {appscGroups[currentAffairsData.domains.exams.appsc.group].map(subject => (
                                                    <FormControlLabel
                                                        key={subject}
                                                        control={<Checkbox checked={currentAffairsData.domains.exams.appsc.subjects.includes(subject)} onChange={() => handleExamSubjectToggle('appsc', subject)} />}
                                                        label={subject}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </FormControl>
                                    )}
                                </Box>
                            )}

                            {/* TGPSC block */}
                            {currentAffairsData.domains.exams.tgpsc.enabled && (
                                <Box sx={{ mt: 1 }}>
                                    <FormControl fullWidth>
                                        <InputLabel id="tgpsc-group-label">TGPSC Group</InputLabel>
                                        <Select
                                            labelId="tgpsc-group-label"
                                            value={currentAffairsData.domains.exams.tgpsc.group}
                                            label="TGPSC Group"
                                            onChange={(e) => handleTGPSCGroupChange(e.target.value)}
                                        >
                                            {Object.keys(tgpscGroups).map(g => (
                                                <MenuItem key={g} value={g}>{g}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    {currentAffairsData.domains.exams.tgpsc.group && (
                                        <FormControl component="fieldset" sx={{ mt: 1 }}>
                                            <FormLabel component="legend">TGPSC Subjects</FormLabel>
                                            <FormGroup row>
                                                {tgpscGroups[currentAffairsData.domains.exams.tgpsc.group].map(subject => (
                                                    <FormControlLabel
                                                        key={subject}
                                                        control={<Checkbox checked={currentAffairsData.domains.exams.tgpsc.subjects.includes(subject)} onChange={() => handleExamSubjectToggle('tgpsc', subject)} />}
                                                        label={subject}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </FormControl>
                                    )}
                                </Box>
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
