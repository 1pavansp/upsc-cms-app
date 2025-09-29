
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Box, CssBaseline, CircularProgress, Typography, Container, Paper } from '@mui/material';
import Sidebar from './Sidebar';
import QuizForm from './QuizForm';
import CurrentAffairsForm from './CurrentAffairsForm';
import LatestUpdatesForm from './LatestUpdatesForm';
import ManageUpdates from './ManageUpdates';
import ManageQuizzes from './ManageQuizzes';
import ManageCurrentAffairs from './ManageCurrentAffairs';
import QuestionBank from './QuestionBank';
import UPSCSyllabusTracker from './UPSCSyllabusTracker';
import StudyMaterialManager from './StudyMaterialManager'; // New import

// Constants
const DRAWER_WIDTH = 280; // Sidebar width

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, authLoading] = useAuthState(auth);
    const [activeTab, setActiveTab] = useState('daily-quiz');
    const [editingUpdate, setEditingUpdate] = useState(null);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [editingArticle, setEditingArticle] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/admin/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        // When activeTab changes, reset editing states
        setEditingUpdate(null);
        setEditingQuiz(null);
        setEditingArticle(null);
    }, [activeTab]);

    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 80px)', mt: '80px', backgroundColor: '#f7f9fc' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 80px)', mt: '80px', backgroundColor: '#f7f9fc' }}>
                <Typography>Please log in to access the dashboard.</Typography>
            </Box>
        );
    }

    const handleUpdateSuccess = () => {
        setEditingUpdate(null);
        setActiveTab('manage-updates');
    };

    const handleQuizUpdateSuccess = () => {
        setEditingQuiz(null);
        setActiveTab('manage-quizzes');
    };

    const handleArticleUpdateSuccess = () => {
        setEditingArticle(null);
        setActiveTab('manage-current-affairs');
    };

    const renderContent = () => {
        if (editingUpdate) {
            return <LatestUpdatesForm editingUpdate={editingUpdate} onUpdateSuccess={handleUpdateSuccess} />;
        }
        if (editingQuiz) {
            return <QuizForm editingQuiz={editingQuiz} onUpdateSuccess={handleQuizUpdateSuccess} />;
        }
        if (editingArticle) {
            return <CurrentAffairsForm editingArticle={editingArticle} onUpdateSuccess={handleArticleUpdateSuccess} />;
        }

        switch (activeTab) {
            case 'daily-quiz':
                return <QuizForm />;
            case 'daily-current-affairs':
                return <CurrentAffairsForm />;
            case 'latest-updates':
                return <LatestUpdatesForm />;
            case 'manage-updates':
                return <ManageUpdates setEditingUpdate={setEditingUpdate} />;
            case 'manage-quizzes':
                return <ManageQuizzes setEditingQuiz={setEditingQuiz} />;
            case 'question-bank':
                return <QuestionBank />;
            case 'upsc-syllabus-tracker':
                return <UPSCSyllabusTracker />;
            case 'study-materials': // New case
                return <StudyMaterialManager />;
            case 'manage-current-affairs':
                return <ManageCurrentAffairs setEditingArticle={setEditingArticle} />;
            default:
                return <Typography>Select a category</Typography>;
        }
    };

    return (
        <Box sx={{ 
            display: 'flex',
            minHeight: '100vh', // Keep minHeight here to ensure the background covers the whole screen
            backgroundColor: '#f7f9fc',
            backgroundImage: 'linear-gradient(to bottom right, #e0f2f7, #ffffff)', // Subtle gradient
            pt: '80px' // For the fixed Navbar
        }}>
            <CssBaseline />
            
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    ml: { sm: `${DRAWER_WIDTH}px` },
                    width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                    p: { xs: 2, sm: 3 }
                }}
            >
                <Container maxWidth="xl" sx={{ // Changed to "xl" for more width
                    py: { xs: 3, sm: 4 },
                    px: { xs: 2, sm: 4 },
                    flex: 1 // Ensure container takes available space
                }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                color: '#212b36',
                                fontWeight: 700,
                                mb: 0.5
                            }}
                        >
                            {activeTab.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                color: '#637381',
                            }}
                        >
                            {activeTab === 'daily-quiz' ? 'Create and publish daily quiz questions' :
                                activeTab === 'daily-current-affairs' ? 'Add new current affairs articles' :
                                activeTab === 'latest-updates' ? 'Post latest updates and announcements' :
                                activeTab === 'manage-current-affairs' ? 'View and edit current affairs' :
                                activeTab === 'manage-quizzes' ? 'Manage quiz content' :
                                activeTab === 'manage-updates' ? 'Manage update posts' : 'Welcome to your dashboard'}
                        </Typography>
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, sm: 4 },
                            mt: 4, // Added margin-top here
                            borderRadius: '16px',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly less transparent
                            backdropFilter: 'blur(12px)', // Slightly more blur
                            border: '1px solid #e7eaf3',
                            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)', // More pronounced shadow
                            overflow: 'hidden'
                        }}
                    >
                        {renderContent()}
                    </Paper>
                </Container>
            </Box>
        </Box>
    );
};

export default AdminDashboard;
