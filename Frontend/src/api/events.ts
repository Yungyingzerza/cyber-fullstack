import apiClient from './client';
import type { Event, EventsQueryParams, EventsResponse, EventStats } from '@/types';

export async function getEvents(params: EventsQueryParams = {}): Promise<EventsResponse> {
  const response = await apiClient.get<EventsResponse>('/events', { params });
  return response.data;
}

export async function getEvent(id: string): Promise<Event> {
  const response = await apiClient.get<Event>(`/events/${id}`);
  return response.data;
}

export async function getEventStats(params: { start_time?: string; end_time?: string } = {}): Promise<EventStats> {
  const response = await apiClient.get<EventStats>('/events/stats', { params });
  return response.data;
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`);
}

export async function deleteEventsBefore(before: string, source?: string): Promise<{ count: number }> {
  const response = await apiClient.delete<{ message: string; count: number }>('/events', {
    data: { before, source },
  });
  return { count: response.data.count };
}
