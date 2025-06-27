'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  PersonOutline as PersonIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { User } from '@/types';

interface UserTableProps {
  users: User[];
  onViewProfile: (user: User) => void;
  onChangeRole: (user: User) => void;
  onRestrictUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onViewActivity: (user: User) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onViewProfile,
  onChangeRole,
  onRestrictUser,
  onDeleteUser,
  onViewActivity
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not recorded';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string | undefined) => {
    role = role || 'user';
    switch (role) {
      case 'admin':
        return { bg: '#e3f2fd', color: '#1565c0' };
      case 'manager':
        return { bg: '#fff8e1', color: '#f57c00' };
      case 'editor':
        return { bg: '#f3e5f5', color: '#7b1fa2' };
      case 'viewer':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };

  const getStatusColor = (status: string | undefined) => {
    status = status || 'active';
    switch (status) {
      case 'active':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'restricted':
        return { bg: '#ffebee', color: '#c62828' };
      case 'pending':
        return { bg: '#fff8e1', color: '#f57c00' };
      case 'deleted':
        return { bg: '#eeeeee', color: '#757575' };
      default:
        return { bg: '#f5f5f5', color: '#616161' };
    }
  };


  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
      <Table aria-label="user management table">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Joined</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Last Login</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow 
                key={user._id} 
                hover 
                sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {user.firstName || user.lastName ? 
                      `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                      user.email.split('@')[0]
                    }
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.company?.name || 'Not specified'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role || 'User'}
                    size="small"
                    sx={{
                      bgcolor: getRoleColor(user.role).bg,
                      color: getRoleColor(user.role).color,
                      fontWeight: 'medium',
                      textTransform: 'capitalize'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status || 'Active'}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(user.status).bg,
                      color: getStatusColor(user.status).color,
                      fontWeight: 'medium',
                      textTransform: 'capitalize'
                    }}
                  />
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>{formatDate(user.lastLogin)}</TableCell>
                <TableCell>
                  <IconButton
                    aria-label="user actions"
                    id="user-actions-button"
                    aria-controls={open && selectedUser?._id === user._id ? 'user-actions-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open && selectedUser?._id === user._id ? 'true' : undefined}
                    onClick={(event) => handleOpenMenu(event, user)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No users found
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Actions Menu */}
      <Menu
        id="user-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        MenuListProps={{
          'aria-labelledby': 'user-actions-button',
        }}
      >
        {selectedUser && (
          <>
            <MenuItem
              onClick={() => {
                onViewProfile(selectedUser);
                handleCloseMenu();
              }}
            >
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              View Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                onViewActivity(selectedUser);
                handleCloseMenu();
              }}
            >
              <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
              View Activity
            </MenuItem>
            <MenuItem
              onClick={() => {
                onChangeRole(selectedUser);
                handleCloseMenu();
              }}
            >
              <AdminIcon fontSize="small" sx={{ mr: 1 }} />
              Change Role
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                onRestrictUser(selectedUser);
                handleCloseMenu();
              }}
              sx={{ color: selectedUser.status === 'deleted' ? 'success.main' : selectedUser.status === 'restricted' ? 'success.main' : 'error.main' }}
            >
              <BlockIcon fontSize="small" sx={{ mr: 1 }} />
              {selectedUser.status === 'deleted' ? 'Restore User' : selectedUser.status === 'restricted' ? 'Enable User' : 'Restrict User'}
            </MenuItem>
            <MenuItem
              onClick={() => {
                onDeleteUser(selectedUser);
                handleCloseMenu();
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete User
            </MenuItem>
          </>
        )}
      </Menu>
    </TableContainer>
  );
};

export default UserTable; 