'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { getUpcomingForecasts, generateSummary } from '@/services/summaryService';
import { format, addDays } from 'date-fns';
import Layout from '@/components/Layout';
import { useToast } from '@/ui/toast';

export default function WeeklyForecast() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [noAlertsFound, setNoAlertsFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const initialLoadRef = useRef(true);

  // Display initial loading toast only on first render
  useEffect(() => {
    if (initialLoadRef.current) {
      showToast('Generating weekly forecast...', 'success');
      initialLoadRef.current = false;
    }
  }, [showToast]);

  const generateWeeklyForecast = useCallback(async () => {
    try {
      setLoading(true);
      // Get the forecast with proper MainOperatingRegions
      const response = await getUpcomingForecasts(7);
      
      if (response.success && response.forecast) {
        // Check if there are any alerts found
        if (!response.forecast.alerts || response.forecast.alerts.length === 0) {
          setNoAlertsFound(true);
          setLoading(false);
          return;
        }
        
        // Now create a forecast with the data so we have a PDF but don't auto-save it
        const today = new Date();
        const nextWeek = addDays(today, 7);
        
        // Prepare data for generating a summary
        const data = {
          title: response.forecast.title || `Weekly Disruption Forecast`,
          description: response.forecast.description || `Forecast for ${format(today, 'dd MMM yyyy')} to ${format(nextWeek, 'dd MMM yyyy')}`,
          summaryType: 'forecast' as const,
          startDate: response.forecast.timeRange.startDate,
          endDate: response.forecast.timeRange.endDate,
          locations: response.forecast.userRegions || [],
          alertCategory: response.forecast.alertCategory,
          impact: response.forecast.impact,
          generatePDF: true,
          autoSave: false,
          includedAlerts: response.forecast.alerts || []
        };

        try {
          const saveResponse = await generateSummary(data);
          
          if (saveResponse.success && saveResponse.summary.pdfUrl) {
            router.push(`/alerts-summary/weekly-forecast?pdf=${encodeURIComponent(saveResponse.summary.pdfUrl)}`);
          } else if (response.forecast.pdfUrl) {
            router.push(`/alerts-summary/weekly-forecast?pdf=${encodeURIComponent(response.forecast.pdfUrl)}`);
          } else {
            // If no alerts were found but the call was successful
            if (!saveResponse.summary.alerts || saveResponse.summary.alerts.length === 0) {
              setNoAlertsFound(true);
              setLoading(false);
            } else {
              // If no PDF URL is returned but the API call was successful, still show the forecast page
              router.push('/alerts-summary/weekly-forecast');
            }
          }
        } catch (saveError) {
          console.error('Error saving forecast:', saveError);
          
          // If generating a summary fails but we have a PDF URL from the forecast, use that
          if (response.forecast.pdfUrl) {
            router.push(`/alerts-summary/weekly-forecast?pdf=${encodeURIComponent(response.forecast.pdfUrl)}`);
          } else {
            // Check if this is a "no alerts" situation
            if ((saveError as Error).toString().includes('No alerts found') || 
               (!response.forecast.alerts || response.forecast.alerts.length === 0)) {
              setNoAlertsFound(true);
            } else {
              // This is a genuine error
              setError('We encountered an issue while preparing your forecast. Please try again.');
            }
            setLoading(false);
          }
        }
      } else {
        // No forecast data available - show empty state
        setNoAlertsFound(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error generating weekly forecast:', error);
      setError('We encountered an issue while preparing your forecast. Please try again.');
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    generateWeeklyForecast();
  }, [generateWeeklyForecast]);

  // Using a useEffect to show toasts based on state changes
  useEffect(() => {
    if (noAlertsFound) {
      showToast('No alerts found for this week', 'error');
    } else if (error) {
      showToast('Failed to generate weekly forecast', 'error');
    } else if (!loading && !initialLoadRef.current) {
      showToast('Weekly forecast ready', 'success');
    }
  }, [noAlertsFound, error, loading, showToast]);

  if (error) {
    return (
      <Layout isFooter={false}>
        <Box sx={{ p: 3 }}>
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium">
              {error}
            </Typography>
            <Typography variant="body2">
              This might be due to a temporary connection issue.
            </Typography>
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => {
              setError('');
              router.push('/alerts-summary');
            }}
            sx={{ mt: 2 }}
          >
            Return to Summary Page
          </Button>
        </Box>
      </Layout>
    );
  }

  if (noAlertsFound) {
    return (
      <Layout isFooter={false}>
        <Box sx={{ p: 3 }}>
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium">
              No Alerts Found
            </Typography>
            <Typography variant="body2">
              There are currently no disruptions reported for your operating regions in the upcoming week.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              This could mean your selected regions have no significant disruptions expected, or any minor issues don&apos;t meet your alert criteria.
            </Typography>
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => {
              setNoAlertsFound(false);
              router.push('/alerts-summary');
            }}
            sx={{ mt: 2 }}
          >
            Return to Summary Page
          </Button>
        </Box>
      </Layout>
    );
  }

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
        {loading ? (
          <>
            <CircularProgress size={40} />
            <Typography variant="h6">Preparing Your Weekly Forecast</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              We&apos;re analyzing upcoming disruptions in your operating regions. This should only take a moment.
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h6">Weekly Forecast Ready</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Your weekly forecast is ready. Click the button below to view it.
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                showToast('Loading weekly forecast', 'success');
                router.push('/alerts-summary/weekly-forecast');
              }}
              sx={{ mt: 2 }}
            >
              View Weekly Forecast
            </Button>
          </>
        )}
      </Box>
    </Layout>
  );
}