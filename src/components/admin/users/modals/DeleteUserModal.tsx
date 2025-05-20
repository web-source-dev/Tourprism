'use client';

import React, { useState } from 'react';
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
  AlertTitle,
  TextField
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { User } from '@/types';

interface DeleteUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  open,
  onClose,
  user,
  onConfirm,
  loading
}) => {
  const [confirmText, setConfirmText] = useState('');
  
  const handleConfirmTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmText(e.target.value);
  };
  
  // Reset confirm text when modal closes
  React.useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);
  
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

  
  
  const confirmationValid = confirmText === 'DELETE';

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
        <DeleteIcon color="error" />
        <Typography variant="h6">Delete User</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Warning</AlertTitle>
          This action will soft-delete the user&apos;s account. The user&apos;s status will be set to &apos;deleted&apos;
          and they will no longer be able to log in to the system.
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
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This is a soft delete operation. The user&apos;s data will remain in the database, but they will not be able to log in.
          Their status will be changed to &apos;deleted&apos;. You can later contact your database administrator for a permanent deletion if required.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Type DELETE to confirm:
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={handleConfirmTextChange}
            placeholder="DELETE"
            size="small"
            error={confirmText.length > 0 && !confirmationValid}
            helperText={
              confirmText.length > 0 && !confirmationValid
                ? 'Please type DELETE in all caps to confirm'
                : ''
            }
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
          disabled={loading || !confirmationValid}
        >
          {loading ? 'Deleting...' : 'Delete User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserModal; 