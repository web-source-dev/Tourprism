'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  SelectChangeEvent,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Divider,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

// Alert category and type options
const ALERT_CATEGORIES = [
  'Natural Disaster',
  'Civil Unrest',
  'Health',
  'Transportation',
  'Security',
  'Weather',
  'Other'
];

const ALERT_TYPES = {
  'Natural Disaster': ['Earthquake', 'Flood', 'Hurricane', 'Tsunami', 'Wildfire', 'Landslide', 'Volcanic Activity'],
  'Civil Unrest': ['Protest', 'Riot', 'Strike', 'Political Crisis', 'Demonstration'],
  'Health': ['Disease Outbreak', 'Epidemic', 'Pandemic', 'Health Advisory'],
  'Transportation': ['Road Closure', 'Airport Disruption', 'Railway Incident', 'Public Transit Issue'],
  'Security': ['Terrorism', 'Crime', 'Kidnapping', 'Bombing', 'Shooting', 'Theft'],
  'Weather': ['Extreme Heat', 'Extreme Cold', 'Blizzard', 'Storm', 'Heavy Rain', 'Fog'],
  'Other': ['General Advisory', 'Administrative', 'Celebration', 'Cultural Event']
};

const TARGET_AUDIENCES = [
  'Hotels',
  'Tour Operators',
  'Travel Agencies',
  'Tourists',
  'Business Travelers',
  'Locals',
  'All'
];

// Simplified sort options as requested
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'expectedStart:desc', label: 'Start Date (Newest)' },
  { value: 'expectedStart:asc', label: 'Start Date (Oldest)' },
  { value: 'priority:desc', label: 'Priority (High to Low)' },
  { value: 'priority:asc', label: 'Priority (Low to High)' }
];

// Custom MenuProps to increase dropdown height
const MENU_PROPS = {
  PaperProps: {
    style: {
      maxHeight: 300, // Increase height to show more items
      width: 'auto'
    }
  },
  anchorOrigin: {
    vertical: 'bottom' as const,
    horizontal: 'left' as const
  },
  transformOrigin: {
    vertical: 'top' as const,
    horizontal: 'left' as const
  }
};

// Define a proper type for our filter state
interface FilterState {
  status: string[];
  categories: string[];
  types: string[];
  audience: string[];
  city: string;
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  sortBy: string;
}

// Define FilterRecord for applied filters to be passed to parent
interface FilterRecord {
  status?: string[];
  categories?: string[];
  types?: string[];
  audience?: string[];
  city?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  sortBy?: string;
}

interface AlertFiltersProps {
  onFilterChange: (filters: FilterRecord) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onClearFilters: () => void;
  appliedFilters: FilterRecord;
}

