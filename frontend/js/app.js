/* FASHION STORE — front-end integrado à API Flask usando Fetch. */
const API = "/api";
const STORAGE_CUSTOMER = "fashionStoreCustomer";
const STORAGE_CART = "fashionStoreCart";

const state = {
  categories: [], products: [], sizes: [], colors: [], variations: [], stocks: [],
  customer: null, favorites: [], cart: [], categoryFilter: "all", search: "",
  editingProductId: null, selectedProductId: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function setFeedback(selector, message, isError = false) {
  const element = $(selector);
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", isError);
}

async function api(path, options = {}) {
  const config = { method: options.method || "GET", headers: { "Content-Type": "application/json" } };
  if (options.body !== undefined) config.body = JSON.stringify(options.body);
  const response = await fetch(`${API}${path}`, config);
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { mensagem: text }; }
  if (!response.ok) throw new Error(data.erro || data.erro_banco || data.mensagem || `Erro HTTP ${response.status}`);
  return data;
}

function categoryName(id) {
  return state.categories.find((category) => Number(category.id_categoria) === Number(id))?.nome || "Coleção";
}

function productImageMarkup(product, index = 0, large = false) {
  const image = state.productsImages?.[product.id_produto];
  const path = image || product.caminho_imagem || "";
  if (path) {
    const safePath = /^https?:\/\//i.test(path) ? path : `/${String(path).replace(/^\/+/, "")}`;
    return `<img class="product-image" src="${escapeHtml(safePath)}" alt="${escapeHtml(product.nome)}" onerror="this.remove()">`;
  }
  const tones = ["", "tone-1", "tone-2", "tone-3", "tone-4"];
  const letter = escapeHtml((product.nome || "F").trim().charAt(0).toUpperCase() || "F");
  return `<div class="product-visual ${tones[index % tones.length]} ${large ? "product-detail-art" : ""}"><span class="product-silhouette">${letter}</span></div>`;
}

function getProductVariants(productId) {
  return state.variations.filter((item) => Number(item.id_produto) === Number(productId));
}

function stockFor(variationId) {
  const record = state.stocks.find((item) => Number(item.id_variacao) === Number(variationId));
  return record ? Number(record.quantidade || 0) : 0;
}

async function loadStore() {
  const message = $("#api-message");
  try {
    const [status, categories, products, sizes, colors, variations, stocks, images] = await Promise.all([
      api("/status"), api("/categorias"), api("/produtos"), api("/tamanhos"), api("/cores"),
      api("/variacoes_produtos"), api("/estoque"), api("/imagens_produtos")
    ]);
    state.categories = categories;
    state.products = products;
    state.sizes = sizes;
    state.colors = colors;
    state.variations = variations;
    state.stocks = stocks;
    state.productsImages = {};
    images.forEach((image) => {
      if (image.imagem_principal || !state.productsImages[image.id_produto]) {
        state.productsImages[image.id_produto] = image.caminho_imagem;
      }
    });
    message.className = "api-message online";
    message.innerHTML = `<span class="status-dot"></span><span>Loja conectada à API Flask e ao banco MySQL.</span>`;
    renderCategories();
    renderProducts();
    renderAdminList();
    fillAdminSelects();
    await refreshFavorites();
  } catch (error) {
    message.className = "api-message offline";
    message.innerHTML = `<span class="status-dot"></span><span>${escapeHtml(error.message)}. Confira se o Flask e o MySQL estão iniciados.</span>`;
    $("#product-grid").innerHTML = "";
    $("#empty-catalog").classList.remove("hidden");
    $("#seed-demo-button").disabled = true;
    $("#seed-demo-button").textContent = "AGUARDANDO CONEXÃO COM A API";
    console.error(error);
  }
}

function renderCategories() {
  const tabs = $("#category-tabs");
  tabs.innerHTML = `<button class="category-tab ${state.categoryFilter === "all" ? "active" : ""}" data-category="all">Tudo</button>` +
    state.categories.map((category) => `<button class="category-tab ${state.categoryFilter === String(category.id_categoria) ? "active" : ""}" data-category="${Number(category.id_categoria)}">${escapeHtml(category.nome)}</button>`).join("");
  tabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    state.categoryFilter = button.dataset.category;
    renderCategories();
    renderProducts();
  }));
}

