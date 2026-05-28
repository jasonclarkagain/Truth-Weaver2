import { Router } from "express";
import { eq, desc, ilike, sql, and, inArray } from "drizzle-orm";
import { db, articlesTable, categoriesTable, tagsTable, articleTagsTable } from "@workspace/db";
import {
  GetArticleParams,
  UpdateArticleParams,
  DeleteArticleParams,
  GetArticlePitchesParams,
  GetRelatedArticlesParams,
  CreateArticleBody,
  UpdateArticleBody,
  IngestArticleBody,
  ListArticlesQueryParams,
  GetRecentArticlesQueryParams,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// Helper: build full article object with category and tags
async function buildArticle(articleId: number) {
  const article = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, articleId))
    .limit(1);

  if (!article[0]) return null;

  const category = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, article[0].categoryId))
    .limit(1);

  const articleTagRows = await db
    .select({ tagId: articleTagsTable.tagId })
    .from(articleTagsTable)
    .where(eq(articleTagsTable.articleId, articleId));

  const tagIds = articleTagRows.map((r) => r.tagId);
  const tags =
    tagIds.length > 0
      ? await db.select().from(tagsTable).where(inArray(tagsTable.id, tagIds))
      : [];

  // Compute tag article counts
  const tagCounts = await db
    .select({
      tagId: articleTagsTable.tagId,
      count: sql<number>`count(*)`,
    })
    .from(articleTagsTable)
    .groupBy(articleTagsTable.tagId);

  const tagCountMap = Object.fromEntries(
    tagCounts.map((t) => [t.tagId, Number(t.count)])
  );

  const catCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(articlesTable)
    .where(eq(articlesTable.categoryId, article[0].categoryId));

  return {
    ...article[0],
    category: {
      ...category[0],
      articleCount: Number(catCount[0]?.count ?? 0),
    },
    tags: tags.map((t) => ({ ...t, articleCount: tagCountMap[t.id] ?? 0 })),
    pitches: article[0].pitches ?? null,
    publishedAt: article[0].publishedAt?.toISOString() ?? null,
    createdAt: article[0].createdAt.toISOString(),
    updatedAt: article[0].updatedAt.toISOString(),
  };
}

async function buildArticleList(
  categorySlug?: string,
  tagSlug?: string,
  limit = 20,
  offset = 0
) {
  let categoryId: number | undefined;
  if (categorySlug) {
    const cat = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, categorySlug))
      .limit(1);
    if (cat[0]) categoryId = cat[0].id;
  }

  let tagId: number | undefined;
  if (tagSlug) {
    const tag = await db
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.slug, tagSlug))
      .limit(1);
    if (tag[0]) tagId = tag[0].id;
  }

  let articleIds: number[];

  if (tagId) {
    const rows = await db
      .select({ articleId: articleTagsTable.articleId })
      .from(articleTagsTable)
      .where(eq(articleTagsTable.tagId, tagId));
    articleIds = rows.map((r) => r.articleId);
    if (articleIds.length === 0) return [];
  }

  const conditions = [];
  if (categoryId) conditions.push(eq(articlesTable.categoryId, categoryId));
  if (tagId && articleIds!) {
    conditions.push(inArray(articlesTable.id, articleIds!));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(articlesTable)
    .where(whereClause)
    .orderBy(desc(articlesTable.publishedAt))
    .limit(limit)
    .offset(offset);

  return Promise.all(rows.map((r) => buildArticle(r.id)));
}

