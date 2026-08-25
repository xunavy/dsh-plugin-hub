#!/usr/bin/env node
/**
 * 一键更新：抓取最新目录 → 生成本地数据 + 榜单 + 看板（输出到 docs/）。
 * 用法：node lib/update.mjs   （Windows 可直接双击 update.bat）
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fetchCatalog, DATA_DIR } from './fetch.mjs'
import { build } from './build.mjs'

mkdirSync(DATA_DIR, { recursive: true })

const { catalog, meta } = await fetchCatalog({ useCache: true })

writeFileSync(join(DATA_DIR, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
writeFileSync(join(DATA_DIR, 'meta.json'), JSON.stringify(meta, null, 2) + '\n')

const result = build()

const kindLabel = { url: '官方站点', npm: 'npm 镜像', cache: '本地缓存' }[meta.kind] ?? meta.kind
const fmtTime = (iso) => (iso ? iso.replace('T', ' ').slice(0, 19) : 'n/a')

console.log('')
console.log('✅ DSH Plugin Hub 更新完成')
console.log(`   目录时间 : ${catalog.updated ?? 'n/a'}（${fmtTime(meta.fetchedAt)} 抓取）`)
console.log(`   插件总数 : ${result.count}`)
console.log(`   数据来源 : ${kindLabel}${meta.cache ? '（离线缓存）' : ''}`)
console.log(`   榜单     : 热门 ${result.leaders.hot} · 下载 ${result.leaders.downloads} · 星标 ${result.leaders.stars} · 新晋 ${result.leaders.fresh}`)
console.log(`   产出     : docs/index.html · docs/data/* · data/top.json`)
console.log(`   打开     : 双击 docs\\index.html，或运行 serve.bat 后访问 http://127.0.0.1:4545`)