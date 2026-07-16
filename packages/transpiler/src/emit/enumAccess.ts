import type { TargetLanguage } from '@vvs/graph-types';
import { targetLanguageToFamily } from '@vvs/graph-types';
import { renderTemplate, requireTemplate, resolvePrintProfile } from '@vvs/syntax-packs';

const LEGACY_ENUM_MEMBER = /^([A-Za-z_][\w]*)::([A-Za-z_][\w]*)$/;

/** Pack-driven enum member access (`Enum.Member` vs `Enum::Member`). */
export function formatEnumMemberAccess(
  enumName: string,
  member: string,
  targetLanguage: TargetLanguage
): string {
  const family = targetLanguageToFamily(targetLanguage) ?? 'python';
  const profile = resolvePrintProfile(family);
  const row = requireTemplate(profile, 'EnumMemberAccess', family);
  return renderTemplate(
    row,
    {
      enum: { text: enumName, spans: [] },
      member: { text: member, spans: [] },
    },
    profile?.layout
  ).text;
}

/** Parse canvas text `Enum::Member` or return null. */
export function parseLegacyEnumMember(raw: string): { enumName: string; member: string } | null {
  const m = LEGACY_ENUM_MEMBER.exec(raw.trim());
  if (!m) return null;
  return { enumName: m[1]!, member: m[2]! };
}

/**
 * Resolve a switch/variable enum case to language text.
 * Prefer structured enumName+member; fall back to legacy `Enum::Member` labels.
 */
export function formatEnumCaseLabel(
  label: string,
  targetLanguage: TargetLanguage,
  structured?: { enumName?: string; member?: string }
): string {
  if (structured?.enumName && structured?.member) {
    return formatEnumMemberAccess(structured.enumName, structured.member, targetLanguage);
  }
  const parsed = parseLegacyEnumMember(label);
  if (parsed) {
    return formatEnumMemberAccess(parsed.enumName, parsed.member, targetLanguage);
  }
  if (/^-?\d+(\.\d+)?$/.test(label)) return label;
  if (/^[A-Za-z_][\w]*$/.test(label)) return label;
  return JSON.stringify(label);
}
