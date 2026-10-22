import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSpecLayout, specPathError } from './spec-layout.mjs';
import { pageMetadata, serializeFrontmatter } from './prepare-wiki-page.mjs';

export function createSpec(root, { category, name, date }) {
  const layout = readSpecLayout(root);
  if (!layout) throw new Error('缺少 .spec-layout.json，不能推断分类。');
  const directory = layout.categories.find(value => value === category || value.slice(0, 2) === category);
  if (!directory) throw new Error('必须指定有效分类 --category 01～06，不默认写入 specs 根目录。');
  if (typeof name !== 'string' || !name.trim() || name !== name.trim() || /[\\/\x00-\x1f<>:"|?*]/.test(name) || name === '.' || name === '..') throw new Error('功能名不能为空或包含路径／文件名特殊字符。');
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date) throw new Error('日期必须是有效的 YYYY-MM-DD。');
  const relativePath = `specs/${directory}/${date}-${name}.md`;
  if (specPathError(relativePath, layout)) throw new Error('目标不符合 Spec 布局规则。');
  const template = readFileSync(path.join(root, 'specs/_template.md'), 'utf8');
  const body = template.replace('# <功能名称> Spec', `# ${name} Spec`)
    .replace(/^- 状态：.+$/m, '- 状态：草稿')
    .replace('(README.md#spec-generation)', '(../README.md#spec-generation)');
  mkdirSync(path.join(root, 'specs', directory), { recursive: true });
  // wx prevents overwriting an existing contract, including concurrent creation.
  const metadata = pageMetadata(relativePath, { date, sources: ['待填写：本次需求来源与用户确认记录；当前为新建草稿，尚未确认。'] });
  writeFileSync(path.join(root, relativePath), serializeFrontmatter(metadata, body), { flag: 'wx' });
  return relativePath;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('用法：node scripts/create-spec.mjs --category <01～06> --name <功能名> [--date YYYY-MM-DD]。先检索已有 Spec；分类必须显式指定。');
  } else {
    const values = {};
    for (let index = 0; index < args.length; index += 2) {
      const key = args[index];
      if (!['--category', '--name', '--date'].includes(key) || !args[index + 1] || args[index + 1].startsWith('--') || key in values) throw new Error('参数无效，使用 --help 查看用法。');
      values[key] = args[index + 1];
    }
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    console.log(createSpec(root, { category: values['--category'], name: values['--name'], date: values['--date'] ?? today }));
    console.log('已创建草稿并添加独立稳定 ID；请填写真实来源、用户确认范围和适用章节。');
  }
}
