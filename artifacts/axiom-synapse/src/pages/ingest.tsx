import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useIngestArticle, useListCategories, useListTags } from "@workspace/api-client-react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Ingest() {
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: categories } = useListCategories();
  const { data: tags } = useListTags();

  const ingestMutation = useIngestArticle({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Ingestion Complete",
          description: "Article successfully decrypted and stored.",
        });
        setLocation(`/articles/${data.id}`);
      },
      onError: (err) => {
        toast({
          title: "Ingestion Failed",
          description: err.error?.error || "An unknown error occurred during ingestion.",
          variant: "destructive"
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !categoryId) {
      toast({
        title: "Validation Error",
        description: "URL and Classification are required.",
        variant: "destructive"
      });
      return;
    }
    
    ingestMutation.mutate({
      data: {
        url,
        categoryId: parseInt(categoryId, 10),
        tagIds: tagIds.map(id => parseInt(id, 10))
      }
    });
  };

  const toggleTag = (id: string) => {
    setTagIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="mb-12">
          <h1 className="text-4xl font-serif mb-4 flex items-center gap-4">
            Intelligence Ingestion 
            <span className="font-mono text-xs bg-primary/20 text-primary px-2 py-1 uppercase tracking-widest border border-primary/20">Console</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            Submit raw external intelligence for automated scraping, rewriting, and pitch generation.
          </p>
        </div>

        <div className="bg-card border border-border/50 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-muted-foreground/30">
            SYS.INGEST.v1.4.2
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-widest text-primary">Source URL</label>
              <input 
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                className="w-full bg-background border border-border/50 p-3 font-mono text-sm focus:border-primary/50 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-widest text-primary">Classification (Category)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-background border border-border/50 p-3 font-mono text-sm focus:border-primary/50 outline-none transition-colors appearance-none"
                required
              >
                <option value="" disabled>Select Classification...</option>
                {categories?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-widest text-primary">Tags (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {tags?.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id.toString())}
                    className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
                      tagIds.includes(t.id.toString()) 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border/50 text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={ingestMutation.isPending}
              className="w-full bg-primary text-primary-foreground font-mono uppercase tracking-widest py-4 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {ingestMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Ingestion...
                </>
              ) : (
                "Initiate Ingestion Protocol"
              )}
            </button>
          </form>

          {ingestMutation.isError && (
            <div className="mt-6 bg-destructive/10 border border-destructive/30 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="font-mono text-sm text-destructive-foreground">
                <p className="font-bold mb-1">Ingestion Failure</p>
                <p>{ingestMutation.error?.error?.error || "Unknown error"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}