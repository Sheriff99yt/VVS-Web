import type { NativeScalarLanguage } from './nativeScalarContracts';

/** Ordinary ASCII binding domain for the pinned C++17/Rust2021/Godot4.5 profiles. */
export const NATIVE_SCALAR_KEYWORD_CANDIDATES: Readonly<Record<NativeScalarLanguage, readonly string[]>> = {
  cpp: 'alignas alignof and and_eq asm auto bitand bitor bool break case catch char char16_t char32_t class compl const constexpr const_cast continue decltype default delete do double dynamic_cast else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept not not_eq nullptr operator or or_eq private protected public register reinterpret_cast return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while xor xor_eq'.split(' '),
  rust: '_ as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while abstract become box do final macro override priv try typeof unsized virtual yield'.split(' '),
  gdscript: 'if elif else for while match when break continue pass return class class_name extends is in as self super signal func static const enum var breakpoint preload await yield assert void PI TAU INF NAN and or not true false null bool int float String Vector2 Vector2i Rect2 Rect2i Vector3 Vector3i Transform2D Vector4 Vector4i Plane Quaternion AABB Basis Transform3D Projection Color StringName NodePath RID Object Callable Signal Dictionary Array PackedByteArray PackedInt32Array PackedInt64Array PackedFloat32Array PackedFloat64Array PackedStringArray PackedVector2Array PackedVector3Array PackedColorArray PackedVector4Array'.split(' '),
};
export const NATIVE_SCALAR_KEYWORDS: Readonly<Record<NativeScalarLanguage, readonly string[]>> = {
  cpp: NATIVE_SCALAR_KEYWORD_CANDIDATES.cpp, rust: NATIVE_SCALAR_KEYWORD_CANDIDATES.rust,
  gdscript: 'if elif else for while break continue pass return class class_name extends is in as self super signal func static const enum var breakpoint preload await yield assert void and or not true false null'.split(' '),
};
const keywords = Object.fromEntries(Object.entries(NATIVE_SCALAR_KEYWORDS).map(([language, names]) => [language, new Set(names)])) as Record<NativeScalarLanguage, Set<string>>;

export function validNativeScalarBindingName(name: unknown, language: NativeScalarLanguage): name is string {
  return typeof name === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && !!keywords[language] && !keywords[language].has(name);
}
