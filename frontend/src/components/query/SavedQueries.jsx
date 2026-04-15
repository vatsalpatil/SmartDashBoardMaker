import { useState, useEffect } from 'react';
import { Trash2, Play, Database, Search } from 'lucide-react';
import { listSavedQueries, deleteSavedQuery } from '../../lib/api';
import { Button, EmptyState, Spinner } from '../ui';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';

export default function SavedQueries({ datasetId, onLoadQuery }) {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();
  const confirm = useConfirm();

  const fetchQueries = async () => {
    try {
      const data = await listSavedQueries(datasetId);
      setQueries(data.queries || []);
    } catch { toast.error('Failed to load saved queries'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQueries(); }, [datasetId]);

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    const ok = await confirm({ title: 'Delete Query?', message: `"${name}" will be permanently removed.`, confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await deleteSavedQuery(id);
      setQueries(qs => qs.filter(q => q.id !== id));
      toast.success('Query deleted');
    } catch { toast.error('Failed to delete query'); }
  };

  const filtered = queries.filter(q => q.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center py-10"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-[14px] text-text-primary">Saved Queries</h3>
        <Input
          icon={<Search size={13} />}
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-7 text-[12px] py-1 w-44"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Database}
          title={search ? 'No matching queries' : 'No saved queries yet'}
          description={search ? 'Try a different search term' : 'Write and save a query using the editor above.'}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map(q => (
            <div
              key={q.id}
              className="group flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-raised border border-border-default cursor-pointer hover:border-accent/30 hover:bg-bg-muted transition-all"
              onClick={() => onLoadQuery(q)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[13px] text-text-primary truncate group-hover:text-accent transition-colors">{q.name}</div>
                <div className="text-[11px] text-text-quaternary font-mono truncate mt-0.5">{q.sql_text}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon-sm" onClick={e => { e.stopPropagation(); onLoadQuery(q); }} title="Load query" className="text-accent">
                  <Play size={12} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={e => handleDelete(e, q.id, q.name)} title="Delete" className="text-rose hover:bg-rose-muted">
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
