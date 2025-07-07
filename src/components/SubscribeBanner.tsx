import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

const SubscribeBanner = () => {
  const router = useRouter();
  
  return (
    <Box
      sx={{
        bgcolor: '#056CF2',
        color: 'white',
        borderRadius: 3,
        p: { xs: 2, md: 2 },
        textAlign: 'center',
        maxWidth: { xs: '100%', sm: 500 },
        mx: 'auto',
        my: { xs: 6, md: 8 },
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Typography 
        variant="h2" 
        sx={{ 
          fontWeight: 500, 
          mb: 1, 
          fontSize: { xs: '20px', md: '24px' },
        }}
      >
        What&apos;s disrupting your business this week?
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 3, 
          fontSize: { xs: '14px', md: '14px' },
          fontWeight: 400,
          
        }}
      >
        Get your free weekly forecast delivered every Monday.
      </Typography>
      <Button
        variant="contained"
        sx={{
          bgcolor: 'white',
          color: '#056CF2',
          fontWeight: 600,
          borderRadius: 2,
          px: 4,
          py: 1,
          fontSize: '16px',
          textTransform: 'none',
          boxShadow: 1,
          '&:hover': { bgcolor: '#f5f5f5' },
        }}
        onClick={() => router.push('/subscription')}
      >
        Subscribe Now
      </Button>
    </Box>
  );
};

export default SubscribeBanner; 