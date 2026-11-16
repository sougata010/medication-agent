import React, { useState, useMemo, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  FlaskConical, CheckCircle2, AlertTriangle, AlertOctagon,
  Search, FileText, Calendar, Upload, ShieldAlert,
  Activity, Pill, ChevronRight, XOctagon, Info,
  Database, X, HeartPulse, Stethoscope, ChevronDown, ShoppingBag
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
    
    return () => { isMounted = false; };
  }, [cleanName]);

  return { src, source, cleanName };
};

// Mini component for chemical images
const ChemicalImg = ({ name }) => {
  const { src, cleanName } = useChemicalImage(name);
  return src ? (
    <img src={src} alt={cleanName} className="w-full h-full object-contain mix-blend-multiply" />
  ) : (
    <div className="w-full h-full bg-gray-50 rounded-lg animate-pulse" />
  );
};

// Status badge component
const StatusBadge = ({ status }) => {
  if (status === 'Banned') {
    return (
      <span className="clinical-badge clinical-badge-danger">
        <XOctagon className="w-3 h-3" /> Banned
      </span>
    );
  }
  if (status === 'Warning') {
    return (
      <span className="clinical-badge clinical-badge-warning">
        <AlertTriangle className="w-3 h-3" /> Caution
      </span>
    );
  }
  return (
    <span className="clinical-badge clinical-badge-success">
      <CheckCircle2 className="w-3 h-3" /> Normal
    </span>
  );
};

