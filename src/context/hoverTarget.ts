export type HoverTarget =
  | { kind: 'none' }
  | { kind: 'tag'; tag: string }
  | { kind: 'attribute'; tag: string; attribute: string };

const WORD = /[A-Za-z0-9_:.-]/;

/** Returns the component token under `offset`, identifying whether it is the tag or an attribute. */
export function hoverTarget(text: string, offset: number): HoverTarget {
  // Expand to the whole word under the cursor.
  let startWord = offset;
  while (startWord > 0 && WORD.test(text[startWord - 1])) {
    startWord--;
  }
  let endWord = offset;
  while (endWord < text.length && WORD.test(text[endWord])) {
    endWord++;
  }
  if (startWord === endWord) {
    return { kind: 'none' };
  }
  const word = text.slice(startWord, endWord);

  // Find the enclosing open tag with a quote-aware forward scan (so '<'/'>' inside quoted
  // values don't fool the lookup) and learn whether the word itself sits inside a value.
  const head = text.slice(0, startWord);
  let tagStart = -1;
  let quote = '';
  for (let i = 0; i < head.length; i++) {
    const c = head[i];
    if (tagStart === -1) {
      if (c === '<') {
        tagStart = i;
        quote = '';
      }
      continue;
    }
    if (quote) {
      if (c === quote) {
        quote = '';
      }
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '<') {
      tagStart = i;
    } else if (c === '>') {
      tagStart = -1;
    }
  }
  if (tagStart === -1) {
    return { kind: 'none' };
  }
  // An unterminated quote means the word is a value literal, not a tag/attribute name.
  if (quote) {
    return { kind: 'none' };
  }
  const tagMatch = /^<x-([A-Za-z0-9-]+)/.exec(text.slice(tagStart));
  if (!tagMatch) {
    return { kind: 'none' };
  }
  const tag = 'x-' + tagMatch[1];

  if (word === tag) {
    return { kind: 'tag', tag };
  }
  return { kind: 'attribute', tag, attribute: word.replace(/^:/, '') };
}
