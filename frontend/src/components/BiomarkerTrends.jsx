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
              <svg className="w-full h-48" viewBox="0 0 300 120">
                {/* Normal Range Reference Corridor */}
                <rect x="10" y="25" width="280" height="50" fill="rgba(16, 185, 129, 0.08)" rx="4" />
                <line x1="10" y1="25" x2="290" y2="25" stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" />
                <line x1="10" y1="75" x2="290" y2="75" stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" />
                <text x="285" y="22" textAnchor="end" className="text-[8px] fill-emerald-400 font-mono">Normal Max: {activeSeries.normalMax}</text>
                <text x="285" y="85" textAnchor="end" className="text-[8px] fill-emerald-400 font-mono">Normal Min: {activeSeries.normalMin}</text>

                {/* Line Path */}
                {(() => {
                  const vals = activeSeries.history.map(h => h.value);
                  const minV = Math.min(...vals, activeSeries.normalMin || 0) * 0.8;
                  const maxV = Math.max(...vals, activeSeries.normalMax || 100) * 1.15;
                  const range = maxV - minV || 1;

                  const points = activeSeries.history.map((h, i) => {
                    const x = 30 + (i / Math.max(activeSeries.history.length - 1, 1)) * 210;
                    const y = 100 - ((h.value - minV) / range) * 80;
                    return { x, y, val: h.value, date: h.date };
                  });

                  const lineStr = points.map(p => `${p.x},${p.y}`).join(' ');

                  // Projected point
                  const projVal = activeSeries.projectedValue || vals[vals.length - 1];
                  const projX = 270;
                  const projY = 100 - ((projVal - minV) / range) * 80;
                  const lastPoint = points[points.length - 1];

                  return (
                    <>
                      <polyline points={lineStr} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                      {/* Projected dashed line */}
                      <line x1={lastPoint.x} y1={lastPoint.y} x2={projX} y2={projY} stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />

                      {/* Points */}
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#38bdf8" />
                          <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] fill-slate-200 font-mono font-bold">{p.val}</text>
                        </g>
                      ))}

                      {/* Projected Point */}
                      <circle cx={projX} cy={projY} r="5" fill="#818cf8" />
                      <circle cx={projX} cy={projY} r="9" fill="none" stroke="#818cf8" strokeWidth="1.5" className="animate-ping" />
                      <text x={projX} y={projY - 10} textAnchor="middle" className="text-[9px] fill-indigo-300 font-mono font-bold">Proj: {projVal}</text>
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
