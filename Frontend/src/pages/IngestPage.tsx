import { useState } from 'react';
import { ingestEvent, ingestBatch, ingestFile, type IngestEventRequest } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SOURCES, ACTIONS } from '@/lib/constants';
import { Upload, FileJson, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function IngestPage() {
  const [activeTab, setActiveTab] = useState('single');
  const [isLoading, setIsLoading] = useState(false);

  // Single event form
  const [singleEvent, setSingleEvent] = useState<IngestEventRequest>({
    source: 'api',
    severity: 3,
  });

  // Batch JSON
  const [batchJson, setBatchJson] = useState('');

  // File upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Results
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await ingestEvent(singleEvent);
      setResult({
        success: true,
        message: `Event ingested successfully. ID: ${response.event_id}`,
      });
      toast.success('Event ingested successfully');
      // Reset form
      setSingleEvent({ source: 'api', severity: 3 });
    } catch (error) {
      console.error('Ingest error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to ingest event',
      });
      toast.error('Failed to ingest event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchSubmit = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const events = JSON.parse(batchJson);
      if (!Array.isArray(events)) {
        throw new Error('JSON must be an array of events');
      }
      const response = await ingestBatch(events);
      setResult({
        success: true,
        message: `${response.count} events ingested successfully`,
      });
      toast.success(`${response.count} events ingested`);
      setBatchJson('');
    } catch (error) {
      console.error('Batch ingest error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to ingest events',
      });
      toast.error('Failed to ingest events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await ingestFile(selectedFile);
      setResult({
        success: true,
        message: `File "${response.filename}" processed. ${response.count} events ingested.`,
      });
      toast.success(`${response.count} events ingested from file`);
      setSelectedFile(null);
    } catch (error) {
      console.error('File ingest error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process file',
      });
      toast.error('Failed to process file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Ingest Events</h1>
        <p className="text-muted-foreground">
          Upload security events via form, JSON batch, or file upload
        </p>
      </div>

      {/* Result message */}
      {result && (
        <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="flex items-center gap-3 py-4">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.message}
            </span>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">
            <Send className="h-4 w-4 mr-2" />
            Single Event
          </TabsTrigger>
          <TabsTrigger value="batch">
            <FileJson className="h-4 w-4 mr-2" />
            Batch JSON
          </TabsTrigger>
          <TabsTrigger value="file">
            <Upload className="h-4 w-4 mr-2" />
            File Upload
          </TabsTrigger>
        </TabsList>

        {/* Single Event Form */}
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Single Event</CardTitle>
              <CardDescription>
                Submit a single security event with custom fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Source */}
                  <div className="space-y-2">
                    <Label htmlFor="source">Source *</Label>
                    <Select
                      value={singleEvent.source}
                      onValueChange={(value) =>
                        setSingleEvent({ ...singleEvent, source: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCES.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Severity */}
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity (0-10)</Label>
                    <Input
                      id="severity"
                      type="number"
                      min={0}
                      max={10}
                      value={singleEvent.severity ?? ''}
                      onChange={(e) =>
                        setSingleEvent({
                          ...singleEvent,
                          severity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  {/* Event Type */}
                  <div className="space-y-2">
                    <Label htmlFor="event_type">Event Type</Label>
                    <Input
                      id="event_type"
                      value={singleEvent.event_type || ''}
                      onChange={(e) =>
                        setSingleEvent({ ...singleEvent, event_type: e.target.value })
                      }
                      placeholder="e.g., login_failed"
                    />
                  </div>

                  {/* Action */}
                  <div className="space-y-2">
                    <Label htmlFor="action">Action</Label>
                    <Select
                      value={singleEvent.action || ''}
                      onValueChange={(value) =>
                        setSingleEvent({ ...singleEvent, action: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIONS.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Source IP */}
                  <div className="space-y-2">
                    <Label htmlFor="src_ip">Source IP</Label>
                    <Input
                      id="src_ip"
                      value={singleEvent.src_ip || ''}
                      onChange={(e) =>
                        setSingleEvent({ ...singleEvent, src_ip: e.target.value })
                      }
                      placeholder="e.g., 192.168.1.100"
                    />
                  </div>

                  {/* Destination IP */}
                  <div className="space-y-2">
                    <Label htmlFor="dst_ip">Destination IP</Label>
                    <Input
                      id="dst_ip"
                      value={singleEvent.dst_ip || ''}
                      onChange={(e) =>
                        setSingleEvent({ ...singleEvent, dst_ip: e.target.value })
                      }
                      placeholder="e.g., 10.0.0.1"
                    />
                  </div>

                  {/* User */}
                  <div className="space-y-2">
                    <Label htmlFor="user">User</Label>
                    <Input
                      id="user"
                      value={singleEvent.user || ''}
                      onChange={(e) =>
                        setSingleEvent({ ...singleEvent, user: e.target.value })
                      }
                      placeholder="e.g., john@example.com"
                    />
                  </div>

                  {/* Host */}
                  <div className="space-y-2">
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      value={singleEvent.host || ''}
                      onChange={(e) =>
                        setSingleEvent({ ...singleEvent, host: e.target.value })
                      }
                      placeholder="e.g., server-01"
                    />
                  </div>
                </div>

                {/* Raw Data */}
                <div className="space-y-2">
                  <Label htmlFor="raw">Raw Data (JSON)</Label>
                  <Textarea
                    id="raw"
                    value={
                      typeof singleEvent.raw === 'string'
                        ? singleEvent.raw
                        : JSON.stringify(singleEvent.raw || '', null, 2)
                    }
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setSingleEvent({ ...singleEvent, raw: parsed });
                      } catch {
                        setSingleEvent({ ...singleEvent, raw: e.target.value });
                      }
                    }}
                    placeholder='{"key": "value"}'
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit Event
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch JSON */}
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch JSON</CardTitle>
              <CardDescription>
                Submit multiple events as a JSON array (max 1000 events)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch">JSON Array</Label>
                <Textarea
                  id="batch"
                  value={batchJson}
                  onChange={(e) => setBatchJson(e.target.value)}
                  placeholder={`[
  {
    "source": "api",
    "event_type": "login_success",
    "user": "alice@example.com",
    "src_ip": "192.168.1.100",
    "severity": 1
  },
  {
    "source": "firewall",
    "event_type": "connection_blocked",
    "src_ip": "10.0.0.50",
    "dst_ip": "8.8.8.8",
    "action": "deny",
    "severity": 4
  }
]`}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={handleBatchSubmit} disabled={isLoading || !batchJson.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileJson className="h-4 w-4 mr-2" />
                )}
                Submit Batch
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Upload */}
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Upload a JSON or syslog file containing events (max 10MB, 1000 events)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".json,.txt,.syslog,.log"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <h4 className="font-medium mb-2">Supported Formats:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>JSON</strong>: Array of event objects with <code>source</code> field</li>
                  <li><strong>Syslog/Text</strong>: One log message per line (parsed as firewall source)</li>
                </ul>
              </div>

              <Button onClick={handleFileSubmit} disabled={isLoading || !selectedFile}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload File
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
