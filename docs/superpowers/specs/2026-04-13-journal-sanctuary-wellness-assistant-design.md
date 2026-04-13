# Journal Sanctuary Wellness Assistant Design

## Summary

Mindful Notes will become a calm wellness companion built around a quiet writing sanctuary. The journal remains the center of the app. AI appears only when the user asks for it by clicking **Reflect with AI**, and the Stats Center presents a monthly wellness journey through gentle patterns rather than scores, diagnoses, or productivity pressure.

## Product Direction

The product should feel like a warm friend with a slight journal mirror. It should notice what the user has written, reflect it back in human language, and suggest small next steps without sounding clinical, dramatic, or automated.

The app should avoid medical positioning. It should present AI output as supportive reflection for general wellness, not therapy, diagnosis, treatment, or emergency support. When a user appears to need immediate help, the app should point them to crisis resources and encourage contacting trusted people or emergency services.

## Free And Pro Model

Free users get up to 30 notes per calendar month. Free users also get one sample AI reflection after writing enough notes to make that sample useful.

Pro users get unlimited notes, unlimited AI reflections, the full assistant layer, and the full Stats Center.

The upgrade prompt should feel like a gentle invitation. It should not interrupt writing. It should appear when a free user reaches the monthly note limit, tries to use AI after the sample reflection is spent, or opens Pro-only Stats Center content.

## Writing Sanctuary

The writing page should become more spacious and less visually heavy. The preferred visual direction is soft minimal: more whitespace, fewer heavy shadows, calmer controls, clearer hierarchy, and simpler buttons.

The writing page should lead with the note itself. Mood, tags, attachments, tasks, and prompts should remain available, but they should not compete with the writing area. The AI entry point should be clearly labeled **Reflect with AI** and should be disabled or gated when the user is not eligible.

The reflection should appear below or beside the note only after the user clicks the button. It should not auto-generate on page load or while typing.

## AI Reflection Voice

The AI should sound like a warm friend holding up a journal mirror. It should use plain, human language and stay grounded in the user's actual entries.

Example tone:

> Reading this, it feels like you have been carrying a lot quietly. I noticed you mentioned rest a few times, but also kept pushing through. Maybe tonight does not need a big fix. Maybe it just needs one small pause.

The AI must avoid clinical labels, diagnosis, strong claims, dramatic advice, productivity framing, and overconfident language like "you always" or "you are." It should prefer soft phrasing such as "it seems," "I noticed," "maybe," and "it might be worth listening to."

## Stats Center

The Stats Center should show gentle patterns with a monthly wellness journey. It should answer: what showed up this month, what rhythms are visible, and what small next step might support the user.

The monthly journey should include:

- Notes written this month and monthly usage for free users
- Mood rhythm based on saved moods
- Writing rhythm across the month
- Recurring tags and themes
- A warm monthly reflection summary
- One small next step

The Stats Center should not grade the user, score their mental health, or imply clinical certainty. It should feel like a thoughtful recap of the month.

## Safety And Privacy

Journal content is sensitive. AI features should send only the minimum needed context for the requested reflection. The UI should make it clear when content is being reflected on by AI.

The app should include a small support disclaimer near AI reflection and Stats Center content: the feature is for reflection and general wellness, not medical advice. If the user may be in immediate danger or crisis, the app should direct them to urgent support resources such as 988 in the United States and local emergency services.

The design follows the general wellness framing described in FDA guidance, FTC health app privacy best practices, and SAMHSA 988 crisis-resource guidance.

## Initial Scope

The first implementation pass should focus on a working product slice:

- Replace the hardcoded free note limit of 3 with a monthly limit of 30
- Track the user's one free AI reflection sample
- Gate AI reflection and Stats Center Pro content
- Refine the writing page toward the soft minimal sanctuary direction
- Add monthly wellness journey calculations from existing note data
- Update AI prompts and UI copy to the warm friend plus journal mirror voice
- Add a crisis-safe fallback path for risky AI requests or responses

Payments are out of scope for this first pass. Upgrade buttons should route to the existing Account page or show a simple in-app message that Pro checkout is not connected yet.
