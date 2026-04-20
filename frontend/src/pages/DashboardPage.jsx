import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  LayoutDashboard,
  Trash2,
  Edit3,
  Save,
  X,
  Eye,
  Monitor,
  RefreshCw,
  Clock,
  Pause,
  Play,
  Palette,
} from "lucide-react";
import {
  listDashboards,
  createDashboard,
  deleteDashboard,
  updateDashboard,
  listVisualizations,
} from "../lib/api";
import ThemePanel from "../components/layout/ThemePanel";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import GlobalFilters from "../components/dashboard/GlobalFilters";
import {
  Card,
  Button,
  Badge,
  Modal,
  EmptyState,
  Spinner,
  PageContainer,
} from "../components/ui";
import { Input, Textarea } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import { useConfirm } from "../components/ui/ConfirmDialog";

// ── Auto Refresh intervals ────────────────────────────────────────────────
const REFRESH_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "5 sec", value: 5 },
  { label: "30 sec", value: 30 },
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
];

function useAutoRefresh(intervalSec, onRefresh) {
  const timerRef = useRef(null);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!intervalSec) return;
    timerRef.current = setInterval(() => cb.current(), intervalSec * 1000);
    return () => clearInterval(timerRef.current);
  }, [intervalSec]);
}

// ── Present (full-screen) mode overlay ───────────────────────────────────
function PresentMode({
  dashboard,
  filters,
  onExit,
  refreshSignal,
  activeTabId,
  setActiveTabId,
  refreshInterval,
  setRefreshInterval,
  onRefresh,
  lastRefreshed,
  onThemeOpen,
}) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onExit();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onExit]);

  // Find the widgets for the active tab
  const currentTabWidgets = (dashboard?.widgets || []).filter(
    (w) =>
      w.tabId === activeTabId ||
      (!w.tabId && activeTabId === (dashboard?.tabs?.[0]?.id || "default")),
  );

  return (
    <div className="fixed inset-0 z-[3000] bg-bg-base flex flex-col overflow-hidden animate-fade-in">
      {/* Enhanced top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-bg-surface border-b border-border-default backdrop-blur-md shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-4 border-r border-border-muted">
            <LayoutDashboard size={18} className="text-accent" />
            <span className="text-[16px] font-bold text-text-primary">
              {dashboard.name}
            </span>
          </div>

          {/* Tabs in Present Mode */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar-mini py-0.5">
            {(dashboard.tabs || []).map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={[
                    "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                    isActive
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "text-text-tertiary hover:bg-white/5 hover:text-text-secondary pr-2",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Refresh Controls */}
          <div className="flex items-center gap-2 group px-3 py-1.5 rounded-full bg-bg-base/50 border border-border-muted">
            <RefreshCw
              size={12}
              className={`text-accent ${refreshInterval > 0 ? "animate-spin" : ""}`}
              style={{ animationDuration: "3s" }}
            />
            <select
              className="bg-transparent text-[11px] font-bold text-text-secondary outline-none cursor-pointer appearance-none px-1"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              {REFRESH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-bg-surface">
                  {o.label}
                </option>
              ))}
            </select>
            <button
              className="ml-1 text-text-quaternary hover:text-accent transition-colors"
              onClick={onRefresh}
            >
              <Play size={10} />
            </button>
          </div>

          {/* Clock */}
          {lastRefreshed && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-base/50 border border-border-muted">
              <Clock size={12} className="text-text-quaternary" />
              <span className="text-[11px] font-mono text-text-tertiary">
                {lastRefreshed.toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Theme Selector */}
          <button
            onClick={onThemeOpen}
            className="flex items-center justify-center w-8 h-8 rounded-full text-text-tertiary hover:text-emerald hover:bg-emerald/10 border border-transparent hover:border-emerald/20 transition-all"
            title="Theme Settings"
          >
            <Palette size={16} />
          </button>

          <div className="h-6 w-px bg-border-muted mx-1" />

          {/* Exit Button */}
          <button
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose/10 hover:bg-rose/20 text-rose text-[12px] font-bold border border-rose/20 transition-all"
            onClick={onExit}
          >
            <X size={14} /> Exit (ESC)
          </button>
        </div>
      </div>

      {/* Full widget grid */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-bg-base">
        <DashboardGrid
          widgets={currentTabWidgets}
          layout={dashboard.layout || []}
          filters={filters}
          onLayoutChange={() => {}}
          onRemoveWidget={() => {}}
          editing={false}
          refreshSignal={refreshSignal}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [dashboards, setDashboards] = useState([]);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [availableVizs, setAvailableVizs] = useState([]);
  const [creating, setCreating] = useState(false);

  // Present mode
  const [presenting, setPresenting] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  // Auto-refresh
  const [refreshInterval, setRefreshInterval] = useState(0); // seconds, 0 = off
  const [refreshSignal, setRefreshSignal] = useState(0); // bump to trigger re-fetch
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const doRefresh = useCallback(() => {
    setRefreshSignal((n) => n + 1);
    setLastRefreshed(new Date());
  }, []);

  useAutoRefresh(refreshInterval, doRefresh);

  const [activeTabId, setActiveTabId] = useState(null);



  useEffect(() => {
    loadDashboards();
    listVisualizations()
      .then((d) => setAvailableVizs(d.visualizations || []))
      .catch(console.error);
  }, []);

  const loadDashboards = async () => {
    try {
      const data = await listDashboards();
      setDashboards(data.dashboards || []);
    } catch {
      toast.error("Failed to load dashboards");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const dash = await createDashboard({
        name: newName,
        description: newDesc,
        widgets: [],
        global_filters: [],
      });
      setDashboards((ds) => [dash, ...ds]);
      setActiveDashboard(dash);
      setEditing(true);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      toast.success(`Dashboard "${dash.name}" created`);
    } catch {
      toast.error("Failed to create dashboard");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: "Delete Dashboard?",
      message: `"${name}" and all its widgets will be removed.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteDashboard(id);
      setDashboards((ds) => ds.filter((d) => d.id !== id));
      if (activeDashboard?.id === id) setActiveDashboard(null);
      toast.success("Dashboard deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  useEffect(() => {
    if (
      activeDashboard &&
      (!activeDashboard.tabs || activeDashboard.tabs.length === 0)
    ) {
      const updated = {
        ...activeDashboard,
        tabs: [{ id: "default", label: "Primary" }],
      };
      setActiveDashboard(updated);
      setActiveTabId("default");
    } else if (activeDashboard?.tabs?.length > 0 && !activeTabId) {
      setActiveTabId(activeDashboard.tabs[0].id);
    }
  }, [activeDashboard?.id]);

  const handleAddTab = async () => {
    if (!activeDashboard) return;
    const newId = crypto.randomUUID();
    const newTabs = [
      ...(activeDashboard.tabs || []),
      { id: newId, label: "New Tab" },
    ];
    try {
      const updated = await updateDashboard(activeDashboard.id, {
        tabs: newTabs,
      });
      setActiveDashboard(updated);
      setActiveTabId(newId);
      toast.success("Tab added");
    } catch {
      toast.error("Failed to add tab");
    }
  };

  const handleRenameTab = async (tabId, newLabel) => {
    const newTabs = activeDashboard.tabs.map((t) =>
      t.id === tabId ? { ...t, label: newLabel } : t,
    );
    try {
      const updated = await updateDashboard(activeDashboard.id, {
        tabs: newTabs,
      });
      setActiveDashboard(updated);
    } catch {
      toast.error("Failed to rename tab");
    }
  };

  const handleRemoveTab = async (tabId) => {
    if (activeDashboard.tabs.length <= 1) return;
    const ok = await confirm({
      title: "Remove Tab?",
      message: "All widgets in this tab will be uncategorized.",
      variant: "danger",
    });
    if (!ok) return;
    const newTabs = activeDashboard.tabs.filter((t) => t.id !== tabId);
    try {
      const updated = await updateDashboard(activeDashboard.id, {
        tabs: newTabs,
      });
      setActiveDashboard(updated);
      setActiveTabId(newTabs[0].id);
    } catch {
      toast.error("Failed to remove tab");
    }
  };

  const handleAddWidget = async (vizId) => {
    if (!activeDashboard) return;
    const newWidgets = [
      ...(activeDashboard.widgets || []),
      {
        id: crypto.randomUUID(),
        viz_id: vizId,
        tabId: activeTabId,
        layout: {},
      },
    ];
    try {
      const updated = await updateDashboard(activeDashboard.id, {
        widgets: newWidgets,
      });
      setActiveDashboard(updated);
      setShowAddWidget(false);
      toast.success("Widget added");
    } catch {
      toast.error("Failed to add widget");
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveWidget = async (gridKeyToRemove) => {
    if (!activeDashboard) return;
    const keyMap = new Map();
    currentTabWidgets.forEach((w, idx) => {
      keyMap.set(w, w.id || `${w.viz_id}_${idx}`);
    });
    const newWidgets = activeDashboard.widgets.filter((w) => {
      const gridKey = keyMap.get(w);
      if (!gridKey) return true;
      return gridKey !== gridKeyToRemove;
    });
    try {
      const updated = await updateDashboard(activeDashboard.id, {
        widgets: newWidgets,
      });
      setActiveDashboard(updated);
    } catch {
      console.error("Remove widget failed");
    }
  };

  const handleLayoutChange = async (newLayout) => {
    if (!activeDashboard || !editing) return;
    const masterLayout = [...(activeDashboard.layout || [])];
    newLayout.forEach((item) => {
      const idx = masterLayout.findIndex((l) => l.i === item.i);
      if (idx >= 0) masterLayout[idx] = item;
      else masterLayout.push(item);
    });
    try {
      await updateDashboard(activeDashboard.id, { layout: masterLayout });
      setActiveDashboard((prev) => ({ ...prev, layout: masterLayout }));
    } catch {
      console.error("Layout save failed");
    }
  };

  const handleFilterChange = async (filters) => {
    if (!activeDashboard) return;
    try {
      const updated = await updateDashboard(activeDashboard.id, {
        global_filters: filters,
      });
      setActiveDashboard(updated);
    } catch {
      console.error("Filter save failed");
    }
  };

  const currentTabWidgets = (activeDashboard?.widgets || []).filter(
    (w) =>
      w.tabId === activeTabId ||
      (!w.tabId &&
        activeTabId === (activeDashboard?.tabs?.[0]?.id || "default")),
  );

  // ── Dashboard List ────────────────────────────────────────────────────────
  if (!activeDashboard) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-12 animate-fade-in w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[28px] font-bold text-text-primary tracking-tight">
                Dashboards
              </h2>
              <p className="text-[15px] text-text-tertiary mt-2">
                Combine visualizations into interactive reports
              </p>
            </div>
            <button
              className="qb-btn qb-btn--primary"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={18} />
              <span>New Dashboard</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : dashboards.length === 0 ? (
            <EmptyState
              icon={LayoutDashboard}
              title="No dashboards yet"
              description="Create your first dashboard to combine visualizations into a unified view."
              action={() => setShowCreate(true)}
              actionLabel="New Dashboard"
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
              {dashboards.map((dash) => (
                <div
                  key={dash.id}
                  onClick={() => {
                    setActiveDashboard(dash);
                    setEditing(false);
                    setActiveTabId(dash.tabs?.[0]?.id || "default");
                  }}
                  className="group relative bg-bg-raised border border-border-default rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-accent/50 hover:shadow-lg hover:-translate-y-1 overflow-hidden flex flex-col min-h-[160px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="flex justify-between items-start mb-3 relative z-1">
                    <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:scale-105 transition-all duration-300">
                      <LayoutDashboard
                        size={18}
                        className="text-accent group-hover:text-white transition-colors"
                      />
                    </div>
                    <button
                      className="w-7 h-7 rounded-md flex items-center justify-center text-text-quaternary hover:text-rose hover:bg-rose-muted transition-all opacity-70 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(dash.id, dash.name);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="text-[14px] font-semibold text-text-primary mb-1 relative z-1">
                    {dash.name}
                  </h3>
                  <p className="text-[12px] text-text-tertiary mb-3 leading-relaxed relative z-1">
                    {dash.description || "No description"}
                  </p>
                  <div className="flex gap-2 flex-wrap relative z-1">
                    <Badge variant="purple" className="text-[11px]">
                      {dash.widgets?.length || 0} widgets
                    </Badge>
                    <Badge variant="muted" className="text-[11px]">
                      {dash.tabs?.length || 1} tabs
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Modal */}
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="New Dashboard"
          footer={
            <>
              <button
                className="btn-secondary text-[12px] px-4 py-1.5"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary text-[12px] px-4 py-1.5"
                disabled={!newName.trim() || creating}
                onClick={handleCreate}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[12px] font-medium text-text-tertiary mb-1.5">
                Name
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Executive Summary"
                autoFocus
                className="bg-bg-base"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-tertiary mb-1.5">
                Description
              </label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What insights does this dashboard reveal?"
                className="bg-bg-base min-h-[80px]"
              />
            </div>
          </div>
        </Modal>
      </PageContainer>
    );
  }

  // ── Active Dashboard ──────────────────────────────────────────────────────
  return (
    <>
      {/* ── Present Mode Overlay ── */}
      {presenting && (
        <PresentMode
          dashboard={activeDashboard}
          filters={activeDashboard.global_filters || []}
          onExit={() => setPresenting(false)}
          refreshSignal={refreshSignal}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          refreshInterval={refreshInterval}
          setRefreshInterval={setRefreshInterval}
          onRefresh={doRefresh}
          lastRefreshed={lastRefreshed}
          onThemeOpen={() => setThemeOpen(true)}
        />
      )}

      {/* Theme Panel */}
      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />

      <PageContainer
        fullscreen
        wide
        className="full-height-page !py-2 lg:!px-6"
      >
        <div className="flex flex-col gap-2 h-full">
          {/* TOP BAR — merged with Tabs */}
          <div className="flex items-center gap-2 shrink-0 overflow-x-auto custom-scrollbar-mini flex-nowrap">
            {/* Left: close + name */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="btn-secondary px-2.5 py-1 text-[10px] gap-1"
                onClick={() => setActiveDashboard(null)}
              >
                <X size={11} />
                Close
              </button>
              <div className="h-4 w-px bg-border-default shrink-0" />
              <h2 className="text-[12px] font-semibold text-text-primary flex items-center gap-1.5 shrink-0">
                <LayoutDashboard size={12} className="text-accent" />
                {activeDashboard.name}
              </h2>
              <div className="h-4 w-px bg-border-muted shrink-0" />
            </div>

            {/* TABS inline */}
            <div className="flex items-center gap-0.5 shrink-0">
              {(activeDashboard.tabs || []).map((tab) => {
                const isActive = activeTabId === tab.id;
                return (
                  <div key={tab.id} className="flex items-center group/tab">
                    <button
                      onClick={() => setActiveTabId(tab.id)}
                      className={[
                        "px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                        isActive
                          ? "bg-accent text-white shadow-glow"
                          : "text-text-tertiary hover:bg-white/5 hover:text-text-primary",
                      ].join(" ")}
                    >
                      {editing ? (
                        <input
                          className="bg-transparent border-none outline-none text-inherit w-auto min-w-[50px]"
                          value={tab.label}
                          onChange={(e) =>
                            handleRenameTab(tab.id, e.target.value)
                          }
                          onClick={(e) => isActive && e.stopPropagation()}
                        />
                      ) : (
                        tab.label
                      )}
                    </button>
                    {editing && activeDashboard.tabs.length > 1 && (
                      <button
                        onClick={() => handleRemoveTab(tab.id)}
                        className="w-0 group-hover/tab:w-5 overflow-hidden flex items-center justify-center text-text-quaternary hover:text-rose transition-all"
                      >
                        <X size={9} />
                      </button>
                    )}
                  </div>
                );
              })}
              {editing && (
                <button
                  onClick={handleAddTab}
                  className="px-2 py-1 rounded-md text-text-quaternary hover:text-accent hover:bg-accent/10 transition-all"
                >
                  <Plus size={12} />
                </button>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right: controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Auto Refresh */}
              <div className="flex items-center gap-1 bg-bg-raised border border-border-default rounded-md px-2 py-1">
                <RefreshCw
                  size={10}
                  className={`text-accent ${refreshInterval > 0 ? "animate-spin" : ""}`}
                  style={{ animationDuration: "3s" }}
                />
                <select
                  className="bg-transparent text-[10px] text-text-tertiary outline-none cursor-pointer"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                >
                  {REFRESH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  className="text-text-quaternary hover:text-accent transition-colors"
                  title="Refresh now"
                  onClick={doRefresh}
                >
                  <Play size={9} />
                </button>
              </div>

              {/* Last refreshed */}
              {lastRefreshed && (
                <span className="text-[9px] text-text-quaternary flex items-center gap-1">
                  <Clock size={9} />
                  {lastRefreshed.toLocaleTimeString()}
                </span>
              )}


              {/* Present */}
              <button
                className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-violet/10 text-violet hover:bg-violet/20 transition-all flex items-center gap-1 border border-violet/20"
                onClick={() => setPresenting(true)}
                title="Present dashboard in full screen (ESC to exit)"
              >
                <Monitor size={11} />
                Present
              </button>

              {/* Theme */}
              <button
                className="btn-secondary px-2.5 py-1 text-[10px] gap-1"
                onClick={() => setThemeOpen(true)}
                title="Theme Settings"
              >
                <Palette size={11} />
                Theme
              </button>

              {/* Add Widget */}
              {editing && (
                <button
                  className="btn-secondary px-2.5 py-1 text-[10px] gap-1"
                  onClick={() => setShowAddWidget(true)}
                >
                  <Plus size={11} />
                  Add Widget
                </button>
              )}

              {/* Edit / Done */}
              <button
                className={[
                  "px-3 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1",
                  editing ? "bg-emerald text-white" : "btn-primary",
                ].join(" ")}
                onClick={() => setEditing(!editing)}
              >
                {editing ? <Save size={11} /> : <Edit3 size={11} />}
                {editing ? "Done Editing" : "Edit"}
              </button>
            </div>
          </div>

          {/* Global Filters */}
          {(editing || activeDashboard.global_filters?.length > 0) && (
            <div className="bg-bg-raised border border-border-default rounded-lg p-3.5">
              <GlobalFilters
                filters={activeDashboard.global_filters || []}
                onFiltersChange={handleFilterChange}
              />
            </div>
          )}

          {/* Add Widget Modal */}
          <Modal
            open={showAddWidget}
            onClose={() => setShowAddWidget(false)}
            title="Add Visualization"
          >
            {availableVizs.length === 0 ? (
              <EmptyState
                icon={Eye}
                title="No Visualizations"
                description="Create visualizations first."
                action={() => navigate("/visualize")}
                actionLabel="Create Visualization"
              />
            ) : (
              <div className="flex flex-col gap-1.5 h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {availableVizs.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between px-3.5 py-3 rounded-lg bg-bg-base border border-border-muted cursor-pointer hover:border-accent/30 hover:bg-bg-muted transition-all group"
                    onClick={() => handleAddWidget(v.id)}
                  >
                    <div>
                      <div className="font-medium text-[13px] text-text-primary group-hover:text-accent transition-colors">
                        {v.name}
                      </div>
                      <Badge variant="muted" className="mt-1">
                        {v.chart_type}
                      </Badge>
                    </div>
                    <div className="w-6 h-6 rounded-md bg-accent-muted flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 transition-all">
                      <Plus size={14} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Modal>

          {/* Grid Container */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <DashboardGrid
              widgets={currentTabWidgets}
              layout={activeDashboard.layout || []}
              filters={activeDashboard.global_filters || []}
              onLayoutChange={handleLayoutChange}
              onRemoveWidget={handleRemoveWidget}
              editing={editing}
              refreshSignal={refreshSignal}
            />
          </div>
        </div>
      </PageContainer>
    </>
  );
}
