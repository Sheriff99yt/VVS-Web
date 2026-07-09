import { describe, expect, test } from 'bun:test';
import {
  classExtendsSuffix,
  renderClassModuleOpen,
  renderFunctionDefHeader,
} from './shell';

describe('emit shell pack templates', () => {
  test('class module open with extends suffix', () => {
    expect(renderClassModuleOpen('python', 'App', 'Base')).toBe('class App(Base):');
    expect(renderClassModuleOpen('javascript', 'App')).toBe('class App {');
    expect(classExtendsSuffix('cpp', 'Widget')).toBe(' : public Widget');
  });

  test('function def header from pack', () => {
    expect(
      renderFunctionDefHeader(
        {
          id: 'f1',
          name: 'run',
          classId: 'c1',
          binding: 'instance',
          overloads: [{ parameters: [] }],
        },
        'python'
      )
    ).toBe('    def run(self):');
  });
});
