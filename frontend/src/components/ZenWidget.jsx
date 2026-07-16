import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, X } from 'lucide-react';

export default function ZenWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState('inhale'); // inhale, hold, exhale
  const [timeLeft, setTimeLeft] = useState(4);

  useEffect(() => {
    if (!isOpen) return;
    
    let timer;
    if (phase === 'inhale') {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else {
        setPhase('hold');
        setTimeLeft(7);
      }
    } else if (phase === 'hold') {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else {
        setPhase('exhale');
        setTimeLeft(8);
      }
    } else if (phase === 'exhale') {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else {
        setPhase('inhale');
        setTimeLeft(4);
      }
    }

    return () => clearTimeout(timer);
  }, [isOpen, phase, timeLeft]);

  // Restart breathing cycle when opened
  useEffect(() => {
    if (isOpen) {
      setPhase('inhale');
      setTimeLeft(4);
    }
  }, [isOpen]);

  const circleVariants = {
    inhale: { scale: 1.5, opacity: 0.8, transition: { duration: 4, ease: "easeInOut" } },
    hold: { scale: 1.5, opacity: 0.5, transition: { duration: 7, ease: "linear" } },
    exhale: { scale: 1, opacity: 0.2, transition: { duration: 8, ease: "easeInOut" } }
  };

  const textMap = {
    inhale: 'Breathe In...',
    hold: 'Hold...',
    exhale: 'Breathe Out...'
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black hover:border-gray-300 transition-colors z-40"
        title="Take a breath"
      >
        <Wind className="w-5 h-5" />
      </motion.button>

      {/* Expanded Zen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-72 h-80 bg-white/90 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-[0_20px_60px_rgb(0,0,0,0.15)] z-50 flex flex-col overflow-hidden"
          >
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100/50 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Outer pulsing circle */}
              <motion.div
                variants={circleVariants}
                animate={phase}
                className="absolute w-32 h-32 rounded-full bg-blue-100/50"
              />
              
              {/* Inner dot */}
              <div className="absolute w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              
              <div className="absolute bottom-12 text-center">
                <h3 className="font-heading font-extrabold text-lg text-gray-900 tracking-tight">
                  {textMap[phase]}
                </h3>
                <p className="text-sm font-mono text-gray-400 mt-1">
                  {timeLeft}s
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100/50 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                1-Minute Anxiety Relief
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
