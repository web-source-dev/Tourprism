'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Stack,
  Link,
  useTheme,
  useMediaQuery,
  Divider,
  Paper,
  IconButton,
  LinearProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import LanguageIcon from '@mui/icons-material/Language';
import GroupIcon from '@mui/icons-material/Group';
import { Alert as AlertType } from '@/types';
import { viewAlertDetails } from '@/services/api';
import Image from 'next/image';

interface AlertViewDialogProps {
  open: boolean;
  onClose: () => void;
  alertId: string | null;
}

export default function AlertViewDialog({ open, onClose, alertId }: AlertViewDialogProps) {
  const [alert, setAlert] = useState<AlertType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (open && alertId) {
      fetchAlertDetails(alertId);
    } else {
      setAlert(null);
    }
  }, [open, alertId]);

  const fetchAlertDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const alertData = await viewAlertDetails(id);
      setAlert(alertData);
    } catch (error) {
      console.error('Error fetching alert details:', error);
      setError('Failed to load alert details');
    } finally {
      setLoading(false);
    }
  };

  // Format date display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'rejected':
        return { bg: '#ffebee', color: '#c62828' };
      case 'archived':
        return { bg: '#e0e0e0', color: '#616161' };
      case 'deleted': 
        return { bg: '#ef9a9a', color: '#b71c1c' };
      default:
        return { bg: '#fff8e1', color: '#f57f17' };
    }
  };

  // Get impact color
  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'Severe':
        return { bg: '#ffebee', color: '#c62828' };
      case 'Moderate':
        return { bg: '#fff8e1', color: '#f57f17' };
      case 'Minor':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  // Format timestamp display
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Less than a day ago
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      // Less than a month ago
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      // More than a month ago, show the date
      return formatDate(dateString);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1 
      }}>
        <Typography variant="h6" component="div">
          Alert Details
        </Typography>
        <IconButton edge="end" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      <DialogContent dividers sx={{ p: 0 }}>
        {error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button 
              variant="outlined" 
              onClick={() => alertId && fetchAlertDetails(alertId)}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Box>
        ) : alert ? (
          <>
            {/* Header section with title and status */}
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={alert.alertCategory || 'General'}
                  size="small"
                  sx={{ fontWeight: 'medium' }}
                />
                <Chip
                  label={alert.status?.charAt(0).toUpperCase() + (alert.status?.slice(1) || '')}
                  size="small"
                  sx={{
                    bgcolor: getStatusColor(alert.status).bg,
                    color: getStatusColor(alert.status).color,
                    fontWeight: 'medium'
                  }}
                />
              </Box>
              
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mt: 1 }}>
                {alert.title || 'Untitled Alert'}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {alert.city || 'Unknown location'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatTimeAgo(alert.createdAt)}
                  </Typography>
                </Box>
                
                {alert.impact && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PriorityHighIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      Impact: 
                      <Chip
                        label={alert.impact}
                        size="small"
                        sx={{
                          ml: 0.5,
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: getImpactColor(alert.impact).bg,
                          color: getImpactColor(alert.impact).color
                        }}
                      />
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            
            <Divider />
            
            {/* Main alert information */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: { xs: '1', md: '7' } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
                    {alert.description || 'No description provided.'}
                  </Typography>
                  
                  {alert.recommendedAction && (
                    <>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Recommended Action
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
                        {alert.recommendedAction}
                      </Typography>
                    </>
                  )}
                  
                  {alert.linkToSource && (
                    <>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Source
                      </Typography>
                      <Link href={alert.linkToSource} target="_blank" rel="noopener">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LanguageIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            View source
                          </Typography>
                        </Box>
                      </Link>
                    </>
                  )}
                </Box>
                
                <Box sx={{ flex: { xs: '1', md: '5' } }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Alert Details
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Alert Type
                        </Typography>
                        <Typography variant="body1">
                          {alert.alertType || 'Not specified'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Priority
                        </Typography>
                        <Typography variant="body1">
                          {alert.priority || 'Not specified'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Risk Level
                        </Typography>
                        <Typography variant="body1">
                          {alert.risk || 'Not specified'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Timeframe
                        </Typography>
                        <Typography variant="body1">
                          {alert.expectedStart ? formatDate(alert.expectedStart) : 'Not specified'} 
                          {alert.expectedEnd ? ` - ${formatDate(alert.expectedEnd)}` : ''}
                        </Typography>
                      </Box>
                      
                      {Array.isArray(alert.targetAudience) && alert.targetAudience.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Target Audience
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {alert.targetAudience.map((audience, index) => (
                              <Chip
                                key={index}
                                icon={<GroupIcon fontSize="small" />}
                                label={audience}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      <Divider />
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(alert.updated || alert.updatedAt)}
                          {alert.updatedBy && ` by ${alert.updatedBy}`}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                  
                  {/* Display media if available */}
                  {alert.media && alert.media.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Media
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {alert.media.map((item, index) => (
                          <Box 
                            key={index}
                            sx={{
                              width: 'calc(50% - 4px)',
                              position: 'relative',
                              height: 120,
                              borderRadius: 1,
                              overflow: 'hidden',
                            }}
                          >
                            {item.type.includes('image') ? (
                              <Image
                                src={item.url}
                                alt={`Alert media ${index + 1}`}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  height: '100%',
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'action.hover',
                                }}
                              >
                                <Typography variant="body2">
                                  {item.type} file
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No alert selected</Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 