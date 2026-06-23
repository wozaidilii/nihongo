"use client";

import type { Element, Enemy, Skill } from "~/types";
import type { Locale } from "~/i18n/types";
import { getElementMatchup } from "~/lib/element";
import { iconKeyForSkill } from "~/data/skillIcons";
import { SkillIcon } from "~/components/pixel/SkillIcon";
import { getElementLabel, getSkillDisplayName, messages, t } from "~/i18n";

interface ElementBadgeProps {
  enemy: Pick<Enemy, "element" | "weakness" | "resist">;
  locale: Locale;
  isBoss?: boolean;
  className?: string;
}

/** 怪物属性与弱点/抵抗展示 */
export function ElementBadge({ enemy, locale, isBoss, className = "" }: ElementBadgeProps) {
  const weakLabels = enemy.weakness.map((el) => getElementLabel(el, locale));
  const resistLabels = (enemy.resist ?? []).map((el) => getElementLabel(el, locale));

  return (
    <div className={`font-jp text-[10px] leading-relaxed text-rpg-12 sm:text-[11px] ${className}`}>
      {isBoss && (
        <span className="mr-2 font-pixel text-rpg-3">{t(messages.battle.bossTag, locale)}</span>
      )}
      <span>
        {t(messages.battle.elementLabel, locale)}：{getElementLabel(enemy.element, locale)}
      </span>
      {weakLabels.length > 0 && (
        <span className="ml-2 text-rpg-6">
          {t(messages.battle.weaknessLabel, locale)}：{weakLabels.join(" · ")}
        </span>
      )}
      {resistLabels.length > 0 && (
        <span className="ml-2 text-rpg-14">
          {t(messages.battle.resistLabel, locale)}：{resistLabels.join(" · ")}
        </span>
      )}
    </div>
  );
}

interface SkillBarProps {
  skills: Skill[];
  selectedId: string | null;
  enemy: Pick<Enemy, "element" | "weakness" | "resist">;
  locale: Locale;
  disabled?: boolean;
  onSelect: (skillId: string) => void;
}

function matchupHint(skillEl: Element, enemy: SkillBarProps["enemy"], locale: Locale): string {
  const { result } = getElementMatchup(skillEl, enemy);
  if (result === "super") return t(messages.battle.matchupSuper, locale);
  if (result === "weak") return t(messages.battle.matchupWeak, locale);
  return "";
}

/** 自选技能栏：展示属性克制提示 */
export function SkillBar({
  skills,
  selectedId,
  enemy,
  locale,
  disabled = false,
  onSelect,
}: SkillBarProps) {
  if (skills.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="font-pixel text-[10px] text-rpg-5">
        {t(messages.battle.selectSkill, locale)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {skills.map((skill) => {
          const selected = skill.id === selectedId;
          const el = skill.element ?? "neutral";
          const hint = matchupHint(el, enemy, locale);
          const name = getSkillDisplayName(skill, locale);

          return (
            <button
              key={skill.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(skill.id)}
              className={`touch-target rounded border-2 p-2 text-left transition-colors disabled:opacity-50 ${
                selected
                  ? "border-rpg-5 bg-rpg-8/40"
                  : "border-rpg-15 bg-rpg-13/50 hover:border-rpg-8"
              }`}
              aria-pressed={selected}
            >
              <div className="flex items-center gap-2">
                <SkillIcon iconKey={iconKeyForSkill(skill.fxKey)} size={28} title={name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-jp text-xs text-rpg-5">{name}</p>
                  <p className="font-jp text-[10px] text-rpg-14">
                    {getElementLabel(el, locale)} · {skill.baseDamage}
                  </p>
                  {hint && (
                    <p
                      className={`font-jp text-[9px] ${
                        hint === t(messages.battle.matchupSuper, locale)
                          ? "text-rpg-6"
                          : "text-rpg-14"
                      }`}
                    >
                      {hint}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
