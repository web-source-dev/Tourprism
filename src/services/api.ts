import axios from 'axios';

// Define custom types that avoid using 'any'
interface CustomAxiosRequestConfig {
  headers?: Record<string, unknown>;
  baseURL?: string;
  withCredentials?: boolean;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

interface CustomAxiosInstance {
  create: (config: CustomAxiosRequestConfig) => CustomAxiosInstance;
  interceptors: {
    request: {
      use: (onFulfilled: (config: CustomAxiosRequestConfig) => CustomAxiosRequestConfig) => void;
    };
    response: {
      use: (
        onFulfilled: (response: CustomAxiosResponse<unknown>) => CustomAxiosResponse<unknown>, 
        onRejected: (error: CustomAxiosError) => Promise<never>
      ) => void;
    };
  };
  get: <T>(url: string, config?: CustomAxiosRequestConfig) => Promise<CustomAxiosResponse<T>>;
  post: <T>(url: string, data?: unknown, config?: CustomAxiosRequestConfig) => Promise<CustomAxiosResponse<T>>;
  put: <T>(url: string, data?: unknown, config?: CustomAxiosRequestConfig) => Promise<CustomAxiosResponse<T>>;
  delete: <T>(url: string, config?: CustomAxiosRequestConfig) => Promise<CustomAxiosResponse<T>>;
  patch: <T>(url: string, data?: unknown, config?: CustomAxiosRequestConfig) => Promise<CustomAxiosResponse<T>>;
}



interface CustomAxiosResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, unknown>;
  config: Record<string, unknown>;
}

interface CustomAxiosError<T = unknown> extends Error {
  response?: {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, unknown>;
    config: Record<string, unknown>;
    message?: string;
  };
}

import { User, Alert, Notification } from '../types';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tourprism-backend.onrender.com';

// Cast axios to our custom type that avoids using 'any'
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
}) as unknown as CustomAxiosInstance;

