import React from "react";
import { Link, useParams } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGetArticle, 
  useGetArticlePitches, 
  useGetRelatedArticles,
  getGetArticleQueryKey,
  getGetArticlePitchesQueryKey,
  getGetRelatedArticlesQueryKey
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ExternalLink, CalendarDays, FileText } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleCard } from "@/components/ArticleCard";

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const articleId = parseInt(id || "0", 10);

  const { data: article, isLoading } = useGetArticle(articleId, {
    query: { enabled: !!articleId, queryKey: getGetArticleQueryKey(articleId) }
  });

  const { data: pitches } = useGetArticlePitches(articleId, {
    query: { enabled: !!articleId, queryKey: getGetArticlePitchesQueryKey(articleId) }
  });

  const { data: related } = useGetRelatedArticles(articleId, {
    query: { enabled: !!articleId, queryKey: getGetRelatedArticlesQueryKey(articleId) }
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Skeleton className="h-6 w-32 mb-8 bg-primary/20" />
          <Skeleton className="h-16 md:h-24 w-full mb-6 bg-border" />
          <Skeleton className="h-8 w-3/4 mb-12 bg-border" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full bg-border" />
            <Skeleton className="h-4 w-full bg-border" />
            <Skeleton className="h-4 w-5/6 bg-border" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!article) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-32 text-center max-w-2xl">
          <h1 className="text-4xl font-serif text-destructive mb-4">RECORD NOT FOUND</h1>
          <p className="font-mono text-muted-foreground">The requested intelligence briefing does not exist or access is restricted.</p>
          <Link href="/articles" className="inline-block mt-8 border border-border/50 px-6 py-3 font-mono text-sm uppercase tracking-widest hover:border-primary/50 transition-colors">
            Return to Archive
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <article className="pb-24">
        {/* Header */}
        <header className="border-b border-border/50 bg-card py-16 md:py-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,var(--color-primary)_0%,transparent_50%)] opacity-[0.03] pointer-events-none" />
          
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link href={`/categories/${article.category.slug}`} className="font-mono text-xs uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-3 py-1 hover:bg-primary hover:text-primary-foreground transition-colors">
                {article.category.name}
              </Link>
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {article.readingTime} MIN READ
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <CalendarDays className="w-3 h-3" />
                {format(new Date(article.publishedAt || article.createdAt), "dd MMM yyyy")}
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium leading-[1.1] mb-6 tracking-tight">
              {article.title}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-sans max-w-3xl">
              {article.excerpt}
            </p>

            {article.sourceUrl && (
              <div className="mt-8">
                <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary transition-colors border border-border/50 px-3 py-1.5">
                  <ExternalLink className="w-3 h-3" />
                  View Original Source
                </a>
              </div>
            )}
          </div>
        </header>

        {/* Layout */}
        <div className="container mx-auto px-4 max-w-6xl mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="prose prose-invert prose-lg max-w-none font-serif prose-p:leading-relaxed prose-p:text-foreground/90 prose-headings:font-medium prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80 prose-blockquote:border-primary/50 prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:font-style-normal">
              {/* Note: Render body directly. If markdown, would need a parser, but assuming HTML or pre-formatted text based on specs. In this example, just raw text mapping or assuming it contains paragraphs */}
              {article.body.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Tags */}
            <div className="mt-16 pt-8 border-t border-border/50">
              <h3 className="font-mono text-xs uppercase tracking-widest text-primary mb-4">Classified Tags</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <Link 
                    key={tag.id}
                    href={`/articles?tag=${tag.slug}`}
                    className="font-mono text-xs px-3 py-1.5 bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* Pitch Matrix */}
            {(pitches || article.pitches) && (
              <div className="bg-card border border-border/50 overflow-hidden">
                <div className="bg-primary/10 border-b border-border/50 p-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-mono text-xs uppercase tracking-widest font-bold">Pitch Matrix</h3>
                </div>
                <div className="p-4">
                  <Tabs defaultValue="academic" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 bg-background border border-border/50 p-1 mb-4 h-auto">
                      <TabsTrigger value="academic" className="font-mono text-[10px] uppercase py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none">Academic</TabsTrigger>
                      <TabsTrigger value="editorial" className="font-mono text-[10px] uppercase py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none">Editorial</TabsTrigger>
                      <TabsTrigger value="executive" className="font-mono text-[10px] uppercase py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none">Executive</TabsTrigger>
                    </TabsList>
                    
                    {['academic', 'editorial', 'executive'].map(angle => {
                      const pitch = (pitches || article.pitches)?.[angle as keyof typeof pitches];
                      if (!pitch) return null;
                      return (
                        <TabsContent key={angle} value={angle} className="space-y-4 outline-none">
                          <h4 className="font-serif text-lg leading-tight">{pitch.headline}</h4>
                          <p className="font-sans text-sm text-muted-foreground leading-relaxed">{pitch.summary}</p>
                          <ul className="space-y-2">
                            {pitch.bullets.map((bullet: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm font-sans">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                <span className="text-foreground/80">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </div>
              </div>
            )}

            {/* Related Articles */}
            {related && related.length > 0 && (
              <div>
                <h3 className="font-mono text-xs uppercase tracking-widest text-primary border-b border-primary/20 pb-2 mb-6">Correlated Intelligence</h3>
                <div className="space-y-4">
                  {related.map(rel => (
                    <Link key={rel.id} href={`/articles/${rel.id}`} className="block group">
                      <div className="font-mono text-[10px] text-primary/70 uppercase mb-1">{rel.category.name}</div>
                      <h4 className="font-serif text-base group-hover:text-primary transition-colors line-clamp-2">{rel.title}</h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </article>
    </AppLayout>
  );
}