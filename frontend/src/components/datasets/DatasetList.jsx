import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Trash2, Table2, ArrowRight } from "lucide-react";
import { listDatasets, deleteDataset } from "../../lib/api";
import { Badge, Button, EmptyState } from "../ui";
import { SkeletonCard } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import { useConfirm } from "../ui/ConfirmDialog";

export default function DatasetList({ onRefresh }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} rows={2} />
        ))}
      </div>
    );
  }

  // Filter out query-generated virtual datasets
  const realDatasets = datasets.filter((ds) => !ds.is_virtual);

  if (realDatasets.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="No datasets yet"
        description="Upload a CSV or Excel file to get started with SQL queries and visualizations."
        action={() => navigate("/upload")}
        actionLabel="Upload Dataset"
      />
    );
  }

  return (
    <div className="bg-[#121528] rounded-2xl border border-white/[0.08] overflow-hidden shadow-lg shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1a1e36] border-b border-white/[0.08]">
              <th className="py-5 px-6 text-[0.8rem] font-bold text-[#8b91b8] uppercase tracking-wider">
                Dataset Name
              </th>
              <th className="py-5 px-6 text-[0.8rem] font-bold text-[#8b91b8] uppercase tracking-wider">
                Original File
              </th>
              <th className="py-5 px-6 text-[0.8rem] font-bold text-[#8b91b8] uppercase tracking-wider text-right">
                Rows
              </th>
              <th className="py-5 px-6 text-[0.8rem] font-bold text-[#8b91b8] uppercase tracking-wider text-right">
                Columns
              </th>
              <th className="py-5 px-6 text-[0.8rem] font-bold text-[#8b91b8] uppercase tracking-wider text-right">
                Size
              </th>
              <th className="py-5 px-6 text-[0.8rem] font-bold text-[#8b91b8] uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {realDatasets.map((ds) => {
              const fileSize =
                ds.file_size < 1024 * 1024
                  ? `${(ds.file_size / 1024).toFixed(1)} KB`
                  : `${(ds.file_size / (1024 * 1024)).toFixed(1)} MB`;

              return (
                <tr
                  key={ds.id}
                  className="group hover:bg-white/[0.02] border-b border-white/[0.04] last:border-b-0 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dataset/${ds.id}`)}
                >
                  {/* Dataset Name with Icon */}
                  <td className="py-5 px-6 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#5c62ec]/10 border border-[#5c62ec]/20 flex items-center justify-center shrink-0">
                        <Table2 size={16} className="text-[#5c62ec]" />
                      </div>
                      <div className="font-[family-name:var(--font-family-heading)] font-semibold text-[1.05rem] text-white">
                        {ds.name}
                      </div>
                    </div>
                  </td>

                  <td className="py-5 px-6 align-middle">
                    <span className="text-[0.9rem] text-[#a1a9cc] font-medium">
                      {ds.original_filename}
                    </span>
                  </td>

                  <td className="py-5 px-6 text-right align-middle">
                    <span className="text-[0.9rem] text-[#f1f3f9] font-mono font-medium">
                      {ds.row_count?.toLocaleString() || "—"}
                    </span>
                  </td>

                  <td className="py-5 px-6 text-right align-middle">
                    <span className="text-[0.9rem] text-[#f1f3f9] font-mono font-medium">
                      {ds.columns?.length || "—"}
                    </span>
                  </td>

                  <td className="py-5 px-6 text-right align-middle">
                    <span className="text-[0.9rem] text-[#f1f3f9] font-mono font-medium">
                      {fileSize}
                    </span>
                  </td>

                  <td className="py-5 px-6 text-right align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2.5 rounded-xl text-[#8b91b8] hover:text-[#5c62ec] hover:bg-[#5c62ec]/15 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dataset/${ds.id}`);
                        }}
                        title="View Details"
                      >
                        <ArrowRight size={18} strokeWidth={2.5} />
                      </button>

                      <button
                        className="p-2.5 rounded-xl text-[#8b91b8] hover:text-[#f43f5e] hover:bg-[#f43f5e]/15 transition-all"
                        onClick={(e) => handleDelete(e, ds.id, ds.name)}
                        title="Delete dataset"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
