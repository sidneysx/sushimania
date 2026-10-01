-- Horário de funcionamento da loja (Painel > Configurações > Horário de funcionamento)
-- Rode no Supabase: Dashboard > SQL Editor > New query. Pode rodar mais de uma vez.
-- Lista com os 7 dias, começando no domingo: { "aberto": true, "abre": "18:30", "fecha": "23:00" }.
-- Fora do horário o site mostra o cardápio, mas não deixa enviar o pedido.

alter table public.config add column if not exists horarios jsonb
  check (jsonb_typeof(horarios) = 'array' and jsonb_array_length(horarios) = 7);

-- Valor inicial: terça a domingo, 18:30 às 23:00 (segunda fechado)
update public.config
set horarios = '[
  {"aberto": true,  "abre": "18:30", "fecha": "23:00"},
  {"aberto": false, "abre": "18:30", "fecha": "23:00"},
  {"aberto": true,  "abre": "18:30", "fecha": "23:00"},
  {"aberto": true,  "abre": "18:30", "fecha": "23:00"},
  {"aberto": true,  "abre": "18:30", "fecha": "23:00"},
  {"aberto": true,  "abre": "18:30", "fecha": "23:00"},
  {"aberto": true,  "abre": "18:30", "fecha": "23:00"}
]'::jsonb
where id = 1 and horarios is null;

notify pgrst, 'reload schema';
