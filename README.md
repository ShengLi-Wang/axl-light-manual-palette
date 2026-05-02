# Axl Light

Axl Light is a non-invasive Obsidian plugin for reading highlights and sticky notes. It keeps Markdown and PDF files clean: highlights, notes, replies, positions, and recovery metadata are stored in `.obsidian-annotations/` sidecar JSON files.

## Features

- CodeMirror 6 overlay highlights with `Decoration.mark()`
- Floating selection toolbar with six highlight colors, sticky note, copy, and sidebar actions
- Sticky notes in a side lane with Markdown-rendered content and SVG leader lines
- Sidecar storage per Markdown file plus a global index
- Text anchors with exact offsets, selected text, prefix, and suffix
- Fuzzy relocation for lightly edited files
- Sidebar overview with search, color filtering, sorting, jump, delete, and export
- Rename migration for sidecar data when enabled
- PDF overlay highlights using page-number plus page-relative rectangle anchors
- PDF sticky notes in the same right-side reader lane, collapsing to popovers on narrow panes

## Development

```bash
npm install
npm run dev
```

Copy or symlink `main.js`, `manifest.json`, and `styles.css` into:

```text
<vault>/.obsidian/plugins/axl-light/
```

## Install from a GitHub release

Download these three files from the latest release:

- `main.js`
- `manifest.json`
- `styles.css`

Place them in:

```text
<vault>/.obsidian/plugins/axl-light/
```

Then open Obsidian, go to `Settings -> Community plugins`, reload installed plugins, and enable `Axl Light`.

## Release

This repo publishes release assets automatically when a version tag is pushed. The tag must match `manifest.json`:

```bash
npm install
npm run build
git add .
git commit -m "Release Axl Light 0.1.0"
git tag 0.1.0
git push origin main
git push origin 0.1.0
```

GitHub Actions will attach `main.js`, `manifest.json`, and `styles.css` to the release.

## Storage

Annotations are written to:

```text
.obsidian-annotations/
  index.json
  notes__reading__book.md.json
  papers__example.pdf.json
```

Markdown source files and PDF binaries are never modified by this plugin.

## Commands

- `Highlight selected text`: `Cmd/Ctrl + Shift + H`
- `Add sticky note to selection`: `Cmd/Ctrl + Alt + M`
- `Toggle sticky note lane`: `Cmd/Ctrl + Shift + N`
- `Open annotation overview`

## Known Limits

Reading View highlights are rendered by matching selected text in the rendered DOM. Live Preview and Source Mode use CodeMirror offsets and are more precise. PDF support is DOM-based and stores page-relative rectangles, so it depends on Obsidian's built-in PDF viewer structure. For very large annotation sets, the sidebar is ready for virtual scrolling but currently renders the filtered list directly.
