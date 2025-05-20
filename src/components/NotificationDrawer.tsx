'use client';

import React, { useState, useEffect } from 'react';
import { 
  Drawer, Box, Typography, IconButton, List, ListItem, 
  ListItemText, Divider, SwipeableDrawer,
  Button
} from '@mui/material';
import { markAsRead, deleteNotification } from '../services/api';
import { Notification } from '../types';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationUpdate: () => void;
}
const NotificationDrawer = ({ open, onClose, notifications, onNotificationUpdate }: NotificationDrawerProps) => {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [visibleNotifications, setVisibleNotifications] = useState(10);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);

  // Filter notifications based on unread status
  const filteredNotifications = showUnreadOnly 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const displayedNotifications = filteredNotifications.slice(0, visibleNotifications);

  const handleMarkAsRead = async () => {
    if (!selectedNotification) return;
    
    try {
      await markAsRead(selectedNotification._id);
      setSelectedNotification(null);
      setActionDrawerOpen(false); // Close the action drawer
      onNotificationUpdate();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;
    
    try {
      await deleteNotification(selectedNotification._id);
      setSelectedNotification(null);
      setActionDrawerOpen(false); // Close the action drawer
      onNotificationUpdate();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleActionClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setActionDrawerOpen(true);
  };

  const handleLoadMore = () => {
    setVisibleNotifications(prev => prev + 10);
  };

  // Add auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      onNotificationUpdate();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [onNotificationUpdate]);

  // Custom time formatter
  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 380 },
          zIndex: 1000, // Ensure the drawer is on top of other elements
          bgcolor: '#fff'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.70801 9.99971C2.70801 10.311 2.84605 10.5998 2.97677 10.8167C3.11784 11.0507 3.30754 11.2923 3.51566 11.5279C3.93316 12.0004 4.4779 12.5079 5.00654 12.967C5.53828 13.4287 6.06819 13.8539 6.46405 14.1629C6.66231 14.3176 6.8277 14.4438 6.94387 14.5316C7.00198 14.5755 7.04781 14.6098 7.07933 14.6333L7.11563 14.6602L7.12527 14.6674L7.12861 14.6698C7.40653 14.8746 7.79814 14.8155 8.00286 14.5376C8.20757 14.2597 8.14824 13.8684 7.87035 13.6637L7.85975 13.6559L7.82637 13.6311C7.79686 13.6091 7.75317 13.5764 7.69734 13.5342C7.58565 13.4498 7.42553 13.3276 7.23317 13.1775C6.84778 12.8767 6.33603 12.4659 5.82612 12.0231C5.3131 11.5776 4.81619 11.112 4.45244 10.7002C4.42943 10.6742 4.40716 10.6486 4.38564 10.6235L16.6664 10.6235C17.0115 10.6235 17.2914 10.3436 17.2914 9.99847C17.2914 9.65329 17.0115 9.37347 16.6664 9.37347L4.38776 9.37347C4.40862 9.34913 4.43018 9.32436 4.45244 9.29917C4.81619 8.88745 5.3131 8.42176 5.82612 7.97627C6.33603 7.53347 6.84778 7.12272 7.23316 6.82192C7.42553 6.67177 7.58565 6.54961 7.69734 6.46523C7.75317 6.42305 7.79685 6.39035 7.82637 6.36835L7.85975 6.34354L7.87035 6.3357C8.14824 6.13097 8.20756 5.73974 8.00285 5.46184C7.79814 5.18392 7.40653 5.12484 7.12861 5.32956L7.12526 5.33203L7.11563 5.33916L7.07933 5.36614C7.04781 5.38964 7.00197 5.42395 6.94387 5.46784C6.8277 5.5556 6.6623 5.6818 6.46405 5.83654C6.06819 6.14552 5.53828 6.5707 5.00654 7.03245C4.4779 7.49151 3.93315 7.99899 3.51566 8.47155C3.30754 8.70712 3.11784 8.94872 2.97677 9.18274C2.84684 9.39829 2.70967 9.68494 2.70802 9.9941" fill="#212121"/>
</svg>
          </IconButton>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <IconButton 
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
        >
          {!showUnreadOnly ? (
         <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
         <rect x="2.5" y="2.5" width="21" height="21" rx="3.5" stroke="#E5E5E6"/>
         <path d="M9.35352 10.0834C9.35352 9.91079 9.49343 9.77087 9.66602 9.77087H16.3327C16.5053 9.77087 16.6452 9.91079 16.6452 10.0834C16.6452 10.256 16.5053 10.3959 16.3327 10.3959L9.66602 10.3959C9.49343 10.3959 9.35352 10.256 9.35352 10.0834Z" fill="#212121"/>
         <path d="M15.4993 13.3125L10.4993 13.3125C10.3268 13.3125 10.1868 13.1726 10.1868 13C10.1868 12.8275 10.3268 12.6875 10.4993 12.6875L15.4993 12.6875C15.6719 12.6875 15.8118 12.8275 15.8118 13C15.8118 13.1726 15.6719 13.3125 15.4993 13.3125Z" fill="#212121"/>
         <path d="M11.3327 15.6042C11.1601 15.6042 11.0202 15.7441 11.0202 15.9167C11.0202 16.0893 11.1601 16.2292 11.3327 16.2292L14.666 16.2292C14.8386 16.2292 14.9785 16.0893 14.9785 15.9167C14.9785 15.7441 14.8386 15.6042 14.666 15.6042L11.3327 15.6042Z" fill="#212121"/>
         </svg>         
          ):(
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="4" y="4" width="22" height="22" rx="4" fill="black"/>
<path d="M11.3535 12.0834C11.3535 11.9108 11.4934 11.7709 11.666 11.7709H18.3327C18.5053 11.7709 18.6452 11.9108 18.6452 12.0834C18.6452 12.256 18.5053 12.3959 18.3327 12.3959L11.666 12.3959C11.4934 12.3959 11.3535 12.256 11.3535 12.0834Z" fill="white"/>
<path d="M17.4993 15.3125L12.4993 15.3125C12.3268 15.3125 12.1868 15.1726 12.1868 15C12.1868 14.8275 12.3268 14.6875 12.4993 14.6875L17.4993 14.6875C17.6719 14.6875 17.8118 14.8275 17.8118 15C17.8118 15.1726 17.6719 15.3125 17.4993 15.3125Z" fill="white"/>
<path d="M13.3327 17.6042C13.1601 17.6042 13.0202 17.7441 13.0202 17.9167C13.0202 18.0893 13.1601 18.2292 13.3327 18.2292L16.666 18.2292C16.8386 18.2292 16.9785 18.0893 16.9785 17.9167C16.9785 17.7441 16.8386 17.6042 16.666 17.6042L13.3327 17.6042Z" fill="white"/>
</svg>
          )}
           </IconButton>
      </Box>
      <Divider />
      <List sx={{ p: 0 }}>
        {displayedNotifications.map((notification) => (
          <React.Fragment key={notification._id}>
            <ListItem 
              sx={{ 
                py: 2,
                px: 2,
                bgcolor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                '&:hover': { bgcolor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              <Box sx={{ width: '100%', p: 0 }}>
                <Typography variant="subtitle2">
                  {notification.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {notification.message}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(notification.createdAt)}
                </Typography>
                <IconButton
                  onClick={() => handleActionClick(notification)}
                  sx={{ ml: 'auto' }}
                >
                  <i className="ri-more-line"></i>
                </IconButton>
              </Box>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      {filteredNotifications.length > visibleNotifications && (
        <Box sx={{ p: 5, textAlign: 'center' }}>
          <Button 
            onClick={handleLoadMore} 
            fullWidth 
            variant="outlined" 
            sx={{
              border: '2px solid #eee',  // Black border
              borderRadius: 5,       // 10px border radius
              color: '#333',             // Black text color
              padding: '10px',            // Add some padding
              fontWeight: 'bold',         // Make text bold
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)' // Light black hover effect
              }
            }}
          >
            See More
          </Button>
        </Box>
      )}

      {notifications.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No notifications yet</Typography>
        </Box>
      )}

      <SwipeableDrawer
        anchor="bottom"
        open={actionDrawerOpen}
        onClose={() => {
          setActionDrawerOpen(false);
          setSelectedNotification(null); // Also clear the selected notification
        }}
        onOpen={() => {}}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: 2,
            width: { xs: '100%', sm: 380 },
            ml: { xs: 0, sm: 'auto' },
            mr: { xs: 0, sm: 0 }
          }
        }}
      >
        <List>
          {selectedNotification && !selectedNotification.isRead && (
            <ListItem onClick={handleMarkAsRead} sx={{ cursor: 'pointer',display:'flex',gap:2}}>
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.7944 7.92235C14.0276 7.6679 14.0104 7.27255 13.756 7.0393C13.5015 6.80606 13.1062 6.82325 12.8729 7.0777L8.73069 11.5965L7.10893 9.97475C6.86486 9.73067 6.46913 9.73067 6.22505 9.97475C5.98097 10.2188 5.98097 10.6146 6.22505 10.8586L8.30838 12.942C8.42893 13.0625 8.59347 13.1286 8.7639 13.1249C8.93433 13.1212 9.09586 13.048 9.21105 12.9224L13.7944 7.92235Z" fill="#616161"/>
<path clipRule="evenodd" clip-rule="evenodd" d="M10.0003 18.9584C5.05277 18.9584 1.04199 14.9476 1.04199 10C1.04199 5.05247 5.05277 1.04169 10.0003 1.04169C14.9479 1.04169 18.9587 5.05247 18.9587 10C18.9587 14.9476 14.9479 18.9584 10.0003 18.9584ZM2.29199 10C2.29199 14.2572 5.74313 17.7084 10.0003 17.7084C14.2575 17.7084 17.7087 14.2572 17.7087 10C17.7087 5.74283 14.2575 2.29169 10.0003 2.29169C5.74313 2.29169 2.29199 5.74283 2.29199 10Z" fill="#616161"/>
</svg>

              <ListItemText primary="Mark as read" />
            </ListItem>
          )}
          <ListItem onClick={handleDelete} sx={{ cursor: 'pointer',display:'flex',gap:2 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 9.15407C7.15482 9.15407 6.875 9.4339 6.875 9.77907C6.875 10.1243 7.15482 10.4041 7.5 10.4041H12.5C12.8452 10.4041 13.125 10.1243 13.125 9.77907C13.125 9.4339 12.8452 9.15407 12.5 9.15407H7.5Z" fill="#616161"/>
<path d="M8.75 12.4203C8.40482 12.4203 8.125 12.7001 8.125 13.0453C8.125 13.3904 8.40482 13.6703 8.75 13.6703H11.25C11.5952 13.6703 11.875 13.3904 11.875 13.0453C11.875 12.7001 11.5952 12.4203 11.25 12.4203H8.75Z" fill="#616161"/>
<path clipRule="evenodd" clip-rule="evenodd" d="M10.055 1.04169H10.0017C9.58059 1.04168 9.2234 1.04167 8.927 1.06865C8.61246 1.09728 8.31947 1.1593 8.03615 1.30995C7.92434 1.36941 7.81764 1.43803 7.71716 1.51511C7.46257 1.71042 7.28462 1.9513 7.1281 2.22563C6.9806 2.48415 6.83247 2.80915 6.65783 3.1923L6.30864 3.95835H2.5C2.15482 3.95835 1.875 4.23818 1.875 4.58336C1.875 4.92853 2.15482 5.20835 2.5 5.20835H3.16159L3.63192 12.9992C3.69478 14.0406 3.74467 14.867 3.84845 15.5271C3.95487 16.204 4.12599 16.7678 4.46924 17.2611C4.78324 17.7123 5.18779 18.0931 5.6571 18.3794C6.17011 18.6923 6.7432 18.8291 7.42532 18.8946C8.09046 18.9584 8.9183 18.9584 9.96152 18.9584H10.0263C11.0681 18.9584 11.895 18.9584 12.5593 18.8947C13.2406 18.8293 13.8131 18.6928 14.3258 18.3805C14.7948 18.0947 15.1992 17.7145 15.5133 17.2641C15.8566 16.7717 16.0283 16.2087 16.1355 15.5327C16.2401 14.8735 16.2911 14.0483 16.3554 13.0084L16.8376 5.20835H17.5C17.8452 5.20835 18.125 4.92853 18.125 4.58336C18.125 4.23818 17.8452 3.95835 17.5 3.95835H13.7712L13.3616 3.11342C13.1825 2.74389 13.0304 2.43016 12.8807 2.18076C12.7218 1.916 12.5431 1.68397 12.2916 1.49636C12.1922 1.42222 12.0869 1.35627 11.9769 1.29916C11.6983 1.15464 11.4116 1.09509 11.104 1.06758C10.8143 1.04167 10.4657 1.04168 10.055 1.04169ZM12.3821 3.95835H7.68238L7.78405 3.7353C7.97288 3.32104 8.09785 3.04834 8.21382 2.84508C8.3239 2.65213 8.40289 2.56451 8.47801 2.50688C8.52368 2.47184 8.57218 2.44065 8.62301 2.41363C8.70661 2.36917 8.81909 2.33364 9.04032 2.3135C9.27338 2.29229 9.57335 2.29169 10.0286 2.29169C10.4728 2.29169 10.7652 2.29226 10.9927 2.31261C11.2085 2.33191 11.3188 2.36598 11.4012 2.40872C11.4512 2.43468 11.4991 2.46466 11.5443 2.49836C11.6187 2.55384 11.6974 2.63826 11.809 2.82405C11.9265 3.01987 12.0546 3.28274 12.2483 3.68242L12.3821 3.95835ZM4.8777 12.8917L4.41387 5.20835H15.5852L15.1098 12.899C15.043 13.9784 14.995 14.7438 14.901 15.3369C14.8085 15.9199 14.6796 16.2742 14.488 16.5491C14.273 16.8573 13.9963 17.1175 13.6754 17.313C13.3892 17.4873 13.0277 17.594 12.44 17.6504C11.8423 17.7077 11.0754 17.7084 9.99395 17.7084C8.91112 17.7084 8.14319 17.7077 7.54469 17.6503C6.9563 17.5938 6.59435 17.4869 6.30799 17.3122C5.98688 17.1164 5.71009 16.8558 5.49524 16.5471C5.30364 16.2717 5.17508 15.9169 5.08328 15.333C4.9899 14.739 4.94296 13.9725 4.8777 12.8917Z" fill="#616161"/>
</svg>
            <ListItemText primary="Delete Notification" />
          </ListItem>
          <ListItem onClick={() => setActionDrawerOpen(false)} sx={{ cursor: 'pointer',display:'flex',gap:2 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path clipRule="evenodd" clip-rule="evenodd" d="M17.291 10C17.291 10.3452 17.0112 10.625 16.666 10.625L3.33268 10.625C2.9875 10.625 2.70768 10.3452 2.70768 10C2.70768 9.65482 2.9875 9.375 3.33268 9.375L16.666 9.375C17.0112 9.375 17.291 9.65482 17.291 10Z" fill="#616161"/>
</svg>
            <ListItemText primary="Show less like this" />
          </ListItem>
        </List>
      </SwipeableDrawer>
    </Drawer>
  );
};

export default NotificationDrawer; 