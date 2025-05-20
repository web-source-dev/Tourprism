'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Container,
  Card,
  Badge,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TuneRounded as TuneIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/ui/toast';

// Import the summaryService
import {
  getSavedSummaries,
  Summary,
} from '@/services/summaryService';
import Layout from '@/components/Layout';
import FilterModal from '@/components/FilterModal';
import { FilterOptions, extractLocations, filterSummaries } from '@/utils/summaryFilters';
import { useAuth } from '@/context/AuthContext';

export default function SavedForecasts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState(false);
  const [error, setError] = useState('');
  const [savedForecasts, setSavedForecasts] = useState<Summary[]>([]);
  const [allForecasts, setAllForecasts] = useState<Summary[]>([]);
  const { showToast } = useToast();
  const { isSubscribed } = useAuth();

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    reportType: '',
    location: '',
    dateCreated: '',
    customDateStart: '',
    customDateEnd: '',
    deliveryMethod: '',
  });

  // Modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>({
    reportType: '',
    location: '',
    dateCreated: '',
    customDateStart: '',
    customDateEnd: '',
    deliveryMethod: '',
  });

  // Extract locations from summaries for the location filter dropdown
  const locations = useMemo(() => {
    return extractLocations(allForecasts);
  }, [allForecasts]);

  // Calculate if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => 
      value !== '' && value !== undefined
    );
  }, [filters]);

  useEffect(() => {
    loadSavedForecasts();
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    if (allForecasts.length > 0) {
      const filteredForecasts = filterSummaries(allForecasts, filters);
      setSavedForecasts(filteredForecasts);
    }
  }, [filters, allForecasts]);

  // Check subscription status on mount
  useEffect(() => {
    if (!isSubscribed && filters.dateCreated === 'Custom') {
      // Reset custom date filter if user is not subscribed
      setFilters(prev => ({
        ...prev,
        dateCreated: '',
        customDateStart: '',
        customDateEnd: ''
      }));
      showToast('Custom date range is available with subscription', 'error');
    }
  }, [isSubscribed, filters.dateCreated, showToast]);

  const loadSavedForecasts = async () => {
    try {
      setLoading(true);
      const response = await getSavedSummaries();
      if (response.success) {
        setAllForecasts(response.summaries);
        setSavedForecasts(response.summaries);
      } else {
        setError('Failed to load saved forecasts');
        showToast('Failed to load saved forecasts', 'error');
      }
    } catch (error) {
      console.error('Error loading saved forecasts:', error);
      setError('Failed to load saved forecasts. Please try again.');
      showToast('Failed to load saved forecasts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open filter modal and initialize temp filters
  const handleOpenFilterModal = () => {
    setTempFilters({ ...filters });
    setIsFilterModalOpen(true);
  };

  // Close filter modal without applying changes
  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  // Apply filters from the modal
  const handleApplyFilters = () => {
    setFilters({ ...tempFilters });
  };

  // Clear all filters
  const handleClearFilters = () => {
    const resetFilters = {
      reportType: '',
      location: '',
      dateCreated: '',
      customDateStart: '',
      customDateEnd: '',
      deliveryMethod: '',
    };
    
    setTempFilters(resetFilters);
    
    // If applied directly (not from modal)
    if (!isFilterModalOpen) {
      setFilters(resetFilters);
    }
  };

  // Handle filter changes in the modal
  const handleTempFilterChange = (newFilters: FilterOptions) => {
    setTempFilters(newFilters);
  };



  const handleViewSavedForecast = (id: string) => {
    setViewingReport(true);
    showToast('Loading report...', 'success');
    setTimeout(() => {
      router.push(`/alerts-summary/${id}`);
    }, 1000); // Small delay to show loading state
  };

  const handleBackToSummary = () => {
    router.push('/alerts-summary');
  };

  if (viewingReport) {
    return (
      <Layout isFooter={false}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            gap: 2,
            p: 3
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="h6">Loading Report</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Please wait while we prepare your report...
          </Typography>
        </Box>
      </Layout>
    );
  }

  if (loading && allForecasts.length === 0) {
    return (
      <Layout isFooter={false}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout isFooter={false}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        {/* Header with back button and title */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          mt: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleBackToSummary}
              sx={{ mr: 1, p: 0 }}
              aria-label="Back"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="h1" fontWeight="500">
              Saved Reports
            </Typography>
          </Box>

          {/* Filter Icon Button */}
          {allForecasts.length > 0 && (
            <IconButton
              onClick={handleOpenFilterModal}
              sx={{
                color: hasActiveFilters ? 'primary.main' : 'text.primary',
                bgcolor: hasActiveFilters ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                borderRadius: 2,
                p: 1,
                '&:hover': {
                  bgcolor: hasActiveFilters ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <Badge
                color="primary"
                variant="dot"
                invisible={!hasActiveFilters}
              >
                <TuneIcon />
              </Badge>
            </IconButton>
          )}
        </Box>

        {/* Filter Modal */}
        <FilterModal
          open={isFilterModalOpen}
          onClose={handleCloseFilterModal}
          filters={tempFilters}
          onFilterChange={handleTempFilterChange}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          locations={locations}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {savedForecasts.length === 0 ? (
          <Paper
            elevation={1}
            sx={{
              p: 4,
              borderRadius: 4,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="h6">
              {allForecasts.length === 0 ? 'No Saved Forecasts' : 'No Forecasts Match Your Filters'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {allForecasts.length === 0
                ? "You haven't saved any forecasts yet. Create a custom forecast or save a weekly forecast to see it here."
                : "Try adjusting your filter criteria to see more results."}
            </Typography>

            {allForecasts.length === 0 ? (
              <Button
                variant="contained"
                onClick={handleBackToSummary}
                sx={{
                  mt: 2,
                  backgroundColor: '#000',
                  '&:hover': {
                    backgroundColor: '#333',
                  }
                }}
              >
                Back to Forecasts
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{
                  mt: 2,
                  borderColor: '#000',
                  color: '#000',
                  '&:hover': {
                    borderColor: '#333',
                    backgroundColor: 'rgba(0,0,0,0.04)',
                  }
                }}
              >
                Clear Filters
              </Button>
            )}
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {savedForecasts.map((forecast) => (
              <Box key={forecast._id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 11px)' } }}>
                <Card sx={{
                  borderRadius: 3,
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0px 2px 10px rgba(0,0,0,0.05)',
                  border: '1px solid #f0f0f0'
                }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight="500" gutterBottom>
                      {forecast.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {forecast.timeRange.startDate && forecast.timeRange.endDate ?
                        `${format(parseISO(forecast.timeRange.startDate), 'dd MMM')} - ${format(parseISO(forecast.timeRange.endDate), 'dd MMM, yyyy')}` :
                        'Date range not specified'
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Saved {format(parseISO(forecast.createdAt), 'MMM dd, yyyy')}
                    </Typography>

                    {/* Display report type tag */}
                    <Box sx={{ mb: 2, mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          bgcolor: 'rgba(0,0,0,0.05)',
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}
                      >
                        {forecast.summaryType === 'forecast' ? 'Weekly Forecast' :
                          forecast.summaryType === 'custom' ? 'Custom Report' :
                            'Automated Report'}
                      </Box>

                      {/* Display location tag if available */}
                      {forecast.locations && forecast.locations[0]?.city && (
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            bgcolor: 'rgba(25,118,210,0.08)',
                            borderRadius: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          {forecast.locations[0].city}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleViewSavedForecast(forecast._id)}
                      sx={{
                        borderRadius: 5,
                        py: 1.2,
                        textTransform: 'none',
                        color: 'black',
                        borderColor: '#e0e0e0',
                        backgroundColor: '#f5f5f5',
                        '&:hover': {
                          backgroundColor: '#eeeeee',
                          borderColor: '#d0d0d0',
                        }
                      }}
                    >
                      View Report
                    </Button>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Layout>
  );
} 