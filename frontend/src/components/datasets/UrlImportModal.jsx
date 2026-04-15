import { useState, useRef } from 'react';
import {
  X, Link2, Loader2, CheckCircle2, AlertCircle, FileText,
  Table2, RefreshCw, ArrowRight, Globe, FileSpreadsheet,
  Braces, File
} from 'lucide-react';
import { probeUrl, registerUrlDataset } from '../../lib/api';
import { useToast } from '../ui/Toast';

const FORMAT_ICONS = {
  csv: FileText,
  excel: FileSpreadsheet,
  parquet: File,
  json: Braces,
};

const FORMAT_COLORS = {
  csv: 'text-emerald',
  excel: 'text-violet',
  parquet: 'text-amber-400',
  json: 'text-accent',
};

export default function UrlImportModal({ onClose, onSuccess }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'probing' | 'preview' | 'registering' | 'done' | 'error'
  const [probeResult, setProbeResult] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();
  const inputRef = useRef(null);

  const handleProbe = async () => {
    if (!url.trim()) return;
    setStep('probing');
    setError('');
    try {
      const result = await probeUrl(url.trim());
      setProbeResult(result);
      // Auto-fill name from URL if empty
      if (!name) {
        const urlPath = new URL(url.trim()).pathname;
        const base = urlPath.split('/').pop()?.split('.')[0] || 'dataset';
        setName(base.replace(/[^a-zA-Z0-9_\s-]/g, '').trim() || 'My Dataset');
      }
      setStep('preview');
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to probe URL');
      setStep('error');
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) { setError('Please provide a dataset name'); return; }
    setStep('registering');
    try {
      const result = await registerUrlDataset(url.trim(), name.trim());
      toast.success(`"${name}" registered as dataset`);
      setStep('done');
      setTimeout(() => onSuccess?.(result), 800);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed');
      setStep('error');
    }
  };

  const reset = () => {
    setStep('input');
    setProbeResult(null);
    setError('');
  };

  const FormatIcon = probeResult ? (FORMAT_ICONS[probeResult.format] || File) : Globe;
  const formatColor = probeResult ? (FORMAT_COLORS[probeResult.format] || 'text-accent') : 'text-accent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[580px] bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-muted">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-muted flex items-center justify-center">
              <Globe size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-text-primary">Import from URL</h3>
              <p className="text-[12px] text-text-tertiary">CSV · Excel · Parquet · JSON</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-quaternary hover:text-text-secondary hover:bg-bg-muted transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">

          {/* URL Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Dataset URL</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-3 bg-bg-raised border border-border-default rounded-xl focus-within:border-accent transition-colors">
                <Link2 size={15} className="text-text-quaternary shrink-0" />
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && step === 'input' && handleProbe()}
                  placeholder="https://example.com/data.csv"
                  disabled={step !== 'input' && step !== 'error'}
                  className="flex-1 bg-transparent text-[13px] text-text-primary placeholder-text-quaternary outline-none font-mono"
                />
              </div>
              {(step === 'input' || step === 'error') && (
                <button
                  onClick={step === 'error' ? reset : handleProbe}
                  disabled={!url.trim()}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-accent text-white hover:opacity-90 disabled:opacity-40 transition-all shrink-0 flex items-center gap-2"
                >
                  {step === 'error' ? <><RefreshCw size={14} /> Retry</> : <><ArrowRight size={14} /> Inspect</>}
                </button>
              )}
            </div>

            {/* Supported formats hint */}
            <p className="text-[11px] text-text-quaternary">
              Supported: <span className="text-text-tertiary">.csv, .tsv, .xlsx, .xls, .parquet, .json</span> — format auto-detected from URL or headers
            </p>
          </div>

          {/* States */}
          {step === 'probing' && (
            <div className="flex items-center gap-3 px-4 py-4 bg-bg-raised border border-border-muted rounded-xl">
              <Loader2 size={18} className="text-accent animate-spin shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-text-primary">Inspecting URL…</p>
                <p className="text-[12px] text-text-tertiary">Detecting format and extracting schema</p>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="flex items-start gap-3 px-4 py-4 bg-rose-muted border border-rose/30 rounded-xl">
              <AlertCircle size={17} className="text-rose shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-rose">Inspection Failed</p>
                <p className="text-[12px] text-text-tertiary mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {(step === 'preview' || step === 'registering' || step === 'done') && probeResult && (
            <>
              {/* Format badge + stats */}
              <div className="flex items-center gap-3 px-4 py-3 bg-bg-raised border border-border-muted rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-bg-muted flex items-center justify-center shrink-0">
                  <FormatIcon size={16} className={formatColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-primary">
                      {probeResult.format?.toUpperCase()} detected
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-muted text-emerald text-[10px] font-bold rounded-full uppercase tracking-wide">
                      Compatible
                    </span>
                  </div>
                  <p className="text-[11px] text-text-quaternary truncate mt-0.5">{url}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold text-text-primary">{probeResult.columns?.length}</p>
                  <p className="text-[11px] text-text-quaternary">columns</p>
                </div>
              </div>

              {/* Schema preview */}
              <div>
                <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Schema Preview</p>
                <div className="border border-border-muted rounded-xl overflow-hidden bg-bg-raised">
                  <div className="grid grid-cols-2 px-4 py-2 bg-bg-muted border-b border-border-muted text-[10px] font-bold text-text-quaternary uppercase tracking-wider">
                    <span>Column</span>
                    <span>Type</span>
                  </div>
                  <div className="max-h-[160px] overflow-y-auto">
                    {probeResult.columns?.slice(0, 20).map((col, i) => (
                      <div key={i} className="grid grid-cols-2 px-4 py-2 border-b border-border-muted/50 last:border-0 hover:bg-bg-muted/50 transition-colors">
                        <span className="text-[12px] text-text-primary font-mono truncate">{col.name}</span>
                        <span className="text-[11px] text-text-quaternary font-mono">{col.dtype}</span>
                      </div>
                    ))}
                    {probeResult.columns?.length > 20 && (
                      <div className="px-4 py-2 text-[11px] text-text-quaternary italic">
                        +{probeResult.columns.length - 20} more columns…
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dataset name */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Dataset Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="My Dataset"
                  disabled={step === 'registering' || step === 'done'}
                  className="px-3.5 py-3 bg-bg-raised border border-border-default rounded-xl text-[13px] text-text-primary placeholder-text-quaternary outline-none focus:border-accent transition-colors"
                />
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="flex items-center gap-3 px-4 py-4 bg-emerald-muted border border-emerald/30 rounded-xl">
              <CheckCircle2 size={18} className="text-emerald shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-emerald">Dataset Registered!</p>
                <p className="text-[12px] text-text-tertiary">Schema stored. Data fetched on demand.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'preview' || step === 'registering') && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-muted bg-bg-raised/50">
            <button onClick={onClose} className="qb-btn qb-btn--ghost text-[13px]">Cancel</button>
            <button
              onClick={handleRegister}
              disabled={step === 'registering' || !name.trim()}
              className="qb-btn qb-btn--primary text-[13px] flex items-center gap-2"
            >
              {step === 'registering'
                ? <><Loader2 size={14} className="animate-spin" /> Registering…</>
                : <><CheckCircle2 size={14} /> Add Dataset</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
