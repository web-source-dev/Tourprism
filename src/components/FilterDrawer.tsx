'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Slider,
  IconButton,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Dialog,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { FilterOptions } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/ui/toast';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Add global styles for Poppins font
const globalStyles = {
  fontFamily: 'Poppins, sans-serif',
};

// Create a green circle with white tick icon component for selected items
const SelectedIcon = () => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: '50%',
    bgcolor: '#4caf50'
  }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
    </svg>
  </Box>
);

const INCIDENT_TYPES = [
  "All",
  "Industrial Action",
  "Extreme Weather",
  "Infrastructure Failures",
  "Public Safety Incidents",
  "Festivals and Events",
];

const SORT_OPTIONS = [
  { value: 'impact_score', label: 'Smart Ranking', default: true },
  { value: 'latest', label: 'Latest First' },
  { value: 'highest_impact', label: 'Highest Impact' }
];

const IMPACT_LEVELS = [
  { value: 'Low', label: 'Low' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'High', label: 'High' },
];

const CITY_OPTIONS = [
  { value: 'Edinburgh', label: 'Edinburgh' },
  { value: 'Glasgow', label: 'Glasgow' },
  { value: 'Stirling', label: 'Stirling' },
  { value: 'Manchester', label: 'Manchester' },
  { value: 'London', label: 'London' },
];

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  resultCount?: number;
  onApplyFilters: (selectedCity: string) => void;
  onClearFilters: () => void;
  currentCity?: string | null;
  isUsingCurrentLocation?: boolean;
  onUseMyLocation?: () => Promise<void>;
  onResetLocation?: () => void;
  locationLoading?: boolean;
  locationAccuracy?: number | null;
}

// Create a custom expand icon component
const ExpandMoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="#616161" />
  </svg>
);

