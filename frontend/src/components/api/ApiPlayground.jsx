import { useState } from "react";
import {
  Globe,
  Search,
  Layers,
  Braces,
  Star,
  Info,
  Zap,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  HTTP_METHODS,
  METHOD,
  AUTH_TYPES,
  card,
  inputStyle,
  labelStyle,
  C,
} from "./shared";
import { Btn, Badge, KVPairs, SectionTitle, TabBar } from "./Atoms";

export default function ApiPlayground({
  cfg,
  onUpdate,
  onFetch,
  loading,
  respErr,
  onRetry,
  useProxy,
  setUseProxy,
}) {
  const [cfgTab, setCfgTab] = useState("params");
  const mc = METHOD[cfg.method] || METHOD.GET;

  const paramCount = cfg.params.filter((p) => p.enabled && p.key).length;
  const headerCount = cfg.headers.filter((h) => h.enabled && h.key).length;

  return (
    <div className="flex flex-col animate-slide-up">
      <div style={card} className="rounded-xl overflow-hidden shadow-sm border border-border-default">
        {/* TOP SECTION: NAME & URL */}
        <div className="p-4 flex items-center justify-between border-b border-border-default bg-bg-surface/30">
           <input
            value={cfg.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Untitled Request"
            className="bg-transparent border-none outline-none text-[16px] font-black text-text-primary px-2 focus:ring-0 placeholder:text-text-primary/30 w-full"
          />
        </div>

        {/* UNIFIED URL BAR */}
        <div className="flex items-stretch bg-bg-raised border-b border-border-default">
          <select
            value={cfg.method}
            onChange={(e) => onUpdate({ method: e.target.value })}
            className="outline-none pl-6 pr-4 font-black text-[14px] cursor-pointer transition-colors bg-transparent border-r border-border-default"
            style={{
              color: mc.color,
            }}
          >
            {HTTP_METHODS.map((m) => (
              <option
                key={m}
                value={m}
                className="bg-bg-raised text-text-primary font-bold"
              >
                {m}
              </option>
            ))}
          </select>

          <input
            value={cfg.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            onKeyDown={(e) =>
              e.key === "Enter" && !loading && cfg.url.trim() && onFetch()
            }
            placeholder="https://api.example.com/v1/endpoint"
            className="flex-1 bg-transparent border-none outline-none px-5 py-3 font-mono text-[14px] text-text-primary placeholder:text-text-quaternary"
            autoComplete="off"
            spellCheck="false"
          />

          <button
            onClick={onFetch}
            disabled={!cfg.url.trim() || loading}
            className="flex items-center gap-2.5 px-8 bg-accent text-white font-black text-[14px] hover:bg-accent-hover transition-all disabled:opacity-30 rounded-none shrink-0"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Zap size={16} />
            )}
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {/* TAB NAVIGATION & ACTION BAR */}
        <div className="flex justify-between items-end flex-wrap gap-4 border-b border-border-default bg-bg-surface/20 px-6 pt-3">
          <TabBar
            tabs={[
              {
                id: "params",
                label: `Parameters${paramCount > 0 ? ` (${paramCount})` : ""}`,
              },
              { id: "body", label: "Body" },
              {
                id: "headers",
                label: `Headers${headerCount > 0 ? ` (${headerCount})` : ""}`,
              },
              { id: "auth", label: "Authorization" },
            ]}
            active={cfgTab}
            onChange={setCfgTab}
          />

          <div className="flex items-center gap-3 pb-2">
            <button
              onClick={() => setUseProxy(!useProxy)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                useProxy
                  ? "bg-emerald/10 text-emerald hover:bg-emerald/20"
                  : "bg-transparent text-text-quaternary hover:text-text-secondary hover:bg-bg-base/50"
              }`}
              title="Routes requests through our backend to bypass browser CORS restrictions"
            >
              <ShieldCheck size={14} />
              CORS Bypass
            </button>

            {onRetry && !loading && (
              <button
                onClick={onRetry}
                title="Retry last request"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-text-secondary hover:bg-accent/10 hover:text-accent transition-all"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            )}

            {cfg.body && cfgTab === "body" && (
              <button
                onClick={() => onUpdate({ body: "" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-quaternary hover:text-rose hover:bg-rose/10 transition-colors font-bold text-[12px]"
              >
                <RotateCcw size={13} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="min-h-[200px] p-6 bg-bg-base animate-fade-in">
          {cfgTab === "params" && (
            <KVPairs
              label="Parameter"
              pairs={cfg.params}
              onChange={(v) => onUpdate({ params: v })}
            />
          )}

          {cfgTab === "headers" && (
            <KVPairs
              label="Header"
              pairs={cfg.headers}
              onChange={(v) => onUpdate({ headers: v })}
            />
          )}

          {cfgTab === "body" && (
            <div className="flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <select
                    value={cfg.contentType}
                    onChange={(e) => onUpdate({ contentType: e.target.value })}
                    className="font-mono text-[12px] bg-bg-base border border-border-muted rounded-lg px-3 py-1.5 text-text-primary outline-none focus:border-accent"
                  >
                    {[
                      "application/json",
                      "application/x-www-form-urlencoded",
                      "text/plain",
                      "application/graphql",
                    ].map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                  {cfg.method === "GET" && (
                    <span className="text-[12px] text-amber/80 font-bold flex items-center gap-1">
                      <Info size={14} /> Body is typically ignored for GET
                      requests
                    </span>
                  )}
                </div>
              </div>
              <textarea
                rows={9}
                value={cfg.body}
                onChange={(e) => onUpdate({ body: e.target.value })}
                placeholder={'{\n  "key": "value"\n}'}
                className="w-full bg-bg-base/30 border border-border-muted rounded-xl p-4 font-mono text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 focus:bg-bg-base/60 transition-colors"
                style={{ resize: "vertical", lineHeight: 1.6 }}
              />
            </div>
          )}

          {cfgTab === "auth" && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-quaternary mb-3">
                  Auth Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {AUTH_TYPES.map((a) => (
                    <button
                      key={a}
                      onClick={() => onUpdate({ authType: a })}
                      className={[
                        "px-4 py-2 rounded-lg text-[13px] font-bold transition-all border",
                        cfg.authType === a
                          ? "border-accent text-white bg-accent/10 shadow-sm"
                          : "border-border-default text-text-tertiary hover:border-border-strong hover:bg-bg-surface",
                      ].join(" ")}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {cfg.authType === "None" && (
                <div className="flex items-center gap-3 p-4 bg-bg-surface rounded-xl border border-border-default text-[13px] text-text-secondary">
                  <Info size={16} className="text-text-tertiary" />
                  No authentication selected. Request will be sent as-is.
                </div>
              )}

              {cfg.authType === "API Key" && (
                <div className="grid grid-cols-2 gap-6 p-5 bg-bg-surface/50 border border-border-default rounded-xl">
                  <div>
                    <label style={labelStyle}>Header Name</label>
                    <input
                      value={cfg.authHeader}
                      onChange={(e) => onUpdate({ authHeader: e.target.value })}
                      style={inputStyle}
                      className="font-mono text-[13px]"
                      placeholder="X-API-Key"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>API Key Value</label>
                    <input
                      type="password"
                      value={cfg.authKey}
                      onChange={(e) => onUpdate({ authKey: e.target.value })}
                      style={inputStyle}
                      className="font-mono text-[13px]"
                      placeholder="sk-..."
                    />
                  </div>
                </div>
              )}

              {cfg.authType === "Bearer Token" && (
                <div className="p-5 bg-bg-surface/50 border border-border-default rounded-xl">
                  <label style={labelStyle}>Token</label>
                  <input
                    type="password"
                    value={cfg.authVal}
                    onChange={(e) => onUpdate({ authVal: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    style={inputStyle}
                    className="font-mono text-[13px]"
                  />
                </div>
              )}

              {cfg.authType === "Basic Auth" && (
                <div className="grid grid-cols-2 gap-6 p-5 bg-bg-surface/50 border border-border-default rounded-xl">
                  <div>
                    <label style={labelStyle}>Username</label>
                    <input
                      value={cfg.basicUser}
                      onChange={(e) => onUpdate({ basicUser: e.target.value })}
                      style={inputStyle}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <input
                      type="password"
                      value={cfg.basicPass}
                      onChange={(e) => onUpdate({ basicPass: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {respErr && (
          <div className="mt-2 mb-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex flex-col gap-1.5 animate-slide-up">
            <div className="text-[13px] font-black text-rose flex items-center gap-2">
              <Info size={14} /> Request Failed
            </div>
            <div className="text-[12px] text-rose/80 font-mono break-all leading-relaxed pl-5">
              {respErr}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
