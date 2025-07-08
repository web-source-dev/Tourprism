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
  Chip,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import {
  getAllSubscribers,
  updateSubscriberStatus,
  removeSubscriber,
  SubscriberFilters as SubscriberFiltersType,
  Subscriber
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function SubscribersManagement() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filters, setFilters] = useState<SubscriberFiltersType>({});
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const { isAdmin } = useAuth();

  // Modal states
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Permission check - only admin and manager can manage subscribers
  const canManageSubscribers = isAdmin;

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params: SubscriberFiltersType = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
        ...filters
      };

      const { subscribers: fetchedSubscribers, totalCount } = await getAllSubscribers(params);
      setSubscribers(fetchedSubscribers);
      setTotalCount(totalCount);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load subscribers',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, filters]);

  useEffect(() => {
    setFilters({});
    setSortBy('createdAt');
    setSortOrder('desc');
    fetchSubscribers();
  }, [fetchSubscribers]);

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

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, subscriber: Subscriber) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubscriber(subscriber);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedSubscriber(null);
  };

  const handleToggleStatus = async () => {
    if (!selectedSubscriber) return;
    
    setActionLoading(true);
    try {
      await updateSubscriberStatus(selectedSubscriber._id, !selectedSubscriber.isActive);
      
      // Update subscriber in the list
      setSubscribers(prevSubscribers => 
        prevSubscribers.map(sub => 
          sub._id === selectedSubscriber._id 
            ? { ...sub, isActive: !sub.isActive } 
            : sub
        )
      );
      
      setSnackbar({
        open: true,
        message: selectedSubscriber.isActive 
          ? 'Subscriber deactivated successfully' 
          : 'Subscriber activated successfully',
        severity: 'success'
      });
      handleCloseMenu();
    } catch (error) {
      console.error('Error updating subscriber status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update subscriber status',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubscriber = async () => {
    if (!selectedSubscriber) return;
    
    setActionLoading(true);
    try {
      await removeSubscriber(selectedSubscriber._id);
      
      // Remove subscriber from the list
      setSubscribers(prevSubscribers => 
        prevSubscribers.filter(sub => sub._id !== selectedSubscriber._id)
      );
      
      setSnackbar({
        open: true,
        message: 'Subscriber removed successfully',
        severity: 'success'
      });
      handleCloseMenu();
    } catch (error) {
      console.error('Error removing subscriber:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove subscriber',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not received';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? { bg: '#e8f5e9', color: '#2e7d32' } : { bg: '#ffebee', color: '#c62828' };
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Subscribers Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage weekly forecast subscribers
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Weekly Forecast Subscribers ({totalCount})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                These users receive weekly disruption forecasts via email
              </Typography>
            </Box>

            {/* Subscribers Table */}
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Sector</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Subscribed</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Last Forecast</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {subscriber.name || subscriber.email.split('@')[0]}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">{subscriber.email}</Typography>
                        </Box>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Typography variant="body2">{subscriber.sector || 'Not specified'}</Typography>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Chip
                          label={subscriber.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(subscriber.isActive).bg,
                            color: getStatusColor(subscriber.isActive).color,
                            fontWeight: 'medium'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatDate(subscriber.createdAt)}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Typography variant="body2">
                          {formatDate(subscriber.lastWeeklyForecastReceived)}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {canManageSubscribers && (
                          <IconButton
                            onClick={(event) => handleOpenMenu(event, subscriber)}
                            size="small"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            {subscribers.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No subscribers found
                </Typography>
              </Box>
            )}
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 20, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {selectedSubscriber && (
          <>
            <MenuItemComponent
              onClick={handleToggleStatus}
              disabled={actionLoading}
            >
              {selectedSubscriber.isActive ? (
                <>
                  <BlockIcon fontSize="small" sx={{ mr: 1 }} />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
                  Activate
                </>
              )}
            </MenuItemComponent>
            <Divider />
            <MenuItemComponent
              onClick={handleDeleteSubscriber}
              disabled={actionLoading}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Remove Subscriber
            </MenuItemComponent>
          </>
        )}
      </Menu>

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