# UE6 Editor Plugin (planned)

This directory will host the **Unreal Engine 6 editor plugin** for in-engine visual authoring.

**Status:** Not started — see [docs/roadmap.md](../docs/roadmap.md#phase-5--unreal-engine-6-editor-plugin-strategic) and [docs/vision.md](../docs/vision.md).

**Goals:**

- Share the same graph document schema as `apps/web`
- Emit **Verse** via the shared transpiler IR (`packages/transpiler`) — same **v1 syntax profile** as the web editor
- Provide a dynamic, data-driven node canvas inside the UE editor
- Support teams transitioning from deprecated Blueprint workflows to Verse-first development

Plugin packaging layout (C++ module, uplugin, build scripts) will be defined when Phase 5 begins.
