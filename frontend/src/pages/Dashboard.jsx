import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Package,
  ShoppingBag,
  Heart,
  LogOut,
  Settings,
  Clock,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Save,
  X,
  TrendingUp,
  Award
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from './Footer';
import { useAuth } from '../contexts/useAuth';
import { userAPI, orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    wishlistCount: 0
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    location: user?.location || ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        userAPI.getProfile(),
        orderAPI.getMyOrders({ limit: 5 })
      ]);

      if (profileRes.data.success) {
        setUser(profileRes.data.user);
        setStats(profileRes.data.stats || {});
      }

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await userAPI.updateProfile(formData);
      if (response.data.success) {
        setUser({ ...user, ...response.data.user });
        setEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="text-primary" size={32} />
                </div>
                <h3 className="font-bold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                  {user?.role}
                </span>
              </div>

              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={18} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all mt-4"
                >
                  <LogOut size={18} />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <ShoppingBag className="text-primary" size={24} />
                      <span className="text-2xl font-black text-gray-900">
                        {stats.totalOrders}
                      </span>
                    </div>
                    <p className="text-gray-600">Total Orders</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="text-green-500" size={24} />
                      <span className="text-2xl font-black text-gray-900">
                        ৳{stats.totalSpent}
                      </span>
                    </div>
                    <p className="text-gray-600">Total Spent</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="text-yellow-500" size={24} />
                      <span className="text-2xl font-black text-gray-900">
                        {stats.pendingOrders}
                      </span>
                    </div>
                    <p className="text-gray-600">Pending Orders</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="text-purple-500" size={24} />
                      <span className="text-2xl font-black text-gray-900">
                        {stats.deliveredOrders}
                      </span>
                    </div>
                    <p className="text-gray-600">Delivered Orders</p>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Recent Orders
                  </h3>
                  
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="mx-auto text-gray-300 mb-3" size={40} />
                      <p className="text-gray-500">No orders yet</p>
                      <Link
                        to="/shop"
                        className="inline-block mt-4 text-primary hover:underline"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map(order => (
                        <Link
                          key={order._id}
                          to={`/orders/${order._id}`}
                          className="block p-4 border border-gray-100 rounded-xl hover:border-primary/20 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm text-gray-500">
                              #{order.orderNumber}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                {order.items.length} items
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="font-bold text-primary">
                              ৳{order.totalPrice}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Order History
                </h3>
                
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 mb-4">No orders found</p>
                    <Link
                      to="/shop"
                      className="inline-block bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition"
                    >
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div
                        key={order._id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-500">Order Number</p>
                            <p className="font-mono font-medium">#{order.orderNumber}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-sm font-medium">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Items</p>
                            <p className="text-sm font-medium">{order.items.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Payment</p>
                            <p className="text-sm font-medium">{order.paymentMethod}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-sm font-bold text-primary">৳{order.totalPrice}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Link
                            to={`/orders/${order._id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'wishlist' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  My Wishlist
                </h3>
                
                {!user?.favorites || user.favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                    <Link
                      to="/shop"
                      className="inline-block bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition"
                    >
                      Explore Products
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.favorites.map(product => (
                      <div
                        key={product._id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-32 object-contain mb-3"
                        />
                        <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">
                          {product.name}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            ৳{product.sellingPrice}
                          </span>
                          <Link
                            to={`/product/${product._id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Profile Settings
                  </h3>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Edit2 size={16} />
                      Edit Profile
                    </button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleUpdateProfile}
                        className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            name: user?.name || '',
                            email: user?.email || '',
                            phoneNumber: user?.phoneNumber || '',
                            address: user?.address || '',
                            location: user?.location || ''
                          });
                        }}
                        className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="text-gray-400 shrink-0 mt-1" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium text-gray-900">{user?.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Mail className="text-gray-400 shrink-0 mt-1" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Phone className="text-gray-400 shrink-0 mt-1" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{user?.phoneNumber || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="text-gray-400 shrink-0 mt-1" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium text-gray-900">{user?.address || 'Not set'}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Member Since</p>
                      <p className="font-medium text-gray-900">
                        {new Date(user?.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;