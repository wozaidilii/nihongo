/**
 * 文字转语音(TTS)封装。
 * 基于浏览器 SpeechSynthesis，优先选择 ja-JP 嗓音；
 * 不支持时静默降级，绝不抛错。
 */

/** 是否支持语音合成 */
export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** 在可用嗓音里挑一个日语嗓音，挑不到返回 undefined */
function pickJaVoice(): SpeechSynthesisVoice | undefined {
  if (!isTtsSupported()) return undefined;
  const voices = window.speechSynthesis.getVoices() ?? [];
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith("ja")) ?? undefined
  );
}

/**
 * 朗读一段日语文本。
 * @param text 要朗读的文本
 * @param rate 语速(默认 1)
 */
export function speak(text: string, rate = 1): void {
  if (!isTtsSupported() || !text) return;
  try {
    const synth = window.speechSynthesis;
    // 先停掉正在播放的，避免叠加
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    const voice = pickJaVoice();
    if (voice) utter.voice = voice;
    utter.rate = Number.isFinite(rate) && rate > 0 ? rate : 1;
    synth.speak(utter);
  } catch {
    // 任意异常都忽略，保证不影响游戏主流程
  }
}

/** 停止当前朗读 */
export function stopSpeaking(): void {
  if (!isTtsSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // 忽略
  }
}
