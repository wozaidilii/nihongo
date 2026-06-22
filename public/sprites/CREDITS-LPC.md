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

## 重新生成精灵

```bash
# 勇者 + 史莱姆
python3 scripts/build_lpc_sprites.py

# 影龙 + 技能特效
python3 scripts/build_fx_and_dragon.py
```

生成结果位于 `public/sprites/heroes/`、`public/sprites/enemies/` 与 `sprites-manifest.json`。
