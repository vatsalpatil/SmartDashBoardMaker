import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useNavigate } from 'react-router-dom';
import ChartPreview from '../visualizations/ChartPreview';
import { getVisualization, executeQuery, updateVisualization } from '../../lib/api';
import { buildSQL } from '../../lib/sqlBuilder';
import { Spinner, EmptyState } from '../ui';
import { LayoutDashboard } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

function WidgetWrapper({ vizId, filters = [], onRemove, isEditing }) {
  const navigate = useNavigate();
  const [viz, setViz] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localConfig, setLocalConfig] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleConfigChange = async (newConfig) => {
    setLocalConfig(newConfig);
    if (isEditing && viz) {
      try {
        await updateVisualization(viz.id, { config: newConfig });
      } catch (err) {
        console.error("Failed to save widget configuration", err);
      }
    }
  };

  useEffect(() => {
    if (!vizId) return;
    const loadInit = async () => {
      try {
        const vizData = await getVisualization(vizId);
        setViz(vizData);
        setLocalConfig({ ...vizData.config, chart_type: vizData.chart_type || vizData.config?.chart_type });
      } catch (err) {
        console.error('Failed to load widget:', err);
        setLoading(false);
        if (onRemove) onRemove();
      }
    };
    loadInit();
  }, [vizId]);

  useEffect(() => {
    if (!viz || !localConfig) return;
    const fetchWidgetData = async () => {
      setLoading(true);
      try {
        const configWithFilters = {
          ...localConfig,
          filters: [...(localConfig.filters || []), ...filters]
        };
        let sql = configWithFilters.custom_sql;
        const isQueryBased = localConfig.source_type === 'query' || localConfig.source_query_id || (!localConfig.source_type && localConfig.custom_sql?.includes('AS q'));

        if (isQueryBased) {
          let baseQueryText = localConfig.source_query_sql;
          if (!baseQueryText && localConfig.custom_sql) {
            const match = localConfig.custom_sql.match(/FROM\s+\((.*?)\)\s+AS\s+q/is);
            if (match && match[1]) baseQueryText = match[1].trim();
          }
          if (baseQueryText) sql = buildSQL(configWithFilters, null, baseQueryText) || localConfig.custom_sql;
        } else {
          const tableName = `dataset_${viz.dataset_id.replace(/-/g, '_')}`;
          sql = buildSQL(configWithFilters, { table_name: tableName }, null) || localConfig.custom_sql;
        }

        if (sql) {
          const result = await executeQuery(sql, viz.dataset_id, 1, localConfig.limit || 200);
          setData(result.rows || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWidgetData();
  }, [viz, localConfig, filters]);

  if (loading && data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-raised rounded-xl border border-border-default">
        <Spinner />
      </div>
    );
  }

  const content = (
    <div className={[
      "bg-bg-raised flex flex-col group transition-all duration-300",
      isFullscreen 
        ? "fixed inset-0 z-[2000] p-10 bg-[#020208]/98 backdrop-blur-3xl overflow-auto" 
        : "h-full rounded-xl border border-border-default overflow-hidden shadow-xs hover:shadow-sm"
    ].join(" ")}>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {viz && localConfig ? (
          <ChartPreview 
            data={data} 
            config={{ ...localConfig, title: viz.name }} 
            height="100%" 
            onConfigChange={handleConfigChange} 
            onEdit={isEditing ? () => navigate(`/visualize?edit=${vizId}`) : undefined}
            onRemove={isEditing && onRemove ? () => onRemove(vizId) : undefined}
            isEditing={isEditing}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          />
        ) : (
          <div className="text-text-quaternary text-center p-5 text-[12px] italic">Widget not found</div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return createPortal(content, document.body);
  }

  return content;
}

export default function DashboardGrid({ widgets = [], layout = [], filters = [], onLayoutChange, onRemoveWidget, editing = false }) {
  if (!ResponsiveGridLayout) {
    return <div className="p-6 text-rose bg-rose-muted border border-rose/20 rounded-xl text-[12px] font-semibold">Error Loading Dashboard Grid</div>;
  }

  // 1. Ensure absolute uniqueness and sync with layout i
  const normalizedWidgets = widgets.map((w, idx) => ({
    ...w,
    gridKey: w.id || `${w.viz_id}_${idx}` // Fallback to index if no instance ID
  }));

  const layouts = {
    lg: normalizedWidgets.map((w, i) => {
      // Find existing layout for this specific gridKey
      const safeLayout = Array.isArray(layout) ? layout : [];
      const existing = safeLayout.find(l => l && l.i === w.gridKey);
      if (existing) return { ...existing, minW: 2, minH: 2 };
      
      // Calculate a default position if not in current layout
      return { 
        i: w.gridKey, 
        x: (i % 3) * 4, 
        y: Math.floor(i / 3) * 4, 
        w: 4, 
        h: 4, 
        minW: 2, 
        minH: 2 
      };
    }),
  };

  return (
    <div className="min-h-[400px] animate-fade-in">
      {widgets.length === 0 ? (
        <EmptyState icon={LayoutDashboard} title="No widgets" description="Add visualizations from the widget library." />
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 8, sm: 4 }}
          rowHeight={80}
          isDraggable={editing}
          isResizable={editing}
          draggableCancel=".nodrag, button, select, input, .recharts-wrapper"
          onLayoutChange={(newLayout) => onLayoutChange?.(newLayout)}
          compactType="vertical"
          margin={[16, 16]}
        >
          {normalizedWidgets.map((w) => (
            <div key={w.gridKey} className={`${editing ? 'cursor-move' : ''}`}>
              <WidgetWrapper vizId={w.viz_id} filters={filters} onRemove={() => onRemoveWidget?.(w.gridKey)} isEditing={editing} />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
