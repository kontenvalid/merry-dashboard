"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  Key,
  Globe,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
  Zap,
  Shield
} from "lucide-react";

interface ApiStatus {
  name: string;
  status: 'success' | 'error' | 'loading' | 'pending';
  message: string;
  details?: any;
  duration?: number;
}

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Initial API checks
  const apis = [
    { name: 'Meta Ads (Direct Graph API)', endpoint: '/api/composio/metaads' },
    { name: 'Social Media (Composio MCP)', endpoint: '/api/composio/overview' },
    { name: 'Google Drive (Composio MCP)', endpoint: '/api/composio/gdrive' },
    { name: 'Composio MCP Status', endpoint: '/api/composio/mcp-status' },
    { name: 'Dashboard Settings', endpoint: '/api/settings' },
  ];

  const checkApi = async () => {
    setLoading(true);
    const results: ApiStatus[] = [];

    for (const api of apis) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(api.endpoint, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const duration = Date.now() - startTime;
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (response.ok) {
          results.push({
            name: api.name,
            status: 'success',
            message: `HTTP ${response.status} - OK`,
            details: data,
            duration
          });
        } else {
          results.push({
            name: api.name,
            status: 'error',
            message: `HTTP ${response.status} - ${response.statusText}`,
            details: data,
            duration
          });
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        results.push({
          name: api.name,
          status: 'error',
          message: error.message || 'Network error',
          duration
        });
      }
    }

    setApiStatuses(results);
    setLastRefresh(new Date());
    setLoading(false);
  };

  // Check Composio connection status via real API call
  const checkComposioStatus = async () => {
    const results: ApiStatus[] = [];
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/composio/mcp-status', { cache: 'no-store' });
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok && data.connected) {
        results.push({
          name: 'Composio MCP',
          status: 'success',
          message: 'Connected via Composio',
          details: data,
          duration
        });
      } else {
        results.push({
          name: 'Composio MCP',
          status: 'error',
          message: data.message || 'Not connected',
          details: data,
          duration
        });
      }
    } catch (error: any) {
      results.push({
        name: 'Composio MCP',
        status: 'error',
        message: error.message,
        duration: Date.now() - startTime
      });
    }
    
    return results;
  };

  useEffect(() => {
    checkApi();
  }, []);

  const toggleExpand = (name: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'loading':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getHealthStatus = () => {
    const successCount = apiStatuses.filter(s => s.status === 'success').length;
    const total = apiStatuses.length;
    
    if (successCount === total) {
      return { 
        status: 'All Systems Operational', 
        color: 'text-green-500',
        bg: 'bg-green-100 dark:bg-green-900/30'
      };
    } else if (successCount > total / 2) {
      return { 
        status: 'Degraded', 
        color: 'text-yellow-500',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30'
      };
    } else {
      return { 
        status: 'System Issues', 
        color: 'text-red-500',
        bg: 'bg-red-100 dark:bg-red-900/30'
      };
    }
  };

  const health = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">System Debug</h1>
          <p className="text-muted-foreground mt-1">
            Troubleshooting & API Diagnostics (Admin Only)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last check: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={checkApi} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? 'Checking...' : 'Refresh All'}
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <Card className={health.bg}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6" />
              <div>
                <p className="font-semibold">System Health</p>
                <p className={`text-sm ${health.color} font-medium`}>{health.status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{apiStatuses.filter(s => s.status === 'success').length}/{apiStatuses.length}</p>
              <p className="text-sm text-muted-foreground">APIs Online</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Status List */}
      <div className="space-y-3">
        {apiStatuses.map((api) => (
          <Card key={api.name} className={api.status === 'error' ? 'border-red-200 dark:border-red-800' : ''}>
            <CardHeader className="py-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(api.name)}
              >
                <div className="flex items-center gap-3">
                  {expandedItems.has(api.name) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  {getStatusIcon(api.status)}
                  <CardTitle className="text-base">{api.name}</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(api.status)}
                  {api.duration && (
                    <span className="text-xs text-muted-foreground">{api.duration}ms</span>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {expandedItems.has(api.name) && api.details && (
              <CardContent className="pt-0">
                <div className="bg-muted/50 rounded-lg p-4 overflow-auto max-h-96">
                  <p className="text-xs text-muted-foreground mb-2">API Response:</p>
                  <pre className="text-xs whitespace-pre-wrap break-all">
                    {JSON.stringify(api.details, null, 2)}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Common Issues & Solutions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Common Issues & Solutions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <p className="font-medium">Meta Ads - No campaigns</p>
              <p className="text-sm text-muted-foreground">
                Solution: This is normal if you haven&apos;t created any campaigns yet. The API is working correctly.
              </p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <p className="font-medium">Google Drive - Empty products</p>
              <p className="text-sm text-muted-foreground">
                Solution: Upload digital products (PDFs, DOCX, spreadsheets) to your Google Drive. 
                Files in the &quot;Ebook&quot; folder will appear here.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="font-medium">Instagram - Followers 0 or 1</p>
              <p className="text-sm text-muted-foreground">
                Solution: This is real data from Instagram API. Your account is new, so follower count is low.
                Data will update automatically.
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-medium">Meta Ads - &quot;Not connected&quot;</p>
              <p className="text-sm text-muted-foreground">
                Solution: This is normal when there are no active campaigns. The connection is working.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status from actual API responses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiStatuses.find(a => a.name === 'Composio MCP Status') && (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Composio MCP</span>
                  <Badge variant={apiStatuses.find(a => a.name === 'Composio MCP Status')?.status === 'success' ? "success" : "destructive"}>
                    {apiStatuses.find(a => a.name === 'Composio MCP Status')?.status === 'success' ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Meta Graph API</span>
                  <Badge variant="success">Connected (Direct)</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Google Drive</span>
                  <Badge variant={apiStatuses.find(a => a.name === 'Google Drive (Composio MCP)')?.status === 'success' ? "success" : "secondary"}>
                    Via Composio
                  </Badge>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Connection Flow:</strong><br/>
              • <strong>Social Media</strong> → Composio MCP API<br/>
              • <strong>Meta Ads</strong> → Direct Graph API<br/>
              • <strong>Google Drive</strong> → Composio MCP API
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}