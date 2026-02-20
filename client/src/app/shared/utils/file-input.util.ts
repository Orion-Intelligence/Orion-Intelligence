export interface SelectedFileFromInput {
    input: HTMLInputElement;
    file: File;
}
export function getFirstFileFromInputEvent(event: Event): SelectedFileFromInput | null {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0] ?? null;
  if (!input || !file) {
    return null;
  }
  return { input, file };
}
function readFile(file: Blob, readMode: 'text' | 'dataUrl'): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(new Error('Failed to read file.'));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read file.'));
    };
    if (readMode === 'text') {
      reader.readAsText(file);
      return;
    }
    reader.readAsDataURL(file);
  });
}
export function readFileAsText(file: Blob): Promise<string> {
  return readFile(file, 'text');
}
export function readFileAsDataUrl(file: Blob): Promise<string> {
  return readFile(file, 'dataUrl');
}
