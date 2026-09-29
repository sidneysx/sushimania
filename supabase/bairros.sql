-- Taxas de entrega por bairro
-- Rode no Supabase: Dashboard > SQL Editor > New query
-- Pode rodar antes ou depois do schema.sql, e mais de uma vez.

-- Garante a tabela de admins e a função is_admin (também criadas no schema.sql)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create table if not exists public.bairros (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  taxa numeric(10,2) not null check (taxa >= 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.bairros enable row level security;

drop policy if exists "Publico le bairros ativos" on public.bairros;
create policy "Publico le bairros ativos" on public.bairros
  for select to anon, authenticated using (ativo = true);

drop policy if exists "Admin gerencia bairros" on public.bairros;
create policy "Admin gerencia bairros" on public.bairros
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.bairros (nome, taxa) values
  ('BACURI', 7),
  ('CENTRO', 7),
  ('BEIRA RIO', 8),
  ('NOVA IMPERATRIZ', 8),
  ('JARDIM SÃO LUIS', 8),
  ('TRÊS PODERES', 8),
  ('MARANHÃO NOVO', 8),
  ('PARQUE DO BURITI', 8),
  ('PARQUE ANHANGUERA', 8),
  ('VILA LOBÃO', 10),
  ('VILINHA', 10),
  ('JARDIM ORIENTAL', 10),
  ('VILA NOVA', 10),
  ('VILA PARATI', 12),
  ('PARQUE ALVORADA', 12),
  ('VILA REDENÇÃO', 12),
  ('SANTA INES', 12),
  ('BOCA DA MATA', 12),
  ('BOM SUCESSO', 12),
  ('SANTA RITA', 12),
  ('VILA VITORIA', 12),
  ('CONJUNTO VITORIA', 12),
  ('COLINAS PARK', 12),
  ('HABITAR BRASIL', 12),
  ('BAIRRO 5 IRMAOS', 12),
  ('NOVO HORIZONTE', 12),
  ('PARQUE TOCANTINS', 12),
  ('SANTA LÚCIA', 12),
  ('SÃO JOSE', 13),
  ('PARQUE SENHAROL', 13),
  ('PARQUE DAS ESTRELA', 13),
  ('PARQUE INDEPENCIA', 13),
  ('ITAMAR GUARA', 13),
  ('VILA FIQUENE', 13),
  ('VILA JARDIM', 13),
  ('SANTA LUZIA', 13),
  ('PLANALTO', 14),
  ('OURO VERDE', 14),
  ('IMIGRANTES', 14),
  ('MULTIRÃO', 14),
  ('CAFETEIRA', 14),
  ('VILA IPIRANGA', 14),
  ('VILA MACEDO', 14),
  ('JARDIM DAS OLIVEIRAS', 15),
  ('VILAGE DO BOSQUE 3', 15),
  ('SUMARE', 15),
  ('PARQUE SUMARE', 15),
  ('CIDADE NOVA', 16),
  ('BOM JESUS', 18),
  ('SEBASTIAO REGIS', 20)
on conflict (nome) do nothing;
