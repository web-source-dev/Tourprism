'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Paper,
  Autocomplete,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import { User } from '@/types';
import { updateCompanyInfo, getCompanySuggestions } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

// Google Maps Places API Script
import { useLoadScript } from '@react-google-maps/api';
import { Libraries } from '@react-google-maps/api/dist/utils/make-load-script-url';

// Predefined company types
const COMPANY_TYPES = [
  "Travel Agency",
  "Tour Operator",
  "Hotel/Accommodation",
  "Transportation",
  "Restaurant/Food Service",
  "Entertainment Venue",
  "Tourism Board",
  "Educational Institution",
  "Technology Provider",
  "Media/Publishing",
  "Consulting",
  "Financial Services",
  "Healthcare",
  "Non-profit Organization",
];

interface CompanyInfoTabProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export default function CompanyInfoTab({ user, onUpdate }: CompanyInfoTabProps) {
  // Get auth context for collaborator status
  const { isCollaborator, collaboratorRole } = useAuth();
  const isViewOnly = isCollaborator && collaboratorRole === 'viewer';
  
  // Form state
  const [companyName, setCompanyName] = useState(user.company?.name || '');
  
  // Change from string to array for multiple types
  const [companyTypes, setCompanyTypes] = useState<string[]>(
    user.company?.type ? user.company.type.split(', ').filter(Boolean) : []
  );
  
  // Update operatingRegions to hold objects with coordinates
  const [operatingRegions, setOperatingRegions] = useState<Array<{
    name: string;
    latitude: number | null;
    longitude: number | null;
    placeId: string | null;
  }>>(
    // Convert from legacy format if needed
    Array.isArray(user.company?.MainOperatingRegions) 
      ? user.company.MainOperatingRegions.map(region => {
          // Check if the region is already in the new format
          if (typeof region === 'object' && region !== null) {
            return {
              name: region.name || '',
              latitude: region.latitude || null,
              longitude: region.longitude || null,
              placeId: region.placeId || null
            };
          }
          // Otherwise convert from string (legacy format)
          return {
            name: String(region),
            latitude: null,
            longitude: null,
            placeId: null
          };
        })
      : []
  );
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [regionSearch, setRegionSearch] = useState('');
  const [regionSuggestions, setRegionSuggestions] = useState<string[]>([]);
  
