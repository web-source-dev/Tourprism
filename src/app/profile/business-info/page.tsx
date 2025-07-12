'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Button,
  ListItemIcon,
  SelectChangeEvent,
  Link,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/ui/toast';
import { updateBusinessInfo } from '@/services/api';
import Layout from '@/components/Layout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Constants for dropdown options
const COMPANY_SIZES = [
  'Micro (1–10 staff)',
  'Small (11–50 staff)',
  'Medium (51–200 staff)',
  'Large (201–500 staff)',
  'Enterprise (500+ staff)'
];

const CUSTOMER_TYPES = [
  'Leisure Travelers',
  'Business Travelers',
  'Families',
  'Group Tours',
  'Cruise Passengers',
  'Student Groups',
  'Luxury Travelers',
  'Budget Travelers',
  'Other'
];

const TARGET_MARKETS = [
  'United Kingdom',
  'United States',
  'Germany',
  'France',
  'Spain',
  'China',
  'India',
  'Australia',
  'Canada',
  'Netherlands',
  'Italy',
  'Ireland',
  'Other'
];

const BOOKING_WINDOWS = [
  'Last-minute (0–7 days before travel)',
  'Short lead (1–4 weeks before)',
  'Medium lead (1–3 months before)',
  'Long lead (3+ months before)',
  'Mixed / varies widely'
];

const PEAK_SEASONS = [
  'Spring (Mar–May)',
  'Summer (Jun–Aug)',
  'Autumn (Sep–Nov)',
  'Winter (Dec–Feb)',
  'Year-round / No clear peak'
];

const DISRUPTION_TYPES = [
  'Flight delays & cancellations',
  'Train or transit strike',
  'Road closures / traffic',
  'Weather-related disruptions',
  'Civil unrest / protests',
  'Staff shortages / scheduling issues',
  'Event congestion / festival crowds',
  'Other'
];

const DISRUPTION_FREQUENCY = [
  'Rarely (few times a year)',
  'Occasionally (monthly)',
  'Frequently (weekly)',
  'Constantly (daily or near-daily)',
  'Not sure'
];

