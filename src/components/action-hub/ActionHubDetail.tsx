'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Container,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  getFlaggedAlertById,
  markAlertStatus,
  followAlert,
  addGuests,
  notifyGuests,
  notifyTeam,
  getActionLogs
} from '@/services/action-hub';
import { ActionHubItem, ActionLog } from '@/types';
import {
  ArrowBack,
  Check as CheckIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/ui/toast';

interface ActionHubDetailProps {
  alertId: string;
}

const ActionHubDetail: React.FC<ActionHubDetailProps> = ({ alertId }) => {
  const [alertData, setAlertData] = useState<ActionHubItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string>('');
  const [recipientType, setRecipientType] = useState<string>('guests');
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [sendMethod, setSendMethod] = useState<string>('email');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');

  // New state for tracking notification status
  const [notifiedGuestsCount, setNotifiedGuestsCount] = useState<number>(0);
  const [totalGuestsCount, setTotalGuestsCount] = useState<number>(0);
  const [notifiedTeamCount, setNotifiedTeamCount] = useState<number>(0);
  const [sendingNotification, setSendingNotification] = useState<boolean>(false);
  const [notificationSuccessCount, setNotificationSuccessCount] = useState<number>(0);
  const [notificationFailCount, setNotificationFailCount] = useState<number>(0);

  // Add a new state variable after other state variables
  const [showResolveConfirmation, setShowResolveConfirmation] = useState<boolean>(false);

  // Get auth context to check user roles
  console.log(totalGuestsCount, notifiedGuestsCount, notifiedTeamCount, notificationSuccessCount, notificationFailCount);

  const {
    isAdmin,
    isManager,
    isEditor,
    isCollaboratorManager,
    isAuthenticated,
    isCollaboratorViewer
  } = useAuth();

  // Access the toast API
  const { showToast } = useToast();

  const canSendNotifications = () => {
    return isAdmin || isManager || isEditor || isCollaboratorManager || !isCollaboratorViewer || isAuthenticated;
  };

  const canChangeStatus = () => {
    return isAdmin || isManager || isEditor || isCollaboratorManager || !isCollaboratorViewer || isAuthenticated;
  };

  const canFollowAlerts = () => {
    // Anyone authenticated can follow alerts
    return isAuthenticated && !isCollaboratorViewer;
  };

  const router = useRouter();

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        setLoading(true);
        const data = await getFlaggedAlertById(alertId);
        setAlertData(data);

        // Calculate notification stats
        if (data.guests && data.guests.length > 0) {
          const totalGuests = data.guests.length;
          const notifiedGuests = data.guests.filter(guest => guest.notificationSent).length;
          setTotalGuestsCount(totalGuests);
          setNotifiedGuestsCount(notifiedGuests);
        } else {
          setTotalGuestsCount(0);
          setNotifiedGuestsCount(0);
        }

        if (data.teamMembers && data.teamMembers.length > 0) {
          const teamNotificationLogs = data.actionLogs?.filter(
            log => log.actionType === 'notify_guests' &&
              log.actionDetails?.includes('team members')
          );
          setNotifiedTeamCount(teamNotificationLogs && teamNotificationLogs.length > 0 ? 1 : 0);
        } else {
          setNotifiedTeamCount(0);
        }

        setError(null);

        // Fetch action logs
        await fetchActionLogs(data.actionHubId);
      } catch (err) {
        setError('Failed to load alert details. Please try again later.');
        console.error('Error loading alert details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (alertId) {
      fetchAlert();
    }
  }, [alertId]);
  const fetchActionLogs = async (actionHubId: string) => {
    try {
      setLogsLoading(true);
      const logs = await getActionLogs(actionHubId);
      setActionLogs(logs as ActionLog[]);
    } catch (err) {
      console.error('Error fetching action logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleFollowToggle = async () => {
    if (!alertData) return;

    try {
      const result = await followAlert(alertData._id);

      // Update the alert state
      setAlertData(prev => prev ? {
        ...prev,
        isFollowing: result.following,
        numberOfFollows: result.numberOfFollows
      } : null);

      showToast(
        result.following ? 'Now following this alert' : 'No longer following this alert',
        'success'
      );

      // Refresh action logs to show the follow/unfollow action
      await fetchActionLogs(alertData.actionHubId);
    } catch (err) {
      console.error('Error toggling follow status:', err);
      showToast('Error updating follow status', 'error');
    }
  };

  const handleStatusChange = async (status: 'new' | 'in_progress' | 'handled') => {
    if (!alertData) return;

    if (status === 'handled') {
      setShowResolveConfirmation(true);
      return;
    }

    try {
      await markAlertStatus(alertData.actionHubId, status);

      showToast(`Alert marked as ${status === 'in_progress' ? 'in progress' : status}`, 'success');

      // Refresh the alert
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlertData(updatedAlert);

      // Refresh action logs
      await fetchActionLogs(alertData.actionHubId);
    } catch (err) {
      console.error(`Error changing status to ${status}:`, err);
      showToast('Error updating alert status', 'error');
    }
  };

  const handleAddGuest = async () => {
    if (!alertData || !guestEmail.trim()) return;

    try {
      // Add the guest
      await addGuests(alertData.actionHubId, [{
        email: guestEmail.trim(),
        name: guestName.trim() || undefined
      }]);

      showToast(`Guest ${guestEmail.trim()} added successfully`, 'success');

      // Refresh the alert to get the updated guests
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlertData(updatedAlert);

      // Clear inputs
      setGuestEmail('');
      setGuestName('');

      // Refresh action logs
      await fetchActionLogs(alertData.actionHubId);

      // Update guest counts
      if (updatedAlert.guests && updatedAlert.guests.length > 0) {
        setTotalGuestsCount(updatedAlert.guests.length);
        setNotifiedGuestsCount(updatedAlert.guests.filter(guest => guest.notificationSent).length);
      }
    } catch (err) {
      console.error('Error adding guest:', err);
      showToast('Error adding guest', 'error');
    }
  };

  const handleRecipientChange = (event: SelectChangeEvent) => {
    setRecipientType(event.target.value as string);
    // Reset notification stats when switching recipients
    setNotificationSuccessCount(0);
    setNotificationFailCount(0);
  };

  const handleSendMethodChange = (event: SelectChangeEvent) => {
    setSendMethod(event.target.value as string);
  };

  const openConfirmationDialog = () => {
    if (!alertData) return;

    // Check if there are recipients to send to based on the selected type
    if (recipientType === 'guests' && (!alertData.guests || alertData.guests.length === 0) && !guestEmail.trim()) {
      showToast('No guests to notify. Please add guests first.', 'error');
      return;
    } else if (recipientType === 'team' && (!alertData.teamMembers || alertData.teamMembers.length === 0)) {
      showToast('No team members to notify.', 'error');
      return;
    } else if (recipientType === 'management' && (!alertData.teamMembers || !alertData.teamMembers.some(m => m.role === 'manager'))) {
      showToast('No managers to notify.', 'error');
      return;
    }

    // If this is an SMS or internal message, show a message instead
    if (sendMethod !== 'email') {
      showToast(
        sendMethod === 'sms'
          ? 'SMS functionality will be implemented soon'
          : 'Internal messaging functionality will be implemented soon',
        'error'
      );
      return;
    }

    setShowConfirmation(true);
  };

  const handleSendAlert = async () => {
    if (!alertData) return;

    setShowConfirmation(false);

    try {
      setSendingNotification(true);
      const message = `${alertData.title || 'Alert notification'}: ${instructions || 'Please review this alert'}`;

      if (recipientType === 'guests') {
        // Handle adding new guest if needed
        if (!alertData.guests || alertData.guests.length === 0) {
          if (guestEmail.trim()) {
            await handleAddGuest();
            const updatedAlert = await getFlaggedAlertById(alertId);
            setAlertData(updatedAlert);
          } else {
            setSendingNotification(false);
            showToast('No guests to notify', 'error');
            return; // No guests to notify
          }
        }

        // Get all guests - we'll send to everyone (even already notified ones)
        // since the user is explicitly sending a new notification
        const allGuestIds = alertData.guests?.map(g => g._id) || [];

        if (allGuestIds.length > 0) {
          const result = await notifyGuests(alertData.actionHubId, message, allGuestIds);

          // Set success and failure counts
          if (result.emailResults) {
            const successCount = result.emailResults.filter(r => r.success).length;
            const failCount = result.emailResults.filter(r => !r.success).length;
            setNotificationSuccessCount(successCount);
            setNotificationFailCount(failCount);

            showToast(`Alert sent to ${successCount} guests successfully${failCount > 0 ? `, ${failCount} failed` : ''}`, successCount > 0 ? 'success' : 'error');
          }
        }
      } else if (recipientType === 'team') {
        // Send to all team members
        if (!alertData.teamMembers || alertData.teamMembers.length === 0) {
          setSendingNotification(false);
          showToast('No team members to notify', 'error');
          return; // No team members to notify
        }

        const result = await notifyTeam(alertData.actionHubId, message, false);

        // Set success and failure counts
        if (result.emailResults) {
          const successCount = result.emailResults.filter(r => r.success).length;
          const failCount = result.emailResults.filter(r => !r.success).length;
          setNotificationSuccessCount(successCount);
          setNotificationFailCount(failCount);

          showToast(`Alert sent to ${successCount} team members successfully${failCount > 0 ? `, ${failCount} failed` : ''}`, successCount > 0 ? 'success' : 'error');
        }

        // Set team as notified
        setNotifiedTeamCount(1);
      } else if (recipientType === 'management') {
        // Send only to managers
        if (!alertData.teamMembers || !alertData.teamMembers.some(m => m.role === 'manager')) {
          setSendingNotification(false);
          showToast('No managers to notify', 'error');
          return; // No managers to notify
        }

        const result = await notifyTeam(alertData.actionHubId, message, true);

        // Set success and failure counts
        if (result.emailResults) {
          const successCount = result.emailResults.filter(r => r.success).length;
          const failCount = result.emailResults.filter(r => !r.success).length;
          setNotificationSuccessCount(successCount);
          setNotificationFailCount(failCount);

          showToast(`Alert sent to ${successCount} managers successfully${failCount > 0 ? `, ${failCount} failed` : ''}`, successCount > 0 ? 'success' : 'error');
        }
      }

      // Refresh the alert to get the updated status
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlertData(updatedAlert);

      // Update notification counts
      if (updatedAlert.guests && updatedAlert.guests.length > 0) {
        const notifiedGuests = updatedAlert.guests.filter(guest => guest.notificationSent).length;
        setTotalGuestsCount(updatedAlert.guests.length);
        setNotifiedGuestsCount(notifiedGuests);
      }

      // Refresh action logs
      await fetchActionLogs(alertData.actionHubId);

      // Clear instructions
      setInstructions('');

    } catch (err) {
      console.error('Error sending alert:', err);
      showToast('Error sending alert notification', 'error');
    } finally {
      setSendingNotification(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return '';

    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMs = now.getTime() - alertTime.getTime();

    // Calculate time differences in various units
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Format based on time difference:
    // < 60s: show seconds
    // < 60m: show minutes
    // < 24h: show hours
    // < 30d: show days
    // >= 30d: show date as DD MMM

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 30) {
      return `${diffInDays}d`;
    } else {
      // Format as DD MMM
      return format(alertTime, 'd MMM');
    }
  };

  // Add a new function to handle the confirmed status change
  const handleConfirmedResolve = async () => {
    if (!alertData) return;

    setShowResolveConfirmation(false);

    try {
      await markAlertStatus(alertData.actionHubId, 'handled');

      showToast('Alert marked as resolved', 'success');

      // Refresh the alert
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlertData(updatedAlert);

      // Refresh action logs
      await fetchActionLogs(alertData.actionHubId);
    } catch (err) {
      console.error('Error changing status to handled:', err);
      showToast('Error updating alert status', 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !alertData) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6" color="error" gutterBottom>
          {error || 'Alert not found'}
        </Typography>
        <Button
          variant="contained"
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  // Main view matching the image design
  return (
    <Container maxWidth="xl" sx={{ padding: "0px" }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid #eaeaea'
      }}>
        <IconButton onClick={handleBack} edge="start" aria-label="back">
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" fontWeight="500">Manage Alert</Typography>
      </Box>

      {/* Main content area - two column layout for desktop */}
      <Box sx={{
        display: { xs: 'block', md: 'flex' },
        flexDirection: 'row',
      }}>
        {/* Left column - Alert details */}
        <Box sx={{
          flex: '1 1 60%',
          p: { xs: 1, md: 3 },
          borderBottom: { xs: 'none', md: '1px solid rgb(221, 221, 221)' }
        }}>
          {/* Alert Metadata */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              {alertData.actionHubCreatedAt
                ? `${getTimeAgo(alertData.actionHubCreatedAt)}`
                : alertData.createdAt
                  ? `${getTimeAgo(alertData.createdAt)}`
                  : 'Recently'}
            </Typography>

            <Typography variant="h6" fontWeight="600" sx={{ mt: 1, mb: 1 }}>
              {alertData.title || 'Road Closures in 48h: Fringe Festival Protest'}
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
              {alertData.city || 'Princess Street, EH1'}
            </Typography>

            <Typography variant="body1" sx={{ mb: 3, color: 'text.primary', lineHeight: 1.6 }}>
              {alertData.description || 'High risk for road closures due to festival activities taking place in the centre of the town. Notify guests to take alternative routes and inform them to request early check-ins to avoid delays'}
            </Typography>
          </Box>

          {/* Start */}
          <Typography variant="body1" sx={{ mb: 3 }}>
            Start: {alertData.expectedStart
              ? format(new Date(alertData.expectedStart), 'dd MMM h:mma')
              : '06 May 9:00AM'}
          </Typography>

          {/* End */}
          <Typography variant="body1" sx={{ mb: 3 }}>
            End: {alertData.expectedEnd
              ? format(new Date(alertData.expectedEnd), 'dd MMM h:mma')
              : '06 May 9:00AM'}
          </Typography>

          {/* Impact Level */}
          <Typography variant="body1" fontWeight="bold">Moderated Impact</Typography>

        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: "column", md: "row" } }}>

        {/* Right column - Action panel */}
        <Box sx={{
          flex: '1 1 50%',
          mt: { xs: 2, md: 0 },
          p: { xs: 1, md: 3 },
          pt: { xs: 2, md: 3 },
          bgcolor: 'transparent',
          borderTop: { xs: '1px solid rgb(221, 221, 221)', md: '0px' }
        }}>
          {/* Forward To Section */}
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
            Forward To
          </Typography>

          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
            <Select
              value={recipientType}
              onChange={handleRecipientChange}
              displayEmpty
              sx={{ bgcolor: 'transparent', borderRadius: 2, border: "1px solid #f5f5f5 " }}
              renderValue={(selected) => {
                return <Typography variant="body1">{selected.charAt(0).toUpperCase() + selected.slice(1)}</Typography>;
              }}
            >
              <MenuItem value="guests">
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Typography>Guests</Typography>
                  {recipientType === "guests" && (
                    <Box
                      sx={{
                        backgroundColor: '#4caf50',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                  )}
                </Box>
              </MenuItem>
              <MenuItem value="team">
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Typography>Team</Typography>
                  {recipientType === "team" && (
                    <Box
                      sx={{
                        backgroundColor: '#4caf50',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                  )}
                </Box>
              </MenuItem>
              <MenuItem value="management">
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Typography>Management</Typography>
                  {recipientType === "management" && (
                    <Box
                      sx={{
                        backgroundColor: '#4caf50',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                  )}
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Add Notes */}
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
            Add Notes
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Add note..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            variant="outlined"
            sx={{ mb: 2, bgcolor: 'transparent', borderRadius: 4 }}
            disabled={!canSendNotifications()}
          />

          {/* Send Via */}
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
            Send Via
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2, bgcolor: 'transparent' }}>
            <Select
              value={sendMethod}
              onChange={handleSendMethodChange}
              displayEmpty
              sx={{ borderRadius: 2, bgcolor: 'transparent' }}
              disabled={!canSendNotifications()}
              renderValue={(selected) => {
                return <Typography variant="body1">{selected.charAt(0).toUpperCase() + selected.slice(1)}</Typography>;
              }}
            >
              <MenuItem value="email">
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Typography>Email</Typography>
                  {sendMethod === "email" && (
                    <Box
                      sx={{
                        backgroundColor: '#4caf50',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                  )}
                </Box>
              </MenuItem>
              <MenuItem value="sms">
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Typography>SMS</Typography>
                  {sendMethod === "sms" && (
                    <Box
                      sx={{
                        backgroundColor: '#4caf50',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                  )}
                </Box>
              </MenuItem>
              <MenuItem value="internal">
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Typography>Internal Message</Typography>
                  {sendMethod === "internal" && (
                    <Box
                      sx={{
                        backgroundColor: '#4caf50',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                  )}
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Action Buttons */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={openConfirmationDialog}
              disabled={sendingNotification || !canSendNotifications()}
              sx={{
                mb: 2,
                p: 0,
                bgcolor: 'black',
                '&:hover': { bgcolor: '#333' },
                textTransform: 'none',
                borderRadius: 1,
                fontWeight: 'bold'
              }}
            >
              {sendingNotification ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <Box sx={{ display: { xs: "none", md: "block" } }}>
                    <svg width="133" height="40" viewBox="0 0 133 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="133" height="40" rx="8" fill="black" />
                      <path d="M20.34 25.098C19.6587 25.098 19.0427 24.9813 18.492 24.748C17.9507 24.5147 17.5213 24.1787 17.204 23.74C16.8867 23.3013 16.7233 22.7833 16.714 22.186H18.814C18.842 22.5873 18.982 22.9047 19.234 23.138C19.4953 23.3713 19.85 23.488 20.298 23.488C20.7553 23.488 21.1147 23.3807 21.376 23.166C21.6373 22.942 21.768 22.6527 21.768 22.298C21.768 22.0087 21.6793 21.7707 21.502 21.584C21.3247 21.3973 21.1007 21.2527 20.83 21.15C20.5687 21.038 20.2047 20.9167 19.738 20.786C19.1033 20.5993 18.5853 20.4173 18.184 20.24C17.792 20.0533 17.4513 19.778 17.162 19.414C16.882 19.0407 16.742 18.546 16.742 17.93C16.742 17.3513 16.8867 16.8473 17.176 16.418C17.4653 15.9887 17.8713 15.662 18.394 15.438C18.9167 15.2047 19.514 15.088 20.186 15.088C21.194 15.088 22.0107 15.3353 22.636 15.83C23.2707 16.3153 23.6207 16.9967 23.686 17.874H21.53C21.5113 17.538 21.3667 17.2627 21.096 17.048C20.8347 16.824 20.4847 16.712 20.046 16.712C19.6633 16.712 19.3553 16.81 19.122 17.006C18.898 17.202 18.786 17.4867 18.786 17.86C18.786 18.1213 18.87 18.3407 19.038 18.518C19.2153 18.686 19.43 18.826 19.682 18.938C19.9433 19.0407 20.3073 19.162 20.774 19.302C21.4087 19.4887 21.9267 19.6753 22.328 19.862C22.7293 20.0487 23.0747 20.3287 23.364 20.702C23.6533 21.0753 23.798 21.5653 23.798 22.172C23.798 22.6947 23.6627 23.18 23.392 23.628C23.1213 24.076 22.7247 24.4353 22.202 24.706C21.6793 24.9673 21.0587 25.098 20.34 25.098ZM32.4573 20.954C32.4573 21.234 32.4386 21.486 32.4013 21.71H26.7313C26.7779 22.27 26.9739 22.7087 27.3193 23.026C27.6646 23.3433 28.0893 23.502 28.5933 23.502C29.3213 23.502 29.8393 23.1893 30.1473 22.564H32.2613C32.0373 23.3107 31.6079 23.9267 30.9733 24.412C30.3386 24.888 29.5593 25.126 28.6353 25.126C27.8886 25.126 27.2166 24.9627 26.6193 24.636C26.0313 24.3 25.5693 23.8287 25.2333 23.222C24.9066 22.6153 24.7432 21.9153 24.7432 21.122C24.7432 20.3193 24.9066 19.6147 25.2333 19.008C25.5599 18.4013 26.0173 17.9347 26.6053 17.608C27.1933 17.2813 27.8699 17.118 28.6353 17.118C29.3726 17.118 30.0306 17.2767 30.6093 17.594C31.1973 17.9113 31.6499 18.364 31.9673 18.952C32.2939 19.5307 32.4573 20.198 32.4573 20.954ZM30.4273 20.394C30.4179 19.89 30.2359 19.4887 29.8813 19.19C29.5266 18.882 29.0926 18.728 28.5793 18.728C28.0939 18.728 27.6833 18.8773 27.3473 19.176C27.0206 19.4653 26.8199 19.8713 26.7453 20.394H30.4273ZM37.9359 17.132C38.8599 17.132 39.6065 17.426 40.1759 18.014C40.7452 18.5927 41.0299 19.4047 41.0299 20.45V25H39.0699V20.716C39.0699 20.1 38.9159 19.6287 38.6079 19.302C38.2999 18.966 37.8799 18.798 37.3479 18.798C36.8065 18.798 36.3772 18.966 36.0599 19.302C35.7519 19.6287 35.5979 20.1 35.5979 20.716V25H33.6379V17.244H35.5979V18.21C35.8592 17.874 36.1905 17.6127 36.5919 17.426C37.0025 17.23 37.4505 17.132 37.9359 17.132ZM42.1397 21.094C42.1397 20.31 42.2937 19.6147 42.6017 19.008C42.9191 18.4013 43.3484 17.9347 43.8897 17.608C44.4311 17.2813 45.0331 17.118 45.6957 17.118C46.1997 17.118 46.6804 17.23 47.1377 17.454C47.5951 17.6687 47.9591 17.958 48.2297 18.322V14.64H50.2177V25H48.2297V23.852C47.9871 24.2347 47.6464 24.5427 47.2077 24.776C46.7691 25.0093 46.2604 25.126 45.6817 25.126C45.0284 25.126 44.4311 24.958 43.8897 24.622C43.3484 24.286 42.9191 23.8147 42.6017 23.208C42.2937 22.592 42.1397 21.8873 42.1397 21.094ZM48.2437 21.122C48.2437 20.646 48.1504 20.24 47.9637 19.904C47.7771 19.5587 47.5251 19.2973 47.2077 19.12C46.8904 18.9333 46.5497 18.84 46.1857 18.84C45.8217 18.84 45.4857 18.9287 45.1777 19.106C44.8697 19.2833 44.6177 19.5447 44.4217 19.89C44.2351 20.226 44.1417 20.6273 44.1417 21.094C44.1417 21.5607 44.2351 21.9713 44.4217 22.326C44.6177 22.6713 44.8697 22.9373 45.1777 23.124C45.4951 23.3107 45.8311 23.404 46.1857 23.404C46.5497 23.404 46.8904 23.3153 47.2077 23.138C47.5251 22.9513 47.7771 22.69 47.9637 22.354C48.1504 22.0087 48.2437 21.598 48.2437 21.122ZM60.96 23.138H57.068L56.424 25H54.366L57.88 15.214H60.162L63.676 25H61.604L60.96 23.138ZM60.428 21.57L59.014 17.482L57.6 21.57H60.428ZM66.6994 14.64V25H64.7394V14.64H66.6994ZM75.5959 20.954C75.5959 21.234 75.5773 21.486 75.5399 21.71H69.8699C69.9166 22.27 70.1126 22.7087 70.4579 23.026C70.8033 23.3433 71.2279 23.502 71.7319 23.502C72.4599 23.502 72.9779 23.1893 73.2859 22.564H75.3999C75.1759 23.3107 74.7466 23.9267 74.1119 24.412C73.4773 24.888 72.6979 25.126 71.7739 25.126C71.0273 25.126 70.3553 24.9627 69.7579 24.636C69.1699 24.3 68.7079 23.8287 68.3719 23.222C68.0453 22.6153 67.8819 21.9153 67.8819 21.122C67.8819 20.3193 68.0453 19.6147 68.3719 19.008C68.6986 18.4013 69.1559 17.9347 69.7439 17.608C70.3319 17.2813 71.0086 17.118 71.7739 17.118C72.5113 17.118 73.1693 17.2767 73.7479 17.594C74.3359 17.9113 74.7886 18.364 75.1059 18.952C75.4326 19.5307 75.5959 20.198 75.5959 20.954ZM73.5659 20.394C73.5566 19.89 73.3746 19.4887 73.0199 19.19C72.6653 18.882 72.2313 18.728 71.7179 18.728C71.2326 18.728 70.8219 18.8773 70.4859 19.176C70.1593 19.4653 69.9586 19.8713 69.8839 20.394H73.5659ZM78.7365 18.448C78.9885 18.0373 79.3152 17.7153 79.7165 17.482C80.1272 17.2487 80.5939 17.132 81.1165 17.132V19.19H80.5985C79.9825 19.19 79.5159 19.3347 79.1985 19.624C78.8905 19.9133 78.7365 20.4173 78.7365 21.136V25H76.7765V17.244H78.7365V18.448ZM84.4687 18.854V22.606C84.4687 22.8673 84.5294 23.0587 84.6507 23.18C84.7814 23.292 84.996 23.348 85.2947 23.348H86.2047V25H84.9727C83.3207 25 82.4947 24.1973 82.4947 22.592V18.854H81.5707V17.244H82.4947V15.326H84.4687V17.244H86.2047V18.854H84.4687Z" fill="white" />
                      <path d="M114.292 19.9996C114.292 19.6883 114.154 19.3995 114.023 19.1826C113.882 18.9486 113.692 18.707 113.484 18.4714C113.067 17.9989 112.522 17.4914 111.993 17.0323C111.462 16.5706 110.932 16.1454 110.536 15.8364C110.338 15.6817 110.172 15.5555 110.056 15.4677C109.998 15.4238 109.952 15.3895 109.921 15.366L109.884 15.339L109.875 15.3319L109.871 15.3294C109.593 15.1247 109.202 15.1838 108.997 15.4617C108.792 15.7396 108.852 16.1309 109.129 16.3356L109.14 16.3434L109.173 16.3682C109.203 16.3902 109.247 16.4229 109.303 16.4651C109.414 16.5495 109.574 16.6716 109.767 16.8218C110.152 17.1226 110.664 17.5333 111.174 17.9761C111.687 18.4216 112.184 18.8873 112.547 19.299C112.57 19.3251 112.593 19.3507 112.614 19.3758L100.333 19.3758C99.9883 19.3758 99.7085 19.6556 99.7085 20.0008C99.7085 20.346 99.9883 20.6258 100.333 20.6258L112.612 20.6258C112.591 20.6502 112.57 20.6749 112.547 20.7001C112.184 21.1118 111.687 21.5775 111.174 22.023C110.664 22.4658 110.152 22.8766 109.767 23.1774C109.574 23.3275 109.414 23.4497 109.303 23.5341C109.247 23.5762 109.203 23.6089 109.173 23.6309L109.14 23.6557L109.129 23.6636C108.852 23.8683 108.792 24.2595 108.997 24.5374C109.202 24.8154 109.593 24.8744 109.871 24.6697L109.875 24.6673L109.884 24.6601L109.921 24.6331C109.952 24.6096 109.998 24.5753 110.056 24.5314C110.172 24.4437 110.338 24.3175 110.536 24.1627C110.932 23.8538 111.462 23.4286 111.993 22.9668C112.522 22.5078 113.067 22.0003 113.484 21.5277C113.692 21.2922 113.882 21.0506 114.023 20.8165C114.153 20.601 114.29 20.3143 114.292 20.0052" fill="white" />
                    </svg>
                  </Box>
                  <Box sx={{ display: { xs: "block", md: "none" } }}>
                    <svg width="343" height="40" viewBox="0 0 343 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="343" height="40" rx="8" fill="black" />
                      <path d="M125.34 25.098C124.659 25.098 124.043 24.9813 123.492 24.748C122.951 24.5147 122.521 24.1787 122.204 23.74C121.887 23.3013 121.723 22.7833 121.714 22.186H123.814C123.842 22.5873 123.982 22.9047 124.234 23.138C124.495 23.3713 124.85 23.488 125.298 23.488C125.755 23.488 126.115 23.3807 126.376 23.166C126.637 22.942 126.768 22.6527 126.768 22.298C126.768 22.0087 126.679 21.7707 126.502 21.584C126.325 21.3973 126.101 21.2527 125.83 21.15C125.569 21.038 125.205 20.9167 124.738 20.786C124.103 20.5993 123.585 20.4173 123.184 20.24C122.792 20.0533 122.451 19.778 122.162 19.414C121.882 19.0407 121.742 18.546 121.742 17.93C121.742 17.3513 121.887 16.8473 122.176 16.418C122.465 15.9887 122.871 15.662 123.394 15.438C123.917 15.2047 124.514 15.088 125.186 15.088C126.194 15.088 127.011 15.3353 127.636 15.83C128.271 16.3153 128.621 16.9967 128.686 17.874H126.53C126.511 17.538 126.367 17.2627 126.096 17.048C125.835 16.824 125.485 16.712 125.046 16.712C124.663 16.712 124.355 16.81 124.122 17.006C123.898 17.202 123.786 17.4867 123.786 17.86C123.786 18.1213 123.87 18.3407 124.038 18.518C124.215 18.686 124.43 18.826 124.682 18.938C124.943 19.0407 125.307 19.162 125.774 19.302C126.409 19.4887 126.927 19.6753 127.328 19.862C127.729 20.0487 128.075 20.3287 128.364 20.702C128.653 21.0753 128.798 21.5653 128.798 22.172C128.798 22.6947 128.663 23.18 128.392 23.628C128.121 24.076 127.725 24.4353 127.202 24.706C126.679 24.9673 126.059 25.098 125.34 25.098ZM137.457 20.954C137.457 21.234 137.439 21.486 137.401 21.71H131.731C131.778 22.27 131.974 22.7087 132.319 23.026C132.665 23.3433 133.089 23.502 133.593 23.502C134.321 23.502 134.839 23.1893 135.147 22.564H137.261C137.037 23.3107 136.608 23.9267 135.973 24.412C135.339 24.888 134.559 25.126 133.635 25.126C132.889 25.126 132.217 24.9627 131.619 24.636C131.031 24.3 130.569 23.8287 130.233 23.222C129.907 22.6153 129.743 21.9153 129.743 21.122C129.743 20.3193 129.907 19.6147 130.233 19.008C130.56 18.4013 131.017 17.9347 131.605 17.608C132.193 17.2813 132.87 17.118 133.635 17.118C134.373 17.118 135.031 17.2767 135.609 17.594C136.197 17.9113 136.65 18.364 136.967 18.952C137.294 19.5307 137.457 20.198 137.457 20.954ZM135.427 20.394C135.418 19.89 135.236 19.4887 134.881 19.19C134.527 18.882 134.093 18.728 133.579 18.728C133.094 18.728 132.683 18.8773 132.347 19.176C132.021 19.4653 131.82 19.8713 131.745 20.394H135.427ZM142.936 17.132C143.86 17.132 144.607 17.426 145.176 18.014C145.745 18.5927 146.03 19.4047 146.03 20.45V25H144.07V20.716C144.07 20.1 143.916 19.6287 143.608 19.302C143.3 18.966 142.88 18.798 142.348 18.798C141.807 18.798 141.377 18.966 141.06 19.302C140.752 19.6287 140.598 20.1 140.598 20.716V25H138.638V17.244H140.598V18.21C140.859 17.874 141.191 17.6127 141.592 17.426C142.003 17.23 142.451 17.132 142.936 17.132ZM147.14 21.094C147.14 20.31 147.294 19.6147 147.602 19.008C147.919 18.4013 148.348 17.9347 148.89 17.608C149.431 17.2813 150.033 17.118 150.696 17.118C151.2 17.118 151.68 17.23 152.138 17.454C152.595 17.6687 152.959 17.958 153.23 18.322V14.64H155.218V25H153.23V23.852C152.987 24.2347 152.646 24.5427 152.208 24.776C151.769 25.0093 151.26 25.126 150.682 25.126C150.028 25.126 149.431 24.958 148.89 24.622C148.348 24.286 147.919 23.8147 147.602 23.208C147.294 22.592 147.14 21.8873 147.14 21.094ZM153.244 21.122C153.244 20.646 153.15 20.24 152.964 19.904C152.777 19.5587 152.525 19.2973 152.208 19.12C151.89 18.9333 151.55 18.84 151.186 18.84C150.822 18.84 150.486 18.9287 150.178 19.106C149.87 19.2833 149.618 19.5447 149.422 19.89C149.235 20.226 149.142 20.6273 149.142 21.094C149.142 21.5607 149.235 21.9713 149.422 22.326C149.618 22.6713 149.87 22.9373 150.178 23.124C150.495 23.3107 150.831 23.404 151.186 23.404C151.55 23.404 151.89 23.3153 152.208 23.138C152.525 22.9513 152.777 22.69 152.964 22.354C153.15 22.0087 153.244 21.598 153.244 21.122ZM165.96 23.138H162.068L161.424 25H159.366L162.88 15.214H165.162L168.676 25H166.604L165.96 23.138ZM165.428 21.57L164.014 17.482L162.6 21.57H165.428ZM171.699 14.64V25H169.739V14.64H171.699ZM180.596 20.954C180.596 21.234 180.577 21.486 180.54 21.71H174.87C174.917 22.27 175.113 22.7087 175.458 23.026C175.803 23.3433 176.228 23.502 176.732 23.502C177.46 23.502 177.978 23.1893 178.286 22.564H180.4C180.176 23.3107 179.747 23.9267 179.112 24.412C178.477 24.888 177.698 25.126 176.774 25.126C176.027 25.126 175.355 24.9627 174.758 24.636C174.17 24.3 173.708 23.8287 173.372 23.222C173.045 22.6153 172.882 21.9153 172.882 21.122C172.882 20.3193 173.045 19.6147 173.372 19.008C173.699 18.4013 174.156 17.9347 174.744 17.608C175.332 17.2813 176.009 17.118 176.774 17.118C177.511 17.118 178.169 17.2767 178.748 17.594C179.336 17.9113 179.789 18.364 180.106 18.952C180.433 19.5307 180.596 20.198 180.596 20.954ZM178.566 20.394C178.557 19.89 178.375 19.4887 178.02 19.19C177.665 18.882 177.231 18.728 176.718 18.728C176.233 18.728 175.822 18.8773 175.486 19.176C175.159 19.4653 174.959 19.8713 174.884 20.394H178.566ZM183.737 18.448C183.989 18.0373 184.315 17.7153 184.717 17.482C185.127 17.2487 185.594 17.132 186.117 17.132V19.19H185.599C184.983 19.19 184.516 19.3347 184.199 19.624C183.891 19.9133 183.737 20.4173 183.737 21.136V25H181.777V17.244H183.737V18.448ZM189.469 18.854V22.606C189.469 22.8673 189.529 23.0587 189.651 23.18C189.781 23.292 189.996 23.348 190.295 23.348H191.205V25H189.973C188.321 25 187.495 24.1973 187.495 22.592V18.854H186.571V17.244H187.495V15.326H189.469V17.244H191.205V18.854H189.469Z" fill="white" />
                      <path d="M219.291 19.9996C219.291 19.6883 219.153 19.3995 219.023 19.1826C218.882 18.9486 218.692 18.707 218.484 18.4714C218.066 17.9989 217.521 17.4914 216.993 17.0323C216.461 16.5706 215.931 16.1454 215.535 15.8364C215.337 15.6817 215.172 15.5555 215.055 15.4677C214.997 15.4238 214.952 15.3895 214.92 15.366L214.884 15.339L214.874 15.3319L214.871 15.3294C214.593 15.1247 214.201 15.1838 213.997 15.4617C213.792 15.7396 213.851 16.1309 214.129 16.3356L214.14 16.3434L214.173 16.3682C214.203 16.3902 214.246 16.4229 214.302 16.4651C214.414 16.5495 214.574 16.6716 214.766 16.8218C215.152 17.1226 215.663 17.5333 216.173 17.9761C216.686 18.4216 217.183 18.8873 217.547 19.299C217.57 19.3251 217.592 19.3507 217.614 19.3758L205.333 19.3758C204.988 19.3758 204.708 19.6556 204.708 20.0008C204.708 20.346 204.988 20.6258 205.333 20.6258L217.612 20.6258C217.591 20.6502 217.569 20.6749 217.547 20.7001C217.183 21.1118 216.686 21.5775 216.173 22.023C215.663 22.4658 215.152 22.8766 214.766 23.1774C214.574 23.3275 214.414 23.4497 214.302 23.5341C214.246 23.5762 214.203 23.6089 214.173 23.6309L214.14 23.6557L214.129 23.6636C213.851 23.8683 213.792 24.2595 213.997 24.5374C214.201 24.8154 214.593 24.8744 214.871 24.6697L214.874 24.6673L214.884 24.6601L214.92 24.6331C214.952 24.6096 214.997 24.5753 215.055 24.5314C215.172 24.4437 215.337 24.3175 215.535 24.1627C215.931 23.8538 216.461 23.4286 216.993 22.9668C217.521 22.5078 218.066 22.0003 218.484 21.5277C218.692 21.2922 218.882 21.0506 219.023 20.8165C219.153 20.601 219.29 20.3143 219.291 20.0052" fill="white" />
                    </svg>

                  </Box>
                </>
              )}
            </Button>

          </Box>
        </Box>
        <Box sx={{
          pt: 2, my: 2, pl: 2,
          borderLeft: { xs: '0px', md: '1px solid rgb(221, 221, 221)' },
          borderTop: { xs: '1px solid rgb(221, 221, 221)', md: '0px' }
        }}>
          {/* Activity Log */}
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
            Activity Log
          </Typography>

          {/* Status chip */}
          <Box sx={{ my: 2 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                border: '1px solid rgb(218, 218, 218)',
                borderRadius: 1
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: alertData.status === 'new'
                    ? '#2196f3'  // Blue for new
                    : alertData.status === 'in_progress'
                      ? '#FFC107' // Yellow for in progress
                      : '#4caf50', // Green for handled
                  mr: 1
                }}
              />
              <Typography variant="body2" sx={{ color: 'black', fontWeight: 'medium' }}>
                {alertData.status === 'new'
                  ? 'New'
                  : alertData.status === 'in_progress'
                    ? 'In Progress'
                    : 'Resolved'}
              </Typography>
            </Box>
          </Box>

          {logsLoading ? (
            <CircularProgress size={20} sx={{ my: 1 }} />
          ) : actionLogs.length > 0 ? (
            <Box>
              <Box sx={{ height: 300, mb: 2, overflowY: "auto" }}>
                {actionLogs.map((log, index) => (
                  <Typography key={index} variant="body2" sx={{ py: 1, color: 'text.secondary' }}>
                    {log.formattedDate || (log.timestamp && format(new Date(log.timestamp), 'dd MMM'))} {log.formattedTime || (log.timestamp && format(new Date(log.timestamp), 'h:mma'))} – {log.displayName || 'You'} {log.actionDetails || 'Unfollowed this alert by admin'}
                  </Typography>
                ))}
              </Box>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 0, md: 2 } }}>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleStatusChange('handled')}
                  disabled={!canChangeStatus() || alertData.status === 'handled'}
                  sx={{
                    mb: 2,
                    py: 1.5,
                    backgroundColor: '#EBEBEC',
                    border: "none",
                    color: '#555',
                    '&:hover': { borderColor: '#ccc', bgcolor: '#f5f5f5' },
                    textTransform: 'none',
                    borderRadius: 2,
                    height: 40,
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {alertData.status === 'handled' ? 'Resolved' : 'Mark as Resolved'}
                    {alertData.status === 'handled' && (
                      <CheckIcon sx={{ ml: 1, color: '#4caf50', fontSize: 18 }} />
                    )}
                  </Box>
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleFollowToggle}
                  disabled={!canFollowAlerts()}
                  sx={{
                    py: 1.5,
                    borderColor: '#dedede',
                    color: '#555',
                    '&:hover': { borderColor: '#ccc', bgcolor: '#f5f5f5' },
                    textTransform: 'none',
                    borderRadius: 2,
                    height: 40,
                    fontWeight: 'bold'
                  }}
                >
                  {alertData.isFollowing ? 'Unfollow Alert' : 'Follow Alert'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No activity logged yet.
            </Typography>
          )}
        </Box>
      </Box>
      <Dialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.1946 85.0487C19.2454 83.5091 26.2923 81.9516 33.3363 80.3805C34.7896 82.0508 50.6753 96.0215 57.3876 102.447C57.8113 102.853 58.3602 102.66 58.6173 102.288C61.9613 102.533 63.4555 102.589 66.7798 103.47C89.9957 85.9338 89.8595 86.5346 94.7962 83.7193C95.5368 84.4388 96.2717 85.1641 97.0201 85.8753C97.2641 86.107 97.6933 86.2005 97.9897 86.0003C113.725 75.3702 144.38 57.3748 148.552 53.7268C148.879 53.4409 148.865 53.0766 148.683 52.7995C148.665 52.7422 148.641 52.6841 148.607 52.6255C147.053 49.9039 145.723 47.0698 144.096 44.3873C143.838 43.962 143.383 43.9323 143.04 44.1128C131.412 43.7597 119.783 43.4524 108.15 43.3323C112.513 30.7032 105.389 17.5843 93.7548 13.388C84.404 10.0156 73.6222 13.0578 67.3613 20.7526C61.2207 28.3 60.3397 39.1438 65.1868 47.5646C61.1941 48.6263 57.2014 49.6875 53.2087 50.7495C53.1779 50.7578 53.1524 50.7706 53.124 50.7813C52.8727 50.7732 52.6194 50.8826 52.4514 51.1625C50.1451 55.0097 48.048 58.9688 46.0488 62.9828C45.8717 63.3383 45.9709 63.6763 46.1839 63.9055C46.8003 65.3912 47.6058 66.775 48.3253 68.2063C41.1917 69.7409 34.055 71.2607 26.911 72.7443C26.7462 72.7123 26.5634 72.7425 26.3769 72.8716C21.3764 76.3378 16.6347 80.1597 11.5501 83.5065C10.8125 83.992 11.2914 85.2455 12.1946 85.0487ZM27.0647 74.3375C33.4753 73.4669 97.723 58.3815 142.781 50.4711C142.221 51.187 141.708 51.9393 141.275 52.7159C98.8365 63.8776 58.2443 73.3219 15.6006 82.6638C19.4558 79.936 23.1852 77.0334 27.0647 74.3375ZM47.7613 63.5547C56.8238 61.0542 65.96 58.8472 75.16 56.9141C77.5748 58.118 80.1881 58.9169 82.8821 59.2597C75.7674 60.6758 55.3072 64.747 49.0878 66.2222C48.6162 65.3477 48.1483 64.4716 47.7613 63.5547ZM103.045 51.8969C116.558 49.8435 130.134 48.2594 143.741 46.9768C144.033 47.5018 144.319 48.0302 144.601 48.5604C129.14 50.8094 112.705 53.5805 97.3045 56.4633C99.4589 55.2456 101.389 53.6972 103.045 51.8969ZM145.326 49.9209C145.647 50.5315 145.972 51.1404 146.299 51.7482C145.677 51.4919 145.061 51.2227 144.449 50.9354C144.882 50.4157 145.249 50.0449 145.326 49.9209ZM35.9923 80.6987C40.1841 81.6832 50.7048 83.9821 50.9946 84.0597C53.6752 84.8011 52.6609 84.0636 83.6647 73.338C86.2891 76.8159 89.7165 80.6563 91.6722 83.6464C80.6811 89.8347 69.4496 95.5917 57.9506 100.779C50.7639 93.9414 43.2089 87.5042 35.9923 80.6987ZM97.6826 84.2893C93.6665 80.4534 89.7704 76.4948 85.8167 72.5951C96.728 68.8373 112.631 63.4828 136.961 55.4914C138.607 55.0617 140.255 54.6399 141.9 54.2071C142.188 54.193 142.411 53.9966 142.511 53.774C142.79 53.2469 143.118 52.7341 143.467 52.2339C144.406 52.6836 145.358 53.0883 146.32 53.4755C142.811 56.0966 99.9833 82.7606 97.6826 84.2893ZM140.917 45.6508C128.769 46.8344 116.648 48.2706 104.575 50.0654C105.763 48.4857 106.76 46.7578 107.54 44.924C118.668 45.0323 129.793 45.3185 140.917 45.6508ZM66.6488 24.5677C71.3337 16.5695 80.7905 12.2518 89.9056 13.9904C105.991 17.059 114.116 37.0916 102.167 50.5354C102.136 50.5633 102.109 50.5932 102.085 50.6258C93.0072 60.729 77.2911 59.9209 68.9355 50.1242C62.891 43.037 61.9342 32.6167 66.6488 24.5677ZM53.6472 52.2888C57.7891 51.1873 61.9311 50.0865 66.073 48.9849C67.9321 51.7336 70.3274 54.0138 73.06 55.7357C64.8152 57.4992 56.6217 59.4826 48.4878 61.7029C50.1144 58.5141 51.8147 55.3662 53.6472 52.2888Z" fill="black" />
              <path d="M73.5917 46.24C67.2018 36.9777 71.9872 24.3574 82.6325 21.7134C82.7427 22.8986 82.9487 24.0741 83.2437 25.2056C83.3852 25.7486 83.9083 25.8676 84.313 25.7033C84.6507 25.7286 84.6173 25.7272 88.67 22.6418C89.4768 22.0275 90.8013 21.4251 91.2906 20.5191C91.5549 20.0303 91.3008 19.5311 90.8125 19.3439C83.4366 16.5145 83.7884 16.6376 83.701 16.623C83.1909 16.5309 82.844 16.8249 82.745 17.1876C82.745 17.1874 82.7448 17.1871 82.7445 17.1866C82.6979 17.6289 82.5234 18.5442 82.5435 20.1254C70.8172 22.9579 65.0659 36.6915 72.2102 47.0475C72.7911 47.8897 74.1784 47.0905 73.5917 46.24Z" fill="black" />
              <path d="M88.3538 49.9755C88.1782 48.8138 87.9092 47.6682 87.5631 46.5836C87.3647 45.9614 86.6681 45.9062 86.2676 46.2008C86.1342 46.2224 86.0006 46.2742 85.8751 46.3737C84.6717 47.3278 83.5116 48.3323 82.3428 49.3278C81.5889 49.97 80.21 50.7239 79.7879 51.6169C79.5618 52.095 79.7433 52.6232 80.266 52.7922C82.6811 53.5724 85.0983 54.3466 87.5134 55.1268C87.5142 55.1213 87.515 55.1161 87.5157 55.1109C88.1708 55.3097 88.5256 54.8733 88.4887 54.3422C88.4918 54.3453 88.4952 54.3487 88.4983 54.3518C88.591 53.4487 88.5954 52.5224 88.5335 51.5943C100.117 48.2153 105.032 34.0349 97.4165 24.1752C96.7962 23.3721 95.4056 24.1677 96.035 24.9828C102.987 33.9825 98.8017 46.6802 88.3538 49.9755Z" fill="black" />
              <path d="M35.6814 101.616C37.4592 99.7488 39.2371 97.8824 41.0152 96.0158C41.7251 95.2702 40.5957 94.1371 39.8837 94.8845C38.1059 96.7509 36.3277 98.6176 34.5499 100.484C33.8397 101.23 34.9694 102.363 35.6814 101.616Z" fill="black" />
              <path d="M29.034 109.684C27.8684 111.569 27.0678 113.619 26.6595 115.797C26.471 116.804 28.0126 117.235 28.2025 116.223C28.5876 114.166 29.3145 112.272 30.4158 110.492C30.9587 109.614 29.5754 108.809 29.034 109.684Z" fill="black" />
              <path d="M25.7428 124.801C25.6608 126.224 25.5787 127.647 25.4967 129.069C25.4376 130.098 27.0379 130.095 27.0967 129.069C27.1787 127.647 27.2608 126.224 27.3428 124.801C27.4019 123.773 25.8017 123.776 25.7428 124.801Z" fill="black" />
              <path d="M28.9969 136.275C28.3157 135.501 27.1876 136.636 27.8654 137.407C29.1964 138.92 30.5272 140.433 31.8579 141.946C32.5391 142.721 33.6673 141.586 32.9894 140.815C31.6584 139.302 30.3277 137.789 28.9969 136.275Z" fill="black" />
              <path d="M49.4848 146.643C50.4775 146.374 50.0561 144.83 49.0595 145.1C47.2777 145.583 45.4796 145.447 43.8092 144.648C42.8848 144.206 42.072 145.585 43.0017 146.03C45.0663 147.017 47.271 147.243 49.4848 146.643Z" fill="black" />
              <path d="M64.3157 140.923C66.7058 139.309 69.0962 137.695 71.4863 136.08C72.335 135.507 71.5352 134.12 70.6787 134.698C68.2886 136.313 65.8985 137.927 63.5082 139.542C62.6595 140.115 63.4595 141.502 64.3157 140.923Z" fill="black" />
              <path d="M85.2926 130.16C87.0619 128.392 89.1856 127.224 91.6207 126.659C92.6233 126.426 92.1991 124.883 91.1955 125.116C88.5064 125.74 86.1132 127.078 84.1614 129.029C83.4319 129.758 84.5632 130.889 85.2926 130.16Z" fill="black" />
              <path d="M105.746 121.565C108.008 120.679 110.318 120.34 112.738 120.543C113.764 120.629 113.758 119.028 112.738 118.943C110.185 118.729 107.706 119.088 105.321 120.022C104.373 120.394 104.785 121.942 105.746 121.565Z" fill="black" />
              <path d="M130.688 125.488C131.154 126.407 132.535 125.598 132.069 124.681C130.801 122.177 128.327 120.612 125.543 120.425C124.515 120.355 124.519 121.956 125.543 122.025C127.782 122.175 129.681 123.501 130.688 125.488Z" fill="black" />
              <path d="M139.377 136.86C138.912 134.865 138.08 133.006 136.896 131.335C136.305 130.502 134.917 131.3 135.514 132.143C136.628 133.714 137.396 135.408 137.834 137.285C138.067 138.287 139.61 137.863 139.377 136.86Z" fill="black" />
              <path d="M141.786 147.207C141.693 145.785 141.6 144.363 141.506 142.941C141.44 141.919 139.839 141.911 139.906 142.941C140 144.363 140.093 145.785 140.186 147.207C140.253 148.229 141.853 148.236 141.786 147.207Z" fill="black" />
            </svg>
          </Box>

          <DialogTitle sx={{ textAlign: 'center', pt: 3, fontWeight: 'bold' }}>
            Send this alert now?
          </DialogTitle>
          <DialogContentText>
            This alert will be sent to selected recipients. Please check the details before sending.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>
          <Button
            onClick={handleSendAlert}
            fullWidth
            variant="contained"
            disabled={!canSendNotifications()}
            sx={{
              mb: 1,
              py: 1.5,
              bgcolor: 'black',
              '&:hover': { bgcolor: '#333' }
            }}
          >
            Yes, Alert
          </Button>
          <Button
            onClick={() => setShowConfirmation(false)}
            fullWidth
            variant="outlined"
            sx={{ py: 1.5 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showResolveConfirmation}
        onClose={() => setShowResolveConfirmation(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            margin: 0
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', p: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <svg width="135" height="140" viewBox="0 0 135 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M37.3367 120.904C37.1083 124.007 39.0434 127.686 42.6432 127.285C46.2809 126.878 47.3481 122.915 46.7611 119.856C46.8752 119.754 46.9406 119.648 46.9294 119.536C46.8502 118.765 43.5606 118.892 41.8325 119.065C40.1038 119.239 36.8554 119.774 36.933 120.545C36.9489 120.699 37.1018 120.815 37.3367 120.904ZM42.5377 126.465C39.4671 126.733 38.0077 123.716 38.1304 121.079C39.2546 121.212 40.9148 121.128 42.0299 121.015C43.1632 120.901 44.9445 120.632 46.0189 120.243C46.4398 122.791 45.6171 126.197 42.5377 126.465Z" fill="black" />
              <path d="M133.99 2.27799C134.705 1.63476 133.797 0.651946 133.021 1.02174C130.317 2.30878 92.7 26.2509 52.189 49.0296C49.9794 46.7863 47.6088 44.6243 44.3093 45.0681C39.4382 34.929 35.2393 24.4921 31.4653 13.8728C31.2752 13.3384 30.5611 13.0447 30.1281 13.5202C23.407 20.8941 17.2726 28.8056 9.88275 35.5467C9.65645 35.753 9.61035 36.0993 9.70905 36.3832C9.60332 39.3113 9.49785 42.2452 9.38717 45.1738C14.7338 51.6368 19.9015 57.7806 25.0583 63.7811C21.5739 72.9601 21.3993 82.6886 21.5906 83.2775C16.6059 84.0014 11.6213 84.7269 6.63587 85.4478C6.08353 85.5275 5.96191 86.0197 6.12598 86.429C6.12529 86.4309 7.24965 127.12 7.22051 127.315C5.95619 127.634 2.53275 128.711 0.750977 129.136C8.79681 132.354 22.7148 136.731 29.4822 138.029C30.3077 138.362 31.1338 138.695 31.9637 139.018C32.1757 139.101 32.6656 139.037 32.7442 139.018C37.9476 137.779 43.1588 136.573 48.3716 135.374C48.2432 135.704 48.2984 136.111 48.6739 136.36C54.114 139.973 60.7557 138.505 64.5624 133.223C64.9778 132.647 65.3413 132.03 65.6796 131.395C75.1199 129.213 77.3197 128.664 77.6497 128.589C78.0036 128.54 78.3257 128.287 78.3296 127.826C78.4447 114.682 78.6882 101.538 78.8033 88.3936C78.8104 87.5538 78.6674 86.6947 77.8505 86.4874C74.4262 85.6171 71.0025 84.7452 67.5783 83.8749C66.5562 78.665 65.1346 73.5322 63.3184 68.5082C86.3018 45.8322 109.997 23.8759 133.99 2.27799ZM126.864 6.55715C105.102 26.2462 83.6135 46.2577 62.7111 66.8608C60.561 61.2093 58.5068 56.5946 55.1804 52.3993C91.6571 26.4013 112.429 16.1008 126.864 6.55715ZM50.9533 49.7228C47.9181 51.4249 47.8997 51.4232 47.5322 51.5301C46.6864 49.8936 45.8601 48.2488 45.052 46.5952C47.0314 46.5603 49.1098 47.9546 50.9533 49.7228ZM30.3958 15.6155C35.3885 29.515 41.1156 43.1025 48.1393 56.1082C48.3149 56.8135 49.319 57.1275 49.7077 56.3238C51.1533 55.2806 52.5999 54.2415 54.0476 53.2072C57.8787 58.1171 59.0582 61.6184 61.4913 68.0613C55.9932 73.4931 50.5356 78.9665 45.1255 84.4863C32.1268 69.2842 21.3371 53.4649 11.4567 36.2577C18.3294 29.9014 24.1465 22.5613 30.3958 15.6155ZM67.5874 94.7285C68.2982 103.214 67.66 123.22 64.5593 130.012C54.0799 132.432 43.5885 134.8 33.1249 137.286C32.5872 123.124 32.476 108.95 32.0489 94.7848C43.7835 93.6572 55.4812 92.2223 67.1088 90.3118C67.3012 91.7796 67.4637 93.2514 67.5874 94.7285ZM41.0174 82.0764C41.7192 82.9249 42.4268 83.7681 43.1385 84.6087C34.1057 86.0254 25.0671 87.4144 16.0221 88.7504C13.7669 88.0785 11.5171 87.3848 9.27415 86.6691C19.8551 85.1374 30.4338 83.5894 41.0174 82.0764ZM21.2429 91.9363C21.2606 96.8014 21.4169 101.664 21.4585 106.529C20.2942 104.044 19.1536 101.538 18.2338 98.9556C18.0788 98.5202 17.4382 98.6509 17.4442 99.0395C16.82 99.9337 16.2809 100.88 15.7934 101.853C15.7372 98.8655 15.6286 95.8796 15.5952 92.8915C15.5895 92.3769 14.7895 92.3754 14.7952 92.8915C14.8341 96.3941 14.9817 99.8936 15.0205 103.396C15.0247 103.755 15.4106 103.858 15.6447 103.717C15.6999 103.707 16.8028 103.516 17.315 103.432C17.6309 102.702 17.8846 101.852 18.2005 101.122C18.2005 101.122 18.5128 102.151 21.3512 108.178C21.5146 108.525 22.113 108.685 22.2486 108.268C22.7804 107.466 23.5218 106.763 24.0057 105.979C23.977 101.667 24.1192 97.128 24.3609 92.8155C26.3687 93.3702 28.3799 93.9124 30.3942 94.4452C30.4072 94.4816 30.4242 94.516 30.4424 94.5499C30.8736 108.741 30.9838 122.94 31.5192 137.129C23.7835 134.073 16.2601 130.562 8.81608 126.856C8.49681 113.86 8.09577 100.867 7.77415 87.8717C12.2385 89.3129 16.7309 90.6577 21.2429 91.9363ZM31.7403 93.2155C31.5319 93.0509 31.9136 93.2187 26.3301 91.6947C49.7826 89.0916 61.8293 85.2268 64.4781 84.7374C65.0846 84.8915 65.6913 85.0462 66.2979 85.2004C66.5166 86.3738 66.7135 87.5519 66.8885 88.7337C55.2322 90.6519 43.5054 92.09 31.7403 93.2155ZM45.1791 86.4556C45.3494 86.4285 45.5333 86.3535 45.6489 86.2353C46.1148 85.7592 46.5841 85.2863 47.0507 84.8108C50.7606 84.2436 54.471 83.6806 58.1843 83.1363C59.6671 83.5139 61.1502 83.891 62.633 84.2681C25.0816 91.2184 26.0619 89.4647 21.4169 90.3223C20.2145 89.9811 19.0132 89.6358 17.8137 89.2842C26.4619 88.0009 35.1044 86.6754 43.7411 85.3197C44.001 85.6238 44.2564 85.9316 44.5174 86.2353C44.6791 86.4233 44.9356 86.4879 45.1791 86.4556ZM47.9814 83.8655C48.8533 82.979 49.7239 82.091 50.5984 81.2072C52.463 81.6816 54.3278 82.1556 56.1924 82.6301C53.4544 83.0353 50.7176 83.4483 47.9814 83.8655ZM26.2361 65.1483C35.8487 76.3028 38.3159 78.7796 39.8367 80.6426C34.271 81.4389 28.7067 82.2436 23.1426 83.0519C23.5335 77.1898 23.5794 72.4937 26.2361 65.1483ZM62.2559 133.501C58.7591 137.199 53.8906 137.799 49.6489 135.081C54.2721 134.019 58.8955 132.957 63.5182 131.892C63.1447 132.458 62.7304 132.999 62.2559 133.501ZM68.5976 90.0587C71.4703 89.5764 74.3387 89.0676 77.202 88.5238C77.0882 101.404 76.8538 114.283 76.7369 127.163C73.3426 127.971 69.9455 128.765 66.5468 129.552C69.9332 121.136 69.9899 100.456 68.5976 90.0587ZM74.7632 87.3535C72.6395 87.7452 70.5135 88.1207 68.3846 88.479C68.2411 87.5202 68.0799 86.5644 67.9096 85.6103C70.1942 86.191 72.4786 86.7728 74.7632 87.3535ZM65.9583 83.4629C61.2739 82.2717 56.5898 81.0811 51.9059 79.8884C55.2867 76.479 58.6835 73.0858 62.0979 69.7098C63.7062 74.1993 65.0015 78.7957 65.9583 83.4629Z" fill="black" />
              <path d="M13.9461 112.355C16.5037 113.269 19.0612 114.184 21.6188 115.099C22.1044 115.272 22.3136 114.5 21.8315 114.327C19.274 113.413 16.7164 112.498 14.1589 111.583C13.6732 111.409 13.4641 112.182 13.9461 112.355Z" fill="black" />
              <path d="M20.2315 117.974C18.7797 117.445 17.3276 116.916 15.8755 116.387C15.3912 116.21 15.1823 116.983 15.663 117.158C17.1151 117.687 18.5669 118.217 20.019 118.745C20.5034 118.922 20.7122 118.149 20.2315 117.974Z" fill="black" />
              <path d="M19.1675 120.987C18.6643 120.839 18.1609 120.691 17.6578 120.543C17.1628 120.397 16.9513 121.169 17.4451 121.314C17.9482 121.462 18.4516 121.61 18.955 121.758C19.4497 121.904 19.6612 121.132 19.1675 120.987Z" fill="black" />
              <path d="M43.6151 130.105C43.4286 130.142 43.2422 130.179 43.056 130.216C43.0562 129.664 43.0615 129.111 43.0615 128.558C43.0617 128.043 42.2617 128.042 42.2615 128.558C42.2615 130.414 42.2364 130.224 42.2797 130.372C42.1328 130.401 41.9859 130.43 41.8391 130.46C41.3344 130.561 41.5479 131.332 42.0516 131.231C42.6437 131.113 43.2357 130.994 43.8279 130.876C44.3323 130.775 44.1187 130.004 43.6151 130.105Z" fill="black" />
              <path d="M39.2171 102.584C42.5463 102.234 45.8931 102.121 49.2233 101.785C49.433 103.563 49.5733 105.349 49.7895 107.126C46.6546 107.467 43.5197 107.808 40.3848 108.149C40.2205 106.934 40.1767 105.709 39.9812 104.496C39.8991 103.989 39.128 104.204 39.2095 104.709C39.427 106.055 39.4486 107.418 39.6658 108.764C39.707 109.017 39.9249 109.101 40.1431 109.023C44.0767 109.185 48.026 108.972 51.9184 108.381C49.8235 100.894 49.965 101.383 49.965 101.383C49.8905 101.113 49.7838 100.931 49.5265 100.958C46.0965 101.319 42.6473 101.423 39.2171 101.784C38.7103 101.837 38.7049 102.638 39.2171 102.584Z" fill="black" />
              <path d="M53.0066 121.348C56.6063 120.554 60.1894 119.693 63.7571 118.764C64.255 118.635 64.0438 117.863 63.5446 117.993C59.9769 118.921 56.3936 119.783 52.7938 120.577C52.2912 120.687 52.504 121.459 53.0066 121.348Z" fill="black" />
              <path d="M60.8354 122.778C58.2677 123.361 55.7 123.945 53.1323 124.528C52.6305 124.642 52.8427 125.413 53.3448 125.299C55.9125 124.716 58.4802 124.133 61.0479 123.55C61.5497 123.436 61.3375 122.664 60.8354 122.778Z" fill="black" />
              <path d="M56.7003 127.322C56.0295 127.48 55.3584 127.637 54.6873 127.795C54.1865 127.914 54.3985 128.685 54.9 128.567C55.5711 128.409 56.242 128.251 56.9131 128.093C57.4141 127.975 57.2019 127.204 56.7003 127.322Z" fill="black" />
            </svg>

          </Box>

          <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', p: 1 }}>
            Mark this alert as resolved?
          </DialogTitle>

          <DialogContent sx={{ textAlign: 'center', p: 0 }}>
            <DialogContentText>
              This alert will be marked as completed and moved to your archive.
            </DialogContentText>
          </DialogContent>
        </DialogContent>



        <DialogActions sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>
          <Button
            onClick={handleConfirmedResolve}
            fullWidth
            variant="contained"
            sx={{
              mb: 1,
              py: 1.5,
              bgcolor: 'black',
              '&:hover': { bgcolor: '#333' }
            }}
          >
            Yes, Mark as Resolved
          </Button>
          <Button
            onClick={() => setShowResolveConfirmation(false)}
            fullWidth
            variant="outlined"
            sx={{ py: 1 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ActionHubDetail; 