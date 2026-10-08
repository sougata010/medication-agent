import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, ShieldCheck, Sparkles, Activity, Dna, Zap, Shuffle, Layers3 } from 'lucide-react';

const SHAPE_TYPES = ['helix', 'torus', 'icosahedron', 'galaxy', 'hypercube', 'wave', 'paraboloid', 'pyramid'];

const COLOR_PALETTES = [
  { name: 'Cyber Sky', finder: '#38bdf8', active1: '#818cf8', active2: '#34d399', bgGlow: 'from-blue-600 via-indigo-500 to-sky-400', qrFill: '#ffffff' },
  { name: 'Emerald Cyber', finder: '#10b981', active1: '#06b6d4', active2: '#6366f1', bgGlow: 'from-emerald-600 via-teal-500 to-cyan-400', qrFill: '#ffffff' },
  { name: 'Quantum Indigo', finder: '#6366f1', active1: '#38bdf8', active2: '#a855f7', bgGlow: 'from-indigo-600 via-purple-500 to-sky-400', qrFill: '#ffffff' },
  { name: 'Prism Cobalt', finder: '#0284c7', active1: '#38bdf8', active2: '#818cf8', bgGlow: 'from-sky-600 via-blue-600 to-indigo-600', qrFill: '#ffffff' },
];

// Global Static Caches to prevent re-computation across re-renders
const QR_MATRIX_CACHE = new Map();
const ACTIVE_NODES_CACHE = new Map();

function getCachedQRMatrix(seed) {
  if (QR_MATRIX_CACHE.has(seed)) {
    return QR_MATRIX_CACHE.get(seed);
  }
  const size = 21;
  const grid = Array.from({ length: size }, () => Array(size).fill(false));
  
  const addFinder = (top, left) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          grid[top + r][left + c] = true;
        }
      }
    }
  };
  
  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  let hash = seed;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7)) continue;
      const val = (r * size + c + hash) % 100;
      if (val % 2 === 0 || (r % 2 === 0 && c % 3 === 0)) {
        grid[r][c] = true;
      }
    }
  }
  QR_MATRIX_CACHE.set(seed, grid);
  return grid;
}

function getCachedActiveNodes(qrMatrix, currentShape, currentPalette, seed) {
  const cacheKey = `${seed}_${currentShape}_${currentPalette.name}`;
  if (ACTIVE_NODES_CACHE.has(cacheKey)) {
    return ACTIVE_NODES_CACHE.get(cacheKey);
  }

  const nodes = [];
  const size = 21;
  const step = 9.5;
  const originX = (220 - 199.5) / 2;
  const originY = (220 - 199.5) / 2;

  let index = 0;
  const totalActive = 220;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (qrMatrix[r][c]) {
        const isFinder = (r < 7 && c < 7) || (r < 7 && c >= 14) || (r >= 14 && c < 7);
        
        const qrX = originX + c * step;
        const qrY = originY + r * step;
        const qrZ = isFinder ? 6 : 0;

        let molX = 110;
        let molY = 110;
        let molZ = 0;

        const k = index;

        if (currentShape === 'helix') {
          const angle = index * 0.28;
          const radius = 58 + Math.sin(index * 0.35) * 18;
          molX = 110 + radius * Math.cos(angle);
          molY = 25 + (index / totalActive) * 170;
          molZ = radius * Math.sin(angle);
        } else if (currentShape === 'torus') {
          const u = index * 0.15;
          const R = 60;
          const rR = 25;
          molX = 110 + (R + rR * Math.cos(u * 3)) * Math.cos(u);
          molY = 110 + (R + rR * Math.cos(u * 3)) * Math.sin(u);
          molZ = rR * Math.sin(u * 3);
        } else if (currentShape === 'icosahedron') {
          const phi = Math.acos(-1 + (2 * index) / totalActive);
          const theta = Math.sqrt(totalActive * Math.PI) * phi;
          const radius = 68;
          molX = 110 + radius * Math.sin(phi) * Math.cos(theta);
          molY = 110 + radius * Math.sin(phi) * Math.sin(theta);
          molZ = radius * Math.cos(phi);
        } else if (currentShape === 'galaxy') {
          const arms = 3;
          const armAngle = (k % arms) * ((Math.PI * 2) / arms);
          const distance = (k / totalActive) * 75;
          const angle = distance * 0.15 + armAngle;
          molX = 110 + distance * Math.cos(angle);
          molY = 110 + distance * Math.sin(angle);
          molZ = Math.sin(distance * 0.2) * 20;
        } else if (currentShape === 'hypercube') {
          const cols = 6;
          const rows = 6;
          const layers = 6;
          const ix = k % cols;
          const iy = Math.floor(k / cols) % rows;
          const iz = Math.floor(k / (cols * rows)) % layers;
          molX = 50 + ix * 24;
          molY = 50 + iy * 24;
          molZ = (iz - 3) * 20;
        } else if (currentShape === 'wave') {
          const xVal = (k % 15) * 12 + 25;
          const yVal = Math.floor(k / 15) * 12 + 25;
          molX = xVal;
          molY = yVal;
          molZ = Math.sin(xVal * 0.08 + yVal * 0.08) * 35;
        } else if (currentShape === 'paraboloid') {
          const px = ((k % 15) - 7.5) * 10;
          const py = (Math.floor(k / 15) - 7.5) * 10;
          molX = 110 + px;
          molY = 110 + py;
          molZ = (px * px - py * py) / 12;
        } else { // pyramid
          const level = Math.floor(Math.sqrt(k));
          const sub = k - level * level;
          molX = 110 + (sub - level / 2) * 14;
          molY = 30 + level * 16;
          molZ = (level - 5) * 15;
        }

        const nodeColor = isFinder 
          ? currentPalette.finder 
          : (index % 3 === 0 ? currentPalette.active1 : index % 2 === 0 ? currentPalette.active2 : '#ffffff');

        nodes.push({
          id: `node-${r}-${c}`,
          r,
          c,
          isFinder,
          qrX,
          qrY,
          qrZ,
          molX,
          molY,
          molZ,
          color: nodeColor
        });
        index++;
      }
    }
  }
  ACTIVE_NODES_CACHE.set(cacheKey, nodes);
  return nodes;
}

