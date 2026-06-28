# MedGraph AI — Technical Blueprint & Architecture Spec

**System Version:** 1.0  
**Release Date:** June 2025[cite: 2]  
**Target Environment:** Project Workspace  

---

## 1. Executive Summary

MedGraph AI is a production-grade, multi-agent medication intelligence platform built on LangGraph[cite: 2]. It is designed to help patients understand their prescriptions, check for drug interactions, receive timely medication reminders, and manage their medication history[cite: 2].

* **Core Capabilities:** Explains prescriptions and medicine purpose in plain language[cite: 2]; checks drug-drug, drug-food, and drug-alcohol interactions[cite: 2]; schedules and tracks medication reminders across channels[cite: 2]; and reads prescriptions and lab reports via OCR[cite: 2].
* **Platform Boundaries:** The platform is a medication companion, not a medical practitioner[cite: 2]. It does not diagnose diseases[cite: 2], alter prescribed dosages[cite: 2], replace licensed clinical advice[cite: 2], or guarantee complete coverage of all global drug interaction exceptions[cite: 2].

---

## 2. System Architecture Overview

The platform is organized into four separate logical layers so that each layer can be isolated, updated, and scaled independently[cite: 2].

### Architecture Layer Layout
* **Input Layer:** Accepts user text, voice notes, image uploads, PDFs, or raw barcode scans and passes them to the central routing engine[cite: 2].
* **Orchestration Layer:** Managed entirely by LangGraph, this layer tracks state variables, maintains temporary conversation memory, and routes parameters to agents[cite: 2].
* **Agent Layer:** Houses parallel, specialized workers (including OCR, Drug Interaction checkers, and Pharmacy stock agents)[cite: 2].
* **Output Layer:** Renders the final processed medical reports, triggers Telegram/Push reminder alerts, and handles downstream pharmacy orders[cite: 2].

---

## 3. LangGraph Node Flow & Processing Pipeline

Every user input passes through a structured, predictable graph execution lifecycle to ensure maximum safety and accuracy[cite: 2].

### Operational Lifecycle Flow
1. **Input Classification:** Raw input is routed based on whether it is a direct chat text, a prescription image, a lab report PDF, or a voice memo[cite: 2].
2. **Context Memory Loading:** The system pulls user-declared details, allergy histories, and active prescription records before parsing the new request[cite: 2].
3. **Branch Assignment:** The orchestrator splits tasks based on input type:
   * **General Query:** Queries core drug and chemical database APIs[cite: 2].
   * **Prescription Upload:** Triggers OCR models to identify brand text, active components, dosages, and timeline instructions[cite: 2].
   * **Lab Report:** Parses raw numerical metrics and updates structural health profile contexts[cite: 2].
4. **Parallel Drug Analysis Fan-Out:** Extracted items undergo concurrent checks for drug-drug interactions, food restrictions, alcohol warnings, and organ safety profiles[cite: 2].
5. **Aggregator & PDF Generation:** Results are unified into a finalized report with clear database and medical guideline citations[cite: 2].

---

## 4. Memory Architecture

The platform uses a balanced, three-tier memory model to optimize performance, semantic search capability, and session persistence[cite: 2]:

* **Short-Term Memory (Redis Cache):** Manages immediate conversation state, currently active uploaded prescription images, and in-flight API payloads[cite: 2].
* **Long-Term Memory (PostgreSQL Engine):** Stores structural relational tables including user demographic profiles, allergy constraints, chronic medical history, active reminder timetables, and historical adherence tracking metrics[cite: 2].
* **Vector Memory (pgvector Extension):** Handles deep semantic search routines across past user Q&A threads, long-term context summaries, and chunked medical regulatory guidelines[cite: 2].

---

## 5. Structured Technology Stack

* **Backend Core:** Developed with Python 3.11+, FastAPI (for asynchronous, type-safe, auto-documented web services), and LangGraph for structural multi-agent workflows[cite: 2].
* **Background Processing:** Managed via Celery workers with a Redis broker to queue heavy report compilations, cron-like medicine reminders, and background data synchronization[cite: 2].
* **Persistence Tier:** Structured SQL transactions live in PostgreSQL, vector embeddings utilize pgvector, and unstructured file entities (such as images and PDFs) are pushed to an AWS S3 bucket[cite: 2].
* **Interface Systems:** Next.js powers the web layout dashboard, while Flutter serves as the primary engine for cross-platform mobile deployments handling camera scans and native notification loops[cite: 2].

---

## 6. Safety Layer Guardrails

The Safety Layer serves as an immutable, non-optional pre-response interceptor that inspects every compiled statement before it reaches the frontend[cite: 2].

* **Emergency Short-Circuiting:** If the system detects acute danger signals—such as mentions of intense chest compression, stroke symptoms, signs of severe anaphylaxis, or accidental medication overdose—the normal query graph is instantly aborted[cite: 2]. The platform suppresses general advice and immediately forces local emergency dispatch metrics into the chat window[cite: 2].
* **Output Standards:** For standard queries, the safety layer strictly blocks the agent from offering clinical diagnoses, altering doctor instructions, or recommending that a user start or stop any therapeutic regime[cite: 2]. Every medical data point returned must map directly back to a verified API or guideline citation[cite: 2].