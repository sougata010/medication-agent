import React, { useMemo } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { Link } from 'react-router-dom';
import {
  Pill, CheckCircle2, AlertTriangle, Upload, Calendar,
  Info, ChevronRight, Clock, Beaker
} from 'lucide-react';

export default function MyMedications() {
  const { prescriptions = [] } = useGlobalContext();

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
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Medications</h1>
          <p className="text-gray-500 font-medium mt-1">Active prescriptions and medication details</p>
        </div>
        <Link
          to="/dashboard/upload"
          className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Upload Prescription
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{medications.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Verified</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{medications.filter(m => m.verified).length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Review</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{medications.filter(m => !m.verified).length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Prescriptions</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{prescriptions.length}</div>
        </div>
      </div>

      {/* Medications Table */}
      {medications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 text-center">
          <Pill className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-lg font-extrabold text-gray-900 mb-2">No Active Medications</h3>
          <p className="text-gray-400 font-medium mb-4">Upload a prescription to get started</p>
          <Link to="/dashboard/upload" className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors">
            <Upload className="w-4 h-4" />
            Upload Now
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-gray-400" />
              Active Medications
            </h2>
            <span className="text-sm text-gray-400 font-medium">{medications.length} medications</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Medication</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Dosage</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Duration</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Category</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Mechanism</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {medications.map(med => (
                  <tr key={med.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{med.name}</div>
                        <div className="text-[11px] text-gray-400 font-medium">{med.genericName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-700">{med.dosage}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{med.frequency}</span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{med.duration}</span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        {med.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell max-w-[200px]">
                      <span className="text-xs text-gray-500 line-clamp-2" title={med.mechanism}>{med.mechanism}</span>
                    </td>
                    <td className="px-4 py-4">
                      {med.verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-100">
                          <AlertTriangle className="w-3 h-3" /> Review
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prescription History */}
      {prescriptionsByDate.length > 0 && (
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Prescription History
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptionsByDate.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Prescription #{p.id}</h3>
                    <span className="text-xs text-gray-400 font-medium">{p.dateLabel}</span>
                  </div>
                  {p.verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
                      Unverified
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {(p.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <Pill className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">{item.medicine?.name || 'Unknown'}</span>
                        <span className="text-[11px] text-gray-400">{item.dosage} · {item.frequency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
