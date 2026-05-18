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
            <li><strong>Statistik Card</strong> - Menampilkan total followers, reach, engagement, dan YouTube views</li>
            <li><strong>Engagement Chart</strong> - Grafik interaktif untuk melihat engagement di setiap platform</li>
            <li><strong>Audience Distribution</strong> - Pie chart untuk melihat distribusi followers</li>
            <li><strong>Reach & Impressions</strong> - Area chart untuk performa konten</li>
            <li><strong>Meta Ads Quick Stats</strong> - Statistik singkat dari campaign ads</li>
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
        description: "Cara melakukan sinkronisasi data dari berbagai platform",
        content: `
          <h3>Melakukan Sync Data</h3>
          <p>Klik tombol <strong>"Sync Data"</strong> di bagian atas dashboard untuk memperbarui semua data.</p>
          
          <h4>Cara Kerja:</h4>
          <ol>
            <li>Klik tombol Sync Data</li>
            <li>Sistem akan mengambil data dari Facebook, Instagram, YouTube, dan Meta Ads</li>
            <li>Data akan diperbarui secara otomatis di dashboard</li>
            <li>Waktu terakhir sync akan ditampilkan</li>
          </ol>
          
          <h4>Catatan:</h4>
          <ul>
            <li>Data social media (FB, IG, YouTube) diambil via <strong>Composio</strong></li>
            <li>Data Meta Ads diambil via <strong>Meta Graph API</strong> langsung</li>
            <li>Auto-sync juga berjalan setiap jam secara otomatis</li>
          </ul>
        `
      },
      {
        title: "Currency Auto-Detect",
        description: "Mata uang otomatis dari Meta Ads",
        content: `
          <h3>Currency Auto-Detect</h3>
          <p>Dashboard akan secara otomatis mendeteksi mata uang dari Meta Ads account Anda.</p>
          
          <h4>Currency yang Didukung:</h4>
          <ul>
            <li><strong>IDR (Rp)</strong> - Rupiah Indonesia</li>
            <li><strong>USD ($)</strong> - US Dollar</li>
            <li><strong>EUR (€)</strong> - Euro</li>
            <li><strong>GBP (£)</strong> - British Pound</li>
            <li><strong>JPY (¥)</strong> - Japanese Yen</li>
            <li><strong>MYR (RM)</strong> - Malaysian Ringgit</li>
            <li><strong>SGD (S$)</strong> - Singapore Dollar</li>
            <li><strong>THB (฿)</strong> - Thai Baht</li>
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
        description: "Cara menghubungkan Composio untuk social media data",
        content: `
          <h3>Setup Composio</h3>
          <p>Composio digunakan untuk mengambil data dari Facebook, Instagram, YouTube, Google Drive, dan Meta Ads.</p>
          
          <h4>Yang WAJIB di-setup:</h4>
          <ol>
            <li>Buka <a href="https://app.composio.dev" target="_blank">app.composio.dev</a></li>
            <li>Daftar menggunakan email atau Google account</li>
            <li>Klik <strong>"Add New Connection"</strong></li>
            <li>Hubungkan platform berikut:</li>
          </ol>
          
          <h5>Instagram (WAJIB):</h5>
          <ul>
            <li>Pilih "Instagram" dari list apps</li>
            <li>Login dengan akun yang punya business/page</li>
            <li>IG harus terhubung dengan FB Page</li>
          </ul>
          
          <h5>Facebook (WAJIB):</h5>
          <ul>
            <li>Pilih "Facebook" dari list apps</li>
            <li>Login dengan Facebook account</li>
            <li>Pilih halaman bisnis (Page) yang ingin di-monitor</li>
            <li>Berikan permissions yang diminta</li>
          </ul>
          
          <h5>YouTube (WAJIB):</h5>
          <ul>
            <li>Pilih "YouTube" dari list apps</li>
            <li>Login dengan Google account YouTube</li>
            <li>Berikan akses ke channel YouTube</li>
          </ul>
          
          <h5>Google Drive (OPSIONAL):</h5>
          <ul>
            <li>Pilih "Google Drive" dari list apps</li>
            <li>Login dengan Google account</li>
            <li>Berikan akses read-only</li>
          </ul>
          
          <h5>Meta Ads (WAJIB):</h5>
          <ul>
            <li>Pilih "Meta Ads" dari list apps</li>
            <li>Login dengan Facebook business account</li>
            <li>Berikan akses ke ad accounts</li>
          </ul>
          
          <h4>Yang TIDAK perlu di-setup:</h4>
          <ul>
            <li><strong>X (Twitter) - TIDAK perluan Composio</strong></li>
            <li><strong>TikTok - Tidak tersedia di Composio, pakai Zernio</strong></li>
          </ul>
          
          <h4>Catatan Penting:</h4>
          <ul>
            <li><strong>Composio gratis</strong> dengan limits tertentu</li>
            <li>Untuk production, mungkin perlu upgrade plan</li>
            <li>Pastikan permissions sudah benar agar data bisa di-fetch</li>
            <li>Data dari Composio digunakan untuk FB, IG, YouTube, GDrive, Meta Ads stats</li>
          </ul>
        `
      },
      {
        title: "TikTok via Zernio",
        description: "Integrasi TikTok menggunakan alternatif Zernio API",
        content: `
          <h3>Setup TikTok via Zernio</h3>
          <p>Zernio adalah alternatif untuk koneksi TikTok. 1 API key bisa konek ke semua platform (berbayar jika lebih dari 2 akun).</p>
          
          <h4>Langkah 1: Dapatkan Zernio API Key</h4>
          <ol>
            <li>Buka <a href="https://zernio.com" target="_blank">zernio.com</a></li>
            <li>Daftar dan buat akun</li>
            <li>Dapatkan API key dari dashboard</li>
          </ol>
          
          <h4>Langkah 2: Konfigurasi</h4>
          <ol>
            <li>Buka menu Settings</li>
            <li>Cari bagian "Zernio API"</li>
            <li>Masukkan Zernio API Key</li>
            <li>Klik Save</li>
          </ol>
          
          <h4>Platform yang Didukung:</h4>
          <ul>
            <li><strong>TikTok</strong> - Analytics</li>
            <li><strong>Meta Ads</strong> - Ads Insights</li>
          </ul>
        `
      },
      {
        title: "Meta Graph API",
        description: "Konfigurasi token Meta untuk Ads dan Insights (Opsional)",
        content: `
          <h3>Setup Meta Graph API</h3>
          <p>Meta Graph API digunakan sebagai backup untuk mengambil data Meta Ads. <strong>OPSIONAL</strong> - jika sudah konek Meta Ads via Composio, token ini tidak diperlukan.</p>
          
          <h4>Langkah 1: Buat Meta App</h4>
          <ol>
            <li>Buka <a href="https://developers.facebook.com" target="_blank">Meta Developers</a></li>
            <li>Klik "Create App" dan pilih "Business"</li>
            <li>Isi nama app dan pilih use case</li>
          </ol>
          
          <h4>Langkah 2: Setup Facebook Login</h4>
          <ol>
            <li>Tambahkan produk "Facebook Login" ke app</li>
            <li>Set platform ke Web</li>
            <li>Masukkan URL callback: <code>https://merry-dashboard.vercel.app/api/auth/callback/facebook</code></li>
          </ol>
          
          <h4>Langkah 3: Dapatkan Access Token</h4>
          <ol>
            <li>Gunakan <a href="https://developers.facebook.com/tools/explorer" target="_blank">Graph API Explorer</a></li>
            <li>Pilih app yang sudah dibuat</li>
            <li>Generate token dengan permissions:
              <ul>
                <li>ads_management</li>
                <li>ads_read</li>
                <li>business_management</li>
                <li>pages_read_engagement</li>
                <li>instagram_basic</li>
              </ul>
            </li>
            <li>Salin token dan masukkan ke Settings</li>
          </ol>
          
          <h4>Langkah 4: Input ke Settings</h4>
          <ol>
            <li>Buka menu Settings</li>
            <li>Cari bagian "Meta Graph API Token" (paling bawah)</li>
            <li>Tempelkan Meta Access Token</li>
            <li>Klik Save</li>
          </ol>
        `
      },
      {
        title: "X (Twitter) API - TIDAK PAKAI COMPOSIO",
        description: "Integrasi X/Twitter TIDAK melalui Composio - butuh API key langsung",
        content: `
          <h3>Setup X (Twitter) API</h3>
          <p><strong>PERHATIAN:</strong> X/Twitter API <u>TIDAK</u> tersedia di Composio. Kamu butuh langsung API key dari Twitter Developer Portal.</p>
          
          <h4>Langkah 1: Buat Developer Account</h4>
          <ol>
            <li>Buka <a href="https://developer.twitter.com" target="_blank">developer.twitter.com</a></li>
            <li>Daftar sebagai developer (akan di-review oleh Twitter)</li>
            <li>Tunggu approval (biasanya 1-2 hari untuk basic, bisa lebih lama)</li>
          </ol>
          
          <h4>Langkah 2: Buat Project & App</h4>
          <ol>
            <li>Login ke <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank">Developer Portal</a></li>
            <li>Buat project baru</li>
            <li>Pilih app type (Embedded App untuk web)</li>
            <li>Dapatkan <strong>API Key</strong> dan <strong>API Secret</strong></li>
          </ol>
          
          <h4>Langkah 3: Input ke Settings</h4>
          <ol>
            <li>Buka menu Settings</li>
            <li><strong>HAPUS bagian "X (Twitter) Consumer API"</strong> - itu salah label, yang needed adalah Consumer API Key untuk Zernio</li>
            <li>Masukkan X Consumer API Key (dari Twitter Developer Portal)</li>
            <li>Klik Save</li>
          </ol>
          
          <h4>Yang BENAR di Composio vs Manual:</h4>
          <table border="1" cellpadding="5">
            <tr><th>Platform</th><th>Cara</th></tr>
            <tr><td>Instagram</td><td>✅ Composio</td></tr>
            <tr><td>Facebook</td><td>✅ Composio</td></tr>
            <tr><td>YouTube</td><td>✅ Composio</td></tr>
            <tr><td>Google Drive</td><td>✅ Composio</td></tr>
            <tr><td>Meta Ads</td><td>✅ Composio</td></tr>
            <tr><td>TikTok</td><td>❌ Zernio API</td></tr>
            <tr><td>X / Twitter</td><td>❌ Manual API Key (bukan Composio)</td></tr>
          </table>
          
          <h4>Catatan:</h4>
          <ul>
            <li>X API memiliki <strong>rate limits sangat ketat</strong></li>
            <li>Free tier sangat terbatas</li>
            <li>Disarankan untuk production use</li>
          </ul>
        `
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
        content: `
          <h3>Sistem Autentikasi</h3>
          <p>Merry Dashboard menggunakan Google OAuth untuk autentikasi.</p>
          
          <h4>Keuntungan Google OAuth:</h4>
          <ul>
            <li><strong>Secure</strong> - Tidak perlu mengingat password tambahan</li>
            <li><strong>2FA Support</strong> - Mendukung Two-Factor Authentication</li>
            <li><strong>Convenient</strong> - Login dengan satu klik</li>
          </ul>
          
          <h4>Per User Data:</h4>
          <ul>
            <li>Setiap user punya <strong>API keys sendiri</strong></li>
            <li>Data tidak di-share antar user</li>
            <li>Login sebagai member berbeda akan melihat data berbeda</li>
          </ul>
        `
      },
      {
        title: "API Key Storage",
        description: "Cara menyimpan dan mengelola API keys dengan aman",
        content: `
          <h3>Keamanan API Keys</h3>
          <p>Semua API keys dienkripsi dan disimpan dengan aman di database.</p>
          
          <h4>Fitur Keamanan:</h4>
          <ul>
            <li><strong>Encryption</strong> - Semua keys dienkripsi</li>
            <li><strong>Per-User</strong> - Setiap user punya keys sendiri</li>
            <li><strong>Access Control</strong> - Hanya owner yang bisa akses</li>
          </ul>
          
          <h4>Best Practices:</h4>
          <ul>
            <li>Jangan pernah share API keys</li>
            <li>Rotate keys secara berkala</li>
            <li>Hapus keys yang tidak digunakan</li>
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
                    <div
                      key={itemId}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={"w-2 h-2 rounded-full " + (isExpanded ? "bg-blue-500" : "bg-slate-300")} />
                          <div>
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <svg 
                          className={"w-5 h-5 text-slate-400 transition-transform " + (isExpanded ? "rotate-180" : "")} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                          <div 
                            className="prose prose-sm dark:prose-invert max-w-none pt-4 [&_a]:text-blue-600 [&_a]:underline [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-medium [&_h5]:text-sm [&_h5]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1" 
                            dangerouslySetInnerHTML={{ __html: item.content }} 
                          />
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