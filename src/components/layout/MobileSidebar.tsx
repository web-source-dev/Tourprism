import React, { useState } from 'react';
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Collapse,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const settingsSubmenuItems = [
    { text: 'Profile', path: '/profile' },
    { text: 'Billing', path: '/billing' },
    { text: 'Security', path: '/security' },
    { text: 'Support', path: '/support' }
  ];

  const handleItemClick = (path: string, text: string) => {
    if (path === 'settings') {
      setSettingsOpen(!settingsOpen);
    } else {
      handleMenuItemClick(path, text);
      handleDrawerToggle();
    }
  };

  // Filter out the Profile menu item from mobile sidebar
  const filteredMenuItems = menuItems.filter(item => item.text !== 'Profile' && item.text !== 'Security' );

  // Mobile drawer content
  const drawer = (
    <Box sx={{ width: 300 }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <Typography onClick={handleDrawerToggle}>X</Typography>
      </Box>
      <List>
        {filteredMenuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem
              onClick={() => handleItemClick(item.path, item.text)}
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
              {item.path === 'settings' && (
                <Box component="span" sx={{ ml: 'auto' }}>
                  {settingsOpen ? <ExpandLess /> : <ExpandMore />}
                </Box>
              )}
            </ListItem>
            {item.path === 'settings' && (
              <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {settingsSubmenuItems.map((subItem) => (
                    <ListItem
                      key={subItem.text}
                      onClick={() => handleItemClick(subItem.path, subItem.text)}
                      sx={{
                        pl: 4,
                        py: 1,
                        color: 'black',
                        fontSize: '16px',
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                          cursor: 'pointer',
                        },
                      }}
                    >
                      <ListItemText primary={subItem.text} />
                      <Box component="span" sx={{ ml: 'auto' }}>
                        <ExpandMore sx={{rotate: '270deg'}}/>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
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