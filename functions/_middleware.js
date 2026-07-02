/**
 * Cloudflare Pages Function — routes the YMarket PORTAL onto the bare domain.
 *
 * Goal: ymarket.co.il/portal (no "app." prefix). The portal/CRM runs behind the
 * Cloudflare Tunnel at app.ymarket.co.il → localhost:3000. This middleware sits in
 * front of the static Pages site and reverse-proxies only the app's paths to that
 * origin, keeping the visitor on ymarket.co.il. Everything else falls through to
 * the static product pages.
 *
 * Proxied to the app:  /portal*  /api/*  /_next/*  /banners/*  /uploads/*
 * Served by Pages:      everything else (/, /products/*, /items/*, /css/*, ...)
 *
 * Notes:
 *  - 200 responses are returned as-is so Set-Cookie (portal_token) is preserved.
 *  - 3xx redirects have their Location domain rewritten app.→bare so login/redirects
 *    (incl. the ?next= deep-link that completes add-to-cart) stay on ymarket.co.il.
 */
const APP_ORIGIN = 'https://app.ymarket.co.il'
const APP_PATHS = ['/portal', '/api/', '/_next/', '/banners/', '/uploads/']

export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)
  const p = url.pathname
  const isApp = APP_PATHS.some(pre => p === pre.replace(/\/$/, '') || p.startsWith(pre))
  if (!isApp) return next() // static Pages site

  const target = APP_ORIGIN + p + url.search
  const res = await fetch(new Request(target, request), { redirect: 'manual' })

  // Rewrite app-domain redirects back to the bare domain (no body/cookies on 3xx).
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location')
    if (loc) {
      const h = new Headers(res.headers)
      h.set('location', loc.split('app.ymarket.co.il').join(url.host))
      return new Response(null, { status: res.status, headers: h })
    }
  }
  // 200/etc — pass through untouched so Set-Cookie + headers survive.
  return res
}
