import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import SummaryFilters from './SummaryFilters';
import { FilterOptions } from '@/utils/summaryFilters';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  locations: string[];
}

const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  locations
}) => {
  // Handle apply button click
  const handleApplyFilters = () => {
    onApplyFilters();
    onClose();
  };

  // Handle clear button click
  const handleClearFilters = () => {
    onClearFilters();
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
      
      <DialogContent style={{padding: '0px', overflowY: 'auto', height: '300px', scrollbarWidth: 'none'}}>
        <SummaryFilters 
          filters={filters} 
          onFilterChange={onFilterChange} 
          locations={locations}
          isModal={true}
        />
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
            borderRadius: 5
          }}
          onClick={handleApplyFilters}
        >
          Show Results
        </Button>
        <Button
          fullWidth
          variant="outlined"
          sx={{
            color: '#616161',
            border: '1px solid #e0e0e0',
            '&:hover': { borderColor: '#616161', backgroundColor: 'rgba(0,0,0,0.04)' },
            py: 1,
            borderRadius: 5
          }}
          onClick={handleClearFilters}
        >
          Clear All
        </Button>
      </Box>
    </Dialog>
  );
};

export default FilterModal; 