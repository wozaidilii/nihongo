import type { HTMLAttributes } from "react";

interface PixelPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** dialog: 深色对话框样式；panel: 蓝色面板 */
  tone?: "panel" | "dialog";
}

/** 像素风容器面板 */
export function PixelPanel({
  tone = "panel",
  className = "",
  children,
  ...rest
}: PixelPanelProps) {
  const base = tone === "dialog" ? "pixel-dialog" : "pixel-panel";
  return (
    <div className={`${base} p-4 sm:p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}
