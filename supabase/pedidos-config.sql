-- Pedidos feitos pelo site + configurações da loja (logo, cor, foto de destaque...)
-- Rode no Supabase: Dashboard > SQL Editor > New query (depois do schema.sql)
-- Pode rodar mais de uma vez.

-- Atualiza a coluna atualizado_em sempre que a linha muda
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- =========================================================
-- CONFIG: uma linha só (id = 1) com a aparência e os contatos da loja
-- =========================================================

create table if not exists public.config (
  id int primary key default 1 check (id = 1),
  nome text not null default 'Sushimania' check (char_length(nome) between 1 and 60),
  cor text not null default '#e63946' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  logo_url text,
  destaque_url text,
  whatsapp text,
  telefone text,
  instagram text,
  facebook text,
  atualizado_em timestamptz not null default now()
);

-- Frase do topo do site (ao lado da foto de destaque)
alter table public.config add column if not exists banner_titulo text check (char_length(banner_titulo) <= 80);
alter table public.config add column if not exists banner_destaque text check (char_length(banner_destaque) <= 40);
alter table public.config add column if not exists banner_texto text check (char_length(banner_texto) <= 300);

insert into public.config (id) values (1) on conflict (id) do nothing;

alter table public.config enable row level security;

drop policy if exists "Publico le config" on public.config;
create policy "Publico le config" on public.config
  for select to anon, authenticated using (true);

drop policy if exists "Admin edita config" on public.config;
create policy "Admin edita config" on public.config
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists config_atualizado_em on public.config;
create trigger config_atualizado_em
  before update on public.config
  for each row execute function public.tocar_atualizado_em();

-- =========================================================
-- PEDIDOS: gravados quando o cliente clica em "Enviar pedido"
-- =========================================================

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[A-Z0-9]{6}$'),
  cliente_nome text not null check (char_length(cliente_nome) between 1 and 120),
  pagamento text not null check (char_length(pagamento) <= 40),
  troco text check (char_length(troco) <= 40),
  endereco text not null check (char_length(endereco) <= 400),
  bairro text not null check (char_length(bairro) <= 120),
  itens jsonb not null check (jsonb_typeof(itens) = 'array' and jsonb_array_length(itens) between 1 and 100),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  taxa_entrega numeric(10,2) check (taxa_entrega >= 0), -- null = a combinar
  total numeric(10,2) not null check (total >= 0),
  status text not null default 'novo'
    check (status in ('novo', 'preparando', 'saiu', 'entregue', 'cancelado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists pedidos_criado_em_idx on public.pedidos (criado_em desc);

alter table public.pedidos enable row level security;

-- Visitante só pode REGISTRAR pedido novo (não lê, não edita, não apaga)
drop policy if exists "Visitante registra pedido" on public.pedidos;
create policy "Visitante registra pedido" on public.pedidos
  for insert to anon, authenticated with check (status = 'novo');

drop policy if exists "Admin gerencia pedidos" on public.pedidos;
create policy "Admin gerencia pedidos" on public.pedidos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant insert on public.pedidos to anon, authenticated;
grant select, update, delete on public.pedidos to authenticated;

drop trigger if exists pedidos_atualizado_em on public.pedidos;
create trigger pedidos_atualizado_em
  before update on public.pedidos
  for each row execute function public.tocar_atualizado_em();
