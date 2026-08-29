export type UnknownRecord = Record<string, unknown>;
export type Augmented<TBase, TExtension> = TBase & TExtension;
export type Either<TLeft, TRight> = TLeft | TRight;
export type Nullable<T> = T | null;
export type Nullish<T> = T | null | undefined;

export function isUnknownRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asUnknownRecord(value: unknown): UnknownRecord {
  return isUnknownRecord(value) ? value : {};
}

export function readUnknownRecord(value: unknown, key: string): UnknownRecord {
  return asUnknownRecord(asUnknownRecord(value)[key]);
}

export function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
