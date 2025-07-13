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
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Collapse,
  IconButton,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import {  FilterList as FilterIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AdminLayout from '@/components/AdminLayout';
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  addUserToSubscribers,
  UserFilters as UserFiltersType,
  getUserLogs
} from '@/services/api';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';

// Import custom components
import UserCard from '@/components/admin/users/UserCard';
import ProfileModal from '@/components/admin/users/modals/ProfileModal';
import ChangeRoleModal from '@/components/admin/users/modals/ChangeRoleModal';
import RestrictUserModal from '@/components/admin/users/modals/RestrictUserModal';
import DeleteUserModal from '@/components/admin/users/modals/DeleteUserModal';
import UserActivityModal from '@/components/admin/users/modals/UserActivityModal';
import AddToSubscribersModal from '@/components/admin/users/modals/AddToSubscribersModal';
import AddUserModal from '@/components/admin/users/modals/AddUserModal';

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
    severity: 'success' as 'success' | 'error' | 'info'
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin } = useAuth();

  // Filter states
  const [signupStartDate, setSignupStartDate] = useState<Date | null>(null);
  const [signupEndDate, setSignupEndDate] = useState<Date | null>(null);
  const [lastLoginStartDate, setLastLoginStartDate] = useState<Date | null>(null);
  const [lastLoginEndDate, setLastLoginEndDate] = useState<Date | null>(null);
  const [location, setLocation] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('');
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(!isMobile);

  // Modal states
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [restrictModalOpen, setRestrictModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [activityModalOpen, setActivityModalOpen] = useState<boolean>(false);
  const [addToSubscribersModalOpen, setAddToSubscribersModalOpen] = useState<boolean>(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<'restrict' | 'enable'>('restrict');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Permission check for changing user roles/status - only admin can do this
  const canManageUsers = isAdmin;

  // Update filters expanded state when screen size changes
  useEffect(() => {
    setFiltersExpanded(!isMobile);
  }, [isMobile]);

  const [userLogs, setUserLogs] = useState<Record<string, { action: string; timestamp: string; details?: string }[]>>({});

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

      // Fetch recent logs for each user (2 most recent)
      const logsResults = await Promise.all(
        fetchedUsers.map(async (user) => {
          try {
            const res = await getUserLogs(user._id, { limit: 2, sortBy: 'timestamp', sortOrder: 'desc' });
            // Accepts either { logs: Log[] } or just Log[]
            const logs = Array.isArray(res) ? res : (res as { logs: unknown[] }).logs || [];
            return [user._id, logs.map((log: { action: string; timestamp: string; details?: string }) => ({ action: log.action, timestamp: log.timestamp, details: log.details }))];
          } catch {
            return [user._id, []];
          }
        })
      );
      setUserLogs(Object.fromEntries(logsResults));
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

  const handleSortByChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as string;
    setSortBy(value);
    setPage(0);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    setPage(0);
  };

  const handleFilterChange = () => {
    const newFilters: UserFiltersType = {};
    
    if (signupStartDate) {
      newFilters.startDate = signupStartDate.toISOString().split('T')[0];
    }
    if (signupEndDate) {
      newFilters.endDate = signupEndDate.toISOString().split('T')[0];
    }
    if (location) {
      newFilters.company = location;
    }
    if (businessType) {
      newFilters.role = businessType;
    }
    
    setFilters(newFilters);
    setPage(0);
  };

  const handleResetFilters = () => {
    setSignupStartDate(null);
    setSignupEndDate(null);
    setLastLoginStartDate(null);
    setLastLoginEndDate(null);
    setLocation('');
    setBusinessType('');
    setFilters({});
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
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
    
    const newStatus = modalAction === 'restrict' ? 'restricted' : 'active';
    
    setActionLoading(true);
    try {
      await updateUserStatus(selectedUser._id, newStatus);
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

  const handleAddUser = async (userData: unknown) => {
    setActionLoading(true);
    try {
      // TODO: Implement API call to create user
      console.log('Creating user:', userData);
      
      // For now, just show success message
      setSnackbar({
        open: true,
        message: 'User creation functionality will be implemented soon',
        severity: 'info'
      });
      setAddUserModalOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create user',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {/* Filters Section */}
        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }} elevation={0}>
          {/* Filter Header */}
          <Box 
            sx={{ 
              p: 2, 
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: isMobile ? 'pointer' : 'default'
            }}
            onClick={isMobile ? toggleFilters : undefined}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Filters
              </Typography>
            </Box>
            {isMobile && (
              <IconButton size="small">
                {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>

          {/* Filter Content */}
          <Collapse in={filtersExpanded}>
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Quick Filters Row */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  {/* Sort By */}
                  <FormControl sx={{ minWidth: { xs: '100%', sm: '180px' } }} size="small">
                    <InputLabel>Sort by</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort by"
                      onChange={handleSortByChange}
                    >
                      <MenuItem value="createdAt">Signup Date</MenuItem>
                      <MenuItem value="lastLogin">Last Login</MenuItem>
                      <MenuItem value="firstName">Name</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Sort Order */}
                  <Button 
                    variant="outlined" 
                    onClick={handleSortOrderChange}
                    size="small"
                    sx={{ 
                      minWidth: '50px', 
                      px: 2,
                      height: '40px',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>

                  {/* Location */}
                  <TextField
                    sx={{ flex: 1, minWidth: { xs: '100%', sm: '200px' } }}
                    placeholder="Search by location..."
                    variant="outlined"
                    size="small"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />

                  {/* Business Type */}
                  <FormControl sx={{ minWidth: { xs: '100%', sm: '200px' } }} size="small">
                    <InputLabel>Business Type</InputLabel>
                    <Select
                      value={businessType}
                      label="Business Type"
                      onChange={(e) => setBusinessType(e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="Hotel">Hotel</MenuItem>
                      <MenuItem value="Tour Operator">Tour Operator</MenuItem>
                      <MenuItem value="Restaurant">Restaurant</MenuItem>
                      <MenuItem value="Transportation">Transportation</MenuItem>
                      <MenuItem value="Retail">Retail</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <Divider />

                {/* Date Range Filters */}
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Date Filters
                  </Typography>
                  
                  <Stack 
                    direction={{ xs: 'column', lg: 'row' }} 
                    spacing={2}
                    alignItems={{ xs: 'stretch', lg: 'center' }}
                  >
                    {/* Signup Date Range */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: { xs: 'stretch', sm: 'center' } }}>
                      <Typography variant="body2" sx={{ minWidth: '80px', fontWeight: 500 }}>Signup:</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flex: 1 }}>
                        <DatePicker
                          value={signupStartDate}
                          onChange={setSignupStartDate}
                          slotProps={{ 
                            textField: { 
                              size: 'small',
                              placeholder: "From date",
                              sx: { minWidth: '150px' }
                            } 
                          }}
                        />
                        <DatePicker
                          value={signupEndDate}
                          onChange={setSignupEndDate}
                          slotProps={{ 
                            textField: { 
                              size: 'small',
                              placeholder: "To date",
                              sx: { minWidth: '150px' }
                            } 
                          }}
                        />
                      </Stack>
                    </Box>

                    {/* Last Login Date Range */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: { xs: 'stretch', sm: 'center' } }}>
                      <Typography variant="body2" sx={{ minWidth: '80px', fontWeight: 500 }}>Login:</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flex: 1 }}>
                        <DatePicker
                          value={lastLoginStartDate}
                          onChange={setLastLoginStartDate}
                          slotProps={{ 
                            textField: { 
                              size: 'small',
                              placeholder: "From date",
                              sx: { minWidth: '150px' }
                            } 
                          }}
                        />
                        <DatePicker
                          value={lastLoginEndDate}
                          onChange={setLastLoginEndDate}
                          slotProps={{ 
                            textField: { 
                              size: 'small',
                              placeholder: "To date",
                              sx: { minWidth: '150px' }
                            } 
                          }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Stack>

                {/* Action Buttons */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2}
                  justifyContent="flex-end"
                  sx={{ pt: 1 }}
                >
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={handleResetFilters}
                    size="medium"
                    sx={{ minWidth: '100px' }}
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleFilterChange}
                    size="medium"
                    sx={{ minWidth: '100px' }}
                  >
                    Apply Filters
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Collapse>
        </Paper>

        {/* User Cards */}
        <Paper sx={{ p: 0, mb: 3, borderRadius: 2 }} elevation={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 3 }}>
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
                    activityLogs={userLogs[user._id] || []}
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
            
              <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
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

        <AddUserModal
          open={addUserModalOpen}
          onClose={() => setAddUserModalOpen(false)}
          onSubmit={handleAddUser}
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
      </LocalizationProvider>
    </AdminLayout>
  );
} 