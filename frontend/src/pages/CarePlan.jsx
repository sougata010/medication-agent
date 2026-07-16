import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Zap, Sparkles, FlaskConical, ChevronRight, Loader2, RefreshCw,
  HeartPulse, Brain, Moon, Apple, Activity, Pill, ChevronDown, Check, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CarePlan = () => {
  const { labReports, dashboardMetrics, generateCarePlanForReport } = useGlobalContext();
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

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
                            {carePlan[cat].map((item, i) => (
                              <motion.li 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                key={i} 
                                className="flex items-start gap-4 relative"
                              >
                                {/* Custom list marker */}
                                <div className={`w-1.5 h-1.5 rounded-full ${config.bg} mt-2.5 shrink-0 shadow-sm opacity-80`}></div>
                                <span className="flex-1 text-[15px] text-gray-700 font-medium leading-relaxed">{item}</span>
                              </motion.li>
                            ))}
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
            Holistic Care Protocol
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-medium leading-relaxed max-w-lg">
            Your personalized health roadmap, dynamically generated from your latest laboratory biomarkers and medical profile.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-end gap-3 w-full md:w-auto">
          <div className="w-full sm:w-auto min-w-[280px] bg-gray-50 border border-gray-100 p-3 rounded-2xl shadow-inner">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 pt-1 mb-2">Target Report</label>
            <div className="relative">
              <select 
                className="appearance-none bg-white border border-gray-200 hover:border-indigo-300 text-gray-900 py-3 pl-4 pr-10 rounded-xl text-sm font-bold cursor-pointer transition-colors w-full focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
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
              className="h-[76px] px-6 bg-gray-900 hover:bg-indigo-600 text-white rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all duration-300 w-full sm:w-auto shrink-0 group"
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
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentReport.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10"
          >
            {/* Left Column: The Interactive Timeline */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
              


              {/* Minimalist Alerts */}
              {(carePlan.warningSigns?.length > 0 || carePlan.autoAlerts?.length > 0) && (
                <div className="flex flex-col gap-6">
                  {carePlan.warningSigns?.length > 0 && (
                    <div className="relative bg-white border border-gray-100 rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-xl rounded-bl-xl p-6 md:p-8 shadow-sm overflow-hidden">
                      {/* Left accent line */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                      
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold font-heading text-gray-900">Critical Alerts</h3>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-rose-500">Requires Attention</p>
                        </div>
                      </div>
                      
                      <ul className="space-y-5">
                        {carePlan.warningSigns.map((warning, idx) => (
                          <li key={idx} className="flex items-start gap-4 text-[15px] font-medium text-gray-700 leading-relaxed">
                            <div className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0 shadow-sm"></div>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {carePlan.autoAlerts?.length > 0 && (
                    <div className="relative bg-white border border-gray-100 rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-xl rounded-bl-xl p-6 md:p-8 shadow-sm overflow-hidden">
                      {/* Left accent line */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                      
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold font-heading text-gray-900">Safety Adjustments</h3>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Medication & Lifestyle</p>
                        </div>
                      </div>
                      
                      <ul className="space-y-5">
                        {carePlan.autoAlerts.map((alert, idx) => (
                          <li key={idx} className="flex items-start gap-4 text-[15px] font-medium text-gray-700 leading-relaxed">
                            <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0 shadow-sm"></div>
                            <span>{alert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* The Timeline */}
              <div className="bg-white rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl p-6 md:p-10 shadow-sm border border-gray-100">
                <h3 className="text-2xl font-heading font-extrabold text-gray-900 mb-10 ml-2">Actionable Intelligence</h3>
                {renderTimeline()}
              </div>

            </div>

            {/* Right Column: Sticky Context Hub */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
              <div className="sticky top-6 flex flex-col gap-6">
                
                {/* Clean Health Score Widget */}
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Protocol Integrity</h3>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center text-center gap-4">
                    {/* Fake Radial Progress */}
                    <div className="relative w-32 h-32 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F3F4F6" strokeWidth="2.5" />
                        <path strokeDasharray={`${healthScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                        <span className="text-4xl font-heading font-black text-gray-900">{healthScore}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Score</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-[200px]">
                      Optimized based on <span className="text-gray-900 font-bold">{currentReport.parameters.length}</span> analyzed lab biomarkers.
                    </p>
                  </div>
                </div>

                {/* Rich Biomarker List */}
                <div className="bg-white rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full max-h-[600px]">
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <FlaskConical className="w-5 h-5" />
                      </div>
                      <h3 className="font-heading font-extrabold text-base text-gray-900">Marker Drivers</h3>
                    </div>
                    <Link to="/dashboard/reports" className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors">
                      View All
                    </Link>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
                    {currentReport.parameters.map((param) => {
                      const isHigh = param.status === 'high' || param.status === 'Warning' || param.status === 'critical';
                      const isLow = param.status === 'low';
                      const statusClass = getMarkerStatusColor(param.status);
                      
                      let percent = '50%';
                      if (isHigh) percent = '85%';
                      if (isLow) percent = '15%';

                      return (
                        <div key={param.id} className="group p-4 rounded-2xl bg-gray-50 hover:bg-gray-100/50 border border-transparent transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{param.name}</h4>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${isHigh ? 'text-rose-500' : isLow ? 'text-blue-500' : 'text-emerald-500'}`}>
                                {isHigh ? 'Elevated' : isLow ? 'Reduced' : 'Optimal'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-gray-900">{param.value}</span>
                              <span className="text-xs font-medium text-gray-500 ml-1">{param.unit}</span>
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
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default CarePlan;
