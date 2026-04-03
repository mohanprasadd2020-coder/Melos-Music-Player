import { Search, X, Clock, Trash2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { getRecentSearchesForUser, saveRecentSearchForUser, clearRecentSearchesForUser } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

const RECENT_SEARCHES_KEY = "melos_recent_searches";

export default function SearchBar({ value, onChange }: SearchBarProps) {        
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  useEffect(() => {
    const loadSearches = async () => {
      const searches = await getRecentSearchesForUser(user?.id);
      setRecentSearches(searches);
    };
    loadSearches();
  }, [user]);

  const saveRecentSearch = async (term: string) => {
    if (!term.trim()) return;
    await saveRecentSearchForUser(term, user?.id);
    const updated = await getRecentSearchesForUser(user?.id);
    setRecentSearches(updated);
  };

  const clearRecentSearches = async () => {
    await clearRecentSearchesForUser(user?.id);
    setRecentSearches([]);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveRecentSearch(value);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (term: string) => {
    onChange(term);
    saveRecentSearch(term);
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className="relative max-w-md w-full z-50">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder="What do you want to listen to?"
        className="w-full h-10 pl-10 pr-10 rounded-full bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none border border-transparent focus:border-foreground/20 transition-colors"
      />
      {value && (
        <button
          onClick={() => { onChange(""); inputRef.current?.focus(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      )}

      {showSuggestions && !value && recentSearches.length > 0 && (
        <div className="absolute top-12 left-0 right-0 bg-background border border-border rounded-xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-muted-foreground/80">
            <span>Recent Searches</span>
            <button onClick={clearRecentSearches} className="hover:text-foreground transition-colors flex items-center gap-1">
              <Trash2 size={14} /> Clear
            </button>
          </div>
          <div className="flex flex-col">
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => handleSuggestionClick(term)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary text-left text-sm transition-colors text-foreground"
              >
                <Clock size={16} className="text-muted-foreground" />
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
