'use client';

import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
=======
import {
  Box,
  Typography,
  Button,
  CircularProgress,
>>>>>>> 2945eb6 (Initial commit)
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
<<<<<<< HEAD
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { 
  getFlaggedAlertById, 
  markAlertStatus, 
  flagAlert, 
  followAlert,
  addGuests, 
=======
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  Divider,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  getFlaggedAlertById,
  markAlertStatus,
  flagAlert,
  followAlert,
  addGuests,
>>>>>>> 2945eb6 (Initial commit)
  notifyGuests,
  notifyTeam,
  getActionLogs
} from '@/services/action-hub';
import { ActionHubItem, ActionLog } from '@/types';
<<<<<<< HEAD
import { 
  ArrowBack, 
  Flag, 
  FlagOutlined, 
  Email,
  NotificationsActive,
  NotificationsNone,
  Send,
  Refresh,
  Done,
  Warning
=======
import {
  ArrowBack,
  Flag,
  FlagOutlined,
  Email,
  Sms,
  Message,
  NotificationsActive,
  NotificationsNone,
  Send,
  Done,
  Warning,
  Refresh
>>>>>>> 2945eb6 (Initial commit)
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getTimeAgo } from '@/utils/getTimeAgo';
import { useAuth } from '@/context/AuthContext';
<<<<<<< HEAD
=======
import { useToast } from '@/ui/toast';
>>>>>>> 2945eb6 (Initial commit)

interface ActionHubDetailProps {
  alertId: string;
}

const ActionHubDetail: React.FC<ActionHubDetailProps> = ({ alertId }) => {
<<<<<<< HEAD
  const [alert, setAlert] = useState<ActionHubItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTabState] = useState<'notify_guests' | 'add_notes'>('notify_guests');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
=======
  const [alertData, setAlertData] = useState<ActionHubItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
>>>>>>> 2945eb6 (Initial commit)
  const [instructions, setInstructions] = useState<string>('');
  const [recipientType, setRecipientType] = useState<string>('guests');
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
<<<<<<< HEAD
  
=======
  const [sendMethod, setSendMethod] = useState<string>('email');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');

>>>>>>> 2945eb6 (Initial commit)
  // New state for tracking notification status
  const [notifiedGuestsCount, setNotifiedGuestsCount] = useState<number>(0);
  const [totalGuestsCount, setTotalGuestsCount] = useState<number>(0);
  const [notifiedTeamCount, setNotifiedTeamCount] = useState<number>(0);
  const [sendingNotification, setSendingNotification] = useState<boolean>(false);
  const [notificationSuccessCount, setNotificationSuccessCount] = useState<number>(0);
  const [notificationFailCount, setNotificationFailCount] = useState<number>(0);
<<<<<<< HEAD
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  
  // Get auth context to check user roles
  const { 
    isCollaboratorViewer,
  } = useAuth();
  
=======

  // Get auth context to check user roles

  console.log(totalGuestsCount, notifiedGuestsCount, notifiedTeamCount, notificationSuccessCount, notificationFailCount);

  const {
    isCollaboratorViewer,
  } = useAuth();

  // Access the toast API
  const { showToast } = useToast();

>>>>>>> 2945eb6 (Initial commit)
  // Helper function to check if user is view-only
  const isViewOnly = () => {
    return isCollaboratorViewer;
  };
<<<<<<< HEAD
  
  console.log(activeTab);
=======

>>>>>>> 2945eb6 (Initial commit)
  const router = useRouter();

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        setLoading(true);
        const data = await getFlaggedAlertById(alertId);
<<<<<<< HEAD
        setAlert(data);
        
        // Set the active tab from the retrieved data
        if (data.currentActiveTab) {
          // If the backend sends 'message_team' we should default to 'notify_guests'
          // since message_team is no longer supported
          if (data.currentActiveTab === 'notify_guests' || data.currentActiveTab === 'add_notes') {
            setActiveTabState(data.currentActiveTab);
          } else {
            setActiveTabState('notify_guests');
          }
        }
        
=======
        setAlertData(data);

>>>>>>> 2945eb6 (Initial commit)
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
<<<<<<< HEAD
        
        if (data.teamMembers && data.teamMembers.length > 0) {
          // Note: Currently, we don't track which team members have been notified
          // This will be handled through the action logs
          const teamNotificationLogs = data.actionLogs?.filter(
            log => log.actionType === 'notify_guests' && 
                   log.actionDetails?.includes('team members')
=======

        if (data.teamMembers && data.teamMembers.length > 0) {
          const teamNotificationLogs = data.actionLogs?.filter(
            log => log.actionType === 'notify_guests' &&
              log.actionDetails?.includes('team members')
>>>>>>> 2945eb6 (Initial commit)
          );
          setNotifiedTeamCount(teamNotificationLogs && teamNotificationLogs.length > 0 ? 1 : 0);
        } else {
          setNotifiedTeamCount(0);
        }
<<<<<<< HEAD
        
        setError(null);
        
=======

        setError(null);

>>>>>>> 2945eb6 (Initial commit)
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
<<<<<<< HEAD
  
=======

>>>>>>> 2945eb6 (Initial commit)
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

  const handleFlagToggle = async () => {
<<<<<<< HEAD
    if (!alert) return;
    
    try {
      const result = await flagAlert(alert._id);
      setAlert(prev => prev ? { 
        ...prev, 
        isFlagged: result.isFlagged,
        flaggedBy: Array(result.flagCount).fill('')
      } : null);
    } catch (err) {
      console.error('Error toggling flag:', err);
=======
    if (!alertData) return;

    try {
      const result = await flagAlert(alertData._id);
      setAlertData(prev => prev ? {
        ...prev,
        isFlagged: result.isFlagged,
        flaggedBy: Array(result.flagCount).fill('')
      } : null);

      showToast(
        result.isFlagged ? 'Alert flagged successfully' : 'Alert unflagged successfully',
        'success'
      );
    } catch (err) {
      console.error('Error toggling flag:', err);
      showToast('Error updating flag status', 'error');
>>>>>>> 2945eb6 (Initial commit)
    }
  };

  const handleFollowToggle = async () => {
<<<<<<< HEAD
    if (!alert) return;
    
    try {
      const result = await followAlert(alert._id);
      
      // Update the alert state
      setAlert(prev => prev ? { 
        ...prev, 
        isFollowing: result.following,
        numberOfFollows: result.numberOfFollows
      } : null);
      
      // Provide feedback
      console.log(result.following ? 
        `You're now following this alert. Total followers: ${result.numberOfFollows}` : 
        `You've unfollowed this alert. Total followers: ${result.numberOfFollows}`);
      
      // Refresh action logs to show the follow/unfollow action
      await fetchActionLogs(alert.actionHubId);
    } catch (err) {
      console.error('Error toggling follow status:', err);
=======
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
>>>>>>> 2945eb6 (Initial commit)
    }
  };

  const handleStatusChange = async (status: 'new' | 'in_progress' | 'handled') => {
<<<<<<< HEAD
    if (!alert) return;
    
    try {
      await markAlertStatus(alert.actionHubId, status);
      
      // Provide feedback
      console.log(`Alert marked as ${status}`);
      
      // Refresh the alert
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
      
      if (status === 'handled') {
        // In a real app, you might want to:
        // 1. Show a success toast/snackbar
        // 2. Navigate back to the list view after a delay
        // router.push('/action-hub');
      }
    } catch (err) {
      console.error(`Error changing status to ${status}:`, err);
      // In a real app, show an error message
    }
  };
  
  const handleAddGuest = async () => {
    if (!alert || !guestEmail.trim()) return;
    
    try {
      // Add the guest
      await addGuests(alert.actionHubId, [{ 
        email: guestEmail.trim(),
        name: guestName.trim() || undefined
      }]);
      
      // Refresh the alert to get the updated guests
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Clear inputs
      setGuestEmail('');
      setGuestName('');
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
      
      // Add a console log as feedback
      console.log(`Guest ${guestEmail.trim()} added successfully`);
      
      // In a real application, you would show a toast/snackbar notification here
    } catch (err) {
      console.error('Error adding guest:', err);
      // In a real application, you would show an error notification here
    }
  };
  
  const handleNotifyGuests = async () => {
    if (!alert) return;
    
    try {
      setSendingNotification(true);
      
      // Get unnotified guests
      const unnotifiedGuests = alert.guests?.filter(g => !g.notificationSent) || [];
      
      if (unnotifiedGuests.length === 0) {
        console.log('No unnotified guests to notify');
        setSendingNotification(false);
        return;
      }
      
      // Get IDs of unnotified guests
      const unnotifiedGuestIds = unnotifiedGuests.map(g => g._id);
      
      // Use the default message or current instructions
      const message = instructions.trim() 
        ? instructions 
        : `Important information regarding your stay: ${alert.title || 'Alert notification'}`;
      
      // Notify only unnotified guests
      const result = await notifyGuests(alert.actionHubId, message, unnotifiedGuestIds);
      
      // Set success and failure counts
      if (result.emailResults) {
        const successCount = result.emailResults.filter(r => r.success).length;
        const failCount = result.emailResults.filter(r => !r.success).length;
        setNotificationSuccessCount(successCount);
        setNotificationFailCount(failCount);
      }
      
      // Refresh the alert to get the updated guest notification status
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Calculate updated notification stats
      if (updatedAlert.guests && updatedAlert.guests.length > 0) {
        const notifiedGuests = updatedAlert.guests.filter(guest => guest.notificationSent).length;
        setTotalGuestsCount(updatedAlert.guests.length);
        setNotifiedGuestsCount(notifiedGuests);
      }
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
    } catch (err) {
      console.error('Error notifying guests:', err);
    } finally {
      setSendingNotification(false);
    }
  };


  const handleRecipientChange = (event: SelectChangeEvent) => {
    setRecipientType(event.target.value as string);
    // Reset notification stats and selected guests when switching tabs
    setNotificationSuccessCount(0);
    setNotificationFailCount(0);
    setSelectedGuestIds([]);
  };

  // Handle resend to selected guests
  const handleResendToGuests = async (guestIds: string[]) => {
    if (!alert || guestIds.length === 0) return;
    
    try {
      setSendingNotification(true);
      
      // Use the default message or the current instructions
      const message = instructions.trim() 
        ? instructions 
        : `Important information regarding your stay: ${alert.title || 'Alert notification'}`;
      
      // Call API to resend to specific guest IDs
      const result = await notifyGuests(alert.actionHubId, message, guestIds);
      
      // Update notification counts
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
      // Calculate updated notification stats
      if (updatedAlert.guests && updatedAlert.guests.length > 0) {
        const notifiedGuests = updatedAlert.guests.filter(guest => guest.notificationSent).length;
        setNotifiedGuestsCount(notifiedGuests);
      }
      
      // Set success and failure counts
      if (result.emailResults) {
        const successCount = result.emailResults.filter(r => r.success).length;
        const failCount = result.emailResults.filter(r => !r.success).length;
        setNotificationSuccessCount(successCount);
        setNotificationFailCount(failCount);
      }
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
      
      // Clear selected guests
      setSelectedGuestIds([]);
      
    } catch (err) {
      console.error('Error resending to guests:', err);
    } finally {
      setSendingNotification(false);
    }
  };
  
  // Handle resend to all team members
  const handleResendToTeam = async () => {
    if (!alert) return;
    
    try {
      setSendingNotification(true);
      
      // Use the default message or the current instructions
      const message = instructions.trim() 
        ? instructions 
        : `Team notification regarding ${alert.title || 'Alert'}: Please review and act accordingly.`;
      
      // Call API to resend to team
      const result = await notifyTeam(alert.actionHubId, message);
      
      // Set notification count
      setNotifiedTeamCount(1);
      
      // Set success and failure counts
      if (result.emailResults) {
        const successCount = result.emailResults.filter(r => r.success).length;
        const failCount = result.emailResults.filter(r => !r.success).length;
        setNotificationSuccessCount(successCount);
        setNotificationFailCount(failCount);
      }
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
      
    } catch (err) {
      console.error('Error resending to team:', err);
    } finally {
      setSendingNotification(false);
    }
  };

  const handleForwardAlert = async () => {
    if (!alert) return;
    
    try {
      setSendingNotification(true);
      const message = `${alert.title || 'Alert notification'}: ${instructions || 'Please review this alert'}`;
      
      if (recipientType === 'guests') {
        // Check if we have any guests to notify
        if (!alert.guests || alert.guests.length === 0) {
          // No guests added yet
          if (guestEmail.trim()) {
            // If there's a guest email in the input field, add it first
            await handleAddGuest();
            // After adding the guest, fetch the updated alert data
            const updatedAlert = await getFlaggedAlertById(alertId);
            setAlert(updatedAlert);
          } else {
            console.log('No guests to notify');
            setSendingNotification(false);
            return; // Don't proceed if no guests
          }
        }
        
        // Get only unnotified guests
        const unnotifiedGuests = alert.guests?.filter(g => !g.notificationSent);
        const unnotifiedGuestIds = unnotifiedGuests?.map(g => g._id) || [];
        
        if (unnotifiedGuests && unnotifiedGuests.length > 0) {
          const result = await notifyGuests(alert.actionHubId, message, unnotifiedGuestIds);
          console.log(`Notified ${unnotifiedGuests.length} guests`);
          
=======
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

>>>>>>> 2945eb6 (Initial commit)
          // Set success and failure counts
          if (result.emailResults) {
            const successCount = result.emailResults.filter(r => r.success).length;
            const failCount = result.emailResults.filter(r => !r.success).length;
            setNotificationSuccessCount(successCount);
            setNotificationFailCount(failCount);
<<<<<<< HEAD
          }
        } else {
          console.log('All guests already notified');
          setSendingNotification(false);
          return; // Don't proceed if all guests already notified
        }
      } else if (recipientType === 'team') {
        // Check if there are team members to notify
        if (!alert.teamMembers || alert.teamMembers.length === 0) {
          console.log('No team members to notify');
          setSendingNotification(false);
          return; // Don't proceed if no team members
        }
        
        const result = await notifyTeam(alert.actionHubId, message);
        console.log(`Notified ${alert.teamMembers.length} team members`);
        
=======

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

>>>>>>> 2945eb6 (Initial commit)
        // Set success and failure counts
        if (result.emailResults) {
          const successCount = result.emailResults.filter(r => r.success).length;
          const failCount = result.emailResults.filter(r => !r.success).length;
          setNotificationSuccessCount(successCount);
          setNotificationFailCount(failCount);
<<<<<<< HEAD
        }
        
        // Set team as notified
        setNotifiedTeamCount(1);
      }
      
      // Refresh the alert to get the updated status
      const updatedAlert = await getFlaggedAlertById(alertId);
      setAlert(updatedAlert);
      
=======

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

>>>>>>> 2945eb6 (Initial commit)
      // Update notification counts
      if (updatedAlert.guests && updatedAlert.guests.length > 0) {
        const notifiedGuests = updatedAlert.guests.filter(guest => guest.notificationSent).length;
        setTotalGuestsCount(updatedAlert.guests.length);
        setNotifiedGuestsCount(notifiedGuests);
      }
<<<<<<< HEAD
      
      // Refresh action logs
      await fetchActionLogs(alert.actionHubId);
      
      // Clear instructions
      setInstructions('');
      
    } catch (err) {
      console.error('Error forwarding alert:', err);
=======

      // Refresh action logs
      await fetchActionLogs(alertData.actionHubId);

      // Clear instructions
      setInstructions('');

    } catch (err) {
      console.error('Error sending alert:', err);
      showToast('Error sending alert notification', 'error');
>>>>>>> 2945eb6 (Initial commit)
    } finally {
      setSendingNotification(false);
    }
  };

<<<<<<< HEAD

=======
>>>>>>> 2945eb6 (Initial commit)
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

<<<<<<< HEAD
  if (error || !alert) {
=======
  if (error || !alertData) {
>>>>>>> 2945eb6 (Initial commit)
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6" color="error" gutterBottom>
          {error || 'Alert not found'}
        </Typography>
<<<<<<< HEAD
        <Button 
          variant="contained" 
=======
        <Button
          variant="contained"
>>>>>>> 2945eb6 (Initial commit)
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

<<<<<<< HEAD
  if (isExpanded) {
    // Expanded view to match the provided image
    return (
      <Box sx={{ backgroundColor: '#fff', height: '100vh' }}>
        <Box sx={{ 
          position: 'sticky', 
          top: 0, 
          bgcolor: 'background.paper', 
          zIndex: 10, 
          py: 1.5, 
          px: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid #eaeaea' 
        }}>
          <IconButton onClick={() => setIsExpanded(false)} color="inherit" aria-label="back" sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, py: 2 }}>
          {/* Title with timestamp */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" component="h1">
              {alert.title || 'Untitled Alert'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {alert.createdAt ? format(new Date(alert.createdAt), 'H') + 'h' : '26h'}
            </Typography>
          </Box>
          
          {/* Location */}
          <Typography variant="body1" sx={{ mb: 2 }}>
            {alert.city || 'Princess Street'}
          </Typography>
          
          {/* Description */}
          <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.6 }}>
            {alert.description || 'Roads closures expected, resulting in delayed check-ins. Notify guests alternative routes, suggest early-check ins, and prepare staff for detour info.'}
          </Typography>

          {/* Start Time */}
          <Typography variant="subtitle1" fontWeight="500">
            Start Time
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {alert.expectedStart 
              ? format(new Date(alert.expectedStart), 'dd MMM h:mma') 
              : '06 May 9:00AM'}
          </Typography>

          {/* End Time */}
          <Typography variant="subtitle1" fontWeight="500">
            End Time
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {alert.expectedEnd 
              ? format(new Date(alert.expectedEnd), 'dd MMM h:mma') 
              : '14 May 12:00PM'}
          </Typography>

          {/* Type and Impact */}
          <Box display="flex" justifyContent="space-between" sx={{ mb: 4 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Type:
              </Typography>
              <Typography variant="body1">
                {alert.alertType || 'Transport'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" align="right">
                Impact:
              </Typography>
              <Typography variant="body1" align="right">
                {alert.impact || 'Moderate'}
              </Typography>
            </Box>
          </Box>

          {/* Footer buttons */}
          <Box display="flex" justifyContent="space-between" sx={{ mt: 4, pt: 2, borderTop: '1px solid #eaeaea' }}>
            <Button
              variant="text"
              startIcon={alert.isFollowing ? <NotificationsActive /> : <NotificationsNone />}
              size="small"
              sx={{ color: alert.isFollowing ? 'primary.main' : 'text.primary' }}
              onClick={handleFollowToggle}
            >
              {alert.isFollowing ? 'Following' : 'Follow Updates'}
            </Button>
            
            <Button
              variant="text"
              startIcon={alert.isFlagged ? <Flag /> : <FlagOutlined />}
              size="small"
              sx={{ color: 'text.primary' }}
              onClick={handleFlagToggle}
            >
              {alert.isFlagged ? 'Flagged' : 'Flag'}
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // Default view with action hub functionality - Mobile design
  return (
    <Box sx={{ backgroundColor: '#fff', height: '100%', pb: 4 }}>
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
      </Box>

      {/* Time and Title */}
      <Box sx={{ px: 3, pt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {alert ? getTimeAgo(alert.createdAt) : ''}
        </Typography>
        
        <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, mb: 2 }}>
          {alert.title || 'Untitled Alert'}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 3 }}>
          {alert.description || 'No description available'}
        </Typography>
      </Box>

      {/* Details */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="bold">Location</Typography>
          <Typography variant="body2">{alert.city || 'Unknown location'}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="bold">Start Date</Typography>
          <Typography variant="body2">
            {alert.expectedStart ? format(new Date(alert.expectedStart), 'dd MMM h:mma') : '—'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="bold">End Date</Typography>
          <Typography variant="body2">
            {alert.expectedEnd ? format(new Date(alert.expectedEnd), 'dd MMM h:mma') : '—'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="body2" fontWeight="bold">Impact Level</Typography>
          <Typography variant="body2">{alert.impact || 'Not specified'}</Typography>
        </Box>
      </Box>

      {/* Forward Alert Section */}
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          FORWARD TO
        </Typography>
        
        <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
          <Select
            value={recipientType}
            onChange={handleRecipientChange}
            displayEmpty
          >
            <MenuItem value="guests">Guests</MenuItem>
            <MenuItem value="team">Team Members</MenuItem>
          </Select>
        </FormControl>
        
        {recipientType === 'guests' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Add Guest Details:
            </Typography>
            
            <TextField
              label="Guest Email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              fullWidth
              margin="dense"
              size="small"
              sx={{ mb: 1 }}
              disabled={isViewOnly()}
            />
            
            <TextField
              label="Guest Name (optional)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              fullWidth
              margin="dense"
              size="small"
              sx={{ mb: 1 }}
              disabled={isViewOnly()}
            />
            
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              onClick={handleAddGuest}
              disabled={!guestEmail.trim() || isViewOnly()}
            >
              Add Guest
            </Button>
            
            {/* Show list of added guests */}
            {alert.guests && alert.guests.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Guest List ({alert.guests.length}):
                  {notifiedGuestsCount > 0 && (
                    <Typography component="span" sx={{ ml: 1, color: 'success.main', fontSize: '0.8rem' }}>
                      {notifiedGuestsCount} notified
                    </Typography>
                  )}
                </Typography>
                
                <List dense sx={{ maxHeight: '150px', overflow: 'auto' }}>
                  {alert.guests.map((guest, index) => (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        py: 0.5,
                        bgcolor: selectedGuestIds.includes(guest._id) ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                      }}
                      secondaryAction={
                        <Box>
                          {guest.notificationSent ? (
                            <Tooltip title={`Notified on ${new Date(guest.sentTimestamp || '').toLocaleString()}`}>
                              <Done color="success" fontSize="small" />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Not notified yet">
                              <Email color="disabled" fontSize="small" />
                            </Tooltip>
                          )}
                        </Box>
                      }
                      onClick={() => {
                        // Don't allow selection for view-only users
                        if (isViewOnly()) return;
                        
                        // Toggle selection of this guest for resending
                        setSelectedGuestIds(prev => 
                          prev.includes(guest._id) 
                            ? prev.filter(id => id !== guest._id) 
                            : [...prev, guest._id]
                        );
                      }}
                    >
                      <ListItemText 
                        primary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                            {guest.email}
                            {guest.notificationSent && (
                              <Chip 
                                label="Sent" 
                                size="small" 
                                color="success" 
                                sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} 
                              />
                            )}
                          </Box>
                        }
                        secondary={guest.name || ''}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                {selectedGuestIds.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => handleResendToGuests(selectedGuestIds)}
                    disabled={isViewOnly()}
                  >
                    Resend to {selectedGuestIds.length} selected
                  </Button>
                )}
                
                {notifiedGuestsCount > 0 && notifiedGuestsCount < totalGuestsCount && (
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    size="small"
                    sx={{ mt: 1, ml: selectedGuestIds.length > 0 ? 1 : 0 }}
                    onClick={handleNotifyGuests}
                    disabled={isViewOnly()}
                  >
                    Notify Remaining ({totalGuestsCount - notifiedGuestsCount})
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
        
        {recipientType === 'team' && alert.teamMembers && alert.teamMembers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Team Members ({alert.teamMembers.length}):
              {notifiedTeamCount > 0 && (
                <Typography component="span" sx={{ ml: 1, color: 'success.main', fontSize: '0.8rem' }}>
                  Team notified
                </Typography>
              )}
            </Typography>
            <List dense sx={{ maxHeight: '150px', overflow: 'auto' }}>
              {alert.teamMembers.map((member, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        {member.name || member.email}
                        {notifiedTeamCount > 0 && (
                          <Chip 
                            label="Notified" 
                            size="small" 
                            color="success" 
                            sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={`${member.email} • ${member.role === 'manager' ? 'Manager' : 'Viewer'}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
            
            {notifiedTeamCount > 0 ? (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                size="small"
                sx={{ mt: 1 }}
                onClick={handleResendToTeam}
                disabled={isViewOnly()}
              >
                Resend to team
              </Button>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Team will be notified when you forward the alert
              </Typography>
            )}
          </Box>
        )}
        
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
          ADD INSTRUCTIONS
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Add instructions here..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
          disabled={isViewOnly()}
        />
        
        <Button
          variant="contained"
          fullWidth
          color="primary"
          startIcon={sendingNotification ? undefined : <Send />}
          onClick={handleForwardAlert}
          disabled={sendingNotification || 
            (recipientType === 'guests' && notifiedGuestsCount === totalGuestsCount && totalGuestsCount > 0) ||
            (recipientType === 'team' && notifiedTeamCount > 0) ||
            isViewOnly()}
          sx={{ 
            mt: 2,
            mb: 3,
            py: 1.5,
            bgcolor: 'black',
            '&:hover': { bgcolor: '#333' },
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}
        >
          {sendingNotification ? (
            <CircularProgress size={24} color="inherit" />
          ) : recipientType === 'guests' && notifiedGuestsCount === totalGuestsCount && totalGuestsCount > 0 ? (
            'ALL GUESTS NOTIFIED'
          ) : recipientType === 'team' && notifiedTeamCount > 0 ? (
            'TEAM NOTIFIED'
          ) : (
            'FORWARD ALERT'
          )}
        </Button>
        
        {/* Notification results */}
        {(notificationSuccessCount > 0 || notificationFailCount > 0) && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            {notificationSuccessCount > 0 && (
              <Chip
                icon={<Done />}
                label={`${notificationSuccessCount} sent successfully`}
                color="success"
                size="small"
              />
            )}
            {notificationFailCount > 0 && (
              <Chip
                icon={<Warning />}
                label={`${notificationFailCount} failed`}
                color="error"
                size="small"
              />
            )}
          </Box>
        )}
      </Box>

      {/* Activity Log */}
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          ACTIVITY LOG
        </Typography>
        
        {/* Status Chip */}
        <Box sx={{ mt: 2, mb: 3 }}>
          <Chip 
            label={
              alert.status === 'in_progress' ? 'In Progress' : 
              alert.status === 'handled' ? 'Handled' : 'New'
            }
            size="medium"
            sx={{ 
              bgcolor: 
                alert.status === 'in_progress' ? '#ff9800' : 
                alert.status === 'handled' ? '#4caf50' : '#2196f3',
              color: 'white',
              fontWeight: 'medium',
              px: 1
            }}
          />
        </Box>
        
        {logsLoading ? (
          <CircularProgress size={20} sx={{ my: 1 }} />
        ) : actionLogs.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            {actionLogs.slice(0, 5).map((log, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                {log.formattedDate || (log.timestamp && format(new Date(log.timestamp), 'dd MMM'))} {log.formattedTime || (log.timestamp && format(new Date(log.timestamp), 'h:mma'))} – {log.displayName} {log.actionDetails}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No activity logged yet.
          </Typography>
        )}
        
        {/* Action Buttons */}
        <Box sx={{ mt: 3 }}>
          {alert.status !== 'handled' && (
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleStatusChange('handled')}
              disabled={isViewOnly()}
              sx={{ 
                mb: 2,
                py: 1.5,
                borderColor: '#4caf50',
                color: '#4caf50',
                '&:hover': { borderColor: '#4caf50', bgcolor: 'rgba(76, 175, 80, 0.1)' },
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              Mark as Handled
            </Button>
          )}
          
          <Button
            variant="outlined"
            fullWidth
            onClick={handleFollowToggle}
            disabled={isViewOnly()}
            sx={{ 
              py: 1.5,
              borderColor: alert.isFollowing ? 'primary.main' : 'inherit',
              color: alert.isFollowing ? 'primary.main' : 'inherit',
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            {alert.isFollowing ? 'Unfollow Alert' : 'Follow Alert'}
          </Button>
        </Box>
      </Box>
=======
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
>>>>>>> 2945eb6 (Initial commit)
    </Box>
  );
};

export default ActionHubDetail; 