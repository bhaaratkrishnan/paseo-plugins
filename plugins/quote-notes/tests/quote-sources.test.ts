import assert from "node:assert/strict";
import { test } from "node:test";
import { captureSource, QuoteSources } from "../client/quote-sources";
import { makeQuote } from "../client/host-draft-bridge";
import { setup } from "./dom";

test("exact ranges reject replacement, mutation and scope collisions without first-text matching", () => {
  const { dom, anchor, binding } = setup();
  const registry = new QuoteSources(), id = makeQuote("> original", "original", dom.window.location.href).item.id;
  const repeated = anchor.cloneNode(true); binding.anchor.append(repeated);
  const range = dom.window.document.createRange(); range.selectNodeContents(anchor);
  registry.remember("host-a", id, captureSource(range, binding.anchor));
  dom.window.getSelection()?.removeAllRanges();
  assert.equal(registry.resolve("host-a", id)?.range.toString(), "原始引用内容");
  assert.equal(registry.resolve("host-b", id), null);
  anchor.replaceWith(anchor.cloneNode(true));
  assert.equal(registry.resolve("host-a", id), null);
  assert.equal(registry.reveal("host-a", id), false);
  const second = dom.window.document.createRange(); second.selectNodeContents(repeated);
  registry.remember("host-a", id, captureSource(second, binding.anchor));
  repeated.textContent = "原始引用内容";
  assert.equal(registry.resolve("host-a", id), null);
  registry.dispose(); dom.window.close();
});

test("source geometry measures live selection, clips to transcript and composer, and returns offscreen", () => {
  const { dom, anchor, binding, wrapper } = setup();
  const registry = new QuoteSources(), id = makeQuote("> original", "original", dom.window.location.href).item.id;
  const rect = (x: number, y: number, width: number, height: number) => new dom.window.DOMRect(x, y, width, height);
  let current = rect(100, 180, 120, 20);
  dom.window.Range.prototype.getClientRects = () => Object.assign([current], { item: () => current });
  binding.anchor.getBoundingClientRect = () => rect(50, 40, 500, 500);
  wrapper.getBoundingClientRect = () => rect(50, 450, 500, 100);
  const range = dom.window.document.createRange(); range.selectNodeContents(anchor);
  registry.remember("scope", id, captureSource(range, binding.anchor));
  const first = registry.geometry("scope", id, wrapper);
  assert.equal(first.kind, "visible");
  if (first.kind === "visible") assert.equal(first.rects[0].top, 180);
  current = rect(100, 260, 120, 20);
  const moved = registry.geometry("scope", id, wrapper);
  if (moved.kind !== "visible") throw new Error("Expected moved source");
  assert.equal(moved.rects[0].top, 260);
  current = rect(100, 500, 120, 20);
  assert.equal(registry.geometry("scope", id, wrapper).kind, "offscreen");
  registry.dispose(); dom.window.close();
});
