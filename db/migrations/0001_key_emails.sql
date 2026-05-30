create extension if not exists pgcrypto;

create table if not exists public.key_emails (
  id uuid primary key default gen_random_uuid(),
  api_key uuid not null unique,
  email text not null check (position('@' in email) > 1),
  site_url text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
