import React from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import {
  User, Heart, AlertTriangle, Phone, Save, Plus, X, ShieldCheck
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
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Profile & Settings</h1>
        <p className="text-gray-500 font-medium mt-1">Manage your medical history and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* User Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg font-bold">
                {user?.name?.substring(0, 2).toUpperCase() || 'VL'}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">{user?.name || 'Patient'}</h2>
                <p className="text-sm text-gray-400 font-medium">
                  {user?.age ? `${user.age} years` : ''} {user?.gender ? `· ${user.gender}` : ''} {user?.language ? `· ${user.language.toUpperCase()}` : ''}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Reminder Channel</span>
                <span className="text-sm font-semibold text-gray-900">{user?.reminderChannel || 'Email'}</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Language</span>
                <span className="text-sm font-semibold text-gray-900">{user?.language?.toUpperCase() || 'EN'}</span>
              </div>
            </div>
          </div>

          {/* Chronic Conditions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-red-500" />
              Chronic Conditions
            </h3>
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddCondition(conditionInput, profileConditions); }}
              className="flex gap-2 mb-4"
            >
              <input
                type="text"
                placeholder="E.g. Type 2 Diabetes"
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
              />
              <button type="submit" className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {profileConditions.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-3">No chronic conditions listed</p>
              ) : (
                profileConditions.map((cond, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700">
                    {cond}
                    <button onClick={() => handleRemoveCondition(cond, profileConditions)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Known Allergies
            </h3>
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddAllergy(allergyInput, profileAllergies); }}
              className="flex gap-2 mb-4"
            >
              <input
                type="text"
                placeholder="E.g. Penicillin"
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
              />
              <button type="submit" className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {profileAllergies.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-3">No known allergies</p>
              ) : (
                profileAllergies.map((allergy, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-sm font-medium text-red-700">
                    <AlertTriangle className="w-3 h-3" />
                    {allergy}
                    <button onClick={() => handleRemoveAllergy(allergy, profileAllergies)} className="text-red-400 hover:text-red-600 transition-colors">
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-blue-500" />
              Emergency Contact
            </h3>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Not configured</p>
              <p className="text-xs text-gray-400 mt-1">Set up emergency contacts for automatic notification</p>
            </div>
          </div>

          {/* Data Security */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Data Security
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-medium text-emerald-700">End-to-End Encryption</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-medium text-emerald-700">HIPAA Compliant</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Verified</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={(e) => handleSaveProfile(e, profileAllergies, profileConditions)}
            className="w-full bg-black text-white font-bold py-3.5 rounded-full shadow-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Profile Changes
          </button>
        </div>
      </div>
    </div>
  );
}
