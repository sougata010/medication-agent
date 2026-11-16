import React from 'react';

/**
 * VitaLeaf Clinical Grade Brand Icon
 * Modern geometric medical cross harmonized with a vitality leaf and clinical shield.
 */
export default function BrandIcon({ className = "w-7 h-7", size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VitaLeaf Brand Logo"
    >
      <defs>
        <linearGradient id="vl-grad-primary" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="60%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="vl-grad-accent" x1="16" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <filter id="vl-glow" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1D4ED8" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Modern Rounded Outer Shield Container */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="12"
        fill="url(#vl-grad-primary)"
        filter="url(#vl-glow)"
      />

      {/* Subtle Inner Glass Surface */}
      <rect
        x="4.5"
        y="4.5"
        width="39"
        height="39"
        rx="10.5"
        stroke="white"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />

      {/* Clinical Cross Core with Organic Vitality Leaf Cutout */}
      {/* Vertical Bar */}
      <rect x="21" y="11" width="6" height="26" rx="3" fill="white" />
      {/* Horizontal Bar */}
      <rect x="11" y="21" width="26" height="6" rx="3" fill="white" />

      {/* Intertwined Health Leaf Node at upper-right */}
      <path
        d="M24 24C24 16 33 13 36 12C36 16 35 24 24 24Z"
        fill="url(#vl-grad-accent)"
      />
      <path
        d="M26 22L33 15"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />

      {/* Pulse Anchor Node at bottom-left */}
      <circle cx="15" cy="33" r="2.2" fill="#38BDF8" />
    </svg>
  );
}

