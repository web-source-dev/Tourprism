'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Avatar,
  SelectChangeEvent,
  Chip,
  Alert
} from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import { User } from '@/types';

interface ChangeRoleModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (role: string) => void;
  loading: boolean;
}

const roleOptions = [
  { value: 'user', label: 'User', description: 'Regular user with basic access' },
  { value: 'admin', label: 'Admin', description: 'Full administrative privileges' },
  { value: 'manager', label: 'Manager', description: 'Can manage content and some settings' },
  { value: 'editor', label: 'Editor', description: 'Can edit content but not modify settings' },
  { value: 'viewer', label: 'Viewer', description: 'Can only view administrative content' }
];

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  open,
  onClose,
  user,
  onConfirm,
  loading
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'user');

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setSelectedRole(event.target.value);
  };

  const handleConfirm = () => {
    onConfirm(selectedRole);
  };

  // Reset selected role when modal opens with a different user
  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role || 'user');
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: '#e3f2fd', color: '#1565c0' };
      case 'manager':
        return { bg: '#fff8e1', color: '#f57c00' };
      case 'editor':
        return { bg: '#f3e5f5', color: '#7b1fa2' };
      case 'viewer':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const currentRoleInfo = roleOptions.find(role => role.value === (user?.role || 'user'));
  const newRoleInfo = roleOptions.find(role => role.value === selectedRole);

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
        <AdminIcon color="primary" />
        <Typography variant="h6">Change User Role</Typography>
      </DialogTitle>
      
      <DialogContent>
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
          
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">Current role:</Typography>
            <Chip
              label={currentRoleInfo?.label || 'User'}
              size="small"
              sx={{
                mt: 0.5,
                bgcolor: getRoleColor(user.role || 'user').bg,
                color: getRoleColor(user.role || 'user').color,
                fontWeight: 'medium'
              }}
            />
          </Box>
        </Box>
        
        {selectedRole !== (user.role || 'user') && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Changing a user&apos;s role affects their permissions and access within the system.
          </Alert>
        )}
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="role-select-label">New Role</InputLabel>
          <Select
            labelId="role-select-label"
            id="role-select"
            value={selectedRole}
            label="New Role"
            onChange={handleRoleChange}
          >
            {roleOptions.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                <Box>
                  <Typography variant="body1">{role.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {role.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {selectedRole !== (user.role || 'user') && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Changes after updating:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={currentRoleInfo?.label || 'User'}
                size="small"
                sx={{
                  bgcolor: getRoleColor(user.role || 'user').bg,
                  color: getRoleColor(user.role || 'user').color,
                  fontWeight: 'medium'
                }}
              />
              <Typography variant="body2" sx={{ mx: 1 }}>→</Typography>
              <Chip
                label={newRoleInfo?.label || 'User'}
                size="small"
                sx={{
                  bgcolor: getRoleColor(selectedRole).bg,
                  color: getRoleColor(selectedRole).color,
                  fontWeight: 'medium'
                }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="primary"
          disabled={loading || selectedRole === (user.role || 'user')}
        >
          {loading ? 'Updating...' : 'Change Role'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeRoleModal; 