'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Tab, Tabs, Container, CircularProgress, Alert, Button } from '@mui/material';
import { User } from '@/types';
import PersonalInfoTab from '@/components/profile/PersonalInfoTab';
import CompanyInfoTab from '@/components/profile/CompanyInfoTab';
import AccountSettingsTab from '@/components/profile/AccountSettingsTab';
import PreferencesTab from '@/components/profile/PreferencesTab';
import { getUserProfile } from '@/services/api';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import CollaboratorTab from '@/components/profile/CollaboratorTab';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

export default function ProfilePage() {
  const [value, setValue] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isCollaborator, collaboratorRole, user: authUser } = useAuth();
  
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUserProfile();
      console.log('Fetched user profile:', userData);
      
      // Handle the collaborator data structure when a collaborator is logged in
      // When a collaborator logs in, we need to ensure we have all the profile data
      if (isCollaborator && userData && !userData.user.firstName) {
        console.log('Collaborator data received, processing...', userData);
        // The profile data is incomplete for collaborator, let's make adjustments
        // We need to ensure basic fields exist even if they're empty
        const enhancedUserData = {
          ...userData,
          firstName: userData.user.firstName || '',
          lastName: userData.user.lastName || '',
          company: userData.user.company || { name: '', type: '', MainOperatingRegions: [] },
          preferences: userData.user.preferences || {
            Communication: { emailPrefrences: false, whatsappPrefrences: false },
            AlertSummaries: { daily: false, weekly: false, monthly: false }
          },
          createdAt: userData.user.createdAt || new Date().toISOString()
        };
        
        setUser(enhancedUserData as unknown as User);
      } else {
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setError('Failed to load profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [isCollaborator]);
  
  useEffect(() => {
    // If we have authUser and it's a collaborator, we can use some of that data
    if (isCollaborator && authUser) {
      console.log('Collaborator logged in, auth data:', authUser);
    }
    
    fetchUserProfile();
  }, [isAuthenticated, isCollaborator, authUser, fetchUserProfile]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleUserUpdate = (updatedUser: User) => {
    console.log('User updated, setting new user data:', updatedUser);
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
          <Button 
            onClick={fetchUserProfile} 
            sx={{ ml: 2 }}
            variant="outlined"
            size="small"
          >
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="xl">
        <Typography variant="h5" color="error" sx={{ mt: 4, textAlign: 'center' }}>
          Unable to load profile. Please sign in again.
        </Typography>
      </Container>
    );
  }
  
  // For the page title and description
  const accessLabel = isCollaborator 
    ? `Collaborator Access (${collaboratorRole})` 
    : 'Account Owner';
    
  // Display collaborator's viewing context if they're logged in
  const viewingAsCollaborator = isCollaborator ? 
    `Viewing ${user.email || "owner"}'s profile as collaborator` : '';

  return (
    <Layout isFooter={false}>
    <Container maxWidth="xl" sx={{ mt: 0, mb: 4 }}>
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, backgroundColor: 'primary.main', color: 'white' }}>
          <Typography variant="h4" component="h1">
            User Profile
          </Typography>
          <Typography variant="subtitle1">
            Manage your personal information and account settings
            {isCollaborator && (
              <Typography component="span" sx={{ ml: 1, p: 0.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                {accessLabel}
              </Typography>
            )}
          </Typography>
          {viewingAsCollaborator && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.8)' }}>
              {viewingAsCollaborator}
            </Typography>
          )}
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="profile tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Personal Info" {...a11yProps(0)} />
            <Tab label="Company Info" {...a11yProps(1)} />
            {/* Hide Account Settings for collaborators */}
            {!isCollaborator && <Tab label="Account Settings" {...a11yProps(2)} />}
            <Tab label="Preferences" {...a11yProps(3)} />
            {/* Show Collaborator tab only for account owner */}
            {!isCollaborator && <Tab label="Collaborator" {...a11yProps(4)} />}
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <PersonalInfoTab user={user} onUpdate={handleUserUpdate} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <CompanyInfoTab user={user} onUpdate={handleUserUpdate} />
        </TabPanel>
        {!isCollaborator && (
          <TabPanel value={value} index={2}>
            <AccountSettingsTab />
          </TabPanel>
        )}
        <TabPanel value={value} index={isCollaborator ? 2 : 3}>
          <PreferencesTab user={user} onUpdate={handleUserUpdate} />
        </TabPanel>
        {!isCollaborator && (
          <TabPanel value={value} index={4}>
            <CollaboratorTab />
          </TabPanel>
        )}
      </Paper>
    </Container>
    </Layout>
  );
}
