// src/components/ui/Button.jsx
import { forwardRef } from "react";

const variants = {
  primary:
    "bg-transparent border border-[#444] text-white hover:border-[#666] hover:bg-white/5 active:border-accent disabled:opacity-40 disabled:cursor-not-allowed",
  secondary:
    "bg-transparent border border-[#333] text-text-secondary hover:border-[#555] hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed",
  danger:
    "bg-transparent border border-rose/30 text-rose hover:border-rose hover:bg-rose/5 disabled:opacity-40 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent border border-transparent hover:border-[#444] text-text-tertiary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed",
  outline:
    "bg-transparent border border-[#444] text-white hover:border-accent/60 hover:bg-accent/5 disabled:opacity-40 disabled:cursor-not-allowed",
  success:
    "bg-transparent border border-emerald/30 text-emerald hover:border-emerald hover:bg-emerald/5 disabled:opacity-40 disabled:cursor-not-allowed",
};

const sizes = {
  xs: "px-[8px] py-[4px] text-[11px] gap-[4px]",
  sm: "px-[10px] py-[6px] text-[12px] gap-[6px]",
  md: "px-[12px] py-[8px] text-[13px] gap-[6px]",
  lg: "px-[16px] py-[10px] text-[14px] gap-[8px]",
  icon: "p-[8px] w-9 h-9",
  "icon-sm": "p-[6px] w-8 h-8",
  "icon-lg": "p-[10px] w-11 h-11",
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    className = "",
    loading = false,
    icon,
    iconRight,
    as: Tag = "button",
    ...props
  },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={[
        "inline-flex items-center justify-center font-medium rounded-[6px] transition-all duration-150 cursor-pointer whitespace-nowrap select-none",
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        loading ? "opacity-60 cursor-progress" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <span
          className={`w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin ${children ? "mr-1.5" : ""}`}
        />
      ) : icon ? (
        <span className={`inline-flex shrink-0 ${children ? "" : ""}`}>
          {icon}
        </span>
      ) : null}
      {children}
      {!loading && iconRight ? (
        <span className="inline-flex shrink-0">{iconRight}</span>
      ) : null}
    </Tag>
  );
});

export default Button;
