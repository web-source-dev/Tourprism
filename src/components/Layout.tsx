'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import {
  Box,
  Container,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import NotificationDrawer from './NotificationDrawer';
import Banner from './Banner';
import { getNotifications } from '../services/api';
import { Notification } from '../types';
import Sidebar from './layout/Sidebar';
import { useTheme } from '@mui/material/styles';
import BackToTop from './BackToTop';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import MobileSidebar from './layout/MobileSidebar';

interface LayoutProps {
  children: ReactNode;
  isFooter?: boolean;
  onFilterOpen?: () => void;
}

const Layout = ({ children, isFooter = true, onFilterOpen }: LayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const isFeedPage = pathname === '/feed';
  const isHomePage = pathname === '/';
  const isMobile = useMediaQuery('(max-width: 600px)');
  const theme = useTheme();

  // Use useEffect to mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add fetchNotifications function
  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Add useEffect to fetch notifications when logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Add this line to calculate unread notifications
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = isAuthenticated ? [
    {
      text: 'Feed', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.024 0.833313H11.9753C11.4825 0.833305 11.0775 0.833298 10.7499 0.864453C10.4094 0.896827 10.1011 0.966336 9.82078 1.13815C9.54244 1.30872 9.30841 1.54274 9.13784 1.82109C8.96603 2.10145 8.89652 2.40968 8.86415 2.75017C8.83299 3.07784 8.833 3.48285 8.83301 3.97561V4.02435C8.833 4.51711 8.83299 4.92212 8.86415 5.24979C8.89652 5.59028 8.96603 5.89851 9.13784 6.17887C9.30841 6.45722 9.54244 6.69124 9.82078 6.86181C10.1011 7.03362 10.4094 7.10313 10.7499 7.13551C11.0775 7.16666 11.4825 7.16666 11.9753 7.16665H12.024C12.5168 7.16666 12.9218 7.16666 13.2495 7.13551C13.59 7.10313 13.8982 7.03362 14.1786 6.86181C14.4569 6.69124 14.6909 6.45722 14.8615 6.17887C15.0333 5.89851 15.1028 5.59028 15.1352 5.24979C15.1664 4.92212 15.1664 4.51712 15.1663 4.02435V3.97561C15.1664 3.48285 15.1664 3.07784 15.1352 2.75017C15.1028 2.40968 15.0333 2.10145 14.8615 1.82109C14.6909 1.54274 14.4569 1.30872 14.1786 1.13815C13.8982 0.966336 13.59 0.896827 13.2495 0.864453C12.9218 0.833298 12.5168 0.833305 12.024 0.833313Z" fill="black" />
          <path d="M3.97531 0.833313H4.02404C4.5168 0.833305 4.92182 0.833298 5.24948 0.864453C5.58997 0.896827 5.8982 0.966336 6.17857 1.13815C6.45691 1.30872 6.69094 1.54274 6.86151 1.82109C7.03332 2.10145 7.10283 2.40968 7.1352 2.75017C7.16636 3.07783 7.16635 3.48284 7.16634 3.97559V4.02435C7.16635 4.51711 7.16636 4.92213 7.1352 5.24979C7.10283 5.59028 7.03332 5.89851 6.86151 6.17887C6.69094 6.45722 6.45691 6.69124 6.17857 6.86181C5.8982 7.03362 5.58997 7.10313 5.24948 7.13551C4.92182 7.16666 4.51682 7.16666 4.02407 7.16665H3.9753C3.48255 7.16666 3.07753 7.16666 2.74987 7.13551C2.40938 7.10313 2.10115 7.03362 1.82078 6.86181C1.54244 6.69124 1.30841 6.45722 1.13784 6.17887C0.966031 5.89851 0.896522 5.59028 0.864148 5.24979C0.832993 4.92212 0.833 4.51712 0.833008 4.02435V3.97562C0.833 3.48285 0.832993 3.07784 0.864148 2.75017C0.896522 2.40968 0.966031 2.10145 1.13784 1.82109C1.30841 1.54274 1.54244 1.30872 1.82078 1.13815C2.10115 0.966336 2.40938 0.896827 2.74987 0.864453C3.07753 0.833298 3.48255 0.833305 3.97531 0.833313Z" fill="black" />
          <path d="M4.02404 8.83331H3.97531C3.48256 8.8333 3.07753 8.8333 2.74987 8.86445C2.40938 8.89683 2.10115 8.96634 1.82078 9.13815C1.54244 9.30872 1.30841 9.54274 1.13784 9.82109C0.966031 10.1015 0.896522 10.4097 0.864148 10.7502C0.832993 11.0778 0.833 11.4829 0.833008 11.9756V12.0243C0.833 12.5171 0.832993 12.9221 0.864148 13.2498C0.896522 13.5903 0.966031 13.8985 1.13784 14.1789C1.30841 14.4572 1.54244 14.6912 1.82078 14.8618C2.10115 15.0336 2.40938 15.1031 2.74987 15.1355C3.07753 15.1667 3.48254 15.1667 3.9753 15.1666H4.02405C4.51681 15.1667 4.92182 15.1667 5.24948 15.1355C5.58997 15.1031 5.8982 15.0336 6.17857 14.8618C6.45691 14.6912 6.69094 14.4572 6.86151 14.1789C7.03332 13.8985 7.10283 13.5903 7.1352 13.2498C7.16636 12.9221 7.16635 12.5171 7.16634 12.0244V11.9756C7.16635 11.4828 7.16636 11.0778 7.1352 10.7502C7.10283 10.4097 7.03332 10.1015 6.86151 9.82109C6.69094 9.54274 6.45691 9.30872 6.17857 9.13815C5.8982 8.96634 5.58997 8.89683 5.24948 8.86445C4.92182 8.8333 4.51679 8.8333 4.02404 8.83331Z" fill="black" />
          <path d="M12.024 8.83331H11.9753C11.4825 8.8333 11.0775 8.8333 10.7499 8.86445C10.4094 8.89683 10.1011 8.96634 9.82078 9.13815C9.54244 9.30872 9.30841 9.54274 9.13784 9.82109C8.96603 10.1015 8.89652 10.4097 8.86415 10.7502C8.83299 11.0778 8.833 11.4829 8.83301 11.9756V12.0243C8.833 12.5171 8.83299 12.9221 8.86415 13.2498C8.89652 13.5903 8.96603 13.8985 9.13784 14.1789C9.30841 14.4572 9.54244 14.6912 9.82078 14.8618C10.1011 15.0336 10.4094 15.1031 10.7499 15.1355C11.0775 15.1667 11.4825 15.1667 11.9753 15.1666H12.024C12.5168 15.1667 12.9218 15.1667 13.2495 15.1355C13.59 15.1031 13.8982 15.0336 14.1786 14.8618C14.4569 14.6912 14.6909 14.4572 14.8615 14.1789C15.0333 13.8985 15.1028 13.5903 15.1352 13.2498C15.1664 12.9221 15.1664 12.5171 15.1663 12.0244V11.9756C15.1664 11.4828 15.1664 11.0778 15.1352 10.7502C15.1028 10.4097 15.0333 10.1015 14.8615 9.82109C14.6909 9.54274 14.4569 9.30872 14.1786 9.13815C13.8982 8.96634 13.59 8.89683 13.2495 8.86445C12.9218 8.8333 12.5168 8.8333 12.024 8.83331Z" fill="black" />
        </svg>
      ), path: '/feed'
    },
    {
      text: 'Action Hub', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.07208 0.764839C9.54318 0.965637 9.86491 1.44175 9.86491 2.01123L9.86536 6.52318C9.86537 6.59681 9.92506 6.6565 9.99869 6.6565H12.0665C12.6571 6.6565 13.0639 7.05506 13.2314 7.4734C13.3986 7.89129 13.3761 8.42802 13.0422 8.8566L8.37668 14.8452C8.00245 15.3256 7.41401 15.442 6.92814 15.2349C6.45705 15.0341 6.13531 14.558 6.13531 13.9885L6.13487 9.47653C6.13486 9.40289 6.07517 9.3432 6.00153 9.3432H3.93368C3.34314 9.3432 2.93629 8.94464 2.76886 8.5263C2.60162 8.10841 2.62415 7.57168 2.95805 7.1431L7.62354 1.15448C7.99777 0.674121 8.58621 0.55774 9.07208 0.764839Z" fill="#616161" />
        </svg>
      ), path: '/action-hub'
    },
    {
      text: 'Reports', icon: (
        <i className="ri-file-text-fill text-xl"></i>
      ), path: '/alerts-summary'
    },
    {
      text: 'Insights', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.4259 0.996408L9.39157 0.988655C9.0577 0.913215 8.74998 0.843685 8.48475 0.834454C8.17819 0.823785 7.89457 0.890654 7.63029 1.10259C7.35327 1.32474 7.23306 1.61366 7.18003 1.9316C7.13242 2.21705 7.13245 2.57168 7.13249 2.97285L7.13249 7.51129C7.13249 7.82556 7.13249 7.98269 7.23012 8.08032C7.32775 8.17795 7.48489 8.17795 7.79916 8.17795L13.0465 8.17796C13.4456 8.178 13.8026 8.17805 14.0905 8.12584C14.4163 8.06677 14.7051 7.93294 14.9224 7.63754C15.1262 7.36047 15.1879 7.0741 15.1596 6.76254C15.1357 6.49942 15.0445 6.20396 14.9484 5.89271L14.9375 5.8572C14.1947 3.44898 12.0711 1.59363 9.4259 0.996408Z" fill="#616161" />
          <path d="M5.70501 4.81515C3.82301 4.81515 2.22103 6.1099 2.22103 7.79073C2.22103 8.00508 2.40656 8.17884 2.63542 8.17884H5.70501C5.93387 8.17884 6.1194 8.00508 6.1194 7.79073V5.20326C6.1194 4.98891 5.93387 4.81515 5.70501 4.81515Z" fill="#616161" />
          <path d="M2.87273 9.17973C2.48836 9.17966 2.13399 9.1796 1.84678 9.23828C1.50955 9.30718 1.22991 9.46229 1.03009 9.7717C0.849648 10.0511 0.794924 10.3238 0.858476 10.6199C0.909913 10.8594 1.04058 11.1059 1.16787 11.3461L1.18576 11.3799C1.97446 12.8697 3.70523 13.8796 5.68459 13.8796C5.92489 13.8796 6.11968 13.694 6.11968 13.4649L6.11968 9.59443C6.11968 9.48445 6.07384 9.37897 5.99225 9.3012C5.91065 9.22343 5.79999 9.17974 5.6846 9.17974L2.87273 9.17973Z" fill="#616161" />
          <path d="M7.13249 9.61079C7.13249 9.37272 7.32509 9.17973 7.56268 9.17973H13.2985C13.5361 9.17973 13.7287 9.37272 13.7287 9.61079C13.7287 12.1584 11.8704 14.2713 9.37833 14.9678L9.34418 14.9773C9.03378 15.0641 8.74232 15.1457 8.48589 15.164C8.1848 15.1854 7.90754 15.1237 7.64264 14.9222C7.36184 14.7085 7.2367 14.4267 7.18149 14.1118C7.13241 13.8319 7.13245 13.4844 7.13249 13.0942L7.13249 9.61079Z" fill="#616161" />
        </svg>
      ), path: '/insights'
    },
    {
      text: 'Subscription', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.03138 2.16663C10.2574 2.16662 11.2202 2.16661 11.9793 2.25236C12.7541 2.33988 13.3823 2.52237 13.9046 2.93482C14.0609 3.05829 14.2059 3.19466 14.3377 3.34249C14.7818 3.84063 14.9801 4.44442 15.0746 5.18519C15.0855 5.27043 15.0909 5.31304 15.0811 5.35048C15.0655 5.41032 15.0196 5.46246 14.9622 5.48553C14.9263 5.49996 14.8814 5.49996 14.7915 5.49996H1.20783C1.11799 5.49996 1.07305 5.49996 1.03715 5.48553C0.979777 5.46246 0.933859 5.41032 0.918237 5.35048C0.908462 5.31304 0.913897 5.27043 0.924766 5.18519C1.01923 4.44442 1.21755 3.84063 1.66167 3.34249C1.79347 3.19466 1.93842 3.05829 2.09477 2.93482C2.61702 2.52237 3.24529 2.33988 4.02007 2.25236C4.77913 2.16661 5.74199 2.16662 6.96799 2.16663H9.03138Z" fill="#616161" />
          <path fillRule="evenodd" clipRule="evenodd" d="M15.1663 8.03513C15.1664 9.18446 15.1664 10.0951 15.0746 10.8147C14.9801 11.5555 14.7818 12.1593 14.3377 12.6574C14.2059 12.8053 14.0609 12.9416 13.9046 13.0651C13.3823 13.4775 12.7541 13.66 11.9793 13.7476C11.2202 13.8333 10.2574 13.8333 9.03137 13.8333H6.96798C5.74197 13.8333 4.77912 13.8333 4.02006 13.7476C3.24529 13.66 2.61701 13.4775 2.09476 13.0651C1.93841 12.9416 1.79346 12.8053 1.66166 12.6574C1.21755 12.1593 1.01922 11.5555 0.924758 10.8147C0.832992 10.0951 0.832999 9.18445 0.833008 8.03511V7.9648C0.833005 7.58096 0.833002 7.22373 0.836418 6.89135C0.838307 6.70756 0.839251 6.61567 0.897703 6.55781C0.956154 6.49996 1.04875 6.49996 1.23393 6.49996H14.7654C14.9506 6.49996 15.0432 6.49996 15.1016 6.55781C15.1601 6.61567 15.161 6.70756 15.1629 6.89135C15.1663 7.22362 15.1663 7.58073 15.1663 7.96443V8.03513ZM6.833 10.6666C6.833 10.3905 7.05686 10.1666 7.333 10.1666H8.333C8.60914 10.1666 8.833 10.3905 8.833 10.6666C8.833 10.9428 8.60914 11.1666 8.333 11.1666H7.333C7.05686 11.1666 6.833 10.9428 6.833 10.6666ZM10.333 10.1666C10.0569 10.1666 9.833 10.3905 9.833 10.6666C9.833 10.9428 10.0569 11.1666 10.333 11.1666H12.6663C12.9425 11.1666 13.1663 10.9428 13.1663 10.6666C13.1663 10.3905 12.9425 10.1666 12.6663 10.1666H10.333Z" fill="#616161" />
        </svg>
      ), path: '/subscription'
    },
    {
      text: 'Settings', icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M8.11672 0.837754C8.0388 0.831914 7.96055 0.831914 7.88263 0.837754C7.54689 0.862913 7.27481 1.01441 7.02621 1.2089C6.79239 1.39184 6.53373 1.65053 6.23121 1.95308L5.72405 2.3873C5.72405 2.3873 5.4521 2.42267 5.02146 2.42267C4.54732 2.42264 4.14206 2.42262 3.81821 2.46616C3.47241 2.51266 3.14558 2.61688 2.88105 2.88141C2.61651 3.14594 2.51229 3.47278 2.4658 3.81858C2.42226 4.14243 2.42228 4.54769 2.4223 5.02183L2.38694 5.72442L1.95271 6.23157C1.65018 6.53408 1.39147 6.79277 1.20854 7.02658C1.01404 7.27518 0.862547 7.54726 0.837387 7.88299C0.831548 7.96092 0.831548 8.03916 0.837387 8.11709C0.862547 8.45282 1.01404 8.7249 1.20854 8.9735C1.39147 9.20732 1.65016 9.46599 1.95271 9.76851L2.38694 10.2757L2.4223 10.9783C2.42228 11.4524 2.42226 11.8577 2.4658 12.1815C2.51229 12.5273 2.61651 12.8541 2.88105 13.1187C3.14558 13.3832 3.47241 13.4874 3.81821 13.5339C4.14206 13.5775 4.54733 13.5774 5.02147 13.5774L5.72405 13.6128L6.2312 14.047C6.5337 14.3495 6.79241 14.6083 7.02621 14.7912C7.27481 14.9857 7.54689 15.1372 7.88263 15.1623C7.96055 15.1682 8.0388 15.1682 8.11672 15.1623C8.45246 15.1372 8.72454 14.9857 8.97313 14.7912C9.20696 14.6082 9.46563 14.3495 9.76817 14.047L10.2753 13.6128L10.9779 13.5774C11.452 13.5774 11.8573 13.5775 12.1811 13.5339C12.5269 13.4874 12.8538 13.3832 13.1183 13.1187C13.3828 12.8541 13.4871 12.5273 13.5335 12.1815C13.5771 11.8577 13.5771 11.4524 13.577 10.9782L13.6124 10.2757L14.0466 9.76849C14.3492 9.46598 14.6079 9.20732 14.7908 8.9735C14.9853 8.7249 15.1368 8.45282 15.162 8.11709C15.1678 8.03916 15.1678 7.96092 15.162 7.88299C15.1368 7.54726 14.9853 7.27518 14.7908 7.02658C14.6079 6.79275 14.3492 6.53408 14.0466 6.23155L13.6124 5.72442L13.577 5.02183C13.5771 4.54769 13.5771 4.14243 13.5335 3.81858C13.4871 3.47278 13.3828 3.14595 13.1183 2.88141C12.8538 2.61688 12.5269 2.51266 12.1811 2.46616C11.8573 2.42262 11.452 2.42264 10.9779 2.42267C10.5472 2.42267 10.2362 2.3711 10.2362 2.3711L9.76814 1.95308C9.46562 1.65053 9.20695 1.39184 8.97313 1.2089C8.72454 1.01441 8.45246 0.862913 8.11672 0.837754ZM7.99967 5.16671C6.43487 5.16671 5.16634 6.43523 5.16634 8.00004C5.16634 9.56485 6.43487 10.8334 7.99967 10.8334C9.56448 10.8334 10.833 9.56485 10.833 8.00004C10.833 6.43523 9.56448 5.16671 7.99967 5.16671Z" fill="#616161" />
        </svg>
      ), path: '/profile'
    },
    { text: 'Logout', icon: '', path: '/' }
  ] : [
    { text: 'About', icon: '', path: '/about' },
    { text: 'Feature', icon: '', path: '/feature' },
    { text: 'Resources', icon: '', path: '/resources' },
    { text: 'Pricing', icon: '', path: '/pricing' },
    { text: 'Login', icon: '', path: '/login' }
  ];

  const handleMenuItemClick = (path: string, text: string) => {
    setMobileOpen(false);

    if (text === 'Logout') {
      logout();
    } else {
      router.push(path);
    }
  };

  const handleFilterOpenForFeedPage = () => {
    if (pathname === '/feed' && onFilterOpen) {
      onFilterOpen();
    }
  };
  
  const handleLogoutClick = () => {
    logout();
    router.push('/');
  };

  // Update this section to handle subpaths
  const findCurrentPage = () => {
    // First check for exact matches
    const exactMatch = menuItems.find(item => item.path === pathname);
    if (exactMatch) return exactMatch;
    // Then check for subpaths
    if (pathname.startsWith('/action-hub/')) {
      return menuItems.find(item => item.path === '/action-hub');
    }
    if (pathname.startsWith('/alerts-summary/')) {
      return menuItems.find(item => item.path === '/alerts-summary');
    }

    return null;
  };

  const currentPage = findCurrentPage();
  const currentPageName = currentPage?.text || '';
  const currentPageIcon = currentPage?.icon || '';

  return (
    <>
      {!isMobile && !isHomePage && (
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          onLogout={handleLogoutClick}
        />
      )}
      <Box sx={{
        display: 'flex',
        bgcolor: '#f5f5f5',
        px: { xs: 0, md: 0 },
        flexDirection: 'column',
        minHeight: '100vh',
        p: 0,
        m: 0,
        marginLeft: { md: isHomePage ? 0 : (isCollapsed ? '80px' : '250px') },
        width: { md: isHomePage ? '100%' : `calc(100% - ${isCollapsed ? '80px' : '250px'})` },
        transition: theme.transitions.create(['margin-left', 'width'], {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}>
        {/* Navbar Component */}
        <Navbar 
          isFeedPage={isFeedPage}
          isHomePage={isHomePage}
          handleDrawerToggle={handleDrawerToggle}
          handleFilterOpenForFeedPage={handleFilterOpenForFeedPage}
          setNotificationDrawerOpen={setNotificationDrawerOpen}
          unreadCount={unreadCount}
          isClient={isClient}
          currentPageName={currentPageName}
          currentPageIcon={currentPageIcon}
        />

        {/* Mobile Sidebar Component */}
        <MobileSidebar
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          menuItems={menuItems}
          handleMenuItemClick={handleMenuItemClick}
        />

        {/* Display Banner for authenticated users */}

        <Container component="main" sx={{ flex: 1, py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          {children}
        </Container>

        {/* Footer Component */}
        {isFooter && pathname !== '/feed' && pathname !== '/post-alert' && (
          <Footer />
        )}

        <NotificationDrawer
          open={notificationDrawerOpen}
          onClose={() => setNotificationDrawerOpen(false)}
          notifications={notifications}
          onNotificationUpdate={fetchNotifications}
        />

        {/* Add the BackToTop component */}
        <BackToTop />
      </Box>
    </>
  );
};

export default Layout;