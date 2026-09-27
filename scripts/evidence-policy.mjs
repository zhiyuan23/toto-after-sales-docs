import { posix } from 'node:path'

const evidenceDirectory = /(?:^|\/)(?:evidence|screenshots|test-results|playwright-report)\//
const imageExtension = /\.(?:png|jpe?g|webp|gif|avif)$/i
const rawExtension = /\.(?:log|har|trace|zip|tar|gz|tgz|7z|mp4|webm|mov)$/i

export function isTextDocumentation(filePath) {
  return /\.md$/i.test(filePath)
}

// These declarations are for exceptional raw evidence only, not routine images.
// The checker validates the declaration; reviewers still assess its justification.
export function inspectEvidence(files, markdown = []) {
  const exceptions = new Set()
  for (const text of markdown) {
    for (const line of text.split('\n')) {
      const match = line.match(/^Evidence-Keep:\s*([^|]+?)\s*\|\s*(.+)$/)
      if (match && match[2].trim().length >= 8) exceptions.add(match[1].trim())
    }
  }

  const errors = []
  const warnings = []
  const imagesByDirectory = new Map()
  for (const { path, size } of files) {
    if (!evidenceDirectory.test(path)) continue
    if (rawExtension.test(path)) {
      if (exceptions.has(path)) warnings.push(`${path}：已声明特殊留存理由，仍须人工核对必要性和脱敏。`)
      else errors.push(`${path}：原始日志、抓包、录屏或归档默认不提交；移到 .local/，用 Markdown 摘要记录结论。确需留存时按协作规范逐文件说明例外。`)
    }
    if (imageExtension.test(path)) {
      const directory = posix.dirname(path)
      const images = imagesByDirectory.get(directory) || []
      images.push(path)
      imagesByDirectory.set(directory, images)
      if (size > 500 * 1024) warnings.push(`${path}：超过 500 KiB，请核对裁剪、压缩和必要性。`)
    }
  }
  for (const [directory, images] of imagesByDirectory) {
    warnings.push(`${directory}：本次 ${images.length} 张图片；小改动默认 0 张，重要界面通常 1～2 张。${images.length > 2 ? '超过常规数量，须在对应文档说明各自不可替代的状态。' : '请确认只保留最终关键状态，并有文字结论。'}`)
  }
  return { errors, warnings }
}
