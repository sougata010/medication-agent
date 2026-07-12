import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '24px' }}>🔒 Privacy Policy</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>Last Updated: July 2026</p>
      
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--primary-color)' }}>1. Data Collection</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          MedGraph AI collects information required to provide medication intelligence services, including uploaded prescription images, chat queries, and self-reported health profiles (allergies, conditions).
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--primary-color)' }}>2. Data Usage and Processing</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Your data is processed by our secure LangGraph agents strictly for generating medical insights, scheduling reminders, and checking interactions. We do not sell your personal health information to third-party advertisers.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--primary-color)' }}>3. Storage & Security</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          All structured medical data is stored securely in an encrypted PostgreSQL database. Uploaded images are temporarily stored in secure cloud buckets and are subjected to strict access control policies.
        </p>
      </section>

      <section>
        <h3 style={{ color: 'var(--primary-color)' }}>4. Your Rights</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          You have the right to request a complete export of your health data, or request the permanent deletion of your profile and history from our servers at any time.
        </p>
      </section>
    </div>
  );
}
