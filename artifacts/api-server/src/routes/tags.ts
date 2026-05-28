import { Router } from "express";
import { db, tagsTable, articleTagsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { ListTagsQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /api/tags
router.get("/", async (req, res) => {
  const parsed = ListTagsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;

  const tags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
      createdAt: tagsTable.createdAt,
      articleCount: sql<number>`count(${articleTagsTable.tagId})`,
    })
    .from(tagsTable)
    .leftJoin(articleTagsTable, sql`${tagsTable.id} = ${articleTagsTable.tagId}`)
    .groupBy(tagsTable.id)
    .orderBy(sql`count(${articleTagsTable.tagId}) desc`)
    .limit(limit);

  res.json(tags.map((t) => ({ ...t, articleCount: Number(t.articleCount) })));
});

export default router;
