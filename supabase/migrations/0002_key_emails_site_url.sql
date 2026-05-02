-- Store optional operator site URLs alongside generated key contact emails.
create extension if not exists pgcrypto;

alter table public.key_emails
  add column if not exists id uuid;

update public.key_emails
set id = gen_random_uuid()
where id is null;

alter table public.key_emails
  alter column id set default gen_random_uuid(),
  alter column id set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.key_emails'::regclass
      and contype = 'p'
      and conname = 'key_emails_pkey'
  ) then
    alter table public.key_emails drop constraint key_emails_pkey;
  end if;
end $$;

alter table public.key_emails
  add constraint key_emails_pkey primary key (id);

alter table public.key_emails
  alter column api_key drop not null,
  alter column email drop not null,
  add column if not exists site_url text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.key_emails'::regclass
      and conname = 'key_emails_api_key_key'
  ) then
    alter table public.key_emails
      add constraint key_emails_api_key_key unique (api_key);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.key_emails'::regclass
      and conname = 'key_emails_site_url_key'
  ) then
    alter table public.key_emails
      add constraint key_emails_site_url_key unique (site_url);
  end if;
end $$;
