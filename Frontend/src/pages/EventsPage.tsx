import { useState, useEffect, useCallback } from 'react';
import { getEvents } from '@/api';
import type { Event, EventsQueryParams, EventsResponse } from '@/types';
import EventsTable from '@/components/events/EventsTable';
import EventFilters from '@/components/events/EventFilters';
import EventDetail from '@/components/events/EventDetail';
import Pagination from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { subHours } from 'date-fns';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0,
  });
  const [filters, setFilters] = useState<EventsQueryParams>({
    page: 1,
    limit: 50,
    sort_by: 'event_time',
    sort_order: 'desc',
    start_time: subHours(new Date(), 24).toISOString(),
    end_time: new Date().toISOString(),
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: EventsResponse = await getEvents(filters);
      setEvents(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        total_pages: response.pagination.total_pages,
      });
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFiltersChange = (newFilters: EventsQueryParams) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleLimitChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
  };

  const handleSort = (field: EventsQueryParams['sort_by']) => {
    const newSortOrder =
      filters.sort_by === field && filters.sort_order === 'desc' ? 'asc' : 'desc';
    setFilters({ ...filters, sort_by: field, sort_order: newSortOrder });
  };

  const handleExportCSV = () => {
    if (events.length === 0) {
      toast.error('No events to export');
      return;
    }

    const headers = [
      'Timestamp',
      'Source',
      'Severity',
      'Action',
      'Source IP',
      'Dest IP',
      'User',
      'Host',
      'Event Type',
    ];

    const rows = events.map((event) => [
      event.event_time,
      event.source,
      event.severity,
      event.action || '',
      event.src_ip || '',
      event.dst_ip || '',
      event.user || '',
      event.host || '',
      event.event_type || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `events-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Events exported successfully');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEvents}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <EventFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <EventsTable
                events={events}
                sortBy={filters.sort_by}
                sortOrder={filters.sort_order}
                onSort={handleSort}
                onViewEvent={setSelectedEvent}
              />
              <Pagination
                page={pagination.page}
                totalPages={pagination.total_pages}
                limit={pagination.limit}
                total={pagination.total}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      <EventDetail
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
