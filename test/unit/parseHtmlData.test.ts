import * as assert from 'assert';
import { parseHtmlData } from '../../src/data/parseHtmlData';

describe('parseHtmlData', () => {
  it('normalizes a valid file', () => {
    const json = JSON.stringify({
      version: 1.1,
      tags: [{
        name: 'x-btn',
        description: 'A button',
        attributes: [
          { name: 'variant', description: 'Color', values: [{ name: 'primary' }, { name: 'danger', description: 'red' }] },
          { name: 'disabled', description: 'Disable it' },
        ],
      }],
    });
    const result = parseHtmlData(json);
    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.tags.length, 1);
    const tag = result.tags[0];
    assert.strictEqual(tag.name, 'x-btn');
    assert.strictEqual(tag.description, 'A button');
    assert.strictEqual(tag.attributes.length, 2);
    assert.deepStrictEqual(tag.attributes[0].values, [
      { name: 'primary', description: '' },
      { name: 'danger', description: 'red' },
    ]);
    assert.deepStrictEqual(tag.attributes[1].values, []);
  });

  it('returns an error for invalid JSON', () => {
    const result = parseHtmlData('{ not json');
    assert.ok(result.error);
    assert.deepStrictEqual(result.tags, []);
  });

  it('drops tags without a name and fills missing descriptions', () => {
    const json = JSON.stringify({ tags: [{ description: 'no name' }, { name: 'x-card' }] });
    const result = parseHtmlData(json);
    assert.strictEqual(result.tags.length, 1);
    assert.strictEqual(result.tags[0].name, 'x-card');
    assert.strictEqual(result.tags[0].description, '');
    assert.deepStrictEqual(result.tags[0].attributes, []);
  });

  it('ignores attributes and values without a name', () => {
    const json = JSON.stringify({ tags: [{ name: 'x-card', attributes: [
      { description: 'orphan' },
      { name: 'size', values: [{ description: 'no name' }, { name: 'lg' }] },
    ] }] });
    const result = parseHtmlData(json);
    const attrs = result.tags[0].attributes;
    assert.strictEqual(attrs.length, 1);
    assert.strictEqual(attrs[0].name, 'size');
    assert.deepStrictEqual(attrs[0].values, [{ name: 'lg', description: '' }]);
  });

  it('returns an error when the root is not an object with tags', () => {
    assert.ok(parseHtmlData('42').error);
    assert.ok(parseHtmlData('[]').error);
    assert.strictEqual(parseHtmlData('{}').tags.length, 0);
  });
});
