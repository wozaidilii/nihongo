# 勇者日语探险 (Pixel Hero Nihongo)

一个像素风(retro JRPG)的日语学习 Web：选择勇者职业，**念出中二咒文(语音输入)**释放技能讨伐怪兽，在冒险中学习 N5 日语。不同职业对应不同的日语说话方式(语体)。

## 玩法

1. 选择职业 —— 决定你的日语语体(说话方式)
   - 騎士 → 丁寧語·敬语（です・ます）
   - 魔法使い → 中二·文言混合（我が〜よ／〜なり）
   - 盗賊 → 随便·口语（〜だぜ／〜じゃん）
   - 侍 → 古风·武士语（拙者／〜でござる）
2. 在冒险地图选择关卡，先学习本关词汇(可点击 TTS 发音)
3. 战斗中念出按你职业语体生成的中二咒文：
   - 语音识别比对读音，**准确度 ≥ 70% 才释放成功**，准确度越高伤害越高(≥ 92% 暴击)
   - 念错则施法失败，被怪兽反击
4. 击败怪兽通关，获得经验、解锁下一关；进度自动存档(localStorage)

> 语音施法基于浏览器 Web Speech API，建议使用 **Chrome / Edge**。
> 不支持语音识别或拒绝麦克风权限时，会自动降级为「手动输入假名」施法，保证可玩。

## 技术栈

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)(CSS 内 `@theme` 定义 16 色 Sweetie 16 调色板)
- [tRPC](https://trpc.io)(脚手架自带，内容当前用静态数据)
- [Zustand](https://github.com/pmndrs/zustand) 状态管理
- Web Speech API：`SpeechRecognition`(语音识别) + `SpeechSynthesis`(TTS)

## 目录结构

```
src/
  app/                  页面：标题 / 选职业 / 地图 / 战斗
    page.tsx            标题画面
    select/             职业选择
    adventure/          冒险地图
    battle/[stageId]/   战斗(对话→学词→语音施法→结算)
  components/
    pixel/              像素 UI(按钮/面板/精灵/HP条/打字机)
    game/               ClassCard / MapNode
    battle/             DialogueBox / CastPanel(语音施法)
  data/                 classes.ts(职业+语体) / stages.ts(关卡)
  hooks/                useSpeechCast(施法) / useGameReady(水合)
  lib/                  match(评分) / speechRecognition / tts / speech / storage
  store/                game.ts(zustand 存档)
  types/                领域类型 + Web Speech API 类型声明
  styles/               globals.css(令牌) / pixel.css(像素动画)
```

## 本地运行

```bash
npm install
npm run dev        # http://localhost:3000
```

其他脚本：

```bash
npm run typecheck  # 类型检查
npm run build      # 生产构建
```

## 扩展

- 新增关卡：编辑 `src/data/stages.ts`，为每个技能补齐四种语体的 `incantationByStyle` 与 `readingByStyle`
- 新增职业/语体：编辑 `src/data/classes.ts`
- 替换像素素材：把 `PixelSprite` 的 emoji 占位换成 `public/sprites/` 下的 PNG(配合 `.pixelated`)
