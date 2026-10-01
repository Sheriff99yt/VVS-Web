import { describe, expect, test } from 'bun:test';
import { FUTURE_FEATURE_SECTIONS } from './developmentRoadmap';
import { RESEARCH_TOPICS } from './roadmapResearch';

const topicIds = [
  'u93-code-to-visual',
  'collab-session-sync',
  'coa-compile-policy',
  'ue6-attach-path',
  'cl014-verse-getinput',
  'bind-remaining-langs',
  'library-u90-auth',
  'search-embeddings',
  'mobile-gestures-radial',
  'reveal-in-explorer',
  'vscode-native-plugin',
  'ue6-native-plugin',
  'interactive-node-docs-research',
];

describe('roadmap research content', () => {
  test('preserves all 13 research topics and links them to existing open items', () => {
    expect(RESEARCH_TOPICS.map((topic) => topic.id)).toEqual(topicIds);
    const itemIds = new Set(FUTURE_FEATURE_SECTIONS.flatMap((section) => section.items.map((item) => item.id)));
    for (const topic of RESEARCH_TOPICS) expect(itemIds.has(topic.systemId)).toBe(true);
  });

  test('provides three alternatives, explicit delivery gates and source evidence per topic', () => {
    for (const topic of RESEARCH_TOPICS) {
      expect(topic.options).toHaveLength(3);
      expect(new Set(topic.options.map((option) => option.id)).size).toBe(3);
      for (const label of ['Priority:', 'Dependency:', 'Next experiment:', 'Acceptance gate (proposed):']) {
        expect(topic.firstSlice.some((line) => line.startsWith(label))).toBe(true);
      }
      expect(topic.recommendation).toStartWith('[Recommendation, not a shipped claim]');
      expect(topic.sources.length).toBeGreaterThan(0);
      expect(new Set(topic.sources.map((source) => source.href)).size).toBe(topic.sources.length);
      for (const source of topic.sources) {
        expect(source.label.length).toBeGreaterThan(0);
        expect(new URL(source.href).protocol).toBe('https:');
      }
    }
  });

  test('keeps proposed foundations planned and recognizes implemented narrow pilots', () => {
    const items = FUTURE_FEATURE_SECTIONS.flatMap((section) => section.items);
    for (const id of ['revision-safe-persistence', 'shared-edit-contract']) {
      expect(items.find((item) => item.id === id)?.status).toBe('planned');
    }
    for (const id of ['code-to-visual-u93', 'vscode-native-plugin', 'library-backend']) {
      expect(items.find((item) => item.id === id)?.status).toBe('partial');
    }
    expect(items.find((item) => item.id === 'ue6-native-plugin')?.status).toBe('planned');
  });
});
