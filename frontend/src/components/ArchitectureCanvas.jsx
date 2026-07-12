import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ScanLine, Brain, Database, LineChart, Bell, Clock, FileText, Server
} from 'lucide-react';

const NODES = [
  { 
    id: 'ocr', 
    title: 'Vision OCR Engine', 
    icon: ScanLine, 
    angle: -90, 
    latency: '12ms', 
    status: 'Processing',
    accuracy: '99.4%',
    requests: '1,284/sec',
    downstream: ['parser', 'kg'],
    description: 'Extracts structured text from complex medical documents.',
    color: 'blue'
  },
  { 
    id: 'kg', 
    title: 'Knowledge Graph', 
    icon: Database, 
    angle: -30, 
    latency: '18ms', 
    status: 'Indexing',
    accuracy: '99.9%',
    requests: '8,420/sec',
    downstream: ['prediction', 'timeline'],
    description: 'Maps semantic relationships between drugs and diagnoses.',
    color: 'emerald'
  },
  { 
    id: 'prediction', 
    title: 'Prediction Engine', 
    icon: LineChart, 
    angle: 30, 
    latency: '45ms', 
    status: 'Active',
    accuracy: '96.2%',
    requests: '3,102/sec',
    downstream: ['notify', 'timeline'],
    description: 'Calculates adherence probabilities and risk vectors.',
    color: 'emerald'
  },
  { 
    id: 'timeline', 
    title: 'Patient Timeline', 
    icon: Clock, 
    angle: 90, 
    latency: '8ms', 
    status: 'Standby',
    accuracy: '100%',
    requests: '4,051/sec',
    downstream: ['kg'],
    description: 'Immutable ledger of all patient interactions.',
    color: 'amber'
  },
  { 
    id: 'notify', 
    title: 'Notification System', 
    icon: Bell, 
    angle: 150, 
    latency: '22ms', 
    status: 'Idle',
    accuracy: '99.9%',
    requests: '942/sec',
    downstream: ['timeline'],
    description: 'Dispatches real-time critical alerts to providers.',
    color: 'gray'
  },
  { 
    id: 'parser', 
    title: 'Medical Parser', 
    icon: FileText, 
    angle: 210, 
    latency: '15ms', 
    status: 'Active',
    accuracy: '98.7%',
    requests: '2,105/sec',
    downstream: ['kg', 'prediction'],
    description: 'Normalizes clinical text into standard ontologies.',
    color: 'emerald'
  },
];

