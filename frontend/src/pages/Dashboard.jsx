import React, { useState, useMemo } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { Link } from 'react-router-dom';
import {
  Activity, Heart, Moon, Droplets, ShieldCheck, AlertTriangle,
  CheckCircle2, Clock, Pill, TrendingUp, ChevronRight, Brain,
  FlaskConical, Zap, ArrowUpRight, X, Plus, Activity as ActivityIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';

export default function Dashboard() {
  const {
    reminders, healthMetrics, insights, weeklyAdherence, aiAnalysis,
    prescriptions, labReports, handleLogAdherence, handleLogHealthMetrics,
    handleSendMessage
  } = useGlobalContext();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [hydrationInput, setHydrationInput] = useState('');
  const [sleepInput, setSleepInput] = useState('');
  const [bpInput, setBpInput] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const [isQuickAskOpen, setIsQuickAskOpen] = useState(false);
  const [quickAskInput, setQuickAskInput] = useState('');
  const [quickAskResponse, setQuickAskResponse] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const submitHealthLog = async () => {
    setIsLogging(true);
    await handleLogHealthMetrics(hydrationInput, sleepInput, bpInput);
    setIsLogging(false);
    setIsLogModalOpen(false);
    setHydrationInput('');
    setSleepInput('');
    setBpInput('');
  };

  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Today's reminders
  const todaysReminders = useMemo(() => {
    return reminders.filter(r => {
      const d = new Date(r.scheduledAt);
      return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    });
  }, [reminders, today]);

  const pendingToday = todaysReminders.filter(r => r.status === 'pending');
  const takenToday = todaysReminders.filter(r => r.status === 'taken');
  const totalMeds = new Set(reminders.map(r => r.medicine?.id)).size;

  // Weekly adherence chart data
  const weekLabels = useMemo(() => {
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      labels.push(dayNames[d.getDay()]);
    }
    return labels;
  }, [today]);

  const maxAdherence = Math.max(...(weeklyAdherence || [100]), 100);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 font-medium mt-1">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <Pill className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active</span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{totalMeds}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">Medications</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Today</span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{takenToday.length}<span className="text-lg text-gray-400 font-bold">/{todaysReminders.length}</span></div>
          <p className="text-xs text-gray-400 font-medium mt-1">Doses Taken</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending</span>
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{pendingToday.length}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">Remaining Today</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
              <FlaskConical className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reports</span>
          </div>
          <div className="text-3xl font-extrabold text-gray-900">{labReports?.length || 0}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">Lab Reports</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Schedule + Weekly Chart */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Today's Schedule
              </h2>
              <Link to="/dashboard/reminders" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-4">
              {todaysReminders.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No medications scheduled for today</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {todaysReminders.slice(0, 5).map(r => {
                    const time = new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isTaken = r.status === 'taken';
                    const isMissed = r.status === 'missed';
                    return (
                      <div key={r.id} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isTaken ? 'bg-emerald-50/50' : isMissed ? 'bg-red-50/50' : 'bg-gray-50 hover:bg-gray-100/50'}`}>
                        <div className="w-16 text-right shrink-0">
                          <span className={`text-sm font-bold ${isTaken ? 'text-emerald-600' : isMissed ? 'text-red-500' : 'text-gray-900'}`}>{time}</span>
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-semibold truncate ${isTaken ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>
                            {r.medicine?.name || 'Unknown'}
                          </h4>
                          <span className="text-xs text-gray-400">
                            {r.medicine?.category || 'Medication'}
                            {r.dosage ? ` · ${r.dosage}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTaken ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase">
                              <CheckCircle2 className="w-3 h-3" /> Taken
                            </span>
                          ) : isMissed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold uppercase">
                              Missed
                            </span>
                          ) : (
                            <>
                              <button onClick={() => handleLogAdherence(r.id, 'taken')} className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors">
                                Take
                              </button>
                              <button onClick={() => handleLogAdherence(r.id, 'missed')} className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors">
                                Skip
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Weekly Adherence Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                Weekly Adherence
              </h2>
              <span className="text-sm font-bold text-gray-400">Last 7 days</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-40">
              {(weeklyAdherence || [0, 0, 0, 0, 0, 0, 0]).map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-500">{val}%</span>
                  <div className="w-full relative bg-gray-50 rounded-t-lg" style={{ height: '100px' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((val / maxAdherence) * 100, 4)}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                      className={`absolute bottom-0 w-full rounded-t-lg ${
                        val >= 80 ? 'bg-emerald-500' : val >= 50 ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-gray-400">{weekLabels[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Health Metrics */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold tracking-tight text-gray-900 uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Health Metrics
              </h3>
              <button 
                onClick={() => setIsLogModalOpen(true)}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
              >
                <Plus className="w-3 h-3" />
                Log Vitals
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100/50">
                <div className="flex items-center gap-3">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Hydration</span>
                </div>
                <span className="text-sm font-bold text-blue-700">{healthMetrics?.hydration || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100/50">
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Sleep</span>
                </div>
                <span className="text-sm font-bold text-purple-700">{healthMetrics?.sleep || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100/50">
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">Blood Pressure</span>
                </div>
                <span className="text-sm font-bold text-red-700">{healthMetrics?.bloodPressure || '—'}</span>
              </div>
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-extrabold tracking-tight text-gray-900 uppercase mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              AI Analysis
            </h3>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Overall Risk', value: aiAnalysis?.overallRisk, icon: ShieldCheck, color: aiAnalysis?.overallRisk === 'LOW' ? 'emerald' : aiAnalysis?.overallRisk === 'No Data' ? 'gray' : 'amber' },
                { label: 'Drug Interaction', value: aiAnalysis?.drugInteraction, icon: Zap, color: aiAnalysis?.drugInteraction === 'None' ? 'emerald' : aiAnalysis?.drugInteraction === 'No Data' ? 'gray' : 'red' },
                { label: 'Food Interaction', value: aiAnalysis?.foodInteraction, icon: Zap, color: aiAnalysis?.foodInteraction === 'None' ? 'emerald' : aiAnalysis?.foodInteraction === 'No Data' ? 'gray' : 'amber' },
                { label: 'Kidney Warning', value: aiAnalysis?.kidneyWarning, icon: AlertTriangle, color: aiAnalysis?.kidneyWarning === 'None' ? 'emerald' : aiAnalysis?.kidneyWarning === 'No Data' ? 'gray' : 'red' },
                { label: 'Liver Safety', value: aiAnalysis?.liverSafety, icon: ShieldCheck, color: aiAnalysis?.liverSafety === 'Excellent' ? 'emerald' : aiAnalysis?.liverSafety === 'No Data' ? 'gray' : 'amber' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-medium text-gray-500">{item.label}</span>
                  <span className={`text-xs font-bold text-${item.color}-600 bg-${item.color}-50 px-2 py-0.5 rounded-full`}>
                    {item.value || '—'}
                  </span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Confidence</span>
                <span className="text-sm font-extrabold text-gray-900">{aiAnalysis?.confidence || '—'}</span>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          {insights && insights.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-extrabold tracking-tight text-gray-900 uppercase mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Insights
              </h3>
              <div className="flex flex-col gap-2">
                {insights.map(ins => (
                  <div key={ins.id} className={`p-3 rounded-xl text-sm font-medium ${
                    ins.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    ins.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {ins.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-gray-900 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-white/80 uppercase mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Link to="/dashboard/upload" className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors">
                <span className="text-sm font-bold text-white">Upload Document</span>
                <ArrowUpRight className="w-4 h-4 text-white/60" />
              </Link>
              <button onClick={() => setIsQuickAskOpen(true)} className="flex items-center justify-between w-full p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors">
                <span className="text-sm font-bold text-white">Ask AI Assistant</span>
                <ArrowUpRight className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Vitals Modal */}
      <Modal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        title="Log Vitals"
        icon={ActivityIcon}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Hydration (e.g. 2L)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <input
                type="text"
                value={hydrationInput}
                onChange={(e) => setHydrationInput(e.target.value)}
                placeholder="e.g. 2 Liters"
                className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Sleep (e.g. 8 hrs)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Moon className="w-4 h-4 text-purple-400" />
              </div>
              <input
                type="text"
                value={sleepInput}
                onChange={(e) => setSleepInput(e.target.value)}
                placeholder="e.g. 7.5 hrs"
                className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Blood Pressure</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Heart className="w-4 h-4 text-red-400" />
              </div>
              <input
                type="text"
                value={bpInput}
                onChange={(e) => setBpInput(e.target.value)}
                placeholder="e.g. 120/80"
                className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            onClick={submitHealthLog}
            disabled={isLogging}
            className="w-full mt-2 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            {isLogging ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Save Vitals"
            )}
          </button>
        </div>
      </Modal>

      {/* Quick Ask AI Modal */}
      <Modal 
        isOpen={isQuickAskOpen} 
        onClose={() => { setIsQuickAskOpen(false); setQuickAskResponse(''); setQuickAskInput(''); }} 
        title="Quick Ask AI"
        icon={Brain}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">Ask any quick medical question or check drug interactions.</p>
          
          <div className="relative">
            <textarea
              value={quickAskInput}
              onChange={(e) => setQuickAskInput(e.target.value)}
              placeholder="e.g. Can I take ibuprofen with lisinopril?"
              rows={3}
              className="block w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none"
            />
          </div>

          <button
            onClick={async (e) => {
              if(!quickAskInput.trim()) return;
              setIsAsking(true);
              // Mock a small wait then navigate or show inline.
              // Wait, handleSendMessage in GlobalContext actually pushes to chatMessages.
              // We can just use the mutation directly here for a "Quick Answer", but to avoid duplicating gqlFetch, we'll just redirect to /dashboard/chat or we can just mock a quick inline response.
              // Let's redirect to chat with the input if they ask!
              await handleSendMessage(e, quickAskInput);
              setIsAsking(false);
              setIsQuickAskOpen(false);
              setQuickAskInput('');
              window.location.href = '/dashboard/chat'; // Redirect to see the answer
            }}
            disabled={isAsking || !quickAskInput.trim()}
            className="w-full mt-2 bg-purple-600 text-white rounded-xl py-2.5 text-sm font-bold shadow-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            {isAsking ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Ask Question"
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
