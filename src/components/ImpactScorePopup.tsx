import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Alert as AlertType } from '@/types';

interface ImpactScorePopupProps {
  open: boolean;
  onClose: () => void;
  alert: AlertType;
}

const ImpactScorePopup: React.FC<ImpactScorePopupProps> = ({ open, onClose, alert }) => {
  // Calculate individual scores for breakdown
  const calculateScores = () => {
    const now = new Date();
    
    // Check if alert has ended
    const endDate = alert.expectedEnd ? new Date(alert.expectedEnd) : null;
    if (endDate && endDate < now) {
      return {
        urgencyScore: -1,
        durationScore: 0,
        severityScore: 0,
        recencyScore: 0,
        total: -1,
        isExpired: true
      };
    }

    // 1. Urgency Score - Based on time until start
    let urgencyScore = 0;
    const startDate = alert.expectedStart ? new Date(alert.expectedStart) : null;
    
    if (startDate) {
      const hoursToStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (startDate <= now) {
        // Already started
        urgencyScore = 0;
      } else if (hoursToStart <= 24) {
        urgencyScore = 3; // <= 24 hours
      } else if (hoursToStart <= 72) {
        urgencyScore = 2; // 1-3 days
      } else if (hoursToStart <= 168) {
        urgencyScore = 1; // 4-7 days
      } else {
        urgencyScore = 0; // > 7 days
      }
    } else {
      // No start date, treat as medium urgency
      urgencyScore = 1;
    }
    
    // 2. Duration Score - Based on event duration
    let durationScore = 0;
    if (startDate && endDate) {
      const durationInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (durationInDays > 3) {
        durationScore = 3;
      } else if (durationInDays >= 2) {
        durationScore = 2;
      } else {
        durationScore = 1;
      }
    } else {
      // Default duration score if dates not available
      durationScore = 1;
    }
    
    // 3. Severity Score - Based on impact level
    let severityScore = 0;
    const impact = alert.impact || '';
    
    // Using string check to avoid type errors
    if (impact.includes('High') || impact.includes('High')) {
      severityScore = 3;
    } else if (impact.includes('Moderate') || impact.includes('Medium')) {
      severityScore = 2;
    } else {
      severityScore = 1; // Low, Low, or undefined
    }
    
    // 4. Recency Score - Based on when alert was posted
    let recencyScore = 0;
    const createdAt = new Date(alert.createdAt);
    const daysFromCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysFromCreation <= 1) {
      recencyScore = 3; // Posted <= 24h
    } else if (daysFromCreation <= 3) {
      recencyScore = 2; // 2-3 days ago
    } else {
      recencyScore = 1; // > 3 days ago
    }
    
    // Calculate individual weighted scores
    const weightedUrgencyScore = urgencyScore * 4;
    const weightedDurationScore = durationScore * 3;
    const weightedSeverityScore = severityScore * 2;
    const weightedRecencyScore = recencyScore * 1;
    
    // Calculate total score with weights
    const weightedTotal = weightedUrgencyScore + weightedDurationScore + weightedSeverityScore + weightedRecencyScore;
    
    // Original unweighted total (for backwards compatibility)
    const total = urgencyScore + durationScore + severityScore + recencyScore;

    return {
      urgencyScore,
      durationScore,
      severityScore,
      recencyScore,
      weightedUrgencyScore,
      weightedDurationScore, 
      weightedSeverityScore,
      weightedRecencyScore,
      weightedTotal,
      total,
      isExpired: false
    };
  };

  const scores = calculateScores();
  const followBoost = alert.isFollowing ? 0.1 : 0;
  // We don't know here if it's an operating region alert, so we display it as a note

  const getUrgencyExplanation = () => {
    const startDate = alert.expectedStart ? new Date(alert.expectedStart) : null;
    const now = new Date();
    
    if (!startDate) return "No start date available (medium urgency)";
    
    const hoursToStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (startDate <= now) {
      return "Alert has already started";
    } else if (hoursToStart <= 24) {
      return "Starts within 24 hours";
    } else if (hoursToStart <= 72) {
      return "Starts within 1-3 days";
    } else if (hoursToStart <= 168) {
      return "Starts within 4-7 days";
    } else {
      return "Starts after 7 days";
    }
  };

  const getDurationExplanation = () => {
    const startDate = alert.expectedStart ? new Date(alert.expectedStart) : null;
    const endDate = alert.expectedEnd ? new Date(alert.expectedEnd) : null;
    
    if (!startDate || !endDate) return "Unknown duration";
    
    const durationInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (durationInDays > 3) {
      return "Duration greater than 3 days";
    } else if (durationInDays >= 2) {
      return "Duration 2-3 days";
    } else {
      return "Duration less than 2 days";
    }
  };

  const getRecencyExplanation = () => {
    const now = new Date();
    const createdAt = new Date(alert.createdAt);
    const daysFromCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysFromCreation <= 1) {
      return "Posted within last 24 hours";
    } else if (daysFromCreation <= 3) {
      return "Posted 2-3 days ago";
    } else {
      return "Posted more than 3 days ago";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        Impact Score Calculation
      </DialogTitle>
      <DialogContent>
        {scores.isExpired ? (
          <Box sx={{ mb: 2 }}>
            <Paper sx={{ p: 2, bgcolor: '#f8f8f8', borderRadius: 2 }}>
              <Typography variant="h6" color="error" gutterBottom>
                Alert Expired
              </Typography>
              <Typography variant="body2">
                This alert has already ended and has a negative impact score (-1),
                which means it shouldn&apos;t be displayed in the feed.
              </Typography>
            </Paper>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Paper sx={{ p: 2, bgcolor: '#f8f8f8', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  Total Impact Score: {(scores.weightedTotal || scores.total).toFixed(1)}
                  {followBoost > 0 && " + 0.1 (follow boost) = " + ((scores.weightedTotal || scores.total) + followBoost).toFixed(1)}
                </Typography>
              </Paper>
            </Box>
            
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Score Breakdown:
            </Typography>
            
            <List>
              <ListItem divider>
                <ListItemText 
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">Urgency Score (x4):</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {scores.urgencyScore} × 4 = {scores.weightedUrgencyScore || (scores.urgencyScore * 4)}
                      </Typography>
                    </Box>
                  }
                  secondary={getUrgencyExplanation()}
                />
              </ListItem>
              
              <ListItem divider>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">Duration Score (x3):</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {scores.durationScore} × 3 = {scores.weightedDurationScore || (scores.durationScore * 3)}
                      </Typography>
                    </Box>
                  }
                  secondary={getDurationExplanation()}
                />
              </ListItem>
              
              <ListItem divider>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">Severity Score (x2):</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {scores.severityScore} × 2 = {scores.weightedSeverityScore || (scores.severityScore * 2)}
                      </Typography>
                    </Box>
                  }
                  secondary={alert.impact === 'High' || !alert.impact
                    ? 'High Impact'
                    : alert.impact === 'Moderate'
                      ? 'Moderate Impact'
                      : alert.impact === 'Low'
                        ? 'Low Impact'
                        : `${alert.impact} Impact`}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">Recency Score (x1):</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {scores.recencyScore} × 1 = {scores.weightedRecencyScore || scores.recencyScore}
                      </Typography>
                    </Box>
                  }
                  secondary={getRecencyExplanation()}
                />
              </ListItem>
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImpactScorePopup; 