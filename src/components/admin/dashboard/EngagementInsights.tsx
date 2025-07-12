import React from 'react';
import { Box, Typography, Divider, Stack } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DateRangeIcon from '@mui/icons-material/DateRange';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';

interface Alert {
  title: string;
  location: string;
  category: string;
  followCount: number;
  trend?: number;
}

interface LocationEngagement {
  name: string;
  metric: string;
  details: string;
}

interface BusinessEngagement {
  type: string;
  metric: string;
  details: string;
}

interface EngagementInsightsProps {
  topFollowedAlerts: Alert[];
  upcomingAlerts: Alert[];
  engagedLocations: LocationEngagement[];
  engagedBusinessTypes: BusinessEngagement[];
  engagedAlertTypes: {
    type: string;
    follows: number;
    engagement: number;
  }[];
}

const InsightSectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.74)' }}>
    {icon}
    <Typography variant="subtitle1" sx={{ ml: 1.5, fontWeight: 'bold' }}>
      {title}
    </Typography>
  </Box>
);

const AlertList: React.FC<{ alerts: Alert[] }> = ({ alerts }) => (
  <Box>
    {alerts.map((alert, index) => (
      <Box key={index} sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {index + 1}. {alert.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', mr: 1 }}>
              {alert.followCount} follows
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {alert.location} • {alert.category}
        </Typography>
        {index < alerts.length - 1 && <Divider sx={{ my: 1.5, borderColor: 'rgba(0, 0, 0, 0.12)' }} />}
      </Box>
    ))}
  </Box>
);

const EngagementList: React.FC<{
  items: Array<LocationEngagement | BusinessEngagement>;
}> = ({ items }) => (
  <Box>
    {items.map((item, index) => (
      <Box key={index} sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          {'type' in item ? item.type : item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {item.metric}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {item.details}
        </Typography>
        {index < items.length - 1 && <Divider sx={{ my: 1.5, borderColor: 'rgba(0, 0, 0, 0.12)' }} />}
      </Box>
    ))}
  </Box>
);

const EngagementInsights: React.FC<EngagementInsightsProps> = ({
  topFollowedAlerts,
  upcomingAlerts,
  engagedLocations,
  engagedBusinessTypes,
  engagedAlertTypes
}) => {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Engagement Insights
      </Typography>
      
      <Stack spacing={3}>
        {/* Row 1: Top alerts and upcoming alerts */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={3}
          sx={{ width: '100%' }}
        >
          {/* Top Followed Alerts */}
          <Box 
            sx={{ 
              p: 2.5, 
              border: '1px solid rgb(0, 0, 0)',
              borderRadius: '8px',
              flex: 1,
              boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)'
            }}
          >
            <InsightSectionHeader 
              icon={<ShowChartIcon sx={{ color: 'text.secondary' }} />}
              title="Top 5 Alerts Followed Last Week"
            />
            {topFollowedAlerts && topFollowedAlerts.length > 0 ? (
              <AlertList alerts={topFollowedAlerts} />
            ) : (
              <Typography variant="body2" color="text.secondary">No data available</Typography>
            )}
          </Box>

          {/* Most Followed Upcoming Alerts */}
          <Box 
            sx={{ 
              p: 2.5, 
              border: '1px solid rgb(0, 0, 0)',
              borderRadius: '8px',
              flex: 1,
              boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)'
            }}
          >
            <InsightSectionHeader 
              icon={<DateRangeIcon sx={{ color: 'text.secondary' }} />}
              title="Most Followed Alerts (Next 7 Days)"
            />
            {upcomingAlerts && upcomingAlerts.length > 0 ? (
              <AlertList alerts={upcomingAlerts} />
            ) : (
              <Typography variant="body2" color="text.secondary">No data available</Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              p: 2.5, 
              border: '1px solid rgb(0, 0, 0)',
              borderRadius: '8px',
              flex: 1,
              boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)'
            }}
          >
            <InsightSectionHeader 
              icon={<LocationOnIcon sx={{ color: 'text.secondary' }} />}
              title="Most Engaged Location (Last 7 Days)"
            />
            {engagedLocations && engagedLocations.length > 0 ? (
              <EngagementList items={engagedLocations} />
            ) : (
              <Typography variant="body2" color="text.secondary">No data available</Typography>
            )}
          </Box>
        </Stack>

        {/* Row 2: Location and Business Type */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={3}
          sx={{ width: '100%' }}
        >

          {/* Most Engaged Business Type */}
          <Box 
            sx={{ 
              p: 2.5, 
              border: '1px solid rgb(0, 0, 0)',
              borderRadius: '8px',
              flex: 1,
              boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)'
            }}
          >
            <InsightSectionHeader 
              icon={<BusinessIcon sx={{ color: 'text.secondary' }} />}
              title="Most Engaged Business Type"
            />
            {engagedBusinessTypes && engagedBusinessTypes.length > 0 ? (
              <EngagementList items={engagedBusinessTypes} />
            ) : (
              <Typography variant="body2" color="text.secondary">No data available</Typography>
            )}
          </Box>
          {/* Most Engaged Alert Type */}
          <Box 
            sx={{ 
              p: 2.5, 
              border: '1px solid rgb(0, 0, 0)',
              borderRadius: '8px',
              flex: 1,
              boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)'
            }}
          >
            <InsightSectionHeader 
              icon={<CategoryIcon sx={{ color: 'text.secondary' }} />}
              title="Most Engaged Alert Type"
            />
            {engagedAlertTypes && engagedAlertTypes.length > 0 ? (
              <Box>
                {engagedAlertTypes.map((type, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {type.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.follows} follows • {type.engagement}% engagement
                    </Typography>
                    {index < engagedAlertTypes.length - 1 && <Divider sx={{ my: 1.5, borderColor: 'rgba(0, 0, 0, 0.12)' }} />}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No data available</Typography>
            )}
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export default EngagementInsights; 