function renderProducts() {
  const grid = $("#product-grid");
  const search = state.search.trim().toLocaleLowerCase("pt-BR");
  const visible = state.products.filter((product) => {
    const active = product.ativo === undefined || product.ativo === null || Number(product.ativo) !== 0;
    const matchesCategory = state.categoryFilter === "all" || Number(product.id_categoria) === Number(state.categoryFilter);
    const matchesSearch = !search || `${product.nome} ${product.descricao || ""} ${categoryName(product.id_categoria)}`.toLocaleLowerCase("pt-BR").includes(search);
    return active && matchesCategory && matchesSearch;
  });
  $("#empty-catalog").classList.toggle("hidden", visible.length > 0);
  grid.classList.toggle("hidden", visible.length === 0);
  grid.innerHTML = visible.map((product, index) => {
    const isFavorite = state.favorites.some((favorite) => Number(favorite.id_produto) === Number(product.id_produto));
    const hasStock = getProductVariants(product.id_produto).some((variant) => stockFor(variant.id_variacao) > 0);
    const initial = (product.nome || "F").trim().charAt(0).toUpperCase();
    const path = state.productsImages?.[product.id_produto] || "";
    const imageHtml = path
      ? `<img class="product-image" src="${escapeHtml(/^https?:\/\//i.test(path) ? path : `/${path.replace(/^\/+/, "")}`)}" alt="${escapeHtml(product.nome)}" onerror="this.remove()">`
      : `<div class="product-silhouette">${escapeHtml(initial)}</div>`;
    return `<article class="product-card">
      <div class="product-visual tone-${index % 5}">
        ${imageHtml}<span class="product-badge">${escapeHtml(categoryName(product.id_categoria))}</span>
        <button class="favorite-button ${isFavorite ? "is-favorite" : ""}" data-favorite="${Number(product.id_produto)}" aria-label="${isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}">${isFavorite ? "♥" : "♡"}</button>
      </div>
      <div class="product-card-info"><span class="product-category">FASHION STORE / ${escapeHtml(categoryName(product.id_categoria))}</span>
        <h3>${escapeHtml(product.nome)}</h3><div class="product-card-bottom"><span class="product-price">${money(product.preco)}</span>
        <button class="product-view" data-open-product="${Number(product.id_produto)}">${hasStock ? "VER PEÇA ↗" : "DETALHES ↗"}</button></div></div>
    </article>`;
  }).join("");
  grid.querySelectorAll("[data-open-product]").forEach((button) => button.addEventListener("click", () => openProduct(Number(button.dataset.openProduct))));
  grid.querySelectorAll("[data-favorite]").forEach((button) => button.addEventListener("click", () => toggleFavorite(Number(button.dataset.favorite))));
}

function fillAdminSelects() {
  $("#product-category").innerHTML = `<option value="">Selecione</option>` + state.categories.map((item) => `<option value="${Number(item.id_categoria)}">${escapeHtml(item.nome)}</option>`).join("");
  $("#product-size").innerHTML = `<option value="">Sem tamanho</option>` + state.sizes.map((item) => `<option value="${Number(item.id_tamanho)}">${escapeHtml(item.nome)}</option>`).join("");
  $("#product-color").innerHTML = `<option value="">Sem cor</option>` + state.colors.map((item) => `<option value="${Number(item.id_cor)}">${escapeHtml(item.nome)}</option>`).join("");
}

function renderAdminList() {
  const body = $("#admin-product-list");
  if (!state.products.length) {
    body.innerHTML = `<tr><td colspan="4" class="table-empty">Nenhum produto cadastrado ainda.</td></tr>`;
    return;
  }
  body.innerHTML = state.products.map((product) => `<tr>
    <td>${escapeHtml(product.nome)}</td><td>${escapeHtml(categoryName(product.id_categoria))}</td><td>${money(product.preco)}</td>
    <td><div class="table-actions"><button data-edit-product="${Number(product.id_produto)}">Editar</button><button class="delete" data-delete-product="${Number(product.id_produto)}">Excluir</button></div></td>
  </tr>`).join("");
  body.querySelectorAll("[data-edit-product]").forEach((button) => button.addEventListener("click", () => editProduct(Number(button.dataset.editProduct))));
  body.querySelectorAll("[data-delete-product]").forEach((button) => button.addEventListener("click", () => deleteProduct(Number(button.dataset.deleteProduct))));
}

