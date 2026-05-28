import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSearchArticles, getSearchArticlesQueryKey } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchIcon, Loader2 } from "lucide-react";

export default function Search() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 500);

  const { data: results, isLoading } = useSearchArticles(
    { q: debouncedQuery, limit: 50 },
    { query: { enabled: debouncedQuery.length > 0, queryKey: getSearchArticlesQueryKey({ q: debouncedQuery, limit: 50 }) } }
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-serif mb-6">Database Query</h1>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative flex items-center bg-card border border-border/50 focus-within:border-primary/50 transition-colors p-2">
              <SearchIcon className="w-6 h-6 text-muted-foreground ml-4" />
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter query parameters..."
                className="w-full bg-transparent border-none text-xl font-mono px-4 py-4 outline-none placeholder:text-muted-foreground/50"
                autoFocus
              />
            </div>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground font-mono">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>QUERYING ARCHIVES...</p>
            </div>
          ) : query.length === 0 ? (
            <div className="py-20 text-center font-mono text-muted-foreground border border-dashed border-border/50">
              AWAITING QUERY INPUT
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-4">
              <p className="font-mono text-xs text-primary mb-6">FOUND {results.length} MATCHES</p>
              {results.map((result) => (
                <Link 
                  key={result.id} 
                  href={`/articles/${result.id}`}
                  className="block p-6 bg-card border border-border/50 hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-2 font-mono text-[10px] uppercase tracking-widest text-primary/70">
                    <span>{result.category?.name || 'Uncategorized'}</span>
                    <span className="w-1 h-1 bg-border rounded-full" />
                    <span>Score: {(result.relevanceScore * 100).toFixed(1)}</span>
                  </div>
                  <h3 className="text-xl font-serif mb-2 group-hover:text-primary transition-colors">{result.title}</h3>
                  <p className="text-sm text-muted-foreground font-sans line-clamp-2">{result.excerpt}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center font-mono text-muted-foreground border border-dashed border-border/50">
              <p className="text-destructive mb-2">NO MATCHES FOUND</p>
              <p>Try broadening your query parameters.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}