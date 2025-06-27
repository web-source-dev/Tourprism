import React from 'react';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Button,
  useMediaQuery,
} from '@mui/material';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Image from 'next/image';

interface NavbarProps {
  isFeedPage: boolean;
  isHomePage: boolean;
  handleDrawerToggle: () => void;
  handleFilterOpenForFeedPage: () => void;
  setNotificationDrawerOpen: (open: boolean) => void;
  unreadCount: number;
  isClient: boolean;
  currentPageName: string;
  currentPageIcon: React.ReactNode;
  isHeader: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  isFeedPage,
  isHomePage,
  handleDrawerToggle,
  handleFilterOpenForFeedPage,
  setNotificationDrawerOpen,
  unreadCount,
  isClient,
  currentPageName,
  isHeader
}) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 600px)');
  const isSubscriptionPage = pathname === '/subscription';

  // Navigation links to show on desktop
  const navLinks = [
    { text: 'About', path: '/about' },
    { text: 'Feature', path: '/feature' },
    { text: 'Resources', path: '/resources' },
    { text: 'Pricing', path: '/pricing' }
  ];

  const loginUserNavLinks = [
    { text: 'Feed', path: '/feed' },
    { text: 'Action Hub', path: '/action-hub' },
    // { text: 'Insights', path: '/insights' },
    // { text: 'Subscription', path: '/subscription' },
    { text: 'Settings', path: '/settings' }
  ];

  return (
    <Box sx={{
      px: { xs: 0.5, sm: 0.5, md: 1 },
      py: 0,
      mx: { xs: 1, sm: 1, md: 3 },
      mt: isMobile ? 1.5 : 1.5,
      mb: isMobile ? 0 : 1.5,
      bgcolor: 'transparent',
      borderRadius: '8px',
      boxShadow: 'none',
      display: isHeader ? 'block' : 'none'
    }}>
      <Toolbar
        disableGutters
        sx={{
          justifyContent: 'space-between',
          minHeight: { xs: '40px', sm: '50px' },
          display: isHomePage || isMobile || isSubscriptionPage ? 'flex' : 'none',

        }}
      >
        {/* Left side of header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Mobile menu icon - only on mobile */}
          {isMobile && (
            <>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ color: 'black', mx: 0.2 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 3.33329C14 2.9651 13.7015 2.66663 13.3333 2.66663H2.66667C2.29848 2.66663 2 2.9651 2 3.33329C2 3.70148 2.29848 3.99996 2.66667 3.99996L13.3333 3.99996C13.7015 3.99996 14 3.70148 14 3.33329Z" fill="#616161" />
                <path d="M14 7.99996C14 7.63177 13.7015 7.33329 13.3333 7.33329L6.66667 7.33329C6.29848 7.33329 6 7.63177 6 7.99996C6 8.36815 6.29848 8.66663 6.66667 8.66663L13.3333 8.66663C13.7015 8.66663 14 8.36815 14 7.99996Z" fill="#616161" />
                <path d="M13.3333 12C13.7015 12 14 12.2984 14 12.6666C14 13.0348 13.7015 13.3333 13.3333 13.3333L2.66667 13.3333C2.29848 13.3333 2 13.0348 2 12.6666C2 12.2984 2.29848 12 2.66667 12L13.3333 12Z" fill="#616161" />
              </svg>
            </IconButton>
            </>
          )}

          {/* Logo */}
          {!isAuthenticated && !isFeedPage && (
            <Typography
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '20px',
                color: 'black',
                textDecoration: 'none'
              }}
            >
              <Image src="/t.png" alt="tourprism" style={{ marginRight: isMobile ? '4px' : 0 ,borderRadius: 6 }} width={32} height={32} />
              <Typography sx={{ fontSize: '18px', ml: 0.5, fontWeight: '550', color: 'black', display: { xs: 'none', md: 'block' } }}>tourprism</Typography>
            </Typography>
          )}

          {/* Page Title and Icon for mobile */}
          {!isHomePage && (
            <Typography variant="h6" sx={{ fontWeight: '600' }}>
              {currentPageName}
            </Typography>
          )}
        </Box>

        {/* Desktop navigation - center of header */}
        <Box sx={{
          display: { xs: 'none', sm: (isAuthenticated || (!isHomePage && !isSubscriptionPage) || !isHeader) ? 'none' : 'flex' },
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          gap: 3
        }}>
          {isAuthenticated ? loginUserNavLinks.map((link) => (
            <Link key={link.text} href={link.path}>
              {link.text}
            </Link>
          )) : navLinks.map((link) => (
            <Link key={link.text} href={link.path}>
              {link.text}
            </Link>
          ))}
        </Box>

        {/* Right side of header */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Login button for non-logged in users */}
          {!isAuthenticated && !isFeedPage && (
            <Button
              variant="contained"
              sx={{
                bgcolor: '#EBEBEC',
                borderRadius: 10,
                color: '#444',
                boxShadow: 'none',
                px: 3,
                '&:hover': {
                  bgcolor: '#EBEBEC',
                  boxShadow: 'none'
                }
              }}
              onClick={() => router.push('/login')}
            >
              Login
            </Button>
          )}
          {!isAuthenticated && isFeedPage && (
            <Box display="none">
              <IconButton onClick={handleFilterOpenForFeedPage}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 1.04167C7.58375 1.04167 5.625 3.00042 5.625 5.41667C5.625 7.83291 7.58375 9.79167 10 9.79167C12.4162 9.79167 14.375 7.83291 14.375 5.41667C14.375 3.00042 12.4162 1.04167 10 1.04167ZM6.875 5.41667C6.875 3.69078 8.27411 2.29167 10 2.29167C11.7259 2.29167 13.125 3.69078 13.125 5.41667C13.125 7.14256 11.7259 8.54167 10 8.54167C8.27411 8.54167 6.875 7.14256 6.875 5.41667Z" fill="#616161" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.1907 12.566C15.0552 12.4895 14.9355 12.422 14.8386 12.3643C11.8769 10.6008 8.12341 10.6008 5.1617 12.3643C5.06477 12.422 4.94504 12.4896 4.80949 12.5661C4.21548 12.9012 3.31755 13.4078 2.70241 14.0099C2.31769 14.3864 1.95215 14.8827 1.88569 15.4906C1.81502 16.1372 2.09707 16.7439 2.66292 17.283C3.63913 18.213 4.81061 18.9583 6.32587 18.9583H13.6744C15.1897 18.9583 16.3612 18.213 17.3374 17.283C17.9032 16.7439 18.1853 16.1372 18.1146 15.4906C18.0481 14.8827 17.6826 14.3864 17.2979 14.0099C16.6827 13.4078 15.7847 12.9011 15.1907 12.566ZM5.80122 13.4383C8.36886 11.9094 11.6314 11.9094 14.1991 13.4383C14.339 13.5216 14.4923 13.6086 14.6529 13.6997C15.2467 14.0366 15.9401 14.43 16.4235 14.9032C16.7236 15.1969 16.8515 15.4392 16.872 15.6265C16.8883 15.7751 16.8507 16.0202 16.4752 16.378C15.6119 17.2003 14.7348 17.7083 13.6744 17.7083H6.32587C5.2655 17.7083 4.38835 17.2003 3.52514 16.378C3.14962 16.0202 3.11204 15.7751 3.12829 15.6265C3.14875 15.4392 3.27668 15.1969 3.57679 14.9032C4.06019 14.43 4.75355 14.0366 5.34739 13.6997C5.50794 13.6086 5.66133 13.5216 5.80122 13.4383Z" fill="#616161" />
                </svg>
              </IconButton>
              <IconButton onClick={handleFilterOpenForFeedPage}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.33301 1.04195C8.67819 1.04195 8.95801 1.32177 8.95801 1.66695L8.95801 6.66695C8.95801 7.01212 8.67819 7.29195 8.33301 7.29195C7.98783 7.29195 7.70801 7.01212 7.70801 6.66695L7.70801 4.79197L3.33303 4.79215C2.98786 4.79216 2.70802 4.51235 2.70801 4.16718C2.70799 3.822 2.9878 3.54216 3.33298 3.54215L7.70801 3.54197L7.70801 1.66695C7.70801 1.32177 7.98783 1.04195 8.33301 1.04195Z" fill="#616161" />
                  <path d="M10.208 4.16695C10.208 3.82177 10.4878 3.54195 10.833 3.54195L16.6663 3.54195C17.0115 3.54195 17.2913 3.82177 17.2913 4.16695C17.2913 4.51213 17.0115 4.79195 16.6663 4.79195L10.833 4.79195C10.4878 4.79195 10.208 4.51212 10.208 4.16695Z" fill="#616161" />
                  <path d="M13.958 7.50028C13.958 7.1551 13.6782 6.87528 13.333 6.87528C12.9878 6.87528 12.708 7.1551 12.708 7.50028L12.708 12.5003C12.708 12.8455 12.9878 13.1253 13.333 13.1253C13.6782 13.1253 13.958 12.8455 13.958 12.5003L13.958 10.6249L16.6663 10.6251C17.0115 10.6251 17.2913 10.3453 17.2913 10.0001C17.2914 9.65494 17.0116 9.3751 16.6664 9.37508L13.958 9.37491V7.50028Z" fill="#616161" />
                  <path d="M10.6247 13.3336C10.6247 12.9884 10.3449 12.7086 9.99967 12.7086C9.6545 12.7086 9.37467 12.9884 9.37467 13.3336V18.3336C9.37467 18.6788 9.6545 18.9586 9.99967 18.9586C10.3449 18.9586 10.6247 18.6788 10.6247 18.3336V16.4586L16.6663 16.4586C17.0115 16.4586 17.2913 16.1788 17.2913 15.8336C17.2913 15.4884 17.0115 15.2086 16.6663 15.2086L10.6247 15.2086V13.3336Z" fill="#616161" />
                  <path d="M3.33302 10.6255L10.833 10.6253C11.1782 10.6253 11.458 10.3454 11.458 10.0003C11.458 9.65509 11.1782 9.37527 10.833 9.37528L3.33299 9.37548C2.98781 9.37549 2.708 9.65532 2.70801 10.0005C2.70802 10.3457 2.98785 10.6255 3.33302 10.6255Z" fill="#616161" />
                  <path d="M3.33304 16.4588L7.49971 16.4586C7.84488 16.4586 8.12469 16.1788 8.12467 15.8336C8.12466 15.4884 7.84482 15.2086 7.49964 15.2086L3.33298 15.2088C2.9878 15.2088 2.70799 15.4887 2.70801 15.8338C2.70802 16.179 2.98786 16.4588 3.33304 16.4588Z" fill="#616161" />
                </svg>
              </IconButton>
            </Box>
          )}

          {/* Notification and filter icons for logged in users */}
          {isAuthenticated && (
            <>
              <IconButton
                onClick={() => setNotificationDrawerOpen(true)}
                sx={{
                  color: 'black',
                  display: 'none'
                }}
              >
                <Badge badgeContent={isClient ? unreadCount : 0} color="error">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.7738 1.35363C9.14472 1.11082 9.59748 1.04169 10 1.04169C10.4025 1.04169 10.8553 1.11082 11.2262 1.35363C11.6377 1.62301 11.875 2.05904 11.875 2.60419C11.875 2.991 11.7573 3.39117 11.5658 3.73695C14.1929 4.40545 16.1768 6.71781 16.3255 9.54302C16.3331 9.6868 16.3387 9.82447 16.3441 9.95711C16.3626 10.4084 16.3787 10.8013 16.4604 11.1777C16.5581 11.6276 16.7389 11.9813 17.1066 12.257C17.7477 12.7379 18.125 13.4925 18.125 14.2939C18.125 15.445 17.219 16.4584 16 16.4584H13.0625C12.7729 17.8848 11.5118 18.9584 10 18.9584C8.48815 18.9584 7.22706 17.8848 6.93751 16.4584H4C2.78099 16.4584 1.875 15.445 1.875 14.2939C1.875 13.4925 2.25232 12.7379 2.89344 12.257C3.26108 11.9813 3.44187 11.6276 3.53958 11.1777C3.62134 10.8013 3.63741 10.4084 3.65588 9.9571C3.6613 9.82448 3.66694 9.68679 3.6745 9.54302C3.8232 6.71781 5.80714 4.40545 8.43423 3.73695C8.24271 3.39117 8.125 2.991 8.125 2.60419C8.125 2.05904 8.3623 1.62301 8.7738 1.35363ZM8.23169 16.4584C8.48909 17.1866 9.18361 17.7084 10 17.7084C10.8164 17.7084 11.5109 17.1866 11.7683 16.4584H8.23169ZM16 15.2084C16.478 15.2084 16.875 14.8064 16.875 14.2939C16.875 13.886 16.6829 13.5018 16.3566 13.257C15.6848 12.7532 15.3811 12.098 15.2389 11.443C15.1317 10.9493 15.1104 10.4118 15.0919 9.94517C15.0873 9.82803 15.0828 9.71512 15.0772 9.60872C14.9351 6.90834 12.7041 4.79169 10 4.79169C7.29589 4.79169 5.0649 6.90834 4.92278 9.60872C4.91717 9.71519 4.91271 9.82795 4.90807 9.94517C4.8896 10.4118 4.86833 10.9493 4.7611 11.443C4.61886 12.098 4.31517 12.7532 3.64344 13.257C3.31708 13.5018 3.125 13.886 3.125 14.2939C3.125 14.8064 3.52201 15.2084 4 15.2084H16ZM10.3823 3.27148C10.2206 3.48904 10.0724 3.54169 10 3.54169C9.92757 3.54169 9.77944 3.48904 9.61773 3.27148C9.46066 3.06017 9.375 2.79774 9.375 2.60419C9.375 2.51757 9.392 2.47523 9.40137 2.45742C9.41025 2.44055 9.42483 2.42147 9.45843 2.39947C9.53992 2.34613 9.71216 2.29169 10 2.29169C10.2878 2.29169 10.4601 2.34613 10.5416 2.39947C10.5752 2.42147 10.5898 2.44055 10.5986 2.45742C10.608 2.47523 10.625 2.51757 10.625 2.60419C10.625 2.79774 10.5393 3.06017 10.3823 3.27148Z" fill="#616161" />
                  </svg>
                </Badge>
              </IconButton>
              {isFeedPage && (
                <IconButton
                  onClick={handleFilterOpenForFeedPage}
                  sx={{
                    color: 'black',
                    display: 'none'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.33301 1.04205C8.67819 1.04205 8.95801 1.32188 8.95801 1.66705L8.95801 6.66705C8.95801 7.01223 8.67819 7.29205 8.33301 7.29205C7.98783 7.29205 7.70801 7.01223 7.70801 6.66705L7.70801 4.79208L3.33303 4.79226C2.98786 4.79227 2.70802 4.51246 2.70801 4.16728C2.70799 3.8221 2.9878 3.54227 3.33298 3.54226L7.70801 3.54208L7.70801 1.66705C7.70801 1.32188 7.98783 1.04205 8.33301 1.04205Z" fill="#616161" />
                    <path d="M10.208 4.16705C10.208 3.82188 10.4878 3.54205 10.833 3.54205L16.6663 3.54205C17.0115 3.54205 17.2913 3.82188 17.2913 4.16705C17.2913 4.51223 17.0115 4.79195 16.6663 4.79195L10.833 4.79195C10.4878 4.79195 10.208 4.51212 10.208 4.16695Z" fill="#616161" />
                    <path d="M13.958 7.50039C13.958 7.15521 13.6782 6.87539 13.333 6.87539C12.9878 6.87539 12.708 7.15521 12.708 7.50039L12.708 12.5004C12.708 12.8456 12.9878 13.1254 13.333 13.1254C13.6782 13.1254 13.958 12.8455 13.958 12.5003L13.958 10.625L16.6663 10.6252C17.0115 10.6252 17.2913 10.3454 17.2913 10.0002C17.2914 9.65504 17.0116 9.37521 16.6664 9.37518L13.958 9.37502V7.50039Z" fill="#616161" />
                    <path d="M10.6247 13.3337C10.6247 12.9885 10.3449 12.7087 9.99967 12.7087C9.6545 12.7087 9.37467 12.9885 9.37467 13.3337V18.3337C9.37467 18.6789 9.6545 18.9587 9.99967 18.9587C10.3449 18.9587 10.6247 18.6789 10.6247 18.3337V16.4587L16.6663 16.4587C17.0115 16.4587 17.2913 16.1789 17.2913 15.8337C17.2913 15.4885 17.0115 15.2087 16.6663 15.2087L10.6247 15.2087V13.3337Z" fill="#616161" />
                    <path d="M3.33302 10.6256L10.833 10.6254C11.1782 10.6254 11.458 10.3455 11.458 10.0004C11.458 9.65519 11.1782 9.37538 10.833 9.37539L3.33299 9.37559C2.98781 9.3756 2.708 9.65543 2.70801 10.0006C2.70802 10.3458 2.98785 10.6256 3.33302 10.6256Z" fill="#616161" />
                    <path d="M3.33304 16.4589L7.49971 16.4587C7.84488 16.4587 8.12469 16.1789 8.12467 15.8337C8.12466 15.4885 7.84482 15.2087 7.49964 15.2087L3.33298 15.2089C2.9878 15.2089 2.70799 15.4888 2.70801 15.834C2.70802 16.1791 2.98786 16.4589 3.33304 16.4589Z" fill="#616161" />
                  </svg>
                </IconButton>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </Box>
  );
};

export default Navbar; 