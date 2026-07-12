import React, { useState, useMemo, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import {
  FlaskConical, CheckCircle2, AlertTriangle, AlertOctagon,
  ChevronDown, Search, FileText, Calendar, Upload, ShieldAlert,
  Activity, CheckCircle, Pill, ChevronRight, XOctagon, Info,
  Database
} from 'lucide-react';
import { motion } from 'framer-motion';

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

  const getRiskColor = (risk) => {
    if (!risk) return 'text-slate-600';
    const r = risk.toLowerCase();
    if (r.includes('high') || r.includes('danger') || r.includes('contraindicated') || r.includes('severe')) return 'text-rose-600 font-bold';
    if (r.includes('moderate') || r.includes('caution') || r.includes('warning')) return 'text-amber-600 font-bold';
    return 'text-emerald-600 font-bold';
  };

  const getStatusBadge = (status) => {
    if (status === 'Safe') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-200/50 shadow-sm uppercase tracking-wider backdrop-blur-sm">
          <CheckCircle2 className="w-3.5 h-3.5" /> Safe
        </span>
      );
    }
    if (status === 'Banned') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold border border-rose-200/50 shadow-sm uppercase tracking-wider backdrop-blur-sm animate-pulse">
          <XOctagon className="w-3.5 h-3.5" /> Banned
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold border border-amber-200/50 shadow-sm uppercase tracking-wider backdrop-blur-sm">
        <AlertTriangle className="w-3.5 h-3.5" /> Warning
      </span>
    );
  };

  if (labUploadLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white/40 to-purple-50/40 -z-10 rounded-3xl" />
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6 shadow-lg shadow-indigo-200/50 mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <FlaskConical className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Analyzing Chemical Composition</h2>
        <p className="text-slate-500 font-medium text-center max-w-md leading-relaxed">VitaLeaf is extracting structured chemical data, banned status, and health warnings using advanced AI processing.</p>
      </div>
    );
  }

  if (!labReports || labReports.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Chemical Analysis Report</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Upload a label or lab report for deep chemical breakdown</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-b from-white to-slate-50/50 rounded-3xl border-2 border-dashed border-indigo-200/60 hover:border-indigo-400 transition-all duration-300 relative group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-100/50">
          <input
            type="file"
            accept="image/*,.pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleUploadLabReport}
          />
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 border border-indigo-100 group-hover:bg-indigo-100 transition-colors shadow-inner">
            <Upload className="w-10 h-10 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Upload Analysis Document</h2>
          <p className="text-slate-500 font-medium text-center max-w-md leading-relaxed">Upload a PDF or image. AI will automatically extract medicines and their chemical structures to verify safety.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in relative z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/30 pointer-events-none -z-10 rounded-3xl" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 px-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Chemical Analysis</h1>
          <p className="text-slate-500 font-medium mt-2 text-base">Medicine-wise chemical breakdown and safety audit</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Upload New Button */}
          <div className="relative overflow-hidden cursor-pointer group">
            <input
              type="file"
              accept="image/*,.pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleUploadLabReport}
            />
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-indigo-200/50 group-hover:shadow-indigo-300/50 group-hover:-translate-y-0.5 transition-all duration-300">
              <Upload className="w-4 h-4" /> Upload New
            </button>
          </div>

          {/* Report Picker */}
          {labReports.length > 1 && (
            <div className="relative group">
              <select
                value={activeReportIdx}
                onChange={(e) => setActiveReportIdx(Number(e.target.value))}
                className="appearance-none bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-xl px-5 py-2.5 pr-10 text-sm font-bold text-slate-700 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
              >
                {labReports.map((r, i) => (
                  <option key={r.id} value={i} className="font-semibold">
                    Report {i + 1} — {new Date(r.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 px-2">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-6 shadow-xl shadow-slate-200/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-200/40 transition-all duration-300 group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border border-white/60 shadow-inner group-hover:shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-shadow duration-300">
              <Pill className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Medicines Analyzed</span>
          </div>
          <div className="text-4xl font-extrabold text-slate-800 tracking-tight">{totalMedicines}</div>
          <p className="text-sm text-slate-500 font-medium mt-2">Total products found</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-6 shadow-xl shadow-slate-200/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-200/40 transition-all duration-300 group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center border border-white/60 shadow-inner group-hover:shadow-[0_0_20px_rgba(225,29,72,0.2)] transition-shadow duration-300">
              <XOctagon className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Banned Substances</span>
          </div>
          <div className={`text-4xl font-extrabold tracking-tight ${totalBanned > 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600' : 'text-slate-800'}`}>{totalBanned}</div>
          <p className="text-sm text-slate-500 font-medium mt-2">Illegal or banned chemicals</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-6 shadow-xl shadow-slate-200/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-200/40 transition-all duration-300 group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center border border-white/60 shadow-inner group-hover:shadow-[0_0_20px_rgba(217,119,6,0.2)] transition-shadow duration-300">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Health Warnings</span>
          </div>
          <div className={`text-4xl font-extrabold tracking-tight ${totalWarnings > 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600' : 'text-slate-800'}`}>{totalWarnings}</div>
          <p className="text-sm text-slate-500 font-medium mt-2">High dosages or side effects</p>
        </div>
      </div>

      {/* Report Info & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 px-2 mt-2">
        <div className="flex items-center gap-6 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/40 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold">{currentReport ? new Date(currentReport.uploadedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
          </div>
          <div className="w-px h-4 bg-slate-300" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500" />
            <span className="font-semibold">ID: {currentReport?.id || '—'}</span>
          </div>
        </div>
        
        <div className="relative w-full sm:w-96 group">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search medicines or chemicals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-3 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all duration-300 shadow-sm"
          />
        </div>
      </div>

      {/* Medicine Trees */}
      <motion.div 
        className="flex flex-col gap-8 px-2 pb-12"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } },
          hidden: {}
        }}
      >
        {medicines.map((med, idx) => (
          <motion.div 
            key={idx} 
            className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden relative group/card hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
            }}
          >
            {/* Medicine Header */}
            <div className={`px-6 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/40 ${med.hasBanned ? 'bg-gradient-to-r from-rose-50 to-pink-50/30' : med.hasWarning ? 'bg-gradient-to-r from-amber-50 to-orange-50/30' : 'bg-gradient-to-r from-slate-50/80 to-white'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-sm ${med.hasBanned ? 'bg-white border-rose-200' : med.hasWarning ? 'bg-white border-amber-200' : 'bg-white border-indigo-100'}`}>
                  <Pill className={`w-7 h-7 ${med.hasBanned ? 'text-rose-500' : med.hasWarning ? 'text-amber-500' : 'text-indigo-500'}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{med.name}</h2>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
                      {med.chemicals.length} Chemicals Found
                    </span>
                    {med.hasBanned && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-md uppercase tracking-wider border border-rose-200/60 shadow-sm flex items-center gap-1">
                        <XOctagon className="w-3 h-3" />
                        Contains Banned Substance
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chemical Breakdown List */}
            <div className="divide-y divide-slate-100/60 flex flex-col bg-white/40">
              {med.chemicals.map((chem, cIdx) => (
                <ChemicalRow 
                  key={cIdx} 
                  chem={chem}
                  parseRecommendation={parseRecommendation}
                  getRiskColor={getRiskColor}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          </motion.div>
        ))}

        {medicines.length === 0 && !labUploadLoading && (
          <div className="py-20 text-center bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No matches found</h3>
            <p className="text-slate-500 font-medium mt-1">Try searching for a different medicine or chemical.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const ChemicalRow = ({ chem, parseRecommendation, getRiskColor, getStatusBadge }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const rec = parseRecommendation(chem.recommendation);
  const isBanned = chem.status === 'Banned';
  const isWarning = chem.status === 'Warning';
  
  // Clean name for PubChem API (remove parentheses and their contents)
  const cleanChemName = chem.name.replace(/\s*\(.*?\)\s*/g, '').trim();
  
  const [imageSrc, setImageSrc] = useState(null);
  const [imageSource, setImageSource] = useState('Fetching...');

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/chemical-image?name=${encodeURIComponent(cleanChemName)}`);
        const source = res.headers.get('X-Image-Source') || 'Unknown DB';
        const blob = await res.blob();
        if (isMounted) {
          setImageSrc(URL.createObjectURL(blob));
          setImageSource(source);
        }
      } catch (err) {
        if (isMounted) setImageSource('Unknown DB');
      }
    };
    fetchImage();
    return () => { isMounted = false; };
  }, [cleanChemName]);
  
  return (
    <div className="p-5 sm:p-7 transition-all duration-300 hover:bg-white/80 cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-5 flex-1">
          <div className="shrink-0 bg-white rounded-2xl border border-slate-100 p-2 shadow-sm group-hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent -z-10" />
            {imageSrc ? (
              <img 
                src={imageSrc} 
                alt={cleanChemName} 
                className="w-12 h-12 object-contain mix-blend-multiply"
              />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center animate-pulse bg-slate-100 rounded-lg"></div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{chem.name}</h3>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-200/50 shadow-sm uppercase tracking-wider flex items-center gap-1">
                {chem.chemicalType}
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/50 shadow-sm uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400" />
                Source: {imageSource}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-5 justify-between md:justify-end w-full md:w-auto">
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {chem.value} <span className="text-base text-slate-400 font-bold ml-0.5">{chem.unit}</span>
            </div>
          </div>
          <div className="w-px h-10 bg-slate-200/60 hidden md:block" />
          <div className="flex items-center gap-4">
            {getStatusBadge(chem.status)}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${isExpanded ? 'bg-indigo-600 text-white shadow-indigo-200/50' : 'bg-white text-slate-400 border border-slate-200 group-hover:border-indigo-200 group-hover:text-indigo-500'}`}>
              <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6 pt-6 border-t border-slate-100/80">
          {/* Uses / Insight */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group/insight">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover/insight:opacity-100" />
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-100/50 rounded-lg">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Clinical Uses</h4>
            </div>
            <p className="text-sm text-slate-700 font-medium leading-relaxed relative z-10">{rec?.uses || 'No standard uses provided.'}</p>
            
            <div className="mt-4 pt-4 border-t border-slate-200/40 relative z-10">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className={`text-xs ${getRiskColor(chem.risk)}`}>{chem.risk || 'No risk data available.'}</p>
              </div>
            </div>
          </div>

          {/* Warnings & Cautions */}
          <div className={`${isWarning || isBanned ? 'bg-gradient-to-br from-amber-50/80 to-orange-50/30 border-amber-200/60' : 'bg-gradient-to-br from-slate-50 to-white border-slate-100'} rounded-2xl p-5 border shadow-sm relative overflow-hidden group/warn`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover/warn:opacity-100 ${isWarning || isBanned ? 'bg-amber-500/10' : 'bg-slate-500/5'}`} />
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className={`p-1.5 rounded-lg ${isWarning || isBanned ? 'bg-amber-100/50' : 'bg-slate-100/50'}`}>
                <ShieldAlert className={`w-4 h-4 ${isWarning || isBanned ? 'text-amber-600' : 'text-slate-500'}`} />
              </div>
              <h4 className={`text-[11px] font-bold uppercase tracking-widest ${isWarning || isBanned ? 'text-amber-700' : 'text-slate-500'}`}>
                Health Warnings & Cautions
              </h4>
            </div>
            <p className={`text-sm font-medium leading-relaxed relative z-10 ${isWarning || isBanned ? 'text-amber-900' : 'text-slate-700'}`}>
              {rec?.cautions || 'None specified.'}
            </p>
          </div>

          {/* Banned Status */}
          <div className={`${isBanned ? 'bg-gradient-to-br from-rose-50/80 to-pink-50/30 border-rose-200/60' : 'bg-gradient-to-br from-slate-50 to-white border-slate-100'} rounded-2xl p-5 border shadow-sm relative overflow-hidden group/ban`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover/ban:opacity-100 ${isBanned ? 'bg-rose-500/10' : 'bg-slate-500/5'}`} />
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className={`p-1.5 rounded-lg ${isBanned ? 'bg-rose-100/50' : 'bg-slate-100/50'}`}>
                <AlertOctagon className={`w-4 h-4 ${isBanned ? 'text-rose-600' : 'text-slate-500'}`} />
              </div>
              <h4 className={`text-[11px] font-bold uppercase tracking-widest ${isBanned ? 'text-rose-700' : 'text-slate-500'}`}>
                Banned In
              </h4>
            </div>
            <p className={`text-sm font-medium leading-relaxed relative z-10 ${isBanned ? 'text-rose-900' : 'text-slate-700'}`}>
              {rec?.bannedIn || 'Not banned.'}
            </p>
            {isBanned && rec?.text && (
              <div className="mt-4 pt-4 border-t border-rose-200/40 relative z-10">
                <p className="text-xs text-rose-700 font-bold bg-white/50 px-3 py-2 rounded-lg border border-rose-100/50 inline-block">{rec.text}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
