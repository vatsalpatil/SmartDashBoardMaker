// src/components/ui/Badge.jsx
const variants = {
  accent: "bg-transparent border border-[#444] text-white hover:border-[#666]",
  info: "bg-transparent border border-[#444] text-text-secondary",
  success: "bg-transparent border border-emerald/40 text-emerald",
  warning: "bg-transparent border border-amber/40 text-amber",
  danger: "bg-transparent border border-rose/40 text-rose",
  muted: "bg-transparent border border-[#333] text-text-tertiary",
  purple: "bg-transparent border border-violet/40 text-violet",
  outline: "bg-transparent border border-[#444] text-text-tertiary",
};

export function Badge({
  children,
  variant = "accent",
  className = "",
  dot = false,
}) {
  return (
    <span
      className={[
        // Layout & shape
        "inline-flex items-center gap-[6px]",
        // Sizing
        "px-[10px] py-[4px]",
        // Typography
        "text-[11px] font-semibold leading-none whitespace-nowrap",
        // Shape
        "rounded-[6px]",
        variants[variant] ?? variants.accent,
        className,
      ].join(" ")}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
}

export default Badge;
