import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Trash2, Edit, Search, Plus, X,
    Package, ShoppingCart, Users, LayoutDashboard, CheckCircle,
    Banknote, ShoppingBag, TrendingUp, BarChart3, PieChart,
    Printer, FileSpreadsheet, StoreIcon, Eye, ArrowLeft, ArrowUpRight
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import { sellerAPI } from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';

const SellerPanel = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState({});
    const [customers, setCustomers] = useState([]);
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

    const [productForm, setProductForm] = useState({
        name: "", sellingPrice: "", purchasePrice: "", description: "", category: "General", image: "", stock: 0, unit: "পিস", sku: ""
    });
    const [transactionForm, setTransactionForm] = useState({
        type: "Cash In", amount: "", description: ""
    });
    const [saleForm, setSaleForm] = useState({
        product: "", quantity: 1, totalAmount: 0, paymentMethod: "Cash", notes: ""
    });
    const [purchaseForm, setPurchaseForm] = useState({
        product: "", quantity: 1, totalAmount: 0, description: ""
    });

    useEffect(() => {
        fetchAllData();
    }, [activeTab]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [sRes, cRes, pRes, oRes, tRes, slRes, puRes] = await Promise.all([
                sellerAPI.getStats(),
                sellerAPI.getCustomers(),
                sellerAPI.getProducts(),
                sellerAPI.getOrders(),
                sellerAPI.getTransactions(),
                sellerAPI.getSales(),
                sellerAPI.getPurchases()
            ]);

            setStats(sRes.data.stats || {});
            setCustomers(cRes.data.customers || []);
            setProducts(pRes.data.products || []);
            setOrders(oRes.data.orders || []);
            setTransactions(tRes.data.transactions || []);
            setSales(slRes.data.sales || []);
            setPurchases(puRes.data.purchases || []);
        } catch (error) {
            console.error("Data fetch error:", error);
            // Error is handled by api.js interceptors (toast)
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = (data, fileName) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        try {
            await sellerAPI.createTransaction(transactionForm);
            toast.success("Transaction added");
            setIsTransactionModalOpen(false);
            setTransactionForm({ type: "Cash In", amount: "", description: "" });
            fetchAllData();
        } catch (error) { }
    };

    const handleAddSale = async (e) => {
        e.preventDefault();
        try {
            await sellerAPI.createSale(saleForm);
            toast.success("Sale recorded");
            setIsSaleModalOpen(false);
            setSaleForm({ product: "", quantity: 1, totalAmount: 0, paymentMethod: "Cash", notes: "" });
            fetchAllData();
        } catch (error) { }
    };

    const handleAddPurchase = async (e) => {
        e.preventDefault();
        try {
            await sellerAPI.createPurchase(purchaseForm);
            toast.success("Purchase recorded");
            setIsPurchaseModalOpen(false);
            setPurchaseForm({ product: "", quantity: 1, totalAmount: 0, description: "" });
            fetchAllData();
        } catch (error) { }
    };

