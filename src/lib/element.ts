import type { Element, SkillFxKey } from "~/types";

/** fxKey → 属性（物理类为 neutral） */
const FX_ELEMENT: Record<SkillFxKey, Element> = {
  fire: "fire",
  holy: "holy",
  lightning: "lightning",
  shadow: "shadow",
  slash: "neutral",
  dagger: "neutral",
  thrust: "neutral",
};

/** 属性克制判定结果 */
export type MatchupResult = "super" | "weak" | "neutral";

export interface ElementMatchup {
  result: MatchupResult;
  multiplier: number;
}

export interface ElementTraits {
  element: Element;
  weakness: Element[];
  resist?: Element[];
}

/** 从特效键推断技能属性 */
export function elementFromFx(fxKey: SkillFxKey): Element {
  return FX_ELEMENT[fxKey] ?? "neutral";
}

/** 宝可梦式：弱点列表 ×1.5，抵抗 ×0.5，其余 ×1 */
export function getElementMatchup(
  skillElement: Element,
  enemy: ElementTraits,
): ElementMatchup {
  if (skillElement === "neutral") {
    return { result: "neutral", multiplier: 1 };
  }
  if (enemy.weakness.includes(skillElement)) {
    return { result: "super", multiplier: 1.5 };
  }
  if (enemy.resist?.includes(skillElement)) {
    return { result: "weak", multiplier: 0.5 };
  }
  return { result: "neutral", multiplier: 1 };
}
