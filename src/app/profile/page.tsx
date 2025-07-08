'use client';

import React from 'react';
import { Container, CircularProgress } from '@mui/material';
import Layout from '@/components/Layout';
import PersonalInfoTab from '@/components/profile/PersonalInfoTab';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const handleUserUpdate = (updatedUser: User) => {
    updateUser(updatedUser);
  };

  if (!user) {
    return (
      <Layout isFooter={false}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout isFooter={false}>
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 0,
          px: 0,
          mx: 0,
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
            <PersonalInfoTab user={user} onUpdate={handleUserUpdate} />
      </Container>
    </Layout>
  );
}
