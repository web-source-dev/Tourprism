import React from 'react';
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

interface MobileSidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  menuItems: MenuItem[];
  handleMenuItemClick: (path: string, text: string) => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  mobileOpen,
  handleDrawerToggle,
  menuItems,
  handleMenuItemClick,
}) => {
  // Mobile drawer content
  const drawer = (
    <Box sx={{ width: 300 }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <Typography onClick={handleDrawerToggle}>X</Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            onClick={() => handleMenuItemClick(item.path, item.text)}
            sx={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '18px',
              height: '35px',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#f5f5f5'
              },
              cursor: 'pointer'
            }}
          >
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{
        keepMounted: true // Better open performance on mobile.
      }}
      sx={{
        display: { xs: 'block', sm: 'none' },
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 300 }
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default MobileSidebar; 