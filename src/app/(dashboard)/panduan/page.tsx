"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Shield, Code } from "lucide-react";

const guides = [
  {
    category: "Panduan",
    icon: BookOpen,
    items: [
      {
        title: "Dashboard Overview",
        description: "Memahami tampilan dan fitur utama dashboard",
        content: `<h3>Selamat Datang di Merry Dashboard</h3><p>Dashboard ini menampilkan statistik dari berbagai platform media sosial dan Meta Ads dalam satu tempat.</p><h4>Fitur Utama:</h4><ul><li><strong>Statistik Card</strong> - Total followers, reach, engagement, YouTube views</li><li><strong>Engagement Chart</strong> - Grafik interaktif untuk engagement</li><li><strong>Audience Distribution</strong> - Pie chart untuk distribusi followers</li><li><strong>Meta Ads Quick Stats</strong> - Statistik campaign ads</li></ul><h4>Platform yang Didukung:</h4><ul><li><strong>Facebook</strong> - Followers, posts, reach, likes, comments, shares</li><li><strong>Instagram</strong> - Followers, posts, reach, likes, comments</li><li><strong>YouTube</strong> - Subscribers, videos, likes, comments, views</li><li><strong>Meta Ads</strong> - Spend, clicks, impressions, CPC, CPM</li></ul>`
      },
      {
        title: "Sync Data",
        description: "Cara melakukan sinkronisasi data",
        content: `<h3>Melakukan Sync Data</h3><p>Klik tombol <strong>"Sync Data"</strong> di bagian atas dashboard untuk memperbarui semua data.</p><h4>Cara Kerja:</h4><ol><li>Klik tombol Sync Data</li><li>Sistem mengambil data dari Facebook, Instagram, YouTube, Meta Ads</li><li>Data diupdate otomatis di dashboard</li><li>Waktu terakhir sync akan ditampilkan</li></ol><h4>Catatan:</h4><ul><li>Sync memerlukan API tokens yang valid di Settings</li><li>Auto-sync berjalan setiap jam</li></ul>`
      }
    ]
  },
  {
    category: "API & Integrasi",
    icon: Code,
    items: [
      {
        title: "Meta Graph API",
        description: "Konfigurasi token Meta untuk Ads",
        content: `<h3>Setup Meta Graph API</h3><ol><li>Buka <a href="https://developers.facebook.com" target="_blank">Meta Developers</a></li><li>Klik "Create App" dan pilih "Business"</li><li>Gunakan <a href="https://developers.facebook.com/tools/explorer" target="_blank">Graph API Explorer</a> untuk generate token</li><li>Generate token dengan permissions: ads_management, ads_read, business_management, pages_read_engagement</li><li>Tempelkan token di Settings</li></ol>`
      },
      {
        title: "TikTok via Zernio",
        description: "Integrasi TikTok menggunakan Zernio API",
        content: `<h3>Setup TikTok via Zernio</h3><p>Karena koneksi TikTok via Composio tidak berhasil, gunakan alternatif Zernio API.</p><ol><li>Buka <a href="https://zernio.com" target="_blank">zernio.com</a></li><li>Daftar dan buat akun</li><li>Dapatkan API key dari dashboard</li><li>Masukkan Zernio API Key di Settings</li></ol>`
      }
    ]
  },
  {
    category: "Keamanan",
    icon: Shield,
    items: [
      {
        title: "Autentikasi",
        description: "Metode login dan keamanan akun",
        content: `<h3>Sistem Autentikasi</h3><p>Merry Dashboard menggunakan Google OAuth untuk autentikasi.</p><h4>Keuntungan:</h4><ul><li><strong>Secure</strong> - Tidak perlu password tambahan</li><li><strong>2FA Support</strong> - Mendukung Two-Factor Authentication</li><li><strong>Convenient</strong> - Login dengan satu klik</li></ul><h4>Best Practices:</h4><ul><li>Aktifkan 2FA di Google Account</li><li>Logout setelah selesai menggunakan</li></ul>`
      }
    ]
  }
];

export default function PanduanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const toggleItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Panduan</h1>
            <p className="text-muted-foreground">Pelajari cara menggunakan Merry Dashboard</p>
          </div>
        </div>

        {guides.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <div key={category.category} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <CategoryIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold">{category.category}</h2>
              </div>

              <div className="space-y-2">
                {category.items.map((item, index) => {
                  const itemId = `${category.category}-${index}`;
                  const isExpanded = expandedItem === itemId;

                  return (
                    <div
                      key={itemId}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-blue-500' : 'bg-slate-300'}`} />
                          <div>
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="prose prose-sm dark:prose-invert max-w-none pt-4 [&_a]:text-blue-600 [&_a]:underline" dangerouslySetInnerHTML={{ __html: item.content }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
