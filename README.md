# Jovée Cockpit

A Jarvis-style master control panel for running Jovée Technologies — a single
local web app that ties together your Obsidian vault, your Charlotte salon
outreach, your AI agents, and (optionally) Hubspot and Trello.

It runs entirely on your laptop. No server, no Docker, no cloud — just Node.

## What's inside

Seven panels, accessible from the left sidebar:

| Panel | What it does |
|---|---|
| **Home** | 4 product cards (AR, Link, Kiosk, Polish) + recent vault activity. |
| **Neural Map** | Force-directed graph of every `.md` file in your vault, color-coded by section, with a side drawer to read full notes. |
| **CRM Pipeline** | Kanban view of your Hubspot deals across pipelines. |
| **Project Tasks** | Kanban view of your Trello board "Jovée Operations". |
| **Salon Map** | Live map of Charlotte salons with status-colored pins, drawer to update notes, and "+ Add Salon" with free auto-geocoding. |
| **Agents Hub** | Five preloaded AI agents (Product Status, Patent/IP, Marketing, Salon Outreach, Weekly Standup), plus a "+ New Agent" creator. |
| **Settings** | Where you paste API keys. Writes them to `.env.local`. Each row has a "Test connection" button. |

Dark mode is the default. Click the sun/moon icon in the top bar to flip.

## Prerequisites

- **Node.js 20 or higher** (`node --version` should print `v20.x` or newer)

That is the entire list. No Docker, no Postgres, no Redis.

## Setup in 4 steps

```bash
# 1. Install dependencies
npm install

# 2. Initialize the SQLite database (creates dev.db)
npx prisma db push --schema=prisma/schema.prisma

# 3. Seed 12 Charlotte salons + 5 starter agents
npx tsx prisma/seed.ts

# 4. Start the app
npm run dev
```

Then open <http://localhost:3000>. You'll be redirected to **Home**.

> **Tip:** Steps 2 and 3 are combined in `npm run db:seed`. After the first
> setup, you only need `npm run dev`.

## What works without any API keys

A lot. You can ship without ever pasting a key:

- **Home dashboard** — product cards + recent vault activity.
- **Neural Map** — full graph of your Obsidian vault. The default vault path
  is `D:/Downloads/Jovee/Jovee Vault`. Change it in Settings if yours lives
  elsewhere.
- **Salon Map** — full Charlotte map with 12 seeded salons, drawer editing,
  and "+ Add Salon" with free OpenStreetMap auto-geocoding.
- **Agents Hub** — view/edit/create agents (the chat feature needs an
  Anthropic key).
- **Settings** — paste keys here when you're ready.

The **CRM Pipeline** and **Project Tasks** panels show a friendly empty state
until you connect Hubspot and Trello.

## Getting the API keys (when you're ready)

### Hubspot Private App Token

1. In Hubspot, click your account icon → **Settings**.
2. Left sidebar → **Integrations** → **Private Apps**.
3. **Create a private app**. Give it a name like *Jovée Cockpit*.
4. **Scopes** tab — enable read scopes for `crm.objects.deals`,
   `crm.objects.contacts`, `crm.objects.companies`, and `crm.pipelines.deals`.
5. **Create app** → copy the **Access token** (shows once).
6. Paste it in **Cockpit → Settings → Hubspot Private App Token** and click
   **Test connection**.

Reference: <https://developers.hubspot.com/docs/api/private-apps>

### Trello API Key + Token

1. Visit <https://trello.com/app-key> while logged into Trello.
2. The **Personal Key** at the top is your `TRELLO_API_KEY`.
3. Below the key there's a **manually generate a token** link — click it and
   approve. The long string is your `TRELLO_API_TOKEN`.
4. Paste **both** into Cockpit Settings and Test connection on the token row.

> The board defaults to one named **Jovée Operations**. If you don't have
> one, the app falls back to your first available board until you create it.

### Anthropic API Key

1. Sign in at <https://console.anthropic.com>.
2. **Settings → API Keys → Create key**.
3. Copy the key (starts with `sk-ant-`).
4. Paste into Cockpit Settings → **Anthropic API Key**.

## Customizing the vault path

Default: `D:/Downloads/Jovee/Jovee Vault`.

To change: **Settings → Obsidian Vault Path → Save**. The Neural Map will
re-scan on next load. Use forward slashes (`/`) on Windows — they work, and
they don't require escaping.

## Troubleshooting

### "Cannot find module '@prisma/client'"

You skipped `npm install`, or the post-install Prisma generate step didn't
run. Re-run:

```bash
npm install
npx prisma generate
```

### Neural Map shows "No notes found"

The vault path is wrong, or it points to an empty folder. Go to **Settings**
and verify the path actually exists and contains `.md` files. On Windows,
prefer forward slashes (`D:/Downloads/...`) to avoid escaping issues.

### Salon Map markers don't show / map is gray

Two possibilities:

1. The tile server is blocked by your network. The map uses
   `basemaps.cartocdn.com` — make sure it's reachable.
2. JavaScript console shows a Leaflet error. Hard-refresh (`Ctrl+Shift+R`)
   after the first load — Leaflet's CSS loads lazily and a stale cache can
   confuse it.

## The vision (what's coming in v2)

- Bulk CSV import of Charlotte salons from a spreadsheet
- Hubspot ↔ Salon Map sync (Hubspot Salon companies show up on the map)
- Scheduled Weekly Standup Agent that writes a Monday-morning summary
- Voice input on the top-bar search ("Jarvis, show me last week's vault edits")
- Mobile-responsive layout so you can check the cockpit from a phone
- Drag-and-drop kanban for Trello + Hubspot

## File map

```
jovee-cockpit/
├── app/
│   ├── (panels)/          # The 7 panels
│   ├── api/               # Server routes (vault, salons, agents, etc.)
│   ├── globals.css        # Tailwind layer + dark mode tokens
│   └── layout.tsx
├── components/
│   ├── NeuralMap.tsx      # Cytoscape graph
│   ├── SalonMap.tsx       # Leaflet map
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   └── ui/                # Buttons, cards, dialogs, drawer
├── lib/
│   ├── prisma.ts
│   ├── vault-parser.ts    # Walks vault, builds graph
│   ├── vault-sections.ts  # Section → color (client-safe)
│   ├── hubspot.ts
│   └── trello.ts
├── prisma/
│   ├── schema.prisma      # Salon + Agent models
│   └── seed.ts            # 12 salons + 5 agents
├── .env.local             # Your keys (gitignored)
└── README.md
```

## Brand colors used

- Deep Teal `#1a6b6b` — primary actions
- Blush `#f5d5d0` — accents
- Deep Navy `#0d2840` — anchor text in light mode
- Charcoal `#1a1a1a` — dark backgrounds
- Bone `#f5f5f0` — light backgrounds

Fonts: **Montserrat** for headings, **Inter** for body — both from Google Fonts.

---

Built with: Next.js 14 (App Router), TypeScript, Tailwind, Prisma + SQLite,
Cytoscape.js, react-leaflet, react-query, sonner, next-themes.
