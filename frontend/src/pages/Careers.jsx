import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Careers() {
  const openRoles = [
    { title: "Senior AI Engineer", department: "Engineering", location: "Remote (US)" },
    { title: "Clinical Data Specialist", department: "Medical", location: "New York, NY" },
    { title: "Product Designer", department: "Design", location: "San Francisco, CA" },
    { title: "Backend Systems Architect", department: "Engineering", location: "Remote (Global)" }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-gray-900 tracking-tight mb-4">
          Join the <span className="text-sky-500">Mission</span>
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          We are building the intelligence layer for healthcare. Come do the best work of your life with a team that values precision, design, and impact.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm"
      >
        <div className="p-8 border-b border-gray-100 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">Open Roles</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {openRoles.map((role, idx) => (
            <div key={idx} className="p-8 hover:bg-gray-50 transition-colors cursor-pointer group flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-900 transition-colors">{role.title}</h3>
                <div className="flex gap-4 mt-2 text-sm font-medium text-gray-500">
                  <span>{role.department}</span>
                  <span>&bull;</span>
                  <span>{role.location}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors">
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
