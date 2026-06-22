import type { Skill, SpeechStyleId } from "~/types";

/**
 * 按语体取技能咒文/读音的工具。
 * 统一处理「某语体缺失」的兜底，避免 UI 取到 undefined 而崩溃。
 */

/** 取某语体下的咒文写法，缺失时回退到中二体或任意可用项 */
export function incantationFor(skill: Skill, styleId: SpeechStyleId): string {
  const map = skill.incantationByStyle;
  return map[styleId] ?? map.chuuni ?? Object.values(map)[0] ?? skill.nameJa;
}

/** 取某语体下的目标读音，缺失时同样兜底 */
export function readingFor(skill: Skill, styleId: SpeechStyleId): string {
  const map = skill.readingByStyle;
  return map[styleId] ?? map.chuuni ?? Object.values(map)[0] ?? "";
}
