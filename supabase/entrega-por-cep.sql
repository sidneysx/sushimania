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

-- CEP digitado pelo cliente e um aviso para o painel ("conferir endereço")
alter table public.pedidos add column if not exists cep text check (char_length(cep) <= 9);
alter table public.pedidos add column if not exists aviso text;

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
  bai record;
  cep_num text := regexp_replace(coalesce(new.cep, ''), '\D', '', 'g');
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

  select b.taxa, b.ativo, b.cep_inicial, b.cep_final into bai
  from public.bairros b
  where b.nome = new.bairro;

  if found and bai.ativo and bai.taxa > 0 then
    taxa_bairro := bai.taxa;
  end if;

  -- Aviso para o painel (o cliente não vê): situações em que vale conferir o endereço
  new.aviso := case
    when not found then 'Bairro fora da lista'
    when bai.cep_inicial is null then 'Bairro sem CEP próprio: conferir endereço'
    when cep_num !~ '^\d{8}$' then 'Pedido sem CEP'
    when cep_num not between replace(bai.cep_inicial, '-', '') and replace(bai.cep_final, '-', '')
      then 'CEP fora da faixa do bairro: conferir endereço'
    else null
  end;

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
