---
name: vvs-batched-delivery
description: Plan and deliver related VVS development changes in dependency batches, consolidate validation and select focused repair checks after failures. Use for multi-item implementation work or changes to the project delivery workflow.
---

# Batched delivery

Follow [the canonical workflow](../../../docs/agentic_batch_workflow.md). Plan contracts, related edits, meaningful fixtures, acceptance criteria and affected gates together. Finish implementation and review before one consolidated validation batch. Use existing logs and saved state to diagnose failures; retry affected checks and necessary prerequisites rather than unchanged suites.

Preserve every required architecture, native/compiler and Code-panel fidelity gate. Label focused versus full-suite evidence accurately. Record roadmap/current-state/memory once per completed batch. A small task can be one small batch; agent-rule or skill-only edits need structure/link/diff checks rather than app builds.

For reverse import, plan shared features across all eight languages using [the cross-language plan](../../../docs/design/reverse_import_cross_language_batches.md). Compare equivalent examples, patch common infrastructure once with ready native corrections, then validate the batch with shared gates deduplicated and independent native checks preserved. Inspect related language failures before a focused repair batch. Keep missing prerequisites explicit and continue independent ready work.
