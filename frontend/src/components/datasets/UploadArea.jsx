import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { uploadDataset } from '../../lib/api';
import { Button } from '../ui';

export default function UploadArea({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    setSuccess(null);
    setProgress(0);

    if (rejectedFiles.length > 0) {
      setError('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 200 * 1024 * 1024) {
        setError('File too large. Maximum size is 200 MB.');
        return;
      }
      setSelectedFile(file);
      if (!datasetName) {
        setDatasetName(file.name.replace(/\.(csv|xlsx|xls)$/i, ''));
      }
    }
  }, [datasetName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadDataset(selectedFile, datasetName || undefined);
      setSuccess(result);
      setSelectedFile(null);
      setDatasetName('');
      if (onUploadSuccess) onUploadSuccess(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setDatasetName('');
    setError(null);
    setSuccess(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-4 px-6 py-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-scale-in">
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-destructive" />
          </div>
          <div className="pt-1">
            <h4 className="text-sm font-bold text-destructive uppercase tracking-wider mb-0.5">Upload Error</h4>
            <p className="text-[13px] text-light-text/80 font-medium leading-relaxed">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-muted-gray hover:text-light-text transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="px-8 py-8 rounded-xl bg-emerald-green/5 border border-emerald-green/20 animate-scale-in relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <CheckCircle2 size={120} className="text-emerald-green" />
          </div>
          
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-green/20 border border-emerald-green/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={28} className="text-emerald-green" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-green tracking-tight font-heading">Processing Complete</h3>
                <p className="text-sm text-muted-gray font-medium mt-0.5">Your dataset is indexed and ready for analysis</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-void-black/40 border border-slate-charcoal">
                <div className="text-[10px] text-muted-gray font-bold uppercase tracking-widest mb-2">IDENTIFIED NAME</div>
                <div className="text-sm font-semibold text-light-text">{success.name}</div>
              </div>
              <div className="p-4 rounded-lg bg-void-black/40 border border-slate-charcoal">
                <div className="text-[10px] text-muted-gray font-bold uppercase tracking-widest mb-2">SCHEMA DETECTED</div>
                <div className="text-sm font-mono font-semibold text-neon-cyan">{success.table_name}</div>
              </div>
              <div className="p-4 rounded-lg bg-void-black/40 border border-slate-charcoal">
                <div className="text-[10px] text-muted-gray font-bold uppercase tracking-widest mb-2">RECORDS</div>
                <div className="text-sm font-semibold text-light-text">{success.row_count?.toLocaleString()} rows</div>
              </div>
              <div className="p-4 rounded-lg bg-void-black/40 border border-slate-charcoal">
                <div className="text-[10px] text-muted-gray font-bold uppercase tracking-widest mb-2">DIMENSIONS</div>
                <div className="text-sm font-semibold text-light-text">{success.columns?.length} columns</div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSuccess(null)}
                className="btn-secondary text-sm px-6 py-2.5"
              >
                Upload Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected File Card */}
      {selectedFile && !success && (
        <div className="px-8 py-8 rounded-xl bg-deep-navy border border-slate-charcoal animate-scale-in shadow-elevation-3">
          <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-charcoal">
            <div className="w-16 h-16 rounded-xl bg-void-black border border-slate-charcoal flex items-center justify-center shrink-0 shadow-elevation-1">
              <FileSpreadsheet size={32} className="text-neon-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg text-light-text truncate mb-1 tracking-tight">{selectedFile.name}</div>
              <div className="flex items-center gap-3 text-sm text-muted-gray font-medium">
                <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                <span className="w-1 h-1 rounded-full bg-slate-charcoal" />
                <span className="uppercase tracking-widest text-[10px]">Ready for upload</span>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-gray hover:text-ember-orange hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-muted-gray uppercase tracking-widest mb-3">Target Table Name</label>
              <input
                type="text"
                value={datasetName}
                onChange={e => setDatasetName(e.target.value)}
                placeholder="e.g. sales_data_2024"
                className="w-full px-5 py-4 rounded-lg bg-void-black border border-slate-charcoal text-light-text text-sm font-medium placeholder:text-muted-gray/40 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/20 transition-all shadow-inner"
              />
              <p className="mt-2 text-[11px] text-muted-gray/60 italic">This will be the reference name in SQL queries.</p>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary w-full py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-void-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Initializing Engine...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Start Processing
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      {!selectedFile && !success && (
        <div
          {...getRootProps()}
          className={`relative w-full border-2 border-dashed rounded-2xl py-32 px-12 min-h-[260px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 overflow-hidden group ${
            isDragActive
              ? 'border-neon-cyan bg-neon-cyan/5 shadow-cyan-glow scale-[1.01]'
              : 'border-slate-charcoal bg-deep-navy/20 hover:border-neon-cyan/50 hover:bg-neon-cyan/5'
          }`}
        >
          <input {...getInputProps()} />

          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Icon Container */}
            <div className={`w-24 h-24 mb-10 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${
              isDragActive 
                ? 'bg-neon-cyan scale-110 shadow-[0_0_40px_rgba(0,217,255,0.4)]' 
                : 'bg-void-black border border-slate-charcoal group-hover:border-neon-cyan/30 group-hover:scale-105 shadow-elevation-2'
            }`}>
              <Upload 
                size={40} 
                className={`transition-colors duration-500 ${isDragActive ? 'text-void-black' : 'text-muted-gray group-hover:text-neon-cyan'}`} 
                strokeWidth={1.5}
              />
              {!isDragActive && (
                <div className="absolute inset-0 rounded-2xl border-2 border-neon-cyan/0 group-hover:border-neon-cyan/10 animate-pulse-slow"></div>
              )}
            </div>

            {/* Text Content */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-light-text tracking-tight font-heading">
                {isDragActive ? (
                  <span className="flex items-center justify-center gap-3 animate-pulse">
                    Drop to ingest data
                  </span>
                ) : (
                  'Drop source files here'
                )}
              </h3>
              <p className="text-muted-gray max-w-xs mx-auto text-[15px] font-medium leading-relaxed">
                Connect your CSV or Excel datasets to the <span className="text-neon-cyan">SmartDash</span> analytics engine.
              </p>
            </div>

            {/* Constraints */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {['CSV', 'XLSX', 'XLS'].map((fmt) => (
                <div 
                  key={fmt} 
                  className="px-4 py-1.5 rounded-full bg-void-black border border-slate-charcoal text-[10px] text-light-text font-bold tracking-[0.1em] shadow-elevation-1 group-hover:border-neon-cyan/20 transition-colors"
                >
                  {fmt}
                </div>
              ))}
              <div className="w-1.5 h-1.5 rounded-full bg-slate-charcoal mx-1" />
              <span className="text-[11px] text-muted-gray font-bold tracking-tight">LIMIT 200MB</span>
            </div>
          </div>
          
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-slate-charcoal) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>
      )}
    </div>
  );
}