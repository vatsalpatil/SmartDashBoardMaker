import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X, Link2, Loader2, CheckCircle2, AlertCircle, FileText,
  Table2, RefreshCw, ArrowRight, Globe, FileSpreadsheet,
  Braces, File, Settings2, Trash2, Check, ChevronRight,
  Database, Clock, Layers, Plus, ShieldCheck, Zap,
  Search, Eye, Code, Save, ChevronLeft, Layout,
  Share2, Cloud, HardDrive, Download, ExternalLink,
  ChevronDown, Filter, Info, Sparkles, Activity,
  MoreVertical, Play, DownloadCloud, History, GripVertical
} from 'lucide-react';
import { probeUrl, registerUrlDataset, getDataset } from '../lib/api';
import { useToast } from '../components/ui/Toast';

const FORMAT_MAP = {
  csv: { name: 'CSV / TSV', icon: FileText },
  excel: { name: 'Excel', icon: FileSpreadsheet },
  parquet: { name: 'Parquet', icon: Database },
  json: { name: 'JSON API', icon: Braces },
};

const DATA_TYPES = ['string', 'integer', 'float', 'boolean', 'datetime'];

const SYNC_INTERVALS = [
  { label: 'Manual Only', value: 0 },
  { label: 'Every 5 Mins', value: 5 },
  { label: 'Every 15 Mins', value: 15 },
  { label: 'Hourly', value: 60 },
  { label: 'Daily', value: 1440 },
];

