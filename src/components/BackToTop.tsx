'use client';

import React, { useState, useEffect } from 'react';
import { Fab, Zoom, useTheme } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface BackToTopProps {
  threshold?: number;
}

const BackToTop: React.FC<BackToTopProps> = ({ threshold = 300 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Zoom in={isVisible}>
      <Fab
        onClick={handleClick}
        size="small"
        aria-label="scroll back to top"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          backgroundColor: '#EBEBEC',
          color: '#444',
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            backgroundColor: '#D9D9D9',
          },
          zIndex: theme.zIndex.snackbar,
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
};

export default BackToTop;
