const pluginId = "quote-notes";
const pluginName = "Codex Style Annotations";

const installations = new WeakMap<Document, { users: number; dispose: () => void }>();

export function installPluginCardName(): () => void {
  if (typeof document === "undefined") return () => {};
  const doc = document;
  const view = doc.defaultView;
  if (!view?.MutationObserver) return () => {};
  const TextNode = view.Text;
  const existing = installations.get(doc);
  if (existing) {
    existing.users++;
    return lease(existing);
  }

  let owned: Text | null = null;
  let disposed = false;
  const observer = new view.MutationObserver((records) => {
    relinquish(records);
    reconcile();
  });

  function relinquish(records: MutationRecord[]) {
    if (owned && records.some((record) => record.target === owned ||
      (record.type === "childList" && record.target === owned?.parentNode))) owned = null;
  }

  function restore() {
    if (owned?.data === pluginName) owned.data = pluginId;
    owned = null;
    observer.takeRecords();
  }

  function reconcile() {
    const rows = doc.querySelectorAll(`[data-testid="plugin-row-${pluginId}"]`);
    const row = rows.length === 1 ? rows[0] : null;
    const column = row?.firstElementChild;
    const labelRow = column?.firstElementChild;
    const title = labelRow?.firstElementChild;
    const text = title?.firstChild;
    const valid = row?.tagName === "DIV" && row.children.length === 2 &&
      column?.tagName === "DIV" && labelRow?.tagName === "DIV" && labelRow.children.length === 2 &&
      title?.tagName === "DIV" && title.getAttribute("dir") === "auto" &&
      title.childNodes.length === 1 && text instanceof TextNode;
    if (owned && (!valid || owned !== text)) restore();
    if (!valid || !(text instanceof TextNode) || text.data !== pluginId) return;
    owned = text;
    text.data = pluginName;
    observer.takeRecords();
  }

  const installation = { users: 1, dispose() {
    if (disposed) return;
    disposed = true;
    relinquish(observer.takeRecords());
    observer.disconnect();
    restore();
    installations.delete(doc);
  } };
  try {
    observer.observe(doc, { subtree: true, childList: true, characterData: true });
  } catch {
    observer.disconnect();
    return () => {};
  }
  installations.set(doc, installation);
  reconcile();
  return lease(installation);

  function lease(value: { users: number; dispose: () => void }) {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--value.users === 0) value.dispose();
    };
  }
}
