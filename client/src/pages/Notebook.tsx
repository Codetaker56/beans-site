import { useEffect, useState, useCallback } from "react";
import { SiDiscord } from "react-icons/si";
import { FaTrash } from "react-icons/fa";

import useTitle from "../hooks/Title";

type Note = {
  discord_id: string;
  username: string;
  avatar: string | null;
  note: string;
  rank: "stranger" | "friend";
  updated_at: string;
};

type Me = {
  user: { id: string; username: string; avatar: string } | null;
  note: { note: string; rank: string } | null;
  isAdmin: boolean;
};

export default function Notebook() {
  useTitle("beans — notebook");

  const [notes, setNotes] = useState<Note[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [n, m] = await Promise.all([
      fetch("/api/notes").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ]);
    setNotes(n);
    setMe(m);
    if (m.note?.note) setDraft(m.note.note);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveNote() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: draft }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("saved");
      load();
    } else {
      const e = await res.json().catch(() => ({}));
      setMsg(e.error || "failed to save");
    }
  }

  async function setRank(discord_id: string, rank: "stranger" | "friend") {
    // Update in place — do NOT re-sort, or the row jumps under the cursor and
    // the next click lands on the wrong person.
    const res = await fetch("/api/admin/rank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discord_id, rank }),
    });
    if (res.ok) {
      setNotes((prev) =>
        prev
          ? prev.map((n) => (n.discord_id === discord_id ? { ...n, rank } : n))
          : prev,
      );
    }
  }

  async function del(discord_id: string) {
    const res = await fetch(`/api/admin/note/${discord_id}`, { method: "DELETE" });
    if (res.ok) {
      setNotes((prev) => (prev ? prev.filter((n) => n.discord_id !== discord_id) : prev));
    }
  }

  async function logout() {
    await fetch("/auth/logout", { method: "POST" });
    load();
  }

  const isAdmin = me?.isAdmin ?? false;

  return (
    <div className="centered">
      <h1 style={{ marginBottom: 0 }}>notebook</h1>
      <p>
        leave one note about me. sign in with discord so i know who you are
        &mdash; you can edit it any time.
      </p>

      {/* own note editor / login */}
      {me && !me.user && (
        <a className="link-button" href="/auth/discord">
          <div className="link-icon">
            <SiDiscord size={20} />
          </div>
          <div className="link-text-container">
            <span className="link-text-upper">sign in</span>
            <span className="link-text-lower">log in with discord</span>
          </div>
        </a>
      )}

      {me?.user && (
        <div className="note-editor">
          <div className="note-editor-head">
            <span>
              signed in as <span className="accent">{me.user.username}</span>
              {isAdmin && <span className="rank-badge friend" style={{ marginLeft: 8 }}>admin</span>}
            </span>
            <button className="link-text-upper linkbtn" onClick={logout}>
              log out
            </button>
          </div>
          <textarea
            className="note-textarea"
            maxLength={500}
            placeholder="write your note about beans…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="note-editor-foot">
            <span className="link-text-upper">{draft.length}/500</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {msg && <span className="link-text-upper">{msg}</span>}
              <button
                className="lk-solid"
                onClick={saveNote}
                disabled={saving || draft.trim().length === 0}
              >
                {me.note ? "update note" : "save note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* everyone's notes */}
      <div className="notes-list">
        {notes === null ? (
          <p className="mono">loading…</p>
        ) : notes.length === 0 ? (
          <p className="mono">no notes yet — be the first.</p>
        ) : (
          notes.map((n) => (
            <div className="note-card" key={n.discord_id}>
              <div className="note-card-head">
                {n.avatar ? (
                  <img className="note-avatar" src={n.avatar} alt="" />
                ) : (
                  <div className="note-avatar" />
                )}
                <span className="note-name">{n.username}</span>
                <span className={`rank-badge ${n.rank}`}>{n.rank}</span>
                {isAdmin && (
                  <div className="note-admin">
                    <button
                      className="linkbtn"
                      onClick={() =>
                        setRank(n.discord_id, n.rank === "friend" ? "stranger" : "friend")
                      }
                    >
                      {n.rank === "friend" ? "→ stranger" : "→ friend"}
                    </button>
                    <button className="linkbtn danger" onClick={() => del(n.discord_id)}>
                      <FaTrash size={11} />
                    </button>
                  </div>
                )}
              </div>
              <p className="note-body">{n.note}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
