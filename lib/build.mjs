import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOT, DATA_DIR } from './fetch.mjs'
import { normalizePlugins, buildRankings } from './rank.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE = join(ROOT, 'site', 'template.html')
const SITE_DIR = join(ROOT, 'docs') // 发布目录：GitHub Pages 用 /docs 部署
const SITE_DATA_DIR = join(SITE_DIR, 'data')
const OUT_HTML = join(SITE_DIR, 'index.html')
const OUT_TOP = join(DATA_DIR, 'top.json')

function readMeta() {
  const p = join(DATA_DIR, 'meta.json')
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {}
}

/**
 * 读取 data/catalog.json，产出：
 *   - docs/index.html       自包含看板（数据内嵌，GitHub Pages /docs 直接托管）
 *   - docs/data/*.json      公开的机读榜单（top / catalog / meta）
 *   - data/top.json         工作目录内的机读榜单
 */
export function build({ topN = 100, newDays = 7 } = {}) {
  mkdirSync(DATA_DIR, { recursive: true })
  mkdirSync(SITE_DIR, { recursive: true })
  mkdirSync(SITE_DATA_DIR, { recursive: true })

  const catalog = JSON.parse(readFileSync(join(DATA_DIR, 'catalog.json'), 'utf8'))
  const plugins = normalizePlugins(catalog.plugins)
  const leaders = buildRankings(plugins, { topN, newDays })
  const generatedAt = new Date().toISOString()
  const meta = readMeta()

  const topJson = {
    generatedAt,
    sourceUpdated: catalog.updated ?? null,
    source: meta.source ?? catalog.source ?? 'https://awesome-dsh-plugin.com/plugins.json',
    count: plugins.length,
    categories: catalog.categories ?? {},
    leaders,
  }

  // 机读榜单：工作目录 + 站点目录各一份
  writeFileSync(OUT_TOP, JSON.stringify(topJson, null, 2) + '\n')
  writeFileSync(join(SITE_DATA_DIR, 'top.json'), JSON.stringify(topJson, null, 2) + '\n')

  // 站点目录同步原始目录与元信息，作为公开数据接口
  copyFileSync(join(DATA_DIR, 'catalog.json'), join(SITE_DATA_DIR, 'catalog.json'))
  if (existsSync(join(DATA_DIR, 'meta.json'))) {
    copyFileSync(join(DATA_DIR, 'meta.json'), join(SITE_DATA_DIR, 'meta.json'))
  }

  const embedded = {
    generatedAt,
    sourceUpdated: catalog.updated ?? null,
    count: plugins.length,
    categories: catalog.categories ?? {},
    plugins,
  }
  const template = readFileSync(TEMPLATE, 'utf8')
  if (!template.includes('__CATALOG_JSON__')) {
    throw new Error('template.html 缺少 __CATALOG_JSON__ 占位符')
  }
  const html = template.split('__CATALOG_JSON__').join(JSON.stringify(embedded))
  writeFileSync(OUT_HTML, html)

  return {
    count: plugins.length,
    leaders: Object.fromEntries(Object.entries(leaders).map(([k, v]) => [k, v.length])),
    htmlSize: Buffer.byteLength(html),
  }
}