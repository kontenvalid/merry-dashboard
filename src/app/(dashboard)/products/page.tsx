"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { 
  FolderOpen, FileText, FileImage, File, 
  Download, ExternalLink, RefreshCw, 
  HardDrive, Folder, Clock, CheckCircle
} from "lucide-react";

const mockProducts = [
  {
    id: "1",
    name: "Panduan Affiliate Marketing.pdf",
    type: "pdf",
    size: "2.5 MB",
    modifiedAt: "2026-05-01",
    downloadUrl: "#",
    status: "active"
  },
  {
    id: "2",
    name: "Digital Product Blueprint.pdf",
    type: "pdf",
    size: "3.8 MB",
    modifiedAt: "2026-04-28",
    downloadUrl: "#",
    status: "active"
  },
  {
    id: "3",
    name: "Email Marketing Template.docx",
    type: "doc",
    size: "520 KB",
    modifiedAt: "2026-04-25",
    downloadUrl: "#",
    status: "active"
  },
  {
    id: "4",
    name: "Social Media Content Calendar.xlsx",
    type: "sheet",
    size: "1.2 MB",
    modifiedAt: "2026-04-20",
    downloadUrl: "#",
    status: "active"
  },
  {
    id: "5",
    name: "Brand Guidelines.pdf",
    type: "pdf",
    size: "4.1 MB",
    modifiedAt: "2026-04-15",
    downloadUrl: "#",
    status: "active"
  }
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText className="w-6 h-6 text-red-500" />;
    case "doc":
      return <FileText className="w-6 h-6 text-blue-500" />;
    case "sheet":
      return <FileText className="w-6 h-6 text-green-500" />;
    default:
      return <File className="w-6 h-6 text-gray-500" />;
  }
};

export default function ProductsPage() {
  const [loading, setLoading] = useState(false);
  const [products] = useState(mockProducts);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const pdfCount = products.filter(p => p.type === "pdf").length;
  const docCount = products.filter(p => p.type !== "pdf").length;
  const totalSize = products.reduce((acc, p) => {
    const size = parseFloat(p.size.split(" ")[0]);
    const unit = p.size.split(" ")[1];
    return acc + (unit === "MB" ? size : size / 1000);
  }, 0);

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
            href="https://drive.google.com/drive/folders/1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF" 
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
          subtitle="Sheets, docs"
          icon={<File className="w-6 h-6 text-green-600" />}
          colorClass="bg-green-100 dark:bg-green-900/30"
          textClass="text-green-600 dark:text-green-400"
          borderClass="border-green-200 dark:border-green-800"
        />
        <StatCard
          title="Total Size"
          value={`${totalSize.toFixed(1)} MB`}
          subtitle="Storage used"
          icon={<HardDrive className="w-6 h-6 text-purple-600" />}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          textClass="text-purple-600 dark:text-purple-400"
          borderClass="border-purple-200 dark:border-purple-800"
        />
      </div>

      {/* Folder Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Folder className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">Composio/Ebook</p>
              <p className="text-sm text-muted-foreground">
                Google Drive Folder • 1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF
              </p>
            </div>
          </div>
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Connected
          </Badge>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Products ({products.length})</span>
            <Badge variant="secondary">
              <Clock className="w-3 h-3 mr-1" />
              Last sync: Just now
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {getFileIcon(product.type)}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{product.size}</span>
                      <span>•</span>
                      <span>{product.modifiedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={product.status === "active" ? "success" : "secondary"}>
                    {product.status}
                  </Badge>
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}