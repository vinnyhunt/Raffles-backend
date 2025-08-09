
import { supabase } from './supabase';
import type { Raffle } from '../types';

export async function upsertRaffle(r: Raffle) {
  const { data, error } = await supabase
    .from('raffles')
    .upsert(r, { onConflict: 'source_id,external_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
