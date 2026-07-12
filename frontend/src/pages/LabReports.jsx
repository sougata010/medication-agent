import React, { useState, useMemo } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import {
  FlaskConical, CheckCircle2, AlertTriangle, AlertOctagon,
  ChevronDown, TrendingUp, TrendingDown, Minus, Info, Search,
  FileText, Calendar
} from 'lucide-react';

export default function LabReports() {
  const { labReports } = useGlobalContext();
  const [activeReportIdx, setActiveReportIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const currentReport = labReports && labReports.length > 0 ? labReports[activeReportIdx] : null;
  const parameters = currentReport ? currentReport.parameters : [];

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(parameters.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [parameters]);

  // Filter parameters
  const filteredParams = useMemo(() => {
    return parameters.filter(p => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [parameters, searchQuery, categoryFilter]);

  // Stats
  const normalCount = parameters.filter(p => p.status === 'Normal').length;
  const abnormalCount = parameters.filter(p => p.status !== 'Normal').length;
  const criticalCount = parameters.filter(p => p.severity === 'critical').length;

  const getStatusBadge = (status, severity) => {
    if (status === 'Normal') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
          <CheckCircle2 className="w-3 h-3" /> Normal
        </span>
      );
    }
    if (severity === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-bold border border-red-100">
          <AlertOctagon className="w-3 h-3" /> Critical
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-100">
        <AlertTriangle className="w-3 h-3" /> {status}
      </span>
    );
  };

  const getTrendIcon = (value, normalMin, normalMax) => {
    if (value > normalMax) return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
    if (value < normalMin) return <TrendingDown className="w-3.5 h-3.5 text-amber-500" />;
    return <Minus className="w-3.5 h-3.5 text-emerald-500" />;
  };

  if (!labReports || labReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 border border-gray-200">
          <FlaskConical className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">No Lab Reports</h2>
        <p className="text-gray-500 font-medium text-center max-w-sm">Upload your lab reports to see detailed biomarker analysis with AI-powered insights.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Lab Reports</h1>
          <p className="text-gray-500 font-medium mt-1">Detailed biomarker analysis and AI insights</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <FlaskConical className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{parameters.length}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">Parameters Tested</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">In Range</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{normalCount}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">Normal Results</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${criticalCount > 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${criticalCount > 0 ? 'text-red-600' : 'text-amber-600'}`} />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</span>
          </div>
          <div className={`text-3xl font-extrabold ${criticalCount > 0 ? 'text-red-600' : 'text-amber-600'}`}>{abnormalCount}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">{criticalCount > 0 ? `${criticalCount} Critical` : 'Needs Review'}</p>
        </div>
      </div>

      {/* Report Info */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">Uploaded: {currentReport ? new Date(currentReport.uploadedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          <span className="font-medium">Report ID: {currentReport?.id || '—'}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${
                categoryFilter === cat
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Parameter Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Parameter</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Value</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Category</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Confidence</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Risk / Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredParams.map((p) => {
                const isAbnormal = p.status !== 'Normal';
                return (
                  <tr key={p.id} className={`transition-colors ${isAbnormal ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-gray-50/50'}`}>
                    {/* Parameter Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(p.value, p.normalMin, p.normalMax)}
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                          <div className="text-[11px] text-gray-400 font-medium">{p.chemicalType || '—'}</div>
                        </div>
                      </div>
                    </td>
                    {/* Value */}
                    <td className="px-4 py-4">
                      <span className={`text-lg font-extrabold ${
                        p.status === 'Normal' ? 'text-gray-900' : 
                        p.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {p.value}
                      </span>
                      <span className="text-xs text-gray-400 font-medium ml-1">{p.unit}</span>
                    </td>
                    {/* Reference Range */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500 font-medium">{p.referenceRange || `${p.normalMin}–${p.normalMax} ${p.unit}`}</span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4">
                      {getStatusBadge(p.status, p.severity)}
                    </td>
                    {/* Category */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        {p.category || '—'}
                      </span>
                    </td>
                    {/* Confidence */}
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${(p.confidence || 0) >= 90 ? 'bg-emerald-500' : (p.confidence || 0) >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${p.confidence || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-500">{p.confidence || 0}%</span>
                      </div>
                    </td>
                    {/* Risk + Recommendation */}
                    <td className="px-4 py-4 hidden xl:table-cell max-w-[280px]">
                      {isAbnormal ? (
                        <div className="flex flex-col gap-1">
                          {p.risk && <p className="text-xs text-red-600 font-medium line-clamp-1" title={p.risk}>{p.risk}</p>}
                          {p.recommendation && <p className="text-xs text-gray-500 line-clamp-1" title={p.recommendation}>💡 {p.recommendation}</p>}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Within normal range</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredParams.length === 0 && (
          <div className="py-12 text-center">
            <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No parameters match your search</p>
          </div>
        )}
      </div>

      {/* Abnormal Detail Cards */}
      {filteredParams.filter(p => p.status !== 'Normal').length > 0 && (
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Detailed Analysis — Abnormal Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredParams.filter(p => p.status !== 'Normal').map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">{p.name}</h3>
                    <span className="text-xs text-gray-400 font-medium">{p.category} · {p.chemicalType}</span>
                  </div>
                  {getStatusBadge(p.status, p.severity)}
                </div>
                
                {/* Value Bar */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-2xl font-extrabold ${p.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                      {p.value}
                    </span>
                    <span className="text-sm text-gray-400 font-medium">{p.unit}</span>
                    <span className="text-xs text-gray-400 ml-2">Ref: {p.normalMin}–{p.normalMax}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="absolute h-full bg-emerald-200" style={{ left: `${(p.normalMin / (p.normalMax * 2.5)) * 100}%`, width: `${((p.normalMax - p.normalMin) / (p.normalMax * 2.5)) * 100}%` }} />
                    <div
                      className={`absolute w-3 h-3 rounded-full top-1/2 -translate-y-1/2 border-2 border-white shadow-md ${p.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ left: `${Math.min((p.value / (p.normalMax * 2.5)) * 100, 98)}%` }}
                    />
                  </div>
                </div>

                {/* AI Insight */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">AI Insight</span>
                    <span className="text-[10px] font-bold text-gray-400 ml-auto">{p.confidence}% conf.</span>
                  </div>
                  {p.risk && <p className="text-xs text-gray-600 mb-1"><strong>Risk:</strong> {p.risk}</p>}
                  {p.recommendation && <p className="text-xs text-gray-500"><strong>Action:</strong> {p.recommendation}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
