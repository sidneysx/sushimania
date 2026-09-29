-- Endereço da loja (aparece no topo do site, ao lado da logo)
-- Rode no Supabase: Dashboard > SQL Editor > New query. Pode rodar mais de uma vez.

alter table public.config add column if not exists endereco text check (char_length(endereco) <= 150);

-- Valores iniciais (depois dá para mudar em Painel > Configurações)
update public.config
set endereco = coalesce(endereco, 'Rua Ceará, Bacuri, 1590'),
    nome = 'Sushi Mania'
where id = 1;

notify pgrst, 'reload schema';
