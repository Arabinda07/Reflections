# Feature Specification: Shared / Collaborative Journal

**Feature Branch**: `001-shared-journal`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Let a Reflections user share a single journal entry — or a whole journal — with another specific person, choosing read-only or co-write, and revoke that access at any time, without exposing any of their other private writing."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share one entry, read-only, and take it back (Priority: P1)

An owner opens one of their entries, invites one specific person to read it, and that person
can read exactly that entry — nothing else. The owner can revoke at any time, and afterward the
recipient can no longer open it.

**Why this priority**: This is the smallest slice that delivers the core promise — confident,
reversible sharing of a single piece of writing with one person — and proves the privacy
boundary. Shipped alone, it is already useful.

**Independent Test**: Owner shares entry A with person B (read-only); B sees A and cannot see
the owner's other entries; owner revokes; B can no longer open A.

**Acceptance Scenarios**:

1. **Given** the owner has entries A and B and an existing recipient R, **When** the owner shares only A with R as read-only, **Then** R can open A and R cannot see or list B or any other of the owner's writing.
2. **Given** A is shared read-only with R, **When** R opens A, **Then** R can read but cannot edit, and the owner sees that A is currently shared with R.
3. **Given** A is shared with R, **When** the owner revokes R's access, **Then** R can no longer open A and A no longer appears in R's shared-with-me list.
4. **Given** the owner is choosing who to share with, **When** they share A with R, **Then** the entry is never made public, never added to any feed, and is visible only to the owner and R.

---

### User Story 2 - Co-write a shared entry (Priority: P2)

The owner shares an entry as co-write, so the recipient can also edit it. Both people see each
other's changes, and it is always clear who last edited.

**Why this priority**: Collaboration is the headline value beyond read-only, but it depends on
P1's sharing/revocation foundation, so it comes second.

**Independent Test**: Owner shares A with R as co-write; R edits A; the owner sees R's changes
and the "last edited by" attribution; revoking returns A to owner-only.

**Acceptance Scenarios**:

1. **Given** A is shared co-write with R, **When** R edits A, **Then** the owner sees the updated content and that R was the last editor.
2. **Given** A is shared co-write, **When** the owner revokes R, **Then** R loses edit and read access and the entry remains intact for the owner with all prior edits preserved.

---

### User Story 3 - Share a whole journal, not just one entry (Priority: P3)

The owner shares a defined group of entries (a "journal") with one person, so newly added
entries in that group become available to the recipient under the same access level, until
revoked.

**Why this priority**: Convenience extension of P1/P2 to a collection; valuable but not required
for the core promise, and it depends on how a "journal" is defined in the product.

**Independent Test**: Owner shares journal J (containing A and B) with R; R sees A and B; owner
adds entry C to J; R sees C; owner revokes; R loses access to A, B, and C.

**Acceptance Scenarios**:

1. **Given** the owner shares journal J with R, **When** the owner later adds an entry to J, **Then** that entry becomes available to R at the same access level without re-inviting.
2. **Given** journal J is shared with R, **When** the owner revokes R from J, **Then** R loses access to every entry in J at once.

---

### Edge Cases

