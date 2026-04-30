export const stripHtml = (value = '') =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const countBy = (values: string[]) =>
  values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

export const topEntries = (counts: Record<string, number>, limit: number) =>
  Object.entries(counts)
    .sort(([aKey, aValue], [bKey, bValue]) => bValue - aValue || aKey.localeCompare(bKey))
    .slice(0, limit);
