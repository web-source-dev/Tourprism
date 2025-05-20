'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  Stack,
  SelectChangeEvent,
  Chip,
  Autocomplete,
  Card,
  CardContent,
  styled,
  alpha,
  useTheme,
} from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { createNewAlert } from '@/services/api';
import { Alert } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Script from 'next/script';

// Define the category-type mapping
const ALERT_TYPE_MAP: Record<string, string[]> = {
  "Industrial Action": ["Strike", "Work-to-Rule", "Labor Dispute", "Other"],
  "Extreme Weather": ["Storm", "Flooding", "Heatwave", "Wildfire", "Snow", "Other"],
  "Infrastructure Failures": ["Power Outage", "IT & System Failure", "Transport Service Suspension", "Road, Rail & Tram Closure", "Repairs or Delays", "Other"],
  "Public Safety Incidents": ["Protest", "Crime", "Terror Threats", "Travel Advisory", "Other"],
  "Festivals and Events": ["Citywide Festival", "Sporting Event", "Concerts and Stadium Events", "Parades and Ceremonies", "Other"]
};

// Define target audience options
const TARGET_AUDIENCE_OPTIONS = [
  "Hotels",
  "Tour Operators",
  "Travel Agencies",
  "DMOs",
  "Airlines",
  "Cruise Lines",
  "OTAs",
  "Event Managers",
  "Attractions",
  "Car Rentals",
  "Tour Guides",
  "Other"
];

// Styled components for improved UI
const StyledSection = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  overflow: 'visible',
}));

const SectionHeader = styled(CardContent)(({ theme }) => ({
  background: alpha(theme.palette.primary.main, 0.03),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(2.5, 3),
}));

const SectionContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.light,
    },
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.light,
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  fontWeight: 600,
}));

const LocationCard = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2.5),
  borderRadius: 12,
  backgroundColor: alpha(theme.palette.background.default, 0.8),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
  marginTop: theme.spacing(2),
}));

