import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Database,
  Upload,
  Globe,
  Network,
  Cpu,
  Search,
} from "lucide-react";
import DatasetList from "../components/datasets/DatasetList";
import { listDatasets } from "../lib/api";
import { PageContainer } from "../components/ui";
import DbConnectModal from "../components/datasets/DbConnectModal";
import UrlImportModal from "../components/datasets/UrlImportModal";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
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

  return (
    <div className="flex-1 bg-bg-base overflow-y-auto custom-scrollbar">
      <PageContainer wide>
        <div className="flex flex-col gap-10 py-10 animate-fade-in max-w-(--width-container-wide) mx-auto">
          
          {/* Page Header & Search Row */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[22px] bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/5">
                <Database size={32} className="text-accent" strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="font-heading text-[32px] font-black text-text-primary tracking-tight">
                  Data Sources
                </h2>
                <p className="text-[15px] text-text-tertiary mt-1 font-medium italic">
                  Connect and manage your data architecture
                </p>
              </div>
            </div>

            {/* Global Search in Header Area */}
            <div className="relative group w-full xl:w-96">
              <Search
                size={18}
                style={{ left: '16px' }}
                className="absolute top-1/2 -translate-y-1/2 text-text-quaternary group-focus-within:text-accent transition-colors"
                strokeWidth={2}
              />
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '48px' }}
                className="w-full pr-6 py-3.5 bg-bg-surface border border-border-default rounded-2xl text-[14px] text-text-primary placeholder-text-quaternary outline-none focus:border-accent transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/upload")}
              className="group flex flex-col p-6 rounded-[24px] bg-bg-surface border border-border-muted hover:border-accent/40 transition-all shadow-sm hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent-muted flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Upload size={22} className="text-accent" />
              </div>
              <h3 className="text-[16px] font-bold text-text-primary mb-1">Upload File</h3>
              <p className="text-[13px] text-text-tertiary leading-relaxed">Import CSV or Excel files from your local drive.</p>
            </button>

            <button
              onClick={() => setShowUrlModal(true)}
              className="group flex flex-col p-6 rounded-[24px] bg-bg-surface border border-border-muted hover:border-emerald/40 transition-all shadow-sm hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-muted flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Globe size={22} className="text-emerald" />
              </div>
              <h3 className="text-[16px] font-bold text-text-primary mb-1">Import URL</h3>
              <p className="text-[13px] text-text-tertiary leading-relaxed">Fetch dynamic data from external JSON or CSV endpoints.</p>
            </button>

            <button
              onClick={() => setShowDbModal(true)}
              className="group flex flex-col p-6 rounded-[24px] bg-bg-surface border border-border-muted hover:border-violet/40 transition-all shadow-sm hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-muted flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Network size={22} className="text-violet" />
              </div>
              <h3 className="text-[16px] font-bold text-text-primary mb-1">Database</h3>
              <p className="text-[13px] text-text-tertiary leading-relaxed">Bridge your Postgres or MySQL databases directly.</p>
            </button>

            <button
              onClick={() => navigate("/api")}
              className="group flex flex-col p-6 rounded-[24px] bg-bg-surface border border-border-muted hover:border-blue-500/40 transition-all shadow-sm hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1 text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Cpu size={22} className="text-blue-500" />
              </div>
              <h3 className="text-[16px] font-bold text-text-primary mb-1">API Engine</h3>
              <p className="text-[13px] text-text-tertiary leading-relaxed">Explore and transform complex API responses.</p>
            </button>
          </div>

          {/* Main List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-quaternary">Source Registry</span>
                <div className="h-px w-12 bg-border-muted" />
              </div>
            </div>
            <div className="bg-bg-surface rounded-3xl border border-border-muted p-2 shadow-sm overflow-hidden">
              <DatasetList
                key={refreshKey}
                searchQuery={searchQuery}
                onRefresh={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </div>
        </div>
      </PageContainer>

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
