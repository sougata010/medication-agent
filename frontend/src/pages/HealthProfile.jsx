import React from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import {
  User, Heart, AlertTriangle, Phone, Save, Plus, X, ShieldCheck,
  HeartPulse, Stethoscope
} from 'lucide-react';

export default function HealthProfile() {
  const {
    user,
    profileAllergies,
    allergyInput,
    setAllergyInput,
    handleAddAllergy,
    handleRemoveAllergy,
    profileConditions,
    conditionInput,
    setConditionInput,
    handleAddCondition,
    handleRemoveCondition,
    handleSaveProfile
  } = useGlobalContext();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-gray-900">Profile & Settings</h1>
        <p className="text-gray-900/70 font-medium mt-1">Manage your medical history and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* User Info — Patient ID Card */}
          <div className="rx-card p-6 rx-watermark overflow-hidden">
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold">
                {user?.name?.substring(0, 2).toUpperCase() || 'VL'}
              </div>
              <div>
                <h2 className="text-lg font-heading font-extrabold text-gray-900">{user?.name || 'Patient'}</h2>
                <p className="text-sm text-gray-500/70 font-medium">
                  {user?.age ? `${user.age} years` : ''} {user?.gender ? `· ${user.gender}` : ''} {user?.language ? `· ${user.language.toUpperCase()}` : ''}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Reminder Channel</span>
                <span className="text-sm font-semibold text-gray-900">{user?.reminderChannel || 'Email'}</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Language</span>
                <span className="text-sm font-semibold text-gray-900 font-mono">{user?.language?.toUpperCase() || 'EN'}</span>
              </div>
            </div>
          </div>

          {/* Chronic Conditions */}
          <div className="rx-card p-6">
            <h3 className="text-base font-heading font-extrabold text-gray-900 flex items-center gap-2 mb-4">
              <HeartPulse className="w-5 h-5 text-gray-900" />
              Chronic Conditions
            </h3>
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddCondition(conditionInput, profileConditions); }}
              className="flex gap-2 mb-4"
            >
              <input
                type="text"
                placeholder="E.g. Type 2 Diabetes"
                className="clinical-input flex-1"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
              />
              <button type="submit" className="med-btn-primary !rounded-xl">
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {profileConditions.length === 0 ? (
                <p className="text-sm text-gray-500/60 italic py-3">No chronic conditions listed</p>
              ) : (
                profileConditions.map((cond, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900">
                    {cond}
                    <button onClick={() => handleRemoveCondition(cond, profileConditions)} className="text-gray-500 hover:text-slate-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Allergies */}
          <div className="rx-card p-6">
            <h3 className="text-base font-heading font-extrabold text-gray-900 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-slate-500" />
              Known Allergies
            </h3>
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddAllergy(allergyInput, profileAllergies); }}
              className="flex gap-2 mb-4"
            >
              <input
                type="text"
                placeholder="E.g. Penicillin"
                className="clinical-input flex-1"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
              />
              <button type="submit" className="med-btn-primary !rounded-xl">
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {profileAllergies.length === 0 ? (
                <p className="text-sm text-gray-500/60 italic py-3">No known allergies</p>
              ) : (
                profileAllergies.map((allergy, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700">
                    <AlertTriangle className="w-3 h-3" />
                    {allergy}
                    <button onClick={() => handleRemoveAllergy(allergy, profileAllergies)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Emergency Contact */}
          <div className="rx-card p-6">
            <h3 className="text-base font-heading font-extrabold text-gray-900 flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-gray-900" />
              Emergency Contact
            </h3>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm font-medium text-gray-500/70">Not configured</p>
              <p className="text-xs text-gray-500/50 mt-1">Set up emergency contacts for automatic notification</p>
            </div>
          </div>

          {/* Data Security */}
          <div className="rx-card p-6">
            <h3 className="text-base font-heading font-extrabold text-gray-900 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-sky-500" />
              Data Security
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-100">
                <span className="text-xs font-medium text-sky-700">End-to-End Encryption</span>
                <span className="text-[10px] font-bold text-sky-600 uppercase">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-100">
                <span className="text-xs font-medium text-sky-700">HIPAA Compliant</span>
                <span className="text-[10px] font-bold text-sky-600 uppercase">Verified</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={(e) => handleSaveProfile(e, profileAllergies, profileConditions)}
            className="w-full bg-black text-white font-bold py-3.5 rounded-full shadow-sm hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Profile Changes
          </button>
        </div>
      </div>
    </div>
  );
}
