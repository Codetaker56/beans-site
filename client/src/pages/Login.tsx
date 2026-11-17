import { useState } from "react";
import { useNavigate } from "react-router-dom";

import useTitle from "../hooks/Title";

export default function Login() {
  useTitle("beans — admin");
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/auth/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (res.ok) navigate("/notebook");
    else setErr("invalid credentials");
  }

  return (
    <div className="centered">
      <h1 style={{ marginBottom: 0 }}>admin</h1>
      <form className="note-editor" onSubmit={submit} style={{ maxWidth: 340 }}>
        <input
          className="note-input"
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
        <input
          className="note-input"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {err && <span className="link-text-upper" style={{ color: "#ed4245" }}>{err}</span>}
        <button className="lk-solid" type="submit" disabled={busy}>
          {busy ? "…" : "log in"}
        </button>
      </form>
    </div>
  );
}
