# Funnel Philosophy & Modal Architecture

This document outlines the marketing funnel philosophy adopted for **Reflections**, adapted from Mike Killen's "Surfboard / Mini-Mal Funnel" methodology, and specifies how it translates ethically into our calm, private journal application without altering the core landing page or homepage.

---

## 1. Origin & Core Philosophy (The "Mini-Mal" Funnel)

The "Mini-Mal" (7'6" surfboard) funnel model prioritizes dependable, low-friction simplicity over complex multi-stage guru funnels.

### Core Tenets
1. **Three-Stage Architecture**:
   * **Stage 1: Low-Friction Micro-Commitment (Opt-in)**: Uses a 2-step click-pop mechanism rather than aggressive static forms.
   * **Stage 2: The Immediate Bridge ("Faster & Easier")**: Never send leads to a dead-end "Thank you, check your email" page or a passive document download. Interest decays rapidly after action. Immediately bridge into an interactive experience solving the exact same problem faster and easier.
   * **Stage 3: Natural Ascend / Upsell**: Offer the full continuous solution (Pro subscription) at the exact moment the user has experienced tangible relief.
2. **The "Currency" (Concrete Outcome-Driven Copy)**:
   * Users do not buy features, codebases, frameworks, or brand prestige.
   * They buy a specific **metric or tangible relief** within a defined timeframe (e.g., *"Unclutter your racing thoughts in 5 minutes before sleep"*).
   * The offer must answer a problem so real that someone would intuitively value an immediate solution for it.
3. **No Fuel Without Fire**:
   * Do not build bloated assets or run paid ads prior to validating organic conversion.
   * Validate messaging and flow with targeted communities first.

---

## 2. Product Guardrails for Reflections

Per [PRODUCT.md](file:///e:/Reflections/PRODUCT.md), Reflections has strict brand and ethical boundaries that must never be compromised:
* **No dark patterns**: No artificial scarcity, fake countdown timers, or shame-based copy.
* **No therapy claims**: Do not frame the app as clinical mental health treatment, diagnostic authority, or motivational hype.
* **Writing is the sanctuary**: Marketing flows must respect quiet focus and privacy.
* **Surface isolation**: The main landing page and homepage remain unchanged. Funnels operate via dedicated context modals (`ModalSheet`) triggered by targeted routes, deep links (e.g., `?flow=bedtime`, `?flow=relationships`), or specific user actions.

---

## 3. Funnel 1: Evening Decompression

### Positioning & Currency
* **Hook**: *"Unclutter your racing thoughts in 5 minutes before bed."*
* **The Currency**: Going to sleep with an empty, calm head in under 5 minutes without screen stimulation or blue-light productivity pressure.

### The 3-Step Flow
```
[Trigger: ?flow=bedtime or Evening Prompt Trigger]
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ STEP 1: Micro-Commitment Modal (Bedtime Reset)         │
│ • Minimal click-pop sheet via ModalSheet               │
│ • "Leave tonight's thoughts here so you can rest."     │
│ • Low-friction authentication entry                   │
└────────────────────────────────────────────────────────┘
                   │  Immediate Transition (No inbox dead ends)
                   ▼
┌────────────────────────────────────────────────────────┐
│ STEP 2: The 5-Minute Decompression Bridge              │
│ • Clean, distraction-free writing modal/sandbox        │
│ • Guided prompt: "What is still on your mind tonight   │
│   that can safely wait until tomorrow?"                │
│ • Action: User clicks "Safely close tonight"          │
└────────────────────────────────────────────────────────┘
                   │  Upon saving the entry
                   ▼
┌────────────────────────────────────────────────────────┐
│ STEP 3: Context-Aware Pro Upgrade Modal                │
│ • "Tonight's thoughts are safe and encrypted."         │
│ • Offer: Bedside phone sync, ambient soundscapes, and  │
│   unlimited monthly room with Reflections Pro.         │
└────────────────────────────────────────────────────────┘
```

---

## 4. Funnel 2: The Relationship Orbit

### Positioning & Currency
* **Hook**: *"Remember what matters to the people you love, without social media noise or CRM awkwardness."*
* **The Currency**: Never forgetting a meaningful detail, milestone, or conversation shared with people in your inner circle.

### The 3-Step Flow
```
[Trigger: ?flow=relationships or Deep Link]
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ STEP 1: Micro-Commitment Modal (The Orbit)             │
│ • "Who is one person you've been meaning to check in   │
│   on or remember something about?"                     │
│ • Single field: Enter Name (e.g., "Maya")             │
└────────────────────────────────────────────────────────┘
                   │  Immediate Transition
                   ▼
┌────────────────────────────────────────────────────────┐
│ STEP 2: The 60-Second Memory Bridge Card               │
│ • Prompts: "What was the last conversation that stayed │
│   with you regarding Maya?"                            │
│ • Saves directly to RelationshipRecord & Life Wiki     │
└────────────────────────────────────────────────────────┘
                   │  Upon saving
                   ▼
┌────────────────────────────────────────────────────────┐
│ STEP 3: Context-Aware Pro Upgrade Modal                │
│ • "Maya is now part of your personal Life Wiki."       │
│ • Offer: Custom relationship rhythms (gentle reminders │
│   every 2 or 4 weeks) and unlimited people profiles    │
│   with Reflections Pro.                                │
└────────────────────────────────────────────────────────┘
```

---

## 5. Modal Adaptation Strategy

Existing modal primitives in the codebase will be adapted without breaking test contracts:

### 1. `ModalSheet.tsx`
* Remains the foundational accessible dialog wrapper for all steps.
* Supports clean sequential step transitions without full-page refreshes.

### 2. `ProUpgradeCTA.tsx`
* Currently renders a generic paywall (*"More room when life gets loud"*).
* Add an optional `funnelContext` prop:
  * `'default'`: Existing generic copy (preserves all existing tests and contracts).
  * `'bedtime'`: Emphasizes bedside mobile sync, soundscapes, and evening peace.
  * `'relationships'`: Emphasizes relationship rhythms, unlimited people profiles, and automated Life Wiki connections.

### 3. Route & Query Parameter Handlers
* Modals can be triggered seamlessly via URL query parameters (e.g., `?flow=bedtime` or `?flow=relationships`) on existing routes.
* Allows targeted organic or direct distribution without altering the core landing page or homepage components.
