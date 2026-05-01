import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Trash2, Table2, ArrowRight, RefreshCw, Edit3 } from "lucide-react";
import { listDatasets, deleteDataset, updateDataset, refreshExternalDataset } from "../../lib/api";
import { Badge, Button, EmptyState } from "../ui";
import { SkeletonCard } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import { useConfirm } from "../ui/ConfirmDialog";

export default function DatasetList({ searchQuery = "", onRefresh, onEdit }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingIds, setRefreshingIds] = useState(new Set());
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const fetchDatasets = async () => {
    try {
      const data = await listDatasets();
      setDatasets(data.datasets || []);
    } catch {
      toast.error("Failed to load datasets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "Delete Dataset?",
      message: `"${name}" will be permanently deleted. All associated queries and visualizations will also be removed.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await deleteDataset(id);
      setDatasets((ds) => ds.filter((d) => d.id !== id));
      onRefresh?.();
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error("Failed to delete dataset");
    }
  };

  const handleRefresh = async (e, id, name) => {
    e.stopPropagation();
    setRefreshingIds(prev => new Set(prev).add(id));
    toast.info(`Refreshing "${name}"...`);
    try {
      await refreshExternalDataset(id);
      await fetchDatasets();
      toast.success(`"${name}" metadata refreshed`);
    } catch {
      toast.error("Failed to refresh dataset");
    } finally {
      setRefreshingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleEditAction = async (e, ds) => {
    e.stopPropagation();
    // Try environment-specific edit first
    const result = onEdit?.(ds);
    
    // Fallback to simple rename if requested or if no specific env exists
    if (result === "rename" || (!onEdit && ds.source_type === 'file')) {
      const newName = window.prompt("Enter new dataset name:", ds.name);
      if (!newName || newName === ds.name) return;

      try {
        await updateDataset(ds.id, { name: newName });
        setDatasets((all) => all.map((d) => (d.id === ds.id ? { ...d, name: newName } : d)));
        toast.success("Dataset renamed");
      } catch {
        toast.error("Failed to rename dataset");
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} rows={2} />
        ))}
      </div>
    );
  }

  // Filter out query-generated virtual datasets and apply search
  const filteredDatasets = datasets
    .filter((ds) => !ds.is_virtual)
    .filter((ds) => 
      ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (filteredDatasets.length === 0) {
    return (
      <div className="py-20">
        <EmptyState
          icon={Database}
          title={searchQuery ? "No matches found" : "No datasets yet"}
          description={searchQuery ? "Try a different search term" : "Upload a CSV or Excel file to get started."}
          action={() => navigate("/upload")}
          actionLabel="Upload Dataset"
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar-mini">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-bg-raised/50 border-b border-border-muted">
            <th className="py-5 px-6 text-[11px] font-black text-text-quaternary uppercase tracking-widest">
              Dataset Identity
            </th>
            <th className="py-5 px-6 text-[11px] font-black text-text-quaternary uppercase tracking-widest">
              Origin
            </th>
            <th className="py-5 px-6 text-[11px] font-black text-text-quaternary uppercase tracking-widest text-right">
              Volume
            </th>
            <th className="py-5 px-6 text-[11px] font-black text-text-quaternary uppercase tracking-widest text-right">
              Attributes
            </th>
            <th className="py-5 px-6 text-[11px] font-black text-text-quaternary uppercase tracking-widest text-right">
              Storage
            </th>
            <th className="py-5 px-6 text-[11px] font-black text-text-quaternary uppercase tracking-widest text-right px-8">
              Management
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredDatasets.map((ds) => {
            const fileSize =
              ds.file_size < 1024 * 1024
                ? `${(ds.file_size / 1024).toFixed(1)} KB`
                : `${(ds.file_size / (1024 * 1024)).toFixed(1)} MB`;

            return (
              <tr
                key={ds.id}
                className="group hover:bg-bg-muted/30 border-b border-border-muted last:border-b-0 transition-all cursor-pointer"
                onClick={() => navigate(`/dataset/${ds.id}`)}
              >
                {/* Dataset Name with Icon */}
                <td className="py-5 px-6 align-middle">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-accent-muted border border-accent/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <Table2 size={18} className="text-accent" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[15px] text-text-primary group-hover:text-accent transition-colors truncate">
                        {ds.name}
                      </span>
                      <span className="text-[10px] text-text-quaternary font-mono uppercase tracking-wider">
                        ID: {ds.id.split('-')[0]}...
                      </span>
                    </div>
                  </div>
                </td>

                <td className="py-5 px-6 align-middle">
                  <span className="text-[13px] text-text-tertiary font-medium">
                    {ds.original_filename || "Database Connection"}
                  </span>
                </td>

                <td className="py-5 px-6 text-right align-middle">
                  <span className="text-[14px] text-text-secondary font-mono font-bold">
                    {ds.row_count?.toLocaleString() || "—"}
                  </span>
                </td>

                <td className="py-5 px-6 text-right align-middle">
                  <span className="text-[14px] text-text-secondary font-mono font-bold">
                    {ds.columns?.length || "—"}
                  </span>
                </td>

                <td className="py-5 px-6 text-right align-middle">
                  <span className="text-[13px] text-text-secondary font-mono">
                    {fileSize}
                  </span>
                </td>

                <td className="py-5 px-8 text-right align-middle">
                  <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    {/* Refresh (only for external) */}
                    {(ds.source_type === "url" || ds.source_type === "db") && (
                      <button
                        className="w-9 h-9 rounded-xl bg-bg-muted text-text-tertiary hover:text-emerald hover:bg-emerald-muted transition-all flex items-center justify-center border border-border-muted"
                        onClick={(e) => handleRefresh(e, ds.id, ds.name)}
                        title="Refresh metadata"
                        disabled={refreshingIds.has(ds.id)}
                      >
                        <RefreshCw 
                          size={16} 
                          className={refreshingIds.has(ds.id) ? "animate-spin text-emerald" : ""} 
                        />
                      </button>
                    )}

                    {/* Edit/Rename */}
                    <button
                      className="w-9 h-9 rounded-xl bg-bg-muted text-text-tertiary hover:text-violet hover:bg-violet-muted transition-all flex items-center justify-center border border-border-muted"
                      onClick={(e) => handleEditAction(e, ds)}
                      title="Edit dataset"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      className="w-9 h-9 rounded-xl bg-bg-muted text-text-tertiary hover:text-accent hover:bg-accent-muted transition-all flex items-center justify-center border border-border-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dataset/${ds.id}`);
                      }}
                      title="View Details"
                    >
                      <ArrowRight size={18} />
                    </button>

                    <button
                      className="w-9 h-9 rounded-xl bg-bg-muted text-text-tertiary hover:text-rose hover:bg-rose-muted transition-all flex items-center justify-center border border-border-muted"
                      onClick={(e) => handleDelete(e, ds.id, ds.name)}
                      title="Delete dataset"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
