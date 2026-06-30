import {
  NormalizedAttribute, NormalizedTag, NormalizedValue,
  RawAttribute, RawHtmlData, RawTag, RawValue,
} from './HtmlDataTypes';

export interface ParseResult {
  tags: NormalizedTag[];
  error?: string;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeValue(raw: RawValue): NormalizedValue | null {
  if (typeof raw?.name !== 'string') {
    return null;
  }
  return { name: raw.name, description: str(raw.description) };
}

function normalizeAttribute(raw: RawAttribute): NormalizedAttribute | null {
  if (typeof raw?.name !== 'string') {
    return null;
  }
  const values: NormalizedValue[] = [];
  if (Array.isArray(raw.values)) {
    for (const v of raw.values) {
      const nv = normalizeValue(v as RawValue);
      if (nv) {
        values.push(nv);
      }
    }
  }
  return { name: raw.name, description: str(raw.description), values };
}

function normalizeTag(raw: RawTag): NormalizedTag | null {
  if (typeof raw?.name !== 'string') {
    return null;
  }
  const attributes: NormalizedAttribute[] = [];
  if (Array.isArray(raw.attributes)) {
    for (const a of raw.attributes) {
      const na = normalizeAttribute(a as RawAttribute);
      if (na) {
        attributes.push(na);
      }
    }
  }
  return { name: raw.name, description: str(raw.description), attributes };
}

export function parseHtmlData(content: string): ParseResult {
  let data: RawHtmlData;
  try {
    data = JSON.parse(content) as RawHtmlData;
  } catch (e) {
    return { tags: [], error: `Invalid JSON: ${(e as Error).message}` };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { tags: [], error: 'Root is not an object' };
  }
  const tags: NormalizedTag[] = [];
  if (Array.isArray(data.tags)) {
    for (const t of data.tags) {
      const nt = normalizeTag(t as RawTag);
      if (nt) {
        tags.push(nt);
      }
    }
  }
  return { tags };
}
