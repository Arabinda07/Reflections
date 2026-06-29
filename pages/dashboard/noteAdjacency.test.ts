import { describe, expect, it } from 'vitest';

import { getAdjacent } from './noteAdjacency';

// ids ordered newest-first (createdAt DESC). prev = older, next = newer.
const ids = ['c', 'b', 'a'];

describe('getAdjacent', () => {
  it('returns older as prev and newer as next in the middle', () => {
    expect(getAdjacent(ids, 'b')).toEqual({ prevId: 'a', nextId: 'c' });
  });

  it('has no newer entry at the newest end', () => {
    expect(getAdjacent(ids, 'c')).toEqual({ prevId: 'b', nextId: null });
  });

  it('has no older entry at the oldest end', () => {
    expect(getAdjacent(ids, 'a')).toEqual({ prevId: null, nextId: 'b' });
  });

  it('returns nulls for an unknown id', () => {
    expect(getAdjacent(ids, 'z')).toEqual({ prevId: null, nextId: null });
  });

  it('returns nulls for a single-note list', () => {
    expect(getAdjacent(['only'], 'only')).toEqual({ prevId: null, nextId: null });
  });
});
