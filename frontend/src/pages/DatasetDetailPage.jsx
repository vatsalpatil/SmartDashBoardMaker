import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  BarChart3,
  Trash2,
  Table2,
  Database,
  Calendar,
  Layers,
  FileCode,
  HardDrive,
  ChevronRight,
  ExternalLink,
  Activity,
  Zap,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getDataset, deleteDataset, checkDbActive } from "../lib/api";
import DataPreview from "../components/datasets/DataPreview";

export default function DatasetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState({ checking: false, active: null, message: "" });

  useEffect(() => {
    getDataset(id)
      .then((data) => {
        setDataset(data);
        if (data.source_type === "db") {
          checkStatus(id);
        }
      })
      .catch((err) => {
        console.error("Failed to load dataset:", err);
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const checkStatus = async (datasetId) => {
    setDbStatus((prev) => ({ ...prev, checking: true }));
    try {
      const res = await checkDbActive(datasetId || id);
      setDbStatus({ checking: false, active: res.active, message: res.message });
    } catch (err) {
      setDbStatus({
        checking: false,
        active: false,
        message: err.response?.data?.detail || "Connection failed",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this dataset? This cannot be undone.")) return;
    try {
      await deleteDataset(id);
      navigate("/");
    } catch (err) {
      alert("Failed to delete dataset");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg !border-t-accent" />
          <span className="text-text-tertiary text-[13px] font-medium animate-pulse">
            Loading dataset details...
          </span>
        </div>
      </div>
    );
  }

  if (!dataset) return null;

  const fileSizeMB = (dataset.file_size / (1024 * 1024)).toFixed(2);
  const sourceType = dataset.source_type?.toUpperCase() || "FILE";

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-y-auto animate-fade-in custom-scrollbar">
      {/* ── Breadcrumbs & Actions ─────────────────────────────────── */}
      <div className="sticky top-0 z-20 glass border-b border-border-muted px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-default hover:bg-bg-muted hover:border-border-strong transition-all text-text-tertiary hover:text-text-primary"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-[12px] font-medium text-text-tertiary">
            <Link to="/" className="hover:text-accent transition-colors">
              Datasets
            </Link>
            <ChevronRight size={14} className="opacity-40" />
            <span className="text-text-primary font-bold">Dataset Details</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-default bg-bg-raised text-text-secondary font-bold text-[12px] hover:border-accent/40 transition-all shadow-sm"
            onClick={() => navigate(`/custom?dataset=${id}`)}
          >
            <Search size={14} className="text-accent" />
            Query
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-bold text-[12px] hover:bg-accent-hover transition-all shadow-lg shadow-accent/10"
            onClick={() => navigate(`/visualize?dataset=${id}`)}
          >
            <BarChart3 size={14} />
            Visualize
          </button>
          <div className="w-[1px] h-4 bg-border-muted mx-1" />
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-default text-rose hover:bg-rose/5 hover:border-rose/30 transition-all opacity-60 hover:opacity-100"
            onClick={handleDelete}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:px-8 md:py-5 w-full flex flex-col gap-4">
        {/* ── Header Section ────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-accent/10 via-bg-surface to-bg-base border border-accent/10 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          {/* subtle decoration */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shrink-0 shadow-lg shadow-accent/20 border border-white/10">
              <Database size={22} className="text-white drop-shadow-md" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl font-black text-text-primary tracking-tight">
                {dataset.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black tracking-widest text-accent uppercase bg-accent-muted px-2 py-0.5 rounded-md border border-accent/20 flex items-center gap-1.5">
                  <Database size={10} />
                  {sourceType}
                </span>
                <span className="text-[11px] text-text-tertiary font-medium font-mono flex items-center gap-1.5 bg-bg-raised px-2 py-0.5 rounded-md border border-border-muted shadow-inner">
                  <FileCode size={11} className="text-text-quaternary" />
                  {dataset.original_filename}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Rows"
            value={dataset.row_count?.toLocaleString() || "0"}
            icon={<Layers size={18} />}
            color="emerald"
          />
          <StatCard
            label="Total Columns"
            value={dataset.columns?.length || "0"}
            icon={<Table2 size={18} />}
            color="accent"
          />
          <StatCard
            label="Storage Size"
            value={`${fileSizeMB} MB`}
            icon={<HardDrive size={18} />}
            color="violet"
          />
          <StatCard
            label="Internal Ref"
            value={dataset.id?.split("-")[0].toUpperCase()}
            icon={<FileCode size={18} />}
            color="rose"
            subtext="Unique Dataset Identifier"
          />
        </div>

        {/* ── Main Content Area ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* Left Side: Metadata & Schema */}
          <div className="xl:col-span-3 flex flex-col gap-4">
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2">
                  <div className="p-1 rounded-md bg-accent/10 text-accent">
                    <Table2 size={14} />
                  </div>
                  Table Schema
                </h3>
                <span className="text-[9px] font-black uppercase tracking-widest text-text-quaternary bg-bg-surface px-2 py-0.5 rounded-full border border-border-muted shadow-sm">
                  {dataset.columns?.length} FIELDS
                </span>
              </div>

              <div className="bg-bg-surface border border-border-default rounded-2xl p-1 overflow-hidden shadow-sm">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar flex flex-col p-0.5">
                  {dataset.columns?.map((col, idx) => (
                    <div
                      key={col.name}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-bg-raised transition-colors border border-transparent hover:border-border-muted"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-black text-text-quaternary w-5 flex justify-center bg-bg-base/50 rounded-md py-0.5 border border-border-muted group-hover:text-accent group-hover:border-accent/30 group-hover:bg-accent/5 transition-all">
                          {idx + 1}
                        </span>
                        <span className="text-[12px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                          {col.name}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded-lg bg-bg-base border border-border-default text-text-quaternary uppercase tracking-wider group-hover:border-accent/20 group-hover:text-accent transition-all group-hover:shadow-sm">
                        {col.dtype || "string"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-bg-surface to-bg-raised border border-border-default rounded-2xl p-4 flex flex-col gap-3 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet/5 rounded-full blur-2xl pointer-events-none" />
              <h4 className="text-[10px] font-black text-text-quaternary uppercase tracking-widest flex items-center gap-2 relative z-10">
                <Calendar size={12} className="text-violet/70" />
                History Elements
              </h4>
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex justify-between items-center text-[11px] bg-bg-base p-2 rounded-xl border border-border-muted/50">
                  <span className="text-text-tertiary font-bold">Registered</span>
                  <span className="text-text-secondary font-black font-mono tracking-wide">
                    {new Date(dataset.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] bg-bg-base p-2 rounded-xl border border-border-muted/50">
                  <span className="text-text-tertiary font-bold">Last Modified</span>
                  <span className="text-text-secondary font-black font-mono tracking-wide">
                    {new Date(dataset.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </section>

            {dataset.source_type === "db" && (
              <section className="bg-bg-surface border border-border-default rounded-2xl p-4 flex flex-col gap-3 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-text-quaternary uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} className="text-accent" />
                    Database Health
                  </h4>
                  <button
                    onClick={() => checkStatus()}
                    disabled={dbStatus.checking}
                    className={`p-1.5 rounded-lg border border-border-muted hover:bg-bg-raised transition-all ${
                      dbStatus.checking ? "animate-spin opacity-50" : "hover:text-accent"
                    }`}
                    title="Check status / Wake up DB"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    dbStatus.checking 
                      ? "bg-bg-raised border-border-muted animate-pulse" 
                      : dbStatus.active 
                        ? "bg-emerald/5 border-emerald/20" 
                        : dbStatus.active === false
                          ? "bg-rose/5 border-rose/20"
                          : "bg-bg-raised border-border-muted"
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      dbStatus.checking 
                        ? "bg-text-quaternary/10 text-text-quaternary" 
                        : dbStatus.active 
                          ? "bg-emerald/20 text-emerald" 
                          : dbStatus.active === false
                            ? "bg-rose/20 text-rose"
                            : "bg-text-quaternary/10 text-text-quaternary"
                    }`}>
                      {dbStatus.checking ? (
                         <RefreshCw size={14} className="animate-spin" />
                      ) : dbStatus.active ? (
                        <Zap size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-text-primary">
                        {dbStatus.checking ? "Checking database..." : dbStatus.active ? "Database Active" : dbStatus.active === false ? "Database Sleeping / Offline" : "Status Unknown"}
                      </span>
                      <span className="text-[10px] text-text-tertiary truncate">
                        {dbStatus.message || (dbStatus.active ? "Ready for queries" : "Click refresh to wake up instance")}
                      </span>
                    </div>
                  </div>

                  {dbStatus.active === false && (
                    <p className="text-[9px] text-text-quaternary leading-relaxed bg-bg-base/50 p-2 rounded-lg border border-border-muted italic">
                      Note: Serverless instances may take up to 30 seconds to wake up on the first request after being idle.
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Side: Data Preview */}
          <div className="xl:col-span-9 flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[14px] font-black text-text-primary flex items-center gap-2">
                <div className="p-1 rounded-md bg-emerald/10 text-emerald">
                   <Table2 size={14} />
                </div>
                Live Data Preview
              </h3>
              <div className="flex items-center gap-2">
                 <button 
                    className="text-[10px] font-bold text-text-tertiary hover:text-emerald flex items-center gap-1.5 transition-colors bg-bg-surface px-2.5 py-1 rounded-md border border-border-muted hover:border-emerald/30 shadow-sm"
                    onClick={() => navigate(`/custom?dataset=${id}`)}
                 >
                    <ExternalLink size={10} />
                    Open in Query
                 </button>
              </div>
            </div>

            <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-sm p-1 flex-1 relative min-h-0">
              <div className="absolute inset-1 rounded-xl overflow-hidden">
                <DataPreview datasetId={id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = "accent", subtext }) {
  const colorMap = {
    accent: { text: "text-accent", bg: "bg-accent/10", border: "border-accent/20", glow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:border-accent/40" },
    emerald: { text: "text-emerald", bg: "bg-emerald/10", border: "border-emerald/20", glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group-hover:border-emerald/40" },
    violet: { text: "text-violet", bg: "bg-violet/10", border: "border-violet/20", glow: "group-hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] group-hover:border-violet/40" },
    rose: { text: "text-rose", bg: "bg-rose/10", border: "border-rose/20", glow: "group-hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] group-hover:border-rose/40" },
  };

  const theme = colorMap[color];

  return (
    <div className={`group bg-bg-surface border border-border-default rounded-2xl p-4 transition-all duration-500 hover:-translate-y-0.5 ${theme.glow} relative overflow-hidden`}>
      {/* Background elegant gradient blob */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${theme.bg}`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-quaternary transition-colors group-hover:text-text-tertiary">
            {label}
          </span>
          <div className="text-xl font-black text-text-primary tracking-tight">
            {value}
          </div>
          {subtext && (
            <span className="text-[9px] text-text-quaternary font-medium mt-0.5">
              {subtext}
            </span>
          )}
        </div>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-500 shadow-sm ${theme.bg} ${theme.text} ${theme.border} group-hover:scale-110 group-hover:-rotate-3`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