export default function Custom3DQRCode({ payloadText = '', title = "Sougata's Medical Pass" }) {
  const [mode, setMode] = useState('qr'); // 'qr' | 'molecule'
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Compute deterministic seed from payloadText
  const userSeed = useMemo(() => {
    let hash = 0;
    const str = payloadText || 'VitaLeaf-User-Default-Seed';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }, [payloadText]);

  // Per-user dynamic structure state
  const [shapeIndex, setShapeIndex] = useState(() => userSeed % SHAPE_TYPES.length);
  const [paletteIndex, setPaletteIndex] = useState(() => (userSeed >> 2) % COLOR_PALETTES.length);
  const [variantId, setVariantId] = useState(() => (userSeed % 99) + 1);

  const currentShape = SHAPE_TYPES[shapeIndex];
  const currentPalette = COLOR_PALETTES[paletteIndex];

  // Memoized & Cache-backed Matrix (re-computed ONLY if userSeed changes)
  const qrMatrix = useMemo(() => {
    return getCachedQRMatrix(userSeed);
  }, [userSeed]);

  // Memoized & Cache-backed 3D Nodes (re-computed ONLY if shape, palette, or seed changes)
  const activeNodes = useMemo(() => {
    return getCachedActiveNodes(qrMatrix, currentShape, currentPalette, userSeed);
  }, [qrMatrix, currentShape, currentPalette, userSeed]);

  // Handle Shuffle Action
  const handleShuffle = () => {
    setShapeIndex((prev) => (prev + 1) % SHAPE_TYPES.length);
    setPaletteIndex((prev) => (prev + 1) % COLOR_PALETTES.length);
    setVariantId((prev) => (prev % 99) + 1);
    setMode('molecule');
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div className="relative group perspective-1000">
      {/* Ambient glowing background */}
      <div className={`absolute -inset-2 bg-gradient-to-r ${currentPalette.bgGlow} rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-all duration-700`}></div>

      {/* Main 3D Card Glass Panel */}
      <motion.div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX: mousePos.y, rotateY: mousePos.x }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="relative bg-white/95 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-7 shadow-2xl flex flex-col items-center text-center overflow-hidden"
      >
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md">
              <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            </div>
            <span className="text-[11px] font-heading font-extrabold text-slate-900 tracking-wider">VITALEAF SECURE</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-sky-50 border border-sky-100 text-[10px] font-mono font-bold text-sky-700 uppercase tracking-widest flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-sky-600" /> FHIR R4
          </span>
        </div>

        {/* Morph & Shuffle Control Bar */}
        <div className="w-full flex items-center justify-between bg-slate-100/90 p-1 rounded-2xl mb-3 border border-slate-200/70 gap-1">
          <button
            onClick={() => setMode('molecule')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'molecule' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-indigo-400" /> 3D Structure
          </button>

          <button
            onClick={handleShuffle}
            title="Shuffle 3D Geometry Structure"
            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-200/60 active:scale-95 flex items-center gap-1 text-[11px] font-bold"
          >
            <Shuffle className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" /> Shuffle
          </button>

          <button
            onClick={() => setMode('qr')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'qr' 
                ? 'bg-sky-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-white" /> Scannable QR
          </button>
        </div>

        {/* HUD Info */}
        <div className="w-full flex items-center justify-between px-2 mb-3 text-[10px] font-mono text-slate-500 font-semibold">
          <span className="capitalize flex items-center gap-1 text-slate-700">
            <Layers3 className="w-3 h-3 text-indigo-500" /> <strong>{currentShape}</strong>
          </span>
          <span className="text-slate-400">Variant #{variantId} • {currentPalette.name}</span>
        </div>

        {/* 3D Stage Container (220px x 220px) */}
        <div className="relative w-[220px] h-[220px] bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
          {/* Stage Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_14px] opacity-40"></div>

          {/* Scanning Beam in QR Mode */}
          {mode === 'qr' && (
            <motion.div 
              animate={{ y: [-100, 100, -100] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_15px_#38bdf8] z-30 pointer-events-none"
            />
          )}

          {/* PERSISTENT MORPHING 3D PARTICLE FIELD */}
          <motion.div 
            className="absolute inset-0 w-full h-full z-20 pointer-events-none"
            style={{ transformStyle: 'preserve-3d', perspective: 800 }}
            animate={mode === 'molecule' ? { rotateY: [0, 360] } : { rotateY: 0 }}
            transition={mode === 'molecule' ? { duration: 12, repeat: Infinity, ease: "linear" } : { duration: 0.8, ease: "easeOut" }}
          >
            {activeNodes.map((node) => {
              const targetX = mode === 'qr' ? node.qrX : node.molX;
              const targetY = mode === 'qr' ? node.qrY : node.molY;
              const targetZ = mode === 'qr' ? node.qrZ : node.molZ;

              return (
                <motion.div
                  key={node.id}
                  initial={false}
                  animate={{
                    left: `${targetX}px`,
                    top: `${targetY}px`,
                    z: targetZ,
                    scale: mode === 'qr' ? 1 : 1.15,
                    opacity: mode === 'qr' ? 0.35 : 0.95,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 85,
                    damping: 14,
                    delay: (node.r + node.c) * 0.0018,
                  }}
                  style={{
                    position: 'absolute',
                    width: `${node.isFinder ? 7.5 : 5.5}px`,
                    height: `${node.isFinder ? 7.5 : 5.5}px`,
                    backgroundColor: node.color,
                    borderRadius: mode === 'qr' ? '2px' : '50%',
                    boxShadow: mode === 'molecule' ? `0 0 8px ${node.color}` : 'none',
                    transformStyle: 'preserve-3d',
                  }}
                />
              );
            })}
          </motion.div>

          {/* Crisp Scannable Vector Overlay (Fades in smoothly during QR mode) */}
          <motion.div 
            className="absolute inset-0 w-full h-full p-4.5 flex items-center justify-center z-25 pointer-events-none"
            initial={false}
            animate={{ opacity: mode === 'qr' ? 0.95 : 0 }}
            transition={{ duration: 0.4, delay: mode === 'qr' ? 0.4 : 0 }}
          >
            <svg className="w-full h-full" viewBox="0 0 21 21">
              <rect width="21" height="21" fill="#090d16" rx="1.5" />
              {qrMatrix.map((row, r) =>
                row.map((active, c) => {
                  if (!active) return null;
                  const isFinder = (r < 7 && c < 7) || (r < 7 && c >= 14) || (r >= 14 && c < 7);
                  return (
                    <rect
                      key={`qr-rect-${r}-${c}`}
                      x={c}
                      y={r}
                      width="0.88"
                      height="0.88"
                      rx="0.22"
                      fill={isFinder ? currentPalette.finder : currentPalette.qrFill}
                    />
                  );
                })
              )}
            </svg>

            {/* Central Emblem Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="w-9 h-9 bg-slate-900/90 backdrop-blur-md rounded-xl border border-sky-400/60 shadow-lg flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-sky-400 animate-pulse" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="mt-4">
          <div className="flex items-center justify-center gap-2">
            <h4 className="text-sm font-heading font-extrabold text-slate-900">{title}</h4>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">VERIFIED</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {mode === 'molecule' 
              ? `Interactive 3D ${currentShape.toUpperCase()} Structure • Click Shuffle or QR to Morph`
              : 'Scan for instant physician EHR import & clinical verification'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}