// Generate pitches using AI
async function generatePitches(title: string, body: string) {
  const prompt = `You are an editorial intelligence engine. Given the following article, generate a "Pitch Matrix" with 3 distinct angles.

Article Title: ${title}

Article Content:
${body.substring(0, 3000)}

Generate a JSON object with exactly this structure:
{
  "academic": {
    "angle": "academic",
    "headline": "<precise, data-forward headline>",
    "summary": "<2-3 sentences: empirical overview, systems-level analysis>",
    "bullets": ["<key data point or mechanism>", "<second finding>", "<third implication>"]
  },
  "editorial": {
    "angle": "editorial",
    "headline": "<gripping, narrative-driven headline>",
    "summary": "<2-3 sentences: human stakes, mystery, philosophical weight>",
    "bullets": ["<hook>", "<conflict or revelation>", "<takeaway>"]
  },
  "executive": {
    "angle": "executive",
    "headline": "<sharp, action-oriented headline>",
    "summary": "<1-2 sentences: bottom line>",
    "bullets": ["<key fact 1>", "<key fact 2>", "<key fact 3>", "<key fact 4>"]
  }
}

Return ONLY the JSON, no markdown, no explanation.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Rewrite raw content using AI
async function rewriteContent(rawText: string, sourceUrl: string) {
  const prompt = `You are a world-class investigative journalist writing for a premium editorial outlet.

Source URL: ${sourceUrl}

Raw source content:
${rawText.substring(0, 6000)}

Rewrite this as a completely original, authoritative long-form investigative piece. Requirements:
- 600-1200 words
- Write in the style of Wired, The New Yorker, or a high-end technical design journal
- Extract the core empirical arguments and synthesize them into an elegant narrative
- Do not plagiarize — fully reconstruct the ideas in original prose
- Include a compelling title and a 2-3 sentence excerpt/lede
- Return a JSON object: { "title": "...", "excerpt": "...", "body": "..." }

Return ONLY the JSON, no markdown fences.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { title: "Untitled", excerpt: "", body: rawText.substring(0, 2000) };
  }
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
}

function estimateReadingTime(body: string) {
  const words = body.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// GET /api/articles
router.get("/", async (req, res) => {
  const parsed = ListArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { category, tag, limit = 20, offset = 0 } = parsed.data;
  const articles = await buildArticleList(category, tag, limit, offset);
  res.json(articles.filter(Boolean));
});

// POST /api/articles
router.post("/", async (req, res) => {
  const parsed = CreateArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { title, excerpt, body, categoryId, tagIds, isFeatured, status } = parsed.data;
  const slug = generateSlug(title);
  const readingTime = estimateReadingTime(body);

  const [inserted] = await db
    .insert(articlesTable)
    .values({
      title,
      slug,
      excerpt,
      body,
      categoryId,
      readingTime,
      isFeatured: isFeatured ?? false,
      status: status ?? "draft",
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning();

  if (tagIds && tagIds.length > 0) {
    await db.insert(articleTagsTable).values(
      tagIds.map((tagId: number) => ({ articleId: inserted.id, tagId }))
    );
  }

  const article = await buildArticle(inserted.id);
  res.status(201).json(article);
});

// POST /api/articles/ingest
router.post("/ingest", async (req, res) => {
  const parsed = IngestArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { url, categoryId, tagIds } = parsed.data;

  let rawText = "";
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AxiomSynapse/1.0; +https://axiomsynapse.com)",
      },
      signal: AbortSignal.timeout(15000),
    });
    const html = await response.text();
    // Strip HTML tags and boilerplate
    rawText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    res.status(400).json({ error: "Failed to fetch URL. Ensure it is publicly accessible." });
    return;
  }

  if (rawText.length < 100) {
    res.status(400).json({ error: "Insufficient content extracted from URL." });
    return;
  }

  const rewritten = await rewriteContent(rawText, url);
  const slug = generateSlug(rewritten.title);
  const readingTime = estimateReadingTime(rewritten.body);
  const pitches = await generatePitches(rewritten.title, rewritten.body);

  const [inserted] = await db
    .insert(articlesTable)
    .values({
      title: rewritten.title,
      slug,
      excerpt: rewritten.excerpt,
      body: rewritten.body,
      sourceUrl: url,
      sourceRaw: rawText.substring(0, 10000),
      categoryId,
      pitches,
      readingTime,
      isFeatured: false,
      status: "published",
      publishedAt: new Date(),
    })
    .returning();

  if (tagIds && tagIds.length > 0) {
    await db.insert(articleTagsTable).values(
      tagIds.map((tagId: number) => ({ articleId: inserted.id, tagId }))
    );
  }

  const article = await buildArticle(inserted.id);
  res.status(201).json(article);
});

