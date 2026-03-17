// ShopFrame.jsx - Navigation, Categories, and Filter Components
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Smartphone, Tag, BookOpen, Star, X, Heart, ShoppingCart, 
  User, Settings, LogOut, Package, House, Search, Menu, Filter,
  ChevronDown, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== CONSTANTS ====================
export const CATEGORIES = [
  {
    id: "electronics", label: "Electronics", icon: <Smartphone size={16} />,
    sub: [
      { name: "Mobile Phones", count: 120 }, { name: "Laptops", count: 80 },
      { name: "Desktops", count: 120 }, { name: "Circuit Boards", count: 80 },
      { name: "Cable / Connectors", count: 120 }, { name: "Accessories", count: 80 },
      { name: "Headphones", count: 150 }, { name: "Cameras", count: 60 }
    ]
  },
  {
    id: "fashion", label: "Fashion", icon: <Tag size={16} />,
    sub: [
      { name: "Dress", count: 300 }, { name: "Shoes", count: 60 },
      { name: "Jewelry", count: 50 }, { name: "Perfume", count: 87 },
      { name: "Cosmetics", count: 50 }, { name: "Glasses", count: 87 },
      { name: "Bags", count: 50 }, { name: "Watch", count: 87 }
    ]
  },
  {
    id: "books", label: "Books", icon: <BookOpen size={16} />,
    sub: [
      { name: "Fiction", count: 300 }, { name: "Non-Fiction", count: 60 },
      { name: "Religion", count: 300 }, { name: "PDF", count: 60 },
      { name: "Academic", count: 50 }, { name: "Children", count: 87 }
    ]
  },
  {
    id: "pujarUporikoron",
    label: "পূজার উপকরণ",
    icon: <Star size={16} />,
    sub: [
      { name: "চন্দন গুঁড়া / চন্দন পেস্ট", count: 120 },
      { name: "কস্তুরী / সুগন্ধি দ্রব্য", count: 80 },
      { name: "ধূপকাঠি / ধুনো", count: 200 },
      { name: "প্রদীপ / মাটির দীপ / পিতলের প্রদীপ", count: 150 },
      { name: "তুলোর বাতি", count: 120 },
      { name: "পূজার থালা / পিতলের পাত্র", count: 100 },
      { name: "ঘণ্টা / শঙ্খ", count: 60 },
      { name: "ফল (কলা, আপেল, নারকেল)", count: 200 },
      { name: "দুধ / দই / ঘি/ মধু", count: 150 },
      { name: "মিষ্টি / পায়েস / ক্ষীর", count: 120 },
      { name: "মধুপর্ক (মধু, দই, ঘি, দুধ, চিনি)", count: 70 },
      { name: "ফুল (জবা, গাঁদা, পদ্ম)", count: 200 },
      { name: "পাতা (বেল, তুলসী, জগডুমুর)", count: 150 },
      { name: "শাড়ি / ধুতি / উত্তরি / পাঞ্জাবি", count: 90 },
      { name: "গুড় / চিনি", count: 80 },
      { name: "আচমনীয় জল / গঙ্গা জল", count: 50 },
      { name: "অর্ঘ্য দ্রব্য (ফুল, চাল, দই, দূর্বা)", count: 100 },
      { name: "সিঁদুর / হলুদ / মেহেদী / কুমকুম", count: 150 },
      { name: "পঞ্চগব্য / পঞ্চামৃত", count: 40 },
      { name: "যজ্ঞের উপকরণ", count: 40 }
    ]
  },
];

export const NAV_LINKS = ["Home", "Discounts", "Flash Sale", "Wholesale", "Buy 1 Get 1", "1-99 shop", "Hot Offers", "GiveWays"];

export const FILTER_GROUPS = {
  series: { label: "Series", options: ["Consumer Laptops", "Business Laptops", "Gaming Laptops", "Premium Ultrabook Laptops"] },
  processor: { label: "Processor Type", options: ["Intel", "AMD", "Snapdragon"] },
  ram: { label: "RAM Size", options: ["8 GB", "16 GB", "32 GB", "64 GB"] },
  ssd: { label: "SSD", options: ["256 GB", "512 GB", "1 TB", "2 TB"] },
  display: { label: "Display Size", options: ["13-Inch", "14-Inch", "15-Inch", "16-Inch"] },
  os: { label: "Operating System", options: ["Free DOS", "Windows"] },
};

