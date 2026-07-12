# MedGraph AI

**A production-grade, polyglot, multi-agent medication intelligence platform.**

MedGraph AI helps patients understand their prescriptions, catch dangerous drug interactions before they happen, receive timely medication reminders, and manage their health profiles — all powered by a LangGraph multi-agent orchestration engine backed by real pharmaceutical APIs.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
  - [1. Python Agent (LangGraph + FastAPI)](#1-python-agent-langgraph--fastapi)
  - [2. Node.js GraphQL Gateway](#2-nodejs-graphql-gateway)
  - [3. Go Reminder Service](#3-go-reminder-service)
  - [4. React Frontend](#4-react-frontend)
- [GraphQL API Reference](#graphql-api-reference)
- [Agent Pipeline Deep Dive](#agent-pipeline-deep-dive)
- [Safety Layer](#safety-layer)
- [Database Schema](#database-schema)
- [Platform Boundaries & Disclaimer](#platform-boundaries--disclaimer)

---

## Architecture Overview

MedGraph AI is a **polyglot microservice system** composed of four independently deployable services that communicate over HTTP and share a common database.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React 19 + Vite)                       │
│                         localhost:5173 — Tailwind CSS                       │
│    Landing Page → Login → Dashboard / AI Chat / Upload Rx / Profile        │
└────────────────────────┬───────────────────────────┬────────────────────────┘
                         │ GraphQL (POST /graphql)   │
                         ▼                           │
┌────────────────────────────────────────────┐       │
│   GRAPHQL GATEWAY (Node.js + Apollo v4)    │       │
│              localhost:4000                 │       │
│                                            │       │
│  Queries:  getUser, getReminders,          │       │
│            getPrescriptions, getChatSessions│      │
│  Mutations: createUser, askQuestion,       │       │
│            uploadPrescription, logAdherence │       │
│                                            │       │
│  ┌──────────────────────────────────────┐  │       │
│  │  SQLite (dev) / PostgreSQL (prod)    │  │       │
│  │           medgraph.db                │  │       │
│  └──────────────────────────────────────┘  │       │
└──────────────┬─────────────────────────────┘       │
               │ HTTP (POST /api/chat,               │
               │        POST /api/ocr)               │
               ▼                                     │
┌────────────────────────────────────────────┐       │
│   PYTHON AGENT (FastAPI + LangGraph)       │       │
│              localhost:8000                 │       │
│                                            │       │
│  ┌─ classifier ─┐                          │       │
│  │               ├─▶ general_query ──┐     │       │
│  │  StateGraph   ├─▶ prescription ───┤     │       │
│  │               ├─▶ lab_report ─────┤     │       │
│  └───────────────┘                   │     │       │
│                              safety_layer  │       │
│                                  │         │       │
│  Tools: OpenFDA, ChemSpider,     ▼         │       │
│         Tavily, Tesseract OCR   END        │       │
└────────────────────────────────────────────┘       │
                                                     │
┌────────────────────────────────────────────┐       │
│   REMINDER SERVICE (Go 1.25)               │       │
│        Background daemon                   │       │
│                                            │       │
│  • Polls DB every 5s for pending reminders │       │
│  • Dispatches notifications per channel    │       │
│  • Auto-reconnects on DB failure           │       │
│  • Shares medgraph.db with Gateway         │       │
└────────────────────────────────────────────┘
```

---

## Project Structure

```
med/
├── agent/                          # Python — LangGraph multi-agent engine
│   ├── app.py                      #   FastAPI server (port 8000)
│   ├── graph.py                    #   LangGraph StateGraph definition
│   ├── brain.py                    #   Agent brain / memory logic
│   ├── tools/                      #   Specialized agent tools
│   │   ├── classifier.py           #     Input classification (text/image/lab)
│   │   ├── medicine.py             #     OpenFDA drug lookup
│   │   ├── chemical.py             #     ChemSpider chemical profiling
│   │   ├── checker.py              #     Live drug interaction safety checker
│   │   ├── internet.py             #     Tavily web search integration
│   │   ├── prescription.py         #     Prescription parsing logic
│   │   ├── ocr.py                  #     Tesseract OCR engine wrapper
│   │   └── media.py                #     Media/file processing utilities
│   ├── model/                      #   LLM configuration
│   ├── schema/                     #   Pydantic schemas
│   └── upload/                     #   Uploaded file staging directory
│
├── backend-node/                   # Node.js — GraphQL API Gateway
│   ├── server.js                   #   Express + Apollo Server (port 4000)
│   ├── schema.js                   #   GraphQL type definitions (SDL)
│   ├── resolvers.js                #   All query/mutation resolvers
│   └── db.js                       #   Database adapter (SQLite dev / PG prod)
│
├── reminder-service/               # Go — Background reminder scheduler
│   ├── main.go                     #   Ticker-based polling daemon
│   ├── go.mod                      #   Go module dependencies
│   └── main_test.go                #   Unit tests
│
├── frontend/                       # React 19 — Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx                 #   Root routing (public + protected)
│   │   ├── main.jsx                #   React entry point
│   │   ├── index.css               #   Tailwind directives
│   │   ├── context/
│   │   │   └── GlobalContext.jsx   #   Global state (auth, data, actions)
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx      #   App shell (sidebar + bottom nav)
│   │   └── pages/
│   │       ├── LandingPage.jsx     #   Public landing page
│   │       ├── LoginPage.jsx       #   Authentication page
│   │       ├── Dashboard.jsx       #   Patient overview & adherence
│   │       ├── ChatCompanion.jsx   #   AI drug companion chat
│   │       ├── UploadRx.jsx        #   OCR prescription upload
│   │       ├── HealthProfile.jsx   #   Allergies, conditions, settings
│   │       └── ...                 #   UserGuide, Updates, Privacy, Terms
│   ├── tailwind.config.js          #   Custom Stitch design system tokens
│   └── postcss.config.js           #   PostCSS pipeline
│
├── .env                            # Shared environment variables
├── medgraph.db                     # SQLite database (development)
├── pyproject.toml                  # Python project metadata (uv)
├── requirements.txt                # Python dependencies (pip fallback)
└── README.md                       # ← You are here
```

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **AI Orchestration** | Python 3.12+, LangGraph, LangChain | Multi-agent graph workflow with stateful branching |
| **LLM Provider** | Google Gemini 3.5 Flash | Drug identification, response synthesis, OCR reasoning |
| **API Gateway** | Node.js, Express, Apollo Server v4 | GraphQL schema, resolvers, and database access |
| **Reminder Daemon** | Go 1.25 | High-performance background ticker for medication alerts |
| **Frontend** | React 19, Vite 8, Tailwind CSS 3 | Responsive SPA with glassmorphism UI |
| **Database (Dev)** | SQLite 3 via `medgraph.db` | Zero-config local development |
| **Database (Prod)** | PostgreSQL 16 | Production-grade relational storage |
| **Drug Data APIs** | OpenFDA, ChemSpider, Tavily | Real pharmaceutical and chemical data sources |
| **OCR** | Tesseract (via pytesseract) | Handwritten/typed prescription extraction |

---

## Prerequisites

Ensure the following are installed on your machine:

- **Python** ≥ 3.12 (with `uv` or `pip`)
- **Node.js** ≥ 18 (with `npm`)
- **Go** ≥ 1.25
- **Tesseract OCR** — [Installation guide](https://github.com/tesseract-ocr/tesseract#installing-tesseract)
  - Windows: `choco install tesseract` or download the [UB Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki)
  - macOS: `brew install tesseract`
  - Linux: `sudo apt install tesseract-ocr`

---

## Environment Configuration

Create a `.env` file in the project root (one is already provided). Required variables:

```env
# — AI & Search APIs —
GOOGLE_API_KEY=<your-google-gemini-api-key>
TAVILY_API_KEY=<your-tavily-search-api-key>
OPENFDA_API_KEY=<your-openfda-api-key>
CHEMSPIDER_API_KEY=<your-chemspider-api-key>

# — Database & Ports —
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medgraph_db
GRAPHQL_PORT=4000
FAST_API_URL=http://localhost:8000
NODE_ENV=development    # "development" = SQLite, "production" = PostgreSQL
APP_ENV=development     # Used by Go reminder service
```

> **Note:** In `development` mode, all services use the shared `medgraph.db` SQLite file. No PostgreSQL setup is needed for local development.

---

## Getting Started

You need to start **four services** in separate terminals. The order matters for the first run.

### 1. Python Agent (LangGraph + FastAPI)

This is the AI brain — the LangGraph multi-agent pipeline exposed via FastAPI.

```bash
# From project root
cd med

# Create virtual environment and install dependencies
uv sync                  # or: python -m venv .venv && pip install -r requirements.txt

# Activate the virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Start the FastAPI server
python -m uvicorn agent.app:app --host 0.0.0.0 --port 8000 --reload
```

The agent server will be available at **http://localhost:8000**.

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat` | POST | Send a message through the LangGraph pipeline |
| `/api/ocr` | POST | Upload a prescription image for OCR extraction |
| `/health` | GET | Health check |

---

### 2. Node.js GraphQL Gateway

This is the central API layer. The frontend talks exclusively to this server. It also initializes the SQLite database schema on first run.

```bash
# From project root
cd backend-node

# Install dependencies
npm install

# Start the server
node server.js
```

The GraphQL gateway will be available at **http://localhost:4000/graphql**.  
Apollo Studio sandbox is accessible at **http://localhost:4000/graphql** in your browser.

---

### 3. Go Reminder Service

A background daemon that polls the database every 5 seconds for pending medication reminders and dispatches notifications.

```bash
# From project root
cd reminder-service

# Download Go modules
go mod download

# Build and run
go run main.go
```

You will see medication alert dispatches printed to the console when reminders are due:

```
==================================================
🚨 MEDICATION ALERT DISPATCHED
📅 Time:     2026-07-11 09:00:05
👤 Patient ID: 1
💊 Medicine:  Lisinopril 10mg (ID: 3)
📲 Channel:   Telegram
💬 Message:   "Hi! It is time to take your Lisinopril 10mg. Please log in to mark it as Taken."
==================================================
```

---

### 4. React Frontend

The user-facing interface. Requires the GraphQL gateway (port 4000) to be running.

```bash
# From project root
cd frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

Open **http://localhost:5173** in your browser. You'll see the landing page.  
Click **"Get Started"** or **"Demo Account"** on the login page to enter the dashboard.

---

## GraphQL API Reference

### Queries

| Query | Arguments | Returns | Description |
|---|---|---|---|
| `getUser` | `id: ID!` | `User` | Fetch a user and their medical profile |
| `getPrescriptions` | `userId: ID!` | `[Prescription!]!` | List all prescriptions for a user |
| `getReminders` | `userId: ID!` | `[Reminder!]!` | List all medication reminders |
| `getChatSessions` | `userId: ID!` | `[ChatSession!]!` | List all AI chat sessions |
| `getChatMessages` | `sessionId: ID!` | `[ChatMessage!]!` | Fetch messages in a chat session |

### Mutations

| Mutation | Description |
|---|---|
| `createUser(name, age, gender, language, reminderChannel)` | Register a new patient |
| `updateMedicalProfile(userId, allergies, conditions, pregnancyStatus, emergencyContacts)` | Update allergies, conditions, and pregnancy flag |
| `uploadPrescription(userId, filename, fileContentBase64)` | Send a prescription image for OCR extraction (proxied to the Python agent) |
| `confirmPrescription(userId, items)` | Confirm parsed medications and auto-create reminder schedules |
| `logAdherence(reminderId, action, reason)` | Mark a reminder as `taken`, `skipped`, or `missed` |
| `askQuestion(userId, sessionId, message)` | Send a query to the LangGraph AI pipeline (proxied to the Python agent) |

### Key Types

```graphql
type User {
  id: ID!
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
  allergies: [String!]!
  conditions: [String!]!
  pregnancyStatus: Boolean!
  emergencyContacts: String
}

type ChatResponse {
  sessionId: ID!
  responseText: String!
  safetyAlert: SafetyAlert!
  citations: [String!]!
}

type SafetyAlert {
  isEmergency: Boolean!
  warningDetails: String
}
```

---

## Agent Pipeline Deep Dive

The Python agent uses **LangGraph's `StateGraph`** to route every user message through a structured, deterministic pipeline:

```
         ┌──────────────┐
         │  classifier   │   Determines input type via LLM
         └──────┬───────┘
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
 ┌──────────┐ ┌──────────┐ ┌──────────┐
 │ general  │ │ prescrip │ │   lab    │
 │  query   │ │  upload  │ │  report  │
 └────┬─────┘ └────┬─────┘ └────┬─────┘
      │             │            │
      └──────┬──────┘────────────┘
             ▼
      ┌──────────────┐
      │ safety_layer  │   Emergency detection + disclaimers
      └──────┬───────┘
             ▼
            END
```

### Agent State

Every invocation carries a typed `AgentState` dictionary through the graph:

| Field | Type | Purpose |
|---|---|---|
| `user_id` | `int` | Patient identifier |
| `message` | `str` | Raw user input |
| `context` | `dict` | Allergies, conditions, pregnancy status, active meds |
| `history` | `list` | Conversation history for continuity |
| `route` | `str` | Classification result: `general_query`, `prescription_upload`, `lab_report` |
| `citations` | `list[str]` | Data sources referenced (OpenFDA, ChemSpider, etc.) |
| `is_emergency` | `bool` | Whether emergency keywords were detected |
| `final_response` | `str` | Sanitized output sent back to the user |

### Tools Used

| Tool | Source API | Purpose |
|---|---|---|
| `InputClassifier` | Google Gemini | Classify input as text query, prescription, or lab report |
| `MedicineLookupTool` | OpenFDA | Fetch brand names, generics, manufacturers, forms |
| `ChemicalProfilingTool` | ChemSpider | Retrieve molecular formulas, SMILES, and InChI keys |
| `LiveSafetyChecker` | OpenFDA Adverse Events | Check for known adverse reactions and interactions |
| `TavilySearcher` | Tavily Search API | Web search fallback for supplementary medical context |
| `PrescriptionReader` | Google Gemini | LLM-based extraction of drug names from OCR text |
| `ocr` | Tesseract | Image-to-text extraction for prescription uploads |

---

## Safety Layer

The safety layer is a **mandatory, non-bypassable** graph node that inspects every response before it reaches the user.

### Emergency Short-Circuiting

If the user's message contains any of the following keywords, the normal pipeline is **immediately aborted** and an emergency alert is returned:

> `chest pain`, `stroke`, `anaphylaxis`, `throat swelling`, `suicidal`, `self-harm`, `overdose`, `difficulty breathing`, `numbness`, `severe head ache`

The response is replaced with:

```
⚠️ CRITICAL MEDICAL ALERT: The symptoms or query you provided could indicate a
severe, life-threatening emergency. Please IMMEDIATELY call emergency services
(like 911 or your local health dispatch line) or proceed to the nearest hospital
emergency room.
```

### Output Sanitization

For standard responses:
- Clinical diagnoses are blocked — phrases like "You suffer from" are rewritten.
- A medical disclaimer is appended to every response.
- Every data point must map back to a verified API citation.

---

## Database Schema

The SQLite (dev) / PostgreSQL (prod) database contains the following tables:

| Table | Purpose |
|---|---|
| `users` | Patient demographics (name, age, gender, language, reminder channel) |
| `medical_profiles` | Per-user allergies, chronic conditions, pregnancy status |
| `medicines` | Drug registry (name, generic name, chemical name, category, mechanism) |
| `prescriptions` | Uploaded prescription records with raw OCR text |
| `prescription_items` | Individual medications extracted from a prescription (dosage, frequency, timing) |
| `reminders` | Scheduled medication alerts (scheduled_at, channel, status) |
| `adherence_logs` | Taken/skipped/missed actions logged against reminders |
| `chat_sessions` | AI conversation sessions per user |
| `chat_messages` | Individual messages within a chat session (role, content, timestamp) |
| `lab_reports` | Uploaded lab report records |
| `lab_parameters` | Extracted lab values (name, value, unit, SI value, reference range) |

---

## Platform Boundaries & Disclaimer

> **MedGraph AI is a medication companion, NOT a medical practitioner.**

- ❌ Does not diagnose diseases
- ❌ Does not alter prescribed dosages  
- ❌ Does not replace licensed clinical advice
- ❌ Does not guarantee complete coverage of all global drug interaction exceptions
- ✅ Provides information sourced from verified pharmaceutical databases
- ✅ Flags potential interactions and safety concerns
- ✅ Always recommends consulting a healthcare professional

---

## License

This project is developed as a personal/academic initiative. All medical data is sourced from publicly available pharmaceutical APIs (OpenFDA, ChemSpider). No real patient data is stored or processed.