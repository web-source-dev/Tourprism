'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography, Alert, Button, Paper, Fade } from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { handleGoogleCallback } from '@/services/api';

// Create a client component that uses useSearchParams
function GoogleCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setError('No authentication token received');
          return;
        }

        // Store token in localStorage
        localStorage.setItem('token', token);
        
        try {
          // Use the handleGoogleCallback function from api.ts
          const user = await handleGoogleCallback(token);
          
          // Store user in localStorage first to ensure AuthContext can find it
          localStorage.setItem('user', JSON.stringify(user));
          
          // Set user in auth context
          setUser(user);
          
          // Start animation before redirect
          setProgress(100);
          
          // Add a slight delay for the animation to complete
          setTimeout(() => {
            // Redirect to feed page
            router.push('/feed');
          }, 800);
        } catch (error) {
          console.error('Error processing authentication:', error);
          setError('Failed to process authentication');
        }
      } catch (error) {
        console.error('Error during Google authentication callback:', error);
        setError('Authentication failed');
      }
    };

    processCallback();
    
    // Start progress animation
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 70) {
          return oldProgress;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 70);
      });
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, [searchParams, router, setUser]);

  // Auto-redirect countdown
  useEffect(() => {
    if (error && !countdown && countdown !== 0) {
      setCountdown(15);
    }

    if (countdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      router.push('/login');
    }
  }, [countdown, error, router]);

  if (error) {
    return (
      <Fade in={true} timeout={800}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          bgcolor: '#f9f9f9',
          p: 2
        }}>
          <Paper elevation={3} sx={{ 
            maxWidth: 480, 
            width: '100%',
            p: 4,
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Box sx={{ mb: 3 }}>
              <Box
                component="img"
                src="/tourprism.png"
                alt="Logo"
                sx={{ height: 40, mb: 2 }}
              />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Authentication Error
              </Typography>
            </Box>
            
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {error}
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              Please try signing in again. You will be redirected to the login page in {countdown} seconds.
            </Typography>
            
            <Button 
              variant="contained" 
              component={Link}
              href="/login"
              sx={{
                bgcolor: 'black',
                color: 'white',
                py: 1.5,
                px: 4,
                borderRadius: 10,
                '&:hover': {
                  bgcolor: '#333'
                }
              }}
            >
              Return to Login
            </Button>
          </Paper>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#f9f9f9'
      }}>
        <Box
          component="img"
          src="/tourprism.png"
          alt="Logo"
          sx={{ height: 40, mb: 3 }}
        />
        
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress 
            variant="determinate" 
            value={progress} 
            size={60}
            thickness={4}
            sx={{ color: 'black' }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              color="text.secondary"
              sx={{ fontWeight: 600, fontSize: '0.9rem' }}
            >
              {`${Math.round(progress)}%`}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Completing authentication...
        </Typography>
      </Box>
    </Fade>
  );
}

// Main page component with Suspense boundary
export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#f9f9f9'
      }}>
        <Box
          component="img"
          src="/tourprism.png"
          alt="Logo"
          sx={{ height: 40, mb: 3 }}
        />
        <CircularProgress sx={{ color: 'black' }} />
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 500 }}>
          Loading...
        </Typography>
      </Box>
    }>
      <GoogleCallbackClient />
    </Suspense>
  );
} 