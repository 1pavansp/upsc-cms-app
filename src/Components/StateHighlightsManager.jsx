import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  setDoc,
  doc
} from 'firebase/firestore';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Box
} from '@mui/material';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const STATE_CONFIGS = [
  {
    id: 'telangana',
    label: 'Telangana',
    defaultHighlight: 'Charminar, Hyderabad',
    defaultPath: '/state/telangana'
  },
  {
    id: 'andhra-pradesh',
    label: 'Andhra Pradesh',
    defaultHighlight: 'Amaravati Stupa',
    defaultPath: '/state/andhra-pradesh'
  }
];

const buildInitialState = () =>
  STATE_CONFIGS.reduce((acc, state) => {
    acc[state.id] = {
      label: state.label,
      highlight: state.defaultHighlight,
      path: state.defaultPath,
      imageUrl: '',
      imageFile: null
    };
    return acc;
  }, {});

const StateHighlightsManager = () => {
  const [stateContent, setStateContent] = useState(buildInitialState());
  const [savingState, setSavingState] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHighlights = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'state-highlights'));
      if (!snapshot.empty) {
        const updates = { ...stateContent };
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          updates[docSnap.id] = {
            label: data.label || stateContent[docSnap.id]?.label || '',
            highlight: data.highlight || '',
            path: data.path || '',
            imageUrl: data.imageUrl || '',
            imageFile: null
          };
        });
        setStateContent(updates);
      }
    } catch (err) {
      console.error('Failed to load state highlights', err);
      setError('Unable to load state highlights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHighlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFieldChange = (stateId, field) => (event) => {
    const value = event.target.value;
    setStateContent((prev) => ({
      ...prev,
      [stateId]: {
        ...prev[stateId],
        [field]: value
      }
    }));
  };

  const handleImageChange = (stateId) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStateContent((prev) => ({
      ...prev,
      [stateId]: {
        ...prev[stateId],
        imageFile: file,
        imageUrl: URL.createObjectURL(file)
      }
    }));
  };

  const handleSave = async (stateId) => {
    const stateData = stateContent[stateId];
    if (!stateData?.label || !stateData?.highlight) {
      setError('Label and highlight are required for each state.');
      return;
    }
    setError('');
    setSavingState((prev) => ({ ...prev, [stateId]: true }));
    try {
      let imageUrl = stateData.imageUrl || '';
      if (stateData.imageFile) {
        const storageRef = ref(
          storage,
          `images/state-highlights/${stateId}-${Date.now()}`
        );
        await uploadBytes(storageRef, stateData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, 'state-highlights', stateId), {
        label: stateData.label,
        highlight: stateData.highlight,
        path: stateData.path || `/state/${stateId}`,
        imageUrl
      });

      setStateContent((prev) => ({
        ...prev,
        [stateId]: {
          ...prev[stateId],
          imageUrl,
          imageFile: null
        }
      }));
    } catch (err) {
      console.error('Failed to save state highlight', err);
      setError('Unable to save the state highlight. Please try again.');
    } finally {
      setSavingState((prev) => ({ ...prev, [stateId]: false }));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
          State Current Affairs Imagery
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload feature images and captions for Telangana and Andhra Pradesh entries that appear
          on the home page state selector.
        </Typography>
      </Paper>

      {error && (
        <Typography color="error" sx={{ mx: 1 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Typography sx={{ px: 1 }}>Loading highlights...</Typography>
      ) : (
        <Grid container spacing={3}>
          {STATE_CONFIGS.map((state) => {
            const stateData = stateContent[state.id];
            return (
              <Grid item xs={12} md={6} key={state.id}>
                <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {state.label}
                    </Typography>
                    <TextField
                      label="Display Label"
                      value={stateData?.label || ''}
                      onChange={handleFieldChange(state.id, 'label')}
                      fullWidth
                    />
                    <TextField
                      label="Highlight Caption"
                      value={stateData?.highlight || ''}
                      onChange={handleFieldChange(state.id, 'highlight')}
                      fullWidth
                    />
                    <TextField
                      label="Link Path"
                      value={stateData?.path || ''}
                      onChange={handleFieldChange(state.id, 'path')}
                      fullWidth
                      helperText="Defaults to the state page if left blank."
                    />
                    <Box>
                      <Button variant="outlined" component="label">
                        {stateData?.imageUrl ? 'Replace Image' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleImageChange(state.id)}
                        />
                      </Button>
                      {stateData?.imageUrl && (
                        <Box sx={{ mt: 2 }}>
                          <img
                            src={stateData.imageUrl}
                            alt={`${state.label} preview`}
                            style={{
                              width: '100%',
                              maxHeight: 200,
                              objectFit: 'cover',
                              borderRadius: '0.9rem'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3 }}>
                    <Button
                      variant="contained"
                      onClick={() => handleSave(state.id)}
                      disabled={Boolean(savingState[state.id])}
                    >
                      {savingState[state.id] ? 'Saving...' : 'Save'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default StateHighlightsManager;