const FilterDrawer = ({
  open,
  onClose,
  filters = {
    timeRange: 7, // Default to 'This Week'
    alertCategory: [], // Default to 'All'
    impactLevel: [], // Default to 'All'
    sortBy: 'latest', // Default to 'Latest First'
    distance: 20
  },
  onFilterChange,
  resultCount,
  onApplyFilters,
  onClearFilters,
  currentCity = 'Edinburgh',
  isUsingCurrentLocation = false,
  onUseMyLocation = () => Promise.resolve(),
  onResetLocation = () => { },
  locationLoading = false,
  locationAccuracy = null
}: FilterDrawerProps) => {
  // State to track which accordion is expanded
  const [expanded, setExpanded] = useState<string | false>(false);
  const { showToast } = useToast();
  const { isAuthenticated, isPremium } = useAuth();
  console.log(resultCount);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };
  const DATE_RANGES = [
    { value: 7, label: 'This Week' },
    { value: -1, label: isPremium ? 'Custom' : 'Custom' },
  ];
  const handleTimeRangeChange = (value: number) => {
    if (value === -1 && !isPremium) {
      handlePremium();
      return;
    }
    onFilterChange({
      ...filters,
      timeRange: value
    });
  };

  const handleDistanceChange = (_event: Event, newValue: number | number[]) => {
    onFilterChange({
      ...filters,
      distance: newValue as number
    });
  };

  const handleSortChange = (sortValue: string) => {
    onFilterChange({
      ...filters,
      sortBy: sortValue
    });
  };

  const handleImpactLevelChange = (impactLevel: string) => {
    if (impactLevel === '') {
      // If 'All' is selected, clear the array
      onFilterChange({
        ...filters,
        impactLevel: []
      });
      return;
    }
    console.log("impactLevel",impactLevel);
    // Toggle the selected impact level in the array
    const updatedImpact = filters.impactLevel?.includes(impactLevel as "Low" | "Moderate" | "High")
      ? filters.impactLevel.filter(level => level !== impactLevel)
      : [...(filters.impactLevel || []), impactLevel];
      
    onFilterChange({
      ...filters,
      impactLevel: updatedImpact as ("Low" | "Moderate" | "High")[]
    });
  };

  const handleIncidentTypeChange = (type: string) => {
    if (type === "All") {
      onFilterChange({
        ...filters,
        alertCategory: []
      });
      return;
    }
    // Toggle the selected type in the array
    const updatedTypes = filters.alertCategory.includes(type)
      ? filters.alertCategory.filter(t => t !== type)
      : [...filters.alertCategory, type];

    onFilterChange({
      ...filters,
      alertCategory: updatedTypes
    });
  };

  const handleApplyFiltersClick = () => {
    console.log('Applying filters:', filters, 'with city:', selectedCity);
    onApplyFilters(selectedCity);
    onClose();
  };

  const handleClearFiltersClick = () => {
    onClearFilters();
  };

  // Helper function to get selected incident type label
  const getSelectedIncidentType = () => {
    if (filters.alertCategory.length === 0) return 'All';
    return filters.alertCategory.join(', ');
  };

  // Helper function to get selected date range label
  const getSelectedDateRange = () => {
    const selectedRange = DATE_RANGES.find(range => range.value === filters.timeRange);
    if (filters.timeRange === -1) {
      return 'Custom';
    }
    return selectedRange ? selectedRange.label : 'This week';
  };

  // Helper function to get selected impact level label
  const getSelectedImpactLevel = () => {
    if (!filters.impactLevel || filters.impactLevel.length === 0) return 'All';
    if (filters.impactLevel.length === 1) {
      const impactLevel = IMPACT_LEVELS.find(level => level.value === filters.impactLevel?.[0]);
      return impactLevel ? impactLevel.label : 'All';
    }
    return `${filters.impactLevel.length} selected`;
  };

  // Helper function to get selected sort label
  const getSelectedSortOption = () => {
    const sortOption = SORT_OPTIONS.find(option => option.value === filters.sortBy);
    return sortOption ? sortOption.label : 'Latest First';
  };


  const handlePremium = () => {
    if (!isAuthenticated) {
      showToast("Create an account to unlock this filter", "error");
    } else {
      showToast("Please subscribe to unlock this filter", "error");
    }
  }

  const useIsMobile = () => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.down('sm'));
  }

  // Handle city selection for non-subscribed users
  const handleCityChange = (cityValue: string) => {
    if (onResetLocation) {
      onResetLocation();
    }
    setCity(cityValue);
    // Apply filters immediately when city changes
    onApplyFilters(cityValue);
  };

  // State to track selected city
  const [selectedCity, setCity] = useState(currentCity || 'Edinburgh');

  // Update selectedCity when currentCity prop changes
  useEffect(() => {
    if (currentCity) {
      setCity(currentCity);
    }
  }, [currentCity]);

  return (

    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={useIsMobile()} // use full screen mode on mobile
      PaperProps={{
        sx: {
          width: useIsMobile() ? '100%' : 560,
          height: useIsMobile() ? '100%' : 'auto',
          m: 0, // remove margins
          borderRadius: useIsMobile() ? 0 : 2,
          py: 2,
          backgroundColor: 'white',
          ...globalStyles,
        },
      }}
    >
      <Box sx={{ p: isAuthenticated ? 2 : 2, ...globalStyles }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="550" sx={{ fontFamily: 'Poppins, sans-serif', color: '#000000' }}>Filter By</Typography>
          <IconButton onClick={onClose}>
            <Typography sx={{ fontSize: '16px', fontWeight: 'bold', ...globalStyles }}>X</Typography>
          </IconButton>
        </Box>
        <Box sx={{
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          ...globalStyles,
        }}>

          {/* Type Filter */}
          <Accordion
            expanded={expanded === 'type'}
            onChange={handleAccordionChange('type')}
            sx={{
              boxShadow: 'none',
              '&:before': { display: 'none' },
              borderBottom: '1px solid #e0e0e0',
              position: 'relative',
              border: expanded === 'type' ? '1px solid #e0e0e0' : '',
              borderRadius: expanded === 'type' ? 2 : '',
              py: expanded === 'type' ? 0 : '',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 2,
                backgroundColor: 'white',
                zIndex: 4,
                height: '64px',
                minHeight: '64px',
                '& .MuiAccordionSummary-content': {
                  margin: '0 !important',
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  alignSelf: 'center',
                  position: 'relative',
                  top: 0,
                  transform: 'none',
                  '&.Mui-expanded': {
                    transform: 'rotate(180deg)',
                  },
                },
                borderRadius: 2,
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <Box sx={{ width: '100%', py: expanded === 'type' ? 0.4 : '' }}>
                <Typography variant="body1" fontWeight="600" sx={{ fontFamily: 'Poppins, sans-serif', color: '#000000' }}>Type</Typography>
                <Typography variant="body2" fontWeight="400" sx={{mt:0.5,color: '#757575', ...globalStyles }}>{getSelectedIncidentType()}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{
              px: 1,
              pt: 0,
              mt: 2,
              borderRadius: 2,
              position: 'absolute',
              width: '100%',
              backgroundColor: 'white',
              boxShadow: 4,
              zIndex: 5,
              ...globalStyles,
            }}>
              <List sx={{ width: '100%', p: 0, ...globalStyles }}>
                {INCIDENT_TYPES.map((type) => (
                  <ListItem
                    key={type}
                    onClick={() => handleIncidentTypeChange(type)}
                    sx={{
                      px: 0,
                      cursor: 'pointer',
                      borderBottom: '1px solid rgb(221,221,221)',
                      background: 'white',
                      '&:hover': { backgroundColor: 'rgb(255, 255, 255)' },
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                    component="div"
                  >
                    <ListItemText primary={type} sx={globalStyles} />
                    {(type === "All" && filters.alertCategory.length === 0) && <SelectedIcon />}
                    {filters.alertCategory.includes(type) && <SelectedIcon />}
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Location Filter */}
          {isPremium && isAuthenticated ? (
            <Accordion
              expanded={expanded === 'location'}
              onChange={handleAccordionChange('location')}
              sx={{
                boxShadow: 'none',
                '&:before': { display: 'none' },
                borderBottom: '1px solid #e0e0e0',
                position: 'relative',
                border: expanded === 'location' ? '1px solid #e0e0e0' : '',
                borderRadius: expanded === 'location' ? 2 : '',
                py: expanded === 'location' ? 0 : ''
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 2,
                  backgroundColor: 'white',
                  zIndex: 4,
                  height: '64px',
                  minHeight: '64px',
                  '& .MuiAccordionSummary-content': {
                    margin: '0 !important',
                  },
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    alignSelf: 'center',
                    position: 'relative',
                    top: 0,
                    transform: 'none',
                    '&.Mui-expanded': {
                      transform: 'rotate(180deg)',
                    },
                  },
                  borderRadius: 2,
                  borderBottom: '1px solid #e0e0e0',
                }}
              >
                <Box sx={{ width: '100%', ...globalStyles }}>
                  <Typography variant="body1" fontWeight="600" sx={{ fontFamily: 'Poppins, sans-serif', color: '#000000' }}>Location</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight="400" sx={{ fontFamily: 'Poppins, sans-serif', color: '#000000' }}>
                      {currentCity || 'Edinburgh'}
                      {locationAccuracy && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, ...globalStyles }}>
                          (±{Math.round(locationAccuracy)}m)
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{
                px: 1,
                pt: 4,
                mt: 2,
                borderRadius: 2,
                position: 'absolute',
                width: '100%',
                backgroundColor: 'white',
                boxShadow: 4,
                zIndex: 5,
                ...globalStyles,
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ...globalStyles }}>
                  {isUsingCurrentLocation ? (
                    <Button
                      variant="outlined"
                      onClick={onResetLocation}
                      fullWidth
                      sx={{
                        color: '#616161',
                        borderColor: '#e0e0e0',
                        textTransform: 'none',
                        borderRadius: 1,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      Reset to Edinburgh
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={onUseMyLocation}
                      fullWidth
                      disabled={locationLoading}
                      startIcon={
                        locationLoading ? (
                          <CircularProgress size={16} />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8ZM20.94 11C20.48 6.83 17.17 3.52 13 3.06V1H11V3.06C6.83 3.52 3.52 6.83 3.06 11H1V13H3.06C3.52 17.17 6.83 20.48 11 20.94V23H13V20.94C17.17 20.48 20.48 17.17 20.94 13H23V11H20.94ZM12 19C8.13 19 5 15.87 5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12C19 15.87 15.87 19 12 19Z"
                              fill="#616161"
                            />
                          </svg>
                        )
                      }
                      sx={{
                        color: '#616161',
                        borderColor: '#e0e0e0',
                        textTransform: 'none',
                        borderRadius: 1,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      Use my location
                    </Button>
                  )}

                  {/* Distance slider */}
                  <Box sx={{ px: 1, mt: 1, width: '98%', ...globalStyles }}>
                    <Typography variant="body2" gutterBottom sx={globalStyles}>Distance (km)</Typography>
                    <Slider
                      value={filters.distance || 20}
                      onChange={handleDistanceChange}
                      min={1}
                      max={100}
                      step={1}
                      marks={[{ value: 1, label: '1' }, { value: 100, label: '100km' }]}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}km`}
                      sx={{ ...globalStyles }}
                    />
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ) : (
            <Accordion
              expanded={expanded === 'location'}
              onChange={handleAccordionChange('location')}
              sx={{
                boxShadow: 'none',
                '&:before': { display: 'none' },
                borderBottom: '1px solid #e0e0e0',
                position: 'relative',
                border: expanded === 'location' ? '1px solid #e0e0e0' : '',
                borderRadius: expanded === 'location' ? 2 : '',
                py: expanded === 'location' ? 0 : ''
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 2,
                  backgroundColor: 'white',
                  zIndex: 4,
                  height: '64px',
                  minHeight: '64px',
                  '& .MuiAccordionSummary-content': {
                    margin: '0 !important',
                  },
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    alignSelf: 'center',
                    position: 'relative',
                    top: 0,
                    transform: 'none',
                    '&.Mui-expanded': {
                      transform: 'rotate(180deg)',
                    },
                  },
                  borderRadius: 2,
                  borderBottom: '1px solid #e0e0e0',
                }}
              >
                <Box sx={{ width: '100%', ...globalStyles }}>
                  <Typography variant="body1" fontWeight="600" sx={{ fontFamily: 'Poppins, sans-serif', color: '#000000' }}>Location</Typography>
                  <Typography variant="body2" fontWeight="400" sx={{ fontFamily: 'Poppins, sans-serif', color: '#757575' }}>
                    {selectedCity}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{
                px: 1,
                pt: 0,
                mt: 2,
                borderRadius: 2,
                position: 'absolute',
                width: '100%',
                backgroundColor: 'white',
                boxShadow: 4,
                zIndex: 5,
                ...globalStyles,
              }}>
                <List sx={{ width: '100%', p: 0, ...globalStyles }}>
                  {CITY_OPTIONS.map((city) => (
                    <ListItem
                      key={city.value}
                      onClick={() => handleCityChange(city.value)}
                      sx={{
                        px: 0,
                        cursor: 'pointer',
                        borderBottom: '1px solid rgb(221,221,221)',
                        background: 'white',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                      component="div"
                    >
                      <ListItemText primary={city.label} sx={globalStyles} />
                      {selectedCity === city.value && <SelectedIcon />}
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Date Filter */}
          <Accordion
            expanded={expanded === 'date'}
            onChange={handleAccordionChange('date')}
            sx={{
              boxShadow: 'none',
              '&:before': { display: 'none' },
              borderBottom: '1px solid #e0e0e0',
              position: 'relative',
              border: expanded === 'date' ? '1px solid #e0e0e0' : '',
              borderRadius: expanded === 'date' ? 2 : '',
              py: expanded === 'date' ? 0 : ''
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 2,
                backgroundColor: 'white',
                zIndex: 4,
                height: '64px',
                minHeight: '64px',
                '& .MuiAccordionSummary-content': {
                  margin: '0 !important',
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  alignSelf: 'center',
                  position: 'relative',
                  top: 0,
                  transform: 'none',
                  '&.Mui-expanded': {
                    transform: 'rotate(180deg)',
                  },
                },
                borderRadius: 2,
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <Box sx={{ width: '100%', ...globalStyles }}>
                <Typography variant="body1" fontWeight="600" sx={{ fontFamily: 'Poppins, sans-serif', color: '#000000' }}>Date</Typography>
                <Typography variant="body2" fontWeight="400" sx={{mt:0.5,color: '#757575', ...globalStyles }}>{getSelectedDateRange()}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{
              px: 1,
              pt: 0,
              mt: 2,
              borderRadius: 2,
              position: 'absolute',
              width: '100%',
              backgroundColor: 'white',
              boxShadow: 4,
              zIndex: 5,
              ...globalStyles,
            }}>
              <List sx={{ width: '100%', p: 0, ...globalStyles }}>
                {DATE_RANGES.map((option) => (
                  <ListItem
                    key={option.value}
                    onClick={() => handleTimeRangeChange(option.value)}
                    sx={{
                      px: 0,
                      cursor: 'pointer',
                      borderBottom: '1px solid rgb(221,221,221)',
                      background: 'white',
                      '&:hover': { backgroundColor: 'rgb(255, 255, 255)' },
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                    component="div"
                  >
                    <span>{option.label}</span>
                    {(option.value === filters.timeRange || (filters.timeRange === undefined && option.value === 7)) && <SelectedIcon />}
                    {option.value === -1 && !isPremium && (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.99967 11.4582C10.3449 11.4582 10.6247 11.738 10.6247 12.0832V13.7498C10.6247 14.095 10.3449 14.3748 9.99967 14.3748C9.6545 14.3748 9.37467 14.095 9.37467 13.7498V12.0832C9.37467 11.738 9.6545 11.4582 9.99967 11.4582Z" fill="#E7B119" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M5.62467 7.04908V5.4165C5.62467 3.00026 7.58343 1.0415 9.99967 1.0415C12.4159 1.0415 14.3747 3.00026 14.3747 5.4165V7.04908C15.7837 7.38554 16.8655 8.58187 17.0626 10.0458C17.186 10.9628 17.2913 11.9264 17.2913 12.9165C17.2913 13.9066 17.186 14.8702 17.0626 15.7872C16.8363 17.468 15.4437 18.7961 13.7287 18.8749C12.5383 18.9297 11.3295 18.9582 9.99968 18.9582C8.66981 18.9582 7.46104 18.9297 6.27069 18.8749C4.55564 18.7961 3.16308 17.468 2.93677 15.7872C2.81331 14.8702 2.70801 13.9066 2.70801 12.9165C2.70801 11.9264 2.81331 10.9628 2.93677 10.0458C3.13388 8.58187 4.21567 7.38554 5.62467 7.04908ZM6.87467 5.4165C6.87467 3.69061 8.27378 2.2915 9.99967 2.2915C11.7256 2.2915 13.1247 3.69061 13.1247 5.4165V6.93265C12.1274 6.89455 11.1054 6.87484 9.99968 6.87484C8.89397 6.87484 7.87198 6.89455 6.87467 6.93265V5.4165ZM9.99968 8.12484C8.68838 8.12484 7.49876 8.15294 6.32809 8.20676C5.23726 8.2569 4.32409 9.10973 4.17559 10.2126C4.05445 11.1124 3.95801 12.0106 3.95801 12.9165C3.95801 13.8224 4.05445 14.7206 4.17559 15.6204C4.32409 16.7233 5.23726 17.5761 6.32809 17.6263C7.49876 17.6801 8.68838 17.7082 9.99968 17.7082C11.311 17.7082 12.5006 17.6801 13.6713 17.6263C14.7621 17.5761 15.6753 16.7233 15.8238 15.6204C15.9449 14.7206 16.0413 13.8224 16.0413 12.9165C16.0413 12.0106 15.9449 11.1124 15.8238 10.2126C15.6753 9.10973 14.7621 8.2569 13.6713 8.20676C12.5006 8.15294 11.311 8.12484 9.99968 8.12484Z" fill="#E7B119" />
                      </svg>
                    )}
                  </ListItem>
                ))}
              </List>

              {filters.timeRange === -1 && isPremium && (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <DatePicker
                      label="From Date"
                      value={filters.customDateFrom}
                      onChange={(newValue) => {
                        onFilterChange({
                          ...filters,
                          customDateFrom: newValue
                        });
                      }}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                    <DatePicker
                      label="To Date"
                      value={filters.customDateTo}
                      onChange={(newValue) => {
                        onFilterChange({
                          ...filters,
                          customDateTo: newValue
                        });
                      }}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>
                </LocalizationProvider>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Impacted Level Filter */}
          <Accordion
            expanded={expanded === 'impactLevel'}
            onChange={handleAccordionChange('impactLevel')}
            sx={{
              boxShadow: 'none',
              '&:before': { display: 'none' },
              borderBottom: '1px solid #e0e0e0',
              position: 'relative',
              border: expanded === 'impactLevel' ? '1px solid #e0e0e0' : '',
              borderRadius: expanded === 'impactLevel' ? 2 : '',
              py: expanded === 'impactLevel' ? 0 : ''
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 2,
                backgroundColor: 'white',
                zIndex: 4,
                height: '64px',
                minHeight: '64px',
                '& .MuiAccordionSummary-content': {
                  margin: '0 !important',
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  alignSelf: 'center',
                  position: 'relative',
                  top: 0,
                  transform: 'none',
                  '&.Mui-expanded': {
                    transform: 'rotate(180deg)',
                  },
                },
                borderRadius: 2,
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <Box sx={{ width: '100%', ...globalStyles }}>
                <Typography variant="body1" fontWeight="600" sx={{ fontFamily: 'Poppins, sans-serif', color: '#000000' }}>Impact Level</Typography>
                <Typography variant="body2" fontWeight="400" sx={{mt:0.5,color: '#757575', ...globalStyles }}>{getSelectedImpactLevel()}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{
              px: 1,
              pt: 0,
              mt: 2,
              borderRadius: 2,
              position: 'absolute',
              width: '100%',
              backgroundColor: 'white',
              boxShadow: 4,
              zIndex: 5,
              ...globalStyles,
            }}>
              <List sx={{ width: '100%', p: 0, ...globalStyles }}>
                <ListItem
                  onClick={() => handleImpactLevelChange('')}
                  sx={{
                    px: 0,
                    cursor: 'pointer',
                    borderBottom: '1px solid rgb(221,221,221)',
                    background: 'white',
                    '&:hover': { backgroundColor: 'rgb(255, 255, 255)' },
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                  component="div"
                >
                  <ListItemText primary="All" sx={globalStyles} />
                  {(!filters.impactLevel || filters.impactLevel.length === 0) && <SelectedIcon />}
                </ListItem>
                {IMPACT_LEVELS.map((level) => (
                  <ListItem
                    key={level.value}
                    onClick={() => handleImpactLevelChange(level.value)}
                    sx={{
                      px: 0,
                      cursor: 'pointer',
                      borderBottom: '1px solid rgb(221,221,221)',
                      background: 'white',
                      '&:hover': { backgroundColor: 'rgb(255, 255, 255)' },
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                    component="div"
                  >
                    <ListItemText primary={level.label} sx={globalStyles} />
                    {filters.impactLevel?.includes(level.value as "Low" | "Moderate" | "High") && <SelectedIcon />}
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Sort By Filter */}
          <Accordion
            expanded={expanded === 'sortBy'}
            onChange={handleAccordionChange('sortBy')}
            sx={{
              boxShadow: 'none',
              '&:before': { display: 'none' },
              borderBottom: '1px solid #e0e0e0',
              position: 'relative',
              border: expanded === 'sortBy' ? '1px solid #e0e0e0' : '',
              borderRadius: expanded === 'sortBy' ? 2 : '',
              py: expanded === 'sortBy' ? 0 : ''
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 2,
                backgroundColor: 'white',
                zIndex: 4,
                height: '64px',
                minHeight: '64px',
                '& .MuiAccordionSummary-content': {
                  margin: '0 !important',
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  alignSelf: 'center',
                  position: 'relative',
                  top: 0,
                  transform: 'none',
                  '&.Mui-expanded': {
                    transform: 'rotate(180deg)',
                  },
                },
                borderRadius: 2,
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <Box sx={{ width: '100%', ...globalStyles }}>

                <Typography variant="body1" fontWeight="600" sx={{ fontFamily: 'Poppins, sans-serif', color: '#000000' }}>Sort by</Typography>
                <Typography variant="body2" fontWeight="400" sx={{mt:0.5,color: '#757575', ...globalStyles }}>{getSelectedSortOption()}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{
              px: 1,
              pt: 0,
              mt: 2,
              borderRadius: 2,
              position: 'absolute',
              width: '100%',
              backgroundColor: 'white',
              boxShadow: 4,
              zIndex: 5,
              ...globalStyles,
            }}>
              <List sx={{ width: '100%', p: 0, ...globalStyles }}>
                {SORT_OPTIONS.map((option) => (
                  <ListItem
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    sx={{
                      py: 0.5,
                      px: 0,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                      display: 'flex',
                      justifyContent: 'space-between',
                borderBottom: '1px solid #e0e0e0',
                    }}
                    component="div"
                  >
                    <ListItemText primary={option.label} sx={globalStyles} />
                    {filters.sortBy === option.value && <SelectedIcon />}
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>
{/* 
        {!isAuthenticated && (
          <>
            <Box
              sx={{ p: 1, my: 1, cursor: 'pointer', display: { xs: 'block', md: 'none' } }}
              onClick={() => {
                window.location.href = '/login';
              }}
            >
              <svg width="345" height="96" viewBox="0 0 345 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="344" height="95" rx="12.5" fill="#FDF7E8" />
                <rect x="0.5" y="0.5" width="344" height="95" rx="12.5" stroke="#F5DFA1" />
                <path fillRule="evenodd" clipRule="evenodd" d="M70.375 22.0624C70.375 20.6127 71.5503 19.4374 73 19.4374C74.0785 19.4374 74.9922 20.2859 75.2885 21.1746C75.4195 21.5676 75.8442 21.7799 76.2372 21.649C76.6301 21.518 76.8425 21.0932 76.7115 20.7003C76.2578 19.339 74.8604 17.9374 73 17.9374C70.7218 17.9374 68.875 19.7843 68.875 22.0624V23.3953C67.6992 23.7551 66.8119 24.7895 66.6434 26.0413C66.5323 26.8666 66.4375 27.7338 66.4375 28.6249C66.4375 29.5161 66.5323 30.3833 66.6434 31.2086C66.8471 32.7213 68.1004 33.9166 69.6439 33.9875C70.7152 34.0368 71.8031 34.0624 73 34.0624C74.1969 34.0624 75.2848 34.0368 76.3561 33.9875C77.8996 33.9166 79.1529 32.7213 79.3566 31.2086C79.4677 30.3833 79.5625 29.5161 79.5625 28.6249C79.5625 27.7338 79.4677 26.8666 79.3566 26.0413C79.1529 24.5286 77.8996 23.3333 76.3561 23.2624C75.2848 23.2131 74.1969 23.1874 73 23.1874C72.074 23.1874 71.2133 23.2028 70.375 23.2326V22.0624ZM73 27.1249C73.4142 27.1249 73.75 27.4607 73.75 27.8749V29.3749C73.75 29.7892 73.4142 30.1249 73 30.1249C72.5858 30.1249 72.25 29.7892 72.25 29.3749V27.8749C72.25 27.4607 72.5858 27.1249 73 27.1249Z" fill="#E7B119" />
                <path d="M91.7424 21.8182H93.2836V28.5149C93.2836 29.2275 93.1162 29.8589 92.7814 30.4091C92.4467 30.956 91.976 31.3868 91.3695 31.7017C90.763 32.0133 90.052 32.169 89.2367 32.169C88.4247 32.169 87.7154 32.0133 87.1088 31.7017C86.5023 31.3868 86.0317 30.956 85.6969 30.4091C85.3622 29.8589 85.1948 29.2275 85.1948 28.5149V21.8182H86.731V28.3906C86.731 28.8513 86.8321 29.2607 87.0343 29.6186C87.2398 29.9766 87.5298 30.2583 87.9043 30.4638C88.2788 30.666 88.723 30.767 89.2367 30.767C89.7537 30.767 90.1995 30.666 90.574 30.4638C90.9519 30.2583 91.2402 29.9766 91.4391 29.6186C91.6413 29.2607 91.7424 28.8513 91.7424 28.3906V21.8182ZM96.8842 27.4659V32H95.3977V24.3636H96.8246V25.6065H96.919C97.0947 25.2022 97.3698 24.8774 97.7443 24.6321C98.1222 24.3868 98.5978 24.2642 99.1712 24.2642C99.6915 24.2642 100.147 24.3736 100.538 24.5923C100.929 24.8078 101.233 25.1293 101.448 25.5568C101.664 25.9844 101.771 26.513 101.771 27.1428V32H100.285V27.3217C100.285 26.7682 100.141 26.3357 99.8523 26.0241C99.5639 25.7093 99.1679 25.5518 98.6641 25.5518C98.3194 25.5518 98.0128 25.6264 97.7443 25.7756C97.4792 25.9247 97.2687 26.1435 97.1129 26.4318C96.9605 26.7169 96.8842 27.0616 96.8842 27.4659ZM105.251 21.8182V32H103.765V21.8182H105.251ZM110.468 32.1541C109.752 32.1541 109.127 31.9901 108.594 31.6619C108.06 31.3338 107.646 30.8748 107.351 30.2848C107.056 29.6948 106.908 29.0054 106.908 28.2166C106.908 27.4245 107.056 26.7318 107.351 26.1385C107.646 25.5452 108.06 25.0845 108.594 24.7564C109.127 24.4283 109.752 24.2642 110.468 24.2642C111.184 24.2642 111.809 24.4283 112.342 24.7564C112.876 25.0845 113.29 25.5452 113.585 26.1385C113.88 26.7318 114.028 27.4245 114.028 28.2166C114.028 29.0054 113.88 29.6948 113.585 30.2848C113.29 30.8748 112.876 31.3338 112.342 31.6619C111.809 31.9901 111.184 32.1541 110.468 32.1541ZM110.473 30.9062C110.937 30.9062 111.321 30.7836 111.626 30.5384C111.931 30.2931 112.157 29.9666 112.302 29.5589C112.452 29.1513 112.526 28.7022 112.526 28.2116C112.526 27.7244 112.452 27.277 112.302 26.8693C112.157 26.4583 111.931 26.1286 111.626 25.88C111.321 25.6314 110.937 25.5071 110.473 25.5071C110.006 25.5071 109.618 25.6314 109.309 25.88C109.005 26.1286 108.778 26.4583 108.628 26.8693C108.483 27.277 108.41 27.7244 108.41 28.2116C108.41 28.7022 108.483 29.1513 108.628 29.5589C108.778 29.9666 109.005 30.2931 109.309 30.5384C109.618 30.7836 110.006 30.9062 110.473 30.9062ZM118.903 32.1541C118.164 32.1541 117.528 31.9867 116.994 31.652C116.464 31.3139 116.056 30.8482 115.771 30.255C115.486 29.6617 115.344 28.9822 115.344 28.2166C115.344 27.4411 115.49 26.7566 115.781 26.1634C116.073 25.5668 116.484 25.1011 117.014 24.7663C117.545 24.4316 118.169 24.2642 118.888 24.2642C119.469 24.2642 119.986 24.3719 120.44 24.5874C120.894 24.7995 121.26 25.0978 121.538 25.4822C121.82 25.8667 121.987 26.3158 122.04 26.8295H120.594C120.514 26.4716 120.332 26.1634 120.047 25.9048C119.765 25.6463 119.387 25.517 118.913 25.517C118.499 25.517 118.136 25.6264 117.825 25.8452C117.516 26.0606 117.276 26.3688 117.104 26.7699C116.931 27.1676 116.845 27.6383 116.845 28.1818C116.845 28.7386 116.93 29.2192 117.099 29.6236C117.268 30.0279 117.506 30.3411 117.815 30.5632C118.126 30.7853 118.492 30.8963 118.913 30.8963C119.195 30.8963 119.45 30.8449 119.679 30.7422C119.911 30.6361 120.105 30.4853 120.261 30.2898C120.42 30.0942 120.531 29.8589 120.594 29.5838H122.04C121.987 30.0777 121.827 30.5185 121.558 30.9062C121.29 31.294 120.93 31.599 120.479 31.821C120.032 32.0431 119.507 32.1541 118.903 32.1541ZM124.997 29.4098L124.987 27.5952H125.246L128.289 24.3636H130.068L126.598 28.0426H126.365L124.997 29.4098ZM123.63 32V21.8182H125.117V32H123.63ZM128.453 32L125.718 28.3707L126.742 27.3317L130.277 32H128.453ZM138.762 24.3636V25.5568H134.447V24.3636H138.762ZM135.63 32V23.4787C135.63 23.0014 135.735 22.6053 135.944 22.2905C136.152 21.9723 136.429 21.7353 136.774 21.5795C137.118 21.4205 137.493 21.3409 137.897 21.3409C138.196 21.3409 138.451 21.3658 138.663 21.4155C138.875 21.4619 139.033 21.505 139.135 21.5447L138.787 22.7479C138.718 22.728 138.628 22.7048 138.519 22.6783C138.409 22.6484 138.277 22.6335 138.121 22.6335C137.76 22.6335 137.501 22.723 137.346 22.902C137.193 23.081 137.117 23.3395 137.117 23.6776V32H135.63ZM140.296 32V24.3636H141.783V32H140.296ZM141.047 23.1854C140.788 23.1854 140.566 23.0992 140.381 22.9268C140.198 22.7512 140.107 22.5424 140.107 22.3004C140.107 22.0552 140.198 21.8464 140.381 21.674C140.566 21.4983 140.788 21.4105 141.047 21.4105C141.305 21.4105 141.526 21.4983 141.708 21.674C141.894 21.8464 141.987 22.0552 141.987 22.3004C141.987 22.5424 141.894 22.7512 141.708 22.9268C141.526 23.0992 141.305 23.1854 141.047 23.1854ZM145.269 21.8182V32H143.782V21.8182H145.269ZM150.833 24.3636V25.5568H146.662V24.3636H150.833ZM147.781 22.5341H149.267V29.7578C149.267 30.0462 149.31 30.2633 149.397 30.4091C149.483 30.5516 149.594 30.6494 149.73 30.7024C149.869 30.7521 150.02 30.777 150.182 30.777C150.301 30.777 150.406 30.7687 150.495 30.7521C150.585 30.7356 150.654 30.7223 150.704 30.7124L150.973 31.9403C150.886 31.9735 150.764 32.0066 150.605 32.0398C150.446 32.0762 150.247 32.0961 150.008 32.0994C149.617 32.1061 149.252 32.0365 148.914 31.8906C148.576 31.7448 148.303 31.5194 148.094 31.2145C147.885 30.9096 147.781 30.5268 147.781 30.0661V22.5341ZM155.687 32.1541C154.935 32.1541 154.287 31.9934 153.743 31.6719C153.203 31.3471 152.785 30.8913 152.49 30.3047C152.199 29.7147 152.053 29.0237 152.053 28.2315C152.053 27.4493 152.199 26.7599 152.49 26.1634C152.785 25.5668 153.196 25.1011 153.723 24.7663C154.253 24.4316 154.873 24.2642 155.583 24.2642C156.013 24.2642 156.431 24.3355 156.835 24.478C157.24 24.6205 157.603 24.8442 157.924 25.1491C158.246 25.4541 158.499 25.8501 158.685 26.3374C158.87 26.8213 158.963 27.4096 158.963 28.1023V28.6293H152.893V27.5156H157.507C157.507 27.1245 157.427 26.7782 157.268 26.4766C157.109 26.1716 156.885 25.9313 156.597 25.7557C156.312 25.58 155.977 25.4922 155.593 25.4922C155.175 25.4922 154.81 25.5949 154.499 25.8004C154.191 26.0026 153.952 26.2678 153.783 26.5959C153.617 26.9207 153.534 27.2737 153.534 27.6548V28.5249C153.534 29.0353 153.624 29.4695 153.803 29.8274C153.985 30.1854 154.239 30.4588 154.563 30.6477C154.888 30.8333 155.268 30.9261 155.702 30.9261C155.984 30.9261 156.24 30.8864 156.472 30.8068C156.704 30.724 156.905 30.6013 157.074 30.4389C157.243 30.2765 157.372 30.076 157.462 29.8374L158.869 30.0909C158.756 30.5052 158.554 30.8681 158.262 31.1797C157.974 31.4879 157.611 31.7282 157.173 31.9006C156.739 32.0696 156.244 32.1541 155.687 32.1541ZM160.613 32V24.3636H162.049V25.5767H162.129C162.268 25.1657 162.513 24.8426 162.865 24.6072C163.219 24.3686 163.62 24.2493 164.068 24.2493C164.161 24.2493 164.27 24.2526 164.396 24.2592C164.525 24.2659 164.626 24.2741 164.699 24.2841V25.706C164.64 25.6894 164.533 25.6712 164.381 25.6513C164.229 25.6281 164.076 25.6165 163.924 25.6165C163.572 25.6165 163.259 25.6911 162.984 25.8402C162.712 25.986 162.497 26.1899 162.338 26.4517C162.179 26.7102 162.099 27.0052 162.099 27.3366V32H160.613ZM171.708 26.228L170.361 26.4666C170.304 26.2943 170.215 26.1302 170.092 25.9744C169.973 25.8187 169.81 25.6911 169.605 25.5916C169.399 25.4922 169.143 25.4425 168.834 25.4425C168.413 25.4425 168.062 25.5369 167.78 25.7259C167.499 25.9115 167.358 26.1518 167.358 26.4467C167.358 26.7019 167.452 26.9074 167.641 27.0632C167.83 27.219 168.135 27.3466 168.556 27.446L169.769 27.7244C170.472 27.8868 170.995 28.1371 171.34 28.4751C171.685 28.8132 171.857 29.2524 171.857 29.7926C171.857 30.25 171.724 30.6577 171.459 31.0156C171.198 31.3703 170.831 31.6487 170.361 31.8509C169.893 32.053 169.351 32.1541 168.735 32.1541C167.88 32.1541 167.182 31.9718 166.642 31.6072C166.102 31.2393 165.77 30.7173 165.648 30.0412L167.084 29.8224C167.174 30.197 167.358 30.4804 167.636 30.6726C167.915 30.8615 168.278 30.956 168.725 30.956C169.212 30.956 169.602 30.8549 169.893 30.6527C170.185 30.4472 170.331 30.197 170.331 29.902C170.331 29.6634 170.241 29.4628 170.062 29.3004C169.887 29.138 169.617 29.0154 169.252 28.9325L167.959 28.6491C167.247 28.4867 166.72 28.2282 166.378 27.8736C166.04 27.5189 165.871 27.0698 165.871 26.5263C165.871 26.0755 165.997 25.6811 166.249 25.343C166.501 25.005 166.849 24.7415 167.293 24.5526C167.737 24.3603 168.246 24.2642 168.819 24.2642C169.645 24.2642 170.294 24.4432 170.768 24.8011C171.242 25.1558 171.555 25.6314 171.708 26.228ZM179.419 32.169C178.935 32.169 178.497 32.0795 178.106 31.9006C177.715 31.7183 177.405 31.4548 177.177 31.1101C176.951 30.7654 176.839 30.3428 176.839 29.8423C176.839 29.4115 176.921 29.0568 177.087 28.7784C177.253 28.5 177.477 28.2796 177.758 28.1172C178.04 27.9548 178.355 27.8321 178.703 27.7493C179.051 27.6664 179.406 27.6035 179.767 27.5604C180.224 27.5073 180.595 27.4643 180.881 27.4311C181.166 27.3946 181.373 27.3366 181.502 27.2571C181.631 27.1776 181.696 27.0483 181.696 26.8693V26.8345C181.696 26.4003 181.573 26.0639 181.328 25.8253C181.086 25.5866 180.725 25.4673 180.244 25.4673C179.744 25.4673 179.349 25.5784 179.061 25.8004C178.776 26.0192 178.579 26.2628 178.469 26.5312L177.072 26.2131C177.238 25.7491 177.48 25.3745 177.798 25.0895C178.12 24.8011 178.489 24.5923 178.907 24.4631C179.324 24.3305 179.764 24.2642 180.224 24.2642C180.529 24.2642 180.852 24.3007 181.194 24.3736C181.538 24.4432 181.86 24.5724 182.158 24.7614C182.46 24.9503 182.707 25.2204 182.899 25.5717C183.091 25.9197 183.187 26.3722 183.187 26.929V32H181.736V30.956H181.676C181.58 31.1482 181.436 31.3371 181.243 31.5227C181.051 31.7083 180.804 31.8625 180.503 31.9851C180.201 32.1077 179.84 32.169 179.419 32.169ZM179.742 30.9759C180.153 30.9759 180.504 30.8946 180.796 30.7322C181.091 30.5698 181.315 30.3577 181.467 30.0959C181.623 29.8307 181.701 29.5473 181.701 29.2457V28.2614C181.648 28.3144 181.545 28.3641 181.393 28.4105C181.243 28.4536 181.073 28.4917 180.881 28.5249C180.688 28.5547 180.501 28.5829 180.319 28.6094C180.136 28.6326 179.984 28.6525 179.861 28.669C179.573 28.7055 179.309 28.7668 179.071 28.853C178.836 28.9392 178.647 29.0634 178.504 29.2259C178.365 29.3849 178.295 29.5971 178.295 29.8622C178.295 30.2301 178.431 30.5085 178.703 30.6974C178.975 30.883 179.321 30.9759 179.742 30.9759ZM186.654 27.4659V32H185.167V24.3636H186.594V25.6065H186.689C186.864 25.2022 187.139 24.8774 187.514 24.6321C187.892 24.3868 188.367 24.2642 188.941 24.2642C189.461 24.2642 189.917 24.3736 190.308 24.5923C190.699 24.8078 191.002 25.1293 191.218 25.5568C191.433 25.9844 191.541 26.513 191.541 27.1428V32H190.054V27.3217C190.054 26.7682 189.91 26.3357 189.622 26.0241C189.333 25.7093 188.937 25.5518 188.434 25.5518C188.089 25.5518 187.782 25.6264 187.514 25.7756C187.249 25.9247 187.038 26.1435 186.882 26.4318C186.73 26.7169 186.654 27.0616 186.654 27.4659ZM196.393 32.1491C195.777 32.1491 195.226 31.9917 194.743 31.6768C194.262 31.3587 193.884 30.9062 193.609 30.3196C193.337 29.7296 193.201 29.022 193.201 28.1967C193.201 27.3714 193.339 26.6655 193.614 26.0788C193.892 25.4922 194.274 25.0431 194.757 24.7315C195.241 24.42 195.79 24.2642 196.403 24.2642C196.877 24.2642 197.258 24.3438 197.547 24.5028C197.838 24.6586 198.064 24.8409 198.223 25.0497C198.385 25.2585 198.511 25.4425 198.6 25.6016H198.69V21.8182H200.176V32H198.725V30.8118H198.6C198.511 30.9742 198.382 31.1598 198.213 31.3686C198.047 31.5774 197.818 31.7597 197.527 31.9155C197.235 32.0713 196.857 32.1491 196.393 32.1491ZM196.721 30.8814C197.149 30.8814 197.51 30.7687 197.805 30.5433C198.103 30.3146 198.329 29.9981 198.481 29.5938C198.637 29.1894 198.715 28.7187 198.715 28.1818C198.715 27.6515 198.639 27.1875 198.486 26.7898C198.334 26.392 198.11 26.0821 197.815 25.8601C197.52 25.638 197.155 25.527 196.721 25.527C196.274 25.527 195.901 25.643 195.603 25.875C195.304 26.107 195.079 26.4235 194.926 26.8246C194.777 27.2256 194.703 27.678 194.703 28.1818C194.703 28.6922 194.779 29.1513 194.931 29.5589C195.084 29.9666 195.309 30.2898 195.608 30.5284C195.909 30.7637 196.28 30.8814 196.721 30.8814ZM206.003 32V24.3636H207.43V25.6065H207.525C207.684 25.1856 207.944 24.8575 208.305 24.6222C208.666 24.3835 209.099 24.2642 209.603 24.2642C210.113 24.2642 210.541 24.3835 210.885 24.6222C211.233 24.8608 211.49 25.1889 211.656 25.6065H211.735C211.918 25.1989 212.208 24.8741 212.605 24.6321C213.003 24.3868 213.477 24.2642 214.027 24.2642C214.72 24.2642 215.285 24.4813 215.723 24.9155C216.163 25.3497 216.384 26.0043 216.384 26.8793V32H214.897V27.0185C214.897 26.5014 214.757 26.1269 214.475 25.8949C214.193 25.6629 213.857 25.5469 213.466 25.5469C212.982 25.5469 212.605 25.696 212.337 25.9943C212.069 26.2893 211.934 26.6688 211.934 27.1328V32H210.453V26.924C210.453 26.5097 210.324 26.1766 210.065 25.9247C209.806 25.6728 209.47 25.5469 209.056 25.5469C208.774 25.5469 208.514 25.6214 208.275 25.7706C208.04 25.9164 207.849 26.1203 207.703 26.3821C207.561 26.6439 207.49 26.9472 207.49 27.2919V32H206.003ZM221.593 32.1541C220.877 32.1541 220.252 31.9901 219.719 31.6619C219.185 31.3338 218.771 30.8748 218.476 30.2848C218.181 29.6948 218.033 29.0054 218.033 28.2166C218.033 27.4245 218.181 26.7318 218.476 26.1385C218.771 25.5452 219.185 25.0845 219.719 24.7564C220.252 24.4283 220.877 24.2642 221.593 24.2642C222.309 24.2642 222.934 24.4283 223.467 24.7564C224.001 25.0845 224.415 25.5452 224.71 26.1385C225.005 26.7318 225.153 27.4245 225.153 28.2166C225.153 29.0054 225.005 29.6948 224.71 30.2848C224.415 30.8748 224.001 31.3338 223.467 31.6619C222.934 31.9901 222.309 32.1541 221.593 32.1541ZM221.598 30.9062C222.062 30.9062 222.446 30.7836 222.751 30.5384C223.056 30.2931 223.282 29.9666 223.427 29.5589C223.577 29.1513 223.651 28.7022 223.651 28.2116C223.651 27.7244 223.577 27.277 223.427 26.8693C223.282 26.4583 223.056 26.1286 222.751 25.88C222.446 25.6314 222.062 25.5071 221.598 25.5071C221.131 25.5071 220.743 25.6314 220.434 25.88C220.13 26.1286 219.903 26.4583 219.753 26.8693C219.608 27.277 219.535 27.7244 219.535 28.2116C219.535 28.7022 219.608 29.1513 219.753 29.5589C219.903 29.9666 220.13 30.2931 220.434 30.5384C220.743 30.7836 221.131 30.9062 221.598 30.9062ZM226.812 32V24.3636H228.249V25.5767H228.328C228.467 25.1657 228.713 24.8426 229.064 24.6072C229.419 24.3686 229.82 24.2493 230.267 24.2493C230.36 24.2493 230.469 24.2526 230.595 24.2592C230.724 24.2659 230.826 24.2741 230.898 24.2841V25.706C230.839 25.6894 230.733 25.6712 230.58 25.6513C230.428 25.6281 230.275 25.6165 230.123 25.6165C229.772 25.6165 229.458 25.6911 229.183 25.8402C228.911 25.986 228.696 26.1899 228.537 26.4517C228.378 26.7102 228.298 27.0052 228.298 27.3366V32H226.812ZM235.203 32.1541C234.45 32.1541 233.802 31.9934 233.259 31.6719C232.718 31.3471 232.301 30.8913 232.006 30.3047C231.714 29.7147 231.568 29.0237 231.568 28.2315C231.568 27.4493 231.714 26.7599 232.006 26.1634C232.301 25.5668 232.712 25.1011 233.239 24.7663C233.769 24.4316 234.389 24.2642 235.098 24.2642C235.529 24.2642 235.947 24.3355 236.351 24.478C236.755 24.6205 237.118 24.8442 237.44 25.1491C237.761 25.4541 238.015 25.8501 238.2 26.3374C238.386 26.8213 238.479 27.4096 238.479 28.1023V28.6293H232.409V27.5156H237.022C237.022 27.1245 236.943 26.7782 236.784 26.4766C236.624 26.1716 236.401 25.9313 236.112 25.7557C235.827 25.58 235.493 25.4922 235.108 25.4922C234.691 25.4922 234.326 25.5949 234.014 25.8004C233.706 26.0026 233.468 26.2678 233.298 26.5959C233.133 26.9207 233.05 27.2737 233.05 27.6548V28.5249C233.05 29.0353 233.139 29.4695 233.318 29.8274C233.501 30.1854 233.754 30.4588 234.079 30.6477C234.404 30.8333 234.783 30.9261 235.218 30.9261C235.499 30.9261 235.756 30.8864 235.988 30.8068C236.22 30.724 236.421 30.6013 236.59 30.4389C236.759 30.2765 236.888 30.076 236.977 29.8374L238.384 30.0909C238.272 30.5052 238.07 30.8681 237.778 31.1797C237.49 31.4879 237.127 31.7282 236.689 31.9006C236.255 32.0696 235.759 32.1541 235.203 32.1541ZM246.056 32.169C245.572 32.169 245.134 32.0795 244.743 31.9006C244.352 31.7183 244.042 31.4548 243.813 31.1101C243.588 30.7654 243.475 30.3428 243.475 29.8423C243.475 29.4115 243.558 29.0568 243.724 28.7784C243.89 28.5 244.113 28.2796 244.395 28.1172C244.677 27.9548 244.992 27.8321 245.34 27.7493C245.688 27.6664 246.042 27.6035 246.404 27.5604C246.861 27.5073 247.232 27.4643 247.517 27.4311C247.802 27.3946 248.009 27.3366 248.139 27.2571C248.268 27.1776 248.333 27.0483 248.333 26.8693V26.8345C248.333 26.4003 248.21 26.0639 247.965 25.8253C247.723 25.5866 247.361 25.4673 246.881 25.4673C246.38 25.4673 245.986 25.5784 245.698 25.8004C245.413 26.0192 245.215 26.2628 245.106 26.5312L243.709 26.2131C243.875 25.7491 244.117 25.3745 244.435 25.0895C244.756 24.8011 245.126 24.5923 245.544 24.4631C245.961 24.3305 246.4 24.2642 246.861 24.2642C247.166 24.2642 247.489 24.3007 247.83 24.3736C248.175 24.4432 248.497 24.5724 248.795 24.7614C249.097 24.9503 249.343 25.2204 249.536 25.5717C249.728 25.9197 249.824 26.3722 249.824 26.929V32H248.372V30.956H248.313C248.217 31.1482 248.072 31.3371 247.88 31.5227C247.688 31.7083 247.441 31.8625 247.139 31.9851C246.838 32.1077 246.477 32.169 246.056 32.169ZM246.379 30.9759C246.79 30.9759 247.141 30.8946 247.433 30.7322C247.728 30.5698 247.951 30.3577 248.104 30.0959C248.26 29.8307 248.338 29.5473 248.338 29.2457V28.2614C248.285 28.3144 248.182 28.3641 248.029 28.4105C247.88 28.4536 247.709 28.4917 247.517 28.5249C247.325 28.5547 247.138 28.5829 246.955 28.6094C246.773 28.6326 246.621 28.6525 246.498 28.669C246.21 28.7055 245.946 28.7668 245.708 28.853C245.472 28.9392 245.283 29.0634 245.141 29.2259C245.002 29.3849 244.932 29.5971 244.932 29.8622C244.932 30.2301 245.068 30.5085 245.34 30.6974C245.611 30.883 245.958 30.9759 246.379 30.9759ZM253.29 21.8182V32H251.804V21.8182H253.29ZM258.581 32.1541C257.829 32.1541 257.181 31.9934 256.638 31.6719C256.097 31.3471 255.68 30.8913 255.385 30.3047C255.093 29.7147 254.947 29.0237 254.947 28.2315C254.947 27.4493 255.093 26.7599 255.385 26.1634C255.68 25.5668 256.091 25.1011 256.618 24.7663C257.148 24.4316 257.768 24.2642 258.477 24.2642C258.908 24.2642 259.326 24.3355 259.73 24.478C260.134 24.6205 260.497 24.8442 260.819 25.1491C261.14 25.4541 261.394 25.8501 261.579 26.3374C261.765 26.8213 261.858 27.4096 261.858 28.1023V28.6293H255.787V27.5156H260.401C260.401 27.1245 260.322 26.7782 260.162 26.4766C260.003 26.1716 259.78 25.9313 259.491 25.7557C259.206 25.58 258.872 25.4922 258.487 25.4922C258.069 25.4922 257.705 25.5949 257.393 25.8004C257.085 26.0026 256.846 26.2678 256.677 26.5959C256.512 26.9207 256.429 27.2737 256.429 27.6548V28.5249C256.429 29.0353 256.518 29.4695 256.697 29.8274C256.88 30.1854 257.133 30.4588 257.458 30.6477C257.783 30.8333 258.162 30.9261 258.596 30.9261C258.878 30.9261 259.135 30.8864 259.367 30.8068C259.599 30.724 259.8 30.6013 259.969 30.4389C260.138 30.2765 260.267 30.076 260.356 29.8374L261.763 30.0909C261.651 30.5052 261.448 30.8681 261.157 31.1797C260.868 31.4879 260.506 31.7282 260.068 31.9006C259.634 32.0696 259.138 32.1541 258.581 32.1541ZM263.507 32V24.3636H264.944V25.5767H265.023C265.163 25.1657 265.408 24.8426 265.759 24.6072C266.114 24.3686 266.515 24.2493 266.962 24.2493C267.055 24.2493 267.165 24.2526 267.29 24.2592C267.42 24.2659 267.521 24.2741 267.594 24.2841V25.706C267.534 25.6894 267.428 25.6712 267.276 25.6513C267.123 25.6281 266.971 25.6165 266.818 25.6165C266.467 25.6165 266.154 25.6911 265.879 25.8402C265.607 25.986 265.391 26.1899 265.232 26.4517C265.073 26.7102 264.994 27.0052 264.994 27.3366V32H263.507ZM272.896 24.3636V25.5568H268.725V24.3636H272.896ZM269.843 22.5341H271.33V29.7578C271.33 30.0462 271.373 30.2633 271.459 30.4091C271.545 30.5516 271.656 30.6494 271.792 30.7024C271.931 30.7521 272.082 30.777 272.245 30.777C272.364 30.777 272.468 30.7687 272.558 30.7521C272.647 30.7356 272.717 30.7223 272.767 30.7124L273.035 31.9403C272.949 31.9735 272.826 32.0066 272.667 32.0398C272.508 32.0762 272.309 32.0961 272.071 32.0994C271.68 32.1061 271.315 32.0365 270.977 31.8906C270.639 31.7448 270.365 31.5194 270.157 31.2145C269.948 30.9096 269.843 30.5268 269.843 30.0661V22.5341ZM280.14 26.228L278.792 26.4666C278.736 26.2943 278.646 26.1302 278.524 25.9744C278.404 25.8187 278.242 25.6911 278.037 25.5916C277.831 25.4922 277.574 25.4425 277.266 25.4425C276.845 25.4425 276.494 25.5369 276.212 25.7259C275.93 25.9115 275.789 26.1518 275.789 26.4467C275.789 26.7019 275.884 26.9074 276.073 27.0632C276.262 27.219 276.567 27.3466 276.988 27.446L278.201 27.7244C278.903 27.8868 279.427 28.1371 279.772 28.4751C280.116 28.8132 280.289 29.2524 280.289 29.7926C280.289 30.25 280.156 30.6577 279.891 31.0156C279.629 31.3703 279.263 31.6487 278.792 31.8509C278.325 32.053 277.783 32.1541 277.167 32.1541C276.311 32.1541 275.614 31.9718 275.074 31.6072C274.533 31.2393 274.202 30.7173 274.079 30.0412L275.516 29.8224C275.605 30.197 275.789 30.4804 276.068 30.6726C276.346 30.8615 276.709 30.956 277.157 30.956C277.644 30.956 278.033 30.8549 278.325 30.6527C278.617 30.4472 278.762 30.197 278.762 29.902C278.762 29.6634 278.673 29.4628 278.494 29.3004C278.318 29.138 278.048 29.0154 277.684 28.9325L276.391 28.6491C275.678 28.4867 275.151 28.2282 274.81 27.8736C274.472 27.5189 274.303 27.0698 274.303 26.5263C274.303 26.0755 274.429 25.6811 274.681 25.343C274.933 25.005 275.281 24.7415 275.725 24.5526C276.169 24.3603 276.678 24.2642 277.251 24.2642C278.076 24.2642 278.726 24.4432 279.2 24.8011C279.674 25.1558 279.987 25.6314 280.14 26.228Z" fill="#616161" />
                <rect x="11" y="49" width="323" height="36" rx="8" fill="#E7B119" />
                <path d="M102.49 67.1C102.49 66.1387 102.705 65.28 103.134 64.524C103.573 63.7587 104.165 63.166 104.912 62.746C105.668 62.3167 106.513 62.102 107.446 62.102C108.538 62.102 109.495 62.382 110.316 62.942C111.137 63.502 111.711 64.2767 112.038 65.266H109.784C109.56 64.7993 109.243 64.4493 108.832 64.216C108.431 63.9827 107.964 63.866 107.432 63.866C106.863 63.866 106.354 64.0013 105.906 64.272C105.467 64.5333 105.122 64.9067 104.87 65.392C104.627 65.8773 104.506 66.4467 104.506 67.1C104.506 67.744 104.627 68.3133 104.87 68.808C105.122 69.2933 105.467 69.6713 105.906 69.942C106.354 70.2033 106.863 70.334 107.432 70.334C107.964 70.334 108.431 70.2173 108.832 69.984C109.243 69.7413 109.56 69.3867 109.784 68.92H112.038C111.711 69.9187 111.137 70.698 110.316 71.258C109.504 71.8087 108.547 72.084 107.446 72.084C106.513 72.084 105.668 71.874 104.912 71.454C104.165 71.0247 103.573 70.432 103.134 69.676C102.705 68.92 102.49 68.0613 102.49 67.1ZM115.422 65.448C115.674 65.0373 116.001 64.7153 116.402 64.482C116.813 64.2487 117.279 64.132 117.802 64.132V66.19H117.284C116.668 66.19 116.201 66.3347 115.884 66.624C115.576 66.9133 115.422 67.4173 115.422 68.136V72H113.462V64.244H115.422V65.448ZM126.082 67.954C126.082 68.234 126.064 68.486 126.026 68.71H120.356C120.403 69.27 120.599 69.7087 120.944 70.026C121.29 70.3433 121.714 70.502 122.218 70.502C122.946 70.502 123.464 70.1893 123.772 69.564H125.886C125.662 70.3107 125.233 70.9267 124.598 71.412C123.964 71.888 123.184 72.126 122.26 72.126C121.514 72.126 120.842 71.9627 120.244 71.636C119.656 71.3 119.194 70.8287 118.858 70.222C118.532 69.6153 118.368 68.9153 118.368 68.122C118.368 67.3193 118.532 66.6147 118.858 66.008C119.185 65.4013 119.642 64.9347 120.23 64.608C120.818 64.2813 121.495 64.118 122.26 64.118C122.998 64.118 123.656 64.2767 124.234 64.594C124.822 64.9113 125.275 65.364 125.592 65.952C125.919 66.5307 126.082 67.198 126.082 67.954ZM124.052 67.394C124.043 66.89 123.861 66.4887 123.506 66.19C123.152 65.882 122.718 65.728 122.204 65.728C121.719 65.728 121.308 65.8773 120.972 66.176C120.646 66.4653 120.445 66.8713 120.37 67.394H124.052ZM126.759 68.094C126.759 67.31 126.913 66.6147 127.221 66.008C127.538 65.4013 127.963 64.9347 128.495 64.608C129.036 64.2813 129.638 64.118 130.301 64.118C130.88 64.118 131.384 64.2347 131.813 64.468C132.252 64.7013 132.602 64.9953 132.863 65.35V64.244H134.837V72H132.863V70.866C132.611 71.23 132.261 71.5333 131.813 71.776C131.374 72.0093 130.866 72.126 130.287 72.126C129.634 72.126 129.036 71.958 128.495 71.622C127.963 71.286 127.538 70.8147 127.221 70.208C126.913 69.592 126.759 68.8873 126.759 68.094ZM132.863 68.122C132.863 67.646 132.77 67.24 132.583 66.904C132.396 66.5587 132.144 66.2973 131.827 66.12C131.51 65.9333 131.169 65.84 130.805 65.84C130.441 65.84 130.105 65.9287 129.797 66.106C129.489 66.2833 129.237 66.5447 129.041 66.89C128.854 67.226 128.761 67.6273 128.761 68.094C128.761 68.5607 128.854 68.9713 129.041 69.326C129.237 69.6713 129.489 69.9373 129.797 70.124C130.114 70.3107 130.45 70.404 130.805 70.404C131.169 70.404 131.51 70.3153 131.827 70.138C132.144 69.9513 132.396 69.69 132.583 69.354C132.77 69.0087 132.863 68.598 132.863 68.122ZM138.783 65.854V69.606C138.783 69.8673 138.844 70.0587 138.965 70.18C139.096 70.292 139.31 70.348 139.609 70.348H140.519V72H139.287C137.635 72 136.809 71.1973 136.809 69.592V65.854H135.885V64.244H136.809V62.326H138.783V64.244H140.519V65.854H138.783ZM148.889 67.954C148.889 68.234 148.87 68.486 148.833 68.71H143.163C143.21 69.27 143.406 69.7087 143.751 70.026C144.096 70.3433 144.521 70.502 145.025 70.502C145.753 70.502 146.271 70.1893 146.579 69.564H148.693C148.469 70.3107 148.04 70.9267 147.405 71.412C146.77 71.888 145.991 72.126 145.067 72.126C144.32 72.126 143.648 71.9627 143.051 71.636C142.463 71.3 142.001 70.8287 141.665 70.222C141.338 69.6153 141.175 68.9153 141.175 68.122C141.175 67.3193 141.338 66.6147 141.665 66.008C141.992 65.4013 142.449 64.9347 143.037 64.608C143.625 64.2813 144.302 64.118 145.067 64.118C145.804 64.118 146.462 64.2767 147.041 64.594C147.629 64.9113 148.082 65.364 148.399 65.952C148.726 66.5307 148.889 67.198 148.889 67.954ZM146.859 67.394C146.85 66.89 146.668 66.4887 146.313 66.19C145.958 65.882 145.524 65.728 145.011 65.728C144.526 65.728 144.115 65.8773 143.779 66.176C143.452 66.4653 143.252 66.8713 143.177 67.394H146.859ZM159.189 62.228V63.81H155.115V66.316H158.237V67.87H155.115V72H153.155V62.228H159.189ZM162.289 65.448C162.541 65.0373 162.868 64.7153 163.269 64.482C163.68 64.2487 164.147 64.132 164.669 64.132V66.19H164.151C163.535 66.19 163.069 66.3347 162.751 66.624C162.443 66.9133 162.289 67.4173 162.289 68.136V72H160.329V64.244H162.289V65.448ZM172.949 67.954C172.949 68.234 172.931 68.486 172.893 68.71H167.223C167.27 69.27 167.466 69.7087 167.811 70.026C168.157 70.3433 168.581 70.502 169.085 70.502C169.813 70.502 170.331 70.1893 170.639 69.564H172.753C172.529 70.3107 172.1 70.9267 171.465 71.412C170.831 71.888 170.051 72.126 169.127 72.126C168.381 72.126 167.709 71.9627 167.111 71.636C166.523 71.3 166.061 70.8287 165.725 70.222C165.399 69.6153 165.235 68.9153 165.235 68.122C165.235 67.3193 165.399 66.6147 165.725 66.008C166.052 65.4013 166.509 64.9347 167.097 64.608C167.685 64.2813 168.362 64.118 169.127 64.118C169.865 64.118 170.523 64.2767 171.101 64.594C171.689 64.9113 172.142 65.364 172.459 65.952C172.786 66.5307 172.949 67.198 172.949 67.954ZM170.919 67.394C170.91 66.89 170.728 66.4887 170.373 66.19C170.019 65.882 169.585 65.728 169.071 65.728C168.586 65.728 168.175 65.8773 167.839 66.176C167.513 66.4653 167.312 66.8713 167.237 67.394H170.919ZM181.34 67.954C181.34 68.234 181.321 68.486 181.284 68.71H175.614C175.661 69.27 175.857 69.7087 176.202 70.026C176.547 70.3433 176.972 70.502 177.476 70.502C178.204 70.502 178.722 70.1893 179.03 69.564H181.144C180.92 70.3107 180.491 70.9267 179.856 71.412C179.221 71.888 178.442 72.126 177.518 72.126C176.771 72.126 176.099 71.9627 175.502 71.636C174.914 71.3 174.452 70.8287 174.116 70.222C173.789 69.6153 173.626 68.9153 173.626 68.122C173.626 67.3193 173.789 66.6147 174.116 66.008C174.443 65.4013 174.9 64.9347 175.488 64.608C176.076 64.2813 176.753 64.118 177.518 64.118C178.255 64.118 178.913 64.2767 179.492 64.594C180.08 64.9113 180.533 65.364 180.85 65.952C181.177 66.5307 181.34 67.198 181.34 67.954ZM179.31 67.394C179.301 66.89 179.119 66.4887 178.764 66.19C178.409 65.882 177.975 65.728 177.462 65.728C176.977 65.728 176.566 65.8773 176.23 66.176C175.903 66.4653 175.703 66.8713 175.628 67.394H179.31ZM191.599 70.138H187.707L187.063 72H185.005L188.519 62.214H190.801L194.315 72H192.243L191.599 70.138ZM191.067 68.57L189.653 64.482L188.239 68.57H191.067ZM194.874 68.122C194.874 67.3193 195.037 66.6193 195.364 66.022C195.691 65.4153 196.143 64.9487 196.722 64.622C197.301 64.286 197.963 64.118 198.71 64.118C199.671 64.118 200.465 64.3607 201.09 64.846C201.725 65.322 202.149 65.994 202.364 66.862H200.25C200.138 66.526 199.947 66.2647 199.676 66.078C199.415 65.882 199.088 65.784 198.696 65.784C198.136 65.784 197.693 65.9893 197.366 66.4C197.039 66.8013 196.876 67.3753 196.876 68.122C196.876 68.8593 197.039 69.4333 197.366 69.844C197.693 70.2453 198.136 70.446 198.696 70.446C199.489 70.446 200.007 70.0913 200.25 69.382H202.364C202.149 70.222 201.725 70.8893 201.09 71.384C200.455 71.8787 199.662 72.126 198.71 72.126C197.963 72.126 197.301 71.9627 196.722 71.636C196.143 71.3 195.691 70.8333 195.364 70.236C195.037 69.6293 194.874 68.9247 194.874 68.122ZM203.046 68.122C203.046 67.3193 203.209 66.6193 203.536 66.022C203.863 65.4153 204.315 64.9487 204.894 64.622C205.473 64.286 206.135 64.118 206.882 64.118C207.843 64.118 208.637 64.3607 209.262 64.846C209.897 65.322 210.321 65.994 210.536 66.862H208.422C208.31 66.526 208.119 66.2647 207.848 66.078C207.587 65.882 207.26 65.784 206.868 65.784C206.308 65.784 205.865 65.9893 205.538 66.4C205.211 66.8013 205.048 67.3753 205.048 68.122C205.048 68.8593 205.211 69.4333 205.538 69.844C205.865 70.2453 206.308 70.446 206.868 70.446C207.661 70.446 208.179 70.0913 208.422 69.382H210.536C210.321 70.222 209.897 70.8893 209.262 71.384C208.627 71.8787 207.834 72.126 206.882 72.126C206.135 72.126 205.473 71.9627 204.894 71.636C204.315 71.3 203.863 70.8333 203.536 70.236C203.209 69.6293 203.046 68.9247 203.046 68.122ZM215.166 72.126C214.419 72.126 213.747 71.9627 213.15 71.636C212.553 71.3 212.081 70.8287 211.736 70.222C211.4 69.6153 211.232 68.9153 211.232 68.122C211.232 67.3287 211.405 66.6287 211.75 66.022C212.105 65.4153 212.585 64.9487 213.192 64.622C213.799 64.286 214.475 64.118 215.222 64.118C215.969 64.118 216.645 64.286 217.252 64.622C217.859 64.9487 218.335 65.4153 218.68 66.022C219.035 66.6287 219.212 67.3287 219.212 68.122C219.212 68.9153 219.03 69.6153 218.666 70.222C218.311 70.8287 217.826 71.3 217.21 71.636C216.603 71.9627 215.922 72.126 215.166 72.126ZM215.166 70.418C215.521 70.418 215.852 70.334 216.16 70.166C216.477 69.9887 216.729 69.7273 216.916 69.382C217.103 69.0367 217.196 68.6167 217.196 68.122C217.196 67.3847 217 66.82 216.608 66.428C216.225 66.0267 215.754 65.826 215.194 65.826C214.634 65.826 214.163 66.0267 213.78 66.428C213.407 66.82 213.22 67.3847 213.22 68.122C213.22 68.8593 213.402 69.4287 213.766 69.83C214.139 70.222 214.606 70.418 215.166 70.418ZM227.722 64.244V72H225.748V71.02C225.496 71.356 225.164 71.622 224.754 71.818C224.352 72.0047 223.914 72.098 223.438 72.098C222.831 72.098 222.294 71.972 221.828 71.72C221.361 71.4587 220.992 71.0807 220.722 70.586C220.46 70.082 220.33 69.4847 220.33 68.794V64.244H222.29V68.514C222.29 69.13 222.444 69.606 222.752 69.942C223.06 70.2687 223.48 70.432 224.012 70.432C224.553 70.432 224.978 70.2687 225.286 69.942C225.594 69.606 225.748 69.13 225.748 68.514V64.244H227.722ZM233.703 64.132C234.627 64.132 235.374 64.426 235.943 65.014C236.513 65.5927 236.797 66.4047 236.797 67.45V72H234.837V67.716C234.837 67.1 234.683 66.6287 234.375 66.302C234.067 65.966 233.647 65.798 233.115 65.798C232.574 65.798 232.145 65.966 231.827 66.302C231.519 66.6287 231.365 67.1 231.365 67.716V72H229.405V64.244H231.365V65.21C231.627 64.874 231.958 64.6127 232.359 64.426C232.77 64.23 233.218 64.132 233.703 64.132ZM240.693 65.854V69.606C240.693 69.8673 240.754 70.0587 240.875 70.18C241.006 70.292 241.221 70.348 241.519 70.348H242.429V72H241.197C239.545 72 238.719 71.1973 238.719 69.592V65.854H237.795V64.244H238.719V62.326H240.693V64.244H242.429V65.854H240.693Z" fill="white" />
                <rect x="11" y="49" width="323" height="36" rx="8" fill="#E7B119" />
                <path d="M307.49 35.1C307.49 34.1387 307.705 33.28 308.134 32.524C308.573 31.7587 309.165 31.166 309.912 30.746C310.668 30.3167 311.513 30.102 312.446 30.102C313.538 30.102 314.495 30.382 315.316 30.942C316.137 31.502 316.711 32.2767 317.038 33.266H314.784C314.56 32.7993 314.243 32.4493 313.832 32.216C313.431 31.9827 312.964 31.866 312.432 31.866C311.863 31.866 311.354 32.0013 310.906 32.272C310.467 32.5333 310.122 32.9067 309.87 33.392C309.627 33.8773 309.506 34.4467 309.506 35.1C309.506 35.744 309.627 36.3133 309.87 36.808C310.122 37.2933 310.467 37.6713 310.906 37.942C311.354 38.2033 311.863 38.334 312.432 38.334C312.964 38.334 313.431 38.2173 313.832 37.984C314.243 37.7413 314.56 37.3867 314.784 36.92H317.038C316.711 37.9187 316.137 38.698 315.316 39.258C314.504 39.8087 313.547 40.084 312.446 40.084C311.513 40.084 310.668 39.874 309.912 39.454C309.165 39.0247 308.573 38.432 308.134 37.676C307.705 36.92 307.49 36.0613 307.49 35.1ZM320.422 33.448C320.674 33.0373 321.001 32.7153 321.402 32.482C321.813 32.2487 322.279 32.132 322.802 32.132V34.19H322.284C321.668 34.19 321.201 34.3347 320.884 34.624C320.576 34.9133 320.422 35.4173 320.422 36.136V40H318.462V32.244H320.422V33.448ZM331.082 35.954C331.082 36.234 331.064 36.486 331.026 36.71H325.356C325.403 37.27 325.599 37.7087 325.944 38.026C326.29 38.3433 326.714 38.502 327.218 38.502C327.946 38.502 328.464 38.1893 328.772 37.564H330.886C330.662 38.3107 330.233 38.9267 329.598 39.412C328.964 39.888 328.184 40.126 327.26 40.126C326.514 40.126 325.842 39.9627 325.244 39.636C324.656 39.3 324.194 38.8287 323.858 38.222C323.532 37.6153 323.368 36.9153 323.368 36.122C323.368 35.3193 323.532 34.6147 323.858 34.008C324.185 33.4013 324.642 32.9347 325.23 32.608C325.818 32.2813 326.495 32.118 327.26 32.118C327.998 32.118 328.656 32.2767 329.234 32.594C329.822 32.9113 330.275 33.364 330.592 33.952C330.919 34.5307 331.082 35.198 331.082 35.954ZM329.052 35.394C329.043 34.89 328.861 34.4887 328.506 34.19C328.152 33.882 327.718 33.728 327.204 33.728C326.719 33.728 326.308 33.8773 325.972 34.176C325.646 34.4653 325.445 34.8713 325.37 35.394H329.052ZM331.759 36.094C331.759 35.31 331.913 34.6147 332.221 34.008C332.538 33.4013 332.963 32.9347 333.495 32.608C334.036 32.2813 334.638 32.118 335.301 32.118C335.88 32.118 336.384 32.2347 336.813 32.468C337.252 32.7013 337.602 32.9953 337.863 33.35V32.244H339.837V40H337.863V38.866C337.611 39.23 337.261 39.5333 336.813 39.776C336.374 40.0093 335.866 40.126 335.287 40.126C334.634 40.126 334.036 39.958 333.495 39.622C332.963 39.286 332.538 38.8147 332.221 38.208C331.913 37.592 331.759 36.8873 331.759 36.094ZM337.863 36.122C337.863 35.646 337.77 35.24 337.583 34.904C337.396 34.5587 337.144 34.2973 336.827 34.12C336.51 33.9333 336.169 33.84 335.805 33.84C335.441 33.84 335.105 33.9287 334.797 34.106C334.489 34.2833 334.237 34.5447 334.041 34.89C333.854 35.226 333.761 35.6273 333.761 36.094C333.761 36.5607 333.854 36.9713 334.041 37.326C334.237 37.6713 334.489 37.9373 334.797 38.124C335.114 38.3107 335.45 38.404 335.805 38.404C336.169 38.404 336.51 38.3153 336.827 38.138C337.144 37.9513 337.396 37.69 337.583 37.354C337.77 37.0087 337.863 36.598 337.863 36.122ZM343.783 33.854V37.606C343.783 37.8673 343.844 38.0587 343.965 38.18C344.096 38.292 344.31 38.348 344.609 38.348H345.519V40H344.287C342.635 40 341.809 39.1973 341.809 37.592V33.854H340.885V32.244H341.809V30.326H343.783V32.244H345.519V33.854H343.783ZM353.889 35.954C353.889 36.234 353.87 36.486 353.833 36.71H348.163C348.21 37.27 348.406 37.7087 348.751 38.026C349.096 38.3433 349.521 38.502 350.025 38.502C350.753 38.502 351.271 38.1893 351.579 37.564H353.693C353.469 38.3107 353.04 38.9267 352.405 39.412C351.77 39.888 350.991 40.126 350.067 40.126C349.32 40.126 348.648 39.9627 348.051 39.636C347.463 39.3 347.001 38.8287 346.665 38.222C346.338 37.6153 346.175 36.9153 346.175 36.122C346.175 35.3193 346.338 34.6147 346.665 34.008C346.992 33.4013 347.449 32.9347 348.037 32.608C348.625 32.2813 349.302 32.118 350.067 32.118C350.804 32.118 351.462 32.2767 352.041 32.594C352.629 32.9113 353.082 33.364 353.399 33.952C353.726 34.5307 353.889 35.198 353.889 35.954ZM351.859 35.394C351.85 34.89 351.668 34.4887 351.313 34.19C350.958 33.882 350.524 33.728 350.011 33.728C349.526 33.728 349.115 33.8773 348.779 34.176C348.452 34.4653 348.252 34.8713 348.177 35.394H351.859ZM364.189 30.228V31.81H360.115V34.316H363.237V35.87H360.115V40H358.155V30.228H364.189ZM367.289 33.448C367.541 33.0373 367.868 32.7153 368.269 32.482C368.68 32.2487 369.147 32.132 369.669 32.132V34.19H369.151C368.535 34.19 368.069 34.3347 367.751 34.624C367.443 34.9133 367.289 35.4173 367.289 36.136V40H365.329V32.244H367.289V33.448ZM377.949 35.954C377.949 36.234 377.931 36.486 377.893 36.71H372.223C372.27 37.27 372.466 37.7087 372.811 38.026C373.157 38.3433 373.581 38.502 374.085 38.502C374.813 38.502 375.331 38.1893 375.639 37.564H377.753C377.529 38.3107 377.1 38.9267 376.465 39.412C375.831 39.888 375.051 40.126 374.127 40.126C373.381 40.126 372.709 39.9627 372.111 39.636C371.523 39.3 371.061 38.8287 370.725 38.222C370.399 37.6153 370.235 36.9153 370.235 36.122C370.235 35.3193 370.399 34.6147 370.725 34.008C371.052 33.4013 371.509 32.9347 372.097 32.608C372.685 32.2813 373.362 32.118 374.127 32.118C374.865 32.118 375.523 32.2767 376.101 32.594C376.689 32.9113 377.142 33.364 377.459 33.952C377.786 34.5307 377.949 35.198 377.949 35.954ZM375.919 35.394C375.91 34.89 375.728 34.4887 375.373 34.19C375.019 33.882 374.585 33.728 374.071 33.728C373.586 33.728 373.175 33.8773 372.839 34.176C372.513 34.4653 372.312 34.8713 372.237 35.394H375.919ZM386.34 35.954C386.34 36.234 386.321 36.486 386.284 36.71H380.614C380.661 37.27 380.857 37.7087 381.202 38.026C381.547 38.3433 381.972 38.502 382.476 38.502C383.204 38.502 383.722 38.1893 384.03 37.564H386.144C385.92 38.3107 385.491 38.9267 384.856 39.412C384.221 39.888 383.442 40.126 382.518 40.126C381.771 40.126 381.099 39.9627 380.502 39.636C379.914 39.3 379.452 38.8287 379.116 38.222C378.789 37.6153 378.626 36.9153 378.626 36.122C378.626 35.3193 378.789 34.6147 379.116 34.008C379.443 33.4013 379.9 32.9347 380.488 32.608C381.076 32.2813 381.753 32.118 382.518 32.118C383.255 32.118 383.913 32.2767 384.492 32.594C385.08 32.9113 385.533 33.364 385.85 33.952C386.177 34.5307 386.34 35.198 386.34 35.954ZM384.31 35.394C384.301 34.89 384.119 34.4887 383.764 34.19C383.409 33.882 382.975 33.728 382.462 33.728C381.977 33.728 381.566 33.8773 381.23 34.176C380.903 34.4653 380.703 34.8713 380.628 35.394H384.31ZM396.599 38.138H392.707L392.063 40H390.005L393.519 30.214H395.801L399.315 40H397.243L396.599 38.138ZM396.067 36.57L394.653 32.482L393.239 36.57H396.067ZM399.874 36.122C399.874 35.3193 400.037 34.6193 400.364 34.022C400.691 33.4153 401.143 32.9487 401.722 32.622C402.301 32.286 402.963 32.118 403.71 32.118C404.671 32.118 405.465 32.3607 406.09 32.846C406.725 33.322 407.149 33.994 407.364 34.862H405.25C405.138 34.526 404.947 34.2647 404.676 34.078C404.415 33.882 404.088 33.784 403.696 33.784C403.136 33.784 402.693 33.9893 402.366 34.4C402.039 34.8013 401.876 35.3753 401.876 36.122C401.876 36.8593 402.039 37.4333 402.366 37.844C402.693 38.2453 403.136 38.446 403.696 38.446C404.489 38.446 405.007 38.0913 405.25 37.382H407.364C407.149 38.222 406.725 38.8893 406.09 39.384C405.455 39.8787 404.662 40.126 403.71 40.126C402.963 40.126 402.301 39.9627 401.722 39.636C401.143 39.3 400.691 38.8333 400.364 38.236C400.037 37.6293 399.874 36.9247 399.874 36.122ZM408.046 36.122C408.046 35.3193 408.209 34.6193 408.536 34.022C408.863 33.4153 409.315 32.9487 409.894 32.622C410.473 32.286 411.135 32.118 411.882 32.118C412.843 32.118 413.637 32.3607 414.262 32.846C414.897 33.322 415.321 33.994 415.536 34.862H413.422C413.31 34.526 413.119 34.2647 412.848 34.078C412.587 33.882 412.26 33.784 411.868 33.784C411.308 33.784 410.865 33.9893 410.538 34.4C410.211 34.8013 410.048 35.3753 410.048 36.122C410.048 36.8593 410.211 37.4333 410.538 37.844C410.865 38.2453 411.308 38.446 411.868 38.446C412.661 38.446 413.179 38.0913 413.422 37.382H415.536C415.321 38.222 414.897 38.8893 414.262 39.384C413.627 39.8787 412.834 40.126 411.882 40.126C411.135 40.126 410.473 39.9627 409.894 39.636C409.315 39.3 408.863 38.8333 408.536 38.236C408.209 37.6293 408.046 36.9247 408.046 36.122ZM420.166 40.126C419.419 40.126 418.747 39.9627 418.15 39.636C417.553 39.3 417.081 38.8287 416.736 38.222C416.4 37.6153 416.232 36.9153 416.232 36.122C416.232 35.3287 416.405 34.6287 416.75 34.022C417.105 33.4153 417.585 32.9487 418.192 32.622C418.799 32.286 419.475 32.118 420.222 32.118C420.969 32.118 421.645 32.286 422.252 32.622C422.859 32.9487 423.335 33.4153 423.68 34.022C424.035 34.6287 424.212 35.3287 424.212 36.122C424.212 36.9153 424.03 37.6153 423.666 38.222C423.311 38.8287 422.826 39.3 422.21 39.636C421.603 39.9627 420.922 40.126 420.166 40.126ZM420.166 38.418C420.521 38.418 420.852 38.334 421.16 38.166C421.477 37.9887 421.729 37.7273 421.916 37.382C422.103 37.0367 422.196 36.6167 422.196 36.122C422.196 35.3847 422 34.82 421.608 34.428C421.225 34.0267 420.754 33.826 420.194 33.826C419.634 33.826 419.163 34.0267 418.78 34.428C418.407 34.82 418.22 35.3847 418.22 36.122C418.22 36.8593 418.402 37.4287 418.766 37.83C419.139 38.222 419.606 38.418 420.166 38.418ZM432.722 32.244V40H430.748V39.02C430.496 39.356 430.164 39.622 429.754 39.818C429.352 40.0047 428.914 40.098 428.438 40.098C427.831 40.098 427.294 39.972 426.828 39.72C426.361 39.4587 425.992 39.0807 425.722 38.586C425.46 38.082 425.33 37.4847 425.33 36.794V32.244H427.29V36.514C427.29 37.13 427.444 37.606 427.752 37.942C428.06 38.2687 428.48 38.432 429.012 38.432C429.553 38.432 429.978 38.2687 430.286 37.942C430.594 37.606 430.748 37.13 430.748 36.514V32.244H432.722ZM438.703 32.132C439.627 32.132 440.374 32.426 440.943 33.014C441.513 33.5927 441.797 34.4047 441.797 35.45V40H439.837V35.716C439.837 35.1 439.683 34.6287 439.375 34.302C439.067 33.966 438.647 33.798 438.115 33.798C437.574 33.798 437.145 33.966 436.827 34.302C436.519 34.6287 436.365 35.1 436.365 35.716V40H434.405V32.244H436.365V33.21C436.627 32.874 436.958 32.6127 437.359 32.426C437.77 32.23 438.218 32.132 438.703 32.132ZM445.693 33.854V37.606C445.693 37.8673 445.754 38.0587 445.875 38.18C446.006 38.292 446.221 38.348 446.519 38.348H447.429V40H446.197C444.545 40 443.719 39.1973 443.719 37.592V33.854H442.795V32.244H443.719V30.326H445.693V32.244H447.429V33.854H445.693Z" fill="white" />
              </svg>

            </Box>
            <Box
              sx={{ p: 1, my: 1, cursor: 'pointer', display: { xs: 'none', md: 'block' } }}
              onClick={() => {
                window.location.href = '/login';
              }}
            >
              <svg width="508" height="64" viewBox="0 0 508 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="507" height="63" rx="12.5" fill="#FDF7E8" />
                <rect x="0.5" y="0.5" width="507" height="63" rx="12.5" stroke="#F5DFA1" />
                <path fillRule="evenodd" clipRule="evenodd" d="M54.375 30.0626C54.375 28.6128 55.5503 27.4376 57 27.4376C58.0785 27.4376 58.9922 28.286 59.2885 29.1747C59.4195 29.5677 59.8442 29.7801 60.2372 29.6491C60.6301 29.5181 60.8425 29.0933 60.7115 28.7004C60.2578 27.3391 58.8604 25.9376 57 25.9376C54.7218 25.9376 52.875 27.7844 52.875 30.0626V31.3954C51.6992 31.7552 50.8119 32.7896 50.6434 34.0414C50.5323 34.8667 50.4375 35.7339 50.4375 36.6251C50.4375 37.5162 50.5323 38.3834 50.6434 39.2087C50.8471 40.7214 52.1004 41.9167 53.6439 41.9876C54.7152 42.0369 55.8031 42.0626 57 42.0626C58.1969 42.0626 59.2848 42.0369 60.3561 41.9876C61.8996 41.9167 63.1529 40.7214 63.3566 39.2087C63.4677 38.3834 63.5625 37.5162 63.5625 36.6251C63.5625 35.7339 63.4677 34.8667 63.3566 34.0414C63.1529 32.5287 61.8996 31.3334 60.3561 31.2625C59.2848 31.2132 58.1969 31.1876 57 31.1876C56.074 31.1876 55.2133 31.2029 54.375 31.2327V30.0626ZM57 35.1251C57.4142 35.1251 57.75 35.4608 57.75 35.8751V37.3751C57.75 37.7893 57.4142 38.1251 57 38.1251C56.5858 38.1251 56.25 37.7893 56.25 37.3751V35.8751C56.25 35.4608 56.5858 35.1251 57 35.1251Z" fill="#E7B119" />
                <path d="M85.7424 29.8182H87.2836V36.5149C87.2836 37.2275 87.1162 37.8589 86.7814 38.4091C86.4467 38.956 85.976 39.3868 85.3695 39.7017C84.763 40.0133 84.052 40.169 83.2367 40.169C82.4247 40.169 81.7154 40.0133 81.1088 39.7017C80.5023 39.3868 80.0317 38.956 79.6969 38.4091C79.3622 37.8589 79.1948 37.2275 79.1948 36.5149V29.8182H80.731V36.3906C80.731 36.8513 80.8321 37.2607 81.0343 37.6186C81.2398 37.9766 81.5298 38.2583 81.9043 38.4638C82.2788 38.666 82.723 38.767 83.2367 38.767C83.7537 38.767 84.1995 38.666 84.574 38.4638C84.9519 38.2583 85.2402 37.9766 85.4391 37.6186C85.6413 37.2607 85.7424 36.8513 85.7424 36.3906V29.8182ZM90.8842 35.4659V40H89.3977V32.3636H90.8246V33.6065H90.919C91.0947 33.2022 91.3698 32.8774 91.7443 32.6321C92.1222 32.3868 92.5978 32.2642 93.1712 32.2642C93.6915 32.2642 94.1473 32.3736 94.5384 32.5923C94.9295 32.8078 95.2327 33.1293 95.4482 33.5568C95.6636 33.9844 95.7713 34.513 95.7713 35.1428V40H94.2848V35.3217C94.2848 34.7682 94.1406 34.3357 93.8523 34.0241C93.5639 33.7093 93.1679 33.5518 92.6641 33.5518C92.3194 33.5518 92.0128 33.6264 91.7443 33.7756C91.4792 33.9247 91.2687 34.1435 91.1129 34.4318C90.9605 34.7169 90.8842 35.0616 90.8842 35.4659ZM99.2514 29.8182V40H97.7649V29.8182H99.2514ZM104.468 40.1541C103.752 40.1541 103.127 39.9901 102.594 39.6619C102.06 39.3338 101.646 38.8748 101.351 38.2848C101.056 37.6948 100.908 37.0054 100.908 36.2166C100.908 35.4245 101.056 34.7318 101.351 34.1385C101.646 33.5452 102.06 33.0845 102.594 32.7564C103.127 32.4283 103.752 32.2642 104.468 32.2642C105.184 32.2642 105.809 32.4283 106.342 32.7564C106.876 33.0845 107.29 33.5452 107.585 34.1385C107.88 34.7318 108.028 35.4245 108.028 36.2166C108.028 37.0054 107.88 37.6948 107.585 38.2848C107.29 38.8748 106.876 39.3338 106.342 39.6619C105.809 39.9901 105.184 40.1541 104.468 40.1541ZM104.473 38.9062C104.937 38.9062 105.321 38.7836 105.626 38.5384C105.931 38.2931 106.157 37.9666 106.302 37.5589C106.452 37.1513 106.526 36.7022 106.526 36.2116C106.526 35.7244 106.452 35.277 106.302 34.8693C106.157 34.4583 105.931 34.1286 105.626 33.88C105.321 33.6314 104.937 33.5071 104.473 33.5071C104.006 33.5071 103.618 33.6314 103.309 33.88C103.005 34.1286 102.778 34.4583 102.628 34.8693C102.483 35.277 102.41 35.7244 102.41 36.2116C102.41 36.7022 102.483 37.1513 102.628 37.5589C102.778 37.9666 103.005 38.2931 103.309 38.5384C103.618 38.7836 104.006 38.9062 104.473 38.9062ZM112.903 40.1541C112.164 40.1541 111.528 39.9867 110.994 39.652C110.464 39.3139 110.056 38.8482 109.771 38.255C109.486 37.6617 109.344 36.9822 109.344 36.2166C109.344 35.4411 109.49 34.7566 109.781 34.1634C110.073 33.5668 110.484 33.1011 111.014 32.7663C111.545 32.4316 112.169 32.2642 112.888 32.2642C113.469 32.2642 113.986 32.3719 114.44 32.5874C114.894 32.7995 115.26 33.0978 115.538 33.4822C115.82 33.8667 115.987 34.3158 116.04 34.8295H114.594C114.514 34.4716 114.332 34.1634 114.047 33.9048C113.765 33.6463 113.387 33.517 112.913 33.517C112.499 33.517 112.136 33.6264 111.825 33.8452C111.516 34.0606 111.276 34.3688 111.104 34.7699C110.931 35.1676 110.845 35.6383 110.845 36.1818C110.845 36.7386 110.93 37.2192 111.099 37.6236C111.268 38.0279 111.506 38.3411 111.815 38.5632C112.126 38.7853 112.492 38.8963 112.913 38.8963C113.195 38.8963 113.45 38.8449 113.679 38.7422C113.911 38.6361 114.105 38.4853 114.261 38.2898C114.42 38.0942 114.531 37.8589 114.594 37.5838H116.04C115.987 38.0777 115.827 38.5185 115.558 38.9062C115.29 39.294 114.93 39.599 114.479 39.821C114.032 40.0431 113.507 40.1541 112.903 40.1541ZM118.997 37.4098L118.987 35.5952H119.246L122.289 32.3636H124.068L120.598 36.0426H120.365L118.997 37.4098ZM117.63 40V29.8182H119.117V40H117.63ZM122.453 40L119.718 36.3707L120.742 35.3317L124.277 40H122.453ZM132.762 32.3636V33.5568H128.447V32.3636H132.762ZM129.63 40V31.4787C129.63 31.0014 129.735 30.6053 129.944 30.2905C130.152 29.9723 130.429 29.7353 130.774 29.5795C131.118 29.4205 131.493 29.3409 131.897 29.3409C132.196 29.3409 132.451 29.3658 132.663 29.4155C132.875 29.4619 133.033 29.505 133.135 29.5447L132.787 30.7479C132.718 30.728 132.628 30.7048 132.519 30.6783C132.409 30.6484 132.277 30.6335 132.121 30.6335C131.76 30.6335 131.501 30.723 131.346 30.902C131.193 31.081 131.117 31.3395 131.117 31.6776V40H129.63ZM134.296 40V32.3636H135.783V40H134.296ZM135.047 31.1854C134.788 31.1854 134.566 31.0992 134.381 30.9268C134.198 30.7512 134.107 30.5424 134.107 30.3004C134.107 30.0552 134.198 29.8464 134.381 29.674C134.566 29.4983 134.788 29.4105 135.047 29.4105C135.305 29.4105 135.526 29.4983 135.708 29.674C135.894 29.8464 135.987 30.0552 135.987 30.3004C135.987 30.5424 135.894 30.7512 135.708 30.9268C135.526 31.0992 135.305 31.1854 135.047 31.1854ZM139.269 29.8182V40H137.782V29.8182H139.269ZM144.833 32.3636V33.5568H140.662V32.3636H144.833ZM141.781 30.5341H143.267V37.7578C143.267 38.0462 143.31 38.2633 143.397 38.4091C143.483 38.5516 143.594 38.6494 143.73 38.7024C143.869 38.7521 144.02 38.777 144.182 38.777C144.301 38.777 144.406 38.7687 144.495 38.7521C144.585 38.7356 144.654 38.7223 144.704 38.7124L144.973 39.9403C144.886 39.9735 144.764 40.0066 144.605 40.0398C144.446 40.0762 144.247 40.0961 144.008 40.0994C143.617 40.1061 143.252 40.0365 142.914 39.8906C142.576 39.7448 142.303 39.5194 142.094 39.2145C141.885 38.9096 141.781 38.5268 141.781 38.0661V30.5341ZM149.687 40.1541C148.935 40.1541 148.287 39.9934 147.743 39.6719C147.203 39.3471 146.785 38.8913 146.49 38.3047C146.199 37.7147 146.053 37.0237 146.053 36.2315C146.053 35.4493 146.199 34.7599 146.49 34.1634C146.785 33.5668 147.196 33.1011 147.723 32.7663C148.253 32.4316 148.873 32.2642 149.583 32.2642C150.013 32.2642 150.431 32.3355 150.835 32.478C151.24 32.6205 151.603 32.8442 151.924 33.1491C152.246 33.4541 152.499 33.8501 152.685 34.3374C152.87 34.8213 152.963 35.4096 152.963 36.1023V36.6293H146.893V35.5156H151.507C151.507 35.1245 151.427 34.7782 151.268 34.4766C151.109 34.1716 150.885 33.9313 150.597 33.7557C150.312 33.58 149.977 33.4922 149.593 33.4922C149.175 33.4922 148.81 33.5949 148.499 33.8004C148.191 34.0026 147.952 34.2678 147.783 34.5959C147.617 34.9207 147.534 35.2737 147.534 35.6548V36.5249C147.534 37.0353 147.624 37.4695 147.803 37.8274C147.985 38.1854 148.239 38.4588 148.563 38.6477C148.888 38.8333 149.268 38.9261 149.702 38.9261C149.984 38.9261 150.24 38.8864 150.472 38.8068C150.704 38.724 150.905 38.6013 151.074 38.4389C151.243 38.2765 151.372 38.076 151.462 37.8374L152.869 38.0909C152.756 38.5052 152.554 38.8681 152.262 39.1797C151.974 39.4879 151.611 39.7282 151.173 39.9006C150.739 40.0696 150.244 40.1541 149.687 40.1541ZM154.613 40V32.3636H156.049V33.5767H156.129C156.268 33.1657 156.513 32.8426 156.865 32.6072C157.219 32.3686 157.62 32.2493 158.068 32.2493C158.161 32.2493 158.27 32.2526 158.396 32.2592C158.525 32.2659 158.626 32.2741 158.699 32.2841V33.706C158.64 33.6894 158.533 33.6712 158.381 33.6513C158.229 33.6281 158.076 33.6165 157.924 33.6165C157.572 33.6165 157.259 33.6911 156.984 33.8402C156.712 33.986 156.497 34.1899 156.338 34.4517C156.179 34.7102 156.099 35.0052 156.099 35.3366V40H154.613ZM165.708 34.228L164.361 34.4666C164.304 34.2943 164.215 34.1302 164.092 33.9744C163.973 33.8187 163.81 33.6911 163.605 33.5916C163.399 33.4922 163.143 33.4425 162.834 33.4425C162.413 33.4425 162.062 33.5369 161.78 33.7259C161.499 33.9115 161.358 34.1518 161.358 34.4467C161.358 34.7019 161.452 34.9074 161.641 35.0632C161.83 35.219 162.135 35.3466 162.556 35.446L163.769 35.7244C164.472 35.8868 164.995 36.1371 165.34 36.4751C165.685 36.8132 165.857 37.2524 165.857 37.7926C165.857 38.25 165.724 38.6577 165.459 39.0156C165.198 39.3703 164.831 39.6487 164.361 39.8509C163.893 40.053 163.351 40.1541 162.735 40.1541C161.88 40.1541 161.182 39.9718 160.642 39.6072C160.102 39.2393 159.77 38.7173 159.648 38.0412L161.084 37.8224C161.174 38.197 161.358 38.4804 161.636 38.6726C161.915 38.8615 162.278 38.956 162.725 38.956C163.212 38.956 163.602 38.8549 163.893 38.6527C164.185 38.4472 164.331 38.197 164.331 37.902C164.331 37.6634 164.241 37.4628 164.062 37.3004C163.887 37.138 163.617 37.0154 163.252 36.9325L161.959 36.6491C161.247 36.4867 160.72 36.2282 160.378 35.8736C160.04 35.5189 159.871 35.0698 159.871 34.5263C159.871 34.0755 159.997 33.6811 160.249 33.343C160.501 33.005 160.849 32.7415 161.293 32.5526C161.737 32.3603 162.246 32.2642 162.819 32.2642C163.645 32.2642 164.294 32.4432 164.768 32.8011C165.242 33.1558 165.555 33.6314 165.708 34.228ZM173.419 40.169C172.935 40.169 172.497 40.0795 172.106 39.9006C171.715 39.7183 171.405 39.4548 171.177 39.1101C170.951 38.7654 170.839 38.3428 170.839 37.8423C170.839 37.4115 170.921 37.0568 171.087 36.7784C171.253 36.5 171.477 36.2796 171.758 36.1172C172.04 35.9548 172.355 35.8321 172.703 35.7493C173.051 35.6664 173.406 35.6035 173.767 35.5604C174.224 35.5073 174.595 35.4643 174.881 35.4311C175.166 35.3946 175.373 35.3366 175.502 35.2571C175.631 35.1776 175.696 35.0483 175.696 34.8693V34.8345C175.696 34.4003 175.573 34.0639 175.328 33.8253C175.086 33.5866 174.725 33.4673 174.244 33.4673C173.744 33.4673 173.349 33.5784 173.061 33.8004C172.776 34.0192 172.579 34.2628 172.469 34.5312L171.072 34.2131C171.238 33.7491 171.48 33.3745 171.798 33.0895C172.12 32.8011 172.489 32.5923 172.907 32.4631C173.324 32.3305 173.764 32.2642 174.224 32.2642C174.529 32.2642 174.852 32.3007 175.194 32.3736C175.538 32.4432 175.86 32.5724 176.158 32.7614C176.46 32.9503 176.707 33.2204 176.899 33.5717C177.091 33.9197 177.187 34.3722 177.187 34.929V40H175.736V38.956H175.676C175.58 39.1482 175.436 39.3371 175.243 39.5227C175.051 39.7083 174.804 39.8625 174.503 39.9851C174.201 40.1077 173.84 40.169 173.419 40.169ZM173.742 38.9759C174.153 38.9759 174.504 38.8946 174.796 38.7322C175.091 38.5698 175.315 38.3577 175.467 38.0959C175.623 37.8307 175.701 37.5473 175.701 37.2457V36.2614C175.648 36.3144 175.545 36.3641 175.393 36.4105C175.243 36.4536 175.073 36.4917 174.881 36.5249C174.688 36.5547 174.501 36.5829 174.319 36.6094C174.136 36.6326 173.984 36.6525 173.861 36.669C173.573 36.7055 173.309 36.7668 173.071 36.853C172.836 36.9392 172.647 37.0634 172.504 37.2259C172.365 37.3849 172.295 37.5971 172.295 37.8622C172.295 38.2301 172.431 38.5085 172.703 38.6974C172.975 38.883 173.321 38.9759 173.742 38.9759ZM180.654 35.4659V40H179.167V32.3636H180.594V33.6065H180.689C180.864 33.2022 181.139 32.8774 181.514 32.6321C181.892 32.3868 182.367 32.2642 182.941 32.2642C183.461 32.2642 183.917 32.3736 184.308 32.5923C184.699 32.8078 185.002 33.1293 185.218 33.5568C185.433 33.9844 185.541 34.513 185.541 35.1428V40H184.054V35.3217C184.054 34.7682 183.91 34.3357 183.622 34.0241C183.333 33.7093 182.937 33.5518 182.434 33.5518C182.089 33.5518 181.782 33.6264 181.514 33.7756C181.249 33.9247 181.038 34.1435 180.882 34.4318C180.73 34.7169 180.654 35.0616 180.654 35.4659ZM190.393 40.1491C189.777 40.1491 189.226 39.9917 188.743 39.6768C188.262 39.3587 187.884 38.9062 187.609 38.3196C187.337 37.7296 187.201 37.022 187.201 36.1967C187.201 35.3714 187.339 34.6655 187.614 34.0788C187.892 33.4922 188.274 33.0431 188.757 32.7315C189.241 32.42 189.79 32.2642 190.403 32.2642C190.877 32.2642 191.258 32.3438 191.547 32.5028C191.838 32.6586 192.064 32.8409 192.223 33.0497C192.385 33.2585 192.511 33.4425 192.6 33.6016H192.69V29.8182H194.176V40H192.725V38.8118H192.6C192.511 38.9742 192.382 39.1598 192.213 39.3686C192.047 39.5774 191.818 39.7597 191.527 39.9155C191.235 40.0713 190.857 40.1491 190.393 40.1491ZM190.721 38.8814C191.149 38.8814 191.51 38.7687 191.805 38.5433C192.103 38.3146 192.329 37.9981 192.481 37.5938C192.637 37.1894 192.715 36.7187 192.715 36.1818C192.715 35.6515 192.639 35.1875 192.486 34.7898C192.334 34.392 192.11 34.0821 191.815 33.8601C191.52 33.638 191.155 33.527 190.721 33.527C190.274 33.527 189.901 33.643 189.603 33.875C189.304 34.107 189.079 34.4235 188.926 34.8246C188.777 35.2256 188.703 35.678 188.703 36.1818C188.703 36.6922 188.779 37.1513 188.931 37.5589C189.084 37.9666 189.309 38.2898 189.608 38.5284C189.909 38.7637 190.28 38.8814 190.721 38.8814ZM200.003 40V32.3636H201.43V33.6065H201.525C201.684 33.1856 201.944 32.8575 202.305 32.6222C202.666 32.3835 203.099 32.2642 203.603 32.2642C204.113 32.2642 204.541 32.3835 204.885 32.6222C205.233 32.8608 205.49 33.1889 205.656 33.6065H205.735C205.918 33.1989 206.208 32.8741 206.605 32.6321C207.003 32.3868 207.477 32.2642 208.027 32.2642C208.72 32.2642 209.285 32.4813 209.723 32.9155C210.163 33.3497 210.384 34.0043 210.384 34.8793V40H208.897V35.0185C208.897 34.5014 208.757 34.1269 208.475 33.8949C208.193 33.6629 207.857 33.5469 207.466 33.5469C206.982 33.5469 206.605 33.696 206.337 33.9943C206.069 34.2893 205.934 34.6688 205.934 35.1328V40H204.453V34.924C204.453 34.5097 204.324 34.1766 204.065 33.9247C203.806 33.6728 203.47 33.5469 203.056 33.5469C202.774 33.5469 202.514 33.6214 202.275 33.7706C202.04 33.9164 201.849 34.1203 201.703 34.3821C201.561 34.6439 201.49 34.9472 201.49 35.2919V40H200.003ZM215.593 40.1541C214.877 40.1541 214.252 39.9901 213.719 39.6619C213.185 39.3338 212.771 38.8748 212.476 38.2848C212.181 37.6948 212.033 37.0054 212.033 36.2166C212.033 35.4245 212.181 34.7318 212.476 34.1385C212.771 33.5452 213.185 33.0845 213.719 32.7564C214.252 32.4283 214.877 32.2642 215.593 32.2642C216.309 32.2642 216.934 32.4283 217.467 32.7564C218.001 33.0845 218.415 33.5452 218.71 34.1385C219.005 34.7318 219.153 35.4245 219.153 36.2166C219.153 37.0054 219.005 37.6948 218.71 38.2848C218.415 38.8748 218.001 39.3338 217.467 39.6619C216.934 39.9901 216.309 40.1541 215.593 40.1541ZM215.598 38.9062C216.062 38.9062 216.446 38.7836 216.751 38.5384C217.056 38.2931 217.282 37.9666 217.427 37.5589C217.577 37.1513 217.651 36.7022 217.651 36.2116C217.651 35.7244 217.577 35.277 217.427 34.8693C217.282 34.4583 217.056 34.1286 216.751 33.88C216.446 33.6314 216.062 33.5071 215.598 33.5071C215.131 33.5071 214.743 33.6314 214.434 33.88C214.13 34.1286 213.903 34.4583 213.753 34.8693C213.608 35.277 213.535 35.7244 213.535 36.2116C213.535 36.7022 213.608 37.1513 213.753 37.5589C213.903 37.9666 214.13 38.2931 214.434 38.5384C214.743 38.7836 215.131 38.9062 215.598 38.9062ZM220.812 40V32.3636H222.249V33.5767H222.328C222.467 33.1657 222.713 32.8426 223.064 32.6072C223.419 32.3686 223.82 32.2493 224.267 32.2493C224.36 32.2493 224.469 32.2526 224.595 32.2592C224.724 32.2659 224.826 32.2741 224.898 32.2841V33.706C224.839 33.6894 224.733 33.6712 224.58 33.6513C224.428 33.6281 224.275 33.6165 224.123 33.6165C223.772 33.6165 223.458 33.6911 223.183 33.8402C222.911 33.986 222.696 34.1899 222.537 34.4517C222.378 34.7102 222.298 35.0052 222.298 35.3366V40H220.812ZM229.203 40.1541C228.45 40.1541 227.802 39.9934 227.259 39.6719C226.718 39.3471 226.301 38.8913 226.006 38.3047C225.714 37.7147 225.568 37.0237 225.568 36.2315C225.568 35.4493 225.714 34.7599 226.006 34.1634C226.301 33.5668 226.712 33.1011 227.239 32.7663C227.769 32.4316 228.389 32.2642 229.098 32.2642C229.529 32.2642 229.947 32.3355 230.351 32.478C230.755 32.6205 231.118 32.8442 231.44 33.1491C231.761 33.4541 232.015 33.8501 232.2 34.3374C232.386 34.8213 232.479 35.4096 232.479 36.1023V36.6293H226.409V35.5156H231.022C231.022 35.1245 230.943 34.7782 230.784 34.4766C230.624 34.1716 230.401 33.9313 230.112 33.7557C229.827 33.58 229.493 33.4922 229.108 33.4922C228.691 33.4922 228.326 33.5949 228.014 33.8004C227.706 34.0026 227.468 34.2678 227.298 34.5959C227.133 34.9207 227.05 35.2737 227.05 35.6548V36.5249C227.05 37.0353 227.139 37.4695 227.318 37.8274C227.501 38.1854 227.754 38.4588 228.079 38.6477C228.404 38.8333 228.783 38.9261 229.218 38.9261C229.499 38.9261 229.756 38.8864 229.988 38.8068C230.22 38.724 230.421 38.6013 230.59 38.4389C230.759 38.2765 230.888 38.076 230.977 37.8374L232.384 38.0909C232.272 38.5052 232.07 38.8681 231.778 39.1797C231.49 39.4879 231.127 39.7282 230.689 39.9006C230.255 40.0696 229.759 40.1541 229.203 40.1541ZM240.056 40.169C239.572 40.169 239.134 40.0795 238.743 39.9006C238.352 39.7183 238.042 39.4548 237.813 39.1101C237.588 38.7654 237.475 38.3428 237.475 37.8423C237.475 37.4115 237.558 37.0568 237.724 36.7784C237.89 36.5 238.113 36.2796 238.395 36.1172C238.677 35.9548 238.992 35.8321 239.34 35.7493C239.688 35.6664 240.042 35.6035 240.404 35.5604C240.861 35.5073 241.232 35.4643 241.517 35.4311C241.802 35.3946 242.009 35.3366 242.139 35.2571C242.268 35.1776 242.333 35.0483 242.333 34.8693V34.8345C242.333 34.4003 242.21 34.0639 241.965 33.8253C241.723 33.5866 241.361 33.4673 240.881 33.4673C240.38 33.4673 239.986 33.5784 239.698 33.8004C239.413 34.0192 239.215 34.2628 239.106 34.5312L237.709 34.2131C237.875 33.7491 238.117 33.3745 238.435 33.0895C238.756 32.8011 239.126 32.5923 239.544 32.4631C239.961 32.3305 240.4 32.2642 240.861 32.2642C241.166 32.2642 241.489 32.3007 241.83 32.3736C242.175 32.4432 242.497 32.5724 242.795 32.7614C243.097 32.9503 243.343 33.2204 243.536 33.5717C243.728 33.9197 243.824 34.3722 243.824 34.929V40H242.372V38.956H242.313C242.217 39.1482 242.072 39.3371 241.88 39.5227C241.688 39.7083 241.441 39.8625 241.139 39.9851C240.838 40.1077 240.477 40.169 240.056 40.169ZM240.379 38.9759C240.79 38.9759 241.141 38.8946 241.433 38.7322C241.728 38.5698 241.951 38.3577 242.104 38.0959C242.26 37.8307 242.338 37.5473 242.338 37.2457V36.2614C242.285 36.3144 242.182 36.3641 242.029 36.4105C241.88 36.4536 241.709 36.4917 241.517 36.5249C241.325 36.5547 241.138 36.5829 240.955 36.6094C240.773 36.6326 240.621 36.6525 240.498 36.669C240.21 36.7055 239.946 36.7668 239.708 36.853C239.472 36.9392 239.283 37.0634 239.141 37.2259C239.002 37.3849 238.932 37.5971 238.932 37.8622C238.932 38.2301 239.068 38.5085 239.34 38.6974C239.611 38.883 239.958 38.9759 240.379 38.9759ZM247.29 29.8182V40H245.804V29.8182H247.29ZM252.581 40.1541C251.829 40.1541 251.181 39.9934 250.638 39.6719C250.097 39.3471 249.68 38.8913 249.385 38.3047C249.093 37.7147 248.947 37.0237 248.947 36.2315C248.947 35.4493 249.093 34.7599 249.385 34.1634C249.68 33.5668 250.091 33.1011 250.618 32.7663C251.148 32.4316 251.768 32.2642 252.477 32.2642C252.908 32.2642 253.326 32.3355 253.73 32.478C254.134 32.6205 254.497 32.8442 254.819 33.1491C255.14 33.4541 255.394 33.8501 255.579 34.3374C255.765 34.8213 255.858 35.4096 255.858 36.1023V36.6293H249.787V35.5156H254.401C254.401 35.1245 254.322 34.7782 254.162 34.4766C254.003 34.1716 253.78 33.9313 253.491 33.7557C253.206 33.58 252.872 33.4922 252.487 33.4922C252.069 33.4922 251.705 33.5949 251.393 33.8004C251.085 34.0026 250.846 34.2678 250.677 34.5959C250.512 34.9207 250.429 35.2737 250.429 35.6548V36.5249C250.429 37.0353 250.518 37.4695 250.697 37.8274C250.88 38.1854 251.133 38.4588 251.458 38.6477C251.783 38.8333 252.162 38.9261 252.596 38.9261C252.878 38.9261 253.135 38.8864 253.367 38.8068C253.599 38.724 253.8 38.6013 253.969 38.4389C254.138 38.2765 254.267 38.076 254.356 37.8374L255.763 38.0909C255.651 38.5052 255.448 38.8681 255.157 39.1797C254.868 39.4879 254.506 39.7282 254.068 39.9006C253.634 40.0696 253.138 40.1541 252.581 40.1541ZM257.507 40V32.3636H258.944V33.5767H259.023C259.163 33.1657 259.408 32.8426 259.759 32.6072C260.114 32.3686 260.515 32.2493 260.962 32.2493C261.055 32.2493 261.165 32.2526 261.29 32.2592C261.42 32.2659 261.521 32.2741 261.594 32.2841V33.706C261.534 33.6894 261.428 33.6712 261.276 33.6513C261.123 33.6281 260.971 33.6165 260.818 33.6165C260.467 33.6165 260.154 33.6911 259.879 33.8402C259.607 33.986 259.391 34.1899 259.232 34.4517C259.073 34.7102 258.994 35.0052 258.994 35.3366V40H257.507ZM266.896 32.3636V33.5568H262.725V32.3636H266.896ZM263.843 30.5341H265.33V37.7578C265.33 38.0462 265.373 38.2633 265.459 38.4091C265.545 38.5516 265.656 38.6494 265.792 38.7024C265.931 38.7521 266.082 38.777 266.245 38.777C266.364 38.777 266.468 38.7687 266.558 38.7521C266.647 38.7356 266.717 38.7223 266.767 38.7124L267.035 39.9403C266.949 39.9735 266.826 40.0066 266.667 40.0398C266.508 40.0762 266.309 40.0961 266.071 40.0994C265.68 40.1061 265.315 40.0365 264.977 39.8906C264.639 39.7448 264.365 39.5194 264.157 39.2145C263.948 38.9096 263.843 38.5268 263.843 38.0661V30.5341ZM274.14 34.228L272.792 34.4666C272.736 34.2943 272.646 34.1302 272.524 33.9744C272.404 33.8187 272.242 33.6911 272.037 33.5916C271.831 33.4922 271.574 33.4425 271.266 33.4425C270.845 33.4425 270.494 33.5369 270.212 33.7259C269.93 33.9115 269.789 34.1518 269.789 34.4467C269.789 34.7019 269.884 34.9074 270.073 35.0632C270.262 35.219 270.567 35.3466 270.988 35.446L272.201 35.7244C272.903 35.8868 273.427 36.1371 273.772 36.4751C274.116 36.8132 274.289 37.2524 274.289 37.7926C274.289 38.25 274.156 38.6577 273.891 39.0156C273.629 39.3703 273.263 39.6487 272.792 39.8509C272.325 40.053 271.783 40.1541 271.167 40.1541C270.311 40.1541 269.614 39.9718 269.074 39.6072C268.533 39.2393 268.202 38.7173 268.079 38.0412L269.516 37.8224C269.605 38.197 269.789 38.4804 270.068 38.6726C270.346 38.8615 270.709 38.956 271.157 38.956C271.644 38.956 272.033 38.8549 272.325 38.6527C272.617 38.4472 272.762 38.197 272.762 37.902C272.762 37.6634 272.673 37.4628 272.494 37.3004C272.318 37.138 272.048 37.0154 271.684 36.9325L270.391 36.6491C269.678 36.4867 269.151 36.2282 268.81 35.8736C268.472 35.5189 268.303 35.0698 268.303 34.5263C268.303 34.0755 268.429 33.6811 268.681 33.343C268.933 33.005 269.281 32.7415 269.725 32.5526C270.169 32.3603 270.678 32.2642 271.251 32.2642C272.076 32.2642 272.726 32.4432 273.2 32.8011C273.674 33.1558 273.987 33.6314 274.14 34.228Z" fill="#616161" />
                <rect x="295" y="17" width="165" height="36" rx="8" fill="#E7B119" />
                <path d="M307.49 35.1C307.49 34.1387 307.705 33.28 308.134 32.524C308.573 31.7587 309.165 31.166 309.912 30.746C310.668 30.3167 311.513 30.102 312.446 30.102C313.538 30.102 314.495 30.382 315.316 30.942C316.137 31.502 316.711 32.2767 317.038 33.266H314.784C314.56 32.7993 314.243 32.4493 313.832 32.216C313.431 31.9827 312.964 31.866 312.432 31.866C311.863 31.866 311.354 32.0013 310.906 32.272C310.467 32.5333 310.122 32.9067 309.87 33.392C309.627 33.8773 309.506 34.4467 309.506 35.1C309.506 35.744 309.627 36.3133 309.87 36.808C310.122 37.2933 310.467 37.6713 310.906 37.942C311.354 38.2033 311.863 38.334 312.432 38.334C312.964 38.334 313.431 38.2173 313.832 37.984C314.243 37.7413 314.56 37.3867 314.784 36.92H317.038C316.711 37.9187 316.137 38.698 315.316 39.258C314.504 39.8087 313.547 40.084 312.446 40.084C311.513 40.084 310.668 39.874 309.912 39.454C309.165 39.0247 308.573 38.432 308.134 37.676C307.705 36.92 307.49 36.0613 307.49 35.1ZM320.422 33.448C320.674 33.0373 321.001 32.7153 321.402 32.482C321.813 32.2487 322.279 32.132 322.802 32.132V34.19H322.284C321.668 34.19 321.201 34.3347 320.884 34.624C320.576 34.9133 320.422 35.4173 320.422 36.136V40H318.462V32.244H320.422V33.448ZM331.082 35.954C331.082 36.234 331.064 36.486 331.026 36.71H325.356C325.403 37.27 325.599 37.7087 325.944 38.026C326.29 38.3433 326.714 38.502 327.218 38.502C327.946 38.502 328.464 38.1893 328.772 37.564H330.886C330.662 38.3107 330.233 38.9267 329.598 39.412C328.964 39.888 328.184 40.126 327.26 40.126C326.514 40.126 325.842 39.9627 325.244 39.636C324.656 39.3 324.194 38.8287 323.858 38.222C323.532 37.6153 323.368 36.9153 323.368 36.122C323.368 35.3193 323.532 34.6147 323.858 34.008C324.185 33.4013 324.642 32.9347 325.23 32.608C325.818 32.2813 326.495 32.118 327.26 32.118C327.998 32.118 328.656 32.2767 329.234 32.594C329.822 32.9113 330.275 33.364 330.592 33.952C330.919 34.5307 331.082 35.198 331.082 35.954ZM329.052 35.394C329.043 34.89 328.861 34.4887 328.506 34.19C328.152 33.882 327.718 33.728 327.204 33.728C326.719 33.728 326.308 33.8773 325.972 34.176C325.646 34.4653 325.445 34.8713 325.37 35.394H329.052ZM331.759 36.094C331.759 35.31 331.913 34.6147 332.221 34.008C332.538 33.4013 332.963 32.9347 333.495 32.608C334.036 32.2813 334.638 32.118 335.301 32.118C335.88 32.118 336.384 32.2347 336.813 32.468C337.252 32.7013 337.602 32.9953 337.863 33.35V32.244H339.837V40H337.863V38.866C337.611 39.23 337.261 39.5333 336.813 39.776C336.374 40.0093 335.866 40.126 335.287 40.126C334.634 40.126 334.036 39.958 333.495 39.622C332.963 39.286 332.538 38.8147 332.221 38.208C331.913 37.592 331.759 36.8873 331.759 36.094ZM337.863 36.122C337.863 35.646 337.77 35.24 337.583 34.904C337.396 34.5587 337.144 34.2973 336.827 34.12C336.51 33.9333 336.169 33.84 335.805 33.84C335.441 33.84 335.105 33.9287 334.797 34.106C334.489 34.2833 334.237 34.5447 334.041 34.89C333.854 35.226 333.761 35.6273 333.761 36.094C333.761 36.5607 333.854 36.9713 334.041 37.326C334.237 37.6713 334.489 37.9373 334.797 38.124C335.114 38.3107 335.45 38.404 335.805 38.404C336.169 38.404 336.51 38.3153 336.827 38.138C337.144 37.9513 337.396 37.69 337.583 37.354C337.77 37.0087 337.863 36.598 337.863 36.122ZM343.783 33.854V37.606C343.783 37.8673 343.844 38.0587 343.965 38.18C344.096 38.292 344.31 38.348 344.609 38.348H345.519V40H344.287C342.635 40 341.809 39.1973 341.809 37.592V33.854H340.885V32.244H341.809V30.326H343.783V32.244H345.519V33.854H343.783ZM353.889 35.954C353.889 36.234 353.87 36.486 353.833 36.71H348.163C348.21 37.27 348.406 37.7087 348.751 38.026C349.096 38.3433 349.521 38.502 350.025 38.502C350.753 38.502 351.271 38.1893 351.579 37.564H353.693C353.469 38.3107 353.04 38.9267 352.405 39.412C351.77 39.888 350.991 40.126 350.067 40.126C349.32 40.126 348.648 39.9627 348.051 39.636C347.463 39.3 347.001 38.8287 346.665 38.222C346.338 37.6153 346.175 36.9153 346.175 36.122C346.175 35.3193 346.338 34.6147 346.665 34.008C346.992 33.4013 347.449 32.9347 348.037 32.608C348.625 32.2813 349.302 32.118 350.067 32.118C350.804 32.118 351.462 32.2767 352.041 32.594C352.629 32.9113 353.082 33.364 353.399 33.952C353.726 34.5307 353.889 35.198 353.889 35.954ZM351.859 35.394C351.85 34.89 351.668 34.4887 351.313 34.19C350.958 33.882 350.524 33.728 350.011 33.728C349.526 33.728 349.115 33.8773 348.779 34.176C348.452 34.4653 348.252 34.8713 348.177 35.394H351.859ZM364.189 30.228V31.81H360.115V34.316H363.237V35.87H360.115V40H358.155V30.228H364.189ZM367.289 33.448C367.541 33.0373 367.868 32.7153 368.269 32.482C368.68 32.2487 369.147 32.132 369.669 32.132V34.19H369.151C368.535 34.19 368.069 34.3347 367.751 34.624C367.443 34.9133 367.289 35.4173 367.289 36.136V40H365.329V32.244H367.289V33.448ZM377.949 35.954C377.949 36.234 377.931 36.486 377.893 36.71H372.223C372.27 37.27 372.466 37.7087 372.811 38.026C373.157 38.3433 373.581 38.502 374.085 38.502C374.813 38.502 375.331 38.1893 375.639 37.564H377.753C377.529 38.3107 377.1 38.9267 376.465 39.412C375.831 39.888 375.051 40.126 374.127 40.126C373.381 40.126 372.709 39.9627 372.111 39.636C371.523 39.3 371.061 38.8287 370.725 38.222C370.399 37.6153 370.235 36.9153 370.235 36.122C370.235 35.3193 370.399 34.6147 370.725 34.008C371.052 33.4013 371.509 32.9347 372.097 32.608C372.685 32.2813 373.362 32.118 374.127 32.118C374.865 32.118 375.523 32.2767 376.101 32.594C376.689 32.9113 377.142 33.364 377.459 33.952C377.786 34.5307 377.949 35.198 377.949 35.954ZM375.919 35.394C375.91 34.89 375.728 34.4887 375.373 34.19C375.019 33.882 374.585 33.728 374.071 33.728C373.586 33.728 373.175 33.8773 372.839 34.176C372.513 34.4653 372.312 34.8713 372.237 35.394H375.919ZM386.34 35.954C386.34 36.234 386.321 36.486 386.284 36.71H380.614C380.661 37.27 380.857 37.7087 381.202 38.026C381.547 38.3433 381.972 38.502 382.476 38.502C383.204 38.502 383.722 38.1893 384.03 37.564H386.144C385.92 38.3107 385.491 38.9267 384.856 39.412C384.221 39.888 383.442 40.126 382.518 40.126C381.771 40.126 381.099 39.9627 380.502 39.636C379.914 39.3 379.452 38.8287 379.116 38.222C378.789 37.6153 378.626 36.9153 378.626 36.122C378.626 35.3193 378.789 34.6147 379.116 34.008C379.443 33.4013 379.9 32.9347 380.488 32.608C381.076 32.2813 381.753 32.118 382.518 32.118C383.255 32.118 383.913 32.2767 384.492 32.594C385.08 32.9113 385.533 33.364 385.85 33.952C386.177 34.5307 386.34 35.198 386.34 35.954ZM384.31 35.394C384.301 34.89 384.119 34.4887 383.764 34.19C383.409 33.882 382.975 33.728 382.462 33.728C381.977 33.728 381.566 33.8773 381.23 34.176C380.903 34.4653 380.703 34.8713 380.628 35.394H384.31ZM396.599 38.138H392.707L392.063 40H390.005L393.519 30.214H395.801L399.315 40H397.243L396.599 38.138ZM396.067 36.57L394.653 32.482L393.239 36.57H396.067ZM399.874 36.122C399.874 35.3193 400.037 34.6193 400.364 34.022C400.691 33.4153 401.143 32.9487 401.722 32.622C402.301 32.286 402.963 32.118 403.71 32.118C404.671 32.118 405.465 32.3607 406.09 32.846C406.725 33.322 407.149 33.994 407.364 34.862H405.25C405.138 34.526 404.947 34.2647 404.676 34.078C404.415 33.882 404.088 33.784 403.696 33.784C403.136 33.784 402.693 33.9893 402.366 34.4C402.039 34.8013 401.876 35.3753 401.876 36.122C401.876 36.8593 402.039 37.4333 402.366 37.844C402.693 38.2453 403.136 38.446 403.696 38.446C404.489 38.446 405.007 38.0913 405.25 37.382H407.364C407.149 38.222 406.725 38.8893 406.09 39.384C405.455 39.8787 404.662 40.126 403.71 40.126C402.963 40.126 402.301 39.9627 401.722 39.636C401.143 39.3 400.691 38.8333 400.364 38.236C400.037 37.6293 399.874 36.9247 399.874 36.122ZM408.046 36.122C408.046 35.3193 408.209 34.6193 408.536 34.022C408.863 33.4153 409.315 32.9487 409.894 32.622C410.473 32.286 411.135 32.118 411.882 32.118C412.843 32.118 413.637 32.3607 414.262 32.846C414.897 33.322 415.321 33.994 415.536 34.862H413.422C413.31 34.526 413.119 34.2647 412.848 34.078C412.587 33.882 412.26 33.784 411.868 33.784C411.308 33.784 410.865 33.9893 410.538 34.4C410.211 34.8013 410.048 35.3753 410.048 36.122C410.048 36.8593 410.211 37.4333 410.538 37.844C410.865 38.2453 411.308 38.446 411.868 38.446C412.661 38.446 413.179 38.0913 413.422 37.382H415.536C415.321 38.222 414.897 38.8893 414.262 39.384C413.627 39.8787 412.834 40.126 411.882 40.126C411.135 40.126 410.473 39.9627 409.894 39.636C409.315 39.3 408.863 38.8333 408.536 38.236C408.209 37.6293 408.046 36.9247 408.046 36.122ZM420.166 40.126C419.419 40.126 418.747 39.9627 418.15 39.636C417.553 39.3 417.081 38.8287 416.736 38.222C416.4 37.6153 416.232 36.9153 416.232 36.122C416.232 35.3287 416.405 34.6287 416.75 34.022C417.105 33.4153 417.585 32.9487 418.192 32.622C418.799 32.286 419.475 32.118 420.222 32.118C420.969 32.118 421.645 32.286 422.252 32.622C422.859 32.9487 423.335 33.4153 423.68 34.022C424.035 34.6287 424.212 35.3287 424.212 36.122C424.212 36.9153 424.03 37.6153 423.666 38.222C423.311 38.8287 422.826 39.3 422.21 39.636C421.603 39.9627 420.922 40.126 420.166 40.126ZM420.166 38.418C420.521 38.418 420.852 38.334 421.16 38.166C421.477 37.9887 421.729 37.7273 421.916 37.382C422.103 37.0367 422.196 36.6167 422.196 36.122C422.196 35.3847 422 34.82 421.608 34.428C421.225 34.0267 420.754 33.826 420.194 33.826C419.634 33.826 419.163 34.0267 418.78 34.428C418.407 34.82 418.22 35.3847 418.22 36.122C418.22 36.8593 418.402 37.4287 418.766 37.83C419.139 38.222 419.606 38.418 420.166 38.418ZM432.722 32.244V40H430.748V39.02C430.496 39.356 430.164 39.622 429.754 39.818C429.352 40.0047 428.914 40.098 428.438 40.098C427.831 40.098 427.294 39.972 426.828 39.72C426.361 39.4587 425.992 39.0807 425.722 38.586C425.46 38.082 425.33 37.4847 425.33 36.794V32.244H427.29V36.514C427.29 37.13 427.444 37.606 427.752 37.942C428.06 38.2687 428.48 38.432 429.012 38.432C429.553 38.432 429.978 38.2687 430.286 37.942C430.594 37.606 430.748 37.13 430.748 36.514V32.244H432.722ZM438.703 32.132C439.627 32.132 440.374 32.426 440.943 33.014C441.513 33.5927 441.797 34.4047 441.797 35.45V40H439.837V35.716C439.837 35.1 439.683 34.6287 439.375 34.302C439.067 33.966 438.647 33.798 438.115 33.798C437.574 33.798 437.145 33.966 436.827 34.302C436.519 34.6287 436.365 35.1 436.365 35.716V40H434.405V32.244H436.365V33.21C436.627 32.874 436.958 32.6127 437.359 32.426C437.77 32.23 438.218 32.132 438.703 32.132ZM445.693 33.854V37.606C445.693 37.8673 445.754 38.0587 445.875 38.18C446.006 38.292 446.221 38.348 446.519 38.348H447.429V40H446.197C444.545 40 443.719 39.1973 443.719 37.592V33.854H442.795V32.244H443.719V30.326H445.693V32.244H447.429V33.854H445.693Z" fill="white" />
              </svg>

            </Box>
          </>
        )} */}
        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex' ,flexDirection:'column', gap: 2, ...globalStyles }}>
          <Button
            variant="contained"
            onClick={handleApplyFiltersClick}
            fullWidth
            sx={{
              backgroundColor: 'black',
              borderRadius: 5,
              color: 'white',
              '&:hover': { backgroundColor: '#333' },
            }}
          >
            Show Results
          </Button>
          <Button
            variant="outlined"
            onClick={handleClearFiltersClick}
            fullWidth
            sx={{
              color: '#616161',
              borderRadius: 5,
              borderColor: '#e0e0e0',
              '&:hover': { borderColor: '#616161', backgroundColor: 'rgba(0,0,0,0.04)' },
            }}
          >
            Clear All
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default FilterDrawer;