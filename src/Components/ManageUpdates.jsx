
import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const formatDate = (date) => {
    if (!date) return '';
    if (date.toDate) { // Firestore Timestamp
        return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString(); // String date
};

const ManageUpdates = ({ setEditingUpdate }) => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [selectedUpdate, setSelectedUpdate] = useState(null);

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'latest-updates'));
                const updatesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUpdates(updatesList);
            } catch (err) {
                setError('Failed to fetch updates.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUpdates();
    }, []);

    const handleClickOpen = (update) => {
        setSelectedUpdate(update);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedUpdate(null);
    };

    const handleDelete = async () => {
        if (selectedUpdate) {
            try {
                await deleteDoc(doc(db, 'latest-updates', selectedUpdate.id));
                setUpdates(updates.filter(update => update.id !== selectedUpdate.id));
                handleClose();
            } catch (err) {
                setError('Failed to delete update.');
                console.error(err);
            }
        }
    };

    if (loading) return <p>Loading updates...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <Paper sx={{ p: 2 }}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {updates.map((update) => (
                            <TableRow key={update.id}>
                                <TableCell>{update.title}</TableCell>
                                <TableCell>{update.category}</TableCell>
                                <TableCell>{formatDate(update.date)}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => setEditingUpdate(update)}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleClickOpen(update)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Delete Update</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the update "{selectedUpdate?.title}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default ManageUpdates;
