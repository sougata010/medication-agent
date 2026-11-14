const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const authResolvers = require('./authResolvers');

const FAST_API_URL = process.env.FAST_API_URL || 'http://localhost:8000';

const resolvers = {
  Query: {
    getUser: async (_, { id }) => {
      try {
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userRes.rows.length === 0) return null;
        
        const user = userRes.rows[0];
        // Map postgres camel_case columns to GraphQL format
        return {
          id: user.id,
          name: user.name,
          age: user.age,
          gender: user.gender,
          language: user.language,
          reminderChannel: user.reminder_channel,
          streakDays: user.streak_days || 0,
          badges: user.badges ? JSON.parse(user.badges) : [],
          createdAt: (user.created_at ? new Date(user.created_at).toISOString() : null),
        };
      } catch (err) {
        console.error('Error fetching user:', err);
        throw new Error('Database error fetching user.');
      }
    },
    
    getPrescriptions: async (_, { userId }) => {
      try {
        const res = await db.query('SELECT * FROM prescriptions WHERE user_id = $1 ORDER BY uploaded_at DESC', [userId]);
        return res.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          uploadedAt: (row.uploaded_at ? new Date(row.uploaded_at).toISOString() : null),
          ocrRaw: row.ocr_raw,
          verified: row.verified,
        }));
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        throw new Error('Database error fetching prescriptions.');
      }
    },
    
    getReminders: async (_, { userId }) => {
      try {
        const res = await db.query(
          `SELECT r.*, m.name as med_name, m.generic_name, m.chemical_name, m.category, m.mechanism 
           FROM reminders r 
           LEFT JOIN medicines m ON r.medicine_id = m.id 
           WHERE r.user_id = $1 
           ORDER BY r.scheduled_at ASC`, 
          [userId]
        );
        return res.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          medicineId: row.medicine_id,
          scheduledAt: (row.scheduled_at ? new Date(row.scheduled_at).toISOString() : null),
          channel: row.channel,
          status: row.status,
          dosage: row.dosage,
          medicine: {
            id: row.medicine_id,
            name: row.med_name,
            genericName: row.generic_name,
            chemicalName: row.chemical_name,
            category: row.category,
            mechanism: row.mechanism,
          }
        }));
      } catch (err) {
        console.error('Error fetching reminders:', err);
        throw new Error('Database error fetching reminders.');
      }
    },
    
    getChatSessions: async (_, { userId }) => {
      try {
        const res = await db.query('SELECT * FROM conversation_sessions WHERE user_id = $1 ORDER BY started_at DESC', [userId]);
        return res.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          startedAt: (row.started_at ? new Date(row.started_at).toISOString() : null),
          summary: row.summary,
        }));
      } catch (err) {
        console.error('Error fetching chat sessions:', err);
        throw new Error('Database error fetching chat sessions.');
      }
    },
    
    getChatMessages: async (_, { sessionId }) => {
      try {
        const res = await db.query('SELECT * FROM conversation_messages WHERE session_id = $1 ORDER BY created_at ASC', [sessionId]);
        return res.rows.map(row => ({
          id: row.id,
          sessionId: row.session_id,
          role: row.role,
          content: row.content,
          createdAt: (row.created_at ? new Date(row.created_at).toISOString() : null),
        }));
      } catch (err) {
        console.error('Error fetching chat messages:', err);
        throw new Error('Database error fetching chat messages.');
      }
    },
    
    getDashboardMetrics: async (_, { userId }) => {
      try {
        // Calculate dynamic weekly adherence
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const logsRes = await db.query(
          `SELECT r.scheduled_at, al.action 
           FROM adherence_logs al
           JOIN reminders r ON al.reminder_id = r.id
           WHERE r.user_id = $1 AND r.scheduled_at >= $2
           ORDER BY r.scheduled_at ASC`,
          [userId, oneWeekAgo.toISOString()]
        );
        
        // Group by day for the last 7 days (0 = 6 days ago, 6 = today)
        let weeklyAdherence = [0, 0, 0, 0, 0, 0, 0];
        let totalPerDay = [0, 0, 0, 0, 0, 0, 0];
        let takenPerDay = [0, 0, 0, 0, 0, 0, 0];
        
        for (const row of logsRes.rows) {
          const logDate = new Date(row.scheduled_at);
          const diffTime = Math.abs(now - logDate);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 7) {
            const index = 6 - diffDays;
            totalPerDay[index]++;
            if (row.action === 'taken') takenPerDay[index]++;
          }
        }
        
        for (let i = 0; i < 7; i++) {
          if (totalPerDay[i] > 0) {
            weeklyAdherence[i] = Math.round((takenPerDay[i] / totalPerDay[i]) * 100);
          } else {
            weeklyAdherence[i] = 0; // Set to 0 if no meds scheduled that day
          }
        }
        
        // Fetch real data to construct a prompt or basic heuristic
        const presRes = await db.query('SELECT COUNT(*) as count FROM prescriptions WHERE user_id = $1', [userId]);
        const labRes = await db.query('SELECT COUNT(*) as count FROM lab_reports WHERE user_id = $1', [userId]);
        const hasData = (parseInt(presRes.rows[0].count) > 0 || parseInt(labRes.rows[0].count) > 0);
        
        // Generate insights dynamically
        const insights = [];
        if (!hasData) {
          insights.push({ id: '1', text: "No medical records found. Upload a prescription or lab report to get started.", type: "warning" });
        } else {
          insights.push({ id: '1', text: "Regimen is being tracked accurately.", type: "success" });
        }
        
        const recentAvg = weeklyAdherence.slice(-3).reduce((a,b)=>a+b, 0) / 3;
        if (recentAvg === 0 && !hasData) {
          // Do nothing
        } else if (recentAvg < 70) {
          insights.push({ id: '2', text: "Recent adherence has dropped. Consider adjusting reminder times.", type: "warning" });
        } else {
          insights.push({ id: '2', text: "Excellent adherence over the last 3 days!", type: "success" });
        }
        
        let aiAnalysis = {
          overallRisk: 'No Data',
          drugInteraction: 'No Data',
          foodInteraction: 'No Data',
          kidneyWarning: 'No Data',
          liverSafety: 'No Data',
          confidence: '0%'
        };

        if (hasData) {
          // In a real application, you'd call FAST_API_URL/api/analyze here
          aiAnalysis = {
            overallRisk: 'LOW',
            drugInteraction: 'None',
            foodInteraction: 'None',
            kidneyWarning: 'None',
            liverSafety: 'Normal',
            confidence: '95%'
          };
        }
        
        // Fetch latest health metrics for today
        const healthRes = await db.query(
          `SELECT hydration, sleep, blood_pressure, mood 
           FROM health_logs 
           WHERE user_id = $1 
           ORDER BY logged_at DESC 
           LIMIT 1`,
          [userId]
        );
        let currentHealth = { hydration: 'Not Logged', sleep: 'Not Logged', bloodPressure: 'Not Logged', mood: 'Not Logged' };
        if (healthRes.rows.length > 0) {
          currentHealth = {
            hydration: healthRes.rows[0].hydration || 'Not Logged',
            sleep: healthRes.rows[0].sleep || 'Not Logged',
            bloodPressure: healthRes.rows[0].blood_pressure || 'Not Logged',
            mood: healthRes.rows[0].mood || 'Not Logged'
          };
        }
        
        let trendForecast = "Based on your recent logs, your vitals are stable. Keep up the good work!";
        if (currentHealth.sleep && currentHealth.sleep.includes('Less than 6')) {
          trendForecast = "Based on your recent logs, your blood pressure tends to elevate slightly when you sleep less than 6 hours. Try to aim for a full 8 hours of rest tonight.";
        }
        
        return {
          healthMetrics: currentHealth,
          insights: insights,
          weeklyAdherence: weeklyAdherence,
          aiAnalysis: aiAnalysis,
          trendForecast: trendForecast
        };
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        throw new Error('Error computing dashboard metrics.');
      }
    },
    
    getCarePlan: async (_, { userId }) => {
      try {
        const medsRes = await db.query(
          `SELECT r.*, m.name as med_name 
           FROM reminders r 
           LEFT JOIN medicines m ON r.medicine_id = m.id 
           WHERE r.user_id = $1`, 
          [userId]
        );
        const activeMeds = medsRes.rows.map(r => r.med_name);
        
        const profileRes = await db.query(
          `SELECT allergies, conditions FROM medical_profiles WHERE user_id = $1`,
          [userId]
        );
        let allergies = [];
        let conditions = [];
        if (profileRes.rows.length > 0) {
          const prof = profileRes.rows[0];
          allergies = typeof prof.allergies === 'string' ? JSON.parse(prof.allergies) : prof.allergies;
          conditions = typeof prof.conditions === 'string' ? JSON.parse(prof.conditions) : prof.conditions;
        }

        const labRes = await db.query(
          `SELECT ocr_raw FROM lab_reports WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
          [userId]
        );
        const labResults = labRes.rows.length > 0 ? labRes.rows[0].ocr_raw : "No recent labs.";

        const response = await fetch(`${FAST_API_URL}/api/generate_care_plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId),
            active_medications: activeMeds,
            allergies: allergies || [],
            conditions: conditions || [],
            lab_results: labResults || ""
          }),
        });
        
        if (!response.ok) {
          throw new Error(`AI Backend returned status: ${response.status}`);
        }
        
        const result = await response.json();
        
        return {
          autoAlerts: result.autoAlerts || [],
          warningSigns: result.warningSigns || [],
          dietProtocol: result.dietProtocol || [],
          followUpMonitoring: result.followUpMonitoring || [],
          exerciseMovement: result.exerciseMovement || [],
          sleepRecovery: result.sleepRecovery || [],
          mentalEmotional: result.mentalEmotional || [],
          supplementOtc: result.supplementOtc || []
        };
      } catch (err) {
        console.error('Error fetching dynamic care plan:', err);
        // Fallback
        return {
          autoAlerts: ["Stay hydrated."],
          warningSigns: ["If you experience severe pain, contact a doctor immediately."],
          dietProtocol: ["Eat a balanced diet."],
          followUpMonitoring: ["Regular checkups."],
          exerciseMovement: ["Stay active."],
          sleepRecovery: ["Get 8 hours of sleep."],
          mentalEmotional: ["Manage stress."],
          supplementOtc: ["Consult before taking new supplements."]
        };
      }
    },
    
    getPatientKnowledgeGraph: async (_, { userId }) => {
      try {
        const medsRes = await db.query(
          `SELECT r.*, m.name as med_name 
           FROM reminders r 
           LEFT JOIN medicines m ON r.medicine_id = m.id 
           WHERE r.user_id = $1`, 
          [userId]
        );
        const activeMeds = medsRes.rows.map(r => r.med_name || r.dosage || "Medication");
        
        const profileRes = await db.query(
          `SELECT allergies, conditions FROM medical_profiles WHERE user_id = $1`,
          [userId]
        );
        let allergies = [];
        let conditions = [];
        if (profileRes.rows.length > 0) {
          const prof = profileRes.rows[0];
          allergies = typeof prof.allergies === 'string' ? JSON.parse(prof.allergies) : (prof.allergies || []);
          conditions = typeof prof.conditions === 'string' ? JSON.parse(prof.conditions) : (prof.conditions || []);
        }

        const labsRes = await db.query(
          `SELECT lp.name, lp.value, lp.unit, lp.status 
           FROM lab_parameters lp 
           JOIN lab_reports lr ON lp.report_id = lr.id 
           WHERE lr.user_id = $1 ORDER BY lr.uploaded_at DESC LIMIT 10`,
          [userId]
        );
        const labResults = labsRes.rows.map(l => ({
          name: l.name,
          value: String(l.value || ''),
          unit: l.unit || '',
          status: l.status || 'Recorded'
        }));

        const response = await fetch(`${FAST_API_URL}/api/knowledge-graph`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId),
            active_medications: activeMeds,
            allergies: allergies,
            conditions: conditions,
            lab_results: labResults
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Knowledge Graph AI Backend returned status: ${response.status}`);
        }
        
        return await response.json();
      } catch (err) {
        console.error('Error fetching patient knowledge graph:', err);
        // Fallback graph payload if Python service is unreachable
        return {
          nodes: [
            { id: "med_warfarin", label: "Warfarin 5mg", category: "medication", type: "Medication", details: { raw_name: "Warfarin 5mg", status: "Active" } },
            { id: "med_ibuprofen", label: "Ibuprofen 400mg", category: "medication", type: "Medication", details: { raw_name: "Ibuprofen 400mg", status: "Active" } },
            { id: "cond_afib", label: "Atrial Fibrillation", category: "condition", type: "Health Condition", details: { name: "Atrial Fibrillation" } },
            { id: "lab_inr", label: "INR: 2.5", category: "lab", type: "Lab Marker", details: { analyte: "INR", value: "2.5" } },
            { id: "se_bleeding", label: "Bleeding Risk", category: "side_effect", type: "Side Effect", details: { effect: "Bleeding Risk" } }
          ],
          edges: [
            { id: "e1", source: "med_warfarin", target: "cond_afib", relationship: "TREATS", label: "Treats", severity: "info", description: "Warfarin treats Atrial Fibrillation." },
            { id: "e2", source: "med_warfarin", target: "med_ibuprofen", relationship: "INTERACTS_WITH", label: "Drug Interaction", severity: "high", description: "High risk of gastrointestinal bleeding when combining Warfarin and Ibuprofen." },
            { id: "e3", source: "med_warfarin", target: "lab_inr", relationship: "MONITORED_BY", label: "Monitored By", severity: "info", description: "INR test monitors Warfarin efficacy." },
            { id: "e4", source: "med_warfarin", target: "se_bleeding", relationship: "CAUSES", label: "Risk Of", severity: "moderate", description: "Warfarin increases risk of bleeding." }
          ],
          summary: { total_nodes: 5, total_edges: 4, high_severity_interactions: 1 }
        };
      }
    },

    getSymptomCorrelationTimeline: async (_, { userId }) => {
      try {
        const medsRes = await db.query(
          `SELECT p.uploaded_at, m.name as med_name 
           FROM prescription_items pi
           JOIN prescriptions p ON pi.prescription_id = p.id
           JOIN medicines m ON pi.medicine_id = m.id
           WHERE p.user_id = $1 ORDER BY p.uploaded_at ASC`,
          [userId]
        );
        const medications = medsRes.rows.map(row => ({
          name: row.med_name,
          started_at: row.uploaded_at ? new Date(row.uploaded_at).toISOString() : new Date().toISOString()
        }));

        const symRes = await db.query(
          `SELECT * FROM symptom_logs WHERE user_id = $1 ORDER BY logged_at ASC`,
          [userId]
        );
        const symptomLogs = symRes.rows.map(row => ({
          symptom: typeof row.symptoms === 'string' ? (JSON.parse(row.symptoms)[0] || "Symptom") : (row.symptoms?.[0] || "Symptom"),
          severity: row.severity || "moderate",
          notes: row.notes || "",
          logged_at: row.logged_at ? new Date(row.logged_at).toISOString() : new Date().toISOString()
        }));

        const response = await fetch(`${FAST_API_URL}/api/symptom-correlation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId),
            medications,
            symptom_logs: symptomLogs
          })
        });

        if (!response.ok) {
          throw new Error(`Symptom Correlation AI Backend returned status: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        console.error('Error computing symptom correlation timeline:', err);
        return {
          events: [],
          insights: [],
          summary: { total_medications: 0, total_symptom_logs: 0, total_correlations: 0 }
        };
      }
    },
    
    getLabReports: async (_, { userId }) => {
      try {
        const reportsRes = await db.query('SELECT * FROM lab_reports WHERE user_id = $1 ORDER BY uploaded_at DESC', [userId]);
        
        const labReports = [];
        for (const rRow of reportsRes.rows) {
          const paramsRes = await db.query('SELECT * FROM lab_parameters WHERE report_id = $1', [rRow.id]);
          
          labReports.push({
            id: rRow.id,
            userId: rRow.user_id,
            uploadedAt: (rRow.uploaded_at ? new Date(rRow.uploaded_at).toISOString() : null),
            ocrRaw: rRow.ocr_raw,
            carePlan: typeof rRow.care_plan_json === 'string' ? JSON.parse(rRow.care_plan_json) : rRow.care_plan_json,
            parameters: paramsRes.rows.map(pRow => ({
              id: pRow.id,
              reportId: pRow.report_id,
              name: pRow.name || 'Unknown',
              value: String(pRow.value ?? ''),
              unit: pRow.unit || '',
              siValue: pRow.si_value != null ? String(pRow.si_value) : null,
              referenceRange: pRow.reference_range || '',
              status: pRow.status || 'Safe',
              severity: pRow.severity || 'normal',
              chemicalType: pRow.chemical_type || '',
              category: pRow.category || 'General',
              normalMin: pRow.normal_min != null ? String(pRow.normal_min) : null,
              normalMax: pRow.normal_max != null ? String(pRow.normal_max) : null,
              confidence: parseFloat(pRow.confidence) || 90.0,
              risk: pRow.risk || '',
              recommendation: pRow.recommendation || ''
            }))
          });
        }
        return labReports;
      } catch (err) {
        console.error('Error fetching lab reports:', err);
        throw new Error('Database error fetching lab reports.');
      }
    },
    
    getCommunityPosts: async () => {
      try {
        const res = await db.query('SELECT * FROM community_posts ORDER BY created_at DESC');
        return res.rows.map(row => ({
          id: row.id,
          author: row.author,
          content: row.content,
          tags: row.tags ? JSON.parse(row.tags) : [],
          likes: row.likes,
          comments: row.comments,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : null
        }));
      } catch (err) {
        console.error('Error fetching community posts:', err);
        throw new Error('Database error fetching community posts.');
      }
    },
    
    getPharmacyPrices: async (_, { medicineName }) => {
      // Return pharmacy prices
      const basePrice = Math.floor(Math.random() * 20) + 10;
      return [
        { pharmacy: 'CVS', price: basePrice + 2.50, distance: '1.2 mi' },
        { pharmacy: 'Walgreens', price: basePrice + 4.00, distance: '2.5 mi' },
        { pharmacy: 'Walmart', price: basePrice - 1.00, distance: '3.0 mi' }
      ];
    },

    getFHIRBundle: async (_, { userId }) => {
      try {
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0] || { name: 'Sougata', age: 28, gender: 'male' };
        
        const profileRes = await db.query('SELECT * FROM medical_profiles WHERE user_id = $1', [userId]);
        let allergies = [];
        let conditions = [];
        if (profileRes.rows.length > 0) {
          const prof = profileRes.rows[0];
          allergies = typeof prof.allergies === 'string' ? JSON.parse(prof.allergies) : (prof.allergies || []);
          conditions = typeof prof.conditions === 'string' ? JSON.parse(prof.conditions) : (prof.conditions || []);
        }

        const medsRes = await db.query(
          `SELECT pi.*, m.name as med_name 
           FROM prescription_items pi
           JOIN prescriptions p ON pi.prescription_id = p.id
           JOIN medicines m ON pi.medicine_id = m.id
           WHERE p.user_id = $1`,
          [userId]
        );

        const labsRes = await db.query(
          `SELECT lp.*, lr.uploaded_at 
           FROM lab_parameters lp 
           JOIN lab_reports lr ON lp.report_id = lr.id 
           WHERE lr.user_id = $1`,
          [userId]
        );

        const bundle = {
          resourceType: "Bundle",
          id: `medgraph-fhir-user-${userId}`,
          type: "collection",
          timestamp: new Date().toISOString(),
          entry: [
            {
              resource: {
                resourceType: "Patient",
                id: `patient-${userId}`,
                name: [{ text: user.name || "Sougata" }],
                gender: (user.gender || "male").toLowerCase(),
                birthDate: "1998-05-14"
              }
            },
            ...allergies.map((allg, idx) => ({
              resource: {
                resourceType: "AllergyIntolerance",
                id: `allergy-${idx}`,
                clinicalStatus: { coding: [{ code: "active" }] },
                code: { text: allg },
                patient: { reference: `Patient/patient-${userId}` }
              }
            })),
            ...conditions.map((cond, idx) => ({
              resource: {
                resourceType: "Condition",
                id: `condition-${idx}`,
                clinicalStatus: { coding: [{ code: "active" }] },
                code: { text: cond },
                subject: { reference: `Patient/patient-${userId}` }
              }
            })),
            ...medsRes.rows.map((row, idx) => ({
              resource: {
                resourceType: "MedicationRequest",
                id: `med-${idx}`,
                status: "active",
                intent: "order",
                medicationCodeableConcept: { text: row.med_name },
                subject: { reference: `Patient/patient-${userId}` },
                dosageInstruction: [{ text: `${row.dosage} ${row.frequency}` }]
              }
            })),
            ...labsRes.rows.map((lab, idx) => ({
              resource: {
                resourceType: "Observation",
                id: `obs-${idx}`,
                status: "final",
                code: { text: lab.name },
                subject: { reference: `Patient/patient-${userId}` },
                valueQuantity: {
                  value: parseFloat(lab.value) || 0,
                  unit: lab.unit
                }
              }
            }))
          ]
        };

        return JSON.stringify(bundle, null, 2);
      } catch (err) {
        console.error("Error building FHIR bundle:", err);
        throw new Error("Failed to generate FHIR R4 Bundle.");
      }
    },

    getPolypharmacyMatrix: async (_, { userId }) => {
      try {
        const medsRes = await db.query(
          `SELECT DISTINCT m.name 
           FROM prescription_items pi
           JOIN prescriptions p ON pi.prescription_id = p.id
           JOIN medicines m ON pi.medicine_id = m.id
           WHERE p.user_id = $1`,
          [userId]
        );
        let activeMeds = medsRes.rows.map(r => r.name);
        if (activeMeds.length === 0) {
          activeMeds = ["Lisinopril 10mg", "Metformin 500mg", "Atorvastatin 20mg"];
        }

        try {
          const aiResponse = await fetch(`${FAST_API_URL}/api/polypharmacy-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: parseInt(userId), active_medications: activeMeds })
          });
          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            if (aiData.matrix && aiData.matrix.length > 0) {
              return {
                matrix: aiData.matrix,
                medications: activeMeds,
                overallRiskScore: aiData.overallRiskScore || 30,
                pkProfiles: aiData.pkProfiles || []
              };
            }
          }
        } catch (aiErr) {
          console.error("FastAPI Polypharmacy AI call error, falling back:", aiErr);
        }

        const matrix = [];
        for (let i = 0; i < activeMeds.length; i++) {
          for (let j = 0; j < activeMeds.length; j++) {
            const m1 = activeMeds[i];
            const m2 = activeMeds[j];
            if (i === j) {
              matrix.push({
                med1: m1,
                med2: m2,
                severity: "None",
                mechanism: "Monotherapy baseline",
                cypPathways: ["CYP3A4"],
                qtRisk: false,
                organSystem: "Systemic",
                recommendation: "Target therapeutic dose active."
              });
            } else {
              const pairKey = [m1, m2].sort().join(" + ");
              let severity = "Moderate";
              let mechanism = "Concomitant metabolic clearance load";
              let cyp = ["CYP3A4", "CYP2C9"];
              let qt = false;
              let organ = "Hepatic / Renal";
              let rec = "Monitor renal & liver function panel every 3 months.";

              if (pairKey.includes("Warfarin") || pairKey.includes("Aspirin") || pairKey.includes("Ibuprofen")) {
                severity = "High";
                mechanism = "Additive antiplatelet / anticoagulant effect risking gastrointestinal hemorrhage";
                cyp = ["CYP2C9"];
                qt = false;
                organ = "Cardiovascular / Hematologic";
                rec = "Co-administration requires strict INR monitoring and PPI gastroprotection.";
              } else if (pairKey.includes("Lisinopril") && pairKey.includes("Metformin")) {
                severity = "Low";
                mechanism = "Synergistic metabolic & blood pressure regulation";
                cyp = ["Renal Excretion"];
                qt = false;
                organ = "Cardiorenal & Metabolic";
                rec = "Favorable clinical synergy. Monitor fasting blood sugar & eGFR.";
              }

              matrix.push({
                med1: m1,
                med2: m2,
                severity,
                mechanism,
                cypPathways: cyp,
                qtRisk: qt,
                organSystem: organ,
                recommendation: rec
              });
            }
          }
        }

        // Generate PK Half-Life Curves
        const pkProfiles = activeMeds.map(med => {
          let tMax = 2.0;
          let halfLife = 12.0;
          let cMax = 100.0;
          if (med.toLowerCase().includes("lisinopril")) { tMax = 7.0; halfLife = 12.0; cMax = 40.0; }
          if (med.toLowerCase().includes("metformin")) { tMax = 2.5; halfLife = 6.5; cMax = 2.0; }
          if (med.toLowerCase().includes("atorvastatin")) { tMax = 1.5; halfLife = 14.0; cMax = 12.0; }

          const curve = [];
          for (let h = 0; h <= 24; h += 1) {
            let conc = 0;
            if (h > 0) {
              const ka = 1.5 / tMax;
              const ke = 0.693 / halfLife;
              conc = Math.max(0, cMax * (Math.exp(-ke * h) - Math.exp(-ka * h * 2.5)));
            }
            curve.push({
              hour: h,
              concentration: parseFloat(conc.toFixed(2)),
              medName: med,
              isPeak: Math.abs(h - Math.round(tMax)) === 0
            });
          }

          return {
            medName: med,
            dosage: "Standard Rx",
            tMaxHours: tMax,
            halfLifeHours: halfLife,
            cMax: cMax,
            curve
          };
        });

        return {
          matrix,
          medications: activeMeds,
          overallRiskScore: matrix.some(c => c.severity === "High") ? 68 : 25,
          pkProfiles
        };
      } catch (err) {
        console.error("Error computing polypharmacy matrix:", err);
        throw new Error("Failed to compute polypharmacy matrix.");
      }
    },

    getBiomarkerTrends: async (_, { userId }) => {
      try {
        const labsRes = await db.query(
          `SELECT lp.*, lr.uploaded_at 
           FROM lab_parameters lp
           JOIN lab_reports lr ON lp.report_id = lr.id
           WHERE lr.user_id = $1 ORDER BY lr.uploaded_at ASC`,
          [userId]
        );

        // Exclude drug active ingredients / excipients mistaken for lab parameters
        const EXCLUDED_TERMS = [
          "lisinopril", "metformin", "amoxicillin", "ibuprofen", "cellulose", "stearate",
          "silicon", "croscarmellose", "sodium", "calcium phosphate", "hydrochloride", "tablet"
        ];

        const grouped = {};
        for (const row of labsRes.rows) {
          const name = row.name;
          const lower = name.toLowerCase();

          // Skip non-biomarkers (excipients or drug names)
          if (EXCLUDED_TERMS.some(term => lower.includes(term))) {
            continue;
          }

          const minVal = row.normal_min !== null && row.normal_min !== undefined ? parseFloat(row.normal_min) : 70;
          const maxVal = row.normal_max !== null && row.normal_max !== undefined ? parseFloat(row.normal_max) : 100;
          const unitStr = row.unit || '';
          const categoryStr = row.category || 'Clinical Marker';

          if (!grouped[name]) {
            grouped[name] = {
              name: name,
              unit: unitStr,
              category: categoryStr,
              normalMin: minVal,
              normalMax: maxVal,
              history: []
            };
          }
          const numVal = parseFloat(row.value) || 0;
          grouped[name].history.push({
            date: row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString() : 'Today',
            value: numVal,
            status: row.status || (numVal > maxVal ? 'High' : numVal < minVal ? 'Low' : 'Normal')
          });
        }

        const seriesList = Object.values(grouped);

        return seriesList.map(s => {
          const lastVal = s.history[s.history.length - 1].value;
          const firstVal = s.history[0].value;
          let trend = "stable";
          let proj = lastVal;
          if (lastVal < firstVal) {
            trend = "improving";
            proj = parseFloat((lastVal * 0.94).toFixed(1));
          } else if (lastVal > firstVal) {
            trend = "worsening";
            proj = parseFloat((lastVal * 1.06).toFixed(1));
          }

          return {
            ...s,
            projectedValue: proj,
            trendDirection: trend
          };
        });
      } catch (err) {
        console.error("Error fetching biomarker trends:", err);
        return [];
      }
    },
  },

  User: {
    medicalProfile: async (parent) => {
      try {
        const res = await db.query('SELECT * FROM medical_profiles WHERE user_id = $1', [parent.id]);
        if (res.rows.length === 0) return null;
        const profile = res.rows[0];
        return {
          id: profile.id,
          userId: profile.user_id,
          allergies: (typeof profile.allergies === 'string' ? JSON.parse(profile.allergies) : profile.allergies) || [],
          conditions: (typeof profile.conditions === 'string' ? JSON.parse(profile.conditions) : profile.conditions) || [],
          pregnancyStatus: profile.pregnancy_status || false,
          emergencyContacts: JSON.stringify((typeof profile.emergency_contacts === 'string' ? JSON.parse(profile.emergency_contacts) : profile.emergency_contacts) || {}),
        };
      } catch (err) {
        console.error('Error fetching medical profile for user:', err);
        return null;
      }
    },
    prescriptions: async (parent) => {
      try {
        const res = await db.query('SELECT * FROM prescriptions WHERE user_id = $1 ORDER BY uploaded_at DESC', [parent.id]);
        return res.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          uploadedAt: (row.uploaded_at ? new Date(row.uploaded_at).toISOString() : null),
          ocrRaw: row.ocr_raw,
          verified: row.verified,
        }));
      } catch (err) {
        console.error('Error fetching prescriptions for user:', err);
        return [];
      }
    },
    reminders: async (parent) => {
      try {
        const res = await db.query('SELECT * FROM reminders WHERE user_id = $1 ORDER BY scheduled_at ASC', [parent.id]);
        return res.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          medicineId: row.medicine_id,
          scheduledAt: (row.scheduled_at ? new Date(row.scheduled_at).toISOString() : null),
          channel: row.channel,
          status: row.status,
          dosage: row.dosage,
        }));
      } catch (err) {
        console.error('Error fetching reminders for user:', err);
        return [];
      }
    }
  },

  Prescription: {
    items: async (parent) => {
      try {
        const res = await db.query('SELECT * FROM prescription_items WHERE prescription_id = $1', [parent.id]);
        return res.rows.map(row => ({
          id: row.id,
          prescriptionId: row.prescription_id,
          medicineId: row.medicine_id,
          dosage: row.dosage,
          frequency: row.frequency,
          duration: row.duration,
          timing: (typeof row.timing === 'string' ? JSON.parse(row.timing) : row.timing) || [],
        }));
      } catch (err) {
        console.error('Error fetching items for prescription:', err);
        return [];
      }
    }
  },

  PrescriptionItem: {
    medicine: async (parent) => {
      try {
        const res = await db.query('SELECT * FROM medicines WHERE id = $1', [parent.medicineId]);
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return {
          id: row.id,
          name: row.name,
          genericName: row.generic_name,
          chemicalName: row.chemical_name,
          category: row.category,
          mechanism: row.mechanism,
        };
      } catch (err) {
        console.error('Error fetching medicine for item:', err);
        return null;
      }
    }
  },
  Mutation: {
    ...authResolvers,

    createUser: async (_, { name, age, gender, language, reminderChannel }) => {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        const userInsert = await client.query(
          `INSERT INTO users (name, age, gender, language, reminder_channel, created_at) 
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
           RETURNING *`,
          [name, age, gender, language || 'en', reminderChannel || 'Email']
        );
        
        const newUser = userInsert.rows[0];
        
        // Auto-create empty medical profile
        await client.query(
          `INSERT INTO medical_profiles (user_id, allergies, conditions, pregnancy_status, emergency_contacts) 
           VALUES ($1, $2, $3, $4, $5)`,
          [newUser.id, JSON.stringify([]), JSON.stringify([]), false, JSON.stringify({})]
        );
        
        await client.query('COMMIT');
        
        return {
          id: newUser.id,
          name: newUser.name,
          age: newUser.age,
          gender: newUser.gender,
          language: newUser.language,
          reminderChannel: newUser.reminder_channel,
          createdAt: (newUser.created_at ? new Date(newUser.created_at).toISOString() : null),
        };
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in createUser mutation:', err);
        throw new Error('Error creating user profile.');
      } finally {
        client.release();
      }
    },
    
    updateMedicalProfile: async (_, { userId, allergies, conditions, pregnancyStatus, emergencyContacts }) => {
      try {
        const parsedContacts = emergencyContacts ? JSON.parse(emergencyContacts) : {};
        
        const res = await db.query(
          `UPDATE medical_profiles 
           SET allergies = $1, conditions = $2, pregnancy_status = $3, emergency_contacts = $4 
           WHERE user_id = $5 
           RETURNING *`,
          [JSON.stringify(allergies), JSON.stringify(conditions), pregnancyStatus, JSON.stringify(parsedContacts), userId]
        );
        
        if (res.rows.length === 0) {
          // If profile didn't exist somehow, create it
          const insertRes = await db.query(
            `INSERT INTO medical_profiles (user_id, allergies, conditions, pregnancy_status, emergency_contacts) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [userId, JSON.stringify(allergies), JSON.stringify(conditions), pregnancyStatus, JSON.stringify(parsedContacts)]
          );
          const profile = insertRes.rows[0];
          return {
            id: profile.id,
            userId: profile.user_id,
            allergies: (typeof profile.allergies === 'string' ? JSON.parse(profile.allergies) : profile.allergies) || [],
            conditions: (typeof profile.conditions === 'string' ? JSON.parse(profile.conditions) : profile.conditions) || [],
            pregnancyStatus: profile.pregnancy_status || false,
            emergencyContacts: JSON.stringify((typeof profile.emergency_contacts === 'string' ? JSON.parse(profile.emergency_contacts) : profile.emergency_contacts) || {}),
          };
        }
        
        const profile = res.rows[0];
        return {
          id: profile.id,
          userId: profile.user_id,
          allergies: (typeof profile.allergies === 'string' ? JSON.parse(profile.allergies) : profile.allergies) || [],
          conditions: (typeof profile.conditions === 'string' ? JSON.parse(profile.conditions) : profile.conditions) || [],
          pregnancyStatus: profile.pregnancy_status || false,
          emergencyContacts: JSON.stringify((typeof profile.emergency_contacts === 'string' ? JSON.parse(profile.emergency_contacts) : profile.emergency_contacts) || {}),
        };
      } catch (err) {
        console.error('Error updating medical profile:', err);
        throw new Error('Database error updating medical profile.');
      }
    },
    
    uploadPrescription: async (_, { userId, filename, fileContentBase64 }) => {
      try {
        const response = await fetch(`${FAST_API_URL}/api/extract_document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId),
            filename: filename,
            file_content_base64: fileContentBase64 || ""
          }),
        });
        
        if (!response.ok) {
          throw new Error(`AI Backend returned status: ${response.status}`);
        }
        
        const result = await response.json();
        
        return {
          ocrRaw: result.ocrRaw || "Failed to extract text.",
          medications: (result.medications || []).map(med => ({
            drugName: med.drugName || "",
            dosage: med.dosage || "",
            frequency: med.frequency || "",
            duration: med.duration || "",
            confidenceLevel: med.confidenceLevel ? String(med.confidenceLevel) : "80",
            clinicalReasoning: med.clinicalReasoning || ""
          }))
        };
      } catch (err) {
        console.error('Error during OCR prescription processing:', err);
        throw new Error('Failed to process prescription.');
      }
    },
    
    uploadLabReport: async (_, { userId, filename, fileContentBase64 }) => {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        const response = await fetch(`${FAST_API_URL}/api/extract_document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId),
            filename: filename,
            file_content_base64: fileContentBase64 || ""
          }),
        });
        
        if (!response.ok) {
          throw new Error(`AI Backend returned status: ${response.status}`);
        }
        const result = await response.json();
        
        const reportRes = await client.query(
          `INSERT INTO lab_reports (user_id, uploaded_at, ocr_raw)
           VALUES ($1, CURRENT_TIMESTAMP, $2)
           RETURNING *`,
          [userId, result.ocrRaw || `Lab Report Uploaded: ${filename}`]
        );
        const report = reportRes.rows[0];

        const insertedParams = [];
        let params = result.labParameters || [];
        
        // Fallback: If no lab parameters were returned but medications exist, break down medications into chemical parameters
        if (params.length === 0 && result.medications && result.medications.length > 0) {
          params = result.medications.map(med => ({
            name: `${med.drugName} (Active API)`,
            value: parseFloat(med.dosage) || 10,
            unit: med.dosage?.replace(/[0-9.]/g, '').trim() || 'mg',
            normal_min: 0,
            normal_max: 100,
            status: 'Safe',
            severity: 'normal',
            chemical_type: 'Active Pharmaceutical Ingredient',
            category: med.drugName,
            confidence: 95.0,
            risk: `Therapeutic active compound in ${med.drugName}.`,
            recommendation: {
              text: `Administer ${med.dosage} (${med.frequency}).`,
              cautions: 'Monitor for common side effects.',
              bannedIn: 'Permitted under prescription.',
              uses: `Treatment protocol involving ${med.drugName}.`
            }
          }));
        }

        for (const p of params) {
          const paramRes = await client.query(
            `INSERT INTO lab_parameters (report_id, name, value, unit, normal_min, normal_max, status, severity, chemical_type, category, confidence, risk, recommendation)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
              report.id, 
              p.name || 'Unknown', 
              p.value || 0, 
              p.unit || '', 
              p.normal_min || 0, 
              p.normal_max || 0, 
              p.status || 'Safe', 
              p.severity || 'normal', 
              p.chemical_type || '', 
              p.category || 'General', 
              p.confidence || 90.0, 
              p.risk || '', 
              typeof p.recommendation === 'object' ? JSON.stringify(p.recommendation) : (p.recommendation || '{}')
            ]
          );
          const pRow = paramRes.rows[0];
          insertedParams.push({
            id: pRow.id,
            reportId: pRow.report_id,
            name: pRow.name,
            value: pRow.value,
            unit: pRow.unit,
            referenceRange: pRow.reference_range,
            status: pRow.status,
            severity: pRow.severity,
            chemicalType: pRow.chemical_type,
            category: pRow.category,
            normalMin: pRow.normal_min,
            normalMax: pRow.normal_max,
            confidence: pRow.confidence,
            risk: pRow.risk,
            recommendation: pRow.recommendation
          });
        }
        
        await client.query('COMMIT');
        
        return {
          id: report.id,
          userId: report.user_id,
          uploadedAt: (report.uploaded_at ? new Date(report.uploaded_at).toISOString() : null),
          ocrRaw: report.ocr_raw,
          parameters: insertedParams
        };
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error uploading lab report:', err);
        throw new Error('Database error uploading lab report.');
      } finally {
        client.release();
      }
    },
    
    uploadSmartDocument: async (_, { userId, filename, fileContentBase64 }) => {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        const response = await fetch(`${FAST_API_URL}/api/extract_document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId),
            filename: filename,
            file_content_base64: fileContentBase64 || ""
          }),
        });
        
        if (!response.ok) {
          throw new Error(`AI Backend returned status: ${response.status}`);
        }
        
        const result = await response.json();
        
        let savedLabReport = null;
        
        // Save lab parameters OR derived medication parameters automatically
        let params = result.labParameters || [];
        if (params.length === 0 && result.medications && result.medications.length > 0) {
          params = result.medications.map(med => ({
            name: `${med.drugName} (Active API)`,
            value: parseFloat(med.dosage) || 10,
            unit: med.dosage?.replace(/[0-9.]/g, '').trim() || 'mg',
            normal_min: 0,
            normal_max: 100,
            status: 'Safe',
            severity: 'normal',
            chemical_type: 'Active Pharmaceutical Ingredient',
            category: med.drugName,
            confidence: 95.0,
            risk: `Therapeutic active compound in ${med.drugName}.`,
            recommendation: {
              text: `Administer ${med.dosage} (${med.frequency}).`,
              cautions: 'Monitor for common side effects.',
              bannedIn: 'Permitted under prescription.',
              uses: `Treatment protocol involving ${med.drugName}.`
            }
          }));
        }

        if (params.length > 0) {
          const reportRes = await client.query(
            `INSERT INTO lab_reports (user_id, uploaded_at, ocr_raw)
             VALUES ($1, CURRENT_TIMESTAMP, $2)
             RETURNING *`,
            [userId, result.ocrRaw || `Document Uploaded: ${filename}`]
          );
          const report = reportRes.rows[0];

          const insertedParams = [];
          for (const p of params) {
            const paramRes = await client.query(
              `INSERT INTO lab_parameters (report_id, name, value, unit, normal_min, normal_max, status, severity, chemical_type, category, confidence, risk, recommendation)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
               RETURNING *`,
              [
                report.id, 
                p.name || 'Unknown', 
                p.value || 0, 
                p.unit || '', 
                p.normal_min || 0, 
                p.normal_max || 0, 
                p.status || 'Safe', 
                p.severity || 'normal', 
                p.chemical_type || '', 
                p.category || 'General', 
                p.confidence || 90.0, 
                p.risk || '', 
                typeof p.recommendation === 'object' ? JSON.stringify(p.recommendation) : (p.recommendation || '{}')
              ]
            );
            const pRow = paramRes.rows[0];
            insertedParams.push({
              id: pRow.id,
              reportId: pRow.report_id,
              name: pRow.name,
              value: pRow.value,
              unit: pRow.unit,
              referenceRange: pRow.reference_range,
              status: pRow.status,
              severity: pRow.severity,
              chemicalType: pRow.chemical_type,
              category: pRow.category,
              normalMin: pRow.normal_min,
              normalMax: pRow.normal_max,
              confidence: pRow.confidence,
              risk: pRow.risk,
              recommendation: pRow.recommendation
            });
          }
          
          savedLabReport = {
            id: report.id,
            userId: report.user_id,
            uploadedAt: (report.uploaded_at ? new Date(report.uploaded_at).toISOString() : null),
            ocrRaw: report.ocr_raw,
            parameters: insertedParams
          };
        }
        
        await client.query('COMMIT');
        
        return {
          documentType: result.documentType || "Unknown",
          ocrRaw: result.ocrRaw || "",
          medications: (result.medications || []).map(med => ({
            drugName: med.drugName || "",
            dosage: med.dosage || "",
            frequency: med.frequency || "",
            duration: med.duration || "",
            confidenceLevel: med.confidenceLevel ? String(med.confidenceLevel) : "80",
            clinicalReasoning: med.clinicalReasoning || ""
          })),
          labReport: savedLabReport
        };
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during smart document processing:', err);
        throw new Error('Failed to process document.');
      } finally {
        client.release();
      }
    },
    
    
    confirmPrescription: async (_, { userId, items }) => {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        // 1. Fetch user's reminder channel
        const userRes = await client.query('SELECT reminder_channel FROM users WHERE id = $1', [userId]);
        const reminderChannel = (userRes.rows.length > 0 && userRes.rows[0].reminder_channel) ? userRes.rows[0].reminder_channel : 'Email';
        
        // 2. Insert into prescriptions
        const ocrSummary = items.map(it => `${it.drugName} ${it.dosage} (${it.frequency})`).join('\n');
        const presInsert = await client.query(
          `INSERT INTO prescriptions (user_id, uploaded_at, ocr_raw, verified) 
           VALUES ($1, CURRENT_TIMESTAMP, $2, TRUE) 
           RETURNING *`,
          [userId, `User verified prescription:\n${ocrSummary}`]
        );
        const newPres = presInsert.rows[0];
        
        const returnedItems = [];
        
        // 3. Process each prescription item
        for (const item of items) {
          // Check if medicine already exists, if not insert it
          let medRes = await client.query('SELECT * FROM medicines WHERE LOWER(name) = LOWER($1)', [item.drugName.trim()]);
          let medId;
          
          if (medRes.rows.length === 0) {
            // Trigger background search on openFDA via FastAPI later, insert with basic info for now
            const newMedInsert = await client.query(
              `INSERT INTO medicines (name, generic_name, chemical_name, category, mechanism) 
               VALUES ($1, $1, $1, 'General Medicine', 'Pharmacological action pending') 
               RETURNING *`,
              [item.drugName]
            );
            medId = newMedInsert.rows[0].id;
          } else {
            medId = medRes.rows[0].id;
          }
          
          // Insert prescription item
          const itemInsert = await client.query(
            `INSERT INTO prescription_items (prescription_id, medicine_id, dosage, frequency, duration, timing) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [newPres.id, medId, item.dosage, item.frequency, item.duration, JSON.stringify(item.timing)]
          );
          
          returnedItems.push({
            id: itemInsert.rows[0].id,
            prescriptionId: newPres.id,
            medicineId: medId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            timing: item.timing,
          });
          
          // 4. Generate Scheduled Reminders
          // Default duration to 7 days if not parsed or standard number
          let days = parseInt(item.duration.replace(/\D/g, '')) || 7;
          if (days <= 0 || days > 90) days = 7;
          
          const timings = item.timing.length > 0 ? item.timing : ['morning'];
          
          for (let day = 0; day < days; day++) {
            for (const timeOfDay of timings) {
              const scheduledDate = new Date();
              scheduledDate.setDate(scheduledDate.getDate() + day);
              
              // Set hour based on time of day
              if (timeOfDay.toLowerCase().includes('morning') || timeOfDay.toLowerCase().includes('am')) {
                scheduledDate.setHours(9, 0, 0, 0);
              } else if (timeOfDay.toLowerCase().includes('noon') || timeOfDay.toLowerCase().includes('afternoon')) {
                scheduledDate.setHours(13, 0, 0, 0);
              } else if (timeOfDay.toLowerCase().includes('evening') || timeOfDay.toLowerCase().includes('pm')) {
                scheduledDate.setHours(18, 0, 0, 0);
              } else if (timeOfDay.toLowerCase().includes('night') || timeOfDay.toLowerCase().includes('bedtime')) {
                scheduledDate.setHours(21, 30, 0, 0);
              } else {
                scheduledDate.setHours(10, 0, 0, 0); // fallback
              }
              
              await client.query(
                `INSERT INTO reminders (user_id, medicine_id, scheduled_at, channel, status, dosage) 
                 VALUES ($1, $2, $3, $4, 'pending', $5)`,
                [userId, medId, scheduledDate.toISOString(), reminderChannel, item.dosage]
              );
            }
          }
        }
        
        // 5. Automatically create a lab report entry for chemical composition & care plan tracking
        const labReportRes = await client.query(
          `INSERT INTO lab_reports (user_id, uploaded_at, ocr_raw)
           VALUES ($1, CURRENT_TIMESTAMP, $2)
           RETURNING *`,
          [userId, `Verified Prescription Record:\n${ocrSummary}`]
        );
        const report = labReportRes.rows[0];

        for (const item of items) {
          const numVal = parseFloat(item.dosage) || 10;
          const unitVal = item.dosage?.replace(/[0-9.]/g, '').trim() || 'mg';

          await client.query(
            `INSERT INTO lab_parameters (report_id, name, value, unit, normal_min, normal_max, status, severity, chemical_type, category, confidence, risk, recommendation)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              report.id,
              `${item.drugName} (Active API)`,
              numVal,
              unitVal,
              0,
              100,
              'Safe',
              'normal',
              'Active Pharmaceutical Ingredient',
              item.drugName,
              98.0,
              `Therapeutic active compound in ${item.drugName}.`,
              JSON.stringify({
                text: `Administer ${item.dosage} (${item.frequency}).`,
                cautions: 'Monitor for standard drug response and side effects.',
                bannedIn: 'Permitted under prescription.',
                uses: `Clinical treatment protocol for ${item.drugName}.`
              })
            ]
          );
        }

        await client.query('COMMIT');
        
        return {
          id: newPres.id,
          userId: newPres.user_id,
          uploadedAt: (newPres.uploaded_at ? new Date(newPres.uploaded_at).toISOString() : null),
          ocrRaw: newPres.ocr_raw,
          verified: newPres.verified,
          items: returnedItems
        };
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error confirming prescription:', err);
        throw new Error('Error processing prescription confirmation.');
      } finally {
        client.release();
      }
    },
    
    logAdherence: async (_, { reminderId, action, reason }) => {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        // 1. Update reminder status
        const updateRes = await client.query(
          `UPDATE reminders 
           SET status = $1 
           WHERE id = $2 
           RETURNING *`,
          [action.toLowerCase(), reminderId]
        );
        
        if (updateRes.rows.length === 0) {
          throw new Error('Reminder not found.');
        }
        
        // 2. Insert adherence log
        const logRes = await client.query(
          `INSERT INTO adherence_logs (reminder_id, action, reason, logged_at) 
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
           RETURNING *`,
          [reminderId, action.toLowerCase(), reason || '']
        );
        
        await client.query('COMMIT');
        
        const log = logRes.rows[0];
        return {
          id: log.id,
          reminderId: log.reminder_id,
          action: log.action,
          reason: log.reason,
          loggedAt: (log.logged_at ? new Date(log.logged_at).toISOString() : null),
        };
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error logging adherence:', err);
        throw new Error('Database error logging adherence.');
      } finally {
        client.release();
      }
    },
    
    askQuestion: async (_, { userId, sessionId, message }) => {
      try {
        let activeSessionId = sessionId;
        
        // 1. Resolve or create chat session
        if (!activeSessionId) {
          activeSessionId = uuidv4();
          await db.query(
            `INSERT INTO conversation_sessions (id, user_id, started_at, summary) 
             VALUES ($1, $2, CURRENT_TIMESTAMP, $3)`,
            [activeSessionId, userId, `Conversation starting: ${message.slice(0, 30)}...`]
          );
        }
        
        // 2. Fetch User Profile Context
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];
        
        const profileRes = await db.query('SELECT * FROM medical_profiles WHERE user_id = $1', [userId]);
        const profile = profileRes.rows[0] || { allergies: [], conditions: [], pregnancy_status: false };
        
        // Get active medicines list
        const medRes = await db.query(
          `SELECT DISTINCT m.name 
           FROM prescription_items pi 
           JOIN prescriptions p ON pi.prescription_id = p.id 
           JOIN medicines m ON pi.medicine_id = m.id 
           WHERE p.user_id = $1 AND p.verified = TRUE`,
          [userId]
        );
        const activeMeds = medRes.rows.map(row => row.name);
        
        // 3. Load Chat History for Context
        const msgRes = await db.query(
          'SELECT role, content FROM conversation_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 10', 
          [activeSessionId]
        );
        const history = msgRes.rows.map(row => ({ role: row.role, content: row.content }));
        
        // 4. Save User Message
        await db.query(
          `INSERT INTO conversation_messages (session_id, role, content, created_at) 
           VALUES ($1, 'user', $2, CURRENT_TIMESTAMP)`,
          [activeSessionId, message]
        );
        
        // 5. Query Python Agent backend
        let chatResult;
        try {
          const response = await fetch(`${FAST_API_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: parseInt(userId),
              session_id: activeSessionId,
              message: message,
              context: {
                allergies: (typeof profile.allergies === 'string' ? JSON.parse(profile.allergies) : profile.allergies) || [],
                conditions: (typeof profile.conditions === 'string' ? JSON.parse(profile.conditions) : profile.conditions) || [],
                pregnancy_status: profile.pregnancy_status || false,
                active_medications: activeMeds
              },
              history: history
            }),
          });
          
          if (!response.ok) {
            throw new Error(`AI server HTTP status ${response.status}`);
          }
          
          chatResult = await response.json();
        } catch (apiErr) {
          console.warn('FastAPI backend connection failure. Using resilient local guardrail mode:', apiErr);
          
          // Emergency trigger check in Node
          const emergencyKeywords = ['chest pain', 'stroke', 'difficulty breathing', 'anaphylaxis', 'suicidal', 'overdose', 'throat swelling'];
          const isEmergency = emergencyKeywords.some(kw => message.toLowerCase().includes(kw));
          
          if (isEmergency) {
            chatResult = {
              response_text: "⚠️ CRITICAL MEDICAL ALERT: You have mentioned symptoms that could indicate a life-threatening medical emergency. Please IMMEDIATELY call emergency services (e.g. 911 or your local emergency number) or go to the nearest emergency room. Do NOT take any more medication until evaluated by a professional.",
              safety_alert: {
                is_emergency: true,
                warning_details: "Emergency keywords detected in user message."
              },
              citations: ["Emergency clinical protocols"]
            };
          } else {
            chatResult = {
              response_text: "Thank you for contacting the Clinical Consultation Desk. Your clinical profile and inquiry have been recorded. In accordance with clinical safety guidelines, please review any dosage adjustments, symptom variations, or therapy questions with your prescribing healthcare provider. You can also view live medication pricing and bioequivalent options directly in the Pharmacy & Fulfillment portal.",
              safety_alert: {
                is_emergency: false,
                warning_details: "Standard clinical safety guidelines active."
              },
              citations: ["Clinical Safety Protocol Reference", "USP Healthcare Standards"]
            };
          }
        }
        
        // 6. Save Assistant Response
        await db.query(
          `INSERT INTO conversation_messages (session_id, role, content, created_at) 
           VALUES ($1, 'assistant', $2, CURRENT_TIMESTAMP)`,
          [activeSessionId, chatResult.response_text]
        );
        
        // 7. Update Session Summary (Derived professionally from patient inquiry, never error traces)
        const summaryTitle = message.trim().length > 0
          ? (message.trim().slice(0, 48) + (message.trim().length > 48 ? '...' : ''))
          : 'Clinical Pharmacotherapy Consultation';
        await db.query(
          'UPDATE conversation_sessions SET summary = $1 WHERE id = $2',
          [summaryTitle, activeSessionId]
        );
        
        return {
          sessionId: activeSessionId,
          responseText: chatResult.response_text,
          safetyAlert: {
            isEmergency: chatResult.safety_alert.is_emergency,
            warningDetails: chatResult.safety_alert.warning_details,
          },
          citations: chatResult.citations || [],
        };
      } catch (err) {
        console.error('Error during askQuestion mutation:', err);
        throw new Error('GraphQL resolver error answering question.');
      }
    },
    
    logHealthMetrics: async (_, { userId, hydration, sleep, bloodPressure, mood }) => {
      try {
        await db.query(
          `INSERT INTO health_logs (user_id, hydration, sleep, blood_pressure, mood, logged_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
          [userId, hydration, sleep, bloodPressure, mood]
        );
        return true;
      } catch (err) {
        console.error('Error logging health metrics:', err);
        throw new Error('Database error logging health metrics.');
      }
    },
    
    logSymptoms: async (_, { userId, symptoms }) => {
      try {
        await db.query(
          `INSERT INTO symptom_logs (user_id, symptoms, logged_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)`,
          [userId, JSON.stringify(symptoms)]
        );
        return true;
      } catch (err) {
        console.error('Error logging symptoms:', err);
        throw new Error('Database error logging symptoms.');
      }
    },

    logSymptomEvent: async (_, { userId, symptomName, severity, notes }) => {
      try {
        const symptomsJson = JSON.stringify([symptomName]);
        const loggedAt = new Date().toISOString();
        const res = await db.query(
          `INSERT INTO symptom_logs (user_id, symptoms, logged_at) VALUES ($1, $2, $3) RETURNING *`,
          [userId, symptomsJson, loggedAt]
        );
        const row = res.rows[0];
        return {
          id: row.id,
          userId: row.user_id,
          symptoms: [symptomName],
          loggedAt: loggedAt
        };
      } catch (err) {
        console.error('Error logging symptom event:', err);
        throw new Error('Database error logging symptom event.');
      }
    },
    
    createCommunityPost: async (_, { content, tags }) => {
      try {
        // Mock author for now since we don't pass userId in community post
        const res = await db.query(
          `INSERT INTO community_posts (author, content, tags, likes, comments, created_at)
           VALUES ($1, $2, $3, 0, 0, CURRENT_TIMESTAMP)
           RETURNING id, author, content, tags, likes, comments, created_at`,
          ['WellnessWarrior', content, JSON.stringify(tags)]
        );
        const row = res.rows[0];
        return {
          id: row.id,
          author: row.author,
          content: row.content,
          tags: JSON.parse(row.tags),
          likes: row.likes,
          comments: row.comments,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : null
        };
      } catch (err) {
        console.error('Error creating community post:', err);
        throw new Error('Database error creating community post.');
      }
    },
    
    checkFoodInteraction: async (_, { userId, foodItem }) => {
      // Mock interaction logic for Grapefruit & Atorvastatin
      if (foodItem.toLowerCase().includes('grapefruit')) {
        const presRes = await db.query(
          `SELECT m.name 
           FROM prescription_items pi
           JOIN medicines m ON pi.medicine_id = m.id
           JOIN prescriptions p ON pi.prescription_id = p.id
           WHERE p.user_id = $1`,
          [userId]
        );
        
        const meds = presRes.rows.map(r => r.name.toLowerCase());
        const hasAtorvastatin = meds.some(m => m.includes('atorvastatin'));
        
        if (hasAtorvastatin) {
          return `Warning: You logged a meal containing Grapefruit, which interacts with your Atorvastatin prescription. Please avoid grapefruit products to prevent potential muscle toxicity.`;
        }
      }
      return null;
    },
    
    generateCarePlanForReport: async (_, { reportId }) => {
      try {
        const reportRes = await db.query('SELECT * FROM lab_reports WHERE id = $1', [reportId]);
        if (reportRes.rows.length === 0) {
          throw new Error('Lab report not found.');
        }
        const report = reportRes.rows[0];
        const userId = report.user_id;
        
        // Fetch User profile (allergies, conditions)
        const profileRes = await db.query('SELECT allergies, conditions FROM medical_profiles WHERE user_id = $1', [userId]);
        let allergies = [];
        let conditions = [];
        if (profileRes.rows.length > 0) {
          const prof = profileRes.rows[0];
          allergies = typeof prof.allergies === 'string' ? JSON.parse(prof.allergies) : prof.allergies;
          conditions = typeof prof.conditions === 'string' ? JSON.parse(prof.conditions) : prof.conditions;
        }
        
        // Fetch Active Medications
        const medsRes = await db.query(
          `SELECT m.name as med_name 
           FROM reminders r 
           LEFT JOIN medicines m ON r.medicine_id = m.id 
           WHERE r.user_id = $1`, 
          [userId]
        );
        const activeMeds = medsRes.rows.map(r => r.med_name);
        
        // Use the selected lab report's OCR data
        const labResults = report.ocr_raw || "No extracted text.";

        // Hit the python AI backend
        const response = await fetch(`${FAST_API_URL}/api/generate_care_plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId),
            active_medications: activeMeds,
            allergies: allergies || [],
            conditions: conditions || [],
            lab_results: labResults
          }),
        });
        
        if (!response.ok) {
          throw new Error(`AI Backend returned status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Default values in case AI misses anything
        const carePlan = {
          autoAlerts: result.autoAlerts || [],
          warningSigns: result.warningSigns || [],
          dietProtocol: result.dietProtocol || [],
          followUpMonitoring: result.followUpMonitoring || [],
          exerciseMovement: result.exerciseMovement || [],
          sleepRecovery: result.sleepRecovery || [],
          mentalEmotional: result.mentalEmotional || [],
          supplementOtc: result.supplementOtc || []
        };
        
        // Save to Database
        await db.query(
          'UPDATE lab_reports SET care_plan_json = $1 WHERE id = $2',
          [JSON.stringify(carePlan), reportId]
        );
        
        return carePlan;
      } catch (err) {
        console.error('Error generating care plan for report:', err);
        throw new Error('Failed to generate Care Plan.');
      }
    }
  }
};

module.exports = resolvers;