async function refreshStoreData() {
  const [categories, products, sizes, colors, variations, stocks, images] = await Promise.all([
    api("/categorias"), api("/produtos"), api("/tamanhos"), api("/cores"), api("/variacoes_produtos"), api("/estoque"), api("/imagens_produtos")
  ]);
  state.categories = categories; state.products = products; state.sizes = sizes; state.colors = colors;
  state.variations = variations; state.stocks = stocks; state.productsImages = {};
  images.forEach((image) => { if (image.imagem_principal || !state.productsImages[image.id_produto]) state.productsImages[image.id_produto] = image.caminho_imagem; });
  renderCategories(); renderProducts(); renderAdminList(); fillAdminSelects();
}

function openProduct(productId) {
  const product = state.products.find((item) => Number(item.id_produto) === Number(productId));
  if (!product) return;
  state.selectedProductId = productId;
  const variants = getProductVariants(productId).filter((variant) => stockFor(variant.id_variacao) > 0);
  const options = variants.map((variant) => {
    const size = state.sizes.find((item) => Number(item.id_tamanho) === Number(variant.id_tamanho))?.nome || "Único";
    const color = state.colors.find((item) => Number(item.id_cor) === Number(variant.id_cor))?.nome || "Padrão";
    return `<option value="${Number(variant.id_variacao)}">${escapeHtml(size)} • ${escapeHtml(color)} • ${stockFor(variant.id_variacao)} em estoque</option>`;
  }).join("");
  const path = state.productsImages?.[productId] || "";
  const art = path ? `<div class="product-detail-art"><img class="product-image" src="${escapeHtml(/^https?:\/\//i.test(path) ? path : `/${path.replace(/^\/+/, "")}`)}" alt="${escapeHtml(product.nome)}"></div>` : `<div class="product-detail-art"><span>${escapeHtml((product.nome || "F").charAt(0))}</span></div>`;
  $("#product-detail-content").innerHTML = `<div class="product-detail-layout">${art}<div class="product-detail-copy">
    <span class="eyebrow">${escapeHtml(categoryName(product.id_categoria))}</span><h2>${escapeHtml(product.nome)}</h2>
    <strong class="detail-price">${money(product.preco)}</strong><p>${escapeHtml(product.descricao || "Uma peça escolhida para compor seu estilo.")}</p>
    <label for="detail-variant" class="form-label">Escolha tamanho e cor</label>
    <select id="detail-variant" class="detail-select"><option value="">${variants.length ? "Selecione uma opção" : "Sem variações com estoque"}</option>${options}</select>
    <button class="button button-purple" id="add-to-cart-button" ${variants.length ? "" : "disabled"}>ADICIONAR À SACOLA <span>＋</span></button>
    <div class="form-feedback" id="detail-feedback"></div></div></div>`;
  const dialog = $("#product-dialog");
  if (!dialog.open) dialog.showModal();
  $("#add-to-cart-button").addEventListener("click", () => {
    const variationId = Number($("#detail-variant").value);
    if (!variationId) return setFeedback("#detail-feedback", "Selecione uma variação disponível.", true);
    addToCart(product, variationId);
    dialog.close();
  });
}

function addToCart(product, variationId) {
  const variant = state.variations.find((item) => Number(item.id_variacao) === Number(variationId));
  const stock = stockFor(variationId);
  const existing = state.cart.find((item) => Number(item.variationId) === Number(variationId));
  if (!variant || stock < 1) return showToast("Esta variação não possui estoque disponível.");
  if (existing && existing.quantity >= stock) return showToast("Quantidade máxima disponível atingida.");
  if (existing) existing.quantity += 1;
  else state.cart.push({
    variationId, productId: Number(product.id_produto), name: product.nome, price: Number(product.preco), quantity: 1,
    size: state.sizes.find((item) => Number(item.id_tamanho) === Number(variant.id_tamanho))?.nome || "Único",
    color: state.colors.find((item) => Number(item.id_cor) === Number(variant.id_cor))?.nome || "Padrão"
  });
  saveCart(); renderCart(); showToast("Peça adicionada à sacola!");
}

