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
  Send,
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

  // Get auth context to check user roles

  console.log(totalGuestsCount, notifiedGuestsCount, notifiedTeamCount, notificationSuccessCount, notificationFailCount);

  const {
    isCollaboratorViewer,
  } = useAuth();

  // Access the toast API
  const { showToast } = useToast();

  // Helper function to check if user is view-only
  const isViewOnly = () => {
    return isCollaboratorViewer;
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

    try {
      await markAlertStatus(alertData.actionHubId, status);

      showToast(`Alert marked as ${status === 'handled' ? 'resolved' : status}`, 'success');

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
    <Box sx={{
      backgroundColor: '#fff',
      height: '100%',
      maxWidth: '100%',
    }}>
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
        width: '100%',
      }}>
        {/* Left column - Alert details */}
        <Box sx={{
          flex: '1 1 60%',
          p: 3,
          borderBottom: { xs: 'none', md: '1px solid #eaeaea' }
        }}>
          {/* Alert Metadata */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {alertData.createdAt ? format(new Date(alertData.createdAt), 'H') + 'h' : '3h'}
            </Typography>

            <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
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
      <Box style={{ display: 'flex' }}>

        {/* Right column - Action panel */}
        <Box sx={{
          flex: '1 1 50%',
          p: 3,
          bgcolor: '#fafafa'
        }}>
          {/* Forward To Section */}
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1}}>
            Forward To
          </Typography>

          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
            <Select
              value={recipientType}
              onChange={handleRecipientChange}
              displayEmpty
              sx={{ bgcolor: 'white' , border:"1px solid #f5f5f5 "}}
            >
              <MenuItem value="guests">Guests</MenuItem>
              <MenuItem value="team">Team</MenuItem>
              <MenuItem value="management">Management</MenuItem>
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
            sx={{ mb: 2, bgcolor: 'white' }}
            disabled={isViewOnly()}
          />

          {/* Send Via */}
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
            Send Via
          </Typography>

          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
            <Select
              value={sendMethod}
              onChange={handleSendMethodChange}
              displayEmpty
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="internal">Internal Message</MenuItem>
            </Select>
          </FormControl>

          {/* Action Buttons */}
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              fullWidth
              color="primary"
              startIcon={sendingNotification ? undefined : <Send />}
              onClick={openConfirmationDialog}
              disabled={sendingNotification || isViewOnly()}
              sx={{
                mb: 2,
                py: 1.5,
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
                'Send Alert'
              )}
            </Button>

          </Box>
        </Box>
        <Box sx={{ mt: 4, mb: 2, pl: 2, borderLeft: '1px solid #eaeaea' }}>
          {/* Activity Log */}
          <Typography variant="h6" fontWeight="bold">
            ACTIVITY LOG
          </Typography>

          {/* Status chip */}
          <Box sx={{ my: 2 }}>
            <Box 
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                border: '1px solid #EBEBEC',
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
            <Box  sx={{height:300, mb:2, overflowY:"auto"}}>
            {actionLogs.map((log, index) => (
                <Typography key={index} variant="body2" sx={{ py: 1, color: 'text.secondary' }}>
                  {log.formattedDate || (log.timestamp && format(new Date(log.timestamp), 'dd MMM'))} {log.formattedTime || (log.timestamp && format(new Date(log.timestamp), 'h:mma'))} – {log.displayName || 'You'} {log.actionDetails || 'Unfollowed this alert by admin'}
                </Typography>
              ))}
            </Box>
            <Box sx={{display:"flex", gap:2}}>
              
            <Button
                variant="outlined"
                fullWidth
                onClick={() => handleStatusChange('handled')}
                disabled={isViewOnly()}
                sx={{
                  mb: 2,
                  py: 1.5,
                  backgroundColor: '#EBEBEC',
                  border:"none",
                  color: '#555',
                  '&:hover': { borderColor: '#ccc', bgcolor: '#f5f5f5' },
                  textTransform: 'none',
                  borderRadius: 2,
                  height:40,
                  fontWeight: 'bold'
                }}
              >
                Mark as Resolved
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={handleFollowToggle}
                disabled={isViewOnly()}
                sx={{
                  py: 1.5,
                  borderColor: '#dedede',
                  color: '#555',
                  '&:hover': { borderColor: '#ccc', bgcolor: '#f5f5f5' },
                  textTransform: 'none',
                  borderRadius: 2,
                  height:40,
                  fontWeight: 'bold'
                }}
              >
                Unfollow Alert
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
        <DialogTitle sx={{ textAlign: 'center', pt: 3, fontWeight: 'bold' }}>
          Send this alert now?
        </DialogTitle>
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
          <DialogContentText>
            This alert will be sent to selected recipients. Please check the details before sending.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>
          <Button
            onClick={handleSendAlert}
            fullWidth
            variant="contained"
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
    </Box>
  );
};

export default ActionHubDetail; 