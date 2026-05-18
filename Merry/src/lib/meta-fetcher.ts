// Stub - meta-fetcher functionality moved to api routes
// This file exists to satisfy imports but actual logic is in metaads routes

export const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' },
  { id: 'act_2061230484461298', currency: 'IDR', name: 'kontenval.id' }
]

let _metaToken: string | null = null

export function setMetaToken(token: string | null) {
  _metaToken = token
}

export async function fetchAllData() {
  return { campaigns: [], summary: { totalSpend: 0, totalCampaigns: 0, avgCPC: 0 } }
}