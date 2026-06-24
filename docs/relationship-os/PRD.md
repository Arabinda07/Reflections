# RelationshipOS PRD

## Summary

RelationshipOS is a private life module inside Reflections for tending meaningful relationships over time. It is not a CRM, contact manager, social network, or productivity system. It helps a user remember who matters, why a relationship deserves care, and what human reason exists to reach out.

## MVP

- `/relationships` is the primary workspace with Weekly, People, and Import Inbox views.
- `/relationships/:id` is a context-first profile: relationship context, dimensions, hooks, timeline, value ledger, and secondary contact details.
- `/home` shows a compact relationship module with one or two weekly care suggestions.
- Weekly ritual suggests three to five people based on dormant relationships, unused hooks, quiet touchpoints, and relationship dimensions.
- A user can mark a relationship tended; it stays out of suggestions for the current week.
- First use provides inline seeding for top people, lost-touch people, and relevant domains.
- Google Contacts import is one-time, read-only, minimal, and inbox-gated.
- Google Contacts import is web-only in MVP and follows all available result pages.
- Google import uses a source fingerprint to skip repeated imports without exposing Google resource names.
- Possible duplicates enter the inbox with user-confirmed merge or keep-separate actions.
- Relationship profiles support editing lifecycle stage, tier, dimensions, hooks, interactions, next care, and value ledger entries.
- Profiles store person-to-person connections without a visual graph.

## Non-Goals

- No visual network map in MVP.
- No outreach drafting.
- No ongoing Google sync.
- No Gmail, Calendar, or LinkedIn integrations.
- No relationship score, streaks, badges, pipeline, deal stage, or vanity metrics.

## Success Criteria

- User can seed relationships manually.
- User can import Google Contacts into an inbox without activating them automatically.
- User can review one imported person at a time.
- Merge fills missing identity fields and never overwrites existing relationship context or dimensions.
- Re-running import does not create duplicate pending inbox rows.
- Google OAuth reconnect returns to the Relationships import inbox.
- User can complete weekly care by opening suggested people and acting on hooks/next care.
- Pending offline relationship changes remain visible and are never replaced by stale remote rows.
- Sensitive relationship memory is stored with the same zero-knowledge posture as private writing.
