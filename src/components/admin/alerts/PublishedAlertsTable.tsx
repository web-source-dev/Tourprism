import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Chip,
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
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
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface PublishedAlertsTableProps {
  alerts: Alert[];
  refreshData: () => void;
}



const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return format(date, 'MMM dd, hh:mm a');
};

export default function PublishedAlertsTable({ alerts, refreshData }: PublishedAlertsTableProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const [localAlerts, setLocalAlerts] = useState(alerts);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Get unique categories and locations from alerts
  const categories = Array.from(new Set(alerts.map(a => a.alertCategory).filter(Boolean)));
  const locations = Array.from(new Set(alerts.map(a => a.originCity || a.city).filter(Boolean)));

  // Filtering logic
  const filteredAlerts = localAlerts.filter(alert => {
    const matchesCategory = !category || alert.alertCategory === category;
    const matchesLocation = !location || (alert.originCity || alert.city) === location;
    const matchesStart = !startDate || (alert.expectedStart && new Date(alert.expectedStart) >= startDate);
    const matchesEnd = !endDate || (alert.expectedEnd && new Date(alert.expectedEnd) <= endDate);
    return matchesCategory && matchesLocation && matchesStart && matchesEnd;
  });

  useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);

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
      setLocalAlerts((prev) => prev.filter(a => a._id !== selectedAlert._id));
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
      setLocalAlerts((prev) => prev.filter(a => a._id !== selectedAlert._id));
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

  if (localAlerts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="body1" color="text.secondary">
          No published alerts found
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              alignItems: 'stretch',
              width: '100%',
              mb: 2,
            }}
          >
            <TextField
              select
              placeholder="Alert Category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              SelectProps={{ native: true }}
              variant="outlined"
              sx={{ minWidth: 160, borderRadius: 4, background: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{ style: { borderRadius: 8 } }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </TextField>
            <TextField
              select
              placeholder="Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              SelectProps={{ native: true }}
              variant="outlined"
              sx={{ minWidth: 160, borderRadius: 4, background: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{ style: { borderRadius: 8 } }}
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </TextField>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              slotProps={{
                textField: {
                  placeholder: "Start Date",
                  variant: 'outlined',
                  sx: { minWidth: 160, borderRadius: 2, background: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                  InputProps: { style: { borderRadius: 8 } },
                },
              }}
              format="yyyy-MM-dd"
            />
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              slotProps={{
                textField: {
                  placeholder: "End Date",
                  variant: 'outlined',
                  sx: { minWidth: 160, borderRadius: 2, background: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } },
                  InputProps: { style: { borderRadius: 8 } },
                },
              }}
              format="yyyy-MM-dd"
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {filteredAlerts.map((alert) => (
            <Card key={alert._id} sx={{ minWidth: 370, maxWidth: 420, flex: '1 1 370px', boxShadow: 2, borderRadius: 3, mb: 2, p: 0, position: 'relative', overflow: 'visible' }}>
              {/* Status chip in top right */}
              <Chip label="Approved" color="success" size="small" sx={{ position: 'absolute', top: 18, right: 18, fontWeight: 600, zIndex: 2 }} />
              <CardContent sx={{ pb: 1.5, pt: 2, px: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1.08rem', mb: 0.5, pr: 5, lineHeight: 1.2 }}>
                  {alert.title || 'Untitled Alert'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120, color: 'grey.700', fontWeight: 500 }}>
                    Category:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>{alert.alertCategory || 'Uncategorized'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120, color: 'grey.700', fontWeight: 500 }}>
                    Priority:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>{alert.priority || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120, color: 'grey.700', fontWeight: 500 }}>
                    Location:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>{alert.originCity || alert.city || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120, color: 'grey.700', fontWeight: 500 }}>
                    Timeframe:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>
                    {formatDateTime(alert.expectedStart ? String(alert.expectedStart) : undefined)} - {formatDateTime(alert.expectedEnd ? String(alert.expectedEnd) : undefined)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120, color: 'grey.700', fontWeight: 500 }}>
                    Last updated:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>{formatDateTime(alert.updatedAt ? String(alert.updatedAt) : undefined)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  {(Array.isArray(alert.targetAudience) ? alert.targetAudience : []).map((aud, idx) => (
                    <Chip key={idx} label={aud} size="small" sx={{ fontWeight: 500, bgcolor: '#f5f5f5', color: '#333', borderRadius: 1, px: 1, fontSize: '0.85em' }} />
                  ))}
                </Box>
                {/* Action row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, borderTop: '1px solid #eee', pt: 1.2, justifyContent: 'flex-start', background: '#fafbfc', borderRadius: 2 }}>
                  <IconButton color="info" size="small" onClick={() => handleViewAlert(alert._id)} title="View">
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton color="primary" size="small" onClick={() => handleEditAlert(alert._id)} title="Edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton color="info" size="small" onClick={() => handleDuplicateAlert(alert._id)} title="Duplicate">
                    <FileCopyIcon />
                  </IconButton>
                  <IconButton color="warning" size="small" onClick={() => { setSelectedAlert(alert); setArchiveDialogOpen(true); }} title="Archive">
                    <ArchiveIcon />
                  </IconButton>
                  <IconButton color="error" size="small" onClick={() => { setSelectedAlert(alert); setDeleteDialogOpen(true); }} title="Delete">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}

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
        </Box>
      </Box>
    </LocalizationProvider>
  );
} 