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
  /**
   * Sort key handed to VS Code. It starts with a low character ("0") so our items rank ahead of
   * other providers' contributions (the package's `.code-snippets`, the Blade extension's `@`
   * directives) which sort by their letter/`@` prefixes. The zero-padded index preserves our order.
   */
  sortText: string;
  /** The first item of each list is preselected so Enter accepts it without scrolling. */
  preselect: boolean;
}

/** Sort key that ranks our items above other providers while keeping our own order stable. */
function sortKey(index: number): string {
  return '0' + String(index).padStart(4, '0');
}

export function computeCompletions(ctx: BladeContext, store: MetadataStore): CompletionDescriptor[] {
  switch (ctx.kind) {
    case 'tag-name':
      return store.getTags().map((tag, index) => ({
        label: tag.name,
        kind: 'tag' as const,
        insertText: tag.name,
        isSnippet: false,
        replaceTypedLength: ctx.typed.length,
        documentation: tag.description || undefined,
        retriggerSuggest: false,
        sortText: sortKey(index),
        preselect: index === 0,
      }));

    case 'attribute-name': {
      const present = new Set(ctx.present);
      return store.getAttributes(ctx.tag)
        .filter(attr => !present.has(attr.name))
        .map((attr, index) => {
          const hasValues = attr.values.length > 0;
          return {
            label: attr.name,
            kind: 'attribute' as const,
            insertText: hasValues ? `${attr.name}="$0"` : attr.name,
            isSnippet: hasValues,
            replaceTypedLength: ctx.typed.length,
            documentation: attr.description || undefined,
            retriggerSuggest: hasValues,
            sortText: sortKey(index),
            preselect: index === 0,
          };
        });
    }

    case 'attribute-value': {
      if (ctx.bound) {
        return [];
      }
      return store.getValues(ctx.tag, ctx.attribute).map((value, index) => ({
        label: value.name,
        kind: 'value' as const,
        insertText: value.name,
        isSnippet: false,
        replaceTypedLength: ctx.typed.length,
        documentation: value.description || undefined,
        retriggerSuggest: false,
        sortText: sortKey(index),
        preselect: index === 0,
      }));
    }

    default:
      return [];
  }
}
