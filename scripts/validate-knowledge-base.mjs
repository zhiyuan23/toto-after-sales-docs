// LLM Wiki Schema v2 validation with project and workspace link checks.

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  extractResolvedLinks,
  loadKnowledgeBase,
  parseArguments,
  readKnowledgeConfiguration,
  RELATIONSHIP_FIELDS,
  resolveLocalTarget,
  VALID_ID_NAMESPACES,
  VALID_ID_PATTERN,
} from "./knowledge-base-core.mjs";

const REQUIRED_FIELDS = [
  "type",
  "topic",
  "status",
  "updated",
  "owner",
  "confidence",
  "sources",
  "tags",
];

const SCHEMA_V2_REQUIRED_FIELDS = [
  "schema_version",
  "id",
  "created",
  "sensitivity",
];

const CLAIM_REQUIRED_FIELDS = [
  "subject_id",
  "claim_status",
  "evidence_level",
  "asserted_at",
];

const SOURCE_REQUIRED_FIELDS = [
  "source_id",
  "source_kind",
  "source_system",
  "authority",
  "sync_mode",
];

const LEARNING_ITEM_REQUIRED_FIELDS = [
  "learning_status",
  "learning_goal",
];

const DATE_FIELDS = [
  "created",
  "updated",
  "observed_at",
  "asserted_at",
  "verified_at",
  "effective_from",
  "effective_to",
  "last_verified",
  "review_due",
  "mastered_at",
  "last_synced",
];

const VALID_STATUS = new Set(["draft", "active", "deprecated"]);
const VALID_OWNER = new Set(["snow", "codex", "shared"]);
const VALID_CONFIDENCE = new Set(["low", "medium", "high"]);
const VALID_SENSITIVITY = new Set(["public", "internal", "private"]);
const VALID_CLAIM_STATUS = new Set([
  "asserted",
  "verified",
  "disputed",
  "superseded",
]);
const VALID_EVIDENCE_LEVEL = new Set(["weak", "medium", "strong"]);
const VALID_SOURCE_KIND = new Set([
  "repository",
  "document",
  "website",
  "database",
  "api",
  "application",
  "communication",
  "media",
  "other",
]);
const VALID_AUTHORITY = new Set(["canonical", "reference", "derived"]);
const VALID_SYNC_MODE = new Set(["manual", "scheduled", "event"]);
const VALID_LEARNING_STATUS = new Set([
  "待学习",
  "学习中",
  "待复习",
  "已掌握",
]);
const SEMANTIC_MAIN_TYPE =
  /^llm-wiki-(?:project|topic|system|meta|inbox|area|entity)$/;

function addError(errors, code, notePath, extra = {}) {
  errors.push({ code, path: notePath, ...extra });
}

function isMissingField(data, field) {
  return (
    !(field in data) ||
    data[field] === "" ||
    (Array.isArray(data[field]) && data[field].length === 0)
  );
}

function isSchemaV2(data) {
  return data.schema_version === "2";
}

function idNamespace(id) {
  return typeof id === "string" ? id.split(":")[1] : "";
}

function isValidLocalId(id) {
  return (
    typeof id === "string" &&
    VALID_ID_PATTERN.test(id) &&
    VALID_ID_NAMESPACES.has(idNamespace(id))
  );
}

