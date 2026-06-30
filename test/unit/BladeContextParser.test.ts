import * as assert from 'assert';
import { parseBladeContext, BladeContext } from '../../src/context/BladeContextParser';

function ctx(input: string): BladeContext {
  const offset = input.indexOf('|');
  assert.ok(offset >= 0, 'test input must contain a | cursor marker');
  const text = input.slice(0, offset) + input.slice(offset + 1);
  return parseBladeContext(text, offset);
}

describe('parseBladeContext', () => {
  it('detects tag-name while typing the component', () => {
    assert.deepStrictEqual(ctx('<x-bt|'), { kind: 'tag-name', typed: 'x-bt' });
    assert.deepStrictEqual(ctx('<x-|'), { kind: 'tag-name', typed: 'x-' });
  });

  it('detects attribute-name after the tag name', () => {
    assert.deepStrictEqual(ctx('<x-btn |'), { kind: 'attribute-name', tag: 'x-btn', typed: '', bound: false, present: [] });
    assert.deepStrictEqual(ctx('<x-btn siz|'), { kind: 'attribute-name', tag: 'x-btn', typed: 'siz', bound: false, present: [] });
  });

  it('detects a bound attribute name', () => {
    assert.deepStrictEqual(ctx('<x-btn :siz|'), { kind: 'attribute-name', tag: 'x-btn', typed: 'siz', bound: true, present: [] });
  });

  it('lists attributes already present before the cursor', () => {
    const result = ctx('<x-btn variant="primary" siz|');
    assert.strictEqual(result.kind, 'attribute-name');
    if (result.kind === 'attribute-name') {
      assert.deepStrictEqual(result.present, ['variant']);
    }
  });

  it('detects attribute-value inside double quotes', () => {
    assert.deepStrictEqual(ctx('<x-btn variant="prim|"'),
      { kind: 'attribute-value', tag: 'x-btn', attribute: 'variant', bound: false, typed: 'prim' });
  });

  it('detects attribute-value inside single quotes with spaces around equals', () => {
    assert.deepStrictEqual(ctx("<x-btn variant = '|'"),
      { kind: 'attribute-value', tag: 'x-btn', attribute: 'variant', bound: false, typed: '' });
  });

  it('marks a bound attribute value (PHP expression)', () => {
    const result = ctx('<x-btn :variant="$va|"');
    assert.strictEqual(result.kind, 'attribute-value');
    if (result.kind === 'attribute-value') {
      assert.strictEqual(result.bound, true);
      assert.strictEqual(result.attribute, 'variant');
    }
  });

  it('returns none outside any tag', () => {
    assert.deepStrictEqual(ctx('<x-btn>text |'), { kind: 'none' });
    assert.deepStrictEqual(ctx('plain |text'), { kind: 'none' });
  });

  it('returns none for a closed / self-closing tag once past >', () => {
    assert.deepStrictEqual(ctx('<x-btn variant="primary" />|'), { kind: 'none' });
  });

  it('ignores non-component and closing tags', () => {
    assert.deepStrictEqual(ctx('<div clas|'), { kind: 'none' });
    assert.deepStrictEqual(ctx('</x-bt|n>'), { kind: 'none' });
  });

  it('handles a multi-line open tag', () => {
    assert.deepStrictEqual(ctx('<x-btn\n    variant="prim|"'),
      { kind: 'attribute-value', tag: 'x-btn', attribute: 'variant', bound: false, typed: 'prim' });
  });
});
