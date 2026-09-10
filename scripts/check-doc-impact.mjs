#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const documentationRoot = resolve(scriptDirectory, '..')
const workspaceRoot = resolve(documentationRoot, '../..')
const configurationPath = resolve(scriptDirectory, 'docs-impact-map.json')

export function globToRegExp(pattern) {
  let expression = '^'

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]
    const next = pattern[index + 1]

    if (character === '*' && next === '*') {
      expression += '.*'
      index += 1
    } else if (character === '*') {
      expression += '[^/]*'
    } else if ('\\^$+?.()|{}[]'.includes(character)) {
      expression += `\\${character}`
    } else {
      expression += character
    }
  }

  return new RegExp(`${expression}$`)
}

export function matchesAny(filePath, patterns) {
  return patterns.some(pattern => globToRegExp(pattern).test(filePath))
}

function parseArguments(argv) {
  const result = {
    mode: 'staged',
    all: false,
    repository: null,
    noDocumentReason: process.env.TOTO_DOCS_IMPACT_NONE_REASON?.trim() || ''
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--working-tree') result.mode = 'working-tree'
    else if (argument === '--staged') result.mode = 'staged'
    else if (argument === '--all') result.all = true
    else if (argument === '--repo') result.repository = argv[++index]
    else if (argument === '--no-doc-impact') result.noDocumentReason = argv[++index]?.trim() || ''
    else if (argument === '--help' || argument === '-h') result.help = true
    else throw new Error(`未知参数：${argument}`)
  }

  return result
}

function printHelp() {
  console.log(`用法：node scripts/check-doc-impact.mjs [选项]

选项：
  --staged                 检查已暂存改动（默认）
  --working-tree           检查已暂存、未暂存和未跟踪改动
  --all                    检查配置中的全部代码仓库
  --repo <路径或仓库 ID>   只检查指定仓库
  --no-doc-impact <原因>   声明无文档影响，原因至少 8 个字符
  -h, --help               显示帮助`)
}

function gitLines(repositoryRoot, args) {
  const output = execFileSync('git', ['-c', 'core.quotePath=false', '-C', repositoryRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })

  return output.split('\n').map(line => line.trim()).filter(Boolean)
}

function changedFiles(repositoryRoot, mode) {
  const staged = gitLines(repositoryRoot, [
    'diff', '--cached', '--name-only', '--diff-filter=ACMR'
  ])

  if (mode === 'staged') return staged

  const unstaged = gitLines(repositoryRoot, [
    'diff', '--name-only', '--diff-filter=ACMR'
  ])
  const untracked = gitLines(repositoryRoot, [
    'ls-files', '--others', '--exclude-standard'
  ])

  return [...new Set([...staged, ...unstaged, ...untracked])]
}

function resolveRepository(argument, repositories) {
  if (!argument) return null

  const byId = repositories.find(repository => repository.id === argument)
  if (byId) return byId

  const candidateRoot = resolve(isAbsolute(argument) ? argument : resolve(process.cwd(), argument))
  return repositories.find(repository => resolve(workspaceRoot, repository.path) === candidateRoot) || null
}

function currentRepository(repositories) {
  const currentPath = resolve(process.cwd())

  return repositories.find(repository => {
    const repositoryRoot = resolve(workspaceRoot, repository.path)
    const relativePath = relative(repositoryRoot, currentPath)
    return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath))
  }) || null
}

function configuredRepositories(options, configuration) {
  if (options.all) return configuration.repositories

  const selected = resolveRepository(options.repository, configuration.repositories)
    || currentRepository(configuration.repositories)

  if (options.repository && !selected) {
    throw new Error(`未在 docs-impact-map.json 中找到仓库：${options.repository}`)
  }

  return selected ? [selected] : configuration.repositories
}

function listDocumentationEvidence(mode, configuration, repositoryChanges) {
  const sharedChanges = changedFiles(documentationRoot, mode)
    .filter(filePath => matchesAny(filePath, configuration.documentationPatterns))

  const localChanges = repositoryChanges.flatMap(({ repository, files }) =>
    files
      .filter(filePath => matchesAny(filePath, repository.localDocumentationPatterns || []))
      .map(filePath => `${repository.id}:${filePath}`)
  )

  return [...sharedChanges.map(filePath => `docs/toto:${filePath}`), ...localChanges]
}

export function findImpactedFiles(files, impactPatterns) {
  return files.filter(filePath => matchesAny(filePath, impactPatterns))
}

function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const configuration = JSON.parse(readFileSync(configurationPath, 'utf8'))
  const repositories = configuredRepositories(options, configuration)
  const repositoryChanges = []

  for (const repository of repositories) {
    const repositoryRoot = resolve(workspaceRoot, repository.path)
    if (!existsSync(resolve(repositoryRoot, '.git'))) continue

    const files = changedFiles(repositoryRoot, options.mode)
    repositoryChanges.push({ repository, files })
  }

  const impacted = repositoryChanges.flatMap(({ repository, files }) =>
    findImpactedFiles(files, repository.impactPatterns)
      .map(filePath => `${repository.id}:${filePath}`)
  )

  if (impacted.length === 0) {
    console.log('文档影响检查通过：没有检测到需要同步文档的代码改动。')
    return
  }

  console.log('检测到需要评估文档影响的改动：')
  for (const filePath of impacted) console.log(`  - ${filePath}`)

  const evidence = listDocumentationEvidence(options.mode, configuration, repositoryChanges)
  if (evidence.length > 0) {
    console.log('检测到文档更新证据：')
    for (const filePath of evidence) console.log(`  - ${filePath}`)
    console.log('文档影响检查通过。请在提交前确认这些文档确实属于当前任务。')
    return
  }

  if (options.noDocumentReason.length >= 8) {
    console.log(`文档影响检查通过：已声明无文档影响（${options.noDocumentReason}）。`)
    return
  }

  console.error('\n文档影响检查失败：存在功能代码改动，但没有检测到关联文档更新。')
  console.error('请更新 docs/toto 中的 Spec、进度、技术设计或待办并暂存，')
  console.error('或在确无文档影响时使用：')
  console.error("TOTO_DOCS_IMPACT_NONE_REASON='至少 8 个字符的具体原因' git commit ...")
  process.exitCode = 1
}

const entryPoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === entryPoint) {
  try {
    main()
  } catch (error) {
    console.error(`文档影响检查执行失败：${error.message}`)
    process.exitCode = 1
  }
}
