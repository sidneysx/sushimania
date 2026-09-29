-- Liga o "tempo real" da tabela pedidos: o painel recebe pedidos novos sem recarregar a página.
-- Rode no Supabase: Dashboard > SQL Editor > New query. Pode rodar mais de uma vez.
--
-- A segurança continua a mesma: o Realtime respeita as regras (RLS) da tabela,
-- então só o admin logado recebe os pedidos; visitantes não recebem nada.

do $$
begin
  alter publication supabase_realtime add table public.pedidos;
exception
  when duplicate_object then null; -- já estava ligado
end;
$$;
