-- Towigo · conexión con Dexcom (API oficial)
-- Proyecto Supabase en región UE (Fráncfort o Irlanda). Datos de salud: RGPD art. 9.

-- Estados OAuth pendientes (anti-CSRF). Caducan a los 15 minutos.
create table if not exists public.oauth_states (
  nonce text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  return_to text not null,
  created_at timestamptz not null default now()
);

-- Tokens de Dexcom de cada usuario. Solo los leen las funciones del servidor (service role).
create table if not exists public.dexcom_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- Registro de accesos (RGPD: quién accede a qué y cuándo).
create table if not exists public.audit_log (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- RLS activado y sin políticas: nadie puede leer estas tablas desde la app.
-- Solo las Edge Functions (con la service role key) acceden a ellas.
alter table public.oauth_states enable row level security;
alter table public.dexcom_tokens enable row level security;
alter table public.audit_log enable row level security;
