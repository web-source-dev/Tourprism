'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode, useState, useEffect } from 'react';

// Create theme
const theme = createTheme({
  typography: {
    fontFamily: 'var(--font-inter), Arial, sans-serif',
    h1: {
      fontFamily: 'var(--font-poppins), Arial, sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'var(--font-poppins), Arial, sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'var(--font-poppins), Arial, sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'var(--font-poppins), Arial, sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: 'var(--font-poppins), Arial, sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: 'var(--font-poppins), Arial, sans-serif',
      fontWeight: 600,
    },
    button: {
      fontFamily: 'var(--font-inter), Arial, sans-serif',
      fontWeight: 500,
    },
  },
  palette: {
    primary: {
      main: '#000000',
    },
    secondary: {
      main: '#056CF2',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        containedPrimary: {
          backgroundColor: '#000',
          '&:hover': {
            backgroundColor: '#333',
          },
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'none',
      },
    },
  },
});

export function ThemeRegistry({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // To prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
} 