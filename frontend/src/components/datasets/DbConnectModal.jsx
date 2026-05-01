import { useState, useEffect } from 'react';
import {
  X, Database, Loader2, CheckCircle2, AlertCircle, Table2,
  ChevronRight, ChevronDown, Plus, PlugZap, ServerCrash,
  RefreshCw, Network, Check
} from 'lucide-react';
import {
  probeDbConnection, saveDbConnection, probeExistingDbConnection,
  registerDbTable, listDbConnections
} from '../../lib/api';
import { useToast } from '../ui/Toast';

const DB_TYPES = [
  { value: 'sqlite', label: 'SQLite', icon: '🗄️', hasHost: false },
  { value: 'duckdb', label: 'DuckDB', icon: '🦆', hasHost: false },
  { value: 'postgresql', label: 'PostgreSQL', icon: '🐘', hasHost: true },
  { value: 'mysql', label: 'MySQL', icon: '🐬', hasHost: true },
];

export default function DbConnectModal({ onClose, onSuccess, initialDataset }) {
  const [activeTab, setActiveTab] = useState(initialDataset ? 'saved' : 'new'); // 'new' | 'saved'
  const [dbType, setDbType] = useState('sqlite');
  const [form, setForm] = useState({ 
    host: 'localhost', port: '', database: '', username: '', password: '', name: '',
    sslMode: 'If available', sslKey: '', sslCert: '', sslCa: '', sslCipher: '',
    sslKeyContent: '', sslCertContent: '', sslCaContent: ''
  });
  const [formTab, setFormTab] = useState('parameters'); // 'parameters' | 'ssl'
  const [step, setStep] = useState('form'); // 'form' | 'probing' | 'tables' | 'registering' | 'error'
  const [probeResult, setProbeResult] = useState(null);
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [expandedTable, setExpandedTable] = useState(null);
  const [error, setError] = useState('');
  const [savedConnections, setSavedConnections] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const toast = useToast();

  const selectedDbType = DB_TYPES.find(d => d.value === dbType);
  const defaultPort = { postgresql: '5432', mysql: '3306', sqlite: '', duckdb: '' };

  useEffect(() => {
    if (activeTab === 'saved') loadSaved();
  }, [activeTab]);

  // Handle initial dataset for editing
  useEffect(() => {
    if (initialDataset && initialDataset.source_type === 'db') {
      const loadInitial = async () => {
        try {
          const { getDbConnection, probeExistingDbConnection } = await import('../../lib/api');
          const meta = typeof initialDataset.source_meta === 'string' ? JSON.parse(initialDataset.source_meta) : initialDataset.source_meta;
          if (meta?.connection_id) {
            const conn = await getDbConnection(meta.connection_id);
            setActiveConnection(conn);
            setStep('probing');
            const result = await probeExistingDbConnection(conn.id);
            setProbeResult(result);
            setSelectedTables(new Set([meta.table_name]));
            setStep('tables');
          }
        } catch (e) {
          console.error("Failed to load initial DB dataset", e);
        }
      };
      loadInitial();
    }
  }, [initialDataset]);

  const loadSaved = async () => {
    setLoadingSaved(true);
    try {
      const result = await listDbConnections();
      setSavedConnections(result.connections || []);
    } catch {
      toast.error('Failed to load saved connections');
    } finally {
      setLoadingSaved(false);
    }
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleProbe = async () => {
    setStep('probing');
    setError('');
    try {
      const payload = {
        db_type: dbType,
        host: form.host,
        port: form.port ? parseInt(form.port) : (defaultPort[dbType] ? parseInt(defaultPort[dbType]) : 0),
        database: form.database,
        username: form.username,
        password: form.password,
        ssl_mode: form.sslMode,
        ssl_key: form.sslKey,
        ssl_cert: form.sslCert,
        ssl_ca: form.sslCa,
        ssl_cipher: form.sslCipher,
        ssl_key_content: form.sslKeyContent,
        ssl_cert_content: form.sslCertContent,
        ssl_ca_content: form.sslCaContent,
      };
      const result = await probeDbConnection(payload);
      setProbeResult(result);
      setStep('tables');
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Connection failed');
      setStep('error');
    }
  };

  const handleProbeExisting = async (conn) => {
    setActiveConnection(conn);
    setStep('probing');
    setError('');
    try {
      const result = await probeExistingDbConnection(conn.id);
      setProbeResult(result);
      setStep('tables');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Connection failed');
      setStep('error');
    }
  };

  const toggleTable = (name) => {
    setSelectedTables(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleAddTables = async () => {
    if (selectedTables.size === 0) return;
    setStep('registering');

    let connectionId = activeConnection?.id;

    // If new connection, save it first
    if (!connectionId && activeTab === 'new') {
      try {
        const saved = await saveDbConnection({
          name: form.name || `${dbType}:${form.database}`,
          db_type: dbType,
          host: form.host,
          port: form.port ? parseInt(form.port) : 0,
          database: form.database,
          username: form.username,
          password: form.password,
          ssl_mode: form.sslMode,
          ssl_key: form.sslKey,
          ssl_cert: form.sslCert,
          ssl_ca: form.sslCa,
          ssl_cipher: form.sslCipher,
          ssl_key_content: form.sslKeyContent,
          ssl_cert_content: form.sslCertContent,
          ssl_ca_content: form.sslCaContent,
        });
        connectionId = saved.id;
      } catch (err) {
        setError(err?.response?.data?.detail || 'Failed to save connection');
        setStep('error');
        return;
      }
    }

    const tablesToAdd = probeResult.tables.filter(t => selectedTables.has(t.name));
    const results = [];
    const failures = [];

    for (const table of tablesToAdd) {
      try {
        const ds = await registerDbTable({
          connection_id: connectionId,
          table_name: table.name,
          dataset_name: table.name,
          columns: table.columns,
          row_count: table.row_count || 0,
        });
        results.push(ds);
      } catch {
        failures.push(table.name);
      }
    }

    if (failures.length > 0) {
      toast.error(`Failed to register: ${failures.join(', ')}`);
    }
    if (results.length > 0) {
      toast.success(`${results.length} table${results.length !== 1 ? 's' : ''} added as datasets`);
      onSuccess?.(results);
    }
    onClose();
  };

  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setStep('form');
    setFormTab('parameters');
    setProbeResult(null);
    setError('');
    setSelectedTables(new Set());
    setActiveConnection(null);
  };

  const handleSslDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
    if (!files.length) return;

    for (const file of files) {
      const text = await file.text();
      const name = file.name.toLowerCase();
      
      // Auto-detect based on filename or content
      let type = '';
      if (name.includes('key') || text.includes('PRIVATE KEY')) {
        type = 'Key';
        setField('sslKey', file.name);
        setField('sslKeyContent', text);
      } else if (name.includes('cert') || name.includes('crt')) {
        type = 'Cert';
        setField('sslCert', file.name);
        setField('sslCertContent', text);
      } else if (name.includes('ca') || name.includes('root') || text.includes('CERTIFICATE')) {
        // Fallback for certificate if not explicitly named cert
        type = 'CA';
        setField('sslCa', file.name);
        setField('sslCaContent', text);
      }
      
      if (type) {
        toast.success(`Detected and loaded SSL ${type}: ${file.name}`);
      } else {
        toast.error(`Could not detect SSL type for ${file.name}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[640px] bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-muted shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-muted flex items-center justify-center">
              <Network size={18} className="text-violet" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-text-primary">Connect Database</h3>
              <p className="text-[12px] text-text-tertiary">SQLite · DuckDB · PostgreSQL · MySQL</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-quaternary hover:text-text-secondary hover:bg-bg-muted transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-muted shrink-0">
          {['new', 'saved'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); reset(); }}
              className={[
                'flex-1 py-3 text-[13px] font-semibold transition-all',
                activeTab === tab
                  ? 'text-accent border-b-2 border-accent bg-accent/5'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-muted/50'
              ].join(' ')}
            >
              {tab === 'new' ? '+ New Connection' : 'Saved Connections'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* ── NEW CONNECTION TAB ── */}
          {activeTab === 'new' && (step === 'form' || step === 'error') && (
            <>
              {/* DB Type selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Database Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {DB_TYPES.map(dt => (
                    <button
                      key={dt.value}
                      onClick={() => { setDbType(dt.value); setField('port', ''); }}
                      className={[
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                        dbType === dt.value
                          ? 'border-accent bg-accent/10 text-text-primary'
                          : 'border-border-muted bg-bg-raised text-text-tertiary hover:border-border-default hover:bg-bg-muted'
                      ].join(' ')}
                    >
                      <span className="text-lg leading-none">{dt.icon}</span>
                      <span className="text-[11px] font-semibold">{dt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form sub-tabs (only if hasHost) */}
              {selectedDbType?.hasHost && (
                <div className="flex gap-4 border-b border-border-muted pb-2 mt-2">
                  <button
                    onClick={() => setFormTab('parameters')}
                    className={`text-[12px] font-semibold transition-colors ${formTab === 'parameters' ? 'text-accent border-b border-accent -mb-[9px]' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    Parameters
                  </button>
                  <button
                    onClick={() => setFormTab('ssl')}
                    className={`text-[12px] font-semibold transition-colors ${formTab === 'ssl' ? 'text-accent border-b border-accent -mb-[9px]' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    SSL
                  </button>
                </div>
              )}

              {formTab === 'parameters' || !selectedDbType?.hasHost ? (
                <>
                  {/* Connection name */}
                  <InputField label="Connection Name (optional)" value={form.name} onChange={v => setField('name', v)} placeholder={`${dbType}:my-db`} />

                  {/* Host + Port (only if applicable) */}
                  {selectedDbType?.hasHost && (
                    <div className="grid grid-cols-[1fr_100px] gap-3">
                      <InputField label="Host" value={form.host} onChange={v => setField('host', v)} placeholder="localhost" />
                      <InputField label="Port" value={form.port} onChange={v => setField('port', v)} placeholder={defaultPort[dbType] || '0'} />
                    </div>
                  )}

                  {/* Database path/name */}
                  <InputField
                    label={dbType === 'sqlite' || dbType === 'duckdb' ? 'File Path' : 'Database Name'}
                    value={form.database}
                    onChange={v => setField('database', v)}
                    placeholder={dbType === 'sqlite' ? '/path/to/data.db' : dbType === 'duckdb' ? '/path/to/data.duckdb' : 'mydb'}
                  />

                  {/* Username + Password (only if applicable) */}
                  {selectedDbType?.hasHost && (
                    <div className="grid grid-cols-2 gap-3">
                      <InputField label="Username" value={form.username} onChange={v => setField('username', v)} placeholder="user" />
                      <InputField label="Password" type="password" value={form.password} onChange={v => setField('password', v)} placeholder="••••••••" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">Use SSL</label>
                    <select
                      value={form.sslMode}
                      onChange={e => setField('sslMode', e.target.value)}
                      className="px-3.5 py-3 bg-bg-raised border border-border-default rounded-xl text-[13px] text-text-primary outline-none focus:border-accent transition-colors"
                    >
                      <option value="disable">Disable</option>
                      <option value="If available">If available</option>
                      <option value="require">Require</option>
                      <option value="verify-ca">Verify CA</option>
                      <option value="verify-full">Verify Full</option>
                    </select>
                  </div>
                  <div 
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleSslDrop}
                    className={`mt-2 border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      isDragging ? 'border-accent bg-accent/10' : 'border-border-muted bg-bg-raised hover:border-accent/50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <PlugZap size={18} className="text-accent" />
                      </div>
                      <p className="text-[13px] font-semibold text-text-primary">
                        Drag & Drop SSL Files Here
                      </p>
                      <p className="text-[12px] text-text-tertiary">
                        We'll auto-detect Key, Cert, and CA files based on their content or filename.
                      </p>
                      <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        id="ssl-upload" 
                        onChange={handleSslDrop} 
                        accept=".pem,.crt,.key,.cer"
                      />
                      <label 
                        htmlFor="ssl-upload" 
                        className="mt-2 text-[12px] font-semibold text-accent hover:underline cursor-pointer"
                      >
                        Browse Files
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mt-4">
                    {/* Status display for loaded files */}
                    <div className="flex flex-col gap-2 p-3 bg-bg-raised/50 border border-border-muted rounded-xl">
                      <div className="flex items-center justify-between text-[11px] font-bold text-text-tertiary uppercase tracking-tight">
                        <span>SSL File Status</span>
                        <CheckCircle2 size={12} className={form.sslKeyContent || form.sslCertContent || form.sslCaContent ? 'text-accent' : 'text-text-quaternary'} />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1.5 mt-1">
                        <FileStatusLabel label="Key" filename={form.sslKey} isLoaded={!!form.sslKeyContent} />
                        <FileStatusLabel label="Cert" filename={form.sslCert} isLoaded={!!form.sslCertContent} />
                        <FileStatusLabel label="CA" filename={form.sslCa} isLoaded={!!form.sslCaContent} />
                      </div>
                    </div>

                    <InputField label="SSL Cipher" value={form.sslCipher} onChange={v => setField('sslCipher', v)} placeholder="Optional: list of permissible ciphers" />
                  </div>
                </>
              )}

              {step === 'error' && (
                <div className="flex items-start gap-3 px-4 py-4 bg-rose-muted border border-rose/30 rounded-xl">
                  <ServerCrash size={17} className="text-rose shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-rose">Connection Failed</p>
                    <p className="text-[12px] text-text-tertiary mt-0.5">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── SAVED CONNECTIONS TAB ── */}
          {activeTab === 'saved' && (step === 'form' || step === 'error') && (
            <>
              {loadingSaved ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={22} className="animate-spin text-accent" />
                </div>
              ) : savedConnections.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <Database size={32} className="text-text-quaternary" />
                  <p className="text-[14px] font-semibold text-text-secondary">No saved connections</p>
                  <p className="text-[12px] text-text-quaternary">Switch to "New Connection" to add one</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {savedConnections.map(conn => {
                    const dt = DB_TYPES.find(d => d.value === conn.db_type);
                    return (
                      <div
                        key={conn.id}
                        className="flex items-center gap-3 px-4 py-3 bg-bg-raised border border-border-muted rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group"
                        onClick={() => handleProbeExisting(conn)}
                      >
                        <span className="text-xl">{dt?.icon || '🗄️'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-text-primary group-hover:text-accent transition-colors">{conn.name}</p>
                          <p className="text-[11px] text-text-quaternary font-mono truncate">
                            {conn.db_type}{conn.host ? ` · ${conn.host}:${conn.port}` : ''} · {conn.database}
                          </p>
                        </div>
                        <PlugZap size={15} className="text-text-quaternary group-hover:text-accent transition-colors shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
              {step === 'error' && (
                <div className="flex items-start gap-3 px-4 py-4 bg-rose-muted border border-rose/30 rounded-xl">
                  <ServerCrash size={17} className="text-rose shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-rose">Connection Failed</p>
                    <p className="text-[12px] text-text-tertiary mt-0.5">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Probing state */}
          {step === 'probing' && (
            <div className="flex items-center gap-3 px-4 py-5 bg-bg-raised border border-border-muted rounded-xl">
              <Loader2 size={20} className="text-violet animate-spin shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-text-primary">Connecting…</p>
                <p className="text-[12px] text-text-tertiary">Testing connection and fetching table list</p>
              </div>
            </div>
          )}

          {/* Tables selection */}
          {step === 'tables' && probeResult && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">
                    {probeResult.table_count} table{probeResult.table_count !== 1 ? 's' : ''} found
                  </p>
                  <p className="text-[12px] text-text-tertiary">Select tables to import as datasets</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTables(new Set(probeResult.tables.map(t => t.name)))}
                    className="text-[12px] text-accent hover:underline"
                  >Select All</button>
                  <span className="text-text-quaternary">·</span>
                  <button
                    onClick={() => setSelectedTables(new Set())}
                    className="text-[12px] text-text-tertiary hover:text-text-secondary"
                  >Clear</button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto pr-1">
                {probeResult.tables.map(table => {
                  const isSelected = selectedTables.has(table.name);
                  const isExpanded = expandedTable === table.name;
                  return (
                    <div key={table.name} className={[
                      'border rounded-xl overflow-hidden transition-all',
                      isSelected ? 'border-accent bg-accent/5' : 'border-border-muted bg-bg-raised'
                    ].join(' ')}>
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                        onClick={() => toggleTable(table.name)}
                      >
                        <div className={[
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                          isSelected ? 'border-accent bg-accent' : 'border-border-default bg-bg-muted'
                        ].join(' ')}>
                          {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                        </div>
                        <Table2 size={15} className={isSelected ? 'text-accent' : 'text-text-quaternary'} />
                        <div className="flex-1 min-w-0">
                          <p className={['text-[13px] font-semibold', isSelected ? 'text-accent' : 'text-text-primary'].join(' ')}>
                            {table.name}
                          </p>
                          <p className="text-[11px] text-text-quaternary">
                            {table.columns?.length || 0} cols{table.row_count != null ? ` · ${table.row_count?.toLocaleString()} rows` : ''}
                          </p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); setExpandedTable(isExpanded ? null : table.name); }}
                          className="p-1 rounded text-text-quaternary hover:text-text-secondary transition-colors"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>
                      {isExpanded && table.columns?.length > 0 && (
                        <div className="border-t border-border-muted/50 max-h-[120px] overflow-y-auto">
                          {table.columns.map((col, i) => (
                            <div key={i} className="flex items-center justify-between px-6 py-1.5 border-b border-border-muted/30 last:border-0">
                              <span className="text-[12px] text-text-secondary font-mono">{col.name}</span>
                              <span className="text-[11px] text-text-quaternary font-mono">{col.dtype}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedTables.size > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-accent-muted border border-accent/20 rounded-lg">
                  <CheckCircle2 size={14} className="text-accent" />
                  <span className="text-[12px] text-accent font-medium">
                    {selectedTables.size} table{selectedTables.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
              )}
            </>
          )}

          {step === 'registering' && (
            <div className="flex items-center gap-3 px-4 py-5 bg-bg-raised border border-border-muted rounded-xl">
              <Loader2 size={20} className="text-accent animate-spin shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-text-primary">Adding datasets…</p>
                <p className="text-[12px] text-text-tertiary">Registering {selectedTables.size} table{selectedTables.size !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-muted bg-bg-raised/50 shrink-0">
          <button onClick={step !== 'form' ? reset : onClose} className="qb-btn qb-btn--ghost text-[13px]">
            {step !== 'form' ? '← Back' : 'Cancel'}
          </button>

          {activeTab === 'new' && (step === 'form' || step === 'error') && (
            <button
              onClick={step === 'error' ? reset : handleProbe}
              disabled={!form.database.trim()}
              className="qb-btn qb-btn--primary text-[13px] flex items-center gap-2"
            >
              {step === 'error'
                ? <><RefreshCw size={14} /> Retry</>
                : <><PlugZap size={14} /> Test & Connect</>
              }
            </button>
          )}

          {step === 'tables' && (
            <button
              onClick={handleAddTables}
              disabled={selectedTables.size === 0}
              className="qb-btn qb-btn--primary text-[13px] flex items-center gap-2"
            >
              <Plus size={14} /> Add {selectedTables.size > 0 ? selectedTables.size : ''} Table{selectedTables.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3.5 py-3 bg-bg-raised border border-border-default rounded-xl text-[13px] text-text-primary placeholder-text-quaternary outline-none focus:border-accent transition-colors font-mono"
      />
    </div>
  );
}

function FileStatusLabel({ label, filename, isLoaded }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-bg-surface border border-border-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isLoaded ? 'bg-accent animate-pulse' : 'bg-text-quaternary'}`} />
        <span className="text-[12px] font-semibold text-text-secondary w-10">{label}</span>
      </div>
      <span className={`text-[12px] truncate max-w-[200px] ${isLoaded ? 'text-text-primary font-medium' : 'text-text-quaternary italic'}`}>
        {isLoaded ? filename : 'Not loaded'}
      </span>
    </div>
  );
}
