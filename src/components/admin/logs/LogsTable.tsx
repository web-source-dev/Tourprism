'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Box,
  Typography,
  Card,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Public as PublicIcon,
  Info as InfoIcon,
  Computer as ComputerIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

// Define the Log type
interface Log {
  _id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  action: string;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

interface LogsTableProps {
  logs: Log[];
}

// Helper function to get a friendly action name
const getFriendlyActionName = (action: string): string => {
  const actionMap: { [key: string]: string } = {
    'login': 'User Login',
    'logout': 'User Logout',
    'signup': 'New User Registration',
    'alert_created': 'Alert Created',
    'alert_updated': 'Alert Updated',
    'alert_followed': 'Alert Followed',
    'alert_unfollowed': 'Alert Unfollowed',
    'alert_flagged': 'Alert Flagged',
    'user_role_changed': 'User Role Changed',
    'user_restricted': 'User Access Restricted',
    'user_deleted': 'User Account Deleted',
    'profile_updated': 'Profile Updated',
    'action_hub_status_changed': 'Action Hub Status Changed',
    'password_reset': 'Password Reset Requested',
    'password_changed': 'Password Changed',
    'alert_liked': 'Alert Liked',
    'alert_shared': 'Alert Shared',
  };
  
  return actionMap[action] || action.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

interface Details {
  action: string;
  alertTitle?: string;
  followCount?: number;
  previousStatus?: string;
  newStatus?: string;
  targetUserName?: string;
  targetUserEmail?: string;
  previousRole?: string;
  newRole?: string;
}

// Helper function to format details in a user-friendly way
const formatDetails = (details: Details): React.ReactNode => {
  if (!details) return <Typography color="text.secondary">No details available</Typography>;
  
  // Format different types of activities based on action type
  if (details.action) {
    if (details.action === 'follow_started') {
      return (
        <Box sx={{ px: 1 }}>
          <Typography variant="body2">
            <strong>Action:</strong> Started following alert
          </Typography>
          {details.alertTitle && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Alert:</strong> {details.alertTitle}
            </Typography>
          )}
          {details.followCount !== undefined && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Total followers:</strong> {details.followCount}
            </Typography>
          )}
        </Box>
      );
    }
    if (details.action === 'follow_stopped') {
      return (
        <Box sx={{ px: 1 }}>
          <Typography variant="body2">
            <strong>Action:</strong> Stopped following alert
          </Typography>
          {details.alertTitle && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Alert:</strong> {details.alertTitle}
            </Typography>
          )}
        </Box>
      );
    }
    if (details.action === 'flag_added' || details.action === 'flag_removed') {
      return (
        <Box sx={{ px: 1 }}>
          <Typography variant="body2">
            <strong>Action:</strong> {details.action === 'flag_added' ? 'Flagged alert' : 'Removed flag from alert'}
          </Typography>
          {details.alertTitle && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Alert:</strong> {details.alertTitle}
            </Typography>
          )}
        </Box>
      );
    }
  }
  
  // If it's a status change
  if (details.previousStatus && details.newStatus) {
    return (
      <Box sx={{ px: 1 }}>
        <Typography variant="body2">
          <strong>Changed status from:</strong> {details.previousStatus.replace(/_/g, ' ')}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>To:</strong> {details.newStatus.replace(/_/g, ' ')}
        </Typography>
        {details.alertTitle && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>For alert:</strong> {details.alertTitle}
          </Typography>
        )}
      </Box>
    );
  }
  
  // For user role changes
  if (details.newRole || details.previousRole) {
    return (
      <Box sx={{ px: 1 }}>
        {details.targetUserName && (
          <Typography variant="body2">
            <strong>User:</strong> {details.targetUserName}
          </Typography>
        )}
        {details.targetUserEmail && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>Email:</strong> {details.targetUserEmail}
          </Typography>
        )}
        {details.previousRole && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>Previous role:</strong> {details.previousRole}
          </Typography>
        )}
        {details.newRole && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <strong>New role:</strong> {details.newRole}
          </Typography>
        )}
      </Box>
    );
  }
  
  // Default: Return formatted keys and values for any other details object
  return (
    <List dense sx={{ width: '100%' }}>
      {Object.entries(details).map(([key, value], index) => {
        // Skip technical keys or IDs unless necessary
        if (['__v', '_id'].includes(key)) return null;
        if (key.includes('Id') && typeof value === 'string' && value.length > 15) return null;
        
        // Format the key name to be more readable
        const friendlyKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/^./, str => str.toUpperCase());
        
        const displayValue = typeof value === 'object' ? 
          JSON.stringify(value) : 
          String(value).replace(/_/g, ' ');
          
        return (
          <React.Fragment key={index}>
            {index > 0 && <Divider variant="inset" component="li" />}
            <ListItem>
              <ListItemIcon>
                <InfoIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={friendlyKey}
                secondary={displayValue}
                primaryTypographyProps={{ fontWeight: 500, variant: 'body2' }}
              />
            </ListItem>
          </React.Fragment>
        );
      })}
    </List>
  );
};

