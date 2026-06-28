export interface AdjacentIds {
  prevId: string | null;
  nextId: string | null;
}

/**
 * Given note ids ordered by `createdAt` descending (newest first), return the
 * neighbours of `currentId`. Previous = the older entry (next in the array),
 * Next = the newer entry (previous in the array). Either is `null` at the ends
 * or when `currentId` is not in the list.
 */
export const getAdjacent = (orderedIds: string[], currentId: string): AdjacentIds => {
  const index = orderedIds.indexOf(currentId);
  if (index === -1) return { prevId: null, nextId: null };

  return {
    prevId: index < orderedIds.length - 1 ? orderedIds[index + 1] : null,
    nextId: index > 0 ? orderedIds[index - 1] : null,
  };
};
