import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ConstructionIcon from '@mui/icons-material/Construction';

interface ComingSoonPopupProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

const ComingSoonPopup: React.FC<ComingSoonPopupProps> = ({ 
  open, 
  onClose, 
  feature = 'This feature' 
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          padding: 1,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          Coming Soon
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center',
          py: 3
        }}>
          <ConstructionIcon sx={{ fontSize: 60, mb: 2, color: '#333' }} />
          <Typography variant="h6" gutterBottom>
            {feature} is coming soon!
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          sx={{ 
            borderRadius: '8px',
            px: 4,
            py: 1,
            bgcolor: '#333',
            '&:hover': {
              bgcolor: '#555'
            }
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComingSoonPopup; 