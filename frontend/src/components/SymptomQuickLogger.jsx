import React, { useState } from 'react';
import { Activity, Plus, Check, AlertCircle } from 'lucide-react';

const COMMON_SYMPTOMS = [
  { name: 'Dizziness', icon: '🌀' },
  { name: 'Dry Cough', icon: '🗣️' },
  { name: 'Nausea', icon: '🤢' },
  { name: 'Fatigue', icon: '😴' },
  { name: 'Muscle Aches', icon: '💪' },
  { name: 'Headache', icon: '🤕' },
  { name: 'Stomach Upset', icon: '😣' },
  { name: 'Swollen Ankles', icon: '🦶' }
];

export default function SymptomQuickLogger({ onLogSymptom }) {
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const activeSymptomName = selectedSymptom === 'custom' ? customInput : selectedSymptom;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeSymptomName.trim()) return;

    setSubmitting(true);
    try {
      if (onLogSymptom) {
        await onLogSymptom(activeSymptomName.trim(), severity, notes);
      }
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      setSelectedSymptom('');
      setCustomInput('');
      setNotes('');
    } catch (err) {
      console.error("Error logging symptom:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Quick Symptom Tracker</h3>
          <p className="text-xs text-slate-500">Tap a symptom to correlate with your active prescription timeline</p>
        </div>
      </div>

      {/* Quick Tap Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {COMMON_SYMPTOMS.map((sym) => (
          <button
            key={sym.name}
            type="button"
            onClick={() => setSelectedSymptom(sym.name)}
            className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-semibold transition-all border text-left ${
              selectedSymptom === sym.name
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span className="text-base">{sym.icon}</span>
            <span className="truncate">{sym.name}</span>
          </button>
        ))}
      </div>

      {/* Form Details */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-3 border-t border-slate-100">
        {selectedSymptom === 'custom' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Symptom Name</label>
            <input
              type="text"
              placeholder="e.g. Heart Palpitations, Blurred Vision..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 mr-1">Severity:</span>
            {['mild', 'moderate', 'severe'].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverity(sev)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all border ${
                  severity === sev
                    ? sev === 'severe'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : sev === 'moderate'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || !activeSymptomName}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all ${
              activeSymptomName
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            {submitting ? (
              <span className="animate-spin text-sm">🌀</span>
            ) : successMsg ? (
              <>
                <Check className="w-4 h-4 text-white" /> Logged!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Log Symptom
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
