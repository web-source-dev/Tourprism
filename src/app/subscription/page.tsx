'use client';

import Layout from '@/components/Layout';
import { Container, Typography, Box, TextField, Button, MenuItem, CircularProgress, FormControl, Select, ListItemIcon } from '@mui/material';
import { useState } from 'react';
import { createSubscriber } from '@/services/subscriber';
import { useToast } from '@/ui/toast';
import Link from 'next/link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface LocationType {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  placeId: string;
}



const sectorOptions: string[] = [
  "Airlines",
  "Attractions",
  "Car Rentals",
  "Cruise Lines",
  "DMOs",
  "Event Managers",
  "Hotels",
  "OTAs",
  "Tour Guides",
  "Tour Operators",
  "Travel Agencies",
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
  const { showToast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!name) {
      showToast("Please enter your name", "error");
      return;
    }
    
    if (!email) {
      showToast("Please enter your email", "error");
      return;
    }
    
    if (!location) {
      showToast("Please select a location", "error");
      return;
    }
    
    if (!sector) {
      showToast("Please select your sector", "error");
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
        sector,
      });
      setSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      showToast('Subscription failed. Please try again.', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationCity: string) => {
    const selectedLocation = locationOptions.find(loc => loc.city === locationCity);
    if (selectedLocation) {
      setLocation(selectedLocation);
    }
  };

  return (
    <Layout isHeader={true}>
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
            5 key alerts tailored to your tourism business. Delivered every Monday.
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
                sx: inputStyles
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
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal" sx={{ mb: 0 }}>
              <Select
                displayEmpty
                value={sector}
                onChange={(e) => setSector(e.target.value as string)}
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 4,
                borderRadius: 2,
                py: 1.2,
                height: '45px',
                bgcolor: '#1565c0',
                color: 'white',
                textTransform: 'none',
                fontSize: '16px',
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                '&:hover': { bgcolor: '#0d47a1' },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Subscribe Now'}
            </Button>
          </Box>

          {success &&
          <>
            <Typography variant="body1" sx={{color:'black'}} paragraph>
              Thank you! Your first disruption forecast will arrive on Monday at 10am GMT.
            </Typography>
            <Typography variant="body1" paragraph sx={{color:'black'}}>
              Want to see what else is disrupting your region? <Link href="/signup" style={{ color: '#1565c0'}}>Create a Free Account</Link>
            </Typography>
            </>
          }
        </Box>
      </Container>
    </Layout>
  );
}