export default function UrlImportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [resultTab, setResultTab] = useState('schema');
  
  const [isProbing, setIsProbing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [probeResult, setProbeResult] = useState(null);
  const [editableColumns, setEditableColumns] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    toast.clear();
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId) loadExistingDataset(editId);
    return () => toast.clear();
  }, [location.search]);

  const loadExistingDataset = async (id) => {
    toast.clear();
    setIsProbing(true);
    try {
      const ds = await getDataset(id);
      const meta = JSON.parse(ds.source_meta || '{}');
      const config = meta.config || {};
      setUrl(meta.url || '');
      setName(ds.name || '');
      setRefreshInterval(config.refreshInterval || 0);
      const result = await probeUrl(meta.url, config);
      setProbeResult(result);
    } catch (err) {
      setError('Failed to load dataset');
    } finally {
      setIsProbing(false);
    }
  };

  const normalizeType = (t) => {
    const type = (t || 'string').toLowerCase();
    if (type.includes('int') || type.includes('long') || type.includes('uint')) return 'integer';
    if (type.includes('float') || type.includes('double') || type.includes('decimal') || type.includes('real')) return 'float';
    if (type.includes('bool')) return 'boolean';
    if (type.includes('date') || type.includes('time')) return 'datetime';
    return 'string';
  };

  useEffect(() => {
    if (probeResult?.columns) {
      setEditableColumns(probeResult.columns.map(c => ({
        name: c.name,
        type: normalizeType(c.dtype || c.type || 'string'),
        selected: true,
        alias: ''
      })));
    }
  }, [probeResult]);

  const handleConnect = async () => {
    if (!url.trim()) return;
    toast.clear();
    setIsProbing(true);
    setError('');
    setProbeResult(null);
    try {
      const targetUrl = getTransformedUrl(url);
      const result = await probeUrl(targetUrl, { method: 'GET' });
      setProbeResult(result);
      toast.success('Connection established');
      if (!name) {
        try {
          const urlObj = new URL(url.trim());
          const base = urlObj.pathname.split('/').pop()?.split('.')[0] || 'dataset';
          setName(base.replace(/[^a-zA-Z0-9_\s-]/g, '').trim() || 'My Dataset');
        } catch {
          setName('My Dataset');
        }
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Connection failed. Ensure the URL is public.');
    } finally {
      setIsProbing(false);
    }
  };

  const getTransformedUrl = (raw) => {
    let target = raw.trim();
    if (target.includes('docs.google.com/spreadsheets/d/')) {
      if (!target.includes('/export')) {
        target = target.replace(/\/edit.*$/, '') + '/export?format=csv';
      }
    }
    return target;
  };

  const handleRegister = async () => {
    if (!name.trim()) { toast.error('Please specify a dataset name'); return; }
    setIsRegistering(true);
    try {
      const targetUrl = getTransformedUrl(url);
      const config = {
        method: 'GET',
        refresh_interval: refreshInterval,
        column_mapping: editableColumns.filter(c => c.selected).map(c => ({
          name: c.name,
          alias: c.alias || c.name,
          type: c.type
        }))
      };
      await registerUrlDataset(targetUrl, name.trim(), config);
      toast.success('Pipeline successfully saved');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

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

  const [dragIndex, setDragIndex] = useState(null);

  const handleDragStart = (i) => {
    setDragIndex(i);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (i) => {
    if (dragIndex === null || dragIndex === i) return;
    const next = [...editableColumns];
    const item = next[dragIndex];
    next.splice(dragIndex, 1);
    next.splice(i, 0, item);
    setEditableColumns(next);
    setDragIndex(null);
  };

  const formatInfo = probeResult ? (FORMAT_MAP[probeResult.format] || FORMAT_MAP.csv) : null;
  const FormatIcon = formatInfo?.icon || FileText;

  return (
    <div className="h-full bg-[#0a0b0c] flex flex-col font-sans text-[#cbd5e1] overflow-hidden">
      
      {/* Header */}
      <header className="h-14 bg-[#111213] border-b border-[#1e1f20] flex items-center px-4 shrink-0 gap-4">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-[#202122] rounded-md transition-all text-[#64748b]">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent/20 flex items-center justify-center">
            <Cloud size={16} className="text-accent" />
          </div>
          <span className="text-[13px] font-bold text-[#f1f5f9]">Cloud Connect</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRegister}
            disabled={!probeResult || isRegistering}
            className="flex items-center gap-2 px-4 py-1.5 bg-accent hover:bg-accent/90 disabled:opacity-30 rounded text-[12px] font-bold text-white transition-all shadow-lg shadow-accent/10"
          >
            {isRegistering ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Table
          </button>
        </div>
      </header>

      {/* Request Bar */}
      <div className="p-4 bg-[#0a0b0c] border-b border-[#1e1f20] flex flex-col gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#111213] border border-[#1e1f20] rounded-md overflow-hidden flex-[1.5] group focus-within:border-accent transition-all">
             <div className="px-3 py-2 text-[11px] font-black text-emerald-500 border-r border-[#1e1f20] bg-[#1a1b1c]">GET</div>
             <input 
               type="text"
               value={url}
               onChange={e => setUrl(e.target.value)}
               placeholder="Paste Data URL (CSV, Sheets, etc.)"
               className="flex-1 bg-transparent px-3 py-2 text-[13px] text-[#f1f5f9] outline-none placeholder-[#334155]"
             />
          </div>
          <div className="flex items-center bg-[#111213] border border-[#1e1f20] rounded-md overflow-hidden flex-1 group focus-within:border-accent transition-all">
             <div className="px-3 py-2 text-[10px] font-bold text-[#64748b] border-r border-[#1e1f20] bg-[#1a1b1c] uppercase tracking-tighter">Label</div>
             <input 
               type="text"
               value={name}
               onChange={e => setName(e.target.value)}
               placeholder="Registry Name"
               className="flex-1 bg-transparent px-3 py-2 text-[13px] text-[#f1f5f9] outline-none placeholder-[#334155]"
             />
          </div>
          <div className="flex items-center bg-[#111213] border border-[#1e1f20] rounded-md overflow-hidden w-48 group focus-within:border-accent transition-all">
             <div className="px-3 py-2 text-[10px] font-bold text-[#64748b] border-r border-[#1e1f20] bg-[#1a1b1c] uppercase tracking-tighter">Sync</div>
             <select 
               value={refreshInterval}
               onChange={e => setRefreshInterval(Number(e.target.value))}
               className="flex-1 bg-transparent px-3 py-2 text-[12px] text-[#f1f5f9] outline-none cursor-pointer appearance-none"
             >
                {SYNC_INTERVALS.map(opt => <option key={opt.value} value={opt.value} className="bg-[#111213]">{opt.label}</option>)}
             </select>
          </div>
          <button 
            onClick={handleConnect}
            disabled={!url.trim() || isProbing}
            className="px-6 py-2 bg-accent text-white font-bold text-[12px] flex items-center gap-2 hover:opacity-90 disabled:opacity-20 transition-all rounded-md"
          >
            {isProbing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            Send
          </button>
        </div>

        {probeResult && (
          <div className="flex items-center gap-6 px-2 animate-fade-in">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Connected</span>
             </div>
             <div className="flex items-center gap-2">
                <FormatIcon size={12} className="text-[#64748b]" />
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest">{formatInfo?.name}</span>
             </div>
             <div className="flex items-center gap-2">
                <Table2 size={12} className="text-[#64748b]" />
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest">{probeResult.columns?.length} Fields</span>
             </div>
          </div>
        )}

        {error && !probeResult?.columns && (
          <div className="flex items-center gap-2 px-2 text-rose-500 animate-shake">
             <AlertCircle size={14} />
             <span className="text-[11px] font-bold">{error}</span>
          </div>
        )}
      </div>

      {/* Main View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0b0c]">
           <div className="flex items-center justify-between px-4 h-10 border-b border-[#1e1f20] bg-[#0d0e0f]">
              <div className="flex items-center gap-4 h-full">
                {['schema', 'preview'].map(tab => (
                  <button 
                    key={tab}
                    disabled={!probeResult}
                    onClick={() => setResultTab(tab)}
                    className={`h-full px-2 text-[11px] font-bold uppercase tracking-wider relative transition-all disabled:opacity-20 ${resultTab === tab ? 'text-accent' : 'text-[#64748b] hover:text-[#94a3b8]'}`}
                  >
                    {tab === 'schema' ? 'Field Designer' : 'Live Preview'}
                    {resultTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent" />}
                  </button>
                ))}
              </div>
           </div>

           <div className="flex-1 overflow-hidden relative">
              {!probeResult && !isProbing && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-[#334155]">
                    <Sparkles size={48} className="mb-4 opacity-10" />
                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-30">Pipeline Inactive</p>
                 </div>
              )}

              {isProbing && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0b0c]/80 z-10 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Loader2 size={20} className="animate-spin text-accent" />
                      <span className="text-[13px] font-bold tracking-widest uppercase text-accent">Parsing...</span>
                    </div>
                 </div>
              )}

              {probeResult && (
                 <div className="h-full overflow-y-auto custom-scrollbar">
                    {resultTab === 'schema' ? (
                      <table className="w-full text-left border-collapse">
                         <thead className="sticky top-0 z-10 bg-[#0d0e0f] border-b border-[#1e1f20]">
                            <tr>
                               <th className="px-6 py-3 text-[10px] font-black text-[#64748b] uppercase tracking-widest w-16 text-center">Use</th>
                               <th className="px-6 py-3 text-[10px] font-black text-[#64748b] uppercase tracking-widest w-16 text-center">Move</th>
                               <th className="px-6 py-3 text-[10px] font-black text-[#64748b] uppercase tracking-widest">Source Field</th>
                               <th className="px-6 py-3 text-[10px] font-black text-[#64748b] uppercase tracking-widest">Registry Alias</th>
                               <th className="px-6 py-3 text-[10px] font-black text-[#64748b] uppercase tracking-widest w-40">Data Type</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-[#1e1f20]">
                            {editableColumns.map((col, i) => (
                              <tr 
                                key={i} 
                                draggable={true}
                                onDragStart={() => handleDragStart(i)}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(i)}
                                className={`hover:bg-[#111213]/50 transition-colors cursor-default group ${!col.selected ? 'opacity-30' : ''} ${dragIndex === i ? 'bg-accent/10 opacity-50' : ''}`}
                              >
                                 <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                      <button 
                                        onClick={() => toggleColumn(i)}
                                        className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${col.selected ? 'bg-accent border-accent text-white shadow-lg shadow-accent/10' : 'border-[#334155]'}`}
                                      >
                                        {col.selected && <Check size={12} strokeWidth={4} />}
                                      </button>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex items-center justify-center cursor-grab active:cursor-grabbing text-[#334155] group-hover:text-accent transition-colors">
                                       <GripVertical size={16} />
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <Code size={14} className="text-[#334155]" />
                                       <span className="text-[13px] font-bold text-[#f1f5f9] font-mono">{col.name}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <input 
                                      type="text"
                                      value={col.alias}
                                      onChange={e => updateColumn(i, { alias: e.target.value })}
                                      placeholder={col.name}
                                      disabled={!col.selected}
                                      className="w-full bg-transparent border border-transparent hover:border-[#1e1f20] focus:border-accent rounded px-2 py-1 text-[13px] text-[#94a3b8] outline-none transition-all"
                                    />
                                 </td>
                                 <td className="px-6 py-4">
                                    <select 
                                      value={col.type}
                                      onChange={e => updateColumn(i, { type: e.target.value })}
                                      disabled={!col.selected}
                                      className="w-full bg-transparent text-[11px] font-bold text-accent outline-none cursor-pointer appearance-none"
                                    >
                                      {DATA_TYPES.map(t => <option key={t} value={t} className="bg-[#111213]">{t.toUpperCase()}</option>)}
                                    </select>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                    ) : (
                      <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse">
                            <thead>
                               <tr className="bg-[#0d0e0f] border-b border-[#1e1f20]">
                                  {probeResult.columns?.map((col, i) => (
                                    <th key={i} className="px-6 py-3 text-[10px] font-black text-[#64748b] uppercase tracking-widest whitespace-nowrap border-r border-[#1e1f20]/50 last:border-0">
                                      {col.name}
                                    </th>
                                  ))}
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1e1f20]">
                               {probeResult.sample_rows?.map((row, i) => (
                                 <tr key={i} className="hover:bg-[#111213]/50">
                                    {probeResult.columns?.map((col, j) => (
                                      <td key={j} className="px-6 py-3 text-[12px] text-[#94a3b8] font-mono whitespace-nowrap border-r border-[#1e1f20]/50 last:border-0">
                                        {row[col.name]?.toString() || <span className="opacity-20 italic">null</span>}
                                      </td>
                                    ))}
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                    )}
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-7 bg-[#111213] border-t border-[#1e1f20] flex items-center justify-between px-4 shrink-0">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
               <div className={`w-2 h-2 rounded-full ${probeResult ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-[#334155]'}`} />
               <span className={`text-[10px] font-bold uppercase tracking-widest ${probeResult ? 'text-emerald-500' : 'text-[#334155]'}`}>
                 {probeResult ? 'Stream Active' : 'Standby'}
               </span>
            </div>
            <span className="text-[10px] font-medium text-[#475569] uppercase tracking-widest">v3.5 Build Optimized</span>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[10px] font-medium text-[#475569] uppercase tracking-widest flex items-center gap-1.5">
               <Activity size={10} className="text-accent" />
               Engine: <span className="text-[#64748b]">Ingest.AI</span>
            </span>
         </div>
      </footer>
    </div>
  );
}
