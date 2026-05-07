// Dashboard types

export interface PlatformData {
  connected: boolean;
  name: string;
  handle: string;
  followers?: number;
  followers_count?: number;
  subscribers?: number;
  reach?: number;
  views?: number;
  posts?: number;
  mediaCount?: number;
  videoCount?: number;
  viewCount?: number;
  engagement?: {
    likes?: number;
    comments?: number;
    saves?: number;
    shares?: number;
  };
  posts_stats?: { reach?: number; impressions?: number };
  link?: string;
  raw?: any;
}

export interface DashboardData {
  facebook: PlatformData;
  instagram: PlatformData;
  youtube: PlatformData;
  metaAds: {
    connected: boolean;
    accounts: any[];
    campaigns: any[];
    summary: {
      totalSpend: number;
      totalCampaigns: number;
      avgCPC: number;
    };
  };
  googleDrive: {
    connected: boolean;
    fileCount: number;
  };
  timestamp: string;
  source: string;
}