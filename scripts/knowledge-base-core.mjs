// LLM Wiki Schema v2 parser with project directory discovery.
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";

export const ACTIVE_ROOTS = [
  "00-Inbox",
  "10-Maps",
  "11-Guides",
  "20-Projects",
  "21-Areas",
  "30-Topics",
  "31-Entities",
  "40-Systems",
  "50-Worklogs",
  "60-Library",
  "99-Meta",
];

export const EXCLUDED_RELATIVE_PREFIXES = [
  "40-Systems/agents/skills/",
];

export const VALID_ID_PATTERN =
  /^kb:[a-z][a-z0-9-]*:[a-z0-9][a-z0-9._-]*$/;

export const VALID_ID_NAMESPACES = new Set([
  "inbox",
  "map",
  "project",
  "topic",
  "system",
  "worklog",
  "area",
  "entity",
  "source",
  "guide",
  "meta",
  "claim",
  "decision",
  "pattern",
  "checklist",
  "workflow",
  "concept",
  "learning",
  "operation",
  "reference",
]);

export const RELATIONSHIP_FIELDS = [
  "belongs_to",
  "depends_on",
  "owned_by",
  "related_to",
  "derived_from",
  "supports",
  "contradicts",
  "supersedes",
  "superseded_by",
  "implements",
  "mentions",
];

export function parseArguments(argv) {
  const rootIndex = argv.indexOf("--kb-root");
  if (rootIndex === -1 || !argv[rootIndex + 1]) {
    return null;
  }
  return path.resolve(argv[rootIndex + 1]);
}

export function listMarkdownFiles(root, { includeHistory = false } = {}) {
  const files = [];
  const configuration = readKnowledgeConfiguration(root);

  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (excludedRelativePath(root, absolutePath) || configuration.exclude.some(prefix => relativePath(root, absolutePath) === prefix || relativePath(root, absolutePath).startsWith(prefix))) {
        continue;
      }
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(absolutePath);
      }
    }
  }

  for (const activeRoot of [...configuration.roots, ...(includeHistory ? configuration.historyRoots : [])]) {
    const absoluteRoot = path.join(root, activeRoot);
    if (existsSync(absoluteRoot) && statSync(absoluteRoot).isDirectory()) {
      visit(absoluteRoot);
    }
  }

  for (const file of configuration.files) {
    const absolutePath = path.join(root, file);
    if (existsSync(absolutePath) && statSync(absolutePath).isFile()) files.push(absolutePath);
  }

  return [...new Set(files)].sort();
}

export function readKnowledgeConfiguration(root) {
  const filename = path.join(root, '.llm-wiki.json');
  const configuration = existsSync(filename) ? JSON.parse(readFileSync(filename, 'utf8')) : {};
  for (const field of ['roots', 'files', 'exclude', 'historyRoots', 'allowDuplicateBasenames', 'workspaceReferences']) {
    if (configuration[field] !== undefined && (!Array.isArray(configuration[field]) || configuration[field].some(value => typeof value !== 'string' || value === '' || path.isAbsolute(value) || value.split(/[\\/]/).includes('..')))) {
      throw new Error(`Invalid LLM Wiki configuration: ${field}`);
    }
  }
  return { roots: configuration.roots ?? ACTIVE_ROOTS, files: configuration.files ?? [], exclude: configuration.exclude ?? [], historyRoots: configuration.historyRoots ?? [], allowDuplicateBasenames: configuration.allowDuplicateBasenames ?? [], workspaceReferences: configuration.workspaceReferences ?? [] };
}

export function markdownBody(content) {
  const parsed = parseFrontmatter(content);
  if (parsed.error === 'missing_frontmatter') return content;
  if (parsed.error) throw new Error('Invalid LLM Wiki frontmatter');
  return parsed.body.replace(/^\n/, '');
}

const INVALID_PLAIN_SCALAR_START = /^[\[\]{},#&*!|>'"%@`]/;

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) {
    if (trimmed.length < 2 || !trimmed.endsWith('"')) {
      return null;
    }
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === "string" ? { value: parsed } : null;
    } catch {
      return null;
    }
  }
  if (trimmed.startsWith("'")) {
    if (trimmed.length < 2 || !trimmed.endsWith("'")) {
      return null;
    }
    const inner = trimmed.slice(1, -1);
    if (inner.replaceAll("''", "").includes("'")) {
      return null;
    }
    return { value: inner.replaceAll("''", "'") };
  }
  if (
    trimmed === "" ||
    trimmed.includes("\t") ||
    INVALID_PLAIN_SCALAR_START.test(trimmed) ||
    /^(?:-\s|\?\s|:\s)/.test(trimmed) ||
    trimmed.includes(": ") ||
    trimmed.includes(" #")
  ) {
    return null;
  }
  return { value: trimmed };
}

