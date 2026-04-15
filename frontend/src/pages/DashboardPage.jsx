import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  LayoutDashboard,
  Trash2,
  Edit3,
  Save,
  X,
  Eye,
} from "lucide-react";
import {
  listDashboards,
  createDashboard,
  deleteDashboard,
  updateDashboard,
  listVisualizations,
} from "../lib/api";
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
    } catch (err) {
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



  const [activeTabId, setActiveTabId] = useState(null);

  useEffect(() => {
    if (activeDashboard && (!activeDashboard.tabs || activeDashboard.tabs.length === 0)) {
       // Migrate old dashboards to a default tab
       const updated = { ...activeDashboard, tabs: [{ id: 'default', label: 'Primary' }] };
       setActiveDashboard(updated);
       setActiveTabId('default');
    } else if (activeDashboard && activeDashboard.tabs?.length > 0 && !activeTabId) {
       setActiveTabId(activeDashboard.tabs[0].id);
    }
  }, [activeDashboard?.id]);

  const handleAddTab = async () => {
    if (!activeDashboard) return;
    const newId = crypto.randomUUID();
    const newTabs = [...(activeDashboard.tabs || []), { id: newId, label: 'New Tab' }];
    try {
      const updated = await updateDashboard(activeDashboard.id, { tabs: newTabs });
      setActiveDashboard(updated);
      setActiveTabId(newId);
      toast.success("Tab added");
    } catch {
      toast.error("Failed to add tab");
    }
  };

  const handleRenameTab = async (tabId, newLabel) => {
    const newTabs = activeDashboard.tabs.map(t => t.id === tabId ? { ...t, label: newLabel } : t);
    try {
      const updated = await updateDashboard(activeDashboard.id, { tabs: newTabs });
      setActiveDashboard(updated);
    } catch {
      toast.error("Failed to rename tab");
    }
  };

  const handleRemoveTab = async (tabId) => {
    if (activeDashboard.tabs.length <= 1) return;
    const ok = await confirm({ title: "Remove Tab?", message: "All widgets in this tab will be uncategorized.", variant: 'danger' });
    if (!ok) return;
    
    const newTabs = activeDashboard.tabs.filter(t => t.id !== tabId);
    try {
      const updated = await updateDashboard(activeDashboard.id, { tabs: newTabs });
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
      { id: crypto.randomUUID(), viz_id: vizId, tabId: activeTabId, layout: {} },
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

    // We must map currentTabWidgets exactly the same way DashboardGrid does 
    // to find the correct widget to remove, especially for older widgets without UUIDs.
    const keyMap = new Map();
    currentTabWidgets.forEach((w, idx) => {
      keyMap.set(w, w.id || `${w.viz_id}_${idx}`);
    });

    const newWidgets = activeDashboard.widgets.filter((w) => {
      const gridKey = keyMap.get(w);
      if (!gridKey) return true; // Widget is hidden in another tab, keep it
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
    // Merge newLayout into master layout
    const masterLayout = [...(activeDashboard.layout || [])];
    newLayout.forEach(item => {
      const idx = masterLayout.findIndex(l => l.i === item.i);
      if (idx >= 0) masterLayout[idx] = item;
      else masterLayout.push(item);
    });

    try {
      await updateDashboard(activeDashboard.id, { layout: masterLayout });
      // Update local state without full reload to keep it snappy
      setActiveDashboard(prev => ({ ...prev, layout: masterLayout }));
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

  // ── FILTER DATA PER TAB ──
  const currentTabWidgets = (activeDashboard?.widgets || []).filter(w => 
    w.tabId === activeTabId || (!w.tabId && activeTabId === (activeDashboard?.tabs?.[0]?.id || 'default'))
  );

  // ── Dashboard List ────────────────────────────────────────
  if (!activeDashboard) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-12 animate-fade-in w-full">
          {/* Header */}
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

          {/* List */}
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
                    setActiveTabId(dash.tabs?.[0]?.id || 'default');
                  }}
                  className="group relative bg-bg-raised border border-border-default rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-accent/50 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "auto",
                    minHeight: "160px",
                  }}
                >
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Icon + Delete */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
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

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      marginBottom: "4px",
                      lineHeight: "1.3",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {dash.name}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-tertiary)",
                      marginBottom: "12px",
                      lineHeight: "1.4",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {dash.description || "No description"}
                  </p>

                  {/* Badges */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
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

  // ── Active Dashboard ──────────────────────────────────────
  return (
    <PageContainer fullscreen wide className="full-height-page !py-4 lg:!px-10">
      <div className="flex flex-col gap-4 h-full">
        {/* TOP BAR: Title & Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <button
              className="btn-secondary px-3 py-1.5 text-[11px] gap-1.5"
              onClick={() => setActiveDashboard(null)}
            >
              <X size={13} />
              Close
            </button>
            <div className="h-4 w-px bg-border-default" />
            <h2 className="text-[15px] font-semibold text-text-primary flex items-center gap-2">
              <LayoutDashboard size={15} className="text-accent" />
              {activeDashboard.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {editing && (
              <button
                className="btn-secondary px-3 py-1.5 text-[11px] gap-1.5"
                onClick={() => setShowAddWidget(true)}
              >
                <Plus size={13} />
                Add Widget
              </button>
            )}
            <button
              className={[
                "px-4 py-1.5 text-[11px] font-medium rounded-lg transition-all flex items-center gap-1.5",
                editing ? "bg-emerald text-white" : "btn-primary",
              ].join(" ")}
              onClick={() => setEditing(!editing)}
            >
              {editing ? <Save size={13} /> : <Edit3 size={13} />}
              {editing ? "Done Editing" : "Edit"}
            </button>
          </div>
        </div>

        {/* TABS RIBBON */}
        <div className="flex items-center gap-1 bg-bg-raised border border-border-default rounded-xl p-1 shrink-0 overflow-x-auto custom-scrollbar-mini">
           {(activeDashboard.tabs || []).map(tab => {
              const isActive = activeTabId === tab.id;
              return (
                 <div key={tab.id} className="flex items-center group/tab">
                    <button
                       onClick={() => setActiveTabId(tab.id)}
                       className={[
                          "px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                          isActive ? "bg-accent text-white shadow-glow" : "text-text-tertiary hover:bg-white/5 hover:text-text-primary"
                       ].join(" ")}
                    >
                       {editing ? (
                          <input 
                             className="bg-transparent border-none outline-none text-inherit w-auto min-w-[60px]"
                             value={tab.label}
                             onChange={(e) => handleRenameTab(tab.id, e.target.value)}
                             onClick={(e) => isActive && e.stopPropagation()}
                          />
                       ) : tab.label}
                    </button>
                    {(editing && activeDashboard.tabs.length > 1) && (
                       <button 
                          onClick={() => handleRemoveTab(tab.id)}
                          className="w-0 group-hover/tab:w-6 overflow-hidden flex items-center justify-center text-text-quaternary hover:text-rose transition-all"
                       >
                          <X size={10} />
                       </button>
                    )}
                 </div>
              );
           })}
           {editing && (
              <button 
                 onClick={handleAddTab}
                 className="px-3 py-2 rounded-lg text-text-quaternary hover:text-accent hover:bg-accent/10 transition-all ml-1"
              >
                 <Plus size={14} />
              </button>
           )}
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

        {/* Grid Container (Now Scrollable) */}
        <div className="flex-1 min-h-0 bg-bg-surface rounded-xl border border-border-default overflow-y-auto p-3 custom-scrollbar">
          <DashboardGrid
            widgets={currentTabWidgets}
            layout={activeDashboard.layout || []}
            filters={activeDashboard.global_filters || []}
            onLayoutChange={handleLayoutChange}
            onRemoveWidget={handleRemoveWidget}
            editing={editing}
          />
        </div>
      </div>
    </PageContainer>
  );
}
