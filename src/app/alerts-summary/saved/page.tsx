'use client';

import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/ui/toast';

// Import the summaryService
import { 
  getSavedSummaries,
  deleteSummary,
  getSummaryById,
  Summary,
} from '@/services/summaryService';
import Layout from '@/components/Layout';

export default function SavedForecasts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [viewingReport, setViewingReport] = useState(false);
  const [error, setError] = useState('');
  const [savedForecasts, setSavedForecasts] = useState<Summary[]>([]);
  const { showToast } = useToast();
  const { isCollaboratorViewer } = useAuth();

  useEffect(() => {
    loadSavedForecasts();
  }, []);

  const loadSavedForecasts = async () => {
    try {
      setLoading(true);
      const response = await getSavedSummaries();
      if (response.success) {
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

  const handleDeleteForecast = async (id: string) => {
    try {
      setLoading(true);
      const response = await deleteSummary(id);
      if (response.success) {
        // Update the list after deletion
        setSavedForecasts(savedForecasts.filter(forecast => forecast._id !== id));
        showToast('Forecast deleted successfully', 'success');
      } else {
        showToast('Failed to delete forecast', 'error');
      }
    } catch (error) {
      console.error('Error deleting forecast:', error);
      setError('Failed to delete forecast. Please try again.');
      showToast('Failed to delete forecast', 'error');
    } finally {
      setLoading(false);
    }
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

  if (loading && savedForecasts.length === 0) {
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
          mb: 4,
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
        </Box>

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
              No Saved Forecasts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You haven't saved any forecasts yet. Create a custom forecast or save a weekly forecast to see it here.
            </Typography>
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Saved {format(parseISO(forecast.createdAt), 'MMM dd, yyyy')}
                    </Typography>
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