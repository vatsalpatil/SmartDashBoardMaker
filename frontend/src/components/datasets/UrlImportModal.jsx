import { useState, useRef, useEffect } from 'react';
import {
  X, Link2, Loader2, CheckCircle2, AlertCircle, FileText,
  Table2, RefreshCw, ArrowRight, Globe, FileSpreadsheet,
  Braces, File, Settings2, Trash2, Check, ChevronRight,
  Database, Clock, Layers
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

const DATA_TYPES = ['string', 'integer', 'float', 'boolean', 'datetime', 'json'];

const SYNC_INTERVALS = [
  { label: 'Manual Only', value: 0 },
  { label: 'Every 5 Minutes', value: 5 },
  { label: 'Every 15 Minutes', value: 15 },
  { label: 'Hourly', value: 60 },
  { label: 'Daily', value: 1440 },
];

export default function UrlImportModal({ onClose, onSuccess }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState([{ key: '', value: '', enabled: true }]);
  const [body, setBody] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced Features
  const [dataPath, setDataPath] = useState('');
  const [editableColumns, setEditableColumns] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(0);

  const [step, setStep] = useState('input'); // 'input' | 'probing' | 'preview' | 'registering' | 'done' | 'error'
  const [probeResult, setProbeResult] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();
  const inputRef = useRef(null);

  useEffect(() => {
    if (probeResult?.columns) {
      setEditableColumns(probeResult.columns.map(c => ({
        name: c.name,
        type: c.dtype || 'string',
        selected: true,
        alias: ''
      })));
    }
  }, [probeResult]);

  const getActiveHeaders = () => {
    const hh = {};
    headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
      hh[h.key.trim()] = h.value;
    });
    return hh;
  };

  const handleProbe = async () => {
    if (!url.trim()) return;
    setStep('probing');
    setError('');
    try {
      const options = {
        method,
        headers: getActiveHeaders(),
        body: method !== 'GET' ? body : undefined,
        dataPath: dataPath.trim() || undefined
      };
      const result = await probeUrl(url.trim(), options);
      setProbeResult(result);
      if (!name) {
        try {
          const urlObj = new URL(url.trim());
          const urlPath = urlObj.pathname;
          const base = urlPath.split('/').pop()?.split('.')[0] || 'dataset';
          setName(base.replace(/[^a-zA-Z0-9_\s-]/g, '').trim() || 'My Dataset');
        } catch {
          setName('My Dataset');
        }
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
      const options = {
        method,
        headers: getActiveHeaders(),
        body: method !== 'GET' ? body : undefined,
        dataPath: dataPath.trim() || undefined,
        refreshInterval,
        columns: editableColumns.filter(c => c.selected).map(c => ({
          name: c.name,
          alias: c.alias || c.name,
          type: c.type
        }))
      };
      const result = await registerUrlDataset(url.trim(), name.trim(), options);
      toast.success(`"${name}" registered as dataset`);
      setStep('done');
      setTimeout(() => onSuccess?.(result), 800);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed');
      setStep('error');
    }
  };

  const addHeader = () => setHeaders([...headers, { key: '', value: '', enabled: true }]);
  const updateHeader = (i, patch) => {
    const next = [...headers];
    next[i] = { ...next[i], ...patch };
    setHeaders(next);
  };
  const removeHeader = (i) => setHeaders(headers.filter((_, idx) => idx !== i));

  const toggleColumn = (i) => {
    const next = [...editableColumns];
    next[i].selected = !next[i].selected;
    setEditableColumns(next);
  };

  const updateColumn = (i, patch) => {
    const next = [...editableColumns];
    next[i] = { ...next[i], ...patch };
    setEditableColumns(next);
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
      <div className="w-full max-w-[760px] bg-bg-surface border border-border-default rounded-[32px] shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[92vh]">
        
        {/* Modern Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border-muted bg-bg-raised/30 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-[18px] bg-accent/10 flex items-center justify-center shadow-inner border border-accent/10">
              <Globe size={24} className="text-accent" />
            </div>
            <div>
              <h3 className="text-[19px] font-black text-text-primary tracking-tight">Connect URL Source</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest bg-bg-muted px-2 py-0.5 rounded-md">Endpoint Config</span>
                <ChevronRight size={10} className="text-text-quaternary" />
                <span className="text-[11px] font-medium text-text-tertiary">CSV · Excel · Parquet · JSON</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full text-text-quaternary hover:text-text-secondary hover:bg-bg-muted transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 flex flex-col gap-8">

            {/* URL & Quick Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-black text-text-tertiary uppercase tracking-wider ml-1">Target API / File URL</label>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`text-[11px] font-black flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${showAdvanced ? 'text-accent bg-accent/10 border border-accent/20' : 'text-text-quaternary hover:text-text-secondary hover:bg-bg-muted border border-transparent'}`}
                  >
                    <Settings2 size={13} />
                    Parameters
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-4 px-5 py-4 bg-bg-raised border border-border-default rounded-[22px] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/5 transition-all shadow-sm">
                  <Link2 size={18} className="text-text-quaternary shrink-0" />
                  <input
                    ref={inputRef}
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && step === 'input' && handleProbe()}
                    placeholder="https://api.example.com/v1/export.csv"
                    disabled={step !== 'input' && step !== 'error'}
                    className="flex-1 bg-transparent text-[15px] text-text-primary placeholder-text-quaternary outline-none font-mono"
                  />
                </div>
                {(step === 'input' || step === 'error') && (
                  <button
                    onClick={step === 'error' ? reset : handleProbe}
                    disabled={!url.trim()}
                    className="px-8 py-4 rounded-[22px] text-[15px] font-black bg-accent text-white hover:opacity-90 disabled:opacity-30 transition-all shrink-0 flex items-center gap-3 shadow-xl shadow-accent/20 active:scale-95"
                  >
                    {step === 'error' ? <><RefreshCw size={18} /> Retry</> : <><ArrowRight size={18} /> Connect</>}
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Configuration Panel */}
            {showAdvanced && (step === 'input' || step === 'error') && (
              <div className="flex flex-col gap-8 p-8 bg-bg-raised/40 border border-border-muted rounded-[28px] animate-slide-up shadow-inner">
                <div className="grid grid-cols-2 gap-8">
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-black text-text-tertiary uppercase tracking-widest">HTTP Method</label>
                    <div className="flex gap-1.5 p-1.5 bg-bg-muted rounded-xl border border-border-muted">
                      {['GET', 'POST', 'PUT'].map(m => (
                        <button
                          key={m}
                          onClick={() => setMethod(m)}
                          className={`flex-1 py-2.5 rounded-lg text-[11px] font-black transition-all ${method === m ? 'bg-bg-surface text-accent shadow-md' : 'text-text-quaternary hover:text-text-tertiary'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-black text-text-tertiary uppercase tracking-widest">Auto-Sync Sync</label>
                    <div className="relative">
                      <select
                        value={refreshInterval}
                        onChange={e => setRefreshInterval(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 bg-bg-surface border border-border-muted rounded-xl text-[12px] font-bold text-text-primary outline-none focus:border-accent transition-all appearance-none cursor-pointer shadow-sm"
                      >
                        {SYNC_INTERVALS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-quaternary pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                   <div className="flex items-center justify-between px-1">
                     <label className="text-[11px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                       <Layers size={12} className="text-accent" />
                       Custom Headers
                     </label>
                     <button onClick={addHeader} className="text-[10px] font-black text-accent hover:underline flex items-center gap-1.5 bg-accent/5 px-2 py-1 rounded-lg">
                       + New Header
                     </button>
                   </div>
                   <div className="flex flex-col gap-2.5">
                     {headers.map((h, i) => (
                       <div key={i} className="flex gap-3 items-center group animate-fade-in">
                          <input 
                             type="text" 
                             placeholder="Key" 
                             value={h.key} 
                             onChange={e => updateHeader(i, { key: e.target.value })}
                             className="flex-1 px-4 py-3 bg-bg-surface border border-border-muted rounded-xl text-[12px] text-text-primary outline-none focus:border-accent transition-all font-mono shadow-sm"
                          />
                          <input 
                             type="text" 
                             placeholder="Value" 
                             value={h.value} 
                             onChange={e => updateHeader(i, { value: e.target.value })}
                             className="flex-1 px-4 py-3 bg-bg-surface border border-border-muted rounded-xl text-[12px] text-text-primary outline-none focus:border-accent transition-all font-mono shadow-sm"
                          />
                          <button onClick={() => removeHeader(i)} className="w-10 h-10 flex items-center justify-center rounded-xl text-text-quaternary hover:text-rose hover:bg-rose/10 opacity-0 group-hover:opacity-100 transition-all">
                             <Trash2 size={16} />
                          </button>
                       </div>
                     ))}
                   </div>
                </div>

                {method !== 'GET' && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    <label className="text-[11px] font-black text-text-tertiary uppercase tracking-widest px-1">Request Payload</label>
                    <div className="relative group">
                      <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder='{ "key": "value" }'
                        className="w-full h-36 px-5 py-4 bg-bg-surface border border-border-muted rounded-2xl text-[13px] text-text-primary font-mono outline-none focus:border-accent resize-none custom-scrollbar shadow-inner transition-all"
                      />
                      <div className="absolute right-4 top-4 text-[10px] font-bold text-text-quaternary bg-bg-muted px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">JSON</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Feedback */}
            {step === 'probing' && (
              <div className="flex items-center gap-5 px-8 py-10 bg-accent-muted/10 border border-accent/20 rounded-[32px] animate-pulse">
                <Loader2 size={32} className="text-accent animate-spin shrink-0" />
                <div>
                  <p className="text-[17px] font-black text-text-primary">Orchestrating Connection…</p>
                  <p className="text-[14px] text-text-tertiary mt-1">Downloading sample and inferring tabular structure</p>
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="flex items-start gap-5 px-8 py-8 bg-rose-muted border border-rose/30 rounded-[32px]">
                <AlertCircle size={28} className="text-rose shrink-0 mt-0.5" />
                <div>
                  <p className="text-[17px] font-black text-rose">Inspection Failed</p>
                  <p className="text-[14px] text-text-tertiary mt-2 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* RESULTS PANEL */}
            {(step === 'preview' || step === 'registering' || step === 'done') && probeResult && (
              <div className="flex flex-col gap-10 animate-slide-up">
                
                {/* Meta Summary Card */}
                <div className="flex items-center gap-6 px-8 py-5 bg-bg-raised border border-border-muted rounded-[28px] shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
                  <div className="w-14 h-14 rounded-[20px] bg-bg-muted flex items-center justify-center shrink-0 shadow-inner border border-border-muted/50 group-hover:scale-110 transition-transform">
                    <FormatIcon size={26} className={formatColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[17px] font-black text-text-primary">
                        {probeResult.format?.toUpperCase()} Stream Detected
                      </span>
                      <span className="px-3 py-0.5 bg-emerald-muted text-emerald text-[11px] font-black rounded-lg uppercase tracking-wider border border-emerald/20">
                        Compatible
                      </span>
                    </div>
                    <p className="text-[12px] text-text-quaternary truncate mt-1.5 font-mono bg-bg-muted/50 px-2 py-1 rounded inline-block max-w-full">
                      {url}
                    </p>
                  </div>
                  <div className="text-right shrink-0 pr-2 border-l-2 border-border-muted pl-8">
                    <p className="text-[22px] font-black text-text-primary leading-none">{probeResult.columns?.length}</p>
                    <p className="text-[11px] text-text-quaternary font-black uppercase tracking-widest mt-1">Fields</p>
                  </div>
                </div>

                {/* JSON Path discovery */}
                {probeResult.format === 'json' && (
                  <div className="flex flex-col gap-4 p-6 bg-bg-raised/40 border border-border-muted rounded-[28px]">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-black text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                        <Layers size={14} className="text-accent" />
                        JSON Root Selection
                      </label>
                      <span className="text-[10px] font-bold text-text-quaternary italic px-2 py-1 bg-bg-muted rounded">e.g. data.items</span>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 flex items-center gap-3 px-4 py-3. bg-bg-surface border border-border-default rounded-xl focus-within:border-accent transition-all">
                        <ChevronRight size={16} className="text-text-quaternary" />
                        <input
                          type="text"
                          value={dataPath}
                          onChange={e => setDataPath(e.target.value)}
                          placeholder="Leave blank for array at root"
                          className="flex-1 bg-transparent text-[14px] text-text-primary font-mono outline-none"
                        />
                      </div>
                      <button 
                        onClick={handleProbe}
                        className="px-6 py-3 rounded-xl bg-bg-muted text-text-secondary hover:text-accent font-black text-[13px] border border-border-muted transition-all active:scale-95"
                      >
                        Update Mapping
                      </button>
                    </div>
                  </div>
                )}

                {/* SCHEMA DESIGNER */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet/10 flex items-center justify-center">
                        <Table2 size={16} className="text-violet" />
                      </div>
                      <label className="text-[14px] font-black text-text-primary tracking-tight">Schema Designer</label>
                    </div>
                    <span className="text-[11px] font-bold text-text-quaternary bg-bg-muted px-2 py-1 rounded-lg">
                      {editableColumns.filter(c => c.selected).length} fields active
                    </span>
                  </div>
                  
                  <div className="border border-border-muted rounded-[30px] overflow-hidden bg-bg-raised shadow-inner">
                    <div className="grid grid-cols-[60px_1fr_1fr_140px] px-6 py-4 bg-bg-muted/50 border-b border-border-muted text-[11px] font-black text-text-quaternary uppercase tracking-widest">
                      <div className="flex justify-center">Active</div>
                      <span>Source Field</span>
                      <span>Target Mapping</span>
                      <span>Data Type</span>
                    </div>
                    <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
                      {editableColumns.map((col, i) => (
                        <div 
                          key={i} 
                          className={`grid grid-cols-[60px_1fr_1fr_140px] px-6 py-4 border-b border-border-muted/30 last:border-0 items-center transition-all ${!col.selected ? 'opacity-30 grayscale bg-bg-muted/20' : 'hover:bg-accent/5'}`}
                        >
                          <div className="flex justify-center">
                            <button 
                              onClick={() => toggleColumn(i)}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${col.selected ? 'bg-accent border-accent text-white shadow-md' : 'border-border-default hover:border-text-quaternary'}`}
                            >
                              {col.selected && <Check size={14} strokeWidth={4} />}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 pr-4 overflow-hidden">
                            <span className="text-[14px] font-black text-text-primary truncate font-mono" title={col.name}>{col.name}</span>
                          </div>
                          <div className="pr-4">
                            <input
                              type="text"
                              value={col.alias}
                              onChange={e => updateColumn(i, { alias: e.target.value })}
                              placeholder={col.name}
                              disabled={!col.selected}
                              className="w-full px-3 py-2 bg-bg-surface/60 border border-border-muted rounded-xl text-[13px] text-text-secondary outline-none focus:border-accent/50 focus:bg-bg-surface transition-all font-bold placeholder:opacity-50"
                            />
                          </div>
                          <div className="relative">
                            <select
                              value={col.type}
                              onChange={e => updateColumn(i, { type: e.target.value })}
                              disabled={!col.selected}
                              className="w-full px-3 py-2 bg-transparent text-[12px] text-text-tertiary font-black outline-none cursor-pointer hover:text-accent transition-colors appearance-none"
                            >
                              {DATA_TYPES.map(t => <option key={t} value={t} className="bg-bg-surface font-sans">{t}</option>)}
                            </select>
                            <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-quaternary rotate-90 pointer-events-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Final Dataset Identity */}
                <div className="flex flex-col gap-4 p-8 bg-accent-muted/5 border-2 border-dashed border-accent/20 rounded-[32px] relative group transition-all hover:border-accent/40 hover:bg-accent-muted/10">
                  <div className="absolute -top-3 left-8 bg-bg-surface px-4 text-[12px] font-black text-accent uppercase tracking-widest border-2 border-accent/20 rounded-full flex items-center gap-2">
                    <Database size={12} />
                    Final Registry Name
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Indices_History_Live"
                    disabled={step === 'registering' || step === 'done'}
                    className="w-full px-6 py-5 bg-transparent text-[18px] font-black text-text-primary placeholder-text-quaternary outline-none transition-all"
                  />
                  <p className="text-[12px] text-text-tertiary px-1">This name will be used to reference the dataset in queries and visualizations.</p>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-scale-in">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-emerald/20 blur-3xl rounded-full scale-150" />
                  <div className="w-24 h-24 rounded-[32px] bg-emerald/10 flex items-center justify-center shadow-2xl relative border border-emerald/20">
                    <CheckCircle2 size={48} className="text-emerald" />
                  </div>
                </div>
                <h4 className="text-[26px] font-black text-text-primary tracking-tight">Dataset Registered!</h4>
                <p className="text-[16px] text-text-tertiary mt-3 max-w-[360px] leading-relaxed">
                  The schema map for <span className="text-text-primary font-bold">"{name}"</span> is now active. You can start building charts immediately.
                </p>
                <button 
                  onClick={onClose}
                  className="mt-10 px-10 py-4 bg-bg-muted text-text-primary font-black rounded-2xl hover:bg-bg-raised transition-all shadow-md"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Footer */}
        <div className="px-10 py-6 border-t border-border-muted bg-bg-raised/70 shrink-0 flex items-center justify-between backdrop-blur-md">
          <button 
            onClick={step === 'preview' ? reset : onClose} 
            className="px-6 py-3 rounded-2xl text-[14px] font-black text-text-tertiary hover:text-text-secondary hover:bg-bg-muted transition-all active:scale-95"
          >
            {step === 'preview' ? '← Edit Source' : 'Cancel'}
          </button>
          
          {(step === 'preview' || step === 'registering') && (
            <button
              onClick={handleRegister}
              disabled={step === 'registering' || !name.trim() || editableColumns.filter(c => c.selected).length === 0}
              className="flex items-center gap-3 px-10 py-4 rounded-[22px] bg-accent text-white font-black text-[15px] shadow-2xl shadow-accent/40 hover:scale-[1.03] hover:brightness-110 disabled:opacity-30 disabled:scale-100 transition-all active:scale-95"
            >
              {step === 'registering' ? (
                <><Loader2 size={20} className="animate-spin" /> Finalizing Mapping…</>
              ) : (
                <><Check size={20} strokeWidth={3} /> Save to Registry</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Plus({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
