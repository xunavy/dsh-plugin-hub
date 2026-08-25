/**
 * 排名计算模块。与站点前端（site/template.html）保持同一套逻辑。
 */

/** 综合热度分：下载量（30 日，log 加权）+ 星标（log）。 */
export function hotScore(p) {
  const dl = Math.log10(1 + (Number(p.downloads) || 0))
  const st = Math.log10(1 + (Number(p.stars) || 0))
  return dl * 2 + st
}

const num = (v) => (v == null ? null : Number(v))
const time = (v) => (v ? new Date(v).getTime() : 0)

function byDownloadsDesc(a, b) {
  const ad = a.downloads, bd = b.downloads
  if ((ad == null) !== (bd == null)) return ad == null ? 1 : -1
  if (ad != null && ad !== bd) return bd - ad
  return (b.stars ?? -1) - (a.stars ?? -1)
}

function byStarsDesc(a, b) {
  const as = a.stars, bs = b.stars
  if ((as == null) !== (bs == null)) return as == null ? 1 : -1
  if (as != null && as !== bs) return bs - as
  return (b.downloads ?? -1) - (a.downloads ?? -1)
}

export const byHot = (a, b) => hotScore(b) - hotScore(a)
export const byFresh = (a, b) => time(b.added) - time(a.added)

export function normalizePlugins(plugins) {
  return (plugins ?? []).map((p) => ({
    ...p,
    stars: num(p.stars),
    downloads: num(p.downloads),
    added: p.added ?? null,
  }))
}

function withRank(p, i) {
  return { rank: i + 1, ...p, score: Math.round(hotScore(p) * 1000) / 1000 }
}

/**
 * 生成四张榜单：热门 / 下载 / 星标 / 新晋。
 * @param {Array} plugins 已 normalize 的插件列表
 * @returns {{ hot: Array, downloads: Array, stars: Array, fresh: Array }}
 */
export function buildRankings(plugins, { topN = 100, newDays = 7 } = {}) {
  const list = [...plugins]
  const pick = (sorter) => list.slice().sort(sorter).slice(0, topN).map(withRank)

  const hot = pick(byHot)
  const downloads = pick(byDownloadsDesc)
  const stars = pick(byStarsDesc)

  const latest = list.reduce((m, p) => Math.max(m, time(p.added)), 0)
  const cutoff = latest - newDays * 86400000
  const fresh = list
    .filter((p) => time(p.added) >= cutoff)
    .sort(byHot)
    .slice(0, topN)
    .map(withRank)

  return { hot, downloads, stars, fresh }
}