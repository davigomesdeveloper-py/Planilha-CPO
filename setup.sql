-- ==========================================================
-- COMO USAR
-- 1. No Supabase, abra seu projeto.
-- 2. No menu da esquerda, clique em "SQL Editor".
-- 3. Cole TUDO este arquivo e clique em "Run".
-- Faça isso uma única vez. Ele cria a tabela que o site usa.
-- ==========================================================

-- Tabela de convidados (uma linha por pessoa)
create table if not exists public.convidados (
  id            bigint generated always as identity primary key,  -- número único de cada pessoa
  nome_completo text    not null,                                  -- nome digitado no formulário
  pago          boolean not null default false,                    -- true = já pagou a pulseira
  criado_em     timestamptz not null default now()                 -- data/hora do cadastro
);

-- Liga a segurança por linha (o Supabase exige isso)
alter table public.convidados enable row level security;

-- Permite que o site (chave anon) leia, adicione, altere e remova.
-- ATENÇÃO: isso deixa a lista aberta para quem tiver o link do site.
-- Como são só nomes e status de pagamento, o risco é baixo,
-- mas não divulgue o link fora da organização.
create policy "site pode ler"      on public.convidados for select to anon using (true);
create policy "site pode adicionar" on public.convidados for insert to anon with check (true);
create policy "site pode alterar"  on public.convidados for update to anon using (true) with check (true);
create policy "site pode remover"  on public.convidados for delete to anon using (true);

-- Liga a atualização em tempo real: quando um aparelho muda algo,
-- os outros aparelhos abertos atualizam a lista sozinhos.
alter publication supabase_realtime add table public.convidados;
