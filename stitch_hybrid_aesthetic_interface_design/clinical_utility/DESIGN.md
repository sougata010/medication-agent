---
name: Clinical Utility
colors:
  surface: '#faf9fd'
  surface-dim: '#dad9dd'
  surface-bright: '#faf9fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f7'
  surface-container: '#efedf1'
  surface-container-high: '#e9e7eb'
  surface-container-highest: '#e3e2e6'
  on-surface: '#1a1c1e'
  on-surface-variant: '#43474e'
  inverse-surface: '#2f3033'
  inverse-on-surface: '#f1f0f4'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f88'
  primary: '#002045'
  on-primary: '#ffffff'
  primary-container: '#1a365d'
  on-primary-container: '#86a0cd'
  inverse-primary: '#adc7f7'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#321b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#4f2e00'
  on-tertiary-container: '#c6955e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#adc7f7'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#2d476f'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffddba'
  tertiary-fixed-dim: '#f2bc82'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#633f0f'
  background: '#faf9fd'
  on-background: '#1a1c1e'
  surface-variant: '#e3e2e6'
  safety-amber: '#D97706'
  emergency-red: '#DC2626'
  clean-slate: '#F8FAFC'
  border-muted: '#E2E8F0'
  text-clinical: '#334155'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  clinical-data:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  citation:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max-width: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The brand personality is **Professional, Trustworthy, and Vigilant**. The design system rejects "AI hype" in favor of medical rigor, prioritizing data clarity and patient safety above all else. It is designed for high-stakes healthcare environments where clarity saves time and reduces error.

The chosen style is **Corporate / Modern** with a **Clinical Utility** focus. This approach leverages:
- **High-Density Information Design:** Optimizing for scanning clinical data, dosages, and interactions.
- **Human-in-the-loop Transparency:** UI patterns that explicitly show AI confidence levels and data citations.
- **Rigid Structural Alignment:** A disciplined layout that feels stable and predictable, mirroring the reliability of a pharmaceutical dashboard.
- **Intentional Whitespace:** Used not just for aesthetics, but to separate critical medical contexts and prevent cognitive overload.

## Colors

The palette is rooted in a "Clinical Utility" framework, using color to denote status and hierarchy rather than mere decoration.

- **Primary (MedGraph Blue):** A deep navy used for structural elements, headers, and brand-level interactions to evoke stability.
- **Secondary (Health Teal):** Reserved for positive healthcare outcomes, verified data, and primary "Action" states like confirming a dosage.
- **Safety Amber:** Specifically for low-confidence AI outputs and non-critical drug interaction warnings.
- **Emergency Red:** A high-contrast alert color reserved exclusively for the Safety Layer and critical contraindications.
- **Neutral (Clean Slate):** A spectrum of cool grays that maintain a sterile, modern environment. The default background is crisp white to ensure maximum contrast for text-heavy reports.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-dense interfaces and its neutral, clinical character.

### Hierarchy & Usage
- **Clinical Data Role:** Use the `clinical-data` token for dosages, medicine names, and lab values. Its slightly increased weight and tracking ensure precision.
- **Label Caps:** Used for metadata tags like "VERIFIED", "PHASE 1", or "LOW CONFIDENCE."
- **Citations:** Smallest in the hierarchy, used for pharmacological sourcing and footnotes to maintain transparency without cluttering the main narrative.
- **Mobile Scaling:** Headlines above 24px should scale down by 15% on mobile devices to ensure readability without excessive scrolling.

## Layout & Spacing

The system employs a **Fixed Grid** philosophy for desktop dashboards to ensure that clinical data points remain in predictable visual locations. 

- **Grid:** A 12-column grid with 24px gutters. Content is housed in a centered container with a maximum width of 1280px.
- **Rhythm:** A strict 4px baseline grid governs all vertical spacing.
- **Density:** High-density layouts are preferred for professional users. Use `stack-sm` (8px) for related data points (e.g., Medicine Name + Dosage) and `stack-lg` (32px) for separating logical sections like "Adherence Log" from "Side Effects."
- **Mobile Adaptivity:** Transitions to a single-column fluid layout with 16px side margins. Data tables should pivot to a card-based vertical stack on mobile.

## Elevation & Depth

To maintain a clinical feel, elevation is used sparingly to denote functional priority rather than aesthetic depth.

- **Surface Tiers:** Use **Tonal Layers**. The primary background is white (`#FFFFFF`). Secondary containers or "Deep Storage" areas use `clean-slate`.
- **Shadows:** Use **Ambient Shadows**. They must be subtle, low-opacity, and neutral (no colored tints). A 4px blur with 5% opacity is the standard for cards to lift them slightly from the canvas.
- **Safety Intercepts:** The "Safety Layer" uses a high-contrast overlay with a 10% backdrop blur to focus the user entirely on the emergency guidance, effectively hijacking the interface for safety.
- **Confidence Highlighting:** Low-confidence OCR data uses a flat, subtle `safety-amber` background fill rather than a shadow, keeping the data "on the page" but flagged.

## Shapes

The shape language balances modern approachability with medical precision.

- **Standard Elements:** Buttons, input fields, and cards use a **0.5rem (8px)** radius. This is soft enough to feel modern but sharp enough to appear professional.
- **Status Pills:** Status indicators (e.g., "Taken", "Verified") use a **Pill-shaped (Full)** radius to distinguish them as non-interactive status markers.
- **Data Containers:** Large data modules (Medicine Reports) use the `rounded-lg` (1rem) setting to create a clear "bucket" for related information.

## Components

### Buttons & Inputs
- **Primary Action:** Solid `secondary_color` (Health Teal) with white text. Rounded 8px.
- **Secondary Action:** Ghost style with `primary_color` (MedGraph Blue) borders.
- **Input Fields:** Soft gray borders (`border-muted`) that thicken and change to `primary_color` on focus. No shadows on resting state.

### Cards & Modules
- **Medicine Cards:** Use a white background, subtle ambient shadow, and a 1px `border-muted`. Headers within cards should have a subtle `clean-slate` background fill to separate them from the content.

### Medical-Specific Components
- **Confidence Highlighter:** A subtle amber highlight behind text that has a <85% confidence score from the OCR engine.
- **Adherence Chips:** Small, pill-shaped markers. "Taken" (Teal), "Skipped" (Gray), "Missed" (Amber).
- **The Interceptor:** A full-screen, high-priority modal with a thick `emergency-red` top border for Safety Layer alerts.
- **Citation Tooltips:** Non-obtrusive icons next to data points that reveal pharmacological sources on hover/tap.