// Add token to requests if it exists
api.interceptors.request.use((config: CustomAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || Cookies.get('token');
    if (token) {
      // Initialize headers if undefined
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const getErrorMessage = (error: CustomAxiosError): string => {
  // Handle network errors
  if (!error.response) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Handle specific error messages from backend
  const backendMessage = (error.response?.data as { message?: string })?.message;
  if (backendMessage) {
    // Map backend messages to user-friendly messages
    const messageMap: Record<string, string> = {
      'Invalid credentials': 'The email or password you entered is incorrect.',
      'User already exists': 'An account with this email already exists.',
      'User not found': 'No account found with this email address.',
      'Invalid or expired OTP': 'The verification code is invalid or has expired.',
      'Email already verified': 'Your email is already verified.',
      'Please wait before requesting another OTP': 'Please wait a moment before requesting another verification code.',
      'This email is registered with Google. Please continue with Google login.': 'This email is linked to a Google account. Please use Google Sign In instead.',
      'Server error': 'We encountered a problem with our server. Please try again later.',
      'No token provided': 'Your session has expired. Please sign in again.',
      'Invalid token': 'Your session is invalid. Please sign in again.',
      'Password must be at least 6 characters long': 'Please use a password that is at least 6 characters long.',
      'The password provided is too weak': 'Please use a stronger password with a mix of letters, numbers, and symbols.',
      'Registration successful. Please check your email for verification code.': 'Registration successful! Please check your email for a verification code.',
      'OTP verified successfully': 'Verification successful!',
      'Password reset successful': 'Your password has been reset successfully!'
    };
    return messageMap[backendMessage] || backendMessage;
  }

  // Handle HTTP status code based errors
  if (error.response) {
    switch (error.response.status) {
      case 400:
        return 'The request contains invalid data. Please check your input and try again.';
      case 401:
        return 'You need to be logged in to perform this action.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
    }
  }

  // Default error message
  return 'Something went wrong. Please try again later.';
};

// Response interceptor
api.interceptors.response.use(
  (response: CustomAxiosResponse) => response,
  (error: CustomAxiosError) => {
    // Check if error is due to authentication and we're not on a public page
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/feed'];
      const currentPath = window.location.pathname;
      const isPublicRoute = publicRoutes.some(route => currentPath === route);
      
      // Only redirect if not on a public route and token exists
      const token = localStorage.getItem('token');
      if (token && !isPublicRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/session-expired';
      }
    }
    return Promise.reject(error);
  }
);

// Add Collaborator interface to extend the User type
interface Collaborator {
  _id: string;
  email: string;
  role: 'viewer' | 'manager';
  status: 'invited' | 'active' | 'restricted' | 'deleted';
  invitationToken?: string;
  createdAt?: string;
}

// Extend the User interface to include collaborator information
interface ExtendedUser extends User {
  collaborator?: Collaborator;
  isCollaborator?: boolean;
}

// Update the AuthResponse interface to use ExtendedUser
interface AuthResponse {
  token: string;
  user: ExtendedUser;
  requireMFA?: boolean;
  needsVerification?: boolean;
  userId?: string;
  message?: string;
}

interface OTPVerifyRequest {
  userId: string;
  otp: string;
}

interface PasswordResetRequest {
  userId: string;
  otp: string;
  newPassword: string;
}

export const register = async (userData: Record<string, unknown>): Promise<AuthResponse> => {
  try {
    const response: CustomAxiosResponse<AuthResponse> = await api.post('/auth/register', userData);
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Also set in cookies for middleware
      Cookies.set('token', response.data.token, { path: '/' });
    }
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

// Update login function to handle collaborator login
export const login = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
  try {
    const response: CustomAxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
    
    // Only set token and user in localStorage if they exist in the response
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Store collaborator info if present
      if (response.data.user.collaborator) {
        localStorage.setItem('isCollaborator', 'true');
        localStorage.setItem('collaboratorRole', response.data.user.collaborator.role);
        localStorage.setItem('collaboratorEmail', response.data.user.collaborator.email);
      }
      
      // Also set in cookies for middleware
      Cookies.set('token', response.data.token, { path: '/' });
    }
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const googleLogin = (): void => {
  if (typeof window !== 'undefined') {
    window.location.href = `${API_URL}/auth/google`;
  }
};

export const handleGoogleCallback = async (token: string): Promise<ExtendedUser> => {
  if (token && typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    // Also set in cookies for middleware
    Cookies.set('token', token, { path: '/' });
    
    // Fetch user data using the token
    try {
      const response: CustomAxiosResponse<ExtendedUser> = await api.get('/auth/user/profile');
      // Store the complete user object for consistent auth
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Store collaborator info if present
      if (response.data.isCollaborator && response.data.collaborator) {
        localStorage.setItem('isCollaborator', 'true');
        localStorage.setItem('collaboratorRole', response.data.collaborator.role);
        localStorage.setItem('collaboratorEmail', response.data.collaborator.email);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as CustomAxiosError));
    }
  }
  throw new Error('No token provided');
};

// Update logout function to clear collaborator data
export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isCollaborator');
    localStorage.removeItem('collaboratorRole');
    localStorage.removeItem('collaboratorEmail');
    // Also remove from cookies
    Cookies.remove('token', { path: '/' });
    window.location.href = '/';
  }
};

