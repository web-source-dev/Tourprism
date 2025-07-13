'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TablePagination,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
  Card,
  CardContent,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AdminLayout from '@/components/AdminLayout';
import { getAllLogs } from '@/services/api';
import InfoIcon from '@mui/icons-material/Info';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Avatar from '@mui/material/Avatar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';

// Define the Log type
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

// Filter types
interface LogFilters {
  action?: string;
  userId?: string;
  userEmail?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Define the response type from the API
interface LogsResponse {
  logs: Log[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Helper functions for action names and colors
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
  return actionMap[action] || action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
const getActionColor = (action: string): { bg: string; color: string } => {
  if (action.includes('login') || action.includes('logout') || action.includes('signup')) {
    return { bg: '#e3f2fd', color: '#1565c0' };
  } else if (action.includes('alert')) {
    return { bg: '#fff8e1', color: '#f57c00' };
  } else if (action.includes('user')) {
    return { bg: '#ffebee', color: '#c62828' };
  } else if (action.includes('action_hub')) {
    return { bg: '#e8f5e9', color: '#2e7d32' };
  } else {
    return { bg: '#f5f5f5', color: '#616161' };
  }
};
const getInitial = (name: string | null) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};
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


// Helper to render details as vertical list with nested support
const renderDetailsList = (details: unknown, indent: number = 0): React.ReactNode => {
  if (!details || (typeof details === 'object' && Object.keys(details).length === 0)) {
    return <div style={{ color: '#888', fontStyle: 'italic' }}>No details found</div>;
  }
  if (typeof details === 'string' || typeof details === 'number' || typeof details === 'boolean') {
    return <div style={{ marginLeft: indent }}>{String(details)}</div>;
  }
  if (Array.isArray(details)) {
    return details.length === 0 ? (
      <div style={{ color: '#888', fontStyle: 'italic' }}>No details found</div>
    ) : (
      <>
        {details.map((item, idx) => (
          <div key={idx} style={{ marginLeft: indent }}>{renderDetailsList(item, indent + 16)}</div>
        ))}
      </>
    );
  }
  // Object: render each key-value pair
  return (
    <>
      {Object.entries(details).map(([key, value], idx) => (
        typeof value === 'object' && value !== null ? (
          <div key={idx} style={{ marginLeft: indent }}>
            <span style={{ fontWeight: 600 }}>{key}:</span>
            <div style={{ marginLeft: 16 }}>{renderDetailsList(value, indent + 16)}</div>
          </div>
        ) : (
          <div key={idx} style={{ marginLeft: indent }}>
            <span style={{ fontWeight: 600 }}>{key}:</span> {String(value)}
          </div>
        )
      ))}
    </>
  );
};

export default function LogsManagement() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filters, setFilters] = useState<LogFilters>({});
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  
  // Filter state
  const [actionFilter, setActionFilter] = useState<string>('');
  const [emailFilter, setEmailFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  

  // Fetch logs with the current filters
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: LogFilters = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
        ...filters
      };

      const response = await getAllLogs(params) as LogsResponse;
      setLogs(response.logs);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load logs',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, filters]);

