import React from 'react';

export default function Updates() {
  const releases = [
    {
      version: "v1.1.0",
      date: "July 2026",
      changes: [
        "Major frontend refactor: Component-based architecture.",
        "Introduced dedicated pages for Legal Docs and User Guide.",
        "Global Context implementation for optimized state management.",
        "React Router integration for smooth page transitions."
      ]
    },
    {
      version: "v1.0.0",
      date: "June 2026",
      changes: [
        "Initial Release of VitaLeaf.",
        "Multi-Agent LangGraph integration.",
        "OCR Prescription Scanning capabilities.",
        "Intelligent AI Drug Companion chat.",
        "Reminders and Adherence Tracking dashboard."
      ]
    }
  ];

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '32px' }}>✨ Platform Updates</h2>
      
      <div className="updates-timeline">
        {releases.map((release, index) => (
          <div key={index} style={{ marginBottom: '40px', borderLeft: '2px solid var(--primary-color)', paddingLeft: '20px' }}>
            <h3 style={{ color: 'var(--primary-color)', margin: '0 0 8px 0' }}>{release.version}</h3>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>{release.date}</div>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              {release.changes.map((change, cIndex) => (
                <li key={cIndex}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
