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
} from "lucide-react";
import { getDataset, deleteDataset } from "../lib/api";
import DataPreview from "../components/datasets/DataPreview";

export default function DatasetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDataset(id)
      .then(setDataset)
      .catch((err) => {
        console.error("Failed to load dataset:", err);
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

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

      <div className="flex-1 p-6 md:p-10 max-w-[1400px] mx-auto w-full flex flex-col gap-10">
        {/* ── Header Section ────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-muted flex items-center justify-center shrink-0 shadow-inner">
              <Database size={24} className="text-accent" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-2xl font-black text-text-primary tracking-tight">
                {dataset.name}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black tracking-widest text-accent uppercase bg-accent-muted px-2 py-0.5 rounded-full border border-accent/20">
                  {sourceType}
                </span>
                <span className="text-[12px] text-text-tertiary font-medium font-mono">
                  [{dataset.original_filename}]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Side: Metadata & Schema */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-text-primary flex items-center gap-2">
                  <Table2 size={16} className="text-accent" />
                  Table Schema
                </h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-quaternary bg-bg-surface px-2 py-0.5 rounded border border-border-muted">
                  {dataset.columns?.length} FIELDS
                </span>
              </div>

              <div className="bg-bg-surface border border-border-default rounded-2xl p-1 overflow-hidden shadow-sm">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  {dataset.columns?.map((col, idx) => (
                    <div
                      key={col.name}
                      className="group flex items-center justify-between p-3 hover:bg-accent-muted/5 transition-colors border-b last:border-0 border-border-muted"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-text-quaternary w-4">
                          {idx + 1}
                        </span>
                        <span className="text-[13px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                          {col.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-bg-muted border border-border-strong text-text-quaternary uppercase tracking-wider group-hover:border-accent/30 group-hover:text-text-tertiary transition-all">
                        {col.dtype || "string"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-bg-surface to-bg-raised border border-border-default rounded-2xl p-5 flex flex-col gap-3">
              <h4 className="text-[12px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} className="text-text-quaternary" />
                History
              </h4>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-text-tertiary">Registered</span>
                  <span className="text-text-secondary font-medium font-mono">
                    {new Date(dataset.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-text-tertiary">Last Modified</span>
                  <span className="text-text-secondary font-medium font-mono">
                    {new Date(dataset.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Side: Data Preview */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-text-primary flex items-center gap-2">
                <Table2 size={16} className="text-emerald" />
                Live Data Preview
              </h3>
              <div className="flex items-center gap-2">
                 <button 
                    className="text-[11px] text-text-tertiary hover:text-text-secondary flex items-center gap-1.5 transition-colors"
                    onClick={() => navigate(`/custom?dataset=${id}`)}
                 >
                    <ExternalLink size={12} />
                    Open in Query
                 </button>
              </div>
            </div>

            <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-glow-accent/5">
              <DataPreview datasetId={id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = "accent", subtext }) {
  const colorMap = {
    accent: "text-accent bg-accent/10 border-accent/20",
    emerald: "text-emerald bg-emerald/10 border-emerald/20",
    violet: "text-violet bg-violet/10 border-violet/20",
    rose: "text-rose bg-rose/10 border-rose/20",
  };

  return (
    <div className="group bg-bg-surface border border-border-default rounded-2xl p-5 hover:border-accent/30 hover:shadow-glow-accent transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-text-quaternary transition-colors group-hover:text-text-tertiary">
            {label}
          </span>
          <div className="text-xl font-black text-text-primary tracking-tight">
            {value}
          </div>
          {subtext && (
            <span className="text-[10px] text-text-quaternary font-medium mt-1">
              {subtext}
            </span>
          )}
        </div>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${colorMap[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
