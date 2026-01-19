export interface Tenant {
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface TenantsResponse {
  tenants: Tenant[];
}
