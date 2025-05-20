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

export interface FilterOptions {
  status: string;
  team: string;
  impactLevel: string;
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
}

const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  filterOptions,
  onApplyFilters,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(filterOptions);
  const [openSection, setOpenSection] = useState<string | null>("status");

  // Update local state when props change
  React.useEffect(() => {
    setFilters(filterOptions);
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

  const handleDateChange = (type: 'startDate' | 'endDate', value: Date | null) => {
    setFilters({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [type]: value ? value.toISOString() : null,
      },
    });
  };

  const handleClearAll = () => {
    setFilters({
      status: '',
      team: '',
      impactLevel: '',
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
            onClick={() => handleStatusChange(option.value)}
            sx={{ 
              py: 1.5,
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              bgcolor: filters.status === option.value ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
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
            onClick={() => handleTeamChange(option.value)}
            sx={{ 
              py: 1.5,
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              bgcolor: filters.team === option.value ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
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
            onClick={() => handleImpactLevelChange(option.value)}
            sx={{ 
              py: 1.5,
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              bgcolor: filters.impactLevel === option.value ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.08)',
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
    
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      let dateString = 'Date: ';
      
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
    
    return activeFilters.length > 0 
      ? activeFilters.join(', ') 
      : 'No filters applied';
  };

  const showAppliedFilters = filters.status || filters.team || filters.impactLevel || filters.dateRange.startDate || filters.dateRange.endDate;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          m: 1,
          maxHeight: 'calc(100% - 16px)'
        }
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
            cursor: 'pointer',
            borderBottom: openSection === 'status' ? 'none' : '1px solid #f0f0f0',
          }}
          onClick={() => toggleSection('status')}
        >
          <Box>
            <Typography fontWeight="bold" variant="subtitle1">
              Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.status ? filters.status.charAt(0).toUpperCase() + filters.status.slice(1).replace('_', ' ') : 'New'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {filters.status && (
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
                transition: 'transform 0.3s'
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
            cursor: 'pointer',
            borderBottom: openSection === 'team' ? 'none' : '1px solid #f0f0f0',
          }}
          onClick={() => toggleSection('team')}
        >
          <Box>
            <Typography fontWeight="bold" variant="subtitle1">
              Team
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.team ? filters.team.charAt(0).toUpperCase() + filters.team.slice(1) : 'Housekeeping'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {filters.team && (
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
                transition: 'transform 0.3s'
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
            cursor: 'pointer',
            borderBottom: openSection === 'impact' ? 'none' : '1px solid #f0f0f0',
          }}
          onClick={() => toggleSection('impact')}
        >
          <Box>
            <Typography fontWeight="bold" variant="subtitle1">
              Impact Level
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.impactLevel ? filters.impactLevel.charAt(0).toUpperCase() + filters.impactLevel.slice(1) : 'Low'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {filters.impactLevel && (
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
                transition: 'transform 0.3s'
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
            cursor: 'pointer',
            borderBottom: openSection === 'date' ? 'none' : '1px solid #f0f0f0',
          }}
          onClick={() => toggleSection('date')}
        >
          <Box>
            <Typography fontWeight="bold" variant="subtitle1">
              Date Range
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.dateRange.startDate || filters.dateRange.endDate 
                ? `${filters.dateRange.startDate ? new Date(filters.dateRange.startDate).toLocaleDateString() : ''} ${filters.dateRange.startDate && filters.dateRange.endDate ? 'to' : ''} ${filters.dateRange.endDate ? new Date(filters.dateRange.endDate).toLocaleDateString() : ''}`
                : 'Select'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {(filters.dateRange.startDate || filters.dateRange.endDate) && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  setFilters({
                    ...filters,
                    dateRange: { startDate: null, endDate: null }
                  });
                }}
                sx={{ mr: 1 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
            <KeyboardArrowDownIcon 
              sx={{ 
                transform: openSection === 'date' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }} 
            />
          </Box>
        </Box>
        <Collapse in={openSection === 'date'}>
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.dateRange.startDate ? new Date(filters.dateRange.startDate) : null}
                onChange={(newValue) => handleDateChange('startDate', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    placeholder: "Select start date"
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={filters.dateRange.endDate ? new Date(filters.dateRange.endDate) : null}
                onChange={(newValue) => handleDateChange('endDate', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    placeholder: "Select end date"
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
        </Collapse>
      </DialogContent>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
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