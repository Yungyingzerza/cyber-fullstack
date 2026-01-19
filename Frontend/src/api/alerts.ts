import apiClient from './client';
import type {
  Alert,
  AlertRule,
  AlertsQueryParams,
  AlertsResponse,
  CreateAlertRuleRequest,
  UpdateAlertStatusRequest,
} from '@/types';

// Alerts
export async function getAlerts(params: AlertsQueryParams = {}): Promise<AlertsResponse> {
  const response = await apiClient.get<AlertsResponse>('/alerts', { params });
  return response.data;
}

export async function getAlert(id: string): Promise<Alert> {
  const response = await apiClient.get<Alert>(`/alerts/${id}`);
  return response.data;
}

export async function updateAlertStatus(id: string, data: UpdateAlertStatusRequest): Promise<Alert> {
  const response = await apiClient.patch<{ message: string; alert: Alert }>(`/alerts/${id}/status`, data);
  return response.data.alert;
}

// Alert Rules
export async function getAlertRules(): Promise<AlertRule[]> {
  const response = await apiClient.get<{ data: AlertRule[] }>('/alerts/rules');
  return response.data.data;
}

export async function getAlertRule(id: string): Promise<AlertRule> {
  const response = await apiClient.get<AlertRule>(`/alerts/rules/${id}`);
  return response.data;
}

export async function createAlertRule(data: CreateAlertRuleRequest): Promise<AlertRule> {
  const response = await apiClient.post<{ message: string; rule: AlertRule }>('/alerts/rules', data);
  return response.data.rule;
}

export async function updateAlertRule(id: string, data: Partial<CreateAlertRuleRequest>): Promise<AlertRule> {
  const response = await apiClient.put<{ message: string; rule: AlertRule }>(`/alerts/rules/${id}`, data);
  return response.data.rule;
}

export async function deleteAlertRule(id: string): Promise<void> {
  await apiClient.delete(`/alerts/rules/${id}`);
}

export async function createDefaultRules(): Promise<AlertRule[]> {
  const response = await apiClient.post<{ message: string; count: number; rules: AlertRule[] }>('/alerts/rules/defaults');
  return response.data.rules;
}
