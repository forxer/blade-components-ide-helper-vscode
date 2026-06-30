import { HoverTarget } from '../context/hoverTarget';
import { MetadataStore } from '../data/MetadataStore';

export interface HoverContent {
  markdown: string;
}

export function computeHover(target: HoverTarget, store: MetadataStore): HoverContent | null {
  if (target.kind === 'tag') {
    const tag = store.getTag(target.tag);
    if (!tag || !tag.description) {
      return null;
    }
    return { markdown: tag.description };
  }

  if (target.kind === 'attribute') {
    const attr = store.getAttributes(target.tag).find(a => a.name === target.attribute);
    if (!attr) {
      return null;
    }
    const parts: string[] = [];
    if (attr.description) {
      parts.push(attr.description);
    }
    if (attr.values.length > 0) {
      parts.push('**Allowed values:** ' + attr.values.map(v => '`' + v.name + '`').join(', '));
    }
    if (parts.length === 0) {
      return null;
    }
    return { markdown: parts.join('\n\n') };
  }

  return null;
}
