'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  IconButton,
  SelectChangeEvent,
} from '@mui/material';
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
  // downloadPdf,
  getUpcomingForecasts,
} from '@/services/summaryService';
import Layout from '@/components/Layout';

// Define the category-type mapping to match admin create page
const ALERT_CATEGORIES = [
  { value: "All", label: "All" },
  { value: "Industrial Action", label: "Industrial Action" },
  { value: "Transport", label: "Transport" },
  { value: "Civil Unrest", label: "Civil Unrest" },
  { value: "Health", label: "Health" },
  { value: "General Safety", label: "General Safety" },
  { value: "Natural Disaster", label: "Natural Disaster" }
];

// This can be removed or commented out as we're using direct categories now
// const ALERT_TYPE_MAP = {
//   "Industrial Action": ["Strike", "Work-to-Rule", "Labor Dispute", "Other"],
//   "Extreme Weather": ["Storm", "Flooding", "Heatwave", "Wildfire", "Snow", "Other"],
//   "Infrastructure Failures": ["Power Outage", "IT & System Failure", "Transport Service Suspension", "Road, Rail & Tram Closure", "Repairs or Delays", "Other"],
//   "Public Safety Incidents": ["Protest", "Crime", "Terror Threats", "Travel Advisory", "Other"],
//   "Festivals and Events": ["Citywide Festival", "Sporting Event", "Concerts and Stadium Events", "Parades and Ceremonies", "Other"]
// };

// Convert the map to the format needed for the dropdown
// const ALERT_TYPES = Object.keys(ALERT_TYPE_MAP).map(category => ({
//   value: category,
//   label: `${category} Events`,
// }));

