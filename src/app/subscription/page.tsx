import Layout from '@/components/Layout';
import { Container, Typography, Box } from '@mui/material';
import Head from 'next/head';

const ComingSoon = () => {
  return (
    <Layout isFooter={false}>
      <Head>
        <title>Coming Soon | Tourprism</title>
        <meta name="description" content="Something amazing is coming soon." />
      </Head>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
          color: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h2" component="h1" gutterBottom>
            Coming Soon
          </Typography>
        </Container>
      </Box>
    </Layout>
  );
};

export default ComingSoon;
