import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Package, ShoppingCart, LayoutDashboard, Banknote,
  ShoppingBag, FileText, Download, BarChart3, TrendingUp, TrendingDown,
  Filter, Calendar, Eye, Check, AlertCircle, Clock, CreditCard,
  X, Plus, Edit, Trash2, Search, RefreshCw, ArrowUpRight,
  FileSpreadsheet, Printer, Store, Activity, Warehouse,
  CloudUpload, CheckCircle2, XCircle, Loader2, Ticket, History, Copy
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import { adminAPI, productAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#ff5500', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const PRIMARY = '#ff5500';

// ============================================================
// UTILITY COMPONENTS
// ============================================================
const StatCard = ({ title, value, icon: Icon, trend, color = PRIMARY, subtitle, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-orange-500/40 transition-all"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-lg`} style={{ backgroundColor: color + '20' }}>
        <Icon size={20} style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium flex items-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    {loading ? (
      <div className="h-8 bg-slate-700 rounded animate-pulse mb-1" />
    ) : (
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
    )}
    <p className="text-sm text-slate-400">{title}</p>
    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
  </motion.div>
);

const Badge = ({ status }) => {
  const map = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    processing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    shipped: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    live: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-red-500/20 text-red-400 border-red-500/30',
    seller: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    user: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.user}`}>
      {status}
    </span>
  );
};

const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className={`relative bg-slate-800 border border-slate-700 rounded-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto z-10`}
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
              <X size={18} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
    <input
      {...props}
      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500
        focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
    <select
      {...props}
      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm
        focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
    >
      {children}
    </select>
  </div>
);

const Btn = ({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    success: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30',
    ghost: 'hover:bg-slate-700 text-slate-400 hover:text-white',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <button {...props} disabled={loading || props.disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
};

// ============================================================
// MAIN ADMIN DASHBOARD
// ============================================================
const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("30d");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [modals, setModals] = useState({
    orderDetail: false, editOrder: false,
    addProduct: false, editProduct: false,
    addTransaction: false, addSale: false, addPurchase: false,
    editUser: false, backup: false, exportModal: false
  });
  const [selectedItem, setSelectedItem] = useState(null);

  // Forms
  const [orderForm, setOrderForm] = useState({ status: '', paymentStatus: '', trackingNumber: '', courier: '', adminNotes: '' });
  const [productForm, setProductForm] = useState({ name: '', sellingPrice: '', purchasePrice: '', description: '', category: 'General', image: '', stock: 0, unit: 'পিস', liveStatus: 'live', brand: '', sku: '' });
  const [transactionForm, setTransactionForm] = useState({ type: 'Cash In', amount: '', description: '', category: 'sales', paymentMethod: 'Cash' });
  const [saleForm, setSaleForm] = useState({ product: '', quantity: 1, totalAmount: 0, paymentMethod: 'Cash', description: '', customerName: '', customerPhone: '' });
  const [purchaseForm, setPurchaseForm] = useState({ product: '', quantity: 1, totalAmount: 0, description: '', supplier: '' });
  const [userForm, setUserForm] = useState({ role: 'user', isActive: true, isSellerApproved: false });
  const [backupState, setBackupState] = useState({ loading: false, token: '' });
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '', discountType: 'percentage', discountValue: 0,
    minPurchase: 0, maxDiscount: 0, endDate: '', usageLimit: 0, isActive: true
  });

  const openModal = (name, item = null) => {
    setSelectedItem(item);
    if (item && name === 'editOrder') {
      setOrderForm({ status: item.status, paymentStatus: item.paymentStatus, trackingNumber: item.trackingNumber || '', courier: item.courier || '', adminNotes: item.adminNotes || '' });
    }
    if (item && name === 'editUser') setUserForm({ role: item.role, isActive: item.isActive, isSellerApproved: item.isSellerApproved });
    if (item && name === 'editProduct') setProductForm({ ...item });
    setModals(p => ({ ...p, [name]: true }));
  };
  const closeModal = (name) => setModals(p => ({ ...p, [name]: false }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [adminAPI.getStats({ period: dateRange }).catch(() => ({ data: { stats: {} } }))];

      if (['overview', 'users'].includes(activeTab)) calls.push(adminAPI.getUsers({ limit: 100 }).catch(() => ({ data: { users: [] } })));
      if (['overview', 'inventory'].includes(activeTab)) calls.push(adminAPI.getProducts({ limit: 200 }).catch(() => ({ data: { products: [] } })));
      if (['overview', 'orders'].includes(activeTab)) calls.push(adminAPI.getOrders({ limit: 100, status: filterStatus || undefined }).catch(() => ({ data: { orders: [] } })));
      if (['cashbox', 'overview'].includes(activeTab)) calls.push(adminAPI.getTransactions({ limit: 100 }).catch(() => ({ data: { transactions: [] } })));
      if (activeTab === 'sales') calls.push(adminAPI.getSales({ limit: 100 }).catch(() => ({ data: { sales: [] } })));
      if (activeTab === 'purchases') calls.push(adminAPI.getPurchases({ limit: 100 }).catch(() => ({ data: { purchases: [] } })));
      if (activeTab === 'analytics') calls.push(adminAPI.getAnalytics({ period: dateRange }).catch(() => ({ data: { analytics: {} } })));
      if (activeTab === 'inventory') calls.push(adminAPI.getInventory().catch(() => ({ data: { products: [] } })));
      if (['withdrawals', 'payouts'].includes(activeTab)) calls.push(adminAPI.getWithdrawals({ status: 'all', limit: 100 }).catch(() => ({ data: { withdrawals: [] } })));
      if (activeTab === 'coupons') calls.push(adminAPI.getCoupons().catch(() => ({ data: { coupons: [] } })));
      if (activeTab === 'settings' || activeTab === 'overview') calls.push(adminAPI.getConfig().catch(() => ({ data: { configs: {} } })));

      const results = await Promise.all(calls);
      if (results[0]?.data?.stats) setStats(results[0].data.stats);
      results.forEach(r => {
        if (r?.data?.users) setUsers(r.data.users);
        if (r?.data?.products) setProducts(r.data.products);
        if (r?.data?.orders) setOrders(r.data.orders);
        if (r?.data?.transactions) setTransactions(r.data.transactions);
        if (r?.data?.sales) setSales(r.data.sales);
        if (r?.data?.purchases) setPurchases(r.data.purchases);
        if (r?.data?.analytics) setAnalytics(r.data.analytics);
        if (r?.data?.withdrawals) setWithdrawals(r.data.withdrawals);
        if (r?.data?.configs) setConfigs(r.data.configs);
        if (r?.data?.coupons) setCoupons(r.data.coupons);
      });
    } catch (err) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---- Export Utilities ----
  const exportToExcel = (data, fileName) => {
    if (!data?.length) return toast.error('No data to export');
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel exported!');
    } catch { toast.error('Export failed'); }
  };

  const exportToPDF = (data, fileName, title, columns) => {
    if (!data?.length) return toast.error('No data to export');
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.setTextColor(255, 85, 0);
      doc.setFontSize(16);
      doc.text(title, 14, 18);
      doc.setTextColor(100);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()} | Devaroti Shop`, 14, 26);
      doc.autoTable({
        head: [columns.map(c => c.header)],
        body: data.map(row => columns.map(c => c.accessor(row) || '-')),
        startY: 32,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [255, 85, 0], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF exported!');
    } catch { toast.error('PDF export failed'); }
  };

  // ---- Handlers ----
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateOrder(selectedItem._id, orderForm);
      toast.success('Order updated');
      closeModal('editOrder');
      fetchData();
    } catch { toast.error('Failed to update order'); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createTransaction(transactionForm);
      toast.success('Transaction added');
      closeModal('addTransaction');
      setTransactionForm({ type: 'Cash In', amount: '', description: '', category: 'sales', paymentMethod: 'Cash' });
      fetchData();
    } catch { toast.error('Failed to add transaction'); }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = { ...productForm, price: productForm.sellingPrice };
      if (selectedItem?._id) {
        await adminAPI.updateProduct(selectedItem._id, data);
        toast.success('Product updated');
        closeModal('editProduct');
      } else {
        await adminAPI.createProduct(data);
        toast.success('Product added');
        closeModal('addProduct');
      }
      setProductForm({ name: '', sellingPrice: '', purchasePrice: '', description: '', category: 'General', image: '', stock: 0, unit: 'পিস', liveStatus: 'live', brand: '', sku: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save product'); }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Permanently delete this product?')) return;
    try {
      await adminAPI.deleteProduct(id);
      toast.success('Product deleted');
      fetchData();
    } catch { toast.error('Failed to delete product'); }
  };


  const handleAddSale = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createSale(saleForm);
      toast.success('Sale recorded');
      closeModal('addSale');
      setSaleForm({ product: '', quantity: 1, totalAmount: 0, paymentMethod: 'Cash', description: '', customerName: '', customerPhone: '' });
      fetchData();
    } catch { toast.error('Failed to record sale'); }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createPurchase(purchaseForm);
      toast.success('Purchase recorded');
      closeModal('addPurchase');
      setPurchaseForm({ product: '', quantity: 1, totalAmount: 0, description: '', supplier: '' });
      fetchData();
    } catch { toast.error('Failed to record purchase'); }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateUser(selectedItem._id, userForm);
      toast.success('User updated');
      closeModal('editUser');
      fetchData();
    } catch { toast.error('Failed to update user'); }
  };

  const handleApproveSeller = async (id, approved) => {
    try {
      await adminAPI.approveSeller(id, { approved });
      toast.success(approved ? 'Seller approved!' : 'Seller rejected');
      fetchData();
    } catch { toast.error('Failed to update seller'); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deactivated');
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const handleGoogleDriveBackup = async () => {
    if (!backupState.token) {
      // Get auth URL
      try {
        const res = await adminAPI.googleDriveAuth();
        window.open(res.data.authUrl, '_blank', 'width=500,height=600');
        toast('Complete Google authorization in the new window, then paste your access token below', { icon: '🔗' });
      } catch {
        toast.error('Google Drive auth failed. Check GOOGLE_CLIENT_ID in .env');
      }
      return;
    }
    setBackupState(p => ({ ...p, loading: true }));
    try {
      const res = await adminAPI.backupToGoogleDrive({ accessToken: backupState.token, backupType: 'all' });
      toast.success(`✅ Backup uploaded: ${res.data.fileName}`);
      closeModal('backup');
    } catch {
      toast.error('Backup failed');
    } finally {
      setBackupState(p => ({ ...p, loading: false }));
    }
  };

  const handleUpdateWithdrawal = async (id, status) => {
    try {
      const backendStatus = status === 'approved' ? 'completed' : 'failed';
      await adminAPI.updateWithdrawal(id, { status: backendStatus });
      toast.success(`Withdrawal ${status}`);
      fetchData();
    } catch { toast.error('Failed to update withdrawal'); }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await adminAPI.deleteCoupon(id);
      toast.success('Coupon deleted');
      fetchData();
    } catch { toast.error('Failed to delete coupon'); }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingCoupon) {
        await adminAPI.updateCoupon(editingCoupon._id, couponForm);
        toast.success('Coupon updated successfully');
      } else {
        await adminAPI.createCoupon(couponForm);
        toast.success('Coupon created successfully');
      }
      setShowCouponModal(false);
      setEditingCoupon(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    try {
      // Specifically send the bkash_number key
      await adminAPI.updateConfig({ 
        key: 'bkash_number', 
        value: configs.bkash_number 
      });
      toast.success('Configuration updated');
      fetchData();
    } catch { toast.error('Failed to update configuration'); }
  };

  const handleUpdateSpecificConfig = async (key, value) => {
    try {
      await adminAPI.updateConfig({ key, value });
      toast.success(`${key.replace('_', ' ')} updated`);
      fetchData();
    } catch { toast.error(`Failed to update ${key}`); }
  };

  // ---- Filter helpers ----
  const filteredOrders = orders.filter(o => !searchQuery || o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || o.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredUsers = users.filter(u => !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProducts = products.filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const fmt = (n) => `৳${(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;

  // ---- Cash Box ----
  const cashIn = transactions.filter(t => t.type === 'Cash In').reduce((s, t) => s + t.amount, 0);
  const cashOut = transactions.filter(t => t.type === 'Cash Out').reduce((s, t) => s + t.amount, 0);
  const cashBalance = cashIn - cashOut;

  // ============================================================
  // TABS CONFIG
  // ============================================================
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'cashbox', label: 'Cash Box', icon: Banknote },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'purchases', label: 'Purchases', icon: Package },
    { id: 'withdrawals', label: 'Withdrawal Req', icon: CreditCard },
    { id: 'payouts', label: 'Payout History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Store size={18} />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">Devaroti Shop</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Btn size="sm" variant="secondary" onClick={() => openModal('backup')}>
              <CloudUpload size={14} /> Drive Backup
            </Btn>
            <Btn size="sm" variant="secondary" onClick={fetchData} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </Btn>
            {configs.bkash_number && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase font-bold leading-none italic">Payment Help</span>
                  <span className="text-xs font-mono text-orange-400 font-bold leading-tight">{configs.bkash_number}</span>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(configs.bkash_number);
                    toast.success('Number copied!');
                  }}
                  className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
                  title="Copy Primary Number"
                >
                  <Copy size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 pb-0">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-6">

        {/* ==================== OVERVIEW ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard title="Total Users" value={stats.totalUsers || 0} icon={Users} color="#0ea5e9" loading={loading} />
              <StatCard title="Total Products" value={stats.totalProducts || 0} icon={Package} color="#10b981" loading={loading} />
              <StatCard title="Total Orders" value={stats.totalOrders || 0} icon={ShoppingCart} color={PRIMARY} loading={loading} />
              <StatCard title="Total Sales" value={fmt(stats.totalSales)} icon={ShoppingBag} color="#f59e0b" loading={loading} />
              <StatCard title="Platform Revenue" value={fmt(stats.totalRevenue)} icon={TrendingUp} color="#8b5cf6" loading={loading} />
              <StatCard title="Pending Orders" value={stats.pendingOrders || 0} icon={Clock} color="#ef4444" loading={loading} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Sales Chart */}
              <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Monthly Sales</h3>
                  <Btn size="sm" variant="ghost" onClick={() => exportToExcel(stats.monthlySales || [], 'monthly_sales')}>
                    <FileSpreadsheet size={13} /> Excel
                  </Btn>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={stats.monthlySales || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#f1f5f9' }} formatter={v => [`৳${v?.toLocaleString()}`, '']} />
                    <Legend />
                    <Bar dataKey="total" fill={PRIMARY} name="Sales (৳)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="orders" stroke="#0ea5e9" strokeWidth={2} name="Orders" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Category Pie */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-4">Category Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={(stats.categoryStats || []).slice(0, 6)} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {(stats.categoryStats || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Orders & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Recent Orders</h3>
                  <Btn size="sm" variant="ghost" onClick={() => setActiveTab('orders')}><ArrowUpRight size={13} /> View All</Btn>
                </div>
                <div className="space-y-2">
                  {(stats.recentOrders || []).slice(0, 6).map(order => (
                    <div key={order._id} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                      <div>
                        <p className="text-sm font-medium text-white">{order.orderNumber}</p>
                        <p className="text-xs text-slate-400">{order.user?.name} • {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-400">{fmt(order.totalPrice)}</p>
                        <Badge status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">⚠️ Low Stock Alert</h3>
                  <Btn size="sm" variant="ghost" onClick={() => setActiveTab('inventory')}><ArrowUpRight size={13} /> Inventory</Btn>
                </div>
                <div className="space-y-2">
                  {(stats.lowStockProducts || []).slice(0, 6).map(p => (
                    <div key={p._id} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                      <div className="flex items-center gap-2">
                        {p.image && <img src={p.image} className="w-8 h-8 rounded object-cover" />}
                        <div>
                          <p className="text-sm text-white">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.user?.shopName}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${p.stock === 0 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {p.stock === 0 ? 'Out of Stock' : `Stock: ${p.stock}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ORDERS ==================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">Order Management</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search orders..."
                    className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 w-56 focus:outline-none focus:border-orange-500" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500">
                  <option value="">All Status</option>
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Btn size="sm" variant="secondary" onClick={() => exportToExcel(filteredOrders.map(o => ({ OrderNo: o.orderNumber, Customer: o.user?.name, Total: o.totalPrice, Status: o.status, Payment: o.paymentStatus, Date: new Date(o.createdAt).toLocaleDateString() })), 'orders')}>
                  <FileSpreadsheet size={13} /> Excel
                </Btn>
                <Btn size="sm" variant="secondary" onClick={() => exportToPDF(filteredOrders, 'orders', 'Orders Report', [
                  { header: 'Order #', accessor: r => r.orderNumber },
                  { header: 'Customer', accessor: r => r.user?.name },
                  { header: 'Total', accessor: r => `৳${r.totalPrice}` },
                  { header: 'Status', accessor: r => r.status },
                  { header: 'Date', accessor: r => new Date(r.createdAt).toLocaleDateString() }
                ])}>
                  <Printer size={13} /> PDF
                </Btn>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['Order #', 'Customer', 'Items', 'Total', 'Seller', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      {Array(8).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-700 rounded animate-pulse" /></td>)}
                    </tr>
                  )) : filteredOrders.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No orders found</td></tr>
                  ) : filteredOrders.map(order => (
                    <tr key={order._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-orange-400">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="text-white">{order.user?.name}</p>
                        <p className="text-xs text-slate-400">{order.user?.phoneNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{order.items?.length} item(s)</td>
                      <td className="px-4 py-3 font-semibold text-white">{fmt(order.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          {order.items?.map((item, idx) => (
                            <span key={idx} className="text-xs text-slate-400">
                              {item.product?.user?.shopName || item.product?.brand || 'N/A'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge status={order.paymentStatus} /></td>
                      <td className="px-4 py-3"><Badge status={order.status} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Btn size="sm" variant="ghost" onClick={() => openModal('orderDetail', order)}><Eye size={13} /></Btn>
                          <Btn size="sm" variant="ghost" onClick={() => openModal('editOrder', order)}><Edit size={13} /></Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== INVENTORY ==================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">Inventory Management</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..."
                    className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 w-56 focus:outline-none focus:border-orange-500" />
                </div>
                <Btn size="sm" variant="secondary" onClick={() => exportToExcel(filteredProducts.map(p => ({ Name: p.name, Category: p.category, Stock: p.stock, SellPrice: p.sellingPrice, BuyPrice: p.purchasePrice, Status: p.liveStatus })), 'inventory')}>
                  <FileSpreadsheet size={13} /> Excel
                </Btn>
                <Btn size="sm" onClick={() => openModal('addProduct')}>
                  <Plus size={13} /> Add Product
                </Btn>
              </div>
            </div>

            {/* Inventory Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard title="Total Products" value={products.length} icon={Package} color="#0ea5e9" />
              <StatCard title="Low Stock" value={products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length} icon={AlertCircle} color="#f59e0b" />
              <StatCard title="Out of Stock" value={products.filter(p => p.stock === 0).length} icon={XCircle} color="#ef4444" />
              <StatCard title="Total Stock Value" value={fmt(products.reduce((s, p) => s + (p.purchasePrice * p.stock), 0))} icon={Banknote} color="#10b981" />
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['Product', 'Category', 'Stock', 'Buy Price', 'Sell Price', 'Status', 'Seller', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      {Array(8).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-700 rounded animate-pulse" /></td>)}
                    </tr>
                  )) : filteredProducts.map(p => (
                    <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image && <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />}
                          <div>
                            <p className="text-white font-medium text-sm">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.sku || 'No SKU'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{p.category}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${p.stock === 0 ? 'text-red-400' : p.stock <= 5 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                          {p.stock}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">{p.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{fmt(p.purchasePrice)}</td>
                      <td className="px-4 py-3 text-white font-medium">{fmt(p.sellingPrice)}</td>
                      <td className="px-4 py-3"><Badge status={p.liveStatus} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{p.user?.shopName || p.user?.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Btn size="sm" variant="ghost" onClick={() => openModal('editProduct', p)}><Edit size={13} /></Btn>
                          <Btn size="sm" variant="danger" onClick={() => handleDeleteProduct(p._id)}><Trash2 size={13} /></Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ==================== COUPONS ==================== */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Coupon Management</h2>
              <Btn onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', discountType: 'percentage', discountValue: 0, minPurchase: 0, maxDiscount: 0, endDate: '', usageLimit: 0, isActive: true }); setShowCouponModal(true); }}>
                <Plus size={16} /> Create Coupon
              </Btn>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Discount</th>
                    <th className="px-4 py-3 text-left">Min. Buy</th>
                    <th className="px-4 py-3 text-left">Limit</th>
                    <th className="px-4 py-3 text-left">Expiry</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No coupons found</td></tr>
                  ) : coupons.map(coupon => (
                    <tr key={coupon._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-bold text-orange-400">{coupon.code}</td>
                      <td className="px-4 py-3 font-medium">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}
                      </td>
                      <td className="px-4 py-3 text-slate-400">৳{coupon.minPurchase}</td>
                      <td className="px-4 py-3">
                        <span className="text-white">{coupon.usedCount}</span>
                        <span className="text-slate-500"> / {coupon.usageLimit || '∞'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{new Date(coupon.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Badge status={coupon.isActive && new Date() < new Date(coupon.endDate) ? 'active' : 'expired'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Btn size="sm" variant="ghost" onClick={() => { setEditingCoupon(coupon); setCouponForm(coupon); setShowCouponModal(true); }}><Eye size={13} /></Btn>
                          <Btn size="sm" variant="ghost" onClick={() => { setEditingCoupon(coupon); setCouponForm(coupon); setShowCouponModal(true); }}><Edit size={13} /></Btn>
                          <Btn size="sm" variant="danger" onClick={() => handleDeleteCoupon(coupon._id)}><Trash2 size={13} /></Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== USERS ==================== */}
        {activeTab === 'payouts' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Seller Payout History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                    <th className="px-6 py-4 text-left">Seller</th>
                    <th className="px-6 py-4 text-left">Method</th>
                    <th className="px-6 py-4 text-left">Date Paid</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.filter(w => w.status === 'completed' || w.status === 'failed').map(w => (
                    <tr key={w._id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{w.metadata?.sellerName || w.user?.name}</div>
                        <div className="text-xs text-slate-500">{w.metadata?.accountName || w.user?.shopName}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div>{w.paymentMethod}</div>
                        <div className="text-xs text-slate-500">{w.metadata?.accountNumber || w.paymentDetails}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{new Date(w.updatedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-400">{fmt(w.amount)}</td>
                      <td className="px-6 py-4 text-center text-xs text-slate-500">{w._id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">User Management</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users..."
                    className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 w-56 focus:outline-none focus:border-orange-500" />
                </div>
                <Btn size="sm" variant="secondary" onClick={() => exportToExcel(filteredUsers.map(u => ({ Name: u.name, Email: u.email, Phone: u.phoneNumber, Role: u.role, Active: u.isActive, Joined: new Date(u.createdAt).toLocaleDateString() })), 'users')}>
                  <FileSpreadsheet size={13} /> Excel
                </Btn>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['User', 'Phone', 'Role', 'Status', 'Verified', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={u.profilePic} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="text-white font-medium">{u.name}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{u.phoneNumber}</td>
                      <td className="px-4 py-3"><Badge status={u.role} /></td>
                      <td className="px-4 py-3"><Badge status={u.isActive ? 'active' : 'inactive'} /></td>
                      <td className="px-4 py-3">
                        {u.isVerified ? <CheckCircle2 size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Btn size="sm" variant="ghost" onClick={() => openModal('editUser', u)}><Edit size={13} /></Btn>
                          {u.role === 'seller' && !u.isSellerApproved && (
                            <Btn size="sm" variant="success" onClick={() => handleApproveSeller(u._id, true)}><Check size={13} /> Approve</Btn>
                          )}
                          <Btn size="sm" variant="danger" onClick={() => handleDeleteUser(u._id)}><Trash2 size={13} /></Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== CASH BOX ==================== */}
        {activeTab === 'cashbox' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">Cash Box</h2>
              <div className="flex items-center gap-2">
                <Btn size="sm" variant="secondary" onClick={() => exportToExcel(transactions.map(t => ({ Type: t.type, Amount: t.amount, Description: t.description, Method: t.paymentMethod, Status: t.status, Date: new Date(t.date).toLocaleDateString() })), 'transactions')}>
                  <FileSpreadsheet size={13} /> Excel
                </Btn>
                <Btn size="sm" onClick={() => openModal('addTransaction')}>
                  <Plus size={13} /> Add Transaction
                </Btn>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Cash In" value={fmt(cashIn)} icon={TrendingUp} color="#10b981" />
              <StatCard title="Total Cash Out" value={fmt(cashOut)} icon={TrendingDown} color="#ef4444" />
              <StatCard title="Net Balance" value={fmt(cashBalance)} icon={Banknote} color={cashBalance >= 0 ? '#10b981' : '#ef4444'} />
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4">Transaction Flow</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={transactions.slice(-30).map(t => ({ date: new Date(t.date).toLocaleDateString(), amount: t.type === 'Cash In' ? t.amount : -t.amount }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={v => [`৳${Math.abs(v).toLocaleString()}`, '']} />
                  <Area type="monotone" dataKey="amount" stroke={PRIMARY} fill={PRIMARY + '30'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['Type', 'Amount', 'Description', 'Method', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${t.type === 'Cash In' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type}</span>
                      </td>
                      <td className={`px-4 py-3 font-bold ${t.type === 'Cash In' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'Cash In' ? '+' : '-'}{fmt(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{t.description}</td>
                      <td className="px-4 py-3 text-slate-400">{t.paymentMethod}</td>
                      <td className="px-4 py-3"><Badge status={t.status} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(t.date || t.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== SALES ==================== */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">Sales Management</h2>
              <div className="flex items-center gap-2">
                <Btn size="sm" variant="secondary" onClick={() => exportToExcel(sales.map(s => ({ Product: s.product?.name, Qty: s.quantity, Amount: s.totalAmount, Profit: s.profit, Method: s.paymentMethod, Date: new Date(s.saleDate).toLocaleDateString() })), 'sales')}>
                  <FileSpreadsheet size={13} /> Excel
                </Btn>
                <Btn size="sm" onClick={() => openModal('addSale')}>
                  <Plus size={13} /> Record Sale
                </Btn>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard title="Total Sales" value={sales.length} icon={ShoppingBag} color={PRIMARY} />
              <StatCard title="Revenue" value={fmt(sales.reduce((s, t) => s + t.totalAmount, 0))} icon={TrendingUp} color="#10b981" />
              <StatCard title="Total Profit" value={fmt(sales.reduce((s, t) => s + (t.profit || 0), 0))} icon={Activity} color="#8b5cf6" />
              <StatCard title="Avg Sale" value={fmt(sales.length ? sales.reduce((s, t) => s + t.totalAmount, 0) / sales.length : 0)} icon={BarChart3} color="#f59e0b" />
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['Sale #', 'Product', 'Qty', 'Amount', 'Profit', 'Method', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-orange-400 font-medium">{s.saleNumber}</td>
                      <td className="px-4 py-3 text-white">{s.product?.name}</td>
                      <td className="px-4 py-3 text-slate-300">{s.quantity}</td>
                      <td className="px-4 py-3 font-semibold text-white">{fmt(s.totalAmount)}</td>
                      <td className={`px-4 py-3 font-medium ${s.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(s.profit)}</td>
                      <td className="px-4 py-3 text-slate-400">{s.paymentMethod}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(s.saleDate || s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== PURCHASES ==================== */}
        {activeTab === 'purchases' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">Purchase Management</h2>
              <div className="flex items-center gap-2">
                <Btn size="sm" variant="secondary" onClick={() => exportToExcel(purchases.map(p => ({ Product: p.product?.name, Qty: p.quantity, Amount: p.totalAmount, Supplier: p.supplier?.name, Status: p.paymentStatus, Date: new Date(p.purchaseDate).toLocaleDateString() })), 'purchases')}>
                  <FileSpreadsheet size={13} /> Excel
                </Btn>
                <Btn size="sm" onClick={() => openModal('addPurchase')}>
                  <Plus size={13} /> Add Purchase
                </Btn>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard title="Total Purchases" value={purchases.length} icon={Package} color={PRIMARY} />
              <StatCard title="Total Cost" value={fmt(purchases.reduce((s, p) => s + p.totalAmount, 0))} icon={Banknote} color="#f59e0b" />
              <StatCard title="Pending Payment" value={fmt(purchases.filter(p => p.paymentStatus !== 'paid').reduce((s, p) => s + (p.dueAmount || 0), 0))} icon={Clock} color="#ef4444" />
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['Purchase #', 'Product', 'Qty', 'Amount', 'Supplier', 'Payment', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-orange-400 font-medium">{p.purchaseNumber}</td>
                      <td className="px-4 py-3 text-white">{p.product?.name}</td>
                      <td className="px-4 py-3 text-slate-300">{p.quantity}</td>
                      <td className="px-4 py-3 font-semibold text-white">{fmt(p.totalAmount)}</td>
                      <td className="px-4 py-3 text-slate-300">{p.supplier?.name || '-'}</td>
                      <td className="px-4 py-3"><Badge status={p.paymentStatus} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(p.purchaseDate || p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== ANALYTICS ==================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Analytics & Reports</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Daily Revenue</h3>
                  <Btn size="sm" variant="secondary" onClick={() => exportToExcel(analytics.dailySales || [], 'daily_revenue')}>
                    <Download size={13} /> Export
                  </Btn>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={analytics.dailySales || []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={v => [`৳${(v || 0).toLocaleString()}`, '']} />
                    <Area type="monotone" dataKey="revenue" stroke={PRIMARY} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-4">Payment Methods</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={analytics.paymentMethods || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {(analytics.paymentMethods || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-4">User Growth</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                    <Line type="monotone" dataKey="users" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9' }} name="New Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-4">Revenue by Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(analytics.categoryRevenue || []).slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={v => [`৳${(v || 0).toLocaleString()}`, '']} />
                    <Bar dataKey="revenue" fill={PRIMARY} name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ==================== WITHDRAWALS ==================== */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Withdrawal Requests</h2>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['Seller', 'Total Sale', 'Amount', 'Method', 'Account Details', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No withdrawal requests found</td></tr>
                  ) : withdrawals.map(w => (
                    <tr key={w._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{w.user?.shopName || w.user?.name}</p>
                        <p className="text-xs text-slate-400">{w.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">{fmt(w.user?.totalEarnings || 0)}</td>
                      <td className="px-4 py-3 font-bold text-white">{fmt(w.amount)}</td>
                      <td className="px-4 py-3 text-slate-300">{w.paymentMethod}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        <div><span className="text-[10px] text-slate-500">Num:</span> {w.metadata?.accountNumber || w.accountDetails || 'N/A'}</div>
                        <div><span className="text-[10px] text-slate-500">Name:</span> {w.metadata?.accountName || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3"><Badge status={w.status} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(w.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <Btn size="sm" variant="success" onClick={() => handleUpdateWithdrawal(w._id, 'approved')} title="Approve"><Check size={14} /></Btn>
                            <Btn size="sm" variant="danger" onClick={() => handleUpdateWithdrawal(w._id, 'rejected')} title="Reject"><X size={14} /></Btn>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Seller Payout History</h2>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['Seller', 'Total Sale', 'Amount', 'Method', 'Date Paid', 'Reference'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.filter(w => w.status === 'completed').length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No completed payouts found</td></tr>
                  ) : withdrawals.filter(w => w.status === 'completed').map(w => (
                    <tr key={w._id} className="border-b border-slate-700/50 hover:bg-slate-700/40 transition-all group">
                      <td className="px-6 py-4">
                        <div className="text-white font-semibold group-hover:text-orange-400 transition-colors uppercase text-xs">{w.user?.shopName || w.user?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{w.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-400">{fmt(w.user?.totalEarnings || 0)}</td>
                      <td className="px-6 py-4 font-bold text-white text-base">{fmt(w.amount)}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-700/50 text-slate-300 px-2 py-1 rounded text-[10px] font-bold uppercase">{w.paymentMethod}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-medium">{new Date(w.updatedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-[9px] uppercase tracking-tighter">{w._id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== SETTINGS ==================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">System Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-orange-400 mb-4 uppercase tracking-wider">Payment & Checkout</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input 
                      label="bKash Number" 
                      value={configs.bkash_number || ''} 
                      onChange={e => setConfigs({ ...configs, bkash_number: e.target.value })}
                      placeholder="e.g. 017XXXXXXXX"
                    />
                    <Input 
                      label="Nagad Number" 
                      value={configs.nagad_number || ''} 
                      onChange={e => setConfigs({ ...configs, nagad_number: e.target.value })}
                      placeholder="e.g. 018XXXXXXXX"
                    />
                    <Input 
                      label="Rocket Number" 
                      value={configs.rocket_number || ''} 
                      onChange={e => setConfigs({ ...configs, rocket_number: e.target.value })}
                      placeholder="e.g. 019XXXXXXXX"
                    />
                    <Input 
                      label="Bank Details" 
                      value={configs.bank_details || ''} 
                      onChange={e => setConfigs({ ...configs, bank_details: e.target.value })}
                      placeholder="Bank, Acc Name, No, Branch"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Btn onClick={async () => {
                      await handleUpdateSpecificConfig('bkash_number', configs.bkash_number);
                      await handleUpdateSpecificConfig('nagad_number', configs.nagad_number);
                      await handleUpdateSpecificConfig('rocket_number', configs.rocket_number);
                      await handleUpdateSpecificConfig('bank_details', configs.bank_details);
                    }} loading={loading}>Save Payment Details</Btn>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-orange-400 mb-4 uppercase tracking-wider">Fees & Delivery</h3>
                <div className="space-y-4">
                  <Input 
                    label="Standard Delivery Charge (৳)" 
                    type="number"
                    value={configs.delivery_charge || ''} 
                    onChange={e => setConfigs({ ...configs, delivery_charge: e.target.value })}
                    placeholder="e.g. 60"
                  />
                  <Input 
                    label="VAT / Tax Percentage (%)" 
                    type="number"
                    value={configs.vat_percentage || ''} 
                    onChange={e => setConfigs({ ...configs, vat_percentage: e.target.value })}
                    placeholder="e.g. 5"
                  />
                  <div className="flex gap-2 pt-2">
                    <Btn onClick={async () => {
                      await handleUpdateSpecificConfig('delivery_charge', configs.delivery_charge);
                      await handleUpdateSpecificConfig('vat_percentage', configs.vat_percentage);
                    }} loading={loading}>Save Fees</Btn>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-orange-400 mb-4 uppercase tracking-wider">Membership Discounts (%)</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Product Discounts</p>
                    <Input label="Bronze (Prod)" type="number"
                      value={configs.membership_bronze_discount || 0} 
                      onChange={e => setConfigs({ ...configs, membership_bronze_discount: e.target.value })}
                    />
                    <Input label="Silver (Prod)" type="number"
                      value={configs.membership_silver_discount || 0} 
                      onChange={e => setConfigs({ ...configs, membership_silver_discount: e.target.value })}
                    />
                    <Input label="Gold (Prod)" type="number"
                      value={configs.membership_gold_discount || 0} 
                      onChange={e => setConfigs({ ...configs, membership_gold_discount: e.target.value })}
                    />
                    <Input label="Platinum (Prod)" type="number"
                      value={configs.membership_platinum_discount || 0} 
                      onChange={e => setConfigs({ ...configs, membership_platinum_discount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest pl-1">Delivery Discounts</p>
                    <Input label="Bronze (Del)" type="number"
                      value={configs.membership_bronze_delivery_discount || 0} 
                      onChange={e => setConfigs({ ...configs, membership_bronze_delivery_discount: e.target.value })}
                    />
                    <Input label="Silver (Del)" type="number"
                      value={configs.membership_silver_delivery_discount || 0} 
                      onChange={e => setConfigs({ ...configs, membership_silver_delivery_discount: e.target.value })}
                    />
                    <Input label="Gold (Del)" type="number"
                      value={configs.membership_gold_delivery_discount || 0} 
                      onChange={e => setConfigs({ ...configs, membership_gold_delivery_discount: e.target.value })}
                    />
                    <Input label="Platinum (Del)" type="number"
                      value={configs.membership_platinum_delivery_discount || 0} 
                      onChange={e => setConfigs({ ...configs, membership_platinum_delivery_discount: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 pt-2">
                    <Btn onClick={async () => {
                      const keys = [
                        'membership_bronze_discount', 'membership_silver_discount', 'membership_gold_discount', 'membership_platinum_discount',
                        'membership_bronze_delivery_discount', 'membership_silver_delivery_discount', 'membership_gold_delivery_discount', 'membership_platinum_delivery_discount'
                      ];
                      for (const k of keys) {
                        await handleUpdateSpecificConfig(k, configs[k]);
                      }
                    }} loading={loading} className="w-full">Save Membership Benefits</Btn>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Btn onClick={async () => {
                    await handleUpdateSpecificConfig('membership_bronze_discount', configs.membership_bronze_discount);
                    await handleUpdateSpecificConfig('membership_silver_discount', configs.membership_silver_discount);
                    await handleUpdateSpecificConfig('membership_gold_discount', configs.membership_gold_discount);
                    await handleUpdateSpecificConfig('membership_platinum_discount', configs.membership_platinum_discount);
                  }} loading={loading}>Save Discounts</Btn>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-orange-400 mb-4 uppercase tracking-wider">Promotion Management</h3>
              <p className="text-sm text-slate-400 mb-4">Manage coupons, discounts, and member level offers here.</p>
              <Btn variant="secondary" onClick={() => toast('Coupon management coming in next step!')}>Manage Coupons</Btn>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Order Detail */}
      <Modal open={modals.orderDetail} onClose={() => closeModal('orderDetail')} title={`Order: ${selectedItem?.orderNumber}`} size="lg">
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-2">Customer</p>
                <p className="text-white font-medium">{selectedItem.user?.name}</p>
                <p className="text-slate-400">{selectedItem.user?.email}</p>
                <p className="text-slate-400">{selectedItem.user?.phoneNumber}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-2">Shipping Address</p>
                <p className="text-white">{selectedItem.shippingAddress?.fullName}</p>
                <p className="text-slate-400">{selectedItem.shippingAddress?.addressLine1}</p>
                <p className="text-slate-400">{selectedItem.shippingAddress?.city}, {selectedItem.shippingAddress?.country}</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-slate-400 text-xs mb-2">Items</p>
              {selectedItem.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    {item.image && <img src={item.image} className="w-10 h-10 rounded object-cover border border-slate-700" />}
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-slate-400">
                        Seller: {item.product?.user?.shopName || item.product?.brand || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-300 text-sm block">{item.quantity} × {fmt(item.price)}</span>
                    <span className="text-orange-400 font-bold">{fmt(item.quantity * item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-900 rounded-lg p-3 space-y-1">
                <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-white">{fmt(selectedItem.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Shipping</span><span className="text-white">{fmt(selectedItem.shippingCost)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">VAT ({selectedItem.vat}%)</span><span className="text-white">{fmt(selectedItem.vatAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Discount</span><span className="text-red-400">-{fmt(selectedItem.discount)}</span></div>
                <div className="flex justify-between border-t border-slate-700 pt-1"><span className="text-white font-bold">Total</span><span className="text-orange-400 font-bold">{fmt(selectedItem.totalPrice)}</span></div>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 space-y-1">
                <div className="flex justify-between"><span className="text-slate-400">Payment</span><span className="text-white">{selectedItem.paymentMethod}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Pay Status</span><Badge status={selectedItem.paymentStatus} /></div>
                <div className="flex justify-between"><span className="text-slate-400">Order Status</span><Badge status={selectedItem.status} /></div>
                {selectedItem.trackingNumber && <div className="flex justify-between"><span className="text-slate-400">Tracking</span><span className="text-blue-400">{selectedItem.trackingNumber}</span></div>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Order */}
      <Modal open={modals.editOrder} onClose={() => closeModal('editOrder')} title="Update Order">
        <form onSubmit={handleUpdateOrder} className="space-y-4">
          <Select label="Order Status" value={orderForm.status} onChange={e => setOrderForm(p => ({ ...p, status: e.target.value }))}>
            {['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Payment Status" value={orderForm.paymentStatus} onChange={e => setOrderForm(p => ({ ...p, paymentStatus: e.target.value }))}>
            {['pending', 'paid', 'failed', 'refunded', 'processing'].map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="Tracking Number" value={orderForm.trackingNumber} onChange={e => setOrderForm(p => ({ ...p, trackingNumber: e.target.value }))} placeholder="e.g. BD123456789" />
          <Input label="Courier" value={orderForm.courier} onChange={e => setOrderForm(p => ({ ...p, courier: e.target.value }))} placeholder="e.g. Pathao, Redx" />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Notes</label>
            <textarea value={orderForm.adminNotes} onChange={e => setOrderForm(p => ({ ...p, adminNotes: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 h-20" />
          </div>
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => closeModal('editOrder')}>Cancel</Btn>
            <Btn type="submit">Update Order</Btn>
          </div>
        </form>
      </Modal>

      {/* Add Transaction */}
      <Modal open={modals.addTransaction} onClose={() => closeModal('addTransaction')} title="Add Transaction">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <Select label="Type" value={transactionForm.type} onChange={e => setTransactionForm(p => ({ ...p, type: e.target.value }))}>
            {['Cash In', 'Cash Out', 'Sale', 'Purchase', 'Expense', 'Withdrawal', 'Refund'].map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Amount (৳)" type="number" min="0" required value={transactionForm.amount} onChange={e => setTransactionForm(p => ({ ...p, amount: e.target.value }))} />
          <Input label="Description" required value={transactionForm.description} onChange={e => setTransactionForm(p => ({ ...p, description: e.target.value }))} />
          <Select label="Category" value={transactionForm.category} onChange={e => setTransactionForm(p => ({ ...p, category: e.target.value }))}>
            {['sales', 'purchases', 'expenses', 'withdrawals', 'others'].map(c => <option key={c}>{c}</option>)}
          </Select>
          <Select label="Payment Method" value={transactionForm.paymentMethod} onChange={e => setTransactionForm(p => ({ ...p, paymentMethod: e.target.value }))}>
            {['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank', 'Card'].map(m => <option key={m}>{m}</option>)}
          </Select>
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => closeModal('addTransaction')}>Cancel</Btn>
            <Btn type="submit">Add Transaction</Btn>
          </div>
        </form>
      </Modal>

      {/* Add Sale */}
      <Modal open={modals.addSale} onClose={() => closeModal('addSale')} title="Record Sale">
        <form onSubmit={handleAddSale} className="space-y-4">
          <Select label="Product" required value={saleForm.product} onChange={e => setSaleForm(p => ({ ...p, product: e.target.value }))}>
            <option value="">Select product...</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" min="1" required value={saleForm.quantity} onChange={e => setSaleForm(p => ({ ...p, quantity: e.target.value }))} />
            <Input label="Total Amount (৳)" type="number" min="0" required value={saleForm.totalAmount} onChange={e => setSaleForm(p => ({ ...p, totalAmount: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Customer Name" value={saleForm.customerName} onChange={e => setSaleForm(p => ({ ...p, customerName: e.target.value }))} />
            <Input label="Customer Phone" value={saleForm.customerPhone} onChange={e => setSaleForm(p => ({ ...p, customerPhone: e.target.value }))} />
          </div>
          <Select label="Payment Method" value={saleForm.paymentMethod} onChange={e => setSaleForm(p => ({ ...p, paymentMethod: e.target.value }))}>
            {['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank', 'Card'].map(m => <option key={m}>{m}</option>)}
          </Select>
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => closeModal('addSale')}>Cancel</Btn>
            <Btn type="submit">Record Sale</Btn>
          </div>
        </form>
      </Modal>

      {/* Add Purchase */}
      <Modal open={modals.addPurchase} onClose={() => closeModal('addPurchase')} title="Record Purchase">
        <form onSubmit={handleAddPurchase} className="space-y-4">
          <Select label="Product" required value={purchaseForm.product} onChange={e => setPurchaseForm(p => ({ ...p, product: e.target.value }))}>
            <option value="">Select product...</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" min="1" required value={purchaseForm.quantity} onChange={e => setPurchaseForm(p => ({ ...p, quantity: e.target.value }))} />
            <Input label="Total Amount (৳)" type="number" min="0" required value={purchaseForm.totalAmount} onChange={e => setPurchaseForm(p => ({ ...p, totalAmount: e.target.value }))} />
          </div>
          <Input label="Supplier Name" value={purchaseForm.supplier} onChange={e => setPurchaseForm(p => ({ ...p, supplier: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => closeModal('addPurchase')}>Cancel</Btn>
            <Btn type="submit">Record Purchase</Btn>
          </div>
        </form>
      </Modal>

      {/* Edit User */}
      <Modal open={modals.editUser} onClose={() => closeModal('editUser')} title={`Edit User: ${selectedItem?.name}`}>
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Select label="Role" value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
            {['user', 'seller', 'courier', 'admin'].map(r => <option key={r}>{r}</option>)}
          </Select>
          <Select label="Account Status" value={String(userForm.isActive)} onChange={e => setUserForm(p => ({ ...p, isActive: e.target.value === 'true' }))}>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </Select>
          {selectedItem?.role === 'seller' && (
            <Select label="Seller Approved" value={String(userForm.isSellerApproved)} onChange={e => setUserForm(p => ({ ...p, isSellerApproved: e.target.value === 'true' }))}>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
            </Select>
          )}
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => closeModal('editUser')}>Cancel</Btn>
            <Btn type="submit">Update User</Btn>
          </div>
        </form>
      </Modal>

      {/* Coupon Modal */}
      <Modal open={showCouponModal} onClose={() => setShowCouponModal(false)} title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}>
        <form onSubmit={handleSaveCoupon} className="space-y-4">
          <Input label="Coupon Code" required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Discount Type" value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (৳)</option>
            </Select>
            <Input label="Value" type="number" required value={couponForm.discountValue} onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Purchase (৳)" type="number" value={couponForm.minPurchase} onChange={e => setCouponForm({ ...couponForm, minPurchase: e.target.value })} />
            <Input label="Max Discount (৳)" type="number" value={couponForm.maxDiscount} onChange={e => setCouponForm({ ...couponForm, maxDiscount: e.target.value })} disabled={couponForm.discountType === 'fixed'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Expiry Date" type="date" required value={couponForm.endDate ? new Date(couponForm.endDate).toISOString().split('T')[0] : ''} onChange={e => setCouponForm({ ...couponForm, endDate: e.target.value })} />
            <Input label="Usage Limit" type="number" value={couponForm.usageLimit} onChange={e => setCouponForm({ ...couponForm, usageLimit: e.target.value })} placeholder="0 for unlimited" />
          </div>
          <div className="flex items-center gap-2 py-2">
            <input type="checkbox" checked={couponForm.isActive} onChange={e => setCouponForm({ ...couponForm, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-700 bg-slate-900" />
            <label className="text-sm text-slate-300">Coupon is active</label>
          </div>
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => setShowCouponModal(false)}>Cancel</Btn>
            <Btn type="submit" loading={loading}>{editingCoupon ? 'Update' : 'Create'} Coupon</Btn>
          </div>
        </form>
      </Modal>

      {/* Google Drive Backup */}
      <Modal open={modals.backup} onClose={() => closeModal('backup')} title="Backup to Google Drive">
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <p className="text-sm text-slate-300 mb-3">Backup all your data (orders, users, products, transactions) to Google Drive as a JSON file.</p>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
              <li>Click "Get Auth URL" to open Google authorization</li>
              <li>Authorize the app and copy your access token</li>
              <li>Paste the token below and click "Upload Backup"</li>
            </ol>
          </div>
          <Btn variant="secondary" className="w-full" onClick={handleGoogleDriveBackup}>
            <CloudUpload size={15} /> Step 1: Get Google Auth URL
          </Btn>
          <Input
            label="Access Token (from Google)"
            value={backupState.token}
            onChange={e => setBackupState(p => ({ ...p, token: e.target.value }))}
            placeholder="Paste your access token here..."
          />
          <Btn className="w-full" loading={backupState.loading} disabled={!backupState.token} onClick={handleGoogleDriveBackup}>
            <CloudUpload size={15} /> Upload Backup to Google Drive
          </Btn>
          <p className="text-xs text-slate-500 text-center">Requires GOOGLE_CLIENT_ID in .env + googleapis npm package</p>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;