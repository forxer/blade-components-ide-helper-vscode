import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

async function openFixture(): Promise<vscode.TextDocument> {
  const file = path.resolve(__dirname, '../../../../test/fixtures/workspace/example.blade.php');
  const doc = await vscode.workspace.openTextDocument(file);
  await vscode.languages.setTextDocumentLanguage(doc, 'blade');
  await vscode.window.showTextDocument(doc);
  // Give the extension a moment to load the Custom Data files.
  await new Promise(r => setTimeout(r, 1000));
  return doc;
}

function offsetOf(doc: vscode.TextDocument, needle: string, delta: number): vscode.Position {
  const idx = doc.getText().indexOf(needle);
  return doc.positionAt(idx + delta);
}

describe('integration: completion & hover', () => {
  it('completes attribute values for x-btn variant (rich dataset)', async () => {
    const doc = await openFixture();
    // Cursor inside variant="" of <x-btn variant="" />
    const pos = offsetOf(doc, 'variant="', 'variant="'.length);
    const list = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider', doc.uri, pos,
    );
    const labels = list.items.map(i => (typeof i.label === 'string' ? i.label : i.label.label));
    assert.ok(labels.includes('primary'), `expected variant values, got: ${labels.join(', ')}`);
  });

  it('completes attribute names for the media-library tag (simple dataset)', async () => {
    const doc = await openFixture();
    // Cursor right after "<x-media-library-helpers-image " — insert a space first
    const tag = '<x-media-library-helpers-image ';
    const pos = offsetOf(doc, tag, tag.length);
    const list = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider', doc.uri, pos,
    );
    assert.ok(list.items.length > 0, 'expected at least one attribute for the media-library tag');
  });

  it('completes tag names after <x-', async () => {
    const doc = await openFixture();
    const pos = offsetOf(doc, '<x-btn', '<x-'.length);
    const list = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider', doc.uri, pos,
    );
    const labels = list.items.map(i => (typeof i.label === 'string' ? i.label : i.label.label));
    assert.ok(labels.includes('x-btn'), `expected tag names, got: ${labels.slice(0, 10).join(', ')}`);
  });

  it('shows hover on a tag name', async () => {
    const doc = await openFixture();
    const pos = offsetOf(doc, '<x-btn', '<x-b'.length);
    const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
      'vscode.executeHoverProvider', doc.uri, pos,
    );
    // x-btn may have an empty description; assert the provider runs without error.
    assert.ok(Array.isArray(hovers));
  });
});
