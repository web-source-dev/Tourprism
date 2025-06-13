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
  LocationOn as LocationIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import Image from 'next/image';
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
import { formatStandardDateTime, formatStandardDate } from '@/utils/dateFormat';

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


  if (loading) {
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

  if (error) {
    return (
      <Layout isFooter={false} isHeader={false}>
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
      <Layout isFooter={false} isHeader={false}>
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

  return (
    <Layout isFooter={false} isHeader={false}>
      <Box pt={2}>
        <IconButton onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.70898 9.99959C2.70899 10.3109 2.84703 10.5997 2.97775 10.8165C3.11881 11.0506 3.30852 11.2922 3.51664 11.5277C3.93413 12.0003 4.47887 12.5078 5.00751 12.9668C5.53926 13.4286 6.06917 13.8538 6.46503 14.1627C6.66328 14.3175 6.82868 14.4437 6.94485 14.5314C7.00295 14.5753 7.04878 14.6096 7.0803 14.6331L7.11661 14.6601L7.12624 14.6673L7.12958 14.6697C7.4075 14.8744 7.79912 14.8154 8.00383 14.5374C8.20854 14.2595 8.14922 13.8683 7.87133 13.6636L7.86072 13.6557L7.82735 13.6309C7.79783 13.6089 7.75415 13.5762 7.69832 13.5341C7.58662 13.4497 7.42651 13.3275 7.23414 13.1774C6.84875 12.8766 6.33701 12.4658 5.8271 12.023C5.31408 11.5775 4.81716 11.1118 4.45341 10.7001C4.43041 10.6741 4.40814 10.6485 4.38662 10.6233L16.6673 10.6233C17.0125 10.6233 17.2923 10.3435 17.2923 9.99835C17.2923 9.65317 17.0125 9.37335 16.6673 9.37335L4.38873 9.37335C4.4096 9.34901 4.43116 9.32424 4.45341 9.29905C4.81716 8.88732 5.31408 8.42163 5.8271 7.97614C6.33701 7.53335 6.84875 7.1226 7.23414 6.82179C7.4265 6.67165 7.58662 6.54949 7.69832 6.46511C7.75415 6.42293 7.79783 6.39023 7.82735 6.36823L7.86072 6.34342L7.87133 6.33558C8.14921 6.13085 8.20854 5.73962 8.00383 5.46171C7.79911 5.1838 7.4075 5.12472 7.12958 5.32944L7.12624 5.33191L7.11661 5.33903L7.0803 5.36602C7.04878 5.38952 7.00295 5.42383 6.94485 5.46772C6.82868 5.55548 6.66328 5.68167 6.46502 5.83642C6.06917 6.1454 5.53926 6.57058 5.00751 7.03233C4.47887 7.49139 3.93413 7.99887 3.51664 8.47143C3.30852 8.707 3.11881 8.9486 2.97775 9.18262C2.84782 9.39817 2.71064 9.68482 2.709 9.99398" fill="#212121" />
          </svg>

        </IconButton>
        <Box sx={{
          px: 1,
          py: 2,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}>
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" component="h1" fontWeight="600" sx={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif' }}>
              {forecast.title.includes('Weekly') ? `Weekly Forecast - ${location}` : forecast.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={1} sx={{ fontSize: '12px', fontFamily: 'Poppins, sans-serif' }}>
              {forecast.timeRange.startDate ? formatStandardDate(forecast.timeRange.startDate) : new Date().toLocaleDateString()}
              {forecast.timeRange.endDate && ` - ${formatStandardDate(forecast.timeRange.endDate)}`}
            </Typography>
          </Box>

          {/* Branding */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            pb: 1.5,
            borderRadius: 1.5
          }}>

            <Image src="/t.png" alt="Tourprism Logo" width={25} height={25} style={{ marginRight: '10px', borderRadius: 5 }} />
            <Typography variant="body2" fontWeight="medium">
              Powered by Tourprism
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

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

                      {alertsWithImpact.map((alert, index) => (
                        <Paper
                          key={alert._id || index}
                          elevation={0}
                          sx={{
                            bgcolor: 'transparent',
                            position: 'relative',
                            overflow: 'hidden',
                            borderBottom: '1px solid #eaeaea',
                            pb: 2
                          }}
                        >

                          <Box sx={{ pl: 0.5 }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ fontSize: '16px', fontFamily: 'Poppins, sans-serif' }}>
                              {alert.title || 'Untitled Alert'}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" fontWeight={400} sx={{ fontSize: '14px', color: '#616161', fontFamily: 'Inter, sans-serif' }}>
                                {alert.originCity || alert.city || 'Location not specified'}
                              </Typography>
                            </Box>

                            <Typography variant="body2" sx={{ mb: 2, fontSize: '14px', color: '#000000', fontFamily: 'Inter, sans-serif' }}>
                              {alert.description}
                            </Typography>

                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: '40px 1fr',
                                rowGap: 1,
                                mt: 2,
                              }}
                            >
                              {alert.expectedStart && (
                                <>
                                  <Typography variant="body2" fontWeight="400" color="text.secondary">
                                    Start
                                  </Typography>
                                  <Typography variant="body2" fontWeight="400" color="text.secondary">
                                    {formatStandardDateTime(alert.expectedStart)}
                                  </Typography>
                                </>
                              )}

                              {alert.expectedEnd && (
                                <>
                                  <Typography variant="body2" fontWeight="400" color="text.secondary">
                                    End
                                  </Typography>
                                  <Typography variant="body2" fontWeight="400" color="text.secondary">
                                    {formatStandardDateTime(alert.expectedEnd)}
                                  </Typography>
                                </>
                              )}
                            </Box>

                            <Typography variant="body1" fontWeight="500" mt={2} color="text.primary" sx={{ fontSize: '14px', fontFamily: 'Poppins, sans-serif' }}>
                              {alert.impact === 'Minor' ? 'Low' : 
                               alert.impact === 'Severe' ? 'High' : 
                               alert.impact || 'Moderate'} Impact
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

                          <Typography variant="body2" sx={{ mb: 2, color: '#000000' }}>
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
                                      {formatStandardDateTime(alert.expectedStart)}
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
                                      {formatStandardDateTime(alert.expectedEnd)}
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
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #eaeaea',
            borderRadius: 4,
            py: 2,
            mt: 4
          }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer'
            }} onClick={handleDownload}>
              <svg width="104" height="50" viewBox="0 0 104 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M52.5842 4C52.5842 3.58579 52.2484 3.25 51.8342 3.25C51.42 3.25 51.0842 3.58579 51.0842 4V12.4619L51.0782 12.4548C50.8675 12.2061 50.6612 11.9434 50.4683 11.6976L50.4236 11.6407C50.2313 11.396 50.0291 11.1388 49.872 10.9773C49.5833 10.6802 49.1085 10.6735 48.8115 10.9622C48.5145 11.2509 48.5077 11.7257 48.7964 12.0227C48.8851 12.114 49.0307 12.2958 49.2439 12.5672L49.291 12.6271C49.481 12.8693 49.704 13.1534 49.9338 13.4245C50.18 13.715 50.4555 14.0168 50.731 14.2515C50.8691 14.369 51.0247 14.485 51.1921 14.5746C51.3535 14.661 51.5759 14.75 51.8342 14.75C52.0925 14.75 52.315 14.661 52.4764 14.5746C52.6438 14.485 52.7994 14.369 52.9374 14.2515C53.2129 14.0168 53.4885 13.715 53.7347 13.4245C53.9644 13.1534 54.1874 12.8694 54.3774 12.6272L54.4245 12.5672C54.6377 12.2958 54.7833 12.114 54.872 12.0227C55.1607 11.7257 55.154 11.2509 54.857 10.9622C54.5599 10.6735 54.0851 10.6802 53.7964 10.9773C53.6394 11.1388 53.4371 11.396 53.2449 11.6407L53.2002 11.6977C53.0073 11.9434 52.801 12.2062 52.5903 12.4548L52.5842 12.4619V4Z" fill="black" />
                <path d="M61.5414 14.2496C61.6793 13.859 61.4744 13.4306 61.0838 13.2928C60.6932 13.1549 60.2648 13.3598 60.1269 13.7504L59.8931 14.413C59.4324 15.7184 59.1065 16.6385 58.7719 17.3282C58.4456 18.0007 58.1422 18.3853 57.7636 18.6531C57.385 18.921 56.9214 19.0791 56.1786 19.1629C55.4169 19.2489 54.4408 19.25 53.0564 19.25H50.612C49.2276 19.25 48.2515 19.2489 47.4898 19.1629C46.747 19.0791 46.2834 18.921 45.9048 18.6531C45.5262 18.3853 45.2228 18.0007 44.8965 17.3282C44.5619 16.6385 44.236 15.7184 43.7753 14.413L43.5414 13.7504C43.4036 13.3598 42.9752 13.1549 42.5846 13.2928C42.194 13.4306 41.9891 13.859 42.1269 14.2496L42.3757 14.9545C42.8181 16.208 43.1711 17.2082 43.547 17.9829C43.9354 18.7834 44.3787 19.4108 45.0384 19.8776C45.6982 20.3444 46.4374 20.5536 47.3215 20.6535C48.1771 20.75 49.2378 20.75 50.5671 20.75H53.1013C54.4306 20.75 55.4913 20.75 56.3469 20.6535C57.231 20.5536 57.9702 20.3444 58.63 19.8776C59.2897 19.4108 59.733 18.7834 60.1214 17.9829C60.4972 17.2082 60.8503 16.208 61.2927 14.9545L61.5414 14.2496Z" fill="black" />
                <path d="M25.7205 37.66C26.6085 37.66 27.3845 37.832 28.0485 38.176C28.7205 38.512 29.2365 39 29.5965 39.64C29.9645 40.272 30.1485 41.012 30.1485 41.86C30.1485 42.708 29.9645 43.444 29.5965 44.068C29.2365 44.692 28.7205 45.172 28.0485 45.508C27.3845 45.836 26.6085 46 25.7205 46H22.9965V37.66H25.7205ZM25.7205 44.884C26.6965 44.884 27.4445 44.62 27.9645 44.092C28.4845 43.564 28.7445 42.82 28.7445 41.86C28.7445 40.892 28.4845 40.136 27.9645 39.592C27.4445 39.048 26.6965 38.776 25.7205 38.776H24.3645V44.884H25.7205ZM34.2723 46.108C33.6483 46.108 33.0843 45.968 32.5803 45.688C32.0763 45.4 31.6803 45 31.3923 44.488C31.1043 43.968 30.9603 43.368 30.9603 42.688C30.9603 42.016 31.1083 41.42 31.4043 40.9C31.7003 40.38 32.1043 39.98 32.6163 39.7C33.1283 39.42 33.7003 39.28 34.3323 39.28C34.9643 39.28 35.5363 39.42 36.0483 39.7C36.5603 39.98 36.9643 40.38 37.2603 40.9C37.5563 41.42 37.7043 42.016 37.7043 42.688C37.7043 43.36 37.5523 43.956 37.2483 44.476C36.9443 44.996 36.5283 45.4 36.0003 45.688C35.4803 45.968 34.9043 46.108 34.2723 46.108ZM34.2723 44.92C34.6243 44.92 34.9523 44.836 35.2563 44.668C35.5683 44.5 35.8203 44.248 36.0123 43.912C36.2043 43.576 36.3003 43.168 36.3003 42.688C36.3003 42.208 36.2083 41.804 36.0243 41.476C35.8403 41.14 35.5963 40.888 35.2923 40.72C34.9883 40.552 34.6603 40.468 34.3083 40.468C33.9563 40.468 33.6283 40.552 33.3243 40.72C33.0283 40.888 32.7923 41.14 32.6163 41.476C32.4403 41.804 32.3523 42.208 32.3523 42.688C32.3523 43.4 32.5323 43.952 32.8923 44.344C33.2603 44.728 33.7203 44.92 34.2723 44.92ZM47.8366 39.388L45.7846 46H44.3446L43.0126 41.116L41.6806 46H40.2406L38.1766 39.388H39.5686L40.9486 44.704L42.3526 39.388H43.7806L45.1246 44.68L46.4926 39.388H47.8366ZM52.095 39.28C52.615 39.28 53.079 39.388 53.487 39.604C53.903 39.82 54.227 40.14 54.459 40.564C54.691 40.988 54.807 41.5 54.807 42.1V46H53.451V42.304C53.451 41.712 53.303 41.26 53.007 40.948C52.711 40.628 52.307 40.468 51.795 40.468C51.283 40.468 50.875 40.628 50.571 40.948C50.275 41.26 50.127 41.712 50.127 42.304V46H48.759V39.388H50.127V40.144C50.351 39.872 50.635 39.66 50.979 39.508C51.331 39.356 51.703 39.28 52.095 39.28ZM57.82 37.12V46H56.452V37.12H57.82ZM62.384 46.108C61.76 46.108 61.196 45.968 60.692 45.688C60.188 45.4 59.792 45 59.504 44.488C59.216 43.968 59.072 43.368 59.072 42.688C59.072 42.016 59.22 41.42 59.516 40.9C59.812 40.38 60.216 39.98 60.728 39.7C61.24 39.42 61.812 39.28 62.444 39.28C63.076 39.28 63.648 39.42 64.16 39.7C64.672 39.98 65.076 40.38 65.372 40.9C65.668 41.42 65.816 42.016 65.816 42.688C65.816 43.36 65.664 43.956 65.36 44.476C65.056 44.996 64.64 45.4 64.112 45.688C63.592 45.968 63.016 46.108 62.384 46.108ZM62.384 44.92C62.736 44.92 63.064 44.836 63.368 44.668C63.68 44.5 63.932 44.248 64.124 43.912C64.316 43.576 64.412 43.168 64.412 42.688C64.412 42.208 64.32 41.804 64.136 41.476C63.952 41.14 63.708 40.888 63.404 40.72C63.1 40.552 62.772 40.468 62.42 40.468C62.068 40.468 61.74 40.552 61.436 40.72C61.14 40.888 60.904 41.14 60.728 41.476C60.552 41.804 60.464 42.208 60.464 42.664C60.464 43.12 60.644 43.52 61.004 43.864C61.372 44.208 61.832 44.472 62.384 44.92ZM66.6124 42.664C66.6124 42 66.7484 41.412 67.0204 40.9C67.3004 40.388 67.6764 39.992 68.1484 39.712C68.6284 39.424 69.1564 39.28 69.7324 39.28C70.2524 39.28 70.7044 39.384 71.0884 39.592C71.4804 39.792 71.7924 40.044 72.0244 40.348V39.388H73.4044V46H72.0244V45.016C71.7924 45.328 71.4764 45.588 71.0764 45.796C70.6764 46.004 70.2204 46.108 69.7084 46.108C69.1404 46.108 68.6204 45.964 68.1484 45.676C67.6764 45.38 67.3004 44.972 67.0204 44.452C66.7484 43.924 66.6124 43.328 66.6124 42.664ZM72.0244 42.688C72.0244 42.232 71.9284 41.836 71.7364 41.5C71.5524 41.164 71.3084 40.908 71.0044 40.732C70.7004 40.556 70.3724 40.468 70.0204 40.468C69.6684 40.468 69.3404 40.556 69.0364 40.732C68.7324 40.9 68.4844 41.152 68.2924 41.488C68.1084 41.816 68.0164 42.208 68.0164 42.664C68.0164 43.12 68.1084 43.52 68.2924 43.864C68.4844 44.208 68.7324 44.472 69.0364 44.656C69.3484 44.832 69.6764 44.92 70.0204 44.92C70.3724 44.92 70.7004 44.832 71.0044 44.656C71.3084 44.48 71.5524 44.224 71.7364 43.888C71.9284 43.544 72.0244 43.144 72.0244 42.688ZM74.6452 42.664C74.6452 42 74.7812 41.412 75.0532 40.9C75.3332 40.388 75.7092 39.992 76.1812 39.712C76.6612 39.424 77.1932 39.28 77.7772 39.28C78.2092 39.28 78.6332 39.376 79.0492 39.568C79.4732 39.752 79.8092 40 80.0572 40.312V37.12H81.4372V46H80.0572V45.004C79.8332 45.324 79.5212 45.588 79.1212 45.796C78.7292 46.004 78.2772 46.108 77.7652 46.108C77.1892 46.108 76.6612 45.964 76.1812 45.676C75.7092 45.38 75.3332 44.972 75.0532 44.452C74.7812 43.924 74.6452 43.328 74.6452 42.664ZM80.0572 42.688C80.0572 42.232 79.9612 41.836 79.7692 41.5C79.5852 41.164 79.3412 40.908 79.0372 40.732C78.7332 40.556 78.4052 40.468 78.0532 40.468C77.7012 40.468 77.3732 40.556 77.0692 40.732C76.7652 40.9 76.5172 41.152 76.3252 41.488C76.1412 41.816 76.0492 42.208 76.0492 42.664C76.0492 43.12 76.1412 43.52 76.3252 43.864C76.5172 44.208 76.7652 44.472 77.0692 44.656C77.3812 44.832 77.7092 44.92 78.0532 44.92C78.4052 44.92 78.7332 44.832 79.0372 44.656C79.3412 44.48 79.5852 44.224 79.7692 43.888C79.9612 43.544 80.0572 43.144 80.0572 42.688Z" fill="#757575" />
              </svg>

            </Box>

            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer'
            }} onClick={handleShare}>
              <svg width="105" height="50" viewBox="0 0 105 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M43.364 20.64C44.978 22.25 47.331 22.25 52.02 22.25L52.017 22.249C56.705 22.249 59.058 22.249 60.672 20.639C61.861 19.453 62.156 17.804 62.247 15.529C62.263 15.115 61.941 14.767 61.527 14.75H61.497C61.096 14.75 60.764 15.066 60.748 15.47C60.658 17.728 60.351 18.842 59.613 19.578C58.439 20.75 56.294 20.75 52.018 20.75C47.742 20.75 45.596 20.75 44.422 19.578C43.248 18.406 43.248 16.266 43.248 12C43.248 7.734 43.248 5.59302 44.422 4.42202C45.477 3.37002 47.257 3.257 51.068 3.25C51.483 3.25 51.817 2.91302 51.817 2.49902C51.816 2.08502 51.481 1.75 51.067 1.75C47.172 1.757 44.892 1.83501 43.364 3.36001C41.75 4.97101 41.75 7.321 41.75 12C41.75 16.679 41.75 19.028 43.364 20.64Z" fill="black" />
                <path fillRule="evenodd" clipRule="evenodd" d="M56.493 15.1669C56.685 15.2259 56.863 15.2529 57.032 15.2529C57.763 15.2529 58.312 14.7489 58.973 14.1409L58.9784 14.136C59.1711 13.9592 59.3883 13.7599 59.638 13.5429L61.3933 12.0189C62.5908 10.9782 63.25 10.4053 63.25 9.49589C63.25 8.58589 62.588 8.00991 61.385 6.96591L59.638 5.44892C59.4862 5.31759 59.3462 5.19305 59.2155 5.07678C59.18 5.04519 59.1452 5.01421 59.111 4.98388C58.16 4.13788 57.473 3.52692 56.493 3.82392C55.417 4.15292 55.323 5.3469 55.353 6.2289L55.1786 6.22577C54.1443 6.2068 53.0752 6.18719 52.024 6.3579C47.978 7.0159 45.75 9.78387 45.75 14.1529C45.75 14.4239 45.897 14.6739 46.134 14.8069C46.371 14.9389 46.661 14.9339 46.892 14.7919C47.039 14.7019 47.186 14.6109 47.333 14.5189C48.396 13.8579 49.4 13.2339 50.568 12.9579C51.858 12.6529 53.321 12.6909 54.735 12.7279C54.7997 12.7295 54.8648 12.7311 54.9301 12.7328C55.0705 12.7365 55.212 12.7402 55.354 12.7429C55.322 13.6279 55.409 14.8369 56.493 15.1669ZM57.958 13.0369C57.244 13.6939 57.107 13.7769 56.953 13.7389C56.853 13.5959 56.827 13.1489 56.874 12.4099L56.8753 12.3897C56.8848 12.2423 56.893 12.1148 56.893 12.0029C56.893 11.5889 56.557 11.2529 56.143 11.2529C55.7204 11.2529 55.2961 11.2421 54.8487 11.2308L54.7666 11.2287C53.2589 11.1898 51.6996 11.1495 50.223 11.4989C49.148 11.7529 48.22 12.2319 47.343 12.7539C47.737 9.9569 49.388 8.30588 52.264 7.83788C53.184 7.68988 54.186 7.70787 55.156 7.72587C55.479 7.73187 55.813 7.73788 56.142 7.73788C56.556 7.73788 56.892 7.40188 56.892 6.98788C56.892 6.87435 56.8836 6.74388 56.8739 6.59462L56.873 6.5809C56.826 5.8449 56.852 5.3989 56.951 5.2539H56.964C57.157 5.2539 57.583 5.6319 58.113 6.1039C58.277 6.2499 58.456 6.4089 58.654 6.5809L60.401 8.09789C61.1249 8.72685 61.75 9.2699 61.75 9.49589C61.75 9.72139 61.1297 10.2605 60.4058 10.8897L58.654 12.4109C58.387 12.6429 58.159 12.8519 57.958 13.0369Z" fill="black" />
                <path d="M38.8683 46.084C38.3083 46.084 37.8043 45.988 37.3563 45.796C36.9083 45.596 36.5563 45.316 36.3003 44.956C36.0443 44.596 35.9163 44.176 35.9163 43.696H37.3803C37.4123 44.056 37.5523 44.352 37.8003 44.584C38.0563 44.816 38.4123 44.932 38.8683 44.932C39.3403 44.932 39.7083 44.82 39.9723 44.596C40.2363 44.364 40.3683 44.068 40.3683 43.708C40.3683 43.428 40.2843 43.2 40.1163 43.024C39.9563 42.848 39.7523 42.712 39.5043 42.616C39.2643 42.52 38.9283 42.416 38.4963 42.304C37.9523 42.16 37.5083 42.016 37.1643 41.872C36.8283 41.72 36.5403 41.488 36.3003 41.176C36.0603 40.864 35.9403 40.448 35.9403 39.928C35.9403 39.448 36.0603 39.028 36.3003 38.668C36.5403 38.308 36.8763 38.032 37.3083 37.84C37.7403 37.648 38.2403 37.552 38.8083 37.552C39.6163 37.552 40.2763 37.756 40.7883 38.164C41.3083 38.564 41.5963 39.116 41.6523 39.82H40.1403C40.1163 39.516 39.9723 39.256 39.7083 39.04C39.4443 38.824 39.0963 38.716 38.6643 38.716C38.2723 38.716 37.9523 38.816 37.7043 39.016C37.4563 39.216 37.3323 39.504 37.3323 39.88C37.3323 40.136 37.4083 40.348 37.5603 40.516C37.7203 40.676 37.9203 40.804 38.1603 40.9C38.4003 40.996 38.7283 41.1 39.1443 41.212C39.6963 41.364 40.1443 41.516 40.4883 41.668C40.8403 41.82 41.1363 42.056 41.3763 42.376C41.6243 42.688 41.7483 43.108 41.7483 43.636C41.7483 44.06 41.6323 44.46 41.4003 44.836C41.1763 45.212 40.8443 45.516 40.4043 45.748C39.9723 45.972 39.4603 46.084 38.8683 46.084ZM46.6825 39.28C47.1865 39.28 47.6345 39.388 48.0265 39.604C48.4265 39.82 48.7385 40.14 48.9625 40.564C49.1945 40.988 49.3105 41.5 49.3105 42.1V46H47.9545V42.304C47.9545 41.712 47.8065 41.26 47.5105 40.948C47.2145 40.628 46.8105 40.468 46.2985 40.468C45.7865 40.468 45.3785 40.628 45.0745 40.948C44.7785 41.26 44.6305 41.712 44.6305 42.304V46H43.2625V37.12H44.6305V40.156C44.8625 39.876 45.1545 39.66 45.5065 39.508C45.8665 39.356 46.2585 39.28 46.6825 39.28ZM50.4995 42.664C50.4995 42 50.6355 41.412 50.9075 40.9C51.1875 40.388 51.5635 39.992 52.0355 39.712C52.5155 39.424 53.0435 39.28 53.6195 39.28C54.1395 39.28 54.5915 39.384 54.9755 39.592C55.3675 39.792 55.6795 40.044 55.9115 40.348V39.388H57.2915V46H55.9115V45.016C55.6795 45.328 55.3635 45.588 54.9635 45.796C54.5635 46.004 54.1075 46.108 53.5955 46.108C53.0275 46.108 52.5075 45.964 52.0355 45.676C51.5635 45.38 51.1875 44.972 50.9075 44.452C50.6355 43.924 50.4995 43.328 50.4995 42.664ZM55.9115 42.688C55.9115 42.232 55.8155 41.836 55.6235 41.5C55.4395 41.164 55.1955 40.908 54.8915 40.732C54.5875 40.556 54.2595 40.468 53.9075 40.468C53.5555 40.468 53.2275 40.556 52.9235 40.732C52.6195 40.9 52.3715 41.152 52.1795 41.488C51.9955 41.816 51.9035 42.208 51.9035 42.664C51.9035 43.12 51.9955 43.52 52.1795 43.864C52.3715 44.208 52.6195 44.472 52.9235 44.656C53.2355 44.832 53.5635 44.92 53.9075 44.92C54.2595 44.92 54.5875 44.832 54.8915 44.656C55.1955 44.48 55.4395 44.224 55.6235 43.888C55.8155 43.544 55.9115 43.144 55.9115 42.688ZM60.3563 40.348C60.5563 40.012 60.8203 39.752 61.1483 39.568C61.4843 39.376 61.8803 39.28 62.3363 39.28V40.696H61.9883C61.4523 40.696 61.0443 40.832 60.7643 41.104C60.4923 41.376 60.3563 41.848 60.3563 42.52V46H58.9883V39.388H60.3563V40.348ZM69.5538 42.532C69.5538 42.78 69.5378 43.004 69.5058 43.204H64.4538C64.4938 43.732 64.6898 44.156 65.0418 44.476C65.3938 44.796 65.8258 44.956 66.3378 44.956C67.0738 44.956 67.5938 44.648 67.8978 44.032H69.3738C69.1738 44.64 68.8098 45.14 68.2818 45.532C67.7618 45.916 67.1138 46.108 66.3378 46.108C65.7058 46.108 65.1378 45.968 64.6338 45.688C64.1378 45.4 63.7458 45 63.4578 44.488C63.1778 43.968 63.0378 43.368 63.0378 42.688C63.0378 42.008 63.1738 41.412 63.4458 40.9C63.7258 40.38 64.1138 39.98 64.6098 39.7C65.1138 39.42 65.6898 39.28 66.3378 39.28C66.9618 39.28 67.5178 39.416 68.0058 39.688C68.4938 39.96 68.8738 40.344 69.1458 40.84C69.4178 41.328 69.5538 41.892 69.5538 42.532ZM68.1258 42.1C68.1178 41.596 67.9378 41.192 67.5858 40.888C67.2338 40.584 66.7978 40.432 66.2778 40.432C65.8058 40.432 65.4018 40.584 65.0658 40.888C64.7298 41.184 64.5298 41.588 64.4658 42.1H68.1258Z" fill="#757575" />
              </svg>

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
                  <svg width="104" height="50" viewBox="0 0 104 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M49.168 10.9849C48.7538 10.9849 48.418 11.3207 48.418 11.7349C48.418 12.1491 48.7538 12.4849 49.168 12.4849H55.168C55.5822 12.4849 55.918 12.1491 55.918 11.7349C55.918 11.3207 55.5822 10.9849 55.168 10.9849H49.168Z" fill="black" />
                    <path d="M50.668 14.9043C50.2538 14.9043 49.918 15.2401 49.918 15.6543C49.918 16.0685 50.2538 16.4043 50.668 16.4043H53.668C54.0822 16.4043 54.418 16.0685 54.418 15.6543C54.418 15.2401 54.0822 14.9043 53.668 14.9043H50.668Z" fill="black" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M52.234 1.25H52.17C51.6647 1.24999 51.236 1.24997 50.8804 1.28236C50.5029 1.31672 50.1513 1.39114 49.8113 1.57192C49.6772 1.64326 49.5491 1.72561 49.4286 1.81811C49.1231 2.05248 48.9095 2.34153 48.7217 2.67073C48.5447 2.98095 48.3669 3.37096 48.1574 3.83074L47.7383 4.75H43.168C42.7538 4.75 42.418 5.08579 42.418 5.5C42.418 5.91422 42.7538 6.25 43.168 6.25H43.9619L44.5263 15.5991C44.6017 16.8487 44.6616 17.8404 44.7861 18.6325C44.9138 19.4448 45.1192 20.1214 45.5311 20.7133C45.9079 21.2547 46.3933 21.7117 46.9565 22.0552C47.5721 22.4307 48.2598 22.5949 49.0784 22.6734C49.8765 22.75 50.8699 22.75 52.1218 22.75H52.1995C53.4497 22.75 54.4419 22.75 55.2391 22.6736C56.0567 22.5952 56.7437 22.4313 57.3589 22.0565C57.9217 21.7137 58.407 21.2574 58.7839 20.7168C59.1959 20.126 59.4019 19.4504 59.5306 18.6392C59.6561 17.8482 59.7173 16.8579 59.7944 15.61L60.373 6.25H61.168C61.5822 6.25 61.918 5.91422 61.918 5.5C61.918 5.08579 61.5822 4.75 61.168 4.75H56.6934L56.2019 3.73608C55.987 3.29264 55.8045 2.91616 55.6248 2.61688C55.4341 2.29917 55.2197 2.02075 54.9179 1.79561C54.7986 1.70664 54.6723 1.6275 54.5402 1.55897C54.2059 1.38555 53.8619 1.31408 53.4928 1.28107C53.1451 1.24998 52.7268 1.24999 52.234 1.25ZM55.0265 4.75H49.3868L49.5088 4.48234C49.7354 3.98523 49.8854 3.65798 50.0245 3.41407C50.1567 3.18253 50.2514 3.07739 50.3416 3.00823C50.3964 2.96619 50.4546 2.92876 50.5156 2.89633C50.6159 2.84298 50.7509 2.80035 51.0164 2.77618C51.296 2.75072 51.656 2.75 52.2023 2.75C52.7353 2.75 53.0862 2.75069 53.3592 2.77511C53.6182 2.79827 53.7506 2.83916 53.8494 2.89044C53.9095 2.92159 53.9669 2.95756 54.0211 2.99801C54.1104 3.06458 54.2049 3.16588 54.3387 3.38884C54.4798 3.62382 54.6334 3.93926 54.8659 4.41888L55.0265 4.75ZM46.0212 15.47L45.4646 6.25H58.8702L58.2997 15.4788C58.2196 16.774 58.162 17.6925 58.0491 18.4042C57.9381 19.1039 57.7835 19.529 57.5535 19.8589C57.2956 20.2288 56.9636 20.5409 56.5785 20.7755C56.2351 20.9847 55.8012 21.1128 55.096 21.1804C54.3787 21.2492 53.4584 21.25 52.1607 21.25C50.8613 21.25 49.9398 21.2492 49.2216 21.1803C48.5155 21.1126 48.0812 20.9842 47.7376 20.7746C47.3522 20.5396 47.0201 20.2269 46.7623 19.8564C46.5323 19.5261 46.3781 19.1002 46.2679 18.3995C46.1558 17.6868 46.0995 16.767 46.0212 15.47Z" fill="black" />
                    <path d="M36.9365 37.66C37.8245 37.66 38.6005 37.832 39.2645 38.176C39.9365 38.512 40.4525 39 40.8125 39.64C41.1805 40.272 41.3645 41.012 41.3645 41.86C41.3645 42.708 41.1805 43.444 40.8125 44.068C40.4525 44.692 39.9365 45.172 39.2645 45.508C38.6005 45.836 37.8245 46 36.9365 46H34.2125V37.66H36.9365ZM36.9365 44.884C37.9125 44.884 38.6605 44.62 39.1805 44.092C39.7005 43.564 39.9605 42.82 39.9605 41.86C39.9605 40.892 39.7005 40.136 39.1805 39.592C38.6605 39.048 37.9125 38.776 36.9365 38.776H35.5805V44.884H36.9365ZM48.6803 42.532C48.6803 42.78 48.6643 43.004 48.6323 43.204H43.5803C43.6203 43.732 43.8163 44.156 44.1683 44.476C44.5203 44.796 44.9523 44.956 45.4643 44.956C46.2003 44.956 46.7203 44.648 47.0243 44.032H48.5003C48.3003 44.64 47.9363 45.14 47.4083 45.532C46.8883 45.916 46.2403 46.108 45.4643 46.108C44.8323 46.108 44.2643 45.968 43.7603 45.688C43.2643 45.4 42.8723 45 42.5843 44.488C42.3043 43.968 42.1643 43.368 42.1643 42.688C42.1643 42.008 42.3003 41.412 42.5723 40.9C42.8523 40.38 43.2403 39.98 43.7363 39.7C44.2403 39.42 44.8163 39.28 45.4643 39.28C46.0883 39.28 46.6443 39.416 47.1323 39.688C47.6203 39.96 48.0003 40.344 48.2723 40.84C48.5443 41.328 48.6803 41.892 48.6803 42.532ZM47.2523 42.1C47.2443 41.596 47.0643 41.192 46.7123 40.888C46.3603 40.584 45.9243 40.432 45.4043 40.432C44.9323 40.432 44.5283 40.584 44.1923 40.888C43.8563 41.184 43.6563 41.588 43.5923 42.1H47.2523ZM51.2946 37.12V46H49.9266V37.12H51.2946ZM59.0506 42.532C59.0506 42.78 59.0346 43.004 59.0026 43.204H53.9506C53.9906 43.732 54.1866 44.156 54.5386 44.476C54.8906 44.796 55.3226 44.956 55.8346 44.956C56.5706 44.956 57.0906 44.648 57.3946 44.032H58.8706C58.6706 44.64 58.3066 45.14 57.7786 45.532C57.2586 45.916 56.6106 46.108 55.8346 46.108C55.2026 46.108 54.6346 45.968 54.1306 45.688C53.6346 45.4 53.2426 45 52.9546 44.488C52.6746 43.968 52.5346 43.368 52.5346 42.688C52.5346 42.008 52.6706 41.412 52.9426 40.9C53.2226 40.38 53.6106 39.98 54.1066 39.7C54.6106 39.42 55.1866 39.28 55.8346 39.28C56.4586 39.28 57.0146 39.416 57.5026 39.688C57.9906 39.96 58.3706 40.344 58.6426 40.84C58.9146 41.328 59.0506 41.892 59.0506 42.532ZM57.6226 42.1C57.6146 41.596 57.4346 41.192 57.0826 40.888C56.7306 40.584 56.2946 40.432 55.7746 40.432C55.3026 40.432 54.8986 40.584 54.5626 40.888C54.2266 41.184 54.0266 41.588 53.9626 42.1H57.6226ZM61.8929 40.504V44.164C61.8929 44.412 61.9489 44.592 62.0609 44.704C62.1809 44.808 62.3809 44.86 62.6609 44.86H63.5009V46H62.4209C61.8049 46 61.3329 45.856 61.0049 45.568C60.6769 45.28 60.5129 44.812 60.5129 44.164V40.504H59.7329V39.388H60.5129V37.744H61.8929V39.388H63.5009V40.504H61.8929ZM70.7217 42.532C70.7217 42.78 70.7057 43.004 70.6737 43.204H65.6217C65.6617 43.732 65.8577 44.156 66.2097 44.476C66.5617 44.796 66.9937 44.956 67.5057 44.956C68.2417 44.956 68.7617 44.648 69.0657 44.032H70.5417C70.3417 44.64 69.9777 45.14 69.4497 45.532C68.9297 45.916 68.2817 46.108 67.5057 46.108C66.8737 46.108 66.3057 45.968 65.8017 45.688C65.3057 45.4 64.9137 45 64.6257 44.488C64.3457 43.968 64.2057 43.368 64.2057 42.688C64.2057 42.008 64.3417 41.412 64.6137 40.9C64.8937 40.38 65.2817 39.98 65.7777 39.7C66.2817 39.42 66.8577 39.28 67.5057 39.28C68.1297 39.28 68.6857 39.416 69.1737 39.688C69.6617 39.96 70.0417 40.344 70.3137 40.84C70.5857 41.328 70.7217 41.892 70.7217 42.532ZM69.2937 42.1C69.2857 41.596 69.1057 41.192 68.7537 40.888C68.4017 40.584 67.9657 40.432 67.4457 40.432C66.9737 40.432 66.5697 40.584 66.2337 40.888C65.8977 41.184 65.6977 41.588 65.6337 42.1H69.2937Z" fill="#757575" />
                  </svg>

                </>
              ) : (
                <>
                  <svg width="104" height="50" viewBox="0 0 104 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M52.1134 1.25H52.2226C54.0619 1.24999 55.516 1.24997 56.6534 1.39731C57.8209 1.54853 58.7675 1.86672 59.5168 2.58863C60.27 3.31431 60.6055 4.23743 60.7643 5.37525C60.918 6.4765 60.918 7.88207 60.918 9.64945V18.0458C60.918 19.1434 60.918 20.0553 60.8126 20.7405C60.7036 21.4495 60.4494 22.1395 59.7484 22.5139C59.1232 22.8477 58.4356 22.7798 57.8525 22.6028C57.2628 22.4238 56.6634 22.0989 56.1146 21.7521C55.5606 21.402 55.0173 21.0029 54.545 20.6538L54.4894 20.6127C54.0266 20.2706 53.6549 19.9958 53.3711 19.8249C52.9715 19.5843 52.7192 19.4335 52.5147 19.3371C52.326 19.2482 52.2343 19.234 52.168 19.234C52.1017 19.234 52.01 19.2482 51.8212 19.3371C51.6167 19.4335 51.3644 19.5843 50.9649 19.8249C50.681 19.9958 50.3093 20.2706 49.8465 20.6127L49.791 20.6538C49.3186 21.0029 48.7754 21.402 48.2213 21.7521C47.6725 22.0989 47.0731 22.4238 46.4834 22.6028C45.9004 22.7798 45.2127 22.8477 44.5875 22.5139C43.8865 22.1395 43.6323 21.4495 43.5233 20.7405C43.4179 20.0553 43.4179 19.1434 43.418 18.0458L43.418 9.64943C43.418 7.88206 43.4179 6.4765 43.5716 5.37525C43.7304 4.23743 44.066 3.31431 44.8192 2.58863C45.5685 1.86672 46.5151 1.54853 47.6825 1.39731C48.82 1.24997 50.2741 1.24999 52.1134 1.25ZM47.8752 2.88488C46.8642 3.01584 46.2822 3.26202 45.8599 3.66885C45.4416 4.07192 45.1913 4.62151 45.0572 5.58256C44.9197 6.56814 44.918 7.86886 44.918 9.70753V17.9808C44.918 19.1601 44.9201 19.9551 45.0059 20.5125C45.09 21.0596 45.2223 21.1523 45.2941 21.1907C45.4172 21.2564 45.6417 21.2907 46.0477 21.1675C46.4469 21.0463 46.9133 20.8043 47.42 20.4841C47.9216 20.1671 48.4236 19.7991 48.8994 19.4475C48.9293 19.4254 48.9593 19.4032 48.9892 19.3811C49.4185 19.0636 49.8438 18.749 50.1911 18.5399L50.2205 18.5222C50.5819 18.3045 50.8999 18.113 51.182 17.9801C51.4874 17.8363 51.8041 17.734 52.168 17.734C52.5319 17.734 52.8486 17.8363 53.154 17.9801C53.436 18.113 53.754 18.3045 54.1155 18.5222L54.1449 18.5399C54.4922 18.749 54.9175 19.0636 55.3468 19.3811C55.3767 19.4032 55.4066 19.4254 55.4365 19.4475C55.9123 19.7991 56.4144 20.1671 56.9159 20.4841C57.4227 20.8043 57.889 21.0463 58.2883 21.1675C58.6942 21.2907 58.9187 21.2564 59.0418 21.1907C59.1137 21.1523 59.2459 21.0596 59.3301 20.5125C59.4158 19.9551 59.418 19.1601 59.418 17.9808V9.70753C59.418 7.86886 59.4163 6.56814 59.2787 5.58256C59.1446 4.62151 58.8944 4.07192 58.476 3.66885C58.0538 3.26202 57.4718 3.01584 56.4607 2.88488C55.4309 2.75148 54.074 2.75 52.168 2.75C50.2619 2.75 48.9051 2.75148 47.8752 2.88488Z" fill="black" />
                    <path d="M41.4207 46.084C40.8607 46.084 40.3567 45.988 39.9087 45.796C39.4607 45.596 39.1087 45.316 38.8527 44.956C38.5967 44.596 38.4687 44.176 38.4687 43.696H39.9327C39.9647 44.056 40.1047 44.352 40.3527 44.584C40.6087 44.816 40.9647 44.932 41.4207 44.932C41.8927 44.932 42.2607 44.82 42.5247 44.596C42.7887 44.364 42.9207 44.068 42.9207 43.708C42.9207 43.428 42.8367 43.2 42.6687 43.024C42.5087 42.848 42.3047 42.712 42.0567 42.616C41.8167 42.52 41.4807 42.416 41.0487 42.304C40.5047 42.16 40.0607 42.016 39.7167 41.872C39.3807 41.72 39.0927 41.488 38.8527 41.176C38.6127 40.864 38.4927 40.448 38.4927 39.928C38.4927 39.448 38.6127 39.028 38.8527 38.668C39.0927 38.308 39.4287 38.032 39.8607 37.84C40.2927 37.648 40.7927 37.552 41.3607 37.552C42.1687 37.552 42.8287 37.756 43.3407 38.164C43.8607 38.564 44.1487 39.116 44.2047 39.82H42.6927C42.6687 39.516 42.5247 39.256 42.2607 39.04C41.9967 38.824 41.6487 38.716 41.2167 38.716C40.8247 38.716 40.5047 38.816 40.2567 39.016C40.0087 39.216 39.8847 39.504 39.8847 39.88C39.8847 40.136 39.9607 40.348 40.1127 40.516C40.2727 40.676 40.4727 40.804 40.7127 40.9C40.9527 40.996 41.2807 41.1 41.6967 41.212C42.2487 41.364 42.6967 41.516 43.0407 41.668C43.3927 41.82 43.6887 42.056 43.9287 42.376C44.1767 42.688 44.3007 43.108 44.3007 43.636C44.3007 44.06 44.1847 44.46 43.9527 44.836C43.7287 45.212 43.3967 45.516 42.9567 45.748C42.5247 45.972 42.0127 46.084 41.4207 46.084ZM45.3588 42.664C45.3588 42 45.4948 41.412 45.7668 40.9C46.0468 40.388 46.4228 39.992 46.8948 39.712C47.3748 39.424 47.9028 39.28 48.4788 39.28C48.9988 39.28 49.4508 39.384 49.8348 39.592C50.2268 39.792 50.5388 40.044 50.7708 40.348V39.388H52.1508V46H50.7708V45.016C50.5388 45.328 50.2228 45.588 49.8228 45.796C49.4228 46.004 48.9668 46.108 48.4548 46.108C47.8868 46.108 47.3668 45.964 46.8948 45.676C46.4228 45.38 46.0468 44.972 45.7668 44.452C45.4948 43.924 45.3588 43.328 45.3588 42.664ZM50.7708 42.688C50.7708 42.232 50.6748 41.836 50.4828 41.5C50.2988 41.164 50.0548 40.908 49.7508 40.732C49.4468 40.556 49.1188 40.468 48.7668 40.468C48.4148 40.468 48.0868 40.556 47.7828 40.732C47.4788 40.9 47.2308 41.152 47.0388 41.488C46.8548 41.816 46.7628 42.208 46.7628 42.664C46.7628 43.12 46.8548 43.52 47.0388 43.864C47.2308 44.208 47.4788 44.472 47.7828 44.656C48.0948 44.832 48.4228 44.92 48.7668 44.92C49.1188 44.92 49.4468 44.832 49.7508 44.656C50.0548 44.48 50.2988 44.224 50.4828 43.888C50.6748 43.544 50.7708 43.144 50.7708 42.688ZM56.4037 44.776L58.2757 39.388H59.7277L57.2077 46H55.5757L53.0677 39.388H54.5317L56.4037 44.776ZM66.7217 42.532C66.7217 42.78 66.7057 43.004 66.6737 43.204H61.6217C61.6617 43.732 61.8577 44.156 62.2097 44.476C62.5617 44.796 62.9937 44.956 63.5057 44.956C64.2417 44.956 64.7617 44.648 65.0657 44.032H66.5417C66.3417 44.64 65.9777 45.14 65.4497 45.532C64.9297 45.916 64.2817 46.108 63.5057 46.108C62.8737 46.108 62.3057 45.968 61.8017 45.688C61.3057 45.4 60.9137 45 60.6257 44.488C60.3457 43.968 60.2057 43.368 60.2057 42.688C60.2057 42.008 60.3417 41.412 60.6137 40.9C60.8937 40.38 61.2817 39.98 61.7777 39.7C62.2817 39.42 62.8577 39.28 63.5057 39.28C64.1297 39.28 64.6857 39.416 65.1737 39.688C65.6617 39.96 66.0417 40.344 66.3137 40.84C66.5857 41.328 66.7217 41.892 66.7217 42.532ZM65.2937 42.1C65.2857 41.596 65.1057 41.192 64.7537 40.888C64.4017 40.584 63.9657 40.432 63.4457 40.432C62.9737 40.432 62.5697 40.584 62.2337 40.888C61.8977 41.184 61.6977 41.588 61.6337 42.1H65.2937Z" fill="#757575" />
                  </svg>

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
      </Box>
    </Layout>
  );
}