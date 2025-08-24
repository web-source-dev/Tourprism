import { useState, useEffect, useRef } from 'react';
import { startTimeTracking, endTimeTracking, getActiveTimeTrackingSession } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface UseTimeTrackingOptions {
  pageName?: string;
  autoStart?: boolean;
}

export const useTimeTracking = (options: UseTimeTrackingOptions = {}) => {
  const { pageName = 'feed', autoStart = true } = options;
  const { isAuthenticated } = useAuth();
  
  const [isTracking, setIsTracking] = useState(false);
  const [timeTrackingId, setTimeTrackingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Start time tracking
  const startTracking = async () => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping time tracking');
      return;
    }

    try {
      setError(null);
      
      // Check if there's already an active session
      const { activeSession } = await getActiveTimeTrackingSession(pageName);
      
      if (activeSession) {
        // Use existing session
        setTimeTrackingId(activeSession._id);
        setIsTracking(true);
        startTimeRef.current = Date.now();
        console.log('Resumed existing time tracking session:', activeSession._id);
        return;
      }

      // Create new session
      const { timeTrackingId: newTimeTrackingId } = await startTimeTracking(pageName);
      setTimeTrackingId(newTimeTrackingId);
      setIsTracking(true);
      startTimeRef.current = Date.now();
      console.log('Started new time tracking session:', newTimeTrackingId);
    } catch (err) {
      console.error('Error starting time tracking:', err);
      setError(err instanceof Error ? err.message : 'Failed to start time tracking');
    }
  };

  // End time tracking
  const endTracking = async () => {
    if (!isAuthenticated || !timeTrackingId || !isTracking) {
      return;
    }

    try {
      setError(null);
      const { timeSpent } = await endTimeTracking(timeTrackingId);
      
      setIsTracking(false);
      setTimeTrackingId(null);
      startTimeRef.current = null;
      
      console.log(`Time tracking ended. Time spent: ${timeSpent} seconds`);
      return timeSpent;
    } catch (err) {
      console.error('Error ending time tracking:', err);
      setError(err instanceof Error ? err.message : 'Failed to end time tracking');
    }
  };

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, end tracking
        if (isTracking) {
          endTracking();
        }
      } else {
        // Page is visible again, start tracking
        if (isAuthenticated && !isTracking) {
          startTracking();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, isAuthenticated]);

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTracking && timeTrackingId) {
        // Send a beacon request to end tracking
        const data = JSON.stringify({ timeTrackingId });
        navigator.sendBeacon('/api/time-tracking/end', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTracking, timeTrackingId]);

  // Auto-start tracking when component mounts
  useEffect(() => {
    if (autoStart && isAuthenticated && !isTracking) {
      startTracking();
    }
  }, [isAuthenticated, autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        endTracking();
      }
    };
  }, []);

  return {
    isTracking,
    timeTrackingId,
    error,
    startTracking,
    endTracking
  };
};
