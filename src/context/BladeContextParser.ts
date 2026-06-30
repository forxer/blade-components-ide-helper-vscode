export type BladeContext =
  | { kind: 'none' }
  | { kind: 'tag-name'; typed: string }
  | { kind: 'attribute-name'; tag: string; typed: string; bound: boolean; present: string[] }
  | { kind: 'attribute-value'; tag: string; attribute: string; bound: boolean; typed: string };

const WINDOW = 2000;

interface AttrScan {
  inValue: boolean;
  attribute: string;
  valueBound: boolean;
  valueTyped: string;
  nameTyped: string;
  nameBound: boolean;
  present: string[];
}

/**
 * Scans the text *after the tag name* (cursor at the end) to find the current attribute state.
 *
 * A name token is held as `pending` until we learn its role: a following `=` + quote means it owns a
 * value (so it is "present" once the value closes); a following new name token means it was a boolean
 * attribute (so it becomes "present" then). This two-step handling is what makes `variant = "x"`
 * (spaces around `=`) and value-bearing attributes report correctly.
 */
function scanAttributes(s: string): AttrScan {
  let inValue = false;
  let quote = '';
  let valueStart = -1;
  let name = '';            // token currently being read
  let bound = false;
  let pending = '';         // a completed name token awaiting its role
  let pendingBound = false;
  let hasPending = false;
  let expectValue = false;  // a '=' was seen for `pending`
  let ownerName = '';       // attribute owning the value we are inside
  let ownerBound = false;
  const present: string[] = [];

  const flushPendingBoolean = () => {
    if (hasPending && pending !== '') {
      present.push(pending);
    }
    pending = '';
    pendingBound = false;
    hasPending = false;
  };

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (inValue) {
      if (c === quote) {
        inValue = false;
        quote = '';
        if (ownerName !== '') {
          present.push(ownerName);
        }
        ownerName = '';
        expectValue = false;
      }
      continue;
    }

    if (c === '"' || c === "'") {
      inValue = true;
      quote = c;
      valueStart = i + 1;
      if (expectValue && hasPending) {
        ownerName = pending;
        ownerBound = pendingBound;
      } else if (name !== '') {
        ownerName = name;
        ownerBound = bound;
      } else {
        ownerName = '';
        ownerBound = false;
      }
      name = '';
      bound = false;
      pending = '';
      hasPending = false;
      continue;
    }

    if (c === '=') {
      if (name !== '') {
        pending = name;
        pendingBound = bound;
        hasPending = true;
        name = '';
        bound = false;
      }
      expectValue = true;
      continue;
    }

    if (/\s/.test(c)) {
      if (name !== '') {
        flushPendingBoolean();
        pending = name;
        pendingBound = bound;
        hasPending = true;
        name = '';
        bound = false;
      }
      continue;
    }

    if (c === '/') {
      continue;
    }

    if (c === ':' && name === '') {
      bound = true;
      continue;
    }

    // a name character begins/continues a token; a new token flushes a pending boolean attribute
    if (hasPending && !expectValue) {
      flushPendingBoolean();
    }
    name += c;
  }

  if (inValue) {
    return {
      inValue: true,
      attribute: ownerName,
      valueBound: ownerBound,
      valueTyped: s.slice(valueStart),
      nameTyped: '',
      nameBound: false,
      present,
    };
  }
  if (hasPending && pending !== '') {
    present.push(pending);
  }
  return {
    inValue: false,
    attribute: '',
    valueBound: false,
    valueTyped: '',
    nameTyped: name,
    nameBound: bound,
    present,
  };
}

export function parseBladeContext(text: string, offset: number): BladeContext {
  const start = Math.max(0, offset - WINDOW);
  const before = text.slice(start, offset);

  const lt = before.lastIndexOf('<');
  if (lt === -1) {
    return { kind: 'none' };
  }
  const gt = before.lastIndexOf('>');
  if (gt > lt) {
    return { kind: 'none' };
  }

  const slice = before.slice(lt); // from '<' up to the cursor (contains no '>')
  const match = /^<x-([A-Za-z0-9-]*)/.exec(slice);
  if (!match) {
    return { kind: 'none' }; // '</x-', '<div', '<x ' without '-', etc.
  }

  const afterName = slice.slice(match[0].length);
  const tag = 'x-' + match[1];

  if (afterName.length === 0) {
    return { kind: 'tag-name', typed: tag };
  }

  const scan = scanAttributes(afterName);
  if (scan.inValue) {
    return { kind: 'attribute-value', tag, attribute: scan.attribute, bound: scan.valueBound, typed: scan.valueTyped };
  }
  return { kind: 'attribute-name', tag, typed: scan.nameTyped, bound: scan.nameBound, present: scan.present };
}
