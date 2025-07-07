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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { User } from '@/types';

interface AddToSubscribersModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (sector: string, location: any[]) => void;
  loading: boolean;
}

const sectorOptions = [
  { value: 'Tourism', label: 'Tourism' },
  { value: 'Hospitality', label: 'Hospitality' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Events', label: 'Events' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Other', label: 'Other' }
];

const AddToSubscribersModal: React.FC<AddToSubscribersModalProps> = ({
  open,
  onClose,
  user,
  onConfirm,
  loading
}) => {
  const [sector, setSector] = useState<string>('Tourism');

  const handleConfirm = () => {
    // Use user's company regions if available, otherwise empty array
    const location = user?.company?.MainOperatingRegions || [];
    onConfirm(sector, location);
  };

  // Reset sector when modal opens with a different user
  React.useEffect(() => {
    if (user) {
      setSector('Tourism');
    }
  }, [user]);

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
        <EmailIcon color="primary" />
        <Typography variant="h6">Add to Weekly Forecast Subscribers</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          This will add the user to the weekly forecast subscriber list. They will receive weekly disruption forecasts via email.
        </Alert>
        
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ mr: 1.5 }}>{getNameInitials()}</Avatar>
            <Box>
              <Typography variant="subtitle1">
                {user.firstName || ''} {user.lastName || ''}
                {!user.firstName && !user.lastName && user.email.split('@')[0]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>
          
          {user.company?.MainOperatingRegions && user.company.MainOperatingRegions.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">Operating Regions:</Typography>
              <Typography variant="body2">
                {user.company.MainOperatingRegions.map(region => region.name).join(', ')}
              </Typography>
            </Box>
          )}
        </Box>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="sector-select-label">Sector</InputLabel>
          <Select
            labelId="sector-select-label"
            id="sector-select"
            value={sector}
            label="Sector"
            onChange={(e) => setSector(e.target.value)}
          >
            {sectorOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Typography variant="body2" color="text.secondary">
          The user will be added to the weekly forecast subscriber list and will receive disruption forecasts based on their company's operating regions.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add to Subscribers'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddToSubscribersModal; 