  useEffect(() => {
    setSortBy('timestamp');
    setSortOrder('desc');
    fetchLogs();

  }, [fetchLogs]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const applyFilters = () => {
    const newFilters: LogFilters = {};
    
    if (actionFilter) {
      newFilters.action = actionFilter;
    }
    
    if (emailFilter) {
      newFilters.userEmail = emailFilter;
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
    setEmailFilter('');
    setStartDate(null);
    setEndDate(null);
    setFilters({});
    setPage(0);
  };

  // Get active filters count for UI feedback
  const activeFiltersCount = Object.keys(filters).length;

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          User Activity Log
          <Tooltip title="Track all user actions across the platform">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor user activity and system events in real-time
        </Typography>
      </Box>

      {/* Dashboard Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 300px' }}>
          <Card elevation={0} sx={{ bgcolor: '#f5f9ff', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary">
                TOTAL RECORDS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                {totalCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                User activities tracked
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 300px' }}>
          <Card elevation={0} sx={{ bgcolor: '#f9f9f9', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                SHOWING
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                {logs.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activities in current view
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 300px' }}>
          <Card elevation={0} sx={{ bgcolor: activeFiltersCount > 0 ? '#fff8e1' : '#f9f9f9', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color={activeFiltersCount > 0 ? 'warning.main' : 'text.secondary'}>
                ACTIVE FILTERS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', my: 1 }}>
                {activeFiltersCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeFiltersCount > 0 ? 'Filtered view active' : 'No filters applied'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f9f9f9', borderRadius: 2 }} elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterAltIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Filter Activity Logs
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Stack spacing={3}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={2}
            alignItems="flex-start"
          >
            {/* Action Type Filter */}
            <FormControl sx={{ width: { xs: '100%', md: '30%' } }} size="small">
              <InputLabel id="action-filter-label">Activity Type</InputLabel>
              <Select
                labelId="action-filter-label"
                id="action-filter"
                value={actionFilter}
                label="Activity Type"
                onChange={(e) => setActionFilter(e.target.value)}
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
                <MenuItem value="user_role_changed">Role Changed</MenuItem>
                <MenuItem value="user_restricted">User Restricted</MenuItem>
                <MenuItem value="user_deleted">User Deleted</MenuItem>
                <MenuItem value="profile_updated">Profile Updated</MenuItem>
                <MenuItem value="action_hub_status_changed">Action Hub Status Changed</MenuItem>
              </Select>
            </FormControl>

            {/* User Email Filter */}
            <TextField
              label="User Email"
              variant="outlined"
              size="small"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              sx={{ width: { xs: '100%', md: '30%' } }}
              InputProps={{
                endAdornment: (
                  <SearchIcon color="action" fontSize="small" />
                ),
              }}
            />

            {/* Date Range */}
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={2}
              sx={{ width: { xs: '100%', md: '40%' } }}
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

          {/* Action Buttons */}
          <Stack 
            direction="row" 
            spacing={2}
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
        </Stack>

        {/* Active Filter Pills */}
        {activeFiltersCount > 0 && (
          <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
            {filters.userEmail && (
              <Chip 
                label={`Email: ${filters.userEmail}`} 
                onDelete={() => {
                  setEmailFilter('');
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

      {/* Logs Card Grid */}
      <Paper sx={{ p: 0, mb: 3, borderRadius: 3 }} elevation={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: { xs: 'nowrap', sm: 'wrap' },
              gap: { xs: 2, sm: 3 },
              justifyContent: 'flex-start',
            }}>
              {logs.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', width: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    No activity logs found
                  </Typography>
                </Box>
              ) : (
                logs.map((log) => (
                  <Card key={log._id} sx={{
                    width: { xs: '100%', sm: 340 },
                    minWidth: { xs: '100%', sm: 320 },
                    maxWidth: { xs: '100%', sm: 350 },
                    flex: { xs: 'none', sm: '1 1 320px' },
                    boxShadow: 0,
                    border: '1px solid #e0e0e0',
                    borderRadius: 4,
                    mb: { xs: 0, sm: 2 },
                    p: 0,
                    position: 'relative',
                    overflow: 'visible',
                  }}>
                    <CardContent sx={{ pb: 1.5, pt: 2, px: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{
                          bgcolor: getActionColor(log.action).color,
                          color: '#fff',
                          width: { xs: 40, sm: 44 },
                          height: { xs: 40, sm: 44 },
                          mr: 2,
                        }}>
                          {getInitial(log.userName)}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="h6" sx={{
                            fontWeight: 'bold',
                            mb: 0.5,
                            fontSize: { xs: '1rem', sm: '1.15rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {log.userName || 'Unknown'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {log.userEmail || 'N/A'}
                          </Typography>
                        </Box>
                        <Chip
                          label={getFriendlyActionName(log.action)}
                          size="small"
                          sx={{
                            bgcolor: getActionColor(log.action).bg,
                            color: getActionColor(log.action).color,
                            fontWeight: 500,
                            ml: 1,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {formatDate(log.timestamp)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <DescriptionIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Details
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 1, p: 1, fontFamily: 'monospace', fontSize: '0.95em', mt: 1 }}>
                          {renderDetailsList(log.details)}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
            {/* Pagination Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[20, 50, 100]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          </>
        )}
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
} 