// Common styles for all inputs
const inputStyles = {
  borderRadius: 2,
  height: '40px',
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

// Add style for placeholder text
const placeholderStyle = {
  color: 'rgba(0, 0, 0, 0.45)'
};

interface FormData {
  companySize: string;
  customerTypes: string[];
  otherCustomerType: string;
  targetMarkets: string[];
  otherTargetMarket: string;
  bookingWindows: string[];
  peakSeasons: string[];
  disruptionTypes: string[];
  otherDisruptionType: string;
  disruptionFrequency: string;
}



export default function BusinessInfoPage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    companySize: '',
    customerTypes: [],
    otherCustomerType: '',
    targetMarkets: [],
    otherTargetMarket: '',
    bookingWindows: [],
    peakSeasons: [],
    disruptionTypes: [],
    otherDisruptionType: '',
    disruptionFrequency: ''
  });

  // Update form data when user data changes
  useEffect(() => {
    if (user?.company) {
      // Type assertion to access the extended company properties
      const company = user.company as unknown as FormData;
      
      setFormData({
        companySize: company.companySize || '',
        customerTypes: company.customerTypes || [],
        otherCustomerType: company.otherCustomerType || '',
        targetMarkets: company.targetMarkets || [],
        otherTargetMarket: company.otherTargetMarket || '',
        bookingWindows: company.bookingWindows || [],
        peakSeasons: company.peakSeasons || [],
        disruptionTypes: company.disruptionTypes || [],
        otherDisruptionType: company.otherDisruptionType || '',
        disruptionFrequency: company.disruptionFrequency || ''
      });
    }
  }, [user]);

  // Handle single select change
  const handleSingleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle multi select change
  const handleMultiSelectChange = (event: SelectChangeEvent<string[]>, name: string) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: typeof value === 'string' ? value.split(',') : value
    }));
  };

  // Handle text input change
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedUser = await updateBusinessInfo({
        companySize: formData.companySize,
        customerTypes: formData.customerTypes,
        otherCustomerType: formData.otherCustomerType,
        targetMarkets: formData.targetMarkets,
        otherTargetMarket: formData.otherTargetMarket,
        bookingWindows: formData.bookingWindows,
        peakSeasons: formData.peakSeasons,
        disruptionTypes: formData.disruptionTypes,
        otherDisruptionType: formData.otherDisruptionType,
        disruptionFrequency: formData.disruptionFrequency
      });
      
      updateUser(updatedUser);
      showToast('Business profile updated successfully', 'success');
      
      // Show "Profile Saved!" message
      setShowSaved(true);
      
      // Reset the button text after 3 seconds
      setTimeout(() => {
        setShowSaved(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating business profile:', error);
      showToast('Failed to update business profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout isFooter={false} isHeader={false}>
    <Container maxWidth="lg" sx={{ py: {xs: 3, sm: 2 ,md: 0},px:1 }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="500">
          <Link href="/profile" color="secondary" underline="none">
            <ArrowBackIcon sx={{ fontSize: 24, mr: 1 ,color:'secondary' }} />
          </Link>
          Advanced Profile
        </Typography>
       
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* Company Size */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Business Size</Typography>
            <FormControl fullWidth>
              <Select
                name="companySize"
                value={formData.companySize}
                onChange={handleSingleSelectChange}
                displayEmpty
                renderValue={(value) => value || 'Business size'}
                sx={{
                  ...inputStyles,
                  '& .MuiSelect-select:empty + input + svg + .MuiSelect-select': {
                    color: placeholderStyle.color
                  }
                }}
                MenuProps={menuProps}
              >
                {COMPANY_SIZES.map((size) => (
                  <MenuItem key={size} value={size}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pr: 2,
                    }}
                  >
                    {size}
                    {formData.companySize === size && (
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: 'green', ml: 1 }} />
                      </ListItemIcon>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Customer Types */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Primary Customers</Typography>
            <FormControl fullWidth>
              <Select
                name="customerTypes"
                multiple
                value={formData.customerTypes}
                onChange={(e) => handleMultiSelectChange(e, 'customerTypes')}
                displayEmpty
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <span style={placeholderStyle}>Primary customers</span>;
                  }
                  return selected.join(', ');
                }}
                sx={{
                  ...inputStyles,
                  '& .MuiSelect-select': {
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }
                }}
                MenuProps={menuProps}
              >
                {CUSTOMER_TYPES.map((type) => (
                  <MenuItem key={type} value={type}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pr: 2,
                    }}
                  >
                    {type}
                    {formData.customerTypes.includes(type) && (
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: 'green', ml: 1 }} />
                      </ListItemIcon>
                    )}
                  </MenuItem>
                ))}
              </Select>
              {formData.customerTypes.includes('Other') && (
                <TextField
                  name="otherCustomerType"
                  value={formData.otherCustomerType}
                  onChange={handleTextChange}
                  placeholder="Specify other customer type"
                  sx={{ 
                    mt: 0.5,
                    '& .MuiInputBase-root': {
                      ...inputStyles
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: placeholderStyle.color,
                      opacity: 1
                    }
                  }}
                />
              )}
            </FormControl>
          </Box>

          {/* Target Markets */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Top Source Markets</Typography>
            <FormControl fullWidth>
              <Select
                name="targetMarkets"
                multiple
                value={formData.targetMarkets}
                onChange={(e) => handleMultiSelectChange(e, 'targetMarkets')}
                displayEmpty
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <span style={placeholderStyle}>Top source markets</span>;
                  }
                  return selected.join(', ');
                }}
                sx={{
                  ...inputStyles,
                  '& .MuiSelect-select': {
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }
                }}
                MenuProps={menuProps}
              >
                {TARGET_MARKETS.map((market) => (
                  <MenuItem key={market} value={market}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pr: 2,
                    }}
                  >
                    {market}
                    {formData.targetMarkets.includes(market) && (
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: 'green', ml: 1 }} />
                      </ListItemIcon>
                    )}
                  </MenuItem>
                ))}
              </Select>
              {formData.targetMarkets.includes('Other') && (
                <TextField
                  name="otherTargetMarket"
                  value={formData.otherTargetMarket}
                  onChange={handleTextChange}
                  placeholder="Specify other target market"
                  sx={{ 
                    mt: 0.5,
                    '& .MuiInputBase-root': {
                      ...inputStyles
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: placeholderStyle.color,
                      opacity: 1
                    }
                  }}
                />
              )}
            </FormControl>
          </Box>

          {/* Booking Windows */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Booking Window</Typography>
            <FormControl fullWidth>
              <Select
                name="bookingWindows"
                multiple
                value={formData.bookingWindows}
                onChange={(e) => handleMultiSelectChange(e, 'bookingWindows')}
                displayEmpty
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <span style={placeholderStyle}>Booking window</span>;
                  }
                  return selected.join(', ');
                }}
                sx={{
                  ...inputStyles,
                  '& .MuiSelect-select': {
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }
                }}
                MenuProps={menuProps}
              >
                {BOOKING_WINDOWS.map((window) => (
                  <MenuItem key={window} value={window}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pr: 2,
                    }}
                  >
                    {window}
                    {formData.bookingWindows.includes(window) && (
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: 'green', ml: 1 }} />
                      </ListItemIcon>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Peak Seasons */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Peak Season</Typography>
            <FormControl fullWidth>
              <Select
                name="peakSeasons"
                multiple
                value={formData.peakSeasons}
                onChange={(e) => handleMultiSelectChange(e, 'peakSeasons')}
                displayEmpty
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <span style={placeholderStyle}>Peak season</span>;
                  }
                  return selected.join(', ');
                }}
                sx={{
                  ...inputStyles,
                  '& .MuiSelect-select': {
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }
                }}
                MenuProps={menuProps}
              >
                {PEAK_SEASONS.map((season) => (
                  <MenuItem key={season} value={season}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pr: 2,
                    }}
                  >
                    {season}
                    {formData.peakSeasons.includes(season) && (
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: 'green', ml: 1 }} />
                      </ListItemIcon>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Disruption Types */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Primary Concerns</Typography>
            <FormControl fullWidth>
              <Select
                name="disruptionTypes"
                multiple
                value={formData.disruptionTypes}
                onChange={(e) => handleMultiSelectChange(e, 'disruptionTypes')}
                displayEmpty
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <span style={placeholderStyle}>Primary concerns</span>;
                  }
                  return selected.join(', ');
                }}
                sx={{
                  ...inputStyles,
                  '& .MuiSelect-select': {
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }
                }}
                MenuProps={menuProps}
              >
                {DISRUPTION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pr: 2,
                    }}
                  >
                    {type}
                    {formData.disruptionTypes.includes(type) && (
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: 'green', ml: 1 }} />
                      </ListItemIcon>
                    )}
                  </MenuItem>
                ))}
              </Select>
              {formData.disruptionTypes.includes('Other') && (
                <TextField
                  name="otherDisruptionType"
                  value={formData.otherDisruptionType}
                  onChange={handleTextChange}
                  placeholder="Specify other disruption type"
                  sx={{ 
                    mt: 0.5,
                    '& .MuiInputBase-root': {
                      ...inputStyles
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: placeholderStyle.color,
                      opacity: 1
                    }
                  }}
                />
              )}
            </FormControl>
          </Box>

          {/* Disruption Frequency */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Disruption Frequency</Typography>
            <FormControl fullWidth>
              <Select
                name="disruptionFrequency"
                value={formData.disruptionFrequency}
                onChange={handleSingleSelectChange}
                displayEmpty
                renderValue={(value) => value || <span style={placeholderStyle}>Disruption frequency</span>}
                sx={inputStyles}
                MenuProps={menuProps}
              >
                {DISRUPTION_FREQUENCY.map((frequency) => (
                  <MenuItem key={frequency} value={frequency}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      pr: 2,
                    }}
                  >
                    {frequency}
                    {formData.disruptionFrequency === frequency && (
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: 'green', ml: 1 }} />
                      </ListItemIcon>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            color='secondary'
            sx={{ mt: 2 }}
          >
            {isSubmitting ? 'Saving...' : showSaved ? 'Profile Saved!' : 'Save Advanced Profile'}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          Your data is safe with us. We’re <Link href="/privacy-policy" color="secondary" target="_blank" rel="noopener noreferrer">GDPR </Link>compliant.
          </Typography>
        </Box>
    </Container>
    </Layout>
  );
} 