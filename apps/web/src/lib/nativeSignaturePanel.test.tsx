import { expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NativeSignaturePanel } from '../components/layout/RightSidebar/NativeSignaturePanel';
import type { VVSNodeData } from '@vvs/graph-types';

for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`native inspector profile ${language}`, () => {
  const type = language === 'rust' ? 'i8' : 'int';
  const data: VVSNodeData = { label: 'sample', category: 'Functions', inputs: [], outputs: [], inlineValues: {}, properties: { nativeSignatureLanguage: language, nativeParameters: [{ id: 'value', name: 'value', mode: 'positional', nativeType: type, authoredType: type, mutable: language !== 'rust' }], nativeReturnType: type } };
  const render = () => renderToStaticMarkup(createElement(NativeSignaturePanel, { data, onChange: () => {} }));
  const markup = render();
  expect(markup).toContain('Native type for value');
  expect(markup).toContain('Native return type');
  expect(markup).not.toContain('float64');
  expect(markup.includes('Mutable parameter value')).toBe(language !== 'gdscript');
  expect(markup).not.toMatch(/<details[^>]*\sopen/);
  expect(markup).toContain(language === 'rust' ? 'value="()"' : 'value="void"');
  (data.properties!.nativeParameters as { nativeType?: string }[])[0].nativeType = undefined;
  data.properties!.nativeReturnType = undefined;
  expect(render().match(/Choose native type/g)?.length).toBe(2);
});
