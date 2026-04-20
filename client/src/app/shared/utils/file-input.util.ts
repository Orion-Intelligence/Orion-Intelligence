export interface SelectedFileFromInput {
    input: HTMLInputElement;
    file: File;
}
export function getFirstFileFromInputEvent(event: Event): SelectedFileFromInput | null {
  const inputElement = event.target as HTMLInputElement | null;
  const file = inputElement?.files?.[0] ?? null;
  if (!inputElement || !file) {
    return null;
  }
  return { input: inputElement, file };
}
export function readTextInputValue(event: Event): string {
  const inputElement = event.target as HTMLInputElement | null;
  return inputElement?.value ?? '';
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
