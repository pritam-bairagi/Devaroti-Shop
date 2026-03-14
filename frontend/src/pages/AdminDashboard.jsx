import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Trash2, Edit, Shield, Search, ArrowLeft, Plus, X,
    Package, ShoppingCart, Users, LayoutDashboard, Save, CheckCircle,
    Banknote, ShoppingBag, Truck, FileText, Download, BarChart3, TrendingUp, TrendingDown,
    Calendar, ArrowUpRight, ArrowDownRight, Printer, FileSpreadsheet,
    HomeIcon,
    StoreIcon,
    Edit2
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import API, { adminAPI, productAPI } from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminDashboard = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState({});
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Form States
    const [editingItem, setEditingItem] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const [productForm, setProductForm] = useState({
        name: "", sellingPrice: "", purchasePrice: "", description: "", category: "General", image: "", stock: 0, unit: "পিস", liveStatus: "live"
    });
    const [transactionForm, setTransactionForm] = useState({
        type: "Cash In", amount: "", description: ""
    });
    const [saleForm, setSaleForm] = useState({
        product: "", quantity: 1, totalAmount: 0, paymentMethod: "Cash", description: ""
    });
    const [purchaseForm, setPurchaseForm] = useState({
        product: "", quantity: 1, totalAmount: 0, description: ""
    });

    const [userForm, setUserForm] = useState({
        name: "", email: "", password: "", phoneNumber: "", address: "", role: "user"
    });

    useEffect(() => {
        fetchAllData();
    }, [activeTab]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [sRes, uRes, pRes, oRes, tRes, slRes, puRes] = await Promise.all([
                API.get("/admin/stats"),
                API.get("/admin/users"),
                API.get("/admin/products"),
                API.get("/admin/orders"),
                API.get("/admin/transactions"),
                API.get("/admin/sales"),
                API.get("/admin/purchases")
            ]);
            setStats(sRes.data.stats || {});
            setUsers(uRes.data.users || []);
            setProducts(pRes.data.products || []);
            setOrders(oRes.data.orders || []);
            setTransactions(tRes.data.transactions || []);
            setSales(slRes.data.sales || []);
            setPurchases(puRes.data.purchases || []);

        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    // --- Export Utilities ---
    const exportToExcel = (data, fileName) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const exportToPDF = (headers, data, fileName, title) => {
        const doc = new jsPDF();
        doc.text(title, 14, 15);
        doc.autoTable({
            head: [headers],
            body: data,
            startY: 20,
        });
        doc.save(`${fileName}.pdf`);
    };

    // --- Handlers ---
    const handleAddTransaction = async (e) => {
        e.preventDefault();
        try {
            await API.post("/admin/transactions", transactionForm);
            toast.success("Transaction added");

            setIsTransactionModalOpen(false);
            setTransactionForm({ type: "Cash In", amount: "", description: "" });
            fetchAllData();
        } catch (error) {
            toast.error("Failed to add transaction");
        }
    };

    const handleAddSale = async (e) => {
        e.preventDefault();
        try {
            await API.post("/admin/sales", saleForm);
            toast.success("Sale recorded");

            setIsSaleModalOpen(false);
            fetchAllData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to record sale");
        }
    };

    const handleAddPurchase = async (e) => {
        e.preventDefault();
        try {
            await API.post("/admin/purchases", purchaseForm);
            toast.success("Purchase recorded");

            setIsPurchaseModalOpen(false);
            fetchAllData();
        } catch (error) {
            toast.error("Failed to record purchase");
        }
    };

    // Update the handleProductSubmit function in AdminDashboard.jsx

const handleProductSubmit = async (e) => {
  e.preventDefault();
  
  // Validate required fields
  if (!productForm.name || !productForm.sellingPrice || !productForm.purchasePrice || 
      !productForm.category || !productForm.image) {
    toast.error('Please fill in all required fields');
    return;
  }

  try {
    const data = { 
      ...productForm, 
      price: productForm.sellingPrice,
      sellingPrice: Number(productForm.sellingPrice),
      purchasePrice: Number(productForm.purchasePrice),
      stock: Number(productForm.stock) || 0
    };
    
    console.log('Submitting product:', data);
    
    if (editingItem) {
      const response = await productAPI.updateProduct(editingItem._id, data);
      if (response.data.success) {
        toast.success('Product updated successfully');
      }
    } else {
      const response = await productAPI.createProduct(data);
      if (response.data.success) {
        toast.success('Product created successfully');
      }
    }

    setIsProductModalOpen(false);
    setEditingItem(null);
    setProductForm({
      name: "", sellingPrice: "", purchasePrice: "", description: "", 
      category: "General", image: "", stock: 0, unit: "পিস", liveStatus: "live"
    });
    fetchAllData();
  } catch (error) {
    console.error('Product operation error:', error);
    toast.error(error.response?.data?.message || 'Operation failed');
  }
};

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await API.put(`/admin/users/${editingItem._id}`, userForm);
                toast.success("User updated");
            }
            setIsUserModalOpen(false);
            fetchAllData();
        } catch (error) {
            toast.error("Failed to update user");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await axios.delete(`/api/admin/users/${userId}`);
            toast.success("User deleted");
            fetchAllData();
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    // Chart Data Preparation
    const salesChartData = stats.dailyStats?.map(d => ({
        name: d._id,
        amount: d.sales
    })) || [];

    const topProductChartData = stats.topProducts?.map(p => ({
        name: p.product?.name?.slice(0, 15) || 'Unknown',
        value: p.totalSold
    })) || [];


    const monthlySalesChartData = stats.monthlySales?.map(m => ({
        name: m._id,
        amount: m.total
    })) || [];

    const inventoryAgingData = stats.inventoryAging || [];

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const COLORS = ['#088178', '#36a2eb', '#ffce56', '#ff6384', '#9966ff', '#4bc0c0', '#ff9f40', '#c9cbcf'];

    return (
        <div className="min-h-screen bg-[#ffffff] flex flex-col md:flex-row no-copy w-full font-['Spartan']">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-[#041e42] text-white p-6 flex flex-col gap-5 md:min-h-screen ">
                <div className="flex items-center gap-2">
                    <div className="bg-[#088178] p-2.5 rounded-2xl shadow-lg shadow-teal-500/20"><LayoutDashboard size={24} /></div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight">PARASH FERI</h2>
                        <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Admin Panel</p>
                    </div>
                </div>
                <div className="pb-4 border-b border-white">
                    <Link to="/" className="text-[14px] text-yellow-500"><StoreIcon size={16} className="inline mr-1" /> {currentUser?.name} </Link>
                </div>


                <nav className="flex flex-col gap-2">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'inventory', icon: Package, label: 'Inventory' },
                        { id: 'sales', icon: TrendingUp, label: 'Sales' },
                        { id: 'purchases', icon: ShoppingBag, label: 'Purchases' },
                        { id: 'cashbox', icon: Banknote, label: 'Cash Box' },
                        { id: 'orders', icon: ShoppingCart, label: 'Orders' },
                        { id: 'users', icon: Users, label: 'User Directory' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-4 px-5 py-4 rounded-xl font-small transition-all ${activeTab === tab.id ? 'bg-[#088178] text-white shadow-lg shadow-teal-700/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <tab.icon size={20} /> {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-white">
                    <Link to="/" className="flex items-center gap-3 text-gray-400 hover:text-white font-bold text-sm transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 md:p-12 overflow-x-hidden">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 capitalize tracking-tight">{activeTab.replace(/([A-Z])/g, ' $1')}</h1>
                        <p className="text-gray-400 font-medium">Monitoring business metrics and operations</p>
                    </div>

                    <div className="flex gap-3">
                        {activeTab === 'inventory' && (
                            <button onClick={() => { setIsProductModalOpen(true); setEditingItem(null); setProductForm({ name: "", sellingPrice: "", purchasePrice: "", description: "", category: "General", image: "", stock: 0, unit: "পিস", liveStatus: "live" }); }} className="bg-[#088178] text-white px-6 py-3.5 rounded-xl font-bold shadow-xl shadow-teal-900/10 flex items-center gap-2 hover:scale-105 transition-all">
                                <Plus size={20} /> Add Product
                            </button>
                        )}
                        {activeTab === 'cashbox' && (
                            <button onClick={() => setIsTransactionModalOpen(true)} className="bg-[#088178] text-white px-6 py-3.5 rounded-xl font-bold shadow-xl shadow-teal-900/10 flex items-center gap-2 hover:scale-105 transition-all">
                                <Plus size={30} /> Add Transaction
                            </button>
                        )}
                        {activeTab === 'sales' && (
                            <button onClick={() => setIsSaleModalOpen(true)} className="bg-[#088178] text-white px-6 py-3.5 rounded-xl font-bold shadow-xl shadow-teal-900/10 flex items-center gap-2 hover:scale-105 transition-all">
                                <Plus size={20} /> Add Sale
                            </button>
                        )}
                        {activeTab === 'purchases' && (
                            <button onClick={() => setIsPurchaseModalOpen(true)} className="bg-[#088178] text-white px-6 py-3.5 rounded-xl font-bold shadow-xl shadow-teal-900/10 flex items-center gap-2 hover:scale-105 transition-all">
                                <Plus size={20} /> Add Purchase
                            </button>
                        )}

                        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                            <button onClick={() => exportToExcel(activeTab === 'inventory' ? products : (activeTab === 'sales' ? sales : transactions), activeTab)} className="p-3 hover:bg-gray-50 text-gray-500 rounded-xl transition-colors" title="Export Excel"><FileSpreadsheet size={20} /></button>
                            <button className="p-3 hover:bg-gray-50 text-gray-500 rounded-xl transition-colors" title="Print Report"><Printer size={20} /></button>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#088178] border-opacity-30"></div>
                        <p className="text-gray-400 font-bold animate-pulse">Loading..</p>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>

                        {activeTab === 'overview' && (
                            <div className="space-y-5">
                                {/* Stats Cards */}
                                <div className="grid grid-cols md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { label: "Total Sales", val: `৳${stats.totalSales || 0}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
                                        { label: "Cash Box", val: `৳${stats.totalCashBox || 0}`, icon: Banknote, color: "text-blue-600", bg: "bg-blue-50" },
                                        { label: "Total Profit", val: `৳${stats.totalProfit || 0}`, icon: ArrowUpRight, color: "text-teal-600", bg: "bg-teal-50" },
                                        { label: "Total Loss", val: `৳${stats.totalLoss || 0}`, icon: ArrowDownRight, color: "text-red-600", bg: "bg-red-50" },
                                        { label: "Inventory Value", val: `৳${stats.totalStockValue || 0}`, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
                                        { label: "Total Cost", val: `৳${stats.totalCost || 0}`, icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-50" },
                                        { label: "Active Users", val: stats.activeUsers || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
                                        { label: "Products", val: stats.totalProducts || 0, icon: Package, color: "text-gray-600", bg: "bg-gray-100" },
                                    ].map((s, i) => (
                                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-green-600 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                                            <div className="flex items-start justify-between relative z-10">
                                                <div>
                                                    <h3 className="text-gray-600 font-black uppercase text-[10px] tracking-[0.15em] mb-2">{s.label}</h3>
                                                    <p className="text-xl font-black text-black">{s.val}</p>
                                                </div>
                                                <div className={`p-3 rounded-2xl ${s.bg} ${s.color} group-hover:scale-110 transition-transform`}>
                                                    <s.icon size={22} />
                                                </div>
                                            </div>
                                            <div className={`absolute -bottom-4 -right-4 w-20 h-20 ${s.bg} opacity-10 rounded-full blur-2xl`}></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Charts Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-8">
                                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><BarChart3 size={20} className="text-[#088178]" /> Weekly Sales Revenue</h3>
                                            <select className="bg-gray-50 text-xs font-bold border-none rounded-xl px-3 py-2 outline-none">
                                                <option>Last 7 Days</option>
                                                <option>Last 30 Days</option>
                                            </select>
                                        </div>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={salesChartData}>
                                                    <defs>
                                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#088178" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#088178" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 700 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 700 }} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800 }}
                                                        cursor={{ stroke: '#088178', strokeWidth: 2, strokeDasharray: '5 5' }}
                                                    />
                                                    <Area type="monotone" dataKey="amount" stroke="#088178" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
                                        <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><PieChart size={20} className="text-orange-500" /> Top Selling Efficiency</h3>
                                        <div className="flex-1 min-h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={topProductChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={10} dataKey="value">
                                                        {topProductChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            {topProductChartData.map((c, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                                    <span className="text-xs font-bold text-gray-500 truncate max-w-[120px]">{c.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Advanced Charts Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
                                        <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><BarChart3 size={20} className="text-blue-500" /> Monthly Sales (12 Mo)</h3>
                                        <div className="flex-1 min-h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={monthlySalesChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} />
                                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800 }} cursor={{ fill: 'rgba(54, 162, 235, 0.05)' }} />
                                                    <Bar dataKey="amount" fill="#36a2eb" radius={[4, 4, 0, 0]} barSize={30} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
                                        <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-2"><Package size={20} className="text-indigo-500" /> Inventory Aging Alerts {`> 30 Days`}</h3>
                                        <div className="flex-1 overflow-x-auto">
                                            {inventoryAgingData.length === 0 ? (
                                                <div className="flex items-center justify-center h-full text-sm font-bold text-gray-400">No aging inventory detected.</div>
                                            ) : (
                                                <table className="w-full text-left">
                                                    <thead className="text-[10px] text-gray-400 uppercase font-bold tracking-widest border-b border-gray-100">
                                                        <tr>
                                                            <th className="pb-4">Product Name</th>
                                                            <th className="pb-4">Stock</th>
                                                            <th className="pb-4">Created Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {inventoryAgingData.map((item) => (
                                                            <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="py-4 font-bold text-gray-800 flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100"><img src={item.image} alt="pic" className="w-full h-full object-cover" /></div>
                                                                    {item.name.slice(0, 20)}...
                                                                </td>
                                                                <td className="py-4 font-black text-orange-500">{item.stock} unit</td>
                                                                <td className="py-4 text-xs font-bold text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'inventory' && (
                            <div className="bg-white rounded-[1rem] shadow-sm border border-green-600 overflow-hidden">
                                <div className="p-8 border-b border-green-600 flex justify-between items-center">
                                    <div className="relative w-full max-w-sm">
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search product name..." className="w-full bg-gray-200 border-black rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#088178]" />
                                        <Search className="absolute left-4 top-3 text-gray-300" size={18} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-gray-200 text-black rounded-xl font-bold text-xs hover:bg-gray-100 transition">Filter</button>
                                        <button className="px-4 py-2 bg-gray-200 text-black rounded-xl font-bold text-xs hover:bg-gray-100 transition">Delete Selected</button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-black text-[10px] uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-8 py-6">Product</th>
                                                <th className="px-8 py-6">Purchase Price</th>
                                                <th className="px-8 py-6">Selling Price</th>
                                                <th className="px-8 py-6 text-center">In Stock</th>
                                                <th className="px-8 py-6 text-center">Unit</th>
                                                <th className="px-8 py-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredProducts.map(p => (
                                                <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-4 py-4 flex items-center gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 bg-gray-50 rounded-xl p-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <img src={p.image} className="max-w-full max-h-full object-contain" onError={(e) => e.target.src = 'https://via.placeholder.com/60'} />
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-black text-large leading-tight mb-1">
                                                                    {p.liveStatus === 'live' && <span className="mr-1 inline-block" title="Live">🟢</span>}
                                                                    {p.liveStatus === 'issue' && <span className="mr-1 inline-block" title="Any Issue">🟡</span>}
                                                                    {p.liveStatus === 'not-available' && <span className="mr-1 inline-block" title="Not available for customer">🔴</span>}
                                                                    {p.name}
                                                                </div>
                                                                <div className="text-[10px] text-[#088178] uppercase tracking-wider">{p.category}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 font-bold text-gray-500">৳{p.purchasePrice || 0}</td>
                                                    <td className="px-8 py-6 font-black text-gray-900">৳{p.sellingPrice || p.price}</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${p.stock > 10 ? 'bg-green-50 text-green-600' : (p.stock > 0 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600')}`}>
                                                            {p.stock}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-center text-xs font-bold text-gray-400">{p.unit || 'পিস'}</td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex gap-2 justify-end opacity-100">
                                                            <button onClick={() => { setEditingItem(p); setProductForm({ ...p, sellingPrice: p.sellingPrice || p.price }); setIsProductModalOpen(true); }} className="p-2.5 text-[#088178] hover:bg-teal-50 rounded-xl transition-all"><Edit size={18} /></button>
                                                            <button className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'cashbox' && (
                            <div className="bg-white rounded-[1rem] shadow-sm border border-green-600 overflow-hidden">
                                <div className="p-8 border-b border-green-600 flex justify-between items-center">
                                    <h3 className="font-black text-lg text-gray-800">Transaction History</h3>
                                    <div className="flex gap-3">
                                        <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                            <p className="text-[8px] font-black uppercase text-green-600 mb-0.5">Total In</p>
                                            <p className="text-sm font-black text-green-900">৳{transactions.filter(t => t.type === 'Cash In').reduce((acc, curr) => acc + curr.amount, 0)}</p>
                                        </div>
                                        <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                                            <p className="text-[8px] font-black uppercase text-red-600 mb-0.5">Total Out</p>
                                            <p className="text-sm font-black text-red-900">৳{transactions.filter(t => t.type === 'Cash Out').reduce((acc, curr) => acc + curr.amount, 0)}</p>
                                        </div>
                                    </div>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 text-black text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-6">Reference/Desc</th>
                                            <th className="px-8 py-6 text-center">Type</th>
                                            <th className="px-8 py-6">Amount</th>
                                            <th className="px-8 py-6">Time</th>
                                            <th className="px-8 py-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {transactions.map(t => (
                                            <tr key={t._id} className="hover:bg-gray-50/50">
                                                <td className="px-8 py-6 font-bold text-gray-700">{t.description}</td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${t.type === 'Cash In' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{t.type}</span>
                                                </td>
                                                <td className="px-8 py-6 font-black text-gray-900">৳{t.amount}</td>
                                                <td className="px-8 py-6 text-xs text-gray-400 font-bold">{new Date(t.createdAt).toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right"><button className="text-gray-300 hover:text-red-500 "><Edit2 size={14} /></button><button className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'sales' && (
                            <div className="bg-white rounded-[1rem] shadow-sm border border-green-600 overflow-hidden">
                                <div className="p-8 border-b border-green-600"><h3 className="font-black text-lg text-gray-800">Direct Sales Records</h3></div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 text-black text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-6">Product</th>
                                            <th className="px-8 py-6 text-center">Qty</th>
                                            <th className="px-8 py-6">Total amt</th>
                                            <th className="px-8 py-6">Method</th>
                                            <th className="px-8 py-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sales.map(s => (
                                            <tr key={s._id} className="hover:bg-gray-50/50">
                                                <td className="px-8 py-6 font-black text-gray-800">{s.product?.name || 'Unknown'} <br /> <p className="px-8 py-2 text-xs text-gray-500">{s.notes}</p></td>

                                                <td className="px-8 py-6 text-center font-bold text-gray-500">{s.quantity}</td>
                                                <td className="px-8 py-6 font-black text-[#088178]">৳{s.totalAmount}</td>
                                                <td className="px-8 py-6 text-xs font-bold text-gray-400">{s.paymentMethod}</td>
                                                <td className="px-8 py-6 font-black text-[10px] uppercase text-green-600">{s.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'purchases' && (
                            <div className="bg-white rounded-[1rem] shadow-sm border border-green-600 overflow-hidden">
                                <div className="p-8 border-b border-green-600"><h3 className="font-black text-lg text-gray-800">Inventory Purchases</h3></div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 text-black text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-6">Product</th>
                                            <th className="px-8 py-6 text-center">Restocked Qty</th>
                                            <th className="px-8 py-6">Cost Amount</th>
                                            <th className="px-8 py-6">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {purchases.map(p => (
                                            <tr key={p._id} className="hover:bg-gray-50/50">
                                                <td className="px-8 py-6 font-black text-gray-800">{p.product?.name || 'Unknown'}</td>
                                                <td className="px-8 py-6 text-center font-bold text-gray-500">{p.quantity}</td>
                                                <td className="px-8 py-6 font-black text-blue-600">৳{p.totalAmount}</td>
                                                <td className="px-8 py-6 text-xs text-gray-400 font-bold">{new Date(p.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-green-600 overflow-hidden">
                                <div className="p-8 border-b border-green-600 flex justify-between items-center">
                                    <h3 className="font-black text-lg text-gray-800">Users</h3>
                                    <div className="text-xs font-bold text-[#088178] bg-teal-50 px-3 py-1 rounded-lg border border-teal-100">{users.length} Registered members</div>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 text-black text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-6">NAME</th>
                                            <th className="px-8 py-6">Email/Phone</th>
                                            <th className="px-8 py-6 text-center">Role</th>
                                            <th className="px-8 py-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-300">
                                        {users.map(u => (
                                            <tr key={u._id} className="hover:bg-gray-100/50 group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-[#088178]">{u.name.charAt(0)}</div>
                                                        <div>
                                                            <div className="font-black text-gray-800 text-sm whitespace-nowrap">{u.name}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {u._id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-xs font-bold text-gray-600">{u.email}</div>
                                                    <div className="text-[10px] text-gray-400">{u.phoneNumber}</div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>{u.role}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button onClick={() => { setEditingItem(u); setUserForm(u); setIsUserModalOpen(true); }} className="p-2 text-[#088178] hover:bg-green-100 rounded-lg transition-all"><Edit size={16} /></button>
                                                    <button disabled={u._id === currentUser._id} onClick={() => handleDeleteUser(u._id)} className={`p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all ${u._id === currentUser._id ? 'opacity-20 cursor-not-allowed' : ''}`}><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-[1rem] shadow-sm border border-green-600 overflow-hidden">
                                <div className="p-8 border-b border-green-600"><h3 className="font-black text-lg text-gray-800">Online Customer Orders</h3></div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 text-black text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-6">Transaction</th>
                                            <th className="px-8 py-6">Lifecycle</th>
                                            <th className="px-8 py-6 text-center">Logistics</th>
                                            <th className="px-8 py-6 text-right">Utility</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {orders.map(o => (
                                            <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-gray-800 text-sm">৳{o.totalPrice}</div>
                                                    <div className="text-[10px] font-bold text-gray-400">{o.items?.length || 0} Products Included</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-[10px] font-black uppercase bg-teal-50 text-[#088178] rounded-xl px-3 py-1.5 border border-teal-100">{o.status}</span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="text-[10px] font-bold text-gray-400 mb-1">{o.shippingAddress?.slice(0, 20)}...</div>
                                                    <div className={`text-[8px] font-black px-2 py-0.5 rounded-full inline-block ${o.isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{o.isPaid ? 'PAYMENT RECEIVED' : 'UNPAID COD'}</div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className="bg-gray-50 p-2.5 rounded-xl text-gray-400 hover:text-[#088178] transition-colors"><FileText size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </motion.div>
                )}
            </div>

            {/* --- Modals --- */}

            {/* Cash Box Modal */}
            <AnimatePresence>
                {isTransactionModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsTransactionModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-8 rounded-[2.5rem] shadow-2xl relative z-10 w-full max-w-md">
                            <h3 className="text-2xl font-black text-gray-900 mb-6">Cash Transaction</h3>
                            <form onSubmit={handleAddTransaction} className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Type</label>
                                    <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                                        {["Cash In", "Cash Out"].map(t => (
                                            <button type="button" key={t} onClick={() => setTransactionForm({ ...transactionForm, type: t })} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${transactionForm.type === t ? 'bg-[#088178] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Amount (৳)</label>
                                    <input required type="number" value={transactionForm.amount} onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-lg focus:ring-2 focus:ring-[#088178]" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Description</label>
                                    <textarea required value={transactionForm.description} onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" rows="3" placeholder="Note detail..."></textarea>
                                </div>
                                <button type="submit" className="w-full bg-[#088178] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-all">Capture Transaction</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Modal */}
            <AnimatePresence>
                {isProductModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsProductModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-10 rounded-[3rem] shadow-2xl relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-3xl font-black text-gray-900 leading-tight">{editingItem ? 'Edit Asset' : 'New Inventory'}</h3>
                                <button onClick={() => setIsProductModalOpen(false)} className="bg-gray-50 p-2.5 rounded-xl text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleProductSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-full">
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Product Information</label>
                                        <input required type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" placeholder="Formal name of product..." />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Purchase Price (৳)</label>
                                        <input required type="number" value={productForm.purchasePrice} onChange={(e) => setProductForm({ ...productForm, purchasePrice: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Selling Price (৳)</label>
                                        <input required type="number" value={productForm.sellingPrice} onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="text-[10px) font-black uppercase text-gray-400 block mb-2 tracking-widest">Inventory Unit</label>
                                        <select value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]">
                                            <option value="পিস">পিস</option>
                                            <option value="পিয়ার">পিয়ার</option>
                                            <option value="হালি">হালি</option>
                                            <option value="ডজন">ডজন</option>
                                            <option value="প্যাকেট">প্যাকেট</option>
                                            <option value="কেজি">কেজি</option>
                                            <option value="মিলিলিটার">মিলিলিটার</option>
                                            <option value="লিটার">লিটার</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Opening Stock</label>
                                        <input required type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Asset Category</label>
                                        <input required type="text" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" placeholder="Wearables, Shoes..." />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Visual Asset (URL)</label>
                                        <input required type="text" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" placeholder="Image link..." />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Live Status</label>
                                        <select value={productForm.liveStatus || 'live'} onChange={(e) => setProductForm({ ...productForm, liveStatus: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]">
                                            <option value="live">🟢 Live for customer</option>
                                            <option value="issue">🟡 Any issue</option>
                                            <option value="not-available">🔴 Not available (Inventory only)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-full">
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Detail Description</label>
                                        <textarea required value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" rows="3"></textarea>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#088178] text-white py-5 rounded-[1.5rem] font-black text-sm shadow-2xl shadow-teal-900/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 mt-4">
                                    <CheckCircle size={20} /> {editingItem ? 'Finalize Asset Updates' : 'Commit New Inventory'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Sale Modal */}
            <AnimatePresence>
                {isSaleModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSaleModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-8 rounded-[1rem] shadow-2xl relative z-10 w-full max-w-md">
                            <h3 className="text-xl font-black text-gray-900 mb-6">New Sale</h3>
                            <form onSubmit={handleAddSale} className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Select Product</label>
                                    <select value={saleForm.product} onChange={e => {
                                        const p = products.find(x => x._id === e.target.value);
                                        setSaleForm({ ...saleForm, product: e.target.value, totalAmount: (p?.sellingPrice || 0) * saleForm.quantity });
                                    }} className="w-full bg-gray-50 border-none rounded-xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" required>
                                        <option value="">-- Choose --</option>
                                        {products.map(p => <option key={p._id} value={p._id}>{p.name} (৳{p.sellingPrice})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Quantity</label>
                                        <input type="number" value={saleForm.quantity} onChange={e => {
                                            const p = products.find(x => x._id === saleForm.product);
                                            setSaleForm({ ...saleForm, quantity: e.target.value, totalAmount: (p?.sellingPrice || 0) * e.target.value });
                                        }} className="w-full bg-gray-50 border-none rounded-xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Total Bill (৳)</label>
                                        <input type="number" readOnly value={saleForm.totalAmount} className="w-full bg-teal-50 border-none rounded-xl py-4 px-6 font-black text-[#088178] text-sm outline-none" />
                                    </div>
                                </div>
                                {/* // */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Payment Method</label>
                                        <select name="paymentMethod" id="paymentMethod" value={saleForm.paymentMethod} onChange={e => setSaleForm({ ...saleForm, paymentMethod: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]">
                                            <option value="">-- Select --</option>
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="online">Online</option>
                                            <option value="due">Due</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Status</label>
                                        <select name="status" id="status" value={saleForm.status} onChange={e => setSaleForm({ ...saleForm, status: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]">
                                            <option value="">-- Select --</option>
                                            <option value="ordered">Ordered</option>
                                            <option value="pending">Pending</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="returned">Returned</option>
                                        </select>
                                    </div>
                                </div>
                                {/* // */}
                                <div className="grid">
                                    <div>
                                        {/* <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Additional Notes</label> */}
                                        <textarea id="notes" value={saleForm.notes} onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" rows="3" placeholder="Any extra details...">
                                        </textarea>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#088178] text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-all">Confirm Sale</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Purchase Modal */}
            <AnimatePresence>
                {isPurchaseModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsPurchaseModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-8 rounded-[2.5rem] shadow-2xl relative z-10 w-full max-w-md">
                            <h3 className="text-2xl font-black text-gray-900 mb-6">Restock Inventory</h3>
                            <form onSubmit={handleAddPurchase} className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Select Product</label>
                                    <select value={purchaseForm.product} onChange={e => {
                                        const p = products.find(x => x._id === e.target.value);
                                        setPurchaseForm({ ...purchaseForm, product: e.target.value, totalAmount: (p?.purchasePrice || 0) * purchaseForm.quantity });
                                    }} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" required>
                                        <option value="">-- Choose --</option>
                                        {products.map(p => <option key={p._id} value={p._id}>{p.name} (৳{p.purchasePrice})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Quantity</label>
                                        <input type="number" value={purchaseForm.quantity} onChange={e => {
                                            const p = products.find(x => x._id === purchaseForm.product);
                                            setPurchaseForm({ ...purchaseForm, quantity: e.target.value, totalAmount: (p?.purchasePrice || 0) * e.target.value });
                                        }} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#088178]" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Cost Bill (৳)</label>
                                        <input type="number" readOnly value={purchaseForm.totalAmount} className="w-full bg-orange-50 border-none rounded-2xl py-4 px-6 font-black text-orange-600 text-sm outline-none" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#041e42] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all">Record Purchase</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* User Edit Modal */}
            <AnimatePresence>
                {isUserModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsUserModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-8 rounded-[2.5rem] shadow-2xl relative z-10 w-full max-w-md">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-gray-900">Edit User Details</h3>
                                <button onClick={() => setIsUserModalOpen(false)} className="bg-gray-50 p-2.5 rounded-xl text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUserSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Full Name</label>
                                    <input required type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-3 px-5 font-bold text-sm focus:ring-2 focus:ring-[#088178]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Email Address</label>
                                    <input required type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-3 px-5 font-bold text-sm focus:ring-2 focus:ring-[#088178]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Phone Number</label>
                                    <input required type="text" value={userForm.phoneNumber} onChange={e => setUserForm({ ...userForm, phoneNumber: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-3 px-5 font-bold text-sm focus:ring-2 focus:ring-[#088178]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Role</label>
                                    <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-3 px-5 font-bold text-sm focus:ring-2 focus:ring-[#088178]">
                                        <option value="user">User</option>
                                        <option value="seller">Seller</option>
                                        <option value="admin">Admin</option>
                                        <option value="courier">Courier</option>
                                    </select>
                                </div>
                                {userForm.role === 'seller' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Shop Name</label>
                                            <input type="text" value={userForm.shopName || ''} onChange={e => setUserForm({ ...userForm, shopName: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl py-3 px-5 font-bold text-sm focus:ring-2 focus:ring-[#088178]" />
                                        </div>
                                    </>
                                )}
                                <button type="submit" className="w-full bg-[#088178] text-white py-4 mt-2 rounded-2xl font-black text-sm shadow-xl shadow-teal-900/20 hover:scale-[1.02] transition-all">Save Changes</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


        </div>
    );
};

export default AdminDashboard;
