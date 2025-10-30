import { Router } from "express";
import { readLastSends } from "../services/sendLog.js";

const router = Router();

router.get("/sends", async (_req, res) => {
  const items = await readLastSends(50);
  res.json(items);
});

export default router;


