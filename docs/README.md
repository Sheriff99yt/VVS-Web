# VVS Documentation

Index for the public Vision Visual Scripting documentation set.

**As of 24 August 2026.** Product law is client-first: no VVS accounts, no dedicated app server, GitHub Pages plus folder / `.vvs/` / git. Canvas is the source of truth. **Generate** is the user action. **Emit** is Stage C only.

## User

| Document | Audience | Content |
|----------|----------|---------|
| **[setup.md](setup.md)** | New contributors | Toolchain install, Pages preview, local folder / `.vvs/`. Postgres / GoTrue is a frozen experiment, not first-time setup |
| **[quickstart.md](quickstart.md)** | Everyone | Start the app and open your first graph in minutes |
| **[../SECURITY.md](../SECURITY.md)** | Security researchers | Vulnerability reporting |
| **[history.md](history.md)** | Everyone | Origin story - graduation project, VVS 1 to VVS Web |
| **[vision.md](vision.md)** | Everyone | Why VVS exists, open visual scripting, UE6 + Verse direction |
| **[roadmap.md](roadmap.md)** | Everyone | Public roadmap - Open / Done / Research (mirrors the in-app tab) |
| **[current_state.md](current_state.md)** | Contributors | What is implemented in this repository **today** |
| **[code_panel.md](code_panel.md)** | Contributors / users | Generated code panel navigation, highlight, Files pin |
| [naming_and_product_direction.md](naming_and_product_direction.md) | Web UI vocabulary; Generate vs emit; Rosetta vs home-preview goldens |
| [design/language_neutral_vocabulary.md](design/language_neutral_vocabulary.md) | Locked glossary: Declare / On / Call / Dispatch, **Generate vs emit**, **Rosetta**, goldens |
| [project_requirements.md](project_requirements.md) | Requirements. Some historical checkboxes are marked cut or superseded; [current_state.md](current_state.md) is what shipped |
| [ui_api_delivery_loop.md](ui_api_delivery_loop.md) | Contract-first UI to API integration workflow |
| [design/mcp_autonomy_audit.md](design/mcp_autonomy_audit.md) | In-page TS agent (hosted path) vs optional Go sidecar |

## Architecture

| Document | Content |
|----------|---------|
| [vvs_2_0_tech_stack.md](vvs_2_0_tech_stack.md) | Bannered historical stack (VPS / Postgres / GoTrue). Product path is Pages + in-page TS agent |
| [syntax_pack_architecture.md](syntax_pack_architecture.md) | Packs, IR, Rosetta **fixtures** (not home-preview goldens) |
| [language_profiles.md](language_profiles.md) | Per-target portability; `COA_SHIPPED` is false |
| [visual_to_text_fidelity.md](visual_to_text_fidelity.md) | Text-shaped graphs; honest leftover `(x)` |
| [node_system.md](node_system.md) | Nodes, pins, conversion, property schema |
| [environment_templates.md](environment_templates.md) | First-party env packs |

## Historical

| Document | Content |
|----------|---------|
| [deployment.md](deployment.md) | Legacy self-host (Postgres / GoTrue / VPS). **Not** product direction |
| [library-backend-api.md](library-backend-api.md) | Early library API sketch. Shipped Library is client token search + chips; auth / upload frozen |

## Design

| Document | Content |
|----------|---------|
| [design/fidelity_streamline.md](design/fidelity_streamline.md) | Fidelity program (pilot = Advanced + Complex) |
| [design/language_capability_catalog.md](design/language_capability_catalog.md) | Capability inventory. Dual Class / Calculator labels are historical |
| [design/multi_class_symbols.md](design/multi_class_symbols.md) | Multi-class symbols; Calculator migration section is historical |
| [design/unified_symbol_model.md](design/unified_symbol_model.md) | Unified symbols / future COA (`COA_SHIPPED` false) |
| [design/user_types.md](design/user_types.md) | User types (shipped teaching slice) |
| [design/class_scopes_and_symbols.md](design/class_scopes_and_symbols.md) | Shipped-as architecture note, not a feature catalog |
| [design/terms_refactor_plan.md](design/terms_refactor_plan.md) | Historical vocabulary rollout plan |
| [design/interactive_docs_architecture.md](design/interactive_docs_architecture.md) | Live `/docs` catalog (partial). Overlay prose + playground still planned |

## Contributor assets

- [../CONTRIBUTING.md](../CONTRIBUTING.md)
- [../.agents/AGENTS.md](../.agents/AGENTS.md)
- [../.agents/skills/](../.agents/skills/) - domain skills for UI, transpiler, backend
