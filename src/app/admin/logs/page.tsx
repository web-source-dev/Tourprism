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
import { useAuth } from '@/context/AuthContext';
import LogsTable from '@/components/admin/logs/LogsTable';
import { getAllLogs } from '@/services/api';
import InfoIcon from '@mui/icons-material/Info';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

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
  
  const { isAdmin } = useAuth();

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

  // Only admin users can access this page
  if (!isAdmin) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" color="error">
            Access Denied
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            You do not have permission to view this page.
          </Typography>
        </Box>
      </AdminLayout>
    );
  }

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

      {/* Logs Table */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {logs.length > 0 ? (
              <>
                <LogsTable logs={logs} />
                
                <TablePagination
                  rowsPerPageOptions={[20, 50, 100]}
                  component="div"
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            ) : (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No activity logs found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {Object.keys(filters).length > 0 ? 
                    'Try changing your filters or select a different date range' : 
                    'There are no user activities to display at this time'}
                </Typography>
              </Box>
            )}
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