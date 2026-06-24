begin;

drop index if exists public.relationship_import_inbox_source_fingerprint_uidx;

update public.relationship_import_inbox
set source_fingerprint = null
where source_fingerprint is not null;

alter table public.relationship_import_inbox
  drop column if exists source_fingerprint;

comment on table public.relationship_import_inbox is
  'One-time imports awaiting user triage. Imported identity, dedupe fingerprints, and merge suggestions are encrypted.';

commit;
