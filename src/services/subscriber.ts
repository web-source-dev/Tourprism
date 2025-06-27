import { api } from "./api";

export interface SubscriberPayload {
  name: string;
  email: string;
  location: Array<{ name: string; latitude: number; longitude: number; placeId: string }>;
  sector: string;
}

export async function createSubscriber(payload: SubscriberPayload) {
  const res = await api.post('/api/subscribers', payload);
  return res.data;
}
