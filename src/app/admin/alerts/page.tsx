'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Grid,
  Card,
  CardContent,
  Button,
  useTheme
} from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PendingIcon from '@mui/icons-material/Pending';
import HistoryIcon from '@mui/icons-material/History';

export default function AlertsManagement() {
  const theme = useTheme();
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const actionCards = [
    {
      title: 'Create New Alert',
      description: 'Create a new alert to inform users about disruptions',
      icon: <AddIcon sx={{ fontSize: 40 }} />,
      path: '/admin/alerts/create',
      color: theme.palette.primary.main
    },
    {
      title: 'View Published Alerts',
      description: 'View and manage all approved alerts',
      icon: <VisibilityIcon sx={{ fontSize: 40 }} />,
      path: '/admin/alerts/published',
      color: theme.palette.success.main
    },
    {
      title: 'Review Pending Alerts',
      description: 'Review and approve pending alerts',
      icon: <PendingIcon sx={{ fontSize: 40 }} />,
      path: '/admin/alerts/pending',
      color: theme.palette.warning.main
    },
    {
      title: 'View Forecast History',
      description: 'Access historical forecast data and summaries',
      icon: <HistoryIcon sx={{ fontSize: 40 }} />,
      path: '/admin/alerts/summary',
      color: theme.palette.info.main
    }
  ];

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Alerts Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage alerts, review pending submissions and access forecast history
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {actionCards.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                },
                boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
              }}
              onClick={() => navigateTo(card.path)}
            >
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                p: 4,
                height: '100%'
              }}>
                <Box 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    borderRadius: '50%',
                    backgroundColor: `${card.color}20`,
                    color: card.color,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 80,
                    height: 80
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {card.description}
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ 
                    mt: 'auto',
                    backgroundColor: card.color,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'light' 
                        ? `${card.color}` 
                        : `${card.color}CC`
                    }
                  }}
                >
                  {card.title}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </AdminLayout>
  );
} 