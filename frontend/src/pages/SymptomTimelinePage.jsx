import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import SymptomQuickLogger from '../components/SymptomQuickLogger';
import SymptomDiseasePredictor from '../components/SymptomDiseasePredictor';
import { Activity, Pill, AlertTriangle, Sparkles, RefreshCw, Calendar, Clock, CheckCircle2, Eye, ShieldAlert, ArrowRight, Brain } from 'lucide-react';

const GET_SYMPTOM_CORRELATION_TIMELINE = `
  query GetSymptomCorrelationTimeline($userId: ID!) {
    getSymptomCorrelationTimeline(userId: $userId) {
      events {
        id
        type
        title
        name
        date
        severity
        notes
        description
      }
      insights {
        id
        symptom
        medication
        deltaDays
        confidence
        isKnownFDAEffect
        title
        text
        clinicalNote
      }
      summary {
        total_medications
        total_symptom_logs
        total_correlations
      }
    }
  }
`;

const LOG_SYMPTOM_EVENT_MUTATION = `
  mutation LogSymptomEvent($userId: ID!, $symptomName: String!, $severity: String, $notes: String) {
    logSymptomEvent(userId: $userId, symptomName: $symptomName, severity: $severity, notes: $notes) {
      id
      symptoms
      loggedAt
    }
  }
`;

const SAMPLE_TIMELINE_DATA = {
  events: [
    { id: "e1", type: "medication_start", title: "Started Lisinopril 10mg", name: "Lisinopril 10mg", date: "2026-09-10", description: "Medication Lisinopril 10mg regimen initiated for Blood Pressure." },
    { id: "e2", type: "symptom_log", title: "Reported Dry Cough", name: "Dry Cough", severity: "moderate", date: "2026-09-12", notes: "Persistent tickling dry cough especially at night." },
    { id: "e3", type: "medication_start", title: "Started Metformin 500mg", name: "Metformin 500mg", date: "2026-09-14", description: "Initiated Metformin 500mg for glycemic management." },
    { id: "e4", type: "symptom_log", title: "Reported Nausea", name: "Nausea", severity: "mild", date: "2026-09-15", notes: "Mild stomach discomfort after morning dose." }
  ],
  insights: [
    {
      id: "ins_lisinopril_cough",
      symptom: "Dry Cough",
      medication: "Lisinopril 10mg",
      deltaDays: 2,
      confidence: "High",
      isKnownFDAEffect: true,
      title: "Temporal Correlation: Dry Cough ↔ Lisinopril 10mg",
      text: "Your reported 'Dry Cough' began 2 days after 'Lisinopril 10mg' was started.",
      clinicalNote: "OpenFDA labeling lists 'Dry Cough' as a primary ACE-inhibitor adverse reaction affecting 5-15% of patients."
    },
    {
      id: "ins_metformin_nausea",
      symptom: "Nausea",
      medication: "Metformin 500mg",
      deltaDays: 1,
      confidence: "High",
      isKnownFDAEffect: true,
      title: "Temporal Correlation: Nausea ↔ Metformin 500mg",
      text: "Your reported 'Nausea' began 1 day after 'Metformin 500mg' was started.",
      clinicalNote: "Gastrointestinal distress & nausea are well-documented early initiation side effects of Metformin."
    }
  ],
  summary: { total_medications: 2, total_symptom_logs: 2, total_correlations: 2 }
};

