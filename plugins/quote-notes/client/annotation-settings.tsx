import { useSyncExternalStore } from "react";
import type { PluginClientContext } from "@getpaseo/plugin/client";
import { useSettings } from "@getpaseo/plugin/client";
import { SettingsAction, SettingsCard, SettingsRow, SettingsSection, SettingsSwitch } from "@getpaseo/plugin/client/ui";
import { annotationValuesSchema, preferences, type AnnotationKind } from "../shared/preferences";
import type { AnnotationPreferences } from "./annotation-preferences";
import { createSettingsLanguage, englishSettingsLocale, type SettingsLanguage, type SettingsLocale } from "./settings-language";

type SettingsCopy = {
  title: string;
  sectionTitle: string;
  sectionInfo: string;
  kinds: Record<AnnotationKind, string>;
  loading: string;
  unavailable: string;
  unsaved: string;
  reload: string;
  retry: string;
};
const settingsCopy: Record<SettingsLocale, SettingsCopy> = {
  en: {
    title: "Annotation types",
    sectionTitle: "Add annotations",
    sectionInfo: "Only affects new annotations. Saved annotations can still be viewed, edited, and removed. Side chat remains available.",
    kinds: { chat: "Chat selections", file: "Files and read-only code", diff: "Diff selections", markdown: "Markdown preview", terminal: "Terminal output" },
    loading: "Loading annotation settings…",
    unavailable: "Annotation settings unavailable",
    unsaved: "Settings not saved",
    reload: "Reload saved settings",
    retry: "Retry loading",
  },
};
const englishLanguage: SettingsLanguage = { getSnapshot: englishSettingsLocale, subscribe: () => () => {}, dispose() {} };

export function AnnotationSettings({ controller, language = englishLanguage }: { controller: AnnotationPreferences; language?: SettingsLanguage }) {
  const locale = useSyncExternalStore(language.subscribe, language.getSnapshot, englishSettingsLocale);
  const copy = settingsCopy[locale];
  const settings = useSettings(preferences);
  const toggle = async (kind: AnnotationKind, value: boolean) => {
    if (settings.status !== "ready" || settings.saving) return;
    const next = { ...settings.values, [kind]: value };
    if (await settings.save(next, settings.revision)) controller.accept(next);
  };
  return <SettingsSection title={copy.sectionTitle} info={copy.sectionInfo}>
    <SettingsCard>
      {settings.status === "ready" ? annotationValuesSchema.keyof().options.map((key) =>
        <SettingsSwitch key={key} label={copy.kinds[key]} value={settings.values[key]} disabled={settings.saving} onValueChange={(value) => { void toggle(key, value); }} />
      ) : <SettingsRow label={settings.status === "loading" ? copy.loading : copy.unavailable} error={settings.status === "loading" ? undefined : settings.error} />}
      {settings.saveError ? <SettingsRow label={copy.unsaved} error={settings.saveError} /> : null}
      <SettingsAction label={copy.reload} actionLabel={copy.retry} disabled={settings.saving || settings.status === "loading"} onPress={() => { void settings.reload().then(() => controller.refresh()); }} />
    </SettingsCard>
  </SettingsSection>;
}

export function installAnnotationSettings(client: PluginClientContext, controller: AnnotationPreferences, sharedLanguage?: SettingsLanguage): () => void {
  const language = sharedLanguage ?? createSettingsLanguage();
  const Component = () => <AnnotationSettings controller={controller} language={language} />;
  let title = settingsCopy[language.getSnapshot()].title;
  const register = () => client.addSettingsScreen({ id: "annotation-kinds", title, icon: "MessageSquareQuote", Component });
  let remove = register();
  let disposed = false;
  let queued = false;
  const unsubscribe = language.subscribe(() => {
    if (queued || disposed) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (disposed) return;
      const nextTitle = settingsCopy[language.getSnapshot()].title;
      if (nextTitle === title) return;
      remove();
      title = nextTitle;
      remove = register();
    });
  });
  return () => {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    if (!sharedLanguage) language.dispose();
    remove();
  };
}
