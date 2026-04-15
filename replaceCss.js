const fs = require('fs');

const cssMap = {
  'empty-state': 'flex flex-col items-center justify-center p-10 text-center',
  'empty-state-icon': 'mb-4 text-[#6b7294]',
  'empty-state-title': 'text-lg font-semibold text-white mb-2',
  'empty-state-text': 'text-sm text-[#6b7294] max-w-sm',
  
  'qb-page': 'flex flex-col h-full overflow-hidden bg-[#0a0b14]',
  'qb-toolbar': 'flex items-center gap-3 px-4 py-2 border-b border-white/[0.08] bg-[#0f1220] flex-shrink-0 flex-wrap',
  'qb-mode-toggle': 'flex bg-[rgba(255,255,255,0.04)] rounded-lg p-0.5',
  'qb-mode-btn': 'flex items-center gap-1.5 px-3 py-1 rounded-md text-[0.75rem] font-medium transition-colors text-[#6b7294] hover:text-white',
  'qb-mode-btn active': 'flex items-center gap-1.5 px-3 py-1 rounded-md text-[0.75rem] font-medium transition-colors bg-[#5c62ec] text-white shadow',
  'qb-btn': 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] font-medium transition-all cursor-pointer border',
  'qb-btn--primary': 'bg-[#5c62ec] text-white border-transparent hover:bg-[#4a50d6]',
  'qb-btn--secondary': 'bg-[#121528] text-[#f1f3f9] border-white/[0.1] hover:border-white/[0.2]',
  'qb-btn--ghost': 'bg-transparent text-[#6b7294] border-transparent hover:bg-white/[0.05] hover:text-[#f1f3f9]',
  'qb-btn--run': 'bg-[#10b981] text-white border-transparent hover:bg-[#059669]',
  'qb-btn--danger': 'bg-[#f43f5e] text-white border-transparent hover:bg-[#e11d48]',
  'qb-btn-icon': 'flex items-center justify-center w-7 h-7 rounded-lg text-[#6b7294] hover:text-[#f1f3f9] hover:bg-white/[0.05] transition-colors',
  'qb-btn-icon--danger': 'flex items-center justify-center w-7 h-7 rounded-lg text-[#6b7294] hover:text-[#f43f5e] hover:bg-[rgba(244,63,94,0.1)] transition-colors',
  'qb-add-btn': 'w-full py-1.5 rounded-lg bg-[rgba(92,98,236,0.1)] text-[#7b81f5] text-[0.7rem] font-medium border border-dashed border-[rgba(92,98,236,0.3)] hover:bg-[rgba(92,98,236,0.15)] flex justify-center items-center gap-1 mt-1 transition-all',
  
  'qb-workspace': 'flex flex-1 min-h-0 overflow-hidden',
  'qb-left-panel': 'flex overflow-hidden bg-[#0f1220] border-r border-white/[0.08]',
  'qb-right-panel': 'flex flex-col flex-1 min-w-0 bg-[#0a0b14]',
  
  'qb-tabs-v': 'flex flex-col w-[140px] flex-shrink-0 bg-[#0b0c16] border-r border-white/[0.05]',
  'qb-tab-v': 'flex items-center gap-2.5 px-4 py-3 text-[0.78rem] text-[#6b7294] border-r-2 border-transparent transition-colors hover:text-[#f1f3f9] hover:bg-white/[0.02]',
  'qb-tab-v active': 'flex items-center gap-2.5 px-4 py-3 text-[0.78rem] bg-[rgba(92,98,236,0.08)] text-[#7b81f5] border-r-2 border-[#5c62ec]',
  'qb-tab-v-label': 'flex-1 text-left font-medium',
  'qb-tab-v-badge': 'px-1.5 py-0.5 rounded-full bg-[rgba(92,98,236,0.2)] text-[#7b81f5] text-[0.6rem] font-bold',
  
  'qb-tab-content': 'flex-1 p-5 overflow-y-auto',
  'qb-section-title': 'text-[0.65rem] font-bold text-[#6b7294] tracking-wider uppercase mb-3 flex items-center',
  'qb-row': 'flex items-center gap-2 mb-1.5',
  'qb-select-row': 'flex items-center gap-2 mb-1.5 bg-[#121528] rounded-lg p-1.5 border border-transparent focus-within:border-[#5c62ec] transition-colors',
  'qb-drag-handle': 'cursor-grab px-1 text-[#6b7294] hover:text-[#f1f3f9]',
  'qb-col-picker-wrapper': 'flex-1 min-w-[120px]',
  'qb-select': 'bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none focus:border-[#5c62ec]',
  'qb-input': 'bg-[#161a2e] border border-white/[0.08] rounded-md text-[#f1f3f9] text-[0.75rem] px-2 py-1 flex-1 outline-none focus:border-[#5c62ec]',
  'qb-alias-input': 'w-[100px] border-l border-white/[0.1] bg-transparent text-[#f1f3f9] text-[0.75rem] px-2 py-1 outline-none',
  
  'qb-distinct-toggle': 'px-2 py-0.5 rounded text-[0.65rem] font-bold transition-colors',
  'qb-distinct-toggle off': 'bg-white/[0.05] text-[#6b7294] hover:text-[#f1f3f9]',
  'qb-distinct-toggle on': 'bg-[rgba(16,185,129,0.15)] text-[#10b981]',
  
  'qb-resize-handle': 'w-1 cursor-col-resize hover:bg-[rgba(92,98,236,0.5)] active:bg-[#5c62ec] transition-colors shrink-0 z-10',
  'qb-resize-handle active': 'w-1 cursor-col-resize bg-[#5c62ec] shrink-0 z-10',
  'qb-resize-handle-v': 'h-1 cursor-row-resize hover:bg-[rgba(92,98,236,0.5)] active:bg-[#5c62ec] transition-colors shrink-0 z-10',
  'qb-resize-handle-v active': 'h-1 cursor-row-resize bg-[#5c62ec] shrink-0 z-10',
  
  'qb-results-header': 'flex items-center gap-3 px-4 py-2 border-b border-white/[0.08] bg-[#121528] shrink-0',
  'qb-results-body': 'flex-1 min-h-0 overflow-auto bg-[#0a0b14] relative p-4',
  'qb-query-name': 'w-[180px] bg-[#0b0c16] border border-white/[0.1] rounded-md px-2 py-1 text-[0.75rem] text-white outline-none focus:border-[#5c62ec]',
  
  'qb-templates-grid': 'p-4 bg-[#121528] border-b border-white/[0.08] grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3',
  'qb-template-card': 'flex items-center gap-2 p-2.5 rounded-xl bg-[#0f1220] border border-white/[0.08] cursor-pointer hover:border-[#5c62ec] hover:bg-[rgba(92,98,236,0.05)] transition-colors text-[0.8rem] font-medium text-white',
  
  'qb-empty': 'flex items-center justify-center py-10',
  'qb-error': 'px-4 py-3 bg-[rgba(244,63,94,0.08)] border border-[#f43f5e]/30 rounded-xl text-[#f43f5e] text-[0.85rem] font-mono flex items-center gap-2 mb-3',
  'qb-saved-item': 'group flex items-center justify-between px-3 py-2 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] cursor-pointer transition-colors',
  'qb-valid-badge checking': 'flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] text-[0.68rem] font-bold text-[#f59e0b] tracking-wide',
  'qb-valid-badge valid': 'flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] text-[0.68rem] font-bold text-[#10b981] tracking-wide',
  'qb-valid-badge invalid': 'flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] text-[0.68rem] font-bold text-[#f43f5e] tracking-wide',
  
  'qb-grid-2': 'grid grid-cols-2 gap-2 w-full',
  'qb-join-block': 'p-3 bg-[#121528] rounded-xl border border-white/[0.08] flex flex-col gap-2 mb-2',
  'qb-cte-block': 'p-3 bg-[#121528] rounded-xl border border-white/[0.08] flex flex-col gap-2 mb-2',
};

