'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SummaryList from '@/components/admin/alerts/SummaryList';

// Import a summary service to fetch summary data
import { getSummaries } from '@/services/summaryService';

export default function ForecastSummaryPage() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);
        const response = await getSummaries();
        setSummaries(response.summaries as any);
        setTotalCount(response.totalCount);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching summaries:', error);
        setLoading(false);
      }
    };

    fetchSummaries();
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
          Forecast History
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Access historical forecast data and summaries
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {totalCount} {totalCount === 1 ? 'summary' : 'summaries'} available
              </Typography>
            </Box>
            <SummaryList 
              summaries={summaries} 
              refreshData={() => router.refresh()}
            />
          </>
        )}
      </Box>
    </AdminLayout>
  );
} 