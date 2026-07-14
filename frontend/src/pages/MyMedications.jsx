import React, { useMemo, useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { Link } from 'react-router-dom';
import {
  Pill, CheckCircle2, AlertTriangle, Upload, Calendar,
  Info, ChevronRight, Clock, Beaker, Plus, Stethoscope, FileText, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';

// Activity Heatmap Component
const ActivityHeatmap = ({ prescriptions }) => {
  const dataMap = useMemo(() => {
    const map = new Map();
    prescriptions.forEach(p => {
      const d = new Date(p.uploadedAt).toISOString().split('T')[0];
      map.set(d, (map.get(d) || 0) + (p.items?.length || 1));
    });
    return map;
  }, [prescriptions]);

  // Generate last 100 days
  const today = new Date();
  const days = [];
  for (let i = 99; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const getColor = (count) => {
    if (count === 0) return '#f1f5f9';
    if (count <= 2) return '#bae6fd';
    if (count <= 5) return '#38bdf8';
    return '#0284c7';
  };

  return (
    <div className="rx-card p-6 flex flex-col md:flex-row items-center gap-8">
      <div className="md:w-64 shrink-0">
        <h2 className="text-xl font-heading font-extrabold tracking-tight text-gray-900 flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-gray-500" />
          Medication Activity
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          Heatmap tracking prescription uploads and updates over the past 100 days.
        </p>
      </div>
      
      <div className="flex-1 overflow-x-auto pb-2">
        <div className="inline-flex gap-1" style={{ minWidth: 'min-content' }}>
          {Array.from({ length: 14 }).map((_, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, rowIndex) => {
                const dayIndex = colIndex * 7 + rowIndex;
                if (dayIndex >= 100) return null;
                const dateStr = days[dayIndex];
                const count = dataMap.get(dateStr) || 0;
                return (
                  <motion.div
                    key={rowIndex}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: dayIndex * 0.005 }}
                    className="w-3 h-3 rounded-sm relative group cursor-pointer"
                    style={{ backgroundColor: getColor(count) }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {dateStr}: {count} action(s)
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#f1f5f9' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#bae6fd' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#38bdf8' }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#0284c7' }} />
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default function MyMedications() {
  const { prescriptions = [], handleAddManualMedication } = useGlobalContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manualMed, setManualMed] = useState({
    drugName: '',
    dosage: '',
    frequency: '',
    duration: '',
    timing: ['morning']
  });
  const [isAdding, setIsAdding] = useState(false);

  const submitManualMed = async () => {
    if (!manualMed.drugName) return alert('Drug name is required');
    setIsAdding(true);
    await handleAddManualMedication(manualMed, () => {
      setIsAddModalOpen(false);
      setManualMed({ drugName: '', dosage: '', frequency: '', duration: '', timing: ['morning'] });
    });
    setIsAdding(false);
  };


  // Extract all medications from prescriptions with full details
  const medications = useMemo(() => {
    const medsMap = new Map();
    prescriptions.forEach(p => {
      if (!p.items) return;
      p.items.forEach(item => {
        const medId = item.medicineId || item.medicine?.id;
        if (medId && !medsMap.has(medId)) {
          medsMap.set(medId, {
            id: medId,
            name: item.medicine?.name || 'Unknown',
            genericName: item.medicine?.genericName || '—',
            category: item.medicine?.category || '—',
            mechanism: item.medicine?.mechanism || '—',
            dosage: item.dosage || '—',
            frequency: item.frequency || '—',
            duration: item.duration || '—',
            timing: item.timing || [],
            verified: p.verified,
            prescriptionDate: p.uploadedAt,
          });
        }
      });
    });
    return Array.from(medsMap.values());
  }, [prescriptions]);

  // Group prescriptions by date
  const prescriptionsByDate = useMemo(() => {
    return prescriptions.map(p => ({
      ...p,
      dateLabel: new Date(p.uploadedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    }));
  }, [prescriptions]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-gray-900">Medications</h1>
          <p className="text-gray-900/70 font-medium mt-1">Active prescriptions and medication details</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="med-btn-outline !rounded-full"
          >
            <Plus className="w-4 h-4" />
            Add Manually
          </button>
          <Link
            to="/dashboard/upload"
            className="med-btn-primary !rounded-full"
          >
            <Upload className="w-4 h-4" />
            Upload Rx
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rx-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4 text-gray-500" />
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active</span>
          </div>
          <div className="text-2xl font-heading font-extrabold text-gray-900">{medications.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-sky-500">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
            <span className="text-[11px] font-bold text-sky-500 uppercase tracking-wider">Verified</span>
          </div>
          <div className="text-2xl font-heading font-extrabold text-sky-600">{medications.filter(m => m.verified).length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-indigo-500" />
            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Review</span>
          </div>
          <div className="text-2xl font-heading font-extrabold text-indigo-600">{medications.filter(m => !m.verified).length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Prescriptions</span>
          </div>
          <div className="text-2xl font-heading font-extrabold text-gray-900">{prescriptions.length}</div>
        </div>
      </div>

      {/* Medications Table */}
      {medications.length === 0 ? (
        <div className="rx-card py-16 text-center rx-watermark overflow-hidden">
          <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3 relative z-10" />
          <h3 className="text-lg font-heading font-extrabold text-gray-900 mb-2 relative z-10">No Active Medications</h3>
          <p className="text-gray-400 font-medium mb-4 relative z-10">Upload a prescription to get started</p>
          <Link to="/dashboard/upload" className="med-btn-primary !rounded-full !inline-flex relative z-10">
            <Upload className="w-4 h-4" />
            Upload Rx
          </Link>
        </div>
      ) : (
        <div className="rx-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100/60 flex items-center justify-between">
            <h2 className="text-lg font-heading font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-gray-500" />
              Active Medications
            </h2>
            <span className="text-sm text-gray-500 font-medium font-mono">{medications.length} medications</span>
          </div>
          <div className="overflow-x-auto">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th className="hidden md:table-cell">Duration</th>
                  <th className="hidden lg:table-cell">Category</th>
                  <th className="hidden xl:table-cell">Mechanism</th>
                  <th>Status</th>
                </tr>
              </thead>
              <motion.tbody 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.05 } },
                  hidden: {}
                }}
              >
                {medications.map(med => (
                  <motion.tr 
                    key={med.id} 
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <td>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{med.name}</div>
                        <div className="text-[11px] text-gray-500 font-medium">{med.genericName}</div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-mono font-medium text-gray-700">{med.dosage}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">{med.frequency}</span>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="text-sm text-gray-600 font-mono">{med.duration}</span>
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="px-2 py-1 rounded-lg bg-gray-50 text-gray-900 text-[11px] font-bold uppercase tracking-wider border border-gray-100">
                        {med.category}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell max-w-[200px]">
                      <span className="text-xs text-gray-500 line-clamp-2" title={med.mechanism}>{med.mechanism}</span>
                    </td>
                    <td>
                      {med.verified ? (
                        <span className="clinical-badge clinical-badge-success">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="clinical-badge clinical-badge-warning">
                          <AlertTriangle className="w-3 h-3" /> Review
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      {prescriptionsByDate.length > 0 && (
        <ActivityHeatmap prescriptions={prescriptionsByDate} />
      )}

      {/* Prescription History */}
      {prescriptionsByDate.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-extrabold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            Prescription History
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptionsByDate.map((p, idx) => (
              <motion.div 
                key={p.id} 
                className="rx-card p-5 rx-watermark overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Rx #{p.id}</h3>
                    <span className="text-xs text-gray-500 font-mono">{p.dateLabel}</span>
                  </div>
                  {p.verified ? (
                    <span className="clinical-badge clinical-badge-success">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="clinical-badge clinical-badge-warning">
                      Unverified
                    </span>
                  )}
                </div>
                <div className="rx-divider" />
                <div className="flex flex-col gap-2 relative z-10">
                  {(p.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/50 border border-gray-100/50">
                      <Pill className="w-4 h-4 text-gray-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">{item.medicine?.name || 'Unknown'}</span>
                        <span className="text-[11px] text-gray-400 font-mono">{item.dosage} · {item.frequency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add Manual Medication Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add Medication Manually"
        icon={Pill}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Drug Name *</label>
            <input
              type="text"
              value={manualMed.drugName}
              onChange={(e) => setManualMed({ ...manualMed, drugName: e.target.value })}
              placeholder="e.g. Lisinopril"
              className="clinical-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Dosage</label>
              <input
                type="text"
                value={manualMed.dosage}
                onChange={(e) => setManualMed({ ...manualMed, dosage: e.target.value })}
                placeholder="e.g. 10mg"
                className="clinical-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Frequency</label>
              <input
                type="text"
                value={manualMed.frequency}
                onChange={(e) => setManualMed({ ...manualMed, frequency: e.target.value })}
                placeholder="e.g. Once daily"
                className="clinical-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Duration</label>
            <input
              type="text"
              value={manualMed.duration}
              onChange={(e) => setManualMed({ ...manualMed, duration: e.target.value })}
              placeholder="e.g. 30 days"
              className="clinical-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Schedule Timing</label>
            <div className="flex flex-wrap gap-2">
              {['morning', 'noon', 'evening', 'night'].map(t => {
                const isSelected = manualMed.timing.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => {
                      if (isSelected) {
                        setManualMed({ ...manualMed, timing: manualMed.timing.filter(x => x !== t) });
                      } else {
                        setManualMed({ ...manualMed, timing: [...manualMed.timing, t] });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                      isSelected
                        ? 'bg-black text-white border-blue-700'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="med-btn-outline !rounded-full"
            >
              Cancel
            </button>
            <button
              onClick={submitManualMed}
              disabled={isAdding}
              className="med-btn-primary !rounded-full"
            >
              {isAdding ? 'Adding...' : 'Add Medication'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
