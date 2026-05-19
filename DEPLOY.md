# Deploying the Jovée Cockpit

A non-technical, step-by-step guide to take the cockpit from your laptop to a
URL your team can open. **Total time: ~60-90 minutes.** Costs: $0 on free tiers.

You'll set up four services:

1. **Neon** — the Postgres database (replaces the local SQLite file)
2. **GitHub** — two private repos, one for the cockpit code, one for your vault
3. **Vercel** — hosts the Next.js app
4. **Obsidian Git** — the plugin that auto-pushes vault edits

---

## Part 1 — Database on Neon (~10 min)

1. Go to <https://neon.tech> and sign in with GitHub or Google.
2. **Create Project** → name it `jovee-cockpit`, region pick **AWS US-East**
   (closest to Charlotte).
3. After creation, you land on the dashboard. In the **Connection Details**
   card, copy the connection string. It looks like:

   ```
   postgresql://neondb_owner:abc123@ep-blah-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

4. On your laptop, edit `D:\Downloads\Jovee\jovee-cockpit\.env.local` and
   paste this in as `DATABASE_URL`. Replace the existing SQLite line.

5. From a terminal in the cockpit folder, run:

   ```
   npx prisma db push
   npx tsx prisma/restore-data.ts
   ```

   `db push` creates the Salon + Agent tables in Neon.
   `restore-data.ts` loads the 210 salons + 5 agents from `prisma/backup.json`
   into Neon. Should take ~30 seconds.

6. Test locally: `npm run dev`, open <http://localhost:3011/salons>. If you
   still see all your salons, Neon is wired up.

---

## Part 2 — Vault repo on GitHub (~15 min)

This is what makes the Neural Map work for teammates online.

1. Make sure you have a GitHub account. If not, sign up at <https://github.com>.

2. On GitHub: **+** (top-right) → **New repository**. Name it
   `jovee-vault`. Set it to **Private**. Skip the README/gitignore — we'll
   populate from your laptop. Click **Create repository**.

3. **In Obsidian**, install the Community Plugin called **Obsidian Git**:
   - Settings → Community plugins → Browse → search **"Obsidian Git"** →
     Install → Enable.
   - Open the plugin's settings.
   - **Auto pull interval (minutes):** 10
   - **Auto backup after stop editing (minutes):** 5
   - **Commit message:** `obsidian sync`
   - **Repository folder:** leave blank (use vault root).

4. Still in Obsidian, open the **Command Palette** (Ctrl+P) and run
   `Obsidian Git: Open source control view`. The plugin will tell you the
   repo isn't initialized.

5. Open a terminal in `D:\Downloads\Jovee\Jovee Vault\` and run:

   ```
   git init
   git add .
   git commit -m "initial vault import"
   git branch -M main
   git remote add origin https://github.com/<your-username>/jovee-vault.git
   git push -u origin main
   ```

   On the push, GitHub may ask you to sign in via browser. Approve.

6. From now on, **every edit you make in Obsidian auto-commits and auto-pushes
   to GitHub every ~5 minutes**, no terminal needed. The cockpit picks up
   changes on next refresh.

7. **Generate a GitHub access token** so the cockpit can read this repo:
   - Visit <https://github.com/settings/personal-access-tokens/new>
   - **Token name:** `jovee-cockpit vault read`
   - **Expiration:** 1 year
   - **Repository access:** Only select repositories → pick `jovee-vault`
   - **Permissions → Repository permissions:**
     - Contents: **Read-only**
     - Metadata: **Read-only**
   - Click **Generate token**. Copy it (starts with `github_pat_…`). You'll
     paste it into Vercel in Part 4.

---

## Part 3 — Cockpit repo on GitHub (~10 min)

1. GitHub → **+** → **New repository** → name `jovee-cockpit` → **Private**
   → **Create repository**.

2. Open a terminal in `D:\Downloads\Jovee\jovee-cockpit\` and run:

   ```
   git init
   git add .
   git commit -m "initial cockpit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/jovee-cockpit.git
   git push -u origin main
   ```

That's it. Both repos exist on GitHub now.

---

## Part 4 — Vercel deployment (~15 min)

1. Visit <https://vercel.com> → **Sign Up** with GitHub.

2. **Add New… → Project** → find `jovee-cockpit` in the list → **Import**.

3. Vercel auto-detects Next.js. Don't touch the framework presets. Expand
   **Environment Variables** and add the following (one row per variable):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from Part 1 |
   | `VAULT_SOURCE` | `github` |
   | `GITHUB_VAULT_REPO` | `<your-username>/jovee-vault` |
   | `GITHUB_VAULT_BRANCH` | `main` |
   | `GITHUB_TOKEN` | the `github_pat_…` token from Part 2 |
   | `COCKPIT_PASSWORD` | pick a strong passphrase you'll share with the team |
   | `HUBSPOT_PRIVATE_APP_TOKEN` | (optional, if you connected Hubspot) |
   | `TRELLO_API_KEY` | (optional) |
   | `TRELLO_API_TOKEN` | (optional) |
   | `ANTHROPIC_API_KEY` | (optional) |

4. Click **Deploy**. Vercel builds and deploys in ~90 seconds.

5. When it's done, click **Visit** → you'll see the **Team password** screen.
   Enter your `COCKPIT_PASSWORD` → land on the Home dashboard.

6. The URL is `your-project-name.vercel.app`. Share it + the password with
   your teammates.

---

## Updating after the first deploy

| You change… | What happens |
|---|---|
| A note in **Obsidian** | Auto-pushed within 5 minutes (Obsidian Git). Next page-refresh in the cockpit pulls fresh content via GitHub API. |
| **Cockpit code** on your laptop | Commit + push to GitHub. Vercel auto-rebuilds and redeploys within ~90s. |
| **Salons / agents** in the deployed cockpit | Saved directly to Neon — instant for all teammates. |
| The **shared password** | Update `COCKPIT_PASSWORD` in Vercel → **Settings → Environment Variables** → trigger a **Redeploy**. |

---

## Troubleshooting

**Build fails on Vercel with `DATABASE_URL not set`.**
Double-check you added the env var. Vercel → Project → Settings →
Environment Variables. Then **Redeploy**.

**Neural Map shows "No notes found" on the deployed site.**
Most common cause: GitHub token doesn't have access to the vault repo. Try:
- Visit `your-url.vercel.app/api/vault?mode=recent` — the error message will
  tell you exactly what's wrong.
- Verify the token is "fine-grained" and includes `Contents: Read` on
  `jovee-vault`.
- Confirm `GITHUB_VAULT_REPO` is `username/jovee-vault`, no leading slash.

**Team password not prompting.**
You left `COCKPIT_PASSWORD` blank in Vercel. Add it and redeploy.

**Salons API returns empty after migration.**
You ran `prisma db push` but skipped `restore-data.ts`. Run it now from
your laptop with `DATABASE_URL` pointed at Neon.
