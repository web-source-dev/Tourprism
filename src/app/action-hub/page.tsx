'use client';

import Layout from '@/components/Layout';
<<<<<<< HEAD
import { Box, Container } from '@mui/material';
import Head from 'next/head';
=======
>>>>>>> 2945eb6 (Initial commit)
import ActionHubList from '@/components/action-hub/ActionHubList';

const ActionHub = () => {
  return (
    <Layout isFooter={false}>
<<<<<<< HEAD
      <Head>
        <title>Action Hub | Tourprism</title>
        <meta name="description" content="Manage flagged alerts and take action on important issues." />
      </Head>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <ActionHubList />
        </Box>
      </Container>
=======

          <ActionHubList />
>>>>>>> 2945eb6 (Initial commit)
    </Layout>
  );
};

export default ActionHub;
