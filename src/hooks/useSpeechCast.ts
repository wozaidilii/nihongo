"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createRecognizer,
  isSpeechRecognitionSupported,
  type CastErrorKind,
  type Recognizer,
} from "~/lib/speechRecognition";
import { scoreSkillCast } from "~/lib/match";

/** 咏唱比对目标：咒文原文 + 假名读音 */
export interface CastTarget {
  incantation: string;
  reading: string;
}

/** 施法阶段状态机 */
export type CastPhase = "idle" | "listening" | "scored";

export interface CastResult {
  /** 识别到的最终文本 */
  heard: string;
  /** 0~100 准确度 */
  accuracy: number;
  /** 是否念出有效咒文(准确度 > 0) */
  success: boolean;
}

export interface UseSpeechCastReturn {
  /** 浏览器是否支持语音识别 */
  supported: boolean;
  /** 是否进入降级模式(不支持/拒权) */
  fallback: boolean;
  phase: CastPhase;
  /** 实时识别文本 */
  interim: string;
  /** 最近一次评分结果 */
  result: CastResult | null;
  /** 错误提示(人类可读) */
  errorMessage: string | null;
  /** 开始监听咒文 */
  start: (target: CastTarget) => void;
  /** 主动停止监听 */
  stop: () => void;
  /** 用文本(降级输入)直接评分 */
  submitText: (text: string, target: CastTarget) => CastResult;
  /** 重置回 idle */
  reset: () => void;
}

/** 把错误类别转成中文提示 */
function errorText(kind: CastErrorKind): string {
  switch (kind) {
    case "unsupported":
      return "当前浏览器不支持语音识别，已切换为手动输入。";
    case "not-allowed":
      return "麦克风权限被拒绝，已切换为手动输入。";
    case "no-speech":
      return "没有听清，请再念一次咒文！";
    case "audio-capture":
      return "找不到麦克风设备，已切换为手动输入。";
    case "network":
      return "网络异常，语音识别暂不可用，请手动输入。";
    case "aborted":
      return "咏唱被中断了。";
    default:
      return "语音识别出错，请重试或手动输入。";
  }
}

/**
 * 语音施法 Hook。
 * 串联语音识别 + 相似度评分，并在不支持/拒权时自动进入降级输入模式。
 */
export function useSpeechCast(): UseSpeechCastReturn {
  const [supported, setSupported] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [phase, setPhase] = useState<CastPhase>("idle");
  const [interim, setInterim] = useState("");
  const [result, setResult] = useState<CastResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognizerRef = useRef<Recognizer | null>(null);
  const targetRef = useRef<CastTarget>({ incantation: "", reading: "" });
  const scoredRef = useRef<boolean>(false);

  // 仅在客户端检测支持性，避免 SSR 不一致
  useEffect(() => {
    const ok = isSpeechRecognitionSupported();
    setSupported(ok);
    if (!ok) setFallback(true);
  }, []);

  // 卸载时释放识别器
  useEffect(() => {
    return () => {
      recognizerRef.current?.dispose();
      recognizerRef.current = null;
    };
  }, []);

  const finalizeScore = useCallback((heard: string): CastResult => {
    const { incantation, reading } = targetRef.current;
    const accuracy = scoreSkillCast(heard, incantation, reading);
    const res: CastResult = {
      heard,
      accuracy,
      success: accuracy > 0,
    };
    setResult(res);
    setPhase("scored");
    return res;
  }, []);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
  }, []);

  const start = useCallback(
    (target: CastTarget) => {
      targetRef.current = {
        incantation: target?.incantation ?? "",
        reading: target?.reading ?? "",
      };
      scoredRef.current = false;
      setInterim("");
      setResult(null);
      setErrorMessage(null);

      const recognizer = createRecognizer({
        onInterim: (text) => setInterim(text),
        onFinal: (text) => {
          scoredRef.current = true;
          finalizeScore(text);
        },
        onError: (kind, message) => {
          // 不支持/拒权/无设备 → 进入降级；其余仅提示
          if (
            kind === "unsupported" ||
            kind === "not-allowed" ||
            kind === "audio-capture" ||
            kind === "network"
          ) {
            setFallback(true);
          }
          setErrorMessage(errorText(kind) || message);
        },
        onEnd: () => {
          // 结束时若没有任何最终结果，用中间结果兜底评分
          setPhase((prev) => {
            if (scoredRef.current) return prev;
            setInterim((cur) => {
              if (cur) finalizeScore(cur);
              return cur;
            });
            return scoredRef.current ? "scored" : "idle";
          });
        },
      });

      if (!recognizer) {
        setFallback(true);
        setPhase("idle");
        return;
      }

      recognizerRef.current?.dispose();
      recognizerRef.current = recognizer;
      setPhase("listening");
      recognizer.start();
    },
    [finalizeScore],
  );

  const submitText = useCallback(
    (text: string, target: CastTarget): CastResult => {
      targetRef.current = {
        incantation: target?.incantation ?? "",
        reading: target?.reading ?? "",
      };
      const accuracy = scoreSkillCast(
        text,
        targetRef.current.incantation,
        targetRef.current.reading,
      );
      const res: CastResult = {
        heard: text,
        accuracy,
        success: accuracy > 0,
      };
      setResult(res);
      setPhase("scored");
      return res;
    },
    [],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setInterim("");
    setResult(null);
    setErrorMessage(null);
    scoredRef.current = false;
  }, []);

  return {
    supported,
    fallback,
    phase,
    interim,
    result,
    errorMessage,
    start,
    stop,
    submitText,
    reset,
  };
}