export default function AlertFilters({
  onFilterChange,
  onSearch,
  searchQuery,
  onClearFilters,
  appliedFilters
}: AlertFiltersProps) {
  // State for filters - applied immediately
  const [filters, setFilters] = useState<FilterState>({
    status: Array.isArray(appliedFilters.status) ? appliedFilters.status : [],
    categories: Array.isArray(appliedFilters.categories) ? appliedFilters.categories : [],
    types: Array.isArray(appliedFilters.types) ? appliedFilters.types : [],
    audience: Array.isArray(appliedFilters.audience) ? appliedFilters.audience : [],
    city: typeof appliedFilters.city === 'string' ? appliedFilters.city : '',
    dateRange: {
      startDate: appliedFilters.startDate instanceof Date ? appliedFilters.startDate : null,
      endDate: appliedFilters.endDate instanceof Date ? appliedFilters.endDate : null
    },
    sortBy: typeof appliedFilters.sortBy === 'string' ? appliedFilters.sortBy : 'createdAt:desc'
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Update available types when category changes
  useEffect(() => {
    if (selectedCategory && ALERT_TYPES[selectedCategory as keyof typeof ALERT_TYPES]) {
      setAvailableTypes(ALERT_TYPES[selectedCategory as keyof typeof ALERT_TYPES]);
    } else {
      // If no category is selected, show all types across all categories
      const allTypes = Object.values(ALERT_TYPES).flat();
      setAvailableTypes([...new Set(allTypes)]);
    }
  }, [selectedCategory]);

  // Helper function to apply filters - memoized with useCallback
  const applyFilters = useCallback(() => {
    const appliedFilters: FilterRecord = {
      status: filters.status,
      categories: filters.categories,
      types: filters.types,
      audience: filters.audience,
      city: filters.city,
      startDate: filters.dateRange.startDate,
      endDate: filters.dateRange.endDate,
      sortBy: filters.sortBy
    };
    
    onFilterChange(appliedFilters);
  }, [filters, onFilterChange]);

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setFilters(prev => ({ ...prev, status: value }));
  };

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setFilters(prev => ({ ...prev, categories: value }));
    
    // If only one category is selected, update the available types
    if (value.length === 1) {
      setSelectedCategory(value[0]);
    } else {
      setSelectedCategory(null);
    }
  };

  const handleTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setFilters(prev => ({ ...prev, types: value }));
  };

  const handleAudienceChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setFilters(prev => ({ ...prev, audience: value }));
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setFilters(prev => ({ ...prev, sortBy: value }));
  };

  const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters(prev => ({ ...prev, city: value }));
  };

  const handleStartDateChange = (date: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, startDate: date }
    }));
  };

  const handleEndDateChange = (date: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, endDate: date }
    }));
  };

  const handleClear = () => {
    // Reset local filter state
    setFilters({
      status: [],
      categories: [],
      types: [],
      audience: [],
      city: '',
      dateRange: {
        startDate: null,
        endDate: null
      },
      sortBy: 'createdAt:desc'
    });
    
    // Call the parent's clear function
    onClearFilters();
  };

  const getAppliedFiltersCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.types.length > 0) count++;
    if (filters.audience.length > 0) count++;
    if (filters.city) count++;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    if (filters.sortBy !== 'createdAt:desc') count++;
    return count;
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0}>
      {/* Search bar and sort dropdown */}
      <Box mb={3}>
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2} 
          alignItems="flex-start"
          sx={{ mb: 2 }}
        >
          <Box sx={{ position: 'relative', width: { xs: '100%', md: '350px' } }}>
            <TextField
              fullWidth
              placeholder="Search alerts by title or description"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                ),
                endAdornment: searchQuery ? (
                  <IconButton 
                    size="small" 
                    onClick={() => onSearch('')}
                    sx={{ p: '4px' }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ) : null
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}
            />
          </Box>

          <FormControl sx={{ width: { xs: '100%', md: '200px' } }}>
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              id="sort-by"
              value={filters.sortBy}
              onChange={handleSortChange}
              label="Sort By"
              MenuProps={MENU_PROPS}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ ml: { md: 'auto' } }}>
            <Button 
              variant="outlined" 
              onClick={handleClear}
              sx={{ borderColor: 'divider', color: 'text.secondary' }}
              disabled={getAppliedFiltersCount() === 0}
              startIcon={<ClearIcon />}
            >
              Clear Filters
              {getAppliedFiltersCount() > 0 && (
                <Chip 
                  size="small" 
                  label={getAppliedFiltersCount()} 
                  sx={{ 
                    ml: 1, 
                    height: '20px',
                    bgcolor: 'divider'
                  }} 
                />
              )}
            </Button>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Filter fields using Box layout */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Status filter */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' } }}>
          <FormControl fullWidth>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              multiple
              value={filters.status}
              onChange={handleStatusChange}
              input={<OutlinedInput label="Status" />}
              MenuProps={MENU_PROPS}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Category filter */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' } }}>
          <FormControl fullWidth>
            <InputLabel id="category-label">Alert Category</InputLabel>
            <Select
              labelId="category-label"
              id="category"
              multiple
              value={filters.categories}
              onChange={handleCategoryChange}
              input={<OutlinedInput label="Alert Category" />}
              MenuProps={MENU_PROPS}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {ALERT_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  <Checkbox checked={filters.categories.indexOf(category) > -1} />
                  <ListItemText primary={category} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Alert Type filter */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' } }}>
          <FormControl fullWidth>
            <InputLabel id="type-label">Alert Type</InputLabel>
            <Select
              labelId="type-label"
              id="type"
              multiple
              value={filters.types}
              onChange={handleTypeChange}
              input={<OutlinedInput label="Alert Type" />}
              MenuProps={MENU_PROPS}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {availableTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  <Checkbox checked={filters.types.indexOf(type) > -1} />
                  <ListItemText primary={type} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* City filter */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' } }}>
          <TextField
            fullWidth
            label="City"
            value={filters.city}
            onChange={handleCityChange}
            placeholder="Filter by city"
          />
        </Box>

        {/* Date Range filter */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' } }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date"
                value={filters.dateRange.startDate}
                onChange={handleStartDateChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={filters.dateRange.endDate}
                onChange={handleEndDateChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true
                  }
                }}
              />
            </Stack>
          </LocalizationProvider>
        </Box>

        {/* Target Audience filter */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' } }}>
          <FormControl fullWidth>
            <InputLabel id="audience-label">Target Audience</InputLabel>
            <Select
              labelId="audience-label"
              id="audience"
              multiple
              value={filters.audience}
              onChange={handleAudienceChange}
              input={<OutlinedInput label="Target Audience" />}
              MenuProps={MENU_PROPS}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {TARGET_AUDIENCES.map((audience) => (
                <MenuItem key={audience} value={audience}>
                  <Checkbox checked={filters.audience.indexOf(audience) > -1} />
                  <ListItemText primary={audience} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
    </Paper>
  );
} 