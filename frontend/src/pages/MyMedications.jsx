import React, { useMemo, useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { Link } from 'react-router-dom';
import {
  Pill, CheckCircle2, AlertTriangle, Upload, Calendar,
  Info, ChevronRight, Clock, Beaker, Plus, Stethoscope, FileText, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';

// Medication Insights Component
const MedicationInsights = ({ prescriptions, reminders }) => {
  const [limit, setLimit] = useState(5);
  
  const totalMeds = prescriptions.reduce((acc, p) => acc + (p.items?.length || 0), 0);
  const verifiedMeds = prescriptions.reduce((acc, p) => acc + (p.verified ? (p.items?.length || 0) : 0), 0);
  
  // Combine uploads and adherence logs
  const activities = [
    ...prescriptions.map(p => ({
      id: `rx-${p.id}`,
      type: 'upload',
      title: 'Prescription Uploaded',
      date: p.uploadedAt,
      desc: `Added ${p.items?.length || 0} medication${(p.items?.length || 0) !== 1 ? 's' : ''} to your profile.`,
      icon: FileText,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 border-indigo-100'
    })),
    ...(reminders || []).filter(r => r.status === 'taken' || r.status === 'missed').map(r => ({
      id: `rem-${r.id}`,
      type: 'adherence',
      title: r.status === 'taken' ? 'Medication Taken' : 'Medication Missed',
      date: r.scheduledAt,
      desc: `${r.medicine?.name || 'Medication'}${r.dosage ? ` - ${r.dosage}` : ''}`,
      icon: r.status === 'taken' ? CheckCircle2 : AlertTriangle,
      color: r.status === 'taken' ? 'text-emerald-500' : 'text-rose-500',
      bg: r.status === 'taken' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 rx-card p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-900 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-10 pointer-events-none">
          <Activity className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h2 className="text-sm font-heading font-extrabold tracking-widest text-indigo-200 uppercase mb-4 flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Profile Summary
          </h2>
          <div className="space-y-6">
            <div>
              <p className="text-4xl font-black font-heading tracking-tight">{totalMeds}</p>
              <p className="text-sm font-medium text-indigo-200 mt-1">Total Active Medications</p>
            </div>
            <div className="flex items-center gap-4 border-t border-indigo-700/50 pt-4">
              <div className="flex-1">
                <p className="text-xl font-bold">{verifiedMeds}</p>
                <p className="text-xs text-indigo-300 font-medium">Verified by AI</p>
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">{prescriptions.length}</p>
                <p className="text-xs text-indigo-300 font-medium">Rx Uploads</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 rx-card p-6 flex flex-col max-h-[450px]">
        <h2 className="text-sm font-heading font-extrabold tracking-widest text-gray-500 uppercase mb-4 flex items-center gap-2 shrink-0">
          <Clock className="w-4 h-4" />
          Recent Activity
        </h2>
        
        {activities.length > 0 ? (
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {activities.slice(0, limit).map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100/50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${act.bg}`}>
                    <Icon className={`w-5 h-5 ${act.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-900 text-sm">{act.title}</h4>
                      <span className="text-xs font-mono font-bold text-gray-400">
                        {new Date(act.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {act.desc}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {limit < activities.length && (
              <button 
                onClick={() => setLimit(l => l + 5)}
                className="w-full py-3 mt-4 text-sm font-bold text-gray-500 hover:bg-gray-50 border border-dashed border-gray-200 rounded-xl transition-colors"
              >
                Show More
              </button>
            )}
          </div>
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
            <p className="text-sm text-gray-400 font-medium">No recent activity.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MyMedications() {
  const { prescriptions = [], handleAddManualMedication, reminders = [] } = useGlobalContext();
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

      {/* Medication Insights instead of Heatmap */}
      <MedicationInsights prescriptions={prescriptions} reminders={reminders} />

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