export default function SymptomTimelinePage() {
  const { user, gqlFetch } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState(null);
  const [useSampleMode, setUseSampleMode] = useState(false);
  const [activeTab, setActiveTab] = useState('predictor'); // 'predictor' or 'timeline'

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      if (gqlFetch) {
        const userIdVal = user?.id ? String(user.id) : "1";
        const data = await gqlFetch(GET_SYMPTOM_CORRELATION_TIMELINE, { userId: userIdVal });
        
        if (data && data.getSymptomCorrelationTimeline && data.getSymptomCorrelationTimeline.events && data.getSymptomCorrelationTimeline.events.length > 0) {
          setTimelineData(data.getSymptomCorrelationTimeline);
          setUseSampleMode(false);
          setLoading(false);
          return;
        }
      }
      setTimelineData(SAMPLE_TIMELINE_DATA);
      setUseSampleMode(true);
    } catch (err) {
      console.error("Failed to load symptom correlation timeline:", err);
      setTimelineData(SAMPLE_TIMELINE_DATA);
      setUseSampleMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData();
  }, [user]);

  const handleLogSymptom = async (symptomName, severity, notes) => {
    if (gqlFetch && user?.id) {
      await gqlFetch(LOG_SYMPTOM_EVENT_MUTATION, {
        userId: String(user.id),
        symptomName,
        severity,
        notes
      });
    }
    // Refresh timeline data
    fetchTimelineData();
  };

  const toggleSampleMode = () => {
    if (useSampleMode) {
      setUseSampleMode(false);
      fetchTimelineData();
    } else {
      setUseSampleMode(true);
      setTimelineData(SAMPLE_TIMELINE_DATA);
    }
  };

  const activeData = timelineData || SAMPLE_TIMELINE_DATA;
  const events = activeData.events || [];
  const insights = activeData.insights || [];
  const summary = activeData.summary || { total_medications: 0, total_symptom_logs: 0, total_correlations: 0 };

  return (
    <div className="space-y-6 pb-12">
      {/* Interactive Mode Tabs */}
      <div className="flex p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200/80 max-w-xl mx-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('predictor')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'predictor'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Brain className={`w-4 h-4 ${activeTab === 'predictor' ? 'text-indigo-600' : 'text-gray-400'}`} />
          <span>Symptom → Disease Predictor</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-700">DL AI</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'timeline'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Activity className={`w-4 h-4 ${activeTab === 'timeline' ? 'text-emerald-600' : 'text-gray-400'}`} />
          <span>Medication Correlation Timeline</span>
        </button>
      </div>

      {activeTab === 'predictor' ? (
        <SymptomDiseasePredictor />
      ) : (
        <div className="space-y-6">
          {/* Whitish Clean Header */}
          <div className="relative bg-white border border-gray-100 rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl p-8 md:p-10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50/40 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-full mb-4 shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">Temporal Insight Intelligence</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                Symptom ↔ Medication Timeline
              </h1>
              <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed">
                Track side-effects against your medication start/change dates. Surface statistically grounded correlation insights like <em>"Your dry cough began 2 days after Lisinopril was added."</em>
              </p>
            </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={toggleSampleMode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs border border-gray-200 transition-all shadow-xs"
          >
            <Eye className="w-4 h-4 text-gray-500" />
            {useSampleMode ? "View Personal Regimen" : "Load Sample Regimen"}
          </button>

          <button
            onClick={fetchTimelineData}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {useSampleMode && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Showing <strong>Sample Symptom Correlation Data</strong> (Lisinopril + Metformin timeline) for demonstration.
          </span>
          <button
            onClick={() => setUseSampleMode(false)}
            className="text-emerald-700 hover:text-emerald-950 underline font-semibold"
          >
            Switch to My Personal Data
          </button>
        </div>
      )}

      {/* Quick Tap Logger Component */}
      <SymptomQuickLogger onLogSymptom={handleLogSymptom} />

      {/* Temporal Insight Cards */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Detected Temporal Correlations ({insights.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">OpenFDA Verified Cross-Reference</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map(ins => (
              <div
                key={ins.id}
                className="bg-white rounded-3xl border border-indigo-200/80 shadow-sm p-6 relative overflow-hidden group hover:border-indigo-400 transition-all"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 opacity-60 group-hover:scale-125 transition-transform" />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {ins.confidence} Confidence Correlation
                    </span>
                    <span className="text-xs font-semibold text-slate-400">Δ {ins.deltaDays} Days</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{ins.title}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    "{ins.text}"
                  </p>

                  <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-1">
                    <ShieldAlert className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{ins.clinicalNote}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dual Overlay Chronological Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Chronological Med & Symptom Timeline
            </h3>
            <p className="text-xs text-slate-500">Dual timeline overlay showing medication start dates & symptom logs</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-600" /> Med Started</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /> Symptom Logged</span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No timeline events recorded yet.</p>
            <p className="text-xs text-slate-500 mt-1">Tap a symptom above to begin recording your timeline!</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {events.map((ev, idx) => {
              const isMed = ev.type === 'medication_start';
              return (
                <div key={ev.id || idx} className="relative group">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                      isMed ? 'bg-indigo-600' : 'bg-rose-500'
                    }`}
                  />

                  <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 p-4 rounded-2xl transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {isMed ? (
                          <Pill className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-rose-500" />
                        )}
                        <h4 className="text-xs font-bold text-slate-900">{ev.title}</h4>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-500">{ev.date}</span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      {isMed ? ev.description : ev.notes || `Reported ${ev.name} (Severity: ${ev.severity || 'moderate'})`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
}
