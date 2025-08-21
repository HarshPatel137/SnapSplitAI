'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReceiptText, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/1 backdrop-blur-md border-b border-gray-200/50 shadow-lg rounded-full' 
          : ''
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <motion.div
              className="relative"
              whileHover={{ rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                <ReceiptText className="w-5 h-5 text-white" />
              </div>
            </motion.div>
            
            <div className="flex flex-col">
              <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                SnapSplit AI
              </span>
              <span className="text-xs text-gray-500 -mt-1">Smart Receipt Splitting</span>
            </div>
          </Link>

          {/* Center navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {[
              { href: '/scan', label: 'Scan', icon: '📱' },
              { href: '/manual', label: 'Manual', icon: '✏️' },

            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Right side - AI badge */}
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200"
            animate={{
              boxShadow: [
                '0 0 0 rgba(255,154,0,0)',
                '0 0 20px rgba(255,154,0,0.2)',
                '0 0 0 rgba(255,154,0,0)'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-orange-600" />
            </motion.div>
            <span className="text-xs font-medium text-orange-700">
              AI-Powered Receipt Analysis
            </span>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}