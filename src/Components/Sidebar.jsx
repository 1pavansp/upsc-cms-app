
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
                    backgroundColor: 'white',
                    color: '#475569',
                    border: 'none',
                    borderRight: '1px solid #e2e8f0',
                    height: 'calc(100% - 80px)',
                    top: '80px',
                    zIndex: 1001
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
                                    py: 2,
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
                                borderRadius: '8px',
                                mb: 0.5,
                                color: '#475569',
                                '&.Mui-selected': {
                                    backgroundColor: '#f1f5f9',
                                    color: '#0f172a',
                                    '&:hover': {
                                        backgroundColor: '#f1f5f9',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: '#2563eb',
                                    }
                                },
                                '&:hover': {
                                    backgroundColor: '#f8fafc',
                                    color: '#0f172a',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ 
                                color: activeTab === item.tab ? '#2563eb' : '#64748b',
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
            <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    fullWidth
                    sx={{
                        borderRadius: '8px',
                        py: 1,
                        color: '#ef4444',
                        borderColor: '#fee2e2',
                        backgroundColor: '#fef2f2',
                        '&:hover': {
                            backgroundColor: '#fee2e2',
                            borderColor: '#fecaca',
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
