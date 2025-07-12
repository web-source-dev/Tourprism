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
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/ui/toast';
import { downloadPdf, deleteSummary, Summary } from '@/services/summaryService';

interface SummaryListProps {
  summaries: Summary[];
  refreshData: () => void;
}

export default function SummaryList({ summaries, refreshData }: SummaryListProps) {
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const handleViewSummary = (summaryId: string) => {
    router.push(`/alerts-summary/${summaryId}`);
  };

  const handleDownloadPdf = async (summary: Summary) => {
    setActionLoading(true);
    try {
      await downloadPdf(summary._id);
      showToast('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showToast('Failed to download PDF', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSummary = async () => {
    if (!selectedSummary) return;
    
    setActionLoading(true);
    try {
      await deleteSummary(selectedSummary._id);
      showToast('Summary deleted successfully', 'success');
      refreshData();
    } catch (error) {
      console.error('Error deleting summary:', error);
      showToast('Failed to delete summary', 'error');
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setSelectedSummary(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get summary type display name
  const getSummaryTypeDisplay = (type: string) => {
    switch (type) {
      case 'forecast':
        return 'Forecast';
      case 'custom':
        return 'Custom';
      case 'automated':
        return 'Automated';
      default:
        return type;
    }
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ mb: 4, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <Table aria-label="summaries table">
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Location</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Time Range</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body1">No summaries available</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              summaries.map((summary) => (
                <TableRow key={summary._id} hover>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {summary.title}
                    </Typography>
                    {summary.description && (
                      <Typography variant="body2" color="text.secondary">
                        {summary.description.length > 50 
                          ? `${summary.description.substring(0, 50)}...` 
                          : summary.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getSummaryTypeDisplay(summary.summaryType)} 
                      size="small" 
                      color={summary.summaryType === 'forecast' ? 'primary' : 'default'} 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {summary.locations && summary.locations.length > 0 
                      ? summary.locations.map(loc => loc.city).join(', ')
                      : 'Multiple locations'}
                  </TableCell>
                  <TableCell>{formatDate(summary.createdAt)}</TableCell>
                  <TableCell>
                    {summary.timeRange?.startDate && summary.timeRange?.endDate 
                      ? `${formatDate(summary.timeRange.startDate)} - ${formatDate(summary.timeRange.endDate)}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <IconButton 
                        color="info" 
                        onClick={() => handleViewSummary(summary._id)}
                        title="View Summary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {summary.pdfUrl && (
                        <IconButton 
                          color="success" 
                          onClick={() => handleDownloadPdf(summary)}
                          title="Download PDF"
                          disabled={actionLoading}
                        >
                          <PictureAsPdfIcon />
                        </IconButton>
                      )}
                      <IconButton 
                        color="error" 
                        onClick={() => {
                          setSelectedSummary(summary);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete Summary"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Summary</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this summary? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="primary"
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteSummary} 
            color="error" 
            autoFocus
            disabled={actionLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 