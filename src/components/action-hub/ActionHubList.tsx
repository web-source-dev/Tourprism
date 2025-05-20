'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
<<<<<<< HEAD
  Card, 
  CardContent, 
  Button, 
  CircularProgress, 
  Chip,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { getFollowedAlerts } from '@/services/action-hub';
import { Alert } from '@/types';
import ActionStatusTabs from './ActionStatusTabs';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

const ActionHubList: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
=======
  Button, 
  CircularProgress,
  Card,
  CardContent,
  Container,
  IconButton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useRouter } from 'next/navigation';
import { getFollowedAlerts } from '@/services/action-hub';
import { Alert } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import FilterModal, { FilterOptions } from './FilterModal';

const ActionHubList: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: '',
    team: '',
    impactLevel: '',
    dateRange: {
      startDate: null,
      endDate: null,
    },
  });
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  
>>>>>>> 2945eb6 (Initial commit)
  const router = useRouter();
  const { isCollaboratorViewer } = useAuth();

  const isViewOnly = () => {
    return isCollaboratorViewer;
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await getFollowedAlerts();
        console.log('followed alerts data ', data);
        setAlerts(data);
<<<<<<< HEAD
=======
        setFilteredAlerts(data);
>>>>>>> 2945eb6 (Initial commit)
        setError(null);
      } catch (err) {
        setError('Failed to load followed alerts. Please try again later.');
        console.error('Error loading followed alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleAlertClick = (alertId: string) => {
    router.push(`/action-hub/alert/${alertId}`);
  };

<<<<<<< HEAD
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Get relative time (e.g., "3h ago")
=======
  // Get relative time (e.g., "3h")
>>>>>>> 2945eb6 (Initial commit)
  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
<<<<<<< HEAD
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Filter alerts based on the selected tab
  const filteredAlerts = alerts.filter(alert => {
    if (tabValue === 0) return alert.status === 'new' || !alert.status; // New
    if (tabValue === 1) return alert.status === 'in_progress'; // In Progress
    if (tabValue === 2) return alert.status === 'handled'; // Handled
    return true; // Fallback - show all
  });

  const newCount = alerts.filter(alert => alert.status === 'new' || !alert.status).length;
  const inProgressCount = alerts.filter(alert => alert.status === 'in_progress').length;
  const handledCount = alerts.filter(alert => alert.status === 'handled').length;
=======
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  const handleOpenFilter = () => {
    setFilterOpen(true);
  };

  const handleCloseFilter = () => {
    setFilterOpen(false);
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setFilterOptions(filters);
    
    // Check if any filter is active
    const hasActiveFilter = 
      filters.status !== '' || 
      filters.team !== '' || 
      filters.impactLevel !== '' || 
      filters.dateRange.startDate !== null || 
      filters.dateRange.endDate !== null;
    
    setIsFiltered(hasActiveFilter);
    
    // Apply filters to the alerts
    let filtered = [...alerts];
    
    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(alert => alert.status === filters.status);
    }
    
    // Filter by impact level
    if (filters.impactLevel) {
      const impactMap: {[key: string]: string} = {
        'low': 'Minor',
        'moderate': 'Moderate',
        'high': 'Severe'
      };
      
      filtered = filtered.filter(alert => 
        alert.impact?.toLowerCase() === impactMap[filters.impactLevel]?.toLowerCase()
      );
    }
    
    // Filter by date range
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      if (filters.dateRange.startDate) {
        const startDate = new Date(filters.dateRange.startDate);
        filtered = filtered.filter(alert => 
          new Date(alert.expectedStart || alert.createdAt) >= startDate
        );
      }
      
      if (filters.dateRange.endDate) {
        const endDate = new Date(filters.dateRange.endDate);
        filtered = filtered.filter(alert => 
          new Date(alert.expectedEnd || alert.createdAt) <= endDate
        );
      }
    }
    
    setFilteredAlerts(filtered);
  };

  const handleClearFilters = () => {
    setFilterOptions({
      status: '',
      team: '',
      impactLevel: '',
      dateRange: {
        startDate: null,
        endDate: null,
      },
    });
    setFilteredAlerts(alerts);
    setIsFiltered(false);
  };

  const getStatusBadge = (status: string | undefined) => {
    let label = 'New';
    let color = '#2196f3'; // Blue for New
    
    if (status === 'in_progress') {
      label = 'In Progress';
      color = '#ff9800'; // Orange
    } else if (status === 'handled') {
      label = 'Resolved';
      color = '#4caf50'; // Green
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box 
          component="span" 
          sx={{ 
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: color,
            mr: 1
          }} 
        />
        <Typography variant="body2" component="span">
          {label}
        </Typography>
      </Box>
    );
  };
