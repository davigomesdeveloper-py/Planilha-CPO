/* ==========================================================
   GUIA DO ARQUIVO
   1. Conexão com o Supabase
   2. Pegando os elementos da página
   3. Estado (os dados que o site guarda enquanto está aberto)
   4. Funções que falam com o banco (carregar, adicionar, alterar, remover)
   5. Funções que desenham a tela (tabela e resumo)
   6. Eventos (cliques, digitação, envio do formulário)
   7. Início do site
   ========================================================== */


/* ---------- 1. CONEXÃO COM O SUPABASE ---------- */

// "supabase" vem da biblioteca carregada no index.html.
// "banco" é a nossa conexão; todas as chamadas ao banco passam por ela.
let banco = null;

// Só conecta se as chaves do config.js já foram preenchidas
const configuracaoPreenchida =
  SUPABASE_URL.startsWith("https://") && 
  SUPABASE_CHAVE.startsWith("sb_publishable_");

if (configuracaoPreenchida) {
  banco = supabase.createClient(
    SUPABASE_URL, 
    SUPABASE_CHAVE
  );
}


/* ---------- 2. ELEMENTOS DA PÁGINA ---------- */

const tituloEvento = document.getElementById("titulo-evento");
const formulario = document.getElementById("form-convidado");
const campoNome = document.getElementById("campo-nome");
const campoPagamento = document.getElementById("campo-pagamento");
const campoCamiseta = document.getElementById("campo-camisa");
const campoTamanho = document.getElementById("campo-tamanho")
const campoBusca = document.getElementById("campo-busca");
const botoesFiltro = document.querySelectorAll(".filtro");
const corpoTabela = document.getElementById("corpo-tabela");
const mensagemVazia = document.getElementById("mensagem-vazia");
const aviso = document.getElementById("aviso");
const totalPessoas = document.getElementById("total-pessoas");
const totalPagos = document.getElementById("total-pagos");
const totalPendentes = document.getElementById("total-pendentes");


/* ---------- 3. ESTADO ---------- */

// Lista completa que veio do banco. Cada item tem:
// { id, nome_completo, pago (true/false), criado_em }
let convidados = [];

// Filtro atual: "todos", "pagos" ou "pendentes"
let filtroAtual = "todos";


/* ---------- 4. FUNÇÕES QUE FALAM COM O BANCO ---------- */

// Busca todas as pessoas no banco, em ordem alfabética
async function carregarConvidados() {
  const { data, error } = await banco
    .from(TABELA)
    .select("*")
    .order("nome_completo", { ascending: true });

  if (error) {
    mostrarAviso("Não foi possível carregar a lista. Confira as chaves e a tabela.", true);
    console.error(error);
    return;
  }

  convidados = data;
  desenharTabela();
}

// Adiciona uma pessoa nova
async function adicionarConvidado(nome, pago, comprouCamisa, tamanho) {
  const { error } = await banco
    .from(TABELA)
    .insert({ nome_completo: nome, 
      pago: pago, 
      comprou_camisa: comprouCamisa, 
      tamanho_camisa: tamanho
    });

  if (error) {
    mostrarAviso("Não foi possível adicionar. Tente de novo.", true);
    console.error(error);
    return false;
  }

  return true;
}

// Troca o pagamento de uma pessoa (pendente -> pago ou pago -> pendente)
async function alterarPagamento(id, novoValor) {
  const { error } = await banco
    .from(TABELA)
    .update({ pago: novoValor })
    .eq("id", id);

  if (error) {
    mostrarAviso("Não foi possível atualizar o pagamento.", true);
    console.error(error);
    return;
  }

  await carregarConvidados();
}
// Remove uma pessoa da lista (pede confirmação antes)
async function removerConvidado(id, nome) {
  const confirmou = confirm("Remover " + nome + " da lista?");
  if (!confirmou) return;

  const { error } = await banco
    .from(TABELA)
    .delete()
    .eq("id", id);

  if (error) {
    mostrarAviso("Não foi possível remover.", true);
    console.error(error);
    return;
  }

  await carregarConvidados();
}

// Deixa a lista atualizada sozinha quando OUTRO aparelho muda algo.
// Precisa do "realtime" ligado na tabela (veja supabase/setup.sql).
function ouvirMudancas() {
  banco
    .channel("mudancas-convidados")
    .on("postgres_changes", { event: "*", schema: "public", table: TABELA }, carregarConvidados)
    .subscribe();
}


/* ---------- 5. FUNÇÕES QUE DESENHAM A TELA ---------- */

// Mostra uma mensagem embaixo do formulário
function mostrarAviso(texto, ehErro) {
  aviso.textContent = texto;
  aviso.classList.toggle("aviso--erro", Boolean(ehErro));
}

// Aplica busca + filtro e devolve só as pessoas que devem aparecer
function convidadosVisiveis() {
  const termo = campoBusca.value.trim().toLowerCase();

  return convidados.filter(function (pessoa) {
    const combinaNome = pessoa.nome_completo.toLowerCase().includes(termo);
    const combinaFiltro =
      filtroAtual === "todos" ||
      (filtroAtual === "pagos" && pessoa.pago) ||
      (filtroAtual === "pendentes" && !pessoa.pago);

    return combinaNome && combinaFiltro;
  });
}

