import { useState, useEffect, useCallback } from 'react';
import { getAlerts, updateAlertStatus } from '@/api';
import type { Alert, AlertStatus, AlertsQueryParams } from '@/types';
import AlertCard from '@/components/alerts/AlertCard';
import Pagination from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Bell } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_TABS: { value: AlertStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });
  const [filters, setFilters] = useState<AlertsQueryParams>({
    page: 1,
    limit: 20,
  });
  const [activeTab, setActiveTab] = useState<AlertStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams: AlertsQueryParams = {
        ...filters,
        status: activeTab !== 'all' ? activeTab : undefined,
      };
      const response = await getAlerts(queryParams);
      setAlerts(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        total_pages: response.pagination.total_pages,
      });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast.error('Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, [filters, activeTab]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as AlertStatus | 'all');
    setFilters({ ...filters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleLimitChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
  };

  const handleUpdateStatus = async (
    id: string,
    status: AlertStatus,
    notes?: string
  ) => {
    try {
      await updateAlertStatus(id, { status, notes });
      toast.success(`Alert ${status}`);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to update alert status:', error);
      toast.error('Failed to update alert status');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <Button variant="outline" size="sm" onClick={fetchAlerts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Alerts list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4" />
            <p>No alerts found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>

          {/* Pagination */}
          <Card>
            <CardContent className="p-0">
              <Pagination
                page={pagination.page}
                totalPages={pagination.total_pages}
                limit={pagination.limit}
                total={pagination.total}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
