export function firstInteger(value: string): number | null {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}
