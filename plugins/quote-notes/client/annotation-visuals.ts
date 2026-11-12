export const ANNOTATION_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a3 3 0 0 1-3 3H9l-6 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z"/><path d="M8 8h8M8 12h5"/></svg>';

type Rgba = [number, number, number, number];

/** Parse the rgb()/rgba()/hex forms browsers return, ignoring anything unresolvable. */
function parseColor(color: string): Rgba | null {
  const value = color.trim().toLowerCase();
  const rgb = /^rgba?\(\s*([0-9.]+)[,\s]+([0-9.]+)[,\s]+([0-9.]+)(?:\s*[,/]\s*([0-9.]+%?))?\s*\)$/.exec(value);
  if (rgb) {
    const alpha = rgb[4]?.endsWith("%") ? Number(rgb[4].slice(0, -1)) / 100 : rgb[4] === undefined ? 1 : Number(rgb[4]);
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), alpha];
  }
  const hex = /^#([0-9a-f]{3,8})$/.exec(value);
  if (!hex) return null;
  const raw = hex[1];
  const expand = raw.length <= 4 ? [...raw].map((part) => part + part).join("") : raw;
  if (expand.length !== 6 && expand.length !== 8) return null;
  const channels = [0, 2, 4, 6].map((at) => (expand.length > at ? parseInt(expand.slice(at, at + 2), 16) : 255));
  return [channels[0], channels[1], channels[2], channels[3] / 255];
}

function luminance([r, g, b]: Rgba): number {
  const linear = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: Rgba, b: Rgba): number {
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** Resolve system colors and color-mix() by letting the browser compute them on a probe. */
function resolveColor(color: string, document: Document): Rgba | null {
  const direct = parseColor(color);
  if (direct) return direct;
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;left:-9999px;top:0;background-color:${color}`;
  document.body.append(probe);
  const computed = parseColor(document.defaultView!.getComputedStyle(probe).backgroundColor);
  probe.remove();
  return computed;
}

/** A computed background paints something opaque enough to sit a popover on. */
function opaque(color: Rgba | null): color is Rgba {
  return color !== null && color[3] > 0.95;
}

export function annotationPalette(element: HTMLElement, anchor: HTMLElement, surfaceAnchor = anchor): void {
  const document = anchor.ownerDocument;
  const readStyle = document.defaultView!.getComputedStyle.bind(document.defaultView);
  const input = readStyle(anchor);
  let surface = surfaceAnchor;
  while (surface.parentElement && !opaque(resolveColor(readStyle(surface).backgroundColor, document))) surface = surface.parentElement;
  // A transparent chain (Paseo paints its surface on a canvas above body) leaves the popover
  // see-through, so host UI shows through it. Fall back to the theme's canvas color.
  const resolvedSurface = resolveColor(readStyle(surface).backgroundColor, document);
  const background = opaque(resolvedSurface) ? readStyle(surface).backgroundColor : "Canvas";
  const backgroundColor = opaque(resolvedSurface) ? resolvedSurface : resolveColor("Canvas", document) ?? [250, 250, 250, 1];
  // Some panes (notably the file viewer) report a black `color` even though their text is drawn
  // light, which made the card's text and action button invisible. Only trust the anchor's
  // color when it actually reads against the surface, otherwise pick a legible tone.
  const anchorColor = resolveColor(input.color, document);
  const readable = anchorColor !== null && contrast(anchorColor, backgroundColor) >= 4.5;
  const foreground = readable ? input.color : luminance(backgroundColor) > 0.5 ? "#171717" : "#f2f2f2";
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
