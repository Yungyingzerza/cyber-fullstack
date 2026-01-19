import apiClient from './client';
import type { RetentionPolicy, RetentionStats } from '@/types';

export async function getRetentionPolicy(): Promise<RetentionPolicy | null> {
  const response = await apiClient.get<{ policy: RetentionPolicy | null } | RetentionPolicy>('/retention/policy');
  if ('policy' in response.data) {
    return response.data.policy;
  }
  return response.data;
}

export async function updateRetentionPolicy(data: Partial<RetentionPolicy>): Promise<RetentionPolicy> {
  const response = await apiClient.put<{ message: string; policy: RetentionPolicy }>('/retention/policy', data);
  return response.data.policy;
}

export async function deleteRetentionPolicy(): Promise<void> {
  await apiClient.delete('/retention/policy');
}

export async function getRetentionStats(): Promise<RetentionStats> {
  const response = await apiClient.get<RetentionStats>('/retention/stats');
  return response.data;
}

export async function triggerCleanup(): Promise<void> {
  await apiClient.post('/retention/cleanup');
}
