#!/usr/bin/env node
/**
 * 极简静态服务器（零依赖）。
 * 用法：node serve.mjs [端口]   （默认 4545）
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('.', import.meta.url))
const PORT = Number(process.argv[2] || process.env.PORT || 4545)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    let pathname = decodeURIComponent(url.pathname)
    if (pathname === '/') pathname = '/index.html'
    const file = resolve(join(ROOT, pathname))
    if (!file.startsWith(resolve(ROOT))) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('403 forbidden')
      return
    }
    const body = await readFile(file)
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
    })
    res.end(body)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('404 not found')
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`DSH Plugin Hub 已启动 → http://127.0.0.1:${PORT}`)
})