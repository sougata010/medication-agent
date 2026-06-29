import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const GQL_ENDPOINT = 'http://localhost:4000/graphql';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userId, setUserId] = useState('1');
  const [user, setUser] = useState({
    name: 'Loading...',
    age: 0,
    gender: 'Other',
    language: 'en',
    reminderChannel: 'Email',
    medicalProfile: {
      allergies: [],
      conditions: [],
      pregnancyStatus: false,
      emergencyContacts: '{}'
    }
  });
  const [reminders, setReminders] = useState([]);
  
  // Chat States
  const [chatSessionId, setChatSessionId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState({ isEmergency: false, warningDetails: '' });

  // OCR Wizard States
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState(null); // { ocrRaw: '', medications: [] }
  const [ocrFileName, setOcrFileName] = useState('');

  // Profile Input States (temporary changes before save)
  const [profileAllergies, setProfileAllergies] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [profileConditions, setProfileConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState('');

  const chatEndRef = useRef(null);

  // Load user data on startup
  useEffect(() => {
    initUser();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const gqlFetch = async (query, variables = {}) => {
    try {
      const response = await fetch(GQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      const resJson = await response.json();
      if (resJson.errors) {
        console.error('GraphQL Errors:', resJson.errors);
      }
      return resJson.data;
    } catch (err) {
      console.error('Network error calling GraphQL:', err);
      return null;
    }
  };

  const initUser = async () => {
    // Try to load user '1'
    const query = `
      query GetUser($id: ID!) {
        getUser(id: $id) {
          id
          name
          age
          gender
          language
          reminderChannel
          medicalProfile {
            id
            allergies
            conditions
            pregnancyStatus
            emergencyContacts
          }
        }
      }
    `;
    let data = await gqlFetch(query, { id: '1' });
    
    if (!data || !data.getUser) {
      // User 1 doesn't exist, create it
      const mutation = `
        mutation CreateUser($name: String!, $age: Int, $gender: String, $language: String, $reminderChannel: String) {
          createUser(name: $name, age: $age, gender: $gender, language: $language, reminderChannel: $reminderChannel) {
            id
            name
            age
            gender
            language
            reminderChannel
            medicalProfile {
              id
              allergies
              conditions
              pregnancyStatus
              emergencyContacts
            }
          }
        }
      `;
      const createData = await gqlFetch(mutation, {
        name: 'Sarah Connor',
        age: 34,
        gender: 'Female',
        language: 'en',
        reminderChannel: 'Telegram'
      });
      if (createData && createData.createUser) {
        setUser(createData.createUser);
        setUserId(createData.createUser.id);
        setProfileAllergies(createData.createUser.medicalProfile.allergies);
        setProfileConditions(createData.createUser.medicalProfile.conditions);
      }
    } else {
      setUser(data.getUser);
      setUserId(data.getUser.id);
      if (data.getUser.medicalProfile) {
        setProfileAllergies(data.getUser.medicalProfile.allergies || []);
        setProfileConditions(data.getUser.medicalProfile.conditions || []);
      }
    }
    
    fetchReminders('1');
    fetchChatHistory('1');
  };

  const fetchReminders = async (uid) => {
    const query = `
      query GetReminders($userId: ID!) {
        getReminders(userId: $userId) {
          id
          scheduledAt
          channel
          status
          medicine {
            id
            name
            genericName
            category
            mechanism
          }
        }
      }
    `;
    const data = await gqlFetch(query, { userId: uid || userId });
    if (data && data.getReminders) {
      setReminders(data.getReminders);
    }
  };

  const fetchChatHistory = async (uid) => {
    const query = `
      query GetSessions($userId: ID!) {
        getChatSessions(userId: $userId) {
          id
        }
      }
    `;
    const data = await gqlFetch(query, { userId: uid || userId });
    if (data && data.getChatSessions && data.getChatSessions.length > 0) {
      const activeSession = data.getChatSessions[0].id;
      setChatSessionId(activeSession);
      
      const msgQuery = `
        query GetMessages($sessionId: ID!) {
          getChatMessages(sessionId: $sessionId) {
            role
            content
            createdAt
          }
        }
      `;
      const msgData = await gqlFetch(msgQuery, { sessionId: activeSession });
      if (msgData && msgData.getChatMessages) {
        setChatMessages(msgData.getChatMessages);
      }
    }
  };

  // Chat Actions
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatLoading(true);
    
    // Optimistic user message rendering
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg, createdAt: new Date().toISOString() }]);

    const mutation = `
      mutation AskQuestion($userId: ID!, $sessionId: String, $message: String!) {
        askQuestion(userId: $userId, sessionId: $sessionId, message: $message) {
          sessionId
          responseText
          safetyAlert {
            isEmergency
            warningDetails
          }
          citations
        }
      }
    `;
    
    const data = await gqlFetch(mutation, {
      userId,
      sessionId: chatSessionId,
      message: userMsg
    });

    setChatLoading(false);
    if (data && data.askQuestion) {
      const res = data.askQuestion;
      if (!chatSessionId) {
        setChatSessionId(res.sessionId);
      }
      
      setSafetyAlert(res.safetyAlert);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: res.responseText,
        createdAt: new Date().toISOString(),
        citations: res.citations
      }]);
    }
  };

  // Reminder Actions
  const handleLogAdherence = async (reminderId, action, reason = '') => {
    const mutation = `
      mutation LogAdherence($reminderId: ID!, $action: String!, $reason: String) {
        logAdherence(reminderId: $reminderId, action: $action, reason: $reason) {
          id
          action
        }
      }
    `;
    const data = await gqlFetch(mutation, { reminderId, action, reason });
    if (data && data.logAdherence) {
      // Refresh local reminders
      fetchReminders();
    }
  };

  // Profile Actions
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const mutation = `
      mutation UpdateProfile(
        $userId: ID!
        $allergies: [String!]!
        $conditions: [String!]!
        $pregnancyStatus: Boolean!
        $emergencyContacts: String
      ) {
        updateMedicalProfile(
          userId: $userId
          allergies: $allergies
          conditions: $conditions
          pregnancyStatus: $pregnancyStatus
          emergencyContacts: $emergencyContacts
        ) {
          allergies
          conditions
          pregnancyStatus
        }
      }
    `;
    const data = await gqlFetch(mutation, {
      userId,
      allergies: profileAllergies,
      conditions: profileConditions,
      pregnancyStatus: user.medicalProfile.pregnancyStatus,
      emergencyContacts: user.medicalProfile.emergencyContacts
    });
    
    if (data && data.updateMedicalProfile) {
      setUser(prev => ({
        ...prev,
        medicalProfile: {
          ...prev.medicalProfile,
          ...data.updateMedicalProfile
        }
      }));
      alert('Medical profile saved successfully!');
    }
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !profileAllergies.includes(allergyInput.trim())) {
      setProfileAllergies([...profileAllergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (val) => {
    setProfileAllergies(profileAllergies.filter(item => item !== val));
  };

  const handleAddCondition = () => {
    if (conditionInput.trim() && !profileConditions.includes(conditionInput.trim())) {
      setProfileConditions([...profileConditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const handleRemoveCondition = (val) => {
    setProfileConditions(profileConditions.filter(item => item !== val));
  };

  // OCR Uploader Actions
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrFileName(file.name);
    setOcrLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.replace('data:', '').replace(/^.+,/, '');
      
      const mutation = `
        mutation UploadPrescription($userId: ID!, $filename: String!, $fileContentBase64: String) {
          uploadPrescription(userId: $userId, filename: $filename, fileContentBase64: $fileContentBase64) {
            ocrRaw
            medications {
              drugName
              dosage
              frequency
              duration
              confidenceLevel
              clinicalReasoning
            }
          }
        }
      `;
      const data = await gqlFetch(mutation, {
        userId,
        filename: file.name,
        fileContentBase64: base64String
      });

      setOcrLoading(false);
      if (data && data.uploadPrescription) {
        setOcrData(data.uploadPrescription);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWizardChange = (index, field, value) => {
    if (!ocrData) return;
    const updatedMeds = [...ocrData.medications];
    updatedMeds[index][field] = value;
    setOcrData({ ...ocrData, medications: updatedMeds });
  };

  const handleWizardTimingChange = (index, timingOption) => {
    if (!ocrData) return;
    const updatedMeds = [...ocrData.medications];
    const item = updatedMeds[index];
    
    // Initialize timing if not present
    if (!item.timing) item.timing = [];
    
    if (item.timing.includes(timingOption)) {
      item.timing = item.timing.filter(t => t !== timingOption);
    } else {
      item.timing = [...item.timing, timingOption];
    }
    
    setOcrData({ ...ocrData, medications: updatedMeds });
  };

  const handleConfirmWizard = async () => {
    if (!ocrData || ocrData.medications.length === 0) return;
    
    // Construct confirm payload
    const itemsInput = ocrData.medications.map(med => ({
      drugName: med.drugName,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      timing: med.timing || ['morning']
    }));

    const mutation = `
      mutation ConfirmPrescription($userId: ID!, $items: [ConfirmPrescriptionItemInput!]!) {
        confirmPrescription(userId: $userId, items: $items) {
          id
          uploadedAt
        }
      }
    `;
    
    const data = await gqlFetch(mutation, { userId, items: itemsInput });
    if (data && data.confirmPrescription) {
      alert('Prescription successfully confirmed! Reminder schedules created.');
      setOcrData(null);
      setOcrFileName('');
      fetchReminders();
      setActiveTab('dashboard');
    }
  };

  // Helper Stats calculations
  const totalReminders = reminders.length;
  const takenCount = reminders.filter(r => r.status === 'taken').length;
  const pendingCount = reminders.filter(r => r.status === 'pending').length;
  const adherenceRate = totalReminders > 0 
    ? Math.round(((takenCount) / (totalReminders - pendingCount || 1)) * 100) 
    : 100;

  // View Renders
  const renderDashboard = () => (
    <div className="reminders-dashboard animate-fade-in">
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon adherence">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
          <div className="stat-info">
            <h3>Adherence Score</h3>
            <p>{adherenceRate}%</p>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon pending">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm3.3 14.3L11 12.8V7h2v4.9l3.3 2L15.29 16.3z"/></svg>
          </div>
          <div className="stat-info">
            <h3>Pending Reminders</h3>
            <p>{pendingCount}</p>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon taken">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
          </div>
          <div className="stat-info">
            <h3>Taken Medicines</h3>
            <p>{takenCount}</p>
          </div>
        </div>
      </div>

      <div className="reminders-schedule-section">
        <div className="schedule-header">
          <h2>Medication Reminders</h2>
          <button className="btn-secondary" onClick={() => fetchReminders()}>Refresh List</button>
        </div>
        
        <div className="schedule-list">
          {reminders.length === 0 ? (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No reminders scheduled. Upload a prescription to create reminders automatically!
            </div>
          ) : (
            reminders.map(rem => (
              <div key={rem.id} className={`glass-panel reminder-item ${rem.status}`}>
                <div className="reminder-info">
                  <div className="med-icon">💊</div>
                  <div className="med-details">
                    <h4>{rem.medicine ? rem.medicine.name : 'Unknown Medicine'}</h4>
                    <p>{rem.medicine ? `${rem.medicine.category} • ${rem.medicine.mechanism.substring(0, 70)}...` : ''}</p>
                  </div>
                </div>
                
                <div className="reminder-time-channel">
                  <div className="time">{new Date(rem.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="channel">{rem.channel} Notification</div>
                </div>

                <div className="action-buttons">
                  {rem.status === 'pending' ? (
                    <>
                      <button className="btn-action take" onClick={() => handleLogAdherence(rem.id, 'taken')}>Take</button>
                      <button className="btn-action skip" onClick={() => handleLogAdherence(rem.id, 'skipped')}>Skip</button>
                    </>
                  ) : (
                    <span className={`status-badge ${rem.status}`}>{rem.status}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="chat-container animate-fade-in">
      <div className="chat-history">
        {chatMessages.length === 0 && (
          <div className="chat-message assistant">
            Hi, I'm your MedGraph AI Companion. You can ask me questions about your medications, safety profiles, or upload details.
            <div className="message-time">System</div>
          </div>
        )}
        
        {chatMessages.map((msg, index) => {
          const isEmergency = msg.content.includes("⚠️ CRITICAL MEDICAL ALERT");
          return (
            <div key={index} className={`chat-message ${msg.role} ${isEmergency ? 'emergency' : ''}`}>
              <div>{msg.content}</div>
              
              {msg.citations && msg.citations.length > 0 && (
                <div className="chat-citations">
                  {msg.citations.map((cite, cIdx) => (
                    <span key={cIdx} className="citation-tag">📄 {cite}</span>
                  ))}
                </div>
              )}
              
              <div className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        
        {chatLoading && (
          <div className="chat-message assistant" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
            Thinking...
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-area">
        <input 
          type="text" 
          className="glass-input" 
          placeholder="Ask a medical safety question... e.g. 'Can I take Ibuprofen with Milk?'"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={chatLoading}
        />
        <button type="submit" className="btn-primary" disabled={chatLoading}>
          Send
        </button>
      </form>
    </div>
  );

  const renderUpload = () => (
    <div className="wizard-section animate-fade-in">
      {!ocrData ? (
        <div className="glass-panel" style={{ padding: '40px' }}>
          <h2>Prescription Scanner</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Upload your handwritten prescription notes or lab report. Our OCR model will read names, dosages, and timings.
          </p>
          
          <label className="uploader-box">
            <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
            <div className="uploader-icon">
              <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
            </div>
            <h3>{ocrLoading ? 'Scanning File Content...' : 'Drag & Drop or Click to Browse'}</h3>
            <p style={{ color: 'var(--text-muted)' }}>Supports JPG, PNG, PDF</p>
          </label>
          {ocrFileName && <div style={{ textAlign: 'center', fontWeight: '600' }}>Selected: {ocrFileName}</div>}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2>Prescription Parsing Results</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Review the extracted medications and timings. Modify any fields before scheduling.
          </p>

          <div className="confirmation-table-container">
            <table className="confirm-table">
              <thead>
                <tr>
                  <th>Drug Name</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Timings</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {ocrData.medications.map((med, idx) => (
                  <tr key={idx}>
                    <td>
                      <input 
                        type="text" 
                        value={med.drugName} 
                        onChange={(e) => handleWizardChange(idx, 'drugName', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={med.dosage} 
                        onChange={(e) => handleWizardChange(idx, 'dosage', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={med.frequency} 
                        onChange={(e) => handleWizardChange(idx, 'frequency', e.target.value)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={med.duration} 
                        onChange={(e) => handleWizardChange(idx, 'duration', e.target.value)} 
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['morning', 'noon', 'evening', 'night'].map(time => {
                          const hasTiming = med.timing ? med.timing.includes(time) : (time === 'morning');
                          return (
                            <button 
                              key={time} 
                              type="button"
                              className={`btn-action ${hasTiming ? 'take' : ''}`}
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                              onClick={() => handleWizardTimingChange(idx, time)}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <span className={`confidence-badge ${med.confidenceLevel}`}>{med.confidenceLevel}</span>
                      <div className="clinical-reasoning">{med.clinicalReasoning}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => setOcrData(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleConfirmWizard}>Schedule Reminders</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="glass-panel animate-fade-in" style={{ padding: '30px' }}>
      <h2>Medical Profile & Settings</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Configure allergies, medical history, and notification channels so our agents can query warnings dynamically.
      </p>

      <form onSubmit={handleSaveProfile} className="profile-form">
        <div className="stats-grid">
          <div className="form-group">
            <label>Name</label>
            <input type="text" className="glass-input" value={user.name} disabled />
          </div>
          <div className="form-group">
            <label>Preferred Reminder Channel</label>
            <select 
              className="glass-input" 
              value={user.reminderChannel}
              onChange={(e) => {
                const val = e.target.value;
                setUser(prev => ({ ...prev, reminderChannel: val }));
              }}
            >
              <option value="Email">Email Digest</option>
              <option value="Telegram">Telegram Channel</option>
              <option value="Discord">Discord Server</option>
              <option value="Calendar">Google Calendar</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Known Drug/Food Allergies</label>
          <div className="tag-input-container">
            {profileAllergies.map(all => (
              <span key={all} className="tag-badge">
                {all} <button type="button" onClick={() => handleRemoveAllergy(all)}>&times;</button>
              </span>
            ))}
            <input 
              type="text" 
              placeholder="Add allergy and press Enter" 
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAllergy();
                }
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Chronic Medical Conditions</label>
          <div className="tag-input-container">
            {profileConditions.map(cond => (
              <span key={cond} className="tag-badge">
                {cond} <button type="button" onClick={() => handleRemoveCondition(cond)}>&times;</button>
              </span>
            ))}
            <input 
              type="text" 
              placeholder="Add condition and press Enter" 
              value={conditionInput}
              onChange={(e) => setConditionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCondition();
                }
              }}
            />
          </div>
        </div>

        <div className="toggle-group">
          <div className="toggle-info">
            <h4>Pregnancy Safety Rules</h4>
            <p>Checks FDA pregnancy categories and warning indices for all drugs</p>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={user.medicalProfile.pregnancyStatus}
              onChange={(e) => {
                const checked = e.target.checked;
                setUser(prev => ({
                  ...prev,
                  medicalProfile: {
                    ...prev.medicalProfile,
                    pregnancyStatus: checked
                  }
                }));
              }}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="submit" className="btn-primary">Save Profile</button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="app-container">
      <header className="glass-panel app-header">
        <div className="logo-section">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          </div>
          <div className="logo-text">
            <h1>MedGraph AI</h1>
            <span>Medication Intelligence Platform</span>
          </div>
        </div>
        
        <div className="header-status">
          <div className="user-badge">
            <span className="status-dot"></span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{user.name} (Active)</span>
          </div>
        </div>
      </header>

      <main className="app-workspace">
        <aside className="glass-panel app-sidebar">
          <div className="nav-menu">
            <div 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
              Schedule Log
            </div>
            <div 
              className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
              AI Drug Companion
            </div>
            <div 
              className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <svg viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
              Upload Rx
            </div>
            <div 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              Health Profile
            </div>
          </div>
          
          <div className="sidebar-footer">
            MedGraph AI © 2026<br/>
            All Rights Reserved
          </div>
        </aside>

        <section className="app-viewport">
          <div className="view-content">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'chat' && renderChat()}
            {activeTab === 'upload' && renderUpload()}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </section>
      </main>
    </div>
  );
}
