
import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          primary: {
            main: '#1976d2',
          },
          background: {
            default: '#f2f6fb',
            paper: 'rgba(255,255,255,0.95)',
          },
          text: {
            primary: '#1e293b',
            secondary: '#64748b',
          },
        }
      : {
          // palette values for dark mode
          primary: {
            main: '#90caf9',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
          text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
          },
        }),
  },
});

export default getTheme;
