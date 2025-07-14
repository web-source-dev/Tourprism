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
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
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
  activityLogs?: { action: string; timestamp: string; details?: string }[];
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onViewProfile,
  onChangeRole,
  onRestrictUser,
  onDeleteUser,
  onViewActivity,
  onAddToSubscribers,
  activityLogs = []
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getFullName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    } else {
      return user.email.split('@')[0];
    }
  };

  const getLocation = () => {
    if (user.company?.MainOperatingRegions && user.company.MainOperatingRegions.length > 0) {
      return user.company.MainOperatingRegions[0].name;
    }
    return 'Not specified';
  };

  const getBusinessType = () => {
    return user.company?.type || 'Not specified';
  };

  const getBusinessName = () => {
    return user.company?.name || 'Not specified';
  };

  // Add mapping for log actions to user-friendly strings
  const actionFriendlyMap: Record<string, string> = {
    login: 'Logged in',
    logout: 'Logged out',
    signup: 'Signed up',
    password_reset: 'Requested password reset',
    email_verified: 'Verified email',
    alert_created: 'Created alert',
    alert_updated: 'Updated alert',
    alert_deleted: 'Deleted alert',
    alert_followed: 'Followed alert',
    alert_unfollowed: 'Unfollowed alert',
    alert_liked: 'Liked alert',
    alert_shared: 'Shared alert',
    alert_flagged: 'Flagged alert',
    alert_unflagged: 'Unflagged alert',
    action_hub_created: 'Created action hub',
    action_hub_updated: 'Updated action hub',
    action_hub_status_changed: 'Changed action hub status',
    action_hub_note_added: 'Added note to action hub',
    action_hub_guest_added: 'Added guest to action hub',
    action_hub_notification_sent: 'Sent action hub notification',
    subscriber_added: 'Added as subscriber',
    subscriber_updated: 'Updated subscriber',
    subscriber_deleted: 'Deleted subscriber',
    subscriber_preferences_changed: 'Changed subscriber preferences',
    subscriber_unsubscribed: 'Unsubscribed',
    user_role_changed: 'Changed user role',
    user_restricted: 'Restricted user',
    user_deleted: 'Deleted user',
    bulk_alerts_uploaded: 'Uploaded bulk alerts',
    admin_users_viewed: 'Viewed user list',
    collaborator_invited: 'Invited collaborator',
    collaborator_activated: 'Activated collaborator',
    collaborator_restricted: 'Restricted collaborator',
    collaborator_deleted: 'Deleted collaborator',
    profile_updated: 'Updated profile',
    summary_viewed: 'Viewed report',
    summary_generated: 'Generated report',
    profile_viewed: 'Viewed profile',
    notifications_viewed: 'Viewed notifications',
  };

  return (
    <Card
      elevation={1}
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with avatar, name, and menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative' }}>
          <Avatar
            sx={{
              bgcolor: getRoleColor(user.role).bg,
              color: getRoleColor(user.role).color,
              width: 50,
              height: 50,
              mr: 2
            }}
          >
            {getNameInitials()}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {getFullName()}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user.email}
            </Typography>
          </Box>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleClick(e);
            }}
            sx={{
              position: 'absolute',
              right: -20,
              top: -20
            }}
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
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile(user);
                handleClose();
              }}
            >
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              View Profile
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                onViewActivity(user);
                handleClose();
              }}
            >
              <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
              View Activity
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                onChangeRole(user);
                handleClose();
              }}
            >
              <AdminIcon fontSize="small" sx={{ mr: 1 }} />
              Change Role
            </MenuItem>
            {!user.weeklyForecastSubscribed && (
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
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
              onClick={(e) => {
                e.stopPropagation();
                onRestrictUser(user);
                handleClose();
              }}
              sx={{ color: user.status === 'deleted' ? 'success.main' : user.status === 'restricted' ? 'success.main' : 'error.main' }}
            >
              <BlockIcon fontSize="small" sx={{ mr: 1 }} />
              {user.status === 'deleted' ? 'Restore User' : user.status === 'restricted' ? 'Enable User' : 'Restrict User'}
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
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


        {/* User details in a structured layout */}
        <Stack spacing={2}>
          {/* Location and Business Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="text.secondary">Location:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {getLocation()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="text.secondary">Business Type:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {getBusinessType()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="text.secondary">Business Name:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {getBusinessName()}
            </Typography>
          </Box>

          {/* Dates */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="text.secondary">Signup:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatDate(user.createdAt)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="text.secondary">Last Login:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {formatDate(user.lastLogin)}
            </Typography>
          </Box>
        </Stack>
        {/* Status and subscription badges */}
        <Box sx={{ display: 'flex', gap: 1, my: 3, flexWrap: 'wrap' }}>
          <Chip
            label={user.status || 'Active'}
            size="small"
            sx={{
              bgcolor: getStatusColor(user.status).bg,
              color: getStatusColor(user.status).color,
              fontWeight: 'medium',
              textTransform: 'capitalize',
            }}
          />
          <Chip
            label={user.isPremium ? 'Pro' : 'Free'}
            size="small"
            color={user.isPremium ? 'primary' : 'default'}
            variant="outlined"
          />
          {user.weeklyForecastSubscribed && (
            <Chip
              label="Subscriber"
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Recent Activity Section */}
        <Divider sx={{ my: 2 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            Activity Log
          </Typography>
          {activityLogs.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
              No recent activity
            </Typography>
          ) : (
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              {activityLogs.slice(0, 2).map((log, idx) => {
                const date = new Date(log.timestamp);
                const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                const friendlyAction = actionFriendlyMap[log.action] || (log.action.charAt(0).toUpperCase() + log.action.slice(1));
                return (
                  <li key={idx} style={{ fontSize: 14, marginBottom: 2 }}>
                    {formattedDate} – {friendlyAction}
                  </li>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Action buttons */}
        <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Button
            variant="outlined"
            fullWidth
            size="small"
            startIcon={<PersonIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(user);
            }}
          >
            Profile
          </Button>
          <Button
            variant="outlined"
            fullWidth
            size="small"
            startIcon={<HistoryIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onViewActivity(user);
            }}
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