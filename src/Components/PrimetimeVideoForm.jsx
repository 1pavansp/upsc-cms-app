import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Snackbar,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { collection, addDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { getYoutubeEmbedUrl } from '../utils/videoUtils';

const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  presenter: '',
  videoUrl: '',
  isActive: true
};

const PrimetimeVideoForm = ({ editingVideo, onUpdateSuccess }) => {
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (editingVideo) {
      setFormData({
        title: editingVideo.title || '',
        description: editingVideo.description || '',
        presenter: editingVideo.presenter || '',
        videoUrl: editingVideo.videoUrl || '',
        isActive: editingVideo.isActive ?? true
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [editingVideo]);

  const embedUrl = useMemo(
    () => getYoutubeEmbedUrl(formData.videoUrl),
    [formData.videoUrl]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      setSnackbar({
        open: true,
        message: 'You must be logged in.',
        severity: 'error'
      });
      return;
    }

    if (!formData.title || !formData.videoUrl) {
      setSnackbar({
        open: true,
        message: 'Please provide both a title and a valid YouTube link.',
        severity: 'error'
      });
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      presenter: formData.presenter.trim(),
      videoUrl: formData.videoUrl.trim(),
      isActive: Boolean(formData.isActive),
      updatedAt: serverTimestamp(),
      authorId: user.uid
    };

    if (!editingVideo) {
      payload.createdAt = serverTimestamp();
    }

    setIsSubmitting(true);
    try {
      if (editingVideo) {
        const videoRef = doc(db, 'primetime-videos', editingVideo.id);
        await updateDoc(videoRef, payload);
        setSnackbar({
          open: true,
          message: 'Primetime video updated successfully.',
          severity: 'success'
        });
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        await addDoc(collection(db, 'primetime-videos'), payload);
        setSnackbar({
          open: true,
          message: 'Primetime video added successfully.',
          severity: 'success'
        });
        setFormData(INITIAL_FORM_STATE);
      }
    } catch (error) {
      console.error('Error saving Primetime video:', error);
      setSnackbar({
        open: true,
        message: 'Unable to save Primetime video. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <Paper
      elevation={3}
      sx={{ padding: '2rem', borderRadius: '1rem', overflow: 'hidden' }}
    >
      <Typography
        variant="h5"
        component="h2"
        sx={{ mb: 3, fontWeight: 600 }}
      >
        {editingVideo ? 'Update Primetime Video' : 'Add Primetime Video'}
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'grid', gap: '1.5rem' }}
      >
        <TextField
          label="Video Title"
          value={formData.title}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, title: event.target.value }))
          }
          required
          fullWidth
        />
        <TextField
          label="Presenter (optional)"
          value={formData.presenter}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, presenter: event.target.value }))
          }
          fullWidth
        />
        <TextField
          label="Video Description"
          value={formData.description}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              description: event.target.value
            }))
          }
          fullWidth
          multiline
          minRows={3}
        />
        <TextField
          label="YouTube Link"
          value={formData.videoUrl}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, videoUrl: event.target.value }))
          }
          placeholder="https://www.youtube.com/watch?v=..."
          required
          fullWidth
        />

        {embedUrl ? (
          <Box
            sx={{
              borderRadius: '0.75rem',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}
          >
            <Box
              sx={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0
              }}
            >
              <iframe
                src={embedUrl}
                title="Primetime preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 0
                }}
              />
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Paste a YouTube link above to preview the embedded player.
          </Typography>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={formData.isActive}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: event.target.checked
                }))
              }
            />
          }
          label="Active"
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : editingVideo
              ? 'Save Changes'
              : 'Add Video'}
          </Button>
          {editingVideo && (
            <Button
              variant="outlined"
              size="large"
              onClick={() => onUpdateSuccess && onUpdateSuccess()}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default PrimetimeVideoForm;

