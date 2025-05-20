'use client';

import React from 'react';
import { Box, Typography,Link } from '@mui/material';

const Banner = () => {

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 2,
        borderRadius: '16px',
        maxWidth: { xs: '95%', sm: '100%', md: '95%' },
        margin: {xs:'0 auto 0 auto',md:'0 auto 0 auto'},
        gap: {xs:1,md:2}
      }}
    >
      <Typography variant="body1" sx={{ color: '#000',fontSize:{xs:'10.5px',md:'16px'} }}>
        Complete your profile to get personalized Alerts
      </Typography>
      <Link href="/profile" sx={{ textDecoration: 'underline',color:'#0064FF',fontSize:{xs:'11px',md:'16px'} }}>Update Profile</Link>
    </Box>
  );
};

export default Banner;
