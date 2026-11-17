import { useEffect, useState } from "react";
import { SiPython } from "react-icons/si";

import LinkButton from "../components/LinkButton";
import useTitle from "../hooks/Title";

type Status = "know" | "learning" | "todo";
type Item = { s: Status; t: string };

const DEFAULT: Item[] = [
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

const MARK: Record<Status, string> = { know: "✓", learning: "◐", todo: "○" };
const COLOR: Record<Status, string> = {
  know: "var(--amber)",
  learning: "var(--amber-hi)",
  todo: "#7a7a7a",
};
// clicking cycles progress: not started -> learning -> known -> back
const NEXT: Record<Status, Status> = { todo: "learning", learning: "know", know: "todo" };

export default function About() {
  useTitle("beans — about");

  const [items, setItems] = useState<Item[]>(DEFAULT);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/checklist")
      .then((r) => r.json())
      .then((d) => Array.isArray(d.items) && d.items.length && setItems(d.items))
      .catch(() => {});
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.isAdmin))
      .catch(() => {});
  }, []);

  function tick(index: number) {
    if (!isAdmin) return;
    const next = items.map((it, i) => (i === index ? { ...it, s: NEXT[it.s] } : it));
    setItems(next);
    fetch("/api/checklist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next }),
    }).catch(() => {});
  }

  return (
    <div className="centered">
      <h1 style={{ marginBottom: 0 }}>about</h1>

      <p>
        i'm just getting started with programming. i know some basic{" "}
        <span className="accent-gradient">Python</span> &mdash; variables,
        loops, functions, that kind of thing &mdash; and i'm still working
        through the fundamentals.
      </p>

      <p>
        my goal is to get comfortable with the basics first, then start learning
        more languages one at a time.
      </p>

      <h2 style={{ margin: 0 }}>learning now</h2>
      <div className="link-container">
        <LinkButton
          href="https://www.python.org"
          lowerText="Python"
          icon={<SiPython size={20} />}
        />
      </div>

      <h2 style={{ marginBottom: 0 }}>python checklist</h2>
      <p style={{ fontSize: "0.9rem", marginTop: "0.4rem" }}>
        where i'm at, honestly.{isAdmin ? " (tap an item to update it)" : ""}
      </p>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 auto",
          maxWidth: 320,
          textAlign: "left",
          lineHeight: 2,
        }}
      >
        {items.map((i, idx) => (
          <li
            key={i.t}
            onClick={() => tick(idx)}
            style={{
              display: "flex",
              gap: "0.6rem",
              alignItems: "center",
              opacity: i.s === "todo" ? 0.5 : 1,
              cursor: isAdmin ? "pointer" : "default",
              userSelect: "none",
            }}
          >
            <span style={{ width: "1.1rem", textAlign: "center", color: COLOR[i.s] }}>
              {MARK[i.s]}
            </span>
            <span>{i.t}</span>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: "0.8rem", opacity: 0.55, marginTop: "0.4rem" }}>
        <span style={{ color: "var(--amber)" }}>✓</span> know &nbsp;
        <span style={{ color: "var(--amber-hi)" }}>◐</span> learning &nbsp;○ still
        to learn
      </p>

      <h2>want to learn</h2>
      <p style={{ fontSize: "0.95rem" }}>
        HTML first, then JavaScript, then C++ (or C, but probably C++) down the
        line. one step at a time.
      </p>
    </div>
  );
}
