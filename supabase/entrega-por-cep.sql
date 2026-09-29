-- Bairro pelo CEP + proteção contra pedido com valor adulterado
-- Rode no Supabase: Dashboard > SQL Editor > New query
-- (depois do pedidos-config.sql e do bairros-imperatriz.sql). Pode rodar mais de uma vez.

-- =========================================================
-- 1. O site precisa ver TODOS os bairros (inclusive os não atendidos)
--    para saber, pelo CEP, se o cliente está fora da área de entrega.
--    Não há dado sensível: só nome, taxa e faixa de CEP.
-- =========================================================

drop policy if exists "Publico le bairros ativos" on public.bairros;
drop policy if exists "Publico le bairros" on public.bairros;
create policy "Publico le bairros" on public.bairros
  for select to anon, authenticated using (true);

-- =========================================================
-- 2. Ao gravar um pedido, o banco ignora os valores enviados pelo navegador
--    e recalcula tudo com os preços e taxas cadastrados:
--    - preço e nome de cada item vêm da tabela produtos
--    - taxa de entrega vem da tabela bairros (bairro atendido com o mesmo nome)
--      bairro não atendido/desconhecido -> taxa null ("a combinar")
--    - subtotal e total são somados aqui
-- =========================================================

create or replace function public.validar_pedido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  qtd int;
  prod record;
  novos_itens jsonb := '[]'::jsonb;
  soma numeric(10,2) := 0;
  taxa_bairro numeric(10,2);
begin
  for item in select * from jsonb_array_elements(new.itens) loop
    qtd := (item ->> 'qtd')::int;
    if qtd is null or qtd < 1 or qtd > 99 then
      raise exception 'Quantidade inválida no pedido';
    end if;

    select p.id, p.nome, p.preco, p.imagem_url into prod
    from public.produtos p
    where p.id = (item ->> 'id')::bigint;

    if not found then
      raise exception 'Produto não encontrado: %', item ->> 'nome';
    end if;

    soma := soma + prod.preco * qtd;
    novos_itens := novos_itens || jsonb_build_object(
      'id', prod.id,
      'nome', prod.nome,
      'qtd', qtd,
      'preco', prod.preco,
      'imagem_url', prod.imagem_url
    );
  end loop;

  select b.taxa into taxa_bairro
  from public.bairros b
  where b.nome = new.bairro and b.ativo and b.taxa > 0;

  new.itens := novos_itens;
  new.subtotal := soma;
  new.taxa_entrega := taxa_bairro; -- null se não achou
  new.total := soma + coalesce(taxa_bairro, 0);
  return new;
end;
$$;

drop trigger if exists pedidos_validar on public.pedidos;
create trigger pedidos_validar
  before insert on public.pedidos
  for each row execute function public.validar_pedido();
