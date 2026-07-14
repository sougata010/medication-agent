import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, icon: Icon }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-blue-900/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-md rounded-2xl shadow-xl border border-blue-100 overflow-hidden"
          >
            {/* Teal accent strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400" />
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100/60 mt-1">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Icon className="w-4 h-4" />
                  </div>
                )}
                <h3 className="text-lg font-heading font-bold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 rx-watermark overflow-hidden">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