function saveCart() { localStorage.setItem(STORAGE_CART, JSON.stringify(state.cart)); }

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  $("#cart-count").textContent = count;
  $("#cart-total").textContent = money(total);
  if (!state.cart.length) {
    $("#cart-items").innerHTML = `<div class="loading-card">Sua sacola está vazia. Explore a coleção e encontre sua próxima peça favorita.</div>`;
  } else {
    $("#cart-items").innerHTML = state.cart.map((item) => `<div class="cart-item"><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.size)} • ${escapeHtml(item.color)} · ${money(item.price)}</span></div>
      <div class="cart-item-actions"><button data-cart-minus="${item.variationId}" aria-label="Diminuir">−</button><span>${item.quantity}</span><button data-cart-plus="${item.variationId}" aria-label="Aumentar">＋</button><button data-cart-remove="${item.variationId}" aria-label="Remover">×</button></div></div>`).join("");
  }
  $("#checkout-button").disabled = state.cart.length === 0;
  $("#cart-items").querySelectorAll("[data-cart-minus]").forEach((button) => button.addEventListener("click", () => changeCartQuantity(Number(button.dataset.cartMinus), -1)));
  $("#cart-items").querySelectorAll("[data-cart-plus]").forEach((button) => button.addEventListener("click", () => changeCartQuantity(Number(button.dataset.cartPlus), 1)));
  $("#cart-items").querySelectorAll("[data-cart-remove]").forEach((button) => button.addEventListener("click", () => { state.cart = state.cart.filter((item) => Number(item.variationId) !== Number(button.dataset.cartRemove)); saveCart(); renderCart(); }));
}

function changeCartQuantity(variationId, change) {
  const item = state.cart.find((entry) => Number(entry.variationId) === variationId);
  if (!item) return;
  const next = item.quantity + change;
  if (next <= 0) state.cart = state.cart.filter((entry) => Number(entry.variationId) !== variationId);
  else if (next <= stockFor(variationId)) item.quantity = next;
  else showToast("Não há mais unidades disponíveis no estoque.");
  saveCart(); renderCart();
}

function loadCustomer() {
  try { state.customer = JSON.parse(localStorage.getItem(STORAGE_CUSTOMER) || "null"); } catch { state.customer = null; }
  updateAccountButton();
  try { state.cart = JSON.parse(localStorage.getItem(STORAGE_CART) || "[]"); } catch { state.cart = []; }
  renderCart();
}

function updateAccountButton() {
  $("#account-label").textContent = state.customer ? (state.customer.nome.split(" ")[0] || "Minha conta") : "Entrar";
}

function showAccountMode(mode) {
  const login = mode === "login";
  $("#login-form").classList.toggle("hidden", !login);
  $("#register-form").classList.toggle("hidden", login);
  $$('[data-account-mode]').forEach((button) => button.classList.toggle("active", button.dataset.accountMode === mode));
}

async function refreshFavorites() {
  if (!state.customer) { state.favorites = []; renderProducts(); return; }
  try {
    const all = await api("/favoritos");
    state.favorites = all.filter((favorite) => Number(favorite.id_cliente) === Number(state.customer.id_cliente));
  } catch (error) { console.warn("Não foi possível carregar favoritos:", error); }
  renderProducts();
}

async function toggleFavorite(productId) {
  if (!state.customer) {
    showToast("Entre na sua conta para salvar favoritos.");
    $("#account-dialog").showModal(); showAccountMode("login"); return;
  }
  const existing = state.favorites.find((favorite) => Number(favorite.id_produto) === productId);
  try {
    if (existing) {
      await api(`/favoritos/${Number(existing.id_favorito)}`, { method: "DELETE" });
      showToast("Produto removido dos favoritos.");
    } else {
      await api("/favoritos", { method: "POST", body: { id_cliente: Number(state.customer.id_cliente), id_produto: productId, data_adicao: nowSql() } });
      showToast("Produto salvo nos favoritos!");
    }
    await refreshFavorites();
  } catch (error) { showToast(error.message); }
}

