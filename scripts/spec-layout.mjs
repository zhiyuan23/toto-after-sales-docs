import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

export function readSpecLayout(root) {
  const file = path.join(root, '.spec-layout.json');
  if (!existsSync(file)) return null;
  const layout = JSON.parse(readFileSync(file, 'utf8'));
  for (const field of ['categories', 'rootFiles', 'supportDirectories']) {
    if (!Array.isArray(layout[field]) || !layout[field].every(value => typeof value === 'string' && value && !/[\\/]/.test(value) && value !== '.' && value !== '..')) {
      throw new Error(`.spec-layout.json 的 ${field} 必须是单层名称数组`);
    }
  }
  return layout;
}

export function specPathError(relativePath, layout) {
  if (!layout) return null;
  const parts = relativePath.split('/');
  if (parts[0] !== 'specs') return null;
  if (parts.length === 2 && layout.rootFiles.includes(parts[1])) return null;
  if (parts.length === 2) return 'spec_root_file';
  if (layout.supportDirectories.includes(parts[1])) return null;
  if (!layout.categories.includes(parts[1])) return 'spec_unknown_category';
  if (parts.length !== 3 || (parts[2] !== 'README.md' && !/^\d{4}-\d{2}-\d{2}-.+\.md$/.test(parts[2]))) return 'spec_invalid_filename';
  return null;
}

export function validateSpecLayout(root) {
  const layout = readSpecLayout(root);
  const base = path.join(root, 'specs');
  if (!layout || !existsSync(base)) return [];
  const errors = [];
  function walk(directory, relative) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const target = `${relative}/${entry.name}`;
      if (entry.isDirectory()) {
        if (relative === 'specs' && layout.supportDirectories.includes(entry.name)) continue;
        if (relative === 'specs' && layout.categories.includes(entry.name)) walk(path.join(directory, entry.name), target);
        else errors.push({ code: 'spec_unknown_category', path: target, detail: 'Spec 仅放入已登记的业务分类；配套材料使用 assets/evidence/sql/support。' });
      } else {
        const code = specPathError(target, layout);
        if (code) errors.push({ code, path: target, detail: '请使用 node scripts/create-spec.mjs --category <编号> --name <功能名>，或维护已有分类 Spec。' });
      }
    }
  }
  walk(base, 'specs');
  return errors;
}
