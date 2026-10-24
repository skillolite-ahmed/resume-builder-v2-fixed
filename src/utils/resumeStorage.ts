export function parseStoredRecord(raw: string | null): Record<string, string> | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return undefined;
    }

    const record: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      record[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    return record;
  } catch {
    return undefined;
  }
}

export function readStoredRecord(storage: Storage, key: string): Record<string, string> | undefined {
  return parseStoredRecord(storage.getItem(key));
}

export function writeStoredRecord(storage: Storage, key: string, values: Record<string, string>): void {
  storage.setItem(key, JSON.stringify(values));
}
