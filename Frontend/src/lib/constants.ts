export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const SOURCES = [
  { value: 'firewall', label: 'Firewall', color: '#ef4444' },
  { value: 'crowdstrike', label: 'CrowdStrike', color: '#f97316' },
  { value: 'aws', label: 'AWS', color: '#eab308' },
  { value: 'm365', label: 'Microsoft 365', color: '#22c55e' },
  { value: 'ad', label: 'Active Directory', color: '#3b82f6' },
  { value: 'api', label: 'API', color: '#8b5cf6' },
  { value: 'network', label: 'Network', color: '#ec4899' },
] as const;

export const ACTIONS = [
  { value: 'allow', label: 'Allow', color: '#22c55e' },
  { value: 'deny', label: 'Deny', color: '#ef4444' },
  { value: 'create', label: 'Create', color: '#3b82f6' },
  { value: 'delete', label: 'Delete', color: '#f97316' },
  { value: 'login', label: 'Login', color: '#8b5cf6' },
  { value: 'logout', label: 'Logout', color: '#6b7280' },
  { value: 'alert', label: 'Alert', color: '#eab308' },
] as const;

export const SEVERITIES = [
  { value: 0, label: 'Info', color: '#6b7280' },
  { value: 1, label: 'Low', color: '#22c55e' },
  { value: 2, label: 'Low', color: '#22c55e' },
  { value: 3, label: 'Low', color: '#84cc16' },
  { value: 4, label: 'Medium', color: '#eab308' },
  { value: 5, label: 'Medium', color: '#eab308' },
  { value: 6, label: 'Medium', color: '#f97316' },
  { value: 7, label: 'High', color: '#f97316' },
  { value: 8, label: 'High', color: '#ef4444' },
  { value: 9, label: 'Critical', color: '#dc2626' },
  { value: 10, label: 'Critical', color: '#991b1b' },
] as const;

export const ALERT_STATUSES = [
  { value: 'open', label: 'Open', color: '#ef4444' },
  { value: 'acknowledged', label: 'Acknowledged', color: '#eab308' },
  { value: 'resolved', label: 'Resolved', color: '#22c55e' },
  { value: 'closed', label: 'Closed', color: '#6b7280' },
] as const;

export const TIME_RANGES = [
  { value: '1h', label: 'Last 1 hour', hours: 1 },
  { value: '6h', label: 'Last 6 hours', hours: 6 },
  { value: '24h', label: 'Last 24 hours', hours: 24 },
  { value: '7d', label: 'Last 7 days', hours: 168 },
  { value: '30d', label: 'Last 30 days', hours: 720 },
  { value: 'custom', label: 'Custom', hours: 0 },
] as const;

export const CONDITION_OPERATORS = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'in', label: 'In List' },
  { value: 'regex', label: 'Regex Match' },
  { value: 'exists', label: 'Exists' },
  { value: 'not_exists', label: 'Does Not Exist' },
] as const;

export const CONDITION_FIELDS = [
  'source',
  'severity',
  'action',
  'src_ip',
  'dst_ip',
  'user',
  'host',
  'event_type',
  'protocol',
  'rule_name',
] as const;
