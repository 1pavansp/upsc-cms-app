import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Paper,
  Snackbar,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase';

const NEW_SLIDE_TEMPLATE = {
  id: null,
  title: '',
  subtitle: '',
  ctaLabel: '',
  ctaLink: '',
  order: 1,
  isActive: true,
  imageUrl: '',
  imagePath: '',
  imageFile: null,
  previewUrl: ''
};

const releasePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

const HeroSlidesManager = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState(NEW_SLIDE_TEMPLATE);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    slide: null
  });

  const sortedSlides = useMemo(
    () =>
      [...slides].sort(
        (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
      ),
    [slides]
  );

  const fetchSlides = async () => {
    setLoading(true);
    setError('');
    try {
      const slidesQuery = query(collection(db, 'home-hero-slides'));
      const snapshot = await getDocs(slidesQuery);
      const fetchedSlides = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setSlides(fetchedSlides);
    } catch (err) {
      console.error('Failed to load hero slides', err);
      setError('Unable to load hero slides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleOpenCreate = () => {
    setFormState({
      ...NEW_SLIDE_TEMPLATE,
      order: (slides.length || 0) + 1,
      isActive: true
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (slide) => {
    setFormState({
      ...NEW_SLIDE_TEMPLATE,
      ...slide,
      previewUrl: ''
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    releasePreviewUrl(formState.previewUrl);
    setFormOpen(false);
    setFormState(NEW_SLIDE_TEMPLATE);
  };

  const handleFormChange = (field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOrderChange = (event) => {
    const value = parseInt(event.target.value, 10);
    setFormState((prev) => ({
      ...prev,
      order: Number.isNaN(value) ? 0 : value
    }));
  };

  const handleSwitchChange = (event) => {
    setFormState((prev) => ({
      ...prev,
      isActive: event.target.checked
    }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    releasePreviewUrl(formState.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    setFormState((prev) => ({
      ...prev,
      imageFile: file,
      previewUrl
    }));
  };

  const handleSaveSlide = async () => {
    if (!formState.title.trim()) {
      setSnackbar({
        open: true,
        message: 'Title is required.',
        severity: 'error'
      });
      return;
    }

    if (!formState.imageUrl && !formState.previewUrl && !formState.imageFile) {
      setSnackbar({
        open: true,
        message: 'Hero image is required.',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      let imageUrl = formState.imageUrl;
      let imagePath = formState.imagePath;

      if (formState.imageFile) {
        const sanitizedName = formState.imageFile.name.replace(/\s+/g, '-').toLowerCase();
        const storagePath = `images/home-hero-slides/${Date.now()}-${sanitizedName}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, formState.imageFile);
        imageUrl = await getDownloadURL(storageRef);

        if (formState.id && formState.imagePath && formState.imagePath !== storagePath) {
          try {
            await deleteObject(ref(storage, formState.imagePath));
          } catch (storageErr) {
            console.warn('Could not remove previous hero image from storage', storageErr);
          }
        }

        imagePath = storagePath;
      }

      const payload = {
        title: formState.title.trim(),
        subtitle: formState.subtitle ? formState.subtitle.trim() : '',
        ctaLabel: formState.ctaLabel ? formState.ctaLabel.trim() : '',
        ctaLink: formState.ctaLink ? formState.ctaLink.trim() : '',
        order: Number.isFinite(formState.order) ? formState.order : 0,
        isActive: Boolean(formState.isActive),
        imageUrl,
        imagePath,
        updatedAt: serverTimestamp()
      };

      if (formState.id) {
        await updateDoc(doc(db, 'home-hero-slides', formState.id), payload);
        setSnackbar({
          open: true,
          message: 'Hero slide updated successfully.',
          severity: 'success'
        });
      } else {
        await addDoc(collection(db, 'home-hero-slides'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        setSnackbar({
          open: true,
          message: 'Hero slide created successfully.',
          severity: 'success'
        });
      }

      await fetchSlides();
      handleCloseForm();
    } catch (err) {
      console.error('Failed to save hero slide', err);
      setSnackbar({
        open: true,
        message: 'Unable to save hero slide. Please try again.',
        severity: 'error'
      });
    } finally {
      releasePreviewUrl(formState.previewUrl);
      setSaving(false);
    }
  };

  const handleToggleActive = async (slide) => {
    try {
      await updateDoc(doc(db, 'home-hero-slides', slide.id), {
        isActive: !slide.isActive,
        updatedAt: serverTimestamp()
      });
      setSlides((prev) =>
        prev.map((item) =>
          item.id === slide.id ? { ...item, isActive: !slide.isActive } : item
        )
      );
      setSnackbar({
        open: true,
        message: `Slide ${slide.isActive ? 'archived' : 'activated'} successfully.`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to update hero slide status', err);
      setSnackbar({
        open: true,
        message: 'Unable to update hero slide status.',
        severity: 'error'
      });
    }
  };

  const handleDeleteSlide = async () => {
    if (!deleteDialog.slide) return;
    const { slide } = deleteDialog;
    try {
      await deleteDoc(doc(db, 'home-hero-slides', slide.id));
      if (slide.imagePath) {
        try {
          await deleteObject(ref(storage, slide.imagePath));
        } catch (storageErr) {
          console.warn('Could not delete hero slide image from storage', storageErr);
        }
      }
      setSlides((prev) => prev.filter((item) => item.id !== slide.id));
      setSnackbar({
        open: true,
        message: 'Hero slide deleted.',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to delete hero slide', err);
      setSnackbar({
        open: true,
        message: 'Unable to delete hero slide.',
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, slide: null });
    }
  };

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({
      ...prev,
      open: false
    }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Hero Banner Manager
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update the slides that appear in the home page hero carousel.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
        >
          Add Hero Slide
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress />
        </Paper>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : sortedSlides.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Typography>No hero slides found. Create your first slide to get started.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {sortedSlides.map((slide) => (
            <Grid item xs={12} md={6} key={slide.id}>
              <Card sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
                {slide.imageUrl ? (
                  <CardMedia
                    component="img"
                    height="220"
                    image={slide.imageUrl}
                    alt={slide.title || 'Hero slide image'}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 220,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(148, 163, 184, 0.12)'
                    }}
                  >
                    <ImageIcon fontSize="large" color="action" />
                  </Box>
                )}
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {slide.title || 'Untitled hero slide'}
                    </Typography>
                    {slide.subtitle && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {slide.subtitle}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Display order: {Number.isFinite(slide.order) ? slide.order : 'Not set'}
                  </Typography>
                  {slide.ctaLabel && (
                    <Typography variant="body2" color="text.secondary">
                      CTA: {slide.ctaLabel} {slide.ctaLink ? `→ ${slide.ctaLink}` : ''}
                    </Typography>
                  )}
                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={
                      <Switch
                        checked={slide.isActive ?? true}
                        onChange={() => handleToggleActive(slide)}
                      />
                    }
                    label={slide.isActive ? 'Active' : 'Inactive'}
                  />
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3 }}>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEdit(slide)}
                    size="small"
                  >
                    Edit
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    color="error"
                    size="small"
                    onClick={() => setDeleteDialog({ open: true, slide })}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={formOpen} onClose={saving ? undefined : handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{formState.id ? 'Edit Hero Slide' : 'Add Hero Slide'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Title"
              value={formState.title}
              onChange={handleFormChange('title')}
              required
              fullWidth
            />
            <TextField
              label="Subtitle"
              value={formState.subtitle}
              onChange={handleFormChange('subtitle')}
              fullWidth
              multiline
              minRows={2}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="CTA Label"
                value={formState.ctaLabel}
                onChange={handleFormChange('ctaLabel')}
                fullWidth
              />
              <TextField
                label="CTA Link"
                value={formState.ctaLink}
                onChange={handleFormChange('ctaLink')}
                fullWidth
                helperText="Use full URL or relative path."
              />
            </Box>
            <TextField
              label="Display Order"
              type="number"
              value={formState.order}
              onChange={handleOrderChange}
              InputProps={{ inputProps: { min: 0, step: 1 } }}
            />
            <FormControlLabel
              control={<Switch checked={formState.isActive} onChange={handleSwitchChange} />}
              label={formState.isActive ? 'Active' : 'Inactive'}
            />
            <Box>
              <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
                {formState.imageUrl || formState.previewUrl ? 'Replace Image' : 'Upload Image'}
                <input type="file" accept="image/*" hidden onChange={handleFileSelect} />
              </Button>
              {(formState.previewUrl || formState.imageUrl) && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={formState.previewUrl || formState.imageUrl}
                    alt={formState.title || 'Hero slide preview'}
                    style={{
                      width: '100%',
                      maxHeight: 260,
                      objectFit: 'cover',
                      borderRadius: 16
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSaveSlide} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : formState.id ? 'Update Slide' : 'Create Slide'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, slide: null })}
      >
        <DialogTitle>Delete Hero Slide</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "
            {deleteDialog.slide?.title || 'this hero slide'}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, slide: null })}>
            Cancel
          </Button>
          <Button color="error" onClick={handleDeleteSlide}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HeroSlidesManager;
