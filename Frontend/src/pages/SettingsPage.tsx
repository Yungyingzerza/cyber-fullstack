import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getRetentionPolicy,
  updateRetentionPolicy,
  getRetentionStats,
  triggerCleanup,
} from '@/api';
import type { RetentionPolicy, RetentionStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Trash2, User, Database, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/formatters';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [policy, setPolicy] = useState<Partial<RetentionPolicy>>({
    retention_days: 30,
    archive_enabled: false,
    enabled: true,
  });
  const [stats, setStats] = useState<RetentionStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [policyData, statsData] = await Promise.all([
          getRetentionPolicy(),
          getRetentionStats(),
        ]);
        if (policyData) {
          setPolicy(policyData);
        }
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSavePolicy = async () => {
    setIsSaving(true);
    try {
      // Only send valid policy fields, not id, tenant_id, timestamps, etc.
      const policyData = {
        retention_days: policy.retention_days,
        archive_enabled: policy.archive_enabled,
        enabled: policy.enabled,
      };
      const updatedPolicy = await updateRetentionPolicy(policyData);
      setPolicy(updatedPolicy);
      toast.success('Retention policy updated');
    } catch (error) {
      console.error('Failed to update policy:', error);
      toast.error('Failed to update retention policy');
    } finally {
      setIsSaving(false);
    }
  };

  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const refreshStats = async () => {
    try {
      const statsData = await getRetentionStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  const handleTriggerCleanup = async () => {
    setIsCleaningUp(true);
    try {
      await triggerCleanup();
      toast.success('Cleanup job started');
      // Refetch stats after a short delay to allow cleanup to complete
      setTimeout(async () => {
        await refreshStats();
        setIsCleaningUp(false);
        toast.success('Stats refreshed');
      }, 2000);
    } catch (error) {
      console.error('Failed to trigger cleanup:', error);
      toast.error('Failed to trigger cleanup');
      setIsCleaningUp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tenant</Label>
              <p className="font-medium">{user?.tenant_id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">User ID</Label>
              <p className="font-mono text-sm">{user?.id}</p>
            </div>
          </div>

          <Separator />

          <Button variant="destructive" onClick={logout}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Retention Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground">Total Events</Label>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.total_events)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last 7 Days</Label>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.event_counts_by_age?.last_7_days ?? 0)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last 30 Days</Label>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.event_counts_by_age?.last_30_days ?? 0)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Data Age</Label>
                <p className="text-2xl font-bold">
                  {stats.data_age_days ?? 0} days
                </p>
              </div>
            </div>

            {stats.oldest_event && (
              <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                <p>
                  Oldest event: {new Date(stats.oldest_event).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Retention Policy - Admin Only */}
      {user?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Retention Policy
            </CardTitle>
            <CardDescription>
              Configure how long events are retained before automatic deletion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={policy.enabled}
                onCheckedChange={(checked) =>
                  setPolicy({ ...policy, enabled: checked })
                }
              />
              <Label htmlFor="enabled">Enable automatic retention</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retention_days">Retention Period (days)</Label>
                <Input
                  id="retention_days"
                  type="number"
                  min={7}
                  max={3650}
                  value={policy.retention_days || 30}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      retention_days: parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 7 days, maximum 10 years
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="archive_enabled"
                checked={policy.archive_enabled}
                onCheckedChange={(checked) =>
                  setPolicy({ ...policy, archive_enabled: checked })
                }
              />
              <Label htmlFor="archive_enabled">
                Archive events before deletion (coming soon)
              </Label>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Button onClick={handleSavePolicy} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Policy
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={handleTriggerCleanup}
                disabled={isCleaningUp}
              >
                {isCleaningUp ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {isCleaningUp ? 'Cleaning up...' : 'Run Cleanup Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
