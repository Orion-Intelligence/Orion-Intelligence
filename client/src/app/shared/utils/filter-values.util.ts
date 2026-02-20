export function countFilterValues(source: Record<string, any> | null | undefined): number {
  if (!source) {
    return 0;
  }
  return Object.values(source).reduce((count, value) => {
    if (Array.isArray(value)) {
      return count + value.length;
    }
    return count + 1;
  }, 0);
}
