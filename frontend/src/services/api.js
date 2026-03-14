import axios from 'axios';
import toast from 'react-hot-toast';

// Get the API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Log the API URL for debugging
console.log('🌐 API Base URL:', API_URL);

// Create axios instance
const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    // Log the request
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    
    // Add token to headers
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    // Log the response
    console.log(`📥 ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    // Log the error
    console.error('❌ Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Get error message
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.response) {
      // Server responded with error status
      if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response.status === 400) {
        errorMessage = 'Bad request. Please check your input.';
      } else if (error.response.status === 401) {
        errorMessage = 'Please login to continue.';
        
        // Handle token expiration
        const originalRequest = error.config;
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          
          // Clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          
          // Don't redirect if already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      } else if (error.response.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error.response.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      // Request was made but no response
      errorMessage = 'Network error. Please check your connection.';
    }

    // Show error toast (except for 401 on login page)
    if (!(error.response?.status === 401 && window.location.pathname.includes('/login'))) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  register: (data) => API.post('/api/auth/register', data),
  verify: (data) => API.post('/api/auth/verify', data),
  resendOTP: (data) => API.post('/api/auth/resend-otp', data),
  login: (data) => API.post('/api/auth/login', data),
  logout: () => API.post('/api/auth/logout'),
  forgotPassword: (email) => API.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => API.put(`/api/auth/reset-password/${token}`, { password }),
  changePassword: (data) => API.put('/api/auth/change-password', data),
  getProfile: () => API.get('/api/auth/me'),
  checkAuth: () => API.get('/api/auth/check'),
  refreshToken: (refreshToken) => API.post('/api/auth/refresh-token', { refreshToken }),
};

// ==================== USER API ====================
export const userAPI = {
  // Profile
  getProfile: () => API.get('/api/users/profile'),
  updateProfile: (data) => API.put('/api/users/profile', data),
  deleteAccount: () => API.delete('/api/users/account'),
  
  // Cart
  getCart: () => API.get('/api/users/cart'),
  addToCart: (data) => API.post('/api/users/cart', data),
  updateCartItem: (productId, data) => API.put(`/api/users/cart/${productId}`, data),
  removeFromCart: (productId) => API.delete(`/api/users/cart/${productId}`),
  clearCart: () => API.delete('/api/users/cart'),
  
  // Favorites
  getFavorites: () => API.get('/api/users/favorites'),
  toggleFavorite: (productId) => API.post(`/api/users/favorites/${productId}`),
  
  // Address
  addAddress: (data) => API.post('/api/users/address', data),
};

// ==================== PRODUCT API ====================
export const productAPI = {
  // Public
  getProducts: (params) => API.get('/api/products', { params }),
  getProduct: (id) => API.get(`/api/products/${id}`),
  getCategories: () => API.get('/api/products/categories/all'),
  getFeatured: () => API.get('/api/products/featured'),
  
  // Protected (Admin/Seller)
  createProduct: (data) => API.post('/api/products', data),
  updateProduct: (id, data) => API.put(`/api/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/api/products/${id}`),
  updateStock: (id, data) => API.put(`/api/products/${id}/stock`, data),
  
  // Seller products
  getSellerProducts: (params) => API.get('/api/products/seller', { params }),
  
  // Admin only
  bulkImport: (data) => API.post('/api/products/bulk', data),
};

// ==================== ORDER API ====================
export const orderAPI = {
  // User
  createOrder: (data) => API.post('/api/orders', data),
  getMyOrders: (params) => API.get('/api/orders/my-orders', { params }),
  getOrder: (id) => API.get(`/api/orders/${id}`),
  cancelOrder: (id, reason) => API.put(`/api/orders/${id}/cancel`, { reason }),
  
  // Public
  trackOrder: (orderNumber) => API.get(`/api/orders/track/${orderNumber}`),
  
  // Seller
  getSellerOrders: (params) => API.get('/api/orders/seller', { params }),
  updateOrderStatus: (id, data) => API.put(`/api/orders/${id}/status`, data),
};

// ==================== ADMIN API ====================
export const adminAPI = {
  // Dashboard
  getStats: () => API.get('/api/admin/stats'),
  getAnalytics: (params) => API.get('/api/admin/analytics', { params }),
  
  // Users
  getUsers: (params) => API.get('/api/admin/users', { params }),
  updateUser: (id, data) => API.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => API.delete(`/api/admin/users/${id}`),
  approveSeller: (id) => API.put(`/api/admin/approve-seller/${id}`),
  
  // Orders
  getOrders: (params) => API.get('/api/admin/orders', { params }),
  updateOrder: (id, data) => API.put(`/api/admin/orders/${id}`, data),
  
  // Products
  getProducts: (params) => API.get('/api/admin/products', { params }),
  
  // Transactions
  getTransactions: (params) => API.get('/api/admin/transactions', { params }),
  createTransaction: (data) => API.post('/api/admin/transactions', data),
  
  // Sales
  getSales: () => API.get('/api/admin/sales'),
  createSale: (data) => API.post('/api/admin/sales', data),
  
  // Purchases
  getPurchases: () => API.get('/api/admin/purchases'),
  createPurchase: (data) => API.post('/api/admin/purchases', data),
  
  // Logs
  getSystemLogs: (params) => API.get('/api/admin/logs', { params }),
};

// ==================== SELLER API ====================
export const sellerAPI = {
  // Dashboard
  getStats: () => API.get('/api/seller/stats'),
  getProfile: () => API.get('/api/seller/profile'),
  getEarnings: (params) => API.get('/api/seller/earnings', { params }),
  
  // Products
  getProducts: (params) => API.get('/api/seller/products', { params }),
  createProduct: (data) => API.post('/api/seller/products', data),
  updateProduct: (id, data) => API.put(`/api/seller/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/api/seller/products/${id}`),
  
  // Orders
  getOrders: (params) => API.get('/api/seller/orders', { params }),
  updateOrder: (id, data) => API.put(`/api/seller/orders/${id}`, data),
  
  // Customers
  getCustomers: () => API.get('/api/seller/customers'),
  
  // Withdrawals
  requestWithdrawal: (data) => API.post('/api/seller/withdraw', data),
  
  // Sales
  getSales: () => API.get('/api/seller/sales'),
  createSale: (data) => API.post('/api/seller/sales', data),
  
  // Purchases
  getPurchases: () => API.get('/api/seller/purchases'),
  createPurchase: (data) => API.post('/api/seller/purchases', data),
  
  // Transactions
  getTransactions: () => API.get('/api/seller/transactions'),
  createTransaction: (data) => API.post('/api/seller/transactions', data),
};

// ==================== EXPORT DEFAULT ====================
export default API;