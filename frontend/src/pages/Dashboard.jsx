import React, { useState, useMemo } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, Heart, Moon, Droplets, ShieldCheck, AlertTriangle,
  CheckCircle2, Clock, Pill, TrendingUp, ChevronRight, Brain,
  FlaskConical, Zap, ArrowUpRight, X, Plus, Activity as ActivityIcon,
  HeartPulse, Stethoscope, Thermometer, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Modal from '../components/Modal';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    user, reminders, healthMetrics, insights, weeklyAdherence, aiAnalysis,
    prescriptions, labReports, handleLogAdherence, handleLogHealthMetrics,
    handleSendMessage, setGlobalAlert, handleLogSymptoms, fetchPharmacyPrices, checkFoodInteraction, trendForecast, carePlan
  } = useGlobalContext();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [hydrationInput, setHydrationInput] = useState('');
  const [sleepInput, setSleepInput] = useState('');
  const [bpInput, setBpInput] = useState('');
  const [moodInput, setMoodInput] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [isLogging, setIsLogging] = useState(false);

  const [isQuickAskOpen, setIsQuickAskOpen] = useState(false);
  const [quickAskInput, setQuickAskInput] = useState('');
  const [quickAskResponse, setQuickAskResponse] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [showNudge, setShowNudge] = useState(true);
  const [foodAlert, setFoodAlert] = useState(null);

  const NUDGES = [
    "💧 Did you know? Taking medication with a full glass of water improves absorption by up to 15%.",
    "🏃 A 10-minute walk after taking your morning meds can help boost your metabolism.",
    "🌙 Consistent sleep schedules make your body more responsive to daily treatments."
  ];
  const activeNudge = useMemo(() => NUDGES[Math.floor(Math.random() * NUDGES.length)], []);

  const submitHealthLog = async () => {
    setIsLogging(true);
    await handleLogHealthMetrics(hydrationInput, sleepInput, bpInput, moodInput);
    setIsLogging(false);
    setIsLogModalOpen(false);
    setHydrationInput('');
    setSleepInput('');
    setBpInput('');
    setMoodInput('');
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
      {/* Header with Gamification Streak */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-gray-900">Clinical Dashboard</h1>
          <p className="text-gray-900/70 font-medium mt-1">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        
        {/* Streak Badge */}
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2 rounded-full shadow-sm">
          <span className="text-xl">🔥</span>
          <div>
            <div className="text-xs font-bold text-orange-500 uppercase tracking-wider">Perfect Adherence</div>
            <div className="text-sm font-extrabold text-orange-700">{user?.streakDays || 0} Day Streak</div>
          </div>
        </div>
      </div>

      {/* Behavioral Nudge Banner */}
      <AnimatePresence>
        {showNudge && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, height: 0, marginBottom: 0 }}
            className="flex items-center gap-2"
          >
            <p className="text-gray-600 font-medium text-base">{activeNudge}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {foodAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm mb-4 relative"
          >
            <button onClick={() => setFoodAlert(null)} className="absolute top-4 right-4 text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">Food-Medication Interaction Detected</h3>
              <p className="text-sm text-rose-700 mt-1 leading-relaxed">
                {foodAlert}
              </p>
            </div>
          </motion.div>
        )}
        

      </AnimatePresence>

      {/* Quick Stats Row — Prescription Card Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rx-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
              <Pill className="w-5 h-5 text-gray-900" />
            </div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active</span>
          </div>
          <div className="text-3xl font-heading font-extrabold text-gray-900">{totalMeds}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">Medications</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Today</span>
          </div>
          <div className="text-3xl font-heading font-extrabold text-gray-900">{takenToday.length}<span className="text-lg text-gray-400 font-bold">/{todaysReminders.length}</span></div>
          <p className="text-xs text-gray-400 font-medium mt-1">Doses Taken</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Pending</span>
          </div>
          <div className="text-3xl font-heading font-extrabold text-amber-600">{pendingToday.length}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">Remaining Today</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
              <FlaskConical className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Reports</span>
          </div>
          <div className="text-3xl font-heading font-extrabold text-gray-900">{labReports?.length || 0}</div>
          <p className="text-xs text-gray-400 font-medium mt-1">Lab Reports</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Schedule + Weekly Chart */}
        <div className="lg:col-span-2 flex flex-col gap-6">


          {/* Today's Schedule */}
          <div className="rx-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100/60 flex items-center justify-between">
              <h2 className="text-lg font-heading font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-gray-500" />
                Today's Prescription Schedule
              </h2>
              <Link to="/dashboard/reminders" className="text-sm font-bold text-gray-900 hover:text-gray-900 flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-4">
              {todaysReminders.length === 0 ? (
                <div className="py-12 text-center overflow-hidden flex flex-col items-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center mb-4 border-4 border-white shadow-lg"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <h3 className="text-xl font-heading font-extrabold text-gray-900 mb-1">Inbox Zero!</h3>
                  <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">
                    You've completed all your health tasks for today. Take a moment to relax and breathe.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {todaysReminders.slice(0, 5).map(r => {
                    const time = new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isTaken = r.status === 'taken';
                    const isMissed = r.status === 'missed';
                    return (
                      <div key={r.id} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isTaken ? 'bg-emerald-50/50 border border-emerald-100' : isMissed ? 'bg-rose-50/50 border border-rose-100' : 'bg-gray-50/50 hover:bg-gray-50 border border-gray-100/50'}`}>
                        <div className="w-16 text-right shrink-0">
                          <span className={`text-sm font-mono font-bold ${isTaken ? 'text-emerald-600' : isMissed ? 'text-rose-500' : 'text-gray-900'}`}>{time}</span>
                        </div>
                        <div className="w-px h-8 bg-blue-200" />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-semibold truncate ${isTaken ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>
                            {r.medicine?.name || 'Unknown'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {r.medicine?.category || 'Medication'}
                              {r.dosage ? <span className="font-mono"> · {r.dosage}</span> : ''}
                            </span>
                            <button 
                              onClick={async () => {
                                const prices = await fetchPharmacyPrices(r.medicine?.name || 'Unknown');
                                const msg = prices.map(p => `${p.pharmacy}: $${p.price.toFixed(2)} (${p.distance})`).join('\n');
                                setGlobalAlert({
                                  isOpen: true,
                                  title: `💰 Lowest Prices for ${r.medicine?.name || 'Unknown'}`,
                                  message: `${msg}\n\nShow your VitaLeaf digital coupon to save up to 40%.`
                                });
                              }}
                              className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full hover:bg-green-100 transition-colors whitespace-nowrap"
                            >
                              Check Prices
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTaken ? (
                            <span className="clinical-badge clinical-badge-success">
                              <CheckCircle2 className="w-3 h-3" /> Taken
                            </span>
                          ) : isMissed ? (
                            <span className="clinical-badge clinical-badge-danger">
                              Missed
                            </span>
                          ) : (
                            <>
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#34d399', '#6ee7b7'] });
                                  handleLogAdherence(r.id, 'taken');
                                }} 
                                className="med-btn-primary !px-3 !py-1.5 !text-xs !rounded-full"
                              >
                                Take
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleLogAdherence(r.id, 'missed')} 
                                className="med-btn-outline !px-3 !py-1.5 !text-xs !rounded-full"
                              >
                                Skip
                              </motion.button>
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

          {/* Weekly Adherence Curve Graph */}
          <div className="rx-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-heading font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                Weekly Adherence
              </h2>
              <span className="text-sm font-bold text-gray-500 font-mono">Last 7 days</span>
            </div>
            
            <div className="relative h-40 w-full mt-4 border-b border-l border-gray-100 pb-2 pl-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 120" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((val, i) => (
                  <line key={i} x1="0" y1={120 - (val * 1.2)} x2="600" y2={120 - (val * 1.2)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                ))}
                
                {/* SVG Path for the Curve Graph */}
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  d={(() => {
                    const data = weeklyAdherence || [0, 0, 0, 0, 0, 0, 0];
                    let path = `M 0,${120 - (data[0] * 1.2)}`;
                    for (let i = 1; i < data.length; i++) {
                      const prevX = (i - 1) * 100;
                      const prevY = 120 - (data[i - 1] * 1.2);
                      const currX = i * 100;
                      const currY = 120 - (data[i] * 1.2);
                      // Smooth bezier curve control points
                      const cp1X = prevX + (currX - prevX) / 2;
                      const cp1Y = prevY;
                      const cp2X = prevX + (currX - prevX) / 2;
                      const cp2Y = currY;
                      path += ` C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${currX},${currY}`;
                    }
                    return path;
                  })()}
                  fill="none"
                  stroke="url(#black-gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Fill Area Gradient (Parallax effect) */}
                <motion.path
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  d={(() => {
                    const data = weeklyAdherence || [0, 0, 0, 0, 0, 0, 0];
                    let path = `M 0,${120 - (data[0] * 1.2)}`;
                    for (let i = 1; i < data.length; i++) {
                      const prevX = (i - 1) * 100;
                      const prevY = 120 - (data[i - 1] * 1.2);
                      const currX = i * 100;
                      const currY = 120 - (data[i] * 1.2);
                      const cp1X = prevX + (currX - prevX) / 2;
                      const cp1Y = prevY;
                      const cp2X = prevX + (currX - prevX) / 2;
                      const cp2Y = currY;
                      path += ` C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${currX},${currY}`;
                    }
                    path += ` L 600,120 L 0,120 Z`;
                    return path;
                  })()}
                  fill="url(#black-gradient)"
                />

                {/* Data Points */}
                {(weeklyAdherence || [0, 0, 0, 0, 0, 0, 0]).map((val, i) => (
                  <motion.circle
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1 + (i * 0.1), type: "spring" }}
                    cx={i * 100}
                    cy={120 - (val * 1.2)}
                    r="5"
                    className="fill-white stroke-black stroke-[3px]"
                  />
                ))}

                <defs>
                  <linearGradient id="black-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9ca3af" />
                    <stop offset="100%" stopColor="#111827" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* X-Axis Labels */}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-2">
                {weekLabels.map((label, i) => (
                  <span key={i} className="text-[10px] font-bold text-gray-400">{label}</span>
                ))}
              </div>
            </div>
            <div className="mt-8 flex justify-center items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-500 shadow-sm"></span>
              <span className="text-xs font-medium text-slate-500">Adherence Percentage (%)</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Health Metrics — Vitals Card */}
          <div className="rx-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-extrabold tracking-tight text-gray-900 uppercase flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-gray-900" />
                Vitals
              </h3>
              <button 
                onClick={() => setIsLogModalOpen(true)}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-gray-50 text-gray-900 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-colors border border-gray-100"
              >
                <Plus className="w-3 h-3" />
                Log Vitals
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100/50">
                <div className="flex items-center gap-3">
                  <Droplets className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Hydration</span>
                </div>
                <span className="text-sm font-bold text-gray-900 font-mono">{healthMetrics?.hydration || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100/50">
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Sleep</span>
                </div>
                <span className="text-sm font-bold text-purple-700 font-mono">{healthMetrics?.sleep || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100/50">
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-medium text-gray-700">Blood Pressure</span>
                </div>
                <span className="text-sm font-bold text-slate-700 font-mono">{healthMetrics?.bloodPressure || '—'}</span>
              </div>
            </div>
          </div>

          {/* Symptom Tracker */}
          <div className="rx-card p-6">
            <h3 className="text-sm font-heading font-extrabold tracking-tight text-gray-900 uppercase mb-4 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-rose-500" />
              Symptom Log
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Headache', 'Nausea', 'Fatigue', 'Dizziness', 'Muscle Pain'].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                    selectedSymptoms.includes(s) 
                      ? 'bg-rose-50 border-rose-200 text-rose-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {selectedSymptoms.length > 0 && (
              <div className="mt-4">
                <button 
                  onClick={async () => {
                    await handleLogSymptoms(selectedSymptoms);
                    setSelectedSymptoms([]);
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-xl transition-colors"
                >
                  Save Symptoms
                </button>
                <p className="mt-2 text-[10px] text-gray-400 font-medium text-center">
                  The Correlation Engine is monitoring your logs.
                </p>
              </div>
            )}
          </div>

          {/* AI Analysis Panel */}
          <div className="rx-card p-6">
            <h3 className="text-sm font-heading font-extrabold tracking-tight text-gray-900 uppercase mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-gray-900" />
              AI Clinical Analysis
            </h3>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Overall Risk', value: aiAnalysis?.overallRisk, icon: ShieldCheck, color: aiAnalysis?.overallRisk === 'LOW' ? 'emerald' : aiAnalysis?.overallRisk === 'No Data' ? 'gray' : 'amber' },
                { label: 'Drug Interaction', value: aiAnalysis?.drugInteraction, icon: Zap, color: aiAnalysis?.drugInteraction === 'None' ? 'emerald' : aiAnalysis?.drugInteraction === 'No Data' ? 'gray' : 'rose' },
                { label: 'Food Interaction', value: aiAnalysis?.foodInteraction, icon: Zap, color: aiAnalysis?.foodInteraction === 'None' ? 'emerald' : aiAnalysis?.foodInteraction === 'No Data' ? 'gray' : 'amber' },
                { label: 'Kidney Warning', value: aiAnalysis?.kidneyWarning, icon: AlertTriangle, color: aiAnalysis?.kidneyWarning === 'None' ? 'emerald' : aiAnalysis?.kidneyWarning === 'No Data' ? 'gray' : 'rose' },
                { label: 'Liver Safety', value: aiAnalysis?.liverSafety, icon: ShieldCheck, color: aiAnalysis?.liverSafety === 'Excellent' ? 'emerald' : aiAnalysis?.liverSafety === 'No Data' ? 'gray' : 'amber' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-medium text-gray-500">{item.label}</span>
                  <span className={`text-xs font-bold text-${item.color}-600 bg-${item.color}-50 px-2 py-0.5 rounded-full border border-${item.color}-100`}>
                    {item.value || '—'}
                  </span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Confidence</span>
                <span className="text-sm font-heading font-extrabold text-gray-900">{aiAnalysis?.confidence || '—'}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <input 
                  type="text"
                  placeholder="e.g. Grapefruit, Dairy..."
                  className="clinical-input flex-1 !text-xs !py-1.5"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      const res = await checkFoodInteraction(e.target.value);
                      if (res) {
                        setFoodAlert(res);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        setFoodAlert(null);
                        setGlobalAlert({ isOpen: true, title: 'Food Interaction Check', message: 'No interactions found.' });
                      }
                      e.target.value = '';
                    }
                  }}
                />
                <button 
                  onClick={() => setIsQuickAskOpen(true)}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Ask AI
                </button>
              </div>
            </div>
          </div>

          {/* Predictive Health AI (Trend Forecasting) */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
              <TrendingUp className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-heading font-extrabold tracking-tight uppercase mb-3 flex items-center gap-2 relative z-10 text-indigo-100">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              AI Trend Forecast
            </h3>
            <p className="text-sm text-indigo-50 leading-relaxed font-medium relative z-10">
              "{trendForecast || 'Fetching trend forecast...'}"
            </p>
          </div>

          {/* AI Insights */}
          {insights && insights.length > 0 && (
            <div className="rx-card p-6">
              <h3 className="text-sm font-heading font-extrabold tracking-tight text-gray-900 uppercase mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Clinical Insights
              </h3>
              <div className="flex flex-col gap-2">
                {insights.map(ins => (
                  <div key={ins.id} className={`p-3 rounded-xl text-sm font-medium ${
                    ins.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    ins.type === 'warning' ? 'bg-amber-50 text-indigo-700 border border-amber-100' :
                    'bg-gray-50 text-gray-900 border border-gray-100'
                  }`}>
                    {ins.text}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Log Vitals Modal */}
      <Modal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        title="Log Vitals"
        icon={HeartPulse}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Hydration (e.g. 2L)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Droplets className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={hydrationInput}
                onChange={(e) => setHydrationInput(e.target.value)}
                placeholder="e.g. 2 Liters"
                className="clinical-input pl-9"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Sleep (e.g. 8 hrs)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Moon className="w-4 h-4 text-purple-400" />
              </div>
              <input
                type="text"
                value={sleepInput}
                onChange={(e) => setSleepInput(e.target.value)}
                placeholder="e.g. 7.5 hrs"
                className="clinical-input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Blood Pressure</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Heart className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={bpInput}
                onChange={(e) => setBpInput(e.target.value)}
                placeholder="e.g. 120/80"
                className="clinical-input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Mood</label>
            <div className="flex gap-2">
              {['😢', '😐', '🙂', '😄', '🤩'].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setMoodInput(emoji)}
                  className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${
                    moodInput === emoji ? 'bg-blue-100 scale-110 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 grayscale hover:grayscale-0'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submitHealthLog}
            disabled={isLogging}
            className="med-btn-primary w-full mt-2 !rounded-xl"
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
              className="clinical-input resize-none !rounded-xl"
            />
          </div>

          <button
            onClick={async (e) => {
              if(!quickAskInput.trim()) return;
              setIsAsking(true);
              await handleSendMessage(e, quickAskInput);
              setIsAsking(false);
              setIsQuickAskOpen(false);
              setQuickAskInput('');
              navigate('/dashboard/chat');
            }}
            disabled={isAsking || !quickAskInput.trim()}
            className="med-btn-primary w-full mt-2 !rounded-xl"
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
