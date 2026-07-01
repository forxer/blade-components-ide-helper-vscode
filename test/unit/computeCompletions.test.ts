import * as assert from 'assert';
import { computeCompletions } from '../../src/complete/computeCompletions';
import { MetadataStore } from '../../src/data/MetadataStore';

function store(): MetadataStore {
  const s = new MetadataStore();
  s.load([{ source: 'a.json', content: JSON.stringify({ tags: [
    { name: 'x-btn', description: 'Button', attributes: [
      { name: 'variant', description: 'Color', values: [{ name: 'primary' }, { name: 'danger' }] },
      { name: 'disabled', description: 'Disable' },
    ] },
    { name: 'x-card', description: 'Card', attributes: [] },
  ] }) }]);
  return s;
}

describe('computeCompletions', () => {
  it('suggests tag names and replaces the typed prefix', () => {
    const items = computeCompletions({ kind: 'tag-name', typed: 'x-b' }, store());
    assert.deepStrictEqual(items.map(i => i.label).sort(), ['x-btn', 'x-card']);
    const btn = items.find(i => i.label === 'x-btn')!;
    assert.strictEqual(btn.kind, 'tag');
    assert.strictEqual(btn.insertText, 'x-btn');
    assert.strictEqual(btn.isSnippet, false);
    assert.strictEqual(btn.replaceTypedLength, 3);
    assert.strictEqual(btn.documentation, 'Button');
  });

  it('suggests attribute names, snippet only when the attribute has values', () => {
    const items = computeCompletions({ kind: 'attribute-name', tag: 'x-btn', typed: 'va', bound: false, present: [] }, store());
    assert.deepStrictEqual(items.map(i => i.label).sort(), ['disabled', 'variant']);
    const variant = items.find(i => i.label === 'variant')!;
    assert.strictEqual(variant.insertText, 'variant="$0"');
    assert.strictEqual(variant.isSnippet, true);
    assert.strictEqual(variant.retriggerSuggest, true);
    assert.strictEqual(variant.replaceTypedLength, 2);
    const disabled = items.find(i => i.label === 'disabled')!;
    assert.strictEqual(disabled.insertText, 'disabled');
    assert.strictEqual(disabled.isSnippet, false);
    assert.strictEqual(disabled.retriggerSuggest, false);
  });

  it('filters out attributes already present', () => {
    const items = computeCompletions({ kind: 'attribute-name', tag: 'x-btn', typed: '', bound: false, present: ['variant'] }, store());
    assert.deepStrictEqual(items.map(i => i.label), ['disabled']);
  });

  it('suggests constrained values', () => {
    const items = computeCompletions({ kind: 'attribute-value', tag: 'x-btn', attribute: 'variant', bound: false, typed: 'pr' }, store());
    assert.deepStrictEqual(items.map(i => i.label), ['primary', 'danger']);
    assert.strictEqual(items[0].kind, 'value');
    assert.strictEqual(items[0].insertText, 'primary');
    assert.strictEqual(items[0].replaceTypedLength, 2);
  });

  it('suggests nothing for a bound attribute value', () => {
    const items = computeCompletions({ kind: 'attribute-value', tag: 'x-btn', attribute: 'variant', bound: true, typed: '' }, store());
    assert.deepStrictEqual(items, []);
  });

  it('suggests nothing for an attribute without values or an unknown tag', () => {
    assert.deepStrictEqual(computeCompletions({ kind: 'attribute-value', tag: 'x-btn', attribute: 'disabled', bound: false, typed: '' }, store()), []);
    assert.deepStrictEqual(computeCompletions({ kind: 'none' }, store()), []);
  });

  it('ranks our items first with a low sortText and preselects the first', () => {
    const items = computeCompletions({ kind: 'attribute-value', tag: 'x-btn', attribute: 'variant', bound: false, typed: '' }, store());
    // Every sortText starts with "0" so it sorts before "@…" directives and letter-prefixed snippets.
    assert.ok(items.every(i => i.sortText.startsWith('0')));
    // Strictly increasing keys preserve our own order.
    const keys = items.map(i => i.sortText);
    assert.deepStrictEqual(keys, [...keys].sort());
    assert.strictEqual(items[0].preselect, true);
    assert.strictEqual(items[1].preselect, false);
  });
});
