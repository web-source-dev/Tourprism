'use client';

import React, { ReactNode, useState } from 'react';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  CssBaseline, 
  Container 
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';



interface AdminLayoutProps {
  children: ReactNode;
}

const drawerWidth = 280;

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { logout} = useAuth();
  const router = useRouter();
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: 'ri-dashboard-line', path: '/admin' },
    { text: 'Alerts', icon: 'ri-notification-4-line', path: '/admin/alerts' },
    { text: 'Auto-Updates', icon: 'ri-refresh-line', path: '/admin/auto-updates' },
    { text: 'Users', icon: 'ri-user-settings-line', path: '/admin/users' },
    { text: 'Subscribers', icon: 'ri-mail-line', path: '/admin/subscribers' },
    { text: 'System Logs', icon: 'ri-history-line', path: '/admin/logs' },
    { text: 'Archive', icon: 'ri-archive-line', path: '/admin/archive' },
    { text: 'Back to Site', icon: 'ri-arrow-left-line', path: '/feed' },
    { text: 'Alert Metrics', icon: 'ri-bar-chart-line', path: '/admin/alert-metrics' },
  ];

  const AllAdminPages = [
    { text: 'Dashboard', icon: 'ri-dashboard-line', path: '/admin' },
    { text: 'Alerts', icon: 'ri-notification-4-line', path: '/admin/alerts' },
    { text: 'Create Alert', icon: 'ri-add-line', path: '/admin/alerts/create' },
    { text: 'Pending Alerts', icon: 'ri-time-line', path: '/admin/alerts/pending' },
    { text: 'Published Alerts', icon: 'ri-eye-line', path: '/admin/alerts/published' },
    { text: 'Forecast History', icon: 'ri-history-line', path: '/admin/alerts/summary' },
    { text: 'Auto-Updates', icon: 'ri-refresh-line', path: '/admin/auto-updates' },
    { text: 'Users', icon: 'ri-user-settings-line', path: '/admin/users' },
    { text: 'Subscribers', icon: 'ri-mail-line', path: '/admin/subscribers' },
    { text: 'System Logs', icon: 'ri-history-line', path: '/admin/logs' },
    { text: 'Archive', icon: 'ri-archive-line', path: '/admin/archive' },
  ];

  // Define main parent pages where back button should NOT show
  const mainParentPages = [
    '/admin',
    '/admin/alerts',
    '/admin/auto-updates',
    '/admin/users',
    '/admin/subscribers',
    '/admin/logs',
    '/admin/alert-metrics'
  ];

  // Check if current page is a sub-page (should show back button)
  const isSubPage = !mainParentPages.includes(pathname);

  const handleMenuItemClick = (path: string) => {
    setMobileOpen(false);
    window.location.href = path;
  };

  const drawer = (
    <div>
      <Toolbar sx={{ backgroundColor: 'black', color: 'white', justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          TourPrism Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={pathname === item.path}
              onClick={() => handleMenuItemClick(item.path)}
              sx={{ 
                py: 1.5, 
                '&.Mui-selected': {
                  backgroundColor: '#f5f5f5',
                  borderLeft: '4px solid black',
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                  }
                }
              }}
            >
              <ListItemIcon>
                <i className={item.icon} style={{ fontSize: 20 }}></i>
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={logout} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <i className="ri-logout-box-line" style={{ fontSize: 20 }}></i>
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        color="default"
        elevation={1}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <i className="ri-menu-line" style={{ fontSize: 24 }}></i>
          </IconButton>
          {isSubPage && (
            <IconButton 
              onClick={() => router.back()}
              sx={{
                backgroundColor:'transparent',
                '&:hover': {
                  backgroundColor: 'transparent',
                }
              }}
            >
              <i className="ri-arrow-left-line" style={{ fontSize: 24 }}></i>
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {AllAdminPages.find(item => item.path === pathname)?.text || 'Admin Panel'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // spacing below AppBar
          minHeight: 'calc(100vh - 64px)' // full height minus AppBar
        }}
      >
        <Container maxWidth="xl" sx={{ p: 0 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout; 