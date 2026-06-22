/**
 * 语音识别(SpeechRecognition)封装。
 * 提供支持性检测，以及一个带回调的轻量包装器；
 * 统一处理权限/错误/超时，组件卸载时可安全释放。
 */

/** 取得浏览器的 SpeechRecognition 构造器(兼容 webkit 前缀) */
function getRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? undefined;
}

/** 是否支持语音识别 */
export function isSpeechRecognitionSupported(): boolean {
  return !!getRecognitionCtor();
}

/** 识别错误归类，供 UI 给出友好提示 */
export type CastErrorKind =
  | "unsupported"
  | "not-allowed"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "aborted"
  | "unknown";

function classifyError(error: string): CastErrorKind {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "not-allowed";
    case "no-speech":
      return "no-speech";
    case "audio-capture":
      return "audio-capture";
    case "network":
      return "network";
    case "aborted":
      return "aborted";
    default:
      return "unknown";
  }
}

export interface RecognizerCallbacks {
  /** 实时识别文本(中间结果) */
  onInterim?: (text: string) => void;
  /** 最终识别文本 */
  onFinal?: (text: string) => void;
  /** 出错回调 */
  onError?: (kind: CastErrorKind, message: string) => void;
  /** 识别结束(无论成功失败) */
  onEnd?: () => void;
}

export interface Recognizer {
  start: () => void;
  stop: () => void;
  /** 彻底释放(组件卸载时调用) */
  dispose: () => void;
}

/**
 * 创建一个日语识别器。
 * 不支持时返回 null(调用方据此走降级)。
 * @param timeoutMs 最长识别时长，超时自动停止(默认 8s)
 */
export function createRecognizer(
  callbacks: RecognizerCallbacks,
  timeoutMs = 8000,
): Recognizer | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    callbacks.onError?.("unsupported", "当前浏览器不支持语音识别");
    return null;
  }

  let recognition: SpeechRecognition | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  let running = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const buildInstance = (): SpeechRecognition => {
    const inst = new Ctor();
    inst.lang = "ja-JP";
    inst.continuous = false;
    inst.interimResults = true;
    inst.maxAlternatives = 1;

    inst.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const alt = result[0];
        const transcript = alt?.transcript ?? "";
        if (result.isFinal) finalText += transcript;
        else interim += transcript;
      }
      if (interim) callbacks.onInterim?.(interim);
      if (finalText) callbacks.onFinal?.(finalText);
    };

    inst.onerror = (event) => {
      callbacks.onError?.(classifyError(event.error), event.message || event.error);
    };

    inst.onend = () => {
      running = false;
      clearTimer();
      callbacks.onEnd?.();
    };

    return inst;
  };

  const start = () => {
    if (disposed || running) return;
    try {
      recognition = buildInstance();
      running = true;
      recognition.start();
      // 超时保护：到点强制停止
      clearTimer();
      timer = setTimeout(() => stop(), timeoutMs);
    } catch (err) {
      running = false;
      const message = err instanceof Error ? err.message : "识别启动失败";
      callbacks.onError?.("unknown", message);
    }
  };

  const stop = () => {
    clearTimer();
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // 忽略停止异常
    }
  };

  const dispose = () => {
    disposed = true;
    clearTimer();
    if (recognition) {
      try {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      } catch {
        // 忽略释放异常
      }
      recognition = null;
    }
  };

  return { start, stop, dispose };
}
