import apiClient from './client';

export interface IngestEventRequest {
  source: string;
  vendor?: string;
  product?: string;
  event_type?: string;
  event_subtype?: string;
  severity?: number;
  action?: string;
  src_ip?: string;
  src_port?: number;
  dst_ip?: string;
  dst_port?: number;
  protocol?: string;
  user?: string;
  host?: string;
  process?: string;
  url?: string;
  http_method?: string;
  status_code?: number;
  rule_name?: string;
  rule_id?: string;
  cloud_account_id?: string;
  cloud_region?: string;
  cloud_service?: string;
  _tags?: string[];
  raw?: unknown;
  event_time?: string;
}

export async function ingestEvent(data: IngestEventRequest): Promise<{ event_id: string }> {
  const response = await apiClient.post<{ message: string; event_id: string }>('/ingest', data);
  return { event_id: response.data.event_id };
}

export async function ingestBatch(events: IngestEventRequest[]): Promise<{ count: number; event_ids: string[] }> {
  const response = await apiClient.post<{ message: string; count: number; event_ids: string[] }>('/ingest/batch', events);
  return { count: response.data.count, event_ids: response.data.event_ids };
}

export async function ingestFile(file: File): Promise<{ count: number; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<{ message: string; filename: string; count: number }>('/ingest/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return { count: response.data.count, filename: response.data.filename };
}
