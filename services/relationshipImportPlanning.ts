import type { RelationshipImportInboxItem, RelationshipRecord } from '../types';

export type GooglePerson = {
  resourceName?: string;
  names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
  photos?: Array<{ url?: string; default?: boolean }>;
  emailAddresses?: Array<{ value?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
};

const normalizeEmail = (value?: string) => value?.trim().toLowerCase();
const normalizePhone = (value?: string) => value?.replace(/\D/g, '');
const normalizeName = (value?: string) => value?.trim().toLowerCase().replace(/\s+/g, ' ');

export const deriveRelationshipImportFingerprint = async (
  source: RelationshipImportInboxItem['source'],
  candidate: Pick<RelationshipImportInboxItem, 'googleResourceName' | 'email' | 'phone'>,
) => {
  const basis = candidate.googleResourceName?.trim().toLowerCase() || normalizeEmail(candidate.email) || normalizePhone(candidate.phone);
  if (!basis) return undefined;
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${source}:${basis}`));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const findRelationshipMergeSuggestion = (
  item: Pick<RelationshipImportInboxItem, 'name' | 'email' | 'phone'>,
  relationships: RelationshipRecord[],
) => {
  const email = normalizeEmail(item.email);
  const phone = normalizePhone(item.phone);
  const name = normalizeName(item.name);
  return relationships.find((relationship) => {
    if (email && normalizeEmail(relationship.email) === email) return true;
    if (phone && normalizePhone(relationship.phone) === phone) return true;
    return Boolean(name && normalizeName(relationship.name) === name);
  })?.id;
};

export const googlePersonToRelationshipImport = (
  person: GooglePerson,
): Omit<RelationshipImportInboxItem, 'id' | 'userId' | 'source' | 'status' | 'createdAt' | 'updatedAt'> | null => {
  const primaryName = person.names?.find((name) => name.displayName)?.displayName || person.names?.[0]?.displayName;
  const email = person.emailAddresses?.find((item) => item.value)?.value;
  const phone = person.phoneNumbers?.find((item) => item.value)?.value;
  const organization = person.organizations?.find((item) => item.name || item.title);
  if (!primaryName && !email && !phone) return null;
  return {
    googleResourceName: person.resourceName,
    name: primaryName || email || phone || 'Imported person',
    photoUrl: person.photos?.find((photo) => photo.url && !photo.default)?.url,
    email,
    phone,
    company: organization?.name,
    role: organization?.title,
  };
};

export const fetchAllGoogleConnections = async (
  token: string,
  fetcher: typeof fetch = fetch,
): Promise<{ connections: GooglePerson[]; needsReconnect: boolean }> => {
  const connections: GooglePerson[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL('https://people.googleapis.com/v1/people/me/connections');
    url.searchParams.set('personFields', 'names,emailAddresses,phoneNumbers,photos,organizations');
    url.searchParams.set('pageSize', '500');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await fetcher(url, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 401 || response.status === 403) return { connections: [], needsReconnect: true };
    if (!response.ok) throw new Error('Google Contacts import failed.');
    const body = await response.json() as { connections?: GooglePerson[]; nextPageToken?: string };
    connections.push(...(body.connections || []));
    pageToken = body.nextPageToken;
  } while (pageToken);
  return { connections, needsReconnect: false };
};

export const buildNonDestructiveMerge = (
  relationship: RelationshipRecord,
  item: RelationshipImportInboxItem,
  additions: Pick<Partial<RelationshipRecord>, 'tags' | 'hooks'>,
): Partial<RelationshipRecord> => {
  const tagKeys = new Set(relationship.tags.map((tag) => `${tag.category}:${tag.label.toLowerCase()}`));
  return {
    photoUrl: relationship.photoUrl || item.photoUrl,
    email: relationship.email || item.email,
    phone: relationship.phone || item.phone,
    company: relationship.company || item.company,
    role: relationship.role || item.role,
    tags: [...relationship.tags, ...(additions.tags || []).filter((tag) => !tagKeys.has(`${tag.category}:${tag.label.toLowerCase()}`))],
    hooks: [...relationship.hooks, ...(additions.hooks || [])],
  };
};
