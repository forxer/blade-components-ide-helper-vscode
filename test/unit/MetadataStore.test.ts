import * as assert from 'assert';
import { MetadataStore } from '../../src/data/MetadataStore';

const fileA = JSON.stringify({ tags: [
  { name: 'x-btn', description: 'Button', attributes: [
    { name: 'variant', description: 'Color', values: [{ name: 'primary' }] },
  ] },
] });

const fileB = JSON.stringify({ tags: [
  { name: 'x-card', description: 'Card', attributes: [{ name: 'title', description: 'Heading' }] },
] });

describe('MetadataStore', () => {
  it('merges tags from several files', () => {
    const store = new MetadataStore();
    store.load([{ source: 'b.json', content: fileB }, { source: 'a.json', content: fileA }]);
    assert.deepStrictEqual(store.getTags().map(t => t.name).sort(), ['x-btn', 'x-card']);
    assert.strictEqual(store.getTag('x-btn')?.description, 'Button');
    assert.strictEqual(store.getAttributes('x-btn').length, 1);
    assert.deepStrictEqual(store.getValues('x-btn', 'variant').map(v => v.name), ['primary']);
    assert.deepStrictEqual(store.getValues('x-card', 'title'), []);
    assert.deepStrictEqual(store.getValues('x-missing', 'nope'), []);
  });

  it('merges attributes when two files declare the same tag, first source wins on conflict', () => {
    const first = JSON.stringify({ tags: [{ name: 'x-btn', description: 'First', attributes: [
      { name: 'variant', description: 'from-a' },
    ] }] });
    const second = JSON.stringify({ tags: [{ name: 'x-btn', description: 'Second', attributes: [
      { name: 'variant', description: 'from-b' },
      { name: 'size', description: 'from-b' },
    ] }] });
    const store = new MetadataStore();
    // sources sorted alphabetically: a.json before b.json
    const warnings = store.load([{ source: 'b.json', content: second }, { source: 'a.json', content: first }]);
    const btn = store.getTag('x-btn')!;
    assert.strictEqual(btn.description, 'First');
    assert.deepStrictEqual(btn.attributes.map(a => a.name).sort(), ['size', 'variant']);
    assert.strictEqual(store.getAttributes('x-btn').find(a => a.name === 'variant')?.description, 'from-a');
    assert.ok(warnings.some(w => w.includes('x-btn')));
  });

  it('rebuilds from scratch on reload', () => {
    const store = new MetadataStore();
    store.load([{ source: 'a.json', content: fileA }]);
    store.load([{ source: 'b.json', content: fileB }]);
    assert.deepStrictEqual(store.getTags().map(t => t.name), ['x-card']);
  });

  it('collects parse errors as warnings without throwing', () => {
    const store = new MetadataStore();
    const warnings = store.load([{ source: 'broken.json', content: '{ oops' }]);
    assert.strictEqual(store.getTags().length, 0);
    assert.ok(warnings.some(w => w.includes('broken.json')));
  });
});
