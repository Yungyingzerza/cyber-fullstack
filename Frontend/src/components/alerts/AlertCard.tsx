import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AlertStatusBadge from './AlertStatusBadge';
import type { Alert, AlertStatus } from '@/types';
import { formatDate, formatRelativeTime, getSeverityColor } from '@/lib/formatters';
import {
  MoreVertical,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onUpdateStatus: (id: string, status: AlertStatus, notes?: string) => void;
}

export default function AlertCard({ alert, onUpdateStatus }: AlertCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [notes, setNotes] = useState('');

  const handleResolve = () => {
    onUpdateStatus(alert.id, 'resolved', notes);
    setShowResolveDialog(false);
    setNotes('');
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge
                style={{
                  backgroundColor: getSeverityColor(alert.severity),
                  color: 'white',
                }}
              >
                Severity {alert.severity}
              </Badge>
              <AlertStatusBadge status={alert.status} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetail(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {alert.status === 'open' && (
                  <DropdownMenuItem
                    onClick={() => onUpdateStatus(alert.id, 'acknowledged')}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Acknowledge
                  </DropdownMenuItem>
                )}
                {(alert.status === 'open' || alert.status === 'acknowledged') && (
                  <DropdownMenuItem onClick={() => setShowResolveDialog(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolve
                  </DropdownMenuItem>
                )}
                {alert.status !== 'closed' && (
                  <DropdownMenuItem
                    onClick={() => onUpdateStatus(alert.id, 'closed')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Close
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="text-lg mt-2">{alert.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {alert.description || 'No description'}
          </p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Rule:</span>{' '}
              <span className="font-medium">{alert.rule_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Events:</span>{' '}
              <span className="font-medium">{alert.event_count}</span>
            </div>
            {alert.context.src_ip && (
              <div>
                <span className="text-muted-foreground">Source IP:</span>{' '}
                <code className="text-xs">{alert.context.src_ip}</code>
              </div>
            )}
            {alert.context.user && (
              <div>
                <span className="text-muted-foreground">User:</span>{' '}
                <span className="font-medium">{alert.context.user}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Triggered {formatRelativeTime(alert.triggered_at)}
            </div>
            {alert.resolved_at && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Resolved {formatRelativeTime(alert.resolved_at)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge
                style={{
                  backgroundColor: getSeverityColor(alert.severity),
                  color: 'white',
                }}
              >
                Severity {alert.severity}
              </Badge>
              <AlertStatusBadge status={alert.status} />
            </div>

            <div>
              <h4 className="font-medium">{alert.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {alert.description || 'No description'}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rule Name</span>
                <span className="font-medium">{alert.rule_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event Count</span>
                <span className="font-medium">{alert.event_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Triggered At</span>
                <span className="font-medium">
                  {formatDate(alert.triggered_at, 'PPpp')}
                </span>
              </div>
              {alert.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved At</span>
                  <span className="font-medium">
                    {formatDate(alert.resolved_at, 'PPpp')}
                  </span>
                </div>
              )}
            </div>

            {Object.keys(alert.context).length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Context</h5>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  {Object.entries(alert.context).map(
                    ([key, value]) =>
                      value && (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-mono text-xs">{value}</span>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

            {alert.resolution_notes && (
              <div>
                <h5 className="text-sm font-medium mb-2">Resolution Notes</h5>
                <p className="text-sm bg-muted/50 rounded-lg p-3">
                  {alert.resolution_notes}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add optional notes about the resolution:
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resolution notes..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve}>Resolve Alert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
