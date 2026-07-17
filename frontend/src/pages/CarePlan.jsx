import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Zap, Sparkles, FlaskConical, ChevronRight, Loader2, RefreshCw,
  HeartPulse, Brain, Moon, Apple, Activity, Pill, ChevronDown, Check, ArrowRight, Circle, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CarePlan = () => {
  const { labReports, dashboardMetrics, generateCarePlanForReport } = useGlobalContext();
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('plan');

  // Load history logs from localStorage
  useEffect(() => {
    if (selectedReportId) {
      const todayDate = new Date().toISOString().split('T')[0];
      const logs = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`vitaLeaf_tasks_${selectedReportId}_`) && !key.endsWith(todayDate)) {
          const dateStr = key.replace(`vitaLeaf_tasks_${selectedReportId}_`, '');
          try {
            const tasks = JSON.parse(localStorage.getItem(key));
            if (tasks && tasks.length > 0) {
              logs.push({ date: dateStr, tasks });
            }
          } catch(e) {}
        }
      }
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistoryLogs(logs);
    }
  }, [selectedReportId, completedTasks]);

  // Load tasks from localStorage for the current day
  useEffect(() => {
    if (selectedReportId) {
      const todayDate = new Date().toISOString().split('T')[0];
      const storageKey = `vitaLeaf_tasks_${selectedReportId}_${todayDate}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try { setCompletedTasks(JSON.parse(saved)); } 
        catch(e) { setCompletedTasks([]); }
      } else {
        setCompletedTasks([]);
      }
    }
  }, [selectedReportId]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (selectedReportId) {
      const todayDate = new Date().toISOString().split('T')[0];
      const storageKey = `vitaLeaf_tasks_${selectedReportId}_${todayDate}`;
      localStorage.setItem(storageKey, JSON.stringify(completedTasks));
    }
  }, [completedTasks, selectedReportId]);

  const toggleTask = (e, task) => {
    e.stopPropagation();
    setCompletedTasks(prev => 
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  useEffect(() => {
    if (labReports?.length > 0 && !selectedReportId) {
      setSelectedReportId(labReports[0].id);
    }
  }, [labReports, selectedReportId]);

  if (!labReports || labReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in bg-white rounded-[3rem] shadow-sm border border-gray-100">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-100 blur-3xl rounded-full opacity-60"></div>
          <Sparkles className="w-20 h-20 text-indigo-400 mb-6 relative z-10 animate-pulse" />
        </div>
        <h2 className="text-3xl font-heading font-extrabold text-gray-900 mb-3">Initialize AI Advisor</h2>
        <p className="text-gray-500 max-w-md text-base leading-relaxed">
          Upload a lab report to generate a dynamic, interactive health timeline tailored specifically to your biomolecular data.
        </p>
      </div>
    );
  }

  const currentReport = labReports.find(r => String(r.id) === String(selectedReportId));
  const carePlan = currentReport?.carePlan;
  const healthMetrics = dashboardMetrics?.healthMetrics;

  const handleGenerate = async () => {
    if (!currentReport) return;
    setIsGenerating(true);
    setError(null);
    try {
      const plan = await generateCarePlanForReport(currentReport.id);
      if (!plan) {
        setError("Failed to generate care plan. Please check the backend logs or restart the Node server.");
      } else {
        setCompletedTasks([]);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryConfig = (key) => {
    switch(key) {
      case 'dietProtocol': return { icon: Apple, title: 'Nutritional Protocol', desc: 'Metabolic & Dietary Adjustments', color: 'text-emerald-600', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50/50', gradient: 'from-emerald-400 to-emerald-500', shadow: 'shadow-emerald-500/20' };
      case 'exerciseMovement': return { icon: Activity, title: 'Kinetic Strategy', desc: 'Movement & Physical Therapy', color: 'text-blue-600', bg: 'bg-blue-500', lightBg: 'bg-blue-50/50', gradient: 'from-blue-400 to-blue-500', shadow: 'shadow-blue-500/20' };
      case 'sleepRecovery': return { icon: Moon, title: 'Circadian Optimization', desc: 'Sleep Architecture & Recovery', color: 'text-indigo-600', bg: 'bg-indigo-500', lightBg: 'bg-indigo-50/50', gradient: 'from-indigo-400 to-indigo-500', shadow: 'shadow-indigo-500/20' };
      case 'followUpMonitoring': return { icon: HeartPulse, title: 'Clinical Monitoring', desc: 'Next Steps & Diagnostics', color: 'text-purple-600', bg: 'bg-purple-500', lightBg: 'bg-purple-50/50', gradient: 'from-purple-400 to-purple-500', shadow: 'shadow-purple-500/20' };
      case 'mentalEmotional': return { icon: Brain, title: 'Cognitive Wellness', desc: 'Stress Modulation & Focus', color: 'text-pink-600', bg: 'bg-pink-500', lightBg: 'bg-pink-50/50', gradient: 'from-pink-400 to-pink-500', shadow: 'shadow-pink-500/20' };
      case 'supplementOtc': return { icon: Pill, title: 'Supplement Stack', desc: 'Targeted OTC Interventions', color: 'text-orange-600', bg: 'bg-orange-500', lightBg: 'bg-orange-50/50', gradient: 'from-orange-400 to-orange-500', shadow: 'shadow-orange-500/20' };
      default: return null;
    }
  };

  const renderTimeline = () => {
    const categories = ['dietProtocol', 'exerciseMovement', 'sleepRecovery', 'supplementOtc', 'mentalEmotional', 'followUpMonitoring'];
    const activeCategories = categories.filter(cat => carePlan[cat] && carePlan[cat].length > 0);
    
    if (activeCategory === null && activeCategories.length > 0) {
      setActiveCategory(activeCategories[0]);
    }

    return (
      <div className="relative pl-4 md:pl-8">
        {/* Minimal Timeline Line */}
        <div className="absolute left-[27px] md:left-[43px] top-8 bottom-8 w-px bg-gray-200"></div>
        
        <div className="flex flex-col gap-8 relative z-10">
          {activeCategories.map((cat, idx) => {
            const config = getCategoryConfig(cat);
            const Icon = config.icon;
            const isActive = activeCategory === cat;

            return (
              <div key={cat} className="relative flex items-start gap-6 group">
                {/* Minimal Node */}
                <div 
                  onClick={() => setActiveCategory(cat)}
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all duration-300 z-10 ${isActive ? `bg-white shadow-md border-2 border-indigo-500 scale-110` : 'bg-gray-50 border border-gray-200 hover:border-indigo-300 hover:bg-white'}`}
                >
                  <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? config.color : 'text-gray-400 group-hover:text-indigo-500'}`} />
                </div>

                {/* Unique Geometric Content Card */}
                <motion.div 
                  layout
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 transition-all duration-500 cursor-pointer overflow-hidden ${isActive ? `bg-white shadow-lg shadow-gray-200/50 border border-gray-100 rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl` : 'bg-transparent border border-transparent hover:bg-gray-50 rounded-2xl'}`}
                >
                  <div className={`p-6 md:p-8 transition-all duration-500 ${isActive ? config.lightBg : 'bg-transparent'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`font-heading font-extrabold text-lg md:text-xl transition-colors ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>
                        {config.title}
                      </h3>
                      {!isActive && (
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <p className={`text-[11px] font-bold uppercase tracking-widest mb-6 transition-colors ${isActive ? config.color : 'text-gray-400'}`}>
                      {config.desc}
                    </p>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <ul className="flex flex-col gap-4">
                            {carePlan[cat].map((item, i) => {
                              const isDone = completedTasks.includes(item);
                              return (
                                <motion.li 
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 * i }}
                                  key={i} 
                                  onClick={(e) => toggleTask(e, item)}
                                  className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${isDone ? 'bg-gray-50 opacity-70' : 'bg-white shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200'}`}
                                >
                                  <button className="mt-0.5 shrink-0 transition-colors duration-300 focus:outline-none">
                                    {isDone ? (
                                      <CheckCircle2 className={`w-6 h-6 ${config.color}`} />
                                    ) : (
                                      <Circle className={`w-6 h-6 text-gray-300 hover:${config.color} transition-colors`} />
                                    )}
                                  </button>
                                  <span className={`flex-1 text-[15px] font-medium leading-relaxed transition-all duration-300 pt-0.5 ${isDone ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-700'}`}>
                                    {item}
                                  </span>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getMarkerStatusColor = (status) => {
    if (status === 'high' || status === 'Warning' || status === 'critical') return 'bg-rose-500 shadow-rose-500/40 text-rose-700';
    if (status === 'low') return 'bg-blue-500 shadow-blue-500/40 text-blue-700';
    return 'bg-emerald-500 shadow-emerald-500/40 text-emerald-700';
  };

  // Dynamically calculate the Health Score based on Biomarker status
  let healthScore = 0;
  if (currentReport?.parameters?.length > 0) {
    const total = currentReport.parameters.length;
    const optimal = currentReport.parameters.filter(p => 
      p.status !== 'high' && p.status !== 'Warning' && p.status !== 'critical' && p.status !== 'low'
    ).length;
    
    // Base score of 40, plus up to 60 based on optimal percentage
    healthScore = Math.round(40 + ((optimal / total) * 60));
  }

  // Get Category Title for a task
  const getTaskCategoryTitle = (taskString) => {
    if (!carePlan) return 'General Task';
    const categories = ['dietProtocol', 'exerciseMovement', 'sleepRecovery', 'supplementOtc', 'mentalEmotional', 'followUpMonitoring'];
    for (let cat of categories) {
      if (carePlan[cat]?.includes(taskString)) {
        return getCategoryConfig(cat)?.title || 'General Task';
      }
    }
    return 'General Task';
  };

  const renderHistoryLogs = () => {
    if (historyLogs.length === 0) {
      return (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
            <RefreshCw className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Logs Yet</h3>
          <p className="text-gray-500 font-medium max-w-sm mx-auto">Your completion history will appear here once you start completing tasks in your Care Plan.</p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-6">
        {historyLogs.map((log, index) => {
          // Group tasks by category
          const groupedTasks = {};
          log.tasks.forEach(task => {
            const cat = getTaskCategoryTitle(task);
            if (!groupedTasks[cat]) groupedTasks[cat] = [];
            groupedTasks[cat].push(task);
          });
          
          return (
            <div key={index} className="border border-gray-100 rounded-3xl p-6 md:p-8 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
                <h4 className="font-heading font-extrabold text-xl text-gray-900">
                  {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h4>
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full w-fit">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{log.tasks.length} Completed</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(groupedTasks).map(([category, tasks], i) => (
                  <div key={i} className="flex flex-col gap-4">
                    <h5 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg w-fit">{category}</h5>
                    <ul className="flex flex-col gap-3">
                      {tasks.map((task, j) => (
                        <li key={j} className="flex items-start gap-3 text-[14px] font-medium text-gray-700 leading-relaxed bg-gray-50/80 p-4 rounded-2xl border border-gray-100/50 hover:bg-gray-50 transition-colors">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-7xl mx-auto pb-16">
      
      {/* Whitish Clean Header */}
      <div className="relative bg-white border border-gray-100 rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl p-8 md:p-10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-6 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">AI Intelligence Active</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-gray-900 mb-4 tracking-tight">
            Professional Care Plan
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-medium leading-relaxed max-w-lg">
            Your personalized health roadmap, dynamically generated from your latest laboratory biomarkers and medical profile.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-end gap-3 w-full md:w-auto">
          <div className="w-full sm:w-auto min-w-[280px] bg-gray-50 border border-gray-100 p-2 rounded-2xl shadow-inner">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 pt-0.5 mb-1">Target Report</label>
            <div className="relative">
              <select 
                className="appearance-none bg-white border border-gray-200 hover:border-indigo-300 text-gray-900 py-2 pl-4 pr-10 rounded-xl text-sm font-bold cursor-pointer transition-colors w-full focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
                value={selectedReportId || ''}
                onChange={(e) => setSelectedReportId(e.target.value)}
                disabled={isGenerating}
              >
                {labReports.map(report => (
                  <option key={report.id} value={report.id} className="text-gray-900 font-medium">
                    Report: {new Date(report.uploadedAt).toLocaleDateString()} ({report.parameters.length} markers)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {carePlan && (
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="h-[60px] px-6 bg-gray-900 hover:bg-indigo-600 text-white rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all duration-300 w-full sm:w-auto shrink-0 group"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors" />}
              <span className="font-bold text-sm tracking-wide">{isGenerating ? 'Updating...' : 'Update Protocol'}</span>
            </button>
          )}
        </div>
      </div>

      {!carePlan && (
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center bg-white border border-gray-100 rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl shadow-sm relative overflow-hidden group">
          <div className="w-28 h-28 bg-gray-50 rounded-full flex items-center justify-center mb-8 shadow-inner border border-gray-100 group-hover:scale-105 transition-transform duration-500 relative z-10">
            <Sparkles className="w-12 h-12 text-indigo-400" />
          </div>
          
          <h2 className="text-3xl font-heading font-extrabold text-gray-900 mb-4 relative z-10">Synthesize Your Data</h2>
          <p className="text-gray-500 text-base max-w-lg mb-10 leading-relaxed relative z-10">
            Activate the AI engine to cross-reference your biomarkers with your medications and generate a comprehensive, actionable protocol.
          </p>
          
          <button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="relative z-10 flex items-center justify-center gap-3 bg-gray-900 hover:bg-indigo-600 text-white px-10 py-4 rounded-full font-bold text-base transition-all duration-300 shadow-xl hover:shadow-indigo-500/20 disabled:opacity-70"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin relative z-10" /> : <Zap className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors relative z-10" />}
            <span className="relative z-10 tracking-wide">{isGenerating ? 'Processing Intelligence...' : 'Generate Care Protocol'}</span>
          </button>
          
          {error && (
            <div className="mt-8 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium rounded-xl max-w-md relative z-10 animate-fade-in shadow-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {carePlan && (
        <div className="flex flex-col gap-8 w-full">
          {/* Global Tab Navigation */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl w-fit border border-gray-200 shadow-inner">
            <button 
              onClick={() => setActiveTab('plan')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'plan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Today's Plan
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'logs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Detailed Logs & Insights
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={`${currentReport.id}-${activeTab}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              {activeTab === 'plan' ? (
                /* Plan Layout - Grid Split */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                  
                  {/* Left: Today's Protocol (Span 8) */}
                  <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-10 ml-2">
                        <h3 className="text-2xl font-heading font-extrabold text-gray-900">Today's Protocol</h3>
                        <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>
                      {renderTimeline()}
                    </div>
                  </div>

                  {/* Right: Critical Alerts & Adjustments (Span 4, sticky) */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="sticky top-6 flex flex-col gap-6">
                      {(carePlan.warningSigns?.length > 0 || carePlan.autoAlerts?.length > 0) ? (
                        <>
                          {carePlan.warningSigns?.length > 0 && (
                            <div className="relative bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                              <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                                </div>
                                <div>
                                  <h3 className="text-[15px] font-extrabold font-heading text-gray-900 leading-tight">Critical Alerts</h3>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500 mt-0.5">Requires Attention</p>
                                </div>
                              </div>
                              <ul className="space-y-3">
                                {carePlan.warningSigns.map((warning, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-[13px] font-medium text-gray-700 leading-relaxed bg-rose-50/50 p-4 rounded-xl border border-rose-100/50 hover:bg-rose-50 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0 shadow-sm"></div>
                                    <span>{warning}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {carePlan.autoAlerts?.length > 0 && (
                            <div className="relative bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                              <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                                  <Zap className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                  <h3 className="text-[15px] font-extrabold font-heading text-gray-900 leading-tight">Safety Adjustments</h3>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mt-0.5">Medication & Lifestyle</p>
                                </div>
                              </div>
                              <ul className="space-y-3">
                                {carePlan.autoAlerts.map((alert, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-[13px] font-medium text-gray-700 leading-relaxed bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 hover:bg-amber-50 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0 shadow-sm"></div>
                                    <span>{alert}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm flex flex-col items-center justify-center text-center h-[200px]">
                          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          </div>
                          <h3 className="text-[15px] font-extrabold font-heading text-gray-900 mb-1">All Clear</h3>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">No active alerts</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Bento-Box Layout for Logs & Insights */
                <div className="flex flex-col gap-8">
                  
                  {/* Top Stats Row: Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Stat Card 1: Total Logs */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Logs</p>
                        <h4 className="text-3xl font-heading font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {historyLogs.reduce((acc, log) => acc + log.tasks.length, 0) + completedTasks.length}
                        </h4>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                      </div>
                    </div>

                    {/* Stat Card 2: Active Days */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Days</p>
                        <h4 className="text-3xl font-heading font-black text-gray-900 group-hover:text-emerald-600 transition-colors">
                          {historyLogs.length + (completedTasks.length > 0 ? 1 : 0)}
                        </h4>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-emerald-500" />
                      </div>
                    </div>

                    {/* Stat Card 3: Integrity Score */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-5 w-24 h-24 translate-x-4 translate-y-4">
                         <Sparkles className="w-full h-full text-indigo-900" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Integrity Score</p>
                        <div className="flex items-baseline gap-1">
                          <h4 className="text-3xl font-heading font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {healthScore}
                          </h4>
                          <span className="text-sm font-bold text-gray-400">/ 100</span>
                        </div>
                      </div>
                      <div className="relative z-10 w-12 h-12 rounded-full border-[3px] border-indigo-100 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path strokeDasharray={`${healthScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>

                  </div>

                  {/* Main Content Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    
                    {/* Left: Completion History (Span 8) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                      
                      {/* Compact Activity Chart */}
                      <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">7-Day Activity Activity</h3>
                        </div>
                        <div className="flex items-end justify-between h-28 gap-2">
                          {Array.from({length: 7}, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - i));
                            return d.toISOString().split('T')[0];
                          }).map((dateStr, i, arr) => {
                            const isToday = dateStr === new Date().toISOString().split('T')[0];
                            const count = isToday 
                              ? completedTasks.length 
                              : (historyLogs.find(l => l.date === dateStr)?.tasks.length || 0);
                            const allCounts = arr.map(ds => 
                              ds === new Date().toISOString().split('T')[0] 
                                ? completedTasks.length 
                                : (historyLogs.find(l => l.date === ds)?.tasks.length || 0)
                            );
                            const maxCount = Math.max(...allCounts, 3);
                            const heightPercent = count > 0 ? (count / maxCount) * 100 : 0;
                            
                            return (
                              <div key={i} className="flex flex-col items-center flex-1 group">
                                <div className="w-full relative flex justify-center h-20 items-end">
                                  <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPercent}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 relative ${isToday ? 'bg-indigo-500 shadow-md shadow-indigo-500/20' : 'bg-gray-100 group-hover:bg-indigo-200'}`}
                                  >
                                    {count > 0 && (
                                      <span className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold ${isToday ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}`}>
                                        {count}
                                      </span>
                                    )}
                                  </motion.div>
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-widest mt-2 ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                                  {isToday ? 'Today' : new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6 ml-2">
                          <h3 className="text-xl font-heading font-extrabold text-gray-900">Completion History</h3>
                        </div>
                        {renderHistoryLogs()}
                      </div>
                    </div>

                    {/* Right: Marker Drivers (Span 4, sticky) */}
                    <div className="lg:col-span-4">
                      <div className="sticky top-6 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-120px)] max-h-[800px]">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                              <FlaskConical className="w-5 h-5" />
                            </div>
                            <h3 className="font-heading font-extrabold text-sm text-gray-900">Marker Drivers</h3>
                          </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                          {currentReport.parameters.map((param) => {
                            const isHigh = param.status === 'high' || param.status === 'Warning' || param.status === 'critical';
                            const isLow = param.status === 'low';
                            const statusClass = getMarkerStatusColor(param.status);
                            
                            let percent = '50%';
                            if (isHigh) percent = '85%';
                            if (isLow) percent = '15%';

                            return (
                              <div key={param.id} className="group p-4 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-bold text-[13px] text-gray-800 line-clamp-1">{param.name}</h4>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isHigh ? 'text-rose-500' : isLow ? 'text-blue-500' : 'text-emerald-500'}`}>
                                      {isHigh ? 'Elevated' : isLow ? 'Reduced' : 'Optimal'}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono font-bold text-[13px] text-gray-900">{param.value}</span>
                                    <span className="text-[10px] font-medium text-gray-500 ml-1">{param.unit}</span>
                                  </div>
                                </div>
                                
                                <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: percent }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`absolute top-0 left-0 h-full rounded-full ${statusClass}`}
                                  ></motion.div>
                                  {/* Target zone indicator */}
                                  <div className="absolute top-0 left-[25%] right-[25%] h-full bg-emerald-500/20 rounded-full pointer-events-none"></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CarePlan;
