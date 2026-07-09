export const SELECT_GENERATED_FILE_EVENT = 'vvs:select-generated-file';

export function dispatchSelectGeneratedFile(path: string) {
  window.dispatchEvent(
    new CustomEvent(SELECT_GENERATED_FILE_EVENT, { detail: { path } })
  );
}
