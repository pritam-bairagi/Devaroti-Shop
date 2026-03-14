import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  TrendingUp
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from './Footer';
import HeaderTop from './HeaderTop';
import Marquee from './Marquee';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { productAPI } from '../services/api';
import { useAuth } from '../contexts/useAuth';

const Home = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const [featuredRes, categoriesRes] = await Promise.all([
        productAPI.getFeatured(),
        productAPI.getCategories()
      ]);

      if (featuredRes.data.success) {
        setFeaturedProducts(featuredRes.data.products || []);
        // For demo, use same products for different sections
        setNewArrivals(featuredRes.data.products?.slice(0, 4) || []);
        setBestSellers(featuredRes.data.products?.slice(4, 8) || []);
      }

      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Leaf, title: "Eco Friendly", desc: "Sustainable products" },
    { icon: HeartHandshake, title: "Authentic Deal", desc: "Producer to Consumer" },
    { icon: Truck, title: "Free Shipping", desc: "On orders ৳5000+" },
    { icon: RotateCcw, title: "Easy Returns", desc: "7-day return policy" },
    { icon: CreditCard, title: "Secure Payment", desc: "100% encrypted" },
    { icon: Headset, title: "24/7 Support", desc: "Dedicated team" },
    { icon: Shield, title: "Trust & Reliability", desc: "Verified products" },
    { icon: TrendingUp, title: "Best Prices", desc: "Price match guarantee" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <HeaderTop />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/5 to-secondary/5 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h4 className="text-primary font-black uppercase tracking-[0.2em] mb-4">
                Summer Collection 2026
              </h4>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
                Dress Like A{' '}
                <span className="text-primary">Professional</span>
              </h1>
              <p className="text-gray-600 text-lg mb-8 max-w-lg mx-auto lg:mx-0">
                Discover the latest trends in high-quality fashion and accessories. 
                Premium materials, timeless designs, and exceptional value.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/shop"
                  className="bg-primary text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={20} />
                  Shop Now
                </Link>
                <Link
                  to="/seller-signup"
                  className="bg-white text-gray-800 font-bold py-4 px-10 rounded-full border-2 border-gray-200 hover:border-primary hover:text-primary transition-all"
                >
                  Become a Seller
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12">
                <div>
                  <div className="text-3xl font-black text-primary">50k+</div>
                  <div className="text-sm text-gray-500">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-primary">10k+</div>
                  <div className="text-sm text-gray-500">Products</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-primary">500+</div>
                  <div className="text-sm text-gray-500">Sellers</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                alt="Shopping"
                className="relative w-full max-w-lg mx-auto rounded-[2rem] shadow-2xl border-8 border-white"
              />
            </motion.div>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </section>

      {/* Features Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <feature.icon size={24} />
                </div>
                <div>
                  <h5 className="font-bold text-gray-800">{feature.title}</h5>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Shop by Category
          </h2>
          <div className="w-20 h-1.5 bg-primary mx-auto rounded-full" />
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category, index) => (
              <Link
                key={index}
                to={`/shop?category=${category._id}`}
                className="group"
              >
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-xl hover:border-primary transition-all group-hover:-translate-y-1">
                  <img
                    src={category.image || 'https://via.placeholder.com/100'}
                    alt={category._id}
                    className="w-20 h-20 object-contain mx-auto mb-4"
                  />
                  <h3 className="font-bold text-gray-800 mb-1">{category._id}</h3>
                  <p className="text-sm text-gray-500">{category.count} items</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our hand-picked selection of premium products
          </p>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold py-4 px-10 rounded-full hover:bg-opacity-90 transition-all"
          >
            View All Products
            <ShoppingBag size={18} />
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            New Arrivals
          </h2>
          <p className="text-gray-600">Be the first to shop our latest collection</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* Banner */}
      <section className="bg-secondary py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center text-white relative z-10">
          <h4 className="text-primary font-bold tracking-[0.3em] mb-4 uppercase">
            Limited Time Offer
          </h4>
          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            Flash Sale: Up to <span className="text-red-500">70% Off</span>
          </h2>
          <p className="text-lg mb-8 text-gray-300">
            on Summer Collection. Hurry, offer ends soon!
          </p>
          <Link
            to="/shop"
            className="inline-block bg-primary text-white font-bold py-4 px-12 rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-2xl"
          >
            Shop Now
          </Link>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-64 h-64 border-2 border-white rounded-full" />
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Best Sellers
          </h2>
          <p className="text-gray-600">Most popular products loved by our customers</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600">Trusted by thousands of happy customers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Amazing quality products and fast delivery. The customer service is exceptional. Will definitely shop again!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  JD
                </div>
                <div>
                  <p className="font-bold text-gray-800">John Doe</p>
                  <p className="text-sm text-gray-500">Happy Customer</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Partners Marquee */}
      <Marquee />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;