export default function CreateAlertPage() {
  const router = useRouter();
  const { isAdmin, isManager, isEditor } = useAuth();
  const theme = useTheme();

  // Google Maps autocomplete refs
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // State for alert types based on selected category
  const [availableAlertTypes, setAvailableAlertTypes] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<Partial<Alert>>({
    status: 'pending',
    originLatitude: undefined,
    originLongitude: undefined,
    originCity: '',
    impactLocations: [],
    title: '',
    description: '',
    alertCategory: '',
    alertType: '',
    risk: '',
    impact: 'Minor',
    priority: 'medium',
    targetAudience: [],
    recommendedAction: '',
    linkToSource: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const [customAudience, setCustomAudience] = useState('');
  const [showCustomAudienceInput, setShowCustomAudienceInput] = useState(false);

  // Permission check
  const canCreateAlert = isAdmin || isManager || isEditor;

  // Setup autocomplete for impact locations - wrap with useCallback before other hooks use it
  const setupImpactLocationAutocomplete = useCallback(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      const impactInput = document.getElementById('impact-location-input') as HTMLInputElement;
      if (impactInput) {
        const autocompleteOptions: google.maps.places.AutocompleteOptions = {
          fields: ['place_id', 'geometry', 'name', 'formatted_address', 'address_components'],
        };
        const autocomplete = new google.maps.places.Autocomplete(impactInput, autocompleteOptions);

        // Listen for place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            // Extract city and country
            let city = '';
            let country = '';

            place.address_components?.forEach(component => {
              if (component.types.includes('locality')) {
                city = component.long_name;
              } else if (component.types.includes('country')) {
                country = component.long_name;
              }
            });

            // Add to impact locations list
            const newImpactLocation = {
              placeId: place.place_id,
              latitude: place.geometry?.location.lat() || 0,
              longitude: place.geometry?.location.lng() || 0,
              city: city || place.name || '',
              country: country,
            };

            // Update form values
            setFormValues(prev => ({
              ...prev,
              impactLocations: [...(prev.impactLocations || []), newImpactLocation]
            }));

            // Clear the input
            if (impactInput) {
              impactInput.value = '';
            }
          }
        });
      }
    }
  }, []);  // Empty dependency array as this doesn't depend on any props or state

  // Initialize Google Maps autocomplete
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && canCreateAlert && googleLoaded) {
      // Origin location autocomplete
      const originInput = document.getElementById('origin-location-input') as HTMLInputElement;
      if (originInput) {
        const autocompleteOptions: google.maps.places.AutocompleteOptions = {
          fields: ['place_id', 'geometry', 'name', 'formatted_address', 'address_components'],
        };
        const autocomplete = new google.maps.places.Autocomplete(originInput, autocompleteOptions);

        // Listen for place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            // Extract city and country
            let city = '';
            let country = '';

            place.address_components?.forEach(component => {
              if (component.types.includes('locality')) {
                city = component.long_name;
              } else if (component.types.includes('country')) {
                country = component.long_name;
              }
            });

            setFormValues(prev => ({
              ...prev,
              originPlaceId: place.place_id,
              originLatitude: place.geometry?.location?.lat(),
              originLongitude: place.geometry?.location?.lng(),
              originCity: city || place.name,
              originCountry: country,
            }));
          }
        });
      }

      // Set up Impact location input
      setupImpactLocationAutocomplete();
    }
  }, [canCreateAlert, googleLoaded, setupImpactLocationAutocomplete]);

  // Redirect if not authorized
  useEffect(() => {
    if (!canCreateAlert) {
      // Redirect after showing message briefly
      const redirectTimer = setTimeout(() => {
        router.push('/admin/alerts');
      }, 2000);

      return () => clearTimeout(redirectTimer);
    }
  }, [canCreateAlert, router]);

  // Update alert types when category changes
  useEffect(() => {
    if (formValues.alertCategory) {
      setAvailableAlertTypes(ALERT_TYPE_MAP[formValues.alertCategory] || []);

      // Clear the alert type if it's not valid for the new category
      if (formValues.alertType && !ALERT_TYPE_MAP[formValues.alertCategory]?.includes(formValues.alertType)) {
        setFormValues(prev => ({ ...prev, alertType: '' }));
      }
    } else {
      setAvailableAlertTypes([]);
    }
  }, [formValues.alertCategory, formValues.alertType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  // Handle removing an impact location
  const handleRemoveImpactLocation = (indexToRemove: number) => {
    setFormValues(prev => ({
      ...prev,
      impactLocations: prev.impactLocations?.filter((_, index) => index !== indexToRemove)
    }));
  };

  // Add function to select all target audiences
  const handleSelectAllAudiences = () => {
    // Filter out "Other" from the selection as it requires custom input
    const allPredefinedOptions = TARGET_AUDIENCE_OPTIONS.filter(option => option !== "Other");
    
    // Get current audience selections
    const currentAudience = Array.isArray(formValues.targetAudience) ? formValues.targetAudience : [];
    
    // Keep custom entries (entries that aren't in TARGET_AUDIENCE_OPTIONS)
    const customEntries = currentAudience.filter(
      entry => !TARGET_AUDIENCE_OPTIONS.includes(entry)
    );
    
    // Combine custom entries with all predefined options, avoiding duplicates with Set
    const combinedAudience = [...new Set([...customEntries, ...allPredefinedOptions])];
    
    setFormValues(prev => ({ ...prev, targetAudience: combinedAudience }));
  };

  // Add function to handle custom audience input
  const handleAddCustomAudience = () => {
    if (customAudience.trim()) {
      setFormValues(prev => ({
        ...prev,
        targetAudience: [...(Array.isArray(prev.targetAudience) ? prev.targetAudience : []), customAudience.trim()]
      }));
      setCustomAudience('');
    }
  };

  // Check if "Other" is selected to show the custom input
  useEffect(() => {
    if (Array.isArray(formValues.targetAudience) && formValues.targetAudience.includes('Other')) {
      setShowCustomAudienceInput(true);
    } else {
      setShowCustomAudienceInput(false);
    }
  }, [formValues.targetAudience]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Double-check permissions
    if (!canCreateAlert) {
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: 'You do not have permission to create alerts',
          severity: 'error'
        });
      }, 2000);
      return;
    }

    // Ensure legacy fields are set for backward compatibility
    const submissionData = {
      ...formValues,
      // Copy origin fields to legacy fields for backward compatibility
      latitude: formValues.originLatitude,
      longitude: formValues.originLongitude,
      city: formValues.originCity
    };

    setSaving(true);

    try {
      await createNewAlert(submissionData);
      setSnackbar({
        open: true,
        message: 'Alert created successfully',
        severity: 'success'
      });

      // Wait a moment to show the success message before redirecting
      setTimeout(() => {
        window.location.href = '/admin/alerts';
      }, 1500);
    } catch (err) {
      console.error('Error creating alert:', err);
      setSnackbar({
        open: true,
        message: 'Failed to create alert',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Google Maps API load success
  const handleGoogleMapsLoaded = () => {
    setGoogleLoaded(true);
  };

  const handleCancel = () => {
    window.location.href = '/admin/alerts';
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <AdminLayout>
      {/* Load Google Maps API */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={handleGoogleMapsLoaded}
      />

      <Box
        sx={{
          mb: 4,
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Button
            variant="text"
            onClick={handleCancel}
            startIcon={<i className="ri-arrow-left-line" />}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            Create New Alert
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Create a new alert with all necessary details
        </Typography>
      </Box>

      {/* Only display form if authorized */}
      {canCreateAlert && (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1200, mx: 'auto' }}>
          {/* Basic Information */}
          <StyledSection>
            <SectionHeader>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <i className="ri-information-line" style={{ marginRight: '10px', fontSize: '1.2em' }}></i>
                Basic Information
              </Typography>
            </SectionHeader>
            <SectionContent>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <StyledTextField
                  name="title"
                  label="Title"
                  variant="outlined"
                  value={formValues.title || ''}
                  onChange={handleInputChange}
                  sx={{ flex: '1 1 48%', minWidth: '250px' }}
                  required
                  placeholder="Enter a descriptive title for the alert"
                />
                
                <StyledTextField
                  name="linkToSource"
                  label="Link to Source"
                  variant="outlined"
                  value={formValues.linkToSource || ''}
                  onChange={handleInputChange}
                  placeholder="Enter a URL linking to more information about this alert"
                  sx={{ flex: '1 1 48%', minWidth: '250px' }}
                />
                
                <StyledTextField
                  name="description"
                  label="Issue"
                  multiline
                  rows={4}
                  variant="outlined"
                  value={formValues.description || ''}
                  onChange={handleInputChange}
                  sx={{ flex: '1 1 48%', minWidth: '250px' }}
                  required
                  placeholder="Provide a detailed Issue of the alert"
                />
                
                <StyledTextField
                  name="recommendedAction"
                  label="Recommendation"
                  variant="outlined"
                  value={formValues.recommendedAction || ''}
                  onChange={handleInputChange}
                  placeholder="What actions should be taken in response to this alert?"
                  multiline
                  rows={4}
                  sx={{ flex: '1 1 48%', minWidth: '250px' }}
                />
              </Box>
            </SectionContent>
          </StyledSection>

          {/* Origin Location Information */}
          <StyledSection>
            <SectionHeader>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <i className="ri-map-pin-line" style={{ marginRight: '10px', fontSize: '1.2em' }}></i>
                Origin Location Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                The location where the alert event originates
              </Typography>
            </SectionHeader>
            <SectionContent>
              <StyledTextField
                id="origin-location-input"
                name="originLocation"
                label="Search for Origin Location"
                variant="outlined"
                fullWidth
                placeholder="Start typing to search for a location..."
                inputProps={{
                  autoComplete: "new-password", // disable browser autocomplete
                }}
                required
                sx={{ mb: 2 }}
              />

              {formValues.originCity && (
                <LocationCard>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: theme.palette.primary.main }}>
                    Selected Origin Location:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <StyledTextField
                      name="originCity"
                      label="City"
                      variant="outlined"
                      value={formValues.originCity || ''}
                      onChange={handleInputChange}
                      sx={{ flex: '1 1 30%', minWidth: '200px' }}
                      InputProps={{
                        readOnly: true,
                      }}
                    />

                    <StyledTextField
                      name="originCountry"
                      label="Country"
                      variant="outlined"
                      value={formValues.originCountry || ''}
                      onChange={handleInputChange}
                      sx={{ flex: '1 1 30%', minWidth: '200px' }}
                      InputProps={{
                        readOnly: true,
                      }}
                    />

                    <StyledTextField
                      name="originLatitude"
                      label="Latitude"
                      variant="outlined"
                      type="number"
                      inputProps={{ step: 'any', readOnly: true }}
                      value={formValues.originLatitude || ''}
                      onChange={handleInputChange}
                      sx={{ flex: '1 1 30%', minWidth: '150px' }}
                    />

                    <StyledTextField
                      name="originLongitude"
                      label="Longitude"
                      variant="outlined"
                      type="number"
                      inputProps={{ step: 'any', readOnly: true }}
                      value={formValues.originLongitude || ''}
                      onChange={handleInputChange}
                      sx={{ flex: '1 1 30%', minWidth: '150px' }}
                    />
                  </Box>
                </LocationCard>
              )}
            </SectionContent>
          </StyledSection>

          {/* Impact Locations Information */}
          <StyledSection>
            <SectionHeader>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <i className="ri-earth-line" style={{ marginRight: '10px', fontSize: '1.2em' }}></i>
                Impact Locations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                The locations affected by this alert. You can add multiple locations.
              </Typography>
            </SectionHeader>
            <SectionContent>
              <StyledTextField
                id="impact-location-input"
                name="impactLocation"
                label="Search for Impact Location"
                variant="outlined"
                fullWidth
                placeholder="Start typing to search for a location..."
                inputProps={{
                  autoComplete: "new-password", // disable browser autocomplete
                }}
                sx={{ mb: 2 }}
              />

              {formValues.impactLocations && formValues.impactLocations.length > 0 && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: theme.palette.primary.main }}>
                    Selected Impact Locations:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formValues.impactLocations.map((location, index) => (
                      <Chip
                        key={index}
                        label={location.city || 'Unknown Location'}
                        onDelete={() => handleRemoveImpactLocation(index)}
                        sx={{
                          borderRadius: '16px',
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          color: theme.palette.primary.main,
                          fontWeight: 500,
                          padding: '4px 8px',
                          '& .MuiChip-label': {
                            padding: '0 8px',
                          },
                          '& .MuiChip-deleteIcon': {
                            color: theme.palette.primary.main,
                            '&:hover': {
                              color: theme.palette.error.main,
                            }
                          }
                        }}
                        deleteIcon={<i className="ri-close-line" />}
                      />
                    ))}
                  </Box>

                  {/* Hidden info panel that shows details when expanded */}
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <Button
                      size="small"
                      startIcon={<i className="ri-information-line" />}
                      onClick={() => {
                        setSnackbar({
                          open: true,
                          message: `${formValues.impactLocations?.length || 0} impact location(s) added`,
                          severity: 'info'
                        });
                      }}
                      sx={{
                        textTransform: 'none',
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: theme.palette.primary.main
                        }
                      }}
                    >
                      {formValues.impactLocations?.length || 0} location{formValues.impactLocations?.length !== 1 ? 's' : ''} added
                    </Button>
                  </Box>
                </Box>
              )}
            </SectionContent>
          </StyledSection>

          {/* Time Information */}
          <StyledSection>
            <SectionHeader>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <i className="ri-time-line" style={{ marginRight: '10px', fontSize: '1.2em' }}></i>
                Time Information
              </Typography>
            </SectionHeader>
            <SectionContent>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <StyledTextField
                  name="expectedStart"
                  label="Expected Start"
                  variant="outlined"
                  type="datetime-local"
                  value={formValues.expectedStart ? new Date(formValues.expectedStart as string).toISOString().substring(0, 16) : ''}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 45%', minWidth: '250px' }}
                  helperText="When is this alert expected to start?"
                />

                <StyledTextField
                  name="expectedEnd"
                  label="Expected End"
                  variant="outlined"
                  type="datetime-local"
                  value={formValues.expectedEnd ? new Date(formValues.expectedEnd as string).toISOString().substring(0, 16) : ''}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 45%', minWidth: '250px' }}
                  helperText="When is this alert expected to end?"
                />
              </Box>
            </SectionContent>
          </StyledSection>

          {/* Alert Classification */}
          <StyledSection>
            <SectionHeader>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <i className="ri-alert-line" style={{ marginRight: '10px', fontSize: '1.2em' }}></i>
                Alert Classification
              </Typography>
            </SectionHeader>
            <SectionContent>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <StyledFormControl sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                  <InputLabel id="alert-category-label">Alert Category</InputLabel>
                  <Select
                    labelId="alert-category-label"
                    id="alertCategory"
                    name="alertCategory"
                    value={formValues.alertCategory || ''}
                    label="Alert Category"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="Industrial Action">Industrial Action</MenuItem>
                    <MenuItem value="Extreme Weather">Extreme Weather</MenuItem>
                    <MenuItem value="Infrastructure Failures">Infrastructure Failures</MenuItem>
                    <MenuItem value="Public Safety Incidents">Public Safety Incidents</MenuItem>
                    <MenuItem value="Festivals and Events">Festivals and Events</MenuItem>
                  </Select>
                </StyledFormControl>

                <StyledFormControl sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                  <InputLabel id="alert-type-label">Alert Type</InputLabel>
                  <Select
                    labelId="alert-type-label"
                    id="alertType"
                    name="alertType"
                    value={formValues.alertType || ''}
                    label="Alert Type"
                    onChange={handleSelectChange}
                    disabled={availableAlertTypes.length === 0}
                  >
                    {availableAlertTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </StyledFormControl>

                <StyledFormControl sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                  <InputLabel id="risk-label">Risk Level</InputLabel>
                  <Select
                    labelId="risk-label"
                    id="risk"
                    name="risk"
                    value={formValues.risk || ''}
                    label="Risk Level"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </StyledFormControl>

                <StyledFormControl sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                  <InputLabel id="impact-label">Impact Severity</InputLabel>
                  <Select
                    labelId="impact-label"
                    id="impact"
                    name="impact"
                    value={formValues.impact || ''}
                    label="Impact Severity"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="Minor">Low</MenuItem>
                    <MenuItem value="Moderate">Moderate</MenuItem>
                    <MenuItem value="Severe">High</MenuItem>
                  </Select>
                </StyledFormControl>

                <StyledFormControl sx={{ flex: '0%', display: 'none', minWidth: '200px' }}>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    id="priority"
                    name="priority"
                    value={formValues.priority || ''}
                    label="Priority"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </StyledFormControl>
              </Box>
            </SectionContent>
          </StyledSection>

          {/* Additional Information */}
          <StyledSection>
            <SectionHeader>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <i className="ri-question-answer-line" style={{ marginRight: '10px', fontSize: '1.2em' }}></i>
                Additional Information
              </Typography>
            </SectionHeader>
            <SectionContent>
              <Box sx={{ display: 'flex', gap: 3 }}>

                <StyledFormControl sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleSelectAllAudiences}
                      startIcon={<i className="ri-checkbox-multiple-line" />}
                      sx={{ 
                        mr: 1, 
                        textTransform: 'none',
                        borderRadius: '8px',
                      }}
                    >
                      Select All
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      (quickly select all predefined audiences)
                    </Typography>
                  </Box>

                  <Autocomplete
                    multiple
                    id="targetAudience"
                    options={TARGET_AUDIENCE_OPTIONS.filter(option =>
                      !formValues.targetAudience?.includes(option)
                    )}
                    value={[]} // Always empty as we handle selection outside
                    onChange={(event, newValue) => {
                      if (newValue.length > 0) {
                        const lastSelected = newValue[newValue.length - 1];
                        setFormValues(prev => ({
                          ...prev,
                          targetAudience: [...(Array.isArray(prev.targetAudience) ? prev.targetAudience : []), lastSelected]
                        }));
                      }
                    }}
                    renderInput={(params) => (
                      <StyledTextField
                        {...params}
                        variant="outlined"
                        label="Select target audiences"
                        placeholder="Select target audiences"
                      />
                    )}
                  />

                  {/* Custom audience input field when "Other" is selected */}
                  {showCustomAudienceInput && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <StyledTextField
                        fullWidth
                        label="Custom audience"
                        value={customAudience}
                        onChange={(e) => setCustomAudience(e.target.value)}
                        placeholder="Enter custom target audience"
                        size="small"
                        variant="outlined"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomAudience();
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleAddCustomAudience}
                        disabled={!customAudience.trim()}
                        sx={{ 
                          minWidth: '36px', 
                          height: '40px',
                          borderRadius: '8px'
                        }}
                      >
                        <i className="ri-add-line" />
                      </Button>
                    </Box>
                  )}

                  {Array.isArray(formValues.targetAudience) && formValues.targetAudience.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                      {formValues.targetAudience.map((option, index) => (
                        <Chip
                          label={option}
                          key={index}
                          onDelete={() => {
                            const newValue = [...formValues.targetAudience as string[]];
                            newValue.splice(index, 1);
                            setFormValues(prev => ({ ...prev, targetAudience: newValue }));
                          }}
                          sx={{
                            borderRadius: '16px',
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                            '& .MuiChip-deleteIcon': {
                              color: theme.palette.primary.main,
                              '&:hover': {
                                color: theme.palette.error.main,
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </StyledFormControl>
                <StyledFormControl sx={{ width: '100%' }} required>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    name="status"
                    value={formValues.status || 'pending'}
                    label="Status"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </StyledFormControl>
              </Box>
            </SectionContent>
          </StyledSection>

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, mb: 6 }}>
            <StyledButton
              variant="outlined"
              onClick={handleCancel}
              disabled={saving}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </StyledButton>
            <StyledButton
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <i className="ri-save-line" />}
              sx={{ minWidth: 150 }}
            >
              {saving ? 'Creating...' : 'Create Alert'}
            </StyledButton>
          </Box>
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </AdminLayout>
  );
} 