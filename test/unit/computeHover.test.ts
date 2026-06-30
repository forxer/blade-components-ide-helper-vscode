import * as assert from 'assert';
import { computeHover } from '../../src/complete/computeHover';
import { MetadataStore } from '../../src/data/MetadataStore';

function store(): MetadataStore {
  const s = new MetadataStore();
  s.load([{ source: 'a.json', content: JSON.stringify({ tags: [
    { name: 'x-btn', description: 'A button component', attributes: [
      { name: 'variant', description: 'Color variant', values: [{ name: 'primary' }, { name: 'danger' }] },
      { name: 'plain', description: '' },
      { name: 'nodesc', description: '' },
    ] },
  ] }) }]);
  return s;
}

describe('computeHover', () => {
  it('returns the tag description', () => {
    const hover = computeHover({ kind: 'tag', tag: 'x-btn' }, store());
    assert.ok(hover);
    assert.ok(hover!.markdown.includes('A button component'));
  });

  it('returns the attribute description and lists its values', () => {
    const hover = computeHover({ kind: 'attribute', tag: 'x-btn', attribute: 'variant' }, store());
    assert.ok(hover);
    assert.ok(hover!.markdown.includes('Color variant'));
    assert.ok(hover!.markdown.includes('primary'));
    assert.ok(hover!.markdown.includes('danger'));
  });

  it('returns null when there is nothing to show', () => {
    assert.strictEqual(computeHover({ kind: 'attribute', tag: 'x-btn', attribute: 'nodesc' }, store()), null);
    assert.strictEqual(computeHover({ kind: 'attribute', tag: 'x-btn', attribute: 'unknown' }, store()), null);
    assert.strictEqual(computeHover({ kind: 'tag', tag: 'x-unknown' }, store()), null);
    assert.strictEqual(computeHover({ kind: 'none' }, store()), null);
  });
});
