export const ANNOTATION_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a3 3 0 0 1-3 3H9l-6 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z"/><path d="M8 8h8M8 12h5"/></svg>';

/** A computed background paints something opaque enough to sit a popover on. */
function opaque(color: string): boolean {
  const value = color.trim().toLowerCase();
  if (!value || value === "transparent") return false;
  const slash = /\/\s*([0-9.]+)\s*\)$/.exec(value);
  if (slash && Number(slash[1]) < 1) return false;
  const rgba = /^rgba?\(([^)]*)\)$/.exec(value);
  if (rgba) {
    const parts = rgba[1].split(",").map((part) => part.trim());
    if (parts.length === 4 && Number(parts[3]) < 1) return false;
  }
  return true;
}

export function annotationPalette(element: HTMLElement, anchor: HTMLElement, surfaceAnchor = anchor): void {
  const readStyle = anchor.ownerDocument.defaultView!.getComputedStyle.bind(anchor.ownerDocument.defaultView);
  const input = readStyle(anchor);
  let surface = surfaceAnchor;
  while (surface.parentElement && !opaque(readStyle(surface).backgroundColor)) surface = surface.parentElement;
  // A transparent chain (Paseo paints its surface on a canvas above body) leaves the popover
  // see-through, so host UI shows through it. Fall back to the theme's canvas color.
  const background = opaque(readStyle(surface).backgroundColor) ? readStyle(surface).backgroundColor : "Canvas";
  const foreground = input.color;
  const values = {
    "--quote-font": input.fontFamily,
    "--quote-fg": foreground,
    "--quote-muted": `color-mix(in srgb, ${foreground} 72%, transparent)`,
    "--quote-border": `color-mix(in srgb, ${foreground} 12%, transparent)`,
    "--quote-chip": `color-mix(in srgb, ${foreground} 11%, ${background})`,
    "--quote-hover": `color-mix(in srgb, ${foreground} 10%, transparent)`,
    "--quote-bg": background,
  };
  for (const [name, value] of Object.entries(values)) if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
}
