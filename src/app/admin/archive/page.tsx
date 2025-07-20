'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Alert } from '@/types';
import { fetchArchivedAlerts } from '@/services/api';
import { 
  Box, Container, Typography, Button, CircularProgress, Paper
} from '@mui/material';
import { useToast } from '@/ui/toast';
import { formatStandardDateTime } from '@/utils/dateFormat';
import AdminLayout from '@/components/AdminLayout';

// Helper function to format time for display
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();

  // Get time difference in seconds
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }
};

function ArchiveContent() {
  const [archivedAlerts, setArchivedAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Load all archived alerts - simplified
  const loadArchivedAlerts = async () => {
    setLoading(true);
    try {
      // Fetch all archived alerts without any parameters
      const result = await fetchArchivedAlerts();
      
      setArchivedAlerts(result.alerts);
      setError(null);
    } catch (error) {
      console.error('Error loading archived alerts:', error);
      setError('Failed to load archived alerts. Please try again.');
      showToast('Failed to load archived alerts', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Load archived alerts on initial component mount
  useEffect(() => {
    loadArchivedAlerts();
  }, []);

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ pt: 1, pb: 4,px: 0 }}>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
            <Button 
              variant="contained" 
              onClick={loadArchivedAlerts} 
              sx={{ borderRadius: 2 }}
            >
              Try Again
            </Button>
          </Box>
        ) : archivedAlerts.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6">No archived alerts found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              There are no past alerts in the archive.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Alerts grid */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              bgcolor: 'transparent',
              gap: 0,
              mt: 2,
              borderBottom: 'none',
              borderRight: 'none',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              {archivedAlerts.map((alert, index) => {
                // Calculate position in grid for border logic
                const position = index;
                const totalItems = archivedAlerts.length;
                
                // Calculate last row items for different breakpoints
                const isLastRowMd = position >= totalItems - (totalItems % 3 || 3);
                const isLastRowSm = position >= totalItems - (totalItems % 2 || 2);
                const isLastRowXs = position === totalItems - 1;
                
                // Calculate if this is the last item in a row
                const isLastInRowMd = (position + 1) % 3 === 0 || position === totalItems - 1;
                const isLastInRowSm = (position + 1) % 2 === 0 || position === totalItems - 1;
                
                return (
                  <Paper
                    key={`alert-${alert._id}`}
                    sx={{
                      p: 2,
                      bgcolor: 'transparent',
                      borderRadius: 0,
                      boxShadow: 'none',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderTop: 'none',
                      borderBottom: {
                        xs: isLastRowXs ? 'none' : '1px solid #E0E1E2',
                        sm: isLastRowSm ? 'none' : '1px solid #E0E1E2',
                        md: isLastRowMd ? 'none' : '1px solid #E0E1E2'
                      },
                      borderRight: { 
                        xs: 'none', 
                        sm: isLastInRowSm ? 'none' : '1px solid #E0E1E2',
                        md: isLastInRowMd ? 'none' : '1px solid #E0E1E2'
                      },
                      backgroundColor: 'transparent',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box></Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#757575', fontSize: '14px' }}>
                          {formatRelativeTime(alert.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Alert Header with Title */}
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1.5
                    }}>
                      <Typography variant="subtitle1" sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        flex: 1,
                        letterSpacing: '-0.25px'
                      }}>
                        {alert.title || "Archived Alert"}
                      </Typography>
                    </Box>

                    {/* Location info */}
                    <Typography variant="body2"
                      sx={{
                        color: '#616161',
                        fontSize: '14px',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      {alert.city || alert.originCity || "Unknown location"}
                    </Typography>

                    {/* Alert Content */}
                    <Typography variant="body2" sx={{
                      mb: 1.5,
                      color: '#000000',
                      flex: 1,
                      fontSize: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {alert.description}
                    </Typography>

                    {/* Alert Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Start and End Time */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: '14px', color: '#757575', fontWeight: 500, fontFamily: 'Poppins' }}
                        >
                          Start: {alert.expectedStart ? formatStandardDateTime(alert.expectedStart) : 'N/A'}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ fontSize: '14px', color: '#757575', fontWeight: 500, fontFamily: 'Poppins' }}
                        >
                          End: {alert.expectedEnd ? formatStandardDateTime(alert.expectedEnd) : 'N/A'}
                        </Typography>
                      </Box>

                      {/* Impact Level */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{
                          display: 'inline-block',
                          fontSize: '14px',
                          borderRadius: 1,
                          fontWeight: 500,
                        }}>
                          {alert.impact === 'Minor' ? 'Low' : 
                           alert.impact === 'Severe' ? 'High' : 
                           alert.impact || 'Moderate'} Impact
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
            
            {/* Totals */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {archivedAlerts.length} archived alerts
              </Typography>
            </Box>
          </>
        )}
      </Container>
    </AdminLayout>
  );
}

// Archive page component with proper suspense handling
export default function Archive() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <ArchiveContent />
    </Suspense>
  );
} 