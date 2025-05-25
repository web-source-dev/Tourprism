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
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
    ArrowForward as ArrowForwardIcon,
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
  generatePdfOnDemand
} from '@/services/summaryService';
import Layout from '@/components/Layout';
import ShareForecastModal from '@/components/ShareForecastModal';

interface AlertItem {
  _id: string;
  title: string;
  description: string;
  alertType: string;
  impact: string;
  originCity?: string;
  city?: string;
  expectedStart?: string;
  expectedEnd?: string;
  alertCategory?: string;
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

  // New function to handle custom forecasts
  const loadCustomForecast = useCallback(async (existingPdfUrl: string) => {
    setLoading(true);
    
    try {
      // For custom forecasts, we need to extract information from the URL
      // and create a temporary forecast object
      const urlParams = new URLSearchParams(window.location.search);
      
      // Create a placeholder forecast
      const customForecast: Summary = {
        _id: 'custom-forecast',
        userId: '',
        title: 'Custom Disruption Forecast',
        description: 'Custom generated forecast',
        summaryType: 'forecast',
        parameters: {
          // Try to extract any parameters from URL if they were passed
          alertCategory: urlParams.get('category') || undefined,
          impact: urlParams.get('impact') || undefined,
        },
        timeRange: {
          startDate: urlParams.get('startDate') || new Date().toISOString(),
          endDate: urlParams.get('endDate') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        includedAlerts: [],
        pdfUrl: existingPdfUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Try to get the forecast content using the PDF URL
      // This is a hack, but it allows us to get the content without saving
      if (existingPdfUrl) {
        try {
          // Use the existing PDF URL to extract location and other attributes if possible
          const location = urlParams.get('location');
          if (location) {
            customForecast.title = `Disruption Forecast for ${location}`;
          }
        } catch (err) {
          console.error('Error parsing custom forecast parameters:', err);
        }
      }
      
      setForecast(customForecast);
      setPdfUrl(existingPdfUrl);
      setSaved(false); // Custom forecasts are not saved by default
    } catch (error) {
      console.error('Error creating custom forecast:', error);
      setError('Failed to load custom forecast.');
      showToast('Failed to load custom forecast', 'error');
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
      } else if (id === 'custom-forecast') {
        // Handle custom forecast - we need the PDF URL in query params
        if (queriedPdfUrl) {
          setPdfUrl(queriedPdfUrl);
          loadCustomForecast(queriedPdfUrl);
        } else {
          // Without a PDF URL, we can't display a custom forecast
          setError('Custom forecast data is missing. Please try generating a new forecast.');
          showToast('Custom forecast data is missing', 'error');
          setLoading(false);
        }
      }
    };
    
    loadForecastData();
  }, [id, loadForecastDetails, loadWeeklyForecast, loadCustomForecast, showToast]);

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

  const handleDownload = async () => {
    if (loading || !forecast) return;
    
    try {
      setLoading(true);
      showToast('Preparing download...', 'success');
      
      // Use the PDF URL if available (either from forecast or from state)
      if (forecast.pdfUrl || pdfUrl) {
        // Use the downloadPdf utility function
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
      
      // No PDF available - handle based on whether this is a saved forecast or not
      if (forecast._id && forecast._id !== 'weekly-forecast') {
        // It's a saved forecast without a PDF, so generate one without saving again
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
        // It's not a saved forecast - generate a PDF without saving
        // Use the current forecast data to generate a new summary with PDF but don't save
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
        
        if (response.success && response.summary.pdfUrl) {
          // Store the PDF URL
          setPdfUrl(response.summary.pdfUrl);
          
          // Download the PDF
          const success = await downloadPdf(
            response.summary.pdfUrl,
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

  // Find the main alert to display - avoid displaying duplicates
  const findPrimaryAlert = () => {
    if (!Array.isArray(forecast?.includedAlerts) || forecast?.includedAlerts.length === 0) {
      return null;
    }
    
    // Use the first alert as primary by default
    const primaryAlert = forecast.includedAlerts[0] as unknown as AlertItem;
    
    // Simple check for duplicates - if there are multiple alerts with same title/location
    // we'll display the one with the most detailed information
    if (forecast.includedAlerts.length > 1) {
      const similarAlerts = forecast.includedAlerts.filter(alert => {
        const a = alert as unknown as AlertItem;
        // Check if this might be similar to the primary
        return a.title === primaryAlert.title || 
               a.alertType === primaryAlert.alertType ||
               (a.originCity && a.originCity === primaryAlert.originCity);
      }) as unknown as AlertItem[];
      
      if (similarAlerts.length > 1) {
        // Return the one with the most detailed description or most recent
        return similarAlerts.sort((a, b) => {
          // First check description length
          if ((a.description?.length || 0) !== (b.description?.length || 0)) {
            return (b.description?.length || 0) - (a.description?.length || 0);
          }
          
          // If descriptions are similar in length, prefer the one with more specified data
          const aScore = (a.expectedStart ? 1 : 0) + (a.expectedEnd ? 1 : 0) + (a.impact ? 1 : 0);
          const bScore = (b.expectedStart ? 1 : 0) + (b.expectedEnd ? 1 : 0) + (b.impact ? 1 : 0);
          return bScore - aScore;
        })[0];
      }
    }
    
    return primaryAlert;
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

  // Get the primary alert to display, using our improved function
  const primaryAlert = findPrimaryAlert();
  const location = forecast.locations && forecast.locations.length > 0 
    ? forecast.locations[0].city 
    : primaryAlert?.originCity || primaryAlert?.city || 'Edinburgh';
  
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
        maxWidth: '1000px', 
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
        {primaryAlert ? (
          <Box sx={{ mb: 'auto' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {primaryAlert.title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {primaryAlert.originCity || primaryAlert.city}, {primaryAlert.originCity ? primaryAlert.originCity.split(',').pop()?.trim() : 'EH1'}
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 3 }}>
              {primaryAlert.description}
            </Typography>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                Start: {primaryAlert.expectedStart 
                  ? format(parseISO(primaryAlert.expectedStart), 'dd MMM h:mma')
                  : '06 May 9:00AM'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                End: {primaryAlert.expectedEnd
                  ? format(parseISO(primaryAlert.expectedEnd), 'dd MMM h:mma')
                  : '06 May 9:00AM'}
              </Typography>
            </Box>
            
            <Typography variant="body2" fontWeight="medium" sx={{ mt: 2 }}>
              {primaryAlert.impact || 'Moderate'} impact
            </Typography>
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
          }} onClick={isViewOnly() ? undefined : handleSave}>
            {saved ? <BookmarkIcon sx={{ mb: 0.5 }} /> : <BookmarkBorderIcon sx={{ mb: 0.5 }} />}
            <Typography variant="caption">Save</Typography>
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