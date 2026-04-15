import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Database } from 'lucide-react';
import UploadArea from '../components/datasets/UploadArea';

export default function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] animate-fade-in">
      <div className="w-full max-w-[760px] px-4">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-light-text tracking-tight mb-3 font-heading">
            Upload Your <span className="text-neon-cyan">Dataset</span>
          </h1>
          <br />
          <br />
        </div>

        {/* Upload Component */}
        <div className="relative group p-[2px] rounded-2xl bg-slate-charcoal hover:bg-neon-cyan/50 transition-colors duration-500 shadow-elevation-3 hover:shadow-cyan-glow">
          <div className="bg-void-black rounded-2xl overflow-hidden p-1">
            <UploadArea 
              onUploadSuccess={(result) => {
                setTimeout(() => navigate(`/dataset/${result.id}`), 1200);
              }} 
            />
          </div>
        </div>
        <br />
        <br />

        {/* Info Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-green/10 border border-emerald-green/20 flex items-center justify-center">
              <Shield size={22} className="text-emerald-green" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-light-text uppercase tracking-widest mb-1">Secure</h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                Local-first processing ensures your data stays private.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-3 border-x border-slate-charcoal px-6">
            <div className="w-11 h-11 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
              <Zap size={22} className="text-neon-cyan" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-light-text uppercase tracking-widest mb-1">Fast</h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                Lightning-fast SQL parsing powered by DuckDB.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-electric-violet/10 border border-electric-violet/20 flex items-center justify-center">
              <Database size={22} className="text-electric-violet" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-light-text uppercase tracking-widest mb-1">Smart</h3>
              <p className="text-[13px] text-muted-gray leading-relaxed">
                Automated schema detection and type inference.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}