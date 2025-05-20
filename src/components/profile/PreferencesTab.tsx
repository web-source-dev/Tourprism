'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  FormControlLabel,
  Switch,
  Button,
  Stack,
  Card,
  CardContent,
  FormGroup,
  Chip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { User } from '@/types';
import { updatePreferences } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface PreferencesTabProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export default function PreferencesTab({ user, onUpdate }: PreferencesTabProps) {
  // Get auth context for collaborator status
  const { isCollaborator, collaboratorRole } = useAuth();
  const isViewOnly = isCollaborator && collaboratorRole === 'viewer';
  
  // Communication preferences
  const [emailPreferences, setEmailPreferences] = useState(
    user.preferences?.Communication?.emailPrefrences || false
  );
  const [whatsappPreferences, setWhatsappPreferences] = useState(
    user.preferences?.Communication?.whatsappPrefrences || false
  );

  // Alert summary preferences
  const [dailySummary, setDailySummary] = useState(
    user.preferences?.AlertSummaries?.daily || false
  );
  const [weeklySummary, setWeeklySummary] = useState(
    user.preferences?.AlertSummaries?.weekly || false
  );
  const [monthlySummary, setMonthlySummary] = useState(
    user.preferences?.AlertSummaries?.monthly || false
  );

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update form fields when user prop changes
  useEffect(() => {
    setEmailPreferences(user.preferences?.Communication?.emailPrefrences || false);
    setWhatsappPreferences(user.preferences?.Communication?.whatsappPrefrences || false);
    setDailySummary(user.preferences?.AlertSummaries?.daily || false);
    setWeeklySummary(user.preferences?.AlertSummaries?.weekly || false);
    setMonthlySummary(user.preferences?.AlertSummaries?.monthly || false);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Prevent viewers from submitting
    if (isViewOnly) return;

    try {
      setIsSubmitting(true);

      const updateData = {
        communication: {
          emailPrefrences: emailPreferences,
          whatsappPrefrences: whatsappPreferences,
        },
        alertSummaries: {
          daily: dailySummary,
          weekly: weeklySummary,
          monthly: monthlySummary,
        },
      };

      console.log('Submitting preferences update:', updateData);
      const updatedUser = await updatePreferences(updateData);
      onUpdate(updatedUser);
      setSuccess('Preferences updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Preferences
          </Typography>
          
          {isCollaborator && (
            <Chip 
              icon={<InfoIcon />} 
              label={isViewOnly ? "View Only Access" : "Manager Access"} 
              color={isViewOnly ? "default" : "primary"} 
              variant="outlined" 
              size="small"
            />
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />
        
        {isViewOnly && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have view-only access to these preferences. Contact the account owner for edit permissions.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Stack spacing={4} sx={{ mb: 4 }}>
          {/* Communication Preferences */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Communication Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose how you want to receive updates and notifications.
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailPreferences}
                      onChange={(e) => !isViewOnly && setEmailPreferences(e.target.checked)}
                      disabled={isSubmitting || isViewOnly}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={whatsappPreferences}
                      onChange={(e) => !isViewOnly && setWhatsappPreferences(e.target.checked)}
                      disabled={isSubmitting || isViewOnly}
                    />
                  }
                  label="WhatsApp Notifications"
                />
              </FormGroup>
            </CardContent>
          </Card>

          {/* Alert Summary Preferences */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Alert Summary Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which alert summaries you want to receive and how often.
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dailySummary}
                      onChange={(e) => !isViewOnly && setDailySummary(e.target.checked)}
                      disabled={isSubmitting || isViewOnly}
                    />
                  }
                  label="Daily Alert Summary"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={weeklySummary}
                      onChange={(e) => !isViewOnly && setWeeklySummary(e.target.checked)}
                      disabled={isSubmitting || isViewOnly}
                    />
                  }
                  label="Weekly Alert Summary"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={monthlySummary}
                      onChange={(e) => !isViewOnly && setMonthlySummary(e.target.checked)}
                      disabled={isSubmitting || isViewOnly}
                    />
                  }
                  label="Monthly Alert Summary"
                />
              </FormGroup>
            </CardContent>
          </Card>
        </Stack>

        {!isViewOnly && (
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? 'Saving...' : 'Save Preferences'}
          </Button>
        )}
      </Box>
    </Paper>
  );
} 