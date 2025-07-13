'use client';

import React from 'react';
import { 
  Typography, 
  Card,
  CardContent,
  Box,
} from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';

export default function AlertsManagement() {
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const actionCards = [
    {
      title: 'Create New Alert',
      path: '/admin/alerts/create',
    },
    {
      title: 'View Published Alerts',
      path: '/admin/alerts/published',
    },
    {
      title: 'Review Pending Alerts',
      path: '/admin/alerts/pending',
    },
    {
      title: 'View Forecast History',
      path: '/admin/alerts/summary',
    }
  ];

  return (
    <AdminLayout>
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: { xs: 1, md: 3 },
        justifyContent: 'center'
      }}>
        {actionCards.map((card, index) => (
          <Box key={index} sx={{ 
            width: { xs: '100%', md: 'calc(50% - 12px)' },
            minWidth: { xs: '100%', md: '400px' }
          }}>
            <Card 
              sx={{ 
                height: { xs: '80px', md: '220px' }, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 4,
                boxShadow: 'none',
                cursor: 'pointer',
                border: '1px solid rgb(179, 179, 179)'
              }}
              onClick={() => navigateTo(card.path)}
            >
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                p: { xs: 1, md: 4 },
                height: '100%',
                '&:last-child': { pb: { xs: 1, md: 4 } },
                minHeight: { xs: '80px', md: 'auto' }
              }}>
                <Typography variant="body2" sx={{ 
                  mb: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'primary.main'
                }}>
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </AdminLayout>
  );
} 