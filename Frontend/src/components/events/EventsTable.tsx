import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Event, EventsQueryParams } from '@/types';
import {
  formatDate,
  getSeverityColor,
  getSourceLabel,
  getSourceColor,
  getActionLabel,
  getActionColor,
  formatIPPort,
} from '@/lib/formatters';
import { ArrowUpDown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventsTableProps {
  events: Event[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort: (field: EventsQueryParams['sort_by']) => void;
  onViewEvent: (event: Event) => void;
}

export default function EventsTable({
  events,
  sortBy,
  sortOrder,
  onSort,
  onViewEvent,
}: EventsTableProps) {
  const SortableHeader = ({
    field,
    children,
  }: {
    field: EventsQueryParams['sort_by'];
    children: React.ReactNode;
  }) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent"
        onClick={() => onSort(field)}
      >
        {children}
        <ArrowUpDown
          className={cn(
            'ml-2 h-4 w-4',
            sortBy === field && 'text-primary'
          )}
        />
        {sortBy === field && (
          <span className="sr-only">
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </span>
        )}
      </Button>
    </TableHead>
  );

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No events found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="event_time">Time</SortableHeader>
            <SortableHeader field="source">Source</SortableHeader>
            <SortableHeader field="severity">Severity</SortableHeader>
            <SortableHeader field="action">Action</SortableHeader>
            <SortableHeader field="src_ip">Src</SortableHeader>
            <SortableHeader field="dst_ip">Dst</SortableHeader>
            <SortableHeader field="user">User</SortableHeader>
            <SortableHeader field="event_type">Event Type</SortableHeader>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-mono text-sm">
                {formatDate(event.event_time, 'MMM d, HH:mm:ss')}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: getSourceColor(event.source),
                    color: getSourceColor(event.source),
                  }}
                >
                  {getSourceLabel(event.source)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  style={{
                    backgroundColor: getSeverityColor(event.severity),
                    color: 'white',
                  }}
                >
                  {event.severity}
                </Badge>
              </TableCell>
              <TableCell>
                {event.action && (
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${getActionColor(event.action)}20`,
                      color: getActionColor(event.action),
                    }}
                  >
                    {getActionLabel(event.action)}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatIPPort(event.src_ip, event.src_port)}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatIPPort(event.dst_ip, event.dst_port)}
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {event.user || '-'}
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {event.event_type || '-'}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewEvent(event);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
