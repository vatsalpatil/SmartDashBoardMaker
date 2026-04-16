import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Database, FileText, Check } from 'lucide-react';

export default function SourceSelector({ 
  datasets = [], 
  savedQueries = [],
  value, 
  onChange, 
  onQuerySelect,
  placeholder = "Select source..." 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const originalDatasets = datasets.filter(d => !d.is_virtual);
  const virtualDatasets = datasets.filter(d => d.is_virtual);
  
  // Combine virtual datasets from DB and library queries
  const allSaved = [
    ...virtualDatasets.map(d => ({ ...d, type: 'virtual_ds' })),
    ...savedQueries.map(q => ({ ...q, type: 'library_query', is_virtual: true }))
  ];

  const selectedItem = datasets.find(d => String(d.id) === String(value)) || 
                       datasets.find(d => `dataset_${d.id}` === value);

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
  };

  const toggleGroup = (e, group) => {
    e.stopPropagation();
    setExpandedGroup(expandedGroup === group ? null : group);
  };

  return (
    <div ref={dropdownRef} className="relative w-full z-[1000]">
      {/* Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'flex items-center justify-between px-4 py-2.5 bg-bg-base border rounded-xl cursor-pointer text-[13px] font-bold shadow-sm transition-all duration-150',
          isOpen ? 'border-accent ring-2 ring-accent/20 bg-bg-surface' : 'border-border-default hover:border-border-strong hover:bg-bg-surface',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {selectedItem ? (
            <>
              {selectedItem.is_virtual ? <FileText size={14} className="text-violet shrink-0" /> : <Database size={14} className="text-accent shrink-0" />}
              <span className="font-medium text-text-primary truncate">{selectedItem.name}</span>
            </>
          ) : (
            <span className="text-text-quaternary">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={13} className={`text-text-quaternary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-bg-raised border border-border-default rounded-xl shadow-xl p-1.5 max-h-[380px] overflow-y-auto z-[1001] animate-scale-in">
          
          {/* Original Datasets */}
          <div className="mb-1">
            <div 
              onClick={(e) => toggleGroup(e, 'original')}
              className={[
                'flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer text-[11px] font-semibold uppercase tracking-wider transition-all',
                expandedGroup === 'original' ? 'text-accent bg-accent-muted' : 'text-text-tertiary hover:bg-bg-muted',
              ].join(' ')}
            >
              {expandedGroup === 'original' ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <Database size={12} />
              <span>Datasets</span>
              <span className="ml-auto text-[10px] bg-bg-muted px-1.5 rounded text-text-quaternary">{originalDatasets.length}</span>
            </div>
            
            {expandedGroup === 'original' && (
              <div className="pl-2 mt-1 flex flex-col gap-0.5">
                {originalDatasets.length === 0 ? (
                  <div className="px-3 py-2 text-[12px] text-text-quaternary italic">No datasets</div>
                ) : (
                  originalDatasets.map(d => {
                    const isSelected = String(value).includes(String(d.id));
                    return (
                      <div 
                        key={d.id}
                        onClick={() => handleSelect(String(d.id))}
                        className={[
                          'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-[13px] transition-all duration-100',
                          isSelected ? 'text-accent bg-accent-muted font-medium' : 'text-text-primary hover:bg-bg-muted',
                        ].join(' ')}
                      >
                        <span className="truncate">{d.name}</span>
                        {isSelected && <Check size={13} className="shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-border-muted mx-2 my-1" />

          {/* Saved Queries / Virtual */}
          <div className="mt-1">
            <div 
              onClick={(e) => toggleGroup(e, 'virtual')}
              className={[
                'flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer text-[11px] font-semibold uppercase tracking-wider transition-all',
                expandedGroup === 'virtual' ? 'text-violet bg-violet-muted' : 'text-text-tertiary hover:bg-bg-muted',
              ].join(' ')}
            >
              {expandedGroup === 'virtual' ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <FileText size={12} />
              <span>Saved Queries</span>
              <span className="ml-auto text-[10px] bg-bg-muted px-1.5 rounded text-text-quaternary">{allSaved.length}</span>
            </div>
            
            {expandedGroup === 'virtual' && (
              <div className="pl-2 mt-1 flex flex-col gap-0.5">
                {allSaved.length === 0 ? (
                  <div className="px-3 py-2 text-[12px] text-text-quaternary italic">No saved queries</div>
                ) : (
                  allSaved.map(item => {
                    const isSelected = String(value).includes(String(item.id));
                    const isLibrary = item.type === 'library_query';
                    
                    return (
                      <div 
                        key={item.id}
                        onClick={() => {
                          if (isLibrary && onQuerySelect) {
                            onQuerySelect(item);
                            setIsOpen(false);
                          } else {
                            handleSelect(String(item.id));
                          }
                        }}
                        className={[
                          'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-[13px] transition-all duration-100',
                          isSelected ? 'text-violet bg-violet-muted font-medium' : 'text-text-primary hover:bg-bg-muted',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {isLibrary && <FileText size={10} className="text-violet opacity-60" />}
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isSelected && <Check size={13} className="shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