// ==================== HEADER COMPONENT ====================
export function Header({ cartCount, wishCount, onMenuOpen, searchQuery, setSearchQuery, user, onLogout, onMobileMenuOpen }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-md">
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4 hidden sm:flex justify-between items-center">
        <span>Free delivery on orders above <b className="text-white underline">৳ 5,000</b></span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-orange-100 transition">Track Order</a>
          <a href="#" className="hover:text-orange-100 transition">Become a Seller</a>
          <a href="#" className="hover:text-orange-100 transition">Help</a>
        </div>
      </div>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 lg:gap-6 relative">
          {/* Mobile Menu Button */}
          <button onClick={onMenuOpen} className="lg:hidden p-2 rounded-lg bg-orange-50 hover:bg-orange-100 transition text-orange-600">
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg flex items-center justify-center text-white font-black text-sm">
                DS
              </div>
              <span className="font-black text-xl text-gray-800 hidden sm:block">Devaroti<span className="text-orange-500">Shop</span></span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className={`relative flex-1 flex items-center border-2 rounded-xl overflow-hidden transition-all duration-100 ${
            searchFocused ? "border-orange-400 shadow-lg shadow-orange-100" : "border-gray-200"
          }`}>
            <select className="hidden md:block bg-gray-50 border-r border-gray-300 px-3 py-2.5 text-xs text-gray-600 font-medium focus:outline-none cursor-pointer">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id}>{c.label}</option>
              ))}
            </select>

            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="flex-1 w-full px-5 pr-12 py-2.5 text-sm text-gray-700 focus:outline-none bg-white"
            />

            <button className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-orange-500 hover:text-orange-600 transition">
              <Search size={20} />
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 font-bold text-sm text-gray-600">
            <Link to="/" className="hover:text-orange-500">Home</Link>
            <Link to="/shop" className="text-orange-500 border-b-2 border-orange-500 pb-1">Shop</Link>

            {/* Wishlist and Cart */}
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
              <Link to="/favorites" className="hover:text-orange-500 transition relative">
                <Heart size={20} />
                {wishCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {wishCount}
                  </span>
                )}
              </Link>
              
              <Link to="/cart" className="hover:text-orange-500 transition relative">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Section */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-orange-50 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                      >
                        <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                          <p className="font-bold">{user.name}</p>
                          <p className="text-xs opacity-90">{user.email}</p>
                        </div>
                        
                        <div className="p-2">
                          <Link
                            to="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl transition-colors"
                          >
                            <User size={18} className="text-orange-500" />
                            <span className="text-sm font-medium">Dashboard</span>
                          </Link>

                          {user.role === 'admin' && (
                            <Link
                              to="/admin"
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-3 p-3 hover:bg-purple-50 rounded-xl transition-colors"
                            >
                              <Settings size={18} className="text-purple-600" />
                              <span className="text-sm font-medium">Admin Panel</span>
                            </Link>
                          )}

                          {user.role === 'seller' && (
                            <Link
                              to="/seller"
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl transition-colors"
                            >
                              <Package size={18} className="text-orange-600" />
                              <span className="text-sm font-medium">Seller Panel</span>
                            </Link>
                          )}

                          <hr className="my-2 border-gray-100" />

                          <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-red-600"
                          >
                            <LogOut size={18} />
                            <span className="text-sm font-medium">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg shadow-lg hover:from-orange-600 hover:to-amber-600 transition duration-200"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={onMobileMenuOpen} className="md:hidden pr-1 text-gray-700">
            <Menu size={26} />
          </button>
        </div>
      </div>

      <nav className="hidden lg:block bg-[#ff5500]/20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-0">
            {NAV_LINKS.map(link => (
              <li key={link}>
                <a href="#" className="text-gray-700 hover:text-orange-500 hover:bg-orange-50 px-4 py-2.5 text-sm font-medium transition block">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}

// ==================== MOBILE MENU COMPONENT ====================
export function MobileMenu({ open, onClose, categories, navLinks }) {
  const [expanded, setExpanded] = useState(null);
  
  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transition-transform duration-300 overflow-y-auto ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <span className="font-black text-lg">DEVAROTI SHOP</span>
          <button onClick={onClose} className="hover:text-orange-100 transition"><X size={22} /></button>
        </div>
        
        <ul className="py-2">
          {navLinks.map(link => (
            <li key={link} className="border-b border-gray-100">
              <a href="#" className="block px-5 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition">
                {link}
              </a>
            </li>
          ))}
        </ul>
        
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-orange-500 font-semibold uppercase tracking-wider mb-2">Categories</p>
          {categories.map(cat => (
            <div key={cat.id}>
              <button 
                onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between py-2.5 text-sm text-gray-700 hover:text-orange-600 transition"
              >
                <span className="flex items-center gap-2">{cat.icon} {cat.label}</span>
                <span className="text-gray-400">{expanded === cat.id ? "−" : "+"}</span>
              </button>
              {expanded === cat.id && (
                <ul className="ml-5 mb-1">
                  {cat.sub.map(s => (
                    <li key={s.name} className="flex justify-between py-1.5 text-xs text-gray-500 hover:text-orange-500 cursor-pointer border-b border-gray-100 transition">
                      <span>{s.name}</span>
                      <span className="text-gray-400">{s.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

// ==================== FILTER SIDEBAR COMPONENT ====================
export function FilterSidebar({ filters, setFilters, priceRange, setPriceRange, onClose, isMobile }) {
  const [expanded, setExpanded] = useState(Object.keys(FILTER_GROUPS));

  const toggleFilter = (group, value) => {
    setFilters(prev => {
      const current = prev[group] || [];
      return { ...prev, [group]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] };
    });
  };

  const clearAll = () => { 
    setFilters({}); 
    setPriceRange([0, 999999]); 
  };
  
  const activeCount = Object.values(filters).flat().length;

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-orange-500" />
          <span className="font-bold text-gray-800">Filters</span>
          {activeCount > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-orange-500 hover:text-orange-600 font-medium transition">
              Clear all
            </button>
          )}
          {isMobile && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Price Range</p>
        <div className="flex gap-2 items-center">
          <input 
            type="number" 
            value={priceRange[0]} 
            onChange={e => setPriceRange([+e.target.value, priceRange[1]])}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-orange-400" 
            placeholder="Min"
          />
          <span className="text-gray-400 text-xs flex-shrink-0">to</span>
          <input 
            type="number" 
            value={priceRange[1]} 
            onChange={e => setPriceRange([priceRange[0], +e.target.value])}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-orange-400" 
            placeholder="Max"
          />
        </div>
      </div>

      <div className="px-4 py-4 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Availability</p>
        {["In Stock", "Pre Order", "Up Coming"].map(opt => (
          <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-3.5 h-3.5 accent-orange-500"
              onChange={() => toggleFilter("availability", opt)} 
              checked={(filters.availability || []).includes(opt)} 
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">{opt}</span>
          </label>
        ))}
      </div>

      {Object.entries(FILTER_GROUPS).map(([key, group]) => (
        <div key={key} className="border-b border-gray-100">
          <button 
            onClick={() => setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-50 transition"
          >
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{group.label}</span>
            <span className="text-gray-400 text-sm">{expanded.includes(key) ? "−" : "+"}</span>
          </button>
          {expanded.includes(key) && (
            <div className="px-4 pb-3">
              {group.options.map(opt => (
                <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-3.5 h-3.5 accent-orange-500"
                    onChange={() => toggleFilter(key, opt)}
                    checked={(filters[key] || []).includes(opt)} 
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">{opt}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ==================== CATEGORY SIDEBAR COMPONENT ====================
export function CategorySidebar({ categories, activeCat, setActiveCat }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4 shadow-sm">
      <div className="px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Tag size={16} /> Categories
        </h2>
      </div>
      {categories.map(cat => (
        <div key={cat.id} className="border-b border-gray-100 last:border-0">
          <button 
            onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-orange-50 transition text-left"
          >
            <span className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              {cat.icon}{cat.label}
            </span>
            <span className="text-xs text-gray-400">
              {activeCat === cat.id ? "−" : "+"}
            </span>
          </button>
          {activeCat === cat.id && (
            <ul className="bg-gray-50 border-t border-gray-100">
              {cat.sub.map(s => (
                <li key={s.name} className="flex justify-between px-6 py-1.5 text-xs text-gray-500 hover:text-orange-500 cursor-pointer hover:bg-white transition border-b border-gray-100 last:border-0">
                  <span>{s.name}</span>
                  <span className="text-gray-300">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}