import React from "react";
import { Link } from "wouter";
import { useGetFeaturedArticles, useGetRecentArticles, useGetPlatformStats } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArticleCard } from "@/components/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Activity } from "lucide-react";

export default function Home() {
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedArticles();
  const { data: recent, isLoading: recentLoading } = useGetRecentArticles({ limit: 6 });
  const { data: stats } = useGetPlatformStats();

  const heroArticle = featured?.[0];

  return (
    <AppLayout>
      {/* Stats Ticker */}
      <div className="w-full bg-primary/10 border-b border-primary/20 overflow-hidden py-1.5">
        <div className="container mx-auto px-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-primary/80">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Sys.Status: Nominal</span>
          </div>
          {stats && (
            <div className="hidden sm:flex items-center gap-6">
              <span>Articles: {stats.totalArticles}</span>
              <span>Classified Categories: {stats.totalCategories}</span>
              <span>Recent Ingests: {stats.recentIngestCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary)_0%,transparent_50%)] opacity-5 pointer-events-none" />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          {featuredLoading ? (
            <div className="space-y-6 max-w-3xl">
              <Skeleton className="h-6 w-32 bg-primary/20" />
              <Skeleton className="h-16 sm:h-24 w-full bg-border" />
              <Skeleton className="h-16 sm:h-24 w-3/4 bg-border" />
              <Skeleton className="h-20 w-full max-w-2xl bg-border" />
            </div>
          ) : heroArticle ? (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="font-mono text-xs text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 border border-primary/20">
                  Featured Briefing
                </span>
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                  {heroArticle.category.name}
                </span>
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-medium leading-[1.1] mb-6 tracking-tight">
                {heroArticle.title}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-10 font-sans">
                {heroArticle.excerpt}
              </p>
              <Link 
                href={`/articles/${heroArticle.id}`}
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3 font-mono text-sm uppercase tracking-widest hover:bg-primary/90 transition-all group"
              >
                Access Briefing 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ) : (
            <div className="text-muted-foreground font-mono">No featured intelligence available.</div>
          )}
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-12 border-b border-border/50 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {["Ancient Anomalies", "Advanced Geopolitics", "Esoteric Physics", "Cognitive Frontiers", "Systemic Research"].map((cat) => (
              <Link 
                key={cat}
                href={`/categories/${cat.toLowerCase().replace(" ", "-")}`}
                className="px-4 py-2 border border-border/50 font-mono text-xs uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-colors bg-card"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-2xl font-serif font-medium mb-2">Recently Decrypted</h2>
              <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Latest intelligence reports</p>
            </div>
            <Link href="/articles" className="hidden sm:flex items-center gap-2 font-mono text-xs text-primary uppercase tracking-widest hover:text-primary/80 transition-colors">
              View Database <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full bg-border/50" />
              ))
            ) : recent && recent.length > 0 ? (
              recent.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground font-mono border border-dashed border-border">
                No recent intelligence found in the database.
              </div>
            )}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}