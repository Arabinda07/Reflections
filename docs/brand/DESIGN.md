---
version: alpha
name: Reflections Luxury Minimalist
description: A refined editorial journal designed for mental clarity and personal reflection.
colors:
  botanical: "oklch(0.47 0.18 135)"
  sky: "oklch(0.54 0.16 245)"
  honey: "oklch(0.59 0.13 80)"
  clay: "oklch(0.53 0.13 35)"
  paper: "oklch(0.985 0.012 135)"
  sage: "oklch(from botanical 0.965 0.022 h)"
  on-surface: "#252525"
  error: "{colors.clay}"
typography:
  headline-display:
    fontFamily: Manrope
    fontSize: 100px
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: 0
  headline-lg:
    fontFamily: Manrope
    fontSize: 56px
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: 0
  body-md:
    fontFamily: Spectral
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: 900
    lineHeight: 1
    letterSpacing: 0.2em
rounded:
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.botanical}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: 16px
  surface-floating:
    backgroundColor: "var(--surface-current-bg)"
    rounded: "{rounded.lg}"
    padding: 24px
    tone: inherit
---

# DESIGN.md

## Overview

**Reflections** is a refined editorial journal designed for individuals seeking mental clarity. The brand personality is characterized by:

- **Calm**: Low-stress interactions, muted palettes, and generous whitespace.
- **Quiet**: Non-intrusive UI, subtle transitions, and focused features.
- **Elegant**: High-end typography, refined geometric forms, and cinematic presentation.

The aesthetic direction blends high-end wellness magazines with luxury stationery, using a "document-anchored" layout where text feels printed on a surface.

## Colors

The palette is rooted in botanical green and tinted paper neutrals. Color is inherited through surface scopes, so every card belongs to the page or section it sits inside instead of carrying a random one-off background.

- **Botanical / `sage`:** The dominant brand family. Use it for reflection, check-in, overview, home focus, and general sanctuary cards.
- **`paper`:** The writing-safe base. Use it for note editors, forms, auth, long reading, and any surface where the user's words need to stay quiet.
- **`sky`:** The insight and information tone. Use it for analytics, FAQ/help, weekly signal, export/help panels, and explanatory states.
- **`honey`:** The progress and completion tone. Keep the token (defined in config/CSS), but currently unused on any active page.
- **`clay`:** The release/destructive tone. Use it for release moments, warnings, account closure, delete flows, and emotional contrast.

### Inherited Surface Rule

Pages and major sections set a scope class such as `surface-scope-sage`, `surface-scope-sky`, `surface-scope-honey`, `surface-scope-clay`, or `surface-scope-paper`. `Surface`, floating panels, tone panels, metadata pills, alerts, empty states, and inline cards inherit the current scope through CSS variables. Components may still opt into an explicit tone when they have a stronger semantic role.

`neutral` is only a backward-compatible alias for `paper`; it should not be used for new design work.

### Color Boundaries

- Use OKLCH tokens from `index.css`; do not introduce raw Tailwind color strings for card backgrounds.
- Do not create a second mood palette. Mood chips, bars, and note metadata use `pages/dashboard/moodConfig.ts`.
- Do not use gradient text, decorative blobs/orbs, or thick side-stripe accents.
- Do not rely on color alone. Pair state color with labels, icons, or clear copy.
- Keep text contrast WCAG AA. Colored backgrounds should use the matching dark/readable tone, not gray text washed over color.

## Typography

The typography strategy leverages the contrast between functional clarity and emotional resonance.

- **Display & Headlines:** Set in **Manrope ExtraBold** to establish a strong, modern editorial voice. Headlines use tight leading and natural letter spacing to match the implemented interface.
- **Body:** **Spectral** (Serif) is the primary face for reflections and long-form content, providing a classic, literary feel.
- **Functional UI:** **Manrope** (Sans) is used for all utilitarian elements, labels, and metadata to ensure maximum legibility.

## Layout

The layout follows a **Fluid Grid** model for mobile devices and a **Fixed-Max-Width** container for desktop (max 1180px).

A strict 8px spacing scale (with 4px increments) maintains a consistent rhythm. Components are grouped using "containment" principles, where related items are housed in large-radius panels with generous internal padding.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Glassmorphism** rather than traditional drop shadows.

- **Floating Panels**: Utilize a combination of background blur (14px - 20px), subtle borders, and semi-transparent surface colors.
- **Scrims**: Cinematic video backgrounds are softened with subtle gradients (scrims) to ensure text remains the primary focus.

## Shapes

The shape language is defined by **Bespoke Craftsmanship**.

- **Radii**: We avoid generic small corners. Large, structured radii (`24px` to `32px`) are used for main containers and shells to evoke the feeling of a physical object or high-end device.
- **Interactive Elements**: Buttons and controls use a refined `16px` radius.

## Components

### Buttons
Primary buttons are solid botanical green with centered white text in Manrope Bold. They should feel substantial and deliberate.

### Floating Panels
Floating surfaces are the hallmark of the interface. They must always include a border (`1.5px`) and a backdrop-filter blur to separate them from the background video or content.

### Chips & Filters
Chips use a subtle border and high-contrast labels. Active states should use the primary green with reduced opacity for the background.

## Do's and Don'ts

- **Do** use generous whitespace to let the content "breathe".
- **Don't** use pure black (#000) or pure white (#FFF) as primary backgrounds; use tinted neutrals.
- **Do** ensure all motion uses `ease-out-expo` for a calm, natural feel.
- **Don't** obscure visual subjects in background videos with UI elements.
- **Do** maintain high contrast (WCAG AA) for all functional text.
