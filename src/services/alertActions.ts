import { api } from './api';

interface AlertActionResponse {
  following?: boolean;
  numberOfFollows?: number;
  likes?: number;
  liked?: boolean;
  flagged?: boolean;
  flagCount?: number;
}

export const followAlert = async (alertId: string) => {
  try {
    const response = await api.post<AlertActionResponse>(`/api/alerts/${alertId}/follow`);
    return {
      following: response.data.following,
      numberOfFollows: response.data.numberOfFollows
    };
  } catch (error) {
    throw error;
  }
};

export const likeAlert = async (alertId: string) => {
  try {
    const response = await api.post<AlertActionResponse>(`/api/alerts/${alertId}/like`);
    return {
      likes: response.data.likes,
      liked: response.data.liked
    };
  } catch (error) {
    throw error;
  }
};

export const flagAlert = async (alertId: string) => {
  try {
    const response = await api.post<AlertActionResponse>(`/api/alerts/${alertId}/flag`);
    return {
      flagged: response.data.flagged,
      flagCount: response.data.flagCount || 0
    };
  } catch (error) {
    throw error;
  }
};

export const shareAlert = async (alertId: string) => {
  try {
    const response = await api.post<AlertActionResponse>(`/api/alerts/${alertId}/share`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const validateLocation = (
  latitude: number, 
  longitude: number, 
  accuracy: number | null = null
): { isValid: boolean; message?: string; accuracy?: number } => {
  // Basic validation for latitude (-90 to 90) and longitude (-180 to 180)
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return {
      isValid: false,
      message: 'Invalid coordinates provided'
    };
  }
  
  // Check location accuracy when available
  if (accuracy !== null) {
    // Return warning but still valid if accuracy is poor
    if (accuracy > 500) { // Over 500 meters is very poor
      return {
        isValid: true,
        message: 'Very low location accuracy. Results may not be accurate.',
        accuracy
      };
    } else if (accuracy > 100) { // 100-500 meters is moderately poor
      return {
        isValid: true,
        message: 'Low location accuracy. Results may be affected.',
        accuracy
      };
    }
    
    // Good accuracy, no warnings needed
    return {
      isValid: true,
      accuracy
    };
  }
  
  // If no accuracy provided, just return valid
  return {
    isValid: true
  };
};