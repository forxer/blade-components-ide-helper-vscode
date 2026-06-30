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

  // Find the enclosing open tag.
  const upto = text.slice(0, startWord);
  const lt = upto.lastIndexOf('<');
  if (lt === -1) {
    return { kind: 'none' };
  }
  const between = text.slice(lt, startWord);
  if (between.includes('>')) {
    return { kind: 'none' };
  }
  const head = text.slice(lt);
  const tagMatch = /^<x-([A-Za-z0-9-]+)/.exec(head);
  if (!tagMatch) {
    return { kind: 'none' };
  }
  const tag = 'x-' + tagMatch[1];

  if (word === tag) {
    return { kind: 'tag', tag };
  }
  return { kind: 'attribute', tag, attribute: word.replace(/^:/, '') };
}
