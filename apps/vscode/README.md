# VVS for VS Code

Open a folder with `.vvs/project.json`, then run **VVS: Open Graph** or select a `*.graph.json` file. The custom editor displays nodes and connections. Drag a node to reposition it, add Branch, Print String, or Math Add from the toolbar, and select a node to edit inline inputs or connect compatible pins. Use **Edit graph JSON** for the full project schema. Edits go through VS Code's text document, so Save and Undo work normally.

Run **VVS: Generate Source** to read the current `.vvs` folder and write ordinary source files into the workspace. The extension calls the same `@vvs/graph-types` loader normalization and `@vvs/transpiler` as the web editor. Save edited graph documents before Generate. The extension does not run generated code.

Build with `bun install`, `bun run --filter vvs-vscode check`, and `bun run --filter vvs-vscode package`. Install the resulting VSIX with **Extensions: Install from VSIX**. The extension has no account or server dependency.

The visual editor currently supports three core node kinds and matching pin types; use the JSON editor for the remaining nodes, complex graph structure, and symbols. After Generate, select a node and choose **Show generated source** to jump to its source-map span. Custom packs stored in `.vvs/packs` load with the workspace project.
