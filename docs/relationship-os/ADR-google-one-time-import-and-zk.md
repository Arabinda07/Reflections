# ADR: Google One-Time Import And Zero-Knowledge Relationship Memory

## Decision

RelationshipOS uses a one-time Google Contacts import into an Import Inbox. It requests read-only Google Contacts access and imports only minimal identity fields: name, photo, email, phone, company, and title.

**Dual-mode note (ADR 0001):** Zero-knowledge encryption of relationship and import-inbox payloads applies to **encrypted** mode. In **reflective** mode the same `encrypted_payload` column is reused to store plaintext JSON (no separate plaintext columns exist for these tables). Encrypted-mode users still encrypt client-side before upload.

For encrypted mode, names, lifecycle, dimensions, contact details, hooks, interactions, connections, next care, and value ledger entries all live inside the encrypted payload. The MVP does not create normalized child tables.

Import dedupe uses `source_fingerprint`, an opaque SHA-256 value derived from Google `resourceName` when present, otherwise normalized email or phone. The raw Google resource name remains inside the payload only (encrypted when the user is in encrypted mode).

## Rationale

- Imports should reduce setup friction without turning Reflections into an address book.
- Inbox gating prevents contact-list bloat and preserves intentionality.
- One-time import avoids background sync privacy risk.
- Source fingerprints prevent duplicate inbox rows without storing raw external identifiers in plaintext columns.
- Zero-knowledge payloads match Reflections' private-writing promise for encrypted-mode users; reflective mode trades ZK for AI-capable plaintext storage per ADR 0001.
- Nested encrypted payload keeps MVP implementation smaller while preserving a future path for richer graph/query features.
- Removing unused child tables reduces RLS, deletion, migration, and verification surface.

## Consequences

- Server-side relationship analytics are intentionally limited.
- Search/filter must rely on local decrypted (or reflective plaintext) data for sensitive fields.
- Future normalized writes need a migration path from nested payload fields into child tables.
- Reconnect is required when Google provider token or scope is unavailable.
- Google Contacts import is web-only until native provider-token and deep-link behavior are verified.
- RelationshipOS callback redirects are deliberately allowlisted to `/relationships` and `/relationships?tab=import`.
- Import fingerprints, source, status, timestamps, and ownership remain operational metadata; imported identity and merge suggestions remain in the payload (encrypted for encrypted-mode users).
