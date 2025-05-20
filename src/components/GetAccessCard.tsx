'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

interface GetAccessCardProps {
  onClick?: () => void;
}

const GetAccessCard: React.FC<GetAccessCardProps> = ({ onClick }) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/login');
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: '#0066FF',
        color: 'white',
        borderRadius: 2,
        p: 3,
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%'
      }}
    >
      {/* Lightning bolt icon */}
      <Box
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.07208 0.764839C9.54318 0.965637 9.86491 1.44175 9.86491 2.01123L9.86536 6.52318C9.86537 6.59681 9.92506 6.6565 9.99869 6.6565H12.0665C12.6571 6.6565 13.0639 7.05506 13.2314 7.4734C13.3986 7.89129 13.3761 8.42802 13.0422 8.8566L8.37668 14.8452C8.00245 15.3256 7.41401 15.442 6.92814 15.2349C6.45705 15.0341 6.13531 14.558 6.13531 13.9885L6.13487 9.47653C6.13486 9.40289 6.07517 9.3432 6.00153 9.3432H3.93368C3.34314 9.3432 2.93629 8.94464 2.76886 8.5263C2.60162 8.10841 2.62415 7.57168 2.95805 7.1431L7.62354 1.15448C7.99777 0.674121 8.58621 0.55774 9.07208 0.764839Z" fill="white" />
        </svg>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '20px' }}>
          Get Instant Access
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '14px', lineHeight: 1.4, mb: 1 }}>
          View tailored alerts, receive weekly forecast and try our core features.
        </Typography>

        <Button
          variant="contained"
          onClick={handleClick}
          sx={{
            bgcolor: 'white',
            color: '#0066FF',
            fontWeight: 'bold',
            px: 3,
            py: 1,
            borderRadius: 50,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.9)',
            },
            width: 'fit-content',
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 1
          }}
        >
          Create Free Account
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.78145 3.96967C9.07434 3.67678 9.54922 3.67678 9.84211 3.96967L13.5421 7.66967C13.835 7.96256 13.835 8.43744 13.5421 8.73033L9.84211 12.4303C9.54922 12.7232 9.07434 12.7232 8.78145 12.4303C8.48856 12.1374 8.48856 11.6626 8.78145 11.3697L11.3512 8.8L3.33333 8.8C2.91911 8.8 2.58333 8.46421 2.58333 8.05C2.58333 7.63579 2.91911 7.3 3.33333 7.3L11.3512 7.3L8.78145 4.73033C8.48856 4.43744 8.48856 3.96256 8.78145 3.96967Z" fill="#0066FF"/>
          </svg>
        </Button>
      </Box>
    </Box>
  );
};

export default GetAccessCard; 