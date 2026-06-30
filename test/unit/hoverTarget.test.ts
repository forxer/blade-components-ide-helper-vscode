import * as assert from 'assert';
import { hoverTarget, HoverTarget } from '../../src/context/hoverTarget';

function at(input: string): HoverTarget {
  const offset = input.indexOf('|');
  const text = input.slice(0, offset) + input.slice(offset + 1);
  return hoverTarget(text, offset);
}

describe('hoverTarget', () => {
  it('identifies the tag name', () => {
    assert.deepStrictEqual(at('<x-b|tn variant="primary">'), { kind: 'tag', tag: 'x-btn' });
  });

  it('identifies an attribute name', () => {
    assert.deepStrictEqual(at('<x-btn vari|ant="primary">'), { kind: 'attribute', tag: 'x-btn', attribute: 'variant' });
  });

  it('strips the bound colon from an attribute', () => {
    assert.deepStrictEqual(at('<x-btn :vari|ant="$x">'), { kind: 'attribute', tag: 'x-btn', attribute: 'variant' });
  });

  it('returns none outside a component tag', () => {
    assert.deepStrictEqual(at('<div cla|ss="x">'), { kind: 'none' });
    assert.deepStrictEqual(at('hello wo|rld'), { kind: 'none' });
  });

  it('returns none when hovering content after the tag closes', () => {
    assert.deepStrictEqual(at('<x-btn>tex|t</x-btn>'), { kind: 'none' });
  });
});
