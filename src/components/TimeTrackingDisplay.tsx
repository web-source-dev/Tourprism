import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  AccessTime as TimeIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { getFeedTimeTrackingHistory } from '@/services/api';
import { formatTimeDuration, formatDetailedTime } from '@/utils/timeFormat';
import { TimeTrackingSession } from '@/services/api';

interface TimeTrackingDisplayProps {
  isTracking: boolean;
  onShowHistory?: () => void;
}

export const TimeTrackingDisplay: React.FC<TimeTrackingDisplayProps> = ({
  isTracking,
  onShowHistory
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TimeTrackingSession[]>([]);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getFeedTimeTrackingHistory(1, 20);
      setHistory(data.timeTrackings);
      setTotalTimeSpent(data.totalTimeSpent);
    } catch (error) {
      console.error('Error fetching time tracking history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    fetchHistory();
    onShowHistory?.();
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={isTracking ? 'Time tracking active' : 'Time tracking inactive'}>
          <Chip
            icon={<TimeIcon />}
            label={isTracking ? 'Tracking' : 'Not tracking'}
            color={isTracking ? 'success' : 'default'}
            size="small"
            variant="outlined"
          />
        </Tooltip>
        
        <Tooltip title="View time tracking history">
          <IconButton
            size="small"
            onClick={handleShowHistory}
            sx={{ color: 'primary.main' }}
          >
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Dialog
        open={showHistory}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon />
            <Typography variant="h6">Feed Page Time Tracking History</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Total Time Spent on Feed: {formatDetailedTime(totalTimeSpent)}
                </Typography>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Session Start</TableCell>
                      <TableCell>Session End</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="text.secondary">
                            No time tracking history available
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((session) => (
                        <TableRow key={session._id}>
                          <TableCell>
                            {new Date(session.openedAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {session.closedAt 
                              ? new Date(session.closedAt).toLocaleString()
                              : 'Active'
                            }
                          </TableCell>
                          <TableCell>
                            {session.closedAt 
                              ? formatTimeDuration(session.timeSpent)
                              : 'In progress'
                            }
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={session.closedAt ? 'Completed' : 'Active'}
                              color={session.closedAt ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseHistory}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
