import { BladeContext } from '../context/BladeContextParser';
import { MetadataStore } from '../data/MetadataStore';

export interface CompletionDescriptor {
  label: string;
  kind: 'tag' | 'attribute' | 'value';
  insertText: string;
  isSnippet: boolean;
  replaceTypedLength: number;
  documentation?: string;
  detail?: string;
  retriggerSuggest: boolean;
}

export function computeCompletions(ctx: BladeContext, store: MetadataStore): CompletionDescriptor[] {
  switch (ctx.kind) {
    case 'tag-name':
      return store.getTags().map(tag => ({
        label: tag.name,
        kind: 'tag' as const,
        insertText: tag.name,
        isSnippet: false,
        replaceTypedLength: ctx.typed.length,
        documentation: tag.description || undefined,
        retriggerSuggest: false,
      }));

    case 'attribute-name': {
      const present = new Set(ctx.present);
      return store.getAttributes(ctx.tag)
        .filter(attr => !present.has(attr.name))
        .map(attr => {
          const hasValues = attr.values.length > 0;
          return {
            label: attr.name,
            kind: 'attribute' as const,
            insertText: hasValues ? `${attr.name}="$0"` : attr.name,
            isSnippet: hasValues,
            replaceTypedLength: ctx.typed.length,
            documentation: attr.description || undefined,
            retriggerSuggest: hasValues,
          };
        });
    }

    case 'attribute-value': {
      if (ctx.bound) {
        return [];
      }
      return store.getValues(ctx.tag, ctx.attribute).map(value => ({
        label: value.name,
        kind: 'value' as const,
        insertText: value.name,
        isSnippet: false,
        replaceTypedLength: ctx.typed.length,
        documentation: value.description || undefined,
        retriggerSuggest: false,
      }));
    }

    default:
      return [];
  }
}
