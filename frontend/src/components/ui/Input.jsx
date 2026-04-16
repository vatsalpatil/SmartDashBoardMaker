// src/components/ui/Input.jsx
import { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { label, error, hint, icon, className = "", containerClass = "", ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClass}`}>
      {label && (
        <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest pl-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-quaternary pointer-events-none transition-colors">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={[
            "w-full px-4 py-2.5 bg-bg-raised border border-border-default rounded-xl text-text-primary text-[14px] outline-none transition-all duration-200 placeholder:text-text-quaternary shadow-sm",
            "focus:border-accent focus:bg-bg-surface focus:shadow-[0_0_0_1px_var(--color-accent)]",
            error
              ? "border-rose focus:border-rose focus:shadow-[0_0_0_1px_var(--color-rose)]"
              : "",
            icon ? "pl-11" : "",
            className,
          ].join(" ")}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] font-medium text-rose pl-1 mt-0.5">{error}</p>}
      {hint && !error && (
        <p className="text-[11px] text-text-quaternary pl-1 mt-0.5">{hint}</p>
      )}
    </div>
  );
});

export const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    className = "",
    containerClass = "",
    children,
    ...props
  },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClass}`}>
      {label && (
        <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest pl-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={[
          "w-full px-4 py-2.5 bg-bg-raised border border-border-default rounded-xl text-text-primary text-[14px] outline-none transition-all duration-200 cursor-pointer appearance-none shadow-sm",
          "focus:border-accent focus:bg-bg-surface focus:shadow-[0_0_0_1px_var(--color-accent)]",
          error ? "border-rose" : "",
          className,
        ].join(" ")}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 14px center",
          paddingRight: "40px",
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[11px] font-medium text-rose pl-1 mt-0.5">{error}</p>}
      {hint && !error && (
        <p className="text-[11px] text-text-quaternary pl-1 mt-0.5">{hint}</p>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = "", containerClass = "", ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClass}`}>
      {label && (
        <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest pl-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={[
          "w-full px-4 py-2.5 bg-bg-raised border border-border-default rounded-xl text-text-primary text-[14px] outline-none transition-all duration-200 placeholder:text-text-quaternary resize-y min-h-[100px] shadow-sm",
          "focus:border-accent focus:bg-bg-surface focus:shadow-[0_0_0_1px_var(--color-accent)]",
          error ? "border-rose" : "",
          className,
        ].join(" ")}
        {...props}
      />
      {error && <p className="text-[11px] font-medium text-rose pl-1 mt-0.5">{error}</p>}
      {hint && !error && (
        <p className="text-[11px] text-text-quaternary pl-1 mt-0.5">{hint}</p>
      )}
    </div>
  );
});

export default Input;
