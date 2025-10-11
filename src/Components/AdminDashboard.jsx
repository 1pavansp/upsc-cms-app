import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  CircularProgress,
  Typography,
  Container,
  Paper,
  IconButton,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import Sidebar from './Sidebar';
import QuizForm from './QuizForm';
import CurrentAffairsForm from './CurrentAffairsForm';
import LatestUpdatesForm from './LatestUpdatesForm';
import ManageUpdates from './ManageUpdates';
import ManageQuizzes from './ManageQuizzes';
import ManageCurrentAffairs from './ManageCurrentAffairs';
import PrimetimeVideoForm from './PrimetimeVideoForm';
import ManagePrimetimeVideos from './ManagePrimetimeVideos';

// Constants
const DRAWER_WIDTH = 280; // Sidebar width

const AdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [user, authLoading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('daily-quiz');
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    setEditingVideo(null);
  }, [activeTab]);

  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 80px)',
          mt: '80px',
          backgroundColor: theme.palette.background.default
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 80px)',
          mt: '80px',
          backgroundColor: '#f7f9fc'
        }}
      >
        <Typography>Please log in to access the dashboard.</Typography>
      </Box>
    );
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (!isDesktop) {
      setMobileSidebarOpen(false);
    }
  };

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

  const handlePrimetimeUpdateSuccess = () => {
    setEditingVideo(null);
    setActiveTab('manage-primetime-videos');
  };

  const toggleSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setMobileSidebarOpen(false);
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
    if (editingVideo) {
      return <PrimetimeVideoForm editingVideo={editingVideo} onUpdateSuccess={handlePrimetimeUpdateSuccess} />;
    }

    switch (activeTab) {
      case 'daily-quiz':
        return <QuizForm />;
      case 'daily-current-affairs':
        return <CurrentAffairsForm />;
      case 'latest-updates':
        return <LatestUpdatesForm />;
      case 'primetime-videos':
        return <PrimetimeVideoForm />;
      case 'manage-updates':
        return <ManageUpdates setEditingUpdate={setEditingUpdate} />;
      case 'manage-quizzes':
        return <ManageQuizzes setEditingQuiz={setEditingQuiz} />;
      case 'manage-current-affairs':
        return <ManageCurrentAffairs setEditingArticle={setEditingArticle} />;
      case 'manage-primetime-videos':
        return <ManagePrimetimeVideos setEditingVideo={setEditingVideo} />;
      default:
        return <Typography>Select a category</Typography>;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        pt: { xs: '72px', md: '80px' }
      }}
    >
      <CssBaseline />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        onDrawerToggle={toggleSidebar}
        onNavigate={!isDesktop ? closeSidebar : undefined}
        drawerWidth={DRAWER_WIDTH}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: { md: `${DRAWER_WIDTH}px` },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          px: { xs: 1.25, sm: 3 },
          pb: 4,
          minHeight: { xs: 'calc(100vh - 72px)', md: 'calc(100vh - 80px)' },
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2.5
          }}
        >
          <IconButton
            aria-label="Open navigation"
            onClick={toggleSidebar}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
            }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: theme.palette.text.primary, letterSpacing: 0.4 }}
            >
              Admin Workspace
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Manage UPSC CMS content on the go
            </Typography>
          </Box>
        </Box>

        <Container
          maxWidth="lg"
          disableGutters
          sx={{
            py: { xs: 2.25, sm: 4 },
            px: { xs: 1.5, sm: 3 },
            flex: 1,
            width: '100%',
            mx: 'auto'
          }}
        >
          <Box sx={{ mb: 3.5 }}>
            <Typography
              variant="h5"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 700,
                fontSize: { xs: '1.4rem', md: '1.6rem' },
                letterSpacing: '-0.01em'
              }}
            >
              {activeTab.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mt: 0.75,
                maxWidth: 520,
                lineHeight: 1.6
              }}
            >
              {activeTab === 'daily-quiz'
                ? 'Create and publish daily quiz questions.'
                : activeTab === 'daily-current-affairs'
                ? 'Add new current affairs insights for learners.'
                : activeTab === 'latest-updates'
                ? 'Post announcements and important notifications.'
                : activeTab === 'primetime-videos'
                ? 'Curate Primetime sessions with YouTube embeds.'
                : activeTab === 'manage-current-affairs'
                ? 'Review and update current affairs content.'
                : activeTab === 'manage-quizzes'
                ? 'Oversee quiz performance and edits.'
                : activeTab === 'manage-primetime-videos'
                ? 'Maintain the Primetime video library.'
                : activeTab === 'manage-updates'
                ? 'Manage published updates and alerts.'
                : 'Welcome to your dashboard.'}
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: '20px',
              backgroundColor: theme.palette.background.paper,
              backdropFilter: 'blur(14px)',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
              minHeight: { xs: 'auto', md: '60vh' }
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
