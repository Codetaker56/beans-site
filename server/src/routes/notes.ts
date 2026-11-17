import { Router } from "express";
import consola from "consola";

import { pool } from "../modules/db";
import { getVisitor, isAdmin } from "../modules/session";

const router: Router = Router();
const RANKS = ["stranger", "friend"] as const;

// Public: everyone's note. Friends float to the top, then newest.
router.get("/notes", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT discord_id, username, avatar, note, rank, updated_at
         FROM notes
        ORDER BY (rank = 'friend') DESC, updated_at DESC`,
    );
    res.json(rows);
  } catch (e) {
    consola.error("GET /notes failed:", e);
    res.status(500).json({ error: "internal error" });
  }
});

// Who am I + my own note (if any) + am I admin.
router.get("/me", async (req, res) => {
  try {
    const user = getVisitor(req);
    const admin = isAdmin(req);
    if (!user) return res.json({ user: null, note: null, isAdmin: admin });
    const { rows } = await pool.query(
      "SELECT note, rank FROM notes WHERE discord_id = $1",
      [user.id],
    );
    res.json({ user, note: rows[0] ?? null, isAdmin: admin });
  } catch (e) {
    consola.error("GET /me failed:", e);
    res.status(500).json({ error: "internal error" });
  }
});

// Create or edit MY note. One row per discord_id = one note per person.
router.put("/notes", async (req, res) => {
  const user = getVisitor(req);
  if (!user) return res.status(401).json({ error: "login required" });

  let note = req.body?.note;
  if (typeof note !== "string") return res.status(400).json({ error: "note required" });
  note = note.trim();
  if (note.length < 1 || note.length > 500) {
    return res.status(400).json({ error: "note must be 1-500 characters" });
  }

  try {
    await pool.query(
      `INSERT INTO notes (discord_id, username, avatar, note)
            VALUES ($1, $2, $3, $4)
       ON CONFLICT (discord_id)
       DO UPDATE SET note = EXCLUDED.note,
                     username = EXCLUDED.username,
                     avatar = EXCLUDED.avatar,
                     updated_at = now()`,
      [user.id, user.username, user.avatar || "", note],
    );
    res.json({ ok: true });
  } catch (e) {
    consola.error("PUT /notes failed:", e);
    res.status(500).json({ error: "internal error" });
  }
});

// Admin: set someone's rank.
router.post("/admin/rank", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "admin only" });
  const { discord_id, rank } = req.body ?? {};
  if (typeof discord_id !== "string" || !RANKS.includes(rank)) {
    return res.status(400).json({ error: "bad request" });
  }
  try {
    await pool.query("UPDATE notes SET rank = $1 WHERE discord_id = $2", [rank, discord_id]);
    res.json({ ok: true });
  } catch (e) {
    consola.error("POST /admin/rank failed:", e);
    res.status(500).json({ error: "internal error" });
  }
});

// Admin: delete a note.
router.delete("/admin/note/:id", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "admin only" });
  try {
    await pool.query("DELETE FROM notes WHERE discord_id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    consola.error("DELETE /admin/note failed:", e);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
