'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  Chip,
  Divider,
} from '@mui/material';
import { 
  Download as DownloadIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ArrowForward as ArrowForwardIcon,
  Bookmarks as BookmarksIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, addDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/ui/toast';

// Google Places Autocomplete
import { useLoadScript } from '@react-google-maps/api';

// Import LocationSearchInput component
import LocationSearchInput from '@/components/alert-summary/LocationSearchInput';

// Import the summaryService
import { 
  generateSummary, 
  SummaryLocation,
  downloadPdf,
  getUpcomingForecasts,
} from '@/services/summaryService';
import Layout from '@/components/Layout';

// Define the category-type mapping to match admin create page
const ALERT_TYPE_MAP = {
  "Industrial Action": ["Strike", "Work-to-Rule", "Labor Dispute", "Other"],
  "Extreme Weather": ["Storm", "Flooding", "Heatwave", "Wildfire", "Snow", "Other"],
  "Infrastructure Failures": ["Power Outage", "IT & System Failure", "Transport Service Suspension", "Road, Rail & Tram Closure", "Repairs or Delays", "Other"],
  "Public Safety Incidents": ["Protest", "Crime", "Terror Threats", "Travel Advisory", "Other"],
  "Festivals and Events": ["Citywide Festival", "Sporting Event", "Concerts and Stadium Events", "Parades and Ceremonies", "Other"]
};

// Convert the map to the format needed for the dropdown
const ALERT_TYPES = Object.keys(ALERT_TYPE_MAP).map(category => ({
  value: category,
  label: `${category} Events`,
}));

const IMPACT_LEVELS = [
  { value: 'Minor', label: 'Minor' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Severe', label: 'Severe' },
];

export default function DisruptionForecast() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('weekly');
  const [weeklyAlertCount, setWeeklyAlertCount] = useState<number | null>(null);
  const { showToast } = useToast();
  
  // Form state for custom forecast
  const [alertCategory, setAlertCategory] = useState('');
  const [location, setLocation] = useState<SummaryLocation | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 7));
  const [impact, setImpact] = useState('');
  
  // Weekly forecast date range (for display)
  const { isCollaboratorViewer } = useAuth();

  const isViewOnly = () => {
    return isCollaboratorViewer;
  };

  const weeklyStartDate = new Date()
  const weeklyEndDate = addDays(new Date(), 7)
  // Google Maps API script loading
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  // Add at the top of the component, with other state variables:
  const [noAlertsFound, setNoAlertsFound] = useState(false);
  const [weeklyReportDownloaded, setWeeklyReportDownloaded] = useState(false);
  const [emptyReportDownloaded, setEmptyReportDownloaded] = useState(false);
  const [forecastError, setForecastError] = useState(false);

  // Add these state variables at the top of the component:
  const [locationError, setLocationError] = useState(false);
  const [generatingForecast, setGeneratingForecast] = useState(false);
  const [forecastGeneratedSuccess, setForecastGeneratedSuccess] = useState(false);
  const [forecastGeneratedError, setForecastGeneratedError] = useState(false);
  const [savingWeeklyForecast, setSavingWeeklyForecast] = useState(false);
  const [weeklySaveSuccess, setWeeklySaveSuccess] = useState(false);
  const [weeklySaveError, setWeeklySaveError] = useState(false);
  const [sharingWeeklyForecast, setSharingWeeklyForecast] = useState(false);
  const [weeklyShareSuccess, setWeeklyShareSuccess] = useState(false);
  const [weeklyShareError, setWeeklyShareError] = useState(false);

  // Add useEffect to handle toast notifications based on state changes
  useEffect(() => {
    if (weeklyReportDownloaded) {
      showToast('Download started', 'success');
      setWeeklyReportDownloaded(false);
    }
    if (noAlertsFound) {
      showToast('No alerts found for this week', 'error');
      setNoAlertsFound(false);
    }
    if (emptyReportDownloaded) {
      showToast('Downloading empty report...', 'success');
      setEmptyReportDownloaded(false);
    }
    if (forecastError) {
      showToast('Failed to generate weekly forecast', 'error');
      setForecastError(false);
    }
    if (locationError) {
      showToast('Please select a location', 'error');
      setLocationError(false);
    }
    if (generatingForecast) {
      showToast('Generating forecast...', 'success');
      setGeneratingForecast(false);
    }
    if (forecastGeneratedSuccess) {
      showToast('Forecast generated successfully', 'success');
      setForecastGeneratedSuccess(false);
    }
    if (forecastGeneratedError) {
      showToast('Failed to generate forecast', 'error');
      setForecastGeneratedError(false);
    }
    if (savingWeeklyForecast) {
      showToast('Saving weekly forecast...', 'success');
      setSavingWeeklyForecast(false);
    }
    if (weeklySaveSuccess) {
      showToast('Weekly forecast saved', 'success');
      setWeeklySaveSuccess(false);
    }
    if (weeklySaveError) {
      showToast('Failed to save weekly forecast', 'error');
      setWeeklySaveError(false);
    }
    if (sharingWeeklyForecast) {
      showToast('Sharing weekly forecast...', 'success');
      setSharingWeeklyForecast(false);
    }
    if (weeklyShareSuccess) {
      showToast('Weekly forecast shared', 'success');
      setWeeklyShareSuccess(false);
    }
    if (weeklyShareError) {
      showToast('Failed to share weekly forecast', 'error');
      setWeeklyShareError(false);
    }
  }, [
    weeklyReportDownloaded, 
    noAlertsFound, 
    emptyReportDownloaded, 
    forecastError, 
    locationError,
    generatingForecast,
    forecastGeneratedSuccess,
    forecastGeneratedError,
    savingWeeklyForecast,
    weeklySaveSuccess,
    weeklySaveError,
    sharingWeeklyForecast,
    weeklyShareSuccess,
    weeklyShareError,
    showToast
  ]);

  useEffect(() => {
    checkWeeklyAlerts();
  }, []);

  const checkWeeklyAlerts = async () => {
    try {
      const response = await getUpcomingForecasts(7);
      if (response.success && response.forecast) {
        const alertCount = response.forecast.alerts?.length || 0;
        setWeeklyAlertCount(alertCount);
      }
    } catch (error) {
      console.error('Error checking weekly alerts:', error);
      // Don't show an error to the user, just set count to null
      setWeeklyAlertCount(null);
    }
  };

  const handleNavigateToSaved = () => {
    router.push('/alerts-summary/saved');
  };

  const handleGenerateForecast = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!location) {
        setError('Please select a location');
        setLocationError(true);
        setLoading(false);
        return;
      }

      // Prepare locations array
      const locations = location ? [location] : [];
      
      // Get all subcategory alert types for the selected category
      const alertTypes = alertCategory ? 
        [alertCategory, ...(ALERT_TYPE_MAP[alertCategory as keyof typeof ALERT_TYPE_MAP] || [])] : 
        [];
      
      const data = {
        title: `Disruption Forecast for ${location?.city || 'Selected Location'}`,
        description: `Custom forecast for ${format(startDate || new Date(), 'dd MMM yyyy')} to ${format(endDate || new Date(), 'dd MMM yyyy')}`,
        summaryType: 'forecast' as const, // Use type assertion
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        locations,
        alertTypes,
        alertCategory, // Add the category explicitly 
        includeDuplicates: false,
        generatePDF: true,
        autoSave: true, // Auto-save enabled
        impact: impact || undefined,
      };

      setGeneratingForecast(true);
      const response = await generateSummary(data);
      
      if (response.success) {
        if (response.summary.savedSummaryId) {
          // Navigate to the saved summary if we have an ID
          setForecastGeneratedSuccess(true);
          router.push(`/alerts-summary/${response.summary.savedSummaryId}`);
        } else if (response.summary.pdfUrl) {
          // Create a temporary ID for viewing this unsaved summary
          setForecastGeneratedSuccess(true);
          router.push(`/alerts-summary/${response.summary.savedSummaryId || 'custom-forecast'}?pdf=${encodeURIComponent(response.summary.pdfUrl)}`);
        } else {
          setError('Failed to generate forecast. Please try again with different parameters.');
          setForecastGeneratedError(true);
        }
      } else {
        setError('Failed to generate forecast. Please try again with different parameters.');
        setForecastGeneratedError(true);
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
      setError('An error occurred while generating the forecast. Please try again.');
      setForecastGeneratedError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewWeeklyForecast = () => {
    // Navigate to the weekly forecast generation page
    router.push('/alerts-summary/weekly');
  };

  const handleGenerateWeeklyForecast = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the forecast with proper MainOperatingRegions
      const response = await getUpcomingForecasts(7);
      
      if (response.success) {
        // Check if we have alerts
        const hasAlerts = response.forecast?.alerts && response.forecast.alerts.length > 0;
        
        if (response.forecast?.pdfUrl) {
          // Download the PDF using the URL from the forecast
          await downloadPdf(
            response.forecast.pdfUrl,
            `Weekly_Forecast_${format(new Date(), 'yyyy-MM-dd')}.pdf`
          );
          setWeeklyReportDownloaded(true);
        } else if (!hasAlerts) {
          // Create a special "No alerts" PDF
          setNoAlertsFound(true);
          const noAlertsData = {
            title: "Weekly Disruption Forecast - No Alerts",
            description: `No disruptions found for ${format(new Date(), 'dd MMM yyyy')} to ${format(addDays(new Date(), 7), 'dd MMM yyyy')}`,
            summaryType: 'forecast' as const,
            startDate: new Date().toISOString(),
            endDate: addDays(new Date(), 7).toISOString(),
            generatePDF: true,
            autoSave: false,
            // Use the user regions from the response if available
            locations: response.forecast?.userRegions || []
          };
          
          // Generate the PDF with "no alerts" content
          const noAlertsResponse = await generateSummary(noAlertsData);
          
          if (noAlertsResponse.success && noAlertsResponse.summary.pdfUrl) {
            await downloadPdf(
              noAlertsResponse.summary.pdfUrl,
              `Weekly_Forecast_No_Alerts_${format(new Date(), 'yyyy-MM-dd')}.pdf`
            );
            setEmptyReportDownloaded(true);
          } else {
            // Only show an error if we can't even generate a "no alerts" PDF
            setError('No alerts found in your operating regions for the upcoming week. We\'ve prepared a blank report for you.');
          }
        } else {
          setError('Failed to generate the weekly forecast PDF. Please try again.');
          setForecastError(true);
        }
      } else {
        setError('Failed to retrieve weekly forecast data. Please try again.');
        setForecastError(true);
      }
    } catch (error) {
      console.error('Error generating weekly forecast:', error);
      setError('Failed to generate weekly forecast. Please try again.');
      setForecastError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeeklyForecast = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the forecast with proper MainOperatingRegions
      setSavingWeeklyForecast(true);
      const forecastResponse = await getUpcomingForecasts(7);
      
      if (!forecastResponse.success) {
        setError('Failed to generate weekly forecast. Please try again.');
        setWeeklySaveError(true);
        setLoading(false);
        return;
      }

      // Check if we have alerts
      const hasAlerts = forecastResponse.forecast?.alerts && forecastResponse.forecast.alerts.length > 0;
      
      // Now save the forecast with the data we got, including MainOperatingRegions
      const data = {
        title: forecastResponse.forecast?.title || "Weekly Disruption Forecast",
        description: forecastResponse.forecast?.description || 
                    (hasAlerts 
                      ? `Weekly forecast for ${format(new Date(), 'dd MMM yyyy')}` 
                      : `No disruptions found for the week of ${format(new Date(), 'dd MMM yyyy')}`),
        summaryType: 'forecast' as const,
        startDate: forecastResponse.forecast?.timeRange?.startDate || new Date().toISOString(),
        endDate: forecastResponse.forecast?.timeRange?.endDate || addDays(new Date(), 7).toISOString(),
        generatePDF: true,
        autoSave: true,
        locations: forecastResponse.forecast?.userRegions || [], // Use userRegions for locations
        alertCategory: forecastResponse.forecast?.alertCategory,
        impact: forecastResponse.forecast?.impact,
        includedAlerts: forecastResponse.forecast?.alerts || [] // Include the alerts from the forecast
      };

      // If we have no alerts, add a special flag to ensure proper handling
      if (!hasAlerts) {
        // Include metadata to indicate this is an empty report
        data.description = `No disruptions found for the week of ${format(new Date(), 'dd MMM yyyy')}`;
        data.title = "Weekly Disruption Forecast - No Alerts";
      }

      // Generate a summary and redirect to it
      const saveResponse = await generateSummary(data);
      
      if (saveResponse.success && saveResponse.summary.savedSummaryId) {
        // Navigate to the saved summary
        setWeeklySaveSuccess(true);
        router.push(`/alerts-summary/${saveResponse.summary.savedSummaryId}`);
      } else if (!hasAlerts && saveResponse.success) {
        // If no alerts but the save was "successful", still direct them to the saved page
        setWeeklySaveSuccess(true);
        router.push(`/alerts-summary/saved`);
      } else {
        setError('Failed to save weekly forecast. Please try again.');
        setWeeklySaveError(true);
      }
    } catch (error) {
      console.error('Error saving weekly forecast:', error);
      setError('Failed to save weekly forecast. Please try again.');
      setWeeklySaveError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWeeklyForecast = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the weekly forecast URL for sharing
      setSharingWeeklyForecast(true);
      const url = `${window.location.origin}/alerts-summary/weekly-forecast`;
      
      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: 'Weekly Disruption Forecast',
          text: 'Check out this weekly disruption forecast',
          url: url
        });
        setWeeklyShareSuccess(true);
      } else {
        // Fallback to copying the URL to clipboard
        await navigator.clipboard.writeText(url);
        setWeeklyShareSuccess(true);
      }
    } catch (error) {
      console.error('Error sharing weekly forecast:', error);
      setError('Failed to share weekly forecast. Please try again.');
      setWeeklyShareError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout isFooter={false}>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ px: 3, py: 2, maxWidth: '1200px', mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Disruption Forecasts
          </Typography>
          <Button
            variant="outlined"
            startIcon={<BookmarksIcon />}
            onClick={handleNavigateToSaved}
            sx={{ 
              borderRadius: 2,
              borderColor: '#000',
              color: '#000',
              '&:hover': {
                borderColor: '#333',
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Saved Forecasts
          </Button>
        </Box>

        <Divider sx={{ mb: 4 }} />

            {weeklyAlertCount === null ? (
              <Paper 
                elevation={1} 
                sx={{ 
            p: 0, 
            mb: 4, 
            borderRadius: 4,
            overflow: 'hidden',
            border: activeSection === 'weekly' ? '1px solid #e0e0e0' : 'none'
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              This Week&apos;s Forecast
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {format(weeklyStartDate, 'dd MMM')} – {format(weeklyEndDate, 'dd MMM yyyy')}
            </Typography>

            <Typography variant="body1" fontWeight="medium" sx={{ mb: 2 }}>
              {weeklyAlertCount === null ? 'Loading alerts...' :
                weeklyAlertCount === 0 ? 'No alerts for this week.' :
                weeklyAlertCount === 1 ? '1 Alert for this week.' :
                `${weeklyAlertCount} Alerts for this week.`}
            </Typography>

            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleViewWeeklyForecast}
              sx={{ 
                py: 1.5, 
                backgroundColor: '#f5f5f5',
                color: '#000',
                boxShadow: 'none',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#e0e0e0',
                  boxShadow: 'none'
                }
              }}
            >
              View Full Report
            </Button>
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
              color: '#666',
              cursor: 'pointer',
              '&:hover': {
                color: '#333'
              }
            }
          }}>
            <Box onClick={() => handleGenerateWeeklyForecast()}>
              <Tooltip title="Download Report">
                <DownloadIcon fontSize="small" />
              </Tooltip>
            </Box>
            <Box sx={{ borderLeft: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0' }} onClick={() => handleShareWeeklyForecast()}>
              <Tooltip title="Share Report">
                <ArrowForwardIcon fontSize="small" />
              </Tooltip>
            </Box>
            <Box onClick={() => isViewOnly() ? null : handleSaveWeeklyForecast()}
              sx={{
                opacity: isViewOnly() ? 0.5 : 1,
                cursor: isViewOnly() ? 'not-allowed' : 'pointer'
              }}
            >
              <Tooltip title="Save Report">
                <BookmarkBorderIcon fontSize="small" />
              </Tooltip>
            </Box>
          </Box>
        </Paper>
        ) : (
            <Typography variant="h6" fontWeight="bold" gutterBottom>
            </Typography>
        )}
        

        {/* Custom Forecast Section */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 4,
            overflow: 'hidden',
            border: activeSection === 'custom' ? '1px solid #e0e0e0' : 'none' 
          }}
          onClick={() => setActiveSection('custom')}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Create Custom Forecast
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Create custom disruption forecasts
          </Typography>

          {/* Form Fields in Clean Layout */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Alert Type */}
            <Box>
              <FormControl fullWidth>
                <InputLabel id="alert-type-label">Alert Type</InputLabel>
                <Select
                  labelId="alert-type-label"
                  id="alert-type"
                  value={alertCategory}
                  label="Alert Type"
                  onChange={(e) => setAlertCategory(e.target.value)}
                  disabled={isViewOnly()}
                  sx={{
                    opacity: isViewOnly() ? 0.5 : 1,
                    cursor: isViewOnly() ? 'not-allowed' : 'pointer',
                    borderRadius: 1
                  }}
                >
                  <MenuItem value="">Select</MenuItem>
                  {ALERT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {alertCategory && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Will include all {alertCategory.toLowerCase()} types: 
                    {ALERT_TYPE_MAP[alertCategory as keyof typeof ALERT_TYPE_MAP]?.map((subtype) => (
                      <Chip 
                        key={subtype} 
                        label={subtype}
                        size="small"
                        sx={{ ml: 0.5, mb: 0.5, mt: 0.5 }}
                      />
                    ))}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Location */}
            <Box>
              <FormControl fullWidth>
                {isLoaded ? (
                  <LocationSearchInput 
                    setValue={setLocation} 
                    value={location}
                    label="Location" 
                  />
                ) : (
                  <TextField
                    label="Location"
                    fullWidth
                    disabled={isViewOnly()}
                    placeholder="Loading location search..."
                    sx={{
                      opacity: isViewOnly() ? 0.5 : 1,
                      cursor: isViewOnly() ? 'not-allowed' : 'pointer',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1
                      }
                    }}
                  />
                )}
              </FormControl>
            </Box>

            {/* Date Range */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Date Range
              </Typography>
              <FormControl fullWidth>
                <Stack direction="row" spacing={2}>
                  <Box sx={{ width: '50%' }}>
                    <DatePicker
                      label="dd/mm/yyyy"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1
                            }
                          }
                        } 
                      }}
                      disabled={isViewOnly()}
                      sx={{
                        opacity: isViewOnly() ? 0.5 : 1,
                        cursor: isViewOnly() ? 'not-allowed' : 'pointer'
                      }}
                    />
                  </Box>
                  <Box sx={{ width: '50%' }}>
                    <DatePicker
                      label="dd/mm/yyyy"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1
                            }
                          }
                        } 
                      }}
                      disabled={isViewOnly()}
                      sx={{
                        opacity: isViewOnly() ? 0.5 : 1,
                        cursor: isViewOnly() ? 'not-allowed' : 'pointer'
                      }}
                    />
                  </Box>
                </Stack>
              </FormControl>
            </Box>

            {/* Impact Level */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Impacted Level
              </Typography>
              <FormControl fullWidth>
                <Select
                  labelId="impact-label"
                  id="impact"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  disabled={isViewOnly()}
                  displayEmpty
                  renderValue={(selected) => {
                    if (selected === "") {
                      return <em>Select</em>;
                    }
                    return selected;
                  }}
                  sx={{
                    opacity: isViewOnly() ? 0.5 : 1,
                    cursor: isViewOnly() ? 'not-allowed' : 'pointer',
                    borderRadius: 1
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>Select</em>
                  </MenuItem>
                  {IMPACT_LEVELS.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Generate Button */}
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleGenerateForecast}
                disabled={loading || isViewOnly()}
                sx={{ 
                  py: 1.5,
                  borderRadius: 6,
                  opacity: isViewOnly() ? 0.5 : 1,
                  cursor: isViewOnly() ? 'not-allowed' : 'pointer',
                  backgroundColor: '#000',
                  '&:hover': {
                    backgroundColor: '#333',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
    </Layout>
  );
}
