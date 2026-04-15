// src/components/ui/Input.jsx
import { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { label, error, hint, icon, className = "", containerClass = "", ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1 ${containerClass}`}>
      {label && (
        <label className="text-[0.72rem] font-semibold text-[#a1a9cc] uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7294] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={[
            "w-full px-3 py-2 bg-[#0f1220] border border-white/[0.08] rounded-lg text-[#f1f3f9] text-[0.85rem] outline-none transition-all duration-150 placeholder:text-[#6b7294]",
            "focus:border-[#5c62ec] focus:shadow-[0_0_0_3px_rgba(92,98,236,0.15)]",
            error
              ? "border-[#f43f5e] focus:border-[#f43f5e] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]"
              : "",
            icon ? "pl-9" : "",
            className,
          ].join(" ")}
          {...props}
        />
      </div>
      {error && <p className="text-[0.72rem] text-[#f43f5e]">{error}</p>}
      {hint && !error && (
        <p className="text-[0.72rem] text-[#6b7294]">{hint}</p>
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
    <div className={`flex flex-col gap-1 ${containerClass}`}>
      {label && (
        <label className="text-[0.72rem] font-semibold text-[#a1a9cc] uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={[
          "w-full px-3 py-2 bg-[#0f1220] border border-white/[0.08] rounded-lg text-[#f1f3f9] text-[0.85rem] outline-none transition-all duration-150 cursor-pointer appearance-none",
          "focus:border-[#5c62ec] focus:shadow-[0_0_0_3px_rgba(92,98,236,0.15)]",
          error ? "border-[#f43f5e]" : "",
          className,
        ].join(" ")}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7294' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "36px",
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[0.72rem] text-[#f43f5e]">{error}</p>}
      {hint && !error && (
        <p className="text-[0.72rem] text-[#6b7294]">{hint}</p>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = "", containerClass = "", ...props },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1 ${containerClass}`}>
      {label && (
        <label className="text-[0.72rem] font-semibold text-[#a1a9cc] uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={[
          "w-full px-3 py-2 bg-[#0f1220] border border-white/[0.08] rounded-lg text-[#f1f3f9] text-[0.85rem] outline-none transition-all duration-150 placeholder:text-[#6b7294] resize-y min-h-[80px]",
          "focus:border-[#5c62ec] focus:shadow-[0_0_0_3px_rgba(92,98,236,0.15)]",
          error ? "border-[#f43f5e]" : "",
          className,
        ].join(" ")}
        {...props}
      />
      {error && <p className="text-[0.72rem] text-[#f43f5e]">{error}</p>}
      {hint && !error && (
        <p className="text-[0.72rem] text-[#6b7294]">{hint}</p>
      )}
    </div>
  );
});

export default Input;
