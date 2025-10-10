
import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Button, Typography, Box, Divider } from '@mui/material';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import QuizIcon from '@mui/icons-material/Quiz';
import ArticleIcon from '@mui/icons-material/Article';
import UpdateIcon from '@mui/icons-material/Update';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import PeopleIcon from '@mui/icons-material/People'; // New import

const drawerWidth = 280;

const Sidebar = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const menuItems = React.useMemo(() => [
        { text: 'Create Content', type: 'header' },
        { text: 'Daily Quiz', icon: <QuizIcon />, tab: 'daily-quiz' },
        { text: 'Current Affairs', icon: <ArticleIcon />, tab: 'daily-current-affairs' },
        { text: 'Latest Updates', icon: <UpdateIcon />, tab: 'latest-updates' },
        { type: 'divider' },
        { text: 'Manage Content', type: 'header' },
        { text: 'Current Affairs', icon: <ListAltIcon />, tab: 'manage-current-affairs' },
        { text: 'Quizzes', icon: <ManageSearchIcon />, tab: 'manage-quizzes' },
        { text: 'Question Bank', icon: <QuizIcon />, tab: 'question-bank' },
        { text: 'UPSC Syllabus Tracker', icon: <ListAltIcon />, tab: 'upsc-syllabus-tracker' },
        { text: 'Study Materials', icon: <ArticleIcon />, tab: 'study-materials' }, // New item
        { text: 'Updates', icon: <EditIcon />, tab: 'manage-updates' },
    ], []);

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    color: '#1a202c',
                    border: 'none',
                    borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.3)',
                    height: 'calc(100% - 80px)',
                    top: '80px',
                    zIndex: 1001,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        zIndex: 1
                    }
                },
            }}
        >
            <List sx={{ px: 2, py: 2 }}>
                {menuItems.map((item, index) => {
                    if (item.type === 'divider') {
                        return <Divider key={index} sx={{ my: 2 }} />;
                    }
                    if (item.type === 'header') {
                        return (
                            <Typography
                                key={index}
                                variant="overline"
                                                                sx={{
                                                                    display: 'block',
                                                                    px: 1,
                                                                    py: 4,
                                                                    color: '#64748b',
                                                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.1em'
                                }}
                            >
                                {item.text}
                            </Typography>
                        );
                    }
                    return (
                        <ListItemButton
                            key={index}
                            selected={activeTab === item.tab}
                            onClick={() => setActiveTab(item.tab)}
                            sx={{
                                borderRadius: '12px',
                                mb: 0.5,
                                color: '#1a202c',
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.3s ease',
                                '&.Mui-selected': {
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)',
                                    transform: 'translateY(-2px)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(59, 130, 246, 0.25)',
                                        transform: 'translateY(-3px)',
                                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: '#3b82f6',
                                    }
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: '#3b82f6',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ 
                                color: activeTab === item.tab ? '#3b82f6' : '#64748b',
                                minWidth: 40 
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text}
                                primaryTypographyProps={{
                                    fontSize: '0.875rem',
                                    fontWeight: activeTab === item.tab ? 600 : 500
                                }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    fullWidth
                    sx={{
                        borderRadius: '12px',
                        py: 1.5,
                        color: '#ef4444',
                        border: '2px solid rgba(239, 68, 68, 0.3)',
                        backgroundColor: 'rgba(254, 242, 242, 0.1)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            backgroundColor: 'rgba(254, 226, 226, 0.2)',
                            borderColor: '#ef4444',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
                        }
                    }}
                >
                    Sign Out
                </Button>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
