#!/usr/bin/env node
/**
 * DSH Plugin Hub — 数据抓取模块
 *
 * 拉取最新 DeepSeek Harness 插件清单（官方机器可读目录）：
 *   1) https://awesome-dsh-plugin.com/plugins.json   首选，官方自动生成
 *   2) npm 包 dsh-plugin-catalog 的 tarball          备用，走 npm registry/镜像
 * 全部失败时可回退到本地缓存 data/catalog.json。
 */
import { readFileSync, writeFileSync, rmSync, mkdtempSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT = join(__dirname, '..')
export const DATA_DIR = join(ROOT, 'data')

const PRIMARY = 'https://awesome-dsh-plugin.com/plugins.json'
const NPM_CATALOG = 'https://registry.npmjs.org/dsh-plugin-catalog/latest'
const HEADERS = {
  accept: 'application/json',
  'user-agent': 'DSH-PluginHub (+https://github.com/deepseek-ai/deepseek-harness)',
}

async function httpJson(url, timeout = 30000) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeout) })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

/** 从 npm 包 tarball 中抽取 plugins.json（走 npm 镜像，国内可访问）。 */
async function fromNpmTarball() {
  const meta = await httpJson(NPM_CATALOG)
  const tarball = meta?.dist?.tarball
  if (!tarball) throw new Error('npm catalog has no dist.tarball')
  const blob = await fetch(tarball, { headers: HEADERS, signal: AbortSignal.timeout(90000) })
  if (!blob.ok) throw new Error(`HTTP ${blob.status} for tarball`)
  const tmp = mkdtempSync(join(os.tmpdir(), 'dsh-catalog-'))
  const tgz = join(tmp, 'catalog.tgz')
  writeFileSync(tgz, Buffer.from(await blob.arrayBuffer()))
  try {
    execFileSync('tar', ['-xzf', tgz, '-C', tmp], { stdio: 'pipe', windowsHide: true })
  } catch (e) {
    throw new Error(`tar 解包失败: ${e.message}`)
  }
  let found = null
  const walk = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      if (found) return
      const p = join(dir, ent.name)
      if (ent.isDirectory()) walk(p)
      else if (ent.name === 'plugins.json') { found = p; return }
    }
  }
  walk(tmp)
  if (!found) throw new Error('plugins.json not found in tarball')
  const parsed = JSON.parse(readFileSync(found, 'utf8'))
  rmSync(tmp, { recursive: true, force: true })
  return parsed
}

function validate(catalog) {
  if (!catalog || !Array.isArray(catalog.plugins) || catalog.plugins.length === 0) {
    throw new Error('catalog missing non-empty plugins[]')
  }
  return catalog
}

/**
 * 拉取并校验最新目录。
 * @returns {{ catalog: object, meta: object }}
 */
export async function fetchCatalog({ useCache = true } = {}) {
  const errors = []
  try {
    const catalog = await httpJson(PRIMARY, 45000)
    validate(catalog)
    return {
      catalog,
      meta: { source: PRIMARY, kind: 'url', fetchedAt: new Date().toISOString(), cache: false },
    }
  } catch (e) {
    errors.push(`url: ${e.message}`)
  }

  try {
    const catalog = await fromNpmTarball()
    validate(catalog)
    return {
      catalog,
      meta: { source: NPM_CATALOG, kind: 'npm', fetchedAt: new Date().toISOString(), cache: false },
    }
  } catch (e) {
    errors.push(`npm: ${e.message}`)
  }

  if (useCache) {
    const cached = join(DATA_DIR, 'catalog.json')
    if (existsSync(cached)) {
      const catalog = JSON.parse(readFileSync(cached, 'utf8'))
      validate(catalog)
      let prev = {}
      const metaPath = join(DATA_DIR, 'meta.json')
      if (existsSync(metaPath)) prev = JSON.parse(readFileSync(metaPath, 'utf8'))
      return {
        catalog,
        meta: { ...prev, source: 'cache', kind: 'cache', fetchedAt: new Date().toISOString(), cache: true },
      }
    }
  }

  throw new Error(`无法获取插件目录：\n - ${errors.join('\n - ')}`)
}