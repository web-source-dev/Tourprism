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

  const inputStyles = {
    height: '40px',
    borderRadius: 2,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  };

  return (
    <Box component="form" sx={{ px: 0, py: 0, mt:{xs:0, md:-3} }} onSubmit={handleChangePassword} noValidate>

      <Typography variant="h6" sx={{ mb: 0, display: { xs: 'none', md: 'block' } }}>Security</Typography>

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
        <>
          <Stack spacing={1.5} sx={{ mb: 4 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Current Password</Typography>
              <TextField
                fullWidth
                placeholder="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSubmitting}
                required
                InputProps={{
                  sx: inputStyles
                }}
                sx={{ 
                  mb: 0,
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(0, 0, 0, 0.45)',
                    opacity: 1
                  }
                }}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>New Password</Typography>
              <TextField
                fullWidth
                placeholder="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                required
                InputProps={{
                  sx: inputStyles
                }}
                sx={{ 
                  mb: 0,
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(0, 0, 0, 0.45)',
                    opacity: 1
                  }
                }}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Confirm New Password</Typography>
              <TextField
                fullWidth
                placeholder="Confirm New Password"
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
                InputProps={{
                  sx: inputStyles
                }}
                sx={{ 
                  mb: 0,
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(0, 0, 0, 0.45)',
                    opacity: 1
                  }
                }}
              />
            </Box>
          </Stack>
          
          <Button
            variant="contained"
            color="secondary"
            type="submit"
            disabled={isSubmitting}
            fullWidth
            sx={{ height: '40px' }}
          >
            {isSubmitting ? 'Changing Password...' : 'Change Password'}
          </Button>
        </>
      )}
    </Box>
  );
} 