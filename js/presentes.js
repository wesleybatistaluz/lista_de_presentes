const IMG_BASE = "assets/img/presentes/";
const TABLE = "presentes_dados";

const money = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CATEGORIAS = {
  cozinha: "Cozinha",
  utensilios: "Utensílios",
  sala: "Sala",
  lavanderia: "Lavanderia",
  quarto: "Quarto",
  banheiro: "Banheiro",
};

const LOCAL_KEY = "presentesClaimedLocal";

let supabaseClient = null;
let claimedIds = new Set();

function supabaseConfigured() {
  return (
    window.SUPABASE_URL &&
    window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.startsWith("COLE_AQUI") &&
    !window.SUPABASE_ANON_KEY.startsWith("COLE_AQUI")
  );
}

function loadLocalClaims() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveLocalClaims() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify([...claimedIds]));
}

async function initSupabase() {
  if (!supabaseConfigured()) {
    document.getElementById("db-warning").style.display = "flex";
    // Sem Supabase configurado, guarda a marcação só neste navegador (não é
    // compartilhado com outros convidados, mas sobrevive a um recarregamento).
    claimedIds = loadLocalClaims();
    return;
  }

  // Qualquer falha aqui (chave errada, projeto fora do ar, sem internet) não
  // pode impedir a lista de presentes de aparecer — por isso o try/catch.
  try {
    supabaseClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );
    const { data, error } = await supabaseClient
      .from(TABLE)
      .select("id")
      .eq("claimed", true);
    if (error) throw new Error(error.message);
    claimedIds = new Set((data || []).map((r) => r.id));
  } catch (e) {
    console.error("Supabase indisponível, seguindo sem sincronizar:", e);
    supabaseClient = null;
    document.getElementById("db-warning").style.display = "flex";
    claimedIds = loadLocalClaims();
  }
}

async function marcarComoDado(id, card) {
  const ok = window.confirm(
    "Confirma que você já garantiu esse presente? Ele vai sair da lista para os outros convidados."
  );
  if (!ok) return;

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from(TABLE)
      .upsert({ id, claimed: true });
    if (error) {
      alert(
        "Não consegui salvar agora (verifique sua conexão) — tente novamente em alguns segundos."
      );
      return;
    }
  }
  claimedIds.add(id);
  if (!supabaseClient) saveLocalClaims();
  card.classList.add("is-claimed");
}

async function desmarcarPresente(id, card) {
  const ok = window.confirm(
    "Desmarcar este presente? Ele volta a aparecer disponível para outros convidados — use isso só se marcou por engano."
  );
  if (!ok) return;

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from(TABLE)
      .upsert({ id, claimed: false });
    if (error) {
      alert(
        "Não consegui atualizar agora (verifique sua conexão) — tente novamente em alguns segundos."
      );
      return;
    }
  }
  claimedIds.delete(id);
  if (!supabaseClient) saveLocalClaims();
  card.classList.remove("is-claimed");
}

function buyLink(item) {
  if (item.link) return item.link;
  return `https://lista.mercadolivre.com.br/${encodeURIComponent(item.nome)}`;
}

function renderCard(item) {
  const isClaimed = item.unique && claimedIds.has(item.id);
  const card = document.createElement("article");
  card.className = "gift-card" + (isClaimed ? " is-claimed" : "");
  card.dataset.categoria = item.categoria;
  card.dataset.id = item.id;

  card.innerHTML = `
    <span class="badge badge--${item.categoria}">${CATEGORIAS[item.categoria] || item.categoria}</span>
    ${item.destaque ? '<span class="star-tag" title="Presente especial">✦</span>' : ""}
    <div class="claimed-overlay">
      💙 Este presente já<br>foi escolhido com carinho
      <button class="btn-desmarcar" type="button">Marcou por engano? Desfazer</button>
    </div>
    <div class="gift-card-img">
      <img src="${IMG_BASE}${item.img}" alt="${item.nome}" loading="lazy">
    </div>
    <div class="gift-card-body">
      <h3 class="gift-card-name">${item.nome}</h3>
      <span class="gift-card-price">${money(item.preco)}</span>
      ${!item.link ? '<span class="link-pending">link pendente de cadastro</span>' : ""}
      <div class="gift-card-actions">
        <a class="btn btn--primary btn--sm" href="${buyLink(item)}" target="_blank" rel="noopener">
          Comprar no Mercado Livre ↗
        </a>
        ${
          item.unique
            ? `<button class="btn btn--outline btn--sm btn-marcar">Já dei este presente</button>`
            : `<span class="claim-note">💕 Este presente pode ser dado por mais de uma pessoa</span>`
        }
      </div>
    </div>
  `;

  const btnMarcar = card.querySelector(".btn-marcar");
  if (btnMarcar) {
    btnMarcar.addEventListener("click", () => marcarComoDado(item.id, card));
  }

  const btnDesmarcar = card.querySelector(".btn-desmarcar");
  if (btnDesmarcar) {
    btnDesmarcar.addEventListener("click", () => desmarcarPresente(item.id, card));
  }

  return card;
}

let filtroAtual = "todos";

function renderGrid(filter = filtroAtual) {
  filtroAtual = filter;
  const grid = document.getElementById("gift-grid");
  grid.innerHTML = "";
  const items = PRESENTES.filter(
    (i) => filter === "todos" || (filter === "especiais" ? i.destaque : i.categoria === filter)
  );
  if (!items.length) {
    document.getElementById("empty-state").style.display = "block";
  } else {
    document.getElementById("empty-state").style.display = "none";
  }
  items.forEach((item) => grid.appendChild(renderCard(item)));
}

function setupFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      renderGrid(btn.dataset.filter);
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Desenha a lista na hora, sem esperar o banco. Assim, mesmo que o Supabase
  // esteja lento ou fora do ar, os convidados já veem os presentes e os links.
  setupFilters();
  renderGrid("todos");

  // Depois, quando as marcações chegarem, redesenha para exibir quais
  // presentes já foram dados.
  await initSupabase();
  renderGrid();
});
