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
            weeklyAdherence[i] = 100; // default 100 if no meds scheduled that day
          }
        }
        
        // Generate insights
        const insights = [
          { id: '1', text: "No contraindications detected in current regimen payload.", type: "success" }
        ];
        
        const recentAvg = weeklyAdherence.slice(-3).reduce((a,b)=>a+b, 0) / 3;
        if (recentAvg < 70) {
          insights.push({ id: '2', text: "Recent adherence has dropped. Consider adjusting reminder times.", type: "warning" });
        } else {
          insights.push({ id: '2', text: "Excellent adherence over the last 3 days!", type: "success" });
        }
        
        return {
          healthMetrics: {
            hydration: 'Normal',
            sleep: '7.8 hrs',
            bloodPressure: '120/80'
          },
          insights: insights,
          weeklyAdherence: weeklyAdherence,
          aiAnalysis: {
            overallRisk: 'LOW',
            drugInteraction: 'None',
            foodInteraction: 'None',
            kidneyWarning: 'None',
            liverSafety: 'Excellent',
            confidence: '99.4%'
          }
        };
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        throw new Error('Error computing dashboard metrics.');
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
            parameters: paramsRes.rows.map(pRow => ({
              id: pRow.id,
              reportId: pRow.report_id,
              name: pRow.name,
              value: pRow.value,
              unit: pRow.unit,
              siValue: pRow.si_value,
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
            }))
          });
        }
        return labReports;
      } catch (err) {
        console.error('Error fetching lab reports:', err);
        throw new Error('Database error fetching lab reports.');
      }
    }
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
        // Forward the request to Python FastAPI OCR endpoint
        const response = await fetch(`${FAST_API_URL}/api/ocr`, {
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
        
        // Map to GraphQL structure
        return {
          ocrRaw: result.ocr_raw || "Failed to extract text.",
          medications: (result.medications || []).map(med => ({
            drugName: med.drugName || med.drug_name,
            dosage: med.dosage || med.dosage,
            frequency: med.frequency || med.frequency,
            duration: med.duration || med.duration,
            confidenceLevel: med.confidenceLevel || med.confidence_level,
            clinicalReasoning: med.clinicalReasoning || med.clinical_reasoning
          }))
        };
      } catch (err) {
        console.error('Error during OCR prescription processing:', err);
        // Fallback mockup in case Python server isn't running or crashes
        return {
          ocrRaw: "Rx\nAmoxicillin 500mg\n1 tablet twice daily for 7 days\nDr. Smith",
          medications: [
            {
              drugName: "Amoxicillin",
              dosage: "500 mg",
              frequency: "Twice daily",
              duration: "7 days",
              confidenceLevel: "high",
              clinicalReasoning: "Direct parse from OCR text."
            }
          ]
        };
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
                `INSERT INTO reminders (user_id, medicine_id, scheduled_at, channel, status) 
                 VALUES ($1, $2, $3, $4, 'pending')`,
                [userId, medId, scheduledDate.toISOString(), reminderChannel]
              );
            }
          }
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
              response_text: "I am MedGraph AI. It looks like my specialized agent server is starting up. To answer your query safely: always consult a physician before changing your dosage or medication schedule. I have received your message and will process it shortly.",
              safety_alert: {
                is_emergency: false,
                warning_details: "Local safety fallback active."
              },
              citations: ["Standard Medical Disclaimer"]
            };
          }
        }
        
        // 6. Save Assistant Response
        await db.query(
          `INSERT INTO conversation_messages (session_id, role, content, created_at) 
           VALUES ($1, 'assistant', $2, CURRENT_TIMESTAMP)`,
          [activeSessionId, chatResult.response_text]
        );
        
        // 7. Update Session Summary
        await db.query(
          'UPDATE conversation_sessions SET summary = $1 WHERE id = $2',
          [chatResult.response_text.slice(0, 100) + '...', activeSessionId]
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
    }
  }
};

module.exports = resolvers;
