-- Motoboy fixo: todo pedido novo do site já vai direto para ele (sem escolher no painel).
-- Rode no Supabase: Dashboard > SQL Editor > New query (depois do motoboys.sql).
-- Pode rodar mais de uma vez.

alter table public.motoboys add column if not exists fixo boolean not null default false;

-- No máximo um motoboy fixo
create unique index if not exists motoboys_um_fixo on public.motoboys (fixo) where fixo;

-- A loja escolhe o fixo (null = nenhum)
create or replace function public.definir_motoboy_fixo(p_motoboy uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Sem permissão';
  end if;
  update public.motoboys set fixo = false where fixo and user_id is distinct from p_motoboy;
  if p_motoboy is not null then
    update public.motoboys set fixo = true where user_id = p_motoboy;
  end if;
end;
$$;

grant execute on function public.definir_motoboy_fixo(uuid) to authenticated;

-- Pedido feito no site: vai para o motoboy fixo (se ele estiver ativo); senão fica sem motoboy
create or replace function public.pedido_sem_motoboy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    new.motoboy_id := (select user_id from public.motoboys where fixo and ativo limit 1);
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
