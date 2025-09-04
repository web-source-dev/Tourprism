'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Skeleton,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert as MuiAlert,
  DialogActions,
  Container,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import FilterDrawer from '@/components/FilterDrawer';
import { fetchAlerts, getUserProfile, FetchAlertsParams } from '@/services/api';
import { followAlert } from '@/services/alertActions';
import { Alert as AlertType, FilterOptions, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/ui/toast';
import UnlockFeaturesCard from '@/components/UnlockFeaturesCard';
import { formatStandardDateTime } from '@/utils/dateFormat';
import ImpactScorePopup from '@/components/ImpactScorePopup';

// Extend the existing User interface with the new properties
interface ExtendedUser extends User {
  isProfileComplete?: boolean;
  profileCompletionPercentage?: number;
}


// Add this function after the formatDateForDisplay function
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();

  // Get time difference in seconds
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
  const isInFuture = diffInSeconds > 0;
  const absDiff = Math.abs(diffInSeconds);

  // Format based on how far in the future/past
  if (absDiff < 60) {
    // Less than a minute
    return isInFuture ? `${absDiff}s` : `${absDiff}s ago`;
  } else if (absDiff < 3600) {
    // Less than an hour
    const mins = Math.floor(absDiff / 60);
    return isInFuture ? `${mins}m` : `${mins}m ago`;
  } else if (absDiff < 86400) {
    // Less than a day
    const hours = Math.floor(absDiff / 3600);
    return isInFuture ? `${hours}h` : `${hours}h ago`;
  } else if (absDiff < 2592000) {
    // Less than 30 days
    const days = Math.floor(absDiff / 86400);
    return isInFuture ? `${days}d` : `${days}d ago`;
  } else {
    const days = Math.floor(absDiff / 86400);
    return isInFuture ? `${days}d` : `${days}d ago`;
  }
};

// Add this function after the formatRelativeTime function and before the sortAlertsByFilter function

// Calculate impact score for each alert based on multiple factors
const calculateImpactScore = (alert: AlertType): number => {
  const now = new Date();
  
  // Check if alert has ended - exclude from results
  const endDate = alert.expectedEnd ? new Date(alert.expectedEnd) : null;
  if (endDate && endDate < now) {
    return -1; // Negative score for expired alerts
  }
  
  let score = 0;
  
  // 1. Urgency (x4) - Based on time until start
  let urgencyScore = 0;
  const startDate = alert.expectedStart ? new Date(alert.expectedStart) : null;
  
  if (startDate) {
    const hoursToStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (startDate <= now) {
      // Already started
      urgencyScore = 0;
    } else if (hoursToStart <= 24) {
      urgencyScore = 3; // <= 24 hours
    } else if (hoursToStart <= 72) {
      urgencyScore = 2; // 1-3 days
    } else if (hoursToStart <= 168) {
      urgencyScore = 1; // 4-7 days
    } else {
      urgencyScore = 0; // > 7 days
    }
  } else {
    // No start date, treat as medium urgency
    urgencyScore = 1;
  }
  score += urgencyScore * 4;
  
  // 2. Duration (x3) - Based on event duration
  let durationScore = 0;
  if (startDate && endDate) {
    const durationInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (durationInDays > 3) {
      durationScore = 3;
    } else if (durationInDays >= 2) {
      durationScore = 2;
    } else {
      durationScore = 1;
    }
  } else {
    // Default duration score if dates not available
    durationScore = 1;
  }
  score += durationScore * 3;
  
  // 3. Severity (x2) - Based on impact level
  let severityScore = 0;
  const impact = alert.impact || '';
  
  // Using string check to avoid type errors
  if (impact.includes('High') || impact.includes('High')) {
    severityScore = 3;
  } else if (impact.includes('Moderate') || impact.includes('Medium')) {
    severityScore = 2;
  } else {
    severityScore = 1; // Low, Low, or undefined
  }
  score += severityScore * 2;
  
  // 4. Recency (x1) - Based on when alert was posted
  let recencyScore = 0;
  const createdAt = new Date(alert.createdAt);
  const daysFromCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysFromCreation <= 1) {
    recencyScore = 3; // Posted <= 24h
  } else if (daysFromCreation <= 3) {
    recencyScore = 2; // 2-3 days ago
  } else {
    recencyScore = 1; // > 3 days ago
  }
  score += recencyScore * 1;
  
  return score;
};

