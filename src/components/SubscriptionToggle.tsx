'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { updateSubscriptionStatus } from '../services/api';
import { useToast } from '../ui/toast';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { usePathname } from 'next/navigation';

interface SubscriptionToggleProps {
  onClick?: () => void;
}

const SubscriptionToggle: React.FC<SubscriptionToggleProps> = ({ onClick }) => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  
  // Use state to track subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState<boolean>(user?.isPremium || false);
  const [loading, setLoading] = useState(false);
  
  // Update the subscription status whenever the user object changes
  useEffect(() => {
    setSubscriptionStatus(user?.isPremium || false);
  }, [user, pathname]);

  const handleToggleSubscription = async () => {
    try {
      setLoading(true);

      const updatedUser = await updateSubscriptionStatus(!subscriptionStatus);

      if (setUser) {
        setUser(updatedUser);
      }
      
      // Update local state
      setSubscriptionStatus(updatedUser.isPremium || false);

      showToast(
        `You have successfully ${!subscriptionStatus ? 'subscribed to' : 'unsubscribed from'
        } pro features.`,
        'success'
      );

      if (onClick) onClick();
    } catch (error: unknown) {
      console.error('Error toggling subscription:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to update subscription status',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        bgcolor: '#FFF8e5',
        border: '1px solid #FFC107',
        borderRadius: 3,
        p: 1,
        mb: 2,
        mx: 'auto',
        width: '100%',
        boxShadow: 0,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          {subscriptionStatus ? (
            <CheckCircleOutlineIcon sx={{ color: '#FFC107', fontSize: 28 }} />
          ) : (
            <NotificationsActiveIcon sx={{ color: '#FFC107', fontSize: 28 }} />
          )}
          <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
           <span style={{fontWeight: 'bold'}}>For Testing :</span> {subscriptionStatus
              ? "You're currently subscribed to pro features."
              : "Subscribe to access pro features."}
          </Typography>
        </Stack>

        <Button
          onClick={handleToggleSubscription}
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: subscriptionStatus ? '#FFC107' : '#FFC107',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.2,
            width: {xs: '100%', sm: 'auto'},
            borderRadius: 2,
            minWidth: 140,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: subscriptionStatus ? '#FFC107' : '#FFC107',
              boxShadow: 'none',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : subscriptionStatus ? (
            'Unsubscribe'
          ) : (
            'Subscribe'
          )}
        </Button>
      </Stack>
    </Paper>
  );
};

export default SubscriptionToggle;
