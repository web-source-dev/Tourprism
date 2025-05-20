import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Button,
  Divider
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ p: 0, mb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6" component="div" fontWeight="500">
            Filter By
          </Typography>
          <IconButton 
            edge="end" 
            onClick={onClose} 
            aria-label="close"
            sx={{ p: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ px: 2, py: 1 }}>
        <Box sx={{ pb: 2 }}>
          <SummaryFilters 
            filters={filters} 
            onFilterChange={onFilterChange} 
            locations={locations}
            isModal={true}
          />
        </Box>
      </DialogContent>

      <Divider />
      
      <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          onClick={handleApplyFilters}
          variant="contained"
          sx={{ 
            backgroundColor: '#000', 
            color: '#fff',
            borderRadius: 20,
            px: 4,
            '&:hover': {
              backgroundColor: '#333',
            }
          }}
        >
          Show Results
        </Button>
        <Button 
          onClick={handleClearFilters}
          variant="outlined"
          sx={{ 
            color: '#000',
            borderColor: '#ccc',
            borderRadius: 20,
            px: 4,
            '&:hover': {
              borderColor: '#999',
              backgroundColor: 'rgba(0,0,0,0.04)',
            }
          }}
        >
          Clear All
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterModal; 