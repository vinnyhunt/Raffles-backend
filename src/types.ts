
export type Raffle = {
  id?: string;
  external_id: string;
  source_id: string;
  title: string;
  image_url?: string | null;
  total_tickets: number;
  tickets_sold: number;
  price?: number | null;
  category?: string | null;
  source_url: string;
  ends_at?: string | null;
  status?: 'active' | 'ended' | 'draft';
  created_at?: string;
  last_checked_at?: string;
};
