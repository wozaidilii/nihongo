import type { SpeechStyleId } from "~/types";
import { speak } from "~/lib/tts";

/**
 * VoxCPM 预生成配音播放。
 * 优先播放 public/voices 下的中二动漫配音；文件缺失/出错时回退到浏览器 TTS。
 */

// 同一时刻只允许一个配音在播放
let current: HTMLAudioElement | null = null;

/** 语体示例台词的音频路径(选职业试听) */
export function styleSampleSrc(styleId: SpeechStyleId): string {
  return `/voices/sample_${styleId}.wav`;
}

/** 技能咒文的音频路径(战斗听示范) */
export function skillVoiceSrc(skillId: string, styleId: SpeechStyleId): string {
  return `/voices/skill_${skillId}_${styleId}.wav`;
}

/** 停止当前配音 */
export function stopVoice(): void {
  if (current) {
    try {
      current.pause();
      current.currentTime = 0;
    } catch {
      // 忽略
    }
    current = null;
  }
}

/**
 * 播放指定音频；失败(不支持/404/解码错误)时执行 fallback。
 * fallback 只会被调用一次，避免重复发声。
 */
export function playVoice(src: string, fallback?: () => void): void {
  if (typeof window === "undefined" || !src) {
    fallback?.();
    return;
  }

  stopVoice();

  let fellBack = false;
  const doFallback = () => {
    if (fellBack) return;
    fellBack = true;
    fallback?.();
  };

  try {
    const audio = new Audio(src);
    current = audio;
    audio.onerror = doFallback;
    audio.play().catch(doFallback);
  } catch {
    doFallback();
  }
}

/**
 * 便捷方法：播放配音文件，失败则用 TTS 朗读 text。
 */
export function playVoiceOrTts(src: string, text: string): void {
  playVoice(src, () => speak(text));
}
