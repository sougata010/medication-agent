import React, { useEffect, useRef, useState } from 'react';
import { Network, AlertTriangle, Info, Filter, Search, X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Download, Pause, Play, Eye } from 'lucide-react';

const CATEGORY_COLORS = {
  medication: { bg: '#4f46e5', border: '#3730a3', text: '#ffffff', pillBg: '#e0e7ff', pillText: '#3730a3', badge: 'Medication' },
  condition: { bg: '#059669', border: '#047857', text: '#ffffff', pillBg: '#d1fae5', pillText: '#065f46', badge: 'Condition' },
  lab: { bg: '#d97706', border: '#b45309', text: '#ffffff', pillBg: '#fef3c7', pillText: '#92400e', badge: 'Lab Marker' },
  side_effect: { bg: '#e11d48', border: '#be123c', text: '#ffffff', pillBg: '#ffe4e6', pillText: '#9f1239', badge: 'Side Effect' },
  food: { bg: '#0891b2', border: '#0e7490', text: '#ffffff', pillBg: '#cffaff', pillText: '#155e75', badge: 'Food Caution' },
  allergy: { bg: '#9333ea', border: '#7e22ce', text: '#ffffff', pillBg: '#f3e8ff', pillText: '#6b21a8', badge: 'Allergy' }
};

const CATEGORY_TARGET_POSITIONS = {
  medication: { rx: 0.5, ry: 0.26 },
  condition: { rx: 0.2, ry: 0.48 },
  lab: { rx: 0.8, ry: 0.48 },
  side_effect: { rx: 0.3, ry: 0.78 },
  food: { rx: 0.7, ry: 0.78 },
  allergy: { rx: 0.5, ry: 0.12 }
};

export default function KnowledgeGraphVisualizer({ graphData, onSelectNode }) {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCategories, setVisibleCategories] = useState({
    medication: true,
    condition: true,
    lab: true,
    side_effect: true,
    food: true,
    allergy: true
  });
  const [highSeverityOnly, setHighSeverityOnly] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPhysicsActive, setIsPhysicsActive] = useState(true);
  
  const [simulationNodes, setSimulationNodes] = useState([]);
  const [simulationEdges, setSimulationEdges] = useState([]);

  // Dragging state
  const draggingNodeRef = useRef(null);
  const isMouseDownRef = useRef(false);

  // Setup force simulation
  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      setSimulationNodes([]);
      setSimulationEdges([]);
      return;
    }

    const width = 1100;
    const height = 680;

    const activeNodes = graphData.nodes.filter(n => visibleCategories[n.category] !== false);
    const activeNodeIds = new Set(activeNodes.map(n => n.id));
    let activeEdges = graphData.edges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));

    if (highSeverityOnly) {
      activeEdges = activeEdges.filter(e => e.severity === 'high');
      const highSeverityNodeIds = new Set();
      activeEdges.forEach(e => {
        highSeverityNodeIds.add(e.source);
        highSeverityNodeIds.add(e.target);
      });
    }

    // Category indexing for spacing
    const categoryCounts = {};
    activeNodes.forEach(n => {
      categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
    });

    const categoryIndices = {};
    const nodes = activeNodes.map((node) => {
      const cat = node.category || 'medication';
      const count = categoryCounts[cat] || 1;
      const idx = categoryIndices[cat] || 0;
      categoryIndices[cat] = idx + 1;

      const targetPos = CATEGORY_TARGET_POSITIONS[cat] || { rx: 0.5, ry: 0.5 };
      const spreadAngle = ((idx - (count - 1) / 2) / (count || 1)) * 1.6;
      const initialRadius = 60 + idx * 35;

      const targetX = width * targetPos.rx + Math.sin(spreadAngle) * initialRadius;
      const targetY = height * targetPos.ry + Math.cos(spreadAngle) * (initialRadius * 0.8);

      return {
        ...node,
        x: targetX + (Math.random() - 0.5) * 40,
        y: targetY + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        targetX,
        targetY,
        radius: node.category === 'medication' ? 26 : 22
      };
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const edges = activeEdges.map((e, idx) => ({
      ...e,
      curveOffset: (idx % 2 === 0 ? 1 : -1) * (25 + (idx % 3) * 18),
      sourceNode: nodeMap.get(e.source),
      targetNode: nodeMap.get(e.target)
    })).filter(e => e.sourceNode && e.targetNode);

    let animationFrameId;
    let iteration = 0;

    const tick = () => {
      if (isPhysicsActive) {
        // Anti-collision node repulsion
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const n1 = nodes[i];
            const n2 = nodes[j];
            
            // Skip repulsion if being dragged
            if (draggingNodeRef.current && (draggingNodeRef.current.id === n1.id || draggingNodeRef.current.id === n2.id)) {
              continue;
            }

            let dx = n2.x - n1.x;
            let dy = n2.y - n1.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDistance = 160; // Generous space to eliminate clashing
            if (dist < minDistance) {
              const force = (minDistance - dist) / dist * 0.7;
              n1.vx -= dx * force * 0.09;
              n1.vy -= dy * force * 0.09;
              n2.vx += dx * force * 0.09;
              n2.vy += dy * force * 0.09;
            }
          }
        }

        // Spring attraction along edges
        for (const e of edges) {
          let dx = e.targetNode.x - e.sourceNode.x;
          let dy = e.targetNode.y - e.sourceNode.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 200;
          const force = (dist - targetDist) * 0.012;
          if (draggingNodeRef.current?.id !== e.sourceNode.id) {
            e.sourceNode.vx += (dx / dist) * force;
            e.sourceNode.vy += (dy / dist) * force;
          }
          if (draggingNodeRef.current?.id !== e.targetNode.id) {
            e.targetNode.vx -= (dx / dist) * force;
            e.targetNode.vy -= (dy / dist) * force;
          }
        }

        // Target center gravity
        for (const n of nodes) {
          if (draggingNodeRef.current?.id === n.id) continue;

          n.vx += (n.targetX - n.x) * 0.01;
          n.vy += (n.targetY - n.y) * 0.01;

          n.vx *= 0.8;
          n.vy *= 0.8;

          n.x += n.vx;
          n.y += n.vy;

          n.x = Math.max(60, Math.min(width - 60, n.x));
          n.y = Math.max(60, Math.min(height - 60, n.y));
        }
      }

      setSimulationNodes([...nodes]);
      setSimulationEdges([...edges]);

      iteration++;
      if (iteration < 200 || isPhysicsActive) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    tick();
    return () => cancelAnimationFrame(animationFrameId);
  }, [graphData, visibleCategories, highSeverityOnly, isPhysicsActive]);

  // Render Canvas with High DPI & Clear Label Boxes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Center-based zoom scaling
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoomScale, zoomScale);
    ctx.translate(-width / 2, -height / 2);

    // Draw Curved Edges
    simulationEdges.forEach(edge => {
      const isSelected = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
      const isHovered = hoveredNode && (edge.source === hoveredNode.id || edge.target === hoveredNode.id);
      const isHigh = edge.severity === 'high';

      const midX = (edge.sourceNode.x + edge.targetNode.x) / 2;
      const midY = (edge.sourceNode.y + edge.targetNode.y) / 2;
      const dx = edge.targetNode.x - edge.sourceNode.x;
      const dy = edge.targetNode.y - edge.sourceNode.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const normalX = -dy / len;
      const normalY = dx / len;

      const ctrlX = midX + normalX * edge.curveOffset;
      const ctrlY = midY + normalY * edge.curveOffset;

      ctx.beginPath();
      ctx.moveTo(edge.sourceNode.x, edge.sourceNode.y);
      ctx.quadraticCurveTo(ctrlX, ctrlY, edge.targetNode.x, edge.targetNode.y);

      ctx.lineWidth = isSelected || isHovered ? 4 : isHigh ? 3 : 1.8;
      ctx.strokeStyle = isHigh ? '#ef4444' : (isSelected || isHovered) ? '#3b82f6' : '#cbd5e1';

      if (isHigh) {
        ctx.setLineDash([7, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Edge Label Pill (Visible on hover/selection or high risk)
      if (isSelected || isHovered || isHigh) {
        const labelX = 0.25 * edge.sourceNode.x + 0.5 * ctrlX + 0.25 * edge.targetNode.x;
        const labelY = 0.25 * edge.sourceNode.y + 0.5 * ctrlY + 0.25 * edge.targetNode.y;

        ctx.font = '600 11px Inter, sans-serif';
        const labelText = edge.label;
        const textMetrics = ctx.measureText(labelText);
        const padX = 8;
        const padY = 4;

        ctx.fillStyle = isHigh ? '#fef2f2' : '#ffffff';
        ctx.strokeStyle = isHigh ? '#fca5a5' : '#94a3b8';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.roundRect(
          labelX - textMetrics.width / 2 - padX,
          labelY - 8 - padY,
          textMetrics.width + padX * 2,
          16 + padY * 2,
          8
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isHigh ? '#dc2626' : '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, labelX, labelY + 4);
      }
    });

    // Draw Nodes
    simulationNodes.forEach(node => {
      const isSelected = selectedNode && selectedNode.id === node.id;
      const isHovered = hoveredNode && hoveredNode.id === node.id;
      const isSearchMatch = searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase());
      const catStyle = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.medication;

      // Glow halo
      if (isSelected || isHovered || isSearchMatch) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 10, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(59, 130, 246, 0.2)';
        ctx.fill();
      }

      // Node Body
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fillStyle = catStyle.bg;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.lineWidth = isSelected ? 3.5 : 2.2;
      ctx.strokeStyle = isSelected ? '#0f172a' : catStyle.border;
      ctx.stroke();

      // Node Icon / Inner Initial
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(node.label.substring(0, 2).toUpperCase(), node.x, node.y + 4);

      // Clean Floating Pill Label beneath Node
      const displayLabel = node.label.length > 22 ? node.label.substring(0, 20) + '…' : node.label;
      ctx.font = `${node.category === 'medication' ? 'bold 11px' : '600 11px'} Inter, sans-serif`;
      const textMetrics = ctx.measureText(displayLabel);

      const pillWidth = textMetrics.width + 14;
      const pillHeight = 20;
      const pillX = node.x - pillWidth / 2;
      const pillY = node.y + node.radius + 8;

      // Pill Box
      ctx.fillStyle = isSelected ? '#1e1b4b' : catStyle.pillBg;
      ctx.strokeStyle = isSelected ? '#4338ca' : catStyle.border;
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 8);
      ctx.fill();
      ctx.stroke();

      // Pill Text
      ctx.fillStyle = isSelected ? '#ffffff' : catStyle.pillText;
      ctx.textAlign = 'center';
      ctx.fillText(displayLabel, node.x, pillY + 14);
    });

    ctx.restore();
  }, [simulationNodes, simulationEdges, selectedNode, hoveredNode, searchTerm, zoomScale]);

  // Dragging & Click Event Handlers
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const width = canvas.width;
    const height = canvas.height;

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    x = (x - width / 2) / zoomScale + width / 2;
    y = (y - height / 2) / zoomScale + height / 2;

    return { x, y };
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoords(e);
    const clicked = simulationNodes.find(n => {
      const dx = n.x - coords.x;
      const dy = n.y - coords.y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 8;
    });

    if (clicked) {
      draggingNodeRef.current = clicked;
      isMouseDownRef.current = true;
      setSelectedNode(clicked);
      if (onSelectNode) onSelectNode(clicked);
    } else {
      setSelectedNode(null);
      if (onSelectNode) onSelectNode(null);
    }
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoords(e);

    if (isMouseDownRef.current && draggingNodeRef.current) {
      draggingNodeRef.current.x = coords.x;
      draggingNodeRef.current.y = coords.y;
      draggingNodeRef.current.targetX = coords.x;
      draggingNodeRef.current.targetY = coords.y;
      setSimulationNodes([...simulationNodes]);
      return;
    }

    const hovered = simulationNodes.find(n => {
      const dx = n.x - coords.x;
      const dy = n.y - coords.y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 8;
    });

    if (canvasRef.current) {
      canvasRef.current.style.cursor = hovered ? 'grab' : 'default';
    }
    setHoveredNode(hovered || null);
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    draggingNodeRef.current = null;
  };

  const exportGraphImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `MedGraph_Patient_Knowledge_Network_${new Date().toISOString().slice(0,10)}.png`;
    link.href = dataUrl;
    link.click();
  };

  const toggleCategory = (cat) => {
    setVisibleCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const selectedNodeEdges = selectedNode
    ? simulationEdges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none flex flex-col' : ''}`}>
      {/* Top Controls Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Patient Knowledge Graph
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                Interactive Drag & Orbits
              </span>
            </h3>
            <p className="text-xs text-slate-500">Drag nodes to customize layout • Tap to inspect clinical relationships</p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-44 pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>

          {/* High Severity Toggle */}
          <button
            onClick={() => setHighSeverityOnly(!highSeverityOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              highSeverityOnly
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/20'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            High Risk Only
          </button>

          {/* Physics Pause Toggle */}
          <button
            onClick={() => setIsPhysicsActive(!isPhysicsActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              !isPhysicsActive
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isPhysicsActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPhysicsActive ? "Lock Physics" : "Resume"}
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
            <button
              onClick={() => setZoomScale(z => Math.min(z + 0.15, 1.8))}
              title="Zoom In"
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomScale(z => Math.max(z - 0.15, 0.6))}
              title="Zoom Out"
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomScale(1)}
              title="Reset View"
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Export PNG */}
          <button
            onClick={exportGraphImage}
            title="Download Graph Image"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export PNG
          </button>

          {/* Fullscreen Expand */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle Fullscreen"
            className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Interactive Category Legend Filter Bar */}
      <div className="px-6 py-2.5 bg-slate-100/80 border-b border-slate-200/80 flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="text-slate-500 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Toggle Entity Layers:
        </span>
        {Object.entries(CATEGORY_COLORS).map(([catKey, catMeta]) => {
          const isActive = visibleCategories[catKey] !== false;
          return (
            <button
              key={catKey}
              onClick={() => toggleCategory(catKey)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all border ${
                isActive
                  ? 'bg-white text-slate-900 border-slate-300 shadow-xs'
                  : 'bg-slate-200/60 text-slate-400 border-transparent line-through'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catMeta.bg }} />
              <span>{catMeta.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Canvas Viewport */}
      <div className={`relative bg-[#f8fafc] flex items-center justify-center p-4 ${isFullscreen ? 'flex-1 min-h-0' : 'min-h-[580px]'}`}>
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]" />

        <canvas
          ref={canvasRef}
          width={1100}
          height={680}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative z-10 max-w-full h-auto rounded-2xl"
        />
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[selectedNode.category]?.bg }} />
              <div>
                <h4 className="text-base font-bold text-slate-900 capitalize">{selectedNode.label}</h4>
                <p className="text-xs text-slate-500 capitalize">{selectedNode.type} Node • Category: {selectedNode.category}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-600" /> Clinical Metadata
              </h5>
              <div className="space-y-1.5 text-xs text-slate-600">
                {Object.entries(selectedNode.details || {}).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="capitalize text-slate-500">{key.replace('_', ' ')}:</span>
                    <span className="font-semibold text-slate-800">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Network className="w-4 h-4 text-emerald-600" /> Graph Connections ({selectedNodeEdges.length})
              </h5>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedNodeEdges.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No direct connections for this node.</p>
                ) : (
                  selectedNodeEdges.map(edge => (
                    <div
                      key={edge.id}
                      className={`p-2.5 rounded-xl border text-xs ${
                        edge.severity === 'high'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          {edge.severity === 'high' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                          {edge.label} ({edge.relationship})
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          edge.severity === 'high' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {edge.severity}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600">{edge.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
