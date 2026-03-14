import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Send } from "lucide-react";

// ─── Official SVG Brand Logos ─────────────────────────────────────────────────

const FacebookLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const InstagramLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

// const Send = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
//     <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 12 12 12 0 0011.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
//   </svg>
// );

const LinkedinLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TwitterXLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.73-8.835L1.254 2.25H8.08l4.259 5.632 5.905-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const YoutubeLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const GithubLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

// ─── Social links config ──────────────────────────────────────────────────────

const SOCIAL_LINKS = [
  { icon: <FacebookLogo />,  href: "#", label: "Facebook" },
  { icon: <InstagramLogo />, href: "#", label: "Instagram" },
  { icon: <Send size="16"/>,  href: "#", label: "Telegram" },
  { icon: <LinkedinLogo />,  href: "#", label: "LinkedIn" },
  { icon: <TwitterXLogo />,  href: "#", label: "X (Twitter)" },
  { icon: <TikTokLogo />,    href: "#", label: "TikTok" },
  { icon: <YoutubeLogo />,   href: "#", label: "YouTube" },
  { icon: <GithubLogo />,    href: "#", label: "GitHub" },
];

// ─── Footer ───────────────────────────────────────────────────────────────────

const Footer = () => {
  return (
    <footer className="bg-gray-100 pt-10 border-t border-gray-600">
      <div className="pb-8">
        <span className="text-2xl ml-8 pl-10 font-black text-red-600">PARASH FERI</span>
      </div>
      <div className="max-w-7xl mx-auto p-6 pb-10 grid grid-cols-2 sm:grid-cols-4 gap-10">

        {/* Contact */}
        <div>
          <h4 className="font-bold text-gray-800 mb-4 border-b border-[#088178] uppercase">Contact</h4>
          <div className="space-y-3 text-sm text-gray-500">
            <p className="flex md:flex flex-wrap gap-2 hover:text-[#088178] transition">
              <MapPin size="26"/>
              <a href="https://maps.app.goo.gl/p1NHck7J9jgfBRp26" target="_blank" rel="noopener noreferrer">
                  Boikali, GPO-9000, Khulna, Bangladesh.</a>
            </p>
            <p className="flex md:flex flex-wrap gap-2 hover:text-[#088178] transition">
              <Phone size="20"/> <a href="tel:+8801883558258">+880 1883 558258</a>
            </p>
            <p className="flex md:flex flex-wrap gap-2 hover:text-[#088178] transition">
              <Mail size="20"/> <a href="mailto:pritamperson@gmail.com">pritamperson@gmail.com</a>
            </p>

            {/* Social Icons with real brand SVG logos */}
            <div className="flex flex-wrap gap-3 mt-4">
              {SOCIAL_LINKS.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="bg-[#088178] p-2.5 rounded-full text-white hover:text-[#088178] hover:bg-white border border-[#088178] transition"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* About Us */}
        <div>
          <h4 className="font-bold text-gray-800 mb-6 border-b border-[#088178] uppercase">About Us</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-[#088178] transition">Mission & Vision</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Privacy Policy</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Terms & Conditions</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Delivery Information</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Return / Refund</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">FAQ</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Payment Methods</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Legal Notice</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-bold text-gray-800 mb-6 border-b border-[#088178] uppercase">Support</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li><Link to="/login" className="hover:text-[#088178] transition">My Account</Link></li>
            <li><Link to="/wishlist" className="hover:text-[#088178] transition">Wishlist</Link></li>
            <li><Link to="/cart" className="hover:text-[#088178] transition">View Cart</Link></li>
            <li><Link to="/track-order" className="hover:text-[#088178] transition">Track Order</Link></li>
            <li><Link to="/seller-signup" className="hover:text-[#088178] transition">Become a Seller</Link></li>
            <li><Link to="/courier" className="hover:text-[#088178] transition">Courier Service</Link></li>
            <li><Link to="/customer" className="hover:text-[#088178] transition">Customer Care</Link></li>
            <li><Link to="/report" className="hover:text-[#088178] transition">Report</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-bold text-gray-800 mb-6 border-b border-[#088178] uppercase">Services</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-[#088178] transition">Our Company</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Our Team</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Careers / Recruitment</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Course / Training</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Marketing / Advertising</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Affiliate / Vendor Program</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Blog / News / Media / Press</Link></li>
            <li><Link to="/" className="hover:text-[#088178] transition">Business Partnership</Link></li>
          </ul>
        </div>



      </div>
        {/* Payment Methods */}
                <div className="bg-gray-200/100 pb-5 pt-5 border-t border-gray-600 flex items-center justify-center">
                    <img className="h-8 sm:h-10 xl:h-12" src="/footer_payment_image.png" alt="Payment Methods" title="Payment Methods" />
                </div>
{/* Copyright */}
                <div className="bg-white p-8 border-t border-gray-600 text-center text-gray-400 text-[12px] tracking-widest uppercase">
                    <p>© 2026 Parash Feri. All Rights Reserved.</p>
                </div>


    </footer>
  );
};

export default Footer;