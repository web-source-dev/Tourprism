'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress, 
  Card, 
  CardContent,
  CardHeader,
} from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { getDashboardStats } from '@/services/api';


// Define the type for dashboard stats
interface DashboardStats {
  totalUsers: number;
  totalAlerts: number;
  alertsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
  recentAlerts: {
    _id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    city: string;
  }[];
  totalSubscribers: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      
      // Ensure all required properties exist
      const sanitizedData: DashboardStats = {
        totalUsers: data?.totalUsers || 0,
        totalAlerts: data?.totalAlerts || 0,
        alertsByStatus: {
          pending: data?.alertsByStatus?.pending || 0,
          approved: data?.alertsByStatus?.approved || 0,
          rejected: data?.alertsByStatus?.rejected || 0,
        },
        recentAlerts: Array.isArray(data?.recentAlerts) ? data.recentAlerts : [],
        totalSubscribers: data?.totalSubscribers || 0,
        activeUsers: data?.activeUsers || 0
      };
      
      setStats(sanitizedData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
          <Typography variant="body1">Please try refreshing the page.</Typography>
        </Box>
      </AdminLayout>
    );
  }

  // Make sure stats is not null before proceeding
  if (!stats) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">No data available</Typography>
          <Typography variant="body1">Please try refreshing the page.</Typography>
        </Box>
      </AdminLayout>
    );
  }

  // Calculate percentages safely
  const totalAlerts = stats.totalAlerts || 1; // Prevent division by zero
  const pendingPercentage = (stats.alertsByStatus.pending / totalAlerts) * 100;
  const approvedPercentage = (stats.alertsByStatus.approved / totalAlerts) * 100;
  const rejectedPercentage = (stats.alertsByStatus.rejected / totalAlerts) * 100;

  // StatsCard component for code reuse
  const StatsCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: '#f8f9fa',
        border: '1px solid #e0e0e0',
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
        },
        flex: 1,
        minWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 16px)' },
        mb: { xs: 2, sm: 0 }
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>
        {value}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {title}
      </Typography>
    </Paper>
  );

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview and statistics
        </Typography>
      </Box>

      {/* Stats Cards Section */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3 
        }}
      >
        <StatsCard title="Total Users" value={stats.totalUsers} color="#1976d2" />
        <StatsCard title="Total Alerts" value={stats.totalAlerts} color="#ed6c02" />
        <StatsCard title="Pending Alerts" value={stats.alertsByStatus.pending} color="#f57f17" />
        <StatsCard title="Active Users" value={stats.activeUsers} color="#2e7d32" />
      </Box>

      {/* Main Content Section */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3
        }}
      >
        {/* Recent Alerts Card */}
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 2, 
            border: '1px solid #e0e0e0', 
            flex: { md: 2 },
            width: '100%'
          }}
        >
          <CardHeader 
            title="Recent Alerts" 
            titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
            sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
          />
          <CardContent sx={{ maxHeight: 400, overflow: 'auto', p: { xs: 2, md: 3 } }}>
            {stats.recentAlerts && stats.recentAlerts.length > 0 ? (
              stats.recentAlerts.map((alert, index) => (
                <Box 
                  key={alert._id} 
                  sx={{ 
                    mb: 2, 
                    pb: 2, 
                    borderBottom: index < stats.recentAlerts.length - 1 ? '1px solid #eee' : 'none',
                    borderRadius: 1,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: '#f9f9f9'
                    },
                    p: 1
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {alert.title || 'Untitled Alert'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {alert.city || 'Unknown Location'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {alert.description || 'No description available'}
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'inline-block', 
                      px: 1, 
                      py: 0.3, 
                      mt: 1, 
                      borderRadius: 1, 
                      fontSize: '0.75rem',
                      bgcolor: 
                        alert.status === 'approved' ? '#e8f5e9' : 
                        alert.status === 'rejected' ? '#ffebee' : '#fff8e1',
                      color:
                        alert.status === 'approved' ? '#2e7d32' : 
                        alert.status === 'rejected' ? '#c62828' : '#f57f17'
                    }}
                  >
                    {alert.status 
                      ? (alert.status.charAt(0).toUpperCase() + alert.status.slice(1)) 
                      : 'Pending'}
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
                No recent alerts found
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Alerts by Status Card */}
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 2, 
            border: '1px solid #e0e0e0', 
            flex: { md: 1 },
            width: '100%'
          }}
        >
          <CardHeader
            title="Alerts by Status"
            titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
            sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
          />
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Pending</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      flexGrow: 1, 
                      height: 10, 
                      bgcolor: '#fff8e1', 
                      borderRadius: 5,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${pendingPercentage}%`,
                        bgcolor: '#ffb74d',
                        borderRadius: 5
                      }}
                    />
                  </Box>
                  <Typography variant="body2">{stats.alertsByStatus.pending}</Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Approved</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      flexGrow: 1, 
                      height: 10, 
                      bgcolor: '#e8f5e9', 
                      borderRadius: 5,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${approvedPercentage}%`,
                        bgcolor: '#66bb6a',
                        borderRadius: 5
                      }}
                    />
                  </Box>
                  <Typography variant="body2">{stats.alertsByStatus.approved}</Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Rejected</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      flexGrow: 1, 
                      height: 10, 
                      bgcolor: '#ffebee', 
                      borderRadius: 5,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${rejectedPercentage}%`,
                        bgcolor: '#ef5350',
                        borderRadius: 5
                      }}
                    />
                  </Box>
                  <Typography variant="body2">{stats.alertsByStatus.rejected}</Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
} 