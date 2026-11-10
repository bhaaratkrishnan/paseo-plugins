export type SettingsLocale = "en";
export type SettingsLanguage = {
  getSnapshot(): SettingsLocale;
  subscribe(listener: () => void): () => void;
  dispose(): void;
};

export const englishSettingsLocale = (): SettingsLocale => "en";

const english: SettingsLanguage = {
  getSnapshot: englishSettingsLocale,
  subscribe: () => () => {},
  dispose() {},
};

// The plugin ships English copy only, so the settings screen and the selection
// toolbar stay English regardless of the host language.
export function createSettingsLanguage(): SettingsLanguage {
  return english;
}
