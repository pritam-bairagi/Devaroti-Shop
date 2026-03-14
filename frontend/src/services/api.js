import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh-token', {
            refreshToken,
          });
          
          if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return API(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    }

    if (error.response?.status === 404) {
      toast.error('Resource not found');
    }

    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

// API service functions
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  verify: (data) => API.post('/auth/verify', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => API.put(`/auth/reset-password/${token}`, { password }),
  changePassword: (data) => API.put('/auth/change-password', data),
  getProfile: () => API.get('/auth/me'),
};

export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (data) => API.put('/users/profile', data),
  addToCart: (data) => API.post('/users/cart', data),
  updateCart: (productId, data) => API.put(`/users/cart/${productId}`, data),
  removeFromCart: (productId) => API.delete(`/users/cart/${productId}`),
  clearCart: () => API.delete('/users/cart'),
  toggleFavorite: (productId) => API.post(`/users/favorites/${productId}`),
  getFavorites: () => API.get('/users/favorites'),
  deleteAccount: () => API.delete('/users/account'),
};

export const productAPI = {
  getProducts: (params) => API.get('/products', { params }),
  getProduct: (id) => API.get(`/products/${id}`),
  getCategories: () => API.get('/products/categories/all'),
  getFeatured: () => API.get('/products/featured'),
  createProduct: (data) => API.post('/products', data),
  updateProduct: (id, data) => API.put(`/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/products/${id}`),
  updateStock: (id, data) => API.put(`/products/${id}/stock`, data),
};

export const orderAPI = {
  createOrder: (data) => API.post('/orders', data),
  getMyOrders: (params) => API.get('/orders/my-orders', { params }),
  getOrder: (id) => API.get(`/orders/${id}`),
  cancelOrder: (id, reason) => API.put(`/orders/${id}/cancel`, { reason }),
  trackOrder: (orderNumber) => API.get(`/orders/track/${orderNumber}`),
};

export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getAnalytics: (params) => API.get('/admin/analytics', { params }),
  getUsers: (params) => API.get('/admin/users', { params }),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  approveSeller: (id) => API.put(`/admin/approve-seller/${id}`),
  getOrders: (params) => API.get('/admin/orders', { params }),
  updateOrder: (id, data) => API.put(`/admin/orders/${id}`, data),
  getProducts: (params) => API.get('/admin/products', { params }),
  getTransactions: (params) => API.get('/admin/transactions', { params }),
  createTransaction: (data) => API.post('/admin/transactions', data),
};

export const sellerAPI = {
  getStats: () => API.get('/seller/stats'),
  getProducts: (params) => API.get('/seller/products', { params }),
  createProduct: (data) => API.post('/seller/products', data),
  updateProduct: (id, data) => API.put(`/seller/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/seller/products/${id}`),
  getOrders: (params) => API.get('/seller/orders', { params }),
  updateOrder: (id, data) => API.put(`/seller/orders/${id}`, data),
  getEarnings: (params) => API.get('/seller/earnings', { params }),
  requestWithdrawal: (data) => API.post('/seller/withdraw', data),
  getSales: (params) => API.get('/seller/sales', { params }),
  createSale: (data) => API.post('/seller/sales', data),
  getPurchases: (params) => API.get('/seller/purchases', { params }),
  createPurchase: (data) => API.post('/seller/purchases', data),
  getTransactions: (params) => API.get('/seller/transactions', { params }),
  createTransaction: (data) => API.post('/seller/transactions', data),
  getCustomers: () => API.get('/seller/customers'),
};

export default API;