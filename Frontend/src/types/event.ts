export type EventSource = 'firewall' | 'crowdstrike' | 'aws' | 'm365' | 'ad' | 'api' | 'network';
export type EventAction = 'allow' | 'deny' | 'create' | 'delete' | 'login' | 'logout' | 'alert';

export interface Event {
  id: string;
  tenant_id: string;
  event_time: string;
  source: EventSource;
  vendor: string | null;
  product: string | null;
  event_type: string | null;
  event_subtype: string | null;
  severity: number;
  action: EventAction | null;
  src_ip: string | null;
  src_port: number | null;
  dst_ip: string | null;
  dst_port: number | null;
  protocol: string | null;
  user: string | null;
  host: string | null;
  process: string | null;
  url: string | null;
  http_method: string | null;
  status_code: number | null;
  rule_name: string | null;
  rule_id: string | null;
  cloud_account_id: string | null;
  cloud_region: string | null;
  cloud_service: string | null;
  src_hostname: string | null;
  dst_hostname: string | null;
  src_geo_country: string | null;
  src_geo_city: string | null;
  src_geo_latitude: number | null;
  src_geo_longitude: number | null;
  dst_geo_country: string | null;
  dst_geo_city: string | null;
  dst_geo_latitude: number | null;
  dst_geo_longitude: number | null;
  _tags: string[];
  raw: string | object | null;
  created_at: string;
  updated_at: string;
}

export interface EventsQueryParams {
  source?: EventSource;
  sources?: EventSource[];
  severity?: number;
  severity_min?: number;
  severity_max?: number;
  action?: EventAction;
  actions?: EventAction[];
  start_time?: string;
  end_time?: string;
  src_ip?: string;
  dst_ip?: string;
  user?: string;
  host?: string;
  event_type?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'event_time' | 'severity' | 'source' | 'action' | 'src_ip' | 'dst_ip' | 'user' | 'host' | 'event_type';
  sort_order?: 'asc' | 'desc';
}

export interface EventsResponse {
  data: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface EventStats {
  total: number;
  by_source: Record<string, number>;
  by_severity: Record<string, number>;
  by_action: Record<string, number>;
}