  // Company name suggestions
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  
  // Google Maps Places API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'] as Libraries,
  });
  
  // Initialize Google Places Autocomplete service
  const [placesService, setPlacesService] = useState<google.maps.places.AutocompleteService | null>(null);
  // Add Places service for geocoding
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  // Update form fields when user prop changes
  useEffect(() => {
    setCompanyName(user.company?.name || '');
    setCompanyTypes(user.company?.type ? user.company.type.split(', ').filter(Boolean) : []);
    
    // Handle updated operating regions format
    if (Array.isArray(user.company?.MainOperatingRegions)) {
      setOperatingRegions(
        user.company.MainOperatingRegions.map(region => {
          if (typeof region === 'object' && region !== null) {
            return {
              name: region.name || '',
              latitude: region.latitude || null,
              longitude: region.longitude || null,
              placeId: region.placeId || null
            };
          }
          return {
            name: String(region),
            latitude: null, 
            longitude: null,
            placeId: null
          };
        })
      );
    } else {
      setOperatingRegions([]);
    }
  }, [user]);
  
  useEffect(() => {
    // Initialize Places service when the API is loaded
    if (isLoaded && !placesService) {
      try {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('Initializing Google Places service');
          const autocompleteService = new window.google.maps.places.AutocompleteService();
          setPlacesService(autocompleteService);
          
          // Initialize geocoder
          const geocoderService = new window.google.maps.Geocoder();
          setGeocoder(geocoderService);
        } else {
          console.error('Google Maps Places API not available');
        }
      } catch (error) {
        console.error('Failed to initialize Google Places service:', error);
      }
    }
  }, [isLoaded, placesService]);

  // Log any Google Maps loading errors
  useEffect(() => {
    if (loadError) {
      console.error('Error loading Google Maps API:', loadError);
    }
  }, [loadError]);
  
  // Fetch company name suggestions
  const fetchCompanySuggestions = async (query: string) => {
    if (query.length > 1) {
      try {
        const suggestions = await getCompanySuggestions(query);
        setNameSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching company suggestions:', error);
      }
    } else {
      setNameSuggestions([]);
    }
  };
  useEffect(() => {
    if (regionSearch && regionSearch.length > 1 && placesService) {
      const delayDebounce = setTimeout(() => {
        try {
          placesService.getPlacePredictions(
            {
              input: regionSearch,
              types: ['(regions)'],
            },
            (predictions, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                console.log('Google Places predictions:', predictions);
                setRegionSuggestions(
                  predictions.map((prediction) => prediction.description)
                );
              } else {
                console.warn('Google Places API returned status:', status);
                setRegionSuggestions([]);
              }
            }
          );
        } catch (error) {
          console.error('Error getting place predictions:', error);
          setRegionSuggestions([]);
        }
      }, 300);
      
      return () => clearTimeout(delayDebounce);
    } else {
      setRegionSuggestions([]);
    }
  }, [regionSearch, placesService]);
  
  // Add a helper function to geocode a region name to coordinates
  const geocodeRegion = async (regionName: string): Promise<{
    latitude: number | null;
    longitude: number | null;
    placeId: string | null;
  }> => {
    if (!geocoder || !regionName.trim()) {
      return { latitude: null, longitude: null, placeId: null };
    }

    try {
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: regionName }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      if (result && result.length > 0) {
        const location = result[0].geometry.location;
        return {
          latitude: location.lat(),
          longitude: location.lng(),
          placeId: result[0].place_id || null
        };
      }
    } catch (error) {
      console.error('Error geocoding region:', error);
    }

    return { latitude: null, longitude: null, placeId: null };
  };

  // Update handleAddRegion to get coordinates for the region
  const handleAddRegion = async () => {
    if (isViewOnly) return;
    if (regionSearch && !operatingRegions.some(region => region.name === regionSearch)) {
      // Start with just the name
      const newRegion: {
        name: string;
        latitude: number | null;
        longitude: number | null;
        placeId: string | null;
      } = {
        name: regionSearch,
        latitude: null,
        longitude: null,
        placeId: null
      };

      // Try to get coordinates
      if (geocoder) {
        try {
          setIsSubmitting(true); // Show loading state while geocoding
          const coordinates = await geocodeRegion(regionSearch);
          newRegion.latitude = coordinates.latitude;
          newRegion.longitude = coordinates.longitude;
          newRegion.placeId = coordinates.placeId;
          
          console.log(`Found coordinates for ${regionSearch}:`, coordinates);
        } catch (error) {
          console.error('Failed to geocode region:', error);
        } finally {
          setIsSubmitting(false);
        }
      }

      setOperatingRegions([...operatingRegions, newRegion]);
      setRegionSearch('');
    }
  };

  // Update submission function to handle the new format
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Prevent viewers from submitting
    if (isViewOnly) return;
    
    // Validate form
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Log current state before submitting
      console.log('Current company name before submit:', companyName);
      console.log('Operating regions before submit:', operatingRegions);
      
      const updateData = {
        companyName: companyName.trim(),
        companyType: companyTypes.join(', '),
        // Send the full region objects with coordinates
        mainOperatingRegions: operatingRegions
      };
      
      console.log('Updating company info with data:', updateData);
      
      const updatedUser = await updateCompanyInfo(updateData);
      console.log('Updated user from server:', updatedUser);
      console.log('Updated company name from server:', updatedUser.company?.name);
      
      if (updatedUser.company?.name !== undefined) {
        setCompanyName(updatedUser.company.name);
      }
      
      onUpdate(updatedUser);
      setSuccess('Company information updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update company information');
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle removing a company type
  const handleRemoveType = (typeToRemove: string) => {
    if (isViewOnly) return;
    setCompanyTypes(companyTypes.filter(type => type !== typeToRemove));
  };
  
  // Remove a region from the selected regions
  const handleDeleteRegion = (regionName: string) => {
    if (isViewOnly) return;
    setOperatingRegions(operatingRegions.filter((region) => region.name !== regionName));
  };
  
  // Add a function to check if a region has valid coordinates
  const hasValidCoordinates = (region: {
    latitude: number | null;
    longitude: number | null;
    placeId?: string | null;
  }) => {
    return typeof region.latitude === 'number' && 
           typeof region.longitude === 'number' && 
           region.latitude !== null && 
           region.longitude !== null;
  };

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Box component="form" noValidate>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Company Information
          </Typography>
          
          {isCollaborator && (
            <Chip 
              icon={<InfoIcon />} 
              label={isViewOnly ? "View Only Access" : "Manager Access"} 
              color={isViewOnly ? "default" : "primary"} 
              variant="outlined" 
              size="small"
            />
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {isViewOnly && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have view-only access to this company information. Contact the account owner for edit permissions.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Stack spacing={3} sx={{ mb: 4 }}>
          {/* Company Name with Autocomplete */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Company Name<span style={{ color: 'red' }}>*</span>
            </Typography>
            <Autocomplete
              freeSolo
              value={companyName}
              options={nameSuggestions}
              onInputChange={(event, newInputValue) => {
                if (isViewOnly) return;
                // Update company name directly as user types
                setCompanyName(newInputValue);
                // Also fetch suggestions
                fetchCompanySuggestions(newInputValue);
              }}
              onChange={(event, newValue) => {
                if (isViewOnly) return;
                // This handles selection from dropdown
                if (newValue) {
                  setCompanyName(newValue);
                }
              }}
              blurOnSelect
              selectOnFocus
              clearOnBlur={false}
              disabled={isViewOnly}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Company Name"
                  required
                  fullWidth
                  disabled={isSubmitting || isViewOnly}
                  helperText="Start typing to get suggestions from existing companies"
                  InputProps={{
                    ...params.InputProps,
                    readOnly: isViewOnly,
                  }}
                />
              )}
            />
            {/* Debug display - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Current value: {companyName || '(empty)'}
              </Typography>
            )}
          </Box>
          
          {/* Company Types Selection - Multiple Types */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Company Types
            </Typography>
            
            <Autocomplete
              multiple
              fullWidth
              freeSolo
              options={COMPANY_TYPES.filter(type => !companyTypes.includes(type))}
              value={companyTypes}
              onChange={(event, newValue) => {
                if (isViewOnly) return;
                setCompanyTypes(newValue);
              }}
              renderTags={() => null}
              disabled={isViewOnly}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Company Types"
                  placeholder={companyTypes.length > 0 ? "Add more types" : "Select or type company types"}
                  disabled={isSubmitting || isViewOnly}
                  helperText="Select from list or type a custom type and press Enter"
                  InputProps={{
                    ...params.InputProps,
                    readOnly: isViewOnly,
                  }}
                />
              )}
            />
            
            {/* Display selected company types as chips outside the input */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {companyTypes.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onDelete={isViewOnly ? undefined : () => handleRemoveType(type)}
                  color="primary"
                  variant="outlined"
                />
              ))}
              {companyTypes.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No company types selected
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Operating Regions */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Main Operating Regions
            </Typography>
            
            <TextField
              fullWidth
              label="Add Operating Region"
              placeholder="Start typing a city, state, or country"
              value={regionSearch}
              onChange={(e) => isViewOnly ? null : setRegionSearch(e.target.value)}
              disabled={isSubmitting || isViewOnly || (!isLoaded || !!loadError)}
              helperText={
                loadError 
                  ? "Google Places API could not be loaded. Please check your connection." 
                  : !isLoaded 
                    ? "Loading Google Places..." 
                    : "Type to search for locations"
              }
              InputProps={{
                readOnly: isViewOnly,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      edge="end" 
                      onClick={handleAddRegion}
                      disabled={!regionSearch || isSubmitting || isViewOnly}
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Region Suggestions */}
            {!isViewOnly && regionSearch && regionSuggestions.length > 0 && (
              <Paper elevation={3} sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                <Stack>
                  {regionSuggestions.map((suggestion) => (
                    <Box
                      key={suggestion}
                      sx={{
                        p: 1.5,
                        '&:hover': { backgroundColor: 'action.hover', cursor: 'pointer' },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                      onClick={() => {
                        if (isViewOnly) return;
                        if (suggestion && !operatingRegions.some(region => region.name === suggestion)) {
                          // Handle adding with geocoding in handleAddRegion function
                          setRegionSearch(suggestion);
                          handleAddRegion();
                        }
                      }}
                    >
                      <Typography variant="body2">
                        <SearchIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        {suggestion}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
            
            {/* Message when no suggestions found */}
            {!isViewOnly && regionSearch && regionSearch.length > 1 && regionSuggestions.length === 0 && !loadError && isLoaded && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No locations found. You can still add this location manually by clicking the + button.
              </Typography>
            )}
            
            {/* Selected Regions with coordinate indicator */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {operatingRegions.map((region) => (
                <Chip
                  key={region.name}
                  label={region.name}
                  onDelete={isViewOnly ? undefined : () => handleDeleteRegion(region.name)}
                  color={hasValidCoordinates(region) ? "success" : "primary"}
                  variant="outlined"
                  icon={hasValidCoordinates(region) ? <InfoIcon fontSize="small" /> : undefined}
                  title={hasValidCoordinates(region) 
                    ? `Coordinates: ${region.latitude}, ${region.longitude}` 
                    : "No coordinates available"}
                />
              ))}
              {operatingRegions.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No operating regions selected
                </Typography>
              )}
            </Box>
            
            {/* Coordinates indicator legend */}
            {operatingRegions.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  <InfoIcon fontSize="small" sx={{ color: 'success.main', verticalAlign: 'middle', mr: 0.5 }} />
                  Regions with coordinates will show alerts in your feed
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
        
        {!isViewOnly && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes '}
          </Button>
        )}
      </Box>
    </Paper>
  );
} 