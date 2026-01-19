export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'closed';
export type RuleType = 'threshold' | 'pattern' | 'sequence';
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'regex' | 'exists' | 'not_exists';

export interface AlertCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface AlertRule {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rule_type: RuleType;
  conditions: AlertCondition | AlertCondition[];
  threshold_count: number;
  threshold_window_seconds: number;
  group_by: string[];
  alert_severity: number;
  notify_discord: boolean;
  discord_webhook_url: string | null;
  cooldown_seconds: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertContext {
  src_ip?: string;
  dst_ip?: string;
  user?: string;
  host?: string;
  source?: string;
  action?: string;
  event_type?: string;
}

export interface Alert {
  id: string;
  tenant_id: string;
  rule_id: string;
  rule_name: string;
  severity: number;
  status: AlertStatus;
  title: string;
  description: string | null;
  event_count: number;
  event_ids: string[];
  group_key: string | null;
  context: AlertContext;
  notified: boolean;
  notified_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  triggered_at: string;
  created_at: string;
  updated_at: string;
}

export interface AlertsQueryParams {
  status?: AlertStatus;
  severity_min?: number;
  rule_id?: string;
  page?: number;
  limit?: number;
}

export interface AlertsResponse {
  data: Alert[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  enabled?: boolean;
  rule_type?: RuleType;
  conditions: AlertCondition | AlertCondition[];
  threshold_count?: number;
  threshold_window_seconds?: number;
  group_by?: string[];
  alert_severity?: number;
  notify_discord?: boolean;
  discord_webhook_url?: string;
  cooldown_seconds?: number;
}

export interface UpdateAlertStatusRequest {
  status: AlertStatus;
  notes?: string;
}
