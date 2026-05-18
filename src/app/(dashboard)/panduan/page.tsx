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
        content: `
          <h3>Selamat Datang di Merry Dashboard</h3>
          <p>Dashboard ini menampilkan statistik dari berbagai platform media sosial dan Meta Ads dalam satu tempat.</p>
          
          <h4>Fitur Utama:</h4>
          <ul>
            <li><strong>Statistik Card</strong> - Total followers, reach, engagement, YouTube views</li>
            <li><strong>Engagement Chart</strong> - Grafik interaktif untuk engagement</li>
            <li><strong>Audience Distribution</strong> - Pie chart distribusi followers</li>
            <li><strong>Meta Ads Quick Stats</strong> - Statistik campaign ads</li>
          </ul>
          
          <h4>Platform yang Didukung:</h4>
          <ul>
            <li><strong>Facebook</strong> - Followers, posts, reach, likes, comments, shares</li>
            <li><strong>Instagram</strong> - Followers, posts, reach, likes, comments</li>
            <li><strong>YouTube</strong> - Subscribers, videos, likes, comments, views</li>
            <li><strong>Meta Ads</strong> - Spend, clicks, impressions, CPC, CPM</li>
          </ul>
        `
      },
      {
        title: "Sync Data",
        description: "Cara sinkronisasi data dari berbagai platform",
        content: `
          <h3>Melakukan Sync Data</h3>
          <p>Klik tombol <strong>"Sync Data"</strong> di bagian atas dashboard.</p>
          
          <h4>Cara Kerja:</h4>
          <ol>
            <li>Klik tombol Sync Data</li>
            <li>Sistem mengambil data dari Facebook, Instagram, YouTube, Meta Ads</li>
            <li>Data diperbarui otomatis di dashboard</li>
            <li>Waktu terakhir sync ditampilkan</li>
          </ol>
          
          <h4>Sumber Data:</h4>
          <ul>
            <li>FB, IG, YouTube: <strong>Composio</strong></li>
            <li>Meta Ads: <strong>Meta Graph API</strong> langsung</li>
            <li>Auto-sync setiap jam</li>
          </ul>
        `
      }
    ]
  },
  {
    category: "API & Integrasi",
    icon: Code,
    items: [
      {
        title: "Composio Connection",
        description: "WAJIB - Cara konek Composio untuk social media",
        content: `
          <h3>Setup Composio</h3>
          <p><strong>WAJIB</strong> - Composio digunakan untuk mengambil data Facebook, Instagram, YouTube, GDrive, dan Meta Ads. <em>Gratis</em> dengan limits tertentu.</p>
          
          <h4>Platform:</h4>
          <ul>
            <li><strong>Instagram</strong> - Followers, Posts</li>
            <li><strong>Facebook</strong> - Page Stats</li>
            <li><strong>YouTube</strong> - Subscribers</li>
            <li><strong>GDrive</strong> - Cloud Storage</li>
            <li><strong>Meta Ads</strong> - Ads Insights</li>
          </ul>
          
          <h4>Langkah Setup:</h4>
          <ol>
            <li>Buka <a href="https://app.composio.dev" target="_blank">app.composio.dev</a></li>
            <li>Daftar / Login dengan Google</li>
            <li>Klik "Add New Connection"</li>
            <li>Pilih platform satu per satu</li>
            <li>Berikan permissions yang diminta</li>
          </ol>
        `
      },
      {
        title: "Zernio API",
        description: "WAJIB - TikTok & Meta Ads via Zernio",
        content: `
          <h3>Setup Zernio</h3>
          <p><strong>WAJIB</strong> - Zernio untuk koneksi TikTok dan backup Meta Ads. 1 API key untuk semua platform, <em>berbayar jika lebih dari 2 akun</em>.</p>
          
          <h4>Platform:</h4>
          <ul>
            <li><strong>TikTok</strong> - Analytics</li>
            <li><strong>Meta Ads</strong> - Ads Insights (backup)</li>
          </ul>
          
          <h4>Langkah Setup:</h4>
          <ol>
            <li>Daftar di <a href="https://zernio.com" target="_blank">zernio.com</a></li>
            <li>Dapatkan API key dari dashboard</li>
            <li>Masukkan di Settings → Zernio API</li>
            <li>Klik Save</li>
          </ol>
        `
      },
      {
        title: "Meta Graph API",
        description: "OPSIONAL - Backup untuk Meta Ads",
        content: `
          <h3>Setup Meta Graph API</h3>
          <p><strong>OPSIONAL</strong> - Backup untuk Meta Ads. Tidak diperlukan jika sudah konek Meta Ads via Composio.</p>
          
          <h4>Langkah Setup:</h4>
          <ol>
            <li>Buka <a href="https://developers.facebook.com" target="_blank">Meta Developers</a></li>
            <li>Create App → Business</li>
            <li>Setup Facebook Login</li>
            <li>Dapatkan token dari <a href="https://developers.facebook.com/tools/explorer" target="_blank">Graph API Explorer</a></li>
            <li>Masukkan di Settings → Meta Graph API Token (paling bawah)</li>
          </ol>
        `
      },
      {
        title: "X (Twitter) API",
        description: "OPSIONAL - Integrasi Twitter/X",
        content: `
          <h3>Setup X (Twitter) API</h3>
          <p><strong>OPSIONAL</strong> - Untuk integrasi X/Twitter analytics.</p>
          
          <h4>Langkah Setup:</h4>
          <ol>
            <li>Daftar di <a href="https://developer.twitter.com" target="_blank">Twitter Developer Portal</a></li>
            <li>Buat project dan app</li>
            <li>Dapatkan API Key</li>
            <li>Masukkan di Settings → X Consumer API</li>
          </ol>
        `
      }
    ]
  },
  {
    category: "Keamanan",
    icon: Shield,
    items: [
      {
        title: "Autentikasi & Per User Data",
        description: "Login dan keamanan data per user",
        content: `
          <h3>Sistem Autentikasi</h3>
          <p>Merry Dashboard menggunakan <strong>Google OAuth</strong> untuk login.</p>
          
          <h4>Per User Data:</h4>
          <ul>
            <li>Setiap user punya <strong>API keys sendiri</strong></li>
            <li>Data <strong>tidak di-share</strong> antar user</li>
            <li>Login sebagai member berbeda = data berbeda</li>
            <li>Hanya owner yang bisa akses keys-nya</li>
          </ul>
        `
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
                  const itemId = category.category + "-" + index;
                  const isExpanded = expandedItem === itemId;

                  return (
                    <div key={itemId} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <button onClick={() => toggleItem(itemId)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className={"w-2 h-2 rounded-full " + (isExpanded ? "bg-blue-500" : "bg-slate-300")} />
                          <div>
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <svg className={"w-5 h-5 text-slate-400 " + (isExpanded ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="prose prose-sm dark:prose-invert max-w-none pt-4 [&_a]:text-blue-600 [&_a]:underline [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-medium [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1" dangerouslySetInnerHTML={{ __html: item.content }} />
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
