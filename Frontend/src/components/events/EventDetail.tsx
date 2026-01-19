import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Event } from '@/types';
import {
  formatDate,
  getSeverityColor,
  getSeverityLabel,
  getSourceLabel,
  getSourceColor,
  getActionLabel,
  getActionColor,
} from '@/lib/formatters';

interface EventDetailProps {
  event: Event | null;
  open: boolean;
  onClose: () => void;
}

export default function EventDetail({ event, open, onClose }: EventDetailProps) {
  if (!event) return null;

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex py-2">
      <span className="w-44 text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium break-all">{value || '-'}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Event Details
            <Badge
              style={{
                backgroundColor: getSeverityColor(event.severity),
                color: 'white',
              }}
            >
              Severity {event.severity}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 pr-4">
            {/* Basic Info */}
            <div>
              <h4 className="font-medium mb-2">Basic Information</h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <DetailRow label="Event ID" value={<code className="text-xs">{event.id}</code>} />
                <DetailRow
                  label="Timestamp"
                  value={formatDate(event.event_time, 'PPpp')}
                />
                <DetailRow
                  label="Source"
                  value={
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: getSourceColor(event.source),
                        color: getSourceColor(event.source),
                      }}
                    >
                      {getSourceLabel(event.source)}
                    </Badge>
                  }
                />
                <DetailRow
                  label="Severity"
                  value={
                    <span style={{ color: getSeverityColor(event.severity) }}>
                      {event.severity} - {getSeverityLabel(event.severity)}
                    </span>
                  }
                />
                <DetailRow
                  label="Action"
                  value={
                    event.action && (
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${getActionColor(event.action)}20`,
                          color: getActionColor(event.action),
                        }}
                      >
                        {getActionLabel(event.action)}
                      </Badge>
                    )
                  }
                />
                <DetailRow label="Event Type" value={event.event_type} />
                <DetailRow label="Event Subtype" value={event.event_subtype} />
                <DetailRow label="Vendor" value={event.vendor} />
                <DetailRow label="Product" value={event.product} />
              </div>
            </div>

            <Separator />

            {/* Network Info */}
            <div>
              <h4 className="font-medium mb-2">Network Information</h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <DetailRow
                  label="Source IP"
                  value={
                    event.src_ip && (
                      <code>
                        {event.src_ip}
                        {event.src_port ? `:${event.src_port}` : ''}
                      </code>
                    )
                  }
                />
                <DetailRow label="Source Hostname" value={event.src_hostname} />
                <DetailRow
                  label="Destination IP"
                  value={
                    event.dst_ip && (
                      <code>
                        {event.dst_ip}
                        {event.dst_port ? `:${event.dst_port}` : ''}
                      </code>
                    )
                  }
                />
                <DetailRow label="Destination Hostname" value={event.dst_hostname} />
                <DetailRow label="Protocol" value={event.protocol} />
              </div>
            </div>

            {/* HTTP Info */}
            {(event.url || event.http_method || event.status_code) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">HTTP Information</h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <DetailRow label="URL" value={event.url && <code className="text-xs break-all">{event.url}</code>} />
                    <DetailRow label="HTTP Method" value={event.http_method && <Badge variant="outline">{event.http_method}</Badge>} />
                    <DetailRow
                      label="Status Code"
                      value={
                        event.status_code && (
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: event.status_code >= 400 ? '#ef444420' : event.status_code >= 300 ? '#f59e0b20' : '#22c55e20',
                              color: event.status_code >= 400 ? '#ef4444' : event.status_code >= 300 ? '#f59e0b' : '#22c55e',
                            }}
                          >
                            {event.status_code}
                          </Badge>
                        )
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {/* Rule Info */}
            {(event.rule_name || event.rule_id) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Rule Information</h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <DetailRow label="Rule Name" value={event.rule_name} />
                    <DetailRow label="Rule ID" value={event.rule_id && <code className="text-xs">{event.rule_id}</code>} />
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Identity Info */}
            <div>
              <h4 className="font-medium mb-2">Identity</h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <DetailRow label="User" value={event.user} />
                <DetailRow label="Host" value={event.host} />
                <DetailRow label="Process" value={event.process} />
              </div>
            </div>

            {/* GeoIP Info */}
            {(event.src_geo_country || event.dst_geo_country || event.src_geo_latitude || event.dst_geo_latitude) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">GeoIP Information</h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    {(event.src_geo_country || event.src_geo_city) && (
                      <DetailRow
                        label="Source Location"
                        value={[event.src_geo_city, event.src_geo_country].filter(Boolean).join(', ')}
                      />
                    )}
                    {(event.src_geo_latitude != null && event.src_geo_longitude != null) && (
                      <DetailRow
                        label="Source Coordinates"
                        value={<code className="text-xs">{event.src_geo_latitude}, {event.src_geo_longitude}</code>}
                      />
                    )}
                    {(event.dst_geo_country || event.dst_geo_city) && (
                      <DetailRow
                        label="Dest Location"
                        value={[event.dst_geo_city, event.dst_geo_country].filter(Boolean).join(', ')}
                      />
                    )}
                    {(event.dst_geo_latitude != null && event.dst_geo_longitude != null) && (
                      <DetailRow
                        label="Dest Coordinates"
                        value={<code className="text-xs">{event.dst_geo_latitude}, {event.dst_geo_longitude}</code>}
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Cloud Info */}
            {(event.cloud_account_id || event.cloud_region || event.cloud_service) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Cloud Information</h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <DetailRow label="Account ID" value={event.cloud_account_id} />
                    <DetailRow label="Region" value={event.cloud_region} />
                    <DetailRow label="Service" value={event.cloud_service} />
                  </div>
                </div>
              </>
            )}

            {/* Tags */}
            {event._tags && event._tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {event._tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            {(event.created_at || event.updated_at) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Metadata</h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    {event.created_at && (
                      <DetailRow label="Created At" value={formatDate(event.created_at, 'PPpp')} />
                    )}
                    {event.updated_at && (
                      <DetailRow label="Updated At" value={formatDate(event.updated_at, 'PPpp')} />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Raw Log */}
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Raw Log</h4>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {typeof event.raw === 'object'
                  ? JSON.stringify(event.raw, null, 2)
                  : event.raw || 'No raw data'}
              </pre>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
