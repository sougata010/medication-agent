import React from 'react';
import { motion } from 'framer-motion';

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-gray-900 tracking-tight mb-4">
          About <span className="text-blue-600">VitaLeaf</span>
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          We are on a mission to orchestrate the world's healthcare data using advanced artificial intelligence and semantic knowledge graphs.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
          <p className="text-gray-500 leading-relaxed">
            Healthcare is fragmented. We believe that by connecting disparate medical data points into a unified, intelligent graph, we can empower patients and providers to make safer, faster, and more accurate clinical decisions.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The Technology</h2>
          <p className="text-gray-500 leading-relaxed">
            VitaLeaf is built on a proprietary LLM-driven architecture that processes OCR telemetry, checks against millions of known pharmaceutical interactions, and actively monitors patient adherence in real-time.
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-blue-50 rounded-3xl p-10 text-center"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-2">Join the revolution.</h3>
        <p className="text-gray-500 mb-6">We are constantly looking for talented engineers and medical professionals.</p>
        <a href="/careers" className="inline-block bg-blue-600 text-white font-bold px-8 py-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
          View Open Roles
        </a>
      </motion.div>
    </div>
  );
}
