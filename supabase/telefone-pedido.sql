-- Celular do cliente no pedido (só números, com DDD), para a loja e o motoboy ligarem
-- Rode no SQL Editor do Supabase ANTES de publicar o site novo.

alter table public.pedidos add column if not exists cliente_telefone text
  check (cliente_telefone ~ '^\d{10,11}$');

notify pgrst, 'reload schema';
