import { useState, useEffect } from 'react';
import ChartPreview from './ChartPreview';
import { executeQuery } from '../../lib/api';
import { buildSQL } from '../../lib/sqlBuilder';
import { Spinner } from '../ui';
import { AreaChart, BarChart3, PieChart, Activity, AlertCircle } from 'lucide-react';

export default function VisualizationPreview({ viz, height = '200px' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!viz) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const config = viz.config || {};
        let sql = config.custom_sql;
        
        // If custom_sql is not pre-built, try building it
        if (!sql) {
           // We need dataset info for this, but building SQL might require it.
           // However, most visualizations saved should have custom_sql in their config.
           // If not, we might need to fetch dataset/query info.
           // For now, assume custom_sql exists or we fallback.
        }

        if (sql) {
          const result = await executeQuery(sql, viz.dataset_id, 1, config.limit || 50);
          setData(result.rows || []);
        } else {
          // Fallback: build a simple preview SQL if possible
          // This is a safety measure
          const tableName = `dataset_${viz.dataset_id.replace(/-/g, '_')}`;
          const fallbackSql = `SELECT * FROM ${tableName} LIMIT 50`;
          const result = await executeQuery(fallbackSql, viz.dataset_id, 1, 50);
          setData(result.rows || []);
        }
      } catch (err) {
        console.error('Failed to fetch preview data:', err);
        setError('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [viz]);

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-bg-base/30 rounded-xl" style={{ height }}>
        <Spinner size="sm" />
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-bg-base/30 rounded-xl text-text-quaternary gap-2" style={{ height }}>
        <AlertCircle size={20} className="opacity-20" />
        <span className="text-[11px] font-medium italic">{error || 'No data available'}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-bg-base/20 border border-border-muted/30" style={{ height }}>
      <ChartPreview 
        data={data} 
        config={{ ...viz.config, title: '' }} // Don't show title in preview to save space
        height="100%"
      />
      {/* Subtle overlay to prevent interaction in the grid view */}
      <div className="absolute inset-0 z-10 cursor-pointer" />
    </div>
  );
}
