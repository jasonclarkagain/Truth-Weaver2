import React from "react";
import { Link } from "wouter";
import { Article } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Clock, Tag as TagIcon } from "lucide-react";

interface ArticleCardProps {
  article: Article;
  index?: number;
}

export function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative h-full flex flex-col bg-card border border-border/40 p-6 glow-hover"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4">
        <Link href={`/categories/${article.category.slug}`} className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors z-10">
          {article.category.name}
        </Link>
        <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {article.readingTime} MIN
        </span>
      </div>

      <Link href={`/articles/${article.id}`} className="flex-1 flex flex-col z-10 outline-none">
        <h3 className="text-xl md:text-2xl font-serif font-medium leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-3">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1 mb-6 font-sans">
          {article.excerpt}
        </p>
      </Link>

      <div className="flex flex-wrap items-center gap-2 mt-auto">
        {article.tags.slice(0, 3).map(tag => (
          <Link 
            key={tag.id} 
            href={`/articles?tag=${tag.slug}`}
            className="text-[10px] font-mono bg-secondary/50 px-2 py-1 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            #{tag.name}
          </Link>
        ))}
        {article.tags.length > 3 && (
          <span className="text-[10px] font-mono text-muted-foreground">+{article.tags.length - 3}</span>
        )}
      </div>
    </motion.div>
  );
}