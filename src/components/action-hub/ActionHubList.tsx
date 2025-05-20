'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Card,
  CardContent,
  Container,
  IconButton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { getFollowedAlerts } from '@/services/action-hub';
import { Alert } from '@/types';
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
  
  const router = useRouter();


  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await getFollowedAlerts();
        console.log('followed alerts data ', data);
        setAlerts(data);
        setFilteredAlerts(data);
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

  // Get relative time (e.g., "3h")
  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
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
          <IconButton
            onClick={handleOpenFilter}
            sx={{ 
              borderColor: isFiltered ? 'black' : '#e0e0e0',
              color: 'black',
              '&:hover': { borderColor: 'black', bgcolor: '#f5f5f5' },
              textTransform: 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M4.6366 1.6875C4.6496 1.6875 4.66264 1.6875 4.67573 1.6875L13.3634 1.6875C13.9413 1.68747 14.4319 1.68745 14.819 1.74023C15.2287 1.79609 15.6205 1.92219 15.9204 2.25232C16.2229 2.58535 16.3057 2.9867 16.3121 3.39696C16.318 3.7801 16.2568 4.25604 16.1853 4.81096L16.1801 4.85137C16.1549 5.04774 16.117 5.23767 16.038 5.42783C15.9578 5.6209 15.8474 5.78533 15.7098 5.94874C14.975 6.82165 13.6091 8.39917 11.6861 9.83579C11.655 9.85903 11.6157 9.91411 11.6082 9.99675C11.4214 12.0614 11.257 13.1538 11.1385 13.7867C11.0102 14.4711 10.4882 14.9448 10.0381 15.2709C9.80257 15.4416 9.55255 15.5953 9.32986 15.7308C9.312 15.7417 9.29437 15.7524 9.27695 15.763C9.06893 15.8895 8.89208 15.997 8.74425 16.1015C8.33887 16.3882 7.87119 16.3681 7.5137 16.1598C7.17635 15.9633 6.93897 15.6049 6.89097 15.1995C6.78563 14.3097 6.59464 12.5677 6.38382 9.99194C6.37706 9.90932 6.36415 9.88534 6.36307 9.88334C6.36234 9.88196 6.36044 9.87846 6.35414 9.87154C6.3471 9.8638 6.33302 9.85009 6.30626 9.83008C4.38714 8.39526 3.02387 6.8205 2.29013 5.94871C2.1531 5.7859 2.03941 5.62538 1.95834 5.43017C1.87898 5.23906 1.84514 5.04817 1.81983 4.85137C1.81809 4.83785 1.81636 4.82438 1.81463 4.81095C1.74322 4.25604 1.68197 3.7801 1.6879 3.39695C1.69425 2.9867 1.77706 2.58535 2.0796 2.25232C2.37951 1.92219 2.77127 1.79609 3.18098 1.74023C3.56806 1.68745 4.05868 1.68747 4.6366 1.6875ZM3.33296 2.85491C3.04488 2.89419 2.9581 2.95837 2.9123 3.00878C2.86913 3.05631 2.81701 3.13999 2.81276 3.41437C2.80824 3.70659 2.85759 4.10109 2.93564 4.70784C2.95732 4.87645 2.97632 4.94815 2.99732 4.99872C3.01661 5.04518 3.0508 5.10541 3.15085 5.22429C3.86957 6.07823 5.16635 7.57317 6.9799 8.92906C7.12561 9.038 7.25928 9.17285 7.356 9.35445C7.45128 9.53337 7.49028 9.71952 7.50507 9.90017C7.71474 12.4619 7.90435 14.1903 8.00817 15.0672C8.01133 15.094 8.02107 15.1203 8.03606 15.1433C8.05138 15.1668 8.06841 15.181 8.08 15.1877C8.08148 15.1886 8.08277 15.1893 8.08389 15.1898C8.08656 15.1884 8.09016 15.1862 8.09474 15.183C8.27632 15.0546 8.48708 14.9265 8.686 14.8057C8.7058 14.7936 8.72549 14.7817 8.74502 14.7698C8.96912 14.6334 9.18345 14.5009 9.37801 14.3599C9.78812 14.0628 9.98927 13.8113 10.0327 13.5796C10.1426 12.9932 10.3029 11.9386 10.4878 9.89536C10.5217 9.521 10.7055 9.1641 11.0128 8.93453C12.83 7.5769 14.1294 6.07928 14.8491 5.22427C14.9364 5.12058 14.9752 5.05373 14.9991 4.9962C15.0242 4.93577 15.0453 4.8558 15.0643 4.70784C15.1424 4.10109 15.1917 3.70659 15.1872 3.41437C15.183 3.13999 15.1308 3.05631 15.0877 3.00878C15.0419 2.95837 14.9551 2.89419 14.667 2.85491C14.365 2.81374 13.952 2.8125 13.3242 2.8125H4.67573C4.04795 2.8125 3.63495 2.81374 3.33296 2.85491ZM8.07799 15.1925C8.07802 15.1924 8.07839 15.1923 8.07908 15.1921L8.07799 15.1925Z" fill="black"/>
</svg>

          </IconButton>
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
  );
};

export default ActionHubList; 