function nowSql() {
  // Usa o horário local do computador para preencher campos DATETIME do MySQL.
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function registerCustomer(event) {
  event.preventDefault();
  const body = {
    nome: $("#register-name").value.trim(), email: $("#register-email").value.trim().toLowerCase(),
    telefone: $("#register-phone").value.trim(), senha: $("#register-password").value, data_cadastro: nowSql()
  };
  try {
    await api("/clientes", { method: "POST", body });
    setFeedback("#register-feedback", "Cadastro realizado! Agora entre com seu e-mail e senha.");
    $("#login-email").value = body.email;
    $("#register-form").reset();
    showAccountMode("login");
  } catch (error) { setFeedback("#register-feedback", error.message, true); }
}

async function loginCustomer(event) {
  event.preventDefault();
  try {
    const customer = await api("/login", { method: "POST", body: { email: $("#login-email").value.trim().toLowerCase(), senha: $("#login-password").value } });
    state.customer = customer;
    localStorage.setItem(STORAGE_CUSTOMER, JSON.stringify(customer));
    updateAccountButton(); await refreshFavorites();
    $("#account-dialog").close(); $("#login-form").reset();
    showToast(`Bem-vinda(o), ${customer.nome.split(" ")[0]}!`);
  } catch (error) { setFeedback("#login-feedback", error.message, true); }
}

function editProduct(productId) {
  const product = state.products.find((item) => Number(item.id_produto) === productId);
  if (!product) return;
  state.editingProductId = productId;
  $("#product-form-title").textContent = "Editar produto";
  $("#product-name").value = product.nome || "";
  $("#product-price").value = product.preco || "";
  $("#product-description").value = product.descricao || "";
  $("#product-category").value = product.id_categoria || "";
  $("#product-size").value = ""; $("#product-color").value = "";
  $("#product-image").value = state.productsImages?.[productId] || "";
  $("#product-stock").value = 0;
  $("#save-product-button").innerHTML = "ATUALIZAR PRODUTO <span>↻</span>";
  $("#cancel-edit-button").classList.remove("hidden");
  $("#painel").scrollIntoView({ behavior: "smooth" });
}

function resetProductForm() {
  state.editingProductId = null;
  $("#product-form").reset();
  $("#product-stock").value = 10;
  $("#product-form-title").textContent = "Cadastrar produto";
  $("#save-product-button").innerHTML = "SALVAR PRODUTO <span>＋</span>";
  $("#cancel-edit-button").classList.add("hidden");
  setFeedback("#product-feedback", "");
}

async function saveProduct(event) {
  event.preventDefault();
  const categoryId = Number($("#product-category").value);
  const sizeId = $("#product-size").value ? Number($("#product-size").value) : null;
  const colorId = $("#product-color").value ? Number($("#product-color").value) : null;
  const body = {
    id_categoria: categoryId, nome: $("#product-name").value.trim(), descricao: $("#product-description").value.trim(),
    preco: Number($("#product-price").value), ativo: 1
  };
  if (!categoryId) return setFeedback("#product-feedback", "Cadastre ou selecione uma categoria primeiro.", true);
  if (Boolean(sizeId) !== Boolean(colorId)) return setFeedback("#product-feedback", "Selecione tamanho e cor juntos para criar uma variação.", true);
  try {
    let productId = state.editingProductId;
    if (productId) await api(`/produtos/${productId}`, { method: "PUT", body });
    else productId = (await api("/produtos", { method: "POST", body })).id;

    const imagePath = $("#product-image").value.trim();
    if (imagePath) {
      const existingImage = (await api("/imagens_produtos")).find((image) => Number(image.id_produto) === Number(productId));
      if (existingImage) await api(`/imagens_produtos/${Number(existingImage.id_imagem)}`, { method: "PUT", body: { caminho_imagem: imagePath, imagem_principal: 1 } });
      else await api("/imagens_produtos", { method: "POST", body: { id_produto: Number(productId), caminho_imagem: imagePath, imagem_principal: 1 } });
    }
    if (sizeId && colorId && !state.editingProductId) {
      const sku = `FS-${Date.now()}`;
      const variation = await api("/variacoes_produtos", { method: "POST", body: { id_produto: Number(productId), id_tamanho: sizeId, id_cor: colorId, sku } });
      await api("/estoque", { method: "POST", body: { id_variacao: variation.id, quantidade: Math.max(0, Number($("#product-stock").value || 0)) } });
    }
    setFeedback("#product-feedback", state.editingProductId ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
    resetProductForm(); await refreshStoreData();
    showToast("Catálogo atualizado no banco de dados.");
  } catch (error) { setFeedback("#product-feedback", error.message, true); }
}

async function deleteProduct(productId) {
  const product = state.products.find((item) => Number(item.id_produto) === productId);
  if (!product || !window.confirm(`Deseja excluir o produto "${product.nome}"?`)) return;
  try {
    await api(`/produtos/${productId}`, { method: "DELETE" });
    showToast("Produto excluído."); await refreshStoreData();
  } catch (error) { showToast(`Não foi possível excluir: ${error.message}. Verifique se o produto já está ligado a pedidos, favoritos ou variações.`); }
}

async function saveCategory(event) {
  event.preventDefault();
  try {
    await api("/categorias", { method: "POST", body: { nome: $("#category-name").value.trim(), id_categoria_pai: null } });
    $("#category-form").reset(); setFeedback("#category-feedback", "Categoria cadastrada!");
    await refreshStoreData();
  } catch (error) { setFeedback("#category-feedback", error.message, true); }
}

async function saveSize(event) {
  event.preventDefault();
  try {
    await api("/tamanhos", { method: "POST", body: { nome: $("#size-name").value.trim() } });
    $("#size-form").reset(); setFeedback("#options-feedback", "Tamanho cadastrado."); await refreshStoreData();
  } catch (error) { setFeedback("#options-feedback", error.message, true); }
}

async function saveColor(event) {
  event.preventDefault();
  try {
    await api("/cores", { method: "POST", body: { nome: $("#color-name").value.trim(), codigo_hex: $("#color-hex").value } });
    $("#color-form").reset(); $("#color-hex").value = "#b99ad9";
    setFeedback("#options-feedback", "Cor cadastrada."); await refreshStoreData();
  } catch (error) { setFeedback("#options-feedback", error.message, true); }
}

async function seedDemoCatalog() {
  const button = $("#seed-demo-button");
  button.disabled = true; button.textContent = "PREPARANDO CATÁLOGO...";
  try {
    let categories = await api("/categorias");
    const categoryNames = ["Feminino", "Masculino", "Acessórios"];
    for (const name of categoryNames) {
      if (!categories.some((item) => item.nome.toLowerCase() === name.toLowerCase())) {
        await api("/categorias", { method: "POST", body: { nome: name, id_categoria_pai: null } });
      }
    }
    let sizes = await api("/tamanhos");
    for (const name of ["P", "M", "G", "GG", "Único"]) {
      if (!sizes.some((item) => item.nome.toLowerCase() === name.toLowerCase())) await api("/tamanhos", { method: "POST", body: { nome: name } });
    }
    let colors = await api("/cores");
    const colorSeeds = [{ nome: "Lilás", codigo_hex: "#b99ad9" }, { nome: "Preto", codigo_hex: "#28212f" }, { nome: "Off-white", codigo_hex: "#eee8dc" }, { nome: "Rosa", codigo_hex: "#e8b9ce" }];
    for (const color of colorSeeds) {
      if (!colors.some((item) => item.nome.toLowerCase() === color.nome.toLowerCase())) await api("/cores", { method: "POST", body: color });
    }
    categories = await api("/categorias"); sizes = await api("/tamanhos"); colors = await api("/cores");
    let products = await api("/produtos");
    if (!products.length) {
      const samples = [
        { nome: "Blusa Serena", descricao: "Blusa leve e versátil para compor looks delicados.", preco: 89.90, category: "Feminino" },
        { nome: "Calça Urban", descricao: "Modelagem confortável para acompanhar sua rotina.", preco: 139.90, category: "Feminino" },
        { nome: "Vestido Aurora", descricao: "Uma peça especial com caimento elegante.", preco: 169.90, category: "Feminino" },
        { nome: "Camisa Essencial", descricao: "Visual clássico com toque contemporâneo.", preco: 119.90, category: "Masculino" },
        { nome: "Camiseta Minimal", descricao: "Básica, confortável e fácil de combinar.", preco: 69.90, category: "Masculino" },
        { nome: "Bolsa Aura", descricao: "O detalhe que finaliza seu look.", preco: 99.90, category: "Acessórios" }
      ];
      for (let index = 0; index < samples.length; index++) {
        const sample = samples[index];
        const category = categories.find((item) => item.nome === sample.category);
        const product = await api("/produtos", { method: "POST", body: { id_categoria: Number(category.id_categoria), nome: sample.nome, descricao: sample.descricao, preco: sample.preco, ativo: 1 } });
        const variantSizes = index === 5 ? [sizes.find((item) => item.nome === "Único") || sizes[1]] : sizes.filter((item) => ["P", "M", "G"].includes(item.nome));
        const color = colors[index % colors.length];
        for (let variantIndex = 0; variantIndex < variantSizes.length; variantIndex++) {
          const variation = await api("/variacoes_produtos", { method: "POST", body: {
            id_produto: Number(product.id), id_tamanho: Number(variantSizes[variantIndex].id_tamanho), id_cor: Number(color.id_cor), sku: `FS-DEMO-${index + 1}-${variantIndex + 1}-${Date.now()}`
          } });
          await api("/estoque", { method: "POST", body: { id_variacao: Number(variation.id), quantidade: 8 } });
        }
      }
      showToast("Catálogo demonstrativo criado com produtos e variações.");
    } else {
      showToast("Categorias, tamanhos e cores iniciais conferidos. Os produtos existentes foram mantidos.");
    }
    await refreshStoreData();
    button.classList.add("hidden");
  } catch (error) {
    showToast(`Não foi possível preparar o catálogo: ${error.message}`);
    button.disabled = false; button.textContent = "TENTAR NOVAMENTE";
  }
}

async function showFavorites() {
  if (!state.customer) { showToast("Entre na sua conta para ver seus favoritos."); $("#account-dialog").showModal(); return; }
  await refreshFavorites();
  const items = state.favorites.map((favorite) => state.products.find((product) => Number(product.id_produto) === Number(favorite.id_produto))).filter(Boolean);
  showAccountResults("Meus favoritos", items.length ? items.map((product) => `<div class="result-row"><span>${escapeHtml(product.nome)}</span><strong>${money(product.preco)}</strong></div>`).join("") : "<p>Você ainda não salvou produtos favoritos.</p>");
}

async function showOrders() {
  if (!state.customer) { showToast("Entre na sua conta para consultar pedidos."); $("#account-dialog").showModal(); return; }
  try {
    const orders = await api("/pedidos");
    const mine = orders.filter((order) => Number(order.id_cliente) === Number(state.customer.id_cliente)).sort((a, b) => Number(b.id_pedido) - Number(a.id_pedido));
    showAccountResults("Meus pedidos", mine.length ? mine.map((order) => `<div class="result-row"><span>Pedido #${Number(order.id_pedido)} · ${escapeHtml(order.status || "Registrado")}</span><strong>${money(order.valor_total)}</strong></div>`).join("") : "<p>Nenhum pedido registrado até o momento.</p>");
  } catch (error) { showToast(error.message); }
}

function showAccountResults(title, content) {
  $("#account-results-title").textContent = title;
  $("#account-results-content").innerHTML = typeof content === "string" ? content : "";
  $("#account-results").classList.remove("hidden");
  $("#account-results").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function checkout(event) {
  event.preventDefault();
  if (!state.customer) {
    setFeedback("#checkout-feedback", "Entre na sua conta antes de finalizar o pedido.", true);
    return;
  }
  if (!state.cart.length) return setFeedback("#checkout-feedback", "Sua sacola está vazia.", true);
  const button = $("#checkout-form button[type='submit']");
  button.disabled = true; button.textContent = "REGISTRANDO PEDIDO...";
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  try {
    for (const item of state.cart) {
      if (stockFor(item.variationId) < item.quantity) throw new Error(`Estoque insuficiente para ${item.name}.`);
    }
    const address = await api("/enderecos", { method: "POST", body: {
      id_cliente: Number(state.customer.id_cliente), cep: $("#address-cep").value.trim(), rua: $("#address-street").value.trim(),
      numero: $("#address-number").value.trim(), cidade: $("#address-city").value.trim(), estado: $("#address-state").value.trim().toUpperCase()
    } });
    const order = await api("/pedidos", { method: "POST", body: {
      id_cliente: Number(state.customer.id_cliente), id_endereco: Number(address.id), valor_total: total,
      status: "Aguardando pagamento", data_pedido: nowSql()
    } });
    for (const item of state.cart) {
      await api("/itens_pedido", { method: "POST", body: {
        id_pedido: Number(order.id), id_variacao: Number(item.variationId), quantidade: item.quantity, preco_unitario: item.price
      } });
      const stockRecord = state.stocks.find((stock) => Number(stock.id_variacao) === Number(item.variationId));
      if (stockRecord) {
        const newQuantity = Math.max(0, Number(stockRecord.quantidade) - item.quantity);
        await api(`/estoque/${Number(stockRecord.id_estoque)}`, { method: "PUT", body: { quantidade: newQuantity } });
      }
    }
    await api("/pagamentos", { method: "POST", body: {
      id_pedido: Number(order.id), forma_pagamento: $("#payment-method").value, valor: total,
      status: "Pendente", data_pagamento: nowSql()
    } });
    const cartRecord = await api("/carrinhos", { method: "POST", body: { id_cliente: Number(state.customer.id_cliente), status: "Finalizado", data_criacao: nowSql() } });
    for (const item of state.cart) {
      await api("/itens_carrinho", { method: "POST", body: { id_carrinho: Number(cartRecord.id), id_variacao: Number(item.variationId), quantidade: item.quantity } });
    }
    state.cart = []; saveCart(); renderCart(); $("#checkout-dialog").close(); $("#cart-dialog").close();
    $("#checkout-form").reset();
    await refreshStoreData(); await showOrders();
    showToast(`Pedido #${order.id} registrado! Pagamento pendente (simulação).`);
  } catch (error) {
    setFeedback("#checkout-feedback", error.message, true);
  } finally {
    button.disabled = false; button.textContent = "CONFIRMAR PEDIDO";
  }
}

function bindEvents() {
  $("#account-button").addEventListener("click", () => {
    if (state.customer) {
      if (window.confirm(`Você está conectada(o) como ${state.customer.nome}. Deseja sair?`)) {
        state.customer = null; state.favorites = []; localStorage.removeItem(STORAGE_CUSTOMER); updateAccountButton(); renderProducts(); showToast("Você saiu da sua conta.");
      }
    } else { $("#account-dialog").showModal(); showAccountMode("login"); }
  });
  $("#cart-button").addEventListener("click", () => $("#cart-dialog").showModal());
  $("#open-search").addEventListener("click", () => { $("#product-search").focus(); $("#colecao").scrollIntoView({ behavior: "smooth" }); });
  $("#mobile-menu-button").addEventListener("click", () => $(".main-nav").classList.toggle("open"));
  $$(".main-nav a").forEach((link) => link.addEventListener("click", () => $(".main-nav").classList.remove("open")));
  $$('[data-close]').forEach((button) => button.addEventListener("click", () => $(`#${button.dataset.close}`).close()));
  $$('[data-account-mode]').forEach((button) => button.addEventListener("click", () => showAccountMode(button.dataset.accountMode)));
  $("#product-search").addEventListener("input", (event) => { state.search = event.target.value; renderProducts(); });
  $("#category-form").addEventListener("submit", saveCategory);
  $("#product-form").addEventListener("submit", saveProduct);
  $("#size-form").addEventListener("submit", saveSize);
  $("#color-form").addEventListener("submit", saveColor);
  $("#cancel-edit-button").addEventListener("click", resetProductForm);
  $("#refresh-admin").addEventListener("click", () => refreshStoreData().then(() => showToast("Lista atualizada.")).catch((error) => showToast(error.message)));
  $("#seed-demo-button").addEventListener("click", seedDemoCatalog);
  $("#register-form").addEventListener("submit", registerCustomer);
  $("#login-form").addEventListener("submit", loginCustomer);
  $("#checkout-button").addEventListener("click", () => {
    $("#cart-dialog").close(); $("#checkout-dialog").showModal();
    if (!state.customer) setFeedback("#checkout-feedback", "Entre na sua conta para finalizar o pedido.", true);
  });
  $("#checkout-form").addEventListener("submit", checkout);
  $("#show-favorites").addEventListener("click", showFavorites);
  $("#show-orders").addEventListener("click", showOrders);
  $("#close-results").addEventListener("click", () => $("#account-results").classList.add("hidden"));
}

/* Inicialização da página. */
document.addEventListener("DOMContentLoaded", () => {
  loadCustomer();
  bindEvents();
  loadStore();
});
