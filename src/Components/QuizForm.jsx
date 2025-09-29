
import React, { useState, useEffect } from 'react';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography, Paper, Snackbar, Alert, Stepper, Step, StepLabel, StepContent, FormControlLabel } from '@mui/material';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const QuizForm = ({ editingQuiz, onUpdateSuccess }) => {
    const [user] = useAuthState(auth);
    const [activeStep, setActiveStep] = useState(0);
    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        questions: [
            {
                question: '',
                options: ['', '', '', ''],
                correctAnswer: 0,
                explanation: ''
            }
        ]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (editingQuiz) {
            setQuizData({
                ...editingQuiz,
                date: editingQuiz.date.toDate().toISOString().split('T')[0],
            });
        } else {
            setQuizData({
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                questions: [
                    {
                        question: '',
                        options: ['', '', '', ''],
                        correctAnswer: 0,
                        explanation: ''
                    }
                ]
            });
        }
    }, [editingQuiz]);

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setSnackbar({ open: true, message: 'You must be logged in.', severity: 'error' });
            return;
        }
        if (!quizData.title || !quizData.description) {
            setSnackbar({ open: true, message: 'Please fill in all required fields.', severity: 'error' });
            return;
        }

        setIsSubmitting(true);

        try {
            const dataToSave = {
                ...quizData,
                date: new Date(quizData.date),
                timestamp: serverTimestamp(),
                authorId: user.uid
            };

            if (editingQuiz) {
                const quizRef = doc(db, 'daily-quiz', editingQuiz.id);
                await updateDoc(quizRef, dataToSave);
                setSnackbar({ open: true, message: 'Quiz updated successfully!', severity: 'success' });
                if (onUpdateSuccess) onUpdateSuccess();
            } else {
                await addDoc(collection(db, 'daily-quiz'), dataToSave);
                setSnackbar({ open: true, message: 'Quiz posted successfully!', severity: 'success' });
                setQuizData({
                    title: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    questions: [{
                        question: '',
                        options: ['', '', '', ''],
                        correctAnswer: 0,
                        explanation: ''
                    }]
                });
                setActiveStep(0);
            }
        } catch (error) {
            console.error('Error saving quiz:', error);
            setSnackbar({ open: true, message: 'Error saving quiz. Please try again.', severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleQuestionChange = (qIndex, field, value) => {
        const newQuestions = [...quizData.questions];
        newQuestions[qIndex][field] = value;
        setQuizData({ ...quizData, questions: newQuestions });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...quizData.questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuizData({ ...quizData, questions: newQuestions });
    };

    const addQuestion = () => {
        setQuizData({
            ...quizData,
            questions: [...quizData.questions, {
                question: '',
                options: ['', '', '', ''],
                correctAnswer: 0,
                explanation: ''
            }]
        });
    };

    const removeQuestion = (qIndex) => {
        const newQuestions = [...quizData.questions];
        newQuestions.splice(qIndex, 1);
        setQuizData({ ...quizData, questions: newQuestions });
    };

    return (
        <Paper elevation={3} sx={{ padding: '2rem', borderRadius: '1rem' }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
                {editingQuiz ? 'Edit Quiz' : 'Create a New Quiz'}
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
                <Step>
                    <StepLabel>Quiz Details</StepLabel>
                    <StepContent>
                        <Box sx={{ display: 'grid', gap: '1.5rem', mt: 2 }}>
                            <TextField
                                label="Quiz Title"
                                variant="outlined"
                                fullWidth
                                value={quizData.title}
                                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                                required
                            />
                            <TextField
                                label="Description"
                                variant="outlined"
                                fullWidth
                                multiline
                                rows={3}
                                value={quizData.description}
                                onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                                required
                            />
                            <TextField
                                type="date"
                                label="Quiz Date"
                                value={quizData.date}
                                onChange={(e) => setQuizData({ ...quizData, date: e.target.value })}
                                required
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleNext}
                            >
                                Next
                            </Button>
                        </Box>
                    </StepContent>
                </Step>
                <Step>
                    <StepLabel>Questions</StepLabel>
                    <StepContent>
                        {quizData.questions.map((question, qIndex) => (
                            <Paper key={qIndex} sx={{ p: 2, my: 2, border: '1px solid #ddd' }}>
                                <Typography variant="h6">Question {qIndex + 1}</Typography>
                                <TextField
                                    label="Question Text"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={question.question}
                                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                                    sx={{ my: 1 }}
                                />
                                {question.options.map((option, oIndex) => (
                                    <Box key={oIndex} sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                                        <TextField
                                            label={`Option ${oIndex + 1}`}
                                            value={option}
                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            fullWidth
                                        />
                                        <FormControlLabel
                                            control={
                                                <input
                                                    type="radio"
                                                    name={`correct-answer-${qIndex}`}
                                                    checked={question.correctAnswer === oIndex}
                                                    onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                                    style={{ marginLeft: '10px' }}
                                                />
                                            }
                                            label="Correct"
                                            labelPlacement="start"
                                        />
                                    </Box>
                                ))}
                                <TextField
                                    label="Explanation"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={question.explanation}
                                    onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                                    sx={{ my: 1 }}
                                />
                                <Button variant="outlined" color="error" onClick={() => removeQuestion(qIndex)}>
                                    Remove Question
                                </Button>
                            </Paper>
                        ))}
                        <Button variant="contained" onClick={addQuestion} sx={{ mt: 2 }}>
                            Add Another Question
                        </Button>
                        <Box sx={{ mt: 2 }}>
                            <Button onClick={handleBack} sx={{ mr: 1 }}>
                                Back
                            </Button>
                            <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : (editingQuiz ? 'Save Changes' : 'Submit Quiz')}
                            </Button>
                            {editingQuiz && (
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

export default QuizForm;
