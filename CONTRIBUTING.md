# Contributing / Developer guide

This guide assumes you know PHP/Composer but are new to the VS Code / Node / TypeScript world. Where
useful, it draws the parallel with tools you already know.

## The ecosystem in one table

| You know (PHP)        | Here (Node)              | Role |
|-----------------------|--------------------------|------|
| `composer`            | `npm`                    | dependency manager |
| `composer.json`       | `package.json`           | project manifest + scripts |
| `composer.lock`       | `package-lock.json`      | locked dependency versions |
| `vendor/`             | `node_modules/`          | installed dependencies (git-ignored) |
| Composer scripts      | `npm run <script>`       | task runner (see the `scripts` block of `package.json`) |
| PHP runs as-is        | TypeScript is compiled   | `.ts` files are turned into `.js` before they run |

## Prerequisites

- **Node.js 20+** and **npm** (they come together). Check with `node --version`.
- That's it — no global tooling required; everything else is installed locally by `npm install`.

## Getting started

```bash
npm install        # like `composer install`: reads package.json, fills node_modules/
npm run test:unit  # compile + run the unit tests; confirms your setup works
```

## Project structure

The code is split into **pure logic** and **VS Code adapters**. This boundary is the most important
convention in the project.

```
src/
  data/        # parse + merge the *.html-data.json files      (pure)
  context/     # locate the cursor inside a <x-…> tag           (pure)
  complete/    # turn (context + data) into plain descriptors   (pure)
  providers/   # wrap descriptors into VS Code objects          (adapter)
  vscode/      # file discovery, watchers, output channel       (adapter)
  extension.ts # activate(): wires everything together          (adapter)
```

**Rule:** files under `data/`, `context/` and `complete/` must **never** `import 'vscode'`. That is
what lets them run under the test runner without launching an editor. Only the adapter files talk to
the VS Code API.

## Everyday commands

| Command | What it does |
|---------|--------------|
| `npm run compile` | Type-check with the TypeScript compiler (`tsc`) and emit `.js` into `out/` (used by tests). Think of it as a linter/compiler pass. |
| `npm run bundle` | Bundle the whole extension into a single `dist/extension.js` with esbuild. **This is the file that ships.** |
| `npm run test:unit` | Compile, then run the Mocha unit tests over the pure logic. Fast, no editor needed. |
| `npm run test:integration` | Launch a headless VS Code and drive the real providers. Needs a GUI stack (does not run in a plain WSL shell). |
| `npm run package` | Produce a `blade-components-ide-helper-<version>.vsix` installable file. |

## Running / debugging the extension (F5)

1. Open **this project's folder** in VS Code.
2. Press **F5** (menu: *Run → Start Debugging*). VS Code builds the extension and opens a **second
   window** called the *Extension Development Host*, where your extension is active.
3. In that second window, open a Laravel project that has `.vscode/*.html-data.json` files (or open
   this repo's `test/fixtures/workspace/` folder, which ships two real ones), open a `.blade.php`
   file, and try typing `<x-`.

The F5 configuration lives in `.vscode/launch.json`; it runs `npm run bundle` first (see
`.vscode/tasks.json`).

## Tests

- Unit tests live in `test/unit/` and use **Mocha** + Node's built-in `assert`.
- We follow **TDD**: write the failing test first, then the implementation.
- Run a single file: `npx mocha out/test/unit/<name>.test.js` (after `npm run compile`), or just
  `npm run test:unit` for all of them.
- Integration tests live in `test/integration/`. They need a graphical environment; if you are in a
  bare WSL shell they won't launch — the unit suite is the gate.

## Code conventions

- **English only** for code, comments and identifiers.
- Keep the pure/adapter boundary (see above).
- Match the style of the file you are editing.

## Git workflow

- **`develop`** is the default branch — do your work there (or on `feature/*` branches off it).
- **`main`** is protected and reserved for releases: no direct pushes; changes arrive via a Pull
  Request, and the CI (unit tests) must be green before merging.

## Releasing a new version

Versions are `MAJOR.MINOR.PATCH` (SemVer), **digits only** — the Marketplace/Open VSX reject suffixes
like `-beta` (pre-releases use a publish flag instead, not the version string).

1. On `develop`, bump the version and update the changelog:
   - edit `version` in `package.json` (run `npm install` once to sync `package-lock.json`), and
   - add an entry at the top of `CHANGELOG.md`.
2. Open a Pull Request `develop → main`, wait for CI to pass, merge it.
3. Tag the release on `main` and push the tag:
   ```bash
   git checkout main && git pull
   git tag v1.2.3
   git push origin v1.2.3
   ```
4. Pushing the tag triggers `.github/workflows/release.yml`, which runs the tests, packages the
   `.vsix`, **publishes to the registries**, and **creates the GitHub Release** with the `.vsix`
   attached. Do **not** create the release by hand in the GitHub UI.

### Publishing credentials

The release workflow reads two GitHub Actions secrets. Each publish step is **skipped** when its
secret is absent, so a missing one never breaks the release:

- `OVSX_PAT` — Open VSX token (publishes to the Open VSX Registry).
- `VSCE_PAT` — Visual Studio Marketplace token (Azure DevOps PAT, scope *Marketplace › Manage*,
  "All accessible organizations"). Currently **not configured** — the Marketplace step is skipped
  until it is added. See the project notes for the Azure DevOps prerequisite.
