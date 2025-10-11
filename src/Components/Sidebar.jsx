
import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Typography,
  Box,
  Divider
} from '@mui/material';
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
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

const defaultDrawerWidth = 260;

const Sidebar = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  onDrawerToggle,
  onNavigate,
  drawerWidth = defaultDrawerWidth
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onDrawerToggle) {
        onDrawerToggle();
      }
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate();
    }
  };

  const menuItems = React.useMemo(
    () => [
      { text: 'Create Content', type: 'header' },
      { text: 'Daily Quiz', icon: <QuizIcon />, tab: 'daily-quiz' },
      { text: 'Current Affairs', icon: <ArticleIcon />, tab: 'daily-current-affairs' },
      { text: 'Primetime Videos', icon: <VideoLibraryIcon />, tab: 'primetime-videos' },
      { text: 'Latest Updates', icon: <UpdateIcon />, tab: 'latest-updates' },
      { type: 'divider' },
      { text: 'Manage Content', type: 'header' },
      { text: 'Current Affairs', icon: <ListAltIcon />, tab: 'manage-current-affairs' },
      { text: 'Quizzes', icon: <ManageSearchIcon />, tab: 'manage-quizzes' },
      { text: 'Question Bank', icon: <QuizIcon />, tab: 'question-bank' },
      { text: 'UPSC Syllabus Tracker', icon: <ListAltIcon />, tab: 'upsc-syllabus-tracker' },
      { text: 'Study Materials', icon: <ArticleIcon />, tab: 'study-materials' },
      { text: 'Primetime Videos', icon: <VideoLibraryIcon />, tab: 'manage-primetime-videos' },
      { text: 'Updates', icon: <EditIcon />, tab: 'manage-updates' }
    ],
    []
  );

  const drawerBody = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        px: 2,
        py: 3
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
        <List disablePadding>
          {menuItems.map((item, index) => {
            if (item.type === 'divider') {
              return <Divider key={`divider-${index}`} sx={{ my: 2 }} />;
            }

            if (item.type === 'header') {
              return (
                <Typography
                  key={`header-${item.text}`}
                  variant="caption"
                  sx={{
                    display: 'block',
                    px: 1,
                    pb: 1.5,
                    pt: index === 0 ? 0 : 1.5,
                    color: '#64748b',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.text}
                </Typography>
              );
            }

            return (
              <ListItemButton
                key={item.tab}
                selected={activeTab === item.tab}
                onClick={() => handleSelectTab(item.tab)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: '#0f172a',
                  px: 1.5,
                  py: 1,
                  transition: 'all 0.25s ease',
                  border: '1px solid transparent',
                  '& .MuiListItemIcon-root': {
                    minWidth: 36,
                    color: activeTab === item.tab ? '#2563eb' : '#94a3b8'
                  },
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(59,130,246,0.18) 100%)',
                    borderColor: 'rgba(37,99,235,0.25)',
                    color: '#1d4ed8',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.12)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(59,130,246,0.22) 100%)'
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    borderColor: 'rgba(37, 99, 235, 0.18)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.82rem',
                    fontWeight: activeTab === item.tab ? 600 : 500,
                    letterSpacing: 0.2
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box
        sx={{
          pt: 2,
          borderTop: '1px solid rgba(148, 163, 184, 0.2)'
        }}
      >
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          fullWidth
          sx={{
            borderRadius: 2,
            py: 1.1,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.85rem',
            borderWidth: 2,
            borderColor: 'rgba(220, 38, 38, 0.25)',
            color: '#b91c1c',
            '&:hover': {
              borderColor: 'rgba(220, 38, 38, 0.45)',
              backgroundColor: 'rgba(248, 113, 113, 0.08)'
            }
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  const commonDrawerStyles = {
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      boxSizing: 'border-box',
      border: 'none',
      borderRight: '1px solid rgba(148, 163, 184, 0.2)',
      background: 'linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(241,245,249,0.94) 100%)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      color: '#0f172a'
    }
  };

  return (
    <>
      <Drawer
        variant="temporary"
        open={Boolean(mobileOpen)}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          ...commonDrawerStyles
        }}
      >
        {drawerBody}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            ...commonDrawerStyles['& .MuiDrawer-paper'],
            position: 'fixed',
            top: 80,
            height: 'calc(100vh - 80px)',
            boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)'
          }
        }}
      >
        {drawerBody}
      </Drawer>
    </>
  );
};

export default Sidebar;
