import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    Paper,
} from '@mui/material';
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
    onApplyFilters?: () => void;
    onClearFilters?: () => void;
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

const SummaryFilters: React.FC<SummaryFiltersProps> = ({
    filters,
    onFilterChange,
    locations = [],
    isModal = false,
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
    }, [filters, onFilterChange]);
    
    // Effect to update showCustomDateRange when dateCreated changes
    useEffect(() => {
        setShowCustomDateRange(filters.dateCreated === 'Custom');
    }, [filters.dateCreated]);

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
            }}>
                {/* Report Type Filter */}
                <Accordion
                    expanded={expanded === 'reportType'}
                    onChange={handleAccordionChange('reportType')}
                    sx={{
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                        borderBottom: '1px solid #e0e0e0',
                        position: 'relative',
                        border: expanded === 'reportType' ? '1px solid #e0e0e0' : '',
                        borderRadius: expanded === 'reportType' ? 2 : '',
                        py: expanded === 'reportType' ? 0 : ''
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
                            <Typography variant="body2" color="text.secondary">Report Type</Typography>
                            <Typography variant="body1" fontWeight="medium">{getSelectedOption('reportType')}</Typography>
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
                        <List sx={{ width: '100%', p: 0 }}>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, reportType: '' })}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                component="div"
                            >
                                <ListItemText primary="All" />
                                {filters.reportType === '' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, reportType: 'forecast' })}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                component="div"
                            >
                                <ListItemText primary="Weekly Forecast" />
                                {filters.reportType === 'forecast' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, reportType: 'custom' })}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                component="div"
                            >
                                <ListItemText primary="Custom Report" />
                                {filters.reportType === 'custom' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, reportType: 'automated' })}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                component="div"
                            >
                                <ListItemText primary="Automated Report" />
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
                            <Typography variant="body2" color="text.secondary">Location</Typography>
                            <Typography variant="body1" fontWeight="medium">{getSelectedOption('location')}</Typography>
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
                        <List sx={{ width: '100%', p: 0 }}>
                            {availableLocations.map((location, index) => (
                                location !== 'All' && (
                                    <ListItem
                                        key={location}
                                        onClick={() => onFilterChange({ ...filters, location })}
                                        sx={{
                                            py: 1.5,
                                            px: 0,
                                            cursor: 'pointer',
                                            borderBottom: index < availableLocations.length - 1 ? '1px solid rgb(226, 226, 226)' : '',
                                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}
                                        component="div"
                                    >
                                        <ListItemText primary={location} />
                                        {filters.location === location && <SelectedIcon />}
                                    </ListItem>
                                )
                            ))}
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, location: 'Current Location' })}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                component="div"
                            >
                                <ListItemText primary="Current Location" />
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
                        borderBottom: '1px solid #e0e0e0',
                        position: 'relative',
                        border: expanded === 'dateCreated' ? '1px solid #e0e0e0' : '',
                        borderRadius: expanded === 'dateCreated' ? 2 : '',
                        py: expanded === 'dateCreated' ? 0 : ''
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
                            <Typography variant="body2" color="text.secondary">Date Created</Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {filters.dateCreated === 'Custom' && (filters.customDateStart || filters.customDateEnd)
                                    ? `${filters.customDateStart || 'Start'} to ${filters.customDateEnd || 'End'}`
                                    : getSelectedOption('dateCreated')}
                            </Typography>
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
                        <List sx={{ width: '100%', p: 0 }}>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, dateCreated: 'This Week' })}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                component="div"
                            >
                                <ListItemText primary="This Week" />
                                {filters.dateCreated === 'This Week' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => {
                                    if (!isSubscribed) {
                                        showToast('Subscribe to unlock this filter', 'error');
                                        return;
                                    }
                                    onFilterChange({ ...filters, dateCreated: 'Custom' });
                                    setShowCustomDateRange(true);
                                }}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    opacity: isSubscribed ? 1 : 0.7
                                }}
                                component="div"
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <ListItemText primary="Custom" />
                                    {!isSubscribed && (
                                        <Tooltip title="Subscribe to unlock this filter">
                                            <Box component="span">
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9.99967 11.4582C10.3449 11.4582 10.6247 11.738 10.6247 12.0832V13.7498C10.6247 14.095 10.3449 14.3748 9.99967 14.3748C9.6545 14.3748 9.37467 14.095 9.37467 13.7498V12.0832C9.37467 11.738 9.6545 11.4582 9.99967 11.4582Z" fill="#E7B119" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.62467 7.04908V5.4165C5.62467 3.00026 7.58343 1.0415 9.99967 1.0415C12.4159 1.0415 14.3747 3.00026 14.3747 5.4165V7.04908C15.7837 7.38554 16.8655 8.58187 17.0626 10.0458C17.186 10.9628 17.2913 11.9264 17.2913 12.9165C17.2913 13.9066 17.186 14.8702 17.0626 15.7872C16.8363 17.468 15.4437 18.7961 13.7287 18.8749C12.5383 18.9297 11.3295 18.9582 9.99968 18.9582C8.66981 18.9582 7.46104 18.9297 6.27069 18.8749C4.55564 18.7961 3.16308 17.468 2.93677 15.7872C2.81331 14.8702 2.70801 13.9066 2.70801 12.9165C2.70801 11.9264 2.81331 10.9628 2.93677 10.0458C3.13388 8.58187 4.21567 7.38554 5.62467 7.04908ZM6.87467 5.4165C6.87467 3.69061 8.27378 2.2915 9.99967 2.2915C11.7256 2.2915 13.1247 3.69061 13.1247 5.4165V6.93265C12.1274 6.89455 11.1054 6.87484 9.99968 6.87484C8.89397 6.87484 7.87198 6.89455 6.87467 6.93265V5.4165ZM9.99968 8.12484C8.68838 8.12484 7.49876 8.15294 6.32809 8.20676C5.23726 8.2569 4.32409 9.10973 4.17559 10.2126C4.05445 11.1124 3.95801 12.0106 3.95801 12.9165C3.95801 13.8224 4.05445 14.7206 4.17559 15.6204C4.32409 16.7233 5.23726 17.5761 6.32809 17.6263C7.49876 17.6801 8.68838 17.7082 9.99968 17.7082C11.311 17.7082 12.5006 17.6801 13.6713 17.6263C14.7621 17.5761 15.6753 16.7233 15.8238 15.6204C15.9449 14.7206 16.0413 13.8224 16.0413 12.9165C16.0413 12.0106 15.9449 11.1124 15.8238 10.2126C15.6753 9.10973 14.7621 8.2569 13.6713 8.20676C12.5006 8.15294 11.311 8.12484 9.99968 8.12484Z" fill="#E7B119" />
                                                </svg>
                                            </Box>
                                        </Tooltip>
                                    )}
                                </Box>
                                {filters.dateCreated === 'Custom' && <SelectedIcon />}
                            </ListItem>
                        </List>

                        {/* Custom Date Range Inputs */}
                        {showCustomDateRange && (
                            <Box sx={{ py: 2, display: 'flex', gap: 2 }}>
                                <Box sx={{width: '100%'}}>
                                    <Typography variant="body2" color="text.secondary">Start Date</Typography>
                                <TextField
                                    type="date"
                                    size="small"
                                    placeholder="Start Date"
                                    value={filters.customDateStart || ''}
                                    onChange={(e) => handleCustomDateChange('customDateStart', e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            fontSize: '0.875rem',
                                            width: '100%'
                                        }
                                    }}
                                    style={{width: '100%'}}
                                />
                                </Box>
                                <Box sx={{width: '100%'}}>
                                    <Typography variant="body2" color="text.secondary">End Date</Typography>
                                <TextField
                                    type="date"
                                    size="small"
                                    placeholder="End Date"
                                    value={filters.customDateEnd || ''}
                                    onChange={(e) => handleCustomDateChange('customDateEnd', e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            fontSize: '0.875rem',
                                            width: '100%'
                                        }
                                    }}
                                    style={{width: '100%'}}
                                />
                                </Box>
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
                        borderBottom: '1px solid #e0e0e0',
                        position: 'relative',
                        border: expanded === 'deliveryMethod' ? '1px solid #e0e0e0' : '',
                        borderRadius: expanded === 'deliveryMethod' ? 2 : '',
                        py: expanded === 'deliveryMethod' ? 0 : ''
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
                            <Typography variant="body2" color="text.secondary">Delivery Method</Typography>
                            <Typography variant="body1" fontWeight="medium">{getSelectedOption('deliveryMethod')}</Typography>
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
                        <List sx={{ width: '100%', p: 0 }}>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, deliveryMethod: '' })}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                component="div"
                            >
                                <ListItemText primary="All" />
                                {filters.deliveryMethod === '' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, deliveryMethod: 'Email' })}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                component="div"
                            >
                                <ListItemText primary="Email" />
                                {filters.deliveryMethod === 'Email' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, deliveryMethod: 'Auto-delivery' })}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                component="div"
                            >
                                <ListItemText primary="Auto-delivery" />
                                {filters.deliveryMethod === 'Auto-delivery' && <SelectedIcon />}
                            </ListItem>
                            <ListItem
                                onClick={() => onFilterChange({ ...filters, deliveryMethod: 'Manual only' })}
                                sx={{
                                    py: 1.5,
                                    px: 0,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgb(226, 226, 226)',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                component="div"
                            >
                                <ListItemText primary="Manual only" />
                                {filters.deliveryMethod === 'Manual only' && <SelectedIcon />}
                            </ListItem>
                        </List>
                    </AccordionDetails>
                </Accordion>
            </Paper>

        </Box>
    );
};

export default SummaryFilters;