import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, Checkbox, CircularProgress, Alert } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

const UPSCSyllabusTracker = () => {
    const [user] = useAuthState(auth);
    const [syllabus, setSyllabus] = useState([]);
    const [userProgress, setUserProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSyllabusAndProgress = async () => {
            setLoading(true);
            try {
                // Fetch the syllabus structure
                const syllabusQuery = collection(db, 'syllabus');
                const syllabusSnapshot = await getDocs(syllabusQuery);
                const syllabusData = syllabusSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSyllabus(syllabusData);

                // If user is logged in, fetch their progress
                if (user) {
                    const progressDocRef = doc(db, 'userSyllabusProgress', user.uid);
                    const progressDoc = await getDoc(progressDocRef);
                    if (progressDoc.exists()) {
                        setUserProgress(progressDoc.data().completedTopics || []);
                    }
                }
            } catch (err) {
                console.error("Error fetching syllabus data:", err);
                setError('Failed to load syllabus data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchSyllabusAndProgress();
    }, [user]);

    const handleToggleComplete = async (topicId) => {
        if (!user) {
            alert('Please log in to track your progress.');
            return;
        }

        const newProgress = userProgress.includes(topicId)
            ? userProgress.filter(id => id !== topicId)
            : [...userProgress, topicId];

        setUserProgress(newProgress); // Update UI immediately for responsiveness

        try {
            const progressDocRef = doc(db, 'userSyllabusProgress', user.uid);
            await setDoc(progressDocRef, { completedTopics: newProgress }, { merge: true });
        } catch (err) {
            console.error("Error saving progress:", err);
            setError("Couldn't save your progress. Please check your connection.");
            // Optionally, revert the UI change
            setUserProgress(userProgress);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    UPSC Syllabus Tracker
                </Typography>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e7eaf3', overflow: 'hidden' }}>
                {syllabus.map(paper => (
                    <Accordion key={paper.id} defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>{paper.title}</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            <List disablePadding>
                                {paper.topics?.map(topic => (
                                    <ListItem key={topic.id}>
                                        <Checkbox
                                            edge="start"
                                            checked={userProgress.includes(topic.id)}
                                            onChange={() => handleToggleComplete(topic.id)}
                                            disabled={!user}
                                        />
                                        <ListItemText primary={topic.title} sx={{ textDecoration: userProgress.includes(topic.id) ? 'line-through' : 'none' }} />
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Paper>
            {!user && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Please log in to save your syllabus progress.
                </Alert>
            )}
        </Box>
    );
};

export default UPSCSyllabusTracker;