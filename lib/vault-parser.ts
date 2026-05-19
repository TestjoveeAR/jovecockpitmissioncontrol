import { SECTION_COLORS, SECTION_LABELS } from "./vault-sections";
import { getVaultSource, VaultFile } from "./vault-source";

export { SECTION_COLORS, SECTION_LABELS };

export interface VaultNode {
  id: string;
  title: string;
  section: string;
  relPath: string;
  mtimeMs: number;
  preview: string;
  body: string;
}

export interface VaultEdge {
  source: string;
  target: string;
}

export interface VaultGraph {
  nodes: VaultNode[];
  edges: VaultEdge[];
  sourceLabel: string;
  scannedAt: number;
}

/** Classify a relative path into one of the color sections. */
function classify(rel: string): string {
  const norm = rel.replace(/\\/g, "/");
  const keys = Object.keys(SECTION_COLORS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (k === "root") continue;
    if (norm.startsWith(k + "/") || norm === k + ".md") return k;
  }
  return "root";
}

const WIKI_LINK = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;

function basenameWithoutExt(p: string): string {
  const lastSlash = p.lastIndexOf("/");
  const base = lastSlash === -1 ? p : p.slice(lastSlash + 1);
  return base.replace(/\.md$/i, "");
}

function dirnameOf(p: string): string {
  const lastSlash = p.lastIndexOf("/");
  return lastSlash === -1 ? "" : p.slice(0, lastSlash);
}

function fileToNode(f: VaultFile): VaultNode {
  const title = basenameWithoutExt(f.relPath);
  const stripped = f.body
    .replace(/^---[\s\S]*?---/, "")
    .replace(/[#>*_`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    id: title,
    title,
    section: classify(f.relPath),
    relPath: f.relPath,
    mtimeMs: f.mtimeMs,
    preview: stripped.slice(0, 240),
    body: f.body,
  };
}

export async function buildGraph(): Promise<VaultGraph> {
  const source = getVaultSource();
  const files = await source.listFiles();
  const rawNodes = files.map(fileToNode);

  // De-duplicate node IDs (Obsidian allows duplicate filenames in different
  // folders). Keep the first; later wiki-links resolve by title to the first.
  const seen = new Map<string, VaultNode>();
  for (const n of rawNodes) {
    if (!seen.has(n.id)) {
      seen.set(n.id, n);
    } else {
      const disambiguated = `${n.id} (${dirnameOf(n.relPath)})`;
      seen.set(disambiguated, { ...n, id: disambiguated });
    }
  }
  const nodes = Array.from(seen.values());
  const byTitle = new Map(nodes.map((n) => [n.title, n.id]));

  const edgeSet = new Set<string>();
  const edges: VaultEdge[] = [];
  for (const n of nodes) {
    WIKI_LINK.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = WIKI_LINK.exec(n.body)) !== null) {
      const target = m[1].trim();
      const targetId = byTitle.get(target);
      if (!targetId || targetId === n.id) continue;
      const key = `${n.id}->${targetId}`;
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      edges.push({ source: n.id, target: targetId });
    }
  }

  return {
    nodes,
    edges,
    sourceLabel: source.describe(),
    scannedAt: Date.now(),
  };
}
