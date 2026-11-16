import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import {
  Sparkles, ShieldCheck, X, Clock, FlaskConical, Trash2, FileText, Upload,
  HeartPulse, Stethoscope, CheckCircle2, AlertTriangle, Eye
} from 'lucide-react';
import Modal from '../components/Modal';

export default function DocumentUpload() {
  const navigate = useNavigate();
  const {
    ocrData, setOcrData, ocrLoading, handleFileSelect, handleConfirmWizard,
    handleWizardChange, handleWizardTimingChange, user, ocrPreviewImage,
    handleUploadLabReport, handleUploadSmartDocument, labUploadLoading
  } = useGlobalContext();

  const [docType, setDocType] = useState('smart');
  const [showDiscardModal, setShowDiscardModal] = useState(false);

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
      handleUploadSmartDocument(e, (uiState) => {});
    }
  };

  // Loading State
  if (ocrLoading || labUploadLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-50 border-4 border-gray-100 flex items-center justify-center">
            <HeartPulse className="w-10 h-10 text-gray-500 med-heartbeat" />
          </div>
          <h3 className="text-lg font-heading font-extrabold text-gray-900">
            {ocrLoading ? 'Analyzing Prescription' : 'Analyzing Lab Report'}
          </h3>
          <p className="text-sm text-gray-900/70 font-medium max-w-xs">
            {ocrLoading 
              ? 'VitaLeaf is extracting medications and dosage data from your prescription image.'
              : 'VitaLeaf is extracting structured biomarker data, cautions, and chemical details.'}
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
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold tracking-tight text-gray-900">Document Ingestion</h1>
          <p className="text-gray-900/70 font-medium mt-1">Select document type and upload for automated clinical extraction</p>
        </div>

        {/* Document Type Selector */}
        <div className="flex p-1 bg-slate-100/80 border border-slate-200/80 rounded-2xl w-full max-w-lg mx-auto mb-2">
          <button
            onClick={() => setDocType('smart')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              docType === 'smart' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600" /> Smart Auto-Detect
          </button>
          <button
            onClick={() => setDocType('prescription')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              docType === 'prescription' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" /> Prescription
          </button>
          <button
            onClick={() => setDocType('labReport')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              docType === 'labReport' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-purple-600" /> Lab Report
          </button>
        </div>

        {/* Upload Zone — Clinical Scanner Aesthetics */}
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 transition-all p-12 sm:p-16 flex flex-col items-center justify-center text-center relative group cursor-pointer shadow-sm hover:shadow-md overflow-hidden">
          <input
            type="file"
            accept="image/*,.pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
          />
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors border border-slate-200 relative z-10">
            <Upload className="w-8 h-8 text-slate-500 group-hover:text-blue-600 transition-colors" />
          </div>
          <h3 className="text-lg font-heading font-extrabold text-slate-900 mb-2 relative z-10">Click to upload or drag and drop</h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium relative z-10 mb-4">PNG, JPG, PDF up to 10MB · Automated OCR & Clinical Verification</p>
          
          <div className="relative z-20 flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOcrData({
                  ocrRaw: "Dr. Arvind R. Sen, MD\nRx:\n1. Lisinopril 10mg - Once daily in morning\n2. Metformin 500mg - Twice daily with meals\n3. Atorvastatin 20mg - At bedtime",
                  medications: [
                    { drugName: "Lisinopril", dosage: "10mg", frequency: "Once Daily", duration: "30 Days", confidenceLevel: 98, clinicalReasoning: "Indicated for essential arterial hypertension." },
                    { drugName: "Metformin", dosage: "500mg", frequency: "Twice Daily", duration: "60 Days", confidenceLevel: 96, clinicalReasoning: "Indicated for glycemic stabilization in type-2 diabetes." },
                    { drugName: "Atorvastatin", dosage: "20mg", frequency: "At Bedtime", duration: "30 Days", confidenceLevel: 94, clinicalReasoning: "HMG-CoA reductase inhibitor for lipid profiling." }
                  ]
                });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Load Demo Prescription (Instant Test)</span>
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Clinical Data Extraction</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Optical parsing identifies medications, biomarkers, and schedules with high precision.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Clinical Safety</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Review extracted parameters against medical safety guidelines and your health profile.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-all">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 border border-indigo-100">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Actionable Records</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Generate structured adherence schedules and longitudinal biomarker tracking.</p>
          </div>
        </div>
      </div>
    );
  }

  // Verification Wizard
  const avgConfidence = Math.round(ocrData.medications.reduce((acc, med) => acc + (med.confidenceLevel || 80), 0) / (ocrData.medications.length || 1));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="clinical-badge clinical-badge-info">Human-in-the-loop</span>
            <span className="text-[11px] text-gray-500 font-medium font-mono">Patient: {user?.name || 'Active'}</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold tracking-tight text-gray-900">Prescription Verification</h1>
          <p className="text-gray-900/70 font-medium mt-1">Review and verify extracted clinical data</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Extraction Confidence:</span>
          <span className={`text-sm font-heading font-extrabold ${avgConfidence >= 85 ? 'text-sky-600' : 'text-indigo-600'}`}>{avgConfidence}%</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source Image */}
        <div className="lg:col-span-5">
          <div className="rx-card overflow-hidden sticky top-6">
            <div className="px-5 py-3 border-b border-gray-100/60 flex items-center gap-2 bg-gray-50/50">
              <Eye className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-heading font-bold text-gray-900">Source Document</h2>
            </div>
            <div className="p-4 bg-gray-50/50 flex items-center justify-center min-h-[400px]">
              {ocrPreviewImage ? (
                <img src={ocrPreviewImage} alt="Prescription" className="max-w-full h-auto max-h-[500px] object-contain rounded-lg border border-gray-200 shadow-sm" />
              ) : (
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Preview not available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Extracted Data */}
        <div className="lg:col-span-7">
          <div className="rx-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100/60 bg-gray-50/50">
              <h2 className="text-base font-heading font-extrabold text-gray-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-gray-500" />
                Extracted Prescription Data
              </h2>
              <p className="text-xs text-gray-500/70 mt-0.5">Review and correct fields below</p>
            </div>

            <div className="p-6 flex flex-col gap-8">
              {ocrData.medications.map((med, idx) => {
                const isLow = med.confidenceLevel < 85;
                return (
                  <div key={idx} className={`flex flex-col gap-4 pb-6 ${idx < ocrData.medications.length - 1 ? 'border-b border-dashed border-gray-200/60' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-heading font-bold text-gray-900">Medication {idx + 1}</h4>
                      {isLow && (
                        <span className="clinical-badge clinical-badge-warning">
                          <AlertTriangle className="w-3 h-3" /> Low Confidence
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block mb-1">Drug Name</label>
                        <input
                          type="text"
                          className="clinical-input"
                          value={med.drugName}
                          onChange={(e) => handleWizardChange(idx, 'drugName', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block mb-1">Dosage</label>
                          <input
                            type="text"
                            className="clinical-input"
                            value={med.dosage}
                            onChange={(e) => handleWizardChange(idx, 'dosage', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block mb-1">Duration</label>
                          <input
                            type="text"
                            className="clinical-input"
                            value={med.duration}
                            onChange={(e) => handleWizardChange(idx, 'duration', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl ${isLow ? 'bg-indigo-50 border border-indigo-200' : ''}`}>
                        <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block mb-1">Frequency</label>
                        <input
                          type="text"
                          className={`clinical-input ${isLow ? '!border-2 !border-indigo-300 !focus:border-indigo-400' : ''}`}
                          value={med.frequency}
                          onChange={(e) => handleWizardChange(idx, 'frequency', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block mb-2">Timing</label>
                        <div className="flex flex-wrap gap-2">
                          {['morning', 'noon', 'evening', 'night'].map(t => {
                            const isSelected = med.timing?.includes(t);
                            return (
                              <button
                                key={t}
                                onClick={() => handleWizardTimingChange(idx, t)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                                  isSelected
                                    ? 'bg-black text-white border-blue-700'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400'
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
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <ShieldCheck className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-900">
                  <strong>Disclaimer:</strong> Please verify all data against your original prescription. AI-assisted extraction does not replace professional medical judgment.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDiscardModal(true)}
                  className="med-btn-outline !rounded-full"
                >
                  Discard
                </button>
                <button
                  onClick={onConfirm}
                  className="med-btn-primary !rounded-full"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Extraction
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Discard Modal */}
      <Modal 
        isOpen={showDiscardModal} 
        onClose={() => setShowDiscardModal(false)} 
        title="Discard Extraction"
        icon={Trash2}
      >
        <p className="text-sm text-gray-500 mb-6">Are you sure you want to discard this extracted data? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDiscardModal(false)}
            className="med-btn-outline !rounded-full"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setShowDiscardModal(false);
              setOcrData(null);
            }}
            className="px-5 py-2.5 rounded-full bg-slate-600 text-white text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            Discard
          </button>
        </div>
      </Modal>
    </div>
  );
}