- **Recipient is not yet a Reflections user**: the owner invites by an identifier (see FR-003); access becomes usable only once the recipient has an account, and no content is exposed before then.
- **Owner deletes a shared entry**: deletion removes it for everyone; the recipient can no longer open it and it leaves their shared-with-me list.
- **Conflicting simultaneous edits (co-write)**: two people edit the same entry at once — the system must define which change is kept and make the outcome visible (see FR-009).
- **Revocation mid-collaboration**: if the recipient is actively viewing/editing when revoked, their access ends; further reads/saves fail gracefully with a clear message; content the recipient already saw cannot be retroactively un-seen (see FR-008).
- **Recipient tries to re-share**: a recipient cannot re-share or invite others; only the owner controls access.
- **Owner account closure**: closing the owner's account removes all recipients' access to that owner's shared content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Owners MUST be able to share a single entry with one specific person at a chosen access level (read-only or co-write).
- **FR-002**: The system MUST expose to a recipient ONLY the specific content shared with them; no other entry, attachment, mood, tag, or Life Wiki page of the owner may be readable or listable.
- **FR-003**: Owners MUST be able to designate a recipient by a person-identifier the recipient controls. [NEEDS CLARIFICATION: is sharing limited to existing Reflections users selected by email, or may the owner invite any email address that activates on signup?]
- **FR-004**: Recipients MUST be able to see a "shared with me" list of content shared to them and open it, separated from their own private writing.
- **FR-005**: Owners MUST be able to see, for any shared item, who currently has access and at what level.
- **FR-006**: Owners MUST be able to revoke any recipient's access to any shared item at any time, after which the recipient can no longer open or list it.
- **FR-007**: Shared content MUST never become public, MUST never appear in any feed, recommendation, or discovery surface, and MUST be readable only by the owner and explicitly invited recipients (Constitution Principles I & III).
- **FR-008**: Revocation MUST remove the recipient's future access; the system MUST state plainly that content already seen by a recipient cannot be retroactively unseen (Constitution Principle VI — honest privacy copy).
- **FR-009**: For co-write, the system MUST define and surface a conflict outcome for simultaneous edits and always show who last edited. [NEEDS CLARIFICATION: conflict policy — last-write-wins with attribution, soft lock while editing, or merge?]
- **FR-010**: A "whole journal" share MUST apply to a defined group of entries and automatically include entries later added to that group, until revoked. [NEEDS CLARIFICATION: what defines a "journal/group" in Reflections today — all entries, a tag, or a new explicit collection the owner creates?]
- **FR-011**: Recipients MUST NOT be able to re-share, invite others, or change access; only the owner controls sharing.
- **FR-012**: Deleting a shared entry, or closing the owner's account, MUST remove all recipients' access to that content.
- **FR-013**: Sharing and revocation actions MUST be calm and reversible in presentation, with no urgency or pressure mechanics (Constitution Principle VI).

### Key Entities *(include if feature involves data)*

- **Share**: a grant connecting one owner-owned item (entry or journal) to one recipient at one access level (read-only or co-write); has a state (pending / active / revoked) and timestamps. The unit the owner manages and revokes.
- **Shareable Item**: the thing shared — an individual entry, or a journal (a defined group of entries). Always owned by exactly one owner.
- **Recipient**: a person granted access via a Share; identified by something they control; never gains visibility into anything outside their active Shares.
- **Access Level**: read-only or co-write; governs whether a recipient may edit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An owner can share one entry with one person and confirm the access level in under 1 minute, on first attempt, without a manual.
- **SC-002**: 100% of the time, a recipient with access to one shared entry can open that entry and cannot reach any other content the owner did not share (verified by test).
- **SC-003**: An owner can revoke access in under 30 seconds, and the recipient loses access immediately on their next action.
- **SC-004**: In usability testing, ≥90% of owners correctly state, after using the feature, that only the people they invited can read what they shared and that revoking stops future access.
- **SC-005**: Zero instances, across testing, of a recipient gaining read or list access to owner content outside their active Shares.

## Assumptions

- Sharing is **person-to-person and explicit**; there are no public links, no "anyone with the link", and no group/team sharing in this version (consistent with Constitution Principles I & III).
- The owner remains the sole controller of access; recipients are consumers/collaborators only.
- Read-only is the default access level; co-write is an explicit choice.
- The existing account/identity system and the existing private-writing protection model are reused; this feature extends them rather than replacing them.
- "Confident sharing without exposing other writing" is the primary success measure; convenience features (notifications, activity history) are out of scope for v1 unless surfaced by clarification.
- The exact cryptographic mechanism for granting/revoking a recipient's access is an implementation concern for the planning phase, not this spec; the spec fixes only the user-facing guarantees.
