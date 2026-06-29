# ADR: Google One-Time Import And Zero-Knowledge Relationship Memory

## Decision

RelationshipOS uses a one-time Google Contacts import into an Import Inbox. It requests read-only Google Contacts access and imports only minimal identity fields: name, photo, email, phone, company, and title.

Relationship records and import inbox payloads are encrypted client-side before storage. Names, lifecycle, dimensions, contact details, hooks, interactions, connections, next care, and value ledger entries all live inside the encrypted payload. The MVP does not create normalized child tables.

Import dedupe uses `source_fingerprint`, an opaque SHA-256 value derived from Google `resourceName` when present, otherwise normalized email or phone. The raw Google resource name remains inside the encrypted payload only.

## Rationale

- Imports should reduce setup friction without turning Reflections into an address book.
- Inbox gating prevents contact-list bloat and preserves intentionality.
- One-time import avoids background sync privacy risk.
- Source fingerprints prevent duplicate inbox rows without storing raw external identifiers in plaintext.
- Zero-knowledge payloads match Reflections' private-writing promise.
- Nested encrypted payload keeps MVP implementation smaller while preserving a future path for richer graph/query features.
- Removing unused child tables reduces RLS, deletion, migration, and verification surface.

## Consequences

- Server-side relationship analytics are intentionally limited.
- Search/filter must rely on local decrypted data for sensitive fields.
- Future normalized writes need a migration path from nested payload fields into child tables.
- Reconnect is required when Google provider token or scope is unavailable.
- Google Contacts import is web-only until native provider-token and deep-link behavior are verified.
- RelationshipOS callback redirects are deliberately allowlisted to `/relationships` and `/relationships?tab=import`.
- Import fingerprints, source, status, timestamps, and ownership remain operational metadata; imported identity and merge suggestions remain encrypted.
