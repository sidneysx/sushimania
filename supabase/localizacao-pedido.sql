-- Localização do GPS do cliente no pedido (botão "Usar minha localização")
-- Rode no Supabase: Dashboard > SQL Editor > New query. Pode rodar mais de uma vez.
-- Formato "latitude,longitude" (ex.: -5.526891,-47.491577); o painel mostra o link do Google Maps.

alter table public.pedidos add column if not exists localizacao text
  check (localizacao ~ '^-?\d{1,2}\.\d{1,8},-?\d{1,3}\.\d{1,8}$');

notify pgrst, 'reload schema';
