'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import { 
  getCollaborators, 
  inviteCollaborator, 
  resendCollaboratorInvitation, 
  updateCollaboratorRole, 
  updateCollaboratorStatus, 
  deleteCollaborator 
} from '@/services/api';

interface CollaboratorProps {
  _id: string;
  email: string;
  name?: string;
  role: 'viewer' | 'manager';
  status: 'invited' | 'active' | 'restricted' | 'deleted';
  invitationToken?: string;
  createdAt?: string;
}

const CollaboratorTab = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'viewer' | 'manager'>('viewer');
  const [collaborators, setCollaborators] = useState<CollaboratorProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<CollaboratorProps | null>(null);

  // Fetch collaborators when component mounts
  useEffect(() => {
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const response = await getCollaborators();
      setCollaborators(response.collaborators);
      setError(null);
    } catch (error: unknown) {
      setError('Failed to load collaborators. Please try again.');
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await inviteCollaborator({
        email: email.trim(),
        name: name.trim(),
        role
      });
      
      setSuccess(response.message || 'Invitation sent successfully!');
      setEmail('');
      setName('');
      fetchCollaborators(); // Refresh the list
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error sending invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (collaboratorId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await resendCollaboratorInvitation(collaboratorId);
      
      setSuccess(response.message || 'Invitation resent successfully!');
      fetchCollaborators(); // Refresh the list
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error resending invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (collaboratorId: string, status: 'active' | 'restricted') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateCollaboratorStatus(collaboratorId, status);
      
      setSuccess(response.message || `Collaborator ${status === 'active' ? 'activated' : 'restricted'} successfully!`);
      fetchCollaborators(); // Refresh the list
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error updating collaborator status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (collaboratorId: string, newRole: 'viewer' | 'manager') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateCollaboratorRole(collaboratorId, newRole);
      
      setSuccess(response.message || 'Collaborator role updated successfully!');
      fetchCollaborators(); // Refresh the list
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error updating collaborator role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (collaborator: CollaboratorProps) => {
    setSelectedCollaborator(collaborator);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedCollaborator(null);
  };

  const handleDeleteCollaborator = async () => {
    if (!selectedCollaborator) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await deleteCollaborator(selectedCollaborator._id);
      
      setSuccess(response.message || 'Collaborator removed successfully!');
      fetchCollaborators(); // Refresh the list
      handleCloseDeleteDialog();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error removing collaborator:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'invited': return 'warning';
      case 'restricted': return 'error';
      case 'deleted': return 'default';
      default: return 'default';
    }
  };

  // Clear success/error messages after a delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Collaborator Management
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Invite team members to access your account. Viewers can only see information, while Managers can make changes.
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Invite New Collaborator
        </Typography>
        
        <Box component="form" onSubmit={handleInvite} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, gap: 2 }}>
            <TextField
              label="Name"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              placeholder="Enter collaborator's name"
            />
            
            <TextField
              label="Email Address"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              placeholder="Enter collaborator's email"
            />
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, gap: 2, alignItems: {xs: 'stretch', sm: 'flex-end'} }}>
            <FormControl variant="outlined" sx={{ flex: 1, minWidth: '120px' }}>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                value={role}
                onChange={(e) => setRole(e.target.value as 'viewer' | 'manager')}
                label="Role"
              >
                <MenuItem value="viewer">Viewer</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={loading || !email.trim()}
              sx={{ flex: 1, height: {xs: '42px', sm: '56px'} }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Invite'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Manage Collaborators
      </Typography>

      {loading && collaborators.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : collaborators.length === 0 ? (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No collaborators yet. Invite team members to get started.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collaborators.map((collaborator) => (
                <TableRow key={collaborator._id}>
                  <TableCell>{collaborator.name || 'Not specified'}</TableCell>
                  <TableCell>{collaborator.email}</TableCell>
                  <TableCell>
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={collaborator.role}
                        onChange={(e) => handleUpdateRole(collaborator._id, e.target.value as 'viewer' | 'manager')}
                        disabled={loading || collaborator.status === 'deleted'}
                      >
                        <MenuItem value="viewer">Viewer</MenuItem>
                        <MenuItem value="manager">Manager</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={collaborator.status.charAt(0).toUpperCase() + collaborator.status.slice(1)} 
                      color={getStatusChipColor(collaborator.status) as "success" | "warning" | "error" | "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {collaborator.status === 'invited' && (
                        <IconButton 
                          onClick={() => handleResendInvitation(collaborator._id)}
                          disabled={loading}
                          size="small"
                          color="primary"
                          title="Resend Invitation"
                        >
                          <EmailIcon />
                        </IconButton>
                      )}
                      
                      {collaborator.status === 'restricted' && (
                        <IconButton 
                          onClick={() => handleUpdateStatus(collaborator._id, 'active')}
                          disabled={loading}
                          size="small"
                          color="success"
                          title="Activate Collaborator"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      
                      {collaborator.status === 'active' && (
                        <IconButton 
                          onClick={() => handleUpdateStatus(collaborator._id, 'restricted')}
                          disabled={loading}
                          size="small"
                          color="warning"
                          title="Restrict Access"
                        >
                          <BlockIcon />
                        </IconButton>
                      )}
                      
                      <IconButton 
                        onClick={() => handleOpenDeleteDialog(collaborator)}
                        disabled={loading}
                        size="small"
                        color="error"
                        title="Remove Collaborator"
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
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Remove Collaborator</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {selectedCollaborator?.name || selectedCollaborator?.email} as a collaborator? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteCollaborator} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CollaboratorTab;
