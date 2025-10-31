import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, MenuItem, FormControl, InputLabel, Select, Paper, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const createInitialStudyMaterialFormState = () => ({
    title: '',
    type: 'PDF',
    category: '',
    file: null,
    description: '',
    fileUrl: ''
});

const StudyMaterialForm = ({ editingMaterial, onSave, onCancel }) => {
    const [formData, setFormData] = useState(() => createInitialStudyMaterialFormState());
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (editingMaterial) {
            setFormData(editingMaterial);
        } else {
            setFormData(createInitialStudyMaterialFormState());
        }
    }, [editingMaterial]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.file && !editingMaterial) {
            alert('Please select a file to upload.');
            return;
        }

        if (formData.file) {
            setIsUploading(true);
            const storageRef = ref(storage, `study-materials/${Date.now()}_${formData.file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, formData.file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload failed:", error);
                    alert("File upload failed. Please try again.");
                    setIsUploading(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    onSave({ ...formData, fileUrl: downloadURL });
                    resetForm();
                }
            );
        } else {
            // If just editing metadata without changing the file
            onSave(formData);
            resetForm();
        }
    };
    
    const resetForm = () => {
        setIsUploading(false);
        setUploadProgress(0);
        setFormData(createInitialStudyMaterialFormState());
    }

    return (
        <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: '16px', border: '1px solid #e7eaf3', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)' }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
                {editingMaterial ? 'Edit Study Material' : 'Add New Study Material'}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField label="Title" name="title" value={formData.title} onChange={handleChange} fullWidth required />
                <FormControl fullWidth required>
                    <InputLabel>Type</InputLabel>
                    <Select name="type" value={formData.type} label="Type" onChange={handleChange}>
                        <MenuItem value="PDF">PDF</MenuItem>
                        <MenuItem value="Image">Image</MenuItem>
                        <MenuItem value="Doc">Doc</MenuItem>
                        <MenuItem value="Video">Video</MenuItem>
                    </Select>
                </FormControl>
                <TextField label="Category" name="category" value={formData.category} onChange={handleChange} fullWidth required />
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} fullWidth>
                    {formData.file ? formData.file.name : 'Upload File'}
                    <input type="file" hidden onChange={handleFileChange} />
                </Button>
                {isUploading && <LinearProgress variant="determinate" value={uploadProgress} />}
                <TextField label="Description" name="description" value={formData.description} onChange={handleChange} fullWidth multiline rows={4} />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button type="submit" variant="contained" disabled={isUploading} sx={{ backgroundColor: '#2563eb', '&:hover': { backgroundColor: '#1e40af' } }}>
                        {isUploading ? 'Uploading...' : 'Save Material'}
                    </Button>
                    <Button type="button" variant="outlined" onClick={onCancel} disabled={isUploading}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default StudyMaterialForm;
