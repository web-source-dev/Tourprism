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
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import FilterDrawer from '@/components/FilterDrawer';
import { fetchAlerts, getUserProfile } from '@/services/api';
import { followAlert } from '@/services/alertActions';
import { Alert as AlertType, FilterOptions, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/ui/toast';
import GetAccessCard from '@/components/GetAccessCard';
import UnlockFeaturesCard from '@/components/UnlockFeaturesCard';

// Extend the existing User interface with the new properties
interface ExtendedUser extends User {
  isProfileComplete?: boolean;
  profileCompletionPercentage?: number;
}
// Function to format date in "Month Day, Time" format
const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Add this function after the formatDateForDisplay function
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Get time difference in seconds
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    // Less than a minute
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    // Less than an hour
    return `${Math.floor(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    // Less than a day
    return `${Math.floor(diffInSeconds / 3600)}h`;
  } else {
    // More than a day
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }
};

// Add this before the fetchOperatingRegionAlerts function as a shared helper function
// Helper function to sort alerts by the selected sort criteria
const sortAlertsByFilter = (alerts: AlertType[], sortBy: string) => {
  return [...alerts].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'most_follows') {
      return (b.numberOfFollows || 0) - (a.numberOfFollows || 0);
    } else if (sortBy === 'most_severe') {
      const impactOrder = { 'Severe': 3, 'Moderate': 2, 'Minor': 1 };
      return (impactOrder[b.impact as keyof typeof impactOrder] || 0) - (impactOrder[a.impact as keyof typeof impactOrder] || 0);
    }
    // Default to latest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export default function Feed() {
  const router = useRouter();
  const { isAuthenticated, isCollaboratorViewer } = useAuth();
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
    sortBy: 'latest',
    alertCategory: [],
    timeRange: 7,
    distance: 50,
    impactLevel: '',
    customDateFrom: new Date(),
    customDateTo: new Date(),
  });
  // Add state variables for tracking card visibility
  const [showUnlockFeaturesCard, setShowUnlockFeaturesCard] = useState(true);
  const [showGetAccessCard, setShowGetAccessCard] = useState(true);

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
          setUserProfile(user);
        } catch (error) {
          console.error('Error fetching user profile:', error);
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
          limit: 10,
          sortBy: filters.sortBy,
          latitude: region.latitude,
          longitude: region.longitude,
          distance: filters.distance || 50
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

        if (filters.impactLevel) {
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
        // First priority: followed alerts go to the top
        if (a.isFollowing && !b.isFollowing) return -1;
        if (!a.isFollowing && b.isFollowing) return 1;

        // Second priority: maintain the sort order within each group using the shared sorting function
        return sortAlertsByFilter([a, b], filters.sortBy)[0] === a ? -1 : 1;
      });

      setOperatingRegionAlerts(combinedAlerts);
      return combinedAlerts;
    } catch (error) {
      console.error('Error fetching operating region alerts:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userProfile, filters]);

  // Define the fetchLocationAlerts function with useCallback to avoid recreation on each render
  const fetchLocationAlerts = useCallback(async (cityName: string = "Edinburgh", coordinates: { latitude: number; longitude: number } | null = null) => {
    setLoading(true);
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
          limit: isAuthenticated ? 10 : 15,
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

        if (filters.impactLevel) {
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
      }

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

      // Apply the limit for non-authenticated users
      if (!isAuthenticated) {
        setAlerts(sortedAllAlerts.slice(0, 15));
      } else {
        setAlerts(sortedAllAlerts);
      }

      // Set total count to include both sets for pagination
      const totalRegularAlerts = skipDefaultLocation ? 0 : locationBasedAlerts.length;
      setTotalCount(operatingRegionsResults.length + totalRegularAlerts);
      setHasMore(isAuthenticated && sortedAllAlerts.length < (operatingRegionsResults.length + totalRegularAlerts));
      setPage(1);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      showToast('Failed to fetch alerts', 'error');
      setAlerts([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters, userProfile, fetchOperatingRegionAlerts, showToast]);

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
    const hideUnlockCard = localStorage.getItem('hideUnlockFeaturesCard') === 'true';
    const hideAccessCard = localStorage.getItem('hideGetAccessCard') === 'true';

    if (hideUnlockCard) {
      setShowUnlockFeaturesCard(false);
    }

    if (hideAccessCard) {
      setShowGetAccessCard(false);
    }
  }, []);

  // Function to handle dismissing cards
  const handleDismissCard = (cardType: 'unlock' | 'access') => {
    if (cardType === 'unlock') {
      setShowUnlockFeaturesCard(false);
      localStorage.setItem('hideUnlockFeaturesCard', 'true');
    } else {
      setShowGetAccessCard(false);
      localStorage.setItem('hideGetAccessCard', 'true');
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

  useEffect(() => {
    // Check if we have stored location
    const storedCity = localStorage.getItem('selectedCity');
    const storedLat = localStorage.getItem('selectedLat');
    const storedLng = localStorage.getItem('selectedLng');

    if (storedCity && storedLat && storedLng) {
      // Use stored location if available
      setCity(storedCity);
      setCoords({
        latitude: parseFloat(storedLat),
        longitude: parseFloat(storedLng)
      });
      setLocationConfirmed(true);
    } else {
      handleSelectEdinburgh();
    }
  }, [handleSelectEdinburgh]);

  useEffect(() => {
    if (locationConfirmed && city && coords && profileLoaded) {
      fetchLocationAlerts(city, coords);
    }
  }, [city, coords, locationConfirmed, isAuthenticated, fetchLocationAlerts, profileLoaded]);

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
    if (!hasMore || loading || !isAuthenticated) return;

    const nextPage = page + 1;
    setLoading(true);

    try {
      // Check if we have operating regions
      const operatingRegions = userProfile?.company?.MainOperatingRegions ?? [];
      const hasOperatingRegions = isAuthenticated && operatingRegions.length > 0;

      // Skip default Edinburgh location if we have operating regions and the current location is Edinburgh
      const isDefaultEdinburgh =
        city === "Edinburgh" &&
        coords?.latitude === 55.9533 &&
        coords?.longitude === -3.1883;

      const skipDefaultLocation = hasOperatingRegions && isDefaultEdinburgh;

      // When loading more, we should only fetch additional location-based alerts
      // Operating region alerts are already loaded
      if (!skipDefaultLocation) {
        const params: Record<string, unknown> = {
          page: nextPage,
          limit: 10,
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

        if (coords) {
          params.latitude = coords.latitude;
          params.longitude = coords.longitude;
          if (filters.distance && filters.distance > 0) {
            params.distance = filters.distance;
          }
        } else if (city) {
          params.city = city;
        }

        // We've already loaded operating region alerts in the first page
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
        setAlerts(prevAlerts => [...prevAlerts, ...newUniqueAlerts]);

        // Calculate hasMore accounting for operating region alerts and already loaded alerts
        const operatingRegionCount = hasOperatingRegions ? operatingRegionAlerts.length : 0;
        const totalAlertsLoaded = alerts.length + newUniqueAlerts.length;
        const totalExpected = operatingRegionCount + response.totalCount;

        setHasMore(totalAlertsLoaded < totalExpected);
        setPage(nextPage);
      } else {
        // If we're skipping the default location, there's nothing more to load
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more alerts:', error);
      showToast('Failed to load more alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setIsFilterDrawerOpen(false);
    if (city && coords) {
      fetchLocationAlerts(city, coords);
    } else if (city) {
      fetchLocationAlerts(city);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'newest',
      alertCategory: [],
      timeRange: 0,
      distance: 50,
      impactLevel: '',
      customDateFrom: new Date(),
      customDateTo: new Date(),
    });
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
    localStorage.removeItem('selectedCity');
    localStorage.removeItem('selectedLat');
    localStorage.removeItem('selectedLng');
    localStorage.removeItem('locationAccuracy');

    setCity('Edinburgh');
    setCoords({ latitude: 55.9533, longitude: -3.1883 });
    setLocationAccuracy(null);
    setLocationConfirmed(true);

    fetchLocationAlerts('Edinburgh', { latitude: 55.9533, longitude: -3.1883 });
  }, [fetchLocationAlerts]);

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
      <Container maxWidth="xl" style={{padding:0}}>
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
                color: 'rgb(42, 99, 185)',
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
                bgcolor: 'rgb(42, 99, 185)',
                color: 'white',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'rgb(42, 99, 185)',
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
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Feed
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 400 }}>
              View upcoming travel disruptions
            </Typography>
          </Box>
          <IconButton
            onClick={() => setIsFilterDrawerOpen(true)}
            sx={{
              bgcolor: '#f5f5f5',
              '&:hover': {
                bgcolor: '#e0e0e0'
              },
            }}
            aria-label="open filter"
          >
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="33" height="33" rx="7.5" fill="white" />
              <rect x="0.5" y="0.5" width="33" height="33" rx="7.5" stroke="#E0E1E2" />
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12.6366 9.68752C12.6496 9.68752 12.6626 9.68752 12.6757 9.68752L21.3634 9.68752C21.9413 9.68749 22.4319 9.68747 22.819 9.74024C23.2287 9.7961 23.6205 9.9222 23.9204 10.2523C24.2229 10.5854 24.3057 10.9867 24.3121 11.397C24.318 11.7801 24.2568 12.2561 24.1853 12.811L24.1801 12.8514C24.1549 13.0478 24.117 13.2377 24.038 13.4278C23.9578 13.6209 23.8474 13.7853 23.7098 13.9488C22.975 14.8217 21.6091 16.3992 19.6861 17.8358C19.655 17.859 19.6157 17.9141 19.6082 17.9968C19.4214 20.0615 19.257 21.1539 19.1385 21.7868C19.0102 22.4711 18.4882 22.9448 18.0381 23.2709C17.8026 23.4416 17.5525 23.5953 17.3299 23.7308C17.312 23.7417 17.2944 23.7524 17.277 23.763C17.0689 23.8895 16.8921 23.997 16.7443 24.1016C16.3389 24.3882 15.8712 24.3681 15.5137 24.1598C15.1764 23.9633 14.939 23.6049 14.891 23.1995C14.7856 22.3097 14.5946 20.5677 14.3838 17.992C14.3771 17.9093 14.3641 17.8854 14.3631 17.8834C14.3623 17.882 14.3604 17.8785 14.3541 17.8716C14.3471 17.8638 14.333 17.8501 14.3063 17.8301C12.3871 16.3953 11.0239 14.8205 10.2901 13.9487C10.1531 13.7859 10.0394 13.6254 9.95834 13.4302C9.87898 13.2391 9.84514 13.0482 9.81983 12.8514C9.81809 12.8379 9.81636 12.8244 9.81463 12.811C9.74322 12.2561 9.68197 11.7801 9.6879 11.397C9.69425 10.9867 9.77706 10.5854 10.0796 10.2523C10.3795 9.9222 10.7713 9.7961 11.181 9.74024C11.5681 9.68747 12.0587 9.68749 12.6366 9.68752ZM11.333 10.8549C11.0449 10.8942 10.9581 10.9584 10.9123 11.0088C10.8691 11.0563 10.817 11.14 10.8128 11.4144C10.8082 11.7066 10.8576 12.1011 10.9356 12.7079C10.9573 12.8765 10.9763 12.9482 10.9973 12.9987C11.0166 13.0452 11.0508 13.1054 11.1509 13.2243C11.8696 14.0782 13.1663 15.5732 14.9799 16.9291C15.1256 17.038 15.2593 17.1729 15.356 17.3545C15.4513 17.5334 15.4903 17.7195 15.5051 17.9002C15.7147 20.4619 15.9044 22.1903 16.0082 23.0672C16.0113 23.094 16.0211 23.1203 16.0361 23.1433C16.0514 23.1668 16.0684 23.181 16.08 23.1878C16.0815 23.1886 16.0828 23.1893 16.0839 23.1899C16.0866 23.1884 16.0902 23.1862 16.0947 23.183C16.2763 23.0546 16.4871 22.9265 16.686 22.8057C16.7058 22.7936 16.7255 22.7817 16.745 22.7698C16.9691 22.6334 17.1835 22.5009 17.378 22.3599C17.7881 22.0628 17.9893 21.8113 18.0327 21.5796C18.1426 20.9932 18.3029 19.9386 18.4878 17.8954C18.5217 17.521 18.7055 17.1641 19.0128 16.9345C20.83 15.5769 22.1294 14.0793 22.8491 13.2243C22.9364 13.1206 22.9752 13.0537 22.9991 12.9962C23.0242 12.9358 23.0453 12.8558 23.0643 12.7079C23.1424 12.1011 23.1917 11.7066 23.1872 11.4144C23.183 11.14 23.1308 11.0563 23.0877 11.0088C23.0419 10.9584 22.9551 10.8942 22.667 10.8549C22.365 10.8138 21.952 10.8125 21.3242 10.8125H12.6757C12.0479 10.8125 11.635 10.8138 11.333 10.8549ZM16.078 23.1925C16.078 23.1924 16.0784 23.1923 16.0791 23.1921L16.078 23.1925Z" fill="black" />
            </svg>

          </IconButton>
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
              gap: 2,
              mt: 2
            }}>
              {/* First position: Feature Card based on auth state */}
              {isAuthenticated && userProfile && (!userProfile.isProfileComplete) ? (
                <Box sx={{ gridColumn: { xs: '1', sm: '1', md: '1' }, position: 'relative' }}>
                  <IconButton
                    onClick={() => handleDismissCard('unlock')}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      width: 24,
                      height: 24,
                      display:'none',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.1)' }
                    }}
                    aria-label="dismiss card"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </IconButton>
                  <UnlockFeaturesCard
                    progress={userProfile?.profileCompletionPercentage || 75}
                    onClick={() => router.push('/profile')}
                  />
                </Box>
              ) : !isAuthenticated ? (
                <Box sx={{ gridColumn: { xs: '1', sm: '1', md: '1' }, position: 'relative' }}>
                  <IconButton
                    onClick={() => handleDismissCard('access')}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                      width: 24,
                      height: 24,
                      display:'none',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.5)' },
                      color: 'white'
                    }}
                    aria-label="dismiss card"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </IconButton>
                  <GetAccessCard onClick={handleLogin} />
                </Box>
              ) : (
                // If user is authenticated and profile is complete, or card is dismissed, show the first alert
                alerts.length > 0 && (
                  <Paper
                    key={`alert-${alerts[0]._id}-0`}
                    sx={{
                      p: 2,
                      bgcolor: 'white',
                      borderRadius: 2,
                      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #EAEAEA',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >           
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box
                        onClick={() => isViewOnly() ? null : handleFollowUpdate(alerts[0]._id || '')}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          cursor: 'pointer',
                          color: '#0066FF',
                          fontWeight: 500,
                          opacity: isViewOnly() ? 0.5 : 1,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 10,
                          border: '1px solid #E0E0E0',
                          bgcolor: 'transparent',
                          fontSize: '14px',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                          },
                          ml: 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {alerts[0].isFollowing ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M6.99968 0.833374C4.02913 0.833374 1.61827 3.22772 1.61825 6.18468C1.61818 6.87247 1.57193 7.39159 1.25481 7.85817C1.21072 7.9221 1.15222 8.00217 1.0883 8.08966C0.977267 8.24164 0.849859 8.41603 0.753231 8.56704C0.582689 8.83357 0.416071 9.15498 0.358792 9.5295C0.171916 10.7514 1.03338 11.5425 1.89131 11.897C2.44899 12.1274 3.04588 12.3153 3.6675 12.4606C3.6634 12.5298 3.6701 12.6008 3.68887 12.6714C4.07359 14.1191 5.42024 15.1669 6.99984 15.1669C8.57944 15.1669 9.92609 14.1191 10.3108 12.6714C10.3296 12.6008 10.3363 12.5298 10.3322 12.4606C10.9537 12.3152 11.5505 12.1273 12.108 11.897C12.966 11.5425 13.8274 10.7514 13.6406 9.5295C13.5833 9.15499 13.4167 8.83357 13.2461 8.56704C13.1495 8.41604 13.0221 8.2417 12.9111 8.08972C12.8472 8.00224 12.7887 7.92215 12.7446 7.85822C12.4274 7.39162 12.3812 6.87256 12.3811 6.18473C12.3811 3.22774 9.97023 0.833374 6.99968 0.833374ZM8.87123 12.7193C7.63997 12.8714 6.35974 12.8714 5.12847 12.7193C5.4664 13.3728 6.17059 13.8335 6.99984 13.8335C7.82911 13.8335 8.53331 13.3727 8.87123 12.7193Z" fill="#0066FF" />
                            </svg>
                            <Typography variant="body2">Following</Typography>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M8.00012 0.833328C4.95497 0.833328 2.48355 3.29418 2.48353 6.33329C2.48347 7.04018 2.43605 7.57372 2.11097 8.05325C2.06577 8.11897 2.00579 8.20127 1.94026 8.2912C1.82644 8.4474 1.69585 8.62661 1.59679 8.78182C1.42197 9.05575 1.25116 9.38609 1.19245 9.77101C1.00088 11.0268 1.88398 11.8399 2.76346 12.2042C3.4182 12.4755 4.12567 12.6894 4.86357 12.8459C5.24629 14.1929 6.51269 15.1666 7.99947 15.1666C9.48615 15.1666 10.7525 14.1931 11.1353 12.8462C11.8737 12.6896 12.5816 12.4756 13.2368 12.2042C14.1162 11.8399 14.9994 11.0268 14.8078 9.77101C14.7491 9.3861 14.5783 9.05576 14.4034 8.78182C14.3044 8.62662 14.1738 8.44741 14.06 8.29121C13.9945 8.20131 13.9345 8.11901 13.8893 8.05331C13.5642 7.57375 13.5168 7.04027 13.5167 6.33333C13.5167 3.2942 11.0453 0.833328 8.00012 0.833328ZM3.48353 6.33333C3.48353 3.84961 5.50411 1.83333 8.00012 1.83333C10.4961 1.83333 12.5167 3.84965 12.5167 6.33337C12.5168 7.05499 12.5524 7.86444 13.0627 8.61613L13.0643 8.61847C13.1482 8.74056 13.2219 8.84064 13.2913 8.93497C13.3838 9.06063 13.4688 9.17611 13.5605 9.3198C13.7026 9.54255 13.7908 9.73558 13.8192 9.92181C13.9112 10.5247 13.5266 11.0017 12.8541 11.2804C10.0014 12.4621 5.99882 12.4621 3.14618 11.2804C2.47358 11.0017 2.08904 10.5247 2.18101 9.92181C2.20942 9.73558 2.29759 9.54255 2.43975 9.3198C2.53145 9.17611 2.61643 9.06065 2.70891 8.935C2.77824 8.8408 2.85215 8.74036 2.93592 8.61848L2.93752 8.61613C3.44788 7.86444 3.48347 7.05495 3.48353 6.33333ZM9.9754 13.0422C8.67637 13.2082 7.32244 13.2081 6.02345 13.0421C6.40445 13.7079 7.14181 14.1666 7.99947 14.1666C8.85706 14.1666 9.59436 13.708 9.9754 13.0422Z" fill="#616161" />
                            </svg>
                            <Typography variant="body2">Follow</Typography>
                          </>
                        )}  
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#757575', fontSize: '14px' }}>
                          {formatRelativeTime(alerts[0].createdAt)}
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
                        flex: 1
                      }}>
                        {alerts[0].title || ""}
                      </Typography>
                    </Box>

                    {/* Location & Time info */}
                    <Typography variant="body2"
                      sx={{
                        color: '#616161',
                        fontSize: '14px',
                        mb: 1
                      }}
                    >
                      {alerts[0].city || "Edinburgh"}
                    </Typography>

                    {/* Alert Content */}
                    <Typography variant="body2" sx={{
                      mb: 1.5,
                      color: '#333',
                      flex: 1
                    }}>
                      {alerts[0].description || ""}
                      {alerts[0].recommendedAction && ` ${alerts[0].recommendedAction}`}
                    </Typography>

                    {/* Alert Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Start and End Time */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontSize:'14px',color:'#757575',fontWeight: 400 }}>
                            Start: {alerts[0].expectedStart ? formatDateForDisplay(alerts[0].expectedStart) : "06 May 9:00AM"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontSize:'14px',color:'#757575',fontWeight: 400 }}>
                            End: {alerts[0].expectedEnd ? formatDateForDisplay(alerts[0].expectedEnd) : "06 May 9:00AM"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Impact Level */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          fontSize: '14px',
                          borderRadius: 1,
                          backgroundColor: alerts[0].risk === 'Low' ? '#e6f4ea' :
                            alerts[0].risk === 'Medium' || !alerts[0].risk ? '#fff4e5' :
                              alerts[0].risk === 'High' ? '#fdecea' : 'transparent',
                          color: alerts[0].risk === 'Low' ? '#00855b' :
                            alerts[0].risk === 'Medium' || !alerts[0].risk ? '#c17e00' :
                              alerts[0].risk === 'High' ? '#d32f2f' : 'inherit',
                          fontWeight: 500,
                        }}>
                          {alerts[0].risk === 'Medium' || !alerts[0].risk ? 'Moderate Impact' : `${alerts[0].risk} Impact`}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                )
              )}

              {/* Render rest of the alerts - starting from index 0 or 1 depending on the first position */}
              {alerts.map((alert: AlertType, index: number) => {
                // Skip rendering if this alert would have been in the first position
                // and we're already showing a card or if we've already rendered it
                const startIndex = ((isAuthenticated && userProfile && !userProfile.isProfileComplete && showUnlockFeaturesCard) || (!isAuthenticated && showGetAccessCard)) ? 0 : 1;

                if (index < startIndex) return null;

                return (
                  <Paper
                    key={`alert-${alert._id}-${index}`}
                    sx={{
                      p: 2,
                      bgcolor: 'white',
                      borderRadius: 2,
                      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #EAEAEA',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
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
                          color: '#0066FF',
                          fontWeight: 500,
                          opacity: isViewOnly() ? 0.5 : 1,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 10,
                          border: '1px solid #E0E0E0',
                          bgcolor: 'transparent',
                          fontSize: '14px',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                          },
                          ml: 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {alert.isFollowing ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M6.99968 0.833374C4.02913 0.833374 1.61827 3.22772 1.61825 6.18468C1.61818 6.87247 1.57193 7.39159 1.25481 7.85817C1.21072 7.9221 1.15222 8.00217 1.0883 8.08966C0.977267 8.24164 0.849859 8.41603 0.753231 8.56704C0.582689 8.83357 0.416071 9.15498 0.358792 9.5295C0.171916 10.7514 1.03338 11.5425 1.89131 11.897C2.44899 12.1274 3.04588 12.3153 3.6675 12.4606C3.6634 12.5298 3.6701 12.6008 3.68887 12.6714C4.07359 14.1191 5.42024 15.1669 6.99984 15.1669C8.57944 15.1669 9.92609 14.1191 10.3108 12.6714C10.3296 12.6008 10.3363 12.5298 10.3322 12.4606C10.9537 12.3152 11.5505 12.1273 12.108 11.897C12.966 11.5425 13.8274 10.7514 13.6406 9.5295C13.5833 9.15499 13.4167 8.83357 13.2461 8.56704C13.1495 8.41604 13.0221 8.2417 12.9111 8.08972C12.8472 8.00224 12.7887 7.92215 12.7446 7.85822C12.4274 7.39162 12.3812 6.87256 12.3811 6.18473C12.3811 3.22774 9.97023 0.833374 6.99968 0.833374ZM8.87123 12.7193C7.63997 12.8714 6.35974 12.8714 5.12847 12.7193C5.4664 13.3728 6.17059 13.8335 6.99984 13.8335C7.82911 13.8335 8.53331 13.3727 8.87123 12.7193Z" fill="#0066FF" />
                            </svg>
                            <Typography variant="body2">Following</Typography>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M8.00012 0.833328C4.95497 0.833328 2.48355 3.29418 2.48353 6.33329C2.48347 7.04018 2.43605 7.57372 2.11097 8.05325C2.06577 8.11897 2.00579 8.20127 1.94026 8.2912C1.82644 8.4474 1.69585 8.62661 1.59679 8.78182C1.42197 9.05575 1.25116 9.38609 1.19245 9.77101C1.00088 11.0268 1.88398 11.8399 2.76346 12.2042C3.4182 12.4755 4.12567 12.6894 4.86357 12.8459C5.24629 14.1929 6.51269 15.1666 7.99947 15.1666C9.48615 15.1666 10.7525 14.1931 11.1353 12.8462C11.8737 12.6896 12.5816 12.4756 13.2368 12.2042C14.1162 11.8399 14.9994 11.0268 14.8078 9.77101C14.7491 9.3861 14.5783 9.05576 14.4034 8.78182C14.3044 8.62662 14.1738 8.44741 14.06 8.29121C13.9945 8.20131 13.9345 8.11901 13.8893 8.05331C13.5642 7.57375 13.5168 7.04027 13.5167 6.33333C13.5167 3.2942 11.0453 0.833328 8.00012 0.833328ZM3.48353 6.33333C3.48353 3.84961 5.50411 1.83333 8.00012 1.83333C10.4961 1.83333 12.5167 3.84965 12.5167 6.33337C12.5168 7.05499 12.5524 7.86444 13.0627 8.61613L13.0643 8.61847C13.1482 8.74056 13.2219 8.84064 13.2913 8.93497C13.3838 9.06063 13.4688 9.17611 13.5605 9.3198C13.7026 9.54255 13.7908 9.73558 13.8192 9.92181C13.9112 10.5247 13.5266 11.0017 12.8541 11.2804C10.0014 12.4621 5.99882 12.4621 3.14618 11.2804C2.47358 11.0017 2.08904 10.5247 2.18101 9.92181C2.20942 9.73558 2.29759 9.54255 2.43975 9.3198C2.53145 9.17611 2.61643 9.06065 2.70891 8.935C2.77824 8.8408 2.85215 8.74036 2.93592 8.61848L2.93752 8.61613C3.44788 7.86444 3.48347 7.05495 3.48353 6.33333ZM9.9754 13.0422C8.67637 13.2082 7.32244 13.2081 6.02345 13.0421C6.40445 13.7079 7.14181 14.1666 7.99947 14.1666C8.85706 14.1666 9.59436 13.708 9.9754 13.0422Z" fill="#616161" />
                            </svg>
                            <Typography variant="body2">Follow</Typography>
                          </>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#757575', fontSize: '14px' }}>
                          {formatRelativeTime(alert.createdAt)}
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
                        flex: 1
                      }}>
                        {alert.title || ""}
                      </Typography>

                    </Box>

                    {/* Location & Time info */}
                    <Typography variant="body2"
                      sx={{
                        color: '#616161',
                        fontSize: '14px',
                        mb: 1
                      }}
                    >
                      {alert.city || "Edinburgh"}
                    </Typography>

                    {/* Alert Content */}
                    <Typography variant="body2" sx={{
                      mb: 1.5,
                      color: '#333',
                      flex: 1
                    }}>
                      {alert.description || ""}
                      {alert.recommendedAction && ` ${alert.recommendedAction}`}
                    </Typography>

                    {/* Alert Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Start and End Time */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="body2"  sx={{ fontSize:'14px',color:'#757575',fontWeight: 400 }}>
                            Start: {alert.expectedStart ? formatDateForDisplay(alert.expectedStart) : "06 May 9:00AM"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2"  sx={{ fontSize:'14px',color:'#757575',fontWeight: 400 }}>
                            End: {alert.expectedEnd ? formatDateForDisplay(alert.expectedEnd) : "06 May 9:00AM"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Impact Level */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          fontSize: '14px',
                          borderRadius: 1,
                          backgroundColor: alert.risk === 'Low' ? '#e6f4ea' :
                            alert.risk === 'Medium' || !alert.risk ? '#fff4e5' :
                              alert.risk === 'High' ? '#fdecea' : 'transparent',
                          color: alert.risk === 'Low' ? '#00855b' :
                            alert.risk === 'Medium' || !alert.risk ? '#c17e00' :
                              alert.risk === 'High' ? '#d32f2f' : 'inherit',
                          fontWeight: 500,
                        }}>
                          {alert.risk === 'Medium' || !alert.risk ? 'Moderate Impact' : `${alert.risk} Impact`}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
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
    </Layout>
  );
}
