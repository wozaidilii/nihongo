"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createRecognizer,
  isSpeechRecognitionSupported,
  type CastErrorKind,
  type Recognizer,
} from "~/lib/speechRecognition";
import { scoreSkillCastDetailed, matchPathLabel } from "~/lib/match";

/** 咏唱比对目标：咒文原文 + 假名读音 + 可选关卡（第一关宽容评分） */
export interface CastTarget {
  incantation: string;
  reading: string;
  stageId?: string;
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
  /** 评分匹配路径（UI 提示用） */
  matchPath?: string;
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
  const phaseRef = useRef<CastPhase>("idle");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // 仅在客户端检测支持性，避免 SSR 不一致
  useEffect(() => {
    const ok = isSpeechRecognitionSupported();
    setSupported(ok);
    if (!ok) setFallback(true);
  }, []);

  const finalizeScore = useCallback((heard: string): CastResult => {
    const { incantation, reading, stageId } = targetRef.current;
    const detail = scoreSkillCastDetailed(heard, incantation, reading, { stageId });
    const res: CastResult = {
      heard,
      accuracy: detail.accuracy,
      success: detail.accuracy > 0,
      matchPath: matchPathLabel(detail.matchPath),
    };
    setResult(res);
    setPhase("scored");
    return res;
  }, []);

  /** 懒创建并复用识别器，避免移动端反复 new/abort */
  const ensureRecognizer = useCallback((): Recognizer | null => {
    if (recognizerRef.current) return recognizerRef.current;

    const recognizer = createRecognizer({
      onInterim: (text) => setInterim(text),
      onFinal: (text) => {
        scoredRef.current = true;
        finalizeScore(text);
      },
      onError: (kind, message) => {
        if (
          kind === "unsupported" ||
          kind === "not-allowed" ||
          kind === "audio-capture" ||
          kind === "network"
        ) {
          setFallback(true);
        }
        // aborted 已在底层过滤主动 stop；其余才提示用户
        if (kind !== "aborted") {
          setErrorMessage(errorText(kind) || message);
        }
        if (phaseRef.current === "listening") {
          setPhase("idle");
        }
      },
      onEnd: () => {
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

    recognizerRef.current = recognizer;
    return recognizer;
  }, [finalizeScore]);

  // 卸载时释放识别器
  useEffect(() => {
    return () => {
      recognizerRef.current?.dispose();
      recognizerRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
    if (phaseRef.current === "listening") {
      setPhase("idle");
    }
  }, []);

  const start = useCallback(
    (target: CastTarget) => {
      targetRef.current = {
        incantation: target?.incantation ?? "",
        reading: target?.reading ?? "",
        stageId: target?.stageId,
      };
      scoredRef.current = false;
      setInterim("");
      setResult(null);
      setErrorMessage(null);

      const recognizer = ensureRecognizer();
      if (!recognizer) {
        setFallback(true);
        setPhase("idle");
        return;
      }

      setPhase("listening");
      recognizer.start();
    },
    [ensureRecognizer],
  );

  const submitText = useCallback(
    (text: string, target: CastTarget): CastResult => {
      targetRef.current = {
        incantation: target?.incantation ?? "",
        reading: target?.reading ?? "",
        stageId: target?.stageId,
      };
      const detail = scoreSkillCastDetailed(
        text,
        targetRef.current.incantation,
        targetRef.current.reading,
        { stageId: targetRef.current.stageId },
      );
      const res: CastResult = {
        heard: text,
        accuracy: detail.accuracy,
        success: detail.accuracy > 0,
        matchPath: matchPathLabel(detail.matchPath),
      };
      setResult(res);
      setPhase("scored");
      return res;
    },
    [],
  );

  const reset = useCallback(() => {
    recognizerRef.current?.stop();
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
