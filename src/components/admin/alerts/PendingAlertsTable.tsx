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
  DialogTitle,
  TextField,
  ChipProps
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Alert } from '@/types';
import { updateAlertStatus } from '@/services/api';
import { useToast } from '@/ui/toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface PendingAlertsTableProps {
  alerts: Alert[];
  refreshData: () => void;
}

export default function PendingAlertsTable({ alerts, refreshData }: PendingAlertsTableProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleViewAlert = (alertId: string) => {
    router.push(`/admin/alerts/edit/${alertId}`);
  };

  const handleApproveAlert = async () => {
    if (!selectedAlert) return;
    
    setActionLoading(true);
    try {
      await updateAlertStatus(selectedAlert._id, 'approved');
      showToast('Alert approved successfully', 'success');
      refreshData();
    } catch (error) {
      console.error('Error approving alert:', error);
      showToast('Failed to approve alert', 'error');
    } finally {
      setActionLoading(false);
      setConfirmDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleRejectAlert = async () => {
    if (!selectedAlert) return;
    
    setActionLoading(true);
    try {
      await updateAlertStatus(selectedAlert._id, 'rejected');
      showToast('Alert rejected successfully', 'success');
      refreshData();
    } catch (error) {
      console.error('Error rejecting alert:', error);
      showToast('Failed to reject alert', 'error');
    } finally {
      setActionLoading(false);
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedAlert(null);
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
          No pending alerts found
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ mb: 4, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <Table aria-label="pending alerts table">
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Location</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Impact</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Submitted By</TableCell>
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
                    color={getImpactColor(alert.impact) as ChipProps['color']} 
                  />
                </TableCell>
                <TableCell>{formatDate(alert.createdAt)}</TableCell>
                <TableCell>
                  {typeof alert.createdBy === 'object' && alert.createdBy ? 
                    (alert.createdBy.firstName ? 
                      `${alert.createdBy.firstName} ${alert.createdBy.lastName || ''}` : 
                      alert.createdBy.email) : 
                    'System'
                  }
                </TableCell>
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
                      color="success" 
                      onClick={() => {
                        setSelectedAlert(alert);
                        setConfirmDialogOpen(true);
                      }}
                      title="Approve Alert"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => {
                        setSelectedAlert(alert);
                        setRejectDialogOpen(true);
                      }}
                      title="Reject Alert"
                    >
                      <CancelIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Approve Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Approve Alert</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to approve this alert? It will be published and visible to all users.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={handleApproveAlert} color="primary" variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Alert</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to reject this alert?
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Reason for rejection (optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={handleRejectAlert} color="error" variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Processing...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 