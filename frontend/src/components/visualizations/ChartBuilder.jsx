import React, { useState, useEffect } from 'react';
import {
  Database, Settings2, ArrowDownUp, Layers,
  Table2, ChevronDown, X, Check, Loader2,
} from 'lucide-react';
import FieldWells from './FieldWells';
import ChartSpecificSettings from './ChartSpecificSettings';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel,
} from '../ui/DropdownMenu';

const TABS = [
  { id: 'data', label: 'Data', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

export default function ChartBuilder({
  columns, config, onConfigChange, onFieldClick,
  uniqueValues = {}, onValueFetch,
}) {
  const [activeTab, setActiveTab] = useState('data');

  const update = (patch) => onConfigChange({ ...config, ...patch });

  const safeColumns = (columns || []).map((c) =>
    typeof c === 'string' ? { name: c, type: 'string' } : c
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Bar */}
      <div
        className="flex gap-0.5 px-3 pt-3 pb-0 shrink-0"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all border-b-2',
                isActive
                  ? 'border-accent text-accent bg-accent/8'
                  : 'border-transparent text-text-quaternary hover:text-text-secondary hover:bg-bg-subtle',
              ].join(' ')}
            >
              <Icon size={11} />
              {tab.label}
            </button>
          );
        })}

        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-1.5 pb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          <span className="text-[8px] font-black text-emerald uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border-muted shrink-0" />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">

        {/* ── DATA TAB ── */}
        {activeTab === 'data' && (
          <div className="animate-in slide-in-from-bottom-2 duration-300">
            <FieldWells
              columns={safeColumns}
              config={config}
              onConfigChange={onConfigChange}
              uniqueValues={uniqueValues}
              onValueFetch={onValueFetch}
            />
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="animate-in slide-in-from-right-2 duration-300">
            <ChartSpecificSettings columns={safeColumns} config={config} onConfigChange={onConfigChange} />
          </div>
        )}
      </div>
    </div>
  );
}

