import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import categoriesRouter from "./categories";
import tagsRouter from "./tags";
import searchRouter from "./search";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/articles", articlesRouter);
router.use("/categories", categoriesRouter);
router.use("/tags", tagsRouter);
router.use("/search", searchRouter);
router.use("/stats", statsRouter);

export default router;