// Update the handleProductSubmit function in SellerPanel.jsx

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
    
    console.log('Submitting seller product:', data);
    
    if (editingItem) {
      const response = await sellerAPI.updateProduct(editingItem._id, data);
      if (response.data.success) {
        toast.success('Product updated successfully');
      }
    } else {
      const response = await sellerAPI.createProduct(data);
      if (response.data.success) {
        toast.success('Product created successfully');
      }
    }

    setIsProductModalOpen(false);
    setEditingItem(null);
    setProductForm({
      name: "", sellingPrice: "", purchasePrice: "", description: "", 
      category: "General", image: "", stock: 0, unit: "পিস", sku: ""
    });
    fetchAllData();
  } catch (error) {
    console.error('Product operation error:', error);
    toast.error(error.response?.data?.message || 'Operation failed');
  }
};

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await sellerAPI.deleteProduct(productId);
            toast.success("Product deleted");
            fetchAllData();
        } catch (error) { }
    };

    const overview = stats.overview || {};
    const salesChartData = (stats.salesChart || []).map(d => ({
        name: d._id,
        amount: d.sales || 0
    }));

    const topProductChartData = (stats.topProducts || []).map(p => ({
        name: p.product?.name || 'Unknown',
        value: p.totalSold || 0
    }));

    const COLORS = ['#088178', '#36a2eb', '#ffce56', '#ff6384', '#9966ff'];

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row w-full font-['Spartan']">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-[#041e42] text-white p-6 flex flex-col gap-5 md:min-h-screen">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-[#088178] p-2.5 rounded-2xl shadow-lg"><LayoutDashboard size={24} /></div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight">PARASH FERI</h2>
                        <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Seller Panel</p>
                    </div>
                </div>

                <nav className="flex flex-col gap-1">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'inventory', icon: Package, label: 'Inventory' },
                        { id: 'sales', icon: TrendingUp, label: 'Sales' },
                        { id: 'purchases', icon: ShoppingBag, label: 'Purchases' },
                        { id: 'cashbox', icon: Banknote, label: 'Cash Box' },
                        { id: 'orders', icon: ShoppingCart, label: 'Orders' },
                        { id: 'customers', icon: Users, label: 'Customers' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-[#088178] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10">
                    <Link to="/profile" className="flex items-center gap-3 text-gray-400 hover:text-white font-bold text-sm mb-4">
                        <User size={16} /> My Profile
                    </Link>
                    <Link to="/" className="flex items-center gap-3 text-gray-400 hover:text-white font-bold text-sm">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 md:p-10 overflow-x-hidden">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 capitalize tracking-tight">{activeTab}</h1>
                        <p className="text-gray-400 font-medium text-sm">Welcome back, {currentUser?.name}</p>
                    </div>

                    <div className="flex gap-2">
                        {activeTab === 'inventory' && (
                            <button onClick={() => { setIsProductModalOpen(true); setEditingItem(null); setProductForm({ name: "", sellingPrice: "", purchasePrice: "", description: "", category: "General", image: "", stock: 0, unit: "পিস", sku: "" }); }} className="bg-[#088178] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all">
                                <Plus size={18} /> New Product
                            </button>
                        )}
                        {(activeTab === 'sales' || activeTab === 'purchases' || activeTab === 'cashbox') && (
                            <button onClick={() => {
                                if (activeTab === 'sales') setIsSaleModalOpen(true);
                                else if (activeTab === 'purchases') setIsPurchaseModalOpen(true);
                                else setIsTransactionModalOpen(true);
                            }} className="bg-[#088178] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all">
                                <Plus size={18} /> Add {activeTab === 'cashbox' ? 'Entry' : activeTab.slice(0, -1)}
                            </button>
                        )}
                        <button onClick={() => exportToExcel(products, activeTab)} className="p-3 bg-white border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50"><FileSpreadsheet size={20} /></button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#088178]"></div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: "Total Sales", val: `৳${overview.totalSales || 0}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
                                        { label: "Earnings", val: `৳${overview.totalEarnings || 0}`, icon: ArrowUpRight, color: "text-teal-600", bg: "bg-teal-50" },
                                        { label: "Orders", val: overview.totalOrders || 0, icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50" },
                                        { label: "Products", val: overview.totalProducts || 0, icon: Package, color: "text-gray-600", bg: "bg-gray-100" },
                                    ].map((s, i) => (
                                        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}><s.icon size={20} /></div>
                                            </div>
                                            <h3 className="text-gray-400 font-bold uppercase text-[9px] tracking-wider mb-1">{s.label}</h3>
                                            <p className="text-xl font-black text-gray-900">{s.val}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2"><BarChart3 size={16} /> Sales Performance</h3>
                                        <div className="h-60">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={salesChartData}>
                                                    <defs>
                                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#088178" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#088178" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="amount" stroke="#088178" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2"><PieChart size={16} /> Best Sellers</h3>
                                        <div className="h-60">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RePieChart>
                                                    <Pie data={topProductChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                        {topProductChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </RePieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'inventory' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-50 flex gap-4">
                                    <div className="relative flex-1">
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search inventory..." className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium" />
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    </div>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                                        <tr>
                                            <th className="px-6 py-4">Product</th>
                                            <th className="px-6 py-4">Price</th>
                                            <th className="px-6 py-4">Stock</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                            <tr key={p._id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={p.image} className="w-10 h-10 rounded-lg object-cover" onError={e => e.target.src = 'https://via.placeholder.com/40'} />
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                                                            <div className="text-[9px] text-gray-400 uppercase font-black">{p.category}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-sm">৳{p.sellingPrice || p.price}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black ${p.stock > 5 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.stock} {p.unit}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        <button onClick={() => { setEditingItem(p); setProductForm(p); setIsProductModalOpen(true); }} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeleteProduct(p._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'cashbox' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                                        <tr>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {transactions.map(t => (
                                            <tr key={t._id}>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-700">{t.description}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${t.type === 'Cash In' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{t.type}</span>
                                                </td>
                                                <td className="px-6 py-4 font-black">৳{t.amount}</td>
                                                <td className="px-6 py-4 text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'sales' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                                        <tr>
                                            <th className="px-6 py-4">Product</th>
                                            <th className="px-6 py-4">Qty</th>
                                            <th className="px-6 py-4">Total</th>
                                            <th className="px-6 py-4">Method</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sales.map(s => (
                                            <tr key={s._id}>
                                                <td className="px-6 py-4 font-bold text-sm text-gray-800">{s.product?.name || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-sm">{s.quantity}</td>
                                                <td className="px-6 py-4 font-black text-teal-600">৳{s.totalAmount}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-gray-400">{s.paymentMethod}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'purchases' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                                        <tr>
                                            <th className="px-6 py-4">Product</th>
                                            <th className="px-6 py-4">Qty</th>
                                            <th className="px-6 py-4">Cost</th>
                                            <th className="px-6 py-4">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {purchases.map(p => (
                                            <tr key={p._id}>
                                                <td className="px-6 py-4 font-bold text-sm text-gray-800">{p.product?.name || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-sm">{p.quantity}</td>
                                                <td className="px-6 py-4 font-black text-blue-600">৳{p.totalAmount}</td>
                                                <td className="px-6 py-4 text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                                        <tr>
                                            <th className="px-6 py-4">Order #</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">View</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {orders.map(o => (
                                            <tr key={o._id}>
                                                <td className="px-6 py-4 font-bold text-sm">{o.orderNumber}</td>
                                                <td className="px-6 py-4 font-black">৳{o.totalPrice}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded bg-teal-50 text-teal-600 text-[9px] font-black uppercase">{o.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-teal-600"><Eye size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'customers' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                                        <tr>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Contact</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {customers.map(c => (
                                            <tr key={c._id}>
                                                <td className="px-6 py-4 font-bold text-sm">{c.name}</td>
                                                <td className="px-6 py-4 text-xs text-gray-500">{c.email} <br /> {c.phoneNumber}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isProductModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white p-8 rounded-[2rem] shadow-2xl relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-2xl font-black mb-6">{editingItem ? 'Edit Product' : 'New Product'}</h3>
                            <form onSubmit={handleProductSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Product Name</label>
                                        <input required type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Purchase Price</label>
                                        <input required type="number" value={productForm.purchasePrice} onChange={e => setProductForm({ ...productForm, purchasePrice: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Selling Price</label>
                                        <input required type="number" value={productForm.sellingPrice} onChange={e => setProductForm({ ...productForm, sellingPrice: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Category</label>
                                        <input required type="text" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Initial Stock</label>
                                        <input required type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Image URL</label>
                                        <input required type="text" value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold uppercase text-gray-400">Description</label>
                                        <textarea required value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" rows="3"></textarea>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#088178] text-white py-4 rounded-xl font-bold">{editingItem ? 'Save Changes' : 'Create Product'}</button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isSaleModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSaleModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white p-8 rounded-[2rem] shadow-2xl relative z-10 w-full max-w-md">
                            <h3 className="text-xl font-black mb-6">New Sale</h3>
                            <form onSubmit={handleAddSale} className="space-y-4">
                                <select required value={saleForm.product} onChange={e => setSaleForm({ ...saleForm, product: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold">
                                    <option value="">Select Product</option>
                                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                                <div className="grid grid-cols-2 gap-4">
                                    <input required type="number" placeholder="Qty" value={saleForm.quantity} onChange={e => setSaleForm({ ...saleForm, quantity: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                    <input required type="number" placeholder="Total" value={saleForm.totalAmount} onChange={e => setSaleForm({ ...saleForm, totalAmount: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                </div>
                                <textarea placeholder="Notes" value={saleForm.notes} onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" rows="2"></textarea>
                                <button type="submit" className="w-full bg-[#088178] text-white py-4 rounded-xl font-bold">Confirm Sale</button>
                            </form>
                        </motion.div>
                    </div>
                )}
                {isPurchaseModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPurchaseModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white p-8 rounded-[2rem] shadow-2xl relative z-10 w-full max-w-md">
                            <h3 className="text-xl font-black mb-6">Inventory Restock</h3>
                            <form onSubmit={handleAddPurchase} className="space-y-4">
                                <select required value={purchaseForm.product} onChange={e => setPurchaseForm({ ...purchaseForm, product: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold">
                                    <option value="">Select Product</option>
                                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                                <div className="grid grid-cols-2 gap-4">
                                    <input required type="number" placeholder="Qty" value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                    <input required type="number" placeholder="Cost" value={purchaseForm.totalAmount} onChange={e => setPurchaseForm({ ...purchaseForm, totalAmount: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                </div>
                                <button type="submit" className="w-full bg-[#088178] text-white py-4 rounded-xl font-bold">Record Purchase</button>
                            </form>
                        </motion.div>
                    </div>
                )}
                {isTransactionModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsTransactionModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white p-8 rounded-[2rem] shadow-2xl relative z-10 w-full max-w-md">
                            <h3 className="text-xl font-black mb-6">Cash Box Entry</h3>
                            <form onSubmit={handleAddTransaction} className="space-y-4">
                                <select value={transactionForm.type} onChange={e => setTransactionForm({ ...transactionForm, type: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold">
                                    <option value="Cash In">Cash In</option>
                                    <option value="Cash Out">Cash Out</option>
                                </select>
                                <input required type="number" placeholder="Amount" value={transactionForm.amount} onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" />
                                <textarea required placeholder="Description" value={transactionForm.description} onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold" rows="2"></textarea>
                                <button type="submit" className="w-full bg-[#088178] text-white py-4 rounded-xl font-bold">Add Entry</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SellerPanel;