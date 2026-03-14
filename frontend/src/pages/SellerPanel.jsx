import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Trash2, Edit, Search, Plus, X,
    Package, ShoppingCart, Users, LayoutDashboard, CheckCircle,
    Banknote, ShoppingBag, TrendingUp, BarChart3, PieChart,
    Printer, FileSpreadsheet, Eye, ArrowLeft, ArrowUpRight
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
        name: "", 
        sellingPrice: "", 
        purchasePrice: "", 
        description: "", 
        category: "General", 
        image: "", 
        stock: 0, 
        unit: "পিস", 
        sku: ""
    });
    
    const [transactionForm, setTransactionForm] = useState({
        type: "Cash In", 
        amount: "", 
        description: ""
    });
    
    const [saleForm, setSaleForm] = useState({
        product: "", 
        quantity: 1, 
        totalAmount: 0, 
        paymentMethod: "Cash", 
        notes: ""
    });
    
    const [purchaseForm, setPurchaseForm] = useState({
        product: "", 
        quantity: 1, 
        totalAmount: 0, 
        description: ""
    });

    useEffect(() => {
        fetchAllData();
    }, [activeTab]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            console.log('Fetching seller data for tab:', activeTab);
            
            const requests = [];
            
            // Always fetch stats
            requests.push(sellerAPI.getStats().catch(err => {
                console.error('Stats error:', err);
                return { data: { stats: { overview: {} } } };
            }));
            
            // Fetch based on active tab
            if (activeTab === 'products' || activeTab === 'inventory' || activeTab === 'overview') {
                requests.push(sellerAPI.getProducts().catch(err => {
                    console.error('Products error:', err);
                    return { data: { products: [] } };
                }));
            }
            
            if (activeTab === 'orders' || activeTab === 'overview') {
                requests.push(sellerAPI.getOrders().catch(err => {
                    console.error('Orders error:', err);
                    return { data: { orders: [] } };
                }));
            }
            
            if (activeTab === 'customers' || activeTab === 'overview') {
                requests.push(sellerAPI.getCustomers().catch(err => {
                    console.error('Customers error:', err);
                    return { data: { customers: [] } };
                }));
            }
            
            if (activeTab === 'transactions' || activeTab === 'cashbox') {
                requests.push(sellerAPI.getTransactions().catch(err => {
                    console.error('Transactions error:', err);
                    return { data: { transactions: [] } };
                }));
            }
            
            if (activeTab === 'sales') {
                requests.push(sellerAPI.getSales().catch(err => {
                    console.error('Sales error:', err);
                    return { data: { sales: [] } };
                }));
            }
            
            if (activeTab === 'purchases') {
                requests.push(sellerAPI.getPurchases().catch(err => {
                    console.error('Purchases error:', err);
                    return { data: { purchases: [] } };
                }));
            }
            
            const results = await Promise.all(requests);
            
            // Set stats (first response)
            if (results[0]?.data?.stats) {
                setStats(results[0].data.stats);
            }
            
            // Set other data based on responses
            results.forEach(res => {
                if (res?.data?.products) setProducts(res.data.products);
                if (res?.data?.orders) setOrders(res.data.orders);
                if (res?.data?.customers) setCustomers(res.data.customers);
                if (res?.data?.transactions) setTransactions(res.data.transactions);
                if (res?.data?.sales) setSales(res.data.sales);
                if (res?.data?.purchases) setPurchases(res.data.purchases);
            });
            
        } catch (error) {
            console.error("Data fetch error:", error);
            toast.error("Failed to fetch some data");
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = (data, fileName) => {
        try {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
            toast.success('Exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export');
        }
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        try {
            const response = await sellerAPI.createTransaction(transactionForm);
            if (response.data.success) {
                toast.success("Transaction added");
                setIsTransactionModalOpen(false);
                setTransactionForm({ type: "Cash In", amount: "", description: "" });
                fetchAllData();
            }
        } catch (error) {
            console.error('Transaction error:', error);
            toast.error(error.response?.data?.message || "Failed to add transaction");
        }
    };

    const handleAddSale = async (e) => {
        e.preventDefault();
        try {
            const response = await sellerAPI.createSale(saleForm);
            if (response.data.success) {
                toast.success("Sale recorded");
                setIsSaleModalOpen(false);
                setSaleForm({ product: "", quantity: 1, totalAmount: 0, paymentMethod: "Cash", notes: "" });
                fetchAllData();
            }
        } catch (error) {
            console.error('Sale error:', error);
            toast.error(error.response?.data?.message || "Failed to record sale");
        }
    };

    const handleAddPurchase = async (e) => {
        e.preventDefault();
        try {
            const response = await sellerAPI.createPurchase(purchaseForm);
            if (response.data.success) {
                toast.success("Purchase recorded");
                setIsPurchaseModalOpen(false);
                setPurchaseForm({ product: "", quantity: 1, totalAmount: 0, description: "" });
                fetchAllData();
            }
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error(error.response?.data?.message || "Failed to record purchase");
        }
    };

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
            
            let response;
            if (editingItem) {
                response = await sellerAPI.updateProduct(editingItem._id, data);
            } else {
                response = await sellerAPI.createProduct(data);
            }
            
            if (response.data.success) {
                toast.success(editingItem ? 'Product updated successfully' : 'Product created successfully');
                setIsProductModalOpen(false);
                setEditingItem(null);
                setProductForm({
                    name: "", sellingPrice: "", purchasePrice: "", description: "", 
                    category: "General", image: "", stock: 0, unit: "পিস", sku: ""
                });
                fetchAllData();
            }
        } catch (error) {
            console.error('Product operation error:', error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            const response = await sellerAPI.deleteProduct(productId);
            if (response.data.success) {
                toast.success("Product deleted successfully");
                fetchAllData();
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || "Failed to delete product");
        }
    };

    const overview = stats.overview || {};
    const salesChartData = (stats.salesChart || []).map(d => ({
        name: d._id,
        amount: d.sales || 0
    }));

    const topProductChartData = (stats.topProducts || []).map(p => ({
        name: p.product?.name?.slice(0, 15) || 'Unknown',
        value: p.totalSold || 0
    }));

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const COLORS = ['#088178', '#36a2eb', '#ffce56', '#ff6384', '#9966ff'];

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row w-full font-['Spartan']">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-[#041e42] text-white p-6 flex flex-col gap-5 md:min-h-screen">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-[#088178] p-2.5 rounded-2xl shadow-lg">
                        <LayoutDashboard size={24} />
                    </div>
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
                            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-[#088178] text-white shadow-lg' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
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
                            <button 
                                onClick={() => { 
                                    setIsProductModalOpen(true); 
                                    setEditingItem(null); 
                                    setProductForm({ 
                                        name: "", sellingPrice: "", purchasePrice: "", description: "", 
                                        category: "General", image: "", stock: 0, unit: "পিস", sku: "" 
                                    }); 
                                }} 
                                className="bg-[#088178] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all"
                            >
                                <Plus size={18} /> New Product
                            </button>
                        )}
                        {(activeTab === 'sales' || activeTab === 'purchases' || activeTab === 'cashbox') && (
                            <button 
                                onClick={() => {
                                    if (activeTab === 'sales') setIsSaleModalOpen(true);
                                    else if (activeTab === 'purchases') setIsPurchaseModalOpen(true);
                                    else setIsTransactionModalOpen(true);
                                }} 
                                className="bg-[#088178] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all"
                            >
                                <Plus size={18} /> Add {activeTab === 'cashbox' ? 'Entry' : activeTab.slice(0, -1)}
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                let data = [];
                                if (activeTab === 'inventory') data = products;
                                else if (activeTab === 'sales') data = sales;
                                else if (activeTab === 'purchases') data = purchases;
                                else if (activeTab === 'cashbox') data = transactions;
                                else if (activeTab === 'customers') data = customers;
                                else if (activeTab === 'orders') data = orders;
                                exportToExcel(data, activeTab);
                            }} 
                            className="p-3 bg-white border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50"
                        >
                            <FileSpreadsheet size={20} />
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#088178]"></div>
                        <p className="text-gray-400 font-medium">Loading...</p>
                    </div>
                ) : (
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: "Total Sales", val: `৳${overview.totalSales || 0}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
                                        { label: "Earnings", val: `৳${overview.totalEarnings || 0}`, icon: ArrowUpRight, color: "text-teal-600", bg: "bg-teal-50" },
                                        { label: "Orders", val: overview.totalOrders || 0, icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50" },
                                        { label: "Products", val: overview.totalProducts || 0, icon: Package, color: "text-gray-600", bg: "bg-gray-100" },
                                    ].map((s, i) => (
                                        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}>
                                                    <s.icon size={20} />
                                                </div>
                                            </div>
                                            <h3 className="text-gray-400 font-bold uppercase text-[9px] tracking-wider mb-1">{s.label}</h3>
                                            <p className="text-xl font-black text-gray-900">{s.val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2">
                                            <BarChart3 size={16} /> Sales Performance
                                        </h3>
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
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="amount" stroke="#088178" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-black text-gray-800 mb-6 flex items-center gap-2">
                                            <PieChart size={16} /> Top Products
                                        </h3>
                                        <div className="h-60">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RePieChart>
                                                    <Pie 
                                                        data={topProductChartData} 
                                                        innerRadius={60} 
                                                        outerRadius={80} 
                                                        paddingAngle={5} 
                                                        dataKey="value"
                                                    >
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
                                        <input 
                                            type="text" 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                            placeholder="Search products..." 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Product</th>
                                                <th className="px-6 py-4">Price</th>
                                                <th className="px-6 py-4">Stock</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredProducts.map(p => (
                                                <tr key={p._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img 
                                                                src={p.image || '/placeholder.png'} 
                                                                alt={p.name}
                                                                className="w-10 h-10 rounded-lg object-cover bg-gray-50"
                                                                onError={e => e.target.src = 'https://via.placeholder.com/40'} 
                                                            />
                                                            <div>
                                                                <div className="font-bold text-gray-900">{p.name}</div>
                                                                <div className="text-xs text-gray-500">{p.category}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">৳{p.sellingPrice || p.price}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            p.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {p.stock} {p.unit}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex gap-1 justify-end">
                                                            <button 
                                                                onClick={() => { 
                                                                    setEditingItem(p); 
                                                                    setProductForm({ 
                                                                        ...p, 
                                                                        sellingPrice: p.sellingPrice || p.price 
                                                                    }); 
                                                                    setIsProductModalOpen(true); 
                                                                }} 
                                                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteProduct(p._id)} 
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredProducts.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                        No products found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'cashbox' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-50">
                                    <h3 className="font-bold text-gray-800">Transaction History</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4">Type</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {transactions.map(t => (
                                                <tr key={t._id}>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{t.description}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            t.type === 'Cash In' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {t.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">৳{t.amount}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(t.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {transactions.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                        No transactions found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sales' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-50">
                                    <h3 className="font-bold text-gray-800">Sales Records</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Product</th>
                                                <th className="px-6 py-4">Qty</th>
                                                <th className="px-6 py-4">Total</th>
                                                <th className="px-6 py-4">Method</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {sales.map(s => (
                                                <tr key={s._id}>
                                                    <td className="px-6 py-4 font-medium text-gray-800">{s.product?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4">{s.quantity}</td>
                                                    <td className="px-6 py-4 font-bold text-teal-600">৳{s.totalAmount}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{s.paymentMethod}</td>
                                                </tr>
                                            ))}
                                            {sales.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                        No sales recorded
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'purchases' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-50">
                                    <h3 className="font-bold text-gray-800">Purchase Records</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Product</th>
                                                <th className="px-6 py-4">Qty</th>
                                                <th className="px-6 py-4">Cost</th>
                                                <th className="px-6 py-4">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {purchases.map(p => (
                                                <tr key={p._id}>
                                                    <td className="px-6 py-4 font-medium text-gray-800">{p.product?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4">{p.quantity}</td>
                                                    <td className="px-6 py-4 font-bold text-blue-600">৳{p.totalAmount}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(p.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {purchases.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                        No purchases recorded
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-50">
                                    <h3 className="font-bold text-gray-800">Customer Orders</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Order #</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">View</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {orders.map(o => (
                                                <tr key={o._id}>
                                                    <td className="px-6 py-4 font-mono text-sm">{o.orderNumber}</td>
                                                    <td className="px-6 py-4 font-bold">৳{o.totalPrice}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                            o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                            o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-2 bg-gray-50 rounded-lg text-gray-500 hover:text-teal-600 transition">
                                                            <Eye size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {orders.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                        No orders found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'customers' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-50">
                                    <h3 className="font-bold text-gray-800">My Customers</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Customer</th>
                                                <th className="px-6 py-4">Contact</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {customers.map(c => (
                                                <tr key={c._id}>
                                                    <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm">{c.email}</div>
                                                        <div className="text-xs text-gray-500">{c.phoneNumber}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {customers.length === 0 && (
                                                <tr>
                                                    <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                                                        No customers yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isProductModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
                            onClick={() => setIsProductModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }} 
                            className="bg-white p-8 rounded-2xl shadow-2xl relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-gray-900">
                                    {editingItem ? 'Edit Product' : 'Add New Product'}
                                </h3>
                                <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleProductSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Product Name *</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={productForm.name} 
                                            onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Purchase Price *</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={productForm.purchasePrice} 
                                            onChange={e => setProductForm({ ...productForm, purchasePrice: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Selling Price *</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={productForm.sellingPrice} 
                                            onChange={e => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={productForm.category} 
                                            onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Initial Stock *</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={productForm.stock} 
                                            onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                                        <select 
                                            value={productForm.unit} 
                                            onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        >
                                            <option value="পিস">পিস</option>
                                            <option value="কেজি">কেজি</option>
                                            <option value="লিটার">লিটার</option>
                                            <option value="ডজন">ডজন</option>
                                            <option value="প্যাকেট">প্যাকেট</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">SKU (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={productForm.sku} 
                                            onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Image URL *</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={productForm.image} 
                                            onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
                                        <textarea 
                                            required
                                            value={productForm.description} 
                                            onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full bg-[#088178] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition"
                                >
                                    {editingItem ? 'Update Product' : 'Create Product'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isSaleModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
                            onClick={() => setIsSaleModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }} 
                            className="bg-white p-8 rounded-2xl shadow-2xl relative z-10 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-gray-900">Record Sale</h3>
                                <button onClick={() => setIsSaleModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddSale} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Product *</label>
                                    <select 
                                        required 
                                        value={saleForm.product} 
                                        onChange={e => setSaleForm({ ...saleForm, product: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.name} (৳{p.sellingPrice || p.price})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Quantity *</label>
                                        <input 
                                            required 
                                            type="number" 
                                            min="1"
                                            value={saleForm.quantity} 
                                            onChange={e => {
                                                const qty = parseInt(e.target.value) || 1;
                                                const product = products.find(p => p._id === saleForm.product);
                                                const price = product?.sellingPrice || product?.price || 0;
                                                setSaleForm({ 
                                                    ...saleForm, 
                                                    quantity: qty,
                                                    totalAmount: price * qty
                                                });
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Total Amount *</label>
                                        <input 
                                            required 
                                            type="number" 
                                            value={saleForm.totalAmount} 
                                            onChange={e => setSaleForm({ ...saleForm, totalAmount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Payment Method</label>
                                    <select 
                                        value={saleForm.paymentMethod} 
                                        onChange={e => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="bkash">bKash</option>
                                        <option value="nagad">Nagad</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                                    <textarea 
                                        value={saleForm.notes} 
                                        onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full bg-[#088178] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition"
                                >
                                    Record Sale
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isPurchaseModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
                            onClick={() => setIsPurchaseModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }} 
                            className="bg-white p-8 rounded-2xl shadow-2xl relative z-10 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-gray-900">Restock Inventory</h3>
                                <button onClick={() => setIsPurchaseModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddPurchase} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Product *</label>
                                    <select 
                                        required 
                                        value={purchaseForm.product} 
                                        onChange={e => {
                                            const product = products.find(p => p._id === e.target.value);
                                            const price = product?.purchasePrice || 0;
                                            setPurchaseForm({ 
                                                ...purchaseForm, 
                                                product: e.target.value,
                                                totalAmount: price * purchaseForm.quantity
                                            });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.name} (৳{p.purchasePrice})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Quantity *</label>
                                        <input 
                                            required 
                                            type="number" 
                                            min="1"
                                            value={purchaseForm.quantity} 
                                            onChange={e => {
                                                const qty = parseInt(e.target.value) || 1;
                                                const product = products.find(p => p._id === purchaseForm.product);
                                                const price = product?.purchasePrice || 0;
                                                setPurchaseForm({ 
                                                    ...purchaseForm, 
                                                    quantity: qty,
                                                    totalAmount: price * qty
                                                });
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Total Cost *</label>
                                        <input 
                                            required 
                                            type="number" 
                                            value={purchaseForm.totalAmount} 
                                            onChange={e => setPurchaseForm({ ...purchaseForm, totalAmount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                    <textarea 
                                        value={purchaseForm.description} 
                                        onChange={e => setPurchaseForm({ ...purchaseForm, description: e.target.value })}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full bg-[#088178] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition"
                                >
                                    Record Purchase
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isTransactionModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
                            onClick={() => setIsTransactionModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }} 
                            className="bg-white p-8 rounded-2xl shadow-2xl relative z-10 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-gray-900">Cash Transaction</h3>
                                <button onClick={() => setIsTransactionModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddTransaction} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Transaction Type</label>
                                    <select 
                                        value={transactionForm.type} 
                                        onChange={e => setTransactionForm({ ...transactionForm, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="Cash In">Cash In (Income)</option>
                                        <option value="Cash Out">Cash Out (Expense)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Amount (৳) *</label>
                                    <input 
                                        required 
                                        type="number" 
                                        min="1"
                                        value={transactionForm.amount} 
                                        onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
                                    <textarea 
                                        required 
                                        value={transactionForm.description} 
                                        onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full bg-[#088178] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition"
                                >
                                    Add Transaction
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SellerPanel;