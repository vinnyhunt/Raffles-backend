
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase } from './lib/supabase';
import { sendEmail } from './lib/resend';
import { upsertRaffle } from './lib/upsertRaffle';
import { scrapeExampleHTML } from './lib/scrapers/exampleSource';

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_KEY = process.env.ADMIN_KEY || '';

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/raffles', async (req, res) => {
  try {
    const minChance = Number(req.query.minChance ?? 0);
    const maxChance = Number(req.query.maxChance ?? 100);
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    const category = (req.query.category as string) || null;

    let query = supabase.from('raffles').select('*').eq('status', 'active');
    if (category) query = query.eq('category', category);
    const { data, error } = await query.order('last_checked_at', { ascending: false }).limit(200);
    if (error) throw error;

    const filtered = (data || []).filter((r: any) => {
      const chance = r.total_tickets > 0 ? (r.tickets_sold / r.total_tickets) * 100 : 100;
      const priceOk = (maxPrice == null) ? true : (r.price == null ? true : r.price <= maxPrice);
      return chance >= minChance && chance <= maxChance && priceOk;
    });

    res.json(filtered);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/subscribe', async (req, res) => {
  try {
    const { email, min_chance, max_price } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    const { data, error } = await supabase.from('subscribers').insert({
      email,
      min_chance: Number(min_chance ?? 0),
      max_price: max_price != null ? Number(max_price) : null
    }).select('*').single();
    if (error) throw error;

    await sendEmail(email, 'Subscribed to undersold raffle alerts 🎯',
      `<p>Thanks for subscribing! We'll email you when raffle odds look good.</p>`);

    res.json({ ok: true, subscriber: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/jobs/import-all', async (req, res) => {
  try {
    if (!ADMIN_KEY || req.headers['x-admin-key'] !== ADMIN_KEY) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const { data: sources, error } = await supabase.from('raffle_sources').select('*').eq('enabled', true);
    if (error) throw error;
    let inserted = 0, updated = 0;
    for (const src of (sources || [])) {
      const result = await runImportForSource(src.id, src.scrape_strategy || 'html:cheerio');
      inserted += result.inserted;
      updated += result.updated;
    }
    res.json({ ok: true, inserted, updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/jobs/import/:sourceId', async (req, res) => {
  try {
    if (!ADMIN_KEY || req.headers['x-admin-key'] !== ADMIN_KEY) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const sourceId = req.params.sourceId;
    const { data: src, error } = await supabase.from('raffle_sources').select('*').eq('id', sourceId).single();
    if (error) throw error;
    const out = await runImportForSource(src.id, src.scrape_strategy || 'html:cheerio');
    res.json({ ok: true, ...out });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function runImportForSource(sourceId: string, strategy: string) {
  let inserted = 0, updated = 0, errorTxt: string | null = null;
  try {
    let items:any[] = [];
    if (strategy.startsWith('html')) {
      items = await scrapeExampleHTML(sourceId);
    }
    for (const item of items) {
      const before = await supabase.from('raffles').select('id').eq('source_id', item.source_id).eq('external_id', item.external_id).maybeSingle();
      await upsertRaffle(item);
      if (before.data?.id) updated++; else inserted++;
    }
  } catch (e: any) {
    errorTxt = e.message;
  } finally {
    await supabase.from('import_runs').insert({
      source_id: sourceId, started_at: new Date().toISOString(), finished_at: new Date().toISOString(),
      inserted_count: inserted, updated_count: updated, error: errorTxt
    });
  }
  return { inserted, updated, error: errorTxt };
}

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