// Component for expandable row
const LogRow: React.FC<{ log: Log }> = ({ log }) => {
  const [open, setOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string): { bg: string; color: string } => {
    // Group actions by category and color-code them
    if (action.includes('login') || action.includes('logout') || action.includes('signup')) {
      return { bg: '#e3f2fd', color: '#1565c0' }; // Authentication - blue
    } else if (action.includes('alert')) {
      return { bg: '#fff8e1', color: '#f57c00' }; // Alert actions - orange
    } else if (action.includes('user')) {
      return { bg: '#ffebee', color: '#c62828' }; // User management - red
    } else if (action.includes('action_hub')) {
      return { bg: '#e8f5e9', color: '#2e7d32' }; // Action hub - green
    } else {
      return { bg: '#f5f5f5', color: '#616161' }; // Other - grey
    }
  };

  // Get the first letter of user's name for the avatar
  const getInitial = (name: string | null) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <TableRow 
        sx={{ 
          '&:hover': { backgroundColor: '#f9f9f9' },
          cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell padding="checkbox">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Chip
            label={getFriendlyActionName(log.action)}
            size="small"
            sx={{
              bgcolor: getActionColor(log.action).bg,
              color: getActionColor(log.action).color,
              fontWeight: 500
            }}
          />
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: getActionColor(log.action).color }}>
              {getInitial(log.userName)}
            </Avatar>
            <Typography variant="body2">{log.userName || 'Unknown'}</Typography>
          </Box>
        </TableCell>
        <TableCell>{log.userEmail || 'N/A'}</TableCell>
        <TableCell>{formatDate(log.timestamp)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Card sx={{ m: 1, p: 2, backgroundColor: '#fafafa', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500, color: getActionColor(log.action).color }}>
                Activity Details
              </Typography>
              
              <Stack spacing={3}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                  <Box sx={{ flex: '1 1 50%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                      <PersonIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">User</Typography>
                        <Typography variant="body1">{log.userName || 'Unknown'} ({log.userEmail || 'No email'})</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                      <AccessTimeIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">When</Typography>
                        <Typography variant="body1">{formatDate(log.timestamp)}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <PublicIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">IP Address</Typography>
                        <Typography variant="body1">{log.ipAddress || 'Not available'}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ flex: '1 1 50%' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      height: '100%', 
                      p: 2, 
                      bgcolor: '#ffffff', 
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <DescriptionIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Action Information
                        </Typography>
                      </Box>
                      {formatDetails(log.details as Details)}
                    </Box>
                  </Box>
                </Stack>
                
                {log.userAgent && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <ComputerIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Device Information</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word', fontSize: '0.8rem' }}>
                        {log.userAgent}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Card>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const LogsTable: React.FC<LogsTableProps> = ({ logs }) => {
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table aria-label="logs table">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell padding="checkbox" />
            <TableCell sx={{ fontWeight: 'bold' }}>Activity</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.length > 0 ? (
            logs.map((log) => (
              <LogRow key={log._id} log={log} />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No activity logs found
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LogsTable; 