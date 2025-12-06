// API service for communicating with the backend
// Use dynamic base URL to support network access
function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:5001/api';
  }
  
  // For localtunnel, use the same hostname but with port 5001
  if (window.location.hostname.includes('loca.lt')) {
    // For localtunnel, we need to construct the backend URL
    // Assuming the backend is exposed on a similar subdomain
    const parts = window.location.hostname.split('.');
    if (parts.length >= 3) {
      // Replace the subdomain with the backend subdomain
      // This is a simplified approach - in practice, you might need to adjust this
      return `https://clean-bears-make.loca.lt/api`;
    }
    return 'https://clean-bears-make.loca.lt/api';
  }
  
    // For ngrok, use the proxy route to avoid CORS issues
  if (window.location.hostname.includes('ngrok')) {
    // Use the Next.js API proxy route
    return `/api/proxy`;
  }
  
  // For local development, use the same hostname but with port 5001
  return `${window.location.protocol}//${window.location.hostname}:5001/api`;
}

const API_BASE_URL = getApiBaseUrl();

// Generic fetch function with error handling
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  let url = `${API_BASE_URL}${endpoint}`;
  let config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // If using proxy (ngrok), pass the endpoint as a query parameter
  if (API_BASE_URL === '/api/proxy') {
    url = `${API_BASE_URL}?endpoint=${encodeURIComponent(endpoint)}`;
    
    // For POST requests, we need to move the body to the proxy request body
    // and set the Authorization header in the proxy request
    config = {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };
  } else {
    // For direct API calls, set the Authorization header normally
    config = {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
      } catch (parseError) {
        // If parsing fails, use the raw text
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Client API functions
export const clientAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/clients${query}`);
  },
  getById: (id: string) => fetchAPI(`/clients/${id}`),
  create: (data: any) => fetchAPI('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/clients/${id}`, {
    method: 'DELETE',
  }),
};

// Sale API functions
export const saleAPI = {
  getAll: (params?: { farmId?: string, clientId?: string }) => {
    const queryParams = [];
    if (params?.farmId) queryParams.push(`farmId=${params.farmId}`);
    if (params?.clientId) queryParams.push(`clientId=${params.clientId}`);
    const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return fetchAPI(`/sales${query}`);
  },
  getById: (id: string) => fetchAPI(`/sales/${id}`),
  create: (data: any) => fetchAPI('/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/sales/${id}`, {
    method: 'DELETE',
  }),
};

// Payment API functions
export const paymentAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/payments${query}`);
  },
  getById: (id: string) => fetchAPI(`/payments/${id}`),
  create: (data: any) => fetchAPI('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/payments/${id}`, {
    method: 'DELETE',
  }),
};

// Expense API functions
export const expenseAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/expenses${query}`);
  },
  getById: (id: string) => fetchAPI(`/expenses/${id}`),
  create: (data: any) => fetchAPI('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/expenses/${id}`, {
    method: 'DELETE',
  }),
};

// Batch API functions
export const batchAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/batches${query}`);
  },
  getById: (id: string) => fetchAPI(`/batches/${id}`),
  create: (data: any) => fetchAPI('/batches', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/batches/${id}`, {
    method: 'DELETE',
  }),
};

// Vaccine API functions
export const vaccineAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/vaccines${query}`);
  },
  getById: (id: string) => fetchAPI(`/vaccines/${id}`),
  create: (data: any) => fetchAPI('/vaccines', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/vaccines/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/vaccines/${id}`, {
    method: 'DELETE',
  }),
  markAsDone: (id: string, data: any) => fetchAPI(`/vaccines/${id}/done`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Screenshot API functions
export const screenshotAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/screenshots${query}`);
  },
  upload: (formData: FormData) => fetchAPI('/screenshots/upload', {
    method: 'POST',
    body: formData,
    headers: {}, // Remove Content-Type to let browser set it with boundary
  }),
  update: (id: string, data: any) => fetchAPI(`/screenshots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/screenshots/${id}`, {
    method: 'DELETE',
  }),
};

// Dashboard API functions
export const dashboardAPI = {
  getStats: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/dashboard${query}`);
  },
};

// Mortality API functions
export const mortalityAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/mortalities${query}`);
  },
  getByBatch: (batchId: string) => fetchAPI(`/mortalities/batch/${batchId}`),
  getStats: (batchId: string) => fetchAPI(`/mortalities/stats/${batchId}`),
  getAlerts: (threshold: number, farmId?: string) => {
    const params = new URLSearchParams();
    params.append('threshold', threshold.toString());
    if (farmId) params.append('farmId', farmId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/mortalities/alerts${query}`);
  },
  create: (data: any) => fetchAPI('/mortalities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/mortalities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/mortalities/${id}`, {
    method: 'DELETE',
  }),
};

// Feed Consumption API functions
export const feedConsumptionAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/feed-consumptions${query}`);
  },
  getByBatch: (batchId: string) => fetchAPI(`/feed-consumptions/batch/${batchId}`),
  getStats: (batchId: string) => fetchAPI(`/feed-consumptions/stats/${batchId}`),
  getAlerts: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/feed-consumptions/alerts${query}`);
  },
  create: (data: any) => fetchAPI('/feed-consumptions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/feed-consumptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/feed-consumptions/${id}`, {
    method: 'DELETE',
  }),
};

