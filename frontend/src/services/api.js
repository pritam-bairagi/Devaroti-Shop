// services/api.js - Complete Fixed Version
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('🌐 API Base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// ==================== INTERCEPTORS ====================
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.status} ${response.config.url}`, response.data);
    }
    
    if (response.config.method !== 'get') {
      if (response.data?.message) {
        toast.success(response.data.message);
      }
    }
    
    return response;
  },
  async (error) => {
    if (import.meta.env.DEV) {
      console.error('❌ Response Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    let errorMessage = 'An error occurred. Please try again.';
    const isAuthPage = window.location.pathname.includes('/login') || 
                       window.location.pathname.includes('/register');
    
    if (error.response) {
      if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      switch (error.response.status) {
        case 400:
          errorMessage = errorMessage || 'Bad request. Please check your input.';
          break;
          
        case 401:
          if (error.config.url?.includes('/login')) {
            errorMessage = 'Invalid email or password';
          } else {
            errorMessage = 'Session expired. Please login again.';
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            if (!isAuthPage) {
              window.location.href = '/login';
            }
          }
          break;
          
        case 403:
          errorMessage = errorMessage || 'You do not have permission to perform this action.';
          break;
          
        case 404:
          errorMessage = errorMessage || 'Resource not found.';
          break;
          
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
          
        case 500:
          errorMessage = errorMessage || 'Server error. Please try again later.';
          break;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
    }

    if (!(error.response?.status === 401 && isAuthPage)) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  verify: (data) => api.post('/api/auth/verify', data),
  resendOTP: (data) => api.post('/api/auth/resend-otp', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/api/auth/reset-password/${token}`, { password }),
  changePassword: (data) => api.put('/api/auth/change-password', data),
  getProfile: () => api.get('/api/auth/me'),
  checkAuth: () => api.get('/api/auth/check'),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh-token', { refreshToken }),
};

// ==================== USER API ====================
export const userAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
  deleteAccount: () => api.delete('/api/users/account'),
  
  uploadProfileImage: (formData) => api.post('/api/users/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  getLevelInfo: () => api.get('/api/users/level'),
  
  getCart: () => api.get('/api/users/cart'),
  addToCart: (data) => api.post('/api/users/cart', data),
  updateCartItem: (productId, data) => api.put(`/api/users/cart/${productId}`, data),
  removeFromCart: (productId) => api.delete(`/api/users/cart/${productId}`),
  clearCart: () => api.delete('/api/users/cart'),
  
  getWishlist: () => api.get('/api/users/wishlist'),
  addToWishlist: (productId) => api.post(`/api/users/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/api/users/wishlist/${productId}`),
  toggleFavorite: (productId) => api.post(`/api/users/favorites/${productId}`),
  getFavorites: () => api.get('/api/users/favorites'),
  
  getAddresses: () => api.get('/api/users/addresses'),
  addAddress: (addressData) => api.post('/api/users/addresses', addressData),
  updateAddress: (addressId, addressData) => api.put(`/api/users/addresses/${addressId}`, addressData),
  deleteAddress: (addressId) => api.delete(`/api/users/addresses/${addressId}`),
  setDefaultAddress: (addressId) => api.patch(`/api/users/addresses/${addressId}/default`),
};

// ==================== PRODUCT API ====================
export const productAPI = {
  getProducts: (params) => api.get('/api/products', { params }),
  getProduct: (id) => api.get(`/api/products/${id}`),
  getCategories: () => api.get('/api/products/categories/all'),
  getFeatured: () => api.get('/api/products/featured'),
  
  createProduct: (data) => api.post('/api/products', data),
  updateProduct: (id, data) => api.put(`/api/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/products/${id}`),
  updateStock: (id, data) => api.put(`/api/products/${id}/stock`, data),
  
  getSellerProducts: (params) => api.get('/api/products/seller', { params }),
  
  bulkImport: (data) => api.post('/api/products/bulk', data),
};

// ==================== ORDER API ====================
export const orderAPI = {
  createOrder: (orderData) => api.post('/api/orders', orderData),
  getMyOrders: (params = {}) => api.get('/api/orders/my-orders', { params }),
  getOrder: (orderId) => api.get(`/api/orders/${orderId}`),
  cancelOrder: (orderId, reason) => api.put(`/api/orders/${orderId}/cancel`, { reason }),
  
  trackOrder: (orderNumber) => api.get(`/api/orders/track/${orderNumber}`),
  
  getSellerOrders: (params) => api.get('/api/orders/seller', { params }),
  updateOrderStatus: (id, data) => api.put(`/api/orders/${id}/status`, data),
};

// ==================== ADMIN API ====================
export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getAnalytics: (params) => api.get('/api/admin/analytics', { params }),
  
  getUsers: (params) => api.get('/api/admin/users', { params }),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  approveSeller: (id) => api.put(`/api/admin/approve-seller/${id}`),
  
  getOrders: (params) => api.get('/api/admin/orders', { params }),
  updateOrder: (id, data) => api.put(`/api/admin/orders/${id}`, data),
  
  getProducts: (params) => api.get('/api/admin/products', { params }),
  
  getTransactions: (params) => api.get('/api/admin/transactions', { params }),
  createTransaction: (data) => api.post('/api/admin/transactions', data),
  
  getSales: (params) => api.get('/api/admin/sales', { params }),
  createSale: (data) => api.post('/api/admin/sales', data),
  
  getPurchases: (params) => api.get('/api/admin/purchases', { params }),
  createPurchase: (data) => api.post('/api/admin/purchases', data),
  
  getSystemLogs: (params) => api.get('/api/admin/logs', { params }),
};

// ==================== SELLER API ====================
export const sellerAPI = {
  getStats: () => api.get('/api/seller/stats'),
  getProfile: () => api.get('/api/seller/profile'),
  getEarnings: (params) => api.get('/api/seller/earnings', { params }),
  
  getProducts: (params) => api.get('/api/seller/products', { params }),
  createProduct: (data) => api.post('/api/seller/products', data),
  updateProduct: (id, data) => api.put(`/api/seller/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/seller/products/${id}`),
  
  getOrders: (params) => api.get('/api/seller/orders', { params }),
  updateOrder: (id, data) => api.put(`/api/seller/orders/${id}`, data),
  
  getCustomers: (params) => api.get('/api/seller/customers', { params }),
  
  requestWithdrawal: (data) => api.post('/api/seller/withdraw', data),
  
  getSales: (params) => api.get('/api/seller/sales', { params }),
  createSale: (data) => api.post('/api/seller/sales', data),
  
  getPurchases: (params) => api.get('/api/seller/purchases', { params }),
  createPurchase: (data) => api.post('/api/seller/purchases', data),
  
  getTransactions: (params) => api.get('/api/seller/transactions', { params }),
  createTransaction: (data) => api.post('/api/seller/transactions', data),
};

export default api;