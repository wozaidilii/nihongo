## VoxCPM Sample Voices Need Prompt And Loudness Guardrails

- 问题：角色选择页的盗贼试听音频听起来假，且可能出现怪叫或刺耳爆音。
- 根因：试听文案包含「へへっ」这类笑声触发词，盗贼 persona 又偏夸张；生成后的 wav 没有裁静音、淡入淡出和峰值归一化，正式 `sample_tameguchi.wav` 曾贴近 0dB。
- 修复：去掉盗贼 sample 的笑声触发词，降低 `tameguchi` Voice Design 参数，明确禁止 laughter/screaming/growling/sound effects，并在 VoxCPM 生成管线写入前统一做音频后处理。
- 预防：新增或替换角色 sample 时，先生成 preview，检查峰值不要贴近 0dB，再进入正式 `public/voices`；避免在 Voice Design 锚点文本中使用拟声笑、尖叫、叹词堆叠或效果音式提示。
