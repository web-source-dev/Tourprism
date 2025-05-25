'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { 
  LocalizationProvider, 
  DatePicker,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '@/context/AuthContext';
import { startOfWeek, endOfWeek } from 'date-fns';

export interface FilterOptions {
  status: string;
  team: string;
  impactLevel: string;
  dateRangeType: 'this_week' | 'custom' | '';
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filterOptions: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  readonly?: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  filterOptions,
  onApplyFilters,
  readonly = false,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    ...filterOptions,
    dateRangeType: filterOptions.dateRangeType || '',
  });
  const [openSection, setOpenSection] = useState<string | null>(null);
  const { isSubscribed } = useAuth();

  // Update local state when props change
  React.useEffect(() => {
    setFilters({
      ...filterOptions,
      dateRangeType: filterOptions.dateRangeType || '',
    });
  }, [filterOptions]);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleStatusChange = (status: string) => {
    setFilters({ ...filters, status });
  };

  const handleTeamChange = (team: string) => {
    setFilters({ ...filters, team });
  };

  const handleImpactLevelChange = (impactLevel: string) => {
    setFilters({ ...filters, impactLevel });
  };

  const handleDateRangeTypeChange = (dateRangeType: 'this_week' | 'custom' | '') => {
    // If selecting "This Week", auto-set the date range
    if (dateRangeType === 'this_week') {
      const now = new Date();
      // Start of week (Monday)
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      // End of week (Sunday)
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      
      setFilters({
        ...filters,
        dateRangeType,
        dateRange: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
        }
      });
    } 
    // If clearing or if user is not subscribed and trying to select custom, just update the type
    else if (dateRangeType === '' || (!isSubscribed && dateRangeType === 'custom')) {
      setFilters({
        ...filters,
        dateRangeType,
        dateRange: {
          startDate: null,
          endDate: null,
        }
      });
    }
    // Otherwise just update the type without changing the dates
    else {
      setFilters({
        ...filters,
        dateRangeType,
      });
    }
  };

  const handleDateChange = (type: 'startDate' | 'endDate', value: Date | null) => {
    // Only allow date changes if the dateRangeType is 'custom'
    if (filters.dateRangeType === 'custom' && isSubscribed) {
      setFilters({
        ...filters,
        dateRange: {
          ...filters.dateRange,
          [type]: value ? value.toISOString() : null,
        },
      });
    }
  };

  const handleClearAll = () => {
    setFilters({
      status: '',
      team: '',
      impactLevel: '',
      dateRangeType: 'this_week',
      dateRange: {
        startDate: null,
        endDate: null,
      },
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const renderStatusOptions = () => {
    const statusOptions = [
      { value: 'new', label: 'New', color: '#2196f3' },
      { value: 'in_progress', label: 'In Progress', color: '#ff9800' },
      { value: 'handled', label: 'Resolved', color: '#4caf50' },
      { value: 'dismissed', label: 'Dismissed', color: '#f44336' },
    ];

    return (
      <List sx={{ py: 0 }}>
        {statusOptions.map((option) => (
          <ListItem 
            key={option.value}
            onClick={() => !readonly && handleStatusChange(option.value)}
            sx={{ 
              py: 1.5,
              borderBottom: '1px solid #f0f0f0',
              cursor: readonly ? 'default' : 'pointer',
              bgcolor: filters.status === option.value ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': {
                bgcolor: readonly ? 'transparent' : 'rgba(0, 0, 0, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box 
                component="span" 
                sx={{ 
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: option.color,
                  mr: 1
                }} 
              />
            </ListItemIcon>
            <ListItemText primary={option.label} />
            {filters.status === option.value && (
              <CheckCircleIcon color="success" fontSize="small" />
            )}
          </ListItem>
        ))}
      </List>
    );
  };

  const renderTeamOptions = () => {
    const teamOptions = [
      { value: 'housekeeping', label: 'Housekeeping' },
      { value: 'frontdesk', label: 'Front Desk' },
      { value: 'unassigned', label: 'Unassigned' },
    ];

    return (
      <List sx={{ py: 0 }}>
        {teamOptions.map((option) => (
          <ListItem 
            key={option.value}
            onClick={() => !readonly && handleTeamChange(option.value)}
            sx={{ 
              py: 1.5,
              borderBottom: '1px solid #f0f0f0',
              cursor: readonly ? 'default' : 'pointer',
              bgcolor: filters.team === option.value ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': {
                bgcolor: readonly ? 'transparent' : 'rgba(0, 0, 0, 0.08)',
              }
            }}
          >
            <ListItemText primary={option.label} />
            {filters.team === option.value && (
              <CheckCircleIcon color="success" fontSize="small" />
            )}
          </ListItem>
        ))}
      </List>
    );
  };

  const renderImpactLevelOptions = () => {
    const impactOptions = [
      { value: 'low', label: 'Low' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'high', label: 'High' },
    ];

    return (
      <List sx={{ py: 0 }}>
        {impactOptions.map((option) => (
          <ListItem 
            key={option.value}
            onClick={() => !readonly && handleImpactLevelChange(option.value)}
            sx={{ 
              py: 1.5,
              borderBottom: '1px solid #f0f0f0',
              cursor: readonly ? 'default' : 'pointer',
              bgcolor: filters.impactLevel === option.value ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': {
                bgcolor: readonly ? 'transparent' : 'rgba(0, 0, 0, 0.08)',
              }
            }}
          >
            <ListItemText primary={option.label} />
            {filters.impactLevel === option.value && (
              <CheckCircleIcon color="success" fontSize="small" />
            )}
          </ListItem>
        ))}
      </List>
    );
  };

  const renderDateRangeOptions = () => {
    const dateRangeOptions = [
      { value: 'this_week', label: 'This Week' },
      { 
        value: 'custom', 
        label: 'Custom', 
        locked: !isSubscribed 
      }
    ];

    return (
      <List sx={{ py: 0 }}>
        {dateRangeOptions.map((option) => (
          <ListItem 
            key={option.value}
            onClick={() => !readonly && !option.locked && handleDateRangeTypeChange(option.value as 'this_week' | 'custom')}
            sx={{ 
              py: 1.5,
              borderBottom: '1px solid #f0f0f0',
              cursor: (readonly || option.locked) ? 'default' : 'pointer',
              bgcolor: filters.dateRangeType === option.value ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': {
                bgcolor: (readonly || option.locked) ? 'transparent' : 'rgba(0, 0, 0, 0.08)',
              }
            }}
          >
            <ListItemText 
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {option.label}
                  {option.locked && (
                    <Tooltip title="Subscribe to unlock custom date range filtering">
                      <LockOutlinedIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
                    </Tooltip>
                  )}
                </Box>
              } 
            />
            {filters.dateRangeType === option.value && (
              <CheckCircleIcon color="success" fontSize="small" />
            )}
          </ListItem>
        ))}
        
        {/* Custom date inputs - only show if 'custom' is selected and user is subscribed */}
        {filters.dateRangeType === 'custom' && isSubscribed && (
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.dateRange.startDate ? new Date(filters.dateRange.startDate) : null}
                onChange={(newValue) => !readonly && handleDateChange('startDate', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    placeholder: "Select start date",
                    disabled: readonly
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={filters.dateRange.endDate ? new Date(filters.dateRange.endDate) : null}
                onChange={(newValue) => !readonly && handleDateChange('endDate', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    placeholder: "Select end date",
                    disabled: readonly
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
        )}
      </List>
    );
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (filters.status) {
      activeFilters.push(`Status: ${filters.status.charAt(0).toUpperCase() + filters.status.slice(1).replace('_', ' ')}`);
    }
    
    if (filters.team) {
      activeFilters.push(`Team: ${filters.team.charAt(0).toUpperCase() + filters.team.slice(1)}`);
    }
    
    if (filters.impactLevel) {
      activeFilters.push(`Impact: ${filters.impactLevel.charAt(0).toUpperCase() + filters.impactLevel.slice(1)}`);
    }
    
    if (filters.dateRangeType) {
      if (filters.dateRangeType === 'this_week') {
        activeFilters.push('Date: This Week');
      } else if (filters.dateRangeType === 'custom' && (filters.dateRange.startDate || filters.dateRange.endDate)) {
        let dateString = 'Date: Custom - ';
        
        if (filters.dateRange.startDate) {
          const startDate = new Date(filters.dateRange.startDate);
          dateString += `From ${startDate.toLocaleDateString()}`;
        }
        
        if (filters.dateRange.endDate) {
          const endDate = new Date(filters.dateRange.endDate);
          dateString += filters.dateRange.startDate ? ` to ${endDate.toLocaleDateString()}` : `Until ${endDate.toLocaleDateString()}`;
        }
        
        activeFilters.push(dateString);
      }
    }
    
    return activeFilters.length > 0 
      ? activeFilters.join(', ') 
      : 'No filters applied';
  };

  const showAppliedFilters = filters.status || filters.team || filters.impactLevel || filters.dateRangeType;
  
  const useIsMobile = () => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.down('sm'));
  }
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
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
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          fontWeight: 'bold'
        }}
      >
        Filter By
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={onClose}
          sx={{ p: 1 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {showAppliedFilters && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight="medium">
            Current filters: {getFilterSummary()}
          </Typography>
        </Box>
      )}

      <DialogContent dividers sx={{ px: 2, py: 1 }}>
        {/* Status Filter */}
        <Box 
          sx={{ 
            py: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: readonly ? 'default' : 'pointer',
            borderBottom: openSection === 'status' ? 'none' : '1px solid #f0f0f0',
          }}
          onClick={() => !readonly && toggleSection('status')}
        >
          <Box>
            <Typography fontWeight="bold" variant="subtitle1">
              Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.status ? filters.status.charAt(0).toUpperCase() + filters.status.slice(1).replace('_', ' ') : 'Any'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {filters.status && !readonly && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('');
                }}
                sx={{ mr: 1 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
            <KeyboardArrowDownIcon 
              sx={{ 
                transform: openSection === 'status' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                opacity: readonly ? 0.5 : 1
              }} 
            />
          </Box>
        </Box>
        <Collapse in={openSection === 'status'}>
          {renderStatusOptions()}
        </Collapse>

        {/* Team Filter */}
        <Box 
          sx={{ 
            py: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: readonly ? 'default' : 'pointer',
            borderBottom: openSection === 'team' ? 'none' : '1px solid #f0f0f0',
          }}
          onClick={() => !readonly && toggleSection('team')}
        >
          <Box>
            <Typography fontWeight="bold" variant="subtitle1">
              Team
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.team ? filters.team.charAt(0).toUpperCase() + filters.team.slice(1) : 'Any'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {filters.team && !readonly && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleTeamChange('');
                }}
                sx={{ mr: 1 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
            <KeyboardArrowDownIcon 
              sx={{ 
                transform: openSection === 'team' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                opacity: readonly ? 0.5 : 1
              }} 
            />
          </Box>
        </Box>
        <Collapse in={openSection === 'team'}>
          {renderTeamOptions()}
        </Collapse>

        {/* Impact Level Filter */}
        <Box 
          sx={{ 
            py: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: readonly ? 'default' : 'pointer',
            borderBottom: openSection === 'impact' ? 'none' : '1px solid #f0f0f0',
          }}
          onClick={() => !readonly && toggleSection('impact')}
        >
          <Box>
            <Typography fontWeight="bold" variant="subtitle1">
              Impact Level
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.impactLevel ? filters.impactLevel.charAt(0).toUpperCase() + filters.impactLevel.slice(1) : 'Any'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {filters.impactLevel && !readonly && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleImpactLevelChange('');
                }}
                sx={{ mr: 1 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
            <KeyboardArrowDownIcon 
              sx={{ 
                transform: openSection === 'impact' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                opacity: readonly ? 0.5 : 1
              }} 
            />
          </Box>
        </Box>
        <Collapse in={openSection === 'impact'}>
          {renderImpactLevelOptions()}
        </Collapse>

        {/* Date Range Filter */}
        <Box 
          sx={{ 
            py: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: readonly ? 'default' : 'pointer',
            borderBottom: openSection === 'date' ? 'none' : '1px solid #f0f0f0',
          }}
          onClick={() => !readonly && toggleSection('date')}
        >
          <Box>
            <Typography fontWeight="bold" variant="subtitle1">
              Date Range
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.dateRangeType === 'this_week' 
                ? 'This Week'
                : filters.dateRangeType === 'custom' && (filters.dateRange.startDate || filters.dateRange.endDate)
                  ? 'Custom Range'
                  : 'Any'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {filters.dateRangeType && !readonly && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDateRangeTypeChange('');
                }}
                sx={{ mr: 1 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
            <KeyboardArrowDownIcon 
              sx={{ 
                transform: openSection === 'date' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                opacity: readonly ? 0.5 : 1
              }} 
            />
          </Box>
        </Box>
        <Collapse in={openSection === 'date'}>
          {renderDateRangeOptions()}
        </Collapse>
      </DialogContent>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          disabled={readonly}
          sx={{
            bgcolor: 'black',
            color: 'white',
            '&:hover': { bgcolor: '#333' },
            py: 1,
            borderRadius: 1
          }}
          onClick={handleApplyFilters}
        >
          Show Results
        </Button>
        <Button
          fullWidth
          variant="text"
          disabled={readonly}
          sx={{
            color: 'black',
            '&:hover': { bgcolor: '#f5f5f5' },
            py: 1
          }}
          onClick={handleClearAll}
        >
          Clear All
        </Button>
      </Box>
    </Dialog>
  );
};

export default FilterModal; 