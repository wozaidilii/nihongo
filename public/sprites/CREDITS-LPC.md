# LPC 素材版权说明

本项目的勇者/怪物像素动画基于 [Liberated Pixel Cup (LPC)](https://lpc.opengameart.org/) 免费素材合成，遵循各作者许可协议。

## 勇者（四职业）

来源：[LPC Medieval Fantasy Character Sprites](https://opengameart.org/content/lpc-medieval-fantasy-character-sprites)（Johannes Sjölund / wulax，OGA-BY 3.0 / CC-BY-SA）

- **骑士**：板甲 + 头盔 + 挥砍/咏唱动画
- **魔法师**：长袍 + 兜帽 + 法术咏唱
- **盗贼**：皮甲 + 匕首 + 挥砍
- **武士**：链甲 + 长枪突刺

合成脚本：[`scripts/build_lpc_sprites.py`](../../scripts/build_lpc_sprites.py)

## 敌人

| 敌人 | 来源 | 许可 |
|------|------|------|
| 史莱姆 | [Animated Slime](https://opengameart.org/content/animated-slime) by Calciumtrice | CC-BY 3.0 |
| 影龙 | [RPG Enemies: 11 Dragons](https://opengameart.org/content/rpg-enemies-11-dragons)（Redshrike 等）+ [Dragon idle animation](https://opengameart.org/content/dragon-idle-animation)（Scribe） | CC-BY-SA 3.0 / GPL 3.0 |

影龙署名：Stephen "Redshrike" Challener、Surt（原设）、Daniel Stephens / Scribe（呼吸动画）

技能特效为项目内生成（`scripts/build_fx_and_dragon.py`）。

## 技能图标（Kyrise 16×16 RPG Icon Pack）

来源：[Kyrise's Free 16x16 RPG Icon Pack](https://opengameart.org/content/kyrises-free-16x16-rpg-icon-pack)（Kyrise，**CC BY 4.0**，可商用，需署名）

**署名文案（游戏关于页 / 本文件）：**

> 技能图标来自 Kyrise's Free 16x16 RPG Icon Pack  
> Graphics made by Kyrise: https://kyrise.itch.io/  
> License: Creative Commons Attribution 4.0 International (CC BY 4.0)

| 游戏图标键 | Kyrise 源文件 | 用途 |
|-----------|--------------|------|
| fire | potion_03f.png | 火球 / 炎系 |
| holy | shield_03b.png | 圣光 / 圣盾 |
| shadow | book_05a.png | 暗影咒文 |
| slash | sword_03a.png | 斩击 |
| dagger | sword_02a.png | 突刺 / 盗贼 |
| lightning | crystal_01h.png | 雷电 |
| thrust | arrow_03a.png | 突刺 / 居合 |
| hp-up | potion_01h.png | 技能树·生命 |
| crit-up | gem_01f.png | 技能树·暴击 |
| power-up | ingot_01e.png | 技能树·全伤 |
| guard | shield_03a.png | 技能树·守护 |
| void | scroll_01f.png | 技能树·虚无 |

- 仓库内 16×16 源图：`public/sprites/icons/kyrise/*.png`
- 游戏用 32×32 图标表：`public/sprites/icons/icons.png`（Nearest 放大）
- 生成：`npm run build:icons` 或 `python3 scripts/build_skill_icons.py`

完整素材包下载（首次构建需解压到 `public/sprites/icons/_src/kyrise/`）：

```bash
curl -L -o public/sprites/icons/_src/kyrise/Kyrises_16x16_RPG_Icon_Pack_V1.2.zip \
  https://opengameart.org/sites/default/files/Kyrises_16x16_RPG_Icon_Pack_V1.2.zip
unzip -o public/sprites/icons/_src/kyrise/Kyrises_16x16_RPG_Icon_Pack_V1.2.zip \
  -d public/sprites/icons/_src/kyrise/extracted
python3 scripts/build_skill_icons.py
```

## 重新生成精灵

```bash
# 勇者 + 史莱姆
python3 scripts/build_lpc_sprites.py

# 影龙 + 技能特效
python3 scripts/build_fx_and_dragon.py

# 技能图标（Kyrise）
npm run build:icons
```

生成结果位于 `public/sprites/heroes/`、`public/sprites/enemies/`、`public/sprites/icons/` 与 `sprites-manifest.json`。
