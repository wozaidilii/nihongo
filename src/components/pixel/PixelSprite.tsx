interface PixelSpriteProps {
  /** emoji 占位或单字符；后续可替换为 <img> 像素图 */
  glyph: string;
  /** 尺寸(像素) */
  size?: number;
  /** 是否待机浮动 */
  bob?: boolean;
  className?: string;
  /** 无障碍标签 */
  label?: string;
}

/**
 * 像素精灵：当前用 emoji 占位，统一加 pixelated 渲染。
 * 替换为 PNG 时只需把内部内容换成 <img className="pixelated">。
 */
export function PixelSprite({
  glyph,
  size = 64,
  bob = false,
  className = "",
  label,
}: PixelSpriteProps) {
  return (
    <span
      role="img"
      aria-label={label ?? "sprite"}
      className={`inline-block select-none ${bob ? "anim-bob" : ""} ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      {glyph}
    </span>
  );
}
