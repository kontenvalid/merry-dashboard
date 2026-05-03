"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { 
  FolderOpen, FileText, File, 
  Download, ExternalLink, RefreshCw, 
  HardDrive, Folder, Clock, CheckCircle, AlertCircle, Loader2
} from "lucide-react";

interface GDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: string;
  webViewLink: string;
}

interface GDriveData {
  connected: boolean;
  folder?: {
    id: string;
    name: string;
    link: string;
  };
  files: GDriveFile[];
  summary?: {
    totalFiles: number;
    totalSize: number;
    pdfCount: number;
    docCount: number;
  };
}

const FOLDER_ID = '1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF';
const FOLDER_LINK = 'https://drive.google.com/drive/folders/1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF';

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) {
    return <FileText className="w-6 h-6 text-red-500" />;
  } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return <FileText className="w-6 h-6 text-green-500" />;
  } else if (mimeType.includes('document') || mimeType.includes('word')) {
    return <FileText className="w-6 h-6 text-blue-500" />;
  } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return <FileText className="w-6 h-6 text-orange-500" />;
  }
  return <File className="w-6 h-6 text-gray-500" />;
};

const getFileType = (mimeType: string) => {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'sheet';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'doc';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slide';
  return 'file';
};

const formatFileSize = (bytes: number) => {
  if (bytes >= 1000000) {
    return `${(bytes / 1000000).toFixed(1)} MB`;
  } else if (bytes >= 1000) {
    return `${(bytes / 1000).toFixed(0)} KB`;
  }
  return `${bytes} B`;
};

export default function ProductsPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [gdriveData, setGdriveData] = useState<GDriveData | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Fetch real data from Google Drive API
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/composio/gdrive');
      if (response.ok) {
        const data = await response.json();
        setGdriveData(data);
        setLastSync(new Date());
        
        if (!data.connected && data.files.length === 0) {
          console.log('Google Drive folder is empty or not connected');
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchProducts();
    setLoading(false);
  };

  // Calculate stats from real data
  const products = gdriveData?.files || [];
  const pdfCount = products.filter(p => p.mimeType?.includes('pdf')).length;
  const docCount = products.filter(p => !p.mimeType?.includes('pdf')).length;
  const totalSize = products.reduce((acc, p) => acc + (p.size || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Digital Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your digital products from Google Drive
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href={FOLDER_LINK}
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open GDrive Folder
            </Button>
          </a>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sync
          </Button>
        </div>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Products"
              value={products.length.toString()}
              subtitle="Digital products"
              icon={<FolderOpen className="w-6 h-6 text-blue-600" />}
              colorClass="bg-blue-100 dark:bg-blue-900/30"
              textClass="text-blue-600 dark:text-blue-400"
              borderClass="border-blue-200 dark:border-blue-800"
            />
            <StatCard
              title="PDFs"
              value={pdfCount.toString()}
              subtitle="Documents"
              icon={<FileText className="w-6 h-6 text-red-600" />}
              colorClass="bg-red-100 dark:bg-red-900/30"
              textClass="text-red-600 dark:text-red-400"
              borderClass="border-red-200 dark:border-red-800"
            />
            <StatCard
              title="Other Files"
              value={docCount.toString()}
              subtitle="Sheets, docs, slides"
              icon={<File className="w-6 h-6 text-green-600" />}
              colorClass="bg-green-100 dark:bg-green-900/30"
              textClass="text-green-600 dark:text-green-400"
              borderClass="border-green-200 dark:border-green-800"
            />
            <StatCard
              title="Total Size"
              value={formatFileSize(totalSize)}
              subtitle="Storage used"
              icon={<HardDrive className="w-6 h-6 text-purple-600" />}
              colorClass="bg-purple-100 dark:bg-purple-900/30"
              textClass="text-purple-600 dark:text-purple-400"
              borderClass="border-purple-200 dark:border-purple-800"
            />
          </div>

          {/* Folder Info */}
          <Card className={`border-blue-200 dark:border-blue-800 ${!gdriveData?.connected ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Folder className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">{gdriveData?.folder?.name || 'Ebook'}</p>
                  <p className="text-sm text-muted-foreground">
                    Google Drive Folder • {FOLDER_ID}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {gdriveData?.connected ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {products.length > 0 ? 'Demo Data' : 'Empty Folder'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Products ({products.length})</span>
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {lastSync ? `Last sync: ${lastSync.toLocaleTimeString()}` : 'Never synced'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {getFileIcon(product.mimeType)}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>{formatFileSize(product.size)}</span>
                            <span>•</span>
                            <span>{new Date(product.modifiedTime).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getFileType(product.mimeType).toUpperCase()}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(product.webViewLink, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    {gdriveData?.connected 
                      ? 'Your Google Drive folder is empty. Add some digital products to get started.'
                      : 'Connect Google Drive in Settings to sync your products.'}
                  </p>
                  {!gdriveData?.connected && (
                    <a href={FOLDER_LINK} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Google Drive Folder
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}