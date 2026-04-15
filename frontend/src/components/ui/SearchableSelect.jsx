import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder = "Select option...", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 bg-[#121225] border border-white/5 rounded-xl px-4 flex items-center justify-between text-white/80 hover:border-white/10 transition-all text-sm font-medium"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#121225] border border-white/10 rounded-xl shadow-3xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                className="w-full bg-white/5 border-none rounded-lg pl-9 pr-4 py-2 text-[12px] text-white focus:outline-none placeholder-white/10 font-bold uppercase tracking-widest"
                placeholder="FILTER ENTITIES..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] transition-all ${
                    value === opt.value ? 'bg-accent/20 text-accent font-bold' : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {opt.icon && <opt.icon size={14} className="opacity-50" />}
                    <span>{opt.label}</span>
                  </div>
                  {value === opt.value && <Check size={14} />}
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">No Matches Identified</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
