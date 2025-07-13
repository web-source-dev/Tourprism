'use client';

import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Pagination, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { getAllAlertsAdmin } from '@/services/api';
import { Alert } from '@/types';
import PublishedAlertsTable from '@/components/admin/alerts/PublishedAlertsTable';

export default function PublishedAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const fetchAlerts = async (pageNum = page, pageSize = limit) => {
    try {
      setLoading(true);
      const response = await getAllAlertsAdmin({ status: 'approved', page: pageNum, limit: pageSize });
      setAlerts(response.alerts);
      setTotalCount(response.totalCount);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching published alerts:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line
  }, [page, limit]);

  const handlePageChange = (_: unknown, value: number) => {
    setPage(value);
  };

  const handleLimitChange = (event: SelectChangeEvent<number>) => {
    setLimit(Number(event.target.value));
    setPage(1);
  };

  const handleRefresh = () => {
    fetchAlerts(page, limit);
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <PublishedAlertsTable 
              alerts={alerts} 
              refreshData={handleRefresh}
            />
            {/* Pagination controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="page-size-label">Alerts per page</InputLabel>
                <Select
                  labelId="page-size-label"
                  value={limit}
                  label="Alerts per page"
                  onChange={handleLimitChange}
                >
                  {[10, 20, 50, 100].map((size) => (
                    <MenuItem key={size} value={size}>{size}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Pagination
                count={Math.ceil(totalCount / limit)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          </>
        )}
      </Box>
    </AdminLayout>
  );
} 