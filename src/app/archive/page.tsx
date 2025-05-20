'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, FilterOptions } from '@/types';
import { fetchArchivedAlerts } from '@/services/api';
import Link from 'next/link';
import { 
  Box, Container, Typography, Button, Snackbar, CircularProgress,
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

  // Format time for display
  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return formatDateForDisplay(timestamp);
    }
  };

  // Load archived alerts function with updated filter params
  const loadArchivedAlerts = useCallback(async (pageNum: number, reset: boolean) => {
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
      
      // Add date range filter if selected
      if (filters.timeRange > 0 && filters.timeRange !== -1) {
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + filters.timeRange);
        
        params.startDate = today.toISOString();
        params.endDate = endDate.toISOString();
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
      
      if (reset) {
        setArchivedAlerts(result.alerts);
      } else {
        setArchivedAlerts(prev => [...prev, ...result.alerts]);
      }
      
      setTotalAlerts(result.totalCount);
      setHasMore(result.alerts.length === 10);
      setPage(pageNum);
      setError(null);
    } catch (error) {
      console.error('Error loading archived alerts:', error);
      setError('Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
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
            setCoords({ latitude, longitude });
            
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
                
              setCity(locationName);
              setLocationLoading(false);
              
              // Show success toast
              showToast(`Using location: ${locationName}`, "success");
              
              // Load alerts with the new location
              await loadArchivedAlerts(1, true);
            } catch (error) {
              console.error('Error getting location name:', error);
              setCity('Current Location');
              setLocationLoading(false);
              
              // Show error toast
              showToast("Using location with unknown name", "error");
              
              // Still load alerts with the coordinates
              await loadArchivedAlerts(1, true);
            }
          },
          (error) => {
            console.error('Error getting location:', error);
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
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
          }
        );
      } else {
        setLocationLoading(false);
        showToast("Geolocation is not supported by your browser", "error");
      }
    } catch (error) {
      console.error('Error in geolocation:', error);
      setLocationLoading(false);
      showToast("Error getting your location", "error");
    }
  };

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
        </Snackbar>
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