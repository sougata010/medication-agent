import React, { useState, useMemo } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import {
  FlaskConical, CheckCircle2, AlertTriangle, AlertOctagon,
  ChevronDown, Search, FileText, Calendar, Upload, ShieldAlert,
  Activity, CheckCircle, Pill, ChevronRight, XOctagon, Info
} from 'lucide-react';

export default function LabReports() {
  const { labReports, handleUploadLabReport, labUploadLoading } = useGlobalContext();
  const [activeReportIdx, setActiveReportIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const currentReport = labReports && labReports.length > 0 ? labReports[activeReportIdx] : null;
  const parameters = currentReport ? currentReport.parameters : [];

  // Group parameters by Category (Medicine Name)
  const medicines = useMemo(() => {
    const grouped = {};
    parameters.forEach(p => {
      const medName = p.category || 'Unknown Medicine';
      if (!grouped[medName]) {
        grouped[medName] = {
          name: medName,
          chemicals: [],
          hasBanned: false,
          hasWarning: false,
        };
      }
      grouped[medName].chemicals.push(p);
      if (p.status === 'Banned') grouped[medName].hasBanned = true;
      if (p.status === 'Warning') grouped[medName].hasWarning = true;
    });
    
    // Filter by search query on medicine name or chemical name
    return Object.values(grouped).filter(med => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      if (med.name.toLowerCase().includes(q)) return true;
      return med.chemicals.some(c => c.name.toLowerCase().includes(q));
    });
  }, [parameters, searchQuery]);

  // Stats
  const totalMedicines = Object.keys(useMemo(() => {
    const grouped = {};
    parameters.forEach(p => grouped[p.category || 'Unknown Medicine'] = true);
    return grouped;
  }, [parameters])).length;

  const totalBanned = parameters.filter(p => p.status === 'Banned').length;
  const totalWarnings = parameters.filter(p => p.status === 'Warning').length;

  // Helper to parse recommendation JSON
  const parseRecommendation = (recStr) => {
    try {
      if (!recStr) return null;
      return JSON.parse(recStr);
    } catch {
      return { text: recStr, cautions: null, bannedIn: null, uses: null };
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Safe') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 shadow-sm uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" /> Safe
        </span>
      );
    }
    if (status === 'Banned') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-bold border border-red-300 shadow-sm uppercase tracking-wider animate-pulse">
          <XOctagon className="w-3.5 h-3.5" /> Banned
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300 shadow-sm uppercase tracking-wider">
        <AlertTriangle className="w-3.5 h-3.5" /> Warning
      </span>
    );
  };

  if (labUploadLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Analyzing Chemical Composition</h2>
        <p className="text-gray-500 font-medium text-center max-w-sm">MedGraph AI is extracting structured chemical data, banned status, and health warnings from the document.</p>
      </div>
    );
  }

  if (!labReports || labReports.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Chemical Analysis Report</h1>
          <p className="text-gray-500 font-medium mt-1">Upload a label or lab report for deep chemical breakdown</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors relative group cursor-pointer">
          <input
            type="file"
            accept="image/*,.pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleUploadLabReport}
          />
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-200 group-hover:bg-gray-100 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Upload Analysis Document</h2>
          <p className="text-gray-500 font-medium text-center max-w-sm">Upload a PDF or image. AI will automatically extract medicines and their chemical structures to verify safety.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Chemical Analysis</h1>
          <p className="text-gray-500 font-medium mt-1">Medicine-wise chemical breakdown and safety audit</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Upload New Button */}
          <div className="relative overflow-hidden cursor-pointer">
            <input
              type="file"
              accept="image/*,.pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleUploadLabReport}
            />
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors">
              <Upload className="w-4 h-4" /> Upload New
            </button>
          </div>

          {/* Report Picker */}
          {labReports.length > 1 && (
            <div className="relative">
              <select
                value={activeReportIdx}
                onChange={(e) => setActiveReportIdx(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-900 cursor-pointer hover:border-gray-300 transition-colors focus:outline-none focus:border-gray-400"
              >
                {labReports.map((r, i) => (
                  <option key={r.id} value={i}>
                    Report {i + 1} — {new Date(r.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <Pill className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Medicines Analyzed</span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{totalMedicines}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">Total products found</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
              <XOctagon className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Banned Substances</span>
          </div>
          <div className={`text-3xl font-extrabold ${totalBanned > 0 ? 'text-red-600' : 'text-gray-900'}`}>{totalBanned}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">Illegal or banned chemicals</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Health Warnings</span>
          </div>
          <div className={`text-3xl font-extrabold ${totalWarnings > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{totalWarnings}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">High dosages or side effects</p>
        </div>
      </div>

      {/* Report Info & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Date: {currentReport ? new Date(currentReport.uploadedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span className="font-medium">ID: {currentReport?.id || '—'}</span>
          </div>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medicines or chemicals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Medicine Trees */}
      <div className="flex flex-col gap-8">
        {medicines.map((med, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Medicine Header */}
            <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between ${med.hasBanned ? 'bg-red-50/50' : med.hasWarning ? 'bg-amber-50/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${med.hasBanned ? 'bg-white border-red-200' : 'bg-white border-gray-200'}`}>
                  <Pill className={`w-6 h-6 ${med.hasBanned ? 'text-red-500' : med.hasWarning ? 'text-amber-500' : 'text-blue-500'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">{med.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{med.chemicals.length} Chemicals Found</span>
                    {med.hasBanned && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-200">
                        Contains Banned Substance
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chemical Breakdown List */}
            <div className="divide-y divide-gray-100">
              {med.chemicals.map((chem, cIdx) => {
                const rec = parseRecommendation(chem.recommendation);
                const isBanned = chem.status === 'Banned';
                const isWarning = chem.status === 'Warning';
                
                return (
                  <div key={cIdx} className="p-6 transition-colors hover:bg-gray-50/30">
                    {/* Top Row: Chemical Name, Value, Status */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{chem.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {chem.chemicalType}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">Confidence: {chem.confidence}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 ml-8 md:ml-0">
                        <div className="text-right">
                          <div className="text-xl font-extrabold text-gray-900">
                            {chem.value} <span className="text-sm text-gray-500 font-medium">{chem.unit}</span>
                          </div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 hidden md:block" />
                        <div>
                          {getStatusBadge(chem.status)}
                        </div>
                      </div>
                    </div>

                    {/* Infographic Style Details */}
                    <div className="ml-8 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      
                      {/* Uses / Insight */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Clinical Uses</h4>
                        </div>
                        <p className="text-sm text-gray-800 font-medium">{rec?.uses || 'No standard uses provided.'}</p>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-600 font-medium">{chem.risk}</p>
                          </div>
                        </div>
                      </div>

                      {/* Warnings & Cautions */}
                      <div className={`${isWarning || isBanned ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'} rounded-xl p-4 border`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <ShieldAlert className={`w-4 h-4 ${isWarning || isBanned ? 'text-amber-500' : 'text-gray-400'}`} />
                          <h4 className={`text-[11px] font-bold uppercase tracking-wider ${isWarning || isBanned ? 'text-amber-700' : 'text-gray-500'}`}>
                            Health Warnings & Cautions
                          </h4>
                        </div>
                        <p className={`text-sm font-medium ${isWarning || isBanned ? 'text-amber-900' : 'text-gray-800'}`}>
                          {rec?.cautions || 'None specified.'}
                        </p>
                      </div>

                      {/* Banned Status */}
                      <div className={`${isBanned ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'} rounded-xl p-4 border`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertOctagon className={`w-4 h-4 ${isBanned ? 'text-red-500' : 'text-gray-400'}`} />
                          <h4 className={`text-[11px] font-bold uppercase tracking-wider ${isBanned ? 'text-red-700' : 'text-gray-500'}`}>
                            Banned In
                          </h4>
                        </div>
                        <p className={`text-sm font-medium ${isBanned ? 'text-red-900' : 'text-gray-800'}`}>
                          {rec?.bannedIn || 'Not banned.'}
                        </p>
                        {isBanned && rec?.text && (
                          <div className="mt-3 pt-3 border-t border-red-200">
                            <p className="text-xs text-red-700 font-bold">{rec.text}</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {medicines.length === 0 && !labUploadLoading && (
          <div className="py-16 text-center bg-white rounded-2xl border border-gray-200">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No medicines match your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
