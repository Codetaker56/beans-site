# beans

Personal site. Home with a live Discord presence card, about page, projects, and a notebook visitors can sign into with Discord.

## Stack

- **Frontend**: React + Vite + React Router
- **Backend**: Express + TypeScript (serves the build, proxies GitHub/Discord, Postgres for notes)

## Setup

```bash
cp .env.example .env   # fill in what you need
pnpm install
pnpm dev               # open the Express port (:8782), it proxies to Vite
```

Discord bits are optional: leave `DISCORD_BOT_TOKEN` blank to hide the widget.

## Production

```bash
pnpm build
NODE_ENV=production pnpm start
```
