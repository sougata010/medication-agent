import React, { useState, useMemo, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { createPortal } from 'react-dom';
import {
  FlaskConical, CheckCircle2, AlertTriangle, AlertOctagon,
  Search, FileText, Calendar, Upload, ShieldAlert,
  Activity, Pill, ChevronRight, XOctagon, Info,
  Database, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global memory cache for chemical images to prevent redundant fetches
const imageCache = new Map();

// Separate Custom Hook for fetching chemical images
const useChemicalImage = (name) => {
  const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  const [src, setSrc] = useState(imageCache.get(cleanName)?.src || null);
  const [source, setSource] = useState(imageCache.get(cleanName)?.source || 'Fetching...');

  useEffect(() => {
    if (imageCache.has(cleanName)) {
      setSrc(imageCache.get(cleanName).src);
      setSource(imageCache.get(cleanName).source);
      return;
    }

    let isMounted = true;
    const fetchImage = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/chemical-image?name=${encodeURIComponent(cleanName)}`);
        const dbSource = res.headers.get('X-Image-Source') || 'Unknown DB';
        const blob = await res.blob();
        if (isMounted) {
          const objectUrl = URL.createObjectURL(blob);
          imageCache.set(cleanName, { src: objectUrl, source: dbSource });
          setSrc(objectUrl);
          setSource(dbSource);
        }
      } catch (err) {
        if (isMounted) setSource('Unknown DB');
      }
    };
    fetchImage();
    
    // We intentionally do not revoke the ObjectURL here because it is globally cached for the session.
    return () => { isMounted = false; };
  }, [cleanName]);

  return { src, source, cleanName };
};

// Mini component for the chemical card images
const ChemicalImg = ({ name }) => {
  const { src, cleanName } = useChemicalImage(name);
  return src ? (
    <img src={src} alt={cleanName} className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm" />
  ) : (
    <div className="w-full h-full bg-slate-100/50 rounded-xl animate-pulse" />
  );
};

// Mobile Folder View Component
const MobileMedicineFolder = ({ med, onSelectChem }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Folder Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
             <Pill className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
             <h3 className="text-base font-extrabold text-slate-800">{med.name}</h3>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{med.chemicals.length} Compounds</p>
          </div>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
           <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Folder Contents */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 border-t border-slate-100 flex flex-col gap-3 bg-white">
               {med.chemicals.map((chem, cIdx) => (
                  <div 
                    key={cIdx}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer group"
                    onClick={() => onSelectChem(chem)}
                  >
                     {/* Mini Image */}
                     <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden relative">
                        <ChemicalImg name={chem.name} />
                     </div>
                     
                     <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate mb-0.5">{chem.name}</h4>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-black text-slate-600">{chem.value} <span className="text-[10px] text-slate-400">{chem.unit}</span></span>
                           {chem.status === 'Banned' && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700">BANNED</span>}
                           {chem.status === 'Warning' && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">WARNING</span>}
                        </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                  </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LabReports() {
  const { labReports, handleUploadLabReport, labUploadLoading } = useGlobalContext();
  const [activeReportIdx, setActiveReportIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [selectedChemData, setSelectedChemData] = useState(null);

  const currentReport = labReports && labReports.length > 0 ? labReports[activeReportIdx] : null;
  const parameters = currentReport ? currentReport.parameters : [];

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
    
    return Object.values(grouped).filter(med => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      if (med.name.toLowerCase().includes(q)) return true;
      return med.chemicals.some(c => c.name.toLowerCase().includes(q));
    });
  }, [parameters, searchQuery]);

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
        <h2 className="text-2xl font-extrabold text-slate-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Analyzing Chemical Network</h2>
        <p className="text-slate-500 font-medium text-center max-w-md leading-relaxed">VitaLeaf is mapping the chemical structures and health risks using advanced AI processing.</p>
      </div>
    );
  }

  if (!labReports || labReports.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Chemical Analysis Report</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Upload a label or lab report for deep chemical network breakdown</p>
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
          <p className="text-slate-500 font-medium text-center max-w-md leading-relaxed">Upload a PDF or image. AI will automatically extract medicines and construct their chemical networks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in relative z-10 min-h-screen">
      <div className="absolute inset-0 bg-slate-50/30 pointer-events-none -z-10 rounded-3xl" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 px-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Interactive Network</h1>
          <p className="text-slate-500 font-medium mt-2 text-base">Chemical composition graphs of your medicines</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative overflow-hidden cursor-pointer group w-full md:w-auto">
            <input
              type="file"
              accept="image/*,.pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleUploadLabReport}
            />
            <button className="flex items-center justify-center w-full md:w-auto gap-2 px-5 py-3 md:py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors">
              <Upload className="w-4 h-4" /> Upload New
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW: Folder Accordions (Hidden on md+) */}
      <div className="flex flex-col gap-4 mt-6 md:hidden px-2">
        {medicines.map((med, idx) => (
          <MobileMedicineFolder 
            key={idx} 
            med={med} 
            onSelectChem={(chem) => setSelectedChemData({ chem, medName: med.name })} 
          />
        ))}
      </div>

      {/* DESKTOP VIEW: Network Trees (Hidden on mobile) */}
      <div className="hidden md:flex flex-col gap-12 mt-8">
        {medicines.map((med, idx) => (
          <div key={idx} className="w-full overflow-x-auto pb-8 pt-4 hide-scrollbar border-b border-slate-100 last:border-b-0">
            <div className="min-w-max flex flex-col items-center px-8 mx-auto">
              
              {/* ROOT NODE (Medicine) */}
              <motion.div 
                className="bg-white border-2 border-indigo-500 rounded-full pl-6 pr-8 py-3 shadow-lg shadow-indigo-100 flex items-center gap-4 z-10 cursor-default"
                whileHover={{ y: -2 }}
              >
                 <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                   <Pill className="w-5 h-5 text-indigo-600" />
                 </div>
                 <div>
                   <h3 className="text-xl font-extrabold text-slate-800 leading-none">{med.name}</h3>
                   <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-1">
                      {med.chemicals.length} Compounds
                   </p>
                 </div>
              </motion.div>

              {/* ROOT STEM */}
              <div className="w-0.5 h-10 bg-indigo-300" />

              {/* BRANCHING CONTAINER */}
              <div className="relative flex gap-6 px-4">
                 
                 {/* HORIZONTAL DISTRIBUTOR LINE */}
                 {med.chemicals.length > 1 && (
                   <div 
                     className="absolute top-0 h-0.5 bg-indigo-300"
                     style={{ left: '112px', right: '112px' }} // w-48 (192px) / 2 + px-4 (16px) = 112px
                   />
                 )}

                 {/* CHEMICAL NODES */}
                 {med.chemicals.map((chem, cIdx) => (
                    <motion.div 
                      key={cIdx} 
                      className="w-48 flex flex-col items-center group cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: cIdx * 0.05, type: 'spring' }}
                      onClick={() => setSelectedChemData({ chem, medName: med.name })}
                    >
                       
                       {/* CHILD STEM */}
                       <div className="w-0.5 h-10 bg-indigo-300 relative group-hover:bg-indigo-500 transition-colors">
                          {/* Node Dot */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-[3px] border-indigo-400 group-hover:scale-150 group-hover:border-indigo-600 transition-all z-10" />
                       </div>

                       {/* CHILD CARD */}
                       <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-200 group-hover:shadow-xl group-hover:border-indigo-400 group-hover:-translate-y-1 transition-all flex flex-col items-center text-center relative overflow-hidden">
                          {/* Highlight bar at top */}
                          <div className={`absolute top-0 left-0 right-0 h-1 
                            ${chem.status === 'Banned' ? 'bg-rose-500' : chem.status === 'Warning' ? 'bg-amber-500' : 'bg-transparent'}
                          `} />

                          {/* Image */}
                          <div className="w-20 h-20 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-indigo-50/50 transition-colors flex items-center justify-center">
                             <ChemicalImg name={chem.name} />
                          </div>
                          
                          <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1.5">{chem.name}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight line-clamp-2">{chem.chemicalType}</p>
                          
                          <div className="mt-4 w-full pt-3 border-t border-slate-100 flex flex-col items-center gap-2">
                             <div className="text-base font-black text-slate-800">{chem.value} <span className="text-[10px] text-slate-400 font-bold ml-0.5">{chem.unit}</span></div>
                             
                             {/* Risk Badges */}
                             {chem.status === 'Banned' && (
                               <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 w-full justify-center">
                                  <XOctagon className="w-3 h-3" /> Banned
                               </span>
                             )}
                             {chem.status === 'Warning' && (
                               <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 w-full justify-center">
                                  <AlertTriangle className="w-3 h-3" /> Warning
                               </span>
                             )}
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Modal Overlay - Uses React Portal to avoid Z-index clipping */}
      <AnimatePresence>
        {selectedChemData && (
          <ChemicalModal 
            data={selectedChemData} 
            onClose={() => setSelectedChemData(null)}
            parseRecommendation={parseRecommendation}
            getRiskColor={getRiskColor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Chemical Insights Modal
const ChemicalModal = ({ data, onClose, parseRecommendation, getRiskColor }) => {
  const { chem, medName } = data;
  const { src, source, cleanName } = useChemicalImage(chem.name);
  
  const rec = parseRecommendation(chem.recommendation);
  const isBanned = chem.status === 'Banned';
  const isWarning = chem.status === 'Warning';

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Modal Container */}
      <motion.div 
        className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-slate-50 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* HEADER (Fixed at top of modal) */}
        <div className="shrink-0 relative pt-10 pb-8 px-6 md:px-10 bg-slate-900 text-white overflow-hidden shadow-md z-20">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
          
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-30">
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* IMAGE */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-3xl shadow-xl p-3 flex items-center justify-center shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50" />
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                {src ? <img src={src} alt={cleanName} className="w-full h-full object-contain mix-blend-multiply" /> : <div className="w-full h-full bg-slate-200 animate-pulse rounded-xl" />}
              </div>
            </div>

            {/* TITLE & INFO */}
            <div className="flex-1 text-center sm:text-left pt-1">
              <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-2 border border-white/10">
                Found in {medName}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-4">{chem.name}</h2>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1.5 bg-indigo-500/30 rounded-lg border border-indigo-400/40 text-indigo-100 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider shadow-inner">
                  <Database className="w-3.5 h-3.5" /> {source}
                </span>
                <span className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider shadow-inner">
                  <Activity className="w-3.5 h-3.5" /> {chem.value} {chem.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BODY (Internal Scroll) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6 md:gap-8 bg-slate-50 relative z-10">
          {/* USES */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
            <h4 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" /> Clinical Uses & Purpose
            </h4>
            <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base">
              {rec?.uses || 'No standard uses provided.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* WARNINGS */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
              <h4 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-amber-500" /> Health Warnings
              </h4>
              <p className="text-slate-600 font-medium leading-relaxed text-xs md:text-sm">
                {rec?.cautions || 'None specified.'}
              </p>
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className={`text-xs md:text-sm font-bold ${getRiskColor(chem.risk)}`}>{chem.risk || 'No risk data available.'}</p>
              </div>
            </div>

            {/* BANNED STATUS */}
            <div className={`bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden ${isBanned ? 'ring-2 ring-rose-500/30' : ''}`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full ${isBanned ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <h4 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                {isBanned ? <AlertOctagon className="w-4 h-4 md:w-5 md:h-5 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />}
                Banned Status
              </h4>
              <p className="text-slate-600 font-medium leading-relaxed text-xs md:text-sm mb-4">
                {rec?.bannedIn || 'Not banned by major sports organizations or regulatory bodies.'}
              </p>
              {isBanned && rec?.text && (
                <div className="bg-rose-50 rounded-xl p-3 md:p-4 border border-rose-100">
                  <p className="text-[10px] md:text-xs text-rose-700 font-bold leading-relaxed">{rec.text}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
