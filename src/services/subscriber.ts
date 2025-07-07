import { api } from "./api";

export interface SubscriberPayload {
  name: string;
  email: string;
  location: Array<{ name: string; latitude: number; longitude: number; placeId: string }>;
  sector: string;
}

export interface SubscriberResponse {
  message: string;
  subscriber: {
    _id: string;
    name: string;
    email: string;
    location: Array<{ name: string; latitude: number; longitude: number; placeId: string }>;
    sector: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export async function createSubscriber(payload: SubscriberPayload): Promise<SubscriberResponse> {
  try {
    const res = await api.post<SubscriberResponse>('/api/subscribers', payload);
    return res.data;
  } catch (error) {
    console.error('Error creating subscriber:', error);
    throw error;
  }
}

export async function checkSubscriberStatus(email: string): Promise<{ exists: boolean; isActive: boolean }> {
  try {
    const res = await api.get<{ exists: boolean; isActive: boolean }>(`/api/subscribers/check/${email}`);
    return res.data;
  } catch (error) {
    console.error('Error checking subscriber status:', error);
    return { exists: false, isActive: false };
  }
}
