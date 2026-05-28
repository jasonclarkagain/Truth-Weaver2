import { Router } from "express";
import { db, categoriesTable, articlesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /api/categories
router.get("/", async (req, res) => {
  const categories = await db.select().from(categoriesTable);

  const withCounts = await Promise.all(
    categories.map(async (cat) => {
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(articlesTable)
        .where(eq(articlesTable.categoryId, cat.id));
      return {
        ...cat,
        articleCount: Number(count[0]?.count ?? 0),
      };
    })
  );

  res.json(withCounts);
});

export default router;
