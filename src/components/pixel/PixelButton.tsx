"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "danger" | "gold";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  default: "",
  danger: "pixel-btn-danger",
  gold: "pixel-btn-gold",
};

/** 像素风按钮：硬阴影 + 按压位移 */
export function PixelButton({
  variant = "default",
  className = "",
  children,
  ...rest
}: PixelButtonProps) {
  return (
    <button
      className={`pixel-btn font-pixel px-4 py-3 text-xs leading-relaxed tracking-wide ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
