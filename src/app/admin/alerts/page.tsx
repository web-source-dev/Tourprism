'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  IconButton,
  MenuItem,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Snackbar,
  Alert,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Tooltip
} from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { 
  getAllAlertsAdmin, 
  updateAlertStatus, 
  deleteAlert, 
  archiveAlert, 
  duplicateAlert 
} from '@/services/api';
import { Alert as AlertType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import AlertFilters from '@/components/AlertFilters';
import AlertViewDialog from '@/components/AlertViewDialog';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ArchiveIcon from '@mui/icons-material/Archive';
import { formatStandardDateTime } from '@/utils/dateFormat';

// Define a more specific type for filters
interface FilterOptions {
  status?: string[];
  categories?: string[];
  types?: string[];
  city?: string;
  audience?: string[];
  priority?: string[];
  risk?: string[];
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  sortBy?: string;
}

// Define the FilterRecord type to match AlertFilters component expectations
interface FilterRecord {
  status?: string[];
  categories?: string[];
  types?: string[];
  audience?: string[];
  city?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  sortBy?: string;
}

export default function AlertsManagement() {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  
  // Dialog states
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [newStatus, setNewStatus] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin, isManager, isEditor } = useAuth();

  // Permission check functions
  const canCreateAlert = isAdmin || isManager || isEditor;
  const canUpdateStatus = isAdmin || isManager || isEditor;
  const canEditAlert = isAdmin || isManager || isEditor;
  const canDeleteAlert = isAdmin || isManager;
  const canArchiveAlert = isAdmin || isManager || isEditor;
  const canDuplicateAlert = isAdmin || isManager || isEditor;
  
  // Permission tooltips
  const createAlertTooltip = !canCreateAlert 
    ? "You don't have permission to create alerts" 
    : "";
  const updateStatusTooltip = !canUpdateStatus 
    ? "You don't have permission to update alert status" 
    : "";
  const editAlertTooltip = !canEditAlert 
    ? "You don't have permission to edit alerts" 
    : "";
  const deleteAlertTooltip = !canDeleteAlert 
    ? "You don't have permission to delete alerts" 
    : "";
  const archiveAlertTooltip = !canArchiveAlert
    ? "You don't have permission to archive alerts"
    : "";
  const duplicateAlertTooltip = !canDuplicateAlert
    ? "You don't have permission to duplicate alerts"
    : "";

  // Add a ref to track previous request params
  const prevRequestParams = React.useRef<string>('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | string[]> = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      // Add search query
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      // Add status filter
      if (activeFilters.status && activeFilters.status.length > 0) {
        params.status = activeFilters.status.join(',');
      }
      
      // Add category filter
      if (activeFilters.categories && activeFilters.categories.length > 0) {
        params.categories = activeFilters.categories.join(',');
      }
      
      // Add type filter
      if (activeFilters.types && activeFilters.types.length > 0) {
        params.types = activeFilters.types.join(',');
      }
      
      // Add city filter
      if (activeFilters.city) {
        params.city = activeFilters.city;
      }
      
      // Add audience filter
      if (activeFilters.audience && activeFilters.audience.length > 0) {
        params.audience = activeFilters.audience.join(',');
      }
      
      // Add priority filter
      if (activeFilters.priority && activeFilters.priority.length > 0) {
        params.priority = activeFilters.priority.join(',');
      }
      
      // Add risk filter
      if (activeFilters.risk && activeFilters.risk.length > 0) {
        params.risk = activeFilters.risk.join(',');
      }
      
      // Add date range - ensure we're sending valid ISO dates
      if (activeFilters.startDate) {
        // Check if it's a Date object or string
        if (activeFilters.startDate instanceof Date) {
          params.startDate = activeFilters.startDate.toISOString();
        } else {
          // If it's already a string, make sure it's a valid date before sending
          const date = new Date(activeFilters.startDate);
          if (!isNaN(date.getTime())) {
            params.startDate = date.toISOString();
          }
        }
      }
      
      if (activeFilters.endDate) {
        // Check if it's a Date object or string
        if (activeFilters.endDate instanceof Date) {
          // For end date, set it to the end of the day
          const endDate = new Date(activeFilters.endDate);
          endDate.setHours(23, 59, 59, 999);
          params.endDate = endDate.toISOString();
        } else {
          // If it's already a string, make sure it's a valid date before sending
          const date = new Date(activeFilters.endDate);
          if (!isNaN(date.getTime())) {
            date.setHours(23, 59, 59, 999);
            params.endDate = date.toISOString();
          }
        }
      }
      
      // Add sorting
      if (activeFilters.sortBy) {
        const [field, order] = activeFilters.sortBy.split(':');
        params.sortBy = field;
        params.sortOrder = order;
      }
      
      // Check if params have changed to avoid duplicate requests
      const paramsString = JSON.stringify(params);
      if (paramsString === prevRequestParams.current && alerts?.length > 0) {
        setLoading(false);
        return; // Skip duplicate requests
      }
      
      console.log('Sending params to backend:', params);
      prevRequestParams.current = paramsString;
      
      const { alerts: fetchedAlerts, totalCount } = await getAllAlertsAdmin(params);
      setAlerts(fetchedAlerts);
      setTotalCount(totalCount);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to load alerts. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to load alerts',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery, activeFilters, alerts.length]);

  // Use a ref to track if component is mounted
  const isMounted = React.useRef(true);
  
  // Clean up on unmount
  useEffect(() => {
    // Initial data fetch
    fetchAlerts();
    
    return () => {
      isMounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add separate effect for handling filter changes
  useEffect(() => {
    // Skip initial render
    if (prevRequestParams.current === '') {
      return;
    }
    
    // Add a debounce to prevent too many API calls
    const handler = setTimeout(() => {
      if (isMounted.current) {
        fetchAlerts();
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(handler);
  // Include only necessary dependencies to prevent unnecessary re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery, JSON.stringify(activeFilters)]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleFilterChange = (filters: FilterRecord) => {
    // Convert FilterRecord to FilterOptions if necessary
    const filterOptions: FilterOptions = {
      ...filters,
      // Since FilterOptions accepts string | Date | undefined but not null
      startDate: filters.startDate === null ? undefined : filters.startDate,
      endDate: filters.endDate === null ? undefined : filters.endDate
    };
    
    setActiveFilters(filterOptions);
    setPage(0);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setPage(0);
  };

  // Add this conversion function
  const convertToFilterRecord = (filters: FilterOptions) => {
    return {
      ...filters,
      startDate: filters.startDate instanceof Date ? filters.startDate : null,
      endDate: filters.endDate instanceof Date ? filters.endDate : null
    };
  };

  // Action handlers
  const handleViewClick = (alert: AlertType) => {
    setSelectedAlert(alert);
    setViewDialogOpen(true);
  };

  const handleStatusChangeClick = (alert: AlertType) => {
    setSelectedAlert(alert);
    setNewStatus(alert.status || 'pending');
    setStatusDialogOpen(true);
  };

  const handleEditClick = (alert: AlertType) => {
    // Force a full page navigation instead of client-side navigation
    window.location.href = `/admin/alerts/edit/${alert._id}`;
  };

  const handleDeleteClick = (alert: AlertType) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
  };

  const handleArchiveClick = (alert: AlertType) => {
    setSelectedAlert(alert);
    setArchiveDialogOpen(true);
  };

  const handleDuplicateClick = (alert: AlertType) => {
    setSelectedAlert(alert);
    setDuplicateDialogOpen(true);
  };

  // Confirmation handlers
  const handleConfirmDelete = async () => {
    if (!selectedAlert) return;
    
    setActionLoading(true);
    try {
      await deleteAlert(selectedAlert._id);
      setAlerts(alerts.filter(alert => alert._id !== selectedAlert._id));
      setSnackbar({
        open: true,
        message: 'Alert deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete alert',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleConfirmArchive = async () => {
    if (!selectedAlert) return;
    
    setActionLoading(true);
    try {
      const { alert } = await archiveAlert(selectedAlert._id);
      setAlerts(alerts.map(a => 
        a._id === selectedAlert._id 
          ? { ...a, ...alert }
          : a
      ));
      setSnackbar({
        open: true,
        message: 'Alert archived successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error archiving alert:', error);
      setSnackbar({
        open: true,
        message: 'Failed to archive alert',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setArchiveDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!selectedAlert) return;
    
    setActionLoading(true);
    try {
      const { alert } = await duplicateAlert(selectedAlert._id);
      setAlerts([alert, ...alerts]);
      setSnackbar({
        open: true,
        message: 'Alert duplicated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error duplicating alert:', error);
      setSnackbar({
        open: true,
        message: 'Failed to duplicate alert',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setDuplicateDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedAlert || !newStatus) return;
    
    setActionLoading(true);
    try {
      await updateAlertStatus(selectedAlert._id, newStatus);
      setAlerts(alerts.map(alert => 
        alert._id === selectedAlert._id 
          ? { ...alert, status: newStatus } 
          : alert
      ));
      setSnackbar({
        open: true,
        message: `Alert status updated to ${newStatus}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating alert status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update alert status',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
      setStatusDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRetry = () => {
    fetchAlerts();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'rejected':
        return { bg: '#ffebee', color: '#c62828' };
      case 'archived':
        return { bg: '#e0e0e0', color: '#616161' };
      case 'deleted':
        return { bg: '#ef9a9a', color: '#b71c1c' };
      default:
        return { bg: '#fff8e1', color: '#f57f17' };
    }
  };

  // Helper function to format date range
  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return 'N/A';
    if (startDate && !endDate) return `From ${formatStandardDateTime(startDate)}`;
    if (!startDate && endDate) return `Until ${formatStandardDateTime(endDate)}`;
    return `${formatStandardDateTime(startDate || '')} - ${formatStandardDateTime(endDate || '')}`;
  };

  // Mobile card view for alerts
  const renderAlertCards = () => {
    if (alerts.length === 0) {
      return (
        <Typography variant="body1" sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
          No alerts found
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {alerts.map(alert => (
          <Card 
            key={alert._id} 
            elevation={0} 
            sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.08)'
              }
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {alert.title || alert.description.substring(0, 30)}
                </Typography>
                <Chip
                  label={alert.status?.charAt(0).toUpperCase() + (alert.status?.slice(1) || '')}
                  size="small"
                  sx={{
                    bgcolor: getStatusColor(alert.status || 'pending').bg,
                    color: getStatusColor(alert.status || 'pending').color,
                    fontWeight: 'medium'
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Category:</Typography>
                  <Typography variant="body2">{alert.alertCategory || 'General'}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Priority:</Typography>
                  <Typography variant="body2">{alert.priority || 'N/A'}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Location:</Typography>
                  <Typography variant="body2">{alert.city || 'Unknown'}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Timeframe:</Typography>
                  <Typography variant="body2" sx={{ maxWidth: '170px', textAlign: 'right' }}>
                    {formatDateRange(alert.expectedStart as string, alert.expectedEnd as string)}
                  </Typography>
                </Box>
                  
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Last updated:</Typography>
                  <Typography variant="body2">
                    {formatStandardDateTime(alert.updated || alert.updatedAt)}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {Array.isArray(alert.targetAudience) && alert.targetAudience.map((audience, idx) => (
                  <Chip 
                    key={idx} 
                    label={audience} 
                    size="small" 
                    variant="outlined" 
                    sx={{ borderRadius: '4px' }}
                  />
                ))}
                
                {typeof alert.targetAudience === 'string' && alert.targetAudience && (
                  <Chip 
                    label={alert.targetAudience} 
                    size="small" 
                    variant="outlined" 
                    sx={{ borderRadius: '4px' }}
                  />
                )}
              </Box>
              
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Tooltip title="View details">
                  <IconButton 
                    size="small" 
                    onClick={() => handleViewClick(alert)}
                    sx={{ 
                      color: theme.palette.primary.main,
                      border: `1px solid ${theme.palette.primary.main}`,
                      borderRadius: '4px',
                      padding: '4px 8px',
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={updateStatusTooltip || "Update status"}>
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleStatusChangeClick(alert)}
                      disabled={!canUpdateStatus}
                      sx={{ 
                        borderColor: '#ccc', 
                        color: '#555',
                        '&:hover': { borderColor: '#999', backgroundColor: '#f5f5f5' }
                      }}
                    >
                      Update Status
                    </Button>
                  </span>
                </Tooltip>
                
                <Tooltip title={editAlertTooltip || "Edit alert"}>
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditClick(alert)}
                      disabled={!canEditAlert}
                      sx={{ 
                        border: `1px solid ${theme.palette.primary.main}`,
                        borderRadius: '4px',
                        padding: '4px 8px',
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title={archiveAlertTooltip || "Archive alert"}>
                  <span>
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => handleArchiveClick(alert)}
                      disabled={!canArchiveAlert}
                      sx={{ 
                        border: `1px solid ${theme.palette.text.secondary}`,
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: theme.palette.text.secondary
                      }}
                    >
                      <ArchiveIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title={duplicateAlertTooltip || "Duplicate alert"}>
                  <span>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleDuplicateClick(alert)}
                      disabled={!canDuplicateAlert}
                      sx={{ 
                        border: `1px solid ${theme.palette.info.main}`,
                        borderRadius: '4px',
                        padding: '4px 8px',
                      }}
                    >
                      <FileCopyIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                
                <Tooltip title={deleteAlertTooltip || "Delete alert"}>
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(alert)}
                      disabled={!canDeleteAlert}
                      sx={{ 
                        border: `1px solid ${theme.palette.error.main}`,
                        borderRadius: '4px',
                        padding: '4px 8px',
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  // Desktop table view for alerts
  const renderAlertTable = () => {
    return (
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Timeframe</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Priority/Risk</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Audience</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <TableRow key={alert._id} hover>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Typography noWrap title={alert.title || alert.description.substring(0, 30)}>
                      {alert.title || alert.description.substring(0, 30)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={alert.status?.charAt(0).toUpperCase() + (alert.status?.slice(1) || '')}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(alert.status || 'pending').bg,
                        color: getStatusColor(alert.status || 'pending').color,
                        fontWeight: 'medium'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    {formatDateRange(alert.expectedStart as string, alert.expectedEnd as string)}
                  </TableCell>
                  <TableCell>
                    {alert.alertCategory || 'General'}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {alert.priority || 'N/A'}
                      </Typography>
                      {alert.risk && (
                        <Typography variant="caption" color="text.secondary">
                          Risk: {alert.risk}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{alert.city || 'Unknown'}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {Array.isArray(alert.targetAudience) && alert.targetAudience.map((audience, idx) => (
                        <Chip 
                          key={idx} 
                          label={audience} 
                          size="small" 
                          variant="outlined" 
                          sx={{ borderRadius: '4px' }}
                        />
                      ))}
                      
                      {typeof alert.targetAudience === 'string' && alert.targetAudience && (
                        <Chip 
                          label={alert.targetAudience} 
                          size="small" 
                          variant="outlined" 
                          sx={{ borderRadius: '4px' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2">
                      {formatStandardDateTime(alert.updated || alert.updatedAt)}
                    </Typography>
                    {alert.updatedBy && (
                      <Typography variant="caption" color="text.secondary">
                        by {alert.updatedBy}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View details">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewClick(alert)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={editAlertTooltip || "Edit alert"}>
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditClick(alert)}
                            disabled={!canEditAlert}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      
                      <Tooltip title={archiveAlertTooltip || "Archive alert"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleArchiveClick(alert)}
                            disabled={!canArchiveAlert}
                          >
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      
                      <Tooltip title={duplicateAlertTooltip || "Duplicate alert"}>
                        <span>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleDuplicateClick(alert)}
                            disabled={!canDuplicateAlert}
                          >
                            <FileCopyIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      
                      <Tooltip title={deleteAlertTooltip || "Delete alert"}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(alert)}
                            disabled={!canDeleteAlert}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No alerts found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Error display component
  const renderError = () => (
    <Box sx={{ textAlign: 'center', p: 4 }}>
      <Typography variant="h6" color="error" sx={{ mb: 2 }}>
        {error}
      </Typography>
      <Button 
        variant="contained" 
        onClick={handleRetry}
        startIcon={<i className="ri-refresh-line" />}
      >
        Try Again
      </Button>
    </Box>
  );

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Alerts Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View, filter and manage all alerts
        </Typography>
      </Box>

      {/* Alert Filters Component */}
      <AlertFilters
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        onClearFilters={handleClearFilters}
        appliedFilters={convertToFilterRecord(activeFilters)}
      />

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title={createAlertTooltip}>
            <span>
              <Button
                variant="contained"
                color="primary"
                startIcon={<i className="ri-add-line" />}
                onClick={() => window.location.href = '/admin/alerts/create'}
                disabled={!canCreateAlert}
              >
                Create New Alert
              </Button>
            </span>
          </Tooltip>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          renderError()
        ) : (
          <>
            {/* Switch between mobile card view and desktop table view */}
            {isMobile ? renderAlertCards() : renderAlertTable()}
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
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

      {/* View Alert Dialog */}
      <AlertViewDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        alertId={selectedAlert?._id || null}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
        title="Confirm Deletion"
        message="Are you sure you want to delete this alert? This action cannot be undone."
        confirmButtonText="Delete"
        confirmButtonColor="error"
        alert={selectedAlert}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        open={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        onConfirm={handleConfirmArchive}
        loading={actionLoading}
        title="Confirm Archive"
        message="Are you sure you want to archive this alert? It will be moved to the archive view."
        confirmButtonText="Archive"
        confirmButtonColor="warning"
        alert={selectedAlert}
      />

      {/* Duplicate Confirmation Dialog */}
      <ConfirmationDialog
        open={duplicateDialogOpen}
        onClose={() => setDuplicateDialogOpen(false)}
        onConfirm={handleConfirmDuplicate}
        loading={actionLoading}
        title="Confirm Duplication"
        message="Are you sure you want to duplicate this alert? A new alert with the same content will be created."
        confirmButtonText="Duplicate"
        confirmButtonColor="info"
        alert={selectedAlert}
      />

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => !actionLoading && setStatusDialogOpen(false)}
      >
        <DialogTitle>Update Alert Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Choose a new status for this alert.
          </DialogContentText>
          {selectedAlert && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {selectedAlert.title || selectedAlert.description.substring(0, 30)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAlert.city}
              </Typography>
            </Box>
          )}
          <FormControl fullWidth>
            <InputLabel id="new-status-label">Status</InputLabel>
            <Select
              labelId="new-status-label"
              id="new-status"
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value as string)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button 
            onClick={handleConfirmStatusChange} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : undefined}
          >
            {actionLoading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
} 