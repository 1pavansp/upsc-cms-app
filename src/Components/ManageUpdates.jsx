
import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Paper, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Grid, Card, CardMedia, CardContent, CardActions, Typography } from '@mui/material';
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
            <Grid container spacing={2}>
                {updates.map((update) => (
                    <Grid item xs={12} sm={6} key={update.id}>
                        <Card>
                            {update.imageUrl && (
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={update.imageUrl}
                                    alt={update.title}
                                />
                            )}
                            <CardContent>
                                <Typography gutterBottom variant="h5" component="div">
                                    {update.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {update.category} - {formatDate(update.date)}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <IconButton onClick={() => setEditingUpdate(update)}><EditIcon /></IconButton>
                                <IconButton onClick={() => handleClickOpen(update)}><DeleteIcon /></IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
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
