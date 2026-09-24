import {
  closeSync,
  fstatSync,
  ftruncateSync,
  openSync,
  readSync,
  readdirSync,
  rmSync,
  statSync,
  writeSync,
} from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const BACKEND_LOG_MAX_BYTES = 16 * 1024 * 1024
export const BACKEND_LOG_HISTORY_COUNT = 5

export function pruneFinishedBackendLogs(currentPath, keep = BACKEND_LOG_HISTORY_COUNT) {
  const directory = dirname(currentPath)
  const finished = readdirSync(directory)
    .filter(name => /^shared-backend-\d+\.log$/.test(name) && name !== basename(currentPath))
    .filter(name => {
      const pid = Number(name.match(/^shared-backend-(\d+)\.log$/)[1])
      try {
        process.kill(pid, 0)
        return false
      } catch (error) {
        return error.code === 'ESRCH'
      }
    })
    .map(name => ({ name, modified: statSync(resolve(directory, name)).mtimeMs }))
    .sort((left, right) => right.modified - left.modified)
  for (const entry of finished.slice(keep)) rmSync(resolve(directory, entry.name))
}

export function createBoundedLogWriter(path, maxBytes = BACKEND_LOG_MAX_BYTES) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 2) throw new Error('invalid log size limit')
  const descriptor = openSync(path, 'a+', 0o600)
  let size = fstatSync(descriptor).size

  function compact() {
    const retainedSize = Math.min(size, Math.floor(maxBytes / 2))
    const retained = Buffer.alloc(retainedSize)
    let readOffset = 0
    while (readOffset < retainedSize) {
      const bytesRead = readSync(descriptor, retained, readOffset, retainedSize - readOffset, size - retainedSize + readOffset)
      if (bytesRead === 0) throw new Error('failed to retain log tail')
      readOffset += bytesRead
    }
    ftruncateSync(descriptor, 0)
    let writeOffset = 0
    while (writeOffset < retainedSize) writeOffset += writeSync(descriptor, retained, writeOffset, retainedSize - writeOffset)
    size = retainedSize
  }

  if (size > maxBytes) compact()

  return {
    write(chunk) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      let offset = 0
      while (offset < bytes.length) {
        if (size === maxBytes) compact()
        const length = Math.min(bytes.length - offset, maxBytes - size)
        const written = writeSync(descriptor, bytes, offset, length)
        size += written
        offset += written
      }
    },
    close() { closeSync(descriptor) },
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = process.argv[2]
  if (!path) throw new Error('expected log path')
  const writer = createBoundedLogWriter(path)
  try {
    pruneFinishedBackendLogs(path)
    const chunk = Buffer.allocUnsafe(64 * 1024)
    for (;;) {
      const length = readSync(0, chunk, 0, chunk.length, null)
      if (length === 0) break
      writer.write(chunk.subarray(0, length))
    }
  }
  finally {
    writer.close()
  }
}
