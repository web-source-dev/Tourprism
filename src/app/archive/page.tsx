'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert } from '@/types';
import { fetchArchivedAlerts } from '@/services/api';
import Link from 'next/link';
import { 
  Box, Container, Typography, Button, Snackbar, Alert as MuiAlert, CircularProgress,
  Card, CardContent, Chip, Divider
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArchiveIcon from '@mui/icons-material/Archive';
import HistoryIcon from '@mui/icons-material/History';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import Layout from '@/components/Layout';
import FilterDrawer from '@/components/FilterDrawer';
import { Socket, io } from 'socket.io-client';

// Define interface for filter options
interface FilterOptions {
  sortBy: string;
  incidentTypes: string[];
  timeRange: number;
  distance: number;
}

// Create a client component that uses the useSearchParams hook
function ArchiveContent() {
  const [archivedAlerts, setArchivedAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAlerts, setTotalAlerts] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'newest',
    incidentTypes: [],
    timeRange: 0,
    distance: 50
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

  const loadArchivedAlerts = useCallback(async (pageNum = 1, resetAlerts = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const params: {
        page: number;
        limit: number;
        sortBy: string;
        latitude?: number;
        longitude?: number;
        distance?: number;
        city?: string;
        incidentTypes?: string[];
      } = {
        page: pageNum,
        limit: 10,
        sortBy: filters.sortBy,
      };
      
      // Add location parameters if available
      if (coords && coords.latitude && coords.longitude) {
        params.latitude = coords.latitude;
        params.longitude = coords.longitude;
        if (filters.distance > 0) {
          params.distance = filters.distance;
        }
      } else if (city && city !== 'Edinburgh') {
        params.city = city;
      }
      
      // Add incident type filters if selected
      if (filters.incidentTypes.length > 0) {
        params.incidentTypes = filters.incidentTypes;
      }
      
      const response = await fetchArchivedAlerts(params);
      
      if (resetAlerts) {
        setArchivedAlerts(response.alerts);
      } else {
        setArchivedAlerts(prev => [...prev, ...response.alerts]);
      }
      
      setTotalAlerts(response.totalCount);
      setPage(pageNum);
      setHasMore(pageNum * 10 < response.totalCount);
    } catch (err) {
      setError('Failed to load archived alerts. Please try again later.');
      console.error('Error loading archived alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, coords, city]);
  // Initialize socket connection
  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tourprism-backend-w5c1.onrender.com';
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.io server from Archive page');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.io connection error in Archive:', error);
    });

    // Listen for alert events that might require archive refresh
    socketRef.current.on('alert:updated', (data) => {
      console.log('Alert updated in archive context:', data);
      // If an alert's end date moves to the past, it should appear in archive
      loadArchivedAlerts(1, true);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [loadArchivedAlerts]);

  // Category icons mapping function
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'natural disaster':
        return '🌪️';
      case 'transportation':
        return '🚗';
      case 'security':
        return '🔒';
      case 'health':
        return '🏥';
      case 'political':
        return '🏛️';
      case 'other':
        return '📌';
      default:
        return '📍';
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time ago
  const formatTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = now.getTime() - created.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    
    if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Get current location
  const handleUseMyLocation = async () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      setSnackbarMessage('Geolocation is not supported by your browser');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setLocationLoading(false);
      return;
    }
    
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setLocationAccuracy(accuracy);
          
          // Get city name from coordinates
          try {
            const cityName = await getCityFromCoordinates(latitude, longitude);
            setCity(cityName);
          } catch (error) {
            console.error('Error getting city name:', error);
            setCity('Unknown location');
          }
          
          setCoords({ latitude, longitude });
          setLocationLoading(false);
          
          // Load alerts with new location
          loadArchivedAlerts(1, true);
        },
        (error) => {
          console.error('Error getting location:', error);
          setSnackbarMessage('Unable to get your location. Please try again or select a location manually.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error('Error in geolocation request:', error);
      setSnackbarMessage('An error occurred while trying to get your location.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setLocationLoading(false);
    }
  };

  // Get city name from coordinates
  const getCityFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();

      if (data.address) {
        return data.address.city || data.address.town || data.address.village || 'Unknown location';
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting location name:', error);
      return 'Unknown location';
    }
  };

  // Reset location to Edinburgh
  const handleResetLocation = useCallback(() => {
    setCity('Edinburgh');
    setCoords({ latitude: 55.9533, longitude: -3.1883 });
    setLocationAccuracy(null);
    
    // Load alerts with reset location
    loadArchivedAlerts(1, true);
  }, [loadArchivedAlerts]);

  // Load archived alerts
  useEffect(() => {
    loadArchivedAlerts(1, true);
  }, [loadArchivedAlerts]);

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
      incidentTypes: [],
      timeRange: 0,
      distance: 50
    });
  };

  return (
    <Layout onFilterOpen={() => setIsFilterDrawerOpen(true)} isFooter={false}>
      <Container maxWidth="lg" sx={{ pt: 1, pb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            <ArchiveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Archived Alerts
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => setIsFilterDrawerOpen(true)}
            sx={{ borderRadius: 2 }}
            startIcon={<FilterAltIcon />}
          >
            Filter
          </Button>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Viewing past alerts that have already ended. These alerts are kept for historical reference.
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Link href="/feed" style={{ textDecoration: 'none' }}>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<AccessTimeIcon />}
                sx={{ mr: 1, borderRadius: 2 }}
              >
                Current Alerts
              </Button>
            </Link>
          </Box>
        </Box>

        {loading && page === 1 ? (
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
            {/* Alerts list */}
            <Box sx={{ mb: 2 }}>
              {archivedAlerts.map((alert) => (
                <Card
                  key={alert._id}
                  id={`alert-${alert._id}`}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(0,0,0,0.12)',
                    transition: 'transform 0.2s, box-shadow 0.3s',
                    backgroundColor: highlightedAlertId === alert._id ? 'rgba(74, 144, 226, 0.05)' : 'white',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <CardContent sx={{ pt: 1.5, pb: 1, px: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
                      <Chip 
                        label={alert.alertType || 'General'} 
                        size="small" 
                        icon={<Box component="span">{getCategoryIcon(alert.alertCategory || '')}</Box>}
                        sx={{ borderRadius: 1, bgcolor: 'rgba(0,0,0,0.06)' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        <HistoryIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                        Ended {formatDateForDisplay(alert.expectedEnd || '')}
                      </Typography>
                    </Box>
                    
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.1rem' }}>
                      {alert.title || 'Archived Alert'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <LocationOnIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      {alert.city || 'Unknown location'}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 1, color: 'text.primary' }}>
                      {alert.description}
                    </Typography>
                    
                    <Divider sx={{ mb: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Posted {formatTime(alert.createdAt)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
            
            {/* Load more button */}
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loading}
                  sx={{ borderRadius: 2, position: 'relative', pl: loading ? 4 : 3, py: 0.75 }}
                >
                  {loading && <CircularProgress size={20} sx={{ position: 'absolute', left: 10 }} />}
                  Load More
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
        >
          <MuiAlert 
            elevation={6} 
            variant="filled" 
            severity={snackbarSeverity}
            onClose={handleCloseSnackbar}
          >
            {snackbarMessage}
          </MuiAlert>
        </Snackbar>
      </Container>
    </Layout>
  );
}

// Main Archive component with Suspense boundary
export default function Archive() {
  return (
    <Suspense fallback={
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    }>
      <ArchiveContent />
    </Suspense>
  );
} 