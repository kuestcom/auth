create extension if not exists pgcrypto;

create table if not exists public.key_emails (
  id uuid primary key default gen_random_uuid(),
  api_key uuid not null unique,
  email text not null check (
    length(email) <= 254
    and length(split_part(email, '@', 1)) <= 64
    and split_part(email, '@', 1) not like '.%'
    and split_part(email, '@', 1) not like '%.'
    and split_part(email, '@', 1) not like '%..%'
    and email ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@([A-Z0-9]([A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z0-9]([A-Z0-9-]{0,61}[A-Z0-9])$'
  ),
  site_url text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
