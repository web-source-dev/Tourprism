import React from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';

interface UnlockFeaturesCardProps {
  onDismiss: () => void;
}

const UnlockFeaturesCard: React.FC<UnlockFeaturesCardProps> = ({ onDismiss }) => {
  const router = useRouter();

  const handleCompleteProfile = () => {
    router.push('/profile');
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: 'none',
        border: '1px solid #E0E1E2',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={onDismiss}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'text.secondary',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      {/* Content */}
      <Box sx={{ pr: 4 }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'text.primary',
            mb: 0.5,
          }}
        >
          Want more relevant alerts?
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mb: 2,
          }}
        >
          Set your location and business type.
        </Typography>

        <Button
          variant="contained"
          onClick={handleCompleteProfile}
          sx={{
            textTransform: 'none',
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
            borderRadius: '6px',
            py: 1,
            px: 3,
          }}
        >
          Complete Profile
        </Button>
      </Box>
    </Box>
  );
};

export default UnlockFeaturesCard;
