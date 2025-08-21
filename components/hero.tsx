'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Camera, Edit3, ReceiptText} from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-25 to-red-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,154,0,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,69,0,0.08),transparent_70%)]" />
      </div>
      
      {/* Floating elements */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-r from-orange-200/30 to-amber-200/30 blur-xl"
        animate={{
          y: [-10, 10, -10],
          x: [-5, 5, -5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-32 right-32 w-24 h-24 rounded-full bg-gradient-to-r from-red-200/30 to-orange-200/30 blur-xl"
        animate={{
          y: [10, -10, 10],
          x: [5, -5, 5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative max-w-6xl mx-auto text-center px-6">

        {/* Main heading with gradient text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-7xl md:text-8xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-orange-600 via-red-500 to-amber-600 bg-clip-text text-transparent">
              Scan.
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-red-600 bg-clip-text text-transparent">
              Tap.
            </span>
            <br />
            <span className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              Split.
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Snap the receipt, tap your items, see who owes what.
          <br />
          <span className="text-gray-500">No sign-ups, no math, no drama.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link href="/scan">
            <motion.div
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-0.5 shadow-2xl hover:shadow-orange-500/25 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-white font-semibold text-lg">
                <Camera className="w-5 h-5" />
                Scan Receipt
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-2xl"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </motion.div>
          </Link>

          <Link href="/manual">
            <motion.div
              className="group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3 px-8 py-4 text-gray-700 font-semibold text-lg">
                <Edit3 className="w-5 h-5" />
                Enter Manually
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Features grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {[
            { icon: "📱", title: "Smart Scanning", desc: "AI-powered receipt analysis with 99% accuracy" },
            { icon: "⚡", title: "Instant Splitting", desc: "Tap items to assign them to people in seconds" },
            { icon: "🔒", title: "Privacy First", desc: "No accounts needed. Your data stays with you" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="group relative rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 p-6 hover:bg-white/60 transition-all duration-300"
              whileHover={{ y: -5 }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
          <br />
        </motion.div>
      </div>
    </div>
  );
}