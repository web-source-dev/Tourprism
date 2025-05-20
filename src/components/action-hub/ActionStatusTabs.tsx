'use client';

import React from 'react';
import { Box, Tabs, Tab, styled, Badge } from '@mui/material';

interface ActionStatusTabsProps {
  tabValue: number;
  newCount: number;
  inProgressCount: number;
  handledCount: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

// Styled component for the tab indicator line
const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTabs-indicator': {
    backgroundColor: 'transparent'
  }
}));

// Styled Tab for mobile-friendly design
const MobileTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '0.875rem',
  fontWeight: 'bold',
  padding: '10px 0',
  minHeight: '48px',
  color: theme.palette.text.primary,
  [theme.breakpoints.down('sm')]: {
    minWidth: '0px',
    flexShrink: 1,
    padding: '10px 0',
  },
}));

// Styled badges for different statuses
const NewBadge = styled(Badge)(() => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#2196f3', // Blue
    color: 'white'
  }
}));

const InProgressBadge = styled(Badge)(() => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#ff9800', // Amber
    color: 'white'
  }
}));

const HandledBadge = styled(Badge)(() => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#4caf50', // Green
    color: 'white'
  }
}));

const ActionStatusTabs: React.FC<ActionStatusTabsProps> = ({
  tabValue,
  newCount,
  inProgressCount,
  handledCount,
  onTabChange
}) => {
  return (
    <Box sx={{ width: '100%', borderBottom: '1px solid #eaeaea' }}>
      <StyledTabs
        value={tabValue}
        onChange={onTabChange}
        variant="fullWidth"
        textColor="inherit"
        sx={{
          minHeight: '48px',
          '& .MuiTab-root': {
            minHeight: '48px',
          },
        }}
      >
        <MobileTab 
          label={
            <NewBadge badgeContent={newCount} color="primary">
              <Box sx={{ pr: newCount > 0 ? 2 : 0, py: 1, borderBottom: tabValue === 0 ? '3px solid #2196f3' : 'none' }}>New</Box>
            </NewBadge>
          }
          sx={{ 
            fontWeight: tabValue === 0 ? 'bold' : 'normal',
            color: tabValue === 0 ? '#2196f3' : 'inherit',
          }}
        />
        <MobileTab 
          label={
            <InProgressBadge badgeContent={inProgressCount} color="primary">
              <Box sx={{ pr: inProgressCount > 0 ? 2 : 0, py: 1, borderBottom: tabValue === 1 ? '3px solid #ff9800' : 'none' }}>In Progress</Box>
            </InProgressBadge>
          }
          sx={{ 
            fontWeight: tabValue === 1 ? 'bold' : 'normal',
            color: tabValue === 1 ? '#ff9800' : 'inherit',
          }}
        />
        <MobileTab 
          label={
            <HandledBadge badgeContent={handledCount} color="primary">
              <Box sx={{ pr: handledCount > 0 ? 2 : 0, py: 1, borderBottom: tabValue === 2 ? '3px solid #4caf50' : 'none' }}>Handled</Box>
            </HandledBadge>
          }
          sx={{ 
            fontWeight: tabValue === 2 ? 'bold' : 'normal',
            color: tabValue === 2 ? '#4caf50' : 'inherit',
          }}
        />
      </StyledTabs>
    </Box>
  );
};

export default ActionStatusTabs; 