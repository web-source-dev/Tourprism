import { NextRequest, NextResponse } from 'next/server';

// List of public paths that don't require authentication
const publicPaths = [
  '/login',
  '/signup',
  '/forgot-password',
  '/',
  '/feed',
  '/about',
  '/pricing',
  '/ambassadors',
  '/session-expired',
  '/not-found',
  '/feature',
  '/resources',
  '/insights',
  '/subscription',
  '/invite/accept',
  '/api/subscribers/unsubscribe' // Allow unsubscribe endpoint without authentication
  // Add other public paths here
];

// Admin paths that require admin role
const adminPaths = [
  '/admin',
  '/bulk',

];

// /bulk path is intentionally NOT added to public paths as it should be protected
// /profile path also requires authentication

// This function redirects individual alert pages to the appropriate route
// based on whether they are archived (expectedEnd date has passed) or not
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // If it's a public path or an API route, don't check authentication
  if (publicPaths.some(path => pathname.startsWith(path)) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Check for authentication token
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    // Redirect to login if not authenticated
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // For admin routes, check if the user has admin role
  if (adminPaths.some(path => pathname.startsWith(path))) {
    try {
      // This is a simple check - in production you would verify the JWT signature
      // and decode it properly with the secret key
      const user = JSON.parse(atob(token.split('.')[1]));
      
      // Allow any admin-type role to access admin routes
      const adminRoles = ['admin', 'manager', 'viewer', 'editor'];
      if (!adminRoles.includes(user.role)) {
        // Redirect to homepage if not an admin role
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      // If token is invalid, redirect to login
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // Check if the path is an individual alert page
  if (pathname.startsWith('/alert/')) {
    const alertId = pathname.split('/').pop();
    
    try {
      // Get the API URL from environment variable
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tourprism-backend.onrender.com';
      
      // Fetch the alert data to check its status
      const alertResponse = await fetch(`${apiUrl}/api/alerts/${alertId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (alertResponse.ok) {
        const alertData = await alertResponse.json();
        
        // Check if the alert has an expectedEnd date that has passed
        if (alertData.expectedEnd) {
          const currentDate = new Date();
          const endDate = new Date(alertData.expectedEnd);
          
          // If the end date has passed, the alert is archived
          const isArchived = endDate < currentDate;
          
          // If viewing an archived alert from the feed, redirect to archive view
          if (isArchived && request.headers.get('referer')?.includes('/feed')) {
            return NextResponse.redirect(new URL(`/archive?highlight=${alertId}`, request.url));
          }
          
          // If viewing a current alert from the archive, redirect to feed view
          if (!isArchived && request.headers.get('referer')?.includes('/archive')) {
            return NextResponse.redirect(new URL(`/feed?highlight=${alertId}`, request.url));
          }
        }
      }
    } catch (error) {
      console.error('Error in middleware:', error);
    }
  }
  
  return NextResponse.next();
}

// Only run middleware on these paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/alert/:path*',
    // Skip all static files
    '/((?!_next/static|_next/image|favicon.ico|images|uploads).*)',
  ],
}; 