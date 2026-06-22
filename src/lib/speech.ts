import type { Skill } from "~/types";

/** 取技能咒文；缺字段时回退技能名 */
export function incantationFor(skill: Skill): string {
  return skill.incantation?.trim() || skill.nameJa;
}

/** 取技能目标读音 */
export function readingFor(skill: Skill): string {
  return skill.reading?.trim() ?? "";
}

/** 取技能罗马音读音 */
export function romajiFor(skill: Skill): string {
  return skill.romaji?.trim() ?? "";
}
