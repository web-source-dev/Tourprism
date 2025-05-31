'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, FilterOptions } from '@/types';
import { fetchArchivedAlerts } from '@/services/api';
import Link from 'next/link';
import { 
  Box, Container, Typography, Button, Snackbar, CircularProgress, Paper, IconButton
} from '@mui/material';
import Layout from '@/components/Layout';
import FilterDrawer from '@/components/FilterDrawer';
import { Socket, io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/ui/toast';

// Define a specific interface for the API parameters
interface ArchiveAlertParams {
  page: number;
  limit: number;
  city?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  alertCategory?: string[];
  startDate?: string;
  endDate?: string;
  impactLevel?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  timeRange?: number;
}

// Helper function to format time for display
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();

  // Get time difference in seconds
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    // Less than a minute
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    // Less than an hour
    return `${Math.floor(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    // Less than a day
    return `${Math.floor(diffInSeconds / 3600)}h`;
  } else {
    // More than a day
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }
};

// Format date for display
const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Create a client component that uses the useSearchParams hook
function ArchiveContent() {
  const [archivedAlerts, setArchivedAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAlerts, setTotalAlerts] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const { isSubscribed } = useAuth();
  const { showToast } = useToast();
  
  // Updated FilterOptions to match the type from types/index.ts
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'newest',
    alertCategory: [], // Changed from incidentTypes to alertCategory
    timeRange: 0,
    distance: 50,
    impactLevel: '',
    customDateFrom: new Date(),
    customDateTo: new Date(),
  });
  
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>('Edinburgh');
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>({
    latitude: 55.9533,
    longitude: -3.1883 // Default coordinates for Edinburgh
  });

  // Reference for socket.io connection
  const socketRef = useRef<Socket | null>(null);
  const searchParams = useSearchParams();
  const highlightedAlertId = searchParams.get('highlight');
  // Add this ref to track if the component is mounted
  const isMounted = useRef(true);

  // Add this useEffect to handle the component unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load archived alerts function with updated filter params
  const loadArchivedAlerts = useCallback(async (pageNum: number, reset: boolean) => {
    // Only return if already loading and this is not a reset operation
    if (loading && !reset) return;
    
    setLoading(true);
    try {
      // Prepare filter parameters
      const params: ArchiveAlertParams = {
        page: pageNum,
        limit: 10
      };
      
      // Add location parameters if available
      if (city && city !== 'Edinburgh') {
        params.city = city;
      }
      
      if (coords) {
        params.latitude = coords.latitude;
        params.longitude = coords.longitude;
        params.distance = filters.distance;
      }
      
      // Add alert category filter if selected
      if (filters.alertCategory && filters.alertCategory.length > 0) {
        params.alertCategory = filters.alertCategory;
      }
      
      // Add time range filter if selected
      if (filters.timeRange > 0 && filters.timeRange !== -1) {
        params.timeRange = filters.timeRange;
      } else if (filters.timeRange === -1) {
        // Custom date range
        if (filters.customDateFrom && filters.customDateTo) {
          params.startDate = filters.customDateFrom.toISOString();
          params.endDate = filters.customDateTo.toISOString();
        } else {
          // Fallback to last 30 days if custom dates are missing
          const today = new Date();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);
          
          params.startDate = thirtyDaysAgo.toISOString();
          params.endDate = today.toISOString();
        }
      }
      
      // Add impact level filter if selected
      if (filters.impactLevel) {
        params.impactLevel = filters.impactLevel;
      }
      
      // Add sort parameters
      if (filters.sortBy) {
        if (filters.sortBy === 'newest') {
          params.sortBy = 'createdAt';
          params.sortOrder = 'desc';
        } else if (filters.sortBy === 'oldest') {
          params.sortBy = 'createdAt';
          params.sortOrder = 'asc';
        } else if (filters.sortBy === 'reported') {
          params.sortBy = 'numberOfReports';
          params.sortOrder = 'desc';
        }
      }
      
      const result = await fetchArchivedAlerts(params);
      
      // Only update state if the component is still mounted
      if (isMounted.current) {
        if (reset) {
          setArchivedAlerts(result.alerts);
        } else {
          setArchivedAlerts(prev => [...prev, ...result.alerts]);
        }
        
        setTotalAlerts(result.totalCount);
        setHasMore(result.alerts.length === 10);
        setPage(pageNum);
        setError(null);
      }
    } catch (error) {
      console.error('Error loading archived alerts:', error);
      if (isMounted.current) {
        setError('Failed to load alerts. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [city, coords, filters, loading]);

  // Handle using current location
  const handleUseMyLocation = async () => {
    if (!isSubscribed) {
      showToast("Please subscribe to use location features", "error");
      return;
    }
    
    setLocationLoading(true);
    
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setLocationAccuracy(Math.round(accuracy));
            
            // Get city name from coordinates
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await response.json();
              
              const locationName = data.address?.city || 
                data.address?.town || 
                data.address?.village || 
                data.address?.county || 
                'Current Location';
              
              // Update state in a single batch to minimize renders
              // This will trigger a reload due to dependency changes in loadArchivedAlerts
              if (isMounted.current) {
                setCity(locationName);
                setCoords({ latitude, longitude });
                setLocationLoading(false);
                
                // Show success toast
                showToast(`Using location: ${locationName}`, "success");
              }
            } catch (error) {
              console.error('Error getting location name:', error);
              
              if (isMounted.current) {
                // Still update location even if we can't get the name
                setCity('Current Location');
                setCoords({ latitude, longitude });
                setLocationLoading(false);
                
                // Show error toast
                showToast("Using location with unknown name", "error");
              }
            }
          },
          (error) => {
            console.error('Error getting location:', error);
            if (isMounted.current) {
              setLocationLoading(false);
              
              let errorMessage = 'Unable to get your location';
              
              if (error.code === 1) {
                errorMessage = 'Location access denied. Please enable location in your browser settings.';
              } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Please try again later.';
              } else if (error.code === 3) {
                errorMessage = 'Location request timed out. Please try again.';
              }
              
              showToast(errorMessage, "error");
            }
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
          }
        );
      } else {
        if (isMounted.current) {
          setLocationLoading(false);
          showToast("Geolocation is not supported by your browser", "error");
        }
      }
    } catch (error) {
      console.error('Error in geolocation:', error);
      if (isMounted.current) {
        setLocationLoading(false);
        showToast("Error getting your location", "error");
      }
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tourprism-backend-w5c1.onrender.com';
    socketRef.current = io(SOCKET_URL);
    
    // Reference to track if we have a refresh pending
    let refreshTimeout: NodeJS.Timeout | null = null;

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.io server from Archive page');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.io connection error in Archive:', error);
    });

    // Listen for alert events that might require archive refresh
    socketRef.current.on('alert:updated', (data) => {
      console.log('Alert updated in archive context:', data);
      
      // If we already have a pending refresh, clear it
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      
      // Set a new timeout to debounce multiple updates in quick succession
      refreshTimeout = setTimeout(() => {
        if (!loading && isMounted.current) {
          loadArchivedAlerts(1, true);
        }
        refreshTimeout = null;
      }, 500);
    });

    return () => {
      // Clear any pending timeouts when unmounting
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [loadArchivedAlerts, loading]);

  
  // Reset location to Edinburgh
  const handleResetLocation = useCallback(() => {
    setCity('Edinburgh');
    setCoords({ latitude: 55.9533, longitude: -3.1883 });
    setLocationAccuracy(null);
    
    // Load alerts with reset location
    loadArchivedAlerts(1, true);
  }, [loadArchivedAlerts]);

  // Load archived alerts on initial component mount only
  useEffect(() => {
    // Use a flag to ensure this only runs once on mount
    const initialLoad = async () => {
      await loadArchivedAlerts(1, true);
    };
    
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Empty dependency array to ensure it only runs once

  // Handle highlighted alert (if any)
  useEffect(() => {
    if (highlightedAlertId && archivedAlerts.length > 0) {
      const alertElement = document.getElementById(`alert-${highlightedAlertId}`);
      if (alertElement) {
        alertElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a temporary highlight effect
        alertElement.style.boxShadow = '0 0 0 2px #4a90e2';
        setTimeout(() => {
          alertElement.style.boxShadow = '';
        }, 3000);
      }
    }
  }, [highlightedAlertId, archivedAlerts]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadArchivedAlerts(page + 1, false);
    }
  };

  // Updated handleFilterChange to use the correct FilterOptions type
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setIsFilterDrawerOpen(false);
    loadArchivedAlerts(1, true);
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'newest',
      alertCategory: [], // Changed from incidentTypes to alertCategory
      timeRange: 0,
      distance: 50,
      impactLevel: '',
      customDateFrom: new Date(),
      customDateTo: new Date(),
    });
  };

  return (
    <Layout onFilterOpen={() => setIsFilterDrawerOpen(true)} isFooter={false}>
      <Container maxWidth="xl" sx={{ pt: 1, pb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          borderBottom: '1px solid #E0E1E2'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
              Archive
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 400 }}>
              View past travel disruptions
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setIsFilterDrawerOpen(true)}
            sx={{ 
              display:'none',
              bgcolor: '#f5f5f5',
              '&:hover': {
                bgcolor: '#e0e0e0'
              },
            }}
            aria-label="open filter"
          >
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="33" height="33" rx="7.5" fill="white" />
              <rect x="0.5" y="0.5" width="33" height="33" rx="7.5" stroke="#E0E1E2" />
              <path fillRule="evenodd" clipRule="evenodd" d="M12.6366 9.68752C12.6496 9.68752 12.6626 9.68752 12.6757 9.68752L21.3634 9.68752C21.9413 9.68749 22.4319 9.68747 22.819 9.74024C23.2287 9.7961 23.6205 9.9222 23.9204 10.2523C24.2229 10.5854 24.3057 10.9867 24.3121 11.397C24.318 11.7801 24.2568 12.2561 24.1853 12.811L24.1801 12.8514C24.1549 13.0478 24.117 13.2377 24.038 13.4278C23.9578 13.6209 23.8474 13.7853 23.7098 13.9488C22.975 14.8217 21.6091 16.3992 19.6861 17.8358C19.655 17.859 19.6157 17.9141 19.6082 17.9968C19.4214 20.0615 19.257 21.1539 19.1385 21.7868C19.0102 22.4711 18.4882 22.9448 18.0381 23.2709C17.8026 23.4416 17.5525 23.5953 17.3299 23.7308C17.312 23.7417 17.2944 23.7524 17.277 23.763C17.0689 23.8895 16.8921 23.997 16.7443 24.1016C16.3389 24.3882 15.8712 24.3681 15.5137 24.1598C15.1764 23.9633 14.939 23.6049 14.891 23.1995C14.7856 22.3097 14.5946 20.5677 14.3838 17.992C14.3771 17.9093 14.3641 17.8854 14.3631 17.8834C14.3623 17.882 14.3604 17.8785 14.3541 17.8716C14.3471 17.8638 14.333 17.8501 14.3063 17.8301C12.3871 16.3953 11.0239 14.8205 10.2901 13.9487C10.1531 13.7859 10.0394 13.6254 9.95834 13.4302C9.87898 13.2391 9.84514 13.0482 9.81983 12.8514C9.81809 12.8379 9.81636 12.8244 9.81463 12.811C9.74322 12.2561 9.68197 11.7801 9.6879 11.397C9.69425 10.9867 9.77706 10.5854 10.0796 10.2523C10.3795 9.9222 10.7713 9.7961 11.181 9.74024C11.5681 9.68747 12.0587 9.68749 12.6366 9.68752ZM11.333 10.8549C11.0449 10.8942 10.9581 10.9584 10.9123 11.0088C10.8691 11.0563 10.817 11.14 10.8128 11.4144C10.8082 11.7066 10.8576 12.1011 10.9356 12.7079C10.9573 12.8765 10.9763 12.9482 10.9973 12.9987C11.0166 13.0452 11.0508 13.1054 11.1509 13.2243C11.8696 14.0782 13.1663 15.5732 14.9799 16.9291C15.1256 17.038 15.2593 17.1729 15.356 17.3545C15.4513 17.5334 15.4903 17.7195 15.5051 17.9002C15.7147 20.4619 15.9044 22.1903 16.0082 23.0672C16.0113 23.094 16.0211 23.1203 16.0361 23.1433C16.0514 23.1668 16.0684 23.181 16.08 23.1878C16.0815 23.1886 16.0828 23.1893 16.0839 23.1899C16.0866 23.1884 16.0902 23.1862 16.0947 23.183C16.2763 23.0546 16.4871 22.9265 16.686 22.8057C16.7058 22.7936 16.7255 22.7817 16.745 22.7698C16.9691 22.6334 17.1835 22.5009 17.378 22.3599C17.7881 22.0628 17.9893 21.8113 18.0327 21.5796C18.1426 20.9932 18.3029 19.9386 18.4878 17.8954C18.5217 17.521 18.7055 17.1641 19.0128 16.9345C20.83 15.5769 22.1294 14.0793 22.8491 13.2243C22.9364 13.1206 22.9752 13.0537 22.9991 12.9962C23.0242 12.9358 23.0453 12.8558 23.0643 12.7079C23.1424 12.1011 23.1917 11.7066 23.1872 11.4144C23.183 11.14 23.1308 11.0563 23.0877 11.0088C23.0419 10.9584 22.9551 10.8942 22.667 10.8549C22.365 10.8138 21.952 10.8125 21.3242 10.8125H12.6757C12.0479 10.8125 11.635 10.8138 11.333 10.8549ZM16.078 23.1925C16.078 23.1924 16.0784 23.1923 16.0791 23.1921L16.078 23.1925Z" fill="black" />
            </svg>
          </IconButton>
          <Link href="/feed" style={{ textDecoration: 'none' }}>
            <Button 
              variant="outlined" 
              size="small"
              sx={{ mr: 1, borderRadius: 2 }}
            >
              Current Alerts
            </Button>
          </Link>
        </Box>

        {loading && archivedAlerts.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="contained" 
              onClick={() => loadArchivedAlerts(1, true)} 
              sx={{ mt: 1, borderRadius: 2 }}
            >
              Try Again
            </Button>
          </Box>
        ) : archivedAlerts.length === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="h6">No archived alerts found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              There are no past alerts in the archive that match your criteria.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Alerts grid - Using the same grid layout as the feed page */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              bgcolor: 'transparent',
              gap: 0,
              mt: 2,
              borderBottom: 'none',
              borderRight: 'none',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              {archivedAlerts.map((alert, index) => {
                // Calculate position in grid for border logic
                const position = index;
                
                // Calculate if this is in the last row based on different breakpoints
                const totalItems = archivedAlerts.length;
                
                // Calculate last row items for different breakpoints
                const isLastRowMd = position >= totalItems - (totalItems % 3 || 3);
                const isLastRowSm = position >= totalItems - (totalItems % 2 || 2);
                const isLastRowXs = position === totalItems - 1;
                
                // Calculate if this is the last item in a row
                const isLastInRowMd = (position + 1) % 3 === 0 || position === totalItems - 1;
                const isLastInRowSm = (position + 1) % 2 === 0 || position === totalItems - 1;
                
                return (
                  <Paper
                    key={`alert-${alert._id}`}
                    id={`alert-${alert._id}`}
                    sx={{
                      p: 2,
                      bgcolor: 'transparent',
                      borderRadius: 0,
                      boxShadow: 'none',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderTop: 'none',
                      borderBottom: {
                        xs: isLastRowXs ? 'none' : '1px solid #E0E1E2',
                        sm: isLastRowSm ? 'none' : '1px solid #E0E1E2',
                        md: isLastRowMd ? 'none' : '1px solid #E0E1E2'
                      },
                      borderRight: { 
                        xs: 'none', 
                        sm: isLastInRowSm ? 'none' : '1px solid #E0E1E2',
                        md: isLastInRowMd ? 'none' : '1px solid #E0E1E2'
                      },
                      backgroundColor: 'transparent',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box
                      >
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#757575', fontSize: '14px' }}>
                          {formatRelativeTime(alert.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Alert Header with Title */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1.5
                    }}>
                      <Typography variant="subtitle1" sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        flex: 1,
                        letterSpacing: '-0.25px'
                      }}>
                        {alert.title || "Archived Alert"}
                      </Typography>
                    </Box>

                    {/* Location info */}
                    <Typography variant="body2"
                      sx={{
                        color: '#616161',
                        fontSize: '14px',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      {alert.city || "Unknown location"}
                    </Typography>

                    {/* Alert Content */}
                    <Typography variant="body2" sx={{
                      mb: 1.5,
                      color: '#333',
                      flex: 1,
                      fontSize: '14px',
                      //show only 3 lines
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {alert.description}
                    </Typography>

                    {/* Alert Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Start and End Time */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {alert.expectedStart && (
                          <Box>
                            <Typography variant="body2" sx={{ fontSize: '14px', color: '#757575', fontWeight: 400 }}>
                              Started: {formatDateForDisplay(alert.expectedStart)}
                            </Typography>
                          </Box>
                        )}
                        {alert.expectedEnd && (
                          <Box>
                            <Typography variant="body2" sx={{ fontSize: '14px', color: '#757575', fontWeight: 400 }}>
                              Ended: {formatDateForDisplay(alert.expectedEnd)}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Impact Level */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{
                          display: 'inline-block',
                          fontSize: '14px',
                          borderRadius: 1,
                          fontWeight: 500,
                        }}>
                          {alert.impact || 'Moderate'} Impact
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
            
            {/* Load more button */}
            {hasMore && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                  sx={{
                    borderColor: '#e0e0e0',
                    color: '#333',
                    borderRadius: 50,
                    px: 10,
                    py: 1,
                    '&:hover': {
                      borderColor: '#bdbdbd',
                      backgroundColor: 'rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </Box>
            )}
            
            {/* Totals */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {archivedAlerts.length} of {totalAlerts} archived alerts
              </Typography>
            </Box>
          </>
        )}
        <FilterDrawer
          open={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          resultCount={totalAlerts}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          currentCity={city || 'Edinburgh'}
          isUsingCurrentLocation={city !== 'Edinburgh' && !!coords}
          onUseMyLocation={handleUseMyLocation}
          onResetLocation={handleResetLocation}
          locationLoading={locationLoading}
          locationAccuracy={locationAccuracy}
        />
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Container>
    </Layout>
  );
}

// Archive page component with proper suspense handling
export default function Archive() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <ArchiveContent />
    </Suspense>
  );
} 