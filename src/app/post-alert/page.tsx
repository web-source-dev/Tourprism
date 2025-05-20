'use client';

import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Paper,
  IconButton, 
  CircularProgress, 
  Snackbar,
  Alert,
  Divider 
} from '@mui/material';
import Layout from '@/components/Layout';
import AlertSubmissionSuccess from '@/components/AlertSubmissionSuccess';
import { createAlert } from '@/services/api';
import { AlertFormData } from '@/types';
import Script from 'next/script';
import Image from 'next/image';

// Define more specific types for Google Maps API
interface GoogleMapsPlace {
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  formatted_address?: string;
  name?: string;
  address_components?: Array<{
    long_name: string;
    types: string[];
  }>;
}

// Declare global google type
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options: Record<string, unknown>) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => GoogleMapsPlace;
          };
        };
      };
    };
  }
}

export default function PostAlert() {
  const [formData, setFormData] = useState<AlertFormData>({
    incidentType: '',
    description: '',
    location: '',
    latitude: 0,
    longitude: 0,
    city: '',
    media: [],
  });
  
  const [otherType, setOtherType] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<{
    addListener: (event: string, callback: () => void) => void;
    getPlace: () => GoogleMapsPlace;
  } | null>(null);
  const googleMapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  const initializeAutocomplete = () => {
    if (!autocompleteInputRef.current || !window.google || !window.google.maps) return;
    
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      autocompleteInputRef.current,
      { 
        types: ['geocode', 'establishment'],
        fields: ['formatted_address', 'geometry', 'name', 'address_components']
      }
    );
    
    // Add listener for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (!place || !place.geometry) {
        // User entered the name of a Place that was not suggested
        setErrors({ 
          ...errors, 
          location: "Please select a location from the dropdown suggestions" 
        });
        return;
      }
      
      // Clear the location error if it exists
      if (errors.location) {
        const { ...newErrors } = errors;
        delete newErrors.location;
        setErrors(newErrors);
      }
      
      updateLocationData(place);
    });
  };
  
  const updateLocationData = (place: GoogleMapsPlace) => {
    let city = '';
    
    // Extract city from address components
    if (place.address_components) {
      for (const component of place.address_components) {
        if (component.types.includes('locality')) {
          city = component.long_name;
          break;
        } else if (component.types.includes('administrative_area_level_1')) {
          // Fallback to administrative area if no locality found
          city = component.long_name;
        }
      }
    }
    
    setFormData({
      ...formData,
      location: place.formatted_address || place.name || '',
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      city: city,
    });
  };

  
  const handleIncidentTypeSelect = (type: string) => {
    setErrors({ 
      ...errors, 
      incidentType: '' 
    });
    
    setFormData({
      ...formData,
      incidentType: type,
      otherType: type === 'Other' ? otherType : '',
    });
  };
  
  const handleMediaUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    const existingMedia = formData.media || [];
    
    const newMedia = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      file
    }));
    
    setFormData({
      ...formData,
      media: [...existingMedia, ...newMedia]
    });
    
    // Clear the input value so the same file can be selected again
    e.target.value = '';
  };
  
  const handleDeleteMedia = (index: number) => {
    const updatedMedia = [...(formData.media || [])];
    updatedMedia.splice(index, 1);
    
    setFormData({
      ...formData,
      media: updatedMedia
    });
  };
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.incidentType) {
      newErrors.incidentType = 'Please select an incident type';
    } else if (formData.incidentType === 'Other' && !otherType) {
      newErrors.otherType = 'Please specify the incident type';
    }
    
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Please provide a detailed description (at least 10 characters)';
    }
    
    if (!formData.location) {
      newErrors.location = 'Please select a location';
    }
    
    if (formData.latitude === 0 || formData.longitude === 0) {
      newErrors.location = 'Please select a valid location from the suggestions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create FormData for multipart request
      const apiFormData = new FormData();
      
      // Add text fields
      apiFormData.append('incidentType', formData.incidentType);
      
      if (formData.incidentType === 'Other' && otherType) {
        apiFormData.append('otherType', otherType);
      }
      
      apiFormData.append('description', formData.description);
      apiFormData.append('location', formData.location);
      apiFormData.append('latitude', formData.latitude.toString());
      apiFormData.append('longitude', formData.longitude.toString());
      apiFormData.append('city', formData.city);
      
      // Add media files
      if (formData.media && formData.media.length > 0) {
        formData.media.forEach((media) => {
          if (media.file) {
            apiFormData.append(`media`, media.file);
          }
        });
      }
      
      // Submit the alert
      await createAlert(apiFormData);
      
      setIsSuccess(true);
      // Reset form
      setFormData({
        incidentType: '',
        description: '',
        location: '',
        latitude: 0,
        longitude: 0,
        city: '',
        media: [],
      });
      setOtherType('');
      setErrors({});
      
    } catch (error) {
      console.error('Error submitting alert:', error);
      setSnackbarSeverity('error');
      setSnackbarMessage('Failed to submit the alert. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePostAnotherAlert = () => {
    setIsSuccess(false);
    // Reset form data
    setFormData({
      incidentType: '',
      description: '',
      location: '',
      latitude: 0,
      longitude: 0,
      city: '',
      media: [],
    });
    setOtherType('');
    setErrors({});
    
    // Focus on the incident type section
    window.scrollTo(0, 0);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // Array of incident types with icons
  const incidentTypes = [
    { value: 'Scam', icon: 'ri-spam-2-line' },
    { value: 'Theft', icon: 'ri-handbag-line' },
    { value: 'Assault', icon: 'ri-alarm-warning-line' },
    { value: 'Harassment', icon: 'ri-chat-delete-line' },
    { value: 'Public Disturbance', icon: 'ri-service-line' },
    { value: 'Transport Issue', icon: 'ri-train-line' },
    { value: 'Natural Disaster', icon: 'ri-earthquake-line' },
    { value: 'Road Closure', icon: 'ri-road-map-line' },
    { value: 'Other', icon: 'ri-more-line' }
  ];
  
  if (isSuccess) {
    return <AlertSubmissionSuccess onPostAnother={handlePostAnotherAlert} />;
  }
  
  return (
    <Layout>
      {/* Google Maps Script */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${googleMapApiKey}&libraries=places`}
        onLoad={() => initializeAutocomplete()}
      />
      
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Report a Safety Alert
          </Typography>
          
          <form onSubmit={handleSubmit}>
            {/* Incident Type Selection */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                Select the incident type
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {incidentTypes.map((type) => (
                  <Box key={type.value} sx={{ width: { xs: 'calc(33.33% - 16px)', sm: 'calc(25% - 16px)', md: 'calc(20% - 16px)' } }}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: formData.incidentType === type.value ? 'primary.main' : '#e0e0e0',
                        bgcolor: formData.incidentType === type.value ? 'primary.light' : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'rgba(0, 0, 0, 0.04)'
                        },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      onClick={() => handleIncidentTypeSelect(type.value)}
                    >
                      <i className={type.icon} style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                      <Typography variant="body2">{type.value}</Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
              
              {errors.incidentType && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {errors.incidentType}
                </Typography>
              )}
              
              {formData.incidentType === 'Other' && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Specify incident type"
                  value={otherType}
                  onChange={(e) => setOtherType(e.target.value)}
                  error={!!errors.otherType}
                  helperText={errors.otherType}
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Description */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                Description*
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Provide details about what happened, when, and any information that might help others stay safe..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Location */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                Location*
              </Typography>
              
              <TextField
                fullWidth
                placeholder="Enter the incident location"
                inputRef={autocompleteInputRef}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                error={!!errors.location}
                helperText={errors.location}
                InputProps={{
                  startAdornment: (
                    <i className="ri-map-pin-line" style={{ marginRight: 8 }}></i>
                  ),
                }}
              />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Media Upload */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                Add Media (Optional)
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  id="media-upload"
                  type="file"
                  onChange={handleMediaUpload}
                  multiple
                />
                <label htmlFor="media-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<i className="ri-image-add-line"></i>}
                    sx={{
                      borderColor: 'black',
                      color: 'black',
                      '&:hover': {
                        borderColor: '#333',
                        bgcolor: 'rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    Upload Photos/Videos
                  </Button>
                </label>
              </Box>
              
              {formData.media && formData.media.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                    Uploaded media ({formData.media.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {formData.media.map((media, index) => (
                      <Box key={index} sx={{ width: { xs: 'calc(33.33% - 16px)', sm: 'calc(25% - 16px)' } }}>
                        <Box
                          sx={{
                            position: 'relative',
                            pt: '100%', // 1:1 Aspect ratio
                            borderRadius: 2,
                            overflow: 'hidden',
                            mb: 1
                          }}
                        >
                          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                            <Image
                              src={media.url || (media.file ? URL.createObjectURL(media.file as File) : '')}
                              alt={`Upload ${index + 1}`}
                              fill
                              style={{
                                objectFit: 'cover'
                              }}
                            />
                          </Box>
                          <IconButton
                            onClick={() => handleDeleteMedia(index)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)'
                              },
                              p: 0.5
                            }}
                          >
                            <i className="ri-delete-bin-line" style={{ fontSize: '16px' }}></i>
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              fullWidth
              sx={{
                bgcolor: 'black',
                '&:hover': { bgcolor: '#333' },
                py: 1.5,
                borderRadius: 2
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Submit Alert'
              )}
            </Button>
          </form>
        </Paper>
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Layout>
  );
} 