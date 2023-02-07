export function ensureEndsWith(str: string, end: string) {
  return str.endsWith(end) ? str : str + end;
}
