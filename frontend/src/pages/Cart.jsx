import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Copy, RefreshCw 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from './Footer';
import { useAuth } from '../contexts/useAuth';
import { userAPI, orderAPI } from "../services/api";
import toast from 'react-hot-toast';

const Cart = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0); 
  const [couponDeliveryDiscount, setCouponDeliveryDiscount] = useState(0); 
  const [selectedItems, setSelectedItems] = useState([]);
  const [configs, setConfigs] = useState({ 
    bkash_number: '', nagad_number: '', rocket_number: '', bank_details: '',
    delivery_charge: 0, vat_percentage: 2,
    membership_bronze_discount: 0, membership_silver_discount: 0, membership_gold_discount: 0, membership_platinum_discount: 0,
    membership_bronze_delivery_discount: 0, membership_silver_delivery_discount: 0, membership_gold_delivery_discount: 0, membership_platinum_delivery_discount: 0
  });
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    combinedAddress: '',
    phoneNumber: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [transactionId, setTransactionId] = useState('');

  // SIMPLE AUTO-FILL LOGIC: Frontend + Backend fix integration
  useEffect(() => {
    if (user) {
      // 1. Check if user already has addresses in profile
      const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
      
      // 2. Only auto-fill if the fields are CURRENTLY EMPTY (avoids annoying overwrite when typing)
      if (!shippingAddress.fullName && !shippingAddress.combinedAddress && !shippingAddress.phoneNumber) {
        if (defaultAddr) {
          setShippingAddress({
            fullName: defaultAddr.name || user.name || '',
            combinedAddress: `${defaultAddr.addressLine1}${defaultAddr.addressLine2 ? ', ' + defaultAddr.addressLine2 : ''}, ${defaultAddr.city}, ${defaultAddr.state || ''}, ${defaultAddr.postalCode}`,
            phoneNumber: defaultAddr.phone || user.phoneNumber || ''
          });
        } else {
          // Fallback to name/phone if no address object exists yet
          setShippingAddress(prev => ({
            ...prev,
            fullName: user.name || '',
            phoneNumber: user.phoneNumber || ''
          }));
        }
      }
    }
  }, [user]); // Re-run when user data loads

  useEffect(() => {
    if (user?.cart) {
      setCartItems(user.cart.filter(item => item.product));
    }
    
    // Select all by default
    if (user?.cart && selectedItems.length === 0) {
      setSelectedItems(user.cart.filter(it => it.product).map(it => it.product._id));
    }

    const fetchConfigs = async () => {
      try {
        const keys = Object.keys(configs);
        const newConfigs = { ...configs };
        await Promise.all(keys.map(async (key) => {
          const res = await orderAPI.getPublicConfig(key).catch(() => ({ data: { value: null } }));
          if (res.data.value !== null && res.data.value !== undefined) newConfigs[key] = res.data.value;
        }));
        setConfigs(newConfigs);
      } catch (err) { console.error("Config load error", err); }
    };
    fetchConfigs();
  }, [user]);

  const calculateSubtotal = () => cartItems
    .filter(item => selectedItems.includes(item.product._id))
    .reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);

  const calculateVAT = () => calculateSubtotal() * (Number(configs.vat_percentage) / 100);
  const calculateShipping = () => calculateSubtotal() > 0 ? Number(configs.delivery_charge) : 0;
  
  const m_lvl = (user?.membershipLevel || 'bronze').toLowerCase();
  const m_disc_amt = (calculateSubtotal() * (Number(configs[`membership_${m_lvl}_discount`]) || 0)) / 100;
  
  const m_del_pct = Number(configs[`membership_${m_lvl}_delivery_discount`]) || 0;
  const total_del_disc_pct = Math.min(100, (Number(couponDeliveryDiscount) || 0) + m_del_pct);
  const del_disc_amt = (calculateShipping() * total_del_disc_pct) / 100;

  const calculateTotal = () => {
    const s = calculateSubtotal();
    const v = calculateVAT();
    const sh = calculateShipping() - del_disc_amt;
    return Math.max(0, s + v + sh - discount - m_disc_amt);
  };

  const updateQuantity = async (productId, q) => {
    if (q < 1) return;
    setUpdatingId(productId);
    try {
      const res = await userAPI.updateCartItem(productId, { quantity: q });
      if (res.data.success) {
        setCartItems(res.data.cart);
        setUser({ ...user, cart: res.data.cart });
      }
    } catch (e) { toast.error('Update failed'); } finally { setUpdatingId(null); }
  };

  const removeItem = async (productId) => {
    setUpdatingId(productId);
    try {
      const res = await userAPI.removeFromCart(productId);
      if (res.data.success) {
        setCartItems(res.data.cart);
        setUser({ ...user, cart: res.data.cart });
        toast.success('Removed');
      }
    } catch (e) { toast.error('Remove failed'); } finally { setUpdatingId(null); }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const activeItems = cartItems.filter(item => selectedItems.includes(item.product._id));
      const sellerIds = [...new Set(activeItems.map(item => item.product.user))];
      const res = await orderAPI.validateCoupon({ code: couponCode, subtotal: calculateSubtotal(), sellerIds });
      if (res.data.success) {
        setDiscount(Number(res.data.coupon.discountAmount) || 0);
        setCouponDeliveryDiscount(Number(res.data.coupon.deliveryDiscount) || 0);
        setCouponApplied(true);
        toast.success('Coupon applied');
      } else {
        toast.error(res.data.message || 'Invalid coupon');
        setDiscount(0); setCouponApplied(false);
      }
    } catch (e) { toast.error('Check failed'); } finally { setIsApplyingCoupon(false); }
  };

  const handleCheckout = async () => {
    if (!shippingAddress.fullName || !shippingAddress.combinedAddress || !shippingAddress.phoneNumber) {
      toast.error('Fill in all fields'); return;
    }
    if (paymentMethod !== 'Cash on Delivery' && !transactionId) {
      toast.error('Transaction ID required'); return;
    }
    setLoading(true);
    try {
      const activeItems = cartItems.filter(item => selectedItems.includes(item.product._id));
      const orderData = {
        items: activeItems.map(item => ({ product: item.product._id, quantity: item.quantity, price: item.product.sellingPrice, seller: item.product.user })),
        subtotal: calculateSubtotal(),
        vat: configs.vat_percentage,
        vatAmount: calculateVAT(),
        discount: (discount || 0) + m_disc_amt,
        shippingCost: calculateShipping(),
        totalPrice: calculateTotal(),
        shippingAddress: { 
          fullName: shippingAddress.fullName, 
          addressLine1: shippingAddress.combinedAddress, 
          city: 'Bangladesh', // Fallback as backend requires it for processing logic
          phoneNumber: shippingAddress.phoneNumber 
        },
        paymentMethod,
        paymentDetails: { transactionId, gateway: paymentMethod }
      };
      const response = await orderAPI.createOrder(orderData);
      if (response.data.success) {
        toast.success('Order placed!');
        setUser({ ...user, cart: [] });
        setTimeout(() => navigate('/dashboard?tab=orders'), 1000);
      }
    } catch (e) { toast.error('Order failed'); } finally { setLoading(false); }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white"><Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <ShoppingBag className="mx-auto text-gray-200 mb-4" size={80} />
          <h2 className="text-xl font-bold text-gray-700">Your cart is empty</h2>
          <Link to="/shop" className="mt-6 inline-block bg-primary text-white py-2 px-6 rounded-lg text-sm font-bold">Shop Now</Link>
        </div><Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Cart Items</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Items List */}
          <div className="flex-1 space-y-4">
            {cartItems.map((item) => (
              <div key={item.product._id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 relative">
                <input type="checkbox" checked={selectedItems.includes(item.product._id)} onChange={() => { if (selectedItems.includes(item.product._id)) setSelectedItems(selectedItems.filter(id => id !== item.product._id)); else setSelectedItems([...selectedItems, item.product._id]); }} className="w-5 h-5 accent-primary" />
                <img src={item.product.image} alt="" className="w-20 h-20 object-contain rounded-lg border" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm truncate">{item.product.name}</h3>
                  <p className="text-xs text-primary font-bold mt-1">৳{item.product.sellingPrice}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="p-1 border rounded hover:bg-gray-50"><Minus size={14}/></button>
                    <span className="text-xs font-bold w-6 text-center">{updatingId === item.product._id ? '..' : item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} className="p-1 border rounded hover:bg-gray-50"><Plus size={14}/></button>
                  </div>
                </div>
                <button onClick={() => removeItem(item.product._id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>

          {/* Checkout Panel - SIMPLE & RESPONSIVE */}
          <div className="w-full lg:w-[380px]">
            <div className="bg-white border rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-6 pb-2 border-b">Order Summary</h2>
              
              <div className="mb-6">
                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Have a coupon?</p>
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="CODE" className="flex-1 border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-primary" />
                  <button onClick={handleApplyCoupon} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition">Apply</button>
                </div>
              </div>

              <div className="space-y-3 text-sm font-medium text-gray-600 mb-6 border-b pb-6">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-800">= ৳{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Delivery</span>
                  <span className="font-bold text-gray-800">= ৳{calculateShipping().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>VAT(2%)</span>
                  <span className="font-bold text-gray-800">= ৳{calculateVAT().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-orange-600">
                  <span>Level Reward</span>
                  <span className="font-bold">= -৳{m_disc_amt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600">
                  <span>Coupon Discount</span>
                  <span className="font-bold">= -৳{discount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-gray-800">Total</span>
                <span className="text-2xl font-black text-primary">= ৳{calculateTotal().toFixed(2)}</span>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-1">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Shipping Address</h3>
                  <button onClick={() => { localStorage.removeItem('cart_init'); window.location.reload(); }} className="text-primary hover:bg-primary/5 p-1 rounded transition" title="Auto-fill"><RefreshCw size={14}/></button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                    <input type="text" value={shippingAddress.fullName} onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})} className="w-full border rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-primary" placeholder="Enter full name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Address/city/state/zip code</label>
                    <textarea rows="2" value={shippingAddress.combinedAddress} onChange={(e) => setShippingAddress({...shippingAddress, combinedAddress: e.target.value})} className="w-full border rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-primary resize-none" placeholder="Enter address details" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Number</label>
                    <input type="text" value={shippingAddress.phoneNumber} onChange={(e) => setShippingAddress({...shippingAddress, phoneNumber: e.target.value})} className="w-full border rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-primary" placeholder="01XXXXXXXXX" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Payment Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-primary cursor-pointer">
                      <option value="Cash on Delivery">Cash on Delivery</option>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="rocket">Rocket</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>

              {['bkash', 'nagad', 'rocket', 'bank'].includes(paymentMethod) && (
                <div className="mt-6 p-4 bg-gray-50 border rounded-xl space-y-4">
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border">
                    <span className="text-xs font-bold text-gray-700">{configs[`${paymentMethod}_number`] || configs[`${paymentMethod}_details`] || 'N/A'}</span>
                    <button onClick={() => { navigator.clipboard.writeText(configs[`${paymentMethod}_number`] || configs[`${paymentMethod}_details`]); toast.success('Copied'); }} className="text-primary hover:bg-primary/5 p-1 rounded transition"><Copy size={16}/></button>
                  </div>
                  <input type="text" placeholder="Transaction ID *" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full border rounded-lg px-4 py-2 text-xs font-bold outline-none focus:border-primary text-center" />
                </div>
              )}

              <button onClick={handleCheckout} disabled={loading || cartItems.length === 0} className="w-full mt-8 bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all uppercase text-sm">
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      </div><Footer />
    </div>
  );
};

export default Cart;