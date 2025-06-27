'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
  CircularProgress,
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  Card,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Close as CloseIcon, 
  History as HistoryIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Public as PublicIcon,
  Info as InfoIcon,
  Computer as ComputerIcon,
  Description as DescriptionIcon,
  FilterAlt as FilterAltIcon,
  RestartAlt as RestartAltIcon
} from '@mui/icons-material';
import { User } from '@/types';
import { getUserLogs, LogFilters } from '@/services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface UserActivityModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

// Log interface
interface Log {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details: unknown;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// Response interface for getUserLogs
interface LogsResponse {
  logs: Log[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

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

const UserActivityModal: React.FC<UserActivityModalProps> = ({ open, onClose, user }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState<LogFilters>({});

  const fetchUserLogs = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params: LogFilters = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'timestamp',
        sortOrder: 'desc',
        ...filters
      };
      
      const response = await getUserLogs(user._id, params) as LogsResponse;
      setLogs(response.logs);
      setTotalCount(response.pagination.total);
    } catch (err) {
      console.error('Error fetching user logs:', err);
      setError('Failed to load user activity logs');
    } finally {
      setLoading(false);
    }
  }, [user, page, rowsPerPage, filters]);

  useEffect(() => {
    if (user && open) {
      fetchUserLogs();
    }
  }, [user, open, fetchUserLogs]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionFilterChange = (event: SelectChangeEvent) => {
    setActionFilter(event.target.value);
  };

  const applyFilters = () => {
    const newFilters: LogFilters = {};
    
    if (actionFilter) {
      newFilters.action = actionFilter;
    }
    
    if (startDate) {
      newFilters.startDate = startDate.toISOString().split('T')[0];
    }
    
    if (endDate) {
      newFilters.endDate = endDate.toISOString().split('T')[0];
    }
    
    setFilters(newFilters);
    setPage(0);
  };

  const resetFilters = () => {
    setActionFilter('');
    setStartDate(null);
    setEndDate(null);
    setFilters({});
    setPage(0);
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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


  // Component for expandable log row
  const LogRow = ({ log }: { log: Log }) => {
    const [open, setOpen] = useState(false);
    
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
          <TableCell>{formatDate(log.timestamp)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Card sx={{ m: 1, p: 2, backgroundColor: '#fafafa', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500, color: getActionColor(log.action).color }}>
                  Activity Details
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: '1 1 50%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                      <PersonIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">User</Typography>
                        <Typography variant="body1">
                          {log.userName || user?.firstName || user?.email?.split('@')[0] || 'Unknown'}
                        </Typography>
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
                </Box>
                
                {log.userAgent && (
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <ComputerIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Device Information</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word', fontSize: '0.8rem' }}>
                          {log.userAgent}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Card>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  // Get active filters count for UI feedback
  const activeFiltersCount = Object.keys(filters).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          padding: 0,
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 2,
        bgcolor: '#f5f5f5'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            User Activity Log
            {user && <Typography component="span" variant="subtitle1" sx={{ ml: 1, color: 'text.secondary' }}>
              - {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
            </Typography>}
          </Typography>
        </Box>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      {/* Dashboard Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2, bgcolor: '#f9f9f9' }}>
        <Card elevation={0} sx={{ flex: '1 1 200px', bgcolor: '#f5f9ff', borderRadius: 2 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="primary">
              TOTAL ACTIVITIES
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', my: 1 }}>
              {totalCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total user actions recorded
            </Typography>
          </Box>
        </Card>
        
        <Card elevation={0} sx={{ flex: '1 1 200px', bgcolor: '#f9f9f9', borderRadius: 2 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              SHOWING
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', my: 1 }}>
              {logs.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activities in current view
            </Typography>
          </Box>
        </Card>
        
        <Card elevation={0} sx={{ flex: '1 1 200px', bgcolor: activeFiltersCount > 0 ? '#fff8e1' : '#f9f9f9', borderRadius: 2 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color={activeFiltersCount > 0 ? 'warning.main' : 'text.secondary'}>
              ACTIVE FILTERS
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', my: 1 }}>
              {activeFiltersCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeFiltersCount > 0 ? 'Filtered view active' : 'No filters applied'}
            </Typography>
          </Box>
        </Card>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 2, m: 2, mb: 0, backgroundColor: '#f9f9f9', borderRadius: 2 }} elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterAltIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Filter Activity Logs
          </Typography>
        </Box>
        
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2}
          alignItems="flex-start"
        >
          {/* Action Type Filter */}
          <FormControl sx={{ width: { xs: '100%', md: '30%' } }} size="small">
            <InputLabel id="activity-action-filter-label">Activity Type</InputLabel>
            <Select
              labelId="activity-action-filter-label"
              id="activity-action-filter"
              value={actionFilter}
              label="Activity Type"
              onChange={handleActionFilterChange}
            >
              <MenuItem value="">All Activities</MenuItem>
              <MenuItem value="login">Login</MenuItem>
              <MenuItem value="signup">Registration</MenuItem>
              <MenuItem value="logout">Logout</MenuItem>
              <MenuItem value="alert_created">Alert Created</MenuItem>
              <MenuItem value="alert_updated">Alert Updated</MenuItem>
              <MenuItem value="alert_followed">Alert Followed</MenuItem>
              <MenuItem value="alert_unfollowed">Alert Unfollowed</MenuItem>
              <MenuItem value="alert_flagged">Alert Flagged</MenuItem>
              <MenuItem value="profile_updated">Profile Updated</MenuItem>
              <MenuItem value="action_hub_status_changed">Action Hub Status Changed</MenuItem>
            </Select>
          </FormControl>

          {/* Date Range */}
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={2}
            sx={{ width: { xs: '100%', md: '60%' } }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: { width: '100%' }
                  } 
                }}
              />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="To Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: { width: '100%' }
                  } 
                }}
              />
            </LocalizationProvider>
          </Stack>
        </Stack>

        {/* Action buttons */}
        <Stack 
          direction="row" 
          spacing={2}
          sx={{ mt: 2 }}
          justifyContent="flex-end"
        >
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={resetFilters}
            startIcon={<RestartAltIcon />}
          >
            Reset Filters
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={applyFilters}
            startIcon={<FilterAltIcon />}
          >
            Apply Filters
          </Button>
        </Stack>

        {/* Active Filter Pills */}
        {activeFiltersCount > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.action && (
              <Chip 
                label={`Activity: ${filters.action.replace(/_/g, ' ')}`} 
                onDelete={() => {
                  setActionFilter('');
                  setFilters(prev => {
                    const { ...rest } = prev;
                    return rest;
                  });
                }}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            {filters.startDate && (
              <Chip 
                label={`From: ${filters.startDate}`} 
                onDelete={() => {
                  setStartDate(null);
                  setFilters(prev => {
                    const { ...rest } = prev;
                    return rest;
                  });
                }}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            {filters.endDate && (
              <Chip 
                label={`To: ${filters.endDate}`} 
                onDelete={() => {
                  setEndDate(null);
                  setFilters(prev => {
                    const { ...rest } = prev;
                    return rest;
                  });
                }}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        )}
      </Paper>
      
      <DialogContent sx={{ p: 0, height: '50vh', overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', p: 3 }}>
            <Typography variant="h6" color="text.secondary">
              No activity logs found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              {Object.keys(filters).length > 0 ? 
                'Try changing your filters or select a different date range' : 
                'There are no user activities to display at this time'}
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table aria-label="user logs table">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell padding="checkbox" />
                  <TableCell sx={{ fontWeight: 'bold' }}>Activity</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <LogRow key={log._id} log={log} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      
      <Divider />
      
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f9f9f9' }}>
        <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
          Showing {logs.length} of {totalCount} activities
        </Typography>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage=""
          sx={{ 
            '.MuiTablePagination-toolbar': { 
              pl: 0,
              minHeight: 'unset'
            }
          }}
        />
      </Box>
    </Dialog>
  );
};

export default UserActivityModal; 