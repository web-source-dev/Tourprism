import React from 'react';
import { Box, Typography } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change }) => {
  const isPositive = change >= 0;
  
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 3,
        bgcolor: '#ffffff',
        border: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ 
          color: isPositive ? 'success.main' : 'error.main',
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.75rem'
        }}
      >
        {isPositive ? '+' : '-'}{Math.abs(change)}%
      </Typography>
    </Box>
  );
};

interface MetricsOverviewProps {
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
    };
  };
}

const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Alerts Section */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(3, 1fr)', // mobile: 3 columns
          md: 'repeat(6, 1fr)', // tablet: 6 columns
          lg: 'repeat(9, 1fr)', // desktop: 9 columns
        },
        gap: 2,
        mb: 2
      }}>
        <MetricCard
          title="Total Alerts"
          value={metrics.alerts.total}
          change={metrics.alerts.totalChange}
        />
        <MetricCard
          title="Active Alerts"
          value={metrics.alerts.active}
          change={metrics.alerts.activeChange}
        />
        <MetricCard
          title="New Alerts"
          value={metrics.alerts.new}
          change={metrics.alerts.newChange}
        />
        <MetricCard
          title="Total Users"
          value={metrics.users.total}
          change={metrics.users.totalChange}
        />
        <MetricCard
          title="Active Users"
          value={metrics.users.active}
          change={metrics.users.activeChange}
        />
        <MetricCard
          title="New Users"
          value={metrics.users.new}
          change={metrics.users.newChange}
        />
        <MetricCard
          title="Total Subscribers"
          value={metrics.subscribers.total}
          change={metrics.subscribers.totalChange}
        />
        <MetricCard
          title="Active Subscribers"
          value={metrics.subscribers.active}
          change={metrics.subscribers.activeChange}
        />
        <MetricCard
          title="New Subscribers"
          value={metrics.subscribers.new}
          change={metrics.subscribers.newChange}
        />
      </Box>
    </Box>
  );
};

export default MetricsOverview; 