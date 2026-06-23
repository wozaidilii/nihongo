import type { HeroClassId } from "~/types";
import type { CastErrorKind } from "~/lib/speechRecognition";
import type { Locale } from "./types";
import { CAST_CRIT_THRESHOLD, CAST_GOOD_THRESHOLD } from "~/lib/match";
import { powerScaleFromAccuracy } from "~/lib/match";

type L = Record<Locale, string>;

/** 三语文案表 */
export const messages = {
  title: {
    tagline: {
      zh: "〜 中二咒文学日语 〜",
      ja: "〜 厨二呪文で日本語 〜",
      en: "〜 Learn Japanese via Chuuni Chants 〜",
    } satisfies L,
    gameTitle: {
      zh: "吟唱勇者",
      ja: "詠唱勇者",
      en: "Chant Hero",
    } satisfies L,
    subtitle: {
      zh: "选职业 · 念咒文 · 放技能\n在像素冒险里学日语！",
      ja: "職業を選び · 呪文を唱え · 技を放て\nピクセル冒険で日本語を学ぼう！",
      en: "Pick a class · Chant spells · Unleash skills\nLearn Japanese in a pixel adventure!",
    } satisfies L,
    dragonLabel: {
      zh: "影龙",
      ja: "影のドラゴン",
      en: "Shadow Dragon",
    } satisfies L,
    adventureBlink: {
      zh: "▶ 开始冒险",
      ja: "▶ ADVENTURE",
      en: "▶ ADVENTURE",
    } satisfies L,
  },
  home: {
    welcomeBack: {
      zh: "欢迎回来，{name} 勇者 (Lv.{level})！",
      ja: "おかえり、{name} (Lv.{level})！",
      en: "Welcome back, {name} (Lv.{level})!",
    } satisfies L,
    continueAdventure: {
      zh: "继续冒险",
      ja: "冒険を続ける",
      en: "Continue",
    } satisfies L,
    reselectClass: {
      zh: "重选职业",
      ja: "職業を選び直す",
      en: "Change Class",
    } satisfies L,
    newPlayerHint: {
      zh: "选择职业开始冒险。不同职业学习不同的日语说话方式！",
      ja: "職業を選んで冒険を始めよう。職業ごとに学ぶ日本語の話し方が違う！",
      en: "Choose a class to begin. Each class teaches a different Japanese speech style!",
    } satisfies L,
    startAdventure: {
      zh: "开始冒险",
      ja: "冒険を始める",
      en: "Start Adventure",
    } satisfies L,
    browserTip: {
      zh: "建议使用 Chrome / Edge 以获得语音识别体验",
      ja: "音声認識には Chrome / Edge の利用を推奨します",
      en: "Use Chrome or Edge for the best speech recognition",
    } satisfies L,
  },
  common: {
    loading: {
      zh: "加载中…",
      ja: "読み込み中…",
      en: "Loading…",
    } satisfies L,
    back: {
      zh: "← 返回",
      ja: "← 戻る",
      en: "← Back",
    } satisfies L,
    backToTitle: {
      zh: "← 返回标题",
      ja: "← タイトルへ",
      en: "← Title Screen",
    } satisfies L,
    continue: {
      zh: "▶ 继续",
      ja: "▶ 続ける",
      en: "▶ Continue",
    } satisfies L,
    vs: {
      zh: "VS",
      ja: "VS",
      en: "VS",
    } satisfies L,
    exp: {
      zh: "EXP",
      ja: "EXP",
      en: "EXP",
    } satisfies L,
    signature: {
      zh: "口癖",
      ja: "口癖",
      en: "Catchphrase",
    } satisfies L,
    speechStyle: {
      zh: "语体",
      ja: "語体",
      en: "Speech style",
    } satisfies L,
  },
  select: {
    title: {
      zh: "选择你的职业",
      ja: "職業を選ぼう",
      en: "Choose Your Class",
    } satisfies L,
    subtitle: {
      zh: "职业决定你的日语说话方式 —— 点击试听语体示例",
      ja: "職業で日本語の話し方が決まる —— クリックで語体サンプルを聴く",
      en: "Your class defines how you speak Japanese — click to hear a sample",
    } satisfies L,
    confirm: {
      zh: "确定，出发！",
      ja: "決定、出発！",
      en: "Confirm & Go!",
    } satisfies L,
    pickFirst: {
      zh: "请先选择职业",
      ja: "まず職業を選んで",
      en: "Pick a class first",
    } satisfies L,
  },
  classCard: {
    selected: {
      zh: "▶ 已选择",
      ja: "▶ 選択中",
      en: "▶ Selected",
    } satisfies L,
  },
  adventure: {
    skillRoute: {
      zh: "技能路线：分支 {branch}",
      ja: "スキルルート：分岐 {branch}",
      en: "Skill path: Branch {branch}",
    } satisfies L,
    skillPlus: {
      zh: "技能+",
      ja: "スキル+",
      en: "Skill+",
    } satisfies L,
    unlockedSkills: {
      zh: "已解锁技能",
      ja: "解放済みスキル",
      en: "Unlocked Skills",
    } satisfies L,
    mapTitle: {
      zh: "冒险地图",
      ja: "冒険マップ",
      en: "Adventure Map",
    } satisfies L,
    mapSubtitle: {
      zh: "选择关卡，开始讨伐！",
      ja: "ステージを選んで討伐開始！",
      en: "Pick a stage and begin the hunt!",
    } satisfies L,
  },
  map: {
    cleared: {
      zh: "✔ 已通关",
      ja: "✔ クリア",
      en: "✔ Cleared",
    } satisfies L,
    enemy: {
      zh: "敌：{name}",
      ja: "敵：{name}",
      en: "Enemy: {name}",
    } satisfies L,
    unlockHint: {
      zh: "通关上一关后解锁",
      ja: "前のステージクリアで解放",
      en: "Clear the previous stage to unlock",
    } satisfies L,
  },
  battle: {
    narrator: {
      zh: "旁白",
      ja: "ナレーション",
      en: "Narrator",
    } satisfies L,
    learnVocab: {
      zh: "▶ 学习咒文词汇",
      ja: "▶ 呪文語彙を学ぶ",
      en: "▶ Learn Spell Vocabulary",
    } satisfies L,
    vocabTitle: {
      zh: "本关词汇",
      ja: "このステージの語彙",
      en: "Stage Vocabulary",
    } satisfies L,
    vocabHint: {
      zh: "点击单词可听发音，记住它们能帮你念好咒文！",
      ja: "単語をタップで発音。覚えると呪文が唱えやすい！",
      en: "Tap words to hear pronunciation — they help you chant spells!",
    } satisfies L,
    pronounce: {
      zh: "🔊 发音",
      ja: "🔊 発音",
      en: "🔊 Listen",
    } satisfies L,
    startBattle: {
      zh: "⚔️ 开始战斗！",
      ja: "⚔️ 戦闘開始！",
      en: "⚔️ Start Battle!",
    } satisfies L,
    winSpeaker: {
      zh: "胜利！",
      ja: "勝利！",
      en: "Victory!",
    } satisfies L,
    winText: {
      zh: "讨伐成功！{enemy} 被你的中二咒文击败了！本关词汇已收入图鉴。{skillHint}",
      ja: "討伐成功！{enemy} を厨二呪文で倒した！語彙を図鑑に追加。{skillHint}",
      en: "Victory! You defeated {enemy} with your chuuni chant! Vocabulary added to your codex. {skillHint}",
    } satisfies L,
    skillHint: {
      zh: " 你升级了，回冒险地图可选择技能强化！",
      ja: " レベルアップ！冒険マップでスキル強化を選べる！",
      en: " You leveled up — return to the map to pick a skill upgrade!",
    } satisfies L,
    allCleared: {
      zh: "🎉 你已通关全部关卡，真正的勇者！",
      ja: "🎉 全ステージクリア！真の勇者だ！",
      en: "🎉 All stages cleared — a true hero!",
    } satisfies L,
    nextStage: {
      zh: "前往下一关 →",
      ja: "次のステージへ →",
      en: "Next Stage →",
    } satisfies L,
    backToMap: {
      zh: "返回冒险地图",
      ja: "冒険マップへ戻る",
      en: "Back to Map",
    } satisfies L,
    loseSpeaker: {
      zh: "败北……",
      ja: "敗北……",
      en: "Defeat…",
    } satisfies L,
    loseText: {
      zh: "勇者倒下了……但传说不会终结。整理好咒文，再来挑战 {enemy} 吧！",
      ja: "勇者が倒れた……だが伝説は終わらない。呪文を整え、{enemy} に再挑戦！",
      en: "The hero falls… but legends never end. Regroup your chants and challenge {enemy} again!",
    } satisfies L,
    retry: {
      zh: "🔄 再次挑战",
      ja: "🔄 再挑戦",
      en: "🔄 Retry",
    } satisfies L,
    castFail: {
      zh: "咏唱失败！ ",
      ja: "詠唱失敗！ ",
      en: "Cast failed! ",
    } satisfies L,
    enemyAttack: {
      zh: "{reason}{enemy} 攻击，受到 {dmg} 点伤害！",
      ja: "{reason}{enemy} の攻撃で {dmg} ダメージ！",
      en: "{reason}{enemy} attacks — {dmg} damage taken!",
    } satisfies L,
    critDamage: {
      zh: "暴击！「{skill}」造成 {damage} 点伤害！{power}",
      ja: "クリティカル！「{skill}」で {damage} ダメージ！{power}",
      en: "Critical! 「{skill}」 deals {damage} damage! {power}",
    } satisfies L,
    normalDamage: {
      zh: "「{skill}」造成 {damage} 点伤害！{power}",
      ja: "「{skill}」で {damage} ダメージ！{power}",
      en: "「{skill}」 deals {damage} damage! {power}",
    } satisfies L,
    powerNote: {
      zh: "（威力 {pct}%）",
      ja: "（威力 {pct}%）",
      en: " (Power {pct}%)",
    } satisfies L,
  },
  cast: {
    skillNameHint: {
      zh: "技能名（不用念）",
      ja: "スキル名（唱えなくてOK）",
      en: "Skill name (don't chant this)",
    } satisfies L,
    incantTitle: {
      zh: "咏唱咒文 · 请念这个",
      ja: "詠唱呪文 · これを唱えて",
      en: "Incantation · Chant this",
    } satisfies L,
    listenDemo: {
      zh: "🔊 听示范",
      ja: "🔊 お手本",
      en: "🔊 Demo",
    } satisfies L,
    judgeTitle: {
      zh: "判定对照 · 威力看匹配度",
      ja: "判定参照 · 一致度で威力",
      en: "Scoring reference · Power from match",
    } satisfies L,
    kanaLabel: {
      zh: "假名：",
      ja: "仮名：",
      en: "Kana: ",
    } satisfies L,
    romajiLabel: {
      zh: "罗马音：",
      ja: "ローマ字：",
      en: "Romaji: ",
    } satisfies L,
    judgeHint: {
      zh: "可念汉字咒文或假名；系统把你念的内容与上方假名比对，相似度越高威力越大（与技能名无关）。",
      ja: "漢字呪文でも仮名でもOK。読み上げを上の仮名と比較し、一致度が高いほど威力アップ（スキル名は無関係）。",
      en: "Chant kanji or kana — we compare your speech to the kana above. Higher match = more power (skill name ignored).",
    } satisfies L,
    forestHint: {
      zh: "第一关提示：念对核心假名即可施法，不必一字不差。",
      ja: "第1関ヒント：核心仮名が合えば詠唱成功。完全一致不要。",
      en: "Stage 1 tip: match the core kana to cast — exact match not required.",
    } satisfies L,
    meaning: {
      zh: "含义：{text}",
      ja: "意味：{text}",
      en: "Meaning: {text}",
    } satisfies L,
    fallbackHint: {
      zh: "语音不可用，请输入咒文（汉字或假名均可）：",
      ja: "音声不可。呪文を入力（漢字・仮名どちらでも）：",
      en: "Speech unavailable — type the incantation (kanji or kana):",
    } satisfies L,
    fallbackPlaceholder: {
      zh: "よみがなを にゅうりょく",
      ja: "よみがなを にゅうりょく",
      en: "Enter reading (kana)",
    } satisfies L,
    castSkill: {
      zh: "释放技能",
      ja: "スキル発動",
      en: "Cast Skill",
    } satisfies L,
    listening: {
      zh: "🔴 聆听中…(点此结束)",
      ja: "🔴 聞き取り中…（タップで終了）",
      en: "🔴 Listening… (tap to stop)",
    } satisfies L,
    startMic: {
      zh: "🎤 念出咒文",
      ja: "🎤 呪文を唱える",
      en: "🎤 Chant Spell",
    } satisfies L,
    chantKana: {
      zh: "请念假名（推荐）",
      ja: "仮名を唱えて（推奨）",
      en: "Chant kana (recommended)",
    } satisfies L,
    interimFallback: {
      zh: "……或念汉字咒文「{incantation}」……",
      ja: "……または漢字呪文「{incantation}」……",
      en: "…or chant kanji 「{incantation}」…",
    } satisfies L,
    heard: {
      zh: "识别到：{text}",
      ja: "認識：{text}",
      en: "Heard: {text}",
    } satisfies L,
    notHeard: {
      zh: "(没听清)",
      ja: "(聞き取れず)",
      en: "(unclear)",
    } satisfies L,
    similarity: {
      zh: "与假名「{reading}」相似度",
      ja: "仮名「{reading}」との一致度",
      en: "Similarity to kana 「{reading}」",
    } satisfies L,
    retry: {
      zh: "再试一次",
      ja: "もう一度",
      en: "Try Again",
    } satisfies L,
    release: {
      zh: "释放！",
      ja: "発動！",
      en: "Cast!",
    } satisfies L,
    giveUp: {
      zh: "放弃咏唱",
      ja: "詠唱をやめる",
      en: "Give Up",
    } satisfies L,
    grade: {
      perfect: {
        zh: "咒文完美匹配 → 威力 {pct}%",
        ja: "呪文完全一致 → 威力 {pct}%",
        en: "Perfect match → Power {pct}%",
      } satisfies L,
      crit: {
        zh: "咒文完美匹配 · 暴击！→ 威力 {pct}%",
        ja: "呪文完全一致 · クリ！→ 威力 {pct}%",
        en: "Perfect match · Crit! → Power {pct}%",
      } satisfies L,
      good: {
        zh: "咒文匹配良好 → 威力 {pct}%",
        ja: "呪文良好一致 → 威力 {pct}%",
        en: "Good match → Power {pct}%",
      } satisfies L,
      partial: {
        zh: "咒文部分匹配 → 威力 {pct}%",
        ja: "呪文部分一致 → 威力 {pct}%",
        en: "Partial match → Power {pct}%",
      } satisfies L,
      fail: {
        zh: "未听清咒文，无法施法",
        ja: "呪文が聞き取れず、発動不可",
        en: "Incantation unclear — cannot cast",
      } satisfies L,
    } satisfies Record<string, L>,
  },
  skillTree: {
    title: {
      zh: "技能树 · 双分支",
      ja: "スキルツリー · 二分支",
      en: "Skill Tree · Dual Branch",
    } satisfies L,
    hint: {
      zh: "参考经典 RPG 双分支：Lv.2 选路线，Lv.3 在同路线进阶",
      ja: "クラシックRPG風：Lv.2でルート選択、Lv.3で同ルート強化",
      en: "Classic RPG dual branch: pick a path at Lv.2, advance at Lv.3",
    } satisfies L,
    currentBranch: {
      zh: " · 当前：分支 {branch}",
      ja: " · 現在：分岐 {branch}",
      en: " · Current: Branch {branch}",
    } satisfies L,
    pickRoute: {
      zh: "选择技能路线",
      ja: "スキルルートを選択",
      en: "Choose Skill Path",
    } satisfies L,
    advance: {
      zh: "技能进阶",
      ja: "スキル強化",
      en: "Skill Advancement",
    } satisfies L,
    pickRouteHint: {
      zh: "Lv.2 解锁：点击分支节点选择（选定后不可更改）",
      ja: "Lv.2 解放：分岐をクリック（選択後変更不可）",
      en: "Lv.2 unlock: click a branch node (choice is permanent)",
    } satisfies L,
    advanceHint: {
      zh: "Lv.3 解锁：点击节点完成进阶",
      ja: "Lv.3 解放：ノードをクリックで強化",
      en: "Lv.3 unlock: click a node to advance",
    } satisfies L,
    later: {
      zh: "稍后选择",
      ja: "後で選ぶ",
      en: "Choose Later",
    } satisfies L,
  },
  hp: {
    hero: {
      zh: "勇者血量",
      ja: "勇者HP",
      en: "Hero HP",
    } satisfies L,
    enemy: {
      zh: "敌人血量",
      ja: "敵HP",
      en: "Enemy HP",
    } satisfies L,
  },
  speech: {
    errors: {
      unsupported: {
        zh: "当前浏览器不支持语音识别，已切换为手动输入。",
        ja: "このブラウザは音声認識非対応。手入力に切り替えました。",
        en: "Speech recognition unsupported — switched to manual input.",
      } satisfies L,
      "not-allowed": {
        zh: "麦克风权限被拒绝，已切换为手动输入。",
        ja: "マイク権限が拒否されました。手入力に切り替えました。",
        en: "Microphone denied — switched to manual input.",
      } satisfies L,
      "no-speech": {
        zh: "没有听清，请再念一次咒文！",
        ja: "聞き取れませんでした。もう一度唱えて！",
        en: "Couldn't hear you — chant again!",
      } satisfies L,
      "audio-capture": {
        zh: "找不到麦克风设备，已切换为手动输入。",
        ja: "マイクが見つかりません。手入力に切り替えました。",
        en: "No microphone found — switched to manual input.",
      } satisfies L,
      network: {
        zh: "网络异常，语音识别暂不可用，请手动输入。",
        ja: "ネットワークエラー。音声認識不可、手入力してください。",
        en: "Network error — speech unavailable, please type instead.",
      } satisfies L,
      aborted: {
        zh: "咏唱被中断了。",
        ja: "詠唱が中断されました。",
        en: "Casting was interrupted.",
      } satisfies L,
      unknown: {
        zh: "语音识别出错，请重试或手动输入。",
        ja: "音声認識エラー。再試行または手入力してください。",
        en: "Speech recognition error — retry or type manually.",
      } satisfies L,
    } satisfies Record<string, L>,
  },
  meta: {
    title: {
      zh: "吟唱勇者 | 中二咒文学日语",
      ja: "詠唱勇者 | 厨二呪文で日本語",
      en: "Chant Hero | Learn Japanese via Chants",
    } satisfies L,
    description: {
      zh: "通过勇者探险与中二咒文学习日语：选择职业，念出咒文释放技能！",
      ja: "勇者冒険と厨二呪文で日本語を学ぶ：職業を選び、呪文を唱えてスキルを放て！",
      en: "Learn Japanese through hero adventures and chuuni chants: pick a class and cast spells by voice!",
    } satisfies L,
  },
} as const;

