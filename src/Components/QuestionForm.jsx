// s:\Cms\upsc-cms-app\src\Components\QuestionForm.jsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, MenuItem, FormControl, InputLabel, Select, RadioGroup, FormControlLabel, Radio, FormLabel } from '@mui/material';

const QuestionForm = ({ editingQuestion, onSave, onCancel }) => {
    const initialFormState = {
        question: '',
        options: ['', '', '', ''],
        answer: '',
        topic: '',
        difficulty: 'Easy',
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (editingQuestion) {
            setFormData(editingQuestion);
        } else {
            setFormData(initialFormState);
        }
    }, [editingQuestion]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setFormData(initialFormState); // Reset form after save
    };

    return (
        <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: '16px', border: '1px solid #e7eaf3', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)' }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                    label="Question Text"
                    name="question"
                    value={formData.question}
                    onChange={handleChange}
                    fullWidth
                    required
                    multiline
                    rows={3}
                />
                <FormLabel component="legend">Options</FormLabel>
                {formData.options.map((option, index) => (
                    <TextField
                        key={index}
                        label={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        fullWidth
                        required
                    />
                ))}
                <FormControl component="fieldset" required>
                    <FormLabel component="legend">Correct Answer</FormLabel>
                    <RadioGroup
                        name="answer"
                        value={formData.answer}
                        onChange={handleChange}
                        sx={{ flexDirection: 'row' }}
                    >
                        {formData.options.map((option, index) => (
                            option && (
                                <FormControlLabel
                                    key={index}
                                    value={option}
                                    control={<Radio />}
                                    label={option}
                                />
                            )
                        ))}
                    </RadioGroup>
                </FormControl>
                <TextField
                    label="Topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    fullWidth
                    required
                />
                <FormControl fullWidth required>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                        name="difficulty"
                        value={formData.difficulty}
                        label="Difficulty"
                        onChange={handleChange}
                    >
                        <MenuItem value="Easy">Easy</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="Hard">Hard</MenuItem>
                    </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button type="submit" variant="contained" sx={{ backgroundColor: '#2563eb', '&:hover': { backgroundColor: '#1e40af' } }}>
                        Save Question
                    </Button>
                    <Button type="button" variant="outlined" onClick={onCancel}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default QuestionForm;
