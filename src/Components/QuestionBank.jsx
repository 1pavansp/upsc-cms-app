// s:\Cms\upsc-cms-app\src\Components\QuestionBank.jsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import QuestionForm from './QuestionForm'; // Import QuestionForm
import { createSnippet, stripHtml } from '../utils/textUtils';

const QuestionBank = () => {
    const [questions, setQuestions] = useState([]); // This will hold our questions
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false); // State to control form visibility
    const [editingQuestionData, setEditingQuestionData] = useState(null); // State to hold data of question being edited

    // Dummy data for now
    useEffect(() => {
        setQuestions([
            { id: '1', question: 'What is the capital of India?', options: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai'], answer: 'Delhi', topic: 'Geography', difficulty: 'Easy' },
            { id: '2', question: 'Who wrote "Discovery of India"?', options: ['Gandhi', 'Nehru', 'Tagore', 'Bose'], answer: 'Nehru', topic: 'History', difficulty: 'Medium' },
            { id: '3', question: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Rupee'], answer: 'Yen', topic: 'Economy', difficulty: 'Easy' },
        ]);
    }, []);

    const handleAddQuestion = () => {
        setEditingQuestionData(null); // Clear any previous editing data
        setIsFormOpen(true); // Open form in add mode
    };

    const handleEditQuestion = (id) => {
        const questionToEdit = questions.find(q => q.id === id);
        setEditingQuestionData(questionToEdit); // Set data for editing
        setIsFormOpen(true); // Open form in edit mode
    };

    const handleDeleteQuestion = (id) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            setQuestions(questions.filter(q => q.id !== id));
        }
    };

    const handleSaveQuestion = (newQuestionData) => {
        if (newQuestionData.id) {
            // Update existing question
            setQuestions(questions.map(q => q.id === newQuestionData.id ? newQuestionData : q));
        } else {
            // Add new question
            setQuestions([...questions, { ...newQuestionData, id: String(questions.length + 1) }]); // Simple ID generation
        }
        setIsFormOpen(false); // Close form
    };

    const handleCancelForm = () => {
        setIsFormOpen(false); // Close form
        setEditingQuestionData(null); // Clear editing data
    };

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredQuestions = questions.filter(q => {
        if (!normalizedSearch) {
            return true;
        }

        const questionText = stripHtml(q.question).toLowerCase();
        const topic = (q.topic || '').toLowerCase();
        const difficulty = (q.difficulty || '').toLowerCase();

        return (
            questionText.includes(normalizedSearch) ||
            topic.includes(normalizedSearch) ||
            difficulty.includes(normalizedSearch)
        );
    });

    return (
        <Box>
            {isFormOpen ? (
                <QuestionForm 
                    editingQuestion={editingQuestionData} 
                    onSave={handleSaveQuestion} 
                    onCancel={handleCancelForm} 
                />
            ) : (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                            Question Bank
                        </Typography>
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            onClick={handleAddQuestion}
                            sx={{
                                backgroundColor: '#2563eb',
                                '&:hover': {
                                    backgroundColor: '#1e40af',
                                }
                            }}
                        >
                            Add New Question
                        </Button>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search questions by text, topic, or difficulty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Question</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Topic</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Difficulty</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredQuestions.length > 0 ? (
                                        filteredQuestions.map((q) => (
                                            <TableRow key={q.id} hover>
                                                <TableCell>{createSnippet(q.question, 90) || 'N/A'}</TableCell>
                                                <TableCell>{q.topic}</TableCell>
                                                <TableCell>{q.difficulty}</TableCell>
                                                <TableCell align="right"> 
                                                    <IconButton color="primary" onClick={() => handleEditQuestion(q.id)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton color="error" onClick={() => handleDeleteQuestion(q.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#64748b' }}>
                                                No questions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </>
            )}
        </Box>
    );
};

export default QuestionBank;
