import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ShoppingCart, Users, LayoutDashboard, Banknote,
  ShoppingBag, TrendingUp, TrendingDown, BarChart3, Plus, X,
  Edit, Trash2, Search, Eye, ArrowUpRight, RefreshCw,
  FileSpreadsheet, Printer, AlertCircle, Clock, CheckCircle2,
  Wallet, Activity, Loader2, Store, ChevronDown
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import { sellerAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#ff5500', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];
const PRIMARY = '#ff5500';

const fmt = (n) => `৳${(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;

// ----------- Shared UI components (same as Admin) -----------
const StatCard = ({ title, value, icon: Icon, color = PRIMARY, subtitle, loading }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-orange-500/40 transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className="p-2.5 rounded-lg" style={{ backgroundColor: color + '20' }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
    {loading ? <div className="h-8 bg-slate-700 rounded animate-pulse mb-1" /> : <p className="text-2xl font-bold text-white mb-0.5">{value}</p>}
    <p className="text-sm text-slate-400">{title}</p>
    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
  </motion.div>
);

const Badge = ({ status }) => {
  const map = {
    pending: 'bg-yellow-500/20 text-yellow-400', confirmed: 'bg-blue-500/20 text-blue-400',
    processing: 'bg-purple-500/20 text-purple-400', shipped: 'bg-cyan-500/20 text-cyan-400',
    delivered: 'bg-emerald-500/20 text-emerald-400', cancelled: 'bg-red-500/20 text-red-400',
    paid: 'bg-emerald-500/20 text-emerald-400', live: 'bg-emerald-500/20 text-emerald-400',
    draft: 'bg-slate-500/20 text-slate-400', archived: 'bg-red-500/20 text-red-400',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.draft}`}>{status}</span>;
};

const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div className={`relative bg-slate-800 border border-slate-700 rounded-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto z-10`}
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"><X size={18} /></button>
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
    <input {...props} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors" />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
    <select {...props} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500">
      {children}
    </select>
  </div>
);

