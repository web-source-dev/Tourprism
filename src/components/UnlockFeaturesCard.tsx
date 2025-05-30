'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../ui/toast';


interface CollaboratorResponse {
  collaborators: Array<unknown>;
}

interface UnlockFeaturesCardProps {
  progress?: number; // 0-100
  onClick?: () => void;
  onComplete?: () => void; // New callback for when all features are unlocked
}

interface FeatureStatus {
  accountCreated: boolean;
  personalizedContent: boolean;
  weeklyForecast: boolean;
  teamMembers: boolean;
}

const UnlockFeaturesCard: React.FC<UnlockFeaturesCardProps> = ({
  onClick,
  onComplete
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
  const [isComplete, setIsComplete] = useState<boolean>(false);

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

        // Step 2 (50%): Check if user has completed personal and company details
        // This requires both personal info (firstName, lastName) and company info
        if (user?.firstName && 
            user?.lastName && 
            user?.company?.name && 
            user?.company?.MainOperatingRegions && 
            user.company.MainOperatingRegions.length > 0) {
          newStatus.personalizedContent = true;
        }

        // Step 3 (75%): Check if user has set preferences for weekly disruption forecast reports
        if (user?.preferences?.AlertSummaries?.weekly === true) {
          newStatus.weeklyForecast = true;
        }

        // Step 4 (100%): Check if user has invited team members (collaborators)
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

        // Check if all features are unlocked
        const allComplete = completedCount === 4;
        if (allComplete && onComplete) {
          onComplete();
        }
        
        setIsComplete(allComplete);
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
  }, [user, showToast, onComplete]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/profile');
    }
  };

  // Don't render the card if all features are unlocked
  if (isComplete) {
    return null;
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          bgcolor: 'transparent',
          borderRadius: 2,
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
        bgcolor: 'transparent',
        borderRadius: 2,
        p: 1,
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Progress circle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ position: 'relative', mb: 1 }}>
          <svg width="50" height="50" viewBox="0 0 80 80">
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
            <Typography variant="body2" fontWeight="400" sx={{ fontSize: "12px", color: '#333' }}>
              {progress}%
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" fontWeight="bold" sx={{ fontSize: "16px", mb: 0.5 }}>
          Unlock Your Features
        </Typography>
      </Box>

      {/* Feature list */}
      <Box sx={{ mb: 2, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          {featureStatus.accountCreated ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M0.833984 7.99998C0.833984 11.958 4.04265 15.1666 8.00065 15.1666C11.9587 15.1666 15.1673 11.958 15.1673 7.99998C15.1673 4.04198 11.9587 0.833313 8.00065 0.833313C4.04265 0.833313 0.833984 4.04198 0.833984 7.99998ZM11.118 5.50864C11.3893 5.75731 11.4073 6.1793 11.1587 6.45063L7.49199 10.4506C7.36933 10.5846 7.19665 10.6626 7.01532 10.6666C6.83332 10.6706 6.65798 10.6 6.52931 10.4713L4.86265 8.80467C4.60198 8.54467 4.60198 8.12196 4.86265 7.86196C5.12265 7.60129 5.54532 7.60129 5.80532 7.86196L6.97998 9.03598L10.176 5.54933C10.4246 5.278 10.8467 5.25997 11.118 5.50864Z" fill="#056CF2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00065 1.83331C4.5949 1.83331 1.83398 4.59422 1.83398 7.99998C1.83398 11.4057 4.5949 14.1666 8.00065 14.1666C11.4064 14.1666 14.1673 11.4057 14.1673 7.99998C14.1673 4.59422 11.4064 1.83331 8.00065 1.83331ZM0.833984 7.99998C0.833984 4.04194 4.04261 0.833313 8.00065 0.833313C11.9587 0.833313 15.1673 4.04194 15.1673 7.99998C15.1673 11.958 11.9587 15.1666 8.00065 15.1666C4.04261 15.1666 0.833984 11.958 0.833984 7.99998Z" fill="#757575" />
            </svg>
          )}
          <Typography variant="body2">Account Created</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          {featureStatus.personalizedContent ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M0.833984 7.99998C0.833984 11.958 4.04265 15.1666 8.00065 15.1666C11.9587 15.1666 15.1673 11.958 15.1673 7.99998C15.1673 4.04198 11.9587 0.833313 8.00065 0.833313C4.04265 0.833313 0.833984 4.04198 0.833984 7.99998ZM11.118 5.50864C11.3893 5.75731 11.4073 6.1793 11.1587 6.45063L7.49199 10.4506C7.36933 10.5846 7.19665 10.6626 7.01532 10.6666C6.83332 10.6706 6.65798 10.6 6.52931 10.4713L4.86265 8.80467C4.60198 8.54467 4.60198 8.12196 4.86265 7.86196C5.12265 7.60129 5.54532 7.60129 5.80532 7.86196L6.97998 9.03598L10.176 5.54933C10.4246 5.278 10.8467 5.25997 11.118 5.50864Z" fill="#056CF2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00065 1.83331C4.5949 1.83331 1.83398 4.59422 1.83398 7.99998C1.83398 11.4057 4.5949 14.1666 8.00065 14.1666C11.4064 14.1666 14.1673 11.4057 14.1673 7.99998C14.1673 4.59422 11.4064 1.83331 8.00065 1.83331ZM0.833984 7.99998C0.833984 4.04194 4.04261 0.833313 8.00065 0.833313C11.9587 0.833313 15.1673 4.04194 15.1673 7.99998C15.1673 11.958 11.9587 15.1666 8.00065 15.1666C4.04261 15.1666 0.833984 11.958 0.833984 7.99998Z" fill="#757575" />
            </svg>
          )}
          <Typography variant="body2" sx={{ color: featureStatus.personalizedContent ? 'inherit' : '#888' }}>
            View personalized content
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          {featureStatus.weeklyForecast ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M0.833984 7.99998C0.833984 11.958 4.04265 15.1666 8.00065 15.1666C11.9587 15.1666 15.1673 11.958 15.1673 7.99998C15.1673 4.04198 11.9587 0.833313 8.00065 0.833313C4.04265 0.833313 0.833984 4.04198 0.833984 7.99998ZM11.118 5.50864C11.3893 5.75731 11.4073 6.1793 11.1587 6.45063L7.49199 10.4506C7.36933 10.5846 7.19665 10.6626 7.01532 10.6666C6.83332 10.6706 6.65798 10.6 6.52931 10.4713L4.86265 8.80467C4.60198 8.54467 4.60198 8.12196 4.86265 7.86196C5.12265 7.60129 5.54532 7.60129 5.80532 7.86196L6.97998 9.03598L10.176 5.54933C10.4246 5.278 10.8467 5.25997 11.118 5.50864Z" fill="#056CF2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00065 1.83331C4.5949 1.83331 1.83398 4.59422 1.83398 7.99998C1.83398 11.4057 4.5949 14.1666 8.00065 14.1666C11.4064 14.1666 14.1673 11.4057 14.1673 7.99998C14.1673 4.59422 11.4064 1.83331 8.00065 1.83331ZM0.833984 7.99998C0.833984 4.04194 4.04261 0.833313 8.00065 0.833313C11.9587 0.833313 15.1673 4.04194 15.1673 7.99998C15.1673 11.958 11.9587 15.1666 8.00065 15.1666C4.04261 15.1666 0.833984 11.958 0.833984 7.99998Z" fill="#757575" />
            </svg>
          )}
          <Typography variant="body2" sx={{ color: featureStatus.weeklyForecast ? 'inherit' : '#888' }}>
            Get weekly forecast
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          {featureStatus.teamMembers ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M0.833984 7.99998C0.833984 11.958 4.04265 15.1666 8.00065 15.1666C11.9587 15.1666 15.1673 11.958 15.1673 7.99998C15.1673 4.04198 11.9587 0.833313 8.00065 0.833313C4.04265 0.833313 0.833984 4.04198 0.833984 7.99998ZM11.118 5.50864C11.3893 5.75731 11.4073 6.1793 11.1587 6.45063L7.49199 10.4506C7.36933 10.5846 7.19665 10.6626 7.01532 10.6666C6.83332 10.6706 6.65798 10.6 6.52931 10.4713L4.86265 8.80467C4.60198 8.54467 4.60198 8.12196 4.86265 7.86196C5.12265 7.60129 5.54532 7.60129 5.80532 7.86196L6.97998 9.03598L10.176 5.54933C10.4246 5.278 10.8467 5.25997 11.118 5.50864Z" fill="#056CF2" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00065 1.83331C4.5949 1.83331 1.83398 4.59422 1.83398 7.99998C1.83398 11.4057 4.5949 14.1666 8.00065 14.1666C11.4064 14.1666 14.1673 11.4057 14.1673 7.99998C14.1673 4.59422 11.4064 1.83331 8.00065 1.83331ZM0.833984 7.99998C0.833984 4.04194 4.04261 0.833313 8.00065 0.833313C11.9587 0.833313 15.1673 4.04194 15.1673 7.99998C15.1673 11.958 11.9587 15.1666 8.00065 15.1666C4.04261 15.1666 0.833984 11.958 0.833984 7.99998Z" fill="#757575" />
            </svg>
          )}
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
          borderRadius: 2,
          '&:hover': {
            bgcolor: '#0055DD',
          },
          boxShadow: 'none',
          mt: 'auto',
          position: 'sticky',
          bottom: 0
        }}
      >
        Complete Profile
      </Button>
    </Box>
  );
};

export default UnlockFeaturesCard; 