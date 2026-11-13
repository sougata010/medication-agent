import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity, Sparkles, RefreshCw } from 'lucide-react';

export default function BiomarkerTrends({ userId }) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeriesIdx, setSelectedSeriesIdx] = useState(0);

  useEffect(() => {
    fetchTrends();
  }, [userId]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const query = `
        query GetBiomarkerTrends($userId: ID!) {
          getBiomarkerTrends(userId: $userId) {
            name
            unit
            category
            normalMin
            normalMax
            projectedValue
            trendDirection
            history {
              date
              value
              status
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
        body: JSON.stringify({ query, variables: { userId: userId || "1" } }),
      });
      const resJson = await res.json();
      if (resJson.data?.getBiomarkerTrends) {
        setTrends(resJson.data.getBiomarkerTrends);
      }
    } catch (err) {
      console.error('Error fetching Biomarker Trends:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-8 flex items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
        <span className="text-xs font-bold text-slate-700">Loading Biomarker Trajectories...</span>
      </div>
    );
  }

  if (!trends || trends.length === 0) return null;

  const activeSeries = trends[selectedSeriesIdx] || trends[0];

  const getTrendIcon = (dir) => {
    if (dir === 'improving') return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    if (dir === 'worsening') return <TrendingUp className="w-4 h-4 text-rose-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-heading font-extrabold text-slate-900">Longitudinal Biomarker Trajectory</h3>
            <p className="text-xs text-slate-400 font-medium">Historical progression across lab panels with AI target projection</p>
          </div>
        </div>
        
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" /> AI Projected
        </span>
      </div>

      {/* Series selection tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {trends.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedSeriesIdx(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              idx === selectedSeriesIdx
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Trajectory Plot Container */}
      {activeSeries && (
        <div className="flex flex-col gap-6">
          <div className="bg-slate-950 rounded-2xl p-6 shadow-inner border border-slate-800 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">{activeSeries.category}</span>
                <h4 className="text-lg font-heading font-extrabold text-white flex items-center gap-2">
                  {activeSeries.name}
                  <span className="text-xs font-mono font-normal text-slate-400">({activeSeries.unit})</span>
                </h4>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                {getTrendIcon(activeSeries.trendDirection)}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">{activeSeries.trendDirection}</span>
              </div>
            </div>

            {/* SVG Trajectory Chart */}
            <div className="relative">
              <svg className="w-full h-56" viewBox="0 0 320 140">
                {(() => {
                  const vals = activeSeries.history.map(h => h.value);
                  const projVal = activeSeries.projectedValue || vals[vals.length - 1];
                  const allVals = [...vals, projVal, activeSeries.normalMin, activeSeries.normalMax].filter(v => v !== undefined && v !== null);
                  
                  const minV = Math.min(...allVals) * 0.9;
                  const maxV = Math.max(...allVals) * 1.1;
                  const range = maxV - minV || 1;

                  // Map Y coordinate (0 to 140px stage)
                  const getY = (val) => 120 - ((val - minV) / range) * 95;

                  const yNormMax = getY(activeSeries.normalMax);
                  const yNormMin = getY(activeSeries.normalMin);
                  const normHeight = Math.max(8, yNormMin - yNormMax);

                  const points = activeSeries.history.map((h, i) => {
                    const x = 35 + (i / Math.max(activeSeries.history.length - 1, 1)) * 200;
                    const y = getY(h.value);
                    return { x, y, val: h.value, date: h.date };
                  });

                  const lineStr = points.map(p => `${p.x},${p.y}`).join(' ');

                  const projX = 285;
                  const projY = getY(projVal);
                  const lastPoint = points[points.length - 1];

                  return (
                    <>
                      {/* Normal Range Reference Corridor */}
                      <rect x="15" y={yNormMax} width="290" height={normHeight} fill="rgba(16, 185, 129, 0.08)" rx="4" />
                      <line x1="15" y1={yNormMax} x2="305" y2={yNormMax} stroke="rgba(16, 185, 129, 0.35)" strokeDasharray="3 3" />
                      <line x1="15" y1={yNormMin} x2="305" y2={yNormMin} stroke="rgba(16, 185, 129, 0.35)" strokeDasharray="3 3" />
                      
                      {/* Corridor Labels positioned away from data points */}
                      <text x="20" y={yNormMax - 4} className="text-[8px] fill-emerald-400 font-mono font-bold">Normal Max ({activeSeries.normalMax})</text>
                      <text x="20" y={yNormMin + 11} className="text-[8px] fill-emerald-400 font-mono font-bold">Normal Min ({activeSeries.normalMin})</text>

                      {/* Line Path */}
                      <polyline points={lineStr} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                      
                      {/* Projected dashed line */}
                      <line x1={lastPoint.x} y1={lastPoint.y} x2={projX} y2={projY} stroke="#818cf8" strokeWidth="2.5" strokeDasharray="4 4" />

                      {/* Historical Data Points */}
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4.5" fill="#38bdf8" />
                          <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] fill-white font-mono font-bold">{p.val}</text>
                          <text x={p.x} y="132" textAnchor="middle" className="text-[8px] fill-slate-400 font-mono">{p.date}</text>
                        </g>
                      ))}

                      {/* Projected Target Point */}
                      <circle cx={projX} cy={projY} r="5" fill="#818cf8" />
                      <circle cx={projX} cy={projY} r="9" fill="none" stroke="#818cf8" strokeWidth="1.5" className="animate-ping" />
                      <text x={projX} y={projY - 10} textAnchor="middle" className="text-[9px] fill-indigo-300 font-mono font-bold">Proj: {projVal}</text>
                      <text x={projX} y="132" textAnchor="middle" className="text-[8px] fill-indigo-400 font-mono font-bold">+30 Days</text>
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
