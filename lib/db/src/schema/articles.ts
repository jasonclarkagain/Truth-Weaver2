import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tagsTable = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  sourceUrl: text("source_url"),
  sourceRaw: text("source_raw"),
  categoryId: integer("category_id").notNull(),
  pitches: jsonb("pitches"),
  readingTime: integer("reading_time").notNull().default(5),
  isFeatured: boolean("is_featured").notNull().default(false),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const articleTagsTable = pgTable("article_tags", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  tagId: integer("tag_id").notNull(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true, createdAt: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;

export const insertTagSchema = createInsertSchema(tagsTable).omit({ id: true, createdAt: true });
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tagsTable.$inferSelect;

export const insertArticleSchema = createInsertSchema(articlesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;

export const insertArticleTagSchema = createInsertSchema(articleTagsTable).omit({ id: true });
export type InsertArticleTag = z.infer<typeof insertArticleTagSchema>;
export type ArticleTag = typeof articleTagsTable.$inferSelect;
