'use client';
import { useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from "motion/react";
import { Camera, Upload, FileImage, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadResult {
  publicUrl: string;
  key: string;
}

export default function UploadCard({ onUploaded }: { onUploaded: (result: UploadResult) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function startUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('filename', file.name);
      form.append('type', file.type);

      const res = await fetch('/api/storage/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Upload failed');
      
      onUploaded({
        publicUrl: json.publicUrl as string,
        key: json.key as string
      });
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) startUpload(file);
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 py-10 mt-10">
      <input 
        type="file" 
        accept="image/*,application/pdf" 
        className="hidden" 
        ref={fileRef}
        onChange={e => { const f = e.target.files?.[0]; if (f) startUpload(f); }} 
      />
      
      <motion.div 
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border transition-all duration-300 ${
          dragActive ? 'border-orange-400 bg-orange-50/50' : 'border-white/50 hover:border-orange-300/50'
        } shadow-xl hover:shadow-2xl`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.6, 0.3, 0.6]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="relative p-8 text-center">
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <motion.div
                    className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-gray-700">Analyzing receipt...</div>
                  <div className="text-sm text-gray-500">Our AI is reading your receipt</div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-red-700">Upload Failed</div>
                  <div className="text-sm text-red-600">{error}</div>
                  <button
                    onClick={() => setError(null)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium underline"
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-6"
              >
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileImage className="w-10 h-10 text-orange-600" />
                  </div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-orange-200/50 to-red-200/50 rounded-2xl"
                    animate={{
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-800">Upload Your Receipt</h3>
                    <p className="text-gray-600">Drag & drop or click to upload your receipt photo</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <motion.button
                      onClick={() => fileRef.current?.click()}
                      className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-orange-500/25 transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Choose File
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                    </motion.button>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 text-gray-600 text-sm">
                      <Upload className="w-4 h-4" />
                      PNG, JPG, PDF
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Drag overlay */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-orange-500/10 backdrop-blur-sm border-2 border-dashed border-orange-400 rounded-3xl flex items-center justify-center"
            >
              <div className="text-center">
                <Upload className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-orange-700 font-semibold">Drop your receipt here</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}