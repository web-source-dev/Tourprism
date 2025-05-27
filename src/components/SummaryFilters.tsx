import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Chip,
    TextField,
    InputAdornment,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    Paper
} from '@mui/material';
import {
    CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/ui/toast';

export interface FilterOptions {
    reportType: string;
    location: string;
    dateCreated: string;
    customDateStart?: string;
    customDateEnd?: string;
    deliveryMethod: string;
}

interface SummaryFiltersProps {
    filters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    locations: string[];
    isModal?: boolean;
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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
    </Box>
);

// Create a custom expand icon component
const ExpandMoreIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="#616161" />
    </svg>
);

const SummaryFilters: React.FC<SummaryFiltersProps> = ({
    filters,
    onFilterChange,
    locations = [],
    isModal = false
}) => {
    const { isSubscribed } = useAuth();
    const { showToast } = useToast();
    const [showCustomDateRange, setShowCustomDateRange] = useState(filters.dateCreated === 'Custom');
    const [expanded, setExpanded] = useState<string | false>(false);

    // Effect to set default values if they're not already set
    useEffect(() => {
        const updatedFilters = { ...filters };
        let hasChanges = false;

        if (!filters.location) {
            updatedFilters.location = 'Edinburgh';
            hasChanges = true;
        }

        if (!filters.dateCreated) {
            updatedFilters.dateCreated = 'This Week';
            hasChanges = true;
        }

        if (hasChanges) {
            onFilterChange(updatedFilters);
        }
    }, [ filters,onFilterChange]);

    const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    const handleCustomDateChange = (field: 'customDateStart' | 'customDateEnd', value: string) => {
        onFilterChange({
            ...filters,
            [field]: value
        });
    };

    // Helper function to get selected option for display
    const getSelectedOption = (type: keyof FilterOptions) => {
        if (type === 'location' && !filters[type]) {
            return 'Edinburgh';
        }
        if (type === 'dateCreated' && !filters[type]) {
            return 'This Week';
        }
        return filters[type] || 'All';
    };

    // Ensure we have at least one default location
    const availableLocations = locations.length > 0
        ? locations
        : ['Edinburgh'];

    return (
        <Box sx={{ mb: isModal ? 0 : 4 }}>
            <Paper elevation={0} sx={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                border: '1px solid #e0e0e0',
                overflow: 'hidden'
            }}>
                {/* Report Type Filter */}
                <Accordion
                    expanded={expanded === 'reportType'}
                    onChange={handleAccordionChange('reportType')}
                    sx={{
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                        borderBottom: '1px solid #e0e0e0'
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ 
                            px: 2,
                            py: 1,
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                        }}
                    >
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Report Type</Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>{getSelectedOption('reportType')}</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.5 }}>
                        <List sx={{ width: '100%', p: 0 }}>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, reportType: '' })}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <ListItemText primary="All" primaryTypographyProps={{ fontWeight: filters.reportType === '' ? 600 : 400 }} />
                                {filters.reportType === '' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, reportType: 'forecast' })}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <ListItemText primary="Weekly Forecast" primaryTypographyProps={{ fontWeight: filters.reportType === 'forecast' ? 600 : 400 }} />
                                {filters.reportType === 'forecast' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, reportType: 'custom' })}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <ListItemText primary="Custom Report" primaryTypographyProps={{ fontWeight: filters.reportType === 'custom' ? 600 : 400 }} />
                                {filters.reportType === 'custom' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, reportType: 'automated' })}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <ListItemText primary="Automated Report" primaryTypographyProps={{ fontWeight: filters.reportType === 'automated' ? 600 : 400 }} />
                                {filters.reportType === 'automated' && <SelectedIcon />}
                            </ListItem>
                        </List>
                    </AccordionDetails>
                </Accordion>

                {/* Location Filter */}
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
                        sx={{ 
                            px: 2, 
                            py: 1,
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                        }}
                    >
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Location</Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>{getSelectedOption('location')}</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.5 }}>
                        <List sx={{ width: '100%', p: 0 }}>
                            {availableLocations.map((location) => (
                                location !== 'All' && (
                                    <ListItem
                                        key={location}
                                        onClick={() => onFilterChange({ ...filters, location })}
                                        sx={{
                                            py: 0.8,
                                            px: 0,
                                            cursor: 'pointer',
                                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            borderRadius: 1
                                        }}
                                        component="div"
                                    >
                                        <ListItemText primary={location} primaryTypographyProps={{ fontWeight: filters.location === location ? 600 : 400 }} />
                                        {filters.location === location && <SelectedIcon />}
                                    </ListItem>
                                )
                            ))}
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, location: 'Current Location' })}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <ListItemText primary="Current Location" primaryTypographyProps={{ fontWeight: filters.location === 'Current Location' ? 600 : 400 }} />
                                {filters.location === 'Current Location' && <SelectedIcon />}
                            </ListItem>
                        </List>
                    </AccordionDetails>
                </Accordion>

                {/* Date Created Filter */}
                <Accordion
                    expanded={expanded === 'dateCreated'}
                    onChange={handleAccordionChange('dateCreated')}
                    sx={{
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                        borderBottom: '1px solid #e0e0e0'
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ 
                            px: 2, 
                            py: 1,
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' } 
                        }}
                    >
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Date Created</Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>
                                {filters.dateCreated === 'Custom' && (filters.customDateStart || filters.customDateEnd)
                                    ? `${filters.customDateStart || 'Start'} to ${filters.customDateEnd || 'End'}`
                                    : getSelectedOption('dateCreated')}
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.5 }}>
                        <List sx={{ width: '100%', p: 0 }}>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, dateCreated: 'This Week' })}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <ListItemText primary="This Week" primaryTypographyProps={{ fontWeight: filters.dateCreated === 'This Week' ? 600 : 400 }} />
                                {filters.dateCreated === 'This Week' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => {
                                    if (!isSubscribed) {
                                        showToast('Custom date range is available with a subscription', 'error');
                                        return;
                                    }
                                    onFilterChange({ ...filters, dateCreated: 'Custom' });
                                    setShowCustomDateRange(true);
                                }}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    opacity: isSubscribed ? 1 : 0.7,
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <Typography sx={{ fontWeight: filters.dateCreated === 'Custom' ? 600 : 400 }}>Custom</Typography>
                                    {!isSubscribed && (
                                        <Tooltip title="Available with subscription">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9.99967 11.4582C10.3449 11.4582 10.6247 11.738 10.6247 12.0832V13.7498C10.6247 14.095 10.3449 14.3748 9.99967 14.3748C9.6545 14.3748 9.37467 14.095 9.37467 13.7498V12.0832C9.37467 11.738 9.6545 11.4582 9.99967 11.4582Z" fill="#E7B119" />
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M5.41634 5.62533V7.10626C4.10995 7.50604 3.12405 8.65539 2.93677 10.0463C2.81331 10.9633 2.70801 11.9269 2.70801 12.917C2.70801 13.9071 2.81331 14.8707 2.93677 15.7877C3.16308 17.4685 4.55564 18.7966 6.27069 18.8754C7.46104 18.9301 8.66981 18.9587 9.99968 18.9587C11.3295 18.9587 12.5383 18.9301 13.7287 18.8754C15.4437 18.7966 16.8363 17.4685 17.0626 15.7877C17.186 14.8707 17.2913 13.9071 17.2913 12.917C17.2913 11.9269 17.186 10.9633 17.0626 10.0463C16.8753 8.65539 15.8894 7.50604 14.583 7.10626V5.62533C14.583 3.09402 12.531 1.04199 9.99967 1.04199C7.46837 1.04199 5.41634 3.09402 5.41634 5.62533ZM9.99967 2.70866C8.38884 2.70866 7.08301 4.0145 7.08301 5.62533V6.92546C8.01445 6.89239 8.97082 6.87533 9.99968 6.87533C11.0285 6.87533 11.9849 6.89239 12.9163 6.92546V5.62533C12.9163 4.0145 11.6105 2.70866 9.99967 2.70866Z" fill="#E7B119" />
                                            </svg>
                                        </Tooltip>
                                    )}
                                </Box>
                                {filters.dateCreated === 'Custom' && <SelectedIcon />}
                            </ListItem>
                        </List>

                        {/* Custom Date Range Inputs */}
                        {showCustomDateRange && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <TextField
                                    type="date"
                                    size="small"
                                    placeholder="Start Date"
                                    value={filters.customDateStart || ''}
                                    onChange={(e) => handleCustomDateChange('customDateStart', e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            fontSize: '0.875rem'
                                        }
                                    }}
                                />
                                <TextField
                                    type="date"
                                    size="small"
                                    placeholder="End Date"
                                    value={filters.customDateEnd || ''}
                                    onChange={(e) => handleCustomDateChange('customDateEnd', e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            fontSize: '0.875rem'
                                        }
                                    }}
                                />
                            </Box>
                        )}
                    </AccordionDetails>
                </Accordion>

                {/* Delivery Method Filter */}
                <Accordion
                    expanded={expanded === 'deliveryMethod'}
                    onChange={handleAccordionChange('deliveryMethod')}
                    sx={{
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                        borderBottom: expanded === 'deliveryMethod' ? '1px solid #e0e0e0' : 'none'
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ 
                            px: 2, 
                            py: 1,
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' } 
                        }}
                    >
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Delivery Method </Typography>
                            <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>{getSelectedOption('deliveryMethod')}</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.5 }}>
                        <List sx={{ width: '100%', p: 0 }}>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, deliveryMethod: '' })}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <ListItemText primary="All" primaryTypographyProps={{ fontWeight: filters.deliveryMethod === '' ? 600 : 400 }} />
                                {filters.deliveryMethod === '' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, deliveryMethod: 'Email' })}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <ListItemText primary="Email" primaryTypographyProps={{ fontWeight: filters.deliveryMethod === 'Email' ? 600 : 400 }} />
                                {filters.deliveryMethod === 'Email' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, deliveryMethod: 'Auto-delivery' })}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <ListItemText primary="Auto-delivery" primaryTypographyProps={{ fontWeight: filters.deliveryMethod === 'Auto-delivery' ? 600 : 400 }} />
                                {filters.deliveryMethod === 'Auto-delivery' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, deliveryMethod: 'Manual only' })}
                                sx={{
                                    py: 0.8,
                                    px: 0,
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: 1
                                }}
                                component="div"
                            >
                                <ListItemText primary="Manual only" primaryTypographyProps={{ fontWeight: filters.deliveryMethod === 'Manual only' ? 600 : 400 }} />
                                {filters.deliveryMethod === 'Manual only' && <SelectedIcon />}
                            </ListItem>
                        </List>
                    </AccordionDetails>
                </Accordion>
            </Paper>

            {/* Active Filters Display - only show in non-modal view */}
            {!isModal && (filters.reportType || filters.location || filters.dateCreated || filters.deliveryMethod) && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {filters.reportType && (
                        <Chip
                            label={filters.reportType}
                            onDelete={() => onFilterChange({ ...filters, reportType: '' })}
                            size="small"
                            sx={{
                                borderRadius: '16px',
                                bgcolor: 'rgba(0, 0, 0, 0.08)',
                                '& .MuiChip-deleteIcon': {
                                    color: 'rgba(0, 0, 0, 0.6)',
                                },
                            }}
                        />
                    )}
                    {filters.location && (
                        <Chip
                            label={filters.location}
                            onDelete={() => onFilterChange({ ...filters, location: '' })}
                            size="small"
                            sx={{
                                borderRadius: '16px',
                                bgcolor: 'rgba(0, 0, 0, 0.08)',
                                '& .MuiChip-deleteIcon': {
                                    color: 'rgba(0, 0, 0, 0.6)',
                                },
                            }}
                        />
                    )}
                    {filters.dateCreated && (
                        <Chip
                            label={filters.dateCreated === 'Custom' && (filters.customDateStart || filters.customDateEnd)
                                ? `${filters.customDateStart || 'Start'} to ${filters.customDateEnd || 'End'}`
                                : filters.dateCreated}
                            onDelete={() => onFilterChange({
                                ...filters,
                                dateCreated: '',
                                customDateStart: undefined,
                                customDateEnd: undefined
                            })}
                            size="small"
                            sx={{
                                borderRadius: '16px',
                                bgcolor: 'rgba(0, 0, 0, 0.08)',
                                '& .MuiChip-deleteIcon': {
                                    color: 'rgba(0, 0, 0, 0.6)',
                                },
                            }}
                        />
                    )}
                    {filters.deliveryMethod && (
                        <Chip
                            label={filters.deliveryMethod}
                            onDelete={() => onFilterChange({ ...filters, deliveryMethod: '' })}
                            size="small"
                            sx={{
                                borderRadius: '16px',
                                bgcolor: 'rgba(0, 0, 0, 0.08)',
                                '& .MuiChip-deleteIcon': {
                                    color: 'rgba(0, 0, 0, 0.6)',
                                },
                            }}
                        />
                    )}
                </Box>
            )}
        </Box>
    );
};

export default SummaryFilters;