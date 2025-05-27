'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ArrowForward as ArrowForwardIcon,
  LocationOn as LocationIcon,
  Event as EventIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/ui/toast';
// Import the summaryService
import { 
  getSummaryById,
  Summary,
  getUpcomingForecasts,
  generateSummary,
  downloadPdf,
  generatePdfOnDemand,
  deleteSummary
} from '@/services/summaryService';
import Layout from '@/components/Layout';
import ShareForecastModal from '@/components/ShareForecastModal';

interface AlertItem {
  _id: string;
  title: string;
  description: string;
  alertType: string;
  alertCategory?: string;
  impact: string;
  originCity?: string;
  city?: string;
  expectedStart?: string;
  expectedEnd?: string;
}

export default function ForecastDetail() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forecast, setForecast] = useState<Summary | null>(null);
  const [saved, setSaved] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { showToast } = useToast();
  
  const { isCollaboratorViewer } = useAuth();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const isViewOnly = () => {
    return isCollaboratorViewer;
  };

  // Extract the ID from params and query params
  const id = params?.id as string;
  
  const loadForecastDetails = useCallback(async (forecastId: string) => {
    try {
      setLoading(true);
      const response = await getSummaryById(forecastId);
      
      if (response.success) {
        setForecast(response.summary);
        setPdfUrl(response.summary.pdfUrl || null);
        setSaved(true); // It's already saved if we're viewing it by ID
      } else {
        setError('Failed to load forecast details.');
        showToast('Failed to load forecast details', 'error');
      }
    } catch (error) {
      console.error('Error loading forecast details:', error);
      setError('An error occurred while loading the forecast. Please try again.');
      showToast('Failed to load forecast', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadWeeklyForecast = useCallback(async (existingPdfUrl?: string) => {
    setLoading(true);
    
    try {
      // Get real data from the API
      showToast('Loading weekly forecast...', 'success');
      const response = await getUpcomingForecasts(7);
      
      if (!response.success || !response.forecast) {
        setError('Failed to load the weekly forecast. Please try again.');
        showToast('Failed to load weekly forecast', 'error');
        setLoading(false);
        return;
      }
      
      // Transform the forecast to match our Summary interface
      const weeklyForecast: Summary = {
        _id: 'weekly-forecast',
        userId: '',
        title: response.forecast.title || 'Weekly Disruption Forecast',
        description: 'Automatically generated weekly forecast of upcoming disruptions',
        summaryType: 'forecast',
        parameters: {
          alertCategory: response.forecast.alertCategory,
          impact: response.forecast.impact,
        },
        timeRange: {
          startDate: response.forecast.timeRange?.startDate,
          endDate: response.forecast.timeRange?.endDate,
        },
        includedAlerts: response.forecast.alerts || [],
        htmlContent: response.forecast.htmlContent,
        pdfUrl: existingPdfUrl || response.forecast?.pdfUrl, // Use the provided PDF URL or the one from response
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setForecast(weeklyForecast);
      setPdfUrl(weeklyForecast.pdfUrl || null);
      setSaved(false); // Weekly forecasts are not saved by default
    } catch (error) {
      console.error('Error creating weekly forecast:', error);
      setError('Failed to generate weekly forecast.');
      showToast('Failed to generate weekly forecast', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const loadForecastData = async () => {
      // Parse query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const queriedPdfUrl = urlParams.get('pdf');
      
      if (id && id !== 'weekly-forecast' && id !== 'custom-forecast') {
        // It's a saved forecast with an ID - load it from the server
        await loadForecastDetails(id);
      } else if (id === 'weekly-forecast') {
        // Handle weekly forecast view
        if (queriedPdfUrl) {
          setPdfUrl(queriedPdfUrl);
          loadWeeklyForecast(queriedPdfUrl);
        } else {
          // No PDF URL provided - load standard weekly forecast
          loadWeeklyForecast();
        }
      }
    };
    
    loadForecastData();
  }, [id, loadForecastDetails, loadWeeklyForecast, showToast]);

  const handleSave = async () => {
    // Only proceed if not already saved
    if (saved || !forecast || isViewOnly()) return;
    
    try {
      setLoading(true);
      showToast('Saving forecast...', 'success');
      
      // Prepare the alert types array
      const alertTypes = forecast.parameters.alertCategory 
        ? [forecast.parameters.alertCategory] 
        : [];
      
      // Create a summary object to save
      const summaryToSave = {
        title: forecast.title || 'Disruption Forecast',
        description: forecast.description || 'Manually saved forecast',
        summaryType: 'forecast',
        startDate: forecast.timeRange.startDate,
        endDate: forecast.timeRange.endDate,
        alertTypes: alertTypes,
        impact: forecast.parameters.impact,
        includeDuplicates: false,
        generatePDF: true,
        autoSave: true, // Set to true since user is explicitly saving
        locations: forecast.locations || []
      };
      
      // Call the API to save the forecast
      const response = await generateSummary({
        ...summaryToSave,
        summaryType: 'forecast' as const // Explicitly assert the type
      });
      
      if (response.success) {
        // Set saved state to true
        setSaved(true);
        showToast('Forecast saved successfully', 'success');
        
        // If we have a savedSummaryId, update our current URL to reflect that
        if (response.summary.savedSummaryId) {
          // Update the forecast object with the saved summary ID
          setForecast({
            ...forecast,
            _id: response.summary.savedSummaryId,
            pdfUrl: response.summary.pdfUrl || forecast.pdfUrl
          } as Summary);
          
          // Update the URL without full page refresh
          router.replace(`/alerts-summary/${response.summary.savedSummaryId}`, { scroll: false });
        }
      } else {
        setError('Failed to save the forecast.');
        showToast('Failed to save the forecast', 'error');
      }
    } catch (error) {
      console.error('Error saving forecast:', error);
      setError('Failed to save the forecast.');
      showToast('Failed to save the forecast', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    // Only proceed if already saved, we have a forecast, and the user has permission
    if (!saved || !forecast || isViewOnly() || !forecast._id || 
        forecast._id === 'weekly-forecast' || forecast._id === 'custom-forecast') return;
    
    try {
      setLoading(true);
      showToast('Deleting forecast...', 'success');
      
      // Call the API to delete the forecast
      const response = await deleteSummary(forecast._id);
      
      if (response.success) {
        showToast('Forecast deleted successfully', 'success');
        // Navigate to the saved forecasts page
        router.push('/alerts-summary/saved');
      } else {
        setError('Failed to delete the forecast.');
        showToast('Failed to delete the forecast', 'error');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error deleting forecast:', error);
      setError('Failed to delete the forecast.');
      showToast('Failed to delete the forecast', 'error');
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (loading || !forecast) return;
    
    try {
      setLoading(true);
      showToast('Preparing download...', 'success');
      
      // Check if we have alert data available for client-side generation
      if (Array.isArray(forecast.includedAlerts) && forecast.includedAlerts.length > 0) {
        // Generate PDF on client side using alert data
        const options = {
          title: forecast.title,
          startDate: forecast.timeRange.startDate,
          endDate: forecast.timeRange.endDate,
          location: forecast.locations && forecast.locations.length > 0 
            ? forecast.locations[0].city 
            : undefined,
          alertCategory: forecast.parameters.alertCategory,
          impact: forecast.parameters.impact
        };
        
        const success = await downloadPdf(
          null, // No need for backend URL
          `${forecast.title.replace(/\s+/g, '_')}.pdf`,
          forecast.includedAlerts as unknown as AlertItem[],
          options
        );
        
        if (success) {
          showToast('Download started', 'success');
        } else {
          showToast('Failed to generate PDF', 'error');
        }
        
        setLoading(false);
        return;
      }
      
      // Fallback to using the PDF URL if client-side generation fails or no alert data
      if (forecast.pdfUrl || pdfUrl) {
        // Use the downloadPdf utility function with the URL
        const success = await downloadPdf(
          forecast.pdfUrl || pdfUrl || '', 
          `${forecast.title.replace(/\s+/g, '_')}.pdf`
        );
        
        if (success) {
          showToast('Download started', 'success');
        } else {
          showToast('Failed to download PDF', 'error');
        }
        
        setLoading(false);
        return;
      }
      
      // No PDF URL or alert data - try to generate one
      if (forecast._id && forecast._id !== 'weekly-forecast' && forecast._id !== 'custom-forecast') {
        // Try to get the alert data first for client-side generation
        try {
          const response = await getSummaryById(forecast._id);
          if (response.success && response.summary && Array.isArray(response.summary.includedAlerts) && response.summary.includedAlerts.length > 0) {
            // Update the forecast with the full alert data
            setForecast(response.summary);
            
            // Generate PDF on client side
            const options = {
              title: response.summary.title,
              startDate: response.summary.timeRange.startDate,
              endDate: response.summary.timeRange.endDate,
              location: response.summary.locations && response.summary.locations.length > 0 
                ? response.summary.locations[0].city 
                : undefined,
              alertCategory: response.summary.parameters.alertCategory,
              impact: response.summary.parameters.impact
            };
            
            const success = await downloadPdf(
              null,
              `${response.summary.title.replace(/\s+/g, '_')}.pdf`,
              response.summary.includedAlerts as unknown as AlertItem[],
              options
            );
            
            if (success) {
              showToast('Download started', 'success');
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('Error getting alert data for PDF generation:', error);
          // Fall through to backend generation if client-side fails
        }
        
        // Fall back to backend generation if necessary
        showToast('Generating PDF...', 'success');
        const pdfUrl = await generatePdfOnDemand(forecast._id);
        
        if (pdfUrl) {
          // Set the PDF URL in state
          setPdfUrl(pdfUrl);
          
          // Download the newly generated PDF
          const success = await downloadPdf(
            pdfUrl,
            `${forecast.title.replace(/\s+/g, '_')}.pdf`
          );
          
          if (success) {
            showToast('Download started', 'success');
          } else {
            showToast('Failed to download PDF', 'error');
          }
        } else {
          setError('Failed to generate PDF. Please try again.');
          showToast('Failed to generate PDF', 'error');
        }
      } else {
        // It's a weekly or custom forecast - try to generate a new PDF without saving
        showToast('Generating PDF...', 'success');
        const data = {
          title: forecast.title,
          description: forecast.description,
          summaryType: 'forecast' as const,
          startDate: forecast.timeRange.startDate,
          endDate: forecast.timeRange.endDate,
          alertTypes: forecast.parameters.alertCategory ? [forecast.parameters.alertCategory] : [],
          impact: forecast.parameters.impact,
          generatePDF: true,
          autoSave: false, // Don't save
        };
        
        const response = await generateSummary(data);
        
        if (response.success) {
          if (response.summary.alerts && response.summary.alerts.length > 0) {
            // We have alert data, use client-side generation
            const options = {
              title: forecast.title,
              startDate: forecast.timeRange.startDate,
              endDate: forecast.timeRange.endDate,
              location: forecast.locations && forecast.locations.length > 0 
                ? forecast.locations[0].city 
                : undefined,
              alertCategory: forecast.parameters.alertCategory,
              impact: forecast.parameters.impact
            };
            
            const success = await downloadPdf(
              null,
              `${forecast.title.replace(/\s+/g, '_')}.pdf`,
              response.summary.alerts as unknown as AlertItem[],
              options
            );
            
            if (success) {
              showToast('Download started', 'success');
              setLoading(false);
              return;
            }
          } else if (response.summary.pdfUrl) {
            // Fall back to using the backend URL if available
            setPdfUrl(response.summary.pdfUrl);
            
            const success = await downloadPdf(
              response.summary.pdfUrl,
              `${forecast.title.replace(/\s+/g, '_')}.pdf`
            );
            
            if (success) {
              showToast('Download started', 'success');
              setLoading(false);
              return;
            }
          }
        }
        
        // If we get here, all attempts failed
        setError('Failed to generate PDF. Please try again.');
        showToast('Failed to generate PDF', 'error');
      }
    } catch (error) {
      console.error('Error downloading forecast:', error);
      setError('Failed to download the forecast. Please try again.');
      showToast('Failed to download the forecast', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    // Show the share modal instead of using the Web Share API
    setShareModalOpen(true);
  };

  const handleBackToList = () => {
    router.push('/alerts-summary');
  };

  // Sort alerts by impact severity and date
  const getSortedAlerts = () => {
    if (!Array.isArray(forecast?.includedAlerts) || forecast?.includedAlerts.length === 0) {
      return [];
    }
    
    const alerts = forecast.includedAlerts as unknown as AlertItem[];
    
    // Sort alerts by impact severity (Severe > Moderate > Minor) and then by date
    const impactOrder: Record<string, number> = { "Severe": 0, "Moderate": 1, "Minor": 2, "": 3 };
    
    return alerts.sort((a, b) => {
      // First by impact severity
      const aImpactScore = impactOrder[a.impact || ""] || 3;
      const bImpactScore = impactOrder[b.impact || ""] || 3;
      
      if (aImpactScore !== bImpactScore) {
        return aImpactScore - bImpactScore;
      }
      
      // Then by start date if available
      if (a.expectedStart && b.expectedStart) {
        return new Date(a.expectedStart).getTime() - new Date(b.expectedStart).getTime();
      }
      
      // Otherwise keep original order
      return 0;
    });
  };

  // Get impact color based on severity
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Severe':
        return '#d32f2f';
      case 'Moderate':
        return '#f57c00';
      case 'Minor':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <Layout isFooter={false}>
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={handleBackToList}>
          Back to Forecasts
        </Button>
      </Box>
      </Layout>
    );
  }

  if (!forecast) {
    return (
      <Layout isFooter={false}>
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Forecast not found.
        </Alert>
        <Button variant="outlined" onClick={handleBackToList}>
          Back to Forecasts
        </Button>
      </Box>
      </Layout>
    );
  }

  // Get all alerts sorted by impact
  const sortedAlerts = getSortedAlerts();
  const location = forecast.locations && forecast.locations.length > 0 
    ? forecast.locations[0].city 
    : sortedAlerts.length > 0 ? (sortedAlerts[0].originCity || sortedAlerts[0].city) : 'Selected Location';
  
  // Format creation time according to standardized format
  const getTimeAgo = () => {
    if (!forecast.createdAt) return '';
    const createdDate = new Date(forecast.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    
    // Calculate time differences in various units
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Format based on time difference:
    // < 60s: show seconds
    // < 60m: show minutes
    // < 24h: show hours
    // < 30d: show days
    // >= 30d: show date as DD MMM
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 30) {
      return `${diffDays}d ago`;
    } else {
      // Format as DD MMM
      return format(createdDate, 'd MMM');
    }
  };

  return (
    <Layout isFooter={false}>
      <IconButton onClick={() => router.back()}>
        <ArrowBackIcon />
        <Typography variant="body1" fontWeight="500" color="text.primary" sx={{ ml: 1 , fontSize: '20px' }}>
          Saved Forecasts
        </Typography>
      </IconButton>
      <Box sx={{ 
        px: 3, 
        py: 2,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            {forecast.title.includes('Weekly') ? `Weekly Forecast - ${location}` : forecast.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {forecast.timeRange.startDate ? format(parseISO(forecast.timeRange.startDate), 'd MMM, yyyy') : new Date().toLocaleDateString()}
            {forecast.timeRange.endDate && ` - ${format(parseISO(forecast.timeRange.endDate), 'd MMM, yyyy')}`}
          </Typography>
        </Box>
        
        {/* Branding */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          pb: 1.5, 
          borderRadius: 1.5 
        }}>
          <Box sx={{ 
            bgcolor: '#0066ff', 
            color: 'white', 
            borderRadius: 1, 
            p: 0.5, 
            mr: 1.5, 
            width: 30, 
            height: 30, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            fontWeight: 'bold'
          }}>
            T
          </Box>
          <Typography variant="body2" fontWeight="medium">
            Powered by Tourprism
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />
        
        {/* Time ago */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {getTimeAgo()}
        </Typography>
        
        {/* Alert Content */}
        {sortedAlerts.length > 0 ? (
          <Box sx={{ mb: 'auto' }}>

            {/* List of alerts grouped by impact */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Group alerts by impact */}
              {['Severe', 'Moderate', 'Minor'].map(impactLevel => {
                const alertsWithImpact = sortedAlerts.filter(alert => alert.impact === impactLevel);
                if (alertsWithImpact.length === 0) return null;
                
                return (
                  <Box key={impactLevel} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: getImpactColor(impactLevel) 
                      }} />
                      <Typography variant="subtitle1" fontWeight="bold">
                        {impactLevel} Impact ({alertsWithImpact.length})
                      </Typography>
                    </Box>
                    
                    {alertsWithImpact.map((alert, index) => (
                      <Paper 
                        key={alert._id || index} 
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          bgcolor: 'transparent',
                          border: '1px solid #eaeaea',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        
                        <Box sx={{ pl: 0.5 }}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {alert.title || 'Untitled Alert'}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {alert.originCity || alert.city || 'Location not specified'}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            {alert.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', gap: 2, mt: 2 }}>
                            {alert.expectedStart && (
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight="medium" color="text.secondary">
                                      Start: {format(parseISO(alert.expectedStart), 'dd MMM h:mma')}
                                    </Typography>
                                </Box>
                              </Box>
                            )}
                            
                            {alert.expectedEnd && (
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight="medium" color="text.secondary">
                                      End: {format(parseISO(alert.expectedEnd), 'dd MMM h:mma')}
                                    </Typography>
                                </Box>
                              </Box>
                            )}
                          </Box>

                          <Typography variant="body1" fontWeight="bold" mt={2} color="text.primary">
                            {alert.impact} Impact
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                );
              })}
              
              {/* Display alerts with unknown/unspecified impact */}
              {sortedAlerts.filter(alert => !['Severe', 'Moderate', 'Minor'].includes(alert.impact || '')).length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: '#757575' 
                    }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Other Alerts
                    </Typography>
                  </Box>
                  
                  {sortedAlerts.filter(alert => !['Severe', 'Moderate', 'Minor'].includes(alert.impact || '')).map((alert, index) => (
                    <Paper 
                      key={alert._id || index} 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        border: '1px solid #eaeaea',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '4px', 
                        height: '100%', 
                        backgroundColor: '#757575' 
                      }} />
                      
                      <Box sx={{ pl: 0.5 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {alert.title || 'Untitled Alert'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {alert.originCity || alert.city || 'Location not specified'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 2, 
                          flexWrap: 'wrap', 
                          alignItems: 'center', 
                          mb: 2 
                        }}>
                          {alert.alertCategory && (
                            <Chip 
                              label={alert.alertCategory} 
                              size="small"
                              sx={{ backgroundColor: '#f0f0f0' }} 
                            />
                          )}
                          
                          {alert.alertType && alert.alertType !== alert.alertCategory && (
                            <Chip 
                              label={alert.alertType} 
                              size="small"
                              sx={{ backgroundColor: '#f0f0f0' }} 
                            />
                          )}
                        </Box>
                        
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {alert.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                          {alert.expectedStart && (
                            <Box sx={{ flex: '1 1 45%', minWidth: '150px' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventIcon fontSize="small" color="action" />
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Start
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium">
                                    {format(parseISO(alert.expectedStart), 'dd MMM h:mma')}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          )}
                          
                          {alert.expectedEnd && (
                            <Box sx={{ flex: '1 1 45%', minWidth: '150px' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventIcon fontSize="small" color="action" />
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    End
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium">
                                    {format(parseISO(alert.expectedEnd), 'dd MMM h:mma')}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ mb: 'auto', mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              No alerts found for this forecast period.
            </Alert>
            <Typography variant="body2">
              There are currently no disruptions predicted for the selected time period.
            </Typography>
          </Box>
        )}
        
        {/* Footer with action buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          borderTop: '1px solid #eaeaea',
          pt: 2,
          mt: 4
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            cursor: 'pointer'
          }} onClick={handleDownload}>
            <DownloadIcon sx={{ mb: 0.5 }} />
            <Typography variant="caption">Download</Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            cursor: 'pointer'
          }} onClick={handleShare}>
            <ArrowForwardIcon sx={{ mb: 0.5 }} />
            <Typography variant="caption">Share</Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            cursor: isViewOnly() ? 'not-allowed' : 'pointer',
            opacity: isViewOnly() ? 0.5 : 1
          }} onClick={isViewOnly() ? undefined : (saved ? handleDelete : handleSave)}>
            {saved ? (
              <>
                <DeleteIcon sx={{ mb: 0.5, }} />
                <Typography variant="caption">Delete</Typography>
              </>
            ) : (
              <>
                <BookmarkBorderIcon sx={{ mb: 0.5 }} />
                <Typography variant="caption">Save</Typography>
              </>
            )}
          </Box>
        </Box>
        
        {/* Share Modal */}
        <ShareForecastModal 
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          forecastTitle={forecast?.title}
        />
      </Box>
    </Layout>
  );
}