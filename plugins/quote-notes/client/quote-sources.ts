import type { QuoteId } from "./host-draft-bridge";

type Source = {
  range: Range; transcript: HTMLElement; start: Node; end: Node;
  startOffset: number; endOffset: number; text: string; startChild: Node | undefined; endChild: Node | undefined;
};
export type SourceGeometry = { kind: "visible"; rects: DOMRect[]; bounds: { left: number; right: number; top: number; bottom: number } }
  | { kind: "offscreen" } | { kind: "unavailable" };

export function captureSource(value: unknown, transcript: HTMLElement): Source | null {
  if (!(value instanceof window.Range) || !transcript.contains(value.startContainer) || !transcript.contains(value.endContainer)) return null;
  const range = value.cloneRange();
  return { range, transcript, start: range.startContainer, end: range.endContainer, startOffset: range.startOffset, endOffset: range.endOffset, text: range.toString(), startChild: range.startContainer.childNodes[range.startOffset], endChild: range.endContainer.childNodes[range.endOffset - 1] };
}

export interface ExternalLiveSource {
  valid(): boolean;
  geometry(): SourceGeometry;
  reveal(): Promise<{ kind: "highlighted" } | { kind: "opened"; reason: string } | { kind: "unavailable"; reason: string }>;
}
export class QuoteSources {
  private external = new Map<string, Map<QuoteId, ExternalLiveSource>>();
  rememberExternal(scope: string, id: QuoteId, source: ExternalLiveSource): void {
    let entries = this.external.get(scope);
    if (!entries) { entries = new Map(); this.external.set(scope, entries); }
    entries.set(id, source);
  }
  externalFor(scope: string, id: QuoteId): ExternalLiveSource | null { return this.external.get(scope)?.get(id) ?? null; }
  private scopes = new Map<string, Map<QuoteId, Source>>();
  remember(scope: string, id: QuoteId, source: Source | null): void {
    if (!source) return;
    let entries = this.scopes.get(scope);
    if (!entries) { entries = new Map(); this.scopes.set(scope, entries); }
    entries.set(id, source);
  }
  resolve(scope: string, id: QuoteId): Source | null {
    const source = this.scopes.get(scope)?.get(id);
    if (!source) return null;
    const { range, transcript, start, end, startOffset, endOffset, text } = source;
    if (!transcript.isConnected || !start.isConnected || !end.isConnected || !transcript.contains(start) || !transcript.contains(end)
      || range.startContainer !== start || range.endContainer !== end || range.startOffset !== startOffset || range.endOffset !== endOffset || range.toString() !== text
      || start.childNodes[startOffset] !== source.startChild || end.childNodes[endOffset - 1] !== source.endChild) {
      this.scopes.get(scope)?.delete(id);
      return null;
    }
    return source;
  }
  geometry(scope: string, id: QuoteId, card: HTMLElement | null): SourceGeometry {
    const external = this.externalFor(scope, id);
    if (external) return external.geometry();
    const source = this.resolve(scope, id);
    if (!source) return { kind: "unavailable" };
    const box = source.transcript.getBoundingClientRect();
    const bounds = { left: Math.max(0, box.left), right: Math.min(window.innerWidth, box.right), top: Math.max(0, box.top), bottom: Math.min(window.innerHeight, box.bottom, card?.getBoundingClientRect().top ?? window.innerHeight) };
    const rects = Array.from(source.range.getClientRects()).flatMap((rect) => {
      const left = Math.max(rect.left, bounds.left), right = Math.min(rect.right, bounds.right);
      const top = Math.max(rect.top, bounds.top), bottom = Math.min(rect.bottom, bounds.bottom);
      return right > left && bottom > top ? [new window.DOMRect(left, top, right - left, bottom - top)] : [];
    });
    return rects.length ? { kind: "visible", rects, bounds } : { kind: "offscreen" };
  }
  reveal(scope: string, id: QuoteId): boolean {
    const source = this.resolve(scope, id);
    if (!source) return false;
    const rect = source.range.getBoundingClientRect(), box = source.transcript.getBoundingClientRect();
    source.transcript.scrollTop += rect.top - box.top - Math.min(80, box.height / 3);
    return true;
  }
  retain(scope: string, ids: ReadonlySet<QuoteId>): void {
    const external = this.external.get(scope);
    for (const id of external?.keys() ?? []) if (!ids.has(id)) external?.delete(id);
    if (!external?.size) this.external.delete(scope);
    const entries = this.scopes.get(scope);
    if (!entries) return;
    for (const id of entries.keys()) if (!ids.has(id)) entries.delete(id);
    if (!entries.size) this.scopes.delete(scope);
  }
  dispose(): void { this.scopes.clear(); this.external.clear(); }
}
