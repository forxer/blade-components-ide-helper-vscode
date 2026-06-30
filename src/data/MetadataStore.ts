import { NormalizedAttribute, NormalizedTag, NormalizedValue } from './HtmlDataTypes';
import { parseHtmlData } from './parseHtmlData';

export interface DataFileInput {
  source: string;
  content: string;
}

export class MetadataStore {
  private tags = new Map<string, NormalizedTag>();

  /** Rebuilds the whole index. Returns human-readable warnings (parse errors, collisions). */
  load(files: DataFileInput[]): string[] {
    const warnings: string[] = [];
    this.tags = new Map();
    const sorted = [...files].sort((a, b) => a.source.localeCompare(b.source));

    for (const file of sorted) {
      const result = parseHtmlData(file.content);
      if (result.error) {
        warnings.push(`${file.source}: ${result.error}`);
        continue;
      }
      for (const tag of result.tags) {
        const existing = this.tags.get(tag.name);
        if (!existing) {
          this.tags.set(tag.name, this.cloneTag(tag));
          continue;
        }
        warnings.push(`Tag "${tag.name}" declared in multiple files; merging (first source wins on conflicts).`);
        this.mergeInto(existing, tag);
      }
    }
    return warnings;
  }

  getTags(): NormalizedTag[] {
    return [...this.tags.values()];
  }

  getTag(name: string): NormalizedTag | undefined {
    return this.tags.get(name);
  }

  getAttributes(tagName: string): NormalizedAttribute[] {
    return this.tags.get(tagName)?.attributes ?? [];
  }

  getValues(tagName: string, attributeName: string): NormalizedValue[] {
    const attr = this.getAttributes(tagName).find(a => a.name === attributeName);
    return attr?.values ?? [];
  }

  private cloneTag(tag: NormalizedTag): NormalizedTag {
    return {
      name: tag.name,
      description: tag.description,
      attributes: tag.attributes.map(a => ({ name: a.name, description: a.description, values: [...a.values] })),
    };
  }

  private mergeInto(target: NormalizedTag, incoming: NormalizedTag): void {
    const seen = new Set(target.attributes.map(a => a.name));
    for (const attr of incoming.attributes) {
      if (!seen.has(attr.name)) {
        target.attributes.push({ name: attr.name, description: attr.description, values: [...attr.values] });
        seen.add(attr.name);
      }
    }
  }
}
