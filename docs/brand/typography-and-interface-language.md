# Typography And Interface Language

This document defines how Reflections should use type, spacing, hierarchy, and interface language to support calm private writing.

## Typography Philosophy

Type in Reflections should feel like a well-made private notebook combined with a quiet editorial interface.

The goal is not visual novelty. The goal is sustained readability, emotional calm, and a sense that the user's writing is the most important object on the screen.

## Typography Roles

### Display

Purpose:

- first-viewport brand signal
- major page identity
- occasional editorial emphasis

Behavior:

- use sparingly
- keep lines short
- avoid all caps
- avoid crowded letter spacing
- do not use display type for dense instructions

Good use:

- Landing headline
- Major dashboard welcome
- Empty-state title when space allows

Bad use:

- Long helper text
- Error messages
- Dense account settings
- Table labels

### Body

Purpose:

- journal content
- explanations
- privacy copy
- reflection output
- long-form reading

Behavior:

- prioritize line height
- avoid cramped widths
- keep contrast accessible
- let paragraphs breathe

Rules:

- Long-form content should use comfortable line height.
- Paragraphs should not run edge to edge on mobile.
- Reading surfaces should not feel like dashboards.

### Functional UI

Purpose:

- labels
- buttons
- navigation
- metadata
- form controls

Behavior:

- clear
- compact
- stable
- legible at small sizes

Rules:

- Do not over-style functional text.
- Do not use tiny uppercase labels as the only signpost.
- Metadata should stay secondary.

## Hierarchy Rules

Every screen should have:

1. One primary purpose.
2. One clear page title or implicit current task.
3. One primary action.
4. Secondary actions that do not compete.

Avoid:

- multiple hero-sized headings inside dashboard panels
- oversized labels in compact cards
- decorative text blocks that compete with the editor
- long instruction copy above the writing area

## Line Length

Rules:

- Long-form reading should stay comfortably narrow.
- Dashboard metrics can be compact.
- Buttons should not wrap awkwardly.
- On mobile, labels may wrap only when the result still feels intentional.

If text is too long:

1. Rewrite it.
2. Split it into title and description.
3. Move detail into a secondary surface.
4. Only then adjust layout.

## Spacing

Spacing should create emotional room.

Rules:

- Use generous spacing around writing and reading areas.
- Keep controls close to the objects they affect.
- Do not pack too many actions into one row on mobile.
- Use section spacing to show priority, not decoration.

Avoid:

- dense utility dashboards for reflective content
- stacked cards inside cards
- cramped modal text
- action bars that obscure writing

## Cards And Panels

Cards should frame repeated items or contained tools. They should not become decoration for every page section.

Use cards for:

- note previews
- repeated insight modules
- modals
- account setting groups
- contained tools

Avoid cards for:

- every page section
- hero copy
- main writing canvas when it makes the editor feel cramped
- nested decorative surfaces

## Buttons And Controls

Controls should look stable and familiar.

Rules:

- Use icons for icon-native actions like close, menu, delete, search, refresh.
- Add accessible labels for icon-only buttons.
- Keep destructive actions visually distinct but not theatrical.
- Use one primary action per surface.
- Avoid large marketing-style CTAs in working areas.

## Motion Language

Motion should calm, clarify, or confirm. It should not entertain at the expense of focus.

Good motion:

- subtle page entrance
- gentle save confirmation
- smooth modal open/close
- reduced motion support

Avoid:

- looping decorative animation in hot paths
- large bouncing effects
- confetti
- motion that delays writing
- loading animations that last longer than the work

## Color Language

Color should guide attention without taking over.

Use:

- botanical green for primary actions and brand presence
- soft blue for information or calm secondary emphasis
- muted earthy red for errors or destructive states
- tinted neutrals for reading surfaces

Avoid:

- pure black/white dominance
- harsh red for non-critical warnings
- saturated gradients as the main identity
- one-note monochrome surfaces that lose hierarchy

## Interface Density

Reflections can be feature-rich, but it should not feel busy.

Rules:

- Progressive disclosure is preferred.
- Keep the editor simpler than the dashboard.
- Keep account settings grouped and scannable.
- Let advanced AI or wiki behavior live in dedicated surfaces.

## Mobile Rules

Mobile is primary for emotional use.

Rules:

- The writing area must remain easy to reach and read.
- Bottom actions must not obscure important text.
- Long labels must not overflow buttons.
- Modals must have clear close affordances.
- Avoid desktop-style multi-column layouts on small screens.
- Prioritize one task per viewport.

## Accessibility Rules

Non-negotiable:

- Functional text must meet WCAG AA contrast.
- Focus states must be visible.
- Dialogs must trap or manage focus appropriately.
- Icon-only buttons require accessible names.
- Error text must be associated with fields where possible.
- Reduced motion preferences must be respected.

## Typographic Don'ts

Do not:

- use all caps for emotional emphasis
- use tiny text for important privacy or billing details
- use decorative type in errors
- use display type for AI output
- justify long-form text
- hyphenate journal content
- make labels so light they become ornamental

## Typographic Do's

Do:

- make journal content comfortable to read
- keep hierarchy quiet but clear
- use display type only where it earns its size
- let body copy carry the emotional tone
- keep buttons readable and stable
- give legal/privacy copy enough line height

## Interface Copy Placement

### Above The Editor

Keep minimal.

Good:

- title
- optional prompt
- small metadata

Avoid:

- long AI explanations
- upgrade prompts
- analytics
- large banners

### Inside The Editor

Use placeholder only.

Avoid:

- inline AI suggestions
- persistent helper text
- motivational nudges

### Below The Editor

Use for secondary controls if needed.

Good:

- tags
- mood
- tasks
- Reflect with AI

Avoid:

- cluttered panels that compete with writing

### Modals

Modals should be focused.

Rules:

- title should state the action
- body should explain consequence
- primary button should match the action
- destructive modals must name what is deleted

