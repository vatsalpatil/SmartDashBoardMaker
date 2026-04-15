import { useState, useEffect } from "react";
import {
  Palette,
  Check,
  Trash2,
  Plus,
  Sun,
  Moon,
  ChevronDown,
  Save,
  Eye,
  X,
  Copy,
  RotateCcw,
  Paintbrush,
} from "lucide-react";
import { useTheme, BUILT_IN_THEMES } from "../../lib/ThemeContext";
import { Modal, Button, Badge } from "../ui";
import { Input } from "../ui/Input";

// ── Color input row ────────────────────────────────────────
function ColorRow({ label, tokenKey, value, onChange }) {
  const isRgba = value?.startsWith("rgba");
  return (
    <div className="flex items-center gap-3 py-2 px-2 hover:bg-bg-base/50 rounded-lg transition-colors group">
      <div className="relative group/swatch">
        <div
          className="w-6 h-6 rounded-md border border-border-strong shrink-0 cursor-pointer shadow-sm hover:scale-110 transition-transform"
          style={{ background: value }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "color";
            input.value = isRgba ? "#3B82F6" : value;
            input.addEventListener("input", (e) =>
              onChange(tokenKey, e.target.value),
            );
            input.click();
          }}
        />
        <div className="absolute inset-0 rounded-md pointer-events-none ring-1 ring-inset ring-black/5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-text-secondary truncate group-hover:text-text-primary transition-colors">
          {label}
        </div>
        <div className="text-[9px] text-text-quaternary font-mono uppercase">
          {tokenKey}
        </div>
      </div>

      <input
        className="w-[90px] h-7 px-2 bg-bg-base border border-border-default rounded-md text-[10px] font-mono text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-right"
        value={value || ""}
        onChange={(e) => onChange(tokenKey, e.target.value)}
      />
    </div>
  );
}

