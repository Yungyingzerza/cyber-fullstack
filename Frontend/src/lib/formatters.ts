import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { SEVERITIES, SOURCES, ACTIONS, ALERT_STATUSES } from './constants';

export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy HH:mm:ss'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getSeverityInfo(severity: number) {
  return SEVERITIES[Math.min(Math.max(severity, 0), 10)] || SEVERITIES[0];
}

export function getSeverityLabel(severity: number): string {
  return getSeverityInfo(severity).label;
}

export function getSeverityColor(severity: number): string {
  return getSeverityInfo(severity).color;
}

export function getSourceInfo(source: string) {
  return SOURCES.find(s => s.value === source) || { value: source, label: source, color: '#6b7280' };
}

export function getSourceLabel(source: string): string {
  return getSourceInfo(source).label;
}

export function getSourceColor(source: string): string {
  return getSourceInfo(source).color;
}

export function getActionInfo(action: string) {
  return ACTIONS.find(a => a.value === action) || { value: action, label: action, color: '#6b7280' };
}

export function getActionLabel(action: string): string {
  return getActionInfo(action).label;
}

export function getActionColor(action: string): string {
  return getActionInfo(action).color;
}

export function getAlertStatusInfo(status: string) {
  return ALERT_STATUSES.find(s => s.value === status) || { value: status, label: status, color: '#6b7280' };
}

export function getAlertStatusLabel(status: string): string {
  return getAlertStatusInfo(status).label;
}

export function getAlertStatusColor(status: string): string {
  return getAlertStatusInfo(status).color;
}

export function formatIP(ip: string | null): string {
  return ip || '-';
}

export function formatPort(port: number | null): string {
  return port !== null ? port.toString() : '-';
}

export function formatIPPort(ip: string | null, port: number | null): string {
  if (!ip) return '-';
  if (!port) return ip;
  return `${ip}:${port}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}
