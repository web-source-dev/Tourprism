import { Box } from '@mui/material';

export const metadata = {
  title: 'Accept Collaboration Invitation | TourPrism',
  description: 'Accept an invitation to collaborate on a TourPrism account',
};

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        flexDirection: 'column',
        pt: 2
      }}
    >
      <Box 
        component="header" 
        sx={{ 
          p: 2, 
          textAlign: 'center',
          mb: 2
        }}
      >
        <Box 
          component="img"
          src="/images/logo.png"
          alt="TourPrism Logo"
          sx={{ 
            height: '50px',
            maxWidth: '200px'
          }}
        />
      </Box>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      <Box 
        component="footer" 
        sx={{ 
          p: 2, 
          textAlign: 'center',
          mt: 'auto',
          fontSize: '0.875rem',
          color: 'text.secondary'
        }}
      >
        &copy; {new Date().getFullYear()} TourPrism. All rights reserved.
      </Box>
    </Box>
  );
} 