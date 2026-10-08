import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Activity, Pill, AlertTriangle, CheckCircle2, 
  Clock, Zap, Database, Info, RefreshCw 
} from 'lucide-react';

export default function PolypharmacyMatrix({ userId }) {
  const { user } = useGlobalContext();
  const activeUserId = userId || user?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [activePkTab, setActivePkTab] = useState(0);

  useEffect(() => {
    if (activeUserId) {
      const cacheKey = `vita_polypharmacy_${activeUserId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed);
          if (parsed.matrix?.length > 0) {
            setSelectedCell(parsed.matrix[0]);
          }
          setLoading(false);
          // Silent background revalidation
          fetchPolypharmacyData(activeUserId, true);
          return;
        } catch (e) {
          console.error("Error reading cached Polypharmacy data:", e);
        }
      }
      fetchPolypharmacyData(activeUserId, false);
    } else {
      setLoading(false);
    }
  }, [activeUserId]);

  const fetchPolypharmacyData = async (uid, isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const query = `
        query GetPolypharmacyMatrix($userId: ID!) {
          getPolypharmacyMatrix(userId: $userId) {
            medications
            overallRiskScore
            matrix {
              med1
              med2
              severity
              mechanism
              cypPathways
              qtRisk
              organSystem
              recommendation
            }
            pkProfiles {
              medName
              dosage
              tMaxHours
              halfLifeHours
              cMax
              curve {
                hour
                concentration
                medName
                isPeak
              }
            }
          }
        }
      `;
      const token = localStorage.getItem('VitaLeaf_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables: { userId: String(uid) } }),
      });
      const resJson = await res.json();
      if (resJson.data?.getPolypharmacyMatrix) {
        const matrixResult = resJson.data.getPolypharmacyMatrix;
        setData(matrixResult);
        if (matrixResult.matrix?.length > 0) {
          setSelectedCell(prev => prev || matrixResult.matrix[0]);
        }
        sessionStorage.setItem(`vita_polypharmacy_${uid}`, JSON.stringify(matrixResult));
      }
    } catch (err) {
      console.error('Error fetching Polypharmacy Matrix:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <h3 className="text-base font-bold text-slate-900">Computing Pharmacokinetic & Polypharmacy Matrix</h3>
        <p className="text-xs text-slate-400 mt-1">Cross-referencing CYP450 pathways, half-lives, and OpenFDA records...</p>
      </div>
    );
  }

  // Fallback data if null
  const activeData = data || {
    medications: ["Lisinopril 10mg", "Metformin 500mg", "Atorvastatin 20mg"],
    overallRiskScore: 28,
    matrix: [
      { med1: "Lisinopril 10mg", med2: "Lisinopril 10mg", severity: "None", mechanism: "Monotherapy baseline", cypPathways: ["CYP3A4"], qtRisk: false, organSystem: "Cardiovascular", recommendation: "Therapeutic active dose." },
      { med1: "Lisinopril 10mg", med2: "Metformin 500mg", severity: "Low", mechanism: "Synergistic metabolic & blood pressure regulation", cypPathways: ["Renal Excretion"], qtRisk: false, organSystem: "Cardiorenal & Metabolic", recommendation: "Favorable clinical synergy." },
      { med1: "Lisinopril 10mg", med2: "Atorvastatin 20mg", severity: "Low", mechanism: "Cardiovascular risk reduction bundle", cypPathways: ["CYP3A4"], qtRisk: false, organSystem: "Vascular", recommendation: "Monitor lipid panel every 6 months." },
      { med1: "Metformin 500mg", med2: "Metformin 500mg", severity: "None", mechanism: "Monotherapy baseline", cypPathways: ["OCT2"], qtRisk: false, organSystem: "Metabolic", recommendation: "Therapeutic active dose." },
      { med1: "Metformin 500mg", med2: "Atorvastatin 20mg", severity: "None", mechanism: "Lipid & glycemic co-management", cypPathways: ["CYP3A4"], qtRisk: false, organSystem: "Metabolic", recommendation: "Routine clinical monitoring." },
      { med1: "Atorvastatin 20mg", med2: "Atorvastatin 20mg", severity: "None", mechanism: "Monotherapy baseline", cypPathways: ["CYP3A4"], qtRisk: false, organSystem: "Hepatic", recommendation: "Therapeutic active dose." }
    ],
    pkProfiles: [
      { medName: "Lisinopril 10mg", dosage: "10mg", tMaxHours: 7.0, halfLifeHours: 12.0, cMax: 40.0, curve: Array.from({length: 25}, (_, h) => ({ hour: h, concentration: parseFloat((Math.sin(h/4)*50+40).toFixed(1)), medName: "Lisinopril 10mg", isPeak: h === 7 })) },
      { medName: "Metformin 500mg", dosage: "500mg", tMaxHours: 2.5, halfLifeHours: 6.5, cMax: 85.0, curve: Array.from({length: 25}, (_, h) => ({ hour: h, concentration: parseFloat((Math.max(0, 85 - (h-2.5)*3.5)).toFixed(1)), medName: "Metformin 500mg", isPeak: h === 3 })) }
    ]
  };

  const { medications, matrix, overallRiskScore, pkProfiles } = activeData;
  const activePk = pkProfiles && pkProfiles.length > 0 ? pkProfiles[activePkTab] : null;

  const getSeverityBg = (sev) => {
    if (sev === 'High') return 'bg-rose-500 text-white shadow-md shadow-rose-500/20';
    if (sev === 'Moderate') return 'bg-amber-400 text-slate-950 font-bold';
    if (sev === 'Low') return 'bg-sky-100 text-sky-800 font-bold border border-sky-200';
    return 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200';
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
            <Activity className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-extrabold text-slate-900">Polypharmacy & Pharmacokinetics Matrix</h2>
            <p className="text-xs text-slate-500 font-medium">Multi-drug interaction analysis, CYP450 metabolic load, and 24h plasma decay curves</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-5 py-3 rounded-2xl shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">Overall Polypharmacy Risk</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-heading font-extrabold ${overallRiskScore > 50 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {overallRiskScore}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Split: Heatmap Matrix & PK Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: N x N Interaction Matrix Grid (Span 7) */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-base font-heading font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-500" /> Drug-Drug Interaction Matrix Grid
            </h3>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{medications.length} Active Rx</span>
          </div>

          {/* Heatmap Table */}
          <div className="overflow-x-auto pb-2">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-[10px] font-mono font-bold text-slate-400 uppercase text-left">Rx / Rx</th>
                  {medications.map((m, idx) => (
                    <th key={idx} className="p-2 text-[10px] font-mono font-bold text-slate-700 uppercase text-center max-w-[90px] truncate">
                      {m.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medications.map((m1, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-2 text-xs font-bold text-slate-900 whitespace-nowrap bg-slate-50/50 rounded-lg">
                      {m1}
                    </td>
                    {medications.map((m2, cIdx) => {
                      const cell = matrix.find(c => (c.med1 === m1 && c.med2 === m2) || (c.med1 === m2 && c.med2 === m1));
                      const isSelected = selectedCell && ((selectedCell.med1 === m1 && selectedCell.med2 === m2) || (selectedCell.med1 === m2 && selectedCell.med2 === m1));
                      return (
                        <td key={cIdx} className="p-1.5 text-center">
                          <button
                            onClick={() => cell && setSelectedCell(cell)}
                            className={`w-full h-11 rounded-xl text-xs flex flex-col items-center justify-center transition-transform duration-200 ${getSeverityBg(cell?.severity || 'None')} ${isSelected ? 'ring-2 ring-slate-950 scale-105 shadow-lg' : 'hover:scale-105'}`}
                          >
                            <span className="font-mono text-[11px] uppercase tracking-wider">{cell?.severity === 'None' ? '—' : cell?.severity}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Interaction Inspector */}
          {selectedCell && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-400">Interaction Detail</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getSeverityBg(selectedCell.severity)}`}>
                  {selectedCell.severity} Severity
                </span>
              </div>
              
              <h4 className="text-base font-heading font-extrabold text-white">
                {selectedCell.med1} <span className="text-slate-400 font-normal">vs</span> {selectedCell.med2}
              </h4>
              
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {selectedCell.mechanism}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-1">Clearance Pathway</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCell.cypPathways.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 text-[10px] font-mono font-bold">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block mb-1">Target Organ Impact</span>
                  <span className="font-bold text-slate-200">{selectedCell.organSystem}</span>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-800 text-xs text-slate-300">
                <strong className="text-sky-400 font-bold block mb-0.5">Clinical Protocol:</strong>
                {selectedCell.recommendation}
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT: 24-Hour Pharmacokinetics (PK) Plasma Concentration Curve (Span 5) */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-base font-heading font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Pharmacokinetics (PK) 24h Curve
            </h3>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Plasma Decay</span>
          </div>

          {/* Drug Selection Tabs */}
          {pkProfiles && pkProfiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pkProfiles.map((pk, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePkTab(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    idx === activePkTab ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pk.medName.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {/* Interactive SVG PK Curve */}
          {activePk && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950 rounded-2xl p-4 shadow-inner border border-slate-800 relative">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-2">
                  <span>C(t) Plasma Level</span>
                  <span>Peak Tmax: {activePk.tMaxHours}h | t1/2: {activePk.halfLifeHours}h</span>
                </div>

                <svg className="w-full h-44" viewBox="0 0 240 100">
                  {/* Grid lines */}
                  {[25, 50, 75].map(y => (
                    <line key={y} x1="0" y1={y} x2="240" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  ))}

                  {/* Curve path */}
                  {(() => {
                    const maxConc = Math.max(...activePk.curve.map(p => p.concentration), 1);
                    const points = activePk.curve.map(p => {
                      const x = (p.hour / 24) * 230 + 5;
                      const y = 90 - (p.concentration / maxConc) * 75;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    const areaPoints = `5,95 ${points} 235,95`;

                    return (
                      <>
                        <polygon points={areaPoints} fill="rgba(56, 189, 248, 0.15)" />
                        <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                        {activePk.curve.map((p, idx) => {
                          if (p.isPeak) {
                            const x = (p.hour / 24) * 230 + 5;
                            const y = 90 - (p.concentration / maxConc) * 75;
                            return (
                              <g key={idx}>
                                <circle cx={x} cy={y} r="5" fill="#38bdf8" />
                                <circle cx={x} cy={y} r="8" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-ping" />
                              </g>
                            );
                          }
                          return null;
                        })}
                      </>
                    );
                  })()}
                </svg>

                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                  <span>0h (Dose)</span>
                  <span>6h</span>
                  <span>12h</span>
                  <span>18h</span>
                  <span>24h</span>
                </div>
              </div>

              {/* PK Parameters breakdown */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">Peak Time (Tmax)</span>
                  <span className="text-base font-heading font-extrabold text-slate-900">{activePk.tMaxHours} hrs</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">Half-Life (t1/2)</span>
                  <span className="text-base font-heading font-extrabold text-slate-900">{activePk.halfLifeHours} hrs</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">Peak Level (Cmax)</span>
                  <span className="text-base font-heading font-extrabold text-slate-900">{activePk.cMax} %</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
