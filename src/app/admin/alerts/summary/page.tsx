'use client';

import React from 'react';
import { Box} from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import SummaryList from '@/components/admin/alerts/SummaryList';

export default function ForecastSummaryPage() {
  return (
    <AdminLayout>
      <Box sx={{ p: 0 }}>
        <SummaryList />
      </Box>
    </AdminLayout>
  );
} 