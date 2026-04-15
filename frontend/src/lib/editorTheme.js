import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// A premium VS-Code inspired dark theme that matches our "Future-Forward" design
export const editorTheme = EditorView.theme({
  "&": {
    color: "var(--color-text-primary)",
    backgroundColor: "transparent",
    fontSize: "13px",
  },
  ".cm-content": {
    caretColor: "var(--color-accent)",
    fontFamily: "var(--font-family-mono)",
    padding: "12px 0",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--color-accent)",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "rgba(59, 130, 246, 0.25) !important",
    borderRadius: "2px",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--color-text-quaternary)",
    border: "none",
    paddingRight: "15px",
    userSelect: "none",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    color: "var(--color-text-secondary)",
    fontWeight: "bold",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "var(--color-bg-surface)",
    border: "none",
    color: "var(--color-text-tertiary)",
    padding: "0 4px",
    margin: "0 2px",
    borderRadius: "4px",
  },
  ".cm-tooltip": {
    border: "1px solid var(--color-border-default)",
    backgroundColor: "var(--color-bg-overlay)",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
    backdropFilter: "blur(12px)",
    overflow: "hidden",
  },
  ".cm-tooltip-autocomplete > ul > li": {
    padding: "6px 12px !important",
    fontSize: "12px",
  },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--color-accent) !important",
    color: "white !important",
  },
}, { dark: true });

export const highlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#9333ea", fontWeight: "bold" }, // Purple
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: "var(--color-text-primary)" },
  { tag: [t.function(t.variableName), t.labelName], color: "#3b82f6" }, // Blue
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: "#f59e0b" }, // Amber
  { tag: [t.definition(t.name), t.separator], color: "var(--color-text-secondary)" },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: "#f43f5e" }, // Rose
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: "#a855f7" }, // Purple/Violet
  { tag: [t.meta, t.comment], color: "var(--color-text-quaternary)", fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "var(--color-text-tertiary)", textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: "var(--color-accent)" },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#f97316" }, // Orange
  { tag: [t.processingInstruction, t.string, t.inserted], color: "#10b981" }, // Emerald
  { tag: t.invalid, color: "#f43f5e" },
]);

export const syntaxExtension = syntaxHighlighting(highlightStyle);
