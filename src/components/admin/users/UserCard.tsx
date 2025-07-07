'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { User } from '@/types';

interface UserCardProps {
  user: User;
  onViewProfile: (user: User) => void;
  onChangeRole: (user: User) => void;
  onRestrictUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onViewActivity: (user: User) => void;
  onAddToSubscribers: (user: User) => void;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onViewProfile, 
  onChangeRole, 
  onRestrictUser, 
  onDeleteUser,
  onViewActivity,
  onAddToSubscribers
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not recorded';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRoleColor = (role: string | undefined) => {
    role = role || 'user';
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

  const getStatusColor = (status: string | undefined) => {
    status = status || 'active';
    switch (status) {
      case 'active':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'restricted':
        return { bg: '#ffebee', color: '#c62828' };
      case 'pending':
        return { bg: '#fff8e1', color: '#f57c00' };
      case 'deleted':
        return { bg: '#eeeeee', color: '#757575' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const getNameInitials = () => {
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

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.08)'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header with avatar, name, and menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: getRoleColor(user.role).bg, 
              color: getRoleColor(user.role).color,
              width: 40,
              height: 40,
              mr: 1.5
            }}
          >
            {getNameInitials()}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {user.firstName || ''} {user.lastName || ''}
              {!user.firstName && !user.lastName && 'No Name'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user.email}
            </Typography>
          </Box>
          
          <IconButton 
            onClick={handleClick}
            aria-controls={open ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'user-actions-button',
            }}
          >
            <MenuItem 
              onClick={() => {
                onViewProfile(user);
                handleClose();
              }}
            >
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              View Profile
            </MenuItem>
            <MenuItem 
              onClick={() => {
                onViewActivity(user);
                handleClose();
              }}
            >
              <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
              View Activity
            </MenuItem>
            <MenuItem 
              onClick={() => {
                onChangeRole(user);
                handleClose();
              }}
            >
              <AdminIcon fontSize="small" sx={{ mr: 1 }} />
              Change Role
            </MenuItem>
            {!user.weeklyForecastSubscribed && (
              <MenuItem 
                onClick={() => {
                  onAddToSubscribers(user);
                  handleClose();
                }}
              >
                <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                Add to Weekly Forecast
              </MenuItem>
            )}
            <Divider />
            <MenuItem 
              onClick={() => {
                onRestrictUser(user);
                handleClose();
              }}
              sx={{ color: user.status === 'deleted' ? 'success.main' : user.status === 'restricted' ? 'success.main' : 'error.main' }}
            >
              <BlockIcon fontSize="small" sx={{ mr: 1 }} />
              {user.status === 'deleted' ? 'Restore User' : user.status === 'restricted' ? 'Enable User' : 'Restrict User'}
            </MenuItem>
            <MenuItem 
              onClick={() => {
                onDeleteUser(user);
                handleClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete User
            </MenuItem>
          </Menu>
        </Box>
        
        {/* Status and role badges */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={user.status || 'Active'}
            size="small"
            sx={{
              bgcolor: getStatusColor(user.status).bg,
              color: getStatusColor(user.status).color,
              fontWeight: 'medium',
              textTransform: 'capitalize'
            }}
          />
          <Chip
            label={user.role || 'User'}
            size="small"
            sx={{
              bgcolor: getRoleColor(user.role).bg,
              color: getRoleColor(user.role).color,
              fontWeight: 'medium',
              textTransform: 'capitalize'
            }}
          />
          {user.isVerified ? (
            <Chip
              label="Verified"
              size="small"
              color="success"
              variant="outlined"
            />
          ) : (
            <Chip
              label="Unverified"
              size="small"
              color="default"
              variant="outlined"
            />
          )}
          {user.isPremium && (
            <Chip
              label="Subscribed"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {user.weeklyForecastSubscribed && (
            <Chip
              label="Weekly Forecast"
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>
        
        {/* User details */}
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Company:</Typography>
            <Typography variant="body2">
              {user.company?.name || 'Not specified'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Joined:</Typography>
            <Typography variant="body2">
              {formatDate(user.createdAt)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Last Login:</Typography>
            <Typography variant="body2">
              {formatDate(user.lastLogin)}
            </Typography>
          </Box>
        </Stack>
        
        {/* Action buttons */}
        <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Button
            variant="outlined"
            fullWidth
            size="small"
            startIcon={<PersonIcon />}
            onClick={() => onViewProfile(user)}
          >
            Profile
          </Button>
          <Button
            variant="outlined"
            fullWidth
            size="small"
            startIcon={<HistoryIcon />}
            onClick={() => onViewActivity(user)}
            color="secondary"
          >
            Activity
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserCard; 