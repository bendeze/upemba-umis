import { Consultation } from "../types";

export const consultationsApi = {
  getConsultations: async (search?: string): Promise<Consultation[]> => {
    let url = '/v1/consultations/consultations/';
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    
    // Uses the global fetch wrapper from the existing api.ts logic (assuming it's available or we can just use raw fetch)
    const token = localStorage.getItem('umis_access_token');
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
    const response = await fetch(API_BASE + url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch consultations');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || []);
  },

  createConsultation: async (data: any): Promise<Consultation> => {
    const token = localStorage.getItem('umis_access_token');
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
    const response = await fetch(API_BASE + '/v1/consultations/consultations/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
    }
    return response.json();
  },

  updateConsultation: async (id: string, data: any): Promise<Consultation> => {
    const token = localStorage.getItem('umis_access_token');
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
    const response = await fetch(`${API_BASE}/v1/consultations/consultations/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
    }
    return response.json();
  }
};
