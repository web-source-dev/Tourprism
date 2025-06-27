import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

const SubscribeBanner = () => {
  const router = useRouter();
  
  return (
    <Box
      sx={{
        bgcolor: '#1565c0',
        color: 'white',
        borderRadius: 3,
        p: { xs: 3, md: 4 },
        textAlign: 'center',
        maxWidth: { xs: '100%', sm: 500 },
        mx: 'auto',
        my: { xs: 6, md: 8 },
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600, 
          mb: 1, 
          fontSize: { xs: '24px', md: '28px' },
          lineHeight: 1.3,
        }}
      >
        What&apos;s disrupting your business this week?
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 3, 
          fontSize: { xs: '15px', md: '16px' },
          fontWeight: 400,
          
        }}
      >
        Get your free weekly forecast delivered every Monday.
      </Typography>
      <Button
        variant="contained"
        sx={{
          bgcolor: 'white',
          color: '#1565c0',
          fontWeight: 600,
          borderRadius: 2,
          px: 4,
          py: 1.5,
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