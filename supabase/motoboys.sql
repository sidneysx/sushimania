-- Motoboys da casa: login próprio em /entregador, veem SÓ os pedidos atribuídos a eles.
-- Rode no Supabase: Dashboard > SQL Editor > New query (depois do telefone-pedido.sql).
-- Pode rodar mais de uma vez.
--
-- Como funciona:
--   1. O motoboy abre /entregador e cria a senha com o celular dele ("Primeiro acesso").
--   2. A loja cadastra esse celular em Painel > Motoboys (função adicionar_motoboy).
--   3. No painel, a loja atribui o pedido ao motoboy; ele vê o pedido completo e a taxa.
--
-- Segurança: motoboy NÃO é admin. Não lê outros pedidos, não altera cardápio nem config.
-- Só pode marcar os próprios pedidos como "saiu" ou "entregue" (função motoboy_status).

-- =========================================================
-- 1. Cadastro dos motoboys
-- =========================================================
create table if not exists public.motoboys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  telefone text not null unique check (telefone ~ '^\d{10,11}$'),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.motoboys enable row level security;

drop policy if exists "Admin gerencia motoboys" on public.motoboys;
create policy "Admin gerencia motoboys" on public.motoboys
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Motoboy le seus dados" on public.motoboys;
create policy "Motoboy le seus dados" on public.motoboys
  for select to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.motoboys to authenticated;

-- O usuário logado é motoboy ativo?
create or replace function public.is_motoboy()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.motoboys where user_id = auth.uid() and ativo);
$$;

grant execute on function public.is_motoboy() to authenticated;

-- A loja cadastra pelo celular: acha a conta que o motoboy criou em /entregador
-- (o celular vira o e-mail interno <celular>@cliente.sushimania.app, igual à conta do cliente)
create or replace function public.adicionar_motoboy(p_nome text, p_telefone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  if not public.is_admin() then
    raise exception 'Sem permissão';
  end if;

  select id into uid from auth.users where email = p_telefone || '@cliente.sushimania.app';
  if uid is null then
    raise exception 'Esse celular ainda não criou acesso. Peça ao motoboy para abrir /entregador e tocar em "Primeiro acesso".';
  end if;

  insert into public.motoboys (user_id, nome, telefone)
  values (uid, trim(p_nome), p_telefone)
  on conflict (user_id) do update set nome = excluded.nome, ativo = true;
end;
$$;

grant execute on function public.adicionar_motoboy(text, text) to authenticated;

-- =========================================================
-- 2. Pedido atribuído a um motoboy da casa
-- =========================================================
alter table public.pedidos add column if not exists motoboy_id uuid references public.motoboys (user_id) on delete set null;
create index if not exists pedidos_motoboy_idx on public.pedidos (motoboy_id, criado_em desc);

-- Quem faz o pedido no site não escolhe motoboy
create or replace function public.pedido_sem_motoboy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    new.motoboy_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_sem_motoboy on public.pedidos;
create trigger pedidos_sem_motoboy
  before insert on public.pedidos
  for each row execute function public.pedido_sem_motoboy();

-- Motoboy lê só os pedidos dele (o Realtime segue a mesma regra)
drop policy if exists "Motoboy le seus pedidos" on public.pedidos;
create policy "Motoboy le seus pedidos" on public.pedidos
  for select to authenticated using (motoboy_id = auth.uid() and public.is_motoboy());

-- Motoboy só muda o status dos pedidos dele, e só para "saiu" ou "entregue"
create or replace function public.motoboy_status(p_pedido uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_motoboy() then
    raise exception 'Sem permissão';
  end if;
  if p_status not in ('saiu', 'entregue') then
    raise exception 'Status não permitido';
  end if;

  update public.pedidos
     set status = p_status
   where id = p_pedido
     and motoboy_id = auth.uid()
     and status not in ('cancelado', 'entregue');

  if not found then
    raise exception 'Pedido não encontrado ou já finalizado';
  end if;
end;
$$;

grant execute on function public.motoboy_status(uuid, text) to authenticated;

notify pgrst, 'reload schema';
