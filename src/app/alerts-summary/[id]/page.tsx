'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
<<<<<<< HEAD
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
=======
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/ui/toast';
>>>>>>> 2945eb6 (Initial commit)
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
<<<<<<< HEAD
=======
import ShareForecastModal from '@/components/ShareForecastModal';

>>>>>>> 2945eb6 (Initial commit)
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
<<<<<<< HEAD
  
  const { isCollaboratorViewer } = useAuth();
=======
  const { showToast } = useToast();
  
  const { isCollaboratorViewer } = useAuth();
  const [shareModalOpen, setShareModalOpen] = useState(false);
>>>>>>> 2945eb6 (Initial commit)

  const isViewOnly = () => {
    return isCollaboratorViewer;
  };

  // Extract the ID from params and query params
  const id = params?.id as string;
  
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
<<<<<<< HEAD
=======
          showToast('Custom forecast data is missing', 'error');
>>>>>>> 2945eb6 (Initial commit)
          setLoading(false);
        }
      }
    };
    
    loadForecastData();
  }, [id]);

  const loadForecastDetails = async (forecastId: string) => {
    try {
      setLoading(true);
      const response = await getSummaryById(forecastId);
      
      if (response.success) {
        setForecast(response.summary);
        setPdfUrl(response.summary.pdfUrl || null);
        setSaved(true); // It's already saved if we're viewing it by ID
      } else {
        setError('Failed to load forecast details.');
<<<<<<< HEAD
=======
        showToast('Failed to load forecast details', 'error');
>>>>>>> 2945eb6 (Initial commit)
      }
    } catch (error) {
      console.error('Error loading forecast details:', error);
      setError('An error occurred while loading the forecast. Please try again.');
<<<<<<< HEAD
=======
      showToast('Failed to load forecast', 'error');
>>>>>>> 2945eb6 (Initial commit)
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyForecast = async (existingPdfUrl?: string) => {
    setLoading(true);
    
    try {
      // Get real data from the API
<<<<<<< HEAD
=======
      showToast('Loading weekly forecast...', 'success');
>>>>>>> 2945eb6 (Initial commit)
      const response = await getUpcomingForecasts(7);
      
      if (!response.success || !response.forecast) {
        setError('Failed to load the weekly forecast. Please try again.');
<<<<<<< HEAD
=======
        showToast('Failed to load weekly forecast', 'error');
>>>>>>> 2945eb6 (Initial commit)
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
<<<<<<< HEAD
=======
      showToast('Failed to generate weekly forecast', 'error');
>>>>>>> 2945eb6 (Initial commit)
    } finally {
      setLoading(false);
    }
  };

  // New function to handle custom forecasts
  const loadCustomForecast = async (existingPdfUrl: string) => {
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
<<<<<<< HEAD
=======
      showToast('Failed to load custom forecast', 'error');
>>>>>>> 2945eb6 (Initial commit)
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Only proceed if not already saved
    if (saved || !forecast || isViewOnly()) return;
    
    try {
      setLoading(true);
<<<<<<< HEAD
=======
      showToast('Saving forecast...', 'success');
>>>>>>> 2945eb6 (Initial commit)
      
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
<<<<<<< HEAD
=======
        showToast('Forecast saved successfully', 'success');
>>>>>>> 2945eb6 (Initial commit)
        
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
<<<<<<< HEAD
=======
        showToast('Failed to save the forecast', 'error');
>>>>>>> 2945eb6 (Initial commit)
      }
    } catch (error) {
      console.error('Error saving forecast:', error);
      setError('Failed to save the forecast.');
<<<<<<< HEAD
=======
      showToast('Failed to save the forecast', 'error');
>>>>>>> 2945eb6 (Initial commit)
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (loading || !forecast) return;
    
    try {
      setLoading(true);
<<<<<<< HEAD
=======
      showToast('Preparing download...', 'success');
>>>>>>> 2945eb6 (Initial commit)
      
      // Use the PDF URL if available (either from forecast or from state)
      if (forecast.pdfUrl || pdfUrl) {
        // Use the downloadPdf utility function
<<<<<<< HEAD
        await downloadPdf(
          forecast.pdfUrl || pdfUrl || '', 
          `${forecast.title.replace(/\s+/g, '_')}.pdf`
        );
=======
        const success = await downloadPdf(
          forecast.pdfUrl || pdfUrl || '', 
          `${forecast.title.replace(/\s+/g, '_')}.pdf`
        );
        
        if (success) {
          showToast('Download started', 'success');
        } else {
          showToast('Failed to download PDF', 'error');
        }
        
>>>>>>> 2945eb6 (Initial commit)
        setLoading(false);
        return;
      }
      
      // No PDF available - handle based on whether this is a saved forecast or not
      if (forecast._id && forecast._id !== 'weekly-forecast') {
        // It's a saved forecast without a PDF, so generate one without saving again
<<<<<<< HEAD
=======
        showToast('Generating PDF...', 'success');
>>>>>>> 2945eb6 (Initial commit)
        const pdfUrl = await generatePdfOnDemand(forecast._id);
        
        if (pdfUrl) {
          // Set the PDF URL in state
          setPdfUrl(pdfUrl);
          
          // Download the newly generated PDF
<<<<<<< HEAD
          await downloadPdf(
            pdfUrl,
            `${forecast.title.replace(/\s+/g, '_')}.pdf`
          );
        } else {
          setError('Failed to generate PDF. Please try again.');
=======
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
>>>>>>> 2945eb6 (Initial commit)
        }
      } else {
        // It's not a saved forecast - generate a PDF without saving
        // Use the current forecast data to generate a new summary with PDF but don't save
<<<<<<< HEAD
=======
        showToast('Generating PDF...', 'success');
>>>>>>> 2945eb6 (Initial commit)
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
<<<<<<< HEAD
          await downloadPdf(
            response.summary.pdfUrl,
            `${forecast.title.replace(/\s+/g, '_')}.pdf`
          );
        } else {
          setError('Failed to generate PDF. Please try again.');
=======
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
>>>>>>> 2945eb6 (Initial commit)
        }
      }
    } catch (error) {
      console.error('Error downloading forecast:', error);
      setError('Failed to download the forecast. Please try again.');
<<<<<<< HEAD
=======
      showToast('Failed to download the forecast', 'error');
>>>>>>> 2945eb6 (Initial commit)
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
<<<<<<< HEAD
    if (saved || !forecast) return;
    
    try {
      setLoading(true);
      
      window.navigator.share({
        title: forecast.title,
        text: forecast.description,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing forecast:', error);
      setError('Failed to share the forecast. Please try again.');
    } finally {
      setLoading(false);
    }
=======
    // Show the share modal instead of using the Web Share API
    setShareModalOpen(true);
>>>>>>> 2945eb6 (Initial commit)
  };

  const handleBackToList = () => {
    router.push('/alerts-summary');
  };

<<<<<<< HEAD
  const handleViewDashboard = () => {
    router.push('/dashboard');
  };

  const getCategoryLabel = (alertType: string, alertCategory?: string): string => {
    // If there's a specific category, use it as the primary label
    if (alertCategory) {
      return alertCategory;
    }
    
    // Otherwise, try to determine the category from the alert type
    const categoryMap = {
      "Industrial Action": ["Strike", "Work-to-Rule", "Labor Dispute"],
      "Extreme Weather": ["Storm", "Flooding", "Heatwave", "Wildfire", "Snow"],
      "Infrastructure Failures": ["Power Outage", "IT & System Failure", "Transport Service Suspension", "Road, Rail & Tram Closure", "Repairs or Delays"],
      "Public Safety Incidents": ["Protest", "Crime", "Terror Threats", "Travel Advisory"],
      "Festivals and Events": ["Citywide Festival", "Sporting Event", "Concerts and Stadium Events", "Parades and Ceremonies"]
    };
    
    for (const [category, types] of Object.entries(categoryMap)) {
      if (types.includes(alertType)) {
        return `${category} - ${alertType}`;
      }
    }
    
    return alertType || 'Not specified';
  };

=======
>>>>>>> 2945eb6 (Initial commit)
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
<<<<<<< HEAD

  return (
    <Layout isFooter={false}>
    <Box sx={{ px: 3, py: 2, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackToList} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1" fontWeight="bold">
          Your Disruption Forecast
        </Typography>
      </Box>

      <Paper elevation={1} sx={{ p: 0, borderRadius: 4, overflow: 'hidden', mb: 4, border: '1px solid #f0f0f0' }}>
        <Box sx={{ p: 3 }}>
        {/* Summary Header */}
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2}>
            <Box sx={{ width: '33%' }}>
              <Typography variant="body2" color="text.secondary">
                Date:
              </Typography>
            </Box>
            <Box sx={{ width: '67%' }}>
              <Typography variant="body1" fontWeight="medium">
                {forecast.timeRange.startDate && forecast.timeRange.endDate ? (
                  `${format(parseISO(forecast.timeRange.startDate), 'd MMM')} – ${format(parseISO(forecast.timeRange.endDate), 'd MMM yyyy')}`
                ) : 'Date range not specified'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Box sx={{ width: '33%' }}>
              <Typography variant="body2" color="text.secondary">
                Location:
              </Typography>
            </Box>
            <Box sx={{ width: '67%' }}>
              <Typography variant="body1" fontWeight="medium">
                {forecast.locations && forecast.locations.length > 0
                  ? forecast.locations[0].city
                  : primaryAlert?.originCity || primaryAlert?.city || 'Edinburgh'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Box sx={{ width: '33%' }}>
              <Typography variant="body2" color="text.secondary">
                Impact:
              </Typography>
            </Box>
            <Box sx={{ width: '67%' }}>
              <Typography variant="body1" fontWeight="medium">
                {primaryAlert?.impact || 'Variable'}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Primary Alert */}
        {primaryAlert && (
          <Box sx={{ mb: 4 }}>
=======
  const location = forecast.locations && forecast.locations.length > 0 
    ? forecast.locations[0].city 
    : primaryAlert?.originCity || primaryAlert?.city || 'Edinburgh';
  
  // Format creation time as "Xh ago"
  const getTimeAgo = () => {
    if (!forecast.createdAt) return '';
    const createdDate = new Date(forecast.createdAt);
    const now = new Date();
    const diffHours = Math.round((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1h ago';
    return `${diffHours}h ago`;
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
>>>>>>> 2945eb6 (Initial commit)
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {primaryAlert.title}
            </Typography>
            
<<<<<<< HEAD
            {primaryAlert.originCity && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {primaryAlert.originCity}
              </Typography>
            )}
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              {primaryAlert.description}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Start Time
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {primaryAlert.expectedStart
                    ? format(parseISO(primaryAlert.expectedStart), 'dd MMM h:mma')
                    : 'Not specified'}
                </Typography>
              </Box>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  End Time
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {primaryAlert.expectedEnd
                    ? format(parseISO(primaryAlert.expectedEnd), 'dd MMM h:mma')
                    : 'Not specified'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Type:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {getCategoryLabel(primaryAlert.alertType, primaryAlert.alertCategory)}
                </Typography>
              </Box>
              <Box sx={{ width: '50%' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Impact:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {primaryAlert.impact || 'Not specified'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {!primaryAlert && (
          <Box sx={{ mb: 4 }}>
=======
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
>>>>>>> 2945eb6 (Initial commit)
            <Alert severity="info" sx={{ mb: 2 }}>
              No alerts found for this forecast period.
            </Alert>
            <Typography variant="body2">
              There are currently no disruptions predicted for the selected time period.
            </Typography>
          </Box>
        )}
<<<<<<< HEAD

        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          borderTop: '1px solid #f0f0f0',
          '& > *': {
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 1.5,
            color: '#666'
          }
        }}>
          <Box onClick={handleDownload} sx={{ display: 'flex',cursor:'pointer', alignItems: 'center', justifyContent: 'center' }}>
            <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">Download</Typography>
          </Box>
          <Box onClick={handleShare} sx={{ borderLeft: '1px solid #f0f0f0',cursor:'pointer', borderRight: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowForwardIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">Share</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            opacity: isViewOnly() ? 0.5 : 1,
            cursor: isViewOnly() ? 'not-allowed' : 'pointer'
          }} onClick={handleSave}
          >
            {saved ? <BookmarkIcon fontSize="small" sx={{ mr: 1 }} /> : <BookmarkBorderIcon fontSize="small" sx={{ mr: 1 }} />}
            <Typography variant="body2">Save</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Additional Alerts Section */}
      {Array.isArray(forecast.includedAlerts) && forecast.includedAlerts.length > 1 && (
        <>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ ml: 1 }}>
            Additional Alerts in This Forecast
          </Typography>

          <Box sx={{ mb: 3 }}>
            {forecast.includedAlerts.slice(1).map((alert, index) => {
              const alertItem = alert as unknown as AlertItem;
              return (
                <Card key={alertItem._id || index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      {alertItem.title}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Chip 
                        label={getCategoryLabel(alertItem.alertType, alertItem.alertCategory)}
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      <Chip 
                        label={alertItem.impact || 'Unknown'} 
                        size="small" 
                        color={
                          alertItem.impact === 'Severe' ? 'error' : 
                          alertItem.impact === 'Moderate' ? 'warning' : 'success'
                        }
                        variant="outlined"
                      />
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {alertItem.description?.substring(0, 120)}
                      {(alertItem.description?.length || 0) > 120 ? '...' : ''}
                    </Typography>
                    <Typography variant='body2'>
                      {alertItem.city}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {alertItem.expectedStart && alertItem.expectedEnd ? (
                        `${format(parseISO(alertItem.expectedStart), 'dd MMM')} - ${format(parseISO(alertItem.expectedEnd), 'dd MMM yyyy')}`
                      ) : 'Dates not specified'}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </>
      )}

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          To view more alerts or take action, visit tourprism dashboard
        </Typography>
        <Button 
          variant="text" 
          endIcon={<ArrowForwardIcon />}
          onClick={handleViewDashboard}
        >
          View Dashboard
        </Button>
      </Box>
    </Box>
=======
        
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
>>>>>>> 2945eb6 (Initial commit)
    </Layout>
  );
}