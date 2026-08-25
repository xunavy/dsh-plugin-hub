import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOT, DATA_DIR } from './fetch.mjs'
import { normalizePlugins, buildRankings } from './rank.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE = join(ROOT, 'site', 'template.html')
const OUT_HTML = join(ROOT, 'index.html')
const OUT_TOP = join(DATA_DIR, 'top.json')

function readMeta() {
  const p = join(DATA_DIR, 'meta.json')
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {}
}

/**
 * 读取 data/catalog.json，产出：
 *   - data/top.json      机读榜单（供程序化消费）
 *   - index.html         自包含看板（数据内嵌，双击即可离线打开）
 */
export function build({ topN = 100, newDays = 7 } = {}) {
  mkdirSync(DATA_DIR, { recursive: true })

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
  writeFileSync(OUT_TOP, JSON.stringify(topJson, null, 2) + '\n')

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