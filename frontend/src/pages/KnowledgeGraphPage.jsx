import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import KnowledgeGraphVisualizer from '../components/KnowledgeGraphVisualizer';
import { Network, AlertTriangle, ShieldCheck, Activity, Sparkles, RefreshCw, Eye, Info, Pill, FlaskConical, HeartPulse, ChevronRight, HelpCircle } from 'lucide-react';

const GET_PATIENT_KNOWLEDGE_GRAPH = `
  query GetPatientKnowledgeGraph($userId: ID!) {
    getPatientKnowledgeGraph(userId: $userId) {
      nodes {
        id
        label
        category
        type
        details {
          raw_name
          status
          notes
          name
          allergen
          severity
          analyte
          value
          unit
          effect
          dietary_item
        }
      }
      edges {
        id
        source
        target
        relationship
        label
        severity
        description
      }
      summary {
        total_nodes
        total_edges
        high_severity_interactions
      }
    }
  }
`;

const SAMPLE_DEMO_GRAPH = {
  nodes: [
    { id: "med_warfarin", label: "Warfarin 5mg", category: "medication", type: "Medication", details: { raw_name: "Warfarin 5mg", status: "Active Regimen" } },
    { id: "med_ibuprofen", label: "Ibuprofen 400mg", category: "medication", type: "Medication", details: { raw_name: "Ibuprofen 400mg", status: "Active Regimen" } },
    { id: "cond_afib", label: "Atrial Fibrillation", category: "condition", type: "Health Condition", details: { name: "Atrial Fibrillation" } },
    { id: "lab_inr", label: "INR: 2.5", category: "lab", type: "Lab Marker", details: { analyte: "INR", value: "2.5", status: "In Target Range" } },
    { id: "se_bleeding", label: "Bleeding Risk", category: "side_effect", type: "Side Effect", details: { effect: "GI Bleeding Risk" } },
    { id: "food_vit_k", label: "Vitamin K (Spinach/Kale)", category: "food", type: "Dietary Caution", details: { dietary_item: "Spinach / Kale" } }
  ],
  edges: [
    { id: "e1", source: "med_warfarin", target: "cond_afib", relationship: "TREATS", label: "Treats", severity: "info", description: "Warfarin is indicated for Stroke Prevention in Atrial Fibrillation." },
    { id: "e2", source: "med_warfarin", target: "med_ibuprofen", relationship: "INTERACTS_WITH", label: "Drug Interaction", severity: "high", description: "High risk of severe gastrointestinal bleeding when combining Warfarin and Ibuprofen." },
    { id: "e3", source: "med_warfarin", target: "lab_inr", relationship: "MONITORED_BY", label: "Monitored By", severity: "info", description: "INR test monitors Warfarin anticoagulant intensity & safe dosing." },
    { id: "e4", source: "med_warfarin", target: "se_bleeding", relationship: "CAUSES", label: "Risk Of", severity: "moderate", description: "Warfarin increases systemic risk of bleeding and bruising." },
    { id: "e5", source: "med_warfarin", target: "food_vit_k", relationship: "FOOD_WARNING", label: "Dietary Caution", severity: "moderate", description: "Fluctuations in dietary Vitamin K intake alter Warfarin blood levels." }
  ],
  summary: { total_nodes: 6, total_edges: 5, high_severity_interactions: 1 }
};

export default function KnowledgeGraphPage() {
  const { user, gqlFetch } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState(null);
  const [useSampleMode, setUseSampleMode] = useState(false);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      if (gqlFetch) {
        const userIdVal = user?.id ? String(user.id) : "1";
        const data = await gqlFetch(GET_PATIENT_KNOWLEDGE_GRAPH, { userId: userIdVal });
        
        if (data && data.getPatientKnowledgeGraph && data.getPatientKnowledgeGraph.nodes && data.getPatientKnowledgeGraph.nodes.length > 0) {
          setGraphData(data.getPatientKnowledgeGraph);
          setUseSampleMode(false);
          setLoading(false);
          return;
        }
      }
      setGraphData(SAMPLE_DEMO_GRAPH);
      setUseSampleMode(true);
    } catch (err) {
      console.error("Failed to load knowledge graph:", err);
      setGraphData(SAMPLE_DEMO_GRAPH);
      setUseSampleMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, [user]);

  const toggleSampleMode = () => {
    if (useSampleMode) {
      setUseSampleMode(false);
      fetchGraphData();
    } else {
      setUseSampleMode(true);
      setGraphData(SAMPLE_DEMO_GRAPH);
    }
  };

  const activeGraph = graphData || SAMPLE_DEMO_GRAPH;
  const summary = activeGraph.summary || { total_nodes: 0, total_edges: 0, high_severity_interactions: 0 };
  const highSeverityEdges = activeGraph.edges?.filter(e => e.severity === 'high') || [];

  const medsCount = activeGraph.nodes?.filter(n => n.category === 'medication').length || 0;
  const condsCount = activeGraph.nodes?.filter(n => n.category === 'condition').length || 0;
  const labsCount = activeGraph.nodes?.filter(n => n.category === 'lab').length || 0;
  const sideEffectsCount = activeGraph.nodes?.filter(n => n.category === 'side_effect').length || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Whitish Clean Header */}
      <div className="relative bg-white border border-gray-100 rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl p-8 md:p-10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/40 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-full mb-4 shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">Patient Knowledge Architecture</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Literal Knowledge Graph
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed">
            Every medication, health condition, lab marker, side effect, and food warning in your profile mapped into an interactive 2D network. Drag nodes or use category filters to inspect safety connections.
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
            onClick={fetchGraphData}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {useSampleMode && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Showing <strong>Sample Medical Regimen</strong> (Warfarin + Ibuprofen + Metformin) for demonstration.
          </span>
          <button
            onClick={() => setUseSampleMode(false)}
            className="text-indigo-600 hover:text-indigo-900 underline font-semibold"
          >
            Switch to My Personal Data
          </button>
        </div>
      )}

      {/* Metrics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Tracked Medications</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{medsCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Health Conditions</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{condsCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Lab Parameters</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{labsCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">High Risk Flags</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary.high_severity_interactions}</h3>
          </div>
        </div>
      </div>

      {/* Main Force Visualizer Container */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-800 font-bold">Computing Patient Knowledge Graph...</p>
          <p className="text-xs text-slate-500 mt-1">Cross-referencing OpenFDA labels, drug interactions & lab monitoring</p>
        </div>
      ) : (
        <KnowledgeGraphVisualizer graphData={activeGraph} />
      )}

      {/* Declutter & Interaction Guide */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Interactive Graph Controls & Pro Tips</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                • <strong>Drag Nodes:</strong> Move any node to custom layout coordinates.<br />
                • <strong>Toggle Category Badges:</strong> Hide specific node types to focus only on active drug interactions.<br />
                • <strong>High Risk Only:</strong> Filter graph to display only critical drug-drug interaction edges.<br />
                • <strong>Export PNG:</strong> Download a high-res image to share with your physician or pharmacist.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* High Severity Warnings Callout Panel */}
      {highSeverityEdges.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-rose-900 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900">Critical Drug Interaction Paths ({highSeverityEdges.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highSeverityEdges.map(edge => (
              <div key={edge.id} className="bg-white border border-rose-200 p-4 rounded-2xl text-xs space-y-1 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-700">{edge.label}</span>
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">HIGH SEVERITY</span>
                </div>
                <p className="text-slate-700 leading-relaxed mt-1">{edge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
