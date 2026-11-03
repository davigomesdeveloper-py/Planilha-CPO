/* ==========================================================
   CONFIGURAÇÃO - É AQUI QUE VOCÊ COLOCA AS CHAVES DO SUPABASE

   Onde achar no site do Supabase:
   Seu projeto > Project Settings (engrenagem) > API
     - "Project URL"  -> cole em SUPABASE_URL
     - "anon public"  -> cole em SUPABASE_CHAVE
   Use a chave "anon public". NUNCA use a "service_role" aqui,
   porque este arquivo fica visível para quem abrir o site.
   ========================================================== */

// Endereço do seu projeto no Supabase (algo como https://xxxx.supabase.co)
const SUPABASE_URL = "https://xqefekiqvqsfakqvqcnf.supabase.co";

// Chave pública (anon public) do seu projeto
const SUPABASE_CHAVE = "sb_publishable_8TT63eHqO2MzTwolaED4qA_1bw9s6NT";

// Nome do evento, que aparece como título do site
const EVENTO_NOME = "Lista de pulseiras";

// Nome da tabela criada no Supabase (veja supabase/setup.sql)
const TABELA = "convidados";
