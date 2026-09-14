export function toHexColor(color: [number, number, number]): string {
  return `#${color.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

export function toSafeHttpUrl(value: string): string {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  }
  catch {
    return '';
  }

  return '';
}
