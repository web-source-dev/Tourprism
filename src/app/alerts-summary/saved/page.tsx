'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useToast } from '@/ui/toast';
import { formatStandardDate } from '@/utils/dateFormat';

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
    location: 'Edinburgh',
    dateCreated: 'This Week',
    customDateStart: '',
    customDateEnd: '',
    deliveryMethod: '',
  });

  // Modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>({
    reportType: '',
    location: 'Edinburgh',
    dateCreated: 'This Week',
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

  const loadSavedForecasts = useCallback(async () => {
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
  }, [showToast]);

  useEffect(() => {
    loadSavedForecasts();
  }, [loadSavedForecasts]);

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
      location: 'Edinburgh',
      dateCreated: 'This Week',
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
      <Layout isFooter={false} isHeader={false}>
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
      <Layout isFooter={false} isHeader={false}>
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
    <Layout isFooter={false} isHeader={false}>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 }, py: 2 }}>
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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.70898 9.99971C2.70899 10.311 2.84703 10.5998 2.97775 10.8167C3.11881 11.0507 3.30852 11.2923 3.51664 11.5279C3.93413 12.0004 4.47887 12.5079 5.00751 12.967C5.53926 13.4287 6.06917 13.8539 6.46503 14.1629C6.66328 14.3176 6.82868 14.4438 6.94485 14.5316C7.00295 14.5755 7.04878 14.6098 7.0803 14.6333L7.11661 14.6602L7.12624 14.6674L7.12958 14.6698C7.4075 14.8746 7.79912 14.8155 8.00383 14.5376C8.20854 14.2597 8.14922 13.8684 7.87133 13.6637L7.86072 13.6559L7.82735 13.6311C7.79783 13.6091 7.75415 13.5764 7.69832 13.5342C7.58662 13.4498 7.42651 13.3276 7.23414 13.1775C6.84875 12.8767 6.33701 12.4659 5.8271 12.0231C5.31408 11.5776 4.81716 11.112 4.45341 10.7002C4.43041 10.6742 4.40814 10.6486 4.38662 10.6235L16.6673 10.6235C17.0125 10.6235 17.2923 10.3436 17.2923 9.99847C17.2923 9.65329 17.0125 9.37347 16.6673 9.37347L4.38873 9.37347C4.4096 9.34913 4.43116 9.32436 4.45341 9.29917C4.81716 8.88745 5.31408 8.42176 5.8271 7.97627C6.33701 7.53347 6.84875 7.12272 7.23414 6.82192C7.4265 6.67177 7.58662 6.54961 7.69832 6.46523C7.75415 6.42305 7.79783 6.39035 7.82735 6.36835L7.86072 6.34354L7.87133 6.3357C8.14921 6.13097 8.20854 5.73974 8.00383 5.46184C7.79911 5.18392 7.4075 5.12484 7.12958 5.32956L7.12624 5.33203L7.11661 5.33916L7.0803 5.36614C7.04878 5.38964 7.00295 5.42395 6.94485 5.46784C6.82868 5.5556 6.66328 5.6818 6.46502 5.83654C6.06917 6.14552 5.53926 6.5707 5.00751 7.03245C4.47887 7.49151 3.93413 7.99899 3.51664 8.47155C3.30852 8.70712 3.11881 8.94872 2.97775 9.18274C2.84782 9.39829 2.71064 9.68494 2.709 9.9941" fill="#212121" />
              </svg>

            </IconButton>
            <Typography variant="h6" component="h1" fontWeight="600" sx={{ fontSize: '18px', fontFamily: 'Poppins' }}>
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
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clipRule="evenodd" d="M4.6366 1.6875C4.6496 1.6875 4.66264 1.6875 4.67573 1.6875L13.3634 1.6875C13.9413 1.68747 14.4319 1.68745 14.819 1.74023C15.2287 1.79609 15.6205 1.92219 15.9204 2.25232C16.2229 2.58535 16.3057 2.9867 16.3121 3.39696C16.318 3.7801 16.2568 4.25604 16.1853 4.81096L16.1801 4.85137C16.1549 5.04774 16.117 5.23767 16.038 5.42783C15.9578 5.6209 15.8474 5.78533 15.7098 5.94874C14.975 6.82165 13.6091 8.39917 11.6861 9.83579C11.655 9.85903 11.6157 9.91411 11.6082 9.99675C11.4214 12.0614 11.257 13.1538 11.1385 13.7867C11.0102 14.4711 10.4882 14.9448 10.0381 15.2709C9.80257 15.4416 9.55255 15.5953 9.32986 15.7308C9.312 15.7417 9.29437 15.7524 9.27695 15.763C9.06893 15.8895 8.89208 15.997 8.74425 16.1015C8.33887 16.3882 7.87119 16.3681 7.5137 16.1598C7.17635 15.9633 6.93897 15.6049 6.89097 15.1995C6.78563 14.3097 6.59464 12.5677 6.38382 9.99194C6.37706 9.90932 6.36415 9.88534 6.36307 9.88334C6.36234 9.88196 6.36044 9.87846 6.35414 9.87154C6.3471 9.8638 6.33302 9.85009 6.30626 9.83008C4.38714 8.39526 3.02387 6.8205 2.29013 5.94871C2.1531 5.7859 2.03941 5.62538 1.95834 5.43017C1.87898 5.23906 1.84514 5.04817 1.81983 4.85137C1.81809 4.83785 1.81636 4.82438 1.81463 4.81095C1.74322 4.25604 1.68197 3.7801 1.6879 3.39695C1.69425 2.9867 1.77706 2.58535 2.0796 2.25232C2.37951 1.92219 2.77127 1.79609 3.18098 1.74023C3.56806 1.68745 4.05868 1.68747 4.6366 1.6875ZM3.33296 2.85491C3.04488 2.89419 2.9581 2.95837 2.9123 3.00878C2.86913 3.05631 2.81701 3.13999 2.81276 3.41437C2.80824 3.70659 2.85759 4.10109 2.93564 4.70784C2.95732 4.87645 2.97632 4.94815 2.99732 4.99872C3.01661 5.04518 3.0508 5.10541 3.15085 5.22429C3.86957 6.07823 5.16635 7.57317 6.9799 8.92906C7.12561 9.038 7.25928 9.17285 7.356 9.35445C7.45128 9.53337 7.49028 9.71952 7.50507 9.90017C7.71474 12.4619 7.90435 14.1903 8.00817 15.0672C8.01133 15.094 8.02107 15.1203 8.03606 15.1433C8.05138 15.1668 8.06841 15.181 8.08 15.1877C8.08148 15.1886 8.08277 15.1893 8.08389 15.1898C8.08656 15.1884 8.09016 15.1862 8.09474 15.183C8.27632 15.0546 8.48708 14.9265 8.686 14.8057C8.7058 14.7936 8.72549 14.7817 8.74502 14.7698C8.96912 14.6334 9.18345 14.5009 9.37801 14.3599C9.78812 14.0628 9.98927 13.8113 10.0327 13.5796C10.1426 12.9932 10.3029 11.9386 10.4878 9.89536C10.5217 9.521 10.7055 9.1641 11.0128 8.93453C12.83 7.5769 14.1294 6.07928 14.8491 5.22427C14.9364 5.12058 14.9752 5.05373 14.9991 4.9962C15.0242 4.93577 15.0453 4.8558 15.0643 4.70784C15.1424 4.10109 15.1917 3.70659 15.1872 3.41437C15.183 3.13999 15.1308 3.05631 15.0877 3.00878C15.0419 2.95837 14.9551 2.89419 14.667 2.85491C14.365 2.81374 13.952 2.8125 13.3242 2.8125H4.67573C4.04795 2.8125 3.63495 2.81374 3.33296 2.85491ZM8.07799 15.1925C8.07802 15.1924 8.07839 15.1923 8.07908 15.1921L8.07799 15.1925Z" fill="black" />
                </svg>

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
              bgcolor: 'transparent',
              boxShadow: 'none',
              border: '1px solid rgb(221,221,221)',
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
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                  border: '1px solid rgb(221,221,221)',
                }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body1" fontWeight="600" sx={{ fontSize: '16px', fontFamily: 'Poppins' }}>
                      {forecast.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px', fontWeight: 500, fontFamily: 'Inter' }}>
                      {forecast.timeRange.startDate && forecast.timeRange.endDate ?
                        `${formatStandardDate(forecast.timeRange.startDate)} - ${formatStandardDate(forecast.timeRange.endDate)}` :
                        'Date range not specified'
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ my: 1, fontSize: '14px', fontWeight: 500, fontFamily: 'Inter' }}>
                      Saved {formatStandardDate(forecast.createdAt)}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleViewSavedForecast(forecast._id)}
                      sx={{
                        borderRadius: 2,
                        height: '40px',
                        textTransform: 'none',
                        color: 'black',
                        borderColor: '#e0e0e0',
                        backgroundColor: '#EBEBEC',
                        '&:hover': {
                          backgroundColor: '#EBEBEC',
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