>>>>>>> 2945eb6 (Initial commit)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
<<<<<<< HEAD
    <Box>
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" component="h1">
            Action Hub
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the alerts you&apos;re following
          </Typography>
        </Box>
        <Box>
          {/* Filter icon would go here */}
        </Box>
      </Box>

      <ActionStatusTabs
        tabValue={tabValue}
        newCount={newCount}
        inProgressCount={inProgressCount}
        handledCount={handledCount}
        onTabChange={handleTabChange}
      />

      {filteredAlerts.length === 0 ? (
        <Box textAlign="center" p={3}>
          <Typography variant="body1" color="textSecondary">
            No alerts found for this filter.
          </Typography>
        </Box>
      ) : (
        <Box px={2} py={2}>
          {filteredAlerts.map((alert) => (
            <Card 
              key={alert._id}
              elevation={0}
              sx={{ 
                mb: 3,
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: 'none',
                border: '1px solid #eaeaea'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 2, pb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                  {getTimeAgo(alert.createdAt)}
                </Typography>
                <Chip 
                  label={
                    alert.status === 'in_progress' ? 'In Progress' : 
                    alert.status === 'handled' ? 'Handled' : 'New'
                  }
                  size="small"
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
              
              <CardContent sx={{ pt: 1, pb: 2, px: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {alert.title || 'Untitled Alert'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {alert.description ? 
                    (alert.description.length > 120 ? 
                      `${alert.description.substring(0, 120)}...` : 
                      alert.description) : 
                    'No description available'}
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Box sx={{ width: {xs: '100%', md: '33%'} }}>
                    <Typography variant="caption" fontWeight="bold" display="block" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body2">
                      {alert.city || 'Unknown location'}
                    </Typography>
                  </Box>
                  <Box sx={{ width: {xs: '100%', md: '33%'} }}>
                    <Typography variant="caption" fontWeight="bold" display="block" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body2">
                      {alert.expectedStart ? 
                        format(new Date(alert.expectedStart), 'dd MMM h:mma') : 
                        '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ width: {xs: '100%', md: '33%'} }}>
                    <Typography variant="caption" fontWeight="bold" display="block" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="body2">
                      {alert.expectedEnd ? 
                        format(new Date(alert.expectedEnd), 'dd MMM h:mma') : 
                        '—'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" fontWeight="bold" display="block" color="text.secondary">
                    Impact Level
                  </Typography>
                  <Typography variant="body2">
                    {alert.impact || 'Not specified'}
                  </Typography>
                </Box>
                
                <Button 
                  variant="contained"
                  fullWidth
                  onClick={() => handleAlertClick(alert._id)}
                  sx={{ 
                    bgcolor: 'black',
                    '&:hover': {
                      bgcolor: '#333'
                    },
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    py: 1
                  }}
                >
                  {isViewOnly() ? 'View Alert' : 'Manage Alert'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
=======
    <Container maxWidth="xl" style={{ padding: 0 }}>
      <Box sx={{ py: 2, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" component="h1">
            Welcome to your Action Hub
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage, forward, or resolve your followed alert here
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleOpenFilter}
            sx={{ 
              borderColor: isFiltered ? 'black' : '#e0e0e0',
              color: 'black',
              '&:hover': { borderColor: 'black', bgcolor: '#f5f5f5' },
              textTransform: 'none',
            }}
          >
            Filter
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            href="/how-it-works"
            sx={{ 
              bgcolor: 'black', 
              '&:hover': { bgcolor: '#333' },
              borderRadius: 1
            }}
          >
            How It Works →
          </Button>
        </Box>
      </Box>

      {isFiltered && (
        <Box 
          sx={{ 
            mt: 1, 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            bgcolor: '#f5f5f5',
            borderRadius: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Filters applied:
            </Typography>
            {filterOptions.status && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'white',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography variant="body2">
                  Status: {filterOptions.status.charAt(0).toUpperCase() + filterOptions.status.slice(1).replace('_', ' ')}
                </Typography>
              </Box>
            )}
            {filterOptions.impactLevel && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'white',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography variant="body2">
                  Impact: {filterOptions.impactLevel.charAt(0).toUpperCase() + filterOptions.impactLevel.slice(1)}
                </Typography>
              </Box>
            )}
            {filterOptions.team && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'white',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography variant="body2">
                  Team: {filterOptions.team.charAt(0).toUpperCase() + filterOptions.team.slice(1)}
                </Typography>
              </Box>
            )}
            {filterOptions.dateRange.startDate && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'white',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography variant="body2">
                  From: {new Date(filterOptions.dateRange.startDate).toLocaleDateString()}
                </Typography>
              </Box>
            )}
            {filterOptions.dateRange.endDate && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  bgcolor: 'white',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography variant="body2">
                  To: {new Date(filterOptions.dateRange.endDate).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Box>
          <Button 
            variant="text" 
            color="primary" 
            size="small"
            onClick={handleClearFilters}
            sx={{ 
              color: 'black',
              textTransform: 'none',
              fontWeight: 'medium'
            }}
          >
            Clear filters
          </Button>
        </Box>
      )}

      <Box sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {filteredAlerts.length === 0 ? (
            <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No alerts match your filter criteria
              </Typography>
              {isFiltered && (
                <Button 
                  variant="text" 
                  onClick={handleClearFilters}
                  sx={{ mt: 2, color: 'black' }}
                >
                  Clear filters
                </Button>
              )}
            </Box>
          ) : (
            filteredAlerts.map((alert) => (
              <Box 
                key={alert._id} 
                sx={{ 
                  width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' },
                  mb: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  boxShadow: 'none'
                }}
              >
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%',
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: 'none',
                    display: 'flex',
                    backgroundColor: 'transparent',
                    flexDirection: 'column'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 2, pb: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 30,
                      px: 1.5,
                      py: 0.5
                    }}>
                      {getStatusBadge(alert.status)}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {getTimeAgo(alert.createdAt)}
                    </Typography>
                  </Box>
                  
                  <CardContent sx={{ pt: 1, pb: '16px !important', px: 2, flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {alert.title || 'Road Closures in 48h : Fringe Festival Protest'}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {alert.city || 'Princess Street, EH1'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {alert.description || 'High risk for road closures due to festival activities taking place in the centre of the town. Notify guests to take alternative routes and inform them to request early check-ins to avoid delays'}
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography component="div" sx={{ display: 'flex' }}>
                        <Typography variant="body2" component="span" sx={{ width: 90 }}>
                          Start
                        </Typography>
                        <Typography variant="body2" component="span">
                          {alert.expectedStart ? 
                            format(new Date(alert.expectedStart), 'dd MMM h:mma') : 
                            '06 May 9:00AM'}
                        </Typography>
                      </Typography>
                      
                      <Typography component="div" sx={{ display: 'flex' }}>
                        <Typography variant="body2" component="span" sx={{ width: 90 }}>
                          End
                        </Typography>
                        <Typography variant="body2" component="span">
                          {alert.expectedEnd ? 
                            format(new Date(alert.expectedEnd), 'dd MMM h:mma') : 
                            '06 May 9:00AM'}
                        </Typography>
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2">
                        {alert.impact || 'Moderated'} Impact
                      </Typography>
                    </Box>
                    
                    <Button 
                      variant="contained"
                      fullWidth
                      onClick={() => handleAlertClick(alert._id)}
                      sx={{ 
                        bgcolor: '#e0e0e0',
                        color: 'black',
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: '#e0e0e0',
                          boxShadow: 'none',
                        },
                        textTransform: 'none',
                        fontWeight: 'medium',
                        py: 1,
                        mt: 'auto'
                      }}
                    >
                      Manage Alert
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            ))
          )}
        </Box>
      </Box>
      
      <FilterModal
        open={filterOpen}
        onClose={handleCloseFilter}
        filterOptions={filterOptions}
        onApplyFilters={handleApplyFilters}
      />
    </Container>
>>>>>>> 2945eb6 (Initial commit)
  );
};

export default ActionHubList; 