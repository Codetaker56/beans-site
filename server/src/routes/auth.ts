import { Router } from "express";
import crypto from "node:crypto";
import consola from "consola";

import { seal, unseal, parseCookies, cookie, clearCookie } from "../modules/session";

const router: Router = Router();

const env = (k: string) => process.env[k] || "";

// --- Discord OAuth (visitor login) ---

router.get("/discord", (_req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  res.setHeader("Set-Cookie", cookie("oauth_state", seal({ state }), 600));
  const u = new URL("https://discord.com/api/oauth2/authorize");
  u.searchParams.set("client_id", env("DISCORD_CLIENT_ID"));
  u.searchParams.set("redirect_uri", env("DISCORD_REDIRECT_URI"));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "identify");
  u.searchParams.set("state", state);
  res.redirect(u.toString());
});

router.get("/discord/callback", async (req, res) => {
  try {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    const saved = unseal<{ state: string }>(
      parseCookies(req.headers.cookie)["oauth_state"],
    );
    if (!code || !state || !saved || saved.state !== state) {
      return res.redirect("/notebook?err=state");
    }

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env("DISCORD_CLIENT_ID"),
        client_secret: env("DISCORD_CLIENT_SECRET"),
        grant_type: "authorization_code",
        code,
        redirect_uri: env("DISCORD_REDIRECT_URI"),
      }),
    });
    if (!tokenRes.ok) return res.redirect("/notebook?err=token");
    const { access_token } = await tokenRes.json();

    const meRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!meRes.ok) return res.redirect("/notebook?err=me");
    const u = await meRes.json();

    const avatar = u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith("a_") ? "gif" : "png"}?size=128`
      : "";
    const sess = seal({ id: u.id, username: u.global_name || u.username, avatar });
    res.setHeader("Set-Cookie", [
      cookie("uid", sess, 60 * 60 * 24 * 30),
      clearCookie("oauth_state"),
    ]);
    res.redirect("/notebook");
  } catch (e) {
    consola.error("OAuth callback failed:", e);
    res.redirect("/notebook?err=1");
  }
});

// --- Admin login (email + password) ---

function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const got = crypto.scryptSync(pw, salt, 64);
  const want = Buffer.from(hash, "hex");
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

router.post("/admin", (req, res) => {
  const { email, password } = req.body ?? {};
  const ok =
    typeof email === "string" &&
    typeof password === "string" &&
    email.toLowerCase() === env("ADMIN_EMAIL").toLowerCase() &&
    verifyPassword(password, env("ADMIN_PASSWORD_HASH"));
  if (!ok) return res.status(401).json({ error: "invalid credentials" });
  res.setHeader("Set-Cookie", cookie("adm", seal({ email, t: Date.now() }), 60 * 60 * 24 * 7));
  res.json({ ok: true });
});

router.post("/logout", (_req, res) => {
  res.setHeader("Set-Cookie", [clearCookie("uid"), clearCookie("adm")]);
  res.json({ ok: true });
});

export default router;
