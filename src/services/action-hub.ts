import { Alert, ActionHubItem } from '../types';
import { api } from './api';

/**
 * Fetch all followed alerts in the user's Action Hub
 */
export const getFollowedAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await api.get('/api/action-hub');
    return response.data as Alert[];
  } catch (error) {
    console.error('Error fetching followed alerts:', error);
    throw error;
  }
};

/**
 * For backward compatibility - will fetch the same data as getFollowedAlerts
 * @deprecated Use getFollowedAlerts instead
 */
export const getFlaggedAlerts = async (): Promise<Alert[]> => {
  return getFollowedAlerts();
};

/**
 * Follow/unfollow an alert and add it to Action Hub
 */
export const followAlert = async (alertId: string): Promise<{ following: boolean; numberOfFollows: number }> => {
  try {
    const response = await api.post(`/api/action-hub/follow/${alertId}`);
    return response.data as { following: boolean; numberOfFollows: number };
  } catch (error) {
    console.error(`Error following alert ${alertId}:`, error);
    throw error;
  }
};

/**
 * Fetch a specific Action Hub alert by ID
 */
export const getFlaggedAlertById = async (id: string): Promise<ActionHubItem> => {
  try {
    const response = await api.get(`/api/action-hub/${id}`);
    return response.data as ActionHubItem;
  } catch (error) {
    console.error(`Error fetching flagged alert ${id}:`, error);
    throw error;
  }
};

/**
 * Flag an alert and add it to Action Hub
 */
export const flagAlert = async (alertId: string): Promise<{ isFlagged: boolean; flagCount: number }> => {
  try {
    const response = await api.post(`/api/action-hub/flag/${alertId}`);
    return response.data as { isFlagged: boolean; flagCount: number };
  } catch (error) {
    console.error(`Error flagging alert ${alertId}:`, error);
    throw error;
  }
};

/**
 * Mark the status of an Action Hub item
 */
export const markAlertStatus = async (id: string, status: 'new' | 'in_progress' | 'handled'): Promise<{ message: string; status: string }> => {
  try {
    // First, try using the status endpoint
    try {
      const response = await api.post(`/api/action-hub/${id}/status`, { status });
      return response.data as { message: string; status: string };
    } catch (statusError) {
      // If the status endpoint doesn't work, use the resolve endpoint for 'handled' status
      if (status === 'handled') {
        const response = await api.post(`/api/action-hub/${id}/resolve`, { status });
        return response.data as { message: string; status: string };
      } else {
        throw statusError; // Re-throw if not handled status
      }
    }
  } catch (error) {
    console.error(`Error updating status for alert ${id}:`, error);
    throw error;
  }
};

/**
 * Set the active tab for an Action Hub item
 */
export const setActiveTab = async (id: string, tab: 'notify_guests' | 'add_notes'): Promise<{ message: string; currentActiveTab: string }> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/tab`, { tab });
    return response.data as { message: string; currentActiveTab: string };
  } catch (error) {
    console.error(`Error setting active tab for ${id}:`, error);
    throw error;
  }
};

/**
 * Add a note to an Action Hub item
 */
export const addNote = async (id: string, content: string): Promise<{ message: string; note: unknown }> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/notes`, { content });
    return response.data as { message: string; note: unknown };
  } catch (error) {
    console.error(`Error adding note to ${id}:`, error);
    throw error;
  }
};

/**
 * Add guests for notification
 */
export const addGuests = async (id: string, guests: { email: string; name?: string }[]): Promise<{ message: string; guests: unknown[] }> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/guests`, { guests });
    return response.data as { message: string; guests: unknown[] };
  } catch (error) {
    console.error(`Error adding guests to ${id}:`, error);
    throw error;
  }
};

/**
 * Send notifications to guests
 */
export const notifyGuests = async (id: string, message: string, guestIds?: string[]): Promise<{ 
  message: string; 
  notifiedGuests: number;
  emailResults?: { email: string; success: boolean; }[];
}> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/notify`, { 
      message, 
      guestIds 
    });
    return response.data as { 
      message: string; 
      notifiedGuests: number;
      emailResults: { email: string; success: boolean; }[];
    };
  } catch (error) {
    console.error(`Error notifying guests for ${id}:`, error);
    throw error;
  }
};

/**
 * Get action logs for an Action Hub item
 */
export const getActionLogs = async (id: string): Promise<unknown[]> => {
  try {
    const response = await api.get(`/api/action-hub/${id}/logs`);
    return response.data as unknown[];
  } catch (error) {
    console.error(`Error fetching action logs for ${id}:`, error);
    throw error;
  }
};

/**
 * Send notifications to team members (collaborators)
 */

export const notifyTeam = async (id: string, message: string, managersOnly: boolean = false): Promise<{ 
  message: string; 
  notifiedTeamMembers: number;
  emailResults?: { email: string; success: boolean; }[];
}> => {
  try {
    const response = await api.post(`/api/action-hub/${id}/notify-team`, { 
      message,
      managersOnly 
    });
    return response.data as { 
      message: string; 
      notifiedTeamMembers: number;
      emailResults: { email: string; success: boolean; }[];
    };
  } catch (error) {
    console.error(`Error notifying team members for ${id}:`, error);
    throw error;
  }
};
