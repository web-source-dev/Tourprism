'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../ui/toast';

// Define response interfaces
interface SummaryResponse {
  summaries: Array<unknown>;
  success?: boolean;
}

interface CollaboratorResponse {
  collaborators: Array<unknown>;
}

interface UnlockFeaturesCardProps {
  progress?: number; // 0-100
  onClick?: () => void;
}

interface FeatureStatus {
  accountCreated: boolean;
  personalizedContent: boolean;
  weeklyForecast: boolean;
  teamMembers: boolean;
}

const UnlockFeaturesCard: React.FC<UnlockFeaturesCardProps> = ({ 
  onClick 
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus>({
    accountCreated: true, // Always true if component is displayed
    personalizedContent: false,
    weeklyForecast: false,
    teamMembers: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(25); // Start with 25% for account created
  const { showToast } = useToast();

  useEffect(() => {
    const checkFeatureStatus = async () => {
      try {
        setIsLoading(true);
        const newStatus: FeatureStatus = {
          accountCreated: true, // Always true if component is shown
          personalizedContent: false,
          weeklyForecast: false,
          teamMembers: false
        };

        // Check if user has main operating regions set up
        console.log('User company', user?.company);
        if (user?.company?.MainOperatingRegions && 
            user.company.MainOperatingRegions.length > 0) {
          newStatus.personalizedContent = true;
          console.log('Personalized content is true' , newStatus.personalizedContent, user.company.MainOperatingRegions);
        }

        // Check if user has any summaries created
        try {
          const summaryResponse = await api.get<SummaryResponse>('/api/summaries/saved');
          if (summaryResponse.data?.summaries && summaryResponse.data.summaries.length > 0) {
            newStatus.weeklyForecast = true;
          }
        } catch (error) {
          console.error('Error fetching summaries:', error);
        }

        // Check if user has collaborators
        if (user?.collaborators && user.collaborators.length > 0) {
          newStatus.teamMembers = true;
        } else {
          // If collaborators aren't in the user object, fetch them separately
          try {
            const collaboratorsResponse = await api.get<CollaboratorResponse>('/profile/collaborators');
            if (collaboratorsResponse.data?.collaborators && 
                collaboratorsResponse.data.collaborators.length > 0) {
              newStatus.teamMembers = true;
            }
          } catch (error) {
            console.error('Error fetching collaborators:', error);
          }
        }

        // Calculate progress (25% for each completed feature)
        const completedCount = Object.values(newStatus).filter(Boolean).length;
        const calculatedProgress = Math.floor((completedCount / 4) * 100);
        
        setFeatureStatus(newStatus);
        setProgress(calculatedProgress);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking feature status:', error);
        setIsLoading(false);
        showToast('Error loading profile data', 'error');
      }
    };

    if (user) {
      checkFeatureStatus();
    } else {
      setIsLoading(false);
    }
  }, [user, showToast]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/profile');
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          bgcolor: 'white',
          border: '1px solid #EAEAEA',
          borderRadius: 2,
          p: 3,
          mb: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px'
        }}
      >
        <CircularProgress size={40} sx={{ color: '#0066FF' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: 'white',
        border: '1px solid #EAEAEA',
        borderRadius: 2,
        p: 3,
        mb: 2,
      }}
    >
      {/* Progress circle */}
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box sx={{ position: 'relative', mb: 1 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="#F0F0F0"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="#0066FF"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 36 * progress / 100} ${2 * Math.PI * 36}`}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#0066FF' }}>
              {progress}%
            </Typography>
          </Box>
        </Box>

        <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
          Unlock Your Features
        </Typography>
      </Box>

      {/* Feature list */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
            <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM11.7071 6.70711C12.0976 6.31658 12.0976 5.68342 11.7071 5.29289C11.3166 4.90237 10.6834 4.90237 10.2929 5.29289L7 8.58579L5.70711 7.29289C5.31658 6.90237 4.68342 6.90237 4.29289 7.29289C3.90237 7.68342 3.90237 8.31658 4.29289 8.70711L6.29289 10.7071C6.68342 11.0976 7.31658 11.0976 7.70711 10.7071L11.7071 6.70711Z" fill="#0066FF"/>
          </svg>
          <Typography variant="body2">Account Created</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
            <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM11.7071 6.70711C12.0976 6.31658 12.0976 5.68342 11.7071 5.29289C11.3166 4.90237 10.6834 4.90237 10.2929 5.29289L7 8.58579L5.70711 7.29289C5.31658 6.90237 4.68342 6.90237 4.29289 7.29289C3.90237 7.68342 3.90237 8.31658 4.29289 8.70711L6.29289 10.7071C6.68342 11.0976 7.31658 11.0976 7.70711 10.7071L11.7071 6.70711Z" fill={featureStatus.personalizedContent ? "#0066FF" : "#F0F0F0"}/>
          </svg>
          <Typography variant="body2" sx={{ color: featureStatus.personalizedContent ? 'inherit' : '#888' }}>
            View personalized content
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
            <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM11.7071 6.70711C12.0976 6.31658 12.0976 5.68342 11.7071 5.29289C11.3166 4.90237 10.6834 4.90237 10.2929 5.29289L7 8.58579L5.70711 7.29289C5.31658 6.90237 4.68342 6.90237 4.29289 7.29289C3.90237 7.68342 3.90237 8.31658 4.29289 8.70711L6.29289 10.7071C6.68342 11.0976 7.31658 11.0976 7.70711 10.7071L11.7071 6.70711Z" fill={featureStatus.weeklyForecast ? "#0066FF" : "#F0F0F0"}/>
          </svg>
          <Typography variant="body2" sx={{ color: featureStatus.weeklyForecast ? 'inherit' : '#888' }}>
            Get weekly forecast
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
            <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM11.7071 6.70711C12.0976 6.31658 12.0976 5.68342 11.7071 5.29289C11.3166 4.90237 10.6834 4.90237 10.2929 5.29289L7 8.58579L5.70711 7.29289C5.31658 6.90237 4.68342 6.90237 4.29289 7.29289C3.90237 7.68342 3.90237 8.31658 4.29289 8.70711L6.29289 10.7071C6.68342 11.0976 7.31658 11.0976 7.70711 10.7071L11.7071 6.70711Z" fill={featureStatus.teamMembers ? "#0066FF" : "#F0F0F0"}/>
          </svg>
          <Typography variant="body2" sx={{ color: featureStatus.teamMembers ? 'inherit' : '#888' }}>
            Invite team members
          </Typography>
        </Box>
      </Box>

      <Button
        fullWidth
        variant="contained"
        onClick={handleClick}
        sx={{
          bgcolor: '#0066FF',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: 10,
          py: 1,
          '&:hover': {
            bgcolor: '#0055DD',
          },
          boxShadow: 'none',
        }}
      >
        Complete Profile
      </Button>
    </Box>
  );
};

export default UnlockFeaturesCard; 