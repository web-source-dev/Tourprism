'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Move publicRoutes outside the component to avoid recreating it on each render
// Keep this in sync with the list in AuthContext.tsx
const publicRoutes = [
  '/', 
  '/login', 
  '/signup', 
  '/forgot-password', 
  '/feed',
  '/about',
  '/pricing',
  '/ambassadors',
  '/insights',
  '/subscription',
  '/feature',
  '/resources',
  '/not-found',
];

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    // Don't redirect if on a public route
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
    
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Show nothing while checking authentication on protected routes
  if (isLoading && !publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  // Always show content for public routes, otherwise only if authenticated
  const shouldShowContent = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) || isAuthenticated;
  return shouldShowContent ? <>{children}</> : null;
};

export default ProtectedRoute; 