function isValidCalendarDate(value) {
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  const date = new Date(`${text}T00:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === text
  );
}

function reportUnresolved(record, knowledgeBase, target, code, errors, warnings, options) {
  const segments = target.replaceAll('\\', '/').split('/');
  let first = 0;
  while (segments[first] === '..' || segments[first] === '.') first++;
  const relative = path.relative(knowledgeBase.root, path.resolve(path.dirname(record.absolutePath), target));
  const outside = relative === '..' || relative.startsWith(`..${path.sep}`);
  if (!options.strictWorkspaceLinks && outside && options.workspaceReferences.includes(segments[first])) {
    warnings.push({ code: 'unavailable_workspace_reference', path: record.path, target });
  } else {
    addError(errors, code, record.path, { target });
  }
}

function validateMarkdownLinks(record, knowledgeBase, errors, warnings, options) {
  const markdownLink = /!?\[[^\]]*]\(([^)]+)\)/g;
  for (const match of record.content.matchAll(markdownLink)) {
    const resolved = resolveLocalTarget(record, match[1], knowledgeBase);
    if (resolved.kind === "unresolved") {
      reportUnresolved(record, knowledgeBase, resolved.target, 'unresolved_link', errors, warnings, options);
    }
  }
}

function validateSources(record, knowledgeBase, errors, warnings, options) {
  const { sources } = record.data;
  if (!Array.isArray(sources)) {
    return;
  }

  for (const source of sources) {
    if (typeof source !== "string" || !/^\.{1,2}\//.test(source)) {
      continue;
    }
    const resolved = resolveLocalTarget(record, source, knowledgeBase);
    if (resolved.kind === "unresolved") {
      reportUnresolved(record, knowledgeBase, resolved.target, 'unresolved_source', errors, warnings, options);
    }
  }
}

function validateSchemaV2Base(record, errors) {
  const { data, path: notePath } = record;
  if (!("schema_version" in data)) {
    return;
  }
  if (!isSchemaV2(data)) {
    addError(errors, "unsupported_schema_version", notePath, {
      detail: String(data.schema_version),
    });
    return;
  }

  for (const field of SCHEMA_V2_REQUIRED_FIELDS) {
    if (isMissingField(data, field)) {
      addError(errors, "missing_v2_field", notePath, { detail: field });
    }
  }

  if (!isMissingField(data, "id")) {
    if (typeof data.id !== "string" || !VALID_ID_PATTERN.test(data.id)) {
      addError(errors, "invalid_id", notePath, { detail: String(data.id) });
    } else if (!VALID_ID_NAMESPACES.has(idNamespace(data.id))) {
      addError(errors, "invalid_id_namespace", notePath, {
        detail: idNamespace(data.id),
      });
    }
  }

  if (
    !isMissingField(data, "sensitivity") &&
    !VALID_SENSITIVITY.has(data.sensitivity)
  ) {
    addError(errors, "invalid_sensitivity", notePath, {
      detail: String(data.sensitivity),
    });
  }

  if (data.sensitivity === "private" && String(data.share) === "true") {
    addError(errors, "private_page_shared", notePath);
  }

  const validDates = new Set();
  for (const field of DATE_FIELDS) {
    if (!(field in data) || isMissingField(data, field)) {
      continue;
    }
    if (isValidCalendarDate(data[field])) {
      validDates.add(field);
    } else {
      addError(errors, "invalid_date", notePath, {
        detail: field,
        target: String(data[field]),
      });
    }
  }

  if (
    validDates.has("created") &&
    validDates.has("updated") &&
    data.created > data.updated
  ) {
    addError(errors, "created_after_updated", notePath, {
      detail: `${data.created} > ${data.updated}`,
    });
  }

  if (
    validDates.has("effective_from") &&
    validDates.has("effective_to") &&
    data.effective_from > data.effective_to
  ) {
    addError(errors, "invalid_effective_range", notePath, {
      detail: `${data.effective_from} > ${data.effective_to}`,
    });
  }
}

function buildIdRegistry(records, errors) {
  const candidates = new Map();
  for (const record of records) {
    if (
      record.frontmatterError ||
      !isSchemaV2(record.data) ||
      !isValidLocalId(record.data.id)
    ) {
      continue;
    }
    const matches = candidates.get(record.data.id) ?? [];
    matches.push(record);
    candidates.set(record.data.id, matches);
  }

  const byId = new Map();
  const duplicateIds = new Set();
  for (const [id, matches] of candidates) {
    if (matches.length === 1) {
      byId.set(id, matches[0]);
      continue;
    }
    duplicateIds.add(id);
    for (const record of matches) {
      addError(errors, "duplicate_id", record.path, { detail: id });
    }
  }
  return { byId, duplicateIds };
}

function validateRelationships(record, byId, errors) {
  if (!isSchemaV2(record.data)) {
    return;
  }

  for (const field of RELATIONSHIP_FIELDS) {
    if (!(field in record.data)) {
      continue;
    }
    const targets = record.data[field];
    if (!Array.isArray(targets)) {
      addError(errors, "invalid_relationship_value", record.path, {
        detail: field,
      });
      continue;
    }

    const seen = new Set();
    for (const target of targets) {
      if (!isValidLocalId(target)) {
        addError(errors, "invalid_relationship_value", record.path, {
          detail: field,
          target: String(target),
        });
        continue;
      }
      if (seen.has(target)) {
        addError(errors, "duplicate_relationship_target", record.path, {
          detail: field,
          target,
        });
        continue;
      }
      seen.add(target);
      if (target === record.data.id) {
        addError(errors, "self_relationship", record.path, {
          detail: field,
          target,
        });
        continue;
      }
      if (!byId.has(target)) {
        addError(errors, "unknown_relationship_target", record.path, {
          detail: field,
          target,
        });
      }
    }
  }
}

function validateClaim(record, byId, errors) {
  const { data, path: notePath } = record;
  if (!isSchemaV2(data) || data.type !== "llm-wiki-claim") {
    return;
  }

  for (const field of CLAIM_REQUIRED_FIELDS) {
    if (isMissingField(data, field)) {
      addError(errors, "missing_claim_field", notePath, { detail: field });
    }
  }

  if (!isMissingField(data, "subject_id")) {
    if (!isValidLocalId(data.subject_id) || data.subject_id === data.id) {
      addError(errors, "invalid_subject_id", notePath, {
        detail: String(data.subject_id),
      });
    } else if (!byId.has(data.subject_id)) {
      addError(errors, "unknown_subject_id", notePath, {
        target: data.subject_id,
      });
    }
  }

  if (
    !isMissingField(data, "claim_status") &&
    !VALID_CLAIM_STATUS.has(data.claim_status)
  ) {
    addError(errors, "invalid_claim_status", notePath, {
      detail: String(data.claim_status),
    });
  }

  if (
    !isMissingField(data, "evidence_level") &&
    !VALID_EVIDENCE_LEVEL.has(data.evidence_level)
  ) {
    addError(errors, "invalid_evidence_level", notePath, {
      detail: String(data.evidence_level),
    });
  }

  if (
    isValidCalendarDate(data.asserted_at) &&
    isValidCalendarDate(data.verified_at) &&
    data.verified_at < data.asserted_at
  ) {
    addError(errors, "verified_before_asserted", notePath, {
      detail: `${data.verified_at} < ${data.asserted_at}`,
    });
  }
}

function validateSourceRecord(record, errors) {
  const { data, path: notePath } = record;
  if (!isSchemaV2(data) || data.type !== "llm-wiki-source") {
    return;
  }

  for (const field of SOURCE_REQUIRED_FIELDS) {
    if (isMissingField(data, field)) {
      addError(errors, "missing_source_field", notePath, { detail: field });
    }
  }

  if (
    !isMissingField(data, "source_kind") &&
    !VALID_SOURCE_KIND.has(data.source_kind)
  ) {
    addError(errors, "invalid_source_kind", notePath, {
      detail: String(data.source_kind),
    });
  }
  if (
    !isMissingField(data, "authority") &&
    !VALID_AUTHORITY.has(data.authority)
  ) {
    addError(errors, "invalid_authority", notePath, {
      detail: String(data.authority),
    });
  }
  if (
    !isMissingField(data, "sync_mode") &&
    !VALID_SYNC_MODE.has(data.sync_mode)
  ) {
    addError(errors, "invalid_sync_mode", notePath, {
      detail: String(data.sync_mode),
    });
  }
}

function validateLearningItem(record, errors) {
  const { data, path: notePath } = record;
  if (data.type !== "llm-wiki-learning-item") {
    return;
  }

  if (!isSchemaV2(data)) {
    addError(errors, "learning_item_requires_schema_v2", notePath);
    return;
  }

  for (const field of LEARNING_ITEM_REQUIRED_FIELDS) {
    if (isMissingField(data, field)) {
      addError(errors, "missing_learning_field", notePath, { detail: field });
    }
  }

  if (!isMissingField(data, "id") && idNamespace(data.id) !== "learning") {
    addError(errors, "invalid_learning_id_namespace", notePath, {
      detail: idNamespace(data.id),
    });
  }

  if (
    !isMissingField(data, "learning_status") &&
    !VALID_LEARNING_STATUS.has(data.learning_status)
  ) {
    addError(errors, "invalid_learning_status", notePath, {
      detail: String(data.learning_status),
    });
  }

  if (
    !isMissingField(data, "learning_goal") &&
    typeof data.learning_goal !== "string"
  ) {
    addError(errors, "invalid_learning_goal", notePath);
  }

  if (data.sensitivity !== "private") {
    addError(errors, "invalid_learning_sensitivity", notePath, {
      detail: String(data.sensitivity ?? ""),
    });
  }

  if (String(data.share) === "true") {
    addError(errors, "learning_item_shared", notePath);
  }
}

function markdownTableCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
    return null;
  }
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function resolvedLinksInText(record, text, knowledgeBase) {
  const paths = new Set();
  const markdownLink = /!?\[[^\]]*]\(([^)]+)\)/g;
  for (const match of text.matchAll(markdownLink)) {
    const resolved = resolveLocalTarget(record, match[1], knowledgeBase);
    if (resolved.kind === "resolved") {
      paths.add(resolved.path);
    }
  }
  return paths;
}

function parseSourceMapGuideRows(record, knowledgeBase) {
  const lines = record.body.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const header = markdownTableCells(lines[index]);
    if (!header) {
      continue;
    }
    const knowledgeIndex = header.indexOf("知识页面");
    const guideIndex = header.indexOf("对应人读导览");
    if (knowledgeIndex === -1 || guideIndex === -1) {
      continue;
    }

    const rows = [];
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const cells = markdownTableCells(lines[rowIndex]);
      if (!cells) {
        break;
      }
      if (cells.length <= Math.max(knowledgeIndex, guideIndex)) {
        continue;
      }
      rows.push({
        knowledgePaths: resolvedLinksInText(
          record,
          cells[knowledgeIndex],
          knowledgeBase,
        ),
        guidePaths: resolvedLinksInText(
          record,
          cells[guideIndex],
          knowledgeBase,
        ),
      });
    }
    return rows;
  }
  return [];
}

function buildSourceMapsByRepo(records, knowledgeBase) {
  const sourceMapsByRepo = new Map();
  for (const record of records) {
    if (
      record.frontmatterError ||
      record.data.type !== "llm-wiki-source-map" ||
      typeof record.data.source_repo !== "string" ||
      record.data.source_repo === ""
    ) {
      continue;
    }
    const sourceMaps = sourceMapsByRepo.get(record.data.source_repo) ?? [];
    sourceMaps.push({
      record,
      rows: parseSourceMapGuideRows(record, knowledgeBase),
    });
    sourceMapsByRepo.set(record.data.source_repo, sourceMaps);
  }
  return sourceMapsByRepo;
}

function hasReadableProjectsLink(record, knowledgeBase) {
  const resolvedPaths = new Set(extractResolvedLinks(record, knowledgeBase));
  if (Array.isArray(record.data.sources)) {
    for (const source of record.data.sources) {
      if (typeof source !== "string") {
        continue;
      }
      const resolved = resolveLocalTarget(record, source, knowledgeBase);
      if (resolved.kind === "resolved") {
        resolvedPaths.add(resolved.path);
      }
    }
  }
  return [...resolvedPaths].some((targetPath) =>
    targetPath.startsWith("20-Projects/"),
  );
}

function validateGuide(record, byId, knowledgeBase, sourceMapsByRepo, errors) {
  const { data, path: notePath } = record;
  if (data.type !== "llm-wiki-human-guide" || data.status !== "active") {
    return;
  }

  const derivedFrom = data.derived_from;
  if (!isSchemaV2(data) || !Array.isArray(derivedFrom) || derivedFrom.length === 0) {
    addError(errors, "missing_guide_derived_from", notePath);
    return;
  }

  if (!hasReadableProjectsLink(record, knowledgeBase)) {
    addError(errors, "missing_guide_project_link", notePath);
  }

  for (const targetId of derivedFrom) {
    const target = byId.get(targetId);
    if (!target) {
      continue;
    }
    if (!target.path.startsWith("20-Projects/")) {
      addError(errors, "invalid_guide_derived_from_target", notePath, {
        target: targetId,
      });
      continue;
    }

    const sourceRepo = target.data.source_repo;
    if (typeof sourceRepo !== "string" || sourceRepo === "") {
      continue;
    }
    const sourceMaps = sourceMapsByRepo.get(sourceRepo) ?? [];
    if (sourceMaps.length === 0) {
      addError(errors, "missing_guide_source_map", notePath, {
        detail: sourceRepo,
        target: targetId,
      });
      continue;
    }

    const hasMappedGuide = sourceMaps.some(({ rows }) =>
      rows.some(
        ({ knowledgePaths, guidePaths }) =>
          knowledgePaths.has(target.path) && guidePaths.has(notePath),
      ),
    );
    if (!hasMappedGuide) {
      addError(errors, "missing_guide_source_map_link", notePath, {
        detail: sourceRepo,
        target: targetId,
      });
    }
  }
}

export function validateKnowledgeBase(root, { strictWorkspaceLinks = false } = {}) {
  const knowledgeBase = loadKnowledgeBase(root);
  const configuration = readKnowledgeConfiguration(root);
  const { records } = knowledgeBase;
  const errors = [];
  const warnings = [];
  const options = { strictWorkspaceLinks, workspaceReferences: configuration.workspaceReferences };
  if (records.length === 0) addError(errors, 'empty_knowledge_scope', root);
  const basenames = new Map();
  const semanticMains = new Map();

  for (const record of records) {
    const basename = path.basename(record.absolutePath);
    const sameBasename = basenames.get(basename) ?? [];
    sameBasename.push(record.path);
    basenames.set(basename, sameBasename);

    if (record.frontmatterError) {
      addError(errors, record.frontmatterError, record.path);
      validateMarkdownLinks(record, knowledgeBase, errors, warnings, options);
      continue;
    }

    const { data } = record;
    for (const field of REQUIRED_FIELDS) {
      if (!(field in data) || data[field] === "") {
        addError(errors, "missing_field", record.path, { detail: field });
      }
    }

    if ("status" in data && !VALID_STATUS.has(data.status)) {
      addError(errors, "invalid_status", record.path, {
        detail: String(data.status),
      });
    }
    if ("owner" in data && !VALID_OWNER.has(data.owner)) {
      addError(errors, "invalid_owner", record.path, {
        detail: String(data.owner),
      });
    }
    if ("confidence" in data && !VALID_CONFIDENCE.has(data.confidence)) {
      addError(errors, "invalid_confidence", record.path, {
        detail: String(data.confidence),
      });
    }
    if (
      "updated" in data &&
      !/^\d{4}-\d{2}-\d{2}$/.test(String(data.updated))
    ) {
      addError(errors, "invalid_updated", record.path, {
        detail: String(data.updated),
      });
    }
    if (data.type === "llm-wiki-folder-entry") {
      addError(errors, "forbidden_type", record.path, {
        detail: data.type,
      });
    }

    validateSchemaV2Base(record, errors);

    if (typeof data.type === "string" && SEMANTIC_MAIN_TYPE.test(data.type)) {
      const directory = path.posix.dirname(record.path);
      const key = `${directory}\0${data.type}`;
      const sameKind = semanticMains.get(key) ?? [];
      sameKind.push(record.path);
      semanticMains.set(key, sameKind);
    }

    validateSources(record, knowledgeBase, errors, warnings, options);
    validateMarkdownLinks(record, knowledgeBase, errors, warnings, options);
  }

  for (const [basename, paths] of basenames) {
    if (paths.length > 1 && !configuration.allowDuplicateBasenames.includes(basename)) {
      addError(errors, "duplicate_basename", basename, {
        detail: paths.join(", "),
      });
    }
  }

  for (const paths of semanticMains.values()) {
    if (paths.length > 1) {
      addError(errors, "multiple_semantic_main", paths[0], {
        detail: paths.join(", "),
      });
    }
  }

  const historyRecords = loadKnowledgeBase(root, { includeHistory: true }).records.filter(record => !knowledgeBase.byPath.has(record.path) && !record.frontmatterError);
  const { byId } = buildIdRegistry([...records, ...historyRecords], errors);
  const sourceMapsByRepo = buildSourceMapsByRepo(records, knowledgeBase);
  for (const record of records) {
    if (record.frontmatterError) {
      continue;
    }
    validateRelationships(record, byId, errors);
    validateClaim(record, byId, errors);
    validateSourceRecord(record, errors);
    validateLearningItem(record, errors);
    validateGuide(record, byId, knowledgeBase, sourceMapsByRepo, errors);
  }

  errors.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.code.localeCompare(right.code) ||
      String(left.detail ?? "").localeCompare(String(right.detail ?? "")) ||
      String(left.target ?? "").localeCompare(String(right.target ?? "")),
  );

  const summary = {};
  for (const error of errors) {
    summary[error.code] = (summary[error.code] ?? 0) + 1;
  }

  return {
    ok: errors.length === 0,
    files: records.length,
    errors,
    summary,
    warnings,
  };
}

function invalidRootResult(root) {
  return {
    ok: false,
    files: 0,
    errors: [
      {
        code: "invalid_kb_root",
        path: root ?? "",
        detail: "Usage: validate-knowledge-base.mjs --kb-root <path>",
      },
    ],
    summary: { invalid_kb_root: 1 },
  };
}

const root = parseArguments(process.argv.slice(2));
if (
  root === null ||
  !existsSync(root) ||
  !statSync(root).isDirectory()
) {
  process.stdout.write(`${JSON.stringify(invalidRootResult(root), null, 2)}\n`);
  process.exitCode = 1;
} else {
  try {
    const result = validateKnowledgeBase(root, { strictWorkspaceLinks: process.argv.includes('--strict-workspace-links') });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    const result = {
      ok: false,
      files: 0,
      errors: [
        {
          code: "validation_failed",
          path: root,
          detail: error instanceof Error ? error.message : String(error),
        },
      ],
      summary: { validation_failed: 1 },
    };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = 1;
  }
}
