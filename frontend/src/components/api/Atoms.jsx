import { Check, Plus, X } from "lucide-react";
import { C, TYPE_COLOR, subcard, inputStyle, labelStyle } from "./shared";

export function Badge({
  children,
  color = "var(--color-accent)",
  bg = "var(--color-accent-muted)",
  border = "var(--color-accent-muted)",
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: "0.65rem",
        fontWeight: 700,
        color,
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      {children}
    </span>
  );
}

export function TypePill({ type }) {
  const color = TYPE_COLOR[type] || "#4b5563";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: "0.65rem",
        fontWeight: 700,
        fontFamily: "var(--font-family-mono)",
        color,
        background: `${color}12`,
        border: `1px solid ${color}25`,
      }}
    >
      {type}
    </span>
  );
}

export function Chk({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 18,
        height: 18,
        borderRadius: 6,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: checked ? C.accent : "transparent",
        border: `2px solid ${checked ? C.accent : "var(--color-border-strong)"}`,
        transition: "all 0.15s",
        cursor: "pointer",
      }}
    >
      {checked && <Check size={11} color="#fff" />}
    </button>
  );
}

export function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
  size = "md",
  style: s = {},
  className = "",
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    transition: "all 0.2s",
    border: "none",
    fontFamily: "var(--font-family-sans)",
  };
  const variants = {
    primary: {
      border: "1px solid #444",
      background: "transparent",
      color: "#fff",
      borderRadius: 6,
      padding: "8px 16px",
      fontSize: "0.88rem",
    },
    ghost: {
      background: "transparent",
      color: "#aaa",
      border: "1px solid #333",
      borderRadius: 6,
      padding: "8px 16px",
      fontSize: "0.82rem",
    },
    danger: {
      background: "transparent",
      color: "var(--color-rose)",
      border: "1px solid var(--color-rose-muted)",
      borderRadius: 6,
      padding: "8px 16px",
      fontSize: "0.82rem",
    },
    success: {
      background: "transparent",
      color: "var(--color-emerald)",
      border: "1px solid var(--color-emerald-muted)",
      borderRadius: 6,
      padding: "8px 16px",
      fontSize: "0.82rem",
    },
  };
  if (size === "sm") {
    variants[variant].padding = "6px 14px";
    variants[variant].fontSize = "0.78rem";
  }
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...s }}
      className={className}
    >
      {children}
    </button>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "0 4px",
        background: "transparent",
        overflowX: "auto",
        marginBottom: "-1px",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 4px",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "var(--font-family-sans)",
            background: "transparent",
            color: active === t.id ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
            border: "none",
            borderBottom: active === t.id ? "2px solid var(--color-accent)" : "2px solid transparent",
            whiteSpace: "nowrap",
          }}
        >
          {t.icon && <t.icon size={14} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function KVPairs({ label, pairs, onChange }) {
  const add = () => onChange([...pairs, { key: "", value: "", enabled: true }]);
  const del = (i) => onChange(pairs.filter((_, j) => j !== i));
  const upd = (i, f, v) => {
    const n = [...pairs];
    n[i] = { ...n[i], [f]: v };
    onChange(n);
  };
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span style={labelStyle}>{label}s</span>
        <button
          onClick={add}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.75rem",
            color: C.accent,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          <Plus size={14} /> Add {label}
        </button>
      </div>
      {pairs.length === 0 && (
        <div
          style={{
            ...subcard,
            textAlign: "center",
            padding: "24px 0",
            color: C.muted,
            fontSize: "0.8rem",
            fontStyle: "italic",
          }}
        >
          No {label.toLowerCase()}s added yet
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pairs.map((p, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <Chk
              checked={p.enabled}
              onChange={() => upd(i, "enabled", !p.enabled)}
            />
            <input
              value={p.key}
              onChange={(e) => upd(i, "key", e.target.value)}
              placeholder="Key"
              style={{
                ...inputStyle,
                flex: 1,
                minWidth: 0,
                fontSize: "0.82rem",
                fontFamily: "var(--font-family-mono)",
              }}
            />
            <input
              value={p.value}
              onChange={(e) => upd(i, "value", e.target.value)}
              placeholder="Value"
              style={{
                ...inputStyle,
                flex: 1,
                minWidth: 0,
                fontSize: "0.82rem",
                fontFamily: "var(--font-family-mono)",
              }}
            />
            <button
              onClick={() => del(i)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-quaternary)",
                padding: 4,
                display: "flex",
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SectionTitle({
  icon: Icon,
  iconColor = "var(--color-accent)",
  iconBg = "var(--color-accent-muted)",
  title,
  sub,
  badge,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: iconBg,
          border: `1px solid ${iconColor}25`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3
            style={{
              fontFamily: "var(--font-family-heading)",
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h3>
          {badge && <Badge>{badge}</Badge>}
        </div>
        {sub && (
          <p
            style={{
              fontSize: "0.82rem",
              color: C.muted,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
