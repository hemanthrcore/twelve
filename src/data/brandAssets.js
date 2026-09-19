/* Live brand asset registry. Logos use trademark-accurate SVGs with a
   company-mark fallback. Card covers are code-native brand colour fields so
   the real logo is the only visual focal point. */

const icon = (name, color) => `https://cdn.simpleicons.org/${name}/${color.replace('#', '')}`
const clearbit = (domain) => `https://logo.clearbit.com/${domain}`

export const BRAND_LOGOS = {
  netflix: [icon('netflix', '#E50914'), clearbit('netflix.com')], prime: [icon('primevideo', '#00A8E1'), clearbit('primevideo.com')], max: [icon('max', '#7B61FF'), clearbit('max.com')], disney: [icon('disneyplus', '#FFFFFF'), clearbit('disneyplus.com')],
  hotstar: [clearbit('jiohotstar.com')], tencent: [clearbit('v.qq.com')], iqiyi: [icon('iqiyi', '#00BE06'), clearbit('iq.com')], paramount: [icon('paramountplus', '#FFFFFF'), clearbit('paramountplus.com')], hulu: [icon('hulu', '#1CE783'), clearbit('hulu.com')], peacock: [icon('peacock', '#FFFFFF'), clearbit('peacocktv.com')],
  viu: [icon('viu', '#FFCC00'), clearbit('viu.com')], canal: [icon('canalplus', '#FFFFFF'), clearbit('canalplus.com')], appletv: [icon('appletv', '#FFFFFF'), clearbit('tv.apple.com')], youtubetv: [icon('youtubetv', '#FF0000'), clearbit('tv.youtube.com')], crunchyroll: [icon('crunchyroll', '#F47521'), clearbit('crunchyroll.com')],
  dazn: [icon('dazn', '#C6F500'), clearbit('dazn.com')], shahid: [icon('shahid', '#16C79A'), clearbit('shahid.mbc.net')], zee5: [icon('zee5', '#E5077E'), clearbit('zee5.com')], sonyliv: [icon('sonyliv', '#FFFFFF'), clearbit('sonyliv.com')], tubi: [icon('tubitv', '#FA382F'), clearbit('tubitv.com')],
  coursera: [icon('coursera', '#0056D2'), clearbit('coursera.org')], udemy: [icon('udemy', '#A435F0'), clearbit('udemy.com')], masterclass: [icon('masterclass', '#FFFFFF'), clearbit('masterclass.com')], linkedin: [icon('linkedin', '#0A66C2'), clearbit('linkedin.com')], skillshare: [icon('skillshare', '#00D46F'), clearbit('skillshare.com')],
  chatgpt: [icon('openai', '#FFFFFF'), clearbit('openai.com')], claude: [icon('anthropic', '#D97757'), clearbit('anthropic.com')], gemini: [icon('googlegemini', '#8AB4F8'), clearbit('gemini.google.com')], perplexity: [icon('perplexity', '#20B8CD'), clearbit('perplexity.ai')], midjourney: [icon('midjourney', '#FFFFFF'), clearbit('midjourney.com')]
}

export const getBrandLogo = (id) => BRAND_LOGOS[id]
