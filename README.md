
Backend (Express + TS + Supabase + Resend + Scraper)
1) Copy .env.example to .env and fill values.
2) Run SUPABASE_SCHEMA.sql in Supabase SQL editor (creates tables).
3) Deploy to Render: build `npm install && npm run build`, start `npm run start`.
4) Set env vars in Render (SUPABASE_*, RESEND_*, ADMIN_KEY, EXAMPLE_SOURCE_URL).
5) Test: /health, then POST /jobs/import-all with X-Admin-Key header.
