'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TablePagination,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  addUserToSubscribers,
  UserFilters as UserFiltersType
} from '@/services/api';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';

// Import custom components
import UserFiltersComponent from '@/components/admin/users/UserFilters';
import UserTable from '@/components/admin/users/UserTable';
import UserCard from '@/components/admin/users/UserCard';
import ProfileModal from '@/components/admin/users/modals/ProfileModal';
import ChangeRoleModal from '@/components/admin/users/modals/ChangeRoleModal';
import RestrictUserModal from '@/components/admin/users/modals/RestrictUserModal';
import DeleteUserModal from '@/components/admin/users/modals/DeleteUserModal';
import UserActivityModal from '@/components/admin/users/modals/UserActivityModal';
import AddToSubscribersModal from '@/components/admin/users/modals/AddToSubscribersModal';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filters, setFilters] = useState<UserFiltersType>({});
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin } = useAuth();

  // Modal states
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [restrictModalOpen, setRestrictModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [activityModalOpen, setActivityModalOpen] = useState<boolean>(false);
  const [addToSubscribersModalOpen, setAddToSubscribersModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<'restrict' | 'enable'>('restrict');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Permission check for changing user roles/status - only admin can do this
  const canManageUsers = isAdmin;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: UserFiltersType = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
        ...filters
      };

      const { users: fetchedUsers, totalCount } = await getAllUsers(params);
      setUsers(fetchedUsers);
      setTotalCount(totalCount);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (newFilters: UserFiltersType) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // User action handlers
  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setProfileModalOpen(true);
  };

  const handleViewActivity = (user: User) => {
    setSelectedUser(user);
    setActivityModalOpen(true);
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setRoleModalOpen(true);
  };

  const handleRestrictUser = (user: User) => {
    setSelectedUser(user);
    // Check user's current status to determine the action
    // For 'deleted' and 'restricted' users, enable them
    // For 'active' and any other status, restrict them
    setModalAction(user.status === 'restricted' || user.status === 'deleted' ? 'enable' : 'restrict');
    setRestrictModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleAddToSubscribers = (user: User) => {
    setSelectedUser(user);
    setAddToSubscribersModalOpen(true);
  };

  // Confirm action handlers
  const confirmRoleChange = async (newRole: string) => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await updateUserRole(selectedUser._id, newRole);
      // Update user in the list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === selectedUser._id 
            ? { ...user, role: newRole } 
            : user
        )
      );
      setSnackbar({
        open: true,
        message: `User role updated to ${newRole}`,
        severity: 'success'
      });
      setRoleModalOpen(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update user role',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmRestrictUser = async () => {
    if (!selectedUser) return;
    
    // Allow transitioning between active, restricted, and deleted states
    const newStatus = modalAction === 'restrict' ? 'restricted' : 'active';
    
    setActionLoading(true);
    try {
      await updateUserStatus(selectedUser._id, newStatus);
      // Update user in the list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === selectedUser._id 
            ? { ...user, status: newStatus } 
            : user
        )
      );
      setSnackbar({
        open: true,
        message: modalAction === 'restrict' 
          ? 'User has been restricted' 
          : selectedUser.status === 'deleted'
          ? 'User account has been restored'
          : 'User access has been restored',
        severity: 'success'
      });
      setRestrictModalOpen(false);
    } catch (error) {
      console.error('Error updating user status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update user status',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await deleteUser(selectedUser._id);
      // Update user in the list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === selectedUser._id 
            ? { ...user, status: 'deleted' } 
            : user
        )
      );
      setSnackbar({
        open: true,
        message: 'User has been deleted',
        severity: 'success'
      });
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete user',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmAddToSubscribers = async (sector: string, location: unknown[]) => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await addUserToSubscribers(selectedUser._id, sector, location);
      // Update user in the list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === selectedUser._id 
            ? { 
                ...user, 
                weeklyForecastSubscribed: true,
                weeklyForecastSubscribedAt: new Date().toISOString()
              } 
            : user
        )
      );
      setSnackbar({
        open: true,
        message: 'User added to weekly forecast subscribers',
        severity: 'success'
      });
      setAddToSubscribersModalOpen(false);
    } catch (error) {
      console.error('Error adding user to subscribers:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add user to subscribers',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View, filter, and manage all users
        </Typography>
      </Box>

      {/* User filter controls */}
      <UserFiltersComponent
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Switch between mobile card view and desktop table view */}
            {isMobile ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                {users.map(user => (
                  <UserCard
                    key={user._id}
                    user={user}
                    onViewProfile={handleViewProfile}
                    onViewActivity={handleViewActivity}
                    onChangeRole={canManageUsers ? handleChangeRole : () => {}}
                    onRestrictUser={canManageUsers ? handleRestrictUser : () => {}}
                    onDeleteUser={canManageUsers ? handleDeleteUser : () => {}}
                    onAddToSubscribers={canManageUsers ? handleAddToSubscribers : () => {}}
                  />
                ))}
                {users.length === 0 && (
                  <Box sx={{ gridColumn: '1 / -1', p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No users found
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <UserTable
                users={users}
                onViewProfile={handleViewProfile}
                onViewActivity={handleViewActivity}
                onChangeRole={canManageUsers ? handleChangeRole : () => {}}
                onRestrictUser={canManageUsers ? handleRestrictUser : () => {}}
                onDeleteUser={canManageUsers ? handleDeleteUser : () => {}}
                onAddToSubscribers={canManageUsers ? handleAddToSubscribers : () => {}}
              />
            )}
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 20, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Modal components */}
      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={selectedUser}
      />

      <ChangeRoleModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        user={selectedUser}
        onConfirm={confirmRoleChange}
        loading={actionLoading}
      />

      <RestrictUserModal
        open={restrictModalOpen}
        onClose={() => setRestrictModalOpen(false)}
        user={selectedUser}
        onConfirm={confirmRestrictUser}
        loading={actionLoading}
        action={modalAction}
      />

      <DeleteUserModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        user={selectedUser}
        onConfirm={confirmDeleteUser}
        loading={actionLoading}
      />
      
      <UserActivityModal
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        user={selectedUser}
      />

      <AddToSubscribersModal
        open={addToSubscribersModalOpen}
        onClose={() => setAddToSubscribersModalOpen(false)}
        user={selectedUser}
        onConfirm={confirmAddToSubscribers}
        loading={actionLoading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
} 