'use client';

import React from 'react';
import {
  Typography,
  Paper
} from '@mui/material';
import AlertMetrics from '../../../components/admin/dashboard/AlertMetrics';
import AdminLayout from '@/components/AdminLayout';


export default function AlertMetricsPage() {

  return (
    <AdminLayout>
      <Typography variant="h4" gutterBottom>
        Alert Performance Metrics
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Track and analyze alert performance with detailed metrics and scoring
      </Typography>

      <Paper sx={{ width: '100%' }}>
          <AlertMetrics/>

      </Paper>
    </AdminLayout>
  );
}