export const forgotPassword = async (data: { email: string }): Promise<{ userId: string }> => {
  try {
    const response: CustomAxiosResponse<{ userId: string }> = await api.post('/auth/forgot-password', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const verifyOTP = async (data: OTPVerifyRequest): Promise<AuthResponse> => {
  try {
    const response: CustomAxiosResponse<AuthResponse> = await api.post('/auth/verify-email', data);
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Also set in cookies for middleware
      Cookies.set('token', response.data.token, { path: '/' });
    }
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const verifyResetOTP = async (data: OTPVerifyRequest): Promise<{ success: boolean }> => {
  try {
    const response: CustomAxiosResponse<{ success: boolean }> = await api.post('/auth/verify-reset-otp', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const resetPassword = async (data: PasswordResetRequest): Promise<{ success: boolean }> => {
  try {
    const response: CustomAxiosResponse<{ success: boolean }> = await api.post('/auth/reset-password', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const resendOTP = async (data: { userId: string }): Promise<{ success: boolean }> => {
  try {
    const response: CustomAxiosResponse<{ success: boolean }> = await api.post('/auth/resend-otp', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const resendResetOTP = async (data: { userId: string }): Promise<{ success: boolean }> => {
  try {
    const response: CustomAxiosResponse<{ success: boolean }> = await api.post('/auth/resend-reset-otp', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

// Alert related API calls
export const createAlert = async (formData: FormData): Promise<Alert> => {
  try {
    const response: CustomAxiosResponse<Alert> = await api.post('/api/alerts/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const getAlerts = async (filters = {}): Promise<{ alerts: Alert[], totalCount: number }> => {
  try {
    const response: CustomAxiosResponse<{ alerts: Alert[], totalCount: number }> = await api.get('/api/alerts', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const getAlertById = async (alertId: string): Promise<Alert> => {
  try {
    const response: CustomAxiosResponse<Alert> = await api.get(`/api/alerts/${alertId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const getUserAlerts = async (): Promise<Alert[]> => {
  try {
    const response: CustomAxiosResponse<Alert[]> = await api.get('/api/alerts/user/my-alerts');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

interface FetchAlertsParams {
  city?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  startDate?: string;
  endDate?: string;
  alertCategory?: string[];
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  originOnly?: boolean;
}

export const fetchAlerts = async (params: FetchAlertsParams = {}): Promise<{ alerts: Alert[], totalCount: number }> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Location filters - ensure these are properly handled
    if (params.city) {
      queryParams.append('city', params.city);
    }
    
    if (params.latitude !== undefined && params.longitude !== undefined) {
      // Validate and ensure coordinates are valid numbers
      const latitude = Number(params.latitude);
      const longitude = Number(params.longitude);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        queryParams.append('latitude', latitude.toFixed(6));
        queryParams.append('longitude', longitude.toFixed(6));
        
        // Only append distance if coordinates are present and distance is valid
        if (params.distance && Number(params.distance) > 0) {
          queryParams.append('distance', String(Number(params.distance)));
        }
        
        // Add origin-only flag if specified
        if (params.originOnly) {
          queryParams.append('originOnly', 'true');
        }
      }
    }

    // Time range filters
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    // Update incident type filters to use alertCategory
    if (params.alertCategory && Array.isArray(params.alertCategory) && params.alertCategory.length > 0) {
      params.alertCategory.forEach(category => {
        queryParams.append('alertCategory[]', category);
      });
    }

    // Pagination
    queryParams.append('limit', String(params.limit || 20));
    queryParams.append('page', String(params.page || 1));

    // Sorting
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
      queryParams.append('sortOrder', params.sortOrder || 'desc');
    }
    
    // Debug log the query string
    const queryString = queryParams.toString();
    console.log('API Call queryString:', queryString);
    
    const endpoint = queryString ? `/api/alerts?${queryString}` : '/api/alerts';
    
    const response: CustomAxiosResponse<{ alerts: Alert[], totalCount: number }> = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    const axiosError = error as CustomAxiosError;
    throw axiosError.response?.data || {
      message: 'Failed to fetch alerts. Please try again later.',
      error: (error as Error).message
    };
  }
};

// Function to fetch archived alerts (alerts whose expectedEnd date has passed)
export const fetchArchivedAlerts = async (params: FetchAlertsParams = {}): Promise<{ alerts: Alert[], totalCount: number }> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Location filters
    if (params.city) {
      queryParams.append('city', params.city);
    }
    
    if (params.latitude !== undefined && params.longitude !== undefined) {
      // Validate and ensure coordinates are valid numbers
      const latitude = Number(params.latitude);
      const longitude = Number(params.longitude);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        queryParams.append('latitude', latitude.toFixed(6));
        queryParams.append('longitude', longitude.toFixed(6));
        
        // Only append distance if coordinates are present and distance is valid
        if (params.distance && Number(params.distance) > 0) {
          queryParams.append('distance', String(Number(params.distance)));
        }
        
        // Add origin-only flag if specified
        if (params.originOnly) {
          queryParams.append('originOnly', 'true');
        }
      }
    }

    if (params.alertCategory && Array.isArray(params.alertCategory) && params.alertCategory.length > 0) {
      params.alertCategory.forEach(category => {
        queryParams.append('alertCategory[]', category);
      });
    }

    // Pagination
    queryParams.append('limit', String(params.limit || 20));
    queryParams.append('page', String(params.page || 1));

    // Sorting
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    
    // Debug log the query string
    const queryString = queryParams.toString();
    console.log('API Call to archived alerts queryString:', queryString);
    
    const endpoint = queryString ? `/api/archived-alerts?${queryString}` : '/api/archived-alerts';
    
    const response: CustomAxiosResponse<{ alerts: Alert[], totalCount: number }> = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching archived alerts:', error);
    const axiosError = error as CustomAxiosError;
    throw axiosError.response?.data || {
      message: 'Failed to fetch archived alerts. Please try again later.',
      error: (error as Error).message
    };
  }
};

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response: CustomAxiosResponse<Notification[]> = await api.get('/api/notifications');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const markAsRead = async (notificationId: string): Promise<{ success: boolean }> => {
  try {
    const response: CustomAxiosResponse<{ success: boolean }> = await api.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const deleteNotification = async (notificationId: string): Promise<{ success: boolean }> => {
  try {
    const response: CustomAxiosResponse<{ success: boolean }> = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export const markAllAsRead = async (): Promise<{ success: boolean }> => {
  try {
    const response: CustomAxiosResponse<{ success: boolean }> = await api.patch('/api/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export interface UserFilters extends Record<string, unknown> {
  role?: string;
  status?: string;
  company?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getAllUsers = async (params: UserFilters = {}): Promise<{ users: User[], totalCount: number }> => {
  try {
    const response = await api.get<{ users: User[], totalCount: number }>('/api/admin/users', { params });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const updateUserRole = async (userId: string, role: string): Promise<{ success: boolean }> => {
  try {
    const response = await api.put<{ success: boolean }>(`/api/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const updateUserStatus = async (userId: string, status: string): Promise<{ success: boolean }> => {
  try {
    const response = await api.put<{ success: boolean }>(`/api/admin/users/${userId}/status`, { status });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const getUserProfile = async (): Promise<{ user: User }> => {
  try {
    // Don't use the admin endpoint for getting the current user's profile
    // Instead use the /profile endpoint which is designed for this
    const response = await api.get<User>('/profile');
    // The profile endpoint returns the user object directly, not wrapped in { user }
    // So we need to match the expected return format
    return { user: response.data };
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

// Get user by ID (for admin panel)
export const getUserById = async (userId: string): Promise<{ user: User }> => {
  try {
    const response = await api.get<{ user: User }>(`/api/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    const response = await api.delete<{ success: boolean }>(`/api/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const getAllAlertsAdmin = async (params = {}): Promise<{ alerts: Alert[], totalCount: number }> => {
  try {
    const response = await api.get<{ alerts: Alert[], totalCount: number }>('/api/admin/alerts', { params });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const updateAlertStatus = async (alertId: string, status: string): Promise<{ success: boolean }> => {
  try {
    const response = await api.put<{ success: boolean }>(`/api/admin/alerts/${alertId}/status`, { status });
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const deleteAlert = async (alertId: string): Promise<{ success: boolean }> => {
  try {
    const response = await api.delete<{ success: boolean }>(`/api/admin/alerts/${alertId}`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const updateAlert = async (alertId: string, alertData: Partial<Alert>): Promise<{ success: boolean; alert: Alert }> => {
  try {
    const response = await api.put<{ success: boolean; alert: Alert }>(`/api/admin/alerts/${alertId}`, alertData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const archiveAlert = async (alertId: string): Promise<{ success: boolean; alert: Alert }> => {
  try {
    const response = await api.put<{ success: boolean; alert: Alert }>(`/api/admin/alerts/${alertId}/archive`, {});
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const duplicateAlert = async (alertId: string): Promise<{ success: boolean; alert: Alert }> => {
  try {
    const response = await api.post<{ success: boolean; alert: Alert }>(`/api/admin/alerts/${alertId}/duplicate`, {});
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const viewAlertDetails = async (alertId: string): Promise<Alert> => {
  try {
    const response = await api.get<Alert>(`/api/admin/alerts/${alertId}/details`);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const createNewAlert = async (alertData: Partial<Alert>): Promise<{ success: boolean; alert: Alert }> => {
  try {
    const response = await api.post<{ success: boolean; alert: Alert }>('/api/admin/alerts', alertData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

// Define DashboardStats interface for the dashboard stats return type
interface DashboardStats {
  totalUsers: number;
  totalAlerts: number;
  alertsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
    published: number;
  };
  recentAlerts: {
    _id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    city: string;
  }[];
  totalSubscribers: number;
  activeUsers: number;
}

// Define a type for API errors that can be used in catch blocks
export interface ApiError extends Error {
  message: string;
  code?: string;
  status?: number;
  data?: unknown;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get<DashboardStats>('/api/admin/dashboard');
    return response.data;
  } catch (error) {
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const updatePersonalInfo = async (data: { 
  firstName: string; 
  lastName: string; 
  email?: string;
}): Promise<User> => {
  try {
    console.log('Updating personal info with data:', data);
    const response = await api.put<User>('/profile/personal-info', data);
    console.log('Personal info update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating personal info:', error);
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const updateCompanyInfo = async (data: {
  companyName?: string;
  companyType?: string;
  mainOperatingRegions?: Array<{
    name: string;
    latitude: number | null;
    longitude: number | null;
    placeId: string | null;
  }>;
}): Promise<User> => {
  try {
    console.log('API: Sending company info update with data:', JSON.stringify(data));
    
    if (data.companyName === undefined) {
      console.warn('Warning: companyName is undefined in updateCompanyInfo');
    }
    
    const response = await api.put<User>('/profile/company-info', data);
    
    if (!response.data) {
      throw new Error('No data returned from server');
    }
    
    console.log('API: Company info update response:', response.data);
    
    if (!response.data.company) {
      console.warn('Warning: Company data missing in server response');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating company info:', error);
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const updatePreferences = async (data: {
  communication?: {
    emailPrefrences?: boolean;
    whatsappPrefrences?: boolean;
  };
  alertSummaries?: {
    daily?: boolean;
    weekly?: boolean;
    monthly?: boolean;
  };
}): Promise<User> => {
  try {
    console.log('Updating preferences with data:', data);
    const response = await api.put<User>('/profile/preferences', data);
    console.log('Preferences update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw getErrorMessage(error as CustomAxiosError);
  }
};

// Update subscription status
export const updateSubscriptionStatus = async (isSubscribed: boolean): Promise<User> => {
  try {
    console.log('Updating subscription status to:', isSubscribed);
    const response = await api.put<User>('/profile/subscription', { isSubscribed });
    console.log('Subscription update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw getErrorMessage(error as CustomAxiosError);
  }
};

export const getCompanySuggestions = async (query: string): Promise<string[]> => {
  try {
    const response = await api.get<string[]>('/profile/company-suggestions', {
      params: { query }
    });
    console.log('Company suggestions response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching company suggestions:', error);
    return [];
  }
};

// Get collaborators
export const getCollaborators = async (): Promise<{ collaborators: Collaborator[] }> => {
  try {
    const response = await api.get<{ collaborators: Collaborator[] }>('/profile/collaborators');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

// Invite a collaborator
export const inviteCollaborator = async (data: { email: string; name?: string; role: 'viewer' | 'manager' }): Promise<{ message: string; collaborator?: Collaborator }> => {
  try {
    const response = await api.post<{ message: string; collaborator?: Collaborator }>('/profile/collaborators/invite', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

// Resend invitation
export const resendCollaboratorInvitation = async (collaboratorId: string): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>(`/profile/collaborators/${collaboratorId}/resend`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

// Update collaborator role
export const updateCollaboratorRole = async (collaboratorId: string, role: 'viewer' | 'manager'): Promise<{ message: string; collaborator: Collaborator }> => {
  try {
    const response = await api.put<{ message: string; collaborator: Collaborator }>(`/profile/collaborators/${collaboratorId}/role`, { role });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

// Update collaborator status
export const updateCollaboratorStatus = async (collaboratorId: string, status: 'active' | 'restricted'): Promise<{ message: string; collaborator: Collaborator }> => {
  try {
    const response = await api.put<{ message: string; collaborator: Collaborator }>(`/profile/collaborators/${collaboratorId}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

// Delete a collaborator
export const deleteCollaborator = async (collaboratorId: string): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>(`/profile/collaborators/${collaboratorId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

// Verify invitation token
export const verifyInvitationToken = async (token: string, email: string): Promise<{ valid: boolean; ownerName: string; ownerEmail: string; companyName: string; collaboratorEmail: string; role: 'viewer' | 'manager' }> => {
  try {
    const response = await api.get<{ valid: boolean; ownerName: string; ownerEmail: string; companyName: string; collaboratorEmail: string; role: 'viewer' | 'manager' }>(`/profile/collaborators/verify-invitation?token=${token}&email=${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

// Accept invitation
export const acceptInvitation = async (data: { token: string; email: string; password: string }): Promise<{ message: string; token: string; user: unknown }> => {
  try {
    const response = await api.post<{ message: string; token: string; user: unknown }>('/profile/collaborators/accept-invitation', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error as CustomAxiosError));
  }
};

export { api };

// Define log filters type
export interface LogFilters {
  action?: string;
  userId?: string;
  userEmail?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Get all logs with filtering
export const getAllLogs = async (filters: LogFilters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/api/logs?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }
};

// Get logs for a specific user
export const getUserLogs = async (userId: string, filters: LogFilters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/api/logs/user/${userId}?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user logs:', error);
    throw error;
  }
};

// Get summary of activity
export const getActivitySummary = async (startDate?: string, endDate?: string) => {
  try {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const response = await api.get(`/api/logs/summary?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    throw error;
  }
}; 
