import { Router } from "express";
import { db, articlesTable, categoriesTable } from "@workspace/db";
import { ilike, eq, or, desc, sql } from "drizzle-orm";
import { SearchArticlesQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /api/search?q=...
router.get("/", async (req, res) => {
  const parsed = SearchArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing query parameter 'q'" });
    return;
  }
  const { q, limit = 15 } = parsed.data;
  const term = `%${q}%`;

  const rows = await db
    .select()
    .from(articlesTable)
    .where(
      or(
        ilike(articlesTable.title, term),
        ilike(articlesTable.excerpt, term),
        ilike(articlesTable.body, term)
      )
    )
    .orderBy(desc(articlesTable.publishedAt))
    .limit(limit);

  const results = await Promise.all(
    rows.map(async (article) => {
      const cat = await db
        .select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug })
        .from(categoriesTable)
        .where(eq(categoriesTable.id, article.categoryId))
        .limit(1);

      const catCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(articlesTable)
        .where(eq(articlesTable.categoryId, article.categoryId));

      // Simple relevance: title match = 1.0, excerpt = 0.7, body = 0.4
      let relevanceScore = 0.4;
      if (article.title.toLowerCase().includes(q.toLowerCase())) relevanceScore = 1.0;
      else if (article.excerpt.toLowerCase().includes(q.toLowerCase())) relevanceScore = 0.7;

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        category: cat[0]
          ? { ...cat[0], description: null, articleCount: Number(catCount[0]?.count ?? 0) }
          : { id: 0, name: "Unknown", slug: "unknown", description: null, articleCount: 0 },
        relevanceScore,
        publishedAt: article.publishedAt?.toISOString() ?? null,
      };
    })
  );

  res.json(results.sort((a, b) => b.relevanceScore - a.relevanceScore));
});

export default router;
