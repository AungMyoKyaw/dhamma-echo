export function focusTrapIndex(
  currentIndex: number,
  count: number,
  reverse: boolean
): number | null {
  if (count <= 0) return null;
  if (reverse && currentIndex <= 0) return count - 1;
  if (!reverse && currentIndex >= count - 1) return 0;
  return null;
}
