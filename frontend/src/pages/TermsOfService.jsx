import React from 'react';

export default function TermsOfService() {
  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '24px' }}>⚖️ Terms of Service & Medical Disclaimer</h2>
      
      <div className="chat-message emergency" style={{ marginBottom: '32px', display: 'block', maxWidth: 'none' }}>
        <strong>CRITICAL NOTICE:</strong> MedGraph AI is a medication companion platform, NOT a licensed medical practitioner. The platform does not diagnose diseases, alter prescribed dosages, or guarantee complete coverage of all global drug interaction exceptions. Always consult your doctor before starting or stopping any medication.
      </div>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--primary-color)' }}>1. Acceptance of Terms</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          By accessing and using MedGraph AI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--primary-color)' }}>2. Emergency Situations</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          MedGraph AI is not designed to handle medical emergencies. If you are experiencing an emergency, experiencing acute chest pain, stroke symptoms, or severe anaphylaxis, call your local emergency dispatch immediately (e.g., 911).
        </p>
      </section>

      <section>
        <h3 style={{ color: 'var(--primary-color)' }}>3. Accuracy of AI Output</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          While our Multi-Agent Graph Engine queries verified databases, artificial intelligence can occasionally produce inaccurate results ("hallucinations"). You are responsible for verifying any critical information provided by the AI companion with a licensed healthcare professional.
        </p>
      </section>
    </div>
  );
}
