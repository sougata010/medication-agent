import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, Eye,
  Sparkles, ShieldCheck, X, Clock, FlaskConical
} from 'lucide-react';

export default function DocumentUpload() {
  const navigate = useNavigate();
  const {
    ocrData, setOcrData, ocrLoading, handleFileSelect, handleConfirmWizard,
    handleWizardChange, handleWizardTimingChange, user, ocrPreviewImage,
    handleUploadLabReport, handleUploadSmartDocument, labUploadLoading
  } = useGlobalContext();

  const [docType, setDocType] = useState('smart'); // 'prescription', 'labReport', or 'smart'

  const onConfirm = async () => {
    await handleConfirmWizard();
    navigate('/dashboard');
  };

  const handleFileChange = (e) => {
    if (docType === 'prescription') {
      handleFileSelect(e);
    } else if (docType === 'labReport') {
      handleUploadLabReport(e);
    } else {
      handleUploadSmartDocument(e, (uiState) => {
        // Callback if we need to reset UI or navigate if no wizard
      });
    }
  };

  // Loading State
  if (ocrLoading || labUploadLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <h3 className="text-lg font-extrabold text-gray-900">
            {ocrLoading ? 'Analyzing Prescription' : 'Analyzing Lab Report'}
          </h3>
          <p className="text-sm text-gray-400 font-medium max-w-xs">
            {ocrLoading 
              ? 'MedGraph AI is extracting medications and dosage data from your prescription image.'
              : 'MedGraph AI is extracting structured biomarker data, cautions, and chemical details.'}
          </p>
        </div>
      </div>
    );
  }

  // Upload State
  if (!ocrData) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Upload Document</h1>
          <p className="text-gray-500 font-medium mt-1">Select document type and upload for AI extraction</p>
        </div>

        {/* Document Type Selector */}
        <div className="flex p-1 bg-gray-100 rounded-xl w-full max-w-lg mx-auto mb-2">
          <button
            onClick={() => setDocType('smart')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              docType === 'smart' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Smart Auto-Detect
          </button>
          <button
            onClick={() => setDocType('prescription')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              docType === 'prescription' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" /> Prescription
          </button>
          <button
            onClick={() => setDocType('labReport')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              docType === 'labReport' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FlaskConical className="w-4 h-4" /> Lab Report
          </button>
        </div>

        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 transition-colors p-16 flex flex-col items-center justify-center text-center relative group cursor-pointer">
          <input
            type="file"
            accept="image/*,.pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
          />
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors border border-gray-200">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900 mb-2">Click to upload or drag and drop</h3>
          <p className="text-sm text-gray-400 font-medium">PNG, JPG, PDF up to 10MB</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <Sparkles className="w-5 h-5 text-blue-500 mb-3" />
            <h4 className="text-sm font-bold text-gray-900 mb-1">AI-Powered Extraction</h4>
            <p className="text-xs text-gray-400">Neural extraction identifies medications, biomarkers, and schedules automatically.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <ShieldCheck className="w-5 h-5 text-emerald-500 mb-3" />
            <h4 className="text-sm font-bold text-gray-900 mb-1">Clinical Safety</h4>
            <p className="text-xs text-gray-400">Review AI extractions against medical safety guidelines and your profile.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <Clock className="w-5 h-5 text-purple-500 mb-3" />
            <h4 className="text-sm font-bold text-gray-900 mb-1">Actionable Insights</h4>
            <p className="text-xs text-gray-400">Generate auto-reminders for prescriptions and detailed analysis for lab reports.</p>
          </div>
        </div>
      </div>
    );
  }

  // Verification Wizard (Only for Prescriptions right now)
  const avgConfidence = Math.round(ocrData.medications.reduce((acc, med) => acc + (med.confidenceLevel || 80), 0) / (ocrData.medications.length || 1));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase border border-blue-100">Human-in-the-loop</span>
            <span className="text-[11px] text-gray-400 font-medium">Patient: {user?.name || 'Active'}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Prescription Verification</h1>
          <p className="text-gray-500 font-medium mt-1">Review and correct the AI-extracted data</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-600">AI Confidence:</span>
          <span className={`text-sm font-extrabold ${avgConfidence >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>{avgConfidence}%</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source Image */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-6">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">Source Document</h2>
            </div>
            <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[400px]">
              {ocrPreviewImage ? (
                <img src={ocrPreviewImage} alt="Prescription" className="max-w-full h-auto max-h-[500px] object-contain rounded-lg border border-gray-200 shadow-sm" />
              ) : (
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Preview not available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Extracted Data */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Extracted Data
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Review and correct fields below</p>
            </div>

            <div className="p-6 flex flex-col gap-8">
              {ocrData.medications.map((med, idx) => {
                const isLow = med.confidenceLevel < 85;
                return (
                  <div key={idx} className={`flex flex-col gap-4 pb-6 ${idx < ocrData.medications.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">Medication {idx + 1}</h4>
                      {isLow && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                          <AlertTriangle className="w-3 h-3" /> Low Confidence
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Drug Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-300"
                          value={med.drugName}
                          onChange={(e) => handleWizardChange(idx, 'drugName', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Dosage</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-300"
                            value={med.dosage}
                            onChange={(e) => handleWizardChange(idx, 'dosage', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Duration</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-gray-300"
                            value={med.duration}
                            onChange={(e) => handleWizardChange(idx, 'duration', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl ${isLow ? 'bg-amber-50 border border-amber-200' : ''}`}>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Frequency</label>
                        <input
                          type="text"
                          className={`w-full px-4 py-2.5 rounded-xl text-sm text-gray-900 focus:outline-none ${isLow ? 'bg-white border-2 border-amber-300 focus:border-amber-400' : 'bg-gray-50 border border-gray-200 focus:border-gray-300'}`}
                          value={med.frequency}
                          onChange={(e) => handleWizardChange(idx, 'frequency', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Timing</label>
                        <div className="flex flex-wrap gap-2">
                          {['morning', 'noon', 'evening', 'night'].map(t => {
                            const isSelected = med.timing?.includes(t);
                            return (
                              <button
                                key={t}
                                onClick={() => handleWizardTimingChange(idx, t)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                                  isSelected
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  <strong>Disclaimer:</strong> Please verify all data against your original prescription. AI-assisted extraction does not replace professional medical judgment.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOcrData(null)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={onConfirm}
                  className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Extraction
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
