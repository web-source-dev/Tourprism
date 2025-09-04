export interface Collaborator {
  email: string;
  role: 'viewer' | 'manager';
  password?: string;
}

export interface Company {
  _id: string;
  name: string;
}

export interface User {
  _id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  isPremium?: boolean;
  role?: string;
  status?: 'active' | 'restricted' | 'pending' | 'deleted';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  emailPrefrences?: boolean;
  isCollaborator?: boolean;
  collaborator?: Collaborator;
  // Weekly forecast subscription fields
  weeklyForecastSubscribed?: boolean;
  weeklyForecastSubscribedAt?: string;
  lastWeeklyForecastReceived?: string;
  company?: {
    name?: string;
    type?: string;
    MainOperatingRegions?: {
      name: string;
      latitude: number;
      longitude: number;
      placeId: string;
    }[];
  };
  preferences?: {
    Communication?: {
      emailPrefrences?: boolean;
      whatsappPrefrences?: boolean;
    };
    AlertSummaries?: {
      daily?: boolean;
      weekly?: boolean;
      monthly?: boolean;
    }
  };
  collaborators?: Collaborator[];
}

export interface Subscriber {
  _id: string;
  name?: string;
  email: string;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
    placeId: string;
  }[];
  sector?: string[]; // Changed from string to string[] to support multiple sectors
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastWeeklyForecastReceived?: string;
}

export interface Alert {
  _id: string;
  alertGroupId?: string;
  version?: number;
  isLatest?: boolean;
  alertCategory?: string;
  alertType?: string;
  title?: string;
  description: string;
  risk?: string;
  impact?: "Low" | "Moderate" | "High";
  priority?: string;
  targetAudience?: string[] | string;
  recommendedAction?: string;
  status?: string;
  linkToSource?: string;
  numberOfFollows?: number;
  addToEmailSummary?: boolean;
  previousVersionNotes?: string;
  updatedBy?: string;
  
  originLatitude?: number;
  originLongitude?: number;
  originCity?: string;
  originCountry?: string;
  originPlaceId?: string;
  
  impactLocations?: {
    latitude: number;
    longitude: number;
    city: string;
    country?: string;
    placeId?: string;
  }[];
  
  location?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  
  media?: Media[];
  isFollowing?: boolean;
  flagged?: boolean;
  flaggedBy?: string[];
  isFlagged?: boolean;
  flagCount?: number;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
  updated?: string;
  expectedStart?: string | Date;
  expectedEnd?: string | Date;
  
  // ActionHub properties that may be included in list views
  actionHubCreatedAt?: string;
  actionHubUpdatedAt?: string;
  actionHubId?: string;
  
  // Auto-update system properties
  isUpdateOf?: string;
  updateHistory?: string[];
  lastAutoUpdateCheck?: string;
  autoUpdateEnabled?: boolean;
  autoUpdateSuppressed?: boolean;
  autoUpdateSuppressedBy?: User | string;
  autoUpdateSuppressedAt?: string;
  autoUpdateSuppressedReason?: string;
  updateCount?: number;
  lastUpdateAt?: string;
  lastUpdateBy?: User | string;
  updateSource?: 'manual' | 'auto' | 'admin';
}

export interface Media {
  url: string;
  type: string;
  file?: File;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  alertId?: string;
  risk?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  sortBy: 'impact_score' | 'latest' | 'highest_impact' | string;
  alertCategory: string[];
  timeRange: number;
  distance: number;
  impactLevel: ('Low' | 'Moderate' | 'High')[];
  customDateFrom?: Date | null;
  customDateTo?: Date | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AlertFormData {
  incidentType: string;
  otherType?: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  city: string;
  country?: string;
  media?: Media[];
  expectedStart?: Date | string;
  expectedEnd?: Date | string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  requireMFA?: boolean;
  needsVerification?: boolean;
  userId?: string;
  message?: string;
}

export interface ActionLog {
  _id: string;
  user: User | string;
  userEmail?: string;
  displayName?: string;
  isCollaborator?: boolean;
  actionType: 'flag' | 'resolve' | 'note_added' | 'notify_guests' | 'edit' | 'mark_handled';
  actionDetails?: string;
  timestamp: string;
  formattedTime?: string;
  formattedDate?: string;
  teamMemberInfo?: {
    name: string;
    email: string;
    role: string;
  };
}

export interface Guest {
  _id: string;
  email: string;
  name?: string;
  notificationSent: boolean;
  sentTimestamp?: string;
}

export interface Note {
  _id: string;
  content: string;
  createdBy: User | string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActionHubItem extends Alert {
  actionHubId: string;
  status: 'new' | 'in_progress' | 'handled';
  currentActiveTab?: 'notify_guests' | 'add_notes';
  guests?: Guest[];
  notes?: Note[];
  actionLogs?: ActionLog[];
  handledBy?: User | string;
  handledAt?: string;
  teamMembers?: TeamMember[];
  
  // New properties matching the server model
  isFollowing: boolean;
  isFlagged: boolean;
  flagCount: number;
  numberOfFollows: number;
  
  // ActionHub timestamps
  actionHubCreatedAt?: string;
  actionHubUpdatedAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'viewer' | 'manager';
  status: 'active' | 'restricted' | 'deleted' | 'invited' | 'accepted';
} 

export interface FetchAlertsParams {
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
  impact?: string[]; // Add impact parameter for filtering by impact level
} 

export interface ForecastSendSummary {
  _id: string;
  sentAt: string;
  dayOfWeek: string;
  location?: string;
  alertTypes: string[];
  recipientCount: number;
  recipients: string[];
  alertIds: Alert[] | string[];
  digestType: string;
  sector?: string;
  rawAlerts: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface ForecastSummaryFilters extends Record<string, unknown> {
  search?: string;
  location?: string;
  sector?: string;
  digestType?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} 

export interface DashboardStats {
  metrics: {
    subscribers: {
      total: number;
      new: number;
      unsubscribes: number;
    };
  };
}