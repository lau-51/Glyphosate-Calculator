import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';

export interface EPhySearchResult {
  name: string;
  ammNumber?: string;
  substanceName: string;
  concentration: number;
  unit: string;
  isDry: boolean;
}

interface EPhyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectProduct: (product: EPhySearchResult) => void;
  placeholder?: string;
  isDarkMode?: boolean;
}

export const EPhyAutocomplete: React.FC<EPhyAutocompleteProps> = ({
  value,
  onChange,
  onSelectProduct,
  placeholder = "Ex: Roundup, Decis, Thiovit...",
  isDarkMode,
}) => {
  const [results, setResults] = useState<EPhySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorOnSearch, setErrorOnSearch] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setErrorOnSearch(null);
      try {
        const res = await fetch(`/api/ephy/search?q=${encodeURIComponent(value)}`);
        if (!res.ok) {
          throw new Error('Erreur réseau');
        }
        const data = await res.json();
        setResults(data || []);
        setIsOpen(true);
      } catch (err: any) {
        console.error("Autocomplete search failed:", err);
        setErrorOnSearch("Recherche indisponible");
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms delay to respect typing and avoid over-triggering

    return () => clearTimeout(delayDebounceFn);
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (prod: EPhySearchResult) => {
    onSelectProduct(prod);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full" id="ephy-autocomplete-container">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          id="ephy-autocomplete-input"
          className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-lg p-1.5 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600 dark:text-teal-400" />
          ) : (
            <Search className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>

      {isOpen && (results.length > 0 || errorOnSearch) && (
        <div 
          id="ephy-autocomplete-dropdown"
          className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
        >
          {errorOnSearch && (
            <div className="p-2.5 text-[10px] text-rose-500 dark:text-rose-400 italic text-center">
              {errorOnSearch}
            </div>
          )}
          {results.map((prod, index) => (
            <button
              key={index}
              type="button"
              id={`ephy-autocomplete-option-${index}`}
              onClick={() => handleSelect(prod)}
              className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-all"
            >
              <div className="font-bold text-xs text-slate-850 dark:text-slate-100 flex items-center justify-between">
                <span className="truncate mr-2">{prod.name}</span>
                {prod.ammNumber && (
                  <span className="text-[9px] shrink-0 font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded-md">
                    AMM N°{prod.ammNumber}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span className="truncate">SA : <strong className="text-slate-700 dark:text-slate-300 font-medium">{prod.substanceName}</strong></span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                  {prod.concentration} {prod.unit}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
