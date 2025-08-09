
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { normalizeRaffle } from '../normalize';
import type { Raffle } from '../../types';

export async function scrapeExampleHTML(sourceId: string): Promise<Raffle[]> {
  const url = process.env.EXAMPLE_SOURCE_URL;
  if (!url) throw new Error('EXAMPLE_SOURCE_URL not set');
  const res = await fetch(url, { headers: { 'User-Agent': 'UndersoldRafflesBot/1.0' } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const out: Raffle[] = [];
  $('.raffle').each((_, el) => {
    const external_id = $(el).attr('data-id')?.trim() || '';
    const title = $(el).find('.raffle-link').text().trim();
    const source_url = $(el).find('.raffle-link').attr('href') || '';
    const image_url = $(el).find('img').attr('src') || null;
    const total = Number($(el).find('.total').text().trim()) || 0;
    const sold = Number($(el).find('.sold').text().trim()) || 0;
    const price = Number($(el).find('.price').text().trim()) || null;
    const ends_at = $(el).find('.ends').text().trim() || null;
    if (!external_id || !title || !source_url) return;
    out.push(normalizeRaffle({
      external_id, source_id: sourceId, title, source_url,
      image_url, total_tickets: total, tickets_sold: sold, price, ends_at
    }));
  });
  return out;
}
