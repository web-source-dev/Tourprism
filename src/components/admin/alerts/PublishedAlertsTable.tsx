import React, { useState } from 'react';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton,
  Button, 
  Chip, 
  Box,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ArchiveIcon from '@mui/icons-material/Archive';
import { Alert } from '@/types';
import { deleteAlert, archiveAlert, duplicateAlert } from '@/services/api';
import { useToast } from '@/ui/toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface PublishedAlertsTableProps {
  alerts: Alert[];
  refreshData: () => void;
}

export default function PublishedAlertsTable({ alerts, refreshData }: PublishedAlertsTableProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleViewAlert = (alertId: string) => {
    router.push(`/admin/alerts/edit/${alertId}`);
  };

  const handleEditAlert = (alertId: string) => {
    router.push(`/admin/alerts/edit/${alertId}`);
  };

  const handleDeleteAlert = async () => {
    if (!selectedAlert) return;
    
    setActionLoading(true);
    try {
      await deleteAlert(selectedAlert._id);
      showToast('Alert deleted successfully', 'success');
      refreshData();
    } catch (error) {
      console.error('Error deleting alert:', error);
      showToast('Failed to delete alert', 'error');
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleArchiveAlert = async () => {
    if (!selectedAlert) return;
    
    setActionLoading(true);
    try {
      await archiveAlert(selectedAlert._id);
      showToast('Alert archived successfully', 'success');
      refreshData();
    } catch (error) {
      console.error('Error archiving alert:', error);
      showToast('Failed to archive alert', 'error');
    } finally {
      setActionLoading(false);
      setArchiveDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleDuplicateAlert = async (alertId: string) => {
    try {
      await duplicateAlert(alertId);
      showToast('Alert duplicated successfully', 'success');
      refreshData();
    } catch (error) {
      console.error('Error duplicating alert:', error);
      showToast('Failed to duplicate alert', 'error');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'Minor':
        return 'success';
      case 'Moderate':
        return 'warning';
      case 'Severe':
        return 'error';
      default:
        return 'default';
    }
  };

  if (alerts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="body1" color="text.secondary">
          No published alerts found
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ mb: 4, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <Table aria-label="published alerts table">
          <TableHead sx={{ bgcolor: 'success.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Location</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Impact</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Published Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Active Until</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert._id} hover>
                <TableCell>{alert.title || 'Untitled Alert'}</TableCell>
                <TableCell>{alert.alertCategory || 'Uncategorized'}</TableCell>
                <TableCell>{alert.originCity || alert.city || 'N/A'}</TableCell>
                <TableCell>
                  <Chip 
                    label={alert.impact || 'N/A'} 
                    size="small"
                    color={getImpactColor(alert.impact) as any} 
                  />
                </TableCell>
                <TableCell>{formatDate(alert.createdAt)}</TableCell>
                <TableCell>{alert.expectedEnd ? formatDate(alert.expectedEnd as string) : 'Ongoing'}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <IconButton 
                      color="info" 
                      onClick={() => handleViewAlert(alert._id)}
                      title="View Details"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEditAlert(alert._id)}
                      title="Edit Alert"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="default" 
                      onClick={() => handleDuplicateAlert(alert._id)}
                      title="Duplicate Alert"
                    >
                      <FileCopyIcon />
                    </IconButton>
                    <IconButton 
                      color="warning" 
                      onClick={() => {
                        setSelectedAlert(alert);
                        setArchiveDialogOpen(true);
                      }}
                      title="Archive Alert"
                    >
                      <ArchiveIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => {
                        setSelectedAlert(alert);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete Alert"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Alert</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this alert? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteAlert} color="error" variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)}>
        <DialogTitle>Archive Alert</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to archive this alert? It will be moved to the archive section.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={handleArchiveAlert} color="warning" variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 