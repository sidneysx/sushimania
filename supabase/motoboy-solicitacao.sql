-- Cadastro do motoboy pelo próprio motoboy: ele se cadastra em /entregador e fica PENDENTE;
-- a loja vê a solicitação em Painel > Motoboys e clica em "Autorizar".
-- Rode no Supabase: Dashboard > SQL Editor > New query (depois do motoboy-fixo.sql).
-- Pode rodar mais de uma vez.
--
-- Situação do motoboy:
--   pendente  = ativo false e aprovado_em vazio (acabou de se cadastrar)
--   ativo     = ativo true (recebe pedidos)
--   bloqueado = ativo false e aprovado_em preenchido (a loja tirou o acesso)

alter table public.motoboys add column if not exists aprovado_em timestamptz;
alter table public.motoboys alter column ativo set default false;

-- Quem já estava cadastrado pela loja conta como aprovado
update public.motoboys set aprovado_em = criado_em where aprovado_em is null and ativo;

-- Conta de entregador é SEPARADA da conta de cliente: o e-mail interno do motoboy é
-- <celular>@motoboy.sushimania.app (o do cliente é <celular>@cliente.sushimania.app).
-- Cadastros antigos ligados a conta de cliente não conseguem mais entrar: saem da lista
-- e o motoboy se cadastra de novo em /entregador.
delete from public.motoboys m
 using auth.users u
 where u.id = m.user_id
   and u.email not like '%@motoboy.sushimania.app';

-- O motoboy cria a própria solicitação: sempre pendente, nunca fixo, e só com conta
-- de entregador cujo celular é o mesmo informado
drop policy if exists "Motoboy solicita acesso" on public.motoboys;
create policy "Motoboy solicita acesso" on public.motoboys
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and not ativo
    and not fixo
    and aprovado_em is null
    and telefone || '@motoboy.sushimania.app' = (auth.jwt() ->> 'email')
  );

-- A loja não cadastra mais pelo celular: o motoboy se cadastra sozinho
drop function if exists public.adicionar_motoboy(text, text);

notify pgrst, 'reload schema';
