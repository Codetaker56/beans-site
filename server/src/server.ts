import express from "express";
import path from "node:path";
import { config } from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import { discordClient } from "./modules/discordClient";

config({ path: path.join(__dirname, "../../.env"), quiet: true });
const isDev = process.env.NODE_ENV !== "production";

import projectsRouter from "./routes/projects";
import discordRouter from "./routes/discord";
import authRouter from "./routes/auth";
import notesRouter from "./routes/notes";
import checklistRouter from "./routes/checklist";
import consola from "consola";

const app = express();

const clientDirectory = path.join(__dirname, "../../client");
const buildDirectory = path.join(clientDirectory, "dist");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use(express.static(path.join(__dirname, "../static")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", true);

app.use("/projects", projectsRouter);
app.use("/discord", discordRouter);
app.use("/auth", authRouter);
app.use("/api", notesRouter);
app.use("/api", checklistRouter);

if (isDev) {
  app.use(
    createProxyMiddleware({
      target: "http://localhost:5173",
      changeOrigin: true,
      ws: true,
    }),
  );
} else {
  app.use(express.static(buildDirectory));

  app.get("*", (req, res) => {
    res.sendFile(path.join(buildDirectory, "index.html"));
  });
}

consola.start(
  `Starting webserver on port ${process.env.EXPRESS_PORT}, env: ${process.env.NODE_ENV}...`,
);

app.listen(process.env.EXPRESS_PORT, async () => {
  consola.success(
    `Webserver started on http://localhost:${process.env.EXPRESS_PORT}`,
  );

  if (!process.env.DISCORD_BOT_TOKEN) {
    consola.warn("No DISCORD_BOT_TOKEN set — Discord widget disabled.");
    return;
  }

  try {
    consola.start(`Logging into Discord client...`);
    await discordClient.login(process.env.DISCORD_BOT_TOKEN);
    consola.success(
      `Discord client ready, user: ${discordClient.user?.username}`,
    );
  } catch (err) {
    consola.error("Discord login failed — widget disabled:", err);
  }
});
