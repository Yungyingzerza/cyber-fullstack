import apiClient from './client';
import type { Tenant, CreateTenantRequest, UpdateTenantRequest, TenantsResponse } from '@/types';

export async function getTenants(includeInactive = false): Promise<Tenant[]> {
  const response = await apiClient.get<TenantsResponse>('/tenants', {
    params: { includeInactive },
  });
  return response.data.tenants;
}

export async function getTenant(id: string): Promise<Tenant> {
  const response = await apiClient.get<{ tenant: Tenant }>(`/tenants/${id}`);
  return response.data.tenant;
}

export async function createTenant(data: CreateTenantRequest): Promise<Tenant> {
  const response = await apiClient.post<{ message: string; tenant: Tenant }>('/tenants', data);
  return response.data.tenant;
}

export async function updateTenant(id: string, data: UpdateTenantRequest): Promise<Tenant> {
  const response = await apiClient.put<{ message: string; tenant: Tenant }>(`/tenants/${id}`, data);
  return response.data.tenant;
}

export async function deleteTenant(id: string): Promise<void> {
  await apiClient.delete(`/tenants/${id}`);
}
