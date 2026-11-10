import { z } from "zod";

export const QUOTE_PLUGIN_ID = "quote-notes";
export const quotePluginIdSchema = z.enum([QUOTE_PLUGIN_ID, "quote"]);