// Replace the existing sortAlertsByFilter function with this updated version
const sortAlertsByFilter = (alerts: AlertType[], sortBy: string) => {
  if (sortBy === 'impact_score') {
    // First filter out expired alerts
    return [...alerts]
      .filter(alert => {
        const endDate = alert.expectedEnd ? new Date(alert.expectedEnd) : null;
        const now = new Date();
        return !endDate || endDate >= now;
      })
      .sort((a, b) => {
        // First compare by impact score
        const scoreA = calculateImpactScore(a);
        const scoreB = calculateImpactScore(b);
        
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Higher score first
        }
        
        // If scores are equal, sort by start date (ascending)
        const startDateA = a.expectedStart ? new Date(a.expectedStart).getTime() : Infinity;
        const startDateB = b.expectedStart ? new Date(b.expectedStart).getTime() : Infinity;
        
        if (startDateA !== startDateB) {
          return startDateA - startDateB;
        }
        
        // If start dates are equal, sort by posted time (descending)
        const createdAtA = new Date(a.createdAt).getTime();
        const createdAtB = new Date(b.createdAt).getTime();
        return createdAtB - createdAtA;
      });
  } else if (sortBy === 'latest') {
    return [...alerts].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (sortBy === 'highest_impact') {
    const impactOrder = { 'High': 3, 'Moderate': 2, 'Low': 1 };
    return [...alerts].sort((a, b) => {
      const impactA = impactOrder[a.impact as keyof typeof impactOrder] || 0;
      const impactB = impactOrder[b.impact as keyof typeof impactOrder] || 0;
      
      // If impact is the same, sort by creation date
      if (impactB === impactA) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      
      return impactB - impactA;
    });
  }
  // Default to latest
  return [...alerts].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export default function Feed() {
  const router = useRouter();
  const { isAuthenticated, isCollaboratorViewer ,isAdmin } = useAuth();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [lowAccuracyWarning, setLowAccuracyWarning] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<ExtendedUser | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [operatingRegionAlerts, setOperatingRegionAlerts] = useState<AlertType[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'impact_score',
    alertCategory: [],
    timeRange: 7,
    distance: 20,
    impactLevel: [],
    customDateFrom: new Date(),
    customDateTo: new Date(),
  });
  // Add state variables for tracking card visibility
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  // Add state for tracking dismissed banner positions
  const [dismissedBanners, setDismissedBanners] = useState<{
    firstBanner: boolean;
    secondBanner: boolean;
  }>({ firstBanner: false, secondBanner: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { showToast } = useToast();

  const isViewOnly = () => {
    return isCollaboratorViewer;
  };

  // Socket.io reference
  const socketRef = useRef<Socket | null>(null);

  // Fetch user profile if authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated) {
        try {
          const { user } = await getUserProfile();

          // Calculate profile completion status
          const profileCompletion = {
            accountCreated: true, // Always true if the user exists
            personalizedContent: false,
            weeklyForecast: false,
            teamMembers: false
          };

          // Step 2 (50%): Check if user has completed personal and company details
          if (user?.firstName &&
            user?.lastName &&
            user?.company?.name &&
            user?.company?.MainOperatingRegions &&
            user.company.MainOperatingRegions.length > 0) {
            profileCompletion.personalizedContent = true;
          }

          // Step 3 (75%): Check if user has set preferences for weekly disruption forecast reports
          if (user?.preferences?.AlertSummaries?.weekly === true) {
            profileCompletion.weeklyForecast = true;
          }

          // Calculate the percentage (25% for each completed feature)
          const completedCount = Object.values(profileCompletion).filter(Boolean).length;
          const calculatedProgress = Math.floor((completedCount / 4) * 100);

          // Set user with profile completion status
          setUserProfile({
            ...user,
            profileCompletionPercentage: calculatedProgress,
            isProfileComplete: completedCount === 4 // Only complete when all 4 steps are done
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
    console.log('Fetching user profile',setSelectedCity,setSelectedLocation);

        } finally {
          setProfileLoaded(true);
        }
      } else {
        setProfileLoaded(true);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated]);

  // Function to fetch alerts based on operating regions
  const fetchOperatingRegionAlerts = useCallback(async () => {
    // Use optional chaining with nullish coalescing to handle possibly undefined array
    const operatingRegions = userProfile?.company?.MainOperatingRegions ?? [];
    if (operatingRegions.length === 0) return [];

    setLoading(true);
    let combinedAlerts: AlertType[] = [];

    try {
      // For each operating region, fetch alerts
      for (const region of operatingRegions) {
        const params: Record<string, unknown> = {
          page: 1,
          limit: isAuthenticated ? 20 : 15, // <-- Set limit based on auth
          sortBy: filters.sortBy,
          latitude: region.latitude,
          longitude: region.longitude,
          distance: filters.distance || 20
        };

        if (filters.timeRange > 0) {
          const now = new Date();
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + filters.timeRange);

          params.startDate = now.toISOString();
          params.endDate = futureDate.toISOString();
        } else if (filters.timeRange === -1 && filters.customDateFrom && filters.customDateTo) {
          // Handle custom date range
          params.startDate = new Date(filters.customDateFrom).toISOString();
          params.endDate = new Date(filters.customDateTo).toISOString();
        }

        if (filters.alertCategory && filters.alertCategory.length > 0) {
          params.alertCategory = filters.alertCategory;
        }

        if (filters.impactLevel && filters.impactLevel.length > 0) {
          params.impact = filters.impactLevel;
        }

        console.log(`Fetching alerts for operating region ${region.name} with params:`, params);
        const response = await fetchAlerts(params);
        combinedAlerts = [...combinedAlerts, ...response.alerts];
      }

      // Remove duplicates
      combinedAlerts = Array.from(
        new Map(combinedAlerts.map(alert => [alert._id, alert])).values()
      );

      // Sort alerts with priority for followed alerts and then by filter criteria
      combinedAlerts.sort((a, b) => {
        if (filters.sortBy === 'impact_score') {
          // Get scores
          const scoreA = calculateImpactScore(a);
          const scoreB = calculateImpactScore(b);
          
          // If scores differ, sort by score
          if (scoreA !== scoreB) {
            return scoreB - scoreA; // Higher score first
          }
          
          // If scores are the same, followed alerts take precedence
          if (a.isFollowing && !b.isFollowing) return -1;
          if (!a.isFollowing && b.isFollowing) return 1;
          
          // For alerts with same score and follow status, sort by start date
          const startDateA = a.expectedStart ? new Date(a.expectedStart).getTime() : Infinity;
          const startDateB = b.expectedStart ? new Date(b.expectedStart).getTime() : Infinity;
          return startDateA - startDateB;
        } else {
          // First priority: followed alerts go to the top
          if (a.isFollowing && !b.isFollowing) return -1;
          if (!a.isFollowing && b.isFollowing) return 1;

          // Second priority: maintain the sort order within each group using the shared sorting function
          return sortAlertsByFilter([a, b], filters.sortBy)[0] === a ? -1 : 1;
        }
      });

      setOperatingRegionAlerts(combinedAlerts);
      return combinedAlerts;
    } catch (error) {
      console.error('Error fetching operating region alerts:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userProfile, filters ,isAuthenticated]);

  // Define the fetchLocationAlerts function with useCallback to avoid recreation on each render
  const fetchLocationAlerts = useCallback(async (cityName: string = "Edinburgh", coordinates: { latitude: number; longitude: number } | null = null) => {
    setLoading(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Fetch alerts timeout reached, stopping loading state');
      setLoading(false);
      // If we have no alerts, show at least default ones for Edinburgh
      if (alerts.length === 0) {
        console.log('No alerts loaded, setting default city to Edinburgh');
        setCity('Edinburgh');
        setCoords({ latitude: 55.9533, longitude: -3.1883 });
      }
    }, 10000); // 10 second timeout
    
    try {
      // Check if we have operating regions
      const operatingRegions = userProfile?.company?.MainOperatingRegions ?? [];
      const hasOperatingRegions = isAuthenticated && operatingRegions.length > 0;

      // Skip default Edinburgh location if we have operating regions and the current location is Edinburgh
      const isDefaultEdinburgh =
        cityName === "Edinburgh" &&
        coordinates?.latitude === 55.9533 &&
        coordinates?.longitude === -3.1883;

      const skipDefaultLocation = hasOperatingRegions && isDefaultEdinburgh;

      // First check if we need to fetch operating region alerts
      let operatingRegionsResults: AlertType[] = [];
      if (hasOperatingRegions) {
        operatingRegionsResults = await fetchOperatingRegionAlerts();
      }

      // Only fetch location-based alerts if we're not skipping the default location
      let locationBasedAlerts: AlertType[] = [];
      if (!skipDefaultLocation) {
        const params: Record<string, unknown> = {
          page: 1,
          limit: isAuthenticated ? 20 : 15, // <-- Set limit based on auth
          sortBy: filters.sortBy,
        };
        if (filters.timeRange > 0) {
          const now = new Date();
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + filters.timeRange);

          params.startDate = now.toISOString();
          params.endDate = futureDate.toISOString();
        } else if (filters.timeRange === -1 && filters.customDateFrom && filters.customDateTo) {
          // Handle custom date range
          params.startDate = new Date(filters.customDateFrom).toISOString();
          params.endDate = new Date(filters.customDateTo).toISOString();
        }

        if (filters.alertCategory && filters.alertCategory.length > 0) {
          params.alertCategory = filters.alertCategory;
        }

        if (filters.impactLevel && filters.impactLevel.length > 0) {
          params.impact = filters.impactLevel;
        }

        if (coordinates) {
          params.latitude = coordinates.latitude;
          params.longitude = coordinates.longitude;
          if (filters.distance && filters.distance > 0) {
            params.distance = filters.distance;
          }
        } else if (cityName) {
          params.city = cityName;
        }

        console.log('Fetching regular alerts with params:', params);
        const response = await fetchAlerts(params);

        locationBasedAlerts = Array.from(
          new Map(response.alerts.map(alert => [alert._id, alert])).values()
        );

        if (locationBasedAlerts.length < response.alerts.length) {
          console.warn(`Filtered out ${response.alerts.length - locationBasedAlerts.length} duplicate alert(s) in initial load`);
        }
        const backendTotalCount = response.totalCount;

        // STEP 1: Organize alerts into their respective categories
        // Get followed alerts from both sources
        const followedAlerts = [
          ...operatingRegionsResults.filter(alert => alert.isFollowing),
          ...locationBasedAlerts.filter(alert => alert.isFollowing)
        ];

        // Get non-followed operating region alerts
        const nonFollowedOperatingRegionAlerts = operatingRegionsResults.filter(alert => !alert.isFollowing);

        // Get normal location alerts (not followed, not from operating regions)
        const normalAlerts = locationBasedAlerts.filter(alert => !alert.isFollowing);

        // STEP 2: Sort each category internally according to the filter criteria
        const sortedFollowedAlerts = sortAlertsByFilter(followedAlerts, filters.sortBy);
        const sortedOperatingRegionAlerts = sortAlertsByFilter(nonFollowedOperatingRegionAlerts, filters.sortBy);
        const sortedNormalAlerts = sortAlertsByFilter(normalAlerts, filters.sortBy);

        // STEP 3: Combine all categories in the correct order while removing duplicates
        const sortedAllAlerts: AlertType[] = [];
        const addedIds = new Set<string>();

        // Modified approach: If sorting by impact_score, merge all alerts and sort by score
        if (filters.sortBy === 'impact_score') {
          // Combine all alerts
          const allAlerts = [...followedAlerts, ...nonFollowedOperatingRegionAlerts, ...normalAlerts];
          
          // Sort by impact score, but give a small boost to followed alerts with same score
          const scoredAlerts = allAlerts
            .filter(alert => {
              const endDate = alert.expectedEnd ? new Date(alert.expectedEnd) : null;
              const now = new Date();
              return !endDate || endDate >= now;
            })
            .map(alert => {
              let score = calculateImpactScore(alert);
              // Give a tiny boost to followed alerts with the same score (0.1)
              if (alert.isFollowing) score += 0.1;
              // Give a smaller boost to operating region alerts (0.05)
              const isOperatingRegion = operatingRegionAlerts.some(a => a._id === alert._id);
              if (isOperatingRegion && !alert.isFollowing) score += 0.05;
              return { alert, score };
            })
            .sort((a, b) => b.score - a.score); // Sort by score descending
          
          // Extract alerts and respect uniqueness
          scoredAlerts.forEach(({ alert }) => {
            if (!addedIds.has(alert._id)) {
              sortedAllAlerts.push(alert);
              addedIds.add(alert._id);
            }
          });
        } else {
          // Original approach for other sort criteria
          // Add followed alerts first (highest priority)
          sortedFollowedAlerts.forEach(alert => {
            if (!addedIds.has(alert._id)) {
              sortedAllAlerts.push(alert);
              addedIds.add(alert._id);
            }
          });

          // Add operating region alerts second (medium priority)
          sortedOperatingRegionAlerts.forEach(alert => {
            if (!addedIds.has(alert._id)) {
              sortedAllAlerts.push(alert);
              addedIds.add(alert._id);
            }
          });

          // Add normal alerts last (lowest priority)
          sortedNormalAlerts.forEach(alert => {
            if (!addedIds.has(alert._id)) {
              sortedAllAlerts.push(alert);
              addedIds.add(alert._id);
            }
          });
        }

        // Apply the limit for non-authenticated users
        if (!isAuthenticated) {
          setAlerts(sortedAllAlerts.slice(0, 20));
        } else {
          setAlerts(sortedAllAlerts);
        }

        // Use backend totalCount for correct pagination
        setTotalCount(backendTotalCount || totalCount || 0);
        setHasMore(isAuthenticated && sortedAllAlerts.length < (backendTotalCount || totalCount || 0));
        setPage(1);
        console.log('sortedAllAlerts', page,isLoadingMore);
      }
      
      // Clear the timeout since we completed successfully
      clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      showToast('Failed to fetch alerts', 'error');
      setAlerts([]);
      setTotalCount(0);
      setHasMore(false);
      
      // Clear the timeout since we handled the error
      clearTimeout(timeoutId);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters, userProfile, fetchOperatingRegionAlerts, showToast, totalCount, alerts.length]);

  // Socket.io connection setup
  useEffect(() => {
    // Connect to Socket.io server
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tourprism-backend-w5c1.onrender.com';
    socketRef.current = io(SOCKET_URL);

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.io server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    // Alert events
    socketRef.current.on('alert:created', (data) => {
      console.log('New alert created:', data);

      // Check if we need to refresh operating region alerts
      const operatingRegions = userProfile?.company?.MainOperatingRegions ?? [];
      const hasOperatingRegions = isAuthenticated && operatingRegions.length > 0;

      if (hasOperatingRegions) {
        // Refresh operating region alerts
        fetchOperatingRegionAlerts().then(() => {
          if (city && coords) {
            fetchLocationAlerts(city, coords);
          }
        });
      } else if (city && coords) {
        fetchLocationAlerts(city, coords);
      }

      showToast('A new alert has been added', 'success');
    });

    // Similar updates for other socket events that change alerts
    socketRef.current.on('alert:updated', (data) => {
      console.log('Alert updated:', data);

      // Check if this alert is in our operating region alerts
      const isInOperatingRegions = operatingRegionAlerts.some(alert => alert._id === data.alertId);

      if (isInOperatingRegions) {
        // Refresh operating region alerts
        fetchOperatingRegionAlerts().then(() => {
          // Update the current alert in the main alerts list
          setAlerts(prevAlerts =>
            prevAlerts.map(alert =>
              alert._id === data.alertId
                ? { ...alert, ...data.alert }
                : alert
            )
          );
        });
      } else {
        // Just update this alert in the main list
        setAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert._id === data.alertId
              ? { ...alert, ...data.alert }
              : alert
          )
        );
      }

      showToast('An alert has been updated', 'success');
    });

    socketRef.current.on('alerts:bulk-created', (data) => {
      console.log('Bulk alerts created:', data);

      // Check if we need to refresh operating region alerts
      const operatingRegions = userProfile?.company?.MainOperatingRegions ?? [];
      const hasOperatingRegions = isAuthenticated && operatingRegions.length > 0;

      if (hasOperatingRegions) {
        // Refresh operating region alerts
        fetchOperatingRegionAlerts().then(() => {
          if (city && coords) {
            fetchLocationAlerts(city, coords);
          }
        });
      } else if (city && coords) {
        fetchLocationAlerts(city, coords);
      }

      showToast(`${data.count} new alerts have been added`, 'success');
    });

    // Add these event handlers back after the 'alert:updated' handler
    socketRef.current.on('alert:deleted', (data) => {
      console.log('Alert deleted:', data);

      // Check if this alert is in our operating region alerts
      const isInOperatingRegions = operatingRegionAlerts.some(alert => alert._id === data.alertId);

      if (isInOperatingRegions) {
        // Refresh operating region alerts
        fetchOperatingRegionAlerts().then(() => {
          // Remove the alert from the main list
          setAlerts(prevAlerts => prevAlerts.filter(alert => alert._id !== data.alertId));
        });
      } else {
        // Just remove from main list
        setAlerts(prevAlerts => prevAlerts.filter(alert => alert._id !== data.alertId));
      }

      showToast('An alert has been removed', 'success');
    });

    socketRef.current.on('alert:followed', (data) => {
      console.log('Alert follow status changed:', data);
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert._id === data.alertId ?
            {
              ...alert,
              numberOfFollows: data.numberOfFollows,
              isFollowing: data.following
            } :
            alert
        )
      );

      // Also update operating region alerts if this is in that list
      const isInOperatingRegions = operatingRegionAlerts.some(alert => alert._id === data.alertId);
      if (isInOperatingRegions) {
        setOperatingRegionAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert._id === data.alertId ?
              {
                ...alert,
                numberOfFollows: data.numberOfFollows,
                isFollowing: data.following
              } :
              alert
          )
        );
      }
    });

    // Add socket event handler for flag alerts
    socketRef.current.on('alert:flagged', (data) => {
      console.log('Alert flag status changed:', data);
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert._id === data.alertId ?
            {
              ...alert,
              flagged: data.flagged
            } :
            alert
        )
      );

      // Also update operating region alerts if this is in that list
      const isInOperatingRegions = operatingRegionAlerts.some(alert => alert._id === data.alertId);
      if (isInOperatingRegions) {
        setOperatingRegionAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert._id === data.alertId ?
              {
                ...alert,
                flagged: data.flagged
              } :
              alert
          )
        );
      }
    });

    // Other socket event handlers...

    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [city, coords, fetchLocationAlerts, isAuthenticated, userProfile, operatingRegionAlerts, fetchOperatingRegionAlerts, showToast]);

  // Load card visibility from localStorage
  useEffect(() => {
    const hideBanner1 = localStorage.getItem('hideBanner1') === 'true';
    const hideBanner2 = localStorage.getItem('hideBanner2') === 'true';


    setDismissedBanners({
      firstBanner: hideBanner1,
      secondBanner: hideBanner2
    });
  }, []);

  // Function to handle dismissing cards
  const handleDismissCard = (cardType: 'unlock' | 'access' | 'banner1' | 'banner2') => {
    if (cardType === 'unlock') {
      localStorage.setItem('hideUnlockFeaturesCard', 'true');
    } else if (cardType === 'access') {
    
      localStorage.setItem('hideGetAccessCard', 'true');
    } else if (cardType === 'banner1') {
      setDismissedBanners(prev => ({ ...prev, firstBanner: true }));
      localStorage.setItem('hideBanner1', 'true');
    } else if (cardType === 'banner2') {
      setDismissedBanners(prev => ({ ...prev, secondBanner: true }));
      localStorage.setItem('hideBanner2', 'true');
    }
  };

  const handleLocationSuccess = useCallback(async (position: GeolocationPosition, highAccuracy = true) => {
    const { latitude, longitude } = position.coords;
    const accuracy = position.coords.accuracy;

    // Store the location accuracy for potential warnings
    setLocationAccuracy(accuracy);

    // Show low accuracy warning if accuracy is worse than 100 meters
    const hasLowAccuracy = accuracy > 100;
    if (!highAccuracy || hasLowAccuracy) {
      setLowAccuracyWarning(true);
    }

    try {
      const cityName = await getCityFromCoordinates(latitude, longitude);
      localStorage.setItem('selectedCity', cityName);
      localStorage.setItem('selectedLat', latitude.toString());
      localStorage.setItem('selectedLng', longitude.toString());
      localStorage.setItem('locationAccuracy', accuracy.toString());

      setCity(cityName);
      setCoords({ latitude, longitude });
      setLocationConfirmed(true);

      fetchLocationAlerts(cityName, { latitude, longitude });

    } catch (error) {
      setLocationError('Failed to get your city name. Please try again or select a city manually.');
      console.error('Error in reverse geocoding:', error);
    }
  }, [fetchLocationAlerts]); // Add fetchLocationAlerts as a dependency

  const handleUseMyLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      localStorage.removeItem('isDefaultLocation'); // Clear default location flag
      const position = await getHighAccuracyLocation(true);
      await handleLocationSuccess(position, true);
    } catch (error) {
      console.error('Error in handleUseMyLocation:', error);
      try {
        // Fall back to low accuracy if high accuracy fails
        const position = await getHighAccuracyLocation(false);
        await handleLocationSuccess(position, false);
      } catch (error) {
        const geolocationError = error as GeolocationPositionError;
        handleLocationError(geolocationError);
      }
    } finally {
      setLocationLoading(false);
    }
  }, [handleLocationSuccess]); // Added handleLocationSuccess to dependencies


  const handleSelectEdinburgh = useCallback(() => {
    const edinburghCoords = { latitude: 55.9533, longitude: -3.1883 };

    localStorage.setItem('selectedCity', 'Edinburgh');
    localStorage.setItem('selectedLat', edinburghCoords.latitude.toString());
    localStorage.setItem('selectedLng', edinburghCoords.longitude.toString());
    localStorage.setItem('isDefaultLocation', 'true'); // Mark as default location

    setCity('Edinburgh');
    setCoords(edinburghCoords);
    setLocationConfirmed(true);

    fetchLocationAlerts('Edinburgh', edinburghCoords);
  }, [fetchLocationAlerts])

  // Load saved city from localStorage on mount
  useEffect(() => {
    const savedCity = localStorage.getItem('selectedCity');
    const savedLat = localStorage.getItem('selectedLat');
    const savedLng = localStorage.getItem('selectedLng');

    if (savedCity && savedLat && savedLng) {
      setCity(savedCity);
      setCoords({
        latitude: parseFloat(savedLat),
        longitude: parseFloat(savedLng)
      });
      setLocationConfirmed(true);
    } else {
      // If no saved location, use Edinburgh as default
      handleSelectEdinburgh();
    }
  }, [handleSelectEdinburgh]);

  useEffect(() => {
    // Only fetch alerts when we have all the necessary data
    if (locationConfirmed && city && coords) {
      console.log('Fetching alerts with city:', city, 'coords:', coords, 'profileLoaded:', profileLoaded);
      fetchLocationAlerts(city, coords);
    } else if (locationConfirmed && !city && !coords) {
      // If we have confirmed location but no city or coords, use Edinburgh as default
      console.log('No city or coords available, using Edinburgh as default');
      const edinburghCoords = { latitude: 55.9533, longitude: -3.1883 };
      setCity('Edinburgh');
      setCoords(edinburghCoords);
      fetchLocationAlerts('Edinburgh', edinburghCoords);
    }
  }, [city, coords, locationConfirmed, fetchLocationAlerts]);

  const handleFollowUpdate = async (alertId: string) => {
    if (!isAuthenticated) {
      // Show toast instead of opening login dialog
      showToast('Create free account to follow alerts', 'error');
      return;
    }

    try {
      const response = await followAlert(alertId);
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert._id === alertId ?
            {
              ...alert,
              numberOfFollows: response.numberOfFollows,
              isFollowing: response.following
            } :
            alert
        )
      );

      showToast(response.following ? "You're now following this alert. It's been added to action hub" : "You've unfollowed this alert. It's been removed from action hub", 'success');
    } catch (error) {
      console.error('Error following alert:', error);
      showToast('Failed to follow the alert', 'error');
    }
  };





  const getHighAccuracyLocation = (highAccuracy = true) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const options = {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        options
      );
    });
  };


  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);

    switch (error.code) {
      case error.PERMISSION_DENIED:
        setLocationError("You denied access to your location. Please enable location services or select a city manually.");
        break;
      case error.POSITION_UNAVAILABLE:
        setLocationError("Location information is unavailable. Please try again or select a city manually.");
        break;
      case error.TIMEOUT:
        setLocationError("The request to get your location timed out. Please try again or select a city manually.");
        break;
      default:
        setLocationError("An unknown error occurred while getting your location. Please try again or select a city manually.");
    }
  };

  const handleContinueWithLocation = () => {
    if (!city || !coords) {
      handleSelectEdinburgh();
      return;
    }

    localStorage.setItem('selectedCity', city);
    localStorage.setItem('selectedLat', coords.latitude.toString());
    localStorage.setItem('selectedLng', coords.longitude.toString());

    // Confirm location and fetch alerts
    setLocationConfirmed(true);
    fetchLocationAlerts(city, coords);
  };
  const handleLogin = () => {
    router.push('/login');
  };

  const handleCloseLoginDialog = () => {
    setLoginDialogOpen(false);
  };

  const handleLoadMore = () => {
    if (isAuthenticated) {
      loadMoreAlerts();
    } else {
      setLoginDialogOpen(true);
    }
  };


  const loadMoreAlerts = async () => {
    try {
      setIsLoadingMore(true);
      const params: FetchAlertsParams = {
        city: selectedCity || undefined,
        latitude: selectedLocation?.latitude,
        longitude: selectedLocation?.longitude,
        distance: filters.distance,
        alertCategory: filters.alertCategory,
        limit: 10,
        page: currentPage + 1,
        sortBy: filters.sortBy === 'impact_score' ? undefined : filters.sortBy,
      };

      // Add date filters if custom date range is selected
      if (filters.customDateFrom && filters.customDateTo) {
        params.startDate = filters.customDateFrom.toISOString();
        params.endDate = filters.customDateTo.toISOString();
      }

      // Now just load regular location-based alerts for pagination
      const response = await fetchAlerts(params);

      // Create a map of all alerts we already have
      const alertMap = new Map(alerts.map(alert => [alert._id, alert]));

      // Filter out alerts we already have
      const newUniqueAlerts = response.alerts.filter(alert => !alertMap.has(alert._id));

      if (newUniqueAlerts.length < response.alerts.length) {
        console.warn(`Filtered out ${response.alerts.length - newUniqueAlerts.length} duplicate alert(s)`);
      }

      // Add new alerts to our existing list
      if (filters.sortBy === 'impact_score') {
        // Get all alerts (existing + new)
        const allAlerts = [...alerts, ...newUniqueAlerts];
        
        // Apply the same impact score sorting logic
        const scoredAlerts = allAlerts
          .filter(alert => {
            const endDate = alert.expectedEnd ? new Date(alert.expectedEnd) : null;
            const now = new Date();
            return !endDate || endDate >= now;
          })
          .map(alert => {
            let score = calculateImpactScore(alert);
            if (alert.isFollowing) score += 0.1;
            const isOperatingRegion = operatingRegionAlerts.some(a => a._id === alert._id);
            if (isOperatingRegion && !alert.isFollowing) score += 0.05;
            return { alert, score };
          })
          .sort((a, b) => b.score - a.score);
        
        // Extract sorted alerts while preserving uniqueness
        const uniqueAlerts: AlertType[] = [];
        const seenIds = new Set<string>();
        
        for (const { alert } of scoredAlerts) {
          if (!seenIds.has(alert._id)) {
            uniqueAlerts.push(alert);
            seenIds.add(alert._id);
          }
        }

        // Update state in a single operation
        setAlerts(uniqueAlerts);
      } else {
        // For non-impact score sorting, simply append new alerts
        setAlerts(prevAlerts => [...prevAlerts, ...newUniqueAlerts]);
      }

      setCurrentPage(prevPage => prevPage + 1);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error loading more alerts:', error);
      showToast('Failed to load more alerts', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = (selectedCity?: string) => {
    // Map impact level filters to actual impact values
    const mappedImpactLevels = filters.impactLevel?.map(level => {
      // No need to map since we're already using the correct values from FilterDrawer
      console.log("level",level);
      return level;
    });

    const params: FetchAlertsParams = {
      city: selectedCity || city || 'Edinburgh', // Default to Edinburgh if no city
      latitude: coords?.latitude ?? 55.9533, // Default Edinburgh coordinates
      longitude: coords?.longitude ?? -3.1883,
      distance: filters.distance,
      sortBy: filters.sortBy,
    };

    // Add impact levels to params
    if (mappedImpactLevels && mappedImpactLevels.length > 0) {
      params.impact = mappedImpactLevels;
      console.log('Frontend - Impact levels being sent:', params.impact);
    }

    setIsFilterDrawerOpen(false);

    // If a city is passed from FilterDrawer, use it
    if (selectedCity) {
      // Default coordinates for predefined cities
      const cityCoordinates: Record<string, { latitude: number, longitude: number }> = {
        'Edinburgh': { latitude: 55.9533, longitude: -3.1883 },
        'Glasgow': { latitude: 55.8642, longitude: -4.2518 },
        'Stirling': { latitude: 56.1165, longitude: -3.9369 },
        'Manchester': { latitude: 53.4808, longitude: -2.2426 },
        'London': { latitude: 51.5074, longitude: -0.1278 },
      };

      // Use coordinates if available, otherwise just use city name
      if (cityCoordinates[selectedCity]) {
        setCity(selectedCity);
        setCoords(cityCoordinates[selectedCity]);
        // Store the selected city in localStorage
        localStorage.setItem('selectedCity', selectedCity);
        localStorage.setItem('selectedLat', cityCoordinates[selectedCity].latitude.toString());
        localStorage.setItem('selectedLng', cityCoordinates[selectedCity].longitude.toString());
        fetchLocationAlerts(selectedCity, cityCoordinates[selectedCity]);
      } else {
        setCity(selectedCity);
        setCoords(null);
        localStorage.setItem('selectedCity', selectedCity);
        fetchLocationAlerts(selectedCity);
      }
    }
    // If no city is passed, use current city and coords
    else if (city && coords) {
      fetchLocationAlerts(city, coords);
    } else if (city) {
      fetchLocationAlerts(city);
    }
  };

  const handleClearFilters = () => {
    // Reset filters to default state
    setFilters({
      sortBy: 'impact_score',
      alertCategory: [],
      timeRange: 7,
      distance: 20,
      impactLevel: [],
      customDateFrom: new Date(),
      customDateTo: new Date(),
    });

    // Reset location to Edinburgh
    setCity('Edinburgh');
    setCoords({ latitude: 55.9533, longitude: -3.1883 });
    setLocationAccuracy(null);
    setLocationConfirmed(true);

    // Clear local storage
    localStorage.removeItem('selectedCity');
    localStorage.removeItem('selectedLat');
    localStorage.removeItem('selectedLng');
    localStorage.removeItem('locationAccuracy');

    // Fetch alerts with default location
    fetchLocationAlerts('Edinburgh', { latitude: 55.9533, longitude: -3.1883 });
  };

  const getCityFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();

      if (data.address) {
        return data.address.city || data.address.town || data.address.village || 'Unknown location';
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting location name:', error);
      return 'Unknown location';
    }
  };

  const handleResetLocation = useCallback(() => {
    // Only reset if we're explicitly resetting to Edinburgh
    if (city === 'Edinburgh') {
      localStorage.removeItem('selectedCity');
      localStorage.removeItem('selectedLat');
      localStorage.removeItem('selectedLng');
      localStorage.removeItem('locationAccuracy');

      setCity('Edinburgh');
      setCoords({ latitude: 55.9533, longitude: -3.1883 });
      setLocationAccuracy(null);
      setLocationConfirmed(true);

      fetchLocationAlerts('Edinburgh', { latitude: 55.9533, longitude: -3.1883 });
    }
  }, [fetchLocationAlerts, city]);

  // Function to format remainingTime from countdown



  if (!locationConfirmed) {
    return (
      <Layout>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            {city ? 'Change Your Location' : 'Choose Your Location'}
          </Typography>

          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            {city
              ? `Currently showing alerts for ${city}. Select a new location or continue with the current one.`
              : 'To show relevant alerts, please select a location.'
            }
          </Typography>

          {locationError && (
            <MuiAlert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
              {locationError}
            </MuiAlert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 500 }}>
            <Button
              variant="contained"
              onClick={handleUseMyLocation}
              disabled={locationLoading}
              startIcon={locationLoading && <CircularProgress size={20} color="inherit" />}
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: '#333' },
                py: 1.5,
                borderRadius: 3
              }}
            >
              {locationLoading ? 'Getting location...' : 'Use my current location'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleSelectEdinburgh}
              sx={{
                borderColor: 'black',
                color: 'black',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                py: 1.5,
                borderRadius: 3
              }}
            >
              Use Edinburgh as location
            </Button>

            {city && coords && (
              <Button
                variant="contained"
                onClick={handleContinueWithLocation}
                sx={{
                  bgcolor: 'black',
                  color: 'white',
                  '&:hover': { bgcolor: '#333' },
                  py: 1.5,
                  borderRadius: 3,
                  mt: 2
                }}
              >
                Continue with {city}
              </Button>
            )}
          </Box>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout onFilterOpen={() => setIsFilterDrawerOpen(true)}>
      <Container maxWidth="xl" style={{ padding: 0 }}>
        {/* Low Accuracy Warning Dialog */}
        <Dialog
          open={lowAccuracyWarning}
          onClose={() => setLowAccuracyWarning(false)}
          PaperProps={{
            sx: {
              borderRadius: 1,
              boxShadow: 'none',
              maxWidth: '600px',
              width: '100%'
            }
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#000' }}>
              Location Accuracy Notice
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 1, color: '#777' }}>
              Your location could only be determined with low accuracy
              {locationAccuracy ? ` (${Math.round(locationAccuracy)} meters).` : '.'}
              This might be because you&apos;re on a desktop computer, using a VPN, or your device&apos;s GPS is disabled.
            </Typography>

            <Typography variant="subtitle1" sx={{ color: '#777' }}>
              For more accurate location:
            </Typography>
            <li style={{ color: '#777' }}>
              On mobile, ensure GPS is enabled
            </li>
            <li style={{ color: '#777' }}>
              Allow precise location in browser permissions
            </li>
            <li style={{ color: '#777' }}>
              Disable VPN if you&apos;re using one
            </li>

            <Typography variant="body2" sx={{ mt: 2, color: '#777' }}>
              Would you like to continue with this approximate location or try again?
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1, flexDirection: { xs: 'row', sm: 'row' }, gap: 1 }}>
            <Typography
              onClick={() => {
                setLowAccuracyWarning(false);
              }}
              sx={{
                                        color: '#056CF2',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Use Current Accuracy
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setLowAccuracyWarning(false);
                handleUseMyLocation()
              }}
              sx={{
                bgcolor: '#056CF2',
                color: 'white',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: '#056CF2',
                },
              }}
            >
              Try Again
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feed Header with Title and Filter Button */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          pb: {xs: 0, md: 2},
          borderBottom: '1px solid #E0E1E2',
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
              Feed
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer'
              }}
            >
              Viewing alerts for • <span onClick={() => setIsFilterDrawerOpen(true)} style={{ color: '#056CF2', fontWeight: 600 }}>
                {city || "Edinburgh"}
              </span>
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            
            <IconButton
              onClick={() => setIsFilterDrawerOpen(true)}
              sx={{
                bgcolor: 'transparent',
                '&:hover': {
                  bgcolor: 'transparent'
                },
              }}
              aria-label="open filter"
            >
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="33" height="33" rx="7.5" fill="white" />
                <rect x="0.5" y="0.5" width="33" height="33" rx="7.5" stroke="#E0E1E2" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12.6366 9.68752C12.6496 9.68752 12.6626 9.68752 12.6757 9.68752L21.3634 9.68752C21.9413 9.68749 22.4319 9.68747 22.819 9.74024C23.2287 9.7961 23.6205 9.9222 23.9204 10.2523C24.2229 10.5854 24.3057 10.9867 24.3121 11.397C24.318 11.7801 24.2568 12.2561 24.1853 12.811L24.1801 12.8514C24.1549 13.0478 24.117 13.2377 24.038 13.4278C23.9578 13.6209 23.8474 13.7853 23.7098 13.9488C22.975 14.8217 21.6091 16.3992 19.6861 17.8358C19.655 17.859 19.6157 17.9141 19.6082 17.9968C19.4214 20.0615 19.257 21.1539 19.1385 21.7868C19.0102 22.4711 18.4882 22.9448 18.0381 23.2709C17.8026 23.4416 17.5525 23.5953 17.3299 23.7308C17.312 23.7417 17.2944 23.7524 17.277 23.763C17.0689 23.8895 16.8921 23.997 16.7443 24.1016C16.3389 24.3882 15.8712 24.3681 15.5137 24.1598C15.1764 23.9633 14.939 23.6049 14.891 23.1995C14.7856 22.3097 14.5946 20.5677 14.3838 17.992C14.3771 17.9093 14.3641 17.8854 14.3631 17.8834C14.3623 17.882 14.3604 17.8785 14.3541 17.8716C14.3471 17.8638 14.333 17.8501 14.3063 17.8301C12.3871 16.3953 11.0239 14.8205 10.2901 13.9487C10.1531 13.7859 10.0394 13.6254 9.95834 13.4302C9.87898 13.2391 9.84514 13.0482 9.81983 12.8514C9.81809 12.8379 9.81636 12.8244 9.81463 12.811C9.74322 12.2561 9.68197 11.7801 9.6879 11.397C9.69425 10.9867 9.77706 10.5854 10.0796 10.2523C10.3795 9.9222 10.7713 9.7961 11.181 9.74024C11.5681 9.68747 12.0587 9.68749 12.6366 9.68752ZM11.333 10.8549C11.0449 10.8942 10.9581 10.9584 10.9123 11.0088C10.8691 11.0563 10.817 11.14 10.8128 11.4144C10.8082 11.7066 10.8576 12.1011 10.9356 12.7079C10.9573 12.8765 10.9763 12.9482 10.9973 12.9987C11.0166 13.0452 11.0508 13.1054 11.1509 13.2243C11.8696 14.0782 13.1663 15.5732 14.9799 16.9291C15.1256 17.038 15.2593 17.1729 15.356 17.3545C15.4513 17.5334 15.4903 17.7195 15.5051 17.9002C15.7147 20.4619 15.9044 22.1903 16.0082 23.0672C16.0113 23.094 16.0211 23.1203 16.0361 23.1433C16.0514 23.1668 16.0684 23.181 16.08 23.1878C16.0815 23.1886 16.0828 23.1893 16.0839 23.1899C16.0866 23.1884 16.0902 23.1862 16.0947 23.183C16.2763 23.0546 16.4871 22.9265 16.686 22.8057C16.7058 22.7936 16.7255 22.7817 16.745 22.7698C16.9691 22.6334 17.1835 22.5009 17.378 22.3599C17.7881 22.0628 17.9893 21.8113 18.0327 21.5796C18.1426 20.9932 18.3029 19.9386 18.4878 17.8954C18.5217 17.521 18.7055 17.1641 19.0128 16.9345C20.83 15.5769 22.1294 14.0793 22.8491 13.2243C22.9364 13.1206 22.9752 13.0537 22.9991 12.9962C23.0242 12.9358 23.0453 12.8558 23.0643 12.7079C23.1424 12.1011 23.1917 11.7066 23.1872 11.4144C23.183 11.14 23.1308 11.0563 23.0877 11.0088C23.0419 10.9584 22.9551 10.8942 22.667 10.8549C22.365 10.8138 21.952 10.8125 21.3242 10.8125H12.6757C12.0479 10.8125 11.635 10.8138 11.333 10.8549ZM16.078 23.1925C16.078 23.1924 16.0784 23.1923 16.0791 23.1921L16.078 23.1925Z" fill="black" />
              </svg>
            </IconButton>
          </Box>
        </Box>

        {/* Alerts List */}
        {loading && alerts.length === 0 ? (
          // Skeleton loading
          Array.from(new Array(3)).map((_, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Skeleton variant="text" width="70%" />
              </Box>
              <Box sx={{ display: 'flex', mb: 2, gap: 1 }}>
                <Skeleton variant="text" width="15%" />
                <Skeleton variant="text" width="25%" />
                <Skeleton variant="text" width="20%" />
              </Box>
              <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton variant="text" width={100} />
                <Skeleton variant="rectangular" width={120} height={30} />
              </Box>
            </Paper>
          ))
        ) : alerts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <i className="ri-file-list-3-line" style={{ fontSize: 48, color: '#ccc' }}></i>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              No alerts found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are no safety alerts in this area yet. Change your location or filters to see more results.
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Restructured grid layout for cards and alerts */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              gap: 0,
              mt: 2,
              borderBottom: 'none', // Remove bottom border from container
              borderRight: 'none', // Remove right border from container
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              {/* Render all alerts starting from index 0 */}
              {alerts.map((alert: AlertType, index: number) => {
                // Calculate position in grid for border logic
                const position = index;

                // Calculate if this is in the last row based on different breakpoints
                const totalItems = alerts.length;

                // Calculate last row items for different breakpoints
                const isLastRowMd = position >= totalItems - (totalItems % 3 || 3);
                const isLastRowSm = position >= totalItems - (totalItems % 2 || 2);
                const isLastRowXs = position === totalItems - 1;

                // Calculate if this is the last item in a row
                const isLastInRowMd = (position + 1) % 3 === 0 || position === totalItems - 1;
                const isLastInRowSm = (position + 1) % 2 === 0 || position === totalItems - 1;

                // Insert UnlockFeaturesCard after the 3rd and 10th alert for authenticated users with incomplete profiles
                const shouldShowFirstBanner = isAuthenticated && userProfile && !userProfile.isProfileComplete && 
                  position === 2 && !dismissedBanners.firstBanner;
                
                const shouldShowSecondBanner = isAuthenticated && userProfile && !userProfile.isProfileComplete && 
                  position === 10 && !dismissedBanners.secondBanner;

                return (
                  <React.Fragment key={`alert-fragment-${alert._id}-${index}`}>
                    <Paper
                      key={`alert-${alert._id}-${index}`}
                      sx={{
                        p: 2,
                        bgcolor: 'transparent',
                        borderRadius: 0,
                        boxShadow: 'none',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderTop: 'none',
                        borderBottom: {
                          xs: isLastRowXs ? 'none' : '1px solid #E0E1E2',
                          sm: isLastRowSm ? 'none' : '1px solid #E0E1E2',
                          md: isLastRowMd ? 'none' : '1px solid #E0E1E2'
                        },
                        borderRight: {
                          xs: 'none',
                          sm: isLastInRowSm ? 'none' : '1px solid #E0E1E2',
                          md: isLastInRowMd ? 'none' : '1px solid #E0E1E2'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box
                          onClick={() => isViewOnly() ? null : handleFollowUpdate(alert._id || '')}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'pointer',
                            color: '#056CF2',
                            fontWeight: 500,
                            opacity: isViewOnly() ? 0.5 : 1,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            border: '1px solid #E0E1E2',
                            bgcolor: 'transparent',
                            fontSize: '14px',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            },
                            mb: 1,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {alert.isFollowing ? (
                            <>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M6.99968 0.833374C4.02913 0.833374 1.61827 3.22772 1.61825 6.18468C1.61818 6.87247 1.57193 7.39159 1.25481 7.85817C1.21072 7.9221 1.15222 8.00217 1.0883 8.08966C0.977267 8.24164 0.849859 8.41603 0.753231 8.56704C0.582689 8.83357 0.416071 9.15498 0.358792 9.5295C0.171916 10.7514 1.03338 11.5425 1.89131 11.897C2.44899 12.1274 3.04588 12.3153 3.6675 12.4606C3.6634 12.5298 3.6701 12.6008 3.68887 12.6714C4.07359 14.1191 5.42024 15.1669 6.99984 15.1669C8.57944 15.1669 9.92609 14.1191 10.3108 12.6714C10.3296 12.6008 10.3363 12.5298 10.3322 12.4606C10.9537 12.3152 11.5505 12.1273 12.108 11.897C12.966 11.5425 13.8274 10.7514 13.6406 9.5295C13.5833 9.15499 13.4167 8.83357 13.2461 8.56704C13.1495 8.41604 13.0221 8.2417 12.9111 8.08972C12.8472 8.00224 12.7887 7.92215 12.7446 7.85822C12.4274 7.39162 12.3812 6.87256 12.3811 6.18473C12.3811 3.22774 9.97023 0.833374 6.99968 0.833374ZM8.87123 12.7193C7.63997 12.8714 6.35974 12.8714 5.12847 12.7193C5.4664 13.3728 6.17059 13.8335 6.99984 13.8335C7.82911 13.8335 8.53331 13.3727 8.87123 12.7193Z" fill="#056CF2" />
                              </svg>
                              <Typography variant="body2" sx={{ fontWeight: '540' }}>Following</Typography>
                            </>
                          ) : (
                            <>
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M9 0.9375C5.59019 0.9375 2.79388 3.6162 2.79385 6.95951C2.79378 7.72987 2.74049 8.30447 2.37919 8.82178C2.31298 8.91524 2.24287 9.00823 2.16609 9.11006L2.10463 9.19169C2.00612 9.32281 1.89986 9.46656 1.80043 9.61777C1.60342 9.91739 1.4088 10.2817 1.34177 10.7082C1.12258 12.1028 2.13374 12.9933 3.11421 13.3876C6.59593 14.7875 11.4041 14.7875 14.8858 13.3876C15.8663 12.9933 16.8774 12.1028 16.6582 10.7082C16.5912 10.2817 16.3966 9.91739 16.1996 9.61777C16.1002 9.46656 15.9939 9.32281 15.8954 9.19169L15.834 9.11013C15.7572 9.00835 15.687 8.91523 15.6208 8.82182C15.2595 8.30449 15.2062 7.72996 15.2062 6.95956C15.2062 3.61623 12.4098 0.9375 9 0.9375ZM3.91885 6.95956C3.91885 4.27243 6.17603 2.0625 9 2.0625C11.824 2.0625 14.0812 4.27243 14.0812 6.95956C14.0812 7.74899 14.1213 8.64087 14.6999 9.46793L14.7017 9.47057C14.779 9.57963 14.8624 9.69021 14.9406 9.79393L14.9959 9.8674C15.0923 9.99576 15.1807 10.1159 15.2596 10.2359C15.4192 10.4786 15.5159 10.6857 15.5469 10.8829C15.6467 11.5178 15.2317 12.0359 14.4661 12.3438C11.2537 13.6354 6.7463 13.6354 3.53389 12.3438C2.76827 12.0359 2.35333 11.5178 2.45312 10.8829C2.48411 10.6857 2.58084 10.4786 2.74043 10.2359C2.81931 10.1159 2.90766 9.99576 3.00409 9.8674L3.05944 9.79391C3.13766 9.6902 3.22106 9.57961 3.29827 9.47057L3.30013 9.46793C3.87869 8.64087 3.91878 7.74899 3.91885 6.95956Z" fill="#056CF2" />
                                <path d="M7.09677 15.3067C6.85195 15.1155 6.49845 15.1589 6.30722 15.4038C6.11598 15.6486 6.15943 16.0021 6.40425 16.1933C7.10253 16.7387 8.01355 17.0625 9.00051 17.0625C9.98747 17.0625 10.8985 16.7387 11.5968 16.1933C11.8416 16.0021 11.885 15.6486 11.6938 15.4038C11.5026 15.1589 11.1491 15.1155 10.9043 15.3067C10.4083 15.6941 9.74235 15.9375 9.00051 15.9375C8.25867 15.9375 7.5927 15.6941 7.09677 15.3067Z" fill="#056CF2" />
                              </svg>

                              <Typography variant="body2" sx={{ fontWeight: '540' }}>Follow</Typography>
                            </>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#757575', fontSize: '14px' }}>
                            {formatRelativeTime(alert.expectedEnd?.toString() || '')}
                          </Typography>
                        </Box>
                      </Box>
                      {/* Alert Header with Follow Button */}
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1.5
                      }}>
                        <Typography variant="subtitle1" sx={{
                          fontWeight: 600,
                          fontSize: '16px',
                          flex: 1,
                          fontFamily: 'Poppins'
                        }}>
                          {alert.title || ""}
                        </Typography>

                      </Box>

                      {/* Location & Time info */}
                      <Typography variant="body2"
                        sx={{
                          color: '#616161',
                          fontSize: '14px',
                          mb: 1,
                          fontFamily: 'Poppins'
                        }}
                      >
                        {alert.originCity || alert.city || "Edinburgh"}
                      </Typography>

                      {/* Alert Content */}
                      <Typography variant="body2" sx={{
                        mb: 1.5,
                        color: '#000000',
                        flex: 1,
                        fontFamily: 'Inter'
                      }}>
                        {alert.description || ""}
                        {alert.recommendedAction && ` ${alert.recommendedAction}`}
                      </Typography>

                      {/* Alert Details */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Start and End Time */}
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '50px 1fr',
                            rowGap: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontSize: '14px', color: '#757575', fontWeight: 500, fontFamily: 'Poppins' }}
                          >
                            Start:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: '14px', color: '#757575', fontWeight: 500, fontFamily: 'Poppins' }}
                          >
                            {alert.expectedStart ? formatStandardDateTime(alert.expectedStart) : '06 May 9:00AM'}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{ fontSize: '14px', color: '#757575', fontWeight: 500, fontFamily: 'Poppins' }}
                          >
                            End:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontSize: '14px', color: '#757575', fontWeight: 500, fontFamily: 'Poppins' }}
                          >
                            {alert.expectedEnd ? formatStandardDateTime(alert.expectedEnd) : '06 May 9:00AM'}
                          </Typography>
                        </Box>


                        {/* Impact Level */}
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{
                            display: 'inline-block',
                            fontSize: '14px',
                            borderRadius: 1,
                            fontWeight: 600,
                            fontFamily: 'Poppins'
                          }}>
                            {alert.impact === 'High' || !alert.impact
                              ? 'High Impact'
                              : alert.impact === 'Moderate'
                                ? 'Moderate Impact'
                                : alert.impact === 'Low'
                                  ? 'Low Impact'
                                  : `${alert.impact} Impact`}
                          </Typography>

                          {/* Impact Score (for testing) */}
                          <Box sx={{ display: isAdmin ? 'flex' : 'none', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Tooltip title="Alert impact score (higher scores appear first)">
                              <Chip 
                                label={`Score: ${calculateImpactScore(alert).toFixed(1)}`} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                                sx={{ borderRadius: 1 }}
                              />
                            </Tooltip>
                            <Button 
                              variant="text" 
                              size="small"
                              onClick={() => setSelectedAlert(alert)}
                              sx={{ fontSize: '12px', p: 0.5 }}
                            >
                              View Score Details
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Insert UnlockFeaturesCard after the 3rd alert */}
                    {shouldShowFirstBanner && (
                      <Box 
                        sx={{
                          gridColumn: { xs: '1/-1', sm: '1/-1', md: '1/-1' },
                          p: 0,
                          pb: 2,
                          position: 'relative',
                          borderBottom: '1px solid #E0E1E2',
                          my: 2
                        }}
                      >
                        <UnlockFeaturesCard
                          onDismiss={() => handleDismissCard('banner1')}
                        />
                      </Box>
                    )}

                    {/* Insert UnlockFeaturesCard after the 10th alert */}
                    {shouldShowSecondBanner && (
                      <Box 
                        sx={{
                          gridColumn: { xs: '1/-1', sm: '1/-1', md: '1/-1' },
                          p: 0,
                          pb: 2,
                          position: 'relative',
                          borderBottom: '1px solid #E0E1E2',
                          my: 2
                        }}
                      >
                        <UnlockFeaturesCard
                          onDismiss={() => handleDismissCard('banner2')}
                        />
                      </Box>
                    )}
                  </React.Fragment>
                );
              })}
            </Box>



            {hasMore && isAuthenticated && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                  sx={{
                    borderColor: '#e0e0e0',
                    color: '#333',
                    borderRadius: 50,
                    px: 10,
                    py: 1,
                    '&:hover': {
                      borderColor: '#bdbdbd',
                      backgroundColor: 'rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Remaining components (FilterDrawer, Dialog, etc.) */}
      <FilterDrawer
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        resultCount={totalCount}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        currentCity={city}
        isUsingCurrentLocation={!!coords && city !== 'Edinburgh'}
        onUseMyLocation={handleUseMyLocation}
        onResetLocation={handleResetLocation}
        locationLoading={locationLoading}
        locationAccuracy={locationAccuracy}
      />

      <Dialog
        open={loginDialogOpen}
        onClose={handleCloseLoginDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: '380px',
            width: '100%'
          }
        }}
      >
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 2 }}>
            <Image
              src="/images/login-alert.png"
              alt="Login required"
              width={120}
              height={120}
              style={{ margin: '0 auto' }}
            />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, fontSize: '20px' }}>
            Login in to view updates of the alerts!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '14px' }}>
            Please sign in to track disruptions and receive personalized notifications.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogin}
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: '#333' },
                py: 1.2,
                borderRadius: 2
              }}
            >
              Login Now
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCloseLoginDialog}
              sx={{
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                py: 1.2,
                borderRadius: 2
              }}
            >
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {selectedAlert && (
        <ImpactScorePopup
          open={!!selectedAlert}
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </Layout >
  );
}
