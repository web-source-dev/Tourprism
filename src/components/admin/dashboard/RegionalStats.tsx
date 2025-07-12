import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Divider } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface CityStats {
  alerts: {
    total: number;
    active: number;
    new: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
  };
  subscribers: {
    total: number;
    new: number;
    unsubscribed: number;
  };
  forecast: {
    openRate: number;
    clickRate: number;
  };
}

interface RegionalStatsProps {
  cities: {
    [key: string]: CityStats;
  };
}

const RegionalStats: React.FC<RegionalStatsProps> = ({ cities }) => {
  const cityEntries = Object.entries(cities);
  const hasCities = cityEntries.length > 0;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Regional Statistics
      </Typography>
      
      {!hasCities ? (
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', textAlign: 'center', borderRadius: 1 }}>
          <Typography variant="body1" color="text.secondary">
            No regional data available
          </Typography>
        </Box>
      ) : (
        cityEntries.map(([cityName, stats]) => (
          <Accordion 
            key={cityName} 
            sx={{ 
              mb: 1.5,
              boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgb(0, 0, 0)',
              borderRadius: '8px !important',
              '&:before': {
                display: 'none',
              },
              overflow: 'hidden'
            }}
          >
            <AccordionSummary 
              expandIcon={<ChevronRightIcon />}
              sx={{ 
                px: 2, 
                '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                  transform: 'rotate(90deg)',
                },
                '&.Mui-expanded': {
                  borderBottom: '1px solid rgba(0, 0, 0, 0.74)',
                  mb: 0
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <PersonIcon sx={{ mr: 1.5 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {cityName}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Box sx={{ p: 2 }}>
                {/* Alerts Section */}
                <Box sx={{ display: 'flex', mb: 1.5, alignItems: 'flex-start' }}>
                  <NotificationsIcon sx={{ mt: 0.5, mr: 1.5, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      Total Alerts
                      <Box component="span" sx={{ fontWeight: 400, ml: 1 }}>
                        {stats.alerts?.total || 0}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Active Alerts
                      <Box component="span" sx={{ ml: 1 }}>
                        {stats.alerts?.active || 0}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      New Alerts
                      <Box component="span" sx={{ ml: 1 }}>
                        {stats.alerts?.new || 0}
                      </Box>
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1.5 , borderColor: 'rgba(0, 0, 0, 0.74)' }} />
                
                {/* Users Section */}
                <Box sx={{ display: 'flex', mb: 1.5, alignItems: 'flex-start' }}>
                  <PersonIcon sx={{ mt: 0.5, mr: 1.5, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      Total Users
                      <Box component="span" sx={{ fontWeight: 400, ml: 1 }}>
                        {stats.users?.total || 0}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Active Users
                      <Box component="span" sx={{ ml: 1 }}>
                        {stats.users?.active || 0}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      New Users
                      <Box component="span" sx={{ ml: 1 }}>
                        {stats.users?.new || 0}
                      </Box>
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1.5 , borderColor: 'rgba(0, 0, 0, 0.74)' }} />
                
                {/* Subscribers Section */}
                <Box sx={{ display: 'flex', mb: 1.5, alignItems: 'flex-start' }}>
                  <EmailIcon sx={{ mt: 0.5, mr: 1.5, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      Subscribers
                      <Box component="span" sx={{ fontWeight: 400, ml: 1 }}>
                        {stats.subscribers?.total || 0}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      New
                      <Box component="span" sx={{ ml: 1 }}>
                        {stats.subscribers?.new || 0}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Unsubscribed
                      <Box component="span" sx={{ ml: 1 }}>
                        {stats.subscribers?.unsubscribed || 0}
                      </Box>
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1.5 , borderColor: 'rgba(0, 0, 0, 0.74)' }} />
                
                {/* Forecast Engagement Section */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <AssessmentIcon sx={{ mt: 0.5, mr: 1.5, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      Last Forecast:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Open Rate
                      <Box component="span" sx={{ ml: 1 }}>
                        {stats.forecast?.openRate || 0}%
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Click Rate
                      <Box component="span" sx={{ ml: 1 }}>
                        {stats.forecast?.clickRate || 0}%
                      </Box>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
};

export default RegionalStats; 