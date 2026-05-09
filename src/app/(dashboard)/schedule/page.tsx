"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, FolderOpen, RefreshCw, ExternalLink, Trash2, Plus, CheckCircle, XCircle, AlertCircle, Link2, FileSpreadsheet } from "lucide-react";

interface ScheduleData {
  connected: boolean;
  folder?: {
    id: string;
    name: string;
    link: string;
  };
  spreadsheet?: {
    id: string;
    name: string;
    link: string;
  };
  status: 'not_setup' | 'loading' | 'ready' | 'error';
  message?: string;
}

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);

  // Check if user is admin
  const isAdmin = session?.user?.email === "kontenval.id@gmail.com";

  // Redirect if not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isAdmin) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  // Fetch schedule status
  const fetchScheduleStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/composio/schedule');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setScheduleData({
            connected: data.connected,
            folder: data.folder,
            spreadsheet: data.spreadsheet,
            status: data.connected ? 'ready' : 'not_setup',
            message: data.message
          });
        } else {
          setScheduleData({
            connected: false,
            status: 'not_setup',
            message: data.error || 'Failed to check status'
          });
        }
      } else {
        setScheduleData({
          connected: false,
          status: 'not_setup',
          message: 'Failed to connect to API'
        });
      }
    } catch (error) {
      console.error('Failed to fetch schedule status:', error);
      setScheduleData({
        connected: false,
        status: 'not_setup',
        message: 'Failed to check status'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user && isAdmin) {
      fetchScheduleStatus();
    }
  }, [session, isAdmin]);

  // Setup GSheets - DELETE existing files, CREATE new "Carousel 2026" spreadsheet
  const handleSetupGSheets = async () => {
    if (!confirm('This will delete ALL existing files in the Schedule folder and create a new "Carousel 2026" spreadsheet. Continue?')) {
      return;
    }

    setSetupLoading(true);
    try {
      // Step 1: Delete existing files
      const deleteRes = await fetch('/api/composio/schedule', {
        method: 'DELETE'
      });

      if (!deleteRes.ok) {
        throw new Error('Failed to delete existing files');
      }

      const deleteData = await deleteRes.json();
      console.log('Delete result:', deleteData);

      // Step 2: Create new spreadsheet
      const createRes = await fetch('/api/composio/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!createRes.ok) {
        throw new Error('Failed to create spreadsheet');
      }

      const createData = await createRes.json();
      console.log('Create result:', createData);

      if (createData.success) {
        setScheduleData({
          connected: true,
          folder: {
            id: createData.folderId || '',
            name: 'Schedule',
            link: createData.folderLink || `https://drive.google.com/drive/folders/1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF`
          },
          spreadsheet: {
            id: createData.spreadsheetId,
            name: 'Carousel 2026',
            link: createData.spreadsheetLink
          },
          status: 'ready',
          message: createData.message
        });
      }
    } catch (error) {
      console.error('Setup error:', error);
      setScheduleData(prev => prev ? {
        ...prev,
        status: 'error',
        message: 'Failed to setup: ' + (error as Error).message
      } : null);
    } finally {
      setSetupLoading(false);
    }
  };

  // Delete all files in Schedule folder
  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL files in the Schedule folder? This cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch('/api/composio/schedule', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete files');
      }

      const data = await response.json();
      console.log('Delete result:', data);

      // Refresh status
      await fetchScheduleStatus();
    } catch (error) {
      console.error('Delete error:', error);
      setScheduleData(prev => prev ? {
        ...prev,
        status: 'error',
        message: 'Failed to delete: ' + (error as Error).message
      } : null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchScheduleStatus();
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <XCircle className="w-16 h-16 text-red-500" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-center text-muted-foreground">
              You don't have permission to access this page. Only admins can access the Schedule page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Schedule Management</h1>
            <p className="text-muted-foreground">
              Setup and manage content calendar spreadsheets
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading || setupLoading || deleteLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connection Status */}
        <Card className={scheduleData?.connected ? 'border-green-200 bg-green-50/50 dark:bg-green-900/20' : 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/20'}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${scheduleData?.connected ? 'bg-green-100 dark:bg-green-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                {scheduleData?.connected ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <p className="font-semibold">Connection Status</p>
                <p className="text-sm text-muted-foreground">
                  {scheduleData?.connected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            <Badge variant={scheduleData?.connected ? 'success' : 'warning'} className="text-sm">
              {scheduleData?.connected ? 'Connected' : 'Not Setup'}
            </Badge>
          </CardContent>
        </Card>

        {/* Folder Status */}
        <Card className={scheduleData?.folder ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 bg-slate-50/50 dark:bg-slate-900/20'}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${scheduleData?.folder ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-100 dark:bg-slate-900/50'}`}>
                <FolderOpen className={`w-6 h-6 ${scheduleData?.folder ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
              </div>
              <div>
                <p className="font-semibold">Schedule Folder</p>
                <p className="text-sm text-muted-foreground">
                  {scheduleData?.folder ? scheduleData.folder.name : 'Not created'}
                </p>
              </div>
            </div>
            {scheduleData?.folder ? (
              <Badge variant="secondary" className="text-sm">Ready</Badge>
            ) : (
              <Badge variant="outline" className="text-sm">Missing</Badge>
            )}
          </CardContent>
        </Card>

        {/* Spreadsheet Status */}
        <Card className={scheduleData?.spreadsheet ? 'border-purple-200 bg-purple-50/50 dark:bg-purple-900/20' : 'border-slate-200 bg-slate-50/50 dark:bg-slate-900/20'}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${scheduleData?.spreadsheet ? 'bg-purple-100 dark:bg-purple-900/50' : 'bg-slate-100 dark:bg-slate-900/50'}`}>
                <FileSpreadsheet className={`w-6 h-6 ${scheduleData?.spreadsheet ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'}`} />
              </div>
              <div>
                <p className="font-semibold">Carousel 2026</p>
                <p className="text-sm text-muted-foreground">
                  {scheduleData?.spreadsheet ? 'Spreadsheet ready' : 'Not created'}
                </p>
              </div>
            </div>
            {scheduleData?.spreadsheet ? (
              <Badge variant="secondary" className="text-sm">Ready</Badge>
            ) : (
              <Badge variant="outline" className="text-sm">Missing</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setup GSheets Card */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              Setup Google Sheets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will delete all existing files in the <strong>Schedule</strong> folder and create a new 
              <strong> "Carousel 2026"</strong> spreadsheet with monthly sheets for content scheduling.
            </p>
            
            <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">What happens:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Delete all existing files in Schedule folder</li>
                <li>Create new "Carousel 2026" spreadsheet</li>
                <li>Add monthly sheet (current month)</li>
                <li>Add header row with content fields</li>
                <li>Generate sample content for this month</li>
              </ol>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleSetupGSheets}
                disabled={setupLoading || deleteLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {setupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Setup GSheets
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Warning: This will permanently delete all files in the Schedule folder
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delete All Files Card */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              Delete All Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Permanently delete all files in the <strong>Schedule</strong> folder. 
              This action cannot be undone.
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-600 dark:text-red-400">
                  <p className="font-medium">Warning!</p>
                  <p className="mt-1">This will permanently delete all files. Make sure you have backups if needed.</p>
                </div>
              </div>
            </div>

            <Button 
              variant="outline"
              onClick={handleDeleteAll}
              disabled={setupLoading || deleteLoading || !scheduleData?.folder}
              className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Files
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Links Section */}
      {(scheduleData?.folder || scheduleData?.spreadsheet) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Drive Folder Link */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">
                    <FolderOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium">Schedule Folder</p>
                    <p className="text-sm text-muted-foreground">Google Drive</p>
                  </div>
                </div>
                <a 
                  href={scheduleData?.folder?.link || 'https://drive.google.com/drive/folders/1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                </a>
              </div>

              {/* Spreadsheet Link */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Carousel 2026</p>
                    <p className="text-sm text-muted-foreground">Google Sheets</p>
                  </div>
                </div>
                {scheduleData?.spreadsheet ? (
                  <a 
                    href={scheduleData.spreadsheet.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="border-green-200 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                  </a>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Not Ready
                  </Button>
                )}
              </div>
            </div>

            {/* Spreadsheet Preview */}
            {scheduleData?.spreadsheet && (
              <div className="mt-6 p-4 rounded-xl bg-muted/30 dark:bg-muted/20 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium">Spreadsheet Structure</p>
                    <p className="text-sm text-muted-foreground">What's included in Carousel 2026</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-2xl font-bold text-green-600">{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}</p>
                    <p className="text-xs text-muted-foreground">Current Sheet</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-lg font-semibold">Date</p>
                    <p className="text-xs text-muted-foreground">Posting date</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-lg font-semibold">Topic</p>
                    <p className="text-xs text-muted-foreground">Content topic</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-lg font-semibold">Caption</p>
                    <p className="text-xs text-muted-foreground">Post caption</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-lg font-semibold">Status</p>
                    <p className="text-xs text-muted-foreground">Planned/Done</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {scheduleData?.status === 'error' && scheduleData.message && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="flex items-center gap-3 py-4">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-600">{scheduleData.message}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
