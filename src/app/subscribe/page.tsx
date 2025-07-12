'use client';

import Layout from '@/components/Layout';
import { Container, Typography, Box, TextField, Button, MenuItem, CircularProgress, FormControl, Select, ListItemIcon } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import { createSubscriber, checkSubscriberStatus } from '@/services/subscriber';
import { useToast } from '@/ui/toast';
import Link from 'next/link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  const [location, setLocation] = useState<LocationType | null>(null);
  const [sector, setSector] = useState('');
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
  const { showToast } = useToast();
  
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const googleMapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
      
      updateLocationData(place );
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
    
    setLocation(newLocation);
    setCustomLocation(place.formatted_address || place.name || '');
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
          setIsAlreadySubscribed(status.exists && status.isActive);
        } catch (error) {
          console.error('Error checking subscription status:', error);
          setIsAlreadySubscribed(false);
        } finally {
          setCheckingSubscription(false);
        }
      } else {
        setIsAlreadySubscribed(false);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(checkSubscription, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isAlreadySubscribed) {
      showToast("You're already subscribed to our weekly forecasts!", "success");
      return;
    }
    
    if (!name) {
      showToast("Please enter your name", "error");
      return;
    }
    
    if (!email) {
      showToast("Please enter your email", "error");
      return;
    }
    
    if (!location && !showLocationInput) {
      showToast("Please select a location", "error");
      return;
    }
    
    if (showLocationInput && !customLocation.trim()) {
      showToast("Please enter your location", "error");
      return;
    }
    
    if (!sector) {
      showToast("Please select your sector", "error");
      return;
    }
    
    if (showSectorInput && !customSector.trim()) {
      showToast("Please enter your sector", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      await createSubscriber({
        name,
        email,
        location: location ? [{
          name: location.city,
          latitude: location.latitude,
          longitude: location.longitude,
          placeId: location.placeId,
        }] : [],
        sector: sector === 'Other' ? customSector : sector,
      });
      setSuccess(true);
      setSubscriptionCompleted(true);
      setIsAlreadySubscribed(true);
    } catch (err: unknown) {
      console.error(err);
      showToast('Subscription failed. Please try again.', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationCity: string) => {
    if (locationCity === 'Other') {
      setShowLocationInput(true);
      setLocation(null);
      setCustomLocation('');
    } else {
      setShowLocationInput(false);
      setCustomLocation('');
      const selectedLocation = locationOptions.find(loc => loc.city === locationCity);
      if (selectedLocation) {
        setLocation(selectedLocation);
      }
    }
  };

  const handleSectorSelect = (selectedSector: string) => {
    if (selectedSector === 'Other') {
      setShowSectorInput(true);
      setSector('Other');
      setCustomSector('');
    } else {
      setShowSectorInput(false);
      setCustomSector('');
      setSector(selectedSector);
    }
  };

  const handleCustomLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomLocation(e.target.value);
  };

  const handleCustomSectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSector(e.target.value);
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
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ 
                mb: 0,
                '& .MuiInputBase-input::placeholder': {
                  color: '#222',
                  opacity: 1
                }
              }}
              InputProps={{
                sx: inputStyles
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ 
                mb: 0,
                '& .MuiInputBase-input::placeholder': {
                  color: '#222',
                  opacity: 1
                }
              }}
              InputProps={{
                sx: inputStyles,
                endAdornment: checkingSubscription ? (
                  <CircularProgress size={20} sx={{ color: '#056CF2' }} />
                ) : isAlreadySubscribed ? (
                  <CheckCircleIcon sx={{ color: 'green', fontSize: 20 }} />
                ) : null
              }}
            />
            
            {/* Location dropdown */}
            <FormControl fullWidth margin="normal" sx={{ mb: 0 }}>
              <Select
                displayEmpty
                value={location?.city || ''}
                onChange={(e) => handleLocationSelect(e.target.value)}
                renderValue={(selected) => {
                  if (!selected) {
                    return <Typography sx={{ color: '#222' }}>Select location</Typography>;
                  }
                  return selected;
                }}
                sx={{
                  ...inputStyles
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
                    {location?.city === option.city && (
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
                placeholder="Enter your location"
                value={customLocation}
                onChange={handleCustomLocationChange}
                inputRef={locationInputRef}
                sx={{ 
                  mb: 0,
                  '& .MuiInputBase-input::placeholder': {
                    color: '#222',
                    opacity: 1
                  }
                }}
                InputProps={{
                  sx: inputStyles
                }}
              />
            )}
            
            <FormControl fullWidth margin="normal" sx={{ mb: 0 }}>
              <Select
                displayEmpty
                value={sector}
                onChange={(e) => handleSectorSelect(e.target.value as string)}
                renderValue={(selected) => {
                  if (!selected) {
                    return <Typography sx={{ color: '#222' }}>Select sector</Typography>;
                  }
                  return selected;
                }}
                sx={{
                  ...inputStyles
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

                    {sector === option && (
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
              <TextField
                margin="normal"
                required
                fullWidth
                placeholder="Enter your sector"
                value={customSector}
                onChange={handleCustomSectorChange}
                sx={{ 
                  mb: 0,
                  '& .MuiInputBase-input::placeholder': {
                    color: '#222',
                    opacity: 1
                  }
                }}
                InputProps={{
                  sx: inputStyles
                }}
              />
            )}
            

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || isAlreadySubscribed || subscriptionCompleted}
              sx={{
                mt: 2,
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
                  cursor: 'https://i.sstatic.net/BdK0K.png'
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
            
          {(success || isAlreadySubscribed || subscriptionCompleted) &&
          <>
            <Typography variant="body1" sx={{color:'black'}} paragraph>
              Thank you! Your first disruption forecast will arrive on Monday at 10am GMT.
            </Typography>
            <Typography variant="body1" paragraph sx={{color:'black'}}>
            Want to view the full list of disruptions affecting your business? <Link href="/signup" style={{ color: '#056CF2'}}>Create a Free Account</Link>
            </Typography>
            </>
          }
        </Box>
      </Container>
    </Layout>
  );
}