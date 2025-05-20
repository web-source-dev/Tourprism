import React, { useState } from 'react';
import {
    Box,
    Typography,
    FormControl,
    Select,
    MenuItem,
    OutlinedInput,
    SelectChangeEvent,
    Chip,
    TextField,
    InputAdornment,
    Tooltip
} from '@mui/material';
import {
    Check as CheckIcon,
    LockOutlined as LockIcon,
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

const SummaryFilters: React.FC<SummaryFiltersProps> = ({
    filters,
    onFilterChange,
    locations = [],
    isModal = false
}) => {
    const { isSubscribed } = useAuth();
    const { showToast } = useToast();
    const [showCustomDateRange, setShowCustomDateRange] = useState(filters.dateCreated === 'Custom');

    const handleFilterChange = (event: SelectChangeEvent<string>, filterType: keyof FilterOptions) => {
        const value = event.target.value;

        // Handle the special case for "Custom" date range
        if (filterType === 'dateCreated' && value === 'Custom') {
            if (!isSubscribed) {
                showToast('Custom date range is available with a subscription', 'error');
                return;
            }
            setShowCustomDateRange(true);
        } else if (filterType === 'dateCreated') {
            setShowCustomDateRange(false);
        }

        onFilterChange({
            ...filters,
            [filterType]: value,
        });
    };

    const handleCustomDateChange = (field: 'customDateStart' | 'customDateEnd', value: string) => {
        onFilterChange({
            ...filters,
            [field]: value
        });
    };

    // Ensure we have at least one default location
    const availableLocations = locations.length > 0
        ? locations
        : ['All Locations'];

    return (
        <Box sx={{ mb: isModal ? 0 : 4 }}>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: isModal ? '1fr' : '1fr 1fr', md: isModal ? '1fr' : '1fr 1fr 1fr 1fr' },
                gap: 2
            }}>
                {/* Report Type Filter */}
                <Box sx={{
                    borderBottom: '1px solid #e0e0e0',
                    overflow: 'hidden'
                }}>
                    <FormControl fullWidth>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                px: 2,
                                fontWeight: 500,
                            }}
                        >
                            Report Type
                        </Typography>
                        <Select
                            value={filters.reportType}
                            onChange={(e) => handleFilterChange(e, 'reportType')}
                            input={<OutlinedInput sx={{ border: 'none', borderRadius: 0 }} />}
                            displayEmpty
                            renderValue={(selected) => (
                                <Typography variant="body2" sx={{ color: 'text.secondary', py: 0 }}>
                                    {selected || 'All Report Types'}
                                </Typography>
                            )}
                            sx={{
                                '& .MuiSelect-select': {
                                    py: 1.5,
                                    px: 2,
                                    border: 'none',
                                    '&:focus': { backgroundColor: 'transparent' }
                                },
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        mt: 0.5,
                                        borderRadius: 2,
                                        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.07)',
                                    },
                                },
                            }}
                        >
                            <MenuItem value="">All Report Types</MenuItem>
                            <MenuItem value="forecast" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                Weekly Forecast
                                {filters.reportType === 'forecast' && <CheckIcon color="success" />}
                            </MenuItem>
                            <MenuItem value="custom" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                Custom Report
                                {filters.reportType === 'custom' && <CheckIcon color="success" />}
                            </MenuItem>
                            <MenuItem value="automated" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                Automated Report
                                {filters.reportType === 'automated' && <CheckIcon color="success" />}
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Location Filter */}
                <Box sx={{
                    borderBottom: '1px solid #e0e0e0',
                    overflow: 'hidden'
                }}>
                    <FormControl fullWidth>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                px: 2,
                                fontWeight: 500,
                            }}
                        >
                            Location
                        </Typography>
                        <Select
                            value={filters.location}
                            onChange={(e) => handleFilterChange(e, 'location')}
                            input={<OutlinedInput sx={{ border: 'none', borderRadius: 0 }} />}
                            displayEmpty
                            renderValue={(selected) => (
                                <Typography variant="body2" sx={{ color: 'text.secondary', py: 0.5 }}>
                                    {selected || 'All Locations'}
                                </Typography>
                            )}
                            sx={{
                                '& .MuiSelect-select': {
                                    py: 1.5,
                                    px: 2,
                                    border: 'none',
                                    '&:focus': { backgroundColor: 'transparent' }
                                },
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        mt: 0.5,
                                        borderRadius: 2,
                                        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.07)',
                                    },
                                },
                            }}
                        >
                            <MenuItem value="">All Locations</MenuItem>
                            {availableLocations.map((location) => (
                                <MenuItem
                                    key={location}
                                    value={location}
                                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                                >
                                    {location}
                                    {filters.location === location && <CheckIcon color="success" />}
                                </MenuItem>
                            ))}
                            <MenuItem value="Current Location" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                Current Location
                                {filters.location === 'Current Location' && <CheckIcon color="success" />}
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Date Created Filter */}
                <Box sx={{
                    borderBottom: '1px solid #e0e0e0',
                    overflow: 'hidden'
                }}>
                    <FormControl fullWidth>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                px: 2,
                                fontWeight: 500,
                            }}
                        >
                            Date Created
                        </Typography>
                        <Select
                            value={filters.dateCreated}
                            onChange={(e) => handleFilterChange(e, 'dateCreated')}
                            input={<OutlinedInput sx={{ border: 'none', borderRadius: 0 }} />}
                            displayEmpty
                            renderValue={(selected) => (
                                <Typography variant="body2" sx={{ color: 'text.secondary', py: 0.5 }}>
                                    {selected || 'All Time'}
                                </Typography>
                            )}
                            sx={{
                                '& .MuiSelect-select': {
                                    py: 1.5,
                                    px: 2,
                                    border: 'none',
                                    '&:focus': { backgroundColor: 'transparent' }
                                },
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        mt: 0.5,
                                        borderRadius: 2,
                                        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.07)',
                                    },
                                },
                            }}
                        >
                            <MenuItem value="">All Time</MenuItem>
                            <MenuItem value="This Week" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                This Week
                                {filters.dateCreated === 'This Week' && <CheckIcon color="success" />}
                            </MenuItem>
                            <MenuItem value="Last 7 Days" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                Last 7 Days
                                {filters.dateCreated === 'Last 7 Days' && <CheckIcon color="success" />}
                            </MenuItem>
                            <MenuItem value="Last 30 Days" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                Last 30 Days
                                {filters.dateCreated === 'Last 30 Days' && <CheckIcon color="success" />}
                            </MenuItem>
                            <MenuItem
                                value="Custom"
                                disabled={!isSubscribed}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    opacity: isSubscribed ? 1 : 0.7
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>

                                    Custom
                                </Box>
                                {!isSubscribed && (
                                    <Tooltip title="Available with subscription">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.41634 5.62533V7.10626C4.10995 7.50604 3.12405 8.65539 2.93677 10.0463C2.81331 10.9633 2.70801 11.9269 2.70801 12.917C2.70801 13.9071 2.81331 14.8707 2.93677 15.7877C3.16308 17.4685 4.55564 18.7966 6.27069 18.8754C7.46104 18.9301 8.66981 18.9587 9.99968 18.9587C11.3295 18.9587 12.5383 18.9301 13.7287 18.8754C15.4437 18.7966 16.8363 17.4685 17.0626 15.7877C17.186 14.8707 17.2913 13.9071 17.2913 12.917C17.2913 11.9269 17.186 10.9633 17.0626 10.0463C16.8753 8.65539 15.8894 7.50604 14.583 7.10626V5.62533C14.583 3.09402 12.531 1.04199 9.99967 1.04199C7.46837 1.04199 5.41634 3.09402 5.41634 5.62533ZM9.99967 2.70866C8.38884 2.70866 7.08301 4.0145 7.08301 5.62533V6.92546C8.01445 6.89239 8.97082 6.87533 9.99968 6.87533C11.0285 6.87533 11.9849 6.89239 12.9163 6.92546V5.62533C12.9163 4.0145 11.6105 2.70866 9.99967 2.70866ZM10.833 12.0837C10.833 11.6234 10.4599 11.2503 9.99967 11.2503C9.53944 11.2503 9.16634 11.6234 9.16634 12.0837V13.7503C9.16634 14.2106 9.53944 14.5837 9.99967 14.5837C10.4599 14.5837 10.833 14.2106 10.833 13.7503V12.0837Z" fill="#E7B119" />
                                        </svg>
                                    </Tooltip>
                                )}
                                {filters.dateCreated === 'Custom' && <CheckIcon color="success" />}
                            </MenuItem>
                        </Select>
                    </FormControl>

                    {/* Custom Date Range Inputs */}
                    {showCustomDateRange && (
                        <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1 }}>
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
                </Box>

                {/* Delivery Method Filter */}
                <Box sx={{
                    borderBottom: '1px solid #e0e0e0',
                    overflow: 'hidden'
                }}>
                    <FormControl fullWidth>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                px: 2,
                                fontWeight: 500,
                            }}
                        >
                            Delivery Method (Optional)
                        </Typography>
                        <Select
                            value={filters.deliveryMethod}
                            onChange={(e) => handleFilterChange(e, 'deliveryMethod')}
                            input={<OutlinedInput sx={{ border: 'none', borderRadius: 0 }} />}
                            displayEmpty
                            renderValue={(selected) => (
                                <Typography variant="body2" sx={{ color: 'text.secondary', py: 0.5 }}>
                                    {selected || 'All Methods'}
                                </Typography>
                            )}
                            sx={{
                                '& .MuiSelect-select': {
                                    py: 1.5,
                                    px: 2,
                                    border: 'none',
                                    '&:focus': { backgroundColor: 'transparent' }
                                },
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        mt: 0.5,
                                        borderRadius: 2,
                                        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.07)',
                                    },
                                },
                            }}
                        >
                            <MenuItem value="">All Methods</MenuItem>
                            <MenuItem value="Email" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                Email
                                {filters.deliveryMethod === 'Email' && <CheckIcon color="success" />}
                            </MenuItem>
                            <MenuItem value="Auto-delivery" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                Auto-delivery
                                {filters.deliveryMethod === 'Auto-delivery' && <CheckIcon color="success" />}
                            </MenuItem>
                            <MenuItem value="Manual only" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                Manual only
                                {filters.deliveryMethod === 'Manual only' && <CheckIcon color="success" />}
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

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