const regexes = Object.entries(cssMap).sort((a, b) => b[0].length - a[0].length).map(([key, val]) => {
  return {
    regexp: new RegExp('className=(["\'])' + key.replace(' ', '\\\\s+') + '(["\'])', 'g'),
    replacement: 'className=$1' + val + '$2'
  };
});

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('ui')) {
        results = results.concat(walkDir(file));
      }
    } else {
      if ((file.endsWith('.jsx') || file.endsWith('.js')) && !file.includes('ui/')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walkDir('./frontend/src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  regexes.forEach(({regexp, replacement}) => {
    if (content.match(regexp)) {
       content = content.replace(regexp, replacement);
       changed = true;
    }
  });
  
  const classMatches = [
    { from: /className\s*=\s*\{\`qb-tab-v\s*\$\{\s*activeTab\s*===\s*t\.id\s*\?\s*\"\s*active\"\s*:\s*\"\"\s*\}\`\}/g, to: "className={`flex items-center gap-2.5 px-4 py-3 text-[0.78rem] border-r-2 transition-colors ${activeTab === t.id ? 'bg-[rgba(92,98,236,0.08)] text-[#7b81f5] border-[#5c62ec]' : 'text-[#6b7294] border-transparent hover:text-[#f1f3f9] hover:bg-white/[0.02]'}`}" },
    { from: /className\s*=\s*\{\`qb-mode-btn\s*\$\{\s*\(\s*m\s*===\s*\"sql\"\s*\?\s*sqlMode\s*:\s*!sqlMode\s*\)\s*\?\s*\"\s*active\"\s*:\s*\"\"\s*\}\`\}/g, to: "className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[0.75rem] font-medium transition-colors ${ (m === 'sql' ? sqlMode : !sqlMode) ? 'bg-[#5c62ec] text-white shadow' : 'text-[#6b7294] hover:text-white' }`}" },
    { from: /className\s*=\s*\{\`qb-distinct-toggle\s*\$\{\s*selectDistinct\s*\?\s*\"on\"\s*:\s*\"off\"\s*\}\`\}/g, to: "className={`px-2 py-0.5 rounded text-[0.65rem] font-bold transition-colors ${selectDistinct ? 'bg-[rgba(16,185,129,0.15)] text-[#10b981]' : 'bg-white/[0.05] text-[#6b7294] hover:text-[#f1f3f9]'}`}" },
    { from: /className\s*=\s*\{\`qb-resize-handle\$\{\s*hDrag\s*\?\s*\"\s*active\"\s*:\s*\"\"\s*\}\`\}/g, to: "className={`w-1 cursor-col-resize hover:bg-[rgba(92,98,236,0.5)] active:bg-[#5c62ec] transition-colors shrink-0 z-10 ${hDrag ? 'bg-[#5c62ec]' : ''}`}" },
    { from: /className\s*=\s*\{\`qb-resize-handle-v\$\{\s*vDrag\s*\?\s*\"\s*active\"\s*:\s*\"\"\s*\}\`\}/g, to: "className={`h-1 cursor-row-resize hover:bg-[rgba(92,98,236,0.5)] active:bg-[#5c62ec] transition-colors shrink-0 z-10 ${vDrag ? 'bg-[#5c62ec]' : ''}`}" }
  ];
  
  classMatches.forEach(({from, to}) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
    changedFiles++;
  }
});

console.log(`Updated ${changedFiles} files with Tailwind CSS replacements`);
