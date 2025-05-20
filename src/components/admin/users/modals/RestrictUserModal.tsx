'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Alert,
  AlertTitle
} from '@mui/material';
import { Block as BlockIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { User } from '@/types';

interface RestrictUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: () => void;
  loading: boolean;
  action: 'restrict' | 'enable';
}

const RestrictUserModal: React.FC<RestrictUserModalProps> = ({
  open,
  onClose,
  user,
  onConfirm,
  loading,
  action
}) => {
  const getNameInitials = () => {
    if (!user) return '';
    
    let initials = '';
    
    if (user.firstName) {
      initials += user.firstName[0];
    }
    
    if (user.lastName) {
      initials += user.lastName[0];
    }
    
    if (!initials && user.email) {
      initials = user.email[0].toUpperCase();
    }
    
    return initials;
  };

  const isRestrict = action === 'restrict';
  const isDeleted = user?.status === 'deleted';

  if (!user) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isRestrict ? (
          <BlockIcon color="error" />
        ) : (
          <CheckCircleIcon color="success" />
        )}
        <Typography variant="h6">
          {isRestrict ? 'Restrict User Access' : 'Enable User Access'}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity={isRestrict ? "warning" : "info"} sx={{ mb: 3 }}>
          <AlertTitle>{isRestrict ? 'Warning' : 'Note'}</AlertTitle>
          {isRestrict ? (
            'This action will prevent the user from logging in and accessing the system. They will receive an error message upon login attempt.'
          ) : isDeleted ? (
            'This action will restore the deleted user\'s account. They will be able to log in and access the system again with their previous role and permissions.'
          ) : (
            'This action will restore the user\'s access to the system. They will be able to log in normally.'
          )}
        </Alert>
        
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 1.5 }}>{getNameInitials()}</Avatar>
            <Box>
              <Typography variant="subtitle1">
                {user.firstName || ''} {user.lastName || ''}
                {!user.firstName && !user.lastName && user.email.split('@')[0]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Status: <strong>{user.status || 'Active'}</strong>
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {isRestrict ? (
            'After restricting this user, you can enable them again later if needed.'
          ) : isDeleted ? (
            'After enabling this user, their account will be fully restored and marked as active.'
          ) : (
            'After enabling this user, they will have access based on their role permissions.'
          )}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color={isRestrict ? "error" : "success"}
          disabled={loading}
        >
          {loading ? 'Processing...' : (isRestrict ? 'Restrict User' : `Enable User${isDeleted ? ' (Restore Account)' : ''}`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestrictUserModal; 