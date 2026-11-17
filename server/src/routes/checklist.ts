import { Router } from "express";

import { pool } from "../modules/db";
import { isAdmin } from "../modules/session";

const router: Router = Router();
const KEY = "python_checklist";
const VALID = new Set(["know", "learning", "todo"]);

// Seeded on first read; after that the DB (site_kv) is the source of truth.
const DEFAULT = [
  { s: "know", t: "variables & data types" },
  { s: "know", t: "print & input" },
  { s: "know", t: "if / elif / else" },
  { s: "know", t: "for & while loops" },
  { s: "know", t: "lists" },
  { s: "know", t: "functions" },
  { s: "know", t: "comments" },
  { s: "learning", t: "dictionaries" },
  { s: "learning", t: "string methods & f-strings" },
  { s: "learning", t: "try / except (errors)" },
  { s: "todo", t: "classes & objects (OOP)" },
  { s: "todo", t: "reading & writing files" },
  { s: "todo", t: "modules & imports" },
  { s: "todo", t: "list comprehensions" },
  { s: "todo", t: "virtual environments" },
  { s: "todo", t: "using APIs / requests" },
];

async function ensureTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS site_kv (key TEXT PRIMARY KEY, value JSONB NOT NULL)`,
  );
}

// Public: the current checklist (everyone sees beans' real progress).
router.get("/checklist", async (_req, res) => {
  try {
    await ensureTable();
    const { rows } = await pool.query("SELECT value FROM site_kv WHERE key = $1", [KEY]);
    res.json({ items: rows[0]?.value ?? DEFAULT });
  } catch {
    res.status(500).json({ error: "failed" });
  }
});

// Admin only: replace the whole checklist.
router.put("/checklist", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "admin only" });
  const items = req.body?.items;
  if (!Array.isArray(items)) return res.status(400).json({ error: "items required" });
  const clean = items
    .filter((i) => i && typeof i.t === "string" && VALID.has(i.s))
    .slice(0, 100)
    .map((i) => ({ s: i.s, t: String(i.t).slice(0, 80) }));
  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO site_kv (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [KEY, JSON.stringify(clean)],
    );
    res.json({ items: clean });
  } catch {
    res.status(500).json({ error: "failed" });
  }
});

export default router;