// ── Theme card in the selector ─────────────────────────────
function ThemeCard({ theme, isActive, onSelect, onDelete }) {
  const colors = theme.colors;
  const isDark = theme.category === "dark";
  const swatchKeys = ["bg-base", "bg-raised", "accent", "emerald", "violet"];

  return (
    <div
      onClick={onSelect}
      className={[
        "relative group py-6 px-4 rounded-2xl border cursor-pointer transition-all duration-500 flex flex-col items-center justify-center text-center overflow-hidden",
        isActive
          ? "border-orange-500 bg-orange-500/5 shadow-[0_0_25px_-5px_rgba(249,115,22,0.15)]"
          : "border-border-default bg-bg-surface hover:border-border-strong hover:shadow-lg hover:-translate-y-0.5 pt-20.5",
      ].join(" ")}
    >
      {/* Dynamic Background Glow for Active State */}
      {isActive && (
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity"
          style={{
            background: `radial-gradient(circle at center, ${colors.accent}, transparent)`,
          }}
        />
      )}

      {isActive && (
        <div className="absolute top-4 right-4 text-orange-500 animate-scale-in drop-shadow-sm">
          <Check size={16} strokeWidth={3} />
        </div>
      )}

      {/* Horizontal Swatch Layout for all themes */}
      <div className="flex justify-center gap-2">
        {swatchKeys.map((key, i) => (
          <div
            key={i}
            className={[
              "w-5 h-5 border border-black/10 shadow-sm",
              isDark ? "rounded-full" : "rounded-md",
            ].join(" ")}
            style={{ background: colors[key] }}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="font-bold text-[14px] text-text-primary text-center">
          {theme.name}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          {isDark ? (
            <Moon size={11} className="text-orange-500" />
          ) : (
            <Sun size={11} className="text-text-tertiary" />
          )}
          <span
            className={[
              "text-[10px] font-bold uppercase tracking-wider",
              isDark ? "text-orange-500" : "text-text-secondary",
            ].join(" ")}
          >
            {theme.category}
          </span>
        </div>
      </div>

      {!theme.builtIn && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-quaternary hover:text-rose hover:bg-rose-muted transition-all"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function ThemePanel({ open, onClose }) {
  const {
    activeTheme,
    activeThemeId,
    allThemes,
    setTheme,
    saveCustomTheme,
    deleteCustomTheme,
    previewTheme,
    cancelPreview,
  } = useTheme();
  const [mode, setMode] = useState("select"); // 'select' | 'builder'
  const [builderName, setBuilderName] = useState("");
  const [builderCategory, setBuilderCategory] = useState("dark");
  const [builderColors, setBuilderColors] = useState({});
  const [baseThemeId, setBaseThemeId] = useState("midnight");

  // Initialize builder from a base theme
  const initBuilder = (themeId) => {
    const base = allThemes[themeId] || BUILT_IN_THEMES.midnight;
    setBaseThemeId(themeId);
    setBuilderName(`My ${base.name}`);
    setBuilderCategory(base.category);
    setBuilderColors({ ...base.colors });
    setMode("builder");
  };

  // Start editing an existing custom theme
  const editTheme = (theme) => {
    setBaseThemeId(theme.id);
    setBuilderName(theme.name);
    setBuilderCategory(theme.category);
    setBuilderColors({ ...theme.colors });
    setMode("builder");
  };

  const handleColorChange = (key, value) => {
    setBuilderColors((prev) => ({ ...prev, [key]: value }));
  };

  const handlePreview = () => {
    previewTheme({ colors: builderColors, category: builderCategory });
  };

  const handleSave = () => {
    if (!builderName.trim()) return;
    const id = !BUILT_IN_THEMES[baseThemeId]
      ? baseThemeId
      : `custom_${Date.now()}`;
    saveCustomTheme({
      id,
      name: builderName,
      category: builderCategory,
      colors: builderColors,
    });
    setMode("select");
  };

  const handleCancel = () => {
    cancelPreview();
    setMode("select");
  };

  // Group themes
  const darkThemes = Object.values(allThemes).filter(
    (t) => t.category === "dark",
  );
  const lightThemes = Object.values(allThemes).filter(
    (t) => t.category === "light",
  );

  // Color token groups for builder
  const COLOR_GROUPS = [
    {
      label: "Backgrounds",
      tokens: [
        { key: "bg-base", label: "Base" },
        { key: "bg-surface", label: "Surface" },
        { key: "bg-raised", label: "Raised" },
        { key: "bg-overlay", label: "Overlay" },
        { key: "bg-muted", label: "Muted" },
        { key: "bg-subtle", label: "Subtle" },
      ],
    },
    {
      label: "Borders",
      tokens: [
        { key: "border-default", label: "Default" },
        { key: "border-muted", label: "Muted" },
        { key: "border-strong", label: "Strong" },
      ],
    },
    {
      label: "Text",
      tokens: [
        { key: "text-primary", label: "Primary" },
        { key: "text-secondary", label: "Secondary" },
        { key: "text-tertiary", label: "Tertiary" },
        { key: "text-quaternary", label: "Quaternary" },
      ],
    },
    {
      label: "Accent",
      tokens: [
        { key: "accent", label: "Accent" },
        { key: "accent-hover", label: "Hover" },
        { key: "accent-muted", label: "Muted BG" },
        { key: "accent-text", label: "Light Text" },
      ],
    },
    {
      label: "Semantic",
      tokens: [
        { key: "emerald", label: "Success" },
        { key: "emerald-muted", label: "Success BG" },
        { key: "rose", label: "Danger" },
        { key: "rose-muted", label: "Danger BG" },
        { key: "violet", label: "Violet" },
        { key: "violet-muted", label: "Violet BG" },
        { key: "amber", label: "Warning" },
        { key: "amber-muted", label: "Warning BG" },
      ],
    },
  ];

  return (
    <Modal
      open={open}
      onClose={() => {
        cancelPreview();
        onClose();
      }}
      title={mode === "builder" ? "Theme Builder" : "Appearance"}
      size="lg"
      className="!max-w-[580px]"
    >
      {mode === "select" ? (
        <div className="flex flex-col gap-6">
          {/* Create new */}
          <button
            onClick={() => initBuilder(activeThemeId)}
            className="flex items-center justify-center gap-2.5 w-full p-3 rounded-2xl border border-dashed border-orange-500/30 text-orange-500 text-[14px] font-bold hover:bg-orange-500/5 hover:border-orange-500/50 transition-all hover:scale-[1.01] active:scale-[0.99] group"
          >
            <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <Plus size={16} strokeWidth={3} />
            </div>
            Create Custom Theme
          </button>

          {/* Dark themes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-tertiary">
              <Moon size={12} />
              <h4 className="text-[11px] font-bold uppercase tracking-widest">
                Dark Themes
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {darkThemes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isActive={activeThemeId === t.id}
                  onSelect={() => setTheme(t.id)}
                  onDelete={
                    !t.builtIn ? () => deleteCustomTheme(t.id) : undefined
                  }
                />
              ))}
            </div>
          </div>

          {/* Light themes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-text-tertiary">
              <Sun size={12} />
              <h4 className="text-[11px] font-bold uppercase tracking-widest">
                Light Themes
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {lightThemes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isActive={activeThemeId === t.id}
                  onSelect={() => setTheme(t.id)}
                  onDelete={
                    !t.builtIn ? () => deleteCustomTheme(t.id) : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Builder Mode ──────────────────────────────── */
        <div className="flex flex-col gap-5">
          {/* Top Configuration */}
          <div className="bg-bg-base/30 p-4 rounded-xl border border-border-muted flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-text-quaternary uppercase mb-1.5 block">
                  Theme Name
                </label>
                <Input
                  value={builderName}
                  onChange={(e) => setBuilderName(e.target.value)}
                  placeholder="e.g., Midnight Purple..."
                  className="w-full h-9 text-[12px] bg-bg-base border-border-default"
                />
              </div>
              <div className="w-[120px]">
                <label className="text-[10px] font-bold text-text-quaternary uppercase mb-1.5 block">
                  Type
                </label>
                <select
                  value={builderCategory}
                  onChange={(e) => setBuilderCategory(e.target.value)}
                  className="w-full h-9 px-3 text-[12px] bg-bg-base border border-border-default rounded-lg text-text-primary outline-none cursor-pointer hover:border-border-strong transition-colors"
                >
                  <option value="dark">Dark Theme</option>
                  <option value="light">Light Theme</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border-muted mt-1">
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-accent" />
                <span className="text-[11px] font-medium text-text-secondary">
                  Base Palette:
                </span>
                <select
                  value={baseThemeId}
                  onChange={(e) => {
                    const base = allThemes[e.target.value];
                    if (base) {
                      setBaseThemeId(e.target.value);
                      setBuilderColors({ ...base.colors });
                      setBuilderCategory(base.category);
                    }
                  }}
                  className="h-7 px-2 text-[11px] bg-transparent border-none text-accent font-bold outline-none cursor-pointer hover:underline"
                >
                  {Object.values(allThemes).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  const base =
                    allThemes[baseThemeId] || BUILT_IN_THEMES.midnight;
                  setBuilderColors({ ...base.colors });
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold text-text-quaternary hover:text-accent hover:bg-accent-muted/20 transition-all"
                title="Reset colors"
              >
                <RotateCcw size={12} />
                RESET
              </button>
            </div>
          </div>

          {/* Scrollable Color Grid */}
          <div className="max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 gap-6">
              {COLOR_GROUPS.map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1 sticky top-0 bg-bg-raised/95 backdrop-blur-sm z-20 mb-1 border-b border-border-muted/50">
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-tighter">
                      {group.label}
                    </span>
                    <div className="flex-1 h-[1px] bg-border-muted/30" />
                  </div>
                  <div className="grid grid-cols-1 gap-0.5">
                    {group.tokens.map((token) => (
                      <ColorRow
                        key={token.key}
                        label={token.label}
                        tokenKey={token.key}
                        value={builderColors[token.key] || ""}
                        onChange={handleColorChange}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border-muted">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-[12px] font-bold text-text-tertiary hover:bg-bg-muted transition-all flex items-center gap-2 border border-transparent hover:border-border-muted"
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={handlePreview}
              className="px-4 py-2 rounded-xl text-[12px] font-bold text-accent hover:bg-accent-muted/20 transition-all flex items-center gap-2 border border-accent/10 hover:border-accent/30"
            >
              <Eye size={14} /> Live Preview
            </button>
            <div className="flex-1" />
            <button
              onClick={handleSave}
              disabled={!builderName.trim()}
              className="px-6 py-2 rounded-xl text-[12px] font-bold bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:grayscale shadow-lg shadow-accent/20 transition-all flex items-center gap-2"
            >
              <Save size={14} /> Save Theme
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
