import { Router } from "express";
import { db, articlesTable, categoriesTable, tagsTable } from "@workspace/db";
import { eq, sql, and, gte } from "drizzle-orm";

const router = Router();

// GET /api/stats
router.get("/", async (req, res) => {
  const [totalArticles] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articlesTable);

  const [publishedArticles] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articlesTable)
    .where(eq(articlesTable.status, "published"));

  const [totalCategories] = await db
    .select({ count: sql<number>`count(*)` })
    .from(categoriesTable);

  const [totalTags] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tagsTable);

  const categories = await db.select().from(categoriesTable);

  const articlesByCategory = await Promise.all(
    categories.map(async (cat) => {
      const [count] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articlesTable)
        .where(eq(articlesTable.categoryId, cat.id));
      return { category: cat.name, count: Number(count?.count ?? 0) };
    })
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const [recentIngest] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articlesTable)
    .where(and(
      sql`${articlesTable.sourceUrl} IS NOT NULL`,
      gte(articlesTable.createdAt, sevenDaysAgo)
    ));

  res.json({
    totalArticles: Number(totalArticles?.count ?? 0),
    publishedArticles: Number(publishedArticles?.count ?? 0),
    totalCategories: Number(totalCategories?.count ?? 0),
    totalTags: Number(totalTags?.count ?? 0),
    articlesByCategory,
    recentIngestCount: Number(recentIngest?.count ?? 0),
  });
});

export default router;
