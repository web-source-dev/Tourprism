'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Container,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { getFollowedAlerts } from '@/services/action-hub';
import { Alert } from '@/types';
import { format } from 'date-fns';
import FilterModal, { FilterOptions } from './FilterModal';
import { useAuth } from '@/context/AuthContext';

const ActionHubList: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: '',
    team: '',
    impactLevel: '',
    dateRangeType: '',
    dateRange: {
      startDate: null,
      endDate: null,
    },
  });
  const [isFiltered, setIsFiltered] = useState<boolean>(false);

  const router = useRouter();

  // Get auth context for role-based permissions
  const {
    isAuthenticated,
    isAdmin,
    isManager,
    isEditor,
    isCollaboratorManager,
    isCollaboratorViewer,
  } = useAuth();

  // Permission check functions
  const canManageAlerts = () => {
    return isAdmin || isManager || isEditor || isCollaboratorManager || !isCollaboratorViewer || isAuthenticated;
  };

  const canUseFilters = () => {
    // Anyone (even unauthenticated users) can use filters
    return true;
  };

  const canViewAlertDetails = () => {
    // Anyone authenticated can view alert details
    return isAuthenticated;
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await getFollowedAlerts();
        console.log('followed alerts data ', data);
        setAlerts(data);
        setFilteredAlerts(data);
        setError(null);
      } catch (err) {
        setError('Failed to load followed alerts. Please try again later.');
        console.error('Error loading followed alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleAlertClick = (alertId: string) => {
    router.push(`/action-hub/alert/${alertId}`);
  };

  // Get relative time according to standardized format
  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return '';

    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMs = now.getTime() - alertTime.getTime();

    // Calculate time differences in various units
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Format based on time difference:
    // < 60s: show seconds
    // < 60m: show minutes
    // < 24h: show hours
    // < 30d: show days
    // >= 30d: show date as DD MMM

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 30) {
      return `${diffInDays}d`;
    } else {
      // Format as DD MMM
      return format(alertTime, 'd MMM');
    }
  };

  const handleOpenFilter = () => {
    setFilterOpen(true);
  };

  const handleCloseFilter = () => {
    setFilterOpen(false);
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setFilterOptions(filters);

    // Check if any filter is active
    const hasActiveFilter =
      filters.status !== '' ||
      filters.team !== '' ||
      filters.impactLevel !== '' ||
      filters.dateRangeType !== '';

    setIsFiltered(hasActiveFilter);

    // Apply filters to the alerts
    let filtered = [...alerts];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(alert => alert.status === filters.status);
    }

    // Filter by impact level
    if (filters.impactLevel) {
      const impactMap: { [key: string]: string } = {
        'low': 'Minor',
        'moderate': 'Moderate',
        'high': 'Severe'
      };

      filtered = filtered.filter(alert =>
        alert.impact?.toLowerCase() === impactMap[filters.impactLevel]?.toLowerCase()
      );
    }

    // Filter by date range based on dateRangeType
    if (filters.dateRangeType === 'this_week' ||
      (filters.dateRangeType === 'custom' && (filters.dateRange.startDate || filters.dateRange.endDate))) {

      if (filters.dateRange.startDate) {
        const startDate = new Date(filters.dateRange.startDate);
        filtered = filtered.filter(alert =>
          new Date(alert.expectedStart || alert.createdAt) >= startDate
        );
      }

      if (filters.dateRange.endDate) {
        const endDate = new Date(filters.dateRange.endDate);
        filtered = filtered.filter(alert =>
          new Date(alert.expectedEnd || alert.createdAt) <= endDate
        );
      }
    }

    setFilteredAlerts(filtered);
  };

  const handleClearFilters = () => {
    setFilterOptions({
      status: '',
      team: '',
      impactLevel: '',
      dateRangeType: '',
      dateRange: {
        startDate: null,
        endDate: null,
      },
    });
    setFilteredAlerts(alerts);
    setIsFiltered(false);
  };

  const getStatusBadge = (status: string | undefined) => {
    let label = 'New';
    let color = '#2196f3'; // Blue for New

    if (status === 'in_progress') {
      label = 'In Progress';
      color = '#ff9800'; // Orange
    } else if (status === 'handled') {
      label = 'Resolved';
      color = '#4caf50'; // Green
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: color,
            mr: 1
          }}
        />
        <Typography variant="body2" component="span">
          {label}
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <>
    <Container maxWidth="xl" style={{ padding: 0 }}>
      <Box sx={{ py: 2, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" component="h1">
            Action Hub
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the Alerts you&apos;re following
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title={canUseFilters() ? "Filter alerts" : "You don't have permission to filter alerts"}>
            <span>
              <IconButton
                onClick={handleOpenFilter}
                disabled={!canUseFilters()}
                sx={{
                  borderColor: isFiltered ? 'black' : '#e0e0e0',
                  color: 'black',
                  '&:hover': { borderColor: 'black', bgcolor: '#f5f5f5' },
                  textTransform: 'none',
                  '&.Mui-disabled': {
                    color: 'rgba(0, 0, 0, 0.26)'
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M4.6366 1.6875C4.6496 1.6875 4.66264 1.6875 4.67573 1.6875L13.3634 1.6875C13.9413 1.68747 14.4319 1.68745 14.819 1.74023C15.2287 1.79609 15.6205 1.92219 15.9204 2.25232C16.2229 2.58535 16.3057 2.9867 16.3121 3.39696C16.318 3.7801 16.2568 4.25604 16.1853 4.81096L16.1801 4.85137C16.1549 5.04774 16.117 5.23767 16.038 5.42783C15.9578 5.6209 15.8474 5.78533 15.7098 5.94874C14.975 6.82165 13.6091 8.39917 11.6861 9.83579C11.655 9.85903 11.6157 9.91411 11.6082 9.99675C11.4214 12.0614 11.257 13.1538 11.1385 13.7867C11.0102 14.4711 10.4882 14.9448 10.0381 15.2709C9.80257 15.4416 9.55255 15.5953 9.32986 15.7308C9.312 15.7417 9.29437 15.7524 9.27695 15.763C9.06893 15.8895 8.89208 15.997 8.74425 16.1015C8.33887 16.3882 7.87119 16.3681 7.5137 16.1598C7.17635 15.9633 6.93897 15.6049 6.89097 15.1995C6.78563 14.3097 6.59464 12.5677 6.38382 9.99194C6.37706 9.90932 6.36415 9.88534 6.36307 9.88334C6.36234 9.88196 6.36044 9.87846 6.35414 9.87154C6.3471 9.8638 6.33302 9.85009 6.30626 9.83008C4.38714 8.39526 3.02387 6.8205 2.29013 5.94871C2.1531 5.7859 2.03941 5.62538 1.95834 5.43017C1.87898 5.23906 1.84514 5.04817 1.81983 4.85137C1.81809 4.83785 1.81636 4.82438 1.81463 4.81095C1.74322 4.25604 1.68197 3.7801 1.6879 3.39695C1.69425 2.9867 1.77706 2.58535 2.0796 2.25232C2.37951 1.92219 2.77127 1.79609 3.18098 1.74023C3.56806 1.68745 4.05868 1.68747 4.6366 1.6875ZM3.33296 2.85491C3.04488 2.89419 2.9581 2.95837 2.9123 3.00878C2.86913 3.05631 2.81701 3.13999 2.81276 3.41437C2.80824 3.70659 2.85759 4.10109 2.93564 4.70784C2.95732 4.87645 2.97632 4.94815 2.99732 4.99872C3.01661 5.04518 3.0508 5.10541 3.15085 5.22429C3.86957 6.07823 5.16635 7.57317 6.9799 8.92906C7.12561 9.038 7.25928 9.17285 7.356 9.35445C7.45128 9.53337 7.49028 9.71952 7.50507 9.90017C7.71474 12.4619 7.90435 14.1903 8.00817 15.0672C8.01133 15.094 8.02107 15.1203 8.03606 15.1433C8.05138 15.1668 8.06841 15.181 8.08 15.1877C8.08148 15.1886 8.08277 15.1893 8.08389 15.1898C8.08656 15.1884 8.09016 15.1862 8.09474 15.183C8.27632 15.0546 8.48708 14.9265 8.686 14.8057C8.7058 14.7936 8.72549 14.7817 8.74502 14.7698C8.96912 14.6334 9.18345 14.5009 9.37801 14.3599C9.78812 14.0628 9.98927 13.8113 10.0327 13.5796C10.1426 12.9932 10.3029 11.9386 10.4878 9.89536C10.5217 9.521 10.7055 9.1641 11.0128 8.93453C12.83 7.5769 14.1294 6.07928 14.8491 5.22427C14.9364 5.12058 14.9752 5.05373 14.9991 4.9962C15.0242 4.93577 15.0453 4.8558 15.0643 4.70784C15.1424 4.10109 15.1917 3.70659 15.1872 3.41437C15.183 3.13999 15.1308 3.05631 15.0877 3.00878C15.0419 2.95837 14.9551 2.89419 14.667 2.85491C14.365 2.81374 13.952 2.8125 13.3242 2.8125H4.67573C4.04795 2.8125 3.63495 2.81374 3.33296 2.85491ZM8.07799 15.1925C8.07802 15.1924 8.07839 15.1923 8.07908 15.1921L8.07799 15.1925Z" fill="currentColor" />
                </svg>
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', bgcolor: '#FAFAFB', border: "1px solid #E5E5E6", p: '16px', borderRadius: '8px' }}>
        <Box sx={{ display: 'flex', flexDirection: "column", gap: '8px' }}>
          <Typography variant="h6" fontWeight="bold" component="h1"sx={{fontSize:"16px",textAlign:{xs:'center', md:'left'}}}>
            Welcome to your Action Hub
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{fontSize:"13px",textAlign:{xs:'center', md:'left'}}}>
            Manage, forward, or resolve your followed alerts here
          </Typography>
        </Box>
        <Box onClick={() => router.push('/action-hub/create-alert')} sx={{ cursor: 'pointer', display: { xs: 'none', md: 'block' } }} >
          <svg width="151" height="40" viewBox="0 0 151 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="151" height="40" rx="8" fill="black" />
            <path d="M25.072 15.228V25H23.112V20.842H18.926V25H16.966V15.228H18.926V19.246H23.112V15.228H25.072ZM30.1952 25.126C29.4485 25.126 28.7765 24.9627 28.1792 24.636C27.5818 24.3 27.1105 23.8287 26.7652 23.222C26.4292 22.6153 26.2612 21.9153 26.2612 21.122C26.2612 20.3287 26.4338 19.6287 26.7792 19.022C27.1338 18.4153 27.6145 17.9487 28.2212 17.622C28.8278 17.286 29.5045 17.118 30.2512 17.118C30.9978 17.118 31.6745 17.286 32.2812 17.622C32.8878 17.9487 33.3638 18.4153 33.7092 19.022C34.0638 19.6287 34.2412 20.3287 34.2412 21.122C34.2412 21.9153 34.0592 22.6153 33.6952 23.222C33.3405 23.8287 32.8552 24.3 32.2392 24.636C31.6325 24.9627 30.9512 25.126 30.1952 25.126ZM30.1952 23.418C30.5498 23.418 30.8812 23.334 31.1892 23.166C31.5065 22.9887 31.7585 22.7273 31.9452 22.382C32.1318 22.0367 32.2252 21.6167 32.2252 21.122C32.2252 20.3847 32.0292 19.82 31.6372 19.428C31.2545 19.0267 30.7832 18.826 30.2232 18.826C29.6632 18.826 29.1918 19.0267 28.8092 19.428C28.4358 19.82 28.2492 20.3847 28.2492 21.122C28.2492 21.8593 28.4312 22.4287 28.7952 22.83C29.1685 23.222 29.6352 23.418 30.1952 23.418ZM46.1809 17.244L43.9129 25H41.7989L40.3849 19.582L38.9709 25H36.8429L34.5609 17.244H36.5489L37.9209 23.152L39.4049 17.244H41.4769L42.9329 23.138L44.3049 17.244H46.1809ZM51.0713 16.32C50.726 16.32 50.4367 16.2127 50.2033 15.998C49.9793 15.774 49.8673 15.4987 49.8673 15.172C49.8673 14.8453 49.9793 14.5747 50.2033 14.36C50.4367 14.136 50.726 14.024 51.0713 14.024C51.4167 14.024 51.7013 14.136 51.9253 14.36C52.1587 14.5747 52.2753 14.8453 52.2753 15.172C52.2753 15.4987 52.1587 15.774 51.9253 15.998C51.7013 16.2127 51.4167 16.32 51.0713 16.32ZM52.0373 17.244V25H50.0773V17.244H52.0373ZM56.0058 18.854V22.606C56.0058 22.8673 56.0665 23.0587 56.1878 23.18C56.3185 23.292 56.5331 23.348 56.8318 23.348H57.7418V25H56.5098C54.8578 25 54.0318 24.1973 54.0318 22.592V18.854H53.1078V17.244H54.0318V15.326H56.0058V17.244H57.7418V18.854H56.0058ZM75.0495 15.228L72.3195 25H70.0095L68.1755 18.042L66.2575 25L63.9615 25.014L61.3295 15.228H63.4295L65.1515 22.816L67.1395 15.228H69.3235L71.1995 22.774L72.9355 15.228H75.0495ZM79.5233 25.126C78.7766 25.126 78.1046 24.9627 77.5073 24.636C76.9099 24.3 76.4386 23.8287 76.0933 23.222C75.7573 22.6153 75.5893 21.9153 75.5893 21.122C75.5893 20.3287 75.7619 19.6287 76.1073 19.022C76.4619 18.4153 76.9426 17.9487 77.5493 17.622C78.1559 17.286 78.8326 17.118 79.5793 17.118C80.3259 17.118 81.0026 17.286 81.6093 17.622C82.2159 17.9487 82.6919 18.4153 83.0373 19.022C83.3919 19.6287 83.5693 20.3287 83.5693 21.122C83.5693 21.9153 83.3873 22.6153 83.0233 23.222C82.6686 23.8287 82.1833 24.3 81.5673 24.636C80.9606 24.9627 80.2793 25.126 79.5233 25.126ZM79.5233 23.418C79.8779 23.418 80.2093 23.334 80.5173 23.166C80.8346 22.9887 81.0866 22.7273 81.2733 22.382C81.4599 22.0367 81.5533 21.6167 81.5533 21.122C81.5533 20.3847 81.3573 19.82 80.9653 19.428C80.5826 19.0267 80.1113 18.826 79.5513 18.826C78.9913 18.826 78.5199 19.0267 78.1373 19.428C77.7639 19.82 77.5773 20.3847 77.5773 21.122C77.5773 21.8593 77.7593 22.4287 78.1233 22.83C78.4966 23.222 78.9633 23.418 79.5233 23.418ZM86.717 18.448C86.969 18.0373 87.2957 17.7153 87.697 17.482C88.1077 17.2487 88.5743 17.132 89.097 17.132V19.19H88.579C87.963 19.19 87.4963 19.3347 87.179 19.624C86.871 19.9133 86.717 20.4173 86.717 21.136V25H84.757V17.244H86.717V18.448ZM94.7592 25L92.1272 21.696V25H90.1672V14.64H92.1272V20.534L94.7312 17.244H97.2792L93.8632 21.136L97.3072 25H94.7592ZM101.061 25.126C100.426 25.126 99.857 25.014 99.353 24.79C98.849 24.5567 98.4476 24.244 98.149 23.852C97.8596 23.46 97.701 23.026 97.673 22.55H99.647C99.6843 22.8487 99.829 23.096 100.081 23.292C100.342 23.488 100.664 23.586 101.047 23.586C101.42 23.586 101.71 23.5113 101.915 23.362C102.13 23.2127 102.237 23.0213 102.237 22.788C102.237 22.536 102.106 22.3493 101.845 22.228C101.593 22.0973 101.187 21.9573 100.627 21.808C100.048 21.668 99.5723 21.5233 99.199 21.374C98.835 21.2247 98.5176 20.996 98.247 20.688C97.9856 20.38 97.855 19.9647 97.855 19.442C97.855 19.0127 97.9763 18.6207 98.219 18.266C98.471 17.9113 98.8256 17.6313 99.283 17.426C99.7496 17.2207 100.296 17.118 100.921 17.118C101.845 17.118 102.582 17.3513 103.133 17.818C103.684 18.2753 103.987 18.896 104.043 19.68H102.167C102.139 19.372 102.008 19.1293 101.775 18.952C101.551 18.7653 101.248 18.672 100.865 18.672C100.51 18.672 100.235 18.7373 100.039 18.868C99.8523 18.9987 99.759 19.1807 99.759 19.414C99.759 19.6753 99.8896 19.876 100.151 20.016C100.412 20.1467 100.818 20.282 101.369 20.422C101.929 20.562 102.391 20.7067 102.755 20.856C103.119 21.0053 103.432 21.2387 103.693 21.556C103.964 21.864 104.104 22.2747 104.113 22.788C104.113 23.236 103.987 23.6373 103.735 23.992C103.492 24.3467 103.138 24.6267 102.671 24.832C102.214 25.028 101.677 25.126 101.061 25.126Z" fill="white" />
            <path d="M132.291 19.9996C132.291 19.6883 132.153 19.3995 132.023 19.1826C131.882 18.9486 131.692 18.707 131.484 18.4714C131.066 17.9989 130.521 17.4914 129.993 17.0323C129.461 16.5706 128.931 16.1454 128.535 15.8364C128.337 15.6817 128.172 15.5555 128.055 15.4677C127.997 15.4238 127.952 15.3895 127.92 15.366L127.884 15.339L127.874 15.3319L127.871 15.3294C127.593 15.1247 127.201 15.1838 126.997 15.4617C126.792 15.7396 126.851 16.1309 127.129 16.3356L127.14 16.3434L127.173 16.3682C127.203 16.3902 127.246 16.4229 127.302 16.4651C127.414 16.5495 127.574 16.6716 127.766 16.8218C128.152 17.1226 128.663 17.5333 129.173 17.9761C129.686 18.4216 130.183 18.8873 130.547 19.299C130.57 19.3251 130.592 19.3507 130.614 19.3758L118.333 19.3758C117.988 19.3758 117.708 19.6556 117.708 20.0008C117.708 20.346 117.988 20.6258 118.333 20.6258L130.612 20.6258C130.591 20.6502 130.569 20.6749 130.547 20.7001C130.183 21.1118 129.686 21.5775 129.173 22.023C128.663 22.4658 128.152 22.8766 127.766 23.1774C127.574 23.3275 127.414 23.4497 127.302 23.5341C127.246 23.5762 127.203 23.6089 127.173 23.6309L127.14 23.6557L127.129 23.6636C126.851 23.8683 126.792 24.2595 126.997 24.5374C127.201 24.8154 127.593 24.8744 127.871 24.6697L127.874 24.6673L127.884 24.6601L127.92 24.6331C127.952 24.6096 127.997 24.5753 128.055 24.5314C128.172 24.4437 128.337 24.3175 128.535 24.1627C128.931 23.8538 129.461 23.4286 129.993 22.9668C130.521 22.5078 131.066 22.0003 131.484 21.5277C131.692 21.2922 131.882 21.0506 132.023 20.8165C132.153 20.601 132.29 20.3143 132.291 20.0052" fill="white" />
          </svg>
        </Box>
        <Box onClick={() => router.push('/action-hub/create-alert')} sx={{ mt:2,cursor: 'pointer', display: { xs: 'block', md: 'none' } }} >
          <svg width="311" height="40" viewBox="0 0 311 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="311" height="40" rx="8" fill="black" />
            <path d="M105.072 15.228V25H103.112V20.842H98.926V25H96.966V15.228H98.926V19.246H103.112V15.228H105.072ZM110.195 25.126C109.448 25.126 108.776 24.9627 108.179 24.636C107.582 24.3 107.11 23.8287 106.765 23.222C106.429 22.6153 106.261 21.9153 106.261 21.122C106.261 20.3287 106.434 19.6287 106.779 19.022C107.134 18.4153 107.614 17.9487 108.221 17.622C108.828 17.286 109.504 17.118 110.251 17.118C110.998 17.118 111.674 17.286 112.281 17.622C112.888 17.9487 113.364 18.4153 113.709 19.022C114.064 19.6287 114.241 20.3287 114.241 21.122C114.241 21.9153 114.059 22.6153 113.695 23.222C113.34 23.8287 112.855 24.3 112.239 24.636C111.632 24.9627 110.951 25.126 110.195 25.126ZM110.195 23.418C110.55 23.418 110.881 23.334 111.189 23.166C111.506 22.9887 111.758 22.7273 111.945 22.382C112.132 22.0367 112.225 21.6167 112.225 21.122C112.225 20.3847 112.029 19.82 111.637 19.428C111.254 19.0267 110.783 18.826 110.223 18.826C109.663 18.826 109.192 19.0267 108.809 19.428C108.436 19.82 108.249 20.3847 108.249 21.122C108.249 21.8593 108.431 22.4287 108.795 22.83C109.168 23.222 109.635 23.418 110.195 23.418ZM126.181 17.244L123.913 25H121.799L120.385 19.582L118.971 25H116.843L114.561 17.244H116.549L117.921 23.152L119.405 17.244H121.477L122.933 23.138L124.305 17.244H126.181ZM131.071 16.32C130.726 16.32 130.437 16.2127 130.203 15.998C129.979 15.774 129.867 15.4987 129.867 15.172C129.867 14.8453 129.979 14.5747 130.203 14.36C130.437 14.136 130.726 14.024 131.071 14.024C131.417 14.024 131.701 14.136 131.925 14.36C132.159 14.5747 132.275 14.8453 132.275 15.172C132.275 15.4987 132.159 15.774 131.925 15.998C131.701 16.2127 131.417 16.32 131.071 16.32ZM132.037 17.244V25H130.077V17.244H132.037ZM136.006 18.854V22.606C136.006 22.8673 136.066 23.0587 136.188 23.18C136.318 23.292 136.533 23.348 136.832 23.348H137.742V25H136.51C134.858 25 134.032 24.1973 134.032 22.592V18.854H133.108V17.244H134.032V15.326H136.006V17.244H137.742V18.854H136.006ZM155.049 15.228L152.319 25H150.009L148.175 18.042L146.257 25L143.961 25.014L141.329 15.228H143.429L145.151 22.816L147.139 15.228H149.323L151.199 22.774L152.935 15.228H155.049ZM159.523 25.126C158.777 25.126 158.105 24.9627 157.507 24.636C156.91 24.3 156.439 23.8287 156.093 23.222C155.757 22.6153 155.589 21.9153 155.589 21.122C155.589 20.3287 155.762 19.6287 156.107 19.022C156.462 18.4153 156.943 17.9487 157.549 17.622C158.156 17.286 158.833 17.118 159.579 17.118C160.326 17.118 161.003 17.286 161.609 17.622C162.216 17.9487 162.692 18.4153 163.037 19.022C163.392 19.6287 163.569 20.3287 163.569 21.122C163.569 21.9153 163.387 22.6153 163.023 23.222C162.669 23.8287 162.183 24.3 161.567 24.636C160.961 24.9627 160.279 25.126 159.523 25.126ZM159.523 23.418C159.878 23.418 160.209 23.334 160.517 23.166C160.835 22.9887 161.087 22.7273 161.273 22.382C161.46 22.0367 161.553 21.6167 161.553 21.122C161.553 20.3847 161.357 19.82 160.965 19.428C160.583 19.0267 160.111 18.826 159.551 18.826C158.991 18.826 158.52 19.0267 158.137 19.428C157.764 19.82 157.577 20.3847 157.577 21.122C157.577 21.8593 157.759 22.4287 158.123 22.83C158.497 23.222 158.963 23.418 159.523 23.418ZM166.717 18.448C166.969 18.0373 167.296 17.7153 167.697 17.482C168.108 17.2487 168.574 17.132 169.097 17.132V19.19H168.579C167.963 19.19 167.496 19.3347 167.179 19.624C166.871 19.9133 166.717 20.4173 166.717 21.136V25H164.757V17.244H166.717V18.448ZM174.759 25L172.127 21.696V25H170.167V14.64H172.127V20.534L174.731 17.244H177.279L173.863 21.136L177.307 25H174.759ZM181.061 25.126C180.426 25.126 179.857 25.014 179.353 24.79C178.849 24.5567 178.448 24.244 178.149 23.852C177.86 23.46 177.701 23.026 177.673 22.55H179.647C179.684 22.8487 179.829 23.096 180.081 23.292C180.342 23.488 180.664 23.586 181.047 23.586C181.42 23.586 181.71 23.5113 181.915 23.362C182.13 23.2127 182.237 23.0213 182.237 22.788C182.237 22.536 182.106 22.3493 181.845 22.228C181.593 22.0973 181.187 21.9573 180.627 21.808C180.048 21.668 179.572 21.5233 179.199 21.374C178.835 21.2247 178.518 20.996 178.247 20.688C177.986 20.38 177.855 19.9647 177.855 19.442C177.855 19.0127 177.976 18.6207 178.219 18.266C178.471 17.9113 178.826 17.6313 179.283 17.426C179.75 17.2207 180.296 17.118 180.921 17.118C181.845 17.118 182.582 17.3513 183.133 17.818C183.684 18.2753 183.987 18.896 184.043 19.68H182.167C182.139 19.372 182.008 19.1293 181.775 18.952C181.551 18.7653 181.248 18.672 180.865 18.672C180.51 18.672 180.235 18.7373 180.039 18.868C179.852 18.9987 179.759 19.1807 179.759 19.414C179.759 19.6753 179.89 19.876 180.151 20.016C180.412 20.1467 180.818 20.282 181.369 20.422C181.929 20.562 182.391 20.7067 182.755 20.856C183.119 21.0053 183.432 21.2387 183.693 21.556C183.964 21.864 184.104 22.2747 184.113 22.788C184.113 23.236 183.987 23.6373 183.735 23.992C183.492 24.3467 183.138 24.6267 182.671 24.832C182.214 25.028 181.677 25.126 181.061 25.126Z" fill="white" />
            <path d="M212.291 19.9996C212.291 19.6883 212.153 19.3995 212.023 19.1826C211.882 18.9486 211.692 18.707 211.484 18.4714C211.066 17.9989 210.521 17.4914 209.993 17.0323C209.461 16.5706 208.931 16.1454 208.535 15.8364C208.337 15.6817 208.172 15.5555 208.055 15.4677C207.997 15.4238 207.952 15.3895 207.92 15.366L207.884 15.339L207.874 15.3319L207.871 15.3294C207.593 15.1247 207.201 15.1838 206.997 15.4617C206.792 15.7396 206.851 16.1309 207.129 16.3356L207.14 16.3434L207.173 16.3682C207.203 16.3902 207.246 16.4229 207.302 16.4651C207.414 16.5495 207.574 16.6716 207.766 16.8218C208.152 17.1226 208.663 17.5333 209.173 17.9761C209.686 18.4216 210.183 18.8873 210.547 19.299C210.57 19.3251 210.592 19.3507 210.614 19.3758L198.333 19.3758C197.988 19.3758 197.708 19.6556 197.708 20.0008C197.708 20.346 197.988 20.6258 198.333 20.6258L210.612 20.6258C210.591 20.6502 210.569 20.6749 210.547 20.7001C210.183 21.1118 209.686 21.5775 209.173 22.023C208.663 22.4658 208.152 22.8766 207.766 23.1774C207.574 23.3275 207.414 23.4497 207.302 23.5341C207.246 23.5762 207.203 23.6089 207.173 23.6309L207.14 23.6557L207.129 23.6636C206.851 23.8683 206.792 24.2595 206.997 24.5374C207.201 24.8154 207.593 24.8744 207.871 24.6697L207.874 24.6673L207.884 24.6601L207.92 24.6331C207.952 24.6096 207.997 24.5753 208.055 24.5314C208.172 24.4437 208.337 24.3175 208.535 24.1627C208.931 23.8538 209.461 23.4286 209.993 22.9668C210.521 22.5078 211.066 22.0003 211.484 21.5277C211.692 21.2922 211.882 21.0506 212.023 20.8165C212.153 20.601 212.29 20.3143 212.291 20.0052" fill="white" />
          </svg>

        </Box>

      </Box>


      <Box sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {filteredAlerts.length === 0 ? (
            <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No alerts match your filter criteria
              </Typography>
              {isFiltered && (
                <Button
                  variant="text"
                  onClick={handleClearFilters}
                  disabled={!canUseFilters()}
                  sx={{ mt: 2, color: 'black' }}
                >
                  Clear filters
                </Button>
              )}
            </Box>
          ) : (
            filteredAlerts.map((alert) => (
              <Box
                key={alert._id}
                sx={{
                  width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' },
                  mb: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  boxShadow: 'none'
                }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: 'none',
                    display: 'flex',
                    backgroundColor: 'transparent',
                    flexDirection: 'column'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 2, pb: 1 }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #e0e0e0',
                      borderRadius: 30,
                      px: 1.5,
                      py: 0.5
                    }}>
                      {getStatusBadge(alert.status)}
                    </Box>
                    <Typography variant="body2" color="text.secondary" title="Time since alert was added to Action Hub">
                      {alert.actionHubCreatedAt
                        ? `${getTimeAgo(alert.actionHubCreatedAt)}`
                        : `${getTimeAgo(alert.createdAt)}`}
                    </Typography>
                  </Box>

                  <CardContent sx={{ pt: 1, pb: '16px !important', px: 2, flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {alert.title || 'Road Closures in 48h : Fringe Festival Protest'}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {alert.city || 'Princess Street, EH1'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {alert.description || 'High risk for road closures due to festival activities taking place in the centre of the town. Notify guests to take alternative routes and inform them to request early check-ins to avoid delays'}
                    </Typography>

                    <Box sx={{ mb: 1 }}>
                      <Typography component="div" sx={{ display: 'flex' }}>
                        <Typography variant="body2" component="span" sx={{ width: 90 }}>
                          Start
                        </Typography>
                        <Typography variant="body2" component="span">
                          {alert.expectedStart ?
                            format(new Date(alert.expectedStart), 'dd MMM h:mma') :
                            '06 May 9:00AM'}
                        </Typography>
                      </Typography>

                      <Typography component="div" sx={{ display: 'flex' }}>
                        <Typography variant="body2" component="span" sx={{ width: 90 }}>
                          End
                        </Typography>
                        <Typography variant="body2" component="span">
                          {alert.expectedEnd ?
                            format(new Date(alert.expectedEnd), 'dd MMM h:mma') :
                            '06 May 9:00AM'}
                        </Typography>
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2">
                        {alert.impact || 'Moderated'} Impact
                      </Typography>
                    </Box>

                    <Tooltip title={canManageAlerts() ? "Manage this alert" : "You don't have permission to manage alerts"}>
                      <span style={{ width: '100%' }}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleAlertClick(alert._id)}
                          disabled={!canViewAlertDetails()}
                          sx={{
                            bgcolor: '#e0e0e0',
                            color: 'black',
                            boxShadow: 'none',
                            '&:hover': {
                              bgcolor: '#e0e0e0',
                              boxShadow: 'none',
                            },
                            textTransform: 'none',
                            fontWeight: 'medium',
                            py: 1,
                            mt: 'auto',
                            '&.Mui-disabled': {
                              bgcolor: '#f5f5f5',
                              color: 'rgba(0, 0, 0, 0.26)'
                            }
                          }}
                        >
                          {canManageAlerts() ? 'Manage Alert' : 'View Alert'}
                        </Button>
                      </span>
                    </Tooltip>
                  </CardContent>
                </Card>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Container>

    <FilterModal
        open={filterOpen}
        onClose={handleCloseFilter}
        filterOptions={filterOptions}
        onApplyFilters={handleApplyFilters}
        readonly={!canUseFilters()}
      />
      </>
  );
};

export default ActionHubList; 