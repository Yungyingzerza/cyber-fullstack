import { useState, useEffect } from 'react';
import { getEventStats, getEvents, getAlerts } from '@/api';
import type { EventStats, Event } from '@/types';
import StatsCard from '@/components/common/StatsCard';
import SourcePieChart from '@/components/charts/SourcePieChart';
import SeverityBarChart from '@/components/charts/SeverityBarChart';
import TimelineChart from '@/components/charts/TimelineChart';
import TopItemsChart from '@/components/charts/TopItemsChart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIME_RANGES } from '@/lib/constants';
import { subHours, format } from 'date-fns';
import { FileText, Bell, AlertTriangle, Activity, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [stats, setStats] = useState<EventStats | null>(null);
  const [openAlertsCount, setOpenAlertsCount] = useState(0);
  const [timelineData, setTimelineData] = useState<Array<{ time: string; count: number }>>([]);
  const [topIPs, setTopIPs] = useState<Array<{ name: string; count: number }>>([]);
  const [topUsers, setTopUsers] = useState<Array<{ name: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const range = TIME_RANGES.find((r) => r.value === timeRange);
        const hours = range?.hours || 24;
        const startTime = subHours(new Date(), hours).toISOString();
        const endTime = new Date().toISOString();

        // Fetch stats and alerts in parallel
        const [statsData, alertsData, eventsData] = await Promise.all([
          getEventStats({ start_time: startTime, end_time: endTime }),
          getAlerts({ status: 'open', limit: 1 }),
          getEvents({ start_time: startTime, end_time: endTime, limit: 1000 }),
        ]);

        setStats(statsData);
        setOpenAlertsCount(alertsData.pagination.total);

        // Process events for timeline and top items
        const events = eventsData.data;
        processTimelineData(events, hours);
        processTopItems(events);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const processTimelineData = (events: Event[], hours: number) => {
    // Group events by hour
    const hourlyData: Record<string, number> = {};
    const now = new Date();

    // Initialize all hours with 0
    for (let i = hours; i >= 0; i--) {
      const hourKey = format(subHours(now, i), "yyyy-MM-dd'T'HH:00:00");
      hourlyData[hourKey] = 0;
    }

    // Count events per hour
    events.forEach((event) => {
      const eventHour = format(new Date(event.event_time), "yyyy-MM-dd'T'HH:00:00");
      if (hourlyData[eventHour] !== undefined) {
        hourlyData[eventHour]++;
      }
    });

    const timeline = Object.entries(hourlyData)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => a.time.localeCompare(b.time));

    setTimelineData(timeline);
  };

  const processTopItems = (events: Event[]) => {
    // Top Source IPs
    const ipCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};

    events.forEach((event) => {
      if (event.src_ip) {
        ipCounts[event.src_ip] = (ipCounts[event.src_ip] || 0) + 1;
      }
      if (event.user) {
        userCounts[event.user] = (userCounts[event.user] || 0) + 1;
      }
    });

    const sortedIPs = Object.entries(ipCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const sortedUsers = Object.entries(userCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setTopIPs(sortedIPs);
    setTopUsers(sortedUsers);
  };

  const highSeverityCount =
    stats?.by_severity
      ? Object.entries(stats.by_severity)
          .filter(([severity]) => parseInt(severity) >= 7)
          .reduce((sum, [, count]) => sum + count, 0)
      : 0;

  const activeSourcesCount = stats?.by_source
    ? Object.values(stats.by_source).filter((count) => count > 0).length
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.filter((r) => r.value !== 'custom').map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Events"
          value={stats?.total || 0}
          subtitle="In selected time range"
          icon={FileText}
        />
        <StatsCard
          title="Open Alerts"
          value={openAlertsCount}
          subtitle="Requires attention"
          icon={Bell}
        />
        <StatsCard
          title="High Severity"
          value={highSeverityCount}
          subtitle="Severity 7+"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Active Sources"
          value={activeSourcesCount}
          subtitle="Sending events"
          icon={Activity}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <SourcePieChart data={stats?.by_source || {}} />
        <SeverityBarChart data={stats?.by_severity || {}} />
      </div>

      {/* Timeline */}
      <TimelineChart data={timelineData} />

      {/* Top items */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopItemsChart
          data={topIPs}
          title="Top 10 Source IPs"
          color="#ef4444"
        />
        <TopItemsChart
          data={topUsers}
          title="Top 10 Users"
          color="#8b5cf6"
        />
      </div>
    </div>
  );
}
