export const ANNOTATION_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a3 3 0 0 1-3 3H9l-6 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z"/><path d="M8 8h8M8 12h5"/></svg>';

export function annotationPalette(element: HTMLElement, anchor: HTMLElement, surfaceAnchor = anchor): void {
  const readStyle = anchor.ownerDocument.defaultView!.getComputedStyle.bind(anchor.ownerDocument.defaultView);
  const input = readStyle(anchor);
  let surface = surfaceAnchor;
  while (surface.parentElement && ["transparent", "rgba(0, 0, 0, 0)"].includes(readStyle(surface).backgroundColor)) surface = surface.parentElement;
  const foreground = input.color;
  const values = {
    "--quote-font": input.fontFamily,
    "--quote-fg": foreground,
    "--quote-muted": `color-mix(in srgb, ${foreground} 72%, transparent)`,
    "--quote-border": `color-mix(in srgb, ${foreground} 12%, transparent)`,
    "--quote-chip": `color-mix(in srgb, ${foreground} 11%, ${readStyle(surface).backgroundColor})`,
    "--quote-hover": `color-mix(in srgb, ${foreground} 10%, transparent)`,
    "--quote-bg": readStyle(surface).backgroundColor,
  };
  for (const [name, value] of Object.entries(values)) if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
}
