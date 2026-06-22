"use client";

import { useEffect } from "react";
import { useGameStore } from "~/store/game";

/**
 * 在客户端挂载后水合存档，返回是否已就绪。
 * 页面据此避免 SSR/CSR 不一致导致的闪烁。
 */
export function useGameReady(): boolean {
  const hydrated = useGameStore((s) => s.hydrated);
  useEffect(() => {
    useGameStore.getState().hydrate();
  }, []);
  return hydrated;
}
