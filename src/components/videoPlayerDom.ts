// DOM-only helpers shared by the video player. Keep event handling in the component.
export function focusableVideoDialogElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'video[controls], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => element.getClientRects().length > 0);
}

export function scrollableDescendantCanConsume(event: WheelEvent, dialog: HTMLElement): boolean {
  if (!(event.target instanceof Element) || event.deltaY === 0) return false;
  let element: Element | null = event.target;
  while (element !== null && element !== dialog) {
    if (element instanceof HTMLElement) {
      const overflowY = globalThis.getComputedStyle(element).overflowY;
      const maxScrollTop = element.scrollHeight - element.clientHeight;
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        ((event.deltaY < 0 && element.scrollTop > 0) ||
          (event.deltaY > 0 && element.scrollTop < maxScrollTop))
      ) {
        return true;
      }
    }
    element = element.parentElement;
  }
  return false;
}

export function numberFromControl(event: Event): number {
  return Number((event.currentTarget as HTMLInputElement | HTMLSelectElement).value);
}
