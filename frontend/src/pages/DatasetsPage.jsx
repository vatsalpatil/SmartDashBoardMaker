import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Database,
  Upload,
  Table2,
  Globe,
  Network,
  Cpu,
  Search,
  Trash2,
} from "lucide-react";
import DatasetList from "../components/datasets/DatasetList";
import { listDatasets } from "../lib/api";
import { Button } from "../components/ui";
import { PageContainer } from "../components/ui";
import DbConnectModal from "../components/datasets/DbConnectModal";
import UrlImportModal from "../components/datasets/UrlImportModal";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDbModal, setShowDbModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);

  const navigate = useNavigate();

  const fetchDatasets = async () => {
    try {
      const data = await listDatasets();
      setDatasets(data.datasets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [refreshKey]);

  const realDatasets = datasets.filter((ds) => !ds.is_virtual);
  const filteredDatasets = realDatasets.filter((ds) =>
    ds.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-bg-base overflow-hidden">
      {/* Sidebar with Real Data */}
      <div className="w-[280px] border-r border-border-muted bg-bg-surface flex flex-col shrink-0">
        <div className="p-6 border-b border-border-muted flex items-center justify-between">
          <div className="uppercase text-[11px] font-bold tracking-[0.2em] text-text-quaternary">
            Your Datasets
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded-lg text-text-quaternary hover:text-text-primary hover:bg-bg-muted transition-all"
          >
            <Database size={14} />
          </button>
        </div>

        <div className="p-4 border-b border-border-muted">
          <div className="relative group">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-quaternary group-focus-within:text-accent transition-colors"
            />
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-raised border border-border-default rounded-xl text-[13px] text-text-primary placeholder-text-quaternary outline-none focus:border-accent transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="px-4 py-8 text-center text-text-quaternary text-[13px]">
              Loading datasets...
            </div>
          ) : filteredDatasets.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-quaternary text-[12px] italic">
              {searchQuery ? "No matches found" : "No datasets yet"}
            </div>
          ) : (
            filteredDatasets.map((ds) => (
              <div
                key={ds.id}
                onClick={() => {
                  setSelectedId(ds.id);
                  navigate(`/dataset/${ds.id}`);
                }}
                className={[
                  "group flex items-center gap-3 px-4 py-[11px] rounded-xl cursor-pointer transition-all duration-200",
                  selectedId === ds.id
                    ? "bg-accent/10 border border-accent/30 shadow-sm"
                    : "border border-transparent hover:bg-bg-muted hover:border-border-default",
                ].join(" ")}
              >
                <div
                  className={[
                    "w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 transition-all",
                    selectedId === ds.id
                      ? "bg-accent text-white"
                      : "bg-bg-raised border border-border-default text-text-quaternary group-hover:text-text-secondary group-hover:border-border-default",
                  ].join(" ")}
                >
                  <Table2 size={14} strokeWidth={selectedId === ds.id ? 2.5 : 2} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span
                    className={[
                      "font-medium text-[13.5px] truncate",
                      selectedId === ds.id ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary",
                    ].join(" ")}
                  >
                    {ds.name}
                  </span>
                  {ds.row_count > 0 && (
                    <span className="text-[10px] text-text-quaternary font-medium">
                      {ds.row_count.toLocaleString()} rows
                    </span>
                  )}
                </div>
                
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${ds.name}"?`)) {
                      const { deleteDataset } = await import("../lib/api");
                      try {
                        await deleteDataset(ds.id);
                        setRefreshKey(k => k + 1);
                        if (selectedId === ds.id) setSelectedId(null);
                      } catch (err) {
                        alert("Failed to delete dataset");
                      }
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-quaternary hover:text-rose hover:bg-rose-muted transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-bg-base relative min-w-0">
        <PageContainer wide>
          <div className="flex flex-col gap-10 py-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-[18px] bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/5">
                    <Database size={24} className="text-accent" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="font-heading text-[28px] font-extrabold text-text-primary tracking-tight">
                      Data Sources
                    </h2>
                    <p className="text-[14px] text-text-tertiary mt-0.5">
                      Connect and manage your data from multiple channels
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="flex flex-wrap items-center gap-3 lg:w-auto">
                <button
                  onClick={() => navigate("/upload")}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-[12px] bg-[#0a1120] border border-cyan-500/20 hover:border-cyan-500/40 transition-all shadow-sm"
                >
                  <Upload size={18} className="text-cyan-400" />
                  <span className="text-[14px] font-medium text-cyan-400">
                    Upload File
                  </span>
                </button>

                <button
                  onClick={() => setShowUrlModal(true)}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-[12px] bg-[#0a1120] border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-sm"
                >
                  <Globe size={18} className="text-emerald-500" />
                  <span className="text-[14px] font-medium text-emerald-500">
                    Import from URL
                  </span>
                </button>

                <button
                  onClick={() => setShowDbModal(true)}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-[12px] bg-[#0a1120] border border-purple-500/20 hover:border-purple-500/40 transition-all shadow-sm"
                >
                  <Network size={18} className="text-purple-400" />
                  <span className="text-[14px] font-medium text-purple-400">
                    Connect Database
                  </span>
                </button>

                <button
                  onClick={() => navigate("/api")}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-[12px] bg-[#0a1120] border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-sm"
                >
                  <Cpu size={18} className="text-blue-500" />
                  <span className="text-[14px] font-medium text-blue-500">
                    API
                  </span>
                </button>
              </div>
            </div>

            {/* Main List Section */}
            <div className="bg-bg-surface rounded-2xl border border-border-muted p-2 shadow-sm">
              <DatasetList
                key={refreshKey}
                onRefresh={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Modals */}
      {showDbModal && (
        <DbConnectModal
          onClose={() => setShowDbModal(false)}
          onSuccess={() => {
            setShowDbModal(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
      {showUrlModal && (
        <UrlImportModal
          onClose={() => setShowUrlModal(false)}
          onSuccess={() => {
            setShowUrlModal(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
