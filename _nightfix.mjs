import fs from 'fs'
const KEY = fs.readFileSync('../crm-app/.env', 'utf8').match(/^GEMINI_API_KEY=(.+)$/m)[1].trim()
const PJ = 'data/products.json'

const ITEMS = [
  { id: 466, med: false }, { id: 628, med: false }, { id: 340, med: false },
  { id: 675, med: false }, { id: 429, med: false }, { id: 776, med: false },
  { id: 509, med: true }, { id: 506, med: true }, { id: 505, med: true }, { id: 510, med: true },
  { id: 507, med: true }, { id: 532, med: true }, { id: 508, med: true }, { id: 511, med: true },
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function processOne(it) {
  const imgRel = (it.imageUrl || `/items/${it.id}.jpg`).replace(/^\//, '')
  if (!fs.existsSync(imgRel)) return { ok: false, why: 'no image' }
  const b64 = fs.readFileSync(imgRel).toString('base64')
  const medRule = it.__med
    ? `⚠️ מוצר רפואי/חירום: אסור "מאושר"/"תקן"/"אמ\\"ר"/"מציל חיים"/"מונע מוות"/הבטחת יעילות. מותר "מיועד ל"/"כולל". תאר את תכולת הערכה הנראית בתמונה.`
    : ``
  const sys = `אתה כותב תוכן מוצר B2B לוואי מרקט. נתח את התמונה ותאר את המוצר **עובדתית בלבד לפי הנראה בתמונה** + שם המוצר. אסור להמציא חומר/מידות/תקנים/ביקורות שלא נראים. זה המוצר עצמו — אם השם או תיאור קודם הזכירו "שקיות אשפה" וזה לא שקיות, התעלם מזה לחלוטין. ${medRule} בלי שמות מתחרים. בלי "אנחנו קטנים". עברית.
החזר בדיוק בפורמט:
TYPE: <סוג המוצר הנכון, קצר>
DESC: <תיאור שורה אחת>
SPECS:
תווית | ערך
תווית | ערך
(3-5 שורות מפרט עובדתי מהתמונה/שם — חומר/חלקים/קיבולת/צבע/תכולה לפי מה שרואים)
SPECS_END
BODY_START
<HTML 4-5 סעיפים <h3>+<p>+<ul>: מה זה, תכונות נראות, למי מיועד (קהלים מוסדיים), יתרון מעשי, רכישה סיטונאית. תגיות h3/p/ul/li/strong>
BODY_END
FAQ_START
Q: שאלה
A: תשובה
(6 זוגות)
FAQ_END`
  const body = {
    contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: `שם המוצר: ${it.__name}\nכתוב את התוכן.` }] }],
    system_instruction: { parts: [{ text: sys }] },
    generationConfig: { temperature: 0.35, maxOutputTokens: 4000, thinkingConfig: { thinkingBudget: 0 } },
  }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const d = await r.json()
  const t = d.candidates?.[0]?.content?.parts?.filter(p => p.text).map(p => p.text).join('') || ''
  const g = re => (t.match(re) || [])[1]?.trim() || ''
  const type = g(/^TYPE:\s*(.+)$/m)
  const desc = g(/^DESC:\s*(.+)$/m)
  const specsRaw = g(/SPECS:\s*([\s\S]*?)\s*SPECS_END/)
  const specs = specsRaw.split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p.length === 2 && p[0] && p[1]).map(p => ({ label: p[0], value: p[1] }))
  const bodyHtml = g(/BODY_START\s*([\s\S]*?)\s*BODY_END/)
  const faqs = [...t.matchAll(/Q:\s*(.+?)\s*\n+A:\s*([\s\S]+?)(?=\n+Q:|\nFAQ_END|$)/g)].map(m => ({ question: m[1].trim(), answer: m[2].trim() }))
  // guards
  if (!type || /שקיות אשפה|\bHD\b|\bLD\b/.test(type)) return { ok: false, why: 'bad type: ' + type }
  if (bodyHtml.length < 500 || faqs.length < 5 || specs.length < 2) return { ok: false, why: `thin body=${bodyHtml.length} faq=${faqs.length} specs=${specs.length}` }
  if (it.__med && /מאושר|תקן\b|אמ"ר|מציל חיים|מונע מוות|מבטיח/.test(t)) return { ok: false, why: 'medical claim' }
  if (/שקיות אשפה מקצועי|HD vs LD/.test(bodyHtml)) return { ok: false, why: 'contamination in body' }
  return { ok: true, type, desc, specs, bodyHtml, faqs }
}

const pj = JSON.parse(fs.readFileSync(PJ, 'utf8'))
const results = []
for (const cfg of ITEMS) {
  const it = pj.items.find(x => x.id === cfg.id)
  if (!it) { results.push({ id: cfg.id, ok: false, why: 'not found' }); continue }
  it.__med = cfg.med; it.__name = it.name
  let res
  try { res = await processOne(it) } catch (e) { res = { ok: false, why: (e.message || '').slice(0, 50) } }
  delete it.__med; delete it.__name
  if (!res.ok) { results.push({ id: cfg.id, name: it.name, ok: false, why: res.why }); await sleep(800); continue }
  // apply
  const specsFull = [{ label: 'סוג מוצר', value: res.type }, ...res.specs.filter(s => s.label !== 'סוג מוצר'),
    { label: 'שימוש', value: 'מוסדי / מסחרי' }, { label: 'אספקה', value: '1-3 ימי עסקים' }]
  if (it.saleNis > 0) specsFull.push({ label: 'מחיר', value: `₪${it.saleNis} + מע"מ` })
  it.description = res.desc
  it.technicalDesc = JSON.stringify(specsFull)
  it.searchTags = [res.type, it.name, 'מוסדי', 'לעסקים', 'סיטונאי'].join(', ')
  it.seo = it.seo || {}
  it.seo.title = `${it.name} למוסדות ועסקים | וואי מרקט`
  it.seo.h1 = it.name
  it.seo.metaDesc = `${res.desc}. ${res.type} לעסקים ומוסדות במחיר סיטונאי ואספקה מהירה. וואי מרקט.`.slice(0, 158)
  it.seo.imageAlt = `${it.name} — ${res.type}`
  it.seo.geoContent = `<div class="category-seo">\n${res.bodyHtml}\n</div>`
  it.seo.faqs = res.faqs
  results.push({ id: cfg.id, name: it.name, ok: true, type: res.type, slug: it.seoSlug || it.slug, body: res.bodyHtml.replace(/<[^>]+>/g, '').length, faq: res.faqs.length })
  await sleep(800)
}
fs.writeFileSync(PJ, JSON.stringify(pj, null, 2))
console.log('=== NIGHT FIX RESULTS ===')
results.forEach(r => console.log((r.ok ? '✅' : '❌') + ' ' + r.id + ' ' + (r.name || '') + (r.ok ? ` [${r.type}] body${r.body}/faq${r.faq} slug=${r.slug}` : ' — ' + r.why)))
const okSlugs = results.filter(r => r.ok).map(r => r.slug)
fs.writeFileSync('_nightfix_slugs.json', JSON.stringify(okSlugs))
console.log('\nOK:', results.filter(r => r.ok).length, '/ ', results.length, '| slugs saved for regeneration')
