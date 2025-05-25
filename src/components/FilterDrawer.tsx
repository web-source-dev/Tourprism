'use client';

import React, { useState } from 'react';
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
  "Transport",
  "Civil Unrest",
  "Health",
  "General Safety",
  "Natural Disaster"
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest First', default: true },
  { value: 'impact', label: 'Highest Impact' }
];

const IMPACT_LEVELS = [
  { value: 'Minor', label: 'Low' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Severe', label: 'High' },
];

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  resultCount?: number;
  onApplyFilters: () => void;
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
    impactLevel: '', // Default to 'All'
    sortBy: 'latest', // Default to 'Latest First'
    distance: 50
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
  const { isAuthenticated, isSubscribed } = useAuth();

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };
  const DATE_RANGES = [
    { value: 7, label: 'This Week' },
    { value: -1, label: isSubscribed ? 'Custom' : 'Custom (Premium)' },
  ];
  const handleTimeRangeChange = (value: number) => {
    if (value === -1 && !isSubscribed) {
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
    // Toggle the selected impact level
    const updatedImpact = filters.impactLevel === impactLevel ? '' : impactLevel;
    onFilterChange({
      ...filters,
      impactLevel: updatedImpact
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
    console.log('Applying filters:', filters);
    onApplyFilters();
  };

  const handleClearFiltersClick = () => {
    onClearFilters();
  };

  // Helper function to get selected incident type label
  const getSelectedIncidentType = () => {
    if (filters.alertCategory.length === 0) return 'All Types';
    return filters.alertCategory.join(', ');
  };

  // Helper function to get selected date range label
  const getSelectedDateRange = () => {
    const selectedRange = DATE_RANGES.find(range => range.value === filters.timeRange);
    if (filters.timeRange === -1) {
      return 'Custom';
    }
    return selectedRange ? selectedRange.label : 'All Time';
  };

  // Helper function to get selected impact level label
  const getSelectedImpactLevel = () => {
    if (!filters.impactLevel) return 'All';
    const impactLevel = IMPACT_LEVELS.find(level => level.value === filters.impactLevel);
    return impactLevel ? impactLevel.label : 'All';
  };

  // Helper function to get selected sort label
  const getSelectedSortOption = () => {
    const sortOption = SORT_OPTIONS.find(option => option.value === filters.sortBy);
    return sortOption ? sortOption.label : 'Latest First';
  };


  const handlePremium = () => {
    showToast("Please subscribe to unlock this filter", "error");
  }

  const useIsMobile = () => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.down('sm'));
  }
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
          p: 2,
          backgroundColor: 'white',
          color: 'black',
        },
      }}
    >
      <Box sx={{ p: isAuthenticated ? 2 : 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">Filters</Typography>
          <IconButton onClick={onClose}>
            <Typography sx={{ fontSize: '16px', fontWeight: 'bold' }}>X</Typography>
          </IconButton>
        </Box>
        {!isAuthenticated ? (
          <>
            <Box sx={{ mt: 2, cursor: 'pointer', display: { xs: 'block', md: 'none' } }} onClick={() => handlePremium()}>
              {/* Premium subscription SVG - keep existing code */}
            </Box>

            <Box sx={{ mt: 2, cursor: 'pointer', display: { xs: 'block', md: 'none' } }} onClick={() => window.location.href = '/login'}>
              {/* Login SVG - keep existing code */}
            </Box>

          </>
        ) : (
          <>
            {/* Type Filter */}
            <Accordion
              expanded={expanded === 'type'}
              onChange={handleAccordionChange('type')}
              sx={{
                boxShadow: 'none',
                '&:before': { display: 'none' },
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 0 }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="body1" fontWeight="medium">{getSelectedIncidentType()}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <List sx={{ width: '100%', p: 0 }}>
                  {INCIDENT_TYPES.map((type) => (
                    <ListItem
                      key={type}
                      onClick={() => handleIncidentTypeChange(type)}
                      sx={{ 
                        py: 0.5, 
                        px: 0,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                      component="div"
                    >
                      <ListItemText primary={type} />
                      {(type === "All" && filters.alertCategory.length === 0) && <SelectedIcon />}
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Location Filter */}
            {isSubscribed ? (
              <Accordion
                expanded={expanded === 'location'}
                onChange={handleAccordionChange('location')}
                sx={{
                  boxShadow: 'none',
                  '&:before': { display: 'none' },
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 0 }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">Location</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight="medium">
                        {currentCity || 'Edinburgh'}
                        {locationAccuracy && (
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            (±{Math.round(locationAccuracy)}m)
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {isUsingCurrentLocation ? (
                      <Button
                        variant="outlined"
                        onClick={onResetLocation}
                        fullWidth
                        sx={{
                          color: '#616161',
                          borderColor: '#e0e0e0',
                          textTransform: 'none',
                          borderRadius: 1
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
                          borderRadius: 1
                        }}
                      >
                        Use my location
                      </Button>
                    )}

                    {/* Distance slider */}
                    <Box sx={{ px: 1, mt: 1 }}>
                      <Typography variant="body2" gutterBottom>Distance (km)</Typography>
                      <Slider
                        value={filters.distance || 50}
                        onChange={handleDistanceChange}
                        min={2}
                        max={100}
                        step={1}
                        marks={[{ value: 2, label: '2' }, { value: 100, label: '100km' }]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}km`}
                        sx={{ color: '#616161' }}
                      />
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ) : (
              <Box sx={{ cursor: "pointer", py: 2, borderBottom: '1px solid #e0e0e0' }} display="flex" alignItems='center' justifyContent="space-between" onClick={() => handlePremium()}>
                <Box display="flex" flexDirection="column">
                  <Typography
                    variant="body2"
                    fontWeight="400"
                    color="grey.700"
                    sx={{ fontSize: '14px' }}
                  >
                    Location
                  </Typography>
                  <Typography
                    variant="body1"
                    color="grey.800"
                    sx={{ fontSize: '14px', mt: '2px', fontWeight: '600' }}
                  >
                    Edinburgh
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.99967 11.4582C10.3449 11.4582 10.6247 11.738 10.6247 12.0832V13.7498C10.6247 14.095 10.3449 14.3748 9.99967 14.3748C9.6545 14.3748 9.37467 14.095 9.37467 13.7498V12.0832C9.37467 11.738 9.6545 11.4582 9.99967 11.4582Z" fill="#E7B119" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.62467 7.04908V5.4165C5.62467 3.00026 7.58343 1.0415 9.99967 1.0415C12.4159 1.0415 14.3747 3.00026 14.3747 5.4165V7.04908C15.7837 7.38554 16.8655 8.58187 17.0626 10.0458C17.186 10.9628 17.2913 11.9264 17.2913 12.9165C17.2913 13.9066 17.186 14.8702 17.0626 15.7872C16.8363 17.468 15.4437 18.7961 13.7287 18.8749C12.5383 18.9297 11.3295 18.9582 9.99968 18.9582C8.66981 18.9582 7.46104 18.9297 6.27069 18.8749C4.55564 18.7961 3.16308 17.468 2.93677 15.7872C2.81331 14.8702 2.70801 13.9066 2.70801 12.9165C2.70801 11.9264 2.81331 10.9628 2.93677 10.0458C3.13388 8.58187 4.21567 7.38554 5.62467 7.04908ZM6.87467 5.4165C6.87467 3.69061 8.27378 2.2915 9.99967 2.2915C11.7256 2.2915 13.1247 3.69061 13.1247 5.4165V6.93265C12.1274 6.89455 11.1054 6.87484 9.99968 6.87484C8.89397 6.87484 7.87198 6.89455 6.87467 6.93265V5.4165ZM9.99968 8.12484C8.68838 8.12484 7.49876 8.15294 6.32809 8.20676C5.23726 8.2569 4.32409 9.10973 4.17559 10.2126C4.05445 11.1124 3.95801 12.0106 3.95801 12.9165C3.95801 13.8224 4.05445 14.7206 4.17559 15.6204C4.32409 16.7233 5.23726 17.5761 6.32809 17.6263C7.49876 17.6801 8.68838 17.7082 9.99968 17.7082C11.311 17.7082 12.5006 17.6801 13.6713 17.6263C14.7621 17.5761 15.6753 16.7233 15.8238 15.6204C15.9449 14.7206 16.0413 13.8224 16.0413 12.9165C16.0413 12.0106 15.9449 11.1124 15.8238 10.2126C15.6753 9.10973 14.7621 8.2569 13.6713 8.20676C12.5006 8.15294 11.311 8.12484 9.99968 8.12484Z" fill="#E7B119" />
                  </svg>
                </Box>
              </Box>
            )}


            {/* Date Filter */}
            <Accordion
              expanded={expanded === 'date'}
              onChange={handleAccordionChange('date')}
              sx={{
                boxShadow: 'none',
                '&:before': { display: 'none' },
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 0 }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" color="text.secondary">Date</Typography>
                  <Typography variant="body1" fontWeight="medium">{getSelectedDateRange()}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <List sx={{ width: '100%', p: 0 }}>
                  {DATE_RANGES.map((option) => (
                    <ListItem
                      key={option.value}
                      onClick={() => handleTimeRangeChange(option.value)}
                      sx={{ 
                        py: 0.5, 
                        px: 0,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                      component="div"
                    >
                      <span>{option.label}</span>
                      {(option.value === filters.timeRange || (filters.timeRange === undefined && option.value === 7)) && <SelectedIcon />}
                      {option.value === -1 && !isSubscribed && (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.99967 11.4582C10.3449 11.4582 10.6247 11.738 10.6247 12.0832V13.7498C10.6247 14.095 10.3449 14.3748 9.99967 14.3748C9.6545 14.3748 9.37467 14.095 9.37467 13.7498V12.0832C9.37467 11.738 9.6545 11.4582 9.99967 11.4582Z" fill="#E7B119" />
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.62467 7.04908V5.4165C5.62467 3.00026 7.58343 1.0415 9.99967 1.0415C12.4159 1.0415 14.3747 3.00026 14.3747 5.4165V7.04908C15.7837 7.38554 16.8655 8.58187 17.0626 10.0458C17.186 10.9628 17.2913 11.9264 17.2913 12.9165C17.2913 13.9066 17.186 14.8702 17.0626 15.7872C16.8363 17.468 15.4437 18.7961 13.7287 18.8749C12.5383 18.9297 11.3295 18.9582 9.99968 18.9582C8.66981 18.9582 7.46104 18.9297 6.27069 18.8749C4.55564 18.7961 3.16308 17.468 2.93677 15.7872C2.81331 14.8702 2.70801 13.9066 2.70801 12.9165C2.70801 11.9264 2.81331 10.9628 2.93677 10.0458C3.13388 8.58187 4.21567 7.38554 5.62467 7.04908ZM6.87467 5.4165C6.87467 3.69061 8.27378 2.2915 9.99967 2.2915C11.7256 2.2915 13.1247 3.69061 13.1247 5.4165V6.93265C12.1274 6.89455 11.1054 6.87484 9.99968 6.87484C8.89397 6.87484 7.87198 6.89455 6.87467 6.93265V5.4165ZM9.99968 8.12484C8.68838 8.12484 7.49876 8.15294 6.32809 8.20676C5.23726 8.2569 4.32409 9.10973 4.17559 10.2126C4.05445 11.1124 3.95801 12.0106 3.95801 12.9165C3.95801 13.8224 4.05445 14.7206 4.17559 15.6204C4.32409 16.7233 5.23726 17.5761 6.32809 17.6263C7.49876 17.6801 8.68838 17.7082 9.99968 17.7082C11.311 17.7082 12.5006 17.6801 13.6713 17.6263C14.7621 17.5761 15.6753 16.7233 15.8238 15.6204C15.9449 14.7206 16.0413 13.8224 16.0413 12.9165C16.0413 12.0106 15.9449 11.1124 15.8238 10.2126C15.6753 9.10973 14.7621 8.2569 13.6713 8.20676C12.5006 8.15294 11.311 8.12484 9.99968 8.12484Z" fill="#E7B119" />
                          </svg>
                        )}
                    </ListItem>
                  ))}
                </List>

                {filters.timeRange === -1 && isSubscribed && (
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
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 0 }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" color="text.secondary">Impact Level</Typography>
                  <Typography variant="body1" fontWeight="medium">{getSelectedImpactLevel()}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <List sx={{ width: '100%', p: 0 }}>
                  <ListItem
                    onClick={() => handleImpactLevelChange('')}
                    sx={{ 
                      py: 0.5, 
                      px: 0,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                    component="div"
                  >
                    <ListItemText primary="All" />
                    {filters.impactLevel === '' && <SelectedIcon />}
                  </ListItem>
                  {IMPACT_LEVELS.map((level) => (
                    <ListItem
                      key={level.value}
                      onClick={() => handleImpactLevelChange(level.value)}
                      sx={{ 
                        py: 0.5, 
                        px: 0,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                      component="div"
                    >
                      <ListItemText primary={level.label} />
                      {filters.impactLevel === level.value && <SelectedIcon />}
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
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 0 }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" color="text.secondary">Sort by</Typography>
                  <Typography variant="body1" fontWeight="medium">{getSelectedSortOption()}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <List sx={{ width: '100%', p: 0 }}>
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
                        justifyContent: 'space-between'
                      }}
                      component="div"
                    >
                      <ListItemText primary={option.label} />
                      {filters.sortBy === option.value && <SelectedIcon />}
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </>
        )}
        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleApplyFiltersClick}
            fullWidth
            sx={{
              backgroundColor: 'black',
              borderRadius: 5,
              color: 'white',
              '&:hover': { backgroundColor: '#333' }
            }}
          >
            Show Results {resultCount ? `(${resultCount})` : ''}
          </Button>
          <Button
            variant="outlined"
            onClick={handleClearFiltersClick}
            fullWidth
            sx={{
              color: '#616161',
              borderRadius: 5,
              borderColor: '#e0e0e0',
              '&:hover': { borderColor: '#616161', backgroundColor: 'rgba(0,0,0,0.04)' }
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