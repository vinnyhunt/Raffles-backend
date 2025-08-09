
create extension if not exists pgcrypto;
create table if not exists raffle_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text,
  enabled boolean not null default true,
  scrape_strategy text not null default 'html:cheerio',
  created_at timestamptz not null default now()
);
create table if not exists raffles (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  source_id uuid not null references raffle_sources(id) on delete cascade,
  title text not null,
  image_url text,
  total_tickets int not null default 0,
  tickets_sold int not null default 0,
  price numeric,
  category text,
  source_url text not null,
  ends_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  last_checked_at timestamptz
);
create unique index if not exists raffles_source_external_uidx on raffles(source_id, external_id);
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  min_chance int not null default 0,
  max_price numeric,
  created_at timestamptz not null default now()
);
create table if not exists import_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references raffle_sources(id) on delete cascade,
  started_at timestamptz not null,
  finished_at timestamptz,
  inserted_count int not null default 0,
  updated_count int not null default 0,
  error text
);
