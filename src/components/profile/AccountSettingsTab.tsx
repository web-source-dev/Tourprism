'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function AccountSettingsTab() {
  const { isCollaborator } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isCollaborator) {
      setError('Collaborators cannot change the account password. This action is restricted to the account owner.');
    }
  }, [isCollaborator]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent collaborators from submitting
    if (isCollaborator) {
      setError('Collaborators cannot change the account password.');
      return;
    }
    
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!newPassword) {
      setError('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Making API call to change password
      interface PasswordChangeResponse {
        message: string;
      }
      
      const response = await api.post<PasswordChangeResponse>('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      // Check response
      if (response.data && response.data.message) {
        setSuccess(response.data.message);
      } else {
        setSuccess('Password changed successfully');
      }
      
      // Clear form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change error:', error);
      setError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Account Settings
        </Typography>
        
        {isCollaborator && (
          <Chip 
            icon={<InfoIcon />} 
            label="Access Restricted" 
            color="error" 
            variant="outlined" 
            size="small"
          />
        )}
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {isCollaborator && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Account settings can only be modified by the account owner. Collaborators do not have permission to change the account password.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {/* Password Change Form - Only shown to account owners */}
      {!isCollaborator && (
        <Box component="form" onSubmit={handleChangePassword} noValidate>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Change Password
          </Typography>
          
          <Stack spacing={3} sx={{ mb: 4 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
            
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              required
              helperText="Password must be at least 6 characters"
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              required
              error={newPassword !== confirmPassword && confirmPassword !== ''}
              helperText={
                newPassword !== confirmPassword && confirmPassword !== ''
                  ? 'Passwords do not match'
                  : ''
              }
            />
          </Stack>
          
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? 'Changing Password...' : 'Change Password'}
          </Button>
        </Box>
      )}
    </Paper>
  );
} 