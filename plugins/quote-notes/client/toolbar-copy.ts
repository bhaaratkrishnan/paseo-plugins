import type { SettingsLocale } from "./settings-language";

type ToolbarMessages = {
  selection: string;
  add: string;
  addTo: (name: string) => string;
  receiver: string;
  receiverFor: (name: string) => string;
  chooseReceiver: string;
  noReceiver: string;
  side: string;
  cancel: string;
  ask: string;
  question: string;
  questionPlaceholder: string;
  questionHint: string;
  settingsLoading: string;
  settingsError: (error: string) => string;
  disabled: string;
};

export const toolbarCopy: Record<SettingsLocale, ToolbarMessages> = {
  en: {
    selection: "Selected text",
    add: "Add to chat",
    addTo: (name) => `Add to ${name}`,
    receiver: "Change receiving chat",
    receiverFor: (name) => `Change receiving chat: ${name}`,
    chooseReceiver: "Choose receiving chat",
    noReceiver: "No receiving chat in this workspace",
    side: "Ask in side chat",
    cancel: "Cancel",
    ask: "Ask",
    question: "Side chat question",
    questionPlaceholder: "Ask about this in a side chat…",
    questionHint: "Enter · Ask     Shift+Enter · New line",
    settingsLoading: "Loading annotation settings…",
    settingsError: (error) => `Could not load annotation settings: ${error}`,
    disabled: "This annotation type is disabled. Enable it in plugin settings.",
  },
};
