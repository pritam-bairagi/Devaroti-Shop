import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Trash2, Edit, Search, ArrowLeft, Plus, X,
    Package, ShoppingCart, Users, LayoutDashboard, CheckCircle,
    Banknote, ShoppingBag, FileText, Download, BarChart3, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownRight, Printer, FileSpreadsheet,
    StoreIcon, Edit2, RefreshCw, Filter, Calendar, DollarSign,
    Eye, Check, AlertCircle, Clock, CreditCard, Wallet,
    PieChart as PieChartIcon, Activity, TrendingUp as TrendingUpIcon
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import { adminAPI, productAPI } from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
    ComposedChart, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
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
    const [dateRange, setDateRange] = useState("month");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
    const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
    const [orderUpdateForm, setOrderUpdateForm] = useState({
        status: "",
        paymentStatus: "",
        trackingNumber: "",
        courier: "",
        adminNotes: ""
    });

    // Form States
    const [editingItem, setEditingItem] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const [productForm, setProductForm] = useState({
        name: "", 
        sellingPrice: "", 
        purchasePrice: "", 
        description: "", 
        category: "General", 
        image: "", 
        stock: 0, 
        unit: "পিস", 
        liveStatus: "live",
        brand: "",
        sku: ""
    });
    
    const [transactionForm, setTransactionForm] = useState({
        type: "Cash In", 
        amount: "", 
        description: "",
        category: "sales",
        paymentMethod: "Cash"
    });
    
    const [saleForm, setSaleForm] = useState({
        product: "", 
        quantity: 1, 
        totalAmount: 0, 
        paymentMethod: "Cash", 
        description: "",
        customerName: "",
        customerPhone: ""
    });
    
    const [purchaseForm, setPurchaseForm] = useState({
        product: "", 
        quantity: 1, 
        totalAmount: 0, 
        description: "",
        supplier: ""
    });

    const [userForm, setUserForm] = useState({
        name: "", 
        email: "", 
        phoneNumber: "", 
        address: "", 
        role: "user",
        isActive: true,
        isVerified: true
    });

    useEffect(() => {
        fetchAllData();
    }, [activeTab, dateRange]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            console.log('Fetching admin data for tab:', activeTab);
            
            const requests = [];
            
            // Always fetch stats with date range
            requests.push(adminAPI.getStats({ period: dateRange }).catch(err => {
                console.error('Stats error:', err);
                return { data: { stats: {} } };
            }));
            
            // Fetch based on active tab
            if (activeTab === 'users' || activeTab === 'overview') {
                requests.push(adminAPI.getUsers({ limit: 100 }).catch(err => {
                    console.error('Users error:', err);
                    return { data: { users: [] } };
                }));
            }
            
            if (activeTab === 'inventory' || activeTab === 'overview') {
                requests.push(adminAPI.getProducts({ limit: 100 }).catch(err => {
                    console.error('Products error:', err);
                    return { data: { products: [] } };
                }));
            }
            
            if (activeTab === 'orders' || activeTab === 'overview') {
                requests.push(adminAPI.getOrders({ limit: 100 }).catch(err => {
                    console.error('Orders error:', err);
                    return { data: { orders: [] } };
                }));
            }
            
            if (activeTab === 'cashbox' || activeTab === 'overview') {
                requests.push(adminAPI.getTransactions({ limit: 100 }).catch(err => {
                    console.error('Transactions error:', err);
                    return { data: { transactions: [] } };
                }));
            }
            
            if (activeTab === 'sales') {
                requests.push(adminAPI.getSales().catch(err => {
                    console.error('Sales error:', err);
                    return { data: { sales: [] } };
                }));
            }
            
            if (activeTab === 'purchases') {
                requests.push(adminAPI.getPurchases().catch(err => {
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
                if (res?.data?.users) setUsers(res.data.users);
                if (res?.data?.products) setProducts(res.data.products);
                if (res?.data?.orders) setOrders(res.data.orders);
                if (res?.data?.transactions) setTransactions(res.data.transactions);
                if (res?.data?.sales) setSales(res.data.sales);
                if (res?.data?.purchases) setPurchases(res.data.purchases);
            });
            
        } catch (error) {
            console.error('Fetch all data error:', error);
            toast.error("Failed to fetch some data");
        } finally {
            setLoading(false);
        }
    };

    // --- Export Utilities ---
    const exportToExcel = (data, fileName) => {
        try {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
            toast.success('Exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export');
        }
    };

    const exportToPDF = (headers, data, fileName, title) => {
        try {
            const doc = new jsPDF();
            doc.text(title, 14, 15);
            doc.autoTable({
                head: [headers],
                body: data.map(row => Object.values(row)),
                startY: 20,
            });
            doc.save(`${fileName}_${new Date().toISOString().slice(0,10)}.pdf`);
            toast.success('PDF exported successfully');
        } catch (error) {
            console.error('PDF export error:', error);
            toast.error('Failed to export PDF');
        }
    };

    // --- Order Handlers ---
    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsOrderDetailModalOpen(true);
    };

    const handleEditOrder = (order) => {
        setSelectedOrder(order);
        setOrderUpdateForm({
            status: order.status,
            paymentStatus: order.paymentStatus,
            trackingNumber: order.trackingNumber || "",
            courier: order.courier || "",
            adminNotes: order.adminNotes || ""
        });
        setIsEditOrderModalOpen(true);
    };

    const handleUpdateOrder = async (e) => {
        e.preventDefault();
        try {
            const response = await adminAPI.updateOrder(selectedOrder._id, orderUpdateForm);
            if (response.data.success) {
                toast.success("Order updated successfully");
                setIsEditOrderModalOpen(false);
                fetchAllData();
            }
        } catch (error) {
            console.error('Order update error:', error);
            toast.error(error.response?.data?.message || "Failed to update order");
        }
    };

    // --- Transaction Handlers ---
    const handleAddTransaction = async (e) => {
        e.preventDefault();
        try {
            const response = await adminAPI.createTransaction(transactionForm);
            if (response.data.success) {
                toast.success("Transaction added");
                setIsTransactionModalOpen(false);
                setTransactionForm({ 
                    type: "Cash In", 
                    amount: "", 
                    description: "",
                    category: "sales",
                    paymentMethod: "Cash"
                });
                fetchAllData();
            }
        } catch (error) {
            console.error('Transaction error:', error);
            toast.error(error.response?.data?.message || "Failed to add transaction");
        }
    };

    // --- Sale Handlers ---
    const handleAddSale = async (e) => {
        e.preventDefault();
        try {
            const response = await adminAPI.createSale(saleForm);
            if (response.data.success) {
                toast.success("Sale recorded");
                setIsSaleModalOpen(false);
                setSaleForm({ 
                    product: "", 
                    quantity: 1, 
                    totalAmount: 0, 
                    paymentMethod: "Cash", 
                    description: "",
                    customerName: "",
                    customerPhone: ""
                });
                fetchAllData();
            }
        } catch (error) {
            console.error('Sale error:', error);
            toast.error(error.response?.data?.message || "Failed to record sale");
        }
    };

    // --- Purchase Handlers ---
    const handleAddPurchase = async (e) => {
        e.preventDefault();
        try {
            const response = await adminAPI.createPurchase(purchaseForm);
            if (response.data.success) {
                toast.success("Purchase recorded");
                setIsPurchaseModalOpen(false);
                setPurchaseForm({ 
                    product: "", 
                    quantity: 1, 
                    totalAmount: 0, 
                    description: "",
                    supplier: ""
                });
                fetchAllData();
            }
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error(error.response?.data?.message || "Failed to record purchase");
        }
    };

    // --- Product Handlers ---
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        
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
            
            let response;
            if (editingItem) {
                response = await productAPI.updateProduct(editingItem._id, data);
            } else {
                response = await productAPI.createProduct(data);
            }
            
            if (response.data.success) {
                toast.success(editingItem ? 'Product updated successfully' : 'Product created successfully');
                setIsProductModalOpen(false);
                setEditingItem(null);
                setProductForm({
                    name: "", sellingPrice: "", purchasePrice: "", description: "", 
                    category: "General", image: "", stock: 0, unit: "পিস", 
                    liveStatus: "live", brand: "", sku: ""
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
            const response = await productAPI.deleteProduct(productId);
            if (response.data.success) {
                toast.success("Product deleted successfully");
                fetchAllData();
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || "Failed to delete product");
        }
    };

    // --- User Handlers ---
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const response = await adminAPI.updateUser(editingItem._id, userForm);
                if (response.data.success) {
                    toast.success("User updated successfully");
                    setIsUserModalOpen(false);
                    fetchAllData();
                }
            }
        } catch (error) {
            console.error('User update error:', error);
            toast.error(error.response?.data?.message || "Failed to update user");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const response = await adminAPI.deleteUser(userId);
            if (response.data.success) {
                toast.success("User deleted successfully");
                fetchAllData();
            }
        } catch (error) {
            console.error('Delete user error:', error);
            toast.error(error.response?.data?.message || "Failed to delete user");
        }
    };

    const handleApproveSeller = async (userId) => {
        try {
            const response = await adminAPI.approveSeller(userId);
            if (response.data.success) {
                toast.success("Seller approved successfully");
                fetchAllData();
            }
        } catch (error) {
            console.error('Approve seller error:', error);
            toast.error(error.response?.data?.message || "Failed to approve seller");
        }
    };

    // Chart Data Preparation
    const salesChartData = stats.dailyStats?.map(d => ({
        name: d._id,
        sales: d.sales || 0,
        revenue: d.revenue || 0,
        orders: d.orders || 0
    })) || [];

    const topProductChartData = stats.topProducts?.map(p => ({
        name: p.product?.name?.slice(0, 15) || 'Unknown',
        value: p.totalSold || 0,
        revenue: p.totalRevenue || 0
    })) || [];

    const monthlySalesChartData = stats.monthlySales?.map(m => ({
        name: m._id,
        sales: m.total || 0,
        profit: m.profit || 0
    })) || [];

    const categoryDistribution = products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
    }, {});

    const categoryChartData = Object.keys(categoryDistribution).map(key => ({
        name: key,
        value: categoryDistribution[key]
    }));

    const orderStatusData = [
        { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
        { name: 'Processing', value: orders.filter(o => o.status === 'processing').length },
        { name: 'Shipped', value: orders.filter(o => o.status === 'shipped').length },
        { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length },
        { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
    ];

    const inventoryAgingData = stats.inventoryAging || [];

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phoneNumber?.includes(searchQuery)
    );

    const filteredOrders = orders.filter(o =>
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const COLORS = ['#088178', '#36a2eb', '#ffce56', '#ff6384', '#9966ff', '#4bc0c0', '#ff9f40', '#c9cbcf'];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-700',
            'processing': 'bg-blue-100 text-blue-700',
            'shipped': 'bg-purple-100 text-purple-700',
            'delivered': 'bg-green-100 text-green-700',
            'cancelled': 'bg-red-100 text-red-700',
            'paid': 'bg-green-100 text-green-700',
            'unpaid': 'bg-yellow-100 text-yellow-700',
            'active': 'bg-green-100 text-green-700',
            'inactive': 'bg-gray-100 text-gray-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row w-full font-['Inter']">
            {/* Sidebar */}
            <div className="w-full md:w-72 bg-gradient-to-b from-[#041e42] to-[#0a2a5a] text-white p-6 flex flex-col gap-5 md:min-h-screen shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-[#088178] to-teal-400 p-3 rounded-2xl shadow-lg">
                        <LayoutDashboard size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight">PARASH FERI</h2>
                        <p className="text-[10px] text-teal-300 font-bold uppercase tracking-widest">Admin Panel v2.0</p>
                    </div>
                </div>
                
                <div className="pb-4 border-b border-white/10">
                    <Link to="/" className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-2 transition">
                        <StoreIcon size={16} /> 
                        <span className="font-medium">{currentUser?.name || 'Dashboard'}</span>
                    </Link>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Overview', color: 'text-blue-400' },
                        { id: 'inventory', icon: Package, label: 'Inventory', color: 'text-green-400' },
                        { id: 'sales', icon: TrendingUpIcon, label: 'Sales', color: 'text-purple-400' },
                        { id: 'purchases', icon: ShoppingBag, label: 'Purchases', color: 'text-orange-400' },
                        { id: 'cashbox', icon: Wallet, label: 'Cash Box', color: 'text-yellow-400' },
                        { id: 'orders', icon: ShoppingCart, label: 'Orders', color: 'text-pink-400' },
                        { id: 'users', icon: Users, label: 'Users', color: 'text-indigo-400' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-medium transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-gradient-to-r from-[#088178] to-teal-600 text-white shadow-lg shadow-teal-700/30 scale-[1.02]' 
                                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : tab.color} />
                            <span>{tab.label}</span>
                            {tab.id === 'orders' && orders.length > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {orders.filter(o => o.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="pt-6 border-t border-white/10">
                    <Link to="/" className="flex items-center gap-3 text-gray-400 hover:text-white font-medium text-sm transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
                        Back to Store
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 lg:p-8 overflow-x-hidden">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 capitalize">
                            {activeTab.replace(/([A-Z])/g, ' $1')}
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Clock size={14} />
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/* Date Range Filter */}
                        <select 
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#088178] outline-none"
                        >
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="quarter">Last 90 Days</option>
                            <option value="year">Last 12 Months</option>
                        </select>

                        {/* Action Buttons */}
                        {activeTab === 'inventory' && (
                            <button 
                                onClick={() => { 
                                    setIsProductModalOpen(true); 
                                    setEditingItem(null); 
                                }} 
                                className="bg-[#088178] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} /> Add Product
                            </button>
                        )}
                        {activeTab === 'cashbox' && (
                            <button 
                                onClick={() => setIsTransactionModalOpen(true)} 
                                className="bg-[#088178] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} /> Add Transaction
                            </button>
                        )}
                        {activeTab === 'sales' && (
                            <button 
                                onClick={() => setIsSaleModalOpen(true)} 
                                className="bg-[#088178] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} /> Record Sale
                            </button>
                        )}
                        {activeTab === 'purchases' && (
                            <button 
                                onClick={() => setIsPurchaseModalOpen(true)} 
                                className="bg-[#088178] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} /> Add Purchase
                            </button>
                        )}

                        {/* Export Dropdown */}
                        <div className="relative group">
                            <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
                                <Download size={18} /> Export
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 hidden group-hover:block z-50">
                                <button 
                                    onClick={() => {
                                        let data = [];
                                        if (activeTab === 'inventory') data = products;
                                        else if (activeTab === 'sales') data = sales;
                                        else if (activeTab === 'purchases') data = purchases;
                                        else if (activeTab === 'cashbox') data = transactions;
                                        else if (activeTab === 'users') data = users;
                                        else if (activeTab === 'orders') data = orders;
                                        exportToExcel(data, activeTab);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                    <FileSpreadsheet size={16} /> Excel
                                </button>
                                <button 
                                    onClick={() => {
                                        let headers = [];
                                        let data = [];
                                        if (activeTab === 'inventory') {
                                            headers = ['Name', 'Category', 'Price', 'Stock'];
                                            data = products.map(p => ({ name: p.name, category: p.category, price: p.price, stock: p.stock }));
                                        }
                                        exportToPDF(headers, data, activeTab, `${activeTab} Report`);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                    <FileText size={16} /> PDF
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={fetchAllData} 
                            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#088178] border-t-transparent"></div>
                        <p className="text-gray-500 font-medium">Loading dashboard data...</p>
                    </div>
                ) : (
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.5 }}
                    >
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { 
                                            label: "Total Revenue", 
                                            val: formatCurrency(stats.totalSales || 0), 
                                            icon: DollarSign, 
                                            change: "+12.5%",
                                            color: "text-green-600", 
                                            bg: "bg-green-50",
                                            border: "border-green-200"
                                        },
                                        { 
                                            label: "Cash Balance", 
                                            val: formatCurrency(stats.totalCashBox || 0), 
                                            icon: Wallet, 
                                            change: "+5.2%",
                                            color: "text-blue-600", 
                                            bg: "bg-blue-50",
                                            border: "border-blue-200"
                                        },
                                        { 
                                            label: "Total Profit", 
                                            val: formatCurrency(stats.totalProfit || 0), 
                                            icon: TrendingUp, 
                                            change: "+18.3%",
                                            color: "text-purple-600", 
                                            bg: "bg-purple-50",
                                            border: "border-purple-200"
                                        },
                                        { 
                                            label: "Total Orders", 
                                            val: stats.totalOrders || 0, 
                                            icon: ShoppingCart, 
                                            change: "+8.1%",
                                            color: "text-orange-600", 
                                            bg: "bg-orange-50",
                                            border: "border-orange-200"
                                        },
                                    ].map((s, i) => (
                                        <div key={i} className={`bg-white p-6 rounded-2xl shadow-sm border ${s.border} hover:shadow-xl transition-all group`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 rounded-xl ${s.bg}`}>
                                                    <s.icon size={24} className={s.color} />
                                                </div>
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                    {s.change}
                                                </span>
                                            </div>
                                            <p className="text-gray-500 text-sm font-medium mb-1">{s.label}</p>
                                            <p className="text-2xl font-black text-gray-900">{s.val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Charts Row 1 */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Sales Trend */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                <Activity size={20} className="text-[#088178]" /> 
                                                Sales Trend
                                            </h3>
                                            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5">
                                                <option>Daily</option>
                                                <option>Weekly</option>
                                                <option>Monthly</option>
                                            </select>
                                        </div>
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={salesChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Area yAxisId="left" type="monotone" dataKey="sales" fill="#088178" stroke="#088178" fillOpacity={0.2} />
                                                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#ff7300" strokeWidth={2} />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Top Products */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                            <PieChartIcon size={20} className="text-orange-500" /> 
                                            Top Products
                                        </h3>
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={topProductChartData.slice(0, 5)}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {topProductChartData.slice(0, 5).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts Row 2 */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Monthly Performance */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                            <BarChart3 size={20} className="text-blue-500" /> 
                                            Monthly Performance
                                        </h3>
                                        <div className="h-80">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={monthlySalesChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                    <YAxis tick={{ fontSize: 12 }} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="sales" fill="#088178" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="profit" fill="#36a2eb" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Inventory Aging */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                            <Package size={20} className="text-indigo-500" /> 
                                            Inventory Aging (&gt;30 days)
                                        </h3>
                                        <div className="space-y-4">
                                            {inventoryAgingData.slice(0, 5).map(item => (
                                                <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <img 
                                                            src={item.image || '/placeholder.png'} 
                                                            alt={item.name}
                                                            className="w-10 h-10 rounded-lg object-cover"
                                                        />
                                                        <div>
                                                            <p className="font-bold text-sm">{item.name.slice(0, 30)}...</p>
                                                            <p className="text-xs text-gray-500">Stock: {item.stock} units</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                                        {Math.floor((new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24))} days
                                                    </span>
                                                </div>
                                            ))}
                                            {inventoryAgingData.length === 0 && (
                                                <p className="text-center text-gray-500 py-8">No aging inventory</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Orders */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-gray-800">Recent Orders</h3>
                                        <button 
                                            onClick={() => setActiveTab('orders')}
                                            className="text-sm text-[#088178] hover:underline"
                                        >
                                            View All →
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Order #</th>
                                                    <th className="px-4 py-3 text-left">Customer</th>
                                                    <th className="px-4 py-3 text-left">Amount</th>
                                                    <th className="px-4 py-3 text-left">Status</th>
                                                    <th className="px-4 py-3 text-left">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {stats.recentOrders?.map(order => (
                                                    <tr key={order._id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-mono text-sm">{order.orderNumber}</td>
                                                        <td className="px-4 py-3">{order.user?.name}</td>
                                                        <td className="px-4 py-3 font-bold text-[#088178]">৳{order.totalPrice}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Inventory Tab */}
                        {activeTab === 'inventory' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="relative w-full md:w-96">
                                        <input 
                                            type="text" 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                            placeholder="Search products by name, SKU, category..." 
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <select className="px-4 py-3 border border-gray-200 rounded-xl text-sm">
                                            <option>All Categories</option>
                                            {Object.keys(categoryDistribution).map(cat => (
                                                <option key={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <select className="px-4 py-3 border border-gray-200 rounded-xl text-sm">
                                            <option>All Status</option>
                                            <option>Live</option>
                                            <option>Draft</option>
                                            <option>Archived</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Product</th>
                                                <th className="px-6 py-4 text-left">SKU</th>
                                                <th className="px-6 py-4 text-left">Category</th>
                                                <th className="px-6 py-4 text-right">Purchase</th>
                                                <th className="px-6 py-4 text-right">Selling</th>
                                                <th className="px-6 py-4 text-center">Stock</th>
                                                <th className="px-6 py-4 text-center">Status</th>
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
                                                                className="w-12 h-12 rounded-lg object-cover bg-gray-50"
                                                                onError={(e) => e.target.src = 'https://via.placeholder.com/48'}
                                                            />
                                                            <div>
                                                                <div className="font-bold text-gray-900">{p.name}</div>
                                                                <div className="text-xs text-gray-500">{p.brand || 'No Brand'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-sm">{p.sku || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm">{p.category}</td>
                                                    <td className="px-6 py-4 text-right font-medium">৳{p.purchasePrice || 0}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-[#088178]">৳{p.sellingPrice || p.price}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            p.stock > 10 ? 'bg-green-100 text-green-700' : 
                                                            p.stock > 0 ? 'bg-orange-100 text-orange-700' : 
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {p.stock} {p.unit}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                            p.liveStatus === 'live' ? 'bg-green-100 text-green-700' :
                                                            p.liveStatus === 'draft' ? 'bg-gray-100 text-gray-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {p.liveStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button 
                                                                onClick={() => { 
                                                                    setEditingItem(p); 
                                                                    setProductForm({ 
                                                                        ...p, 
                                                                        sellingPrice: p.sellingPrice || p.price 
                                                                    }); 
                                                                    setIsProductModalOpen(true); 
                                                                }} 
                                                                className="p-2 text-[#088178] hover:bg-teal-50 rounded-lg transition"
                                                                title="Edit"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteProduct(p._id)} 
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredProducts.length === 0 && (
                                                <tr>
                                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                        <Package size={48} className="mx-auto mb-4 text-gray-300" />
                                                        <p className="text-lg font-medium">No products found</p>
                                                        <button 
                                                            onClick={() => setIsProductModalOpen(true)}
                                                            className="mt-4 px-4 py-2 bg-[#088178] text-white rounded-lg text-sm"
                                                        >
                                                            Add Your First Product
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="relative w-full md:w-96">
                                        <input 
                                            type="text" 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                            placeholder="Search users by name, email, phone..." 
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-6 py-4 text-left">User</th>
                                                <th className="px-6 py-4 text-left">Contact</th>
                                                <th className="px-6 py-4 text-center">Role</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-center">Verified</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredUsers.map(u => (
                                                <tr key={u._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-[#088178] to-teal-400 rounded-full flex items-center justify-center text-white font-bold">
                                                                {u.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900">{u.name}</div>
                                                                <div className="text-xs text-gray-500">ID: {u._id.slice(-8)}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium">{u.email}</div>
                                                        <div className="text-xs text-gray-500">{u.phoneNumber}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                            u.role === 'seller' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {u.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {u.isVerified ? (
                                                            <Check size={18} className="text-green-500 mx-auto" />
                                                        ) : (
                                                            <X size={18} className="text-red-500 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button 
                                                                onClick={() => { 
                                                                    setEditingItem(u); 
                                                                    setUserForm({ 
                                                                        name: u.name, 
                                                                        email: u.email, 
                                                                        phoneNumber: u.phoneNumber,
                                                                        address: u.address || '',
                                                                        role: u.role,
                                                                        isActive: u.isActive,
                                                                        isVerified: u.isVerified
                                                                    }); 
                                                                    setIsUserModalOpen(true); 
                                                                }} 
                                                                className="p-2 text-[#088178] hover:bg-teal-50 rounded-lg transition"
                                                                title="Edit"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            {u.role === 'seller' && !u.isSellerApproved && (
                                                                <button 
                                                                    onClick={() => handleApproveSeller(u._id)} 
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                                    title="Approve Seller"
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                            )}
                                                            {u._id !== currentUser?._id && (
                                                                <button 
                                                                    onClick={() => handleDeleteUser(u._id)} 
                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
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

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="relative w-full md:w-96">
                                        <input 
                                            type="text" 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                            placeholder="Search orders by number, customer..." 
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Order #</th>
                                                <th className="px-6 py-4 text-left">Customer</th>
                                                <th className="px-6 py-4 text-left">Items</th>
                                                <th className="px-6 py-4 text-right">Total</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-center">Payment</th>
                                                <th className="px-6 py-4 text-left">Date</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredOrders.map(o => (
                                                <tr key={o._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-mono text-sm font-bold">{o.orderNumber}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium">{o.user?.name}</div>
                                                        <div className="text-xs text-gray-500">{o.user?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{o.items?.length || 0} items</td>
                                                    <td className="px-6 py-4 text-right font-bold text-[#088178]">৳{o.totalPrice}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(o.status)}`}>
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            o.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {o.isPaid ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(o.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button 
                                                                onClick={() => handleViewOrder(o)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                                title="View Details"
                                                            >
                                                                                                                                <Eye size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEditOrder(o)}
                                                                className="p-2 text-[#088178] hover:bg-teal-50 rounded-lg transition"
                                                                title="Edit Order"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                        <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                                                        <p className="text-lg font-medium">No orders found</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Cashbox Tab */}
                        {activeTab === 'cashbox' && (
                            <div className="space-y-6">
                                {/* Cash Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-200">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-100 rounded-xl">
                                                <ArrowUpRight size={24} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Total Cash In</p>
                                                <p className="text-2xl font-black text-gray-900">
                                                    ৳{transactions.filter(t => t.type === 'Cash In').reduce((sum, t) => sum + t.amount, 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-red-100 rounded-xl">
                                                <ArrowDownRight size={24} className="text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Total Cash Out</p>
                                                <p className="text-2xl font-black text-gray-900">
                                                    ৳{transactions.filter(t => t.type === 'Cash Out').reduce((sum, t) => sum + t.amount, 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-100 rounded-xl">
                                                <Wallet size={24} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Current Balance</p>
                                                <p className="text-2xl font-black text-gray-900">
                                                    ৳{stats.totalCashBox || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Transactions Table */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="font-black text-lg text-gray-800">Transaction History</h3>
                                        <button 
                                            onClick={() => setIsTransactionModalOpen(true)}
                                            className="bg-[#088178] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-opacity-90 transition"
                                        >
                                            <Plus size={16} /> New Transaction
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                                <tr>
                                                    <th className="px-6 py-4 text-left">Date</th>
                                                    <th className="px-6 py-4 text-left">Description</th>
                                                    <th className="px-6 py-4 text-center">Type</th>
                                                    <th className="px-6 py-4 text-center">Category</th>
                                                    <th className="px-6 py-4 text-right">Amount</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {transactions.map(t => (
                                                    <tr key={t._id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {new Date(t.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-gray-800">{t.description}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                t.type === 'Cash In' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {t.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm text-gray-500">{t.category}</td>
                                                        <td className="px-6 py-4 text-right font-bold text-gray-900">৳{t.amount}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                                t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                                {t.status || 'completed'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {transactions.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                            <Banknote size={48} className="mx-auto mb-4 text-gray-300" />
                                                            <p className="text-lg font-medium">No transactions yet</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sales Tab */}
                        {activeTab === 'sales' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="font-black text-lg text-gray-800">Sales Records</h3>
                                    <button 
                                        onClick={() => setIsSaleModalOpen(true)}
                                        className="bg-[#088178] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-opacity-90 transition"
                                    >
                                        <Plus size={16} /> Record Sale
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Date</th>
                                                <th className="px-6 py-4 text-left">Product</th>
                                                <th className="px-6 py-4 text-center">Quantity</th>
                                                <th className="px-6 py-4 text-right">Unit Price</th>
                                                <th className="px-6 py-4 text-right">Total</th>
                                                <th className="px-6 py-4 text-center">Payment</th>
                                                <th className="px-6 py-4 text-left">Customer</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {sales.map(s => (
                                                <tr key={s._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(s.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-800">
                                                        {s.product?.name || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">{s.quantity}</td>
                                                    <td className="px-6 py-4 text-right">৳{s.unitPrice}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-[#088178]">৳{s.totalAmount}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                            {s.paymentMethod}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="text-sm font-medium">{s.customerName || 'Walk-in'}</div>
                                                            <div className="text-xs text-gray-500">{s.customerPhone || ''}</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {sales.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                                        <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
                                                        <p className="text-lg font-medium">No sales recorded</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Purchases Tab */}
                        {activeTab === 'purchases' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="font-black text-lg text-gray-800">Purchase Records</h3>
                                    <button 
                                        onClick={() => setIsPurchaseModalOpen(true)}
                                        className="bg-[#088178] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-opacity-90 transition"
                                    >
                                        <Plus size={16} /> Add Purchase
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-6 py-4 text-left">Date</th>
                                                <th className="px-6 py-4 text-left">Product</th>
                                                <th className="px-6 py-4 text-center">Quantity</th>
                                                <th className="px-6 py-4 text-right">Unit Price</th>
                                                <th className="px-6 py-4 text-right">Total</th>
                                                <th className="px-6 py-4 text-left">Supplier</th>
                                                <th className="px-6 py-4 text-left">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {purchases.map(p => (
                                                <tr key={p._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(p.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-800">
                                                        {p.product?.name || 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">{p.quantity}</td>
                                                    <td className="px-6 py-4 text-right">৳{p.unitPrice}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-blue-600">৳{p.totalAmount}</td>
                                                    <td className="px-6 py-4 text-sm">{p.supplier || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{p.notes || '-'}</td>
                                                </tr>
                                            ))}
                                            {purchases.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                                        <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
                                                        <p className="text-lg font-medium">No purchases recorded</p>
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

            {/* Order Detail Modal */}
            <AnimatePresence>
                {isOrderDetailModalOpen && selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => setIsOrderDetailModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                                <h3 className="text-2xl font-black text-gray-900">Order Details</h3>
                                <button onClick={() => setIsOrderDetailModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Order Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs text-gray-500 mb-1">Order Number</p>
                                        <p className="font-mono font-bold">{selectedOrder.orderNumber}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs text-gray-500 mb-1">Order Date</p>
                                        <p className="font-bold">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs text-gray-500 mb-1">Status</p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <p className="text-xs text-gray-500 mb-1">Payment</p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedOrder.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {selectedOrder.isPaid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-800 mb-3">Customer Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Name</p>
                                            <p className="font-medium">{selectedOrder.user?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="font-medium">{selectedOrder.user?.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="font-medium">{selectedOrder.shippingAddress?.phoneNumber}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-800 mb-3">Shipping Address</h4>
                                    <p className="text-sm">
                                        {selectedOrder.shippingAddress?.fullName}<br />
                                        {selectedOrder.shippingAddress?.addressLine1}<br />
                                        {selectedOrder.shippingAddress?.addressLine2 && <>{selectedOrder.shippingAddress.addressLine2}<br /></>}
                                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}<br />
                                        {selectedOrder.shippingAddress?.country}
                                    </p>
                                </div>

                                {/* Order Items */}
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-800 mb-3">Order Items</h4>
                                    <table className="w-full">
                                        <thead className="text-xs text-gray-500">
                                            <tr>
                                                <th className="text-left py-2">Product</th>
                                                <th className="text-center py-2">Qty</th>
                                                <th className="text-right py-2">Price</th>
                                                <th className="text-right py-2">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedOrder.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-2 font-medium">{item.name}</td>
                                                    <td className="py-2 text-center">{item.quantity}</td>
                                                    <td className="py-2 text-right">৳{item.price}</td>
                                                    <td className="py-2 text-right font-bold">৳{item.price * item.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t border-gray-200">
                                            <tr>
                                                <td colSpan="3" className="pt-3 text-right font-bold">Subtotal:</td>
                                                <td className="pt-3 text-right font-bold">৳{selectedOrder.subtotal}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" className="text-right">Shipping:</td>
                                                <td className="text-right">৳{selectedOrder.shippingCost || 0}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" className="text-right">VAT:</td>
                                                <td className="text-right">৳{selectedOrder.vat || 0}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" className="text-right font-black">Total:</td>
                                                <td className="text-right font-black text-[#088178]">৳{selectedOrder.totalPrice}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Order Modal */}
            <AnimatePresence>
                {isEditOrderModalOpen && selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => setIsEditOrderModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-md"
                        >
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-black text-gray-900">Update Order #{selectedOrder.orderNumber}</h3>
                                <button onClick={() => setIsEditOrderModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateOrder} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                                    <select 
                                        value={orderUpdateForm.status} 
                                        onChange={(e) => setOrderUpdateForm({...orderUpdateForm, status: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Payment Status</label>
                                    <select 
                                        value={orderUpdateForm.paymentStatus} 
                                        onChange={(e) => setOrderUpdateForm({...orderUpdateForm, paymentStatus: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tracking Number</label>
                                    <input 
                                        type="text" 
                                        value={orderUpdateForm.trackingNumber} 
                                        onChange={(e) => setOrderUpdateForm({...orderUpdateForm, trackingNumber: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Courier</label>
                                    <input 
                                        type="text" 
                                        value={orderUpdateForm.courier} 
                                        onChange={(e) => setOrderUpdateForm({...orderUpdateForm, courier: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Admin Notes</label>
                                    <textarea 
                                        value={orderUpdateForm.adminNotes} 
                                        onChange={(e) => setOrderUpdateForm({...orderUpdateForm, adminNotes: e.target.value})}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full bg-[#088178] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition"
                                >
                                    Update Order
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Modal */}
            <AnimatePresence>
                {isProductModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => setIsProductModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                                <h3 className="text-2xl font-black text-gray-900">
                                    {editingItem ? 'Edit Product' : 'Add New Product'}
                                </h3>
                                <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Product Name *</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={productForm.name} 
                                            onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                            placeholder="Enter product name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Purchase Price *</label>
                                        <input 
                                            type="number" 
                                            required
                                            min="0"
                                            value={productForm.purchasePrice} 
                                            onChange={(e) => setProductForm({...productForm, purchasePrice: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Selling Price *</label>
                                        <input 
                                            type="number" 
                                            required
                                            min="0"
                                            value={productForm.sellingPrice} 
                                            onChange={(e) => setProductForm({...productForm, sellingPrice: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Category *</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={productForm.category} 
                                            onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                            placeholder="e.g., Electronics, Clothing"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Brand</label>
                                        <input 
                                            type="text" 
                                            value={productForm.brand} 
                                            onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                            placeholder="Brand name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">SKU</label>
                                        <input 
                                            type="text" 
                                            value={productForm.sku} 
                                            onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                            placeholder="Stock keeping unit"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Stock Quantity *</label>
                                        <input 
                                            type="number" 
                                            required
                                            min="0"
                                            value={productForm.stock} 
                                            onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                                        <select 
                                            value={productForm.unit} 
                                            onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
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
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Image URL *</label>
                                        <input 
                                            type="url" 
                                            required
                                            value={productForm.image} 
                                            onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
                                        <textarea 
                                            required
                                            value={productForm.description} 
                                            onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                                            rows="4"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                            placeholder="Product description..."
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                                        <select 
                                            value={productForm.liveStatus} 
                                            onChange={(e) => setProductForm({...productForm, liveStatus: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        >
                                            <option value="live">Live (Visible to customers)</option>
                                            <option value="draft">Draft (Hidden)</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full bg-[#088178] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition mt-4"
                                >
                                    {editingItem ? 'Update Product' : 'Create Product'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Transaction Modal */}
            <AnimatePresence>
                {isTransactionModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => setIsTransactionModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-md"
                        >
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-black text-gray-900">Add Transaction</h3>
                                <button onClick={() => setIsTransactionModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Transaction Type</label>
                                    <select 
                                        value={transactionForm.type} 
                                        onChange={(e) => setTransactionForm({...transactionForm, type: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="Cash In">Cash In (Income)</option>
                                        <option value="Cash Out">Cash Out (Expense)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                    <select 
                                        value={transactionForm.category} 
                                        onChange={(e) => setTransactionForm({...transactionForm, category: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="sales">Sales</option>
                                        <option value="purchases">Purchases</option>
                                        <option value="expenses">Expenses</option>
                                        <option value="withdrawals">Withdrawals</option>
                                        <option value="others">Others</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Amount (৳) *</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        value={transactionForm.amount} 
                                        onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Payment Method</label>
                                    <select 
                                        value={transactionForm.paymentMethod} 
                                        onChange={(e) => setTransactionForm({...transactionForm, paymentMethod: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank">Bank Transfer</option>
                                        <option value="bkash">bKash</option>
                                        <option value="nagad">Nagad</option>
                                        <option value="Card">Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
                                    <textarea 
                                        required
                                        value={transactionForm.description} 
                                        onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        placeholder="Transaction details..."
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

            {/* Sale Modal */}
            <AnimatePresence>
                {isSaleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => setIsSaleModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-md"
                        >
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-black text-gray-900">Record Sale</h3>
                                <button onClick={() => setIsSaleModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddSale} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Product *</label>
                                    <select 
                                        required 
                                        value={saleForm.product} 
                                        onChange={(e) => {
                                            const product = products.find(p => p._id === e.target.value);
                                            const price = product?.sellingPrice || product?.price || 0;
                                            setSaleForm({ 
                                                ...saleForm, 
                                                product: e.target.value,
                                                totalAmount: price * saleForm.quantity
                                            });
                                        }}
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
                                            onChange={(e) => {
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
                                            min="0"
                                            value={saleForm.totalAmount} 
                                            onChange={(e) => setSaleForm({ ...saleForm, totalAmount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Payment Method</label>
                                    <select 
                                        value={saleForm.paymentMethod} 
                                        onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="bkash">bKash</option>
                                        <option value="nagad">Nagad</option>
                                        <option value="Bank">Bank Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name</label>
                                    <input 
                                        type="text" 
                                        value={saleForm.customerName} 
                                        onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        placeholder="Customer name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Customer Phone</label>
                                    <input 
                                        type="text" 
                                        value={saleForm.customerPhone} 
                                        onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        placeholder="Customer phone"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                                    <textarea 
                                        value={saleForm.description} 
                                        onChange={(e) => setSaleForm({ ...saleForm, description: e.target.value })}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        placeholder="Additional notes..."
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
            </AnimatePresence>

            {/* Purchase Modal */}
            <AnimatePresence>
                {isPurchaseModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => setIsPurchaseModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-md"
                        >
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-black text-gray-900">Add Purchase</h3>
                                <button onClick={() => setIsPurchaseModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddPurchase} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Product *</label>
                                    <select 
                                        required 
                                        value={purchaseForm.product} 
                                        onChange={(e) => {
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
                                                {p.name} (Purchase: ৳{p.purchasePrice})
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
                                            onChange={(e) => {
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
                                            min="0"
                                            value={purchaseForm.totalAmount} 
                                            onChange={(e) => setPurchaseForm({ ...purchaseForm, totalAmount: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Supplier</label>
                                    <input 
                                        type="text" 
                                        value={purchaseForm.supplier} 
                                        onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        placeholder="Supplier name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                    <textarea 
                                        value={purchaseForm.description} 
                                        onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                        placeholder="Purchase notes..."
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
            </AnimatePresence>

            {/* User Edit Modal */}
            <AnimatePresence>
                {isUserModalOpen && editingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => setIsUserModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-white rounded-2xl shadow-2xl relative z-10 w-full max-w-md"
                        >
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-black text-gray-900">Edit User</h3>
                                <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Name *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={userForm.name} 
                                        onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={userForm.email} 
                                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                    <input 
                                        type="text" 
                                        value={userForm.phoneNumber} 
                                        onChange={(e) => setUserForm({...userForm, phoneNumber: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                                    <textarea 
                                        value={userForm.address} 
                                        onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                                    <select 
                                        value={userForm.role} 
                                        onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#088178] outline-none"
                                    >
                                        <option value="user">User</option>
                                        <option value="seller">Seller</option>
                                        <option value="admin">Admin</option>
                                        <option value="courier">Courier</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            checked={userForm.isActive} 
                                            onChange={(e) => setUserForm({...userForm, isActive: e.target.checked})}
                                            className="w-4 h-4 text-[#088178]"
                                        />
                                        <span className="text-sm">Active</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            checked={userForm.isVerified} 
                                            onChange={(e) => setUserForm({...userForm, isVerified: e.target.checked})}
                                            className="w-4 h-4 text-[#088178]"
                                        />
                                        <span className="text-sm">Verified</span>
                                    </label>
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full bg-[#088178] text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition"
                                >
                                    Update User
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;