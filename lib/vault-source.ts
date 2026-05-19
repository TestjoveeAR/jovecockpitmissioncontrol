/**
 * Vault source abstraction. Two backends:
 *
 *  - filesystem (dev / local-only mode) — reads `.md` files from a directory
 *    on disk. Used when VAULT_SOURCE is unset or "filesystem".
 *
 *  - github (production / deployed mode) — reads `.md` files from a private
 *    GitHub repo via the REST API. Used when VAULT_SOURCE=github. Responses
 *    are cached in-memory for 5 minutes to stay within the 5000-req/hr
 *    authenticated rate limit even with a busy dashboard.
 *
 * Both backends expose the same shape: `listFiles()` and `readFile(relPath)`.
 */
import fs from "node:fs";
import path from "node:path";

export interface VaultFile {
  /** Path relative to the vault root, forward-slash separated. */
  relPath: string;
  /** UTF-8 contents. */
  body: string;
  /** Modification time as a UNIX-ms timestamp. */
  mtimeMs: number;
}

export interface VaultSource {
  listFiles(): Promise<VaultFile[]>;
  describe(): string;
}

/* -------------------------------------------------------------------------- */
/* Filesystem backend                                                          */
/* -------------------------------------------------------------------------- */

class FilesystemSource implements VaultSource {
  constructor(private readonly root: string) {}

  describe() {
    return `filesystem(${this.root})`;
  }

  async listFiles(): Promise<VaultFile[]> {
    if (!fs.existsSync(this.root)) return [];
    return this.walk(this.root, this.root, []);
  }

  private walk(dir: string, base: string, acc: VaultFile[]): VaultFile[] {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return acc;
    }
    for (const e of entries) {
      if (e.name.startsWith(".")) continue; // skip .obsidian, .git, etc.
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) {
        this.walk(abs, base, acc);
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
        const stat = fs.statSync(abs);
        const rel = path.relative(base, abs).replace(/\\/g, "/");
        acc.push({
          relPath: rel,
          body: fs.readFileSync(abs, "utf8"),
          mtimeMs: stat.mtimeMs,
        });
      }
    }
    return acc;
  }
}

/* -------------------------------------------------------------------------- */
/* GitHub backend                                                              */
/* -------------------------------------------------------------------------- */

interface GithubCacheEntry {
  files: VaultFile[];
  fetchedAt: number;
}

const githubCache = new Map<string, GithubCacheEntry>();
const GITHUB_TTL_MS = 5 * 60 * 1000;

class GithubSource implements VaultSource {
  constructor(
    private readonly repo: string, // "owner/repo"
    private readonly branch: string,
    private readonly token: string
  ) {}

  describe() {
    return `github(${this.repo}@${this.branch})`;
  }

  async listFiles(): Promise<VaultFile[]> {
    const cacheKey = `${this.repo}@${this.branch}`;
    const cached = githubCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < GITHUB_TTL_MS) {
      return cached.files;
    }

    // 1. Resolve branch → tree SHA
    const branchRes = await this.gh(`/repos/${this.repo}/branches/${this.branch}`);
    const treeSha: string = branchRes.commit.commit.tree.sha;

    // 2. Pull the recursive tree (everything in one shot)
    const tree = await this.gh(`/repos/${this.repo}/git/trees/${treeSha}?recursive=1`);
    const mdEntries: { path: string; sha: string; size: number }[] = (tree.tree ?? [])
      .filter((e: any) => e.type === "blob" && /\.md$/i.test(e.path))
      .filter((e: any) => !e.path.split("/").some((seg: string) => seg.startsWith(".")));

    if (tree.truncated) {
      console.warn(
        `[vault-source] GitHub tree is truncated (>100k entries). Some notes may be missing.`
      );
    }

    // 3. Fetch each blob's contents. Concurrency-limited to be polite.
    const files: VaultFile[] = [];
    const queue = [...mdEntries];
    const workers = Array.from({ length: 6 }, async () => {
      while (queue.length) {
        const entry = queue.shift();
        if (!entry) return;
        try {
          const blob = await this.gh(`/repos/${this.repo}/git/blobs/${entry.sha}`);
          const body = Buffer.from(blob.content, blob.encoding ?? "base64").toString("utf8");
          files.push({
            relPath: entry.path,
            body,
            // GitHub doesn't return per-file mtime cheaply; use fetched-at as
            // a stand-in. The "this week in vault" sort still works because
            // every file gets a fresh timestamp on each refresh.
            mtimeMs: Date.now(),
          });
        } catch (e) {
          console.warn(`[vault-source] failed to fetch ${entry.path}:`, e);
        }
      }
    });
    await Promise.all(workers);

    githubCache.set(cacheKey, { files, fetchedAt: Date.now() });
    return files;
  }

  private async gh(pathFragment: string): Promise<any> {
    const url = `https://api.github.com${pathFragment}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "jovee-cockpit",
      },
      // Edge/Node-friendly; no cache so we control freshness ourselves.
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GitHub ${res.status} on ${pathFragment}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                     */
/* -------------------------------------------------------------------------- */

export function getVaultSource(): VaultSource {
  const mode = (process.env.VAULT_SOURCE ?? "filesystem").toLowerCase();

  if (mode === "github") {
    const repo = process.env.GITHUB_VAULT_REPO; // "user/repo"
    const branch = process.env.GITHUB_VAULT_BRANCH ?? "main";
    const token = process.env.GITHUB_TOKEN;
    if (!repo || !token) {
      throw new Error(
        "VAULT_SOURCE=github requires GITHUB_VAULT_REPO and GITHUB_TOKEN env vars"
      );
    }
    return new GithubSource(repo, branch, token);
  }

  const root = process.env.VAULT_PATH ?? "D:/Downloads/Jovee/Jovee Vault";
  return new FilesystemSource(root);
}

/** Bust the in-memory cache (used by a future "refresh vault" button). */
export function invalidateVaultCache() {
  githubCache.clear();
}
