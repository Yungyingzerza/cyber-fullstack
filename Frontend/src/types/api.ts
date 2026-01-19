export interface ApiError {
  error: string;
  message: string;
  details?: string[];
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'ok' | 'error';
      message?: string;
    };
  };
}

export interface RetentionPolicy {
  id: string;
  tenant_id: string;
  retention_days: number;
  archive_enabled: boolean;
  archive_destination: string | null;
  source_overrides: Record<string, number>;
  severity_overrides: Record<string, number>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface RetentionStats {
  total_events: number;
  oldest_event?: string | null;
  data_age_days?: number;
  event_counts_by_age: {
    last_1_days: number;
    last_7_days: number;
    last_14_days: number;
    last_30_days: number;
    last_60_days: number;
    last_90_days: number;
  };
  policy: RetentionPolicy | null;
  default_retention_days: number;
  min_retention_days: number;
}
