import { useState, useEffect, useMemo } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { previewDataset } from '../../lib/api';
import { Spinner } from '../ui';

export default function DataPreview({ datasetId, pageSize = 50 }) {
  const [data, setData] = useState({ columns: [], rows: [], total_rows: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    previewDataset(datasetId, page, pageSize)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [datasetId, page, pageSize]);

  const columns = useMemo(() =>
    (data.columns || []).map(col => ({
      accessorKey: col,
      header: col,
      cell: info => {
        const val = info.getValue();
        if (val === null || val === undefined)
          return <span className="text-text-quaternary italic text-[11px]">null</span>;
        if (typeof val === 'number')
          return <span className="font-mono text-emerald font-medium">{val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>;
        return <span className="text-text-primary">{String(val)}</span>;
      },
    })),
    [data.columns]
  );

  const table = useReactTable({ data: data.rows || [], columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.ceil((data.total_rows || 0) / pageSize);

  if (loading) {
    return <div className="flex items-center justify-center py-10"><Spinner size="lg" /></div>;
  }

  if (!data.rows?.length) {
    return <div className="flex items-center justify-center py-10 text-text-tertiary text-[13px]">No data to preview</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-auto max-h-[480px]">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                <th className="sticky top-0 z-10 bg-bg-overlay px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-text-quaternary border-b border-border-default w-12">
                  #
                </th>
                {hg.headers.map(header => (
                  <th key={header.id} className="sticky top-0 z-10 bg-bg-overlay px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-quaternary border-b border-r border-border-default whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr key={row.id} className="border-b border-border-muted hover:bg-bg-muted/50 transition-colors">
                <td className="px-3 py-2 text-center text-text-quaternary text-[11px] w-12">
                  {(page - 1) * pageSize + idx + 1}
                </td>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2 whitespace-nowrap max-w-[260px] overflow-hidden text-ellipsis border-r border-border-muted last:border-0">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-bg-surface border-t border-border-default">
        <span className="text-[11px] text-text-tertiary">
          {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, data.total_rows)} of {data.total_rows?.toLocaleString()}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-bg-raised border border-border-default text-text-secondary hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft size={12} /> Prev
          </button>
          <span className="text-[11px] text-text-tertiary px-1">{page} / {totalPages}</span>
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-bg-raised border border-border-default text-text-secondary hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
