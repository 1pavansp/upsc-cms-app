import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, TextField, InputAdornment, CircularProgress, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import StudyMaterialForm from './StudyMaterialForm';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';

const StudyMaterialManager = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMaterialData, setEditingMaterialData] = useState(null);

    const civicCentreMaterials = [
        { id: 'cc-1', title: 'UPSC - CSE(PRELIMS) 2025 PAPER-I (GENERAL STUDIES) KEY WITH AUTHENTIC SOURCES SET - B', type: 'PDF', category: 'Previous Year Papers', isCivicCentre: true },
        { id: 'cc-2', title: 'UPSC - CSE(PRELIMS) 2025 SET - B PAPER-II (CSAT) KEY', type: 'PDF', category: 'Previous Year Papers', isCivicCentre: true },
        { id: 'cc-3', title: 'APPSC GROUP-2 MAINS EXAMINATION 2025 PAPER-2 REFLECTED QUESTIONS FROM CIVICCENTRE IAS', type: 'PDF', category: 'Previous Year Papers', isCivicCentre: true },
        { id: 'cc-4', title: 'APPSC GROUP-2 MAINS EXAMINATION 2025 PAPER-1 REFLECTED QUESTIONS FROM CIVICCENTRE IAS', type: 'PDF', category: 'Previous Year Papers', isCivicCentre: true },
    ];

    useEffect(() => {
        const fetchMaterials = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, 'studyMaterials'));
                const materialsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMaterials([...civicCentreMaterials, ...materialsList]);
            } catch (err) {
                console.error("Error fetching materials:", err);
                setError('Failed to fetch study materials.');
            } finally {
                setLoading(false);
            }
        };
        fetchMaterials();
    }, []);

    const handleAddMaterial = () => {
        setEditingMaterialData(null);
        setIsFormOpen(true);
    };

    const handleEditMaterial = (material) => {
        setEditingMaterialData(material);
        setIsFormOpen(true);
    };

    const handleDeleteMaterial = async (materialId, fileUrl) => {
        if (window.confirm('Are you sure you want to delete this study material? This will also delete the file.')) {
            try {
                // Delete Firestore document
                await deleteDoc(doc(db, 'studyMaterials', materialId));

                // Delete file from Storage
                if (fileUrl) {
                    const fileRef = ref(storage, fileUrl);
                    await deleteObject(fileRef);
                }

                setMaterials(materials.filter(m => m.id !== materialId));
            } catch (err) {
                console.error("Error deleting material:", err);
                setError('Failed to delete material. Please try again.');
            }
        }
    };

    const handleSaveMaterial = async (materialData) => {
        try {
            const { id, file: _file, ...dataToSave } = materialData;
            dataToSave.lastUpdated = serverTimestamp();

            if (id) {
                // Update existing material
                const materialRef = doc(db, 'studyMaterials', id);
                await updateDoc(materialRef, dataToSave);
                setMaterials(materials.map(m => m.id === id ? { ...m, ...dataToSave } : m));
            } else {
                // Add new material
                dataToSave.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, 'studyMaterials'), dataToSave);
                setMaterials([...materials, { id: docRef.id, ...dataToSave }]);
            }
            setIsFormOpen(false);
        } catch (err) {
            console.error("Error saving material:", err);
            setError('Failed to save material.');
        }
    };

    const handleCancelForm = () => {
        setIsFormOpen(false);
        setEditingMaterialData(null);
    };

    const filteredMaterials = materials.filter(m =>
        (m.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.type?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (isFormOpen) {
        return <StudyMaterialForm editingMaterial={editingMaterialData} onSave={handleSaveMaterial} onCancel={handleCancelForm} />;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Study Material Manager
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddMaterial} sx={{ backgroundColor: '#2563eb', '&:hover': { backgroundColor: '#1e40af' } }}>
                    Add New Material
                </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                    }}
                />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredMaterials.length > 0 ? (
                                    filteredMaterials.map((material) => (
                                        <TableRow key={material.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <DescriptionIcon fontSize="small" color="action" />
                                                    {material.title}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{material.type}</TableCell>
                                            <TableCell>{material.category}</TableCell>
                                            <TableCell align="right"> 
                                                <IconButton color="primary" onClick={() => handleEditMaterial(material)} disabled={material.isCivicCentre}><EditIcon /></IconButton>
                                                <IconButton color="error" onClick={() => handleDeleteMaterial(material.id, material.fileUrl)} disabled={material.isCivicCentre}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            No study materials found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
};

export default StudyMaterialManager;
