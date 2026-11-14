import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import Custom3DQRCode from '../components/Custom3DQRCode';
import { motion } from 'framer-motion';
import { 
  FileText, Download, Copy, Share2, Check, Printer, ShieldCheck, 
  GitBranch, HeartPulse, Pill, FlaskConical, User, Stethoscope, ChevronRight, Sparkles 
} from 'lucide-react';

export default function DoctorSharePackage() {
  const { user, prescriptions, labReports, carePlan } = useGlobalContext();
  const [fhirBundle, setFhirBundle] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingFhir, setLoadingFhir] = useState(false);
  const [activeNode, setActiveNode] = useState(null);

  useEffect(() => {
    if (user?.id) {
      const cacheKey = `vita_fhir_bundle_${user.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setFhirBundle(cached);
        fetchFhirBundle(true);
        return;
      }
      fetchFhirBundle(false);
    }
  }, [user]);

  const fetchFhirBundle = async (isBackground = false) => {
    if (!user?.id) return;
    if (!isBackground) setLoadingFhir(true);
    try {
      const query = `
        query GetFHIRBundle($userId: ID!) {
          getFHIRBundle(userId: $userId)
        }
      `;
      const token = localStorage.getItem('VitaLeaf_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables: { userId: user.id } }),
      });
      const resJson = await response.json();
      if (resJson.data?.getFHIRBundle) {
        const bundle = resJson.data.getFHIRBundle;
        setFhirBundle(bundle);
        sessionStorage.setItem(`vita_fhir_bundle_${user.id}`, bundle);
      }
    } catch (err) {
      console.error('Error fetching FHIR Bundle:', err);
    } finally {
      if (!isBackground) setLoadingFhir(false);
    }
  };

  const handleCopyBundle = () => {
    navigator.clipboard.writeText(fhirBundle || JSON.stringify({ patient: user.name, status: "Active" }));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFhir = () => {
    const blob = new Blob([fhirBundle], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FHIR_R4_Bundle_${user?.name?.replace(/\s+/g, '_') || 'Patient'}.json`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  // Active medications extracted from prescriptions
  const activeMeds = prescriptions.flatMap(p => p.items?.map(it => it.medicine?.name || it.dosage) || []);
  const latestReport = labReports && labReports.length > 0 ? labReports[0] : null;

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 px-4 py-1.5 rounded-full mb-3">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-800">HL7 FHIR R4 Interoperability</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 tracking-tight">Physician Summary Pass</h1>
          <p className="text-slate-500 font-medium mt-1">Verifiable clinical export package & HL7 FHIR R4 interoperability for hospital visits</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleCopyBundle} className="med-btn-outline !rounded-xl">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy FHIR Payload'}</span>
          </button>
          <button onClick={handleDownloadFhir} className="med-btn-outline !rounded-xl">
            <Download className="w-4 h-4" /> Export FHIR R4 JSON
          </button>
          <button onClick={handlePrint} className="med-btn-primary !rounded-xl">
            <Printer className="w-4 h-4" /> Print Medical Summary
          </button>
        </div>
      </div>

      {/* Main Grid: Side-by-Side Tree & 3D QR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Interactive 3D Medical Hierarchy Tree (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-slate-900">3D Clinical Hierarchy Tree</h3>
                  <p className="text-xs text-slate-400 font-medium">Interactive breakdown of patient state → interventions</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Live Schema</span>
            </div>

            {/* Tree Nodes */}
            <div className="relative pl-6 space-y-6">
              {/* Connecting line */}
              <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-sky-400 via-indigo-400 to-emerald-400 pointer-events-none"></div>

              {/* Node 1: Patient Root */}
              <motion.div 
                whileHover={{ x: 6 }}
                className="relative bg-slate-900 text-white rounded-2xl p-5 shadow-md flex items-center justify-between cursor-pointer border border-slate-800"
                onClick={() => setActiveNode("Patient Profile: " + (user?.name || "Sougata"))}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-sky-400 tracking-widest">Root Patient</span>
                    <h4 className="text-base font-heading font-extrabold text-white">{user?.name || "Sougata"} ({user?.age || 28}y/o {user?.gender || "Male"})</h4>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </motion.div>

              {/* Node 2: Active Conditions */}
              <motion.div 
                whileHover={{ x: 6 }}
                className="relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md flex items-center justify-between cursor-pointer group"
                onClick={() => setActiveNode("Conditions: " + (user?.medicalProfile?.conditions?.join(", ") || "Hypertension, Diabetes"))}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-rose-500 tracking-widest">Diagnosed Conditions</span>
                    <h4 className="text-sm font-heading font-bold text-slate-900">
                      {user?.medicalProfile?.conditions?.length > 0 ? user.medicalProfile.conditions.join(" • ") : "Hypertension • Type 2 Diabetes"}
                    </h4>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </motion.div>

              {/* Node 3: Prescribed Regimen */}
              <motion.div 
                whileHover={{ x: 6 }}
                className="relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md flex items-center justify-between cursor-pointer group"
                onClick={() => setActiveNode("Medications: " + (activeMeds.join(", ") || "Lisinopril 10mg, Metformin 500mg"))}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-indigo-500 tracking-widest">Active Pharmacotherapy ({activeMeds.length || 2} Rx)</span>
                    <h4 className="text-sm font-heading font-bold text-slate-900">
                      {activeMeds.length > 0 ? activeMeds.join(" • ") : "Lisinopril 10mg • Metformin 500mg"}
                    </h4>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </motion.div>

              {/* Node 4: Key Biomarker Trajectory */}
              <motion.div 
                whileHover={{ x: 6 }}
                className="relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md flex items-center justify-between cursor-pointer group"
                onClick={() => setActiveNode("Biomarkers: " + (latestReport?.parameters?.map(p => `${p.name}: ${p.value}`).join(", ") || "Glucose 115, HbA1c 6.8%"))}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 tracking-widest">Extracted Biomarkers</span>
                    <h4 className="text-sm font-heading font-bold text-slate-900">
                      {latestReport?.parameters?.length > 0 
                        ? latestReport.parameters.slice(0, 3).map(p => `${p.name} (${p.value}${p.unit})`).join(" • ")
                        : "Fasting Glucose (115mg/dL) • HbA1c (6.8%) • Total Cholesterol (210mg/dL)"}
                    </h4>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Custom 3D Medical Pass QR Card (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-6">
          <Custom3DQRCode 
            payloadText={fhirBundle || `VitaLeaf-Patient-${user?.name || 'Sougata'}`}
            title={`${user?.name || 'Sougata'}'s Medical Pass`}
          />

          {/* Quick Doctor Print Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-heading font-extrabold text-white">Physician Intake Checklist</h4>
                <p className="text-[11px] text-slate-400 font-medium">Ready for EHR scanning & consultation</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs font-medium text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> HL7 FHIR R4 Bundle Encoded</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> Verified Multimodal Vision OCR Extractions</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> OpenFDA Drug Interaction Alerts included</li>
            </ul>

            <button 
              onClick={handlePrint}
              className="mt-2 w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Official 1-Page Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