const HERO_NAMES: Record<HeroClassId, L> = {
  knight: { zh: "骑士", ja: "騎士", en: "Knight" },
  mage: { zh: "魔法师", ja: "魔法使い", en: "Mage" },
  rogue: { zh: "盗贼", ja: "盗賊", en: "Rogue" },
  samurai: { zh: "武士", ja: "侍", en: "Samurai" },
};

export function t(text: L, locale: Locale): string {
  return text[locale] ?? text.zh;
}

export function heroName(id: HeroClassId, locale: Locale): string {
  return HERO_NAMES[id]?.[locale] ?? HERO_NAMES[id]?.zh ?? id;
}

/** 替换 {name}、{level} 等占位符 */
export function formatMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? ""),
  );
}

/** 准确度 → 评价文案 */
export function gradeText(acc: number, locale: Locale): string {
  const powerPct = Math.round(powerScaleFromAccuracy(acc) * 100);
  const vars = { pct: powerPct };
  if (acc >= 100) {
    return formatMessage(t(messages.cast.grade.perfect, locale), vars);
  }
  if (acc >= CAST_CRIT_THRESHOLD) {
    return formatMessage(t(messages.cast.grade.crit, locale), vars);
  }
  if (acc >= CAST_GOOD_THRESHOLD) {
    return formatMessage(t(messages.cast.grade.good, locale), vars);
  }
  if (acc > 0) {
    return formatMessage(t(messages.cast.grade.partial, locale), vars);
  }
  return t(messages.cast.grade.fail, locale);
}

/** 语音识别错误 → 人类可读提示 */
export function speechErrorText(kind: CastErrorKind, locale: Locale): string {
  const map = messages.speech.errors;
  const entry = map[kind as keyof typeof map];
  return entry ? t(entry, locale) : t(map.unknown, locale);
}