const IMPACT_LEVELS = [
  { value: 'All', label: 'All' },
  { value: 'Minor', label: 'Minor' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Severe', label: 'Severe' },
];

export default function DisruptionForecast() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // const [activeSection, setActiveSection] = useState('weekly');
  // const [weeklyAlertCount, setWeeklyAlertCount] = useState<number | null>(null);
  const { showToast } = useToast();

  // Form state for custom forecast
  const [alertCategory, setAlertCategory] = useState('');
  const [location, setLocation] = useState<SummaryLocation | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 7));
  const [impact, setImpact] = useState('');

  // Weekly forecast date range (for display)
  const { isCollaboratorViewer, isSubscribed } = useAuth();

  const isViewOnly = () => {
    return isCollaboratorViewer;
  };

  // const weeklyStartDate = new Date()
  // const weeklyEndDate = addDays(new Date(), 7)
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

  // Add this state at the top with other state variables
  const [dateRangeType, setDateRangeType] = useState<'thisWeek' | 'custom'>('thisWeek');

  // Update the date fields when dateRangeType changes
  useEffect(() => {
    if (dateRangeType === 'thisWeek') {
      setStartDate(new Date());
      setEndDate(addDays(new Date(), 7));
    }
  }, [dateRangeType]);

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
        console.log('alertCount', alertCount);
        // setWeeklyAlertCount(alertCount);
      }
    } catch (error) {
      console.error('Error checking weekly alerts:', error);
      // Don't show an error to the user, just set count to null
      // setWeeklyAlertCount(null);
    }
  };

  const handleNavigateToSaved = () => {
    router.push('/alerts-summary/saved');
  };

  const handleGenerateForecast = async () => {
    try {
      setLoading(true);
      setError('');

      // For non-subscribers, ensure we have the Edinburgh location set
      if (!isSubscribed && (!location || location.city !== "Edinburgh")) {
        setLocation({
          city: "Edinburgh",
          country: "United Kingdom",
          latitude: 55.953251,
          longitude: -3.188267,
          placeId: "ChIJIyaYpQC4h0gRJxfnfHsU8mQ"
        });
      }

      // For subscribers, require a location selection
      if (isSubscribed && !location) {
        setError('Please select a location');
        setLocationError(true);
        setLoading(false);
        return;
      }

      // Prepare locations array
      const locations = location ? [location] : [];

      // Set alert categories based on selection
      const alertTypes = alertCategory === 'All' ? [] : [alertCategory];

      // Prepare dates
      let effectiveStartDate = startDate;
      let effectiveEndDate = endDate;
      
      // If using "This Week" date range or not subscribed, calculate the dates
      if (dateRangeType === 'thisWeek' || !isSubscribed) {
        effectiveStartDate = new Date();
        effectiveEndDate = addDays(new Date(), 7);
      }

      const data = {
        title: `Disruption Forecast for ${location?.city || 'Selected Location'}`,
        description: `Custom forecast for ${format(effectiveStartDate || new Date(), 'dd MMM yyyy')} to ${format(effectiveEndDate || new Date(), 'dd MMM yyyy')}`,
        summaryType: 'forecast' as const, // Use type assertion
        startDate: effectiveStartDate ? effectiveStartDate.toISOString() : undefined,
        endDate: effectiveEndDate ? effectiveEndDate.toISOString() : undefined,
        locations,
        alertTypes,
        alertCategory: alertCategory === 'All' ? undefined : alertCategory, 
        includeDuplicates: false,
        generatePDF: true,
        autoSave: true, // Auto-save enabled
        impact: impact === 'All' ? undefined : impact,
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

  // const handleViewWeeklyForecast = () => {
  //   // Navigate to the weekly forecast generation page
  //   router.push('/alerts-summary/weekly');
  // };

  // const handleGenerateWeeklyForecast = async () => {
  //   try {
  //     setLoading(true);
  //     setError('');

  //     // Get the forecast with proper MainOperatingRegions
  //     const response = await getUpcomingForecasts(7);

  //     if (response.success) {
  //       // Check if we have alerts
  //       const hasAlerts = response.forecast?.alerts && response.forecast.alerts.length > 0;

  //       if (response.forecast?.pdfUrl) {
  //         // Download the PDF using the URL from the forecast
  //         await downloadPdf(
  //           response.forecast.pdfUrl,
  //           `Weekly_Forecast_${format(new Date(), 'yyyy-MM-dd')}.pdf`
  //         );
  //         setWeeklyReportDownloaded(true);
  //       } else if (!hasAlerts) {
  //         // Create a special "No alerts" PDF
  //         setNoAlertsFound(true);
  //         const noAlertsData = {
  //           title: "Weekly Disruption Forecast - No Alerts",
  //           description: `No disruptions found for ${format(new Date(), 'dd MMM yyyy')} to ${format(addDays(new Date(), 7), 'dd MMM yyyy')}`,
  //           summaryType: 'forecast' as const,
  //           startDate: new Date().toISOString(),
  //           endDate: addDays(new Date(), 7).toISOString(),
  //           generatePDF: true,
  //           autoSave: false,
  //           // Use the user regions from the response if available
  //           locations: response.forecast?.userRegions || []
  //         };

  //         // Generate the PDF with "no alerts" content
  //         const noAlertsResponse = await generateSummary(noAlertsData);

  //         if (noAlertsResponse.success && noAlertsResponse.summary.pdfUrl) {
  //           await downloadPdf(
  //             noAlertsResponse.summary.pdfUrl,
  //             `Weekly_Forecast_No_Alerts_${format(new Date(), 'yyyy-MM-dd')}.pdf`
  //           );
  //           setEmptyReportDownloaded(true);
  //         } else {
  //           // Only show an error if we can't even generate a "no alerts" PDF
  //           setError('No alerts found in your operating regions for the upcoming week. We\'ve prepared a blank report for you.');
  //         }
  //       } else {
  //         setError('Failed to generate the weekly forecast PDF. Please try again.');
  //         setForecastError(true);
  //       }
  //     } else {
  //       setError('Failed to retrieve weekly forecast data. Please try again.');
  //       setForecastError(true);
  //     }
  //   } catch (error) {
  //     console.error('Error generating weekly forecast:', error);
  //     setError('Failed to generate weekly forecast. Please try again.');
  //     setForecastError(true);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleSaveWeeklyForecast = async () => {
  //   try {
  //     setLoading(true);
  //     setError('');

  //     // Get the forecast with proper MainOperatingRegions
  //     setSavingWeeklyForecast(true);
  //     const forecastResponse = await getUpcomingForecasts(7);

  //     if (!forecastResponse.success) {
  //       setError('Failed to generate weekly forecast. Please try again.');
  //       setWeeklySaveError(true);
  //       setLoading(false);
  //       return;
  //     }

  //     // Check if we have alerts
  //     const hasAlerts = forecastResponse.forecast?.alerts && forecastResponse.forecast.alerts.length > 0;

  //     // Now save the forecast with the data we got, including MainOperatingRegions
  //     const data = {
  //       title: forecastResponse.forecast?.title || "Weekly Disruption Forecast",
  //       description: forecastResponse.forecast?.description ||
  //         (hasAlerts
  //           ? `Weekly forecast for ${format(new Date(), 'dd MMM yyyy')}`
  //           : `No disruptions found for the week of ${format(new Date(), 'dd MMM yyyy')}`),
  //       summaryType: 'forecast' as const,
  //       startDate: forecastResponse.forecast?.timeRange?.startDate || new Date().toISOString(),
  //       endDate: forecastResponse.forecast?.timeRange?.endDate || addDays(new Date(), 7).toISOString(),
  //       generatePDF: true,
  //       autoSave: true,
  //       locations: forecastResponse.forecast?.userRegions || [], // Use userRegions for locations
  //       alertCategory: forecastResponse.forecast?.alertCategory,
  //       impact: forecastResponse.forecast?.impact,
  //       includedAlerts: forecastResponse.forecast?.alerts || [] // Include the alerts from the forecast
  //     };

  //     // If we have no alerts, add a special flag to ensure proper handling
  //     if (!hasAlerts) {
  //       // Include metadata to indicate this is an empty report
  //       data.description = `No disruptions found for the week of ${format(new Date(), 'dd MMM yyyy')}`;
  //       data.title = "Weekly Disruption Forecast - No Alerts";
  //     }

  //     // Generate a summary and redirect to it
  //     const saveResponse = await generateSummary(data);

  //     if (saveResponse.success && saveResponse.summary.savedSummaryId) {
  //       // Navigate to the saved summary
  //       setWeeklySaveSuccess(true);
  //       router.push(`/alerts-summary/${saveResponse.summary.savedSummaryId}`);
  //     } else if (!hasAlerts && saveResponse.success) {
  //       // If no alerts but the save was "successful", still direct them to the saved page
  //       setWeeklySaveSuccess(true);
  //       router.push(`/alerts-summary/saved`);
  //     } else {
  //       setError('Failed to save weekly forecast. Please try again.');
  //       setWeeklySaveError(true);
  //     }
  //   } catch (error) {
  //     console.error('Error saving weekly forecast:', error);
  //     setError('Failed to save weekly forecast. Please try again.');
  //     setWeeklySaveError(true);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleShareWeeklyForecast = async () => {
  //   try {
  //     setLoading(true);
  //     setError('');

  //     // Get the weekly forecast URL for sharing
  //     setSharingWeeklyForecast(true);
  //     const url = `${window.location.origin}/alerts-summary/weekly-forecast`;

  //     // Try to use the Web Share API if available
  //     if (navigator.share) {
  //       await navigator.share({
  //         title: 'Weekly Disruption Forecast',
  //         text: 'Check out this weekly disruption forecast',
  //         url: url
  //       });
  //       setWeeklyShareSuccess(true);
  //     } else {
  //       // Fallback to copying the URL to clipboard
  //       await navigator.clipboard.writeText(url);
  //       setWeeklyShareSuccess(true);
  //     }
  //   } catch (error) {
  //     console.error('Error sharing weekly forecast:', error);
  //     setError('Failed to share weekly forecast. Please try again.');
  //     setWeeklyShareError(true);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    // Set default location to Edinburgh for non-subscribed users
    if (!isSubscribed && !location) {
      setLocation({
        city: "Edinburgh",
        country: "United Kingdom",
        latitude: 55.953251,
        longitude: -3.188267,
        placeId: "ChIJIyaYpQC4h0gRJxfnfHsU8mQ"
      });
    }
  }, [isSubscribed, location]);

  // Add this function to show toast for custom date selection
  const handleDateRangeChange = (event: unknown) => {
    const value = (event as SelectChangeEvent<string>).target.value as 'thisWeek' | 'custom';
    
    // If user tries to select custom but isn't subscribed, show toast
    if (value === 'custom' && !isSubscribed) {
      showToast('Please subscribe to unlock this filter', 'error');
      return; // Don't update the state
    }
    
    setDateRangeType(value);
  };

  // Add this function to handle location input click for non-subscribed users
  const handleLocationClick = () => {
    if (!isSubscribed) {
      showToast('Please subscribe to unlock this filter', 'error');
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
              Reports
            </Typography>
            <IconButton
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
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.03672 0.833008H7.96394C6.73772 0.832999 5.76833 0.832991 5.01004 0.931213C4.23174 1.03203 3.60067 1.24416 3.10113 1.72543C2.59899 2.20921 2.37528 2.82463 2.26942 3.58317C2.16697 4.31734 2.16698 5.25438 2.167 6.43263L2.16699 12.0302C2.16697 12.7619 2.16695 13.3699 2.23721 13.8267C2.30991 14.2993 2.47937 14.7594 2.94671 15.0089C3.3635 15.2315 3.82193 15.1862 4.21062 15.0682C4.60375 14.9489 5.00335 14.7323 5.36923 14.5011C5.73858 14.2677 6.10076 14.0016 6.41566 13.7689L6.45269 13.7415C6.76123 13.5134 7.00904 13.3302 7.19826 13.2163C7.46463 13.0559 7.63283 12.9553 7.76917 12.8911C7.895 12.8318 7.95613 12.8224 8.00033 12.8224C8.04453 12.8224 8.10565 12.8318 8.23149 12.8911C8.36783 12.9553 8.53602 13.0559 8.8024 13.2163C8.99161 13.3302 9.23943 13.5134 9.54797 13.7415L9.585 13.7689C9.8999 14.0016 10.2621 14.2677 10.6314 14.5011C10.9973 14.7323 11.3969 14.9489 11.79 15.0682C12.1787 15.1862 12.6372 15.2315 13.0539 15.0089C13.5213 14.7594 13.6907 14.2993 13.7634 13.8267C13.8337 13.3699 13.8337 12.7619 13.8337 12.0302V6.43264C13.8337 5.25439 13.8337 4.31734 13.7312 3.58317C13.6254 2.82463 13.4017 2.20921 12.8995 1.72543C12.4 1.24416 11.7689 1.03203 10.9906 0.931213C10.2323 0.832991 9.26294 0.832999 8.03672 0.833008ZM3.79495 2.44558C4.07647 2.17435 4.46446 2.01024 5.1385 1.92293C5.82507 1.834 6.72962 1.83301 8.00033 1.83301C9.27104 1.83301 10.1756 1.834 10.8622 1.92293C11.5362 2.01024 11.9242 2.17435 12.2057 2.44558C12.4846 2.71429 12.6514 3.08068 12.7408 3.72138C12.7602 3.8599 12.7755 4.00776 12.7876 4.16634H3.21307C3.22519 4.00776 3.2405 3.8599 3.25983 3.72138C3.34924 3.08068 3.51605 2.71429 3.79495 2.44558ZM3.17321 5.16634C3.16718 5.55058 3.167 5.98244 3.167 6.47136V11.9869C3.167 12.7731 3.16843 13.3031 3.22559 13.6746C3.28169 14.0394 3.36985 14.1012 3.41774 14.1268C3.49983 14.1706 3.6495 14.1935 3.92012 14.1113C4.18629 14.0305 4.49721 13.8692 4.83504 13.6557C5.16939 13.4444 5.50411 13.1991 5.82129 12.9647L5.88113 12.9204C6.16732 12.7088 6.45086 12.499 6.68241 12.3596L6.70198 12.3478C6.94296 12.2027 7.15498 12.075 7.343 11.9864C7.54659 11.8905 7.75773 11.8224 8.00033 11.8224C8.24292 11.8224 8.45407 11.8905 8.65766 11.9864C8.84568 12.075 9.0577 12.2027 9.29867 12.3478L9.31825 12.3596C9.54979 12.499 9.83332 12.7087 10.1195 12.9204L10.1794 12.9647C10.4965 13.1991 10.8313 13.4444 11.1656 13.6557C11.5034 13.8692 11.8144 14.0305 12.0805 14.1113C12.3512 14.1935 12.5008 14.1706 12.5829 14.1268C12.6308 14.1012 12.719 14.0394 12.7751 13.6746C12.8322 13.3031 12.8337 12.7731 12.8337 11.9869V6.43264C12.8337 5.25439 12.8337 4.31734 12.7312 3.58317C12.6254 2.82463 12.4017 2.20921 11.8995 1.72543C11.4 1.24416 10.7689 1.03203 9.99062 0.931213C9.23234 0.832991 8.26294 0.832999 7.03672 0.833008Z" fill="#616161" />
              </svg>

            </IconButton>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* {weeklyAlertCount === null && weeklyAlertCount !== 0 && weeklyAlertCount !== 1 ? (
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
          )} */}


          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Create custom disruption forecasts
          </Typography>

          {/* Form Fields in Clean Layout */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Alert Type */}
            <Box>
              <FormControl fullWidth>
                <InputLabel id="alert-type-label">Alert Category</InputLabel>
                <Select
                  labelId="alert-type-label"
                  id="alert-type"
                  value={alertCategory}
                  label="Alert Category"
                  onChange={(e) => setAlertCategory(e.target.value)}
                  disabled={isViewOnly()}
                  sx={{
                    borderRadius: 2
                  }}
                >
                  {ALERT_CATEGORIES.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {alertCategory && alertCategory !== 'All' && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Selected category: {alertCategory}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Location */}
            <Box>
              <FormControl fullWidth>
                {isLoaded ? (
                  <Box sx={{ position: 'relative' }}>
                    <Box onClick={handleLocationClick}>
                      <LocationSearchInput
                        setValue={setLocation}
                        value={location}
                        label="Location"
                        disabled={!isSubscribed}
                        hideIcon={!isSubscribed}
                      />
                    </Box>
                    {!isSubscribed && (
                      <Box sx={{ 
                        position: 'absolute', 
                        right: 14, 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M4.875 5.0625V6.39534C3.69924 6.75515 2.81193 7.78955 2.64339 9.04138C2.53227 9.86667 2.4375 10.7339 2.4375 11.625C2.4375 12.5161 2.53227 13.3833 2.64339 14.2086C2.84707 15.7214 4.10037 16.9166 5.64391 16.9876C6.71523 17.0368 7.80312 17.0625 9 17.0625C10.1969 17.0625 11.2848 17.0368 12.3561 16.9876C13.8996 16.9166 15.1529 15.7214 15.3566 14.2086C15.4677 13.3833 15.5625 12.5161 15.5625 11.625C15.5625 10.7339 15.4677 9.86667 15.3566 9.04138C15.1881 7.78955 14.3008 6.75515 13.125 6.39534V5.0625C13.125 2.78433 11.2782 0.9375 9 0.9375C6.72183 0.9375 4.875 2.78433 4.875 5.0625ZM9 2.4375C7.55025 2.4375 6.375 3.61275 6.375 5.0625V6.23262C7.2133 6.20286 8.07403 6.1875 9 6.1875C9.92597 6.1875 10.7867 6.20286 11.625 6.23262V5.0625C11.625 3.61275 10.4497 2.4375 9 2.4375ZM9.75 10.875C9.75 10.4608 9.41421 10.125 9 10.125C8.58579 10.125 8.25 10.4608 8.25 10.875V12.375C8.25 12.7892 8.58579 13.125 9 13.125C9.41421 13.125 9.75 12.7892 9.75 12.375V10.875Z" fill="#E7B119" />
                        </svg>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ position: 'relative' }}>
                    <Box onClick={handleLocationClick}>
                      <TextField
                        label="Location"
                        fullWidth
                        disabled={!isSubscribed}
                        placeholder={!isSubscribed ? "Edinburgh (Default)" : "Loading location search..."}
                        value={!isSubscribed ? "Edinburgh, United Kingdom" : ""}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                    </Box>
                    {!isSubscribed && (
                      <Box sx={{ 
                        position: 'absolute', 
                        right: 14, 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M4.875 5.0625V6.39534C3.69924 6.75515 2.81193 7.78955 2.64339 9.04138C2.53227 9.86667 2.4375 10.7339 2.4375 11.625C2.4375 12.5161 2.53227 13.3833 2.64339 14.2086C2.84707 15.7214 4.10037 16.9166 5.64391 16.9876C6.71523 17.0368 7.80312 17.0625 9 17.0625C10.1969 17.0625 11.2848 17.0368 12.3561 16.9876C13.8996 16.9166 15.1529 15.7214 15.3566 14.2086C15.4677 13.3833 15.5625 12.5161 15.5625 11.625C15.5625 10.7339 15.4677 9.86667 15.3566 9.04138C15.1881 7.78955 14.3008 6.75515 13.125 6.39534V5.0625C13.125 2.78433 11.2782 0.9375 9 0.9375C6.72183 0.9375 4.875 2.78433 4.875 5.0625ZM9 2.4375C7.55025 2.4375 6.375 3.61275 6.375 5.0625V6.23262C7.2133 6.20286 8.07403 6.1875 9 6.1875C9.92597 6.1875 10.7867 6.20286 11.625 6.23262V5.0625C11.625 3.61275 10.4497 2.4375 9 2.4375ZM9.75 10.875C9.75 10.4608 9.41421 10.125 9 10.125C8.58579 10.125 8.25 10.4608 8.25 10.875V12.375C8.25 12.7892 8.58579 13.125 9 13.125C9.41421 13.125 9.75 12.7892 9.75 12.375V10.875Z" fill="#E7B119" />
                        </svg>
                      </Box>
                    )}
                  </Box>
                )}
              </FormControl>
            </Box>

            {/* Date Range */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Date Range
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Select
                  value={dateRangeType}
                  onChange={handleDateRangeChange}
                  disabled={isViewOnly()}
                  sx={{
                    borderRadius: 2
                  }}
                >
                  <MenuItem value="thisWeek">This Week</MenuItem>
                  <MenuItem value="custom" disabled={!isSubscribed}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>Custom</span>
                      {!isSubscribed && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M4.875 5.0625V6.39534C3.69924 6.75515 2.81193 7.78955 2.64339 9.04138C2.53227 9.86667 2.4375 10.7339 2.4375 11.625C2.4375 12.5161 2.53227 13.3833 2.64339 14.2086C2.84707 15.7214 4.10037 16.9166 5.64391 16.9876C6.71523 17.0368 7.80312 17.0625 9 17.0625C10.1969 17.0625 11.2848 17.0368 12.3561 16.9876C13.8996 16.9166 15.1529 15.7214 15.3566 14.2086C15.4677 13.3833 15.5625 12.5161 15.5625 11.625C15.5625 10.7339 15.4677 9.86667 15.3566 9.04138C15.1881 7.78955 14.3008 6.75515 13.125 6.39534V5.0625C13.125 2.78433 11.2782 0.9375 9 0.9375C6.72183 0.9375 4.875 2.78433 4.875 5.0625ZM9 2.4375C7.55025 2.4375 6.375 3.61275 6.375 5.0625V6.23262C7.2133 6.20286 8.07403 6.1875 9 6.1875C9.92597 6.1875 10.7867 6.20286 11.625 6.23262V5.0625C11.625 3.61275 10.4497 2.4375 9 2.4375ZM9.75 10.875C9.75 10.4608 9.41421 10.125 9 10.125C8.58579 10.125 8.25 10.4608 8.25 10.875V12.375C8.25 12.7892 8.58579 13.125 9 13.125C9.41421 13.125 9.75 12.7892 9.75 12.375V10.875Z" fill="#E7B119" />
                        </svg>
                      )}
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              {(dateRangeType === 'custom' && isSubscribed) && (
                <FormControl fullWidth>
                  <Stack direction="row" spacing={2}>
                    <Box sx={{ width: '50%' }}>
                      <DatePicker
                        label="Start date"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ width: '50%' }}>
                      <DatePicker
                        label="End date"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }
                          }
                        }}
                      />
                    </Box>
                  </Stack>
                </FormControl>
              )}
            </Box>

            {/* Impact Level */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Impact Level
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
                    borderRadius: 2
                  }}
                >
                  {IMPACT_LEVELS.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Subscription Banner */}
            {!isSubscribed && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fff8e6',
                  border: '1px solid #fcd581',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  width: '100%',
                  boxSizing: 'border-box',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.875 5.0625V6.39534C3.69924 6.75515 2.81193 7.78955 2.64339 9.04138C2.53227 9.86667 2.4375 10.7339 2.4375 11.625C2.4375 12.5161 2.53227 13.3833 2.64339 14.2086C2.84707 15.7214 4.10037 16.9166 5.64391 16.9876C6.71523 17.0368 7.80312 17.0625 9 17.0625C10.1969 17.0625 11.2848 17.0368 12.3561 16.9876C13.8996 16.9166 15.1529 15.7214 15.3566 14.2086C15.4677 13.3833 15.5625 12.5161 15.5625 11.625C15.5625 10.7339 15.4677 9.86667 15.3566 9.04138C15.1881 7.78955 14.3008 6.75515 13.125 6.39534V5.0625C13.125 2.78433 11.2782 0.9375 9 0.9375C6.72183 0.9375 4.875 2.78433 4.875 5.0625ZM9 2.4375C7.55025 2.4375 6.375 3.61275 6.375 5.0625V6.23262C7.2133 6.20286 8.07403 6.1875 9 6.1875C9.92597 6.1875 10.7867 6.20286 11.625 6.23262V5.0625C11.625 3.61275 10.4497 2.4375 9 2.4375ZM9.75 10.875C9.75 10.4608 9.41421 10.125 9 10.125C8.58579 10.125 8.25 10.4608 8.25 10.875V12.375C8.25 12.7892 8.58579 13.125 9 13.125C9.41421 13.125 9.75 12.7892 9.75 12.375V10.875Z" fill="#E7B119" />
                  </svg>

                  <Typography variant="body2" color="text.primary">
                    Upgrade to our pro plan to get fully customized reports
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: '#f4a300',
                    color: 'white',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#e29800',
                    },
                  }}
                >
                  Start Free Trial
                </Button>
              </Box>
            )}

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
                  backgroundColor: '#000',
                  '&:hover': {
                    backgroundColor: '#333',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Forecast'}
              </Button>
            </Box>
          </Box>
        </Box>
      </LocalizationProvider>
    </Layout>
  );
}
