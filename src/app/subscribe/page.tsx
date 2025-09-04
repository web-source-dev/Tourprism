'use client';

import Layout from '@/components/Layout';
import { Container, Typography, Box, TextField, Button, MenuItem, CircularProgress, FormControl, Select, ListItemIcon, Chip } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import { createSubscriber, checkSubscriberStatus } from '@/services/subscriber';
import { useToast } from '@/ui/toast';
import Link from 'next/link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import Script from 'next/script';

interface LocationType {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

const sectorOptions: string[] = [
  "Airline",
  "Attraction",
  "Car Rental",
  "Cruise Line",
  "DMO",
  "Event Manager",
  "Hotel",
  "OTA",
  "Tour Guide",
  "Tour Operator",
  "Travel Agency",
  "Travel Media",
  "Other"
];

// Predefined locations
const locationOptions: LocationType[] = [
  {
    city: "Edinburgh",
    country: "United Kingdom",
    latitude: 55.953251,
    longitude: -3.188267,
    placeId: "ChIJIyaYpQC4h0gRJxfnfHsU8mQ"
  },
  {
    city: "Glasgow",
    country: "United Kingdom",
    latitude: 55.860916,
    longitude: -4.251433,
    placeId: "ChIJ685WIFYViEgRHlHvBbiD5nE"
  },
  {
    city: "Stirling",
    country: "United Kingdom",
    latitude: 56.116859,
    longitude: -3.936900,
    placeId: "ChIJA8sABMRVjEgRYZ1QTnm1rq8"
  },
  {
    city: "Manchester",
    country: "United Kingdom",
    latitude: 53.480759,
    longitude: -2.242631,
    placeId: "ChIJ2_UmUkxNekgRqmv-BDgUvtk"
  },
  {
    city: "London",
    country: "United Kingdom",
    latitude: 51.507351,
    longitude: -0.127758,
    placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI"
  }
];

// Common styles for all inputs
const inputStyles = {
  borderRadius: 2,
  height: '45px',
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
};

// Menu props for dropdowns
const menuProps = {
  PaperProps: {
    style: {
      maxHeight: 48 * 5, // 5 items
      width: 'auto',
    },
  },
};

export default function SubscriptionPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<LocationType[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showSectorInput, setShowSectorInput] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [customSector, setCustomSector] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [subscriptionCompleted, setSubscriptionCompleted] = useState(false);
  
  // Validation error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [sectorError, setSectorError] = useState('');
  
