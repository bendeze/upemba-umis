import { Site, Region } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/v1/sites` : 'http://localhost:8001/api/v1/sites';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('umis_access_token');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
}

export const locationsApi = {
  getSites: async () => {
    const res = await fetchWithAuth(`${API_BASE}/`);
    return (Array.isArray(res) ? res : (res.results || [])) as Site[];
  },
  createSite: (data: Partial<Site>) => fetchWithAuth(`${API_BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }) as Promise<Site>,
};
