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
  ListItemText,
  useTheme, 
  useMediaQuery,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { 
  LocalizationProvider, 
  DatePicker,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';
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

// Create a custom expand icon component
const ExpandMoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="#616161" />
  </svg>
);

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
  const [expanded, setExpanded] = useState<string | false>(false);
  const { isPremium } = useAuth();

  // Update local state when props change
  React.useEffect(() => {
    setFilters({
      ...filterOptions,
      dateRangeType: filterOptions.dateRangeType || '',
    });
  }, [filterOptions]);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    if (!readonly) {
      setExpanded(isExpanded ? panel : false);
    }
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
    else if (dateRangeType === '' || (!isPremium && dateRangeType === 'custom')) {
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
    if (filters.dateRangeType === 'custom' && isPremium) {
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
      status: 'new',
      team: 'housekeeping',
      impactLevel: 'high',
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

  const getSelectedStatus = () => {
    if (!filters.status) return 'All';
    const statusMap: {[key: string]: string} = {
      'new': 'New',
      'in_progress': 'In Progress',
      'handled': 'Resolved',
      'dismissed': 'Dismissed'
    };
    return statusMap[filters.status] || filters.status;
  };

  const getSelectedTeam = () => {
    if (!filters.team) return 'All';
    const teamMap: {[key: string]: string} = {
      'housekeeping': 'Housekeeping',
      'frontdesk': 'Front Desk',
      'unassigned': 'Unassigned'
    };
    return teamMap[filters.team] || filters.team;
  };

  const getSelectedImpactLevel = () => {
    if (!filters.impactLevel) return 'All';
    return filters.impactLevel.charAt(0).toUpperCase() + filters.impactLevel.slice(1);
  };

  const getSelectedDateRange = () => {
    if (filters.dateRangeType === 'this_week') return 'This Week';
    if (filters.dateRangeType === 'custom') return 'Custom Range';
    return 'All';
  };

  const renderStatusOptions = () => {
    const statusOptions = [
      { value: '', label: 'All' },
      { value: 'new', label: 'New', color: '#2196f3' },
      { value: 'in_progress', label: 'In Progress', color: '#ff9800' },
      { value: 'handled', label: 'Resolved', color: '#4caf50' },
      { value: 'dismissed', label: 'Dismissed', color: '#f44336' },
    ];

    return (
      <List sx={{ width: '100%', p: 0 }}>
        {statusOptions.map((option) => (
          <ListItem 
            key={option.value}
            onClick={() => !readonly && handleStatusChange(option.value)}
            sx={{ 
              py: 1.5,
              px: 0,
              cursor: readonly ? 'default' : 'pointer',
              borderBottom: '1px solid rgb(226, 226, 226)',
              '&:hover': {
                bgcolor: readonly ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
              },
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {option.color && (
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
              )}
              <ListItemText primary={option.label} />
            </Box>
            {filters.status === option.value && <SelectedIcon />}
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
      <List sx={{ width: '100%', p: 0 }}>
        {teamOptions.map((option) => (
          <ListItem 
            key={option.value}
            onClick={() => !readonly && handleTeamChange(option.value)}
            sx={{ 
              py: 1.5,
              px: 0,
              cursor: readonly ? 'default' : 'pointer',
              borderBottom: '1px solid rgb(226, 226, 226)',
              '&:hover': {
                bgcolor: readonly ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
              },
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <ListItemText primary={option.label} />
            {filters.team === option.value && <SelectedIcon />}
          </ListItem>
        ))}
      </List>
    );
  };

  const renderImpactLevelOptions = () => {
    const impactOptions = [
      { value: '', label: 'All' },
      { value: 'low', label: 'Low' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'high', label: 'High' },
    ];

    return (
      <List sx={{ width: '100%', p: 0 }}>
        {impactOptions.map((option) => (
          <ListItem 
            key={option.value}
            onClick={() => !readonly && handleImpactLevelChange(option.value)}
            sx={{ 
              py: 1.5,
              px: 0,
              cursor: readonly ? 'default' : 'pointer',
              borderBottom: '1px solid rgb(226, 226, 226)',
              '&:hover': {
                bgcolor: readonly ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
              },
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <ListItemText primary={option.label} />
            {filters.impactLevel === option.value && <SelectedIcon />}
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
        locked: !isPremium 
      }
    ];

    return (
      <List sx={{ width: '100%', p: 0 }}>
        {dateRangeOptions.map((option) => (
          <ListItem 
            key={option.value}
            onClick={() => !readonly && !option.locked && handleDateRangeTypeChange(option.value as 'this_week' | 'custom' | '')}
            sx={{ 
              py: 1.5,
              px: 0,
              cursor: (readonly || option.locked) ? 'default' : 'pointer',
              borderBottom: '1px solid rgb(226, 226, 226)',
              '&:hover': {
                bgcolor: (readonly || option.locked) ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
              },
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <ListItemText 
                primary={option.label}
              /> 
              {option.locked && (
                <Tooltip title="Subscribe to unlock custom date range filtering">
                  <LockOutlinedIcon sx={{ fontSize: 16, color: '#FFD700' }} />
                </Tooltip>
              )}
            </Box>
            {filters.dateRangeType === option.value && <SelectedIcon />}
          </ListItem>
        ))}
        
        {/* Custom date inputs - only show if 'custom' is selected and user is subscribed */}
        {filters.dateRangeType === 'custom' && isPremium && (
          <Box sx={{ py: 2, display: 'flex', gap: 2 }}>
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

  const useIsMobile = () => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.down('sm'));
  }
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: {
          width: useIsMobile() ? '100%' : 560,
          height: useIsMobile() ? '100%' : 'auto',
          minHeight: useIsMobile() ? '100%' : 'auto',
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
          fontWeight: 'bold',
          textAlign: 'center'
        }}
      >
        <Box></Box>
        <Typography variant='h6' sx={{fontWeight:'500'}}>
          Filter By
        </Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={onClose}
          sx={{ p: 1 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent style={{padding: '0px' ,overflowY: 'auto',height: '300px', border: '1px solid #e0e0e0' , borderRadius: '10px', scrollbarWidth: 'none'}}>
        {/* Status Filter */}
        <Accordion
          expanded={expanded === 'status'}
          onChange={handleAccordionChange('status')}
          sx={{
            boxShadow: 'none',
            '&:before': { display: 'none' },
            borderBottom: '1px solid #e0e0e0',
            position: 'relative',
            border: expanded === 'status' ? '1px solid #e0e0e0' : '',
            borderRadius: expanded === 'status' ? 2 : '',
            py: expanded === 'status' ? 0 : ''
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              px: 2, 
              backgroundColor: 'white',
              zIndex: 4,
              py: 0,
              borderRadius: 2,
              borderBottom: '1px solid #e0e0e0',
              minHeight: '64px',
              height: '64px',
              '& .MuiAccordionSummary-content': {
                margin: '0',
                display: 'flex',
                alignItems: 'center'
              }
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Typography variant="body1" fontWeight="medium">{getSelectedStatus()}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ 
            px: 2, 
            pt: 0,
            mt: 2,
            borderRadius: 2,
            position: 'absolute',
            width: '100%',
            backgroundColor: 'white',
            boxShadow: 4,
            zIndex: 5,
          }}>
            {renderStatusOptions()}
          </AccordionDetails>
        </Accordion>

        {/* Team Filter */}
        <Accordion
          expanded={expanded === 'team'}
          onChange={handleAccordionChange('team')}
          sx={{
            boxShadow: 'none',
            '&:before': { display: 'none' },
            borderBottom: '1px solid #e0e0e0',
            position: 'relative',
            border: expanded === 'team' ? '1px solid #e0e0e0' : '',
            borderRadius: expanded === 'team' ? 2 : '',
            py: expanded === 'team' ? 0 : ''
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              px: 2, 
              backgroundColor: 'white',
              zIndex: 4,
              py: 0,
              borderRadius: 2,
              borderBottom: '1px solid #e0e0e0',
              minHeight: '64px',
              height: '64px',
              '& .MuiAccordionSummary-content': {
                margin: '0',
                display: 'flex',
                alignItems: 'center'
              }
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary">Team</Typography>
              <Typography variant="body1" fontWeight="medium">{getSelectedTeam()}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ 
            px: 2, 
            pt: 0,
            mt: 2,
            borderRadius: 2,
            position: 'absolute',
            width: '100%',
            backgroundColor: 'white',
            boxShadow: 4,
            zIndex: 5,
          }}>
            {renderTeamOptions()}
          </AccordionDetails>
        </Accordion>

        {/* Impact Level Filter */}
        <Accordion
          expanded={expanded === 'impact'}
          onChange={handleAccordionChange('impact')}
          sx={{
            boxShadow: 'none',
            '&:before': { display: 'none' },
            borderBottom: '1px solid #e0e0e0',
            position: 'relative',
            border: expanded === 'impact' ? '1px solid #e0e0e0' : '',
            borderRadius: expanded === 'impact' ? 2 : '',
            py: expanded === 'impact' ? 0 : ''
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              px: 2, 
              backgroundColor: 'white',
              zIndex: 4,
              py: 0,
              borderRadius: 2,
              borderBottom: '1px solid #e0e0e0',
              minHeight: '64px',
              height: '64px',
              '& .MuiAccordionSummary-content': {
                margin: '0',
                display: 'flex',
                alignItems: 'center'
              }
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary">Impact Level</Typography>
              <Typography variant="body1" fontWeight="medium">{getSelectedImpactLevel()}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ 
            px: 2, 
            pt: 0,
            mt: 2,
            borderRadius: 2,
            position: 'absolute',
            width: '100%',
            backgroundColor: 'white',
            boxShadow: 4,
            zIndex: 5,
          }}>
            {renderImpactLevelOptions()}
          </AccordionDetails>
        </Accordion>

        {/* Date Range Filter */}
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
              py: 0,
              borderRadius: 2,
              borderBottom: '1px solid #e0e0e0',
              minHeight: '64px',
              height: '64px',
              '& .MuiAccordionSummary-content': {
                margin: '0',
                display: 'flex',
                alignItems: 'center'
              }
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary">Date Range</Typography>
              <Typography variant="body1" fontWeight="medium">{getSelectedDateRange()}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ 
            px: 2, 
            pt: 0,
            mt: 2,
            borderRadius: 2,
            position: 'absolute',
            width: '100%',
            backgroundColor: 'white',
            boxShadow: 4,
            zIndex: 5,
          }}>
            {renderDateRangeOptions()}
          </AccordionDetails>
        </Accordion>
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
            borderRadius: 5
          }}
          onClick={handleApplyFilters}
        >
          Show Results
        </Button>
        <Button
          fullWidth
          variant="outlined"
          disabled={readonly}
          sx={{
            color: '#616161',
            border: '1px solid #e0e0e0',
            '&:hover': { borderColor: '#616161', backgroundColor: 'rgba(0,0,0,0.04)' },
            py: 1,
            borderRadius: 5
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