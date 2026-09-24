# Approved development work list

This list records the next VVS-Web work agreed in the September 2026 review. It does not change the shipped-status claims in the public roadmap.

## Contained work

1. **Interactive docs slice:** Implemented prose and graph-to-code guidance for Branch, Print String, and Math Add. Port and option facts remain generated from the registry.
2. **First-use experience:** Implemented a single start hero with a clear sample action and useful empty recent-project guidance. Removed the redundant welcome modal.
3. **Focused mobile usability:** Implemented narrow-screen start actions and horizontal Library section navigation. A device-level interaction pass remains to be verified.
4. **Public Git catalog:** Implemented a validated static index in `catalog/vvs-catalog.json`, repository loading, browse/search links, and failure states. Community entries depend on repositories publishing the same schema. This is discovery, not automatic installation.

## Major item: native VS Code plugin

An initial native extension lives in `apps/vscode`: VS Code custom text editor for graph documents, workspace filesystem loader, shared transpiler Generate, and node-docs command. The generated VSIX needs an extension-host smoke test. The visual editor currently handles positioning, inline inputs, matching pin connections, and three core node kinds; the remaining node and symbol workflows are open.

## Sequencing

Ship and verify each contained slice independently. Before implementing the plugin, review project format/versioning and define the host adapter so both the browser and VS Code use the same graph semantics. Record further small polish items here as their exact scope is recovered from the review.
