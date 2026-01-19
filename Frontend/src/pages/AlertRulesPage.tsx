import { useState, useEffect, useCallback } from 'react';
import {
  getAlertRules,
  updateAlertRule,
  createDefaultRules,
} from '@/api';
import type { AlertRule } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertTriangle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [webhookUrls, setWebhookUrls] = useState<Record<string, string>>({});
  const [notifyDiscord, setNotifyDiscord] = useState<Record<string, boolean>>({});

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAlertRules();
      setRules(data);
      // Initialize webhook URLs and notify states
      const urls: Record<string, string> = {};
      const notify: Record<string, boolean> = {};
      data.forEach((rule) => {
        urls[rule.id] = rule.discord_webhook_url || '';
        notify[rule.id] = rule.notify_discord || false;
      });
      setWebhookUrls(urls);
      setNotifyDiscord(notify);
    } catch (error) {
      console.error('Failed to fetch alert rules:', error);
      toast.error('Failed to fetch alert rules');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggleEnabled = async (rule: AlertRule) => {
    try {
      await updateAlertRule(rule.id, { enabled: !rule.enabled });
      toast.success(`Rule ${rule.enabled ? 'disabled' : 'enabled'}`);
      fetchRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      toast.error('Failed to toggle rule');
    }
  };

  const handleCreateDefaults = async () => {
    try {
      const created = await createDefaultRules();
      if (created.length > 0) {
        toast.success(`Created ${created.length} default rules`);
      } else {
        toast.info('Default rules already exist');
      }
      fetchRules();
    } catch (error) {
      console.error('Failed to create default rules:', error);
      toast.error('Failed to create default rules');
    }
  };

  const handleSaveDiscord = async (ruleId: string) => {
    setIsSaving(ruleId);
    try {
      await updateAlertRule(ruleId, {
        notify_discord: notifyDiscord[ruleId],
        discord_webhook_url: webhookUrls[ruleId],
      });
      toast.success('Discord settings saved');
      fetchRules();
    } catch (error) {
      console.error('Failed to save Discord settings:', error);
      toast.error('Failed to save Discord settings');
    } finally {
      setIsSaving(null);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alert Rules</h1>
          <p className="text-muted-foreground">
            Configure alerting for security threats
          </p>
        </div>
        {rules.length === 0 && (
          <Button onClick={handleCreateDefaults}>
            <Sparkles className="h-4 w-4 mr-2" />
            Create Default Rules
          </Button>
        )}
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="mb-4 text-lg">No alert rules configured</p>
            <p className="mb-4 text-sm">
              Click "Create Default Rules" to set up the built-in alerting rules
            </p>
            <Button onClick={handleCreateDefaults}>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Default Rules
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleEnabled(rule)}
                    />
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>
                        {rule.description || 'No description'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">{rule.rule_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rule Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Threshold:</span>{' '}
                    <span className="font-medium">
                      {rule.threshold_count} events / {rule.threshold_window_seconds}s
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cooldown:</span>{' '}
                    <span className="font-medium">{rule.cooldown_seconds}s</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Group by:</span>{' '}
                    <span className="font-medium">
                      {rule.group_by?.join(', ') || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Triggered:</span>{' '}
                    <span className="font-medium">
                      {rule.last_triggered_at
                        ? formatDate(rule.last_triggered_at, 'PP')
                        : 'Never'}
                    </span>
                  </div>
                </div>

                {/* Conditions preview */}
                <div className="pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Conditions: </span>
                  <span className="text-sm">
                    {Array.isArray(rule.conditions)
                      ? rule.conditions
                          .map((c) => `${c.field} ${c.operator} "${c.value}"`)
                          .join(' AND ')
                      : `${rule.conditions.field} ${rule.conditions.operator} "${rule.conditions.value}"`}
                  </span>
                </div>

                {/* Discord Webhook Config */}
                <div className="pt-3 border-t space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`notify-${rule.id}`}
                      checked={notifyDiscord[rule.id] || false}
                      onCheckedChange={(checked) =>
                        setNotifyDiscord({ ...notifyDiscord, [rule.id]: checked })
                      }
                    />
                    <Label htmlFor={`notify-${rule.id}`}>
                      Send Discord Notification
                    </Label>
                  </div>

                  {notifyDiscord[rule.id] && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="url"
                          placeholder="https://discord.com/api/webhooks/..."
                          value={webhookUrls[rule.id] || ''}
                          onChange={(e) =>
                            setWebhookUrls({
                              ...webhookUrls,
                              [rule.id]: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button
                        onClick={() => handleSaveDiscord(rule.id)}
                        disabled={isSaving === rule.id}
                      >
                        {isSaving === rule.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span className="ml-2">Save</span>
                      </Button>
                    </div>
                  )}

                  {!notifyDiscord[rule.id] && rule.notify_discord && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveDiscord(rule.id)}
                      disabled={isSaving === rule.id}
                    >
                      {isSaving === rule.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save (Disable Discord)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
