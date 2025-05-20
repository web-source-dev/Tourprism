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
  Chip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { User } from '@/types';
import { updatePersonalInfo } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface PersonalInfoTabProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export default function PersonalInfoTab({ user, onUpdate }: PersonalInfoTabProps) {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [email, setEmail] = useState(user.email || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { isCollaborator, collaboratorRole } = useAuth();
  const isViewOnly = isCollaborator && collaboratorRole === 'viewer';

  // Update form fields when user prop changes
  useEffect(() => {
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setEmail(user.email || '');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Prevent viewers from submitting
    if (isViewOnly) return;
    
    // Validate inputs
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Only include email in update if it changed
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(email !== user.email ? { email: email.trim() } : {})
      };
      
      console.log('Submitting personal info update:', updateData);
      const updatedUser = await updatePersonalInfo(updateData);
      
      onUpdate(updatedUser);
      setSuccess('Personal information updated successfully!');
      
      // Show warning if email was changed
      if (email !== user.email) {
        setSuccess('Personal information updated successfully! Please verify your new email address.');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update personal information');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Personal Information
          </Typography>
          
          {isCollaborator && (
            <Chip 
              icon={<InfoIcon />} 
              label={isViewOnly ? "View Only Access" : "Manager Access"} 
              color={isViewOnly ? "default" : "primary"} 
              variant="outlined" 
              size="small"
            />
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {isViewOnly && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have view-only access to this profile. Contact the account owner for edit permissions.
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
        
        <Stack spacing={3} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSubmitting || isViewOnly}
              required
              InputProps={{
                readOnly: isViewOnly,
              }}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isSubmitting || isViewOnly}
              required
              InputProps={{
                readOnly: isViewOnly,
              }}
            />
          </Box>
          
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={true}
            required
            InputProps={{
              readOnly: true,
            }}
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Member Since: <strong>{new Date(user.createdAt).toLocaleDateString()}</strong>
            </Typography>
          </Box>
        </Stack>
        
        {!isViewOnly && (
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </Box>
    </Paper>
  );
} 