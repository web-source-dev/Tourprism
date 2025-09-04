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
  FormControlLabel,
  Checkbox,
  MenuItem,
  Select,
  FormControl,
  Autocomplete,
  Link,
  ListItemIcon
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { User } from '@/types';
import { updatePersonalInfo, updateCompanyInfo, updateSubscriberStatusByEmail } from '@/services/api';
import { createSubscriber as createSubscriberService, checkSubscriberStatus } from '@/services/subscriber';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/ui/toast';

interface PersonalInfoTabProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

interface LocationType {
  name: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

export default function PersonalInfoTab({ user, onUpdate }: PersonalInfoTabProps) {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [email, setEmail] = useState(user.email || '');
  const [businessName, setBusinessName] = useState(user.company?.name || '');
  const [businessType, setBusinessType] = useState(user.company?.type || '');
  const [selectedLocations, setSelectedLocations] = useState<LocationType[]>(
    user.company?.MainOperatingRegions?.map(region => ({
      name: region.name,
      latitude: region.latitude,
      longitude: region.longitude,
      placeId: region.placeId || ''
    })) || []
  );
  // Initialize from user data first to prevent flicker
  const [weeklyForecast, setWeeklyForecast] = useState(user.weeklyForecastSubscribed || false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  
  const { isCollaborator, collaboratorRole } = useAuth();
  const isViewOnly = isCollaborator && collaboratorRole === 'viewer';
  const { showToast } = useToast();

  const [isSubscriberLoading, setIsSubscriberLoading] = useState(true);
  const [subscriberExists, setSubscriberExists] = useState(false);

  // Check if user exists in subscribers collection
  useEffect(() => {
    const fetchSubscriberStatus = async () => {
      try {
        setIsSubscriberLoading(true);
        const { exists, isActive } = await checkSubscriberStatus(user.email);
        console.log(exists, isActive);
        setSubscriberExists(exists && isActive);
        // Only update the checkbox if it differs from current user data
        // This prevents the checkbox from flickering
        if (isActive !== weeklyForecast) {
          setWeeklyForecast(isActive);
          // Also update the user object to keep it in sync
          onUpdate({
            ...user,
            weeklyForecastSubscribed: isActive
          });
        }
      } catch (error) {
        console.error('Error checking subscriber status:', error);
      } finally {
        setIsSubscriberLoading(false);
      }
    };

    if (user.email) {
      fetchSubscriberStatus();
    }
    // Only depend on user.email to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  // Predefined locations
  const locations: LocationType[] = [
    {
      name: "Edinburgh",
      latitude: 55.953251,
      longitude: -3.188267,
      placeId: "ChIJIyaYpQC4h0gRJxfnfHsU8mQ"
    },
    {
      name: "Glasgow",
      latitude: 55.860916,
      longitude: -4.251433,
      placeId: "ChIJ685WIFYViEgRHlHvBbiD5nE"
    },
    {
      name: "Stirling",
      latitude: 56.116859,
      longitude: -3.936900,
      placeId: "ChIJA8sABMRVjEgRYZ1QTnm1rq8"
    },
    {
      name: "Manchester",
      latitude: 53.480759,
      longitude: -2.242631,
      placeId: "ChIJ2_UmUkxNekgRqmv-BDgUvtk"
    },
    {
      name: "London",
      latitude: 51.507351,
      longitude: -0.127758,
      placeId: "ChIJdd4hrwug2EcRmSrV3Vo6llI"
    }
  ];

  // Update form fields when user prop changes
  useEffect(() => {
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setEmail(user.email || '');
    setBusinessName(user.company?.name || '');
    setBusinessType(user.company?.type || '');
    setSelectedLocations(
      user.company?.MainOperatingRegions?.map(region => ({
        name: region.name,
        latitude: region.latitude,
        longitude: region.longitude,
        placeId: region.placeId || ''
      })) || []
    );
    setWeeklyForecast(user.weeklyForecastSubscribed || false);
  }, [user]);

  const handleWeeklyForecastChange = async (checked: boolean) => {
    try {
      if (checked && !subscriberExists) {
        // Add to subscribers if newly subscribed
        await createSubscriberService({
          name: `${firstName} ${lastName}`,
          email: email,
          location: selectedLocations,
          sector: businessType ? [businessType] : []
        });
        setSubscriberExists(true);
        // Update local user state to reflect subscription
        onUpdate({
          ...user,
          weeklyForecastSubscribed: true,
          weeklyForecastSubscribedAt: new Date().toISOString()
        });
      } else if (!checked && subscriberExists) {
        // Update subscriber status to inactive using email
        await updateSubscriberStatusByEmail(email, false);
        setSubscriberExists(false);
        // Update local user state to reflect unsubscription
        onUpdate({
          ...user,
          weeklyForecastSubscribed: false
        });
      }
      setWeeklyForecast(checked);
    } catch (error) {
      console.error('Error updating subscription status:', error);
      showToast('Failed to update subscription status', 'error');
      // Revert checkbox state on error
      setWeeklyForecast(!checked);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Prevent viewers from submitting
    if (isViewOnly) return;
    
    // Validate inputs
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update personal info
      const personalData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(email !== user.email ? { email: email.trim() } : {})
      };
      
      const updatedUser = await updatePersonalInfo(personalData);
      
      // Update company info
      const companyData = {
        companyName: businessName.trim(),
        companyType: businessType.trim(),
        mainOperatingRegions: selectedLocations
      };
      
      await updateCompanyInfo(companyData);

      // Handle weekly forecast subscription
      if (weeklyForecast !== subscriberExists) {
        await handleWeeklyForecastChange(weeklyForecast);
      }
      
      onUpdate(updatedUser);
      showToast('Profile saved successfully!', 'success');
      setShowSaved(true);
      
      // Reset the button text after 3 seconds
      setTimeout(() => {
        setShowSaved(false);
      }, 3000);
      
      // Show warning if email was changed
      if (email !== user.email) {
        setSuccess('Profile saved! Please verify your new email address.');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      showToast('Failed to save profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const businessTypes = [
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

  const inputStyles = {
    height: '40px',
    borderRadius: 2,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  };

  return (
      <Box component="form" sx={{ px: 0, py: 0 ,mt:{xs:0 ,md:-3} }} onSubmit={handleSubmit} noValidate>        

        <Divider sx={{ mb: 3 }} />
        
        {isViewOnly && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have view-only access to this profile. Contact the account owner for edit permissions.
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
        
        <Stack spacing={1.5} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>First Name</Typography>
              <TextField
                fullWidth
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting || isViewOnly}
                required
                InputProps={{
                  readOnly: isViewOnly,
                  sx: inputStyles
                }}
                sx={{ 
                  mb: 0,
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(0, 0, 0, 0.45)',
                    opacity: 1
                  }
                }}
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Last Name</Typography>
              <TextField
                fullWidth
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting || isViewOnly}
                required
                InputProps={{
                  readOnly: isViewOnly,
                  sx: inputStyles
                }}
                sx={{ 
                  mb: 0,
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(0, 0, 0, 0.45)',
                    opacity: 1
                  }
                }}
              />
            </Box>
          </Box>
          
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Email Address</Typography>
            <TextField
              fullWidth
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={true}
              required
              InputProps={{
                readOnly: true,
                sx: inputStyles
              }}
              sx={{ 
                mb: 0,
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(0, 0, 0, 0.45)',
                  opacity: 1
                }
              }}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Business Name</Typography>
            <TextField
              fullWidth
              placeholder="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={isSubmitting || isViewOnly}
              InputProps={{
                readOnly: isViewOnly,
                sx: inputStyles
              }}
              sx={{ 
                mb: 0,
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(0, 0, 0, 0.45)',
                  opacity: 1
                }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, pb: 0}}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Business Location</Typography>
              <FormControl fullWidth>
                <Box sx={{ width: '100%' }}>
                  <Autocomplete
                    multiple
                    options={locations}
                    value={selectedLocations}
                    onChange={(_, newValue) => {
                      // If the new location is already selected, remove it
                      const updatedLocations = selectedLocations.some(loc => loc.placeId === newValue[newValue.length - 1]?.placeId)
                        ? selectedLocations.filter(loc => loc.placeId !== newValue[newValue.length - 1]?.placeId)
                        : newValue;
                      setSelectedLocations(updatedLocations);
                    }}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => {
                      // Create a string of selected locations
                      const selectedText = selectedLocations.map(loc => loc.name).join(', ');
                      
                      return (
                        <TextField
                          {...params}
                          placeholder={selectedLocations.length === 0 ? "Business Location" : ""}
                          // Override the input value to show selected locations
                          InputProps={{
                            ...params.InputProps,
                            readOnly: isViewOnly,
                            sx: inputStyles
                          }}
                          inputProps={{
                            ...params.inputProps,
                            value: selectedText,
                            // Show ellipsis when text overflows
                            style: {
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              ...inputStyles,
                              p: '2px 14px 2px 14px',
                              '& input': {
                                p: '0px !important'
                              }
                            },
                            '& .MuiInputBase-input::placeholder': {
                              color: 'rgba(0, 0, 0, 0.45)',
                              opacity: 1
                            }
                          }}
                        />
                      );
                    }}
                    renderOption={(props, option) => {
                      const isSelected = selectedLocations.some(loc => loc.placeId === option.placeId);
                      return (
                        <MenuItem
                          {...props}
                          key={option.placeId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            pr: 2,
                            py: 1,
                            px: 2,
                            '&.Mui-selected': {
                              backgroundColor: 'transparent'
                            },
                            '&.Mui-selected:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          <Box component="span" sx={{ flex: 1 }}>{option.name}</Box>
                          {isSelected && (
                            <CheckCircleIcon sx={{ color: 'green', ml: 1 }} />
                          )}
                        </MenuItem>
                      );
                    }}
                    disabled={isSubmitting || isViewOnly}
                    ListboxProps={{
                      style: {
                        maxHeight: '200px',
                      }
                    }}
                    renderTags={() => null} // Don't render tags inside input
                    sx={{
                      '& .MuiAutocomplete-endAdornment': {
                        top: '50%',
                        transform: 'translateY(-50%)',
                        right: 8
                      }
                    }}
                  />
                </Box>
              </FormControl>
            </Box>

            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Business Type</Typography>
              <FormControl fullWidth>
                <Select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  displayEmpty
                  disabled={isSubmitting || isViewOnly}
                  renderValue={(value) => value || 'Business Type'}
                  sx={{
                    ...inputStyles,
                    '& .MuiSelect-select': {
                      p: '8px 14px'
                    },
                    '& .MuiMenu-paper': {
                      maxHeight: '200px'
                    },
                    '& .MuiSelect-select[aria-expanded="false"]': {
                      color: !businessType ? 'rgba(0, 0, 0, 0.45)' : 'inherit'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200, // Height for ~5 items
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left'
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left'
                    }
                  }}
                >
                  {businessTypes.map((type) => (
                    <MenuItem 
                      key={type} 
                      value={type}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        pr: 2,
                        py: 1,
                        px: 2
                      }}
                    >
                      {type}
                      {businessType === type && (
                        <ListItemIcon>
                          <CheckCircleIcon sx={{ color: 'green', ml: 1 }} />
                        </ListItemIcon>
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={weeklyForecast}
                onChange={(e) => handleWeeklyForecastChange(e.target.checked)}
                disabled={isSubmitting || isViewOnly || isSubscriberLoading}
              />
            }
            label={
              isSubscriberLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Checking subscription status...</span>
                  <CircularProgress size={16} />
                </Box>
              ) : weeklyForecast ? (
                "You are subscribed to weekly forecast"
              ) : (
                "Subscribe me for weekly forecast"
              )
            }
          />
        </Stack>
        
        {!isViewOnly && (
          <Button
            variant="contained"
            color="secondary"
            type="submit"
            disabled={isSubmitting}
            fullWidth
            sx={{ height: '45px' }}
          >
            {isSubmitting ? 'Saving...' : showSaved ? 'Profile Saved!' : 'Save Profile'}
          </Button>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Want smarter alerts ? <Link href="/profile/business-info" sx={{ color: 'secondary.main' }}>Tell us more</Link> about your business.
        </Typography>
      </Box>
  );
} 