// Cria uma linha da tabela para uma pessoa
function criarLinha(pessoa, posicao) {
  const linha = document.createElement("tr");

  // Coluna Nº
  const colNumero = document.createElement("td");
  colNumero.className = "col-numero";
  colNumero.textContent = posicao;

  // Coluna Nome (textContent evita que um nome com código quebre o site)
  const colNome = document.createElement("td");
  colNome.textContent = pessoa.nome_completo;

  // Coluna Pagamento (etiqueta colorida)
  const colStatus = document.createElement("td");
  const etiqueta = document.createElement("span");
  etiqueta.className = "etiqueta " + (pessoa.pago ? "etiqueta--pago" : "etiqueta--pendente");
  etiqueta.textContent = pessoa.pago ? "Pago" : "Pendente";
  colStatus.appendChild(etiqueta);

  const colCamisa = document.createElement("td");
  const etiquetaCamisa = document.createElement("span");
  etiquetaCamisa.className = "etiqueta "+ (pessoa.comprou_camisa ? "etiqueta--pago" : "etiqueta--neutra");
  etiquetaCamisa.textContent = pessoa.comprou_camisa ? "Comprou" : "Não comprou";
  colCamisa.appendChild(etiquetaCamisa);

  const colTamanho = document.createElement("td");
  colTamanho.textContent = pessoa.tamanho_camisa || "-";

  // Coluna Ações (botão de pagamento + botão de remover)
  const colAcoes = document.createElement("td");
  const acoes = document.createElement("div");
  acoes.className = "acoes";

  const botaoPagamento = document.createElement("button");
  botaoPagamento.type = "button";
  botaoPagamento.className = "acao";
  botaoPagamento.textContent = pessoa.pago ? "Marcar como pendente" : "Marcar como pago";
  botaoPagamento.addEventListener("click", function () {
    alterarPagamento(pessoa.id, !pessoa.pago);
  });

  const botaoRemover = document.createElement("button");
  botaoRemover.type = "button";
  botaoRemover.className = "acao acao--remover";
  botaoRemover.textContent = "Remover";
  botaoRemover.addEventListener("click", function () {
    removerConvidado(pessoa.id, pessoa.nome_completo);
  });

  acoes.appendChild(botaoPagamento);
  acoes.appendChild(botaoRemover);
  colAcoes.appendChild(acoes);

  linha.append(colNumero, colNome, colStatus, colCamisa, colTamanho, colAcoes);
  return linha;
}

// Redesenha a tabela inteira e atualiza os números do resumo
function desenharTabela() {
  const lista = convidadosVisiveis();

  corpoTabela.replaceChildren();
  lista.forEach(function (pessoa, indice) {
    corpoTabela.appendChild(criarLinha(pessoa, indice + 1));
  });

  mensagemVazia.hidden = lista.length > 0;

  // Resumo usa a lista COMPLETA, não a filtrada
  const pagos = convidados.filter(function (pessoa) {
    return pessoa.pago;
  }).length;

  totalPessoas.textContent = convidados.length;
  totalPagos.textContent = pagos;
  totalPendentes.textContent = convidados.length - pagos;
}


/* ---------- 6. EVENTOS ---------- */

// Envio do formulário: adiciona a pessoa
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault(); // impede a página de recarregar

  if (!banco) {
    mostrarAviso("Preencha as chaves do Supabase no arquivo js/config.js.", true);
    return;
  }

  const nome = campoNome.value.trim();
  const pago = campoPagamento.value === "true";
  const comprouCamisa = campoCamiseta.value === "true";
  const tamanho = comprouCamisa ? campoTamanho.value : null;
  const botao = formulario.querySelector("button[type='submit']");

  if (nome === "") {
    mostrarAviso("Digite o nome completo.", true);
    return;
  }

  if (comprouCamisa && tamanho === "") {
    mostrarAviso("Escolha o tamanho da camisa.", true);
    return;
  }

  botao.disabled = true;
  const deuCerto = await adicionarConvidado(nome, pago, comprouCamisa, tamanho);
  botao.disabled = false;

  if (deuCerto) {
    mostrarAviso(nome + " foi adicionado(a).", false);
    formulario.reset();
    atualizarCampoTamanho();
    campoNome.focus();
    await carregarConvidados();
  }
});

// Digitar na busca atualiza a tabela na hora
campoBusca.addEventListener("input", desenharTabela);

function atualizarCampoTamanho() {
  const comprou = campoCamiseta.value === "true";
  campoTamanho.disabled = !comprou;

  if (!comprou) {
    campoTamanho.value = "";
  }
}

campoCamiseta.addEventListener("change", atualizarCampoTamanho);

// Clique nos botões de filtro
botoesFiltro.forEach(function (botao) {
  botao.addEventListener("click", function () {
    filtroAtual = botao.dataset.filtro;

    botoesFiltro.forEach(function (outro) {
      const ativo = outro === botao;
      outro.classList.toggle("filtro--ativo", ativo);
      outro.setAttribute("aria-pressed", ativo);
    });

    desenharTabela();
  });
});


/* ---------- 7. INÍCIO DO SITE ---------- */

tituloEvento.textContent = EVENTO_NOME;
document.title = EVENTO_NOME;

if (banco) {
  carregarConvidados();
  ouvirMudancas();
} else {
  // Ainda sem chaves: o site abre, mas avisa o que falta
  mostrarAviso("Falta preencher as chaves do Supabase no arquivo js/config.js.", true);
  desenharTabela();
}
