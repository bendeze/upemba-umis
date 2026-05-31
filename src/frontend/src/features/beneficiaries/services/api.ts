import { 
  Region, 
  Site, 
  Employee, 
  Dependent, 
  AuditLog, 
  ImportReport 
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

// Simple helper to fetch the stored JWT token
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('umis_access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Global API Request handler
async function apiRequest<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  body: any = null,
  isMultipart = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  
  if (!isMultipart && body) {
    headers['Content-Type'] = 'application/json';
  }
  
  const config: RequestInit = {
    method,
    headers,
  };
  
  if (body) {
    config.body = isMultipart ? body : JSON.stringify(body);
  }
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    let errorDetail = 'An error occurred while connecting to the server.';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      errorDetail = `HTTP error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}

export const api = {
  // Authentication
  async login(username: string, password: string): Promise<{ access: string; refresh: string }> {
    const data = await apiRequest<{ access: string; refresh: string }>('/token/', 'POST', { username, password });
    localStorage.setItem('umis_access_token', data.access);
    localStorage.setItem('umis_refresh_token', data.refresh);
    return data;
  },

  logout() {
    localStorage.removeItem('umis_access_token');
    localStorage.removeItem('umis_refresh_token');
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('umis_access_token');
  },

  // Regions
  getRegions(): Promise<Region[]> {
    return apiRequest<Region[]>('/v1/regions/');
  },
  
  createRegion(name: string): Promise<Region> {
    return apiRequest<Region>('/v1/regions/', 'POST', { name });
  },

  // Sites
  getSites(regionId?: string): Promise<Site[]> {
    const query = regionId ? `?region=${regionId}` : '';
    return apiRequest<Site[]>(`/v1/sites/${query}`);
  },

  // Employees
  async getEmployees(params: {
    page?: number;
    search?: string;
    regionId?: string;
    siteId?: string;
    status?: string;
  }): Promise<{ count: number; next: string | null; previous: string | null; results: Employee[] }> {
    const queryParts: string[] = [];
    if (params.page) queryParts.push(`page=${params.page}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.regionId) queryParts.push(`site__region=${params.regionId}`);
    if (params.siteId) queryParts.push(`site=${params.siteId}`);
    if (params.status) queryParts.push(`employment_status=${params.status}`);
    
    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return apiRequest<{ count: number; next: string | null; previous: string | null; results: Employee[] }>(
      `/v1/employees/${query}`
    );
  },

  getEmployee(id: string): Promise<Employee> {
    return apiRequest<Employee>(`/v1/employees/${id}/`);
  },

  createEmployee(employee: {
    employee_number: string;
    last_name: string;
    post_name?: string;
    first_name: string;
    site: string;
    address?: string;
    employment_status: string;
  }): Promise<Employee> {
    return apiRequest<Employee>('/v1/employees/', 'POST', employee);
  },

  updateEmployee(id: string, employee: Partial<{
    employee_number: string;
    last_name: string;
    post_name?: string;
    first_name: string;
    site: string;
    address?: string;
    employment_status: string;
  }>): Promise<Employee> {
    return apiRequest<Employee>(`/v1/employees/${id}/`, 'PUT', employee);
  },

  deleteEmployee(id: string): Promise<void> {
    return apiRequest<void>(`/v1/employees/${id}/`, 'DELETE');
  },

  // Dependents
  addDependent(employeeId: string, dependent: {
    full_name: string;
    gender: 'M' | 'F';
    relationship: 'SPOUSE' | 'CHILD';
    birth_date?: string;
  }): Promise<Dependent> {
    return apiRequest<Dependent>(`/v1/employees/${employeeId}/dependents/`, 'POST', dependent);
  },

  updateDependent(id: string, dependent: Partial<{
    full_name: string;
    gender: 'M' | 'F';
    relationship: 'SPOUSE' | 'CHILD';
    birth_date?: string;
  }>): Promise<Dependent> {
    return apiRequest<Dependent>(`/v1/dependents/${id}/`, 'PUT', dependent);
  },

  deleteDependent(id: string): Promise<void> {
    return apiRequest<void>(`/v1/dependents/${id}/`, 'DELETE');
  },

  // Excel Import
  importExcel(file: File): Promise<ImportReport> {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<ImportReport>('/v1/beneficiaries/import/', 'POST', formData, true);
  },

  // Audit Logs
  getAuditLogs(params: { entityType?: string; entityId?: string }): Promise<AuditLog[]> {
    const queryParts: string[] = [];
    if (params.entityType) queryParts.push(`entity_type=${params.entityType}`);
    if (params.entityId) queryParts.push(`entity_id=${params.entityId}`);
    
    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return apiRequest<AuditLog[]>(`/v1/audit-logs/${query}`);
  }
};
