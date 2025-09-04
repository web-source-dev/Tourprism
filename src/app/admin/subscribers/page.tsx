'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Avatar,
  useMediaQuery,
  useTheme,
  Collapse,
  Stack,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocationOn as LocationOnIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import {
  getAllSubscribers,
  updateSubscriberStatus,
  removeSubscriber,
  SubscriberFilters as SubscriberFiltersType,
  Subscriber,
  getDashboardStats,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import ClearIcon from '@mui/icons-material/Clear';
import { useRouter } from 'next/navigation';
import TablePagination from '@mui/material/TablePagination';
import { DashboardStats } from '@/types';

const sectorOptions: string[] = [
  "Airline", "Attraction", "Car Rental", "Cruise Line", "DMO", "Event Manager", "Hotel", "OTA", "Tour Guide", "Tour Operator", "Travel Agency", "Travel Media", "Other"
];
const locationOptions = [
  "Edinburgh", "Glasgow", "Stirling", "Manchester", "London"
];
const statusOptions = [
  { value: 'active', label: 'Subscribed' },
  { value: 'inactive', label: 'Unsubscribed' }
];
const sortOptions = [
  { value: 'createdAt:desc', label: 'Most Recent' },
  { value: 'engagement:desc', label: 'Most Engaged' },
  { value: 'name:asc', label: 'Alphabetical (A-Z)' },
  { value: 'name:desc', label: 'Alphabetical (Z-A)' }
];

export default function SubscribersManagement() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filters, setFilters] = useState<SubscriberFiltersType>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Add filter states for new filters
  const [subscriptionDate, setSubscriptionDate] = useState<[Date | null, Date | null]>([null, null]);
  const [engagementDate, setEngagementDate] = useState<[Date | null, Date | null]>([null, null]);
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortFilter, setSortFilter] = useState<string>(sortOptions[0].value);

  // Collapsible filter states
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(!isMobile);

  // Permission check - only admin and manager can manage subscribers
  const canManageSubscribers = isAdmin;

  // Update filters expanded state when screen size changes
  useEffect(() => {
    setFiltersExpanded(!isMobile);
  }, [isMobile]);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params: SubscriberFiltersType = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy: sortFilter.split(':')[0],
        sortOrder: sortFilter.split(':')[1] as 'asc' | 'desc' || 'desc',
        ...filters,
      };
      if (subscriptionDate[0] && subscriptionDate[1]) {
        params.startDate = subscriptionDate[0].toISOString();
        params.endDate = subscriptionDate[1].toISOString();
      }
      if (engagementDate[0] && engagementDate[1]) {
        params.lastEngagementStart = engagementDate[0].toISOString();
        params.lastEngagementEnd = engagementDate[1].toISOString();
      }
      if (locationFilter) params.location = locationFilter;
      if (sectorFilter) params.sector = sectorFilter;
      if (statusFilter) params.isActive = statusFilter === 'active' ? true : false;
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
  }, [page, rowsPerPage, sortFilter, filters, subscriptionDate, engagementDate, locationFilter, sectorFilter, statusFilter]);

  // Only reset filters/sort on mount
  useEffect(() => {
    setFilters({});
  }, []);

  // Fetch subscribers when dependencies change
  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  useEffect(() => {
    // Fetch dashboard stats for metrics
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const stats = await getDashboardStats();
        setDashboardStats(stats);
      } catch (e) {
        console.error('Error fetching dashboard stats:', e);
        setDashboardStats(null);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);
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

  // Filter change handlers
  const handleFilterChange = (key: string, value: unknown) => {
    setPage(0);
    switch (key) {
      case 'subscriptionDate': setSubscriptionDate(value as [Date | null, Date | null]); break;
      case 'engagementDate': setEngagementDate(value as [Date | null, Date | null]); break;
      case 'location': setLocationFilter(value as string); break;
      case 'sector': setSectorFilter(value as string); break;
      case 'status': setStatusFilter(value as string); break;
      case 'sort': setSortFilter(value as string); break;
      default: break;
    }
  };
  const handleClearFilters = () => {
    setSubscriptionDate([null, null]);
    setEngagementDate([null, null]);
    setLocationFilter('');
    setSectorFilter('');
    setStatusFilter('');
    setSortFilter(sortOptions[0].value);
    setPage(0);
  };

  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  return (
    <AdminLayout>
      {/* Add New Subscriber Button */}
      {canManageSubscribers && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/subscribe')}
            sx={{ borderRadius: 3, fontWeight: 600,
              width: { xs: '100%', md: 200 },
             }}
          >
            Add New Subscriber
          </Button>
        </Box>
      )}
      {/* Stat Cards Row */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)' ,md: 'repeat(3, 1fr)'},
        mb: 3,  
        background: '#fff',
        borderRadius: 3,
        border: '1px solid #e0e0e0',
        py: 1.5,
        px: 0,
        boxShadow: 'none',
        alignItems: 'center',
        justifyItems: 'center',
      }}>
        {statsLoading ? (
          <CircularProgress size={32} />
        ) : dashboardStats ? (
          <>
            <Box sx={{ 
              textAlign: 'center', 
              width: '100%',
              borderRight: '1px solid #e0e0e0',
              pb: { xs: 1, sm: 0 },
              pr: { xs: 0, sm: 2 },
              pl: { xs: 0, sm: 2 }
            }}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {dashboardStats.metrics.subscribers.total.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' },fontWeight: 600 }}>
                Total Subscribers
              </Typography>
            </Box>
            <Box sx={{ 
              textAlign: 'center', 
              width: '100%',
              borderRight: '1px solid #e0e0e0',
              pb: { xs: 1, sm: 0 },
              pr: { xs: 0, sm: 2 },
              pl: { xs: 0, sm: 2 }
            }}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                +{dashboardStats.metrics.subscribers.new.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' },fontWeight: 600 }}>
                New Subscribers
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', width: '100%',
              borderRight: '1px solid #e0e0e0',
              pb: { xs: 1, sm: 0 },
              pr: { xs: 0, sm: 2 },
              pl: { xs: 0, sm: 2 }
             }}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {dashboardStats.metrics.subscribers.unsubscribes.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' },fontWeight: 600 }}>
                Unsubscribes
              </Typography>
            </Box>
          </>
        ) : null}
      </Box>

      {/* Collapsible Filter Bar */}
      <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }} elevation={0}>
        {/* Filter Header */}
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: isMobile ? 'pointer' : 'default'
          }}
          onClick={isMobile ? toggleFilters : undefined}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
          </Box>
          {isMobile && (
            <IconButton size="small">
              {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>

        {/* Filter Content */}
        <Collapse in={filtersExpanded}>
          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Quick Filters Row */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                {/* Sort By */}
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180, md: 280 }, borderRadius: 3 }}>
                  <Select
                    value={sortFilter}
                    displayEmpty
                    onChange={e => handleFilterChange('sort', e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    {sortOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {/* Location */}
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160, md: 280 }, borderRadius: 3 }}>
                  <Select
                    value={locationFilter}
                    displayEmpty
                    onChange={e => handleFilterChange('location', e.target.value)}
                    renderValue={selected => selected || 'Location'}
                    sx={{ borderRadius: 3 }}
                    MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                  >
                    <MenuItem value=""><em>All Locations</em></MenuItem>
                    {locationOptions.map(loc => (
                      <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {/* Sector */}
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160, md: 280 }, borderRadius: 3 }}>
                  <Select
                    value={sectorFilter}
                    displayEmpty
                    onChange={e => handleFilterChange('sector', e.target.value)}
                    renderValue={selected => selected || 'Sector'}
                    sx={{ borderRadius: 3 }}
                    MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                  >
                    <MenuItem value=""><em>All Sectors</em></MenuItem>
                    {sectorOptions.map(sector => (
                      <MenuItem key={sector} value={sector}>{sector}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {/* Status */}
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140, md: 280 }, borderRadius: 3 }}>
                  <Select
                    value={statusFilter}
                    displayEmpty
                    onChange={e => handleFilterChange('status', e.target.value)}
                    renderValue={selected => selected ? (selected === 'active' ? 'Subscribed' : 'Unsubscribed') : 'Status'}
                    sx={{ borderRadius: 3 }}
                    MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                  >
                    <MenuItem value=""><em>All Statuses</em></MenuItem>
                    {statusOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {/* Clear Filters Button */}
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 120 }, 
                    borderRadius: 3,
                    height: { xs: 40, sm: 32, md: 37 }
                  }}
                >
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Collapse>
      </Paper>

      {/* Subscribers Card Grid */}
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
            justifyContent: 'flex-start' 
          }}>
            {subscribers.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', width: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No subscribers found
                </Typography>
              </Box>
            ) : (
              subscribers.map((subscriber) => (
                <Card key={subscriber._id} sx={{ 
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { xs: '100%', sm: 320 },
                  maxWidth: { xs: '100%', sm: 350 },
                  flex: { xs: 'none', sm: '1 1 320px' },
                  boxShadow: 0, 
                  border: '1px solid #e0e0e0',
                  borderRadius: 4, 
                  mb: { xs: 0, sm: 2 }, 
                  p: 0, 
                  position: 'relative', 
                  overflow: 'visible' 
                }}>
                  <CardContent sx={{ pb: 1.5, pt: 2, px: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1, position: 'relative' }}>
                      <Avatar sx={{ 
                        bgcolor: subscriber.isActive ? '#e8f5e9' : '#ffebee', 
                        color: subscriber.isActive ? '#2e7d32' : '#c62828', 
                        width: { xs: 40, sm: 44 }, 
                        height: { xs: 40, sm: 44 }, 
                        mr: 1 
                      }}>
                        {subscriber.name ? subscriber.name[0] : subscriber.email[0].toUpperCase()}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold', 
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {subscriber.name || subscriber.email.split('@')[0]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {subscriber.email}
                        </Typography>
                      </Box>
                      <Box sx={{position: 'relative' }}>
                        {/* Subscription Status - Top Right */}
                        <Chip
                          label={subscriber.isActive ? 'Subscribed' : 'Unsubscribed'}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(subscriber.isActive).bg,
                            color: getStatusColor(subscriber.isActive).color,
                            fontWeight: 'medium',
                            textTransform: 'capitalize',
                            borderRadius: 2,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            minWidth: 'fit-content',
                            position: 'absolute',
                            top: 0,
                            right: 0
                          }}
                        />
                        {canManageSubscribers && (
                          <IconButton 
                            onClick={(event) => handleOpenMenu(event, subscriber)} 
                            size="small"
                            sx={{ minWidth: 40, minHeight: 40 }}
                            style={{
                              position: 'absolute',
                              right: 0,
                              bottom: -180,
                            }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {subscriber.location && Array.isArray(subscriber.location) && subscriber.location.length > 0 ? (
                          subscriber.location.map((loc, index) => (
                            <Chip
                              key={index}
                              label={loc.name}
                              size="small"
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                height: '20px',
                                bgcolor: '#e3f2fd',
                                color: '#1976d2'
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            color: 'text.secondary'
                          }}>
                            Location not specified
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <BusinessIcon fontSize="small" color="action" />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {subscriber.sector && Array.isArray(subscriber.sector) && subscriber.sector.length > 0 ? (
                          subscriber.sector.map((sector, index) => (
                            <Chip
                              key={index}
                              label={sector}
                              size="small"
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                height: '20px',
                                bgcolor: '#e8f5e8',
                                color: '#2e7d32'
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            color: 'text.secondary'
                          }}>
                            Sector not specified
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {formatDate(subscriber.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {subscriber.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Last Forecast: {formatDate(subscriber.lastWeeklyForecastReceived)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
          {/* Pagination Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Rows per page:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`}
            />
          </Box>
          </>
        )}
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            minWidth: { xs: 200, sm: 180 },
            borderRadius: 3
          }
        }}
      >
        {selectedSubscriber && (
          <>
            <MenuItemComponent
              onClick={handleToggleStatus}
              disabled={actionLoading}
              sx={{ py: { xs: 1.5, sm: 1 } }}
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
              sx={{ 
                color: 'error.main',
                py: { xs: 1.5, sm: 1 }
              }}
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