'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  Tabs,
  Tab,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AdminLayout from '@/components/AdminLayout';
import { 
  getAutomatedAlerts, 
  bulkApproveAlerts, 
  bulkRejectAlerts, 
  approveAlert, 
  rejectAlert, 
  triggerAlertGeneration,
  type AutomatedAlert,
  type AlertSummary
} from '@/services/automatedAlerts';

// Filter interface
interface Filters {
  search: string;
  category: string;
  location: string;
  impact: string;
  status: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  showExpired: boolean;
}

export default function AutomatedAlertsManagement() {
  const [activeTab, setActiveTab] = useState(0);
  const [alerts, setAlerts] = useState<AutomatedAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AutomatedAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [bulkActionDialog, setBulkActionDialog] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    location: '',
    impact: '',
    status: '',
    dateFrom: null,
    dateTo: null,
    showExpired: false
  });

  // Get unique values for filter options
  const categories = Array.from(new Set(alerts.map(alert => alert.alertCategory).filter(Boolean)));
  const locations = Array.from(new Set(alerts.map(alert => alert.originCity).filter(Boolean)));
  const impacts = ['Low', 'Moderate', 'High'];
  const statuses = ['pending', 'approved', 'rejected'];

  const statusMap = {
    0: 'pending',
    1: 'approved',
    2: 'rejected'
  };

  const fetchAlerts = async (status: string = 'all') => {
    try {
      setLoading(true);
      const response = await getAutomatedAlerts({ status });
      setAlerts(response.alerts);
      setFilteredAlerts(response.alerts);
      setSummary(response.summary);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setMessage({ type: 'error', text: 'Failed to fetch alerts' });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to alerts
  const applyFilters = () => {
    let filtered = [...alerts];

    // Search filter (title, description, city)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title?.toLowerCase().includes(searchLower) ||
        alert.description?.toLowerCase().includes(searchLower) ||
        alert.originCity?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(alert => alert.alertCategory === filters.category);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(alert => alert.originCity === filters.location);
    }

    // Impact filter
    if (filters.impact) {
      filtered = filtered.filter(alert => alert.impact === filters.impact);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(alert => alert.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(alert => 
        new Date(alert.createdAt) >= filters.dateFrom!
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(alert => 
        new Date(alert.createdAt) <= filters.dateTo!
      );
    }

    // Expired filter
    if (!filters.showExpired) {
      const now = new Date();
      filtered = filtered.filter(alert => 
        !alert.expectedEnd || new Date(alert.expectedEnd) >= now
      );
    }

    setFilteredAlerts(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      impact: '',
      status: '',
      dateFrom: null,
      dateTo: null,
      showExpired: false
    });
  };

  // Update filters and apply
  const handleFilterChange = (key: keyof Filters, value: string | Date | boolean | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [filters, alerts]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    const status = statusMap[newValue as keyof typeof statusMap];
    fetchAlerts(status);
    setSelectedAlerts([]);
    clearFilters();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAlerts(filteredAlerts.map(alert => alert._id));
    } else {
      setSelectedAlerts([]);
    }
  };

  const handleSelectAlert = (alertId: string, checked: boolean) => {
    if (checked) {
      setSelectedAlerts(prev => [...prev, alertId]);
    } else {
      setSelectedAlerts(prev => prev.filter(id => id !== alertId));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedAlerts.length === 0) return;

    setActionLoading(true);
    try {
      if (action === 'approve') {
        await bulkApproveAlerts({
          alertIds: selectedAlerts,
          reason: approvalReason
        });
        setMessage({ type: 'success', text: `Successfully approved ${selectedAlerts.length} alerts` });
      } else {
        if (!rejectionReason.trim()) {
          setMessage({ type: 'error', text: 'Rejection reason is required' });
          return;
        }
        await bulkRejectAlerts({
          alertIds: selectedAlerts,
          reason: rejectionReason
        });
        setMessage({ type: 'success', text: `Successfully rejected ${selectedAlerts.length} alerts` });
      }
      
      setBulkActionDialog(null);
      setSelectedAlerts([]);
      setRejectionReason('');
      setApprovalReason('');
      fetchAlerts(statusMap[activeTab as keyof typeof statusMap]);
    } catch (error) {
      console.error(`Error ${action}ing alerts:`, error);
      setMessage({ type: 'error', text: `Failed to ${action} alerts` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleAction = async (alertId: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(true);
    try {
      if (action === 'approve') {
        await approveAlert(alertId, reason);
        setMessage({ type: 'success', text: 'Alert approved successfully' });
      } else {
        if (!reason?.trim()) {
          setMessage({ type: 'error', text: 'Rejection reason is required' });
          return;
        }
        await rejectAlert(alertId, reason);
        setMessage({ type: 'success', text: 'Alert rejected successfully' });
      }
      fetchAlerts(statusMap[activeTab as keyof typeof statusMap]);
    } catch (error) {
      console.error(`Error ${action}ing alert:`, error);
      setMessage({ type: 'error', text: `Failed to ${action} alert` });
    } finally {
      setActionLoading(false);
    }
  };

  const triggerGeneration = async () => {
    setActionLoading(true);
    try {
      await triggerAlertGeneration();
      setMessage({ type: 'success', text: 'Alert generation triggered successfully' });
      fetchAlerts(statusMap[activeTab as keyof typeof statusMap]);
    } catch (error) {
      console.error('Error triggering generation:', error);
      setMessage({ type: 'error', text: 'Failed to trigger alert generation' });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'error';
      case 'Moderate': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'Low': return 'Low';
      case 'Moderate': return 'Moderate';
      case 'High': return 'High';
      default: return impact;
    }
  };

  return (
    <AdminLayout>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ py: 3, px: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Automated Alerts Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={triggerGeneration}
              disabled={actionLoading}
            >
              Trigger Generation
            </Button>
          </Box>

          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip
                  label={`Pending: ${summary.pending}`}
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  label={`Approved: ${summary.approved}`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`Rejected: ${summary.rejected}`}
                  color="error"
                  variant="outlined"
                />
                <Chip
                  label={`Total: ${summary.total}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab 
                  label={
                    <Badge badgeContent={summary.pending} color="warning">
                      Pending
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={summary.approved} color="success">
                      Published
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={summary.rejected} color="error">
                      Rejected
                    </Badge>
                  } 
                />
              </Tabs>
            </CardContent>
          </Card>

          {/* Filters Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Filters
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    disabled={!Object.values(filters).some(val => val !== '' && val !== null && val !== false)}
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>

              <Collapse in={showFilters}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Search Field */}
                  <Box sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      label="Search Alerts"
                      placeholder="Search by title, description, or city..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  {/* Category and Location Filters Row */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 250 }}>
                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={filters.category}
                          label="Category"
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                          <MenuItem value="">All Categories</MenuItem>
                          {categories.map((category) => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 250 }}>
                      <FormControl fullWidth>
                        <InputLabel>Location</InputLabel>
                        <Select
                          value={filters.location}
                          label="Location"
                          onChange={(e) => handleFilterChange('location', e.target.value)}
                        >
                          <MenuItem value="">All Locations</MenuItem>
                          {locations.map((location) => (
                            <MenuItem key={location} value={location}>
                              {location}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  {/* Impact and Status Filters Row */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 250 }}>
                      <FormControl fullWidth>
                        <InputLabel>Impact Level</InputLabel>
                        <Select
                          value={filters.impact}
                          label="Impact Level"
                          onChange={(e) => handleFilterChange('impact', e.target.value)}
                        >
                          <MenuItem value="">All Impact Levels</MenuItem>
                          {impacts.map((impact) => (
                            <MenuItem key={impact} value={impact}>
                              {getImpactLabel(impact)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 250 }}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={filters.status}
                          label="Status"
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                          <MenuItem value="">All Statuses</MenuItem>
                          {statuses.map((status) => (
                            <MenuItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  {/* Date Range Filters */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <DatePicker
                        label="From Date"
                        value={filters.dateFrom}
                        onChange={(date) => handleFilterChange('dateFrom', date)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <DatePicker
                        label="To Date"
                        value={filters.dateTo}
                        onChange={(date) => handleFilterChange('dateTo', date)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    </Box>
                  </Box>

                  {/* Show Expired Toggle */}
                  <Box sx={{ width: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filters.showExpired}
                          onChange={(e) => handleFilterChange('showExpired', e.target.checked)}
                        />
                      }
                      label="Show Expired Alerts"
                    />
                  </Box>
                </Box>

                {/* Filter Summary */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredAlerts.length} of {alerts.length} alerts
                    {Object.values(filters).some(val => val !== '' && val !== null && val !== false) && 
                      ' (filtered)'
                    }
                  </Typography>
                </Box>
              </Collapse>
            </CardContent>
          </Card>

          {selectedAlerts.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setBulkActionDialog('approve')}
                disabled={actionLoading}
              >
                Approve Selected ({selectedAlerts.length})
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setBulkActionDialog('reject')}
                disabled={actionLoading}
              >
                Reject Selected ({selectedAlerts.length})
              </Button>
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                        indeterminate={selectedAlerts.length > 0 && selectedAlerts.length < filteredAlerts.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Impact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert._id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedAlerts.includes(alert._id)}
                          onChange={(e) => handleSelectAlert(alert._id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {alert.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {alert.description.substring(0, 100)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={alert.alertCategory} size="small" />
                      </TableCell>
                      <TableCell>{alert.originCity}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getImpactLabel(alert.impact)} 
                          size="small" 
                          color={getImpactColor(alert.impact)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={alert.status} 
                          size="small" 
                          color={getStatusColor(alert.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {alert.status === 'pending' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleSingleAction(alert._id, 'approve')}
                                disabled={actionLoading}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleSingleAction(alert._id, 'reject', 'Rejected by admin')}
                                disabled={actionLoading}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Bulk Action Dialogs */}
          <Dialog open={bulkActionDialog === 'approve'} onClose={() => setBulkActionDialog(null)}>
            <DialogTitle>Approve Selected Alerts</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Approval Reason (Optional)"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBulkActionDialog(null)}>Cancel</Button>
              <Button 
                onClick={() => handleBulkAction('approve')} 
                color="success" 
                disabled={actionLoading}
              >
                Approve
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={bulkActionDialog === 'reject'} onClose={() => setBulkActionDialog(null)}>
            <DialogTitle>Reject Selected Alerts</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Rejection Reason *"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setBulkActionDialog(null)}>Cancel</Button>
              <Button 
                onClick={() => handleBulkAction('reject')} 
                color="error" 
                disabled={actionLoading || !rejectionReason.trim()}
              >
                Reject
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </LocalizationProvider>
    </AdminLayout>
  );
} 