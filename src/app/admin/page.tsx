'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import MetricsOverview from '@/components/admin/dashboard/MetricsOverview';
import RegionalStats from '@/components/admin/dashboard/RegionalStats';
import EngagementInsights from '@/components/admin/dashboard/EngagementInsights';
import { getDashboardStats } from '@/services/api';

// Define the type for dashboard stats
interface DashboardStats {
  metrics: {
    alerts: {
      total: number;
      totalChange: number;
      active: number;
      activeChange: number;
      new: number;
      newChange: number;
    };
    users: {
      total: number;
      totalChange: number;
      active: number;
      activeChange: number;
      new: number;
      newChange: number;
    };
    subscribers: {
      total: number;
      totalChange: number;
      active: number;
      activeChange: number;
      new: number;
      newChange: number;
      unsubscribes: number;
    };
  };
  regionalStats: {
    [city: string]: {
      alerts: {
        total: number;
        active: number;
        new: number;
      };
      users: {
        total: number;
        active: number;
        new: number;
      };
      subscribers: {
        total: number;
        new: number;
        unsubscribed: number;
      };
      forecast: {
        openRate: number;
        clickRate: number;
      };
    };
  };
  engagement?: {
    topFollowedAlerts: Array<{
      title: string;
      location: string;
      category: string;
      followCount: number;
      trend?: number;
    }>;
    upcomingAlerts: Array<{
      title: string;
      location: string;
      category: string;
      followCount: number;
      trend?: number;
    }>;
    engagedLocations: Array<{
      name: string;
      metric: string;
      details: string;
    }>;
    engagedBusinessTypes: Array<{
      type: string;
      metric: string;
      details: string;
    }>;
    engagedAlertTypes: Array<{
      type: string;
      follows: number;
      engagement: number;
    }>;
  };
}

// Default values for missing data
const defaultMetrics = {
  alerts: {
    total: 0,
    totalChange: 0,
    active: 0,
    activeChange: 0,
    new: 0,
    newChange: 0
  },
  users: {
    total: 0,
    totalChange: 0,
    active: 0,
    activeChange: 0,
    new: 0,
    newChange: 0
  },
  subscribers: {
    total: 0,
    totalChange: 0,
    active: 0,
    activeChange: 0,
    new: 0,
    newChange: 0,
    unsubscribes: 0
  }
};

const defaultEngagement = {
  topFollowedAlerts: [],
  upcomingAlerts: [],
  engagedLocations: [],
  engagedBusinessTypes: [],
  engagedAlertTypes: []
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataWarnings, setDataWarnings] = useState<string[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setDataWarnings([]);
      const data = await getDashboardStats();
      
      // Validate the data structure and set warnings for missing sections
      const warnings: string[] = [];
      if (!data.metrics) {
        warnings.push('Metrics data is missing. Showing default values.');
        data.metrics = defaultMetrics;
      }
      
      if (!data.regionalStats || Object.keys(data.regionalStats).length === 0) {
        warnings.push('Regional statistics data is missing. Showing empty values.');
        data.regionalStats = {};
      }
      
      setDataWarnings(warnings);
      setStats(data as DashboardStats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
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
          <Box sx={{ mt: 2 }}>
            <button onClick={fetchStats} className="btn btn-primary">
              Retry
            </button>
          </Box>
        </Box>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">No data available</Typography>
          <Typography variant="body1">Please try refreshing the page.</Typography>
          <Box sx={{ mt: 2 }}>
            <button onClick={fetchStats} className="btn btn-primary">
              Retry
            </button>
          </Box>
        </Box>
      </AdminLayout>
    );
  }

  // Ensure all required data structures exist
  const metrics = stats.metrics || defaultMetrics;
  const regionalStats = stats.regionalStats || {};
  const engagement = stats.engagement || defaultEngagement;

  return (
    <AdminLayout>
      <Box sx={{ py: 3, px: 0 }}>
        {dataWarnings.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {dataWarnings.map((warning, index) => (
              <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                {warning}
              </Alert>
            ))}
          </Box>
        )}

        {/* Metrics Overview Section */}
        <MetricsOverview metrics={metrics} />

        {/* Regional Stats Section */}
        <RegionalStats cities={regionalStats} />

        {/* Engagement Insights Section */}
        <EngagementInsights
          topFollowedAlerts={engagement.topFollowedAlerts}
          upcomingAlerts={engagement.upcomingAlerts}
          engagedLocations={engagement.engagedLocations}
          engagedBusinessTypes={engagement.engagedBusinessTypes}
          engagedAlertTypes={engagement.engagedAlertTypes}
        />
      </Box>
    </AdminLayout>
  );
} 