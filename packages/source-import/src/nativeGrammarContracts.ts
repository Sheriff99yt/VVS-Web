/** Grammar recognition is independent of native binding or visual acceptance. */
export const NATIVE_GRAMMARS = {
  go: { label: 'Go', package: 'tree-sitter-go', version: '0.25.0', file: 'tree-sitter-go.wasm', abi: 15, sha256: '9504573f352b20be7f2f1911754d710622aedc15afff16d5ed8fb5645681aee7' },
  csharp: { label: 'C#', package: 'tree-sitter-c-sharp', version: '0.23.5', file: 'tree-sitter-c_sharp.wasm', abi: 15, sha256: '6f69e1cae44e1c32c1eccc170dc5a9778fb94ff716f71113fe1f8c4299aa2f40' },
  rust: { label: 'Rust', package: 'tree-sitter-rust', version: '0.24.0', file: 'tree-sitter-rust.wasm', abi: 14, sha256: 'f65f354215611fd94ad34134b3427eb3d58cbb745df7b6509ba722184db73d57' },
  cpp: { label: 'C++', package: 'tree-sitter-cpp', version: '0.23.4', file: 'tree-sitter-cpp.wasm', abi: 14, sha256: '174eb0deb75b2ec7881bcacda9f995648d8e683956e5c2267e69ab6dc503fcbf' },
  gdscript: { label: 'GDScript', package: 'tree-sitter-gdscript', version: '6.1.0', file: 'tree-sitter-gdscript.wasm', abi: 14, sha256: '24e7a0d164b8c4d3068b7ff9cf665a977c16b3cca6cb13125f4a036d9e72dc90' },
} as const;
export type NativeGrammar = keyof typeof NATIVE_GRAMMARS;
