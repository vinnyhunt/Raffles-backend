
import type { Raffle } from '../types';
export function normalizeRaffle(input: Partial<Raffle>): Raffle {
  if (!input.external_id) throw new Error('external_id required');
  if (!input.source_id) throw new Error('source_id required');
  if (!input.title) throw new Error('title required');
  if (!input.source_url) throw new Error('source_url required');
  const total = Number(input.total_tickets ?? 0);
  const sold = Number(input.tickets_sold ?? 0);
  return {
    external_id: String(input.external_id),
    source_id: String(input.source_id),
    title: String(input.title),
    image_url: input.image_url ?? null,
    total_tickets: total,
    tickets_sold: sold,
    price: input.price != null ? Number(input.price) : null,
    category: input.category ?? null,
    source_url: String(input.source_url),
    ends_at: input.ends_at ?? null,
    status: (input.status as any) ?? 'active',
    last_checked_at: new Date().toISOString()
  };
}
