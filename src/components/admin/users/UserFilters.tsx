'use client';

import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  SelectChangeEvent,
  OutlinedInput,
  Chip,
  Theme,
  useTheme,
  Stack,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { UserFilters as UserFiltersType } from '@/services/api';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name: string, personName: readonly string[], theme: Theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

interface UserFiltersProps {
  onFilterChange: (filters: UserFiltersType) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' }
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'pending', label: 'Pending' },
  { value: 'deleted', label: 'Deleted' }
];

const sortOptions = [
  { value: 'createdAt', label: 'Signup Date' },
  { value: 'lastLogin', label: 'Last Login' },
  { value: 'company.name', label: 'Company' },
  { value: 'role', label: 'Role' }
];

const UserFilters: React.FC<UserFiltersProps> = ({ onFilterChange, onSortChange }) => {
  const theme = useTheme();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [company, setCompany] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleRoleChange = (event: SelectChangeEvent<typeof selectedRoles>) => {
    const {
      target: { value },
    } = event;
    const newSelectedRoles = typeof value === 'string' ? value.split(',') : value;

    // Handle 'all' selection
    if (newSelectedRoles.includes('all')) {
      setSelectedRoles(['all']);
      applyFilters({ role: undefined }); // Remove role filter when 'all' is selected
      return;
    }

    setSelectedRoles(newSelectedRoles);
    
    if (newSelectedRoles.length === 0) {
      // If no roles selected, remove role filter
      const restFilters = { ...currentFilters };
      delete restFilters.role;
      applyFilters(restFilters);
    } else if (newSelectedRoles.length === 1) {
      // If single role selected, use simple role filter
      applyFilters({ role: newSelectedRoles[0] });
    } else {
      // For multiple roles, use comma-separated list
      applyFilters({ role: newSelectedRoles.join(',') });
    }
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setStatus(value);
    applyFilters({ status: value });
  };

  const handleCompanyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCompany(value);
    if (value.trim()) {
      applyFilters({ company: value });
    } else {
      // If company name is cleared, remove it from filters
      const restFilters = { ...currentFilters };
      delete restFilters.company;
      applyFilters(restFilters);
    }
  };

  const handleDateChange = (type: 'start' | 'end', date: Date | null) => {
    if (type === 'start') {
      setStartDate(date);
      if (date) {
        applyFilters({ startDate: date.toISOString().split('T')[0] });
      } else {
        const restFilters = { ...currentFilters };
        delete restFilters.startDate;
        applyFilters(restFilters);
      }
    } else {
      setEndDate(date);
      if (date) {
        applyFilters({ endDate: date.toISOString().split('T')[0] });
      } else {
        const restFilters = { ...currentFilters };
        delete restFilters.endDate;
        applyFilters(restFilters);
      }
    }
  };

  const handleSortByChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSortBy(value);
    onSortChange(value, sortOrder);
  };

  const handleSortOrderChange = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    onSortChange(sortBy, newSortOrder);
  };

  const handleResetFilters = () => {
    setSelectedRoles([]);
    setStatus('all');
    setCompany('');
    setStartDate(null);
    setEndDate(null);
    setSortBy('createdAt');
    setSortOrder('desc');
    onFilterChange({});
    onSortChange('createdAt', 'desc');
  };

  // Keep track of current filters to avoid unnecessary API calls
  const [currentFilters, setCurrentFilters] = useState<UserFiltersType>({});

  const applyFilters = (newFilters: Partial<UserFiltersType>) => {
    const updatedFilters = { ...currentFilters, ...newFilters };
    
    // Remove 'all' values as they're not needed for the API
    Object.keys(updatedFilters).forEach(key => {
      if (updatedFilters[key] === 'all') {
        delete updatedFilters[key];
      }
    });
    
    setCurrentFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <Paper sx={{ p: 3, backgroundColor: '#f9f9f9', borderRadius: 2, mb: 3 }} elevation={0}>
      <Stack spacing={3}>
        {/* Search and Role Filters Row */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2}
          alignItems="flex-start"
        >
          {/* Role filter */}
          <FormControl sx={{ width: { xs: '100%', md: '30%' } }} size="small">
            <InputLabel id="role-filter-label">Role</InputLabel>
            <Select
              labelId="role-filter-label"
              id="role-filter"
              multiple
              value={selectedRoles}
              onChange={handleRoleChange}
              input={<OutlinedInput label="Role" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={roleOptions.find(role => role.value === value)?.label || value} 
                      size="small" 
                    />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {roleOptions.map((role) => (
                <MenuItem
                  key={role.value}
                  value={role.value}
                  style={getStyles(role.value, selectedRoles, theme)}
                >
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status filter */}
          <FormControl sx={{ width: { xs: '100%', md: '20%' } }} size="small">
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={status}
              label="Status"
              onChange={handleStatusChange}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Company filter */}
          <TextField
            sx={{ width: { xs: '100%', md: '30%' } }}
            label="Company Name"
            variant="outlined"
            size="small"
            value={company}
            onChange={handleCompanyChange}
          />

          {/* Sort options */}
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: '20%' } }}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                id="sort-by"
                value={sortBy}
                label="Sort By"
                onChange={handleSortByChange}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              onClick={handleSortOrderChange}
              size="small"
              sx={{ minWidth: '40px', px: 1 }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </Box>
        </Stack>

        {/* Date Range Row */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={2}
            sx={{ width: { xs: '100%', md: '80%' } }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(date) => handleDateChange('start', date)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: { width: { xs: '100%', md: '200px' } }
                  } 
                }}
              />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(date) => handleDateChange('end', date)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: { width: { xs: '100%', md: '200px' } }
                  } 
                }}
              />
            </LocalizationProvider>
          </Stack>

          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleResetFilters}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            Reset Filters
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default UserFilters; 