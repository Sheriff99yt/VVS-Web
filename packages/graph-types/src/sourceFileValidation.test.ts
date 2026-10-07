import { expect, test } from 'bun:test';
import { createEmptyProjectSnapshot } from './snapshot';
import { analyzeProject } from './analyze';
import { validateSourceFilePaths } from './sourceFileValidation';
for (const [language, extension] of [['javascript', 'js'], ['python', 'py'], ['go', 'go'], ['csharp', 'cs'], ['cpp', 'cpp'], ['rust', 'rs'], ['gdscript', 'gd']] as const) test(`explicit source paths enforce target and flat ownership ${language}`, () => {
  const project = createEmptyProjectSnapshot(); project.targetLanguage = language;
  const doc = project.documents['main-graph'];
  doc.metadata = { moduleName: 'sample', extendsType: '', description: '', sourceFileName: `sample.${extension}`, targetLanguage: language };
  expect(validateSourceFilePaths(project)).toEqual([]);
  for (const path of [`../sample.${extension}`, `folder/sample.${extension}`, `folder\\sample.${extension}`, 'sample.exe', '', `sample.${extension === 'rs' ? 'cpp' : 'rs'}`]) {
    doc.metadata.sourceFileName = path;
    expect(analyzeProject(project).diagnostics.some(item => item.code === 'SOURCE_FILE_PATH')).toBe(true);
  }
  doc.metadata.sourceFileName = `sample.${extension}`;
  project.documents.other = structuredClone(doc); project.documents.other.metadata!.sourceFileName = `Sample.${extension}`;
  expect(validateSourceFilePaths(project).map(item => item.code)).toEqual(['SOURCE_FILE_COLLISION']);
});
