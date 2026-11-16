# VitaLeaf Clinical — Master Design System (Source of Truth)
*Generated with UI/UX Pro Max Intelligence for Healthcare & Clinical Informatics Platforms*

---

## 1. Brand & Positioning
- **Product Name**: VitaLeaf Clinical
- **Positioning**: The Enterprise Operating System for Health Telemetry, Medication Safety & Bayesian Diagnostics.
- **Tone & Mood**: Medical, Accessible, Trustworthy, Rigorous, High-Integrity, Calm.
- **Compliance Standard**: WCAG AAA / HIPAA-Grade Contrast & Touch Targets.

---

## 2. Color Tokens & Semantic Roles

| Token | Hex / Class | Semantic Role |
|---|---|---|
| **Primary Clinical** | `#0284c7` (`bg-blue-600` / `sky-600`) | Primary actions, key icons, active navigation tabs |
| **Secondary Health** | `#059669` (`bg-emerald-600`) | Confirmed adherence, stable vitals, positive concordance |
| **Warning / Moderate** | `#d97706` (`bg-amber-600`) | Moderate triage, scheduled doses, dietary interaction caution |
| **Critical / Emergency** | `#dc2626` (`bg-rose-600`) | Emergency actions, high acuity alerts, acute contraindications |
| **Surface (Clean Whitish)** | `#ffffff` (`bg-white`) | Cards, modals, containers, input fields |
| **Canvas Background** | `#f8fafc` (`bg-slate-50`) | Global page background, sub-panel surfaces |
| **Primary Text** | `#0f172a` (`text-slate-900`) | Headings, disease titles, key figures |
| **Secondary Text** | `#475569` (`text-slate-600`) | Body copy, descriptions, clinical guidelines |
| **Border Tokens** | `#e2e8f0` (`border-slate-200`) | Neutral containers, divider lines, cards |

---

## 3. Typography System
- **Heading Font**: `Space Grotesk` (Geometric, clean, modern, medical authority).
- **Body Font**: `Inter` (Legible at all screen densities, accessible 14–16px base).
- **Telemetry / Mono Font**: `JetBrains Mono` (Dosages, timestamps, lab values, Rx identifiers).

---

## 4. Key UX & Accessibility Principles
1. **Zero Unicode Emojis**: Always use crisp Lucide SVG icons (`Stethoscope`, `Pill`, `HeartPulse`, `ShieldCheck`).
2. **Accessible Acuity Indicators**: Acuity (Low, Moderate, Critical) is surfaced via clean pills/badges (`bg-slate-50 border-slate-200`) with colored dots, never coloring entire card backgrounds.
3. **Touch Targets & Clickables**: Minimum 44x44px clickable areas with `cursor-pointer` and 150ms hover feedback.
4. **Information Architecture**:
   - Navigation is categorized into 4 logical clusters: *Clinical Care*, *Pharmacotherapy*, *Diagnostics & Network*, and *Services & Community*.
   - Multi-column dashboards maintain vertical balance using companion clinical context cards.
5. **No AI Buzzwords**: Technical telemetry is framed clinically (e.g., *Bayesian Concordance Engine*, *OpenFDA Safety Cross-Referencing*, *Clinical Knowledge Network*).
