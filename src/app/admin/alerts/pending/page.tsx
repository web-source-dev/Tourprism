'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { getAllAlertsAdmin } from '@/services/api';
import { Alert } from '@/types';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PendingAlertsTable from '@/components/admin/alerts/PendingAlertsTable';

export default function PendingAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await getAllAlertsAdmin({ status: 'pending' });
        setAlerts(response.alerts);
        setTotalCount(response.totalCount);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pending alerts:', error);
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/admin/alerts')}
          sx={{ mb: 2 }}
        >
          Back to Alerts Management
        </Button>

        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Review Pending Alerts
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Review and approve alerts that are waiting for moderation
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {totalCount} {totalCount === 1 ? 'alert' : 'alerts'} pending review
              </Typography>
            </Box>
            <PendingAlertsTable 
              alerts={alerts} 
              refreshData={() => router.refresh()}
            />
          </>
        )}
      </Box>
    </AdminLayout>
  );
} 