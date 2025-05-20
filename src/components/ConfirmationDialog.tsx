'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import { Alert as AlertType } from '@/types';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  message: string;
  confirmButtonText: string;
  confirmButtonColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  alert?: Partial<AlertType> | null;
  alertInfoFields?: {
    label: string;
    value: string | number | undefined;
  }[];
}

export default function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  title,
  message,
  confirmButtonText,
  confirmButtonColor = 'primary',
  alert,
  alertInfoFields = []
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
        
        {alert && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2">
              {alert.title || alert.description?.substring(0, 30)}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mt: 1, gap: 1 }}>
              {alert.city && (
                <Typography variant="body2" color="text.secondary">
                  {alert.city}
                </Typography>
              )}
              
              {alert.status && (
                <Chip 
                  label={alert.status.charAt(0).toUpperCase() + alert.status.slice(1)} 
                  size="small" 
                  color={
                    alert.status === 'approved' ? 'success' : 
                    alert.status === 'rejected' ? 'error' : 
                    'default'
                  }
                  variant="outlined"
                />
              )}
            </Box>
            
            {alertInfoFields.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                {alertInfoFields.map((field, index) => (
                  field.value && (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {field.label}:
                      </Typography>
                      <Typography variant="caption" fontWeight="medium">
                        {field.value}
                      </Typography>
                    </Box>
                  )
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color={confirmButtonColor}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Processing...' : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 