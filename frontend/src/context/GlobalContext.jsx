import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

const GQL_ENDPOINT = 'http://localhost:4000/graphql';

export const GlobalProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('medgraph_token');
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });
  const [userId, setUserId] = useState(null);
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
  
  // Data States
  const [reminders, setReminders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [labReports, setLabReports] = useState([]);
  
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
  const [ocrPreviewImage, setOcrPreviewImage] = useState(null);

  // Profile Input States
  const [profileAllergies, setProfileAllergies] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [profileConditions, setProfileConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('medgraph_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          initUser(decoded.userId);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('medgraph_token');
        }
      } catch (e) {
        localStorage.removeItem('medgraph_token');
      }
    }
  }, []);

  const gqlFetch = async (query, variables = {}) => {
    try {
      const token = localStorage.getItem('medgraph_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(GQL_ENDPOINT, {
        method: 'POST',
        headers,
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

  const initUser = async (uid) => {
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
    let data = await gqlFetch(query, { id: uid });
    
    if (!data || !data.getUser) {
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
    
    
    fetchReminders(uid);
    fetchPrescriptions(uid);
    fetchChatHistory(uid);
    fetchDashboardMetrics(uid);
    fetchLabReports(uid);
  };

  const fetchDashboardMetrics = async (uid) => {
    const query = `
      query GetDashboardMetrics($userId: ID!) {
        getDashboardMetrics(userId: $userId) {
          healthMetrics {
            hydration
            sleep
            bloodPressure
          }
          insights {
            id
            text
            type
          }
          weeklyAdherence
          aiAnalysis {
            overallRisk
            drugInteraction
            foodInteraction
            kidneyWarning
            liverSafety
            confidence
          }
        }
      }
    `;
    const data = await gqlFetch(query, { userId: uid });
    if (data && data.getDashboardMetrics) {
      setDashboardMetrics(data.getDashboardMetrics);
    }
  };

  const fetchLabReports = async (uid) => {
    const query = `
      query GetLabReports($userId: ID!) {
        getLabReports(userId: $userId) {
          id
          uploadedAt
          parameters {
            id
            name
            value
            unit
            referenceRange
            status
            severity
            chemicalType
            category
            normalMin
            normalMax
            confidence
            risk
            recommendation
          }
        }
      }
    `;
    const data = await gqlFetch(query, { userId: uid });
    if (data && data.getLabReports) {
      setLabReports(data.getLabReports);
    }
  };

  const login = async (token, userData) => {
    localStorage.setItem('medgraph_token', token);
    await initUser(userData.id);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('medgraph_token');
    setUserId(null);
    setIsAuthenticated(false);
    setUser({
      name: '',
      age: 0,
      gender: 'Other',
      language: 'en',
      reminderChannel: 'Email',
      medicalProfile: { allergies: [], conditions: [], pregnancyStatus: false, emergencyContacts: '{}' }
    });
    setReminders([]);
    setPrescriptions([]);
    setChatMessages([]);
  };

  const fetchPrescriptions = async (uid) => {
    const query = `
      query GetPrescriptions($userId: ID!) {
        getPrescriptions(userId: $userId) {
          id
          userId
          uploadedAt
          verified
          items {
            id
            medicineId
            dosage
            frequency
            duration
            timing
            medicine {
              id
              name
              genericName
              category
              mechanism
            }
          }
        }
      }
    `;
    const data = await gqlFetch(query, { userId: uid || userId });
    if (data && data.getPrescriptions) {
      setPrescriptions(data.getPrescriptions);
    }
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

  const handleSendMessage = async (e, input) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;
    
    const userMsg = input;
    setChatInput('');
    setChatLoading(true);
    
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
      fetchReminders();
    }
  };

  const handleSaveProfile = async (e, currentProfileAllergies, currentProfileConditions) => {
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
      allergies: currentProfileAllergies,
      conditions: currentProfileConditions,
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

  const handleAddAllergy = (input, currentAllergies) => {
    if (input.trim() && !currentAllergies.includes(input.trim())) {
      setProfileAllergies([...currentAllergies, input.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (val, currentAllergies) => {
    setProfileAllergies(currentAllergies.filter(item => item !== val));
  };

  const handleAddCondition = (input, currentConditions) => {
    if (input.trim() && !currentConditions.includes(input.trim())) {
      setProfileConditions([...currentConditions, input.trim()]);
      setConditionInput('');
    }
  };

  const handleRemoveCondition = (val, currentConditions) => {
    setProfileConditions(currentConditions.filter(item => item !== val));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrFileName(file.name);
    setOcrLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      setOcrPreviewImage(reader.result);
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
    
    if (!item.timing) item.timing = [];
    
    if (item.timing.includes(timingOption)) {
      item.timing = item.timing.filter(t => t !== timingOption);
    } else {
      item.timing = [...item.timing, timingOption];
    }
    
    setOcrData({ ...ocrData, medications: updatedMeds });
  };

  const handleConfirmWizard = async (onSuccess) => {
    if (!ocrData || ocrData.medications.length === 0) return;
    
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
      setOcrPreviewImage(null);
      setOcrFileName('');
      fetchReminders(userId);
      fetchPrescriptions(userId);
      if (onSuccess) onSuccess();
    }
  };

  const totalReminders = reminders.length;
  const takenCount = reminders.filter(r => r.status === 'taken').length;
  const pendingCount = reminders.filter(r => r.status === 'pending').length;
  const adherenceRate = totalReminders > 0 
    ? Math.round(((takenCount) / (totalReminders - pendingCount || 1)) * 100) 
    : 100;

  // --- Dynamic Data for Premium Dashboard ---
  const healthMetrics = dashboardMetrics?.healthMetrics || { hydration: 'Loading...', sleep: 'Loading...', bloodPressure: 'Loading...' };
  const insights = dashboardMetrics?.insights || [];
  const weeklyAdherence = dashboardMetrics?.weeklyAdherence || [0, 0, 0, 0, 0, 0, 0];
  const aiAnalysis = dashboardMetrics?.aiAnalysis || {
    overallRisk: 'Loading...',
    drugInteraction: 'Loading...',
    foodInteraction: 'Loading...',
    kidneyWarning: 'Loading...',
    liverSafety: 'Loading...',
    confidence: '...'
  };

  const value = {
    userId, setUserId,
    user, setUser,
    reminders, setReminders,
    prescriptions, setPrescriptions,
    fetchPrescriptions,
    chatSessionId, setChatSessionId,
    chatMessages, setChatMessages,
    chatInput, setChatInput,
    chatLoading, setChatLoading,
    safetyAlert, setSafetyAlert,
    ocrLoading, setOcrLoading,
    ocrData, setOcrData,
    ocrFileName,
    setOcrFileName,
    ocrPreviewImage,
    setOcrPreviewImage,
    profileAllergies, setProfileAllergies,
    allergyInput, setAllergyInput,
    profileConditions, setProfileConditions,
    conditionInput, setConditionInput,
    fetchReminders,
    fetchChatHistory,
    handleSendMessage,
    handleLogAdherence,
    handleSaveProfile,
    handleAddAllergy,
    handleRemoveAllergy,
    handleAddCondition,
    handleRemoveCondition,
    handleFileSelect,
    handleWizardChange,
    handleWizardTimingChange,
    handleConfirmWizard,
    login,
    logout,
    isAuthenticated,
    totalReminders,
    takenCount,
    pendingCount,
    adherenceRate,
    healthMetrics,
    insights,
    weeklyAdherence,
    aiAnalysis,
    labReports
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};
