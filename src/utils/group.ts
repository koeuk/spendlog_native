export interface Group<T> {
  key: string;
  items: T[];
}

/** Consecutive items sharing a key, in the order they arrive: a list already sorted by day becomes day groups. */
export function groupConsecutive<T>(items: T[], keyOf: (item: T) => string): Group<T>[] {
  const groups: Group<T>[] = [];
  for (const item of items) {
    const key = keyOf(item);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
}
