"use client";

import { useEffect, useRef, useState } from "react";

interface TypewriterProps {
  /** 要逐字显示的文本 */
  text: string;
  /** 每字间隔(ms) */
  speed?: number;
  className?: string;
  /** 打字完成回调 */
  onDone?: () => void;
}

/**
 * 打字机文本：逐字显示并带闪烁光标。
 * text 变化时自动从头开始；卸载/切换时清理定时器避免泄漏。
 */
export function Typewriter({
  text,
  speed = 40,
  className = "",
  onDone,
}: TypewriterProps) {
  const safeText = text ?? "";
  const [count, setCount] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setCount(0);
    if (!safeText) {
      onDoneRef.current?.();
      return;
    }
    let i = 0;
    const step = Math.max(10, speed);
    const timer = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= safeText.length) {
        clearInterval(timer);
        onDoneRef.current?.();
      }
    }, step);
    return () => clearInterval(timer);
  }, [safeText, speed]);

  const done = count >= safeText.length;

  return (
    <span className={className}>
      {safeText.slice(0, count)}
      {!done && <span className="pixel-caret">▌</span>}
    </span>
  );
}