export function parseFrontmatter(content) {
  const normalized = content.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---\n") && !normalized.startsWith("---\r\n")) {
    return { error: "missing_frontmatter" };
  }

  const lines = normalized.split(/\r?\n/);
  const closingFence = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---",
  );
  if (closingFence === -1) {
    return { error: "invalid_frontmatter" };
  }

  const data = {};
  let currentArray = null;
  for (const line of lines.slice(1, closingFence)) {
    if (line.trim() === "") {
      continue;
    }
    if (line.includes("\t")) {
      return { error: "invalid_frontmatter" };
    }
    const fieldMatch = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (fieldMatch) {
      const [, key, rawValue = ""] = fieldMatch;
      const value = rawValue.trim();
      currentArray = null;
      if (value === "[]") {
        data[key] = [];
      } else if (value.startsWith("[") && value.endsWith("]")) {
        const rawItems = value.slice(1, -1).split(",");
        const items = [];
        for (const rawItem of rawItems) {
          const parsed = parseScalar(rawItem);
          if (!parsed) {
            return { error: "invalid_frontmatter" };
          }
          items.push(parsed.value);
        }
        data[key] = items;
      } else if (value === "") {
        data[key] = [];
        currentArray = key;
      } else {
        const parsed = parseScalar(value);
        if (!parsed) {
          return { error: "invalid_frontmatter" };
        }
        data[key] = parsed.value;
      }
      continue;
    }

    const arrayMatch = line.match(/^  -\s+(.+?)\s*$/);
    if (arrayMatch && currentArray) {
      const parsed = parseScalar(arrayMatch[1]);
      if (!parsed) {
        return { error: "invalid_frontmatter" };
      }
      data[currentArray].push(parsed.value);
      continue;
    }

    return { error: "invalid_frontmatter" };
  }

  return {
    data,
    body: lines.slice(closingFence + 1).join("\n"),
  };
}

export function relativePath(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function excludedRelativePath(root, absolutePath) {
  const candidate = `${relativePath(root, absolutePath)}/`;
  return EXCLUDED_RELATIVE_PREFIXES.some((prefix) =>
    candidate.startsWith(prefix),
  );
}

export function loadKnowledgeBase(root, options = {}) {
  const records = listMarkdownFiles(root, options).map((absolutePath) => {
    const content = readFileSync(absolutePath, "utf8");
    const parsed = parseFrontmatter(content);
    return {
      absolutePath,
      path: relativePath(root, absolutePath),
      content,
      body: "body" in parsed ? parsed.body : content,
      data: "data" in parsed ? parsed.data : {},
      frontmatterError: "error" in parsed ? parsed.error : null,
    };
  });

  const byPath = new Map(records.map((record) => [record.path, record]));
  const byStem = new Map();
  for (const record of records) {
    const stem = path.posix.basename(record.path, ".md");
    const matches = byStem.get(stem) ?? [];
    matches.push(record);
    byStem.set(stem, matches);
  }

  return { root, records, byPath, byStem };
}

function decodeTarget(target) {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

function externalTarget(target) {
  return (
    target === "" ||
    target.startsWith("#") ||
    /^(?:https?:|mailto:|obsidian:|data:)/i.test(target) ||
    path.isAbsolute(target)
  );
}

function resolvedFilesystemTarget(note, target, knowledgeBase) {
  const absoluteTarget = path.resolve(path.dirname(note.absolutePath), target);
  const candidates = [absoluteTarget];
  if (path.extname(absoluteTarget) === "") {
    candidates.push(`${absoluteTarget}.md`);
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return {
        kind: "resolved",
        path: relativePath(knowledgeBase.root, candidate),
      };
    }
  }
  return null;
}

export function resolveLocalTarget(note, rawTarget, knowledgeBase) {
  let target = String(rawTarget).trim();
  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1);
  }
  target = target.trim().split(/\s+["'][^"']*["']$/, 1)[0];

  if (externalTarget(target)) {
    return { kind: "external" };
  }

  target = decodeTarget(target.split("#", 1)[0].split("?", 1)[0]);
  const resolved = resolvedFilesystemTarget(note, target, knowledgeBase);
  return resolved ?? { kind: "unresolved", target };
}

function resolveWikiTarget(note, rawTarget, knowledgeBase) {
  let target = String(rawTarget).split("|", 1)[0].split("#", 1)[0].trim();
  if (externalTarget(target)) {
    return { kind: "external" };
  }
  target = decodeTarget(target);

  if (target.startsWith("./") || target.startsWith("../")) {
    const resolved = resolvedFilesystemTarget(note, target, knowledgeBase);
    return resolved ?? { kind: "unresolved", target };
  }

  if (target.includes("/")) {
    const normalized = path.posix.normalize(
      path.extname(target) === "" ? `${target}.md` : target,
    );
    if (knowledgeBase.byPath.has(normalized)) {
      return { kind: "resolved", path: normalized };
    }
    return { kind: "unresolved", target };
  }

  const stem = path.posix.basename(target, ".md");
  const matches = knowledgeBase.byStem.get(stem) ?? [];
  if (matches.length === 1) {
    return { kind: "resolved", path: matches[0].path };
  }
  return { kind: "unresolved", target };
}

export function extractResolvedLinks(note, knowledgeBase) {
  const resolvedPaths = new Set();
  const markdownLink = /!?\[[^\]]*]\(([^)]+)\)/g;
  for (const match of note.body.matchAll(markdownLink)) {
    const resolved = resolveLocalTarget(note, match[1], knowledgeBase);
    if (resolved.kind === "resolved" && knowledgeBase.byPath.has(resolved.path)) {
      resolvedPaths.add(resolved.path);
    }
  }

  const wikiLink = /!?\[\[([^\]]+)]]/g;
  for (const match of note.body.matchAll(wikiLink)) {
    const resolved = resolveWikiTarget(note, match[1], knowledgeBase);
    if (resolved.kind === "resolved" && knowledgeBase.byPath.has(resolved.path)) {
      resolvedPaths.add(resolved.path);
    }
  }

  return resolvedPaths;
}
