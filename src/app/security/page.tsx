'use client';

import React from 'react';
import { Container } from '@mui/material';
import Layout from '@/components/Layout';
import AccountSettingsTab from '@/components/profile/AccountSettingsTab';

export default function SecurityPage() {
  return (
    <Layout isFooter={false}>
      <Container maxWidth="lg" sx={{ mb: 4 , px: 0 }}>
          <AccountSettingsTab />
      </Container>
    </Layout>
  );
} 