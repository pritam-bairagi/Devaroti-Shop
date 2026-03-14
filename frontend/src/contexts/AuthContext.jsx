import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = '/api/auth';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/me`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Fetch user error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      if (response.data.success) {
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  };

  const verify = async (verifyData) => {
    try {
      const response = await axios.post(`${API_URL}/verify`, verifyData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        toast.success('Email verified successfully!');
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      throw error;
    }
  };

  const resendOTP = async (data) => {
    try {
      const response = await axios.post(`${API_URL}/resend-otp`, data);
      if (response.data.success) {
        toast.success('New OTP sent to your email');
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        setUser(response.data.user);
        toast.success('Login successful!');
        return response.data;
      }
    } catch (error) {
      if (error.response?.data?.requiresVerification) {
        return {
          requiresVerification: true,
          userId: error.response.data.userId
        };
      }
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, { email });
      if (response.data.success) {
        toast.success('Password reset link sent to your email');
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
      throw error;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await axios.put(`${API_URL}/reset-password/${token}`, { password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        toast.success('Password reset successful!');
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      throw error;
    }
  };

  const changePassword = async (data) => {
    try {
      const response = await axios.put(`${API_URL}/change-password`, data);
      if (response.data.success) {
        toast.success('Password changed successfully');
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const value = {
    user,
    setUser,
    loading,
    error,
    register,
    verify,
    resendOTP,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser,
    fetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};