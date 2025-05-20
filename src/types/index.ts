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
  isSubscribed?: boolean;
  role?: string;
  status?: 'active' | 'restricted' | 'pending' | 'deleted';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  emailPrefrences?: boolean;
  isCollaborator?: boolean;
  collaborator?: Collaborator;
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
  impact?: "Minor" | "Moderate" | "Severe";
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
  expectedStart?: string;
  expectedEnd?: string;
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
  sortBy: string;
  alertCategory: string[];
  timeRange: number;
  distance: number;
  impactLevel?: string;
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
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'viewer' | 'manager';
  status: 'active' | 'restricted' | 'deleted' | 'invited' | 'accepted';
} 
