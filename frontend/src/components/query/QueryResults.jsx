import { useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, flexRender
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Clock, Rows3 } from 'lucide-react';

export default function QueryResults({ result, page, onPageChange }) {
  if (!result || !result.rows) return null;

  const colAligns = useMemo(() => {
    const aligns = {};
    if (!result.rows || result.rows.length === 0) return aligns;
    
    (result.columns || []).forEach(col => {
      // Find first non-null value to infer type
      const firstVal = result.rows.find(r => r[col] !== null && r[col] !== undefined)?.[col];
      if (typeof firstVal === 'number') aligns[col] = 'right';
      else if (typeof firstVal === 'boolean') aligns[col] = 'center';
      else aligns[col] = 'left';
    });
    return aligns;
  }, [result.rows, result.columns]);

  const columns = useMemo(() =>
    (result.columns || []).map(col => ({
      accessorKey: col,
      header: col,
      cell: info => {
        const val = info.getValue();
        const align = colAligns[col] || 'left';

        if (val === null || val === undefined)
          return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85em', opacity: 0.6 }}>null</span>;
        
        if (typeof val === 'number') {
          return (
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--success)',
              fontWeight: 500
            }}>
              {val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          );
        }
        
        if (typeof val === 'boolean') {
          return (
            <span style={{ 
              padding: '2px 8px', 
              borderRadius: '99px', 
              fontSize: '0.65rem', 
              fontWeight: 800,
              background: val ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: val ? 'var(--success)' : 'var(--danger)',
              letterSpacing: '0.05em'
            }}>
              {val ? 'TRUE' : 'FALSE'}
            </span>
          );
        }

        return <span style={{ color: 'var(--text-primary)' }}>{String(val)}</span>;
      },
    })),
    [result.columns, colAligns]
  );

  const table = useReactTable({
    data: result.rows || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil((result.total_rows || 0) / (result.page_size || 50));

  return (
    <div className="qb-results-view">
      {/* Stats bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '0 4px 10px', marginBottom: '8px', fontSize: '0.7rem',
        borderBottom: '1px solid var(--border)',
        fontWeight: 600,
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Rows3 size={13} style={{ color: 'var(--accent)' }} />
          <span>{result.total_rows?.toLocaleString()} rows</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} style={{ color: 'var(--accent)' }} />
          <span>{result.execution_time_ms?.toFixed(1) || result.execution_time?.toFixed(1)}ms</span>
        </div>
      </div>

        {/* Table Container - Flex layout to ensure pagination stays visible */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: 'calc(100vh - 200px)', 
          minHeight: '300px'
        }}>
          {/* Stats bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '0 4px 10px', marginBottom: '8px', fontSize: '0.7rem',
            borderBottom: '1px solid var(--border)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Rows3 size={13} style={{ color: 'var(--accent)' }} />
              <span>{result.total_rows?.toLocaleString()} rows</span>
            </div>
            
          </div>

          {/* Scrollable Table Area */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            width: '100%',
            minHeight: '200px'
          }}>
            <table className="data-table" style={{ width: '100%', minWidth: '600px', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(header => {
                      const align = colAligns[header.id] || 'left';
                      return (
                        <th key={header.id} style={{ 
                          position: 'sticky', top: 0, 
                          background: 'var(--bg-tertiary)',
                          textAlign: align,
                          padding: '10px 14px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--text-muted)',
                          borderBottom: '2px solid var(--border)',
                          borderRight: '1px solid var(--border)',
                          zIndex: 10
                        }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, rowIndex) => (
                  <tr 
                    key={row.id} 
                    className="qb-table-row"
                    style={{
                      backgroundColor: rowIndex % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                      borderTop: '1px solid var(--border)'
                    }}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => {
                      const align = colAligns[cell.column.id] || 'left';
                      const isLastCell = cellIndex === row.getVisibleCells().length - 1;
                      
                      return (
                        <td 
                          key={cell.id} 
                          style={{ 
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            textAlign: align,
                            borderBottom: '1px solid var(--border)',
                            borderRight: isLastCell ? 'none' : '1px solid var(--border)'
                          }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination - Always visible at bottom */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '12px 4px', 
            fontSize: '0.72rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-primary)',
            flexShrink: 0
          }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Page {page} of {totalPages} ({result.total_rows?.toLocaleString()} results)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="qb-btn qb-btn--secondary"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                className="qb-btn qb-btn--secondary"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>


    </div>
  );
}