  // Validation success states
  const [nameValid, setNameValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  
  // User account check state
  const [hasAccount, setHasAccount] = useState(false);
  
  // Track if this is a new subscription
  const [isNewSubscription, setIsNewSubscription] = useState(false);
  
  const { showToast } = useToast();
  
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const googleMapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if user has an account
  const checkUserAccount = async (email: string) => {
    if (!email || !isValidEmail(email)) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tourprism-api.onrender.com'}/auth/check-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasAccount(data.exists);
        console.log('Account check result:', data.exists, 'for email:', email);
      } else {
        setHasAccount(false);
      }
    } catch (error) {
      console.error('Error checking user account:', error);
      setHasAccount(false);
    }
  };

  const initializeAutocomplete = () => {
    if (!locationInputRef.current || !window.google || !window.google.maps) return;
    
    autocompleteRef.current = new google.maps.places.Autocomplete(
      locationInputRef.current,
      { 
        types: ['geocode', 'establishment'],
        fields: ['formatted_address', 'geometry', 'name', 'address_components', 'place_id']
      }
    );
    
    // Add listener for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (!place || !place.geometry) {
        showToast("Please select a location from the dropdown suggestions", "error");
        return;
      }
      
      updateLocationData(place);
    });
  };

  const updateLocationData = (place: google.maps.places.PlaceResult) => {
    let city = '';
    let country = '';
    
    // Extract city and country from address components
    if (place.address_components) {
      for (const component of place.address_components) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
      }
    }
    
    const newLocation: LocationType = {
      city: city || place.name || place.formatted_address || '',
      country: country || '',
      latitude: place.geometry?.location?.lat() || 0,
      longitude: place.geometry?.location?.lng() || 0,
      placeId: place.place_id || '',
    };
    
    // Add to selected locations if not already present
    if (!selectedLocations.some(loc => loc.city === newLocation.city)) {
      setSelectedLocations(prev => [...prev, newLocation]);
    }
    setCustomLocation('');
    setShowLocationInput(false);
  };

  useEffect(() => {
    if (googleLoaded && showLocationInput && locationInputRef.current) {
      initializeAutocomplete();
    }
  }, [googleLoaded, showLocationInput]);

  // Check subscription status when email changes
  useEffect(() => {
    const checkSubscription = async () => {
      if (email && email.includes('@')) {
        setCheckingSubscription(true);
        try {
          const status = await checkSubscriberStatus(email);
          console.log('Subscription status:', status, 'for email:', email);
          
          // Only set as already subscribed if both exists AND isActive are true
          const alreadySubscribed = status.exists && status.isActive;
          console.log('Setting isAlreadySubscribed to:', alreadySubscribed);
          setIsAlreadySubscribed(alreadySubscribed);
          
          // Also check if user has an account
          if (isValidEmail(email)) {
            await checkUserAccount(email);
          }
        } catch (error) {
          console.error('Error checking subscription status:', error);
          setIsAlreadySubscribed(false);
        } finally {
          setCheckingSubscription(false);
        }
      } else {
        setIsAlreadySubscribed(false);
        setHasAccount(false);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(checkSubscription, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset all errors
    setNameError('');
    setEmailError('');
    setLocationError('');
    setSectorError('');
    
    let hasErrors = false;
    
    if (isAlreadySubscribed) {
      showToast("You're already subscribed to our weekly forecasts!", "success");
      return;
    }
    
    if (!name.trim()) {
      setNameError('Please enter your name');
      hasErrors = true;
    }
    
    if (!email.trim()) {
      setEmailError('Please enter your email');
      hasErrors = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }
    
    if (selectedLocations.length === 0 && !showLocationInput) {
      setLocationError('Please select at least one location');
      hasErrors = true;
    }
    
    if (showLocationInput && !customLocation.trim()) {
      setLocationError('Please specify your location');
      hasErrors = true;
    }
    
    if (selectedSectors.length === 0) {
      setSectorError('Please select at least one sector');
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Submitting subscription for:', email);
      
      // Prepare locations array
      const locations = selectedLocations.map(loc => ({
        name: loc.city,
        latitude: loc.latitude,
        longitude: loc.longitude,
        placeId: loc.placeId,
      }));
      
      // Prepare sectors array
      const sectors = selectedSectors.map(sector => 
        sector === 'Other' ? customSector : sector
      ).filter(Boolean);
      
      await createSubscriber({
        name,
        email,
        location: locations,
        sector: sectors,
      });
      
      console.log('Subscription successful for:', email);
      setSuccess(true);
      setSubscriptionCompleted(true);
      setIsNewSubscription(true); // Mark this as a new subscription
      
      // Re-check account status after successful subscription
      console.log('Re-checking account status for:', email);
      await checkUserAccount(email);
      
    } catch (err: unknown) {
      console.error('Subscription error:', err);
      showToast('Subscription failed. Please try again.', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationCity: string) => {
    setLocationError(''); // Clear error when user makes a selection
    if (locationCity === 'Other') {
      setShowLocationInput(true);
      setCustomLocation('');
    } else {
      const selectedLocation = locationOptions.find(loc => loc.city === locationCity);
      if (selectedLocation && !selectedLocations.some(loc => loc.city === selectedLocation.city)) {
        setSelectedLocations(prev => [...prev, selectedLocation]);
      }
    }
  };

  const handleSectorSelect = (selectedSector: string) => {
    setSectorError(''); // Clear error when user makes a selection
    if (selectedSector === 'Other') {
      setShowSectorInput(true);
      setCustomSector('');
    } else if (!selectedSectors.includes(selectedSector)) {
      setSelectedSectors(prev => [...prev, selectedSector]);
    }
  };

  const removeLocation = (cityToRemove: string) => {
    setSelectedLocations(prev => prev.filter(loc => loc.city !== cityToRemove));
  };

  const removeSector = (sectorToRemove: string) => {
    setSelectedSectors(prev => prev.filter(sector => sector !== sectorToRemove));
  };

  const handleCustomLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomLocation(e.target.value);
    setLocationError(''); // Clear error when user types
  };

  const handleCustomSectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSector(e.target.value);
    setSectorError(''); // Clear error when user types
  };

  const addCustomSector = () => {
    if (customSector.trim() && !selectedSectors.includes(customSector.trim())) {
      setSelectedSectors(prev => [...prev, customSector.trim()]);
      setCustomSector('');
      setShowSectorInput(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setNameError(''); // Clear error when user types
    
    // Validate name (at least 2 characters)
    if (value.trim().length >= 2) {
      setNameValid(true);
    } else {
      setNameValid(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(''); // Clear error when user types
    
    // Validate email format
    if (value.trim() && isValidEmail(value)) {
      setEmailValid(true);
    } else {
      setEmailValid(false);
    }
  };

  return (
    <Layout isHeader={true} isFooter={false}>
      {/* Google Maps Script */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${googleMapApiKey}&libraries=places`}
        onLoad={() => setGoogleLoaded(true)}
      />
      
      <Container maxWidth="sm" sx={{ px: 1 }}>
        <Box
          sx={{
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: 0,
            py: 4,
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom fontWeight="500" sx={{ mb: 1 ,fontSize:'22px' }}>
            Stay ahead of disruptions — get your weekly forecast.
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 1, fontSize:'16px', color:'black' }}>
          Actionable forecasts delivered weekly to help your business respond smarter
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              placeholder={nameError || "Name"}
              value={name}
              onChange={handleNameChange}
              error={!!nameError}
              sx={{ 
                mb: 0,
                '& .MuiInputBase-input::placeholder': {
                  color: nameError ? '#d32f2f' : '#222',
                  opacity: 1
                }
              }}
              InputProps={{
                sx: {
                  ...inputStyles,
                  ...(nameError && {
                    borderColor: '#d32f2f',
                    '&:hover': {
                      borderColor: '#d32f2f'
                    }
                  })
                },
                endAdornment: nameValid ? (
                  <CheckCircleIcon sx={{ color: 'green', fontSize: 20 }} />
                ) : null
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              placeholder={emailError || "Email"}
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              sx={{ 
                mb: 0,
                '& .MuiInputBase-input::placeholder': {
                  color: emailError ? '#d32f2f' : '#222',
                  opacity: 1
                }
              }}
              InputProps={{
                sx: {
                  ...inputStyles,
                  ...(emailError && {
                    borderColor: '#d32f2f',
                    '&:hover': {
                      borderColor: '#d32f2f'
                    }
                  })
                },
                endAdornment: checkingSubscription ? (
                  <CircularProgress size={20} sx={{ color: '#056CF2' }} />
                ) : isAlreadySubscribed ? (
                  <CheckCircleIcon sx={{ color: 'green', fontSize: 20 }} />
                ) : emailValid ? (
                  <CheckCircleIcon sx={{ color: 'green', fontSize: 20 }} />
                ) : null
              }}
            />

            {/* Location dropdown */}
            <FormControl fullWidth margin="normal" sx={{ mb: 0 }} error={!!locationError}>
              <Select
                displayEmpty
                value=""
                onChange={(e) => handleLocationSelect(e.target.value)}
                renderValue={() => (
                  <Typography sx={{ color: locationError ? '#d32f2f' : '#222' }}>
                    {locationError || "Add locations"}
                  </Typography>
                )}
                sx={{
                  ...inputStyles,
                  ...(locationError && {
                    borderColor: '#d32f2f',
                    '&:hover': {
                      borderColor: '#d32f2f'
                    }
                  })
                }}
                MenuProps={menuProps}
              >
                {locationOptions.map((option) => (
                  <MenuItem key={option.city} value={option.city} 
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pr: 0,
                  }}
                  >
                    {option.city}
                    {selectedLocations.some(loc => loc.city === option.city) && (
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: 'green', bgcolor: 'transparent', borderRadius: '50%' }} />
                      </ListItemIcon>
                    )}
                  </MenuItem>
                ))}
                <MenuItem value="Other">
                  Other
                </MenuItem>
              </Select>
            </FormControl>

            {/* Custom location input */}
            {showLocationInput && (
              <TextField
                margin="normal"
                required
                fullWidth
                placeholder={locationError || "Enter your location"}
                value={customLocation}
                onChange={handleCustomLocationChange}
                inputRef={locationInputRef}
                error={!!locationError}
                sx={{ 
                  mb: 0,
                  '& .MuiInputBase-input::placeholder': {
                    color: locationError ? '#d32f2f' : '#222',
                    opacity: 1
                  }
                }}
                InputProps={{
                  sx: {
                    ...inputStyles,
                    ...(locationError && {
                      borderColor: '#d32f2f',
                      '&:hover': {
                        borderColor: '#d32f2f'
                      }
                    })
                  }
                }}
              />
            )}
            
            {/* Selected Locations Display */}
            {selectedLocations.length > 0 && (
              <Box sx={{ mt:0, mb: 0 }}>
                <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                  Selected Locations:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedLocations.map((location) => (
                    <Chip
                      key={location.city}
                      label={location.city}
                      onDelete={() => removeLocation(location.city)}
                      deleteIcon={<CloseIcon sx={{ color: '#000' }} />}
                      sx={{ bgcolor: '#056CF252', color: '#000' }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            
            <FormControl fullWidth margin="normal" sx={{ mb: 0 }} error={!!sectorError}>
              <Select
                displayEmpty
                value=""
                onChange={(e) => handleSectorSelect(e.target.value as string)}
                renderValue={() => (
                  <Typography sx={{ color: sectorError ? '#d32f2f' : '#222' }}>
                    {sectorError || "Add sectors"}
                  </Typography>
                )}
                sx={{
                  ...inputStyles,
                  ...(sectorError && {
                    borderColor: '#d32f2f',
                    '&:hover': {
                      borderColor: '#d32f2f'
                    }
                  })
                }}
                MenuProps={menuProps}
              >
                {sectorOptions.map((option) => (
                  <MenuItem key={option} value={option}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pr: 0,
                  }}
                  >
                    {option}
                    {selectedSectors.includes(option) && (
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: 'green', bgcolor: 'transparent', borderRadius: '50%' }} />
                      </ListItemIcon>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Custom sector input */}
            {showSectorInput && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  placeholder="Enter your sector"
                  value={customSector}
                  onChange={handleCustomSectorChange}
                  error={!!sectorError}
                  sx={{
                    '& .MuiInputBase-input::placeholder': {
                      color: sectorError ? '#d32f2f' : '#222',
                      opacity: 1
                    }
                  }}
                  InputProps={{
                    sx: {
                      ...inputStyles,
                      ...(sectorError && {
                        borderColor: '#d32f2f',
                        '&:hover': {
                          borderColor: '#d32f2f'
                        }
                      })
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={addCustomSector}
                  disabled={!customSector.trim()}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    height: '40px',
                    fontSize: '14px'
                  }}
                >
                  Add
                </Button>
              </Box>
            )}
            
            {/* Selected Sectors Display */}
            {selectedSectors.length > 0 && (
              <Box sx={{ mt:0, mb: 0 }}>
                <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                  Selected Sectors:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedSectors.map((sector) => (
                    <Chip
                      key={sector}
                      label={sector}
                      onDelete={() => removeSector(sector)}
                      deleteIcon={<CloseIcon sx={{ color: '#000' }} />}
                      sx={{ bgcolor: '#056CF252', color: '#000' }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || isAlreadySubscribed || subscriptionCompleted}
              sx={{
                mt: 4,
                mb: 2,
                borderRadius: 2,
                py: 1.2,
                height: '45px',
                bgcolor: '#056CF2',
                color: 'white', 
                textTransform: 'none',
                fontSize: '16px',
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                '&:hover': { 
                  bgcolor: '#0458D1', 
                  cursor: (isAlreadySubscribed || subscriptionCompleted) ? 'not-allowed' : 'pointer'
                },
                '&:disabled': {
                  bgcolor: '#056CF2',
                  color: 'white',
                  cursor: 'not-allowed'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (isAlreadySubscribed || subscriptionCompleted) ? (
                'You\'re subscribed'
              ) : (
                'Subscribe Now'
              )}
            </Button>
          </Box>
            {/* Consent message - only show when not in success state */}
            {!success && !isAlreadySubscribed && !subscriptionCompleted && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 0, 
                  mb: 2, 
                  fontSize: '14px', 
                  color: '#666',
                  textAlign: 'center',
                  lineHeight: 1.4
                }}
              >
                By subscribing, I agree to Tourprism&apos;s{' '}
                <Link href="/terms" style={{ color: '#056CF2', textDecoration: 'none' }}>
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" style={{ color: '#056CF2', textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
                .
              </Typography>
            )}
            
          {/* Success messages based on subscription status and account existence */}
          {(success || isAlreadySubscribed || subscriptionCompleted) && (
            <>
              {isAlreadySubscribed && !isNewSubscription ? (
                // Already subscribed message (for users who were already subscribed before)
                <>
                  <Typography variant="body1" sx={{color:'black'}} paragraph>
                    You&apos;re already subscribed to our weekly forecasts!
                  </Typography>
                  <Typography variant="body1" paragraph sx={{color:'black'}}>
                    {hasAccount ? (
                      <>
                        Want to view the full list of disruptions affecting your business?{' '}
                        <Link href="/feed" style={{ color: '#056CF2'}}>Go to Feed Page</Link>
                      </>
                    ) : (
                      <>
                        Want to view the full list of disruptions affecting your business?{' '}
                        <Link href="/signup" style={{ color: '#056CF2'}}>Create a Free Account</Link>
                      </>
                    )}
                  </Typography>
                </>
              ) : (
                // New subscription success message (for new subscriptions)
                <>
                  <Typography variant="body1" sx={{color:'black'}} paragraph>
                    Thank you! Your first disruption forecast will arrive on Monday at 10am GMT.
                  </Typography>
                  <Typography variant="body1" paragraph sx={{color:'black'}}>
                    {hasAccount ? (
                      <>
                        Want to view the full list of disruptions affecting your business?{' '}
                        <Link href="/feed" style={{ color: '#056CF2'}}>Go to Feed Page</Link>
                      </>
                    ) : (
                      <>
                        Want to view the full list of disruptions affecting your business?{' '}
                        <Link href="/signup" style={{ color: '#056CF2'}}>Create a Free Account</Link>
                      </>
                    )}
                  </Typography>
                </>
              )}
            </>
          )}
        </Box>
        
      </Container>
    </Layout>
  );
}