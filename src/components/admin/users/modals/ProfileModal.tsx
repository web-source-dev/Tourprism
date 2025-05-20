'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
  Stack,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { User } from '@/types';
import { getUserById } from '@/services/api';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`,
  };
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, user }) => {
  const [detailedUser, setDetailedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user && open) {
        setLoading(true);
        setError(null);
        try {
          const { user: fetchedUser } = await getUserById(user._id);
          setDetailedUser(fetchedUser);
        } catch (err) {
          console.error('Error fetching user details:', err);
          setError('Failed to load user details');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserDetails();
  }, [user, open]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not recorded';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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



  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          padding: 3,
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 2 
      }}>
        <Typography variant="h6">User Profile</Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : detailedUser ? (
          <Box>
            {/* User Header */}
            <Box sx={{ p: 3, bgcolor: '#f9f9f9' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" fontWeight="bold">
                    {detailedUser.firstName || ''} {detailedUser.lastName || ''}
                    {!detailedUser.firstName && !detailedUser.lastName && detailedUser.email.split('@')[0]}
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    {detailedUser.email}
                  </Typography>
                  
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip
                      label={detailedUser.role || 'User'}
                      size="small"
                      sx={{
                        bgcolor: getRoleColor(detailedUser.role).bg,
                        color: getRoleColor(detailedUser.role).color,
                        fontWeight: 'medium',
                        textTransform: 'capitalize'
                      }}
                    />
                    <Chip
                      label={detailedUser.status || 'Active'}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(detailedUser.status).bg,
                        color: getStatusColor(detailedUser.status).color,
                        fontWeight: 'medium',
                        textTransform: 'capitalize'
                      }}
                    />
                    {detailedUser.isVerified ? (
                      <Chip label="Verified" size="small" color="success" variant="outlined" />
                    ) : (
                      <Chip label="Unverified" size="small" color="default" variant="outlined" />
                    )}
                  </Box>
                </Box>
              </Stack>
            </Box>
            
            {/* Tabs Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label="Account Info" {...a11yProps(0)} />
                <Tab label="Company Details" {...a11yProps(1)} />
                <Tab label="Preferences" {...a11yProps(2)} />
                <Tab label="Activity" {...a11yProps(3)} />
              </Tabs>
            </Box>
            
            {/* Account Info Tab */}
            <TabPanel value={tabValue} index={0}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Account Information</Typography>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Email Address"
                        secondary={detailedUser.email}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="User ID"
                        secondary={detailedUser._id}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Account Status"
                        secondary={detailedUser.status || 'Active'}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Email Verification"
                        secondary={detailedUser.isVerified ? 'Verified' : 'Not Verified'}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Time Information</Typography>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Account Created"
                        secondary={formatDate(detailedUser.createdAt)}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Last Updated"
                        secondary={formatDate(detailedUser.updatedAt)}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Last Login"
                        secondary={formatDate(detailedUser.lastLogin)}
                      />
                    </ListItem>
                  </List>
                </Box>
              </Stack>
            </TabPanel>
            
            {/* Company Details Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Company Information</Typography>
                <List>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Company Name"
                      secondary={detailedUser.company?.name || 'Not specified'}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Company Type"
                      secondary={detailedUser.company?.type || 'Not specified'}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Main Operating Regions"
                      secondary={
                        detailedUser.company?.MainOperatingRegions?.length ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {detailedUser.company.MainOperatingRegions.map((region, index) => (
                              <Chip key={index} label={region.name} size="small" />
                            ))}
                          </Box>
                        ) : 'Not specified'
                      }
                    />
                  </ListItem>
                </List>
              </Box>
            </TabPanel>
            
            {/* Preferences Tab */}
            <TabPanel value={tabValue} index={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Communication Preferences</Typography>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Email Notifications"
                        secondary={detailedUser.preferences?.Communication?.emailPrefrences ? 'Enabled' : 'Disabled'}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="WhatsApp Notifications"
                        secondary={detailedUser.preferences?.Communication?.whatsappPrefrences ? 'Enabled' : 'Disabled'}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Alert Summary Preferences</Typography>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Daily Summary"
                        secondary={detailedUser.preferences?.AlertSummaries?.daily ? 'Enabled' : 'Disabled'}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Weekly Summary"
                        secondary={detailedUser.preferences?.AlertSummaries?.weekly ? 'Enabled' : 'Disabled'}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Monthly Summary"
                        secondary={detailedUser.preferences?.AlertSummaries?.monthly ? 'Enabled' : 'Disabled'}
                      />
                    </ListItem>
                  </List>
                </Box>
              </Stack>
            </TabPanel>
            
            {/* Activity Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Activity tracking will be implemented in a future update.
              </Typography>
            </TabPanel>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal; 