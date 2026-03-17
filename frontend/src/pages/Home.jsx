import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Truck, 
  RotateCcw, 
  CreditCard, 
  Headset, 
  Shield, 
  Leaf, 
  HeartHandshake,
  Star,
  Zap,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Award,
  Clock,
  Package,
  Users,
  Store,
  BadgeCheck,
  Gift,
  ShieldCheck,
  ChevronLeft,
  Heart,
  Eye,
  BarChart3,
  Globe2,
  Timer,
  Percent,
  Gem,
  Rocket
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from './Footer';
import HeaderTop from './HeaderTop';
import Marquee from './Marquee';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import AnimatedSlideshow from '../components/AnimatedSlideshow';
import CountingNumber from '../components/CountingNumber';
import TestimonialsSection from '../components/CustomersComment';
import { productAPI } from '../services/api';
import { useAuth } from '../contexts/useAuth';

// Color Template: #f7644f (Primary Coral/Orange)

const Home = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('featured');
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState({
    days: 3,
    hours: 12,
    minutes: 45,
    seconds: 30
  });

  // Features data
  const features = useMemo(() => [
    { icon: Leaf, title: "Eco Friendly", desc: "Sustainable materials", gradient: "from-green-400 to-emerald-500", bg: "bg-green-50" },
    { icon: HeartHandshake, title: "Authentic Deals", desc: "Direct from source", gradient: "from-pink-400 to-rose-500", bg: "bg-pink-50" },
    { icon: Truck, title: "Free Shipping", desc: "On orders ৳5000+", gradient: "from-blue-400 to-indigo-500", bg: "bg-blue-50" },
    { icon: RotateCcw, title: "Easy Returns", desc: "7-day policy", gradient: "from-purple-400 to-violet-500", bg: "bg-purple-50" },
    { icon: CreditCard, title: "Secure Payment", desc: "100% encrypted", gradient: "from-cyan-400 to-blue-500", bg: "bg-cyan-50" },
    { icon: Headset, title: "24/7 Support", desc: "Always here", gradient: "from-orange-400 to-red-500", bg: "bg-orange-50" },
    { icon: Shield, title: "Trust & Safety", desc: "Verified sellers", gradient: "from-teal-400 to-green-500", bg: "bg-teal-50" },
    { icon: TrendingUp, title: "Best Prices", desc: "Price match", gradient: "from-red-400 to-pink-500", bg: "bg-red-50" }
  ], []);

  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true, amount: 0.3 });

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch data with error handling
  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [featuredRes, categoriesRes] = await Promise.all([
          productAPI.getFeatured().catch(err => ({ data: { success: false, products: [] } })),
          productAPI.getCategories().catch(err => ({ data: { success: false, categories: [] } }))
        ]);

        if (!isMounted) return;

        if (featuredRes?.data?.success) {
          const products = featuredRes.data.products || [];
          setFeaturedProducts(products);
          setNewArrivals(products.slice(0, 4));
          setBestSellers(products.length > 4 ? products.slice(4, 8) : products.slice(0, 4));
        }

        if (categoriesRes?.data?.success) {
          setCategories(categoriesRes.data.categories || []);
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load content. Please refresh the page.');
        console.error('Error fetching home data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHomeData();
    window.scrollTo(0, 0);

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-[#f7644f] text-white rounded-2xl hover:bg-opacity-90 transition-all"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-white">
      <HeaderTop />
      <Navbar />
      <AnimatedSlideshow />

      {/* Hero Section - Enhanced with Advanced Animations */}
      <section 
        ref={heroRef}
        className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff861c]/20 via-transparent to-[#000000]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f7644f] to-transparent" />
          
          {/* Animated Circles */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bg-[#ff7b16] top-20 left-10 w-96 h-96 rounded-2xl border"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
              rotate: [360, 180, 0]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bg-[#ff2200] bottom-20 right-10 w-[30rem] h-[30rem] rounded"
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-[#000000] px-6 py-2 rounded-full mb-6 border border-[#f7644f]/20"
              >
                <Sparkles className="w-4 h-4 text-[#f7644f]" />
                <span className="text-sm font-semibold text-[#f7644f]">Summer Collection 2026</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
                <span className="text-gray-900">
                  Dress Like A
                </span>
                <br />
                <span 
                  className="bg-gradient-to-r from-[#f7644f] to-[#1e3a8a] bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(to right, #f7644f, #1e3a8a)' }}
                >
                  Professional
                </span>
              </h1>

              <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Discover premium quality fashion and accessories curated for the modern professional. 
                Timeless designs meet exceptional craftsmanship.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/shop"
                    className="group relative inline-flex items-center justify-center gap-2 bg-[#f7644f] text-white font-bold py-4 px-8 rounded-full overflow-hidden shadow-xl hover:shadow-2xl transition-all before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#1e3a8a] before:to-[#f7644f] before:opacity-0 before:hover:opacity-100 before:transition-opacity"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <ShoppingBag size={20} />
                      Shop Now
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/seller-signup"
                    className="group inline-flex items-center gap-2 bg-white text-gray-800 font-bold py-4 px-8 rounded-full border-2 border-gray-200 hover:border-[#f7644f] hover:text-[#f7644f] transition-all"
                  >
                    <Store size={20} />
                    Become a Seller
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </div>

              <CountingNumber/>
            </motion.div>

            {/* Right Image with 3D Effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative perspective-1000">
                {/* Floating Elements */}
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-10 -right-10 w-32 h-32 bg-[#f7644f] rounded-2xl shadow-2xl flex items-center justify-center text-white font-bold transform rotate-12 z-20"
                >
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    <div className="text-2xl font-black">70</div><Percent size={40} />
                    <div className="text-xs">OFF</div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ 
                    y: [0, 20, 0],
                    rotate: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#1e3a8a] rounded-2xl shadow-2xl flex items-center justify-center text-white z-20"
                >
                  <div className="text-center">
                    <Rocket className="w-8 h-8 mx-auto mb-2" />
                    <div className="text-sm font-bold">Free Shipping</div>
                  </div>
                </motion.div>

                {/* Main Image Container */}
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white transform-gpu hover:scale-105 transition-transform duration-700">
                  <img
                    src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1000&fit=crop"
                    alt="Shopping"
                    className="w-full h-auto object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Overlay Badge */}
                  <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 1.2, type: "spring" }}
                    className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#f7644f] rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">100% Authentic Guarantee</div>
                        <div className="text-sm text-gray-600">Verified products from trusted sellers</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Bar - Glassmorphism with Hover Effects */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onHoverStart={() => setHoveredFeature(index)}
                  onHoverEnd={() => setHoveredFeature(null)}
                  className="relative group cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                  <div className="relative text-center">
                    <div 
                      className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all ${
                        hoveredFeature === index 
                          ? `bg-gradient-to-r ${feature.gradient} text-white scale-110 shadow-lg` 
                          : `${feature.bg} text-gray-600`
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <h5 className="text-xs font-bold text-gray-800 mb-1">{feature.title}</h5>
                    <p className="text-[10px] text-gray-500">{feature.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Categories Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-4"
          >
            <span className="text-gray-900">Shop by</span>{' '}
            <span className="text-[#f7644f]">Category</span>
          </motion.h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "6rem" }}
            viewport={{ once: true }}
            className="h-1.5 bg-[#f7644f] mx-auto rounded-full"
          />
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.slice(0, 6).map((category, index) => (
              <motion.div
                key={category._id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Link
                  to={`/shop?category=${category._id}`}
                  className="group block relative"
                >
                  <div className="absolute inset-0 bg-[#f7644f] rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                  <div className="relative bg-white rounded-2xl border border-gray-200 p-6 text-center hover:border-[#f7644f] transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#f7644f]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img
                      src={category.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop'}
                      alt={category._id}
                      className="w-24 h-24 object-cover rounded-xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    <h3 className="font-bold text-gray-800 mb-1 group-hover:text-[#f7644f] transition-colors">
                      {category._id}
                    </h3>
                    <p className="text-sm text-gray-500">{category.count} items</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">No categories available</div>
        )}
      </section>

      {/* Products Section with Tabs */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-4"
          >
            <span className="text-gray-900">Featured</span>{' '}
            <span className="text-[#f7644f]">Collection</span>
          </motion.h2>
          
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { id: 'featured', label: 'Featured', icon: Sparkles },
              { id: 'new', label: 'New Arrivals', icon: Clock },
              { id: 'bestsellers', label: 'Best Sellers', icon: Award }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#f7644f] text-white shadow-xl'
                    : 'bg-white text-gray-600 hover:text-[#f7644f] shadow-md'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {(activeTab === 'featured' ? featuredProducts :
              activeTab === 'new' ? newArrivals : bestSellers).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="text-center mt-12">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#f7644f] text-white font-bold py-4 px-10 rounded-full hover:shadow-2xl transition-all group"
            >
              View All Products
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Flash Sale Banner */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#f7644f] to-[#1e3a8a] opacity-95" />
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              mixBlendMode: 'overlay'
            }}
          />
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full mb-8 border border-white/30"
          >
            <Zap className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">Limited Time Offer</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black mb-6 leading-tight"
          >
            Flash Sale: Up to <span className="text-yellow-300">70% Off</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl mb-8 text-white/90"
          >
            on Summer Collection. Hurry, offer ends in:
          </motion.p>

          {/* Countdown Timer */}
          <div className="flex justify-center gap-4 mb-8">
            {[
              { label: 'Days', value: countdown.days },
              { label: 'Hours', value: countdown.hours },
              { label: 'Mins', value: countdown.minutes },
              { label: 'Secs', value: countdown.seconds }
            ].map((unit, index) => (
              <motion.div
                key={unit.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-white/20 backdrop-blur-md w-20 h-20 rounded-xl flex items-center justify-center mb-2 border border-white/30">
                  <span className="text-3xl font-black">
                    {unit.value.toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="text-sm">{unit.label}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/shop"
              className="inline-block bg-white text-[#1e3a8a] font-bold py-4 px-12 rounded-full hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Shop Now & Save
            </Link>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{ 
            y: [0, 30, 0],
            rotate: 360
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 left-10 w-32 h-32 border-2 border-white/20 rounded-full"
        />
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            rotate: -360
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-10 right-10 w-64 h-64 border-2 border-white/10 rounded-full"
        />
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Partners Marquee */}
      <Marquee />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;