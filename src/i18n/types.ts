/** 界面语言：中文 / 日语 / 英语 */
export type Locale = "zh" | "ja" | "en";

export const LOCALES: Locale[] = ["zh", "ja", "en"];

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  ja: "日本語",
  en: "EN",
};

/** 无效值时回退中文 */
export function parseLocale(value: unknown): Locale {
  if (value === "zh" || value === "ja" || value === "en") return value;
  return "zh";
}
