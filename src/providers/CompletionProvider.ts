import * as vscode from 'vscode';
import { parseBladeContext } from '../context/BladeContextParser';
import { computeCompletions, CompletionDescriptor } from '../complete/computeCompletions';
import { MetadataStore } from '../data/MetadataStore';

const KIND_MAP: Record<CompletionDescriptor['kind'], vscode.CompletionItemKind> = {
    tag: vscode.CompletionItemKind.Class,
    attribute: vscode.CompletionItemKind.Property,
    value: vscode.CompletionItemKind.EnumMember,
};

export class BladeCompletionProvider implements vscode.CompletionItemProvider {
    static readonly triggerCharacters = ['-', ' ', '"', "'", ':'];

    constructor(private readonly store: MetadataStore) {}

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): vscode.CompletionItem[] {
        const offset = document.offsetAt(position);
        const ctx = parseBladeContext(document.getText(), offset);
        const descriptors = computeCompletions(ctx, this.store);

        return descriptors.map(descriptor => this.toItem(document, position, offset, descriptor));
    }

    private toItem(
        document: vscode.TextDocument,
        position: vscode.Position,
        offset: number,
        descriptor: CompletionDescriptor,
    ): vscode.CompletionItem {
        const item = new vscode.CompletionItem(descriptor.label, KIND_MAP[descriptor.kind]);

        if (descriptor.isSnippet) {
            item.insertText = new vscode.SnippetString(descriptor.insertText);
        } else {
            item.insertText = descriptor.insertText;
        }

        if (descriptor.replaceTypedLength > 0) {
            const startPos = document.positionAt(offset - descriptor.replaceTypedLength);
            item.range = new vscode.Range(startPos, position);
        }

        if (descriptor.documentation) {
            item.documentation = new vscode.MarkdownString(descriptor.documentation);
        }
        if (descriptor.detail) {
            item.detail = descriptor.detail;
        }
        if (descriptor.retriggerSuggest) {
            item.command = { command: 'editor.action.triggerSuggest', title: 'Suggest values' };
        }
        return item;
    }
}
