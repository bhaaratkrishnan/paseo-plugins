import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { z } from "zod";
import { makeQuote, readQuotes } from "../client/host-draft-bridge";
import { QUOTE_PLUGIN_ID } from "../client/quote-identity";

test("public manifest and new annotations use quote-notes while old quotes remain readable without mutation", () => {
  const manifest = z.object({ id: z.string() }).parse(JSON.parse(readFileSync(new URL("../paseo-plugin.json", import.meta.url), "utf8")));
  assert.equal(manifest.id, QUOTE_PLUGIN_ID);
  const current = makeQuote("> complete text", "selection", "https://paseo.sh/");
  assert.equal(current.pluginId, "quote-notes");
  const legacy = { ...current, pluginId: "quote", futureAttachment: 42, item: { ...current.item, futureItem: { keep: true } } };
  const unrelated = { ...current, pluginId: "other-plugin" };
  const input = { text: "body", attachments: [legacy, unrelated, current] };
  const original = structuredClone(input);
  const recognized = readQuotes(input);
  assert.deepEqual(recognized, [legacy, current]);
  assert.deepEqual(input, original);
});
