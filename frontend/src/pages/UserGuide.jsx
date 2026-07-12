import React from 'react';

export default function UserGuide() {
  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '24px' }}>📘 VitaLeaf User Guide</h2>
      
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--primary-color)' }}>1. Using the Dashboard</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          The Dashboard provides a daily overview of your medication schedule. You can view pending reminders, check your adherence score, and mark medicines as taken or skipped.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--primary-color)' }}>2. AI Drug Companion</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Navigate to the "AI Drug Companion" tab to ask our intelligent agent questions about drug interactions, side effects, or general medicine purposes. The AI automatically references your health profile to give personalized warnings.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--primary-color)' }}>3. Uploading Prescriptions</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Use the "Upload Rx" page to scan handwritten prescriptions or typed lab reports. VitaLeaf will extract the medicine names and dosages using OCR. You can then confirm the details and the system will automatically schedule reminders for you.
        </p>
      </section>

      <section>
        <h3 style={{ color: 'var(--primary-color)' }}>4. Health Profile Setup</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          In the "Health Profile" section, ensure you list all known drug allergies and chronic conditions. This information is critical—the AI uses it to alert you if a new uploaded prescription poses a risk.
        </p>
      </section>
    </div>
  );
}
