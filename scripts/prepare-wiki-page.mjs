import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, listMarkdownFiles } from './knowledge-base-core.mjs';

export const PROJECT_ID = 'kb:project:toto-after-sales-docs';

export function serializeFrontmatter(data, body) {
  const scalar = value => JSON.stringify(String(value));
  const lines = Object.entries(data).flatMap(([key, value]) => Array.isArray(value)
    ? value.length ? [`${key}:`, ...value.map(item => `  - ${scalar(item)}`)] : [`${key}: []`]
    : [`${key}: ${scalar(value)}`]);
  return `---\n${lines.join('\n')}\n---\n\n${body.replace(/^\n/, '')}`;
}

export function pageMetadata(relativePath, { date, created = date, sources } = {}) {
  const category = relativePath.split('/')[0];
  const isMain = relativePath === '00-项目资料/01-项目概览与范围.md';
  const type = isMain ? 'llm-wiki-project'
    : category === 'specs' || category === '01-功能需求' || category === '04-页面原型' ? 'llm-wiki-project-spec'
    : category === '02-技术设计' ? 'llm-wiki-system-context'
    : category === '05-业务流程' ? 'llm-wiki-workflow'
    : relativePath === 'local-development.md' || relativePath.includes('角色手册/') ? 'llm-wiki-operation'
    : 'llm-wiki-project-overview';
  return {
    type, topic: 'TOTO售后服务', status: 'active', updated: date, owner: 'shared', confidence: 'medium',
    ...(isMain ? {} : { belongs_to: [PROJECT_ID] }),
    sources: sources ?? [`本仓库既有文档：${relativePath}；格式整理不表示重新验证业务与运行事实。`],
    tags: ['llm-wiki', 'TOTO', category === relativePath ? '开发入口' : category],
    schema_version: '2',
    id: isMain ? PROJECT_ID : `kb:project:toto-doc-${createHash('sha256').update(relativePath).digest('hex').slice(0, 16)}`,
    created, sensitivity: relativePath.includes('测试账号') ? 'private' : 'internal',
  };
}

export function prepareWikiPage(root, relativePath, date) {
  const absolute = path.resolve(root, relativePath);
  if (!listMarkdownFiles(root).includes(absolute)) throw new Error('目标不在正式知识范围内');
  const content = readFileSync(absolute, 'utf8');
  const parsed = parseFrontmatter(content);
  if (!parsed.error) return false;
  if (parsed.error !== 'missing_frontmatter') throw new Error('现有文件头无效，请先修复，不能覆盖正文');
  writeFileSync(absolute, serializeFrontmatter(pageMetadata(relativePath, { date }), content));
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const target = process.argv[2];
  if (!target) throw new Error('用法：node scripts/prepare-wiki-page.mjs <仓库相对路径>');
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  console.log(prepareWikiPage(root, target, date) ? '已添加 Schema v2 文件头，请核对来源、敏感度与正文业务状态。' : '已有文件头，未覆盖。');
}
