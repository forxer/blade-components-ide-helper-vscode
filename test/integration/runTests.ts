import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');
    const workspace = path.resolve(__dirname, '../../../test/fixtures/workspace');
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspace, '--disable-extensions'],
    });
  } catch {
    console.error('Failed to run integration tests');
    process.exit(1);
  }
}

void main();
