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
  Select,
  MenuItem,
  Collapse,
  IconButton,
} from '@mui/material';
import {  FilterList as FilterIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, Clear as ClearIcon } from '@mui/icons-material';
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
  const [sortFilter, setSortFilter] = useState<string>('createdAt:desc');
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(!isMobile);

  // Sort options
  const sortOptions = [
    { value: 'createdAt:desc', label: 'Most Recent' },
    { value: 'createdAt:asc', label: 'Oldest First' },
    { value: 'firstName:asc', label: 'Alphabetical (A-Z)' },
    { value: 'firstName:desc', label: 'Alphabetical (Z-A)' },
    { value: 'lastLogin:desc', label: 'Last Login' }
  ];

  // Business type options
  const businessTypeOptions = [
    "Airline",
  "Attraction",
  "Car Rental",
  "Cruise Line",
  "DMO",
  "Event Manager",
  "Hotel",
  "OTA",
  "Tour Guide",
  "Tour Operator",
  "Travel Agency",
  "Travel Media",
  "Other"
  ];

  // Location options
  const locationOptions = [
    "Edinburgh", "Glasgow", "Stirling", "Manchester", "London"
  ];

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
        sortBy: sortFilter.split(':')[0],
        sortOrder: sortFilter.split(':')[1] as 'asc' | 'desc' || 'desc',
      };
      if (signupStartDate && signupEndDate) {
        params.startDate = signupStartDate.toISOString();
        params.endDate = signupEndDate.toISOString();
      }
      if (lastLoginStartDate && lastLoginEndDate) {
        params.lastLoginStart = lastLoginStartDate.toISOString();
        params.lastLoginEnd = lastLoginEndDate.toISOString();
      }
      if (location) params.location = location;
      if (businessType) params.businessType = businessType;
      
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
  }, [page, rowsPerPage, sortFilter, signupStartDate, signupEndDate, lastLoginStartDate, lastLoginEndDate, location, businessType]);

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

  // Filter change handlers
  const handleFilterChange = (key: string, value: unknown) => {
    setPage(0);
    switch (key) {
      case 'signupStartDate': setSignupStartDate(value as Date | null); break;
      case 'signupEndDate': setSignupEndDate(value as Date | null); break;
      case 'lastLoginStartDate': setLastLoginStartDate(value as Date | null); break;
      case 'lastLoginEndDate': setLastLoginEndDate(value as Date | null); break;
      case 'location': setLocation(value as string); break;
      case 'businessType': setBusinessType(value as string); break;
      case 'sort': setSortFilter(value as string); break;
      default: break;
    }
  };

  const handleClearFilters = () => {
    setSignupStartDate(null);
    setSignupEndDate(null);
    setLastLoginStartDate(null);
    setLastLoginEndDate(null);
    setLocation('');
    setBusinessType('');
    setSortFilter(sortOptions[0].value);
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
        {/* Collapsible Filter Bar */}
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
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180, md: 280 }, borderRadius: 3 }}>
                    <Select
                      value={sortFilter}
                      displayEmpty
                      onChange={e => handleFilterChange('sort', e.target.value)}
                      sx={{ borderRadius: 3 }}
                    >
                      {sortOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {/* Location */}
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160, md: 280 }, borderRadius: 3 }}>
                    <Select
                      value={location}
                      displayEmpty
                      onChange={e => handleFilterChange('location', e.target.value)}
                      renderValue={selected => selected || 'Location'}
                      sx={{ borderRadius: 3 }}
                      MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                    >
                      <MenuItem value=""><em>All Locations</em></MenuItem>
                      {locationOptions.map(loc => (
                        <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {/* Business Type */}
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160, md: 280 }, borderRadius: 3 }}>
                    <Select
                      value={businessType}
                      displayEmpty
                      onChange={e => handleFilterChange('businessType', e.target.value)}
                      renderValue={selected => selected || 'Business Type'}
                      sx={{ borderRadius: 3 }}
                      MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                    >
                      <MenuItem value=""><em>All Types</em></MenuItem>
                      {businessTypeOptions.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {/* Clear Filters Button */}
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                    sx={{ 
                      minWidth: { xs: '100%', sm: 120 }, 
                      borderRadius: 3,
                      height: { xs: 40, sm: 32, md: 37 }
                    }}
                  >
                    Clear
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