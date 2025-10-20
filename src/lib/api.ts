const API_BASE_URL = 'https://alitinvoiceappapi.azurewebsites.net/api';

// Auth token management
export const getAuthToken = () => localStorage.getItem('authToken');
export const setAuthToken = (token: string) => localStorage.setItem('authToken', token);
export const removeAuthToken = () => localStorage.removeItem('authToken');

// User & Company data
export const getUserData = () => {
  const data = localStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
};
export const setUserData = (data: any) => localStorage.setItem('userData', JSON.stringify(data));

export const getCompanyData = () => {
  const data = localStorage.getItem('companyData');
  return data ? JSON.parse(data) : null;
};
export const setCompanyData = (data: any) => localStorage.setItem('companyData', JSON.stringify(data));

export const clearAuthData = () => {
  removeAuthToken();
  localStorage.removeItem('userData');
  localStorage.removeItem('companyData');
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Add auth header if token exists and not login/signup
  if (token && !endpoint.includes('/Auth/Login') && !endpoint.includes('/Auth/Signup')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add Content-Type for JSON requests
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API Error: ${response.status}`);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Auth API
export const authAPI = {
  signup: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/Auth/Signup`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    return response.json();
  },

  login: async (email: string, password: string, rememberMe: boolean = false) => {
    return apiRequest('/Auth/Login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
  },

  getCompanyLogoUrl: async (companyId: number) => {
    const response = await fetch(`${API_BASE_URL}/Auth/GetCompanyLogoUrl/${companyId}`);
    return response.text();
  },

  getCompanyLogoThumbnailUrl: async (companyId: number) => {
    const response = await fetch(`${API_BASE_URL}/Auth/GetCompanyLogoThumbnailUrl/${companyId}`);
    return response.text();
  },
};

// Item API
export const itemAPI = {
  getList: () => apiRequest('/Item/GetList', { method: 'GET' }),
  
  getById: (id: number) => apiRequest(`/Item/${id}`, { method: 'GET' }),
  
  getLookupList: () => apiRequest('/Item/GetLookupList', { method: 'GET' }),
  
  create: (item: {
    itemName: string;
    description: string | null;
    salesRate: number;
    discountPct: number;
  }) => apiRequest('/Item', {
    method: 'POST',
    body: JSON.stringify(item),
  }),
  
  update: (item: {
    updatedOn: string | null;
    itemID: number;
    itemName: string;
    description: string | null;
    salesRate: number;
    discountPct: number;
  }) => apiRequest('/Item', {
    method: 'PUT',
    body: JSON.stringify(item),
  }),
  
  delete: (id: number) => apiRequest(`/Item/${id}`, { method: 'DELETE' }),
  
  getPictureUrl: async (itemId: number) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Item/Picture/${itemId}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!response.ok) return null;
    return response.text();
  },
  
  getPictureThumbnailUrl: async (itemId: number) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/Item/PictureThumbnail/${itemId}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!response.ok) return null;
    return response.text();
  },
  
  updatePicture: async (itemId: number, file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('ItemID', itemId.toString());
    formData.append('File', file);
    
    const response = await fetch(`${API_BASE_URL}/Item/UpdateItemPicture`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
  },
  
  checkDuplicateName: async (itemName: string, excludeId?: number) => {
    const params = new URLSearchParams({ ItemName: itemName });
    if (excludeId) params.append('ExcludeID', excludeId.toString());
    
    const response = await fetch(
      `${API_BASE_URL}/Item/CheckDuplicateItemName?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    );
    
    if (response.status === 409) return true; // Duplicate exists
    if (response.ok) return false; // No duplicate
    throw new Error('Failed to check duplicate');
  },
};

// Invoice API
export const invoiceAPI = {
  getById: (id: number) => apiRequest(`/Invoice/${id}`, { method: 'GET' }),
  
  getList: (params?: {
    invoiceID?: number;
    fromDate?: string;
    toDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.invoiceID) queryParams.append('InvoiceID', params.invoiceID.toString());
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    
    const query = queryParams.toString();
    return apiRequest(`/Invoice/GetList${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  
  create: (invoice: {
    invoiceNo: number;
    invoiceDate: string;
    customerName: string;
    address: string | null;
    city: string | null;
    taxPercentage: number;
    notes: string | null;
    lines: Array<{
      rowNo: number;
      itemID: number;
      description: string;
      quantity: number;
      rate: number;
      discountPct: number;
    }>;
  }) => apiRequest('/Invoice/', {
    method: 'POST',
    body: JSON.stringify(invoice),
  }),
  
  update: (invoice: {
    updatedOn: string | null;
    invoiceID: number;
    invoiceNo: number;
    invoiceDate: string;
    customerName: string;
    address: string | null;
    city: string | null;
    taxPercentage: number;
    notes: string | null;
    lines: Array<{
      rowNo: number;
      itemID: number;
      description: string;
      quantity: number;
      rate: number;
      discountPct: number;
    }>;
  }) => apiRequest('/Invoice/', {
    method: 'PUT',
    body: JSON.stringify(invoice),
  }),
  
  delete: (id: number) => apiRequest(`/Invoice/${id}`, { method: 'DELETE' }),
  
  getSummary: (params?: {
    fromDate?: string;
    toDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    
    const query = queryParams.toString();
    return apiRequest(`/Invoice/GetSummary${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  
  getTrend12m: (asOf?: string) => {
    const query = asOf ? `?asOf=${asOf}` : '';
    return apiRequest(`/Invoice/GetTrend12m${query}`, { method: 'GET' });
  },
};
