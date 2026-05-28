import React from "react";
import { Link, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleCard } from "@/components/ArticleCard";
import { useListArticles, useListCategories } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: categories } = useListCategories();
  const category = categories?.find(c => c.slug === slug);

  const { data: articles, isLoading } = useListArticles(
    { category: slug },
    { query: { enabled: !!slug } }
  );

  return (
    <AppLayout>
      <div className="bg-primary/5 border-b border-border/50 py-16">
        <div className="container mx-auto px-4">
          <Link href="/articles" className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors mb-6 inline-block">
            ← Back to Archive
          </Link>
          {categories && !category ? (
             <h1 className="text-4xl font-serif mb-4 text-destructive">CLASSIFICATION UNKNOWN</h1>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h1 className="text-4xl md:text-5xl font-serif">{category?.name || "Loading..."}</h1>
              </div>
              <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest max-w-2xl">
                {category?.description || "Decrypting classification details..."}
              </p>
              <div className="mt-8 font-mono text-xs border border-primary/20 bg-primary/10 inline-block px-3 py-1 text-primary">
                RECORDS: {category?.articleCount ?? '...'}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[300px] w-full bg-border/50" />
            ))
          ) : articles && articles.length > 0 ? (
            articles.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center border border-dashed border-border/50 bg-card/30">
              <div className="font-mono text-muted-foreground">
                <p>No records found in this classification.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}