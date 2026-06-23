"use client";

import type { ReactNode } from "react";

type PageShellWidth = "md" | "lg";

interface PageShellProps {
  children: ReactNode;
  /** 是否垂直居中（标题页） */
  centered?: boolean;
  className?: string;
  width?: PageShellWidth;
}

const WIDTH_CLASS: Record<PageShellWidth, string> = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

/** 全站页面壳：安全区 + 顶栏避让 + 动态视口高度 */
export function PageShell({
  children,
  centered = false,
  className = "",
  width = "md",
}: PageShellProps) {
  return (
    <main
      className={[
        "page-shell mx-auto flex w-full min-h-[100dvh] flex-col",
        WIDTH_CLASS[width],
        centered ? "page-shell--center items-center justify-center" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </main>
  );
}
