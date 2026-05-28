import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useSearchArticles, getSearchArticlesQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [, setLocation] = useLocation();

  const { data: results, isLoading } = useSearchArticles(
    { q: debouncedQuery, limit: 10 },
    { query: { enabled: debouncedQuery.length > 1, queryKey: getSearchArticlesQueryKey({ q: debouncedQuery, limit: 10 }) } }
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/50 border border-border/50 hover:border-primary/50 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search intelligence...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 items-center gap-1 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden bg-background border-border shadow-2xl sm:max-w-[600px] border-primary/20">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 bg-background">
            <CommandInput 
              placeholder="Search articles, topics..." 
              value={query}
              onValueChange={setQuery}
              className="border-b border-border/50"
            />
            <CommandList className="max-h-[400px] overflow-y-auto overflow-x-hidden">
              <CommandEmpty className="py-6 text-center text-sm">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    <span>Decyphering archives...</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No records found.</span>
                )}
              </CommandEmpty>
              
              {results && results.length > 0 && (
                <CommandGroup heading="Intelligence">
                  {results.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => {
                        setLocation(`/articles/${result.id}`);
                        setOpen(false);
                      }}
                      className="flex flex-col items-start gap-1 cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors"
                    >
                      <div className="flex items-center w-full gap-2">
                        <span className="font-mono text-xs text-primary/70 uppercase tracking-widest">{result.category?.name || 'Uncategorized'}</span>
                      </div>
                      <span className="font-medium text-foreground">{result.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}