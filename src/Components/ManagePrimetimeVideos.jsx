import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  Typography,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getYoutubeEmbedUrl } from '../utils/videoUtils';

const ManagePrimetimeVideos = ({ setEditingVideo }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    video: null
  });

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const videosQuery = query(
        collection(db, 'primetime-videos'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(videosQuery);
      const fetched = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));
      setVideos(fetched);
    } catch (err) {
      console.error('Failed to fetch Primetime videos:', err);
      setError('Failed to load Primetime videos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleToggleActive = async (video) => {
    try {
      const ref = doc(db, 'primetime-videos', video.id);
      await updateDoc(ref, { isActive: !video.isActive });
      setVideos((prev) =>
        prev.map((item) =>
          item.id === video.id ? { ...item, isActive: !video.isActive } : item
        )
      );
      setSnackbar({
        open: true,
        message: `Video ${video.isActive ? 'archived' : 'activated'} successfully.`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to update video status:', err);
      setSnackbar({
        open: true,
        message: 'Unable to update video status.',
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.video) return;
    try {
      await deleteDoc(doc(db, 'primetime-videos', deleteDialog.video.id));
      setVideos((prev) =>
        prev.filter((video) => video.id !== deleteDialog.video.id)
      );
      setSnackbar({
        open: true,
        message: 'Primetime video deleted.',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to delete Primetime video:', err);
      setSnackbar({
        open: true,
        message: 'Unable to delete Primetime video.',
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, video: null });
    }
  };

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  if (loading) return <Typography>Loading Primetime videos...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper sx={{ p: 2 }}>
      {videos.length === 0 ? (
        <Typography>No Primetime videos added yet.</Typography>
      ) : (
        <Grid container spacing={2}>
          {videos.map((video) => {
            const embedUrl = getYoutubeEmbedUrl(video.videoUrl);
            return (
              <Grid item xs={12} md={6} key={video.id}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {embedUrl ? (
                    <CardMedia
                      component="iframe"
                      src={embedUrl}
                      title={video.title}
                      sx={{ border: 0, height: 220 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : null}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {video.title || 'Untitled Primetime Session'}
                    </Typography>
                    {video.presenter && (
                      <Typography variant="subtitle2" color="text.secondary">
                        Hosted by {video.presenter}
                      </Typography>
                    )}
                    {video.description && (
                      <Typography variant="body2" sx={{ mt: 1.5 }}>
                        {video.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <Checkbox
                        checked={video.isActive ?? true}
                        onChange={() => handleToggleActive(video)}
                      />
                      <Typography variant="body2">
                        {video.isActive ? 'Active' : 'Archived'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <IconButton onClick={() => setEditingVideo(video)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() =>
                        setDeleteDialog({ open: true, video })
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, video: null })}
      >
        <DialogTitle>Delete Primetime Video</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "
            {deleteDialog.video?.title || 'this Primetime video'}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={() => setDeleteDialog({ open: false, video: null })}
          >
            Cancel
          </Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ManagePrimetimeVideos;
