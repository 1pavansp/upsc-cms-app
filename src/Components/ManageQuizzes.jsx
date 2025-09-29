
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

const ManageQuizzes = ({ setEditingQuiz }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'daily-quiz'));
                const quizzesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setQuizzes(quizzesList);
            } catch (err) {
                setError('Failed to fetch quizzes.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    const handleClickOpen = (quiz) => {
        setSelectedQuiz(quiz);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedQuiz(null);
    };

    const handleDelete = async () => {
        if (selectedQuiz) {
            try {
                await deleteDoc(doc(db, 'daily-quiz', selectedQuiz.id));
                setQuizzes(quizzes.filter(quiz => quiz.id !== selectedQuiz.id));
                handleClose();
            } catch (err) {
                setError('Failed to delete quiz.');
                console.error(err);
            }
        }
    };

    if (loading) return <p>Loading quizzes...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <Paper sx={{ p: 2 }}>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {quizzes.map((quiz) => (
                            <TableRow key={quiz.id}>
                                <TableCell>{quiz.title}</TableCell>
                                <TableCell>{formatDate(quiz.date)}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => setEditingQuiz(quiz)}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleClickOpen(quiz)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Delete Quiz</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the quiz "{selectedQuiz?.title}"? This action cannot be undone.
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

export default ManageQuizzes;
