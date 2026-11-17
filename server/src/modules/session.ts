import crypto from "node:crypto";
import type { Request } from "express";

// Minimal signed-cookie sessions — HMAC over a base64url JSON payload. No deps,
// no server-side session store. Tamper = signature mismatch = rejected.

function secret(): string {
  return process.env.SESSION_SECRET || "";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function seal(obj: unknown): string {
  const p = Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${p}.${sign(p)}`;
}

export function unseal<T = unknown>(value: string | undefined): T | null {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i < 0) return null;
  const p = value.slice(0, i);
  const s = value.slice(i + 1);
  const expected = sign(p);
  if (
    s.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(p, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(name: string, value: string, maxAgeSec: number): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ].join("; ");
}

export function clearCookie(name: string): string {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export type Visitor = { id: string; username: string; avatar: string };

export function getVisitor(req: Request): Visitor | null {
  return unseal<Visitor>(parseCookies(req.headers.cookie)["uid"]);
}

export function isAdmin(req: Request): boolean {
  // Admin either via the email/password login (adm cookie) or by being the
  // designated Discord account.
  if (unseal(parseCookies(req.headers.cookie)["adm"]) !== null) return true;
  const adminId = process.env.ADMIN_DISCORD_ID;
  const visitor = getVisitor(req);
  return !!(adminId && visitor && visitor.id === adminId);
}
