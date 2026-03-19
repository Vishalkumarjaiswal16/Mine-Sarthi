import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X, FileText, Box, Zap, Activity, Gauge } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchGlobal, type SearchResult } from "@/services/globalSearchService";
import { cn } from "@/lib/utils";

// Icon mapping for result types
const getIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'page':
      return FileText;
    case 'equipment':
      return Box;
    case 'metric':
      return Gauge;
    case 'feature':
      return Zap;
    case 'report':
      return Activity;
    default:
      return FileText;
  }
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Update results when query changes
  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchGlobal(query);
      setResults(searchResults);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        return;
      }

      if (!isOpen || results.length === 0) return;

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
        return;
      }

      // Arrow down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        return;
      }

      // Arrow up
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        return;
      }

      // Enter to navigate
      if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        const result = results[selectedIndex];
        navigate(result.path);
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate]);

  // Close search when route changes
  useEffect(() => {
    setIsOpen(false);
    setQuery('');
  }, [location.pathname]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const groupedResults = results.reduce((acc, result) => {
    const category = result.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (query.trim()) {
              setIsOpen(true);
            }
          }}
          className={cn(
            "pl-10 pr-10 w-full glass rounded-modern transition-all duration-300",
            "hover:shadow-glow-success focus:shadow-glow-success focus-ring",
            "placeholder:text-muted-foreground"
          )}
          aria-label="Global search"
          aria-expanded={isOpen}
          aria-controls="search-results"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10 w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted/50"
            aria-label="Clear search"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {!query && (
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        )}
      </div>

      {isOpen && query.trim() && (
        <div
          id="search-results"
          className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-xl max-h-[400px] overflow-hidden"
          role="listbox"
        >
          <div className="overflow-y-auto max-h-[400px]">
            {results.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <p className="font-medium mb-1">No results found</p>
                <p className="text-xs">Try searching for pages, equipment, or metrics</p>
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedResults).map(([category, categoryResults]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </div>
                    {categoryResults.map((result, index) => {
                      const globalIndex = results.indexOf(result);
                      const Icon = getIcon(result.type);
                      const isSelected = selectedIndex === globalIndex;

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            isSelected && "bg-accent text-accent-foreground",
                            "focus:outline-none focus:bg-accent focus:text-accent-foreground"
                          )}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{result.description}</div>
                          </div>
                          <div className="text-xs text-muted-foreground flex-shrink-0 capitalize">
                            {result.type}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