const Btn = ({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all disabled:opacity-50';
  const variants = { primary: 'bg-orange-500 hover:bg-orange-600 text-white', secondary: 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600', danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30', ghost: 'hover:bg-slate-700 text-slate-400 hover:text-white', success: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30' };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <button {...props} disabled={loading || props.disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading && <Loader2 size={14} className="animate-spin" />}{children}
    </button>
  );
};

// ============================================================
// SELLER PANEL
// ============================================================
const SellerPanel = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ overview: {} });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [modals, setModals] = useState({ addProduct: false, editProduct: false, addSale: false, addPurchase: false, addTransaction: false, orderDetail: false, updateOrder: false, withdrawal: false });
  const [selectedItem, setSelectedItem] = useState(null);

  const [productForm, setProductForm] = useState({ name: '', sellingPrice: '', purchasePrice: '', description: '', category: 'General', image: '', stock: 0, unit: 'পিস', liveStatus: 'live', brand: '', sku: '' });
  const [saleForm, setSaleForm] = useState({ product: '', quantity: 1, totalAmount: 0, paymentMethod: 'Cash', notes: '' });
  const [purchaseForm, setPurchaseForm] = useState({ product: '', quantity: 1, totalAmount: 0, description: '', supplierName: '', supplierPhone: '' });
  const [transactionForm, setTransactionForm] = useState({ type: 'Cash In', amount: '', description: '', paymentMethod: 'Cash' });
  const [orderUpdateForm, setOrderUpdateForm] = useState({ status: '', trackingNumber: '', courier: '' });
  const [withdrawalForm, setWithdrawalForm] = useState({ amount: '', paymentMethod: 'bKash', accountNumber: '', accountName: '' });

  const openModal = (name, item = null) => {
    setSelectedItem(item);
    if (item && name === 'editProduct') setProductForm({ ...item });
    if (item && name === 'updateOrder') setOrderUpdateForm({ status: item.status, trackingNumber: item.trackingNumber || '', courier: item.courier || '' });
    setModals(p => ({ ...p, [name]: true }));
  };
  const closeModal = (name) => { setModals(p => ({ ...p, [name]: false })); setSelectedItem(null); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [sellerAPI.getStats().catch(() => ({ data: { stats: { overview: {} } } }))];
      if (['overview', 'products', 'inventory'].includes(activeTab)) calls.push(sellerAPI.getProducts({ limit: 100 }).catch(() => ({ data: { products: [] } })));
      if (['overview', 'orders'].includes(activeTab)) calls.push(sellerAPI.getOrders({ limit: 50 }).catch(() => ({ data: { orders: [] } })));
      if (['overview', 'customers'].includes(activeTab)) calls.push(sellerAPI.getCustomers().catch(() => ({ data: { customers: [] } })));
      if (['cashbox', 'transactions'].includes(activeTab)) calls.push(sellerAPI.getTransactions().catch(() => ({ data: { transactions: [] } })));
      if (activeTab === 'sales') calls.push(sellerAPI.getSales().catch(() => ({ data: { sales: [] } })));
      if (activeTab === 'purchases') calls.push(sellerAPI.getPurchases().catch(() => ({ data: { purchases: [] } })));

      const results = await Promise.all(calls);
      if (results[0]?.data?.stats) setStats(results[0].data.stats);
      results.forEach(r => {
        if (r?.data?.products) setProducts(r.data.products);
        if (r?.data?.orders) setOrders(r.data.orders);
        if (r?.data?.customers) setCustomers(r.data.customers);
        if (r?.data?.transactions) setTransactions(r.data.transactions);
        if (r?.data?.sales) setSales(r.data.sales);
        if (r?.data?.purchases) setPurchases(r.data.purchases);
      });
    } catch { toast.error("Failed to fetch data"); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportToExcel = (data, name) => {
    if (!data?.length) return toast.error('No data');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Exported!');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const data = { ...productForm, price: productForm.sellingPrice };
      if (selectedItem?._id) {
        await sellerAPI.updateProduct(selectedItem._id, data);
        toast.success('Product updated');
        closeModal('editProduct');
      } else {
        await sellerAPI.createProduct(data);
        toast.success('Product added');
        closeModal('addProduct');
      }
      setProductForm({ name: '', sellingPrice: '', purchasePrice: '', description: '', category: 'General', image: '', stock: 0, unit: 'পিস', liveStatus: 'live', brand: '', sku: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Archive this product?')) return;
    try {
      await sellerAPI.deleteProduct(id);
      toast.success('Product archived');
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const handleAddSale = async (e) => {
    e.preventDefault();
    try {
      await sellerAPI.createSale(saleForm);
      toast.success('Sale recorded');
      closeModal('addSale');
      setSaleForm({ product: '', quantity: 1, totalAmount: 0, paymentMethod: 'Cash', notes: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    try {
      await sellerAPI.createPurchase(purchaseForm);
      toast.success('Purchase recorded & stock updated');
      closeModal('addPurchase');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await sellerAPI.createTransaction(transactionForm);
      toast.success('Transaction added');
      closeModal('addTransaction');
      fetchData();
    } catch { toast.error('Failed'); }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await sellerAPI.updateOrder(selectedItem._id, orderUpdateForm);
      toast.success('Order updated');
      closeModal('updateOrder');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    try {
      await sellerAPI.requestWithdrawal(withdrawalForm);
      toast.success('Withdrawal request submitted!');
      closeModal('withdrawal');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const overview = stats.overview || {};
  const cashIn = transactions.filter(t => t.type === 'Cash In').reduce((s, t) => s + t.amount, 0);
  const cashOut = transactions.filter(t => t.type === 'Cash Out').reduce((s, t) => s + t.amount, 0);
  const filteredProducts = products.filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredOrders = orders.filter(o => !searchQuery || o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'cashbox', label: 'Cash Box', icon: Banknote },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'purchases', label: 'Purchases', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-sm">
              {currentUser?.shopName?.[0] || 'S'}
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">{currentUser?.shopName || 'My Shop'}</h1>
              <p className="text-xs text-slate-400">Seller Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!currentUser?.isSellerApproved && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded-full">⏳ Pending Approval</span>
            )}
            <Btn size="sm" variant="secondary" onClick={() => openModal('withdrawal')}>
              <Wallet size={13} /> Withdraw
            </Btn>
            <Btn size="sm" variant="secondary" onClick={fetchData} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </Btn>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
                <tab.icon size={14} />{tab.label}
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
              <StatCard title="Products" value={overview.totalProducts || 0} icon={Package} color="#0ea5e9" loading={loading} />
              <StatCard title="Total Orders" value={overview.totalOrders || 0} icon={ShoppingCart} color={PRIMARY} loading={loading} />
              <StatCard title="Total Sales" value={fmt(overview.totalSales)} icon={ShoppingBag} color="#f59e0b" loading={loading} />
              <StatCard title="Earnings (net)" value={fmt(overview.totalEarnings)} icon={TrendingUp} color="#10b981" loading={loading} subtitle="After 2% commission" />
              <StatCard title="Pending Orders" value={overview.pendingOrders || 0} icon={Clock} color="#f59e0b" loading={loading} />
              <StatCard title="Low Stock" value={overview.lowStockCount || 0} icon={AlertCircle} color="#ef4444" loading={loading} />
            </div>

            {/* Sales Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-4">Sales Chart (Last 30 days)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={stats.salesChart || []}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={v => [fmt(v), '']} />
                    <Area type="monotone" dataKey="sales" stroke={PRIMARY} fillOpacity={1} fill="url(#colorSales)" name="Earnings" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-4">Top Products</h3>
                <div className="space-y-3">
                  {(stats.topProducts || []).slice(0, 6).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                      {p.product?.image && <img src={p.product.image} className="w-8 h-8 rounded object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{p.product?.name}</p>
                        <p className="text-xs text-slate-400">{p.totalSold} sold</p>
                      </div>
                      <span className="text-xs text-orange-400 font-medium">{fmt(p.totalRevenue)}</span>
                    </div>
                  ))}
                  {!stats.topProducts?.length && <p className="text-sm text-slate-500 text-center py-4">No sales yet</p>}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Recent Orders</h3>
                <Btn size="sm" variant="ghost" onClick={() => setActiveTab('orders')}><ArrowUpRight size={13} /> View All</Btn>
              </div>
              <div className="space-y-2">
                {(stats.recentOrders || []).slice(0, 5).map(order => (
                  <div key={order._id} className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <div>
                      <p className="text-sm font-medium text-white">{order.orderNumber}</p>
                      <p className="text-xs text-slate-400">{order.user?.name} • {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <Badge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== ORDERS ==================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">My Orders</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search orders..."
                    className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 w-52 focus:outline-none focus:border-orange-500" />
                </div>
                <Btn size="sm" variant="secondary" onClick={() => exportToExcel(filteredOrders.map(o => ({ OrderNo: o.orderNumber, Customer: o.user?.name, Total: o.totalPrice, Status: o.status, Date: new Date(o.createdAt).toLocaleDateString() })), 'my_orders')}>
                  <FileSpreadsheet size={13} /> Excel
                </Btn>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-orange-400">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="text-white">{order.user?.name}</p>
                        <p className="text-xs text-slate-400">{order.user?.phoneNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{order.items?.length}</td>
                      <td className="px-4 py-3 font-semibold text-white">{fmt(order.totalPrice)}</td>
                      <td className="px-4 py-3"><Badge status={order.status} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Btn size="sm" variant="ghost" onClick={() => openModal('orderDetail', order)}><Eye size={13} /></Btn>
                          {['pending', 'confirmed', 'processing'].includes(order.status) && (
                            <Btn size="sm" variant="ghost" onClick={() => openModal('updateOrder', order)}><Edit size={13} /></Btn>
                          )}
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
              <h2 className="text-xl font-bold text-white">My Products</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..."
                    className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 w-48 focus:outline-none focus:border-orange-500" />
                </div>
                <Btn size="sm" variant="secondary" onClick={() => exportToExcel(filteredProducts.map(p => ({ Name: p.name, Category: p.category, Stock: p.stock, SellPrice: p.sellingPrice, BuyPrice: p.purchasePrice, Status: p.liveStatus })), 'products')}>
                  <FileSpreadsheet size={13} /> Excel
                </Btn>
                <Btn size="sm" onClick={() => openModal('addProduct')}>
                  <Plus size={13} /> Add Product
                </Btn>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard title="Total Products" value={products.length} icon={Package} color="#0ea5e9" />
              <StatCard title="Low Stock" value={products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length} icon={AlertCircle} color="#f59e0b" />
              <StatCard title="Out of Stock" value={products.filter(p => p.stock === 0).length} icon={AlertCircle} color="#ef4444" />
              <StatCard title="Total Value" value={fmt(products.reduce((s, p) => s + p.purchasePrice * p.stock, 0))} icon={Banknote} color="#10b981" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <motion.div key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-orange-500/40 transition-all">
                  <div className="relative">
                    {p.image ? <img src={p.image} className="w-full h-36 object-cover" /> : <div className="w-full h-36 bg-slate-700 flex items-center justify-center"><Package size={32} className="text-slate-500" /></div>}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge status={p.liveStatus} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-white mb-1 truncate">{p.name}</h4>
                    <p className="text-xs text-slate-400 mb-3">{p.category} • {p.unit}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-slate-900 rounded-lg p-2">
                        <p className="text-slate-500">Buy Price</p>
                        <p className="text-white font-medium">{fmt(p.purchasePrice)}</p>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-2">
                        <p className="text-slate-500">Sell Price</p>
                        <p className="text-orange-400 font-medium">{fmt(p.sellingPrice)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-400' : p.stock <= 5 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        Stock: {p.stock} {p.unit}
                      </span>
                      <span className="text-xs text-slate-400">Sold: {p.soldCount || 0}</span>
                    </div>
                    <div className="flex gap-2">
                      <Btn size="sm" variant="secondary" className="flex-1" onClick={() => openModal('editProduct', p)}>
                        <Edit size={12} /> Edit
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => handleDeleteProduct(p._id)}>
                        <Trash2 size={12} />
                      </Btn>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== CUSTOMERS ==================== */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">My Customers</h2>
              <Btn size="sm" variant="secondary" onClick={() => exportToExcel(customers.map(c => ({ Name: c.name, Email: c.email, Phone: c.phoneNumber, Orders: c.orderCount })), 'customers')}>
                <FileSpreadsheet size={13} /> Excel
              </Btn>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map(c => (
                <div key={c._id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:border-orange-500/40 transition-all">
                  <img src={c.profilePic || `https://ui-avatars.com/api/?name=${c.name}&background=ff5500&color=fff`} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 truncate">{c.email}</p>
                    <p className="text-xs text-slate-400">{c.phoneNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-bold text-lg">{c.orderCount}</p>
                    <p className="text-xs text-slate-500">orders</p>
                  </div>
                </div>
              ))}
              {!customers.length && <div className="col-span-3 text-center py-12 text-slate-400">No customers yet</div>}
            </div>
          </div>
        )}

        {/* ==================== EARNINGS ==================== */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Earnings & Withdrawal</h2>
              <Btn size="sm" onClick={() => openModal('withdrawal')}><Wallet size={13} /> Request Withdrawal</Btn>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Earnings" value={fmt(overview.totalEarnings)} icon={TrendingUp} color="#10b981" subtitle="After 2% platform commission" />
              <StatCard title="Total Sales" value={fmt(overview.totalSales)} icon={ShoppingBag} color={PRIMARY} />
              <StatCard title="Commission Paid" value={fmt((overview.totalSales || 0) * 0.02)} icon={Activity} color="#f59e0b" subtitle="2% platform fee" />
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4">Monthly Earnings</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.monthlySales || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={v => [fmt(v), '']} />
                  <Bar dataKey="total" fill={PRIMARY} name="Earnings" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <p className="text-sm text-slate-400 leading-relaxed">
                💡 <strong className="text-white">How earnings work:</strong> When an order is delivered, you earn the product price minus 2% platform commission.
                Withdrawal requests are processed within 1–3 business days to your bKash/Nagad/Bank account.
              </p>
            </div>
          </div>
        )}

        {/* ==================== CASH BOX ==================== */}
        {activeTab === 'cashbox' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Cash Box</h2>
              <Btn size="sm" onClick={() => openModal('addTransaction')}><Plus size={13} /> Add Transaction</Btn>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total In" value={fmt(cashIn)} icon={TrendingUp} color="#10b981" />
              <StatCard title="Total Out" value={fmt(cashOut)} icon={TrendingDown} color="#ef4444" />
              <StatCard title="Net Balance" value={fmt(cashIn - cashOut)} icon={Banknote} color={cashIn >= cashOut ? '#10b981' : '#ef4444'} />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['Type', 'Amount', 'Description', 'Method', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-3"><span className={`text-xs font-semibold ${t.type === 'Cash In' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type}</span></td>
                      <td className={`px-4 py-3 font-bold ${t.type === 'Cash In' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'Cash In' ? '+' : '-'}{fmt(t.amount)}</td>
                      <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">{t.description}</td>
                      <td className="px-4 py-3 text-slate-400">{t.paymentMethod}</td>
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Sales Record</h2>
              <div className="flex gap-2">
                <Btn size="sm" variant="secondary" onClick={() => exportToExcel(sales.map(s => ({ Product: s.product?.name, Qty: s.quantity, Amount: s.totalAmount, Profit: s.profit, Method: s.paymentMethod, Date: new Date(s.saleDate || s.createdAt).toLocaleDateString() })), 'sales')}>
                  <FileSpreadsheet size={13} /> Excel
                </Btn>
                <Btn size="sm" onClick={() => openModal('addSale')}><Plus size={13} /> Record Sale</Btn>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard title="Total Sales" value={sales.length} icon={ShoppingBag} color={PRIMARY} />
              <StatCard title="Revenue" value={fmt(sales.reduce((s, t) => s + t.totalAmount, 0))} icon={TrendingUp} color="#10b981" />
              <StatCard title="Profit" value={fmt(sales.reduce((s, t) => s + (t.profit || 0), 0))} icon={Activity} color="#8b5cf6" />
              <StatCard title="Avg Sale" value={fmt(sales.length ? sales.reduce((s, t) => s + t.totalAmount, 0) / sales.length : 0)} icon={BarChart3} color="#f59e0b" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
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
                      <td className="px-4 py-3 text-orange-400">{s.saleNumber}</td>
                      <td className="px-4 py-3 text-white">{s.product?.name}</td>
                      <td className="px-4 py-3 text-slate-300">{s.quantity}</td>
                      <td className="px-4 py-3 font-semibold">{fmt(s.totalAmount)}</td>
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Purchase Record</h2>
              <div className="flex gap-2">
                <Btn size="sm" variant="secondary" onClick={() => exportToExcel(purchases.map(p => ({ Product: p.product?.name, Qty: p.quantity, Amount: p.totalAmount, Supplier: p.supplier?.name, Status: p.paymentStatus })), 'purchases')}>
                  <FileSpreadsheet size={13} /> Excel
                </Btn>
                <Btn size="sm" onClick={() => openModal('addPurchase')}><Plus size={13} /> Add Purchase</Btn>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    {['Purchase #', 'Product', 'Qty', 'Amount', 'Supplier', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-orange-400">{p.purchaseNumber}</td>
                      <td className="px-4 py-3 text-white">{p.product?.name}</td>
                      <td className="px-4 py-3 text-slate-300">{p.quantity}</td>
                      <td className="px-4 py-3 font-semibold">{fmt(p.totalAmount)}</td>
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
      </div>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Add/Edit Product */}
      <Modal open={modals.addProduct || modals.editProduct} onClose={() => { closeModal('addProduct'); closeModal('editProduct'); }}
        title={selectedItem ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Input label="Product Name *" required value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} /></div>
            <Input label="Selling Price (৳) *" type="number" min="0" required value={productForm.sellingPrice} onChange={e => setProductForm(p => ({ ...p, sellingPrice: e.target.value }))} />
            <Input label="Purchase Price (৳) *" type="number" min="0" required value={productForm.purchasePrice} onChange={e => setProductForm(p => ({ ...p, purchasePrice: e.target.value }))} />
            <Input label="Stock *" type="number" min="0" required value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} />
            <Select label="Unit" value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))}>
              {['পিস', 'কেজি', 'লিটার', 'ডজন', 'হালি', 'প্যাকেট', 'গ্রাম'].map(u => <option key={u}>{u}</option>)}
            </Select>
            <Input label="Category *" required value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))} />
            <Input label="Brand" value={productForm.brand} onChange={e => setProductForm(p => ({ ...p, brand: e.target.value }))} />
            <div className="col-span-2"><Input label="Image URL *" required value={productForm.image} onChange={e => setProductForm(p => ({ ...p, image: e.target.value }))} placeholder="https://..." /></div>
            {productForm.image && <div className="col-span-2"><img src={productForm.image} className="h-24 object-contain rounded-lg bg-slate-900" /></div>}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description *</label>
              <textarea required value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 h-20" />
            </div>
            <Select label="Status" value={productForm.liveStatus} onChange={e => setProductForm(p => ({ ...p, liveStatus: e.target.value }))}>
              {['live', 'draft', 'not-available'].map(s => <option key={s}>{s}</option>)}
            </Select>
            <Input label="SKU" value={productForm.sku} onChange={e => setProductForm(p => ({ ...p, sku: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => { closeModal('addProduct'); closeModal('editProduct'); }}>Cancel</Btn>
            <Btn type="submit">{selectedItem ? 'Update' : 'Add Product'}</Btn>
          </div>
        </form>
      </Modal>

      {/* Order Detail */}
      <Modal open={modals.orderDetail} onClose={() => closeModal('orderDetail')} title={`Order: ${selectedItem?.orderNumber}`} size="lg">
        {selectedItem && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Customer</p>
                <p className="text-white">{selectedItem.user?.name}</p>
                <p className="text-slate-400">{selectedItem.user?.phoneNumber}</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Status</p>
                <Badge status={selectedItem.status} />
                <p className="text-slate-400 mt-1">Payment: {selectedItem.paymentMethod}</p>
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3">
              <p className="text-slate-400 text-xs mb-2">Shipping</p>
              <p className="text-white">{selectedItem.shippingAddress?.fullName}</p>
              <p className="text-slate-400">{selectedItem.shippingAddress?.addressLine1}, {selectedItem.shippingAddress?.city}</p>
              <p className="text-slate-400">{selectedItem.shippingAddress?.phoneNumber}</p>
            </div>
            <div className="space-y-1">
              {selectedItem.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900 rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    {item.image && <img src={item.image} className="w-8 h-8 rounded object-cover" />}
                    <span className="text-white">{item.name}</span>
                  </div>
                  <span className="text-orange-400">{item.quantity} × {fmt(item.price)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between bg-slate-900 rounded-lg px-3 py-2">
              <span className="text-slate-400">Total</span>
              <span className="text-orange-400 font-bold">{fmt(selectedItem.totalPrice)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Order Status */}
      <Modal open={modals.updateOrder} onClose={() => closeModal('updateOrder')} title="Update Order Status">
        <form onSubmit={handleUpdateOrder} className="space-y-4">
          <Select label="New Status" value={orderUpdateForm.status} onChange={e => setOrderUpdateForm(p => ({ ...p, status: e.target.value }))}>
            {['confirmed', 'processing', 'shipped', 'out-for-delivery', 'cancelled'].map(s => <option key={s}>{s}</option>)}
          </Select>
          <Input label="Tracking Number" value={orderUpdateForm.trackingNumber} onChange={e => setOrderUpdateForm(p => ({ ...p, trackingNumber: e.target.value }))} placeholder="e.g. PATHAO123456" />
          <Input label="Courier" value={orderUpdateForm.courier} onChange={e => setOrderUpdateForm(p => ({ ...p, courier: e.target.value }))} placeholder="e.g. Pathao, Redx, SA Poribahan" />
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => closeModal('updateOrder')}>Cancel</Btn>
            <Btn type="submit">Update</Btn>
          </div>
        </form>
      </Modal>

      {/* Add Sale */}
      <Modal open={modals.addSale} onClose={() => closeModal('addSale')} title="Record Sale">
        <form onSubmit={handleAddSale} className="space-y-4">
          <Select label="Product *" required value={saleForm.product} onChange={e => setSaleForm(p => ({ ...p, product: e.target.value }))}>
            <option value="">Select product...</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity *" type="number" min="1" required value={saleForm.quantity} onChange={e => setSaleForm(p => ({ ...p, quantity: e.target.value }))} />
            <Input label="Total Amount (৳) *" type="number" min="0" required value={saleForm.totalAmount} onChange={e => setSaleForm(p => ({ ...p, totalAmount: e.target.value }))} />
          </div>
          <Select label="Payment Method" value={saleForm.paymentMethod} onChange={e => setSaleForm(p => ({ ...p, paymentMethod: e.target.value }))}>
            {['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank'].map(m => <option key={m}>{m}</option>)}
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
          <Select label="Product *" required value={purchaseForm.product} onChange={e => setPurchaseForm(p => ({ ...p, product: e.target.value }))}>
            <option value="">Select product...</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity *" type="number" min="1" required value={purchaseForm.quantity} onChange={e => setPurchaseForm(p => ({ ...p, quantity: e.target.value }))} />
            <Input label="Total Amount (৳) *" type="number" min="0" required value={purchaseForm.totalAmount} onChange={e => setPurchaseForm(p => ({ ...p, totalAmount: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Supplier Name" value={purchaseForm.supplierName} onChange={e => setPurchaseForm(p => ({ ...p, supplierName: e.target.value }))} />
            <Input label="Supplier Phone" value={purchaseForm.supplierPhone} onChange={e => setPurchaseForm(p => ({ ...p, supplierPhone: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => closeModal('addPurchase')}>Cancel</Btn>
            <Btn type="submit">Record Purchase</Btn>
          </div>
        </form>
      </Modal>

      {/* Add Transaction */}
      <Modal open={modals.addTransaction} onClose={() => closeModal('addTransaction')} title="Add Transaction">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <Select label="Type" value={transactionForm.type} onChange={e => setTransactionForm(p => ({ ...p, type: e.target.value }))}>
            {['Cash In', 'Cash Out', 'Sale', 'Purchase', 'Expense'].map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Amount (৳) *" type="number" min="0" required value={transactionForm.amount} onChange={e => setTransactionForm(p => ({ ...p, amount: e.target.value }))} />
          <Input label="Description *" required value={transactionForm.description} onChange={e => setTransactionForm(p => ({ ...p, description: e.target.value }))} />
          <Select label="Payment Method" value={transactionForm.paymentMethod} onChange={e => setTransactionForm(p => ({ ...p, paymentMethod: e.target.value }))}>
            {['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank'].map(m => <option key={m}>{m}</option>)}
          </Select>
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => closeModal('addTransaction')}>Cancel</Btn>
            <Btn type="submit">Add</Btn>
          </div>
        </form>
      </Modal>

      {/* Withdrawal */}
      <Modal open={modals.withdrawal} onClose={() => closeModal('withdrawal')} title="Request Withdrawal">
        <div className="mb-4 bg-slate-900 rounded-lg p-3">
          <p className="text-sm text-slate-400">Available Balance: <span className="text-emerald-400 font-bold">{fmt(overview.totalEarnings)}</span></p>
        </div>
        <form onSubmit={handleWithdrawal} className="space-y-4">
          <Input label="Amount (৳) *" type="number" min="100" required value={withdrawalForm.amount} onChange={e => setWithdrawalForm(p => ({ ...p, amount: e.target.value }))} placeholder="Minimum ৳100" />
          <Select label="Payment Method *" value={withdrawalForm.paymentMethod} onChange={e => setWithdrawalForm(p => ({ ...p, paymentMethod: e.target.value }))}>
            {['bKash', 'Nagad', 'Rocket', 'Bank'].map(m => <option key={m}>{m}</option>)}
          </Select>
          <Input label="Account Number *" required value={withdrawalForm.accountNumber} onChange={e => setWithdrawalForm(p => ({ ...p, accountNumber: e.target.value }))} placeholder="01XXXXXXXXX" />
          <Input label="Account Name *" required value={withdrawalForm.accountName} onChange={e => setWithdrawalForm(p => ({ ...p, accountName: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Btn type="button" variant="secondary" onClick={() => closeModal('withdrawal')}>Cancel</Btn>
            <Btn type="submit">Submit Request</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SellerPanel;