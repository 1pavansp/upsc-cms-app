
import React, { useState, useEffect } from 'react';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Box, Typography, Paper, Snackbar, Alert } from '@mui/material';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import RichTextEditor from './RichTextEditor';
import { stripHtml } from '../utils/textUtils';

const LatestUpdatesForm = ({ editingUpdate, onUpdateSuccess }) => {
    const [user] = useAuthState(auth);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        important: false,
        image: null,
        imagePreview: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (editingUpdate) {
            setFormData({
                ...editingUpdate,
                image: null, // Reset image input
                imagePreview: editingUpdate.imageUrl || null,
            });
        } else {
            setFormData({
                title: '',
                content: '',
                category: '',
                important: false,
                image: null,
                imagePreview: null,
            });
        }
    }, [editingUpdate]);

    const handleImageUpload = async (file) => {
        if (!file) return null;
        const storageRef = ref(storage, `images/latest-updates/${file.name}-${Date.now()}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setSnackbar({ open: true, message: 'You must be logged in.', severity: 'error' });
            return;
        }
        const contentText = stripHtml(formData.content);
        if (!formData.title || contentText.length === 0 || !formData.category) {
            setSnackbar({ open: true, message: 'Please fill in all required fields.', severity: 'error' });
            return;
        }

        setIsSubmitting(true);

        try {
            let imageUrl = formData.imagePreview;
            if (formData.image) {
                imageUrl = await handleImageUpload(formData.image);
            }

            const dataToSave = {
                ...formData,
                imageUrl,
                timestamp: serverTimestamp(),
                authorId: user.uid,
            };

            if (editingUpdate) {
                const updateRef = doc(db, 'latest-updates', editingUpdate.id);
                await updateDoc(updateRef, dataToSave);
                setSnackbar({ open: true, message: 'Update successful!', severity: 'success' });
                if (onUpdateSuccess) onUpdateSuccess();
            } else {
                await addDoc(collection(db, 'latest-updates'), dataToSave);
                setSnackbar({ open: true, message: 'Update posted successfully!', severity: 'success' });
                setFormData({ title: '', content: '', category: '', important: false, image: null, imagePreview: null });
            }
        } catch (error) {
            console.error('Error saving update:', error);
            setSnackbar({ open: true, message: 'Error saving update. Please try again.', severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Paper elevation={3} sx={{ padding: '2rem', borderRadius: '1rem' }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
                {editingUpdate ? 'Edit Update' : 'Post a New Update'}
            </Typography>
            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'grid', gap: '1.5rem' }}>
                    <TextField
                        label="Update Title"
                        variant="outlined"
                        fullWidth
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                    <RichTextEditor
                        label="Update Content"
                        value={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                        uploadFolder="latest-updates/content"
                        minHeight={220}
                    />
                    <FormControl fullWidth required>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={formData.category}
                            label="Category"
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <MenuItem value="Notification">Notification</MenuItem>
                            <MenuItem value="Exam">Exam</MenuItem>
                            <MenuItem value="Result">Result</MenuItem>
                            <MenuItem value="Study Material">Study Material</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={<Checkbox checked={formData.important} onChange={(e) => setFormData({ ...formData, important: e.target.checked })} />}
                        label="Mark as Important"
                    />
                    <Box>
                        <Button variant="contained" component="label">
                            Upload Image
                            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                        </Button>
                        {formData.imagePreview && (
                            <Box sx={{ mt: 2, position: 'relative', width: 'fit-content' }}>
                                <img src={formData.imagePreview} alt="Preview" style={{ width: '200px', borderRadius: '8px' }} />
                                <Button
                                    size="small"
                                    sx={{ position: 'absolute', top: 0, right: 0, m: 0.5, p: 0.5, minWidth: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' } }}
                                    onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                                >
                                    X
                                </Button>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (editingUpdate ? 'Save Changes' : 'Post Update')}
                        </Button>
                        {editingUpdate && (
                            <Button variant="outlined" size="large" onClick={() => onUpdateSuccess()}>
                                Cancel
                            </Button>
                        )}
                    </Box>
                </Box>
            </form>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default LatestUpdatesForm;