// Weight Tracking API functions
export const weightTrackingAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/weight-trackings${query}`);
  },
  getByBatch: (batchId: string) => fetchAPI(`/weight-trackings/batch/${batchId}`),
  getStats: (batchId: string) => fetchAPI(`/weight-trackings/stats/${batchId}`),
  getAlerts: (threshold?: number, farmId?: string) => {
    const params = new URLSearchParams();
    if (threshold) params.append('threshold', threshold.toString());
    if (farmId) params.append('farmId', farmId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/weight-trackings/alerts${query}`);
  },
  create: (data: any) => fetchAPI('/weight-trackings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/weight-trackings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/weight-trackings/${id}`, {
    method: 'DELETE',
  }),
};

// Medicine API functions
export const medicineAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/medicines${query}`);
  },
  getByBatch: (batchId: string) => fetchAPI(`/medicines/batch/${batchId}`),
  getExpiryAlerts: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/medicines/alerts/expiry${query}`);
  },
  getWithdrawalReminders: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/medicines/alerts/withdrawal${query}`);
  },
  create: (data: any) => fetchAPI('/medicines', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/medicines/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/medicines/${id}`, {
    method: 'DELETE',
  }),
};

// Market Rate API functions
export const marketRateAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/market-rates${query}`);
  },
  getByDate: (date: string) => fetchAPI(`/market-rates/date/${date}`),
  getCurrent: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/market-rates/current${query}`);
  },
  getTrend: (days?: number, farmId?: string) => {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    if (farmId) params.append('farmId', farmId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/market-rates/trend${query}`);
  },
  getAlerts: (threshold?: number) => fetchAPI(`/market-rates/alerts${threshold ? `?threshold=${threshold}` : ''}`),
  create: (data: any) => fetchAPI('/market-rates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/market-rates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/market-rates/${id}`, {
    method: 'DELETE',
  }),
};

// Inventory API functions
export const inventoryAPI = {
  getAll: (itemType?: string, farmId?: string) => {
    const params = new URLSearchParams();
    if (itemType) params.append('itemType', itemType);
    if (farmId) params.append('farmId', farmId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/inventories${query}`);
  },
  getById: (id: string) => fetchAPI(`/inventories/${id}`),
  getSummary: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/inventories/summary${query}`);
  },
  getLowStockAlerts: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/inventories/alerts/low-stock${query}`);
  },
  getExpiryAlerts: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/inventories/alerts/expiry${query}`);
  },
  create: (data: any) => fetchAPI('/inventories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/inventories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/inventories/${id}`, {
    method: 'DELETE',
  }),
  useItem: (id: string, data: any) => fetchAPI(`/inventories/${id}/use`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Waste/Fertilizer API functions
export const wasteFertilizerAPI = {
  getAll: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/waste-fertilizers${query}`);
  },
  getByBatch: (batchId: string) => fetchAPI(`/waste-fertilizers/batch/${batchId}`),
  getStats: (farmId?: string) => {
    const query = farmId ? `?farmId=${farmId}` : '';
    return fetchAPI(`/waste-fertilizers/stats${query}`);
  },
  create: (data: any) => fetchAPI('/waste-fertilizers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/waste-fertilizers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/waste-fertilizers/${id}`, {
    method: 'DELETE',
  }),
};

// User API functions
export const userAPI = {
  getAll: () => fetchAPI('/users'),
  getById: (id: string) => fetchAPI(`/users/${id}`),
  create: (data: any) => fetchAPI('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/users/${id}`, {
    method: 'DELETE',
  }),
  changePassword: (id: string, data: any) => fetchAPI(`/users/${id}/change-password`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// WhatsApp API functions
export const whatsappAPI = {
  sendTestMessage: (data: any) => fetchAPI('/whatsapp/send-test', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  sendInvoice: (data: any) => fetchAPI('/whatsapp/send-invoice', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  sendPaymentReminder: (data: any) => fetchAPI('/whatsapp/send-reminder', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getTemplates: () => fetchAPI('/whatsapp/templates'),
};

// Voice Command API functions
export const voiceAPI = {
  processCommand: (data: any) => fetchAPI('/voice/process', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  startListening: () => fetchAPI('/voice/start', {
    method: 'POST',
  }),
  stopListening: () => fetchAPI('/voice/stop', {
    method: 'POST',
  }),
  getStatus: () => fetchAPI('/voice/status'),
  getCommands: () => fetchAPI('/voice/commands'),
};

// Farm API functions
export const farmAPI = {
  getAll: () => fetchAPI('/farms'),
  getById: (id: string) => fetchAPI(`/farms/${id}`),
  getActive: () => fetchAPI('/farms/active'),
  create: (data: any) => fetchAPI('/farms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/farms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/farms/${id}`, {
    method: 'DELETE',
  }),
};

// Report API functions
export const reportAPI = {
  getTypes: () => fetchAPI('/reports/types'),
  generate: (data: any) => fetchAPI('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  download: (filename: string) => fetchAPI(`/reports/download/${filename}`),
};