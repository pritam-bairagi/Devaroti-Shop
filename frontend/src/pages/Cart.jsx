import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight,
  Tag,
  Shield,
  Truck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from './Footer';
import { useAuth } from '../contexts/useAuth';
import { userAPI, orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const Cart = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Bangladesh',
    phoneNumber: user?.phoneNumber || ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  useEffect(() => {
    if (user?.cart) {
      // Filter out invalid items
      const validItems = user.cart.filter(item => item.product);
      setCartItems(validItems);
    }
  }, [user]);

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + (item.product.sellingPrice * item.quantity), 
      0
    );
  };

  const calculateVAT = () => {
    return calculateSubtotal() * 0.02; // 2% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT() - discount;
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdatingId(productId);
    try {
      const response = await userAPI.addToCart({
        productId,
        quantity: newQuantity
      });
      
      if (response.data.success) {
        setUser({ ...user, cart: response.data.cart });
        toast.success('Cart updated');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update cart');
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (productId) => {
    setUpdatingId(productId);
    try {
      const response = await userAPI.removeFromCart(productId);
      
      if (response.data.success) {
        setUser({ ...user, cart: response.data.cart });
        toast.success('Item removed from cart');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'SAVE10') {
      setDiscount(calculateSubtotal() * 0.1);
      setCouponApplied(true);
      toast.success('Coupon applied! 10% discount');
    } else if (couponCode.toUpperCase() === 'SAVE20') {
      setDiscount(calculateSubtotal() * 0.2);
      setCouponApplied(true);
      toast.success('Coupon applied! 20% discount');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const handleCheckout = async () => {
    // Validate shipping address
    if (!shippingAddress.fullName || !shippingAddress.addressLine1 || 
        !shippingAddress.city || !shippingAddress.phoneNumber) {
      toast.error('Please fill in all required shipping fields');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.sellingPrice,
          seller: item.product.user?._id || item.product.user
        })),
        subtotal: calculateSubtotal(),
        vat: calculateVAT(),
        discount,
        shippingCost: 0,
        totalPrice: calculateTotal(),
        shippingAddress,
        paymentMethod,
        deliveryOption: 'standard'
      };

      const response = await orderAPI.createOrder(orderData);
      
      if (response.data.success) {
        toast.success('Order placed successfully!');
        // Clear cart in context
        setUser({ ...user, cart: [] });
        navigate('/dashboard?tab=orders');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="text-gray-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Looks like you haven't added anything to your cart yet.
              Start shopping to fill it up!
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-opacity-90 transition-all"
            >
              Continue Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="text-primary" />
          Shopping Cart ({cartItems.length} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <motion.div
                key={item.product._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-24 h-24 object-contain bg-gray-50 rounded-xl"
                />
                
                <div className="flex-1">
                  <Link
                    to={`/product/${item.product._id}`}
                    className="font-bold text-gray-800 hover:text-primary transition line-clamp-2"
                  >
                    {item.product.name}
                  </Link>
                  
                  <p className="text-sm text-gray-500 mt-1">
                    {item.product.category}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        disabled={updatingId === item.product._id || item.quantity <= 1}
                        className="p-2 hover:text-primary transition disabled:opacity-50"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center font-medium">
                        {updatingId === item.product._id ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        disabled={updatingId === item.product._id}
                        className="p-2 hover:text-primary transition disabled:opacity-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => removeItem(item.product._id)}
                      disabled={updatingId === item.product._id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="text-right">
                  {item.product.mrp && (
                    <p className="text-sm text-gray-400 line-through">
                      ৳{item.product.mrp}
                    </p>
                  )}
                  <p className="text-xl font-black text-primary">
                    ৳{item.product.sellingPrice * item.quantity}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">৳{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (2%)</span>
                  <span className="font-medium">৳{calculateVAT().toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-৳{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-primary">
                  ৳{calculateTotal().toFixed(2)}
                </span>
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponApplied || !couponCode}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-700 mb-3">
                  Shipping Address
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({
                      ...shippingAddress,
                      fullName: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1 *"
                    value={shippingAddress.addressLine1}
                    onChange={(e) => setShippingAddress({
                      ...shippingAddress,
                      addressLine1: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2"
                    value={shippingAddress.addressLine2}
                    onChange={(e) => setShippingAddress({
                      ...shippingAddress,
                      addressLine2: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City *"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({
                        ...shippingAddress,
                        city: e.target.value
                      })}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({
                        ...shippingAddress,
                        postalCode: e.target.value
                      })}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Phone Number *"
                    value={shippingAddress.phoneNumber}
                    onChange={(e) => setShippingAddress({
                      ...shippingAddress,
                      phoneNumber: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-700 mb-3">
                  Payment Method
                </h3>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || cartItems.length === 0}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Place Order'
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Shield size={14} />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Truck size={14} />
                  <span>Free Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;