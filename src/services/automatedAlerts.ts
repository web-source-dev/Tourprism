import { api } from './api';

export interface AutomatedAlert {
  _id: string;
  title: string;
  description: string;
  alertCategory: string;
  alertType: string;
  impact: string;
  targetAudience: string[];
  originCity: string;
  originCountry: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  previousVersionNotes?: string;
  confidence?: number;
  expectedStart?: string;
  expectedEnd?: string;
  recommendedAction?: string;
  originLatitude?: number;
  originLongitude?: number;
  impactLocations?: Array<{
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  }>;
}

export interface AlertSummary {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface AlertStats {
  byStatus: Record<string, number>;
  byCity: Record<string, number>;
  byCategory: Record<string, number>;
  total: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AlertsResponse {
  alerts: AutomatedAlert[];
  pagination: PaginationInfo;
  summary: AlertSummary;
}

export interface BulkActionRequest {
  alertIds: string[];
  reason?: string;
}

export interface GenerationResponse {
  total: number;
  approved: number;
  pending: number;
  duplicates: number;
  errors: number;
  cityResults: Record<string, {
    generated: number;
    approved: number;
    pending: number;
    duplicates: number;
    errors: number;
  }>;
}

// Get automated alerts with filtering
export const getAutomatedAlerts = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
  city?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<AlertsResponse> => {
  const response = await api.get('/api/automated-alerts', { params });
  return response.data.data;
};

// Get automated alert statistics
export const getAutomatedAlertStats = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<AlertStats> => {
  const response = await api.get('/api/automated-alerts/stats', { params });
  return response.data.data;
};

// Bulk approve alerts
export const bulkApproveAlerts = async (data: BulkActionRequest): Promise<{
  success: boolean;
  message: string;
  approvedCount: number;
}> => {
  const response = await api.post('/api/automated-alerts/bulk-approve', data);
  return response.data;
};

// Bulk reject alerts
export const bulkRejectAlerts = async (data: BulkActionRequest): Promise<{
  success: boolean;
  message: string;
  rejectedCount: number;
}> => {
  const response = await api.post('/api/automated-alerts/bulk-reject', data);
  return response.data;
};

// Approve single alert
export const approveAlert = async (alertId: string, reason?: string): Promise<{
  success: boolean;
  message: string;
  alert: AutomatedAlert;
}> => {
  const response = await api.post(`/api/automated-alerts/${alertId}/approve`, { reason });
  return response.data;
};

// Reject single alert
export const rejectAlert = async (alertId: string, reason: string): Promise<{
  success: boolean;
  message: string;
  alert: AutomatedAlert;
}> => {
  const response = await api.post(`/api/automated-alerts/${alertId}/reject`, { reason });
  return response.data;
};

// Trigger alert generation
export const triggerAlertGeneration = async (city?: string): Promise<{
  success: boolean;
  message: string;
  results: GenerationResponse;
}> => {
  const params = city ? { city } : {};
  const response = await api.post('/api/automated-alerts/trigger-generation', null, { params });
  return response.data;
}; 