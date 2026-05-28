import React, { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleCard } from "@/components/ArticleCard";
import { useListArticles, useListCategories, useListTags } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function Articles() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || "";
  const initialTag = searchParams.get("tag") || "";
  const initialSearch = searchParams.get("q") || "";

  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState(initialTag);
  const [search, setSearch] = useState(initialSearch);

  const debouncedSearch = useDebounce(search, 500);

  const { data: categories } = useListCategories();
  const { data: tags } = useListTags();
  
  const { data: articles, isLoading } = useListArticles({
    category: category || undefined,
    tag: tag || undefined,
  });

  // Filter client-side by search if needed, or we'd use search endpoint, but the req says "article feed with filters and search bar". We'll just client-side filter title/excerpt since list endpoint doesn't take q.
  const filteredArticles = articles?.filter(a => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q);
  });

  return (
    <AppLayout>
      <div className="bg-primary/5 border-b border-border/50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-serif mb-4">Intelligence Archive</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest max-w-2xl">
            Complete database of decrypted reports, geopolitical analysis, and cognitive research.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 shrink-0 space-y-8">
            <div className="space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Search</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter briefings..." 
                  className="w-full bg-card border border-border/50 pl-9 pr-4 py-2 text-sm font-mono focus:border-primary/50 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Classifications</h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setCategory("")}
                  className={`text-left text-sm font-mono ${!category ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                >
                  All Classifications
                </button>
                {categories?.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setCategory(c.slug)}
                    className={`text-left text-sm font-mono ${category === c.slug ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                  >
                    {c.name} ({c.articleCount})
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setTag("")}
                  className={`text-[10px] font-mono px-2 py-1 border ${!tag ? 'border-primary text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'} transition-colors`}
                >
                  ALL
                </button>
                {tags?.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setTag(t.slug)}
                    className={`text-[10px] font-mono px-2 py-1 border ${tag === t.slug ? 'border-primary text-primary bg-primary/10' : 'border-border/50 text-muted-foreground hover:border-primary/50'} transition-colors`}
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[300px] w-full bg-border/50" />
                ))
              ) : filteredArticles && filteredArticles.length > 0 ? (
                filteredArticles.map((article, i) => (
                  <ArticleCard key={article.id} article={article} index={i} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center border border-dashed border-border/50 bg-card/30">
                  <div className="font-mono text-muted-foreground">
                    <p className="text-primary mb-2">ACCESS DENIED / NOT FOUND</p>
                    <p>No intelligence records match the specified parameters.</p>
                    <button 
                      onClick={() => { setCategory(""); setTag(""); setSearch(""); }}
                      className="mt-6 border border-border/50 px-4 py-2 hover:border-primary/50 hover:text-primary transition-colors text-xs uppercase tracking-widest"
                    >
                      Clear Parameters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}