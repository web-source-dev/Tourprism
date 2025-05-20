'use client';

import React from 'react';
import { Box, Typography, Button, Paper, useMediaQuery, useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';

interface AlertSubmissionSuccessProps {
  onPostAnother?: () => void;
}

const AlertSubmissionSuccess = ({ onPostAnother }: AlertSubmissionSuccessProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const handlePostAnother = () => {
    if (onPostAnother) {
      onPostAnother();
    } else {
      // Default behavior if no callback provided
      router.push('/post-alert');
    }
  };

  const handleReturnToDashboard = () => {
    router.push('/');
  };

  return (
    <Paper
      elevation={isMobile ? 0 : 3}
      sx={{
        maxWidth: isMobile ? '100%' : '500px',
        width: '100%',
        mx: 'auto',
        p: isMobile ? 4 : 5,
        borderRadius: isMobile ? 0 : 2,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        bgcolor: isMobile ? '#fff' : 'background.paper',
        height: isMobile ? '100vh' : 'auto',
        justifyContent: isMobile ? 'center' : 'flex-start',
        boxSizing: 'border-box'
      }}
    >
      {/* Lightbulb icon from the image */}
      <Box 
        component="img" 
        src="/images/success.png" 
        alt="Success" 
        sx={{ 
          width: 100,
          height: 150,
          mb: 2,
          display: 'none',
          '&[src]': {
            display: 'block',
          }
        }}
      />

      <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
        Thank you for keeping travelers safe!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your alert is under review. You&apos;ll earn tspts once it&apos;s verified.
      </Typography>

      <Box sx={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
        justifyContent: 'center',
        mt: 2
      }}>
        <Button
          variant="outlined"
          fullWidth={isMobile}
          onClick={handlePostAnother}
          sx={{
            borderRadius: 8,
            py: 1.5,
            px: 3,
            borderColor: 'black',
            color: 'black',
            '&:hover': {
              borderColor: '#333',
              bgcolor: 'rgba(0,0,0,0.04)',
            },
            order: isMobile ? 1 : 0
          }}
        >
          Post Another Alert
        </Button>
        
        <Button
          variant="contained"
          fullWidth={isMobile}
          onClick={handleReturnToDashboard}
          sx={{
            borderRadius: 8,
            py: 1.5,
            px: 3,
            bgcolor: 'black',
            color: 'white',
            '&:hover': {
              bgcolor: '#333',
            },
            order: isMobile ? 0 : 1
          }}
        >
          Return to Dashboard
        </Button>
      </Box>
    </Paper>
  );
};

export default AlertSubmissionSuccess; 