export default function ArchitectureCanvas() {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [clickedNode, setClickedNode] = useState(null);
  const [isOverdrive, setIsOverdrive] = useState(false);
  const [radius, setRadius] = useState(280);

  // Responsive radius
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setRadius(160);
      else if (window.innerWidth < 1024) setRadius(240);
      else setRadius(340);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCoordinates = (angle, rad) => {
    const theta = (angle * Math.PI) / 180;
    return { x: rad * Math.cos(theta), y: rad * Math.sin(theta) };
  };

  const effectiveNode = clickedNode || hoveredNode;
  const activeNodeData = NODES.find(n => n.id === effectiveNode);
  const downstreamNodes = activeNodeData ? activeNodeData.downstream : [];

  return (
    <div className="relative w-full h-[800px] md:h-[1000px] bg-[#FAFAFA] overflow-hidden flex items-center justify-center font-sans border-y border-gray-100">
      
      {/* Light Blueprint Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      ></div>

      {/* SVG Connecting Lines */}
      <svg 
        className="absolute top-1/2 left-1/2 pointer-events-none z-0" 
        width="2000" 
        height="2000" 
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <defs>
          <linearGradient id="lineDefault" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e5e7eb" stopOpacity="1" />
            <stop offset="100%" stopColor="#f3f4f6" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="lineActive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="lineDownstream" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="lineOverdrive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#d946ef" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        
        <g transform="translate(1000, 1000)">
        {NODES.map((node) => {
          const { x, y } = getCoordinates(node.angle, radius);
          const isActive = !isOverdrive && effectiveNode === node.id;
          const isDownstream = !isOverdrive && downstreamNodes.includes(node.id);
          
          let stroke = "url(#lineDefault)";
          let strokeWidth = "1.5";
          let strokeOpacity = 1;
          
          if (isOverdrive) {
            stroke = "url(#lineOverdrive)";
            strokeWidth = "3";
            strokeOpacity = 0.8;
          } else if (effectiveNode) {
            if (isActive) {
              stroke = "url(#lineActive)";
              strokeWidth = "3";
              strokeOpacity = 1;
            } else if (isDownstream) {
              stroke = "url(#lineDownstream)";
              strokeWidth = "2";
              strokeOpacity = 0.8;
            } else {
              strokeOpacity = 0.2;
            }
          }

          return (
            <g key={`line-${node.id}`} className="transition-opacity duration-500" style={{ opacity: strokeOpacity }}>
              <line 
                x1="0" y1="0" x2={x} y2={y} 
                stroke={stroke} 
                strokeWidth={strokeWidth} 
                className="transition-all duration-500"
              />
              
              {/* Data Packets */}
              {isOverdrive && (
                <circle r="5" fill="#d946ef" className="filter drop-shadow-[0_0_12px_rgba(217,70,239,1)]">
                  <animateMotion 
                    dur={`${0.4 + Math.random() * 0.3}s`} 
                    repeatCount="indefinite" 
                    path={`M 0 0 L ${x} ${y}`}
                  />
                </circle>
              )}
              {isActive && !isOverdrive && (
                <>
                  {/* Inbound packet */}
                  <circle r="4" fill="#3b82f6" className="filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">
                    <animateMotion 
                      dur="1.2s" 
                      repeatCount="indefinite" 
                      path={`M ${x} ${y} L 0 0`}
                      calcMode="spline"
                      keyTimes="0;1"
                      keySplines="0.4 0 0.2 1"
                    />
                  </circle>
                  {/* Outbound return packet for extra activity */}
                  <circle r="3" fill="#60a5fa" className="filter drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]">
                    <animateMotion 
                      dur="1.8s" 
                      repeatCount="indefinite" 
                      path={`M 0 0 L ${x} ${y}`}
                      calcMode="spline"
                      keyTimes="0;1"
                      keySplines="0.4 0 0.2 1"
                    />
                  </circle>
                </>
              )}
              {isDownstream && !isOverdrive && (
                <circle r="4" fill="#10b981" className="filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                  <animateMotion 
                    dur="1.5s" 
                    repeatCount="indefinite" 
                    path={`M 0 0 L ${x} ${y}`}
                    calcMode="spline"
                    keyTimes="0;1"
                    keySplines="0.4 0 0.2 1"
                  />
                </circle>
              )}
            </g>
          );
        })}
        </g>
      </svg>

      {/* Intelligence Core (Center) */}
      <div 
        className={`absolute z-10 flex flex-col items-center justify-center transition-all duration-500 cursor-pointer ${effectiveNode || isOverdrive ? 'opacity-100' : 'opacity-90'} hover:scale-105`}
        onClick={() => {
          setIsOverdrive(!isOverdrive);
          setClickedNode(null);
        }}
      >
        <div className={`relative w-28 h-28 rounded-full bg-white border shadow-2xl flex items-center justify-center z-10 transition-all duration-500 ${isOverdrive ? 'border-purple-500 shadow-purple-500/40 animate-spin' : effectiveNode ? 'border-blue-400 shadow-blue-500/20' : 'border-gray-200 shadow-gray-200/50'}`} style={{ animationDuration: isOverdrive ? '2s' : '' }}>
          {isOverdrive && (
            <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" style={{ animationDuration: '0.8s' }}></div>
          )}
          {effectiveNode && !isOverdrive && (
            <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" style={{ animationDuration: '2s' }}></div>
          )}
          <Brain className={`w-12 h-12 transition-colors duration-500 ${isOverdrive ? 'text-purple-600' : effectiveNode ? 'text-blue-600' : 'text-gray-800'}`} />
        </div>
        <div className="mt-5 text-center bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
          <div className={`font-extrabold tracking-widest text-[11px] transition-colors ${isOverdrive ? 'text-purple-600' : 'text-gray-900'}`}>{isOverdrive ? 'OVERDRIVE ACTIVE' : 'VitaLeaf CORE'}</div>
        </div>
      </div>

      {/* Radial Nodes */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
        {NODES.map((node, index) => {
          const { x, y } = getCoordinates(node.angle, radius);
          const isActive = !isOverdrive && effectiveNode === node.id;
          const isDownstream = !isOverdrive && downstreamNodes.includes(node.id);
          const isUnrelated = !isOverdrive && effectiveNode && !isActive && !isDownstream;

          const tooltipPosition = x > 0 ? "right-full mr-6" : "left-full ml-6";

          return (
            <div
              key={node.id}
              className={`absolute pointer-events-auto transition-all duration-500 ${isUnrelated ? 'opacity-30 scale-95 z-0' : isActive || isOverdrive ? 'opacity-100 scale-100 z-50' : 'opacity-100 scale-100 z-10'}`}
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <motion.div
                className="cursor-pointer"
                animate={isActive || isOverdrive ? { y: 0 } : { y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  setIsOverdrive(false);
                  setClickedNode(isActive ? null : node.id);
                }}
              >
                <div className={`relative bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border p-4 w-60 transition-all duration-300 ${isOverdrive ? 'border-purple-400 shadow-purple-500/20 scale-105' : isActive ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-blue-500/10 scale-105' : isDownstream ? 'border-emerald-400 shadow-emerald-500/10' : 'border-gray-200 hover:border-gray-300'}`}>
                
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${isOverdrive ? 'bg-purple-600 text-white shadow-inner' : isActive ? 'bg-blue-600 text-white shadow-inner' : isDownstream ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                    <node.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900 text-[15px] leading-tight">{node.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      {/* Status Dot */}
                      <span className={`w-2 h-2 rounded-full ${isOverdrive ? 'bg-purple-400 animate-ping' : isActive ? 'bg-blue-500 animate-pulse' : isDownstream ? 'bg-emerald-500 animate-pulse' : `bg-${node.color}-500 ${node.status !== 'Idle' && node.status !== 'Standby' ? 'animate-pulse' : ''}`}`}></span>
                      
                      {/* Status Text */}
                      <span className={`text-[10px] font-bold tracking-wider uppercase ${isOverdrive ? 'text-purple-600' : isActive ? 'text-blue-600' : isDownstream ? 'text-emerald-600' : `text-${node.color}-600`}`}>
                        {isOverdrive ? 'Syncing' : isActive ? 'Processing' : isDownstream ? 'Receiving' : node.status}
                      </span>
                      
                      {/* Mini Live Activity Monitor (if not idle) */}
                      {(isOverdrive || isActive || isDownstream || (node.status !== 'Idle' && node.status !== 'Standby')) && (
                        <div className="flex items-end gap-[2px] h-3 ml-auto opacity-70">
                          <motion.div animate={{ height: ['40%', '100%', '40%'] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} className={`w-1 rounded-sm ${isOverdrive ? 'bg-purple-400' : 'bg-blue-400'}`} />
                          <motion.div animate={{ height: ['70%', '30%', '70%'] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className={`w-1 rounded-sm ${isOverdrive ? 'bg-purple-400' : 'bg-blue-400'}`} />
                          <motion.div animate={{ height: ['50%', '90%', '50%'] }} transition={{ duration: 0.9, repeat: Infinity, delay: 0.1 }} className={`w-1 rounded-sm ${isOverdrive ? 'bg-purple-400' : 'bg-blue-400'}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Light Theme Hover Tooltip */}
                <AnimatePresence>
                  {(isActive || (hoveredNode === node.id && !isOverdrive)) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                      transition={{ duration: 0.2 }}
                      className={`absolute top-1/2 -translate-y-1/2 ${tooltipPosition} w-64 bg-white border border-gray-200 text-gray-900 p-5 rounded-2xl shadow-2xl z-50`}
                    >
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                        <Server className="w-4 h-4 text-blue-500" />
                        <span className="font-mono text-xs font-bold tracking-wider text-gray-500">LIVE TELEMETRY</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-xs font-medium">Status</span>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {node.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-xs font-medium">Average Latency</span>
                          <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{node.latency}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-xs font-medium">Accuracy</span>
                          <span className="font-mono text-xs font-bold text-blue-600">{node.accuracy}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-xs font-medium">Current Requests</span>
                          <span className="font-mono text-xs font-bold text-gray-900">{node.requests}</span>
                        </div>
                      </div>
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
}