// Mobile Collapsible Section
const MobileMedicineSection = ({ med, onSelectChem, onBuyMed }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rx-card overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
             <Pill className="w-5 h-5 text-gray-900" />
          </div>
          <div className="min-w-0">
             <h3 className="text-base font-heading font-extrabold text-gray-900 truncate">{med.name}</h3>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono">{med.chemicals.length} Parameters</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuyMed(med);
            }}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-xs"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Buy</span>
          </button>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 border-t border-gray-100 flex flex-col gap-2 bg-white">
               {med.chemicals.map((chem, cIdx) => (
                  <div 
                    key={cIdx}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100/50 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all cursor-pointer group"
                    onClick={() => onSelectChem(chem)}
                  >
                     <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        <ChemicalImg name={chem.name} />
                     </div>
                     
                     <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate mb-0.5">{chem.name}</h4>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-mono font-bold text-gray-900">{chem.value} <span className="text-[10px] text-gray-400">{chem.unit}</span></span>
                           <StatusBadge status={chem.status} />
                        </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
                  </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// SVG Radar Chart Component
const BiomarkerRadarChart = ({ parameters }) => {
  const categoryCounts = useMemo(() => {
    const counts = {};
    parameters.forEach(p => {
      const cat = p.chemicalType || p.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
    // Fill up to 5 points if less
    while (sorted.length > 0 && sorted.length < 5) {
      sorted.push([`N/A ${sorted.length}`, 0]);
    }
    return sorted;
  }, [parameters]);

  if (categoryCounts.length < 3) {
    return <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-medium">Need more data</div>;
  }

  const maxVal = Math.max(...categoryCounts.map(c => c[1]), 5);
  const centerX = 120;
  const centerY = 120;
  const radius = 80;

  const getCoordinatesForAngle = (angle, value) => {
    const r = (value / maxVal) * radius;
    const x = centerX + r * Math.cos(angle - Math.PI / 2);
    const y = centerY + r * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  const points = categoryCounts.map((c, i) => {
    const angle = (Math.PI * 2 * i) / categoryCounts.length;
    return getCoordinatesForAngle(angle, c[1]);
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <svg className="w-full h-full" viewBox="0 0 240 240">
      {/* Background Web */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((scale, idx) => {
        const webPoints = categoryCounts.map((_, i) => {
          const angle = (Math.PI * 2 * i) / categoryCounts.length;
          const { x, y } = getCoordinatesForAngle(angle, maxVal * scale);
          return `${x},${y}`;
        }).join(' ');
        return <polygon key={idx} points={webPoints} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
      })}

      {/* Axis Lines & Labels */}
      {categoryCounts.map((c, i) => {
        const angle = (Math.PI * 2 * i) / categoryCounts.length;
        const outer = getCoordinatesForAngle(angle, maxVal);
        const labelPos = getCoordinatesForAngle(angle, maxVal * 1.25);
        return (
          <g key={i}>
            <line x1={centerX} y1={centerY} x2={outer.x} y2={outer.y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" className="text-[9px] font-bold fill-gray-600 uppercase tracking-widest">
              {c[0].substring(0, 10)}
            </text>
          </g>
        );
      })}

      {/* Data Polygon */}
      <motion.path
        initial={{ scale: 0, opacity: 0, transformOrigin: 'center' }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        d={polygonPath}
        fill="rgba(17, 24, 39, 0.1)"
        stroke="#111827"
        strokeWidth="2"
      />

      {/* Data Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
      ))}
    </svg>
  );
};

export default function LabReports() {
  const { labReports, handleUploadLabReport, labUploadLoading, user } = useGlobalContext();
  const navigate = useNavigate();
  const [activeReportIdx, setActiveReportIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [selectedChemData, setSelectedChemData] = useState(null);

  const handleOpenBuy = (med) => {
    const medName = med?.name || 'Prescription Medicine';
    navigate(`/dashboard/pharmacies?search=${encodeURIComponent(medName)}`);
  };

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
    if (!risk) return 'text-gray-600';
    const r = risk.toLowerCase();
    if (r.includes('high') || r.includes('danger') || r.includes('contraindicated') || r.includes('severe')) return 'text-slate-600 font-bold';
    if (r.includes('moderate') || r.includes('caution') || r.includes('warning')) return 'text-indigo-600 font-bold';
    return 'text-sky-600 font-bold';
  };

  // Loading state — Medical heartbeat
  if (labUploadLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in relative z-10">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gray-50 border-4 border-gray-100 flex items-center justify-center mb-6 mx-auto">
            <HeartPulse className="w-10 h-10 text-gray-500 med-heartbeat" />
          </div>
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-gray-900 mb-3">Analyzing Lab Report</h2>
        <p className="text-gray-900/70 font-medium text-center max-w-md leading-relaxed">VitaLeaf is extracting parameters, mapping chemical structures, and assessing health risks.</p>
      </div>
    );
  }

  // Empty state
  if (!labReports || labReports.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-gray-900">Lab Reports</h1>
          <p className="text-gray-900/70 font-medium mt-2 text-lg">Upload a lab report or prescription label for clinical analysis</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 rounded-3xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all duration-300 relative group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-100/50 bg-white rx-watermark overflow-hidden">
          <input
            type="file"
            accept="image/*,.pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleUploadLabReport}
          />
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100 group-hover:bg-gray-100 transition-colors relative z-10">
            <Upload className="w-10 h-10 text-gray-500 group-hover:text-gray-900 transition-colors" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-gray-900 mb-3 relative z-10">Ingest Laboratory Report</h2>
          <p className="text-gray-900/70 font-medium text-center max-w-md leading-relaxed relative z-10">Upload a medical PDF or lab scan. The diagnostic system extracts reference parameters, evaluates molecular entities, and generates a structured clinical report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-gray-900">Clinical Lab Report</h1>
          <p className="text-gray-900/70 font-medium mt-1">Chemical composition analysis of your medications</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quick Buy / Search Pharmacy Button */}
          <button
            type="button"
            onClick={() => {
              const firstMed = medicines.length > 0 ? medicines[0] : null;
              handleOpenBuy(firstMed);
            }}
            className="med-btn-outline !rounded-xl !py-2 !px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>Buy / Search Pharmacy</span>
          </button>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search compounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="clinical-input !pl-9 !py-2 !w-56"
            />
          </div>
          <div className="relative overflow-hidden cursor-pointer group">
            <input
              type="file"
              accept="image/*,.pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleUploadLabReport}
            />
            <button className="med-btn-primary">
              <Upload className="w-4 h-4" /> Upload New
            </button>
          </div>
        </div>
      </div>

      {/* Report tabs */}
      {labReports.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {labReports.map((report, idx) => (
            <button
              key={idx}
              onClick={() => setActiveReportIdx(idx)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                idx === activeReportIdx
                  ? 'bg-black text-white border-blue-700 shadow-sm'
                  : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />
              Report #{idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Mobile Search */}
      <div className="md:hidden relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search compounds..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="clinical-input !pl-9"
        />
      </div>

      {/* Advanced SVG Radar Chart for Chemical Analysis */}
      {parameters.length > 0 && (
        <div className="rx-card p-6 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-white to-medical-50">
          <div className="flex-1">
            <h2 className="text-xl font-heading font-extrabold tracking-tight text-gray-900 flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-gray-500" />
              Biomarker Profile Analysis
            </h2>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Multi-axis pharmacological taxonomy of extracted compounds based on chemical class, reference ranges, and occurrence.
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="text-2xl font-heading font-extrabold text-gray-900">{parameters.length}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Total Found</div>
              </div>
              <div className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm bg-amber-50/30">
                <div className="text-2xl font-heading font-extrabold text-amber-600">{parameters.filter(p => p.status === 'Warning').length}</div>
                <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-1">Warnings</div>
              </div>
              <div className="bg-white rounded-xl border border-rose-100 p-4 shadow-sm bg-rose-50/30">
                <div className="text-2xl font-heading font-extrabold text-rose-600">{parameters.filter(p => p.status === 'Banned').length}</div>
                <div className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-1">Critical Risks</div>
              </div>
            </div>
          </div>
          
          <div className="w-64 h-64 shrink-0 relative">
            <BiomarkerRadarChart parameters={parameters} />
          </div>
        </div>
      )}

      {/* MOBILE VIEW: Collapsible Sections */}
      <div className="flex flex-col gap-4 md:hidden">
        {medicines.map((med, idx) => (
          <MobileMedicineSection 
            key={idx} 
            med={med} 
            onSelectChem={(chem) => setSelectedChemData({ chem, medName: med.name })} 
            onBuyMed={(m) => handleOpenBuy(m)}
          />
        ))}
      </div>

      {/* DESKTOP VIEW: Clinical Report Tables */}
      <div className="hidden md:flex flex-col gap-6">
        {medicines.map((med, idx) => (
          <div key={idx} className="rx-card overflow-hidden">
            {/* Medicine Header */}
            <div className="px-6 py-4 border-b border-gray-100/60 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                  <Pill className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-gray-900">{med.name}</h3>
                  <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">{med.chemicals.length} Compounds</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenBuy(med)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buy Medicine</span>
                </button>
                {med.hasBanned && <span className="clinical-badge clinical-badge-danger"><XOctagon className="w-3 h-3" /> Has Banned</span>}
                {med.hasWarning && !med.hasBanned && <span className="clinical-badge clinical-badge-warning"><AlertTriangle className="w-3 h-3" /> Has Warnings</span>}
                {!med.hasBanned && !med.hasWarning && <span className="clinical-badge clinical-badge-success"><CheckCircle2 className="w-3 h-3" /> All Clear</span>}
              </div>
            </div>

            {/* Parameters Table */}
            <table className="clinical-table">
              <thead>
                <tr>
                  <th className="w-16"></th>
                  <th>Compound</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th className="hidden xl:table-cell">Reference Range</th>
                  <th className="hidden lg:table-cell">Risk</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {med.chemicals.map((chem, cIdx) => (
                  <tr 
                    key={cIdx} 
                    className="cursor-pointer group"
                    onClick={() => setSelectedChemData({ chem, medName: med.name })}
                  >
                    <td>
                      <div className="w-10 h-10 rounded-lg bg-gray-50/50 border border-gray-100 flex items-center justify-center p-1 overflow-hidden group-hover:bg-gray-50 transition-colors">
                        <ChemicalImg name={chem.name} />
                      </div>
                    </td>
                    <td>
                      <div className="text-sm font-semibold text-gray-900">{chem.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{chem.chemicalType}</div>
                    </td>
                    <td>
                      <span className="text-xs text-gray-500 font-medium">{chem.chemicalType || '—'}</span>
                    </td>
                    <td>
                      <span className="text-sm font-mono font-bold text-gray-900">{chem.value} <span className="text-[10px] text-gray-400">{chem.unit}</span></span>
                    </td>
                    <td>
                      <StatusBadge status={chem.status} />
                    </td>
                    <td className="hidden xl:table-cell">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>Low</span>
                          <span className="text-emerald-700 font-bold">Optimal</span>
                          <span>High</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                          <div className={`h-full rounded-full ${
                            chem.status === 'Banned' ? 'bg-red-500 w-full' :
                            chem.status === 'Warning' ? 'bg-amber-400 w-3/4' : 'bg-emerald-500 w-1/2'
                          }`} />
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className={`text-xs ${getRiskColor(chem.risk)}`}>{chem.risk || '—'}</span>
                    </td>
                    <td>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedChemData && (
          <ChemicalModal 
            data={selectedChemData} 
            onClose={() => setSelectedChemData(null)}
            parseRecommendation={parseRecommendation}
            getRiskColor={getRiskColor}
            onBuyMed={() => handleOpenBuy({ name: selectedChemData.medName, chemicals: [selectedChemData.chem] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Clinical Detail Modal
const ChemicalModal = ({ data, onClose, parseRecommendation, getRiskColor, onBuyMed }) => {
  const { chem, medName } = data;
  const { src, source, cleanName } = useChemicalImage(chem.name);
  
  const rec = parseRecommendation(chem.recommendation);
  const isBanned = chem.status === 'Banned';
  const isWarning = chem.status === 'Warning';

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-blue-900/40 backdrop-blur-md" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Modal Container */}
      <motion.div 
        className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Blue accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 z-20" />

        {/* HEADER */}
        <div className="shrink-0 relative pt-8 pb-6 px-6 md:px-10 bg-slate-900 text-white overflow-hidden shadow-md z-20">
          {/* Rx watermark */}
          <div className="absolute bottom-0 right-4 text-[8rem] font-black text-slate-800/40 leading-none pointer-events-none font-heading">℞</div>
          
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-30">
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* IMAGE */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl shadow-xl p-3 flex items-center justify-center shrink-0 relative overflow-hidden border-2 border-slate-200">
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                {src ? <img src={src} alt={cleanName} className="w-full h-full object-contain mix-blend-multiply" /> : <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />}
              </div>
            </div>

            {/* TITLE & INFO */}
            <div className="flex-1 text-center sm:text-left pt-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-300 border border-white/10">
                  Found in {medName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBuyMed();
                  }}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/30 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buy {medName}</span>
                </button>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white leading-tight mb-3">{chem.name}</h2>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5" /> {source}
                </span>
                <span className="px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 text-white text-xs font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5" /> {chem.value} {chem.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 bg-slate-50/50 relative z-10">
          {/* USES */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h4 className="text-xs md:text-sm font-heading font-extrabold text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /> Clinical Uses & Purpose
            </h4>
            <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base">
              {rec?.uses || 'No standard uses provided.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WARNINGS */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs md:text-sm font-heading font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-amber-500" /> Health Warnings
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Advisory</span>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed text-xs md:text-sm">
                {rec?.cautions || 'None specified.'}
              </p>
              <div className="rx-divider" />
              <p className={`text-xs md:text-sm font-bold ${getRiskColor(chem.risk)}`}>{chem.risk || 'No risk data available.'}</p>
            </div>

            {/* BANNED STATUS */}
            <div className={`bg-white rounded-2xl p-6 shadow-xs border relative overflow-hidden ${
              isBanned ? 'border-red-200 bg-red-50/20' : 'border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs md:text-sm font-heading font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  {isBanned ? <AlertOctagon className="w-4 h-4 md:w-5 md:h-5 text-red-600" /> : <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />}
                  Regulatory Status
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isBanned ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {isBanned ? 'Restricted' : 'Approved'}
                </span>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed text-xs md:text-sm mb-4">
                {rec?.bannedIn || 'Not banned by major sports organizations or regulatory bodies.'}
              </p>
              {isBanned && rec?.text && (
                <div className="bg-slate-50 rounded-xl p-3 md:p-4 border border-slate-100">
                  <p className="text-[10px] md:text-xs text-slate-700 font-bold leading-relaxed">{rec.text}</p>
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
