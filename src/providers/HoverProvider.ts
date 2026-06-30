import * as vscode from 'vscode';
import { hoverTarget } from '../context/hoverTarget';
import { computeHover } from '../complete/computeHover';
import { MetadataStore } from '../data/MetadataStore';

export class BladeHoverProvider implements vscode.HoverProvider {
    constructor(private readonly store: MetadataStore) {}

    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
        const offset = document.offsetAt(position);
        const target = hoverTarget(document.getText(), offset);
        const content = computeHover(target, this.store);
        if (!content) {
            return undefined;
        }
        return new vscode.Hover(new vscode.MarkdownString(content.markdown));
    }
}