// GET /api/articles/featured
router.get("/featured", async (req, res) => {
  const rows = await db
    .select()
    .from(articlesTable)
    .where(and(eq(articlesTable.isFeatured, true), eq(articlesTable.status, "published")))
    .orderBy(desc(articlesTable.publishedAt))
    .limit(5);
  const articles = await Promise.all(rows.map((r) => buildArticle(r.id)));
  res.json(articles.filter(Boolean));
});

// GET /api/articles/recent
router.get("/recent", async (req, res) => {
  const parsed = GetRecentArticlesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;
  const rows = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.status, "published"))
    .orderBy(desc(articlesTable.publishedAt))
    .limit(limit);
  const articles = await Promise.all(rows.map((r) => buildArticle(r.id)));
  res.json(articles.filter(Boolean));
});

// GET /api/articles/:id
router.get("/:id", async (req, res) => {
  const parsed = GetArticleParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const article = await buildArticle(parsed.data.id);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json(article);
});

// PATCH /api/articles/:id
router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdateArticleParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateArticleBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { id } = paramsParsed.data;
  const { tagIds, ...updates } = bodyParsed.data;

  const updateData: Partial<typeof articlesTable.$inferInsert> = {};
  if (updates.title !== undefined) {
    updateData.title = updates.title;
    updateData.slug = generateSlug(updates.title);
  }
  if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt;
  if (updates.body !== undefined) {
    updateData.body = updates.body;
    updateData.readingTime = estimateReadingTime(updates.body);
  }
  if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId;
  if (updates.isFeatured !== undefined) updateData.isFeatured = updates.isFeatured;
  if (updates.status !== undefined) {
    updateData.status = updates.status;
    if (updates.status === "published") updateData.publishedAt = new Date();
  }
  updateData.updatedAt = new Date();

  await db.update(articlesTable).set(updateData).where(eq(articlesTable.id, id));

  if (tagIds !== undefined) {
    await db.delete(articleTagsTable).where(eq(articleTagsTable.articleId, id));
    if (tagIds.length > 0) {
      await db.insert(articleTagsTable).values(
        tagIds.map((tagId: number) => ({ articleId: id, tagId }))
      );
    }
  }

  const article = await buildArticle(id);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json(article);
});

// DELETE /api/articles/:id
router.delete("/:id", async (req, res) => {
  const parsed = DeleteArticleParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(articleTagsTable).where(eq(articleTagsTable.articleId, parsed.data.id));
  await db.delete(articlesTable).where(eq(articlesTable.id, parsed.data.id));
  res.status(204).end();
});

// GET /api/articles/:id/pitches
router.get("/:id/pitches", async (req, res) => {
  const parsed = GetArticlePitchesParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rows = await db
    .select({ pitches: articlesTable.pitches, title: articlesTable.title, body: articlesTable.body })
    .from(articlesTable)
    .where(eq(articlesTable.id, parsed.data.id))
    .limit(1);

  if (!rows[0]) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  let pitches = rows[0].pitches as Record<string, unknown> | null;

  if (!pitches) {
    pitches = await generatePitches(rows[0].title, rows[0].body);
    if (pitches) {
      await db
        .update(articlesTable)
        .set({ pitches })
        .where(eq(articlesTable.id, parsed.data.id));
    }
  }

  res.json(pitches ?? { academic: null, editorial: null, executive: null });
});

// GET /api/articles/:id/related
router.get("/:id/related", async (req, res) => {
  const parsed = GetRelatedArticlesParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const articleId = parsed.data.id;
  const article = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, articleId))
    .limit(1);

  if (!article[0]) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  // Get articles in same category, excluding this one
  const related = await db
    .select()
    .from(articlesTable)
    .where(
      and(
        eq(articlesTable.categoryId, article[0].categoryId),
        eq(articlesTable.status, "published")
      )
    )
    .orderBy(desc(articlesTable.publishedAt))
    .limit(6);

  const filtered = related.filter((r) => r.id !== articleId).slice(0, 5);
  const articles = await Promise.all(filtered.map((r) => buildArticle(r.id)));
  res.json(articles.filter(Boolean));
});

export default router;
