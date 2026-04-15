// src/components/api/shared.js
// ─── Shared constants, helpers, and style tokens ───

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const METHOD = {
  GET:    { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.30)" },
  POST:   { color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.30)" },
  PUT:    { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.30)" },
  PATCH:  { color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.30)" },
  DELETE: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)",   border: "rgba(244,63,94,0.30)" },
};

export const TYPE_COLOR = {
  string:  "#60a5fa",
  integer: "#a78bfa",
  float:   "#a78bfa",
  number:  "#a78bfa",
  boolean: "#fbbf24",
  date:    "#2dd4bf",
  null:    "#4b5563",
  array:   "#f87171",
  object:  "#818cf8",
};

export const AUTH_TYPES = ["None", "API Key", "Bearer Token", "Basic Auth"];

export const EXAMPLES = [
  { name: "JSONPlaceholder Posts",  url: "https://jsonplaceholder.typicode.com/posts",  method: "GET" },
  { name: "JSONPlaceholder Users",  url: "https://jsonplaceholder.typicode.com/users",  method: "GET" },
  { name: "Open Meteo Weather",     url: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true", method: "GET" },
  { name: "REST Countries",         url: "https://restcountries.com/v3.1/all?fields=name,capital,population,region", method: "GET" },
];

export const ROWS_PER_PAGE = 15;

/* ─── palette ─── */
export const C = {
  pageBg:     "var(--color-bg-base)",
  cardBg:     "var(--color-bg-raised)",
  cardBorder: "var(--color-border-default)",
  subBg:      "var(--color-bg-surface)",
  inputBg:    "var(--color-bg-base)",
  inputBord:  "var(--color-border-muted)",
  accent:     "var(--color-accent)",
  accentHov:  "var(--color-accent-hover)",
  accentBg:   "var(--color-accent-muted)",
  accentBord: "rgba(59,130,246,0.20)",
  muted:      "var(--color-text-tertiary)",
  secondary:  "var(--color-text-secondary)",
  text:       "var(--color-text-primary)",
  divider:    "var(--color-border-muted)",
};

/* ─── style objects ─── */
export const card = {
  background:   C.cardBg,
  border:       `1px solid ${C.cardBorder}`,
  borderRadius: 20,
  boxShadow:    "0 4px 32px rgba(0,0,0,0.3)",
};
export const subcard = {
  background:   C.subBg,
  border:       `1px solid ${C.divider}`,
  borderRadius: 12,
};
export const inputStyle = {
  background:  C.inputBg,
  border:      `1px solid ${C.inputBord}`,
  borderRadius: 10,
  color:       C.text,
  outline:     "none",
  width:       "100%",
  padding:     "10px 14px",
  fontSize:    "0.86rem",
  fontFamily:  "var(--font-family-sans)",
  transition:  "border-color 0.15s ease",
};
export const labelStyle = {
  display:       "block",
  fontSize:      "0.68rem",
  fontWeight:    700,
  color:         C.muted,
  textTransform: "uppercase",
  letterSpacing: "0.10em",
  marginBottom:  8,
};
export const monoStyle = { fontFamily: "var(--font-family-mono)" };

/* ─── Helper functions ─── */
export function flatObj(obj, pre = "", out = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = pre ? `${pre}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v))
      flatObj(v, key, out);
    else out[key] = Array.isArray(v) ? `[Array(${v.length})]` : v;
  }
  return out;
}

export function inferType(v) {
  if (v == null) return "null";
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "float";
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return "date";
    if (v.trim() !== "" && !isNaN(Number(v))) return "number";
    return "string";
  }
  return Array.isArray(v) ? "array" : "object";
}

export function extractRows(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const v of Object.values(data))
      if (Array.isArray(v) && v.length > 0) return v;
  }
  return [data];
}

export function extractByPath(data, path) {
  if (!path || path === "." || path === "" || path === "$") return data;
  let cleanPath = path.startsWith("$.") ? path.slice(2) : path;
  if (cleanPath.startsWith("$[")) cleanPath = cleanPath.slice(1);
  const parts = cleanPath.split(/[.\[\]]+/).filter(Boolean);
  let cur = data;
  for (const p of parts) {
    if (cur == null) return null;
    cur = cur[p];
  }
  return cur;
}

export function findAllArrays(obj, path = "$", results = [], depth = 0) {
  if (depth > 5 || obj == null) return results; // Prevent infinite loops
  
  if (Array.isArray(obj)) {
    // Exclude arrays of primitives if they are very small, but for now include all arrays.
    results.push({ path, count: obj.length });
    
    // Check first element for nested arrays
    if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
       for (const [k, v] of Object.entries(obj[0])) {
         findAllArrays(v, `${path}[*].${k}`, results, depth + 1);
       }
    }
  } else if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const newPath = path === "$" ? k : `${path}.${k}`;
      findAllArrays(v, newPath, results, depth + 1);
    }
  }
  return results;
}

export function buildSchema(rows) {
  const m = {};
  for (const row of rows.slice(0, 20)) {
    const flat = flatObj(row);
    for (const [k, v] of Object.entries(flat)) {
      if (!m[k]) m[k] = { type: inferType(v), nulls: 0, sample: v };
      if (v == null) m[k].nulls++;
    }
  }
  return m;
}

export function applyTransforms(rows, cols, filters, sort, filterLogic = "AND") {
  let out = rows.map((row) => {
    const flat = flatObj(row);
    const r = {};
    for (const c of cols.filter((c) => c.selected))
      r[c.alias || c.label] = flat[c.originalKey] ?? null;
    return r;
  });
  
  const activeFilters = filters.filter((f) => f.active && f.column && f.value !== "");
  if (activeFilters.length > 0) {
    const isOr = filterLogic === "OR";
    out = out.filter((row) => {
      let isMatch = !isOr; // if AND, default true until fail; if OR, default false until match
      for (const f of activeFilters) {
        const cell = String(row[f.column] ?? "").toLowerCase();
        const val = f.value.toLowerCase();
        let pass = false;

        if (f.op === "contains")          pass = cell.includes(val);
        else if (f.op === "equals")       pass = cell === val;
        else if (f.op === "starts_with")  pass = cell.startsWith(val);
        else if (f.op === "not_contains") pass = !cell.includes(val);
        else if (f.op === "gt")  pass = Number(row[f.column]) > Number(f.value);
        else if (f.op === "lt")  pass = Number(row[f.column]) < Number(f.value);
        else if (f.op === "gte") pass = Number(row[f.column]) >= Number(f.value);
        else if (f.op === "lte") pass = Number(row[f.column]) <= Number(f.value);
        else pass = true;

        if (isOr) {
          if (pass) { isMatch = true; break; }
        } else {
          if (!pass) { isMatch = false; break; }
        }
      }
      return isMatch;
    });
  }
  
  if (sort && sort.column) {
    out.sort((a, b) => {
      const [va, vb] = [a[sort.column], b[sort.column]];
      if (typeof va === "number" && typeof vb === "number")
        return sort.dir === "asc" ? va - vb : vb - va;
      const cmp = String(va ?? "").localeCompare(String(vb ?? ""));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }
  return out;
}
