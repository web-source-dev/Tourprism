'use client';

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import Layout from '@/components/Layout';

export default function BillingPage() {
  return (
    <Layout isFooter={false}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
          <Typography variant="h4" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Billing features will be available soon.
          </Typography>
        </Box>
      </Container>
    </Layout>
  );
} 