/** Raw shapes as found in a VS Code Custom Data file (every field optional/untrusted). */
export interface RawValue { name?: unknown; description?: unknown; }
export interface RawAttribute { name?: unknown; description?: unknown; values?: unknown; }
export interface RawTag { name?: unknown; description?: unknown; attributes?: unknown; }
export interface RawHtmlData { version?: unknown; tags?: unknown; }

/** Normalized shapes used everywhere downstream (all fields present). */
export interface NormalizedValue { name: string; description: string; }
export interface NormalizedAttribute { name: string; description: string; values: NormalizedValue[]; }
export interface NormalizedTag { name: string; description: string; attributes: NormalizedAttribute[]; }
