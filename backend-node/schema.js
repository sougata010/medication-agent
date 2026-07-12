const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    age: Int
    gender: String
    language: String
    reminderChannel: String
    createdAt: String!
    medicalProfile: MedicalProfile
    prescriptions: [Prescription!]!
    reminders: [Reminder!]!
  }

  type MedicalProfile {
    id: ID!
    userId: ID!
    allergies: [String!]!
    conditions: [String!]!
    pregnancyStatus: Boolean!
    emergencyContacts: String
  }

  type Medicine {
    id: ID!
    name: String!
    genericName: String
    chemicalName: String
    category: String
    mechanism: String
  }

  type Prescription {
    id: ID!
    userId: ID!
    uploadedAt: String!
    ocrRaw: String
    verified: Boolean!
    items: [PrescriptionItem!]!
  }

  type PrescriptionItem {
    id: ID!
    prescriptionId: ID!
    medicineId: ID!
    dosage: String!
    frequency: String!
    duration: String
    timing: [String!]!
    medicine: Medicine
  }

  type LabReport {
    id: ID!
    userId: ID!
    uploadedAt: String!
    ocrRaw: String
    parameters: [LabParameter!]!
  }

  type LabParameter {
    id: ID!
    reportId: ID!
    name: String!
    value: Float!
    unit: String!
    siValue: Float
    referenceRange: String
    status: String
    severity: String
    chemicalType: String
    category: String
    normalMin: Float
    normalMax: Float
    confidence: Float
    risk: String
    recommendation: String
  }

  type HealthMetrics {
    hydration: String!
    sleep: String!
    bloodPressure: String!
  }

  type Insight {
    id: ID!
    text: String!
    type: String!
  }

  type AIAnalysis {
    overallRisk: String!
    drugInteraction: String!
    foodInteraction: String!
    kidneyWarning: String!
    liverSafety: String!
    confidence: String!
  }

  type DashboardMetrics {
    healthMetrics: HealthMetrics!
    insights: [Insight!]!
    weeklyAdherence: [Int!]!
    aiAnalysis: AIAnalysis!
  }

  type Reminder {
    id: ID!
    userId: ID!
    medicineId: ID!
    scheduledAt: String!
    channel: String!
    status: String!
    medicine: Medicine
  }

  type AdherenceLog {
    id: ID!
    reminderId: ID!
    action: String!
    reason: String
    loggedAt: String!
  }

  type ChatSession {
    id: ID!
    userId: ID!
    startedAt: String!
    summary: String
    messages: [ChatMessage!]!
  }

  type ChatMessage {
    id: ID!
    sessionId: ID!
    role: String!
    content: String!
    createdAt: String!
  }

  type SafetyAlert {
    isEmergency: Boolean!
    warningDetails: String
  }

  type ChatResponse {
    sessionId: ID!
    responseText: String!
    safetyAlert: SafetyAlert!
    citations: [String!]!
  }

  type PrescriptionItemExtraction {
    drugName: String!
    dosage: String!
    frequency: String!
    duration: String!
    confidenceLevel: String!
    clinicalReasoning: String
  }

  type PrescriptionExtraction {
    ocrRaw: String!
    medications: [PrescriptionItemExtraction!]!
  }

  input ConfirmPrescriptionItemInput {
    drugName: String!
    dosage: String!
    frequency: String!
    duration: String!
    timing: [String!]!
  }

  type Query {
    getUser(id: ID!): User
    getPrescriptions(userId: ID!): [Prescription!]!
    getReminders(userId: ID!): [Reminder!]!
    getChatSessions(userId: ID!): [ChatSession!]!
    getChatMessages(sessionId: ID!): [ChatMessage!]!
    getDashboardMetrics(userId: ID!): DashboardMetrics!
    getLabReports(userId: ID!): [LabReport!]!
  }

  type AuthPayload {
    token: String
    user: User
    message: String
  }

  type PasskeyOptions {
    challenge: String!
    optionsJson: String!
  }

  type Mutation {
    # Auth Mutations
    register(email: String!, password: String!, name: String!): AuthPayload!
    verifyOTP(email: String!, otp: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    googleLogin(token: String!): AuthPayload!
    generatePasskeyRegistrationOptions(email: String!): PasskeyOptions!
    verifyPasskeyRegistration(email: String!, responseJson: String!): AuthPayload!
    generatePasskeyAuthenticationOptions(email: String!): PasskeyOptions!
    verifyPasskeyAuthentication(email: String!, responseJson: String!): AuthPayload!
    requestPasswordReset(email: String!): AuthPayload!
    resetPassword(email: String!, otp: String!, newPassword: String!): AuthPayload!

    # Existing Mutations
    createUser(
      name: String!
      age: Int
      gender: String
      language: String
      reminderChannel: String
    ): User!
    
    updateMedicalProfile(
      userId: ID!
      allergies: [String!]!
      conditions: [String!]!
      pregnancyStatus: Boolean!
      emergencyContacts: String
    ): MedicalProfile!
    
    uploadPrescription(
      userId: ID!
      filename: String!
      fileContentBase64: String
    ): PrescriptionExtraction!
    
    confirmPrescription(
      userId: ID!
      items: [ConfirmPrescriptionItemInput!]!
    ): Prescription!
    
    logAdherence(
      reminderId: ID!
      action: String!
      reason: String
    ): AdherenceLog!
    
    askQuestion(
      userId: ID!
      sessionId: String
      message: String!
    ): ChatResponse!
  }
`;

module.exports = typeDefs;
