import { Request, Response } from 'express';
import https from 'https';
import http from 'http';

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry<T> { data: T; ts: number }
let ratesCache: CacheEntry<RatesPayload> | null = null;
let newsCache: CacheEntry<NewsPayload> | null = null;
const RATES_TTL = 3_600_000; // 1 hour
const NEWS_TTL  =   900_000; // 15 min

// ─── Types ────────────────────────────────────────────────────────────────────

interface RatesPayload {
  cdf_per_usd: number;
  updated: string;
  rates: Record<string, number>;
}

interface RssItem {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  category: string;
}

interface NewsPayload {
  items: RssItem[];
  source: string;
  fetched_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fetchText(url: string, depth = 0): Promise<string> {
  if (depth > 3) return Promise.reject(new Error('Too many redirects'));
  const mod = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.get(url, { headers: { 'User-Agent': 'DiscoverDRC/2.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location, depth + 1).then(resolve).catch(reject);
      }
      let raw = '';
      res.on('data', (c: Buffer) => { raw += c; });
      res.on('end', () => resolve(raw));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function decodeEntities(s: string): string {
  let out = s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  // second pass for double-encoded entities (e.g. &amp;quot; → &quot; → ")
  return out
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'");
}

function tag(xml: string, name: string): string {
  const m = new RegExp(`<${name}[^>]*>(?:<\\!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`, 'i').exec(xml);
  return m ? m[1].trim() : '';
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null && items.length < 8) {
    const block = m[1];
    const title = decodeEntities(tag(block, 'title'));
    const url   = tag(block, 'link') || tag(block, 'guid');
    const pub   = tag(block, 'pubDate');
    const rawDesc = decodeEntities(tag(block, 'description'));
    const strongM = /<strong[^>]*>([\s\S]*?)<\/strong>/i.exec(rawDesc);
    // Use attr-aware tag strip so quoted > inside img title attrs don't leak
    const stripTags = (s: string) =>
      s.replace(/<(?:[^"'>]|"[^"]*"|'[^']*')*>/g, '').replace(/\s+/g, ' ').trim();
    const desc = stripTags(strongM ? strongM[1] : rawDesc).slice(0, 280);
    const cat   = decodeEntities(tag(block, 'category')) || 'Actualités';
    if (title) items.push({ title, url, publishedAt: pub, summary: desc, category: cat });
  }
  return items;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function getRates(_req: Request, res: Response) {
  if (ratesCache && Date.now() - ratesCache.ts < RATES_TTL) {
    return res.json(ratesCache.data);
  }
  try {
    const raw = await fetchText('https://open.er-api.com/v6/latest/USD');
    const json = JSON.parse(raw);
    const r = json.rates as Record<string, number>;
    const payload: RatesPayload = {
      cdf_per_usd: r.CDF ?? 0,
      updated: json.time_last_update_utc ?? new Date().toISOString(),
      rates: { EUR: r.EUR, GBP: r.GBP, CAD: r.CAD, CNY: r.CNY, ZAR: r.ZAR, XAF: r.XAF },
    };
    ratesCache = { data: payload, ts: Date.now() };
    res.json(payload);
  } catch (err) {
    console.error('[economy/rates]', err);
    res.status(503).json({ error: 'Rates unavailable' });
  }
}

export async function getNews(_req: Request, res: Response) {
  if (newsCache && Date.now() - newsCache.ts < NEWS_TTL) {
    return res.json(newsCache.data);
  }
  try {
    const xml = await fetchText('https://radiookapi.net/feed/');
    const items = parseRss(xml);
    const payload: NewsPayload = { items, source: 'Radio Okapi', fetched_at: new Date().toISOString() };
    newsCache = { data: payload, ts: Date.now() };
    res.json(payload);
  } catch (err) {
    console.error('[economy/news]', err);
    res.status(503).json({ error: 'News unavailable' });
  }
}
