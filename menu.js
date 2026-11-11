/**
 * RestroGo v2 — Customer Menu & Ordering JS
 * Handles: theme application, menu rendering, cart, checkout
 */

document.addEventListener("DOMContentLoaded", () => {

  /* ── INIT TENANT ── */
  const cfg = TenantEngine.init();

  // Demo ribbon
  if (cfg._isDemo) {
    const ribbon = document.createElement("div");
    ribbon.className = "demo-ribbon";
    ribbon.innerHTML = `
      <span>🎭 Demo Mode — <strong>${cfg.businessName}</strong></span>
      <a href="index.html#demos">← Back to all demos</a>
    `;
    document.body.prepend(ribbon);
    document.body.classList.add("has-demo-ribbon");
  }

  // Page title
  document.title = `${cfg.businessName || "Restaurant"} — Order Online`;

  /* ── POPULATE HEADER ── */
  function updateMenuHeader(c) {
    if (c.businessName) {
      document.title = `${c.businessName} — Order Online`;
      const nameNav = document.getElementById("businessNameNav");
      const heroName = document.getElementById("heroBusinessName");
      if (nameNav) nameNav.textContent = c.businessName;
      if (heroName) heroName.textContent = c.businessName;
    }
    if (c.logo) {
      const logoIcon = document.getElementById("logoIcon");
      if (logoIcon) logoIcon.textContent = c.logo;
    }
    if (c.tagline) {
      const heroTag = document.getElementById("heroTagline");
      if (heroTag) heroTag.textContent = c.tagline;
    }
    if (c.hours) {
      const heroHours = document.getElementById("heroHours");
      if (heroHours) heroHours.textContent = `⏰ ${c.hours}`;
    }
    if (c.address) {
      const heroAddr = document.getElementById("heroAddress");
      if (heroAddr) heroAddr.textContent = `📍 ${c.address}`;
    }
    if (c.heroImage) {
      const heroImg = document.getElementById("heroImg");
      if (heroImg) {
        heroImg.src = c.heroImage;
        heroImg.alt = c.businessName || "Restaurant hero";
      }
    }
  }

  updateMenuHeader(cfg);

  // For real tenants, listen for live profile & branding updates
  if (!cfg._isDemo && cfg.tenantId && typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) {
    try {
      const db = firebase.database();
      db.ref(`tenants/${cfg.tenantId}`).on("value", (snap) => {
        const val = snap.val() || {};
        const profile = val.profile || {};
        const config  = val.config || {};
        const merged  = { ...cfg, ...profile, ...config, _isDemo: false };
        _menuCfg = merged;
        TenantEngine.applyTheme(merged);
        updateMenuHeader(merged);
      });
    } catch (e) {
      console.warn("Tenant metadata listener notice:", e);
    }
  }

  // Table badge
  const tableNum = getParam("table");
  if (tableNum) {
    document.getElementById("tableBadge").style.display = "flex";
    document.getElementById("tableNumberNav").textContent = tableNum;
  }

  /* ── PROMO BANNERS ── */
  const bannerWrap = document.getElementById("promoBanners");
  (cfg.banners || []).forEach(b => {
    bannerWrap.innerHTML += `
      <div class="promo-banner" style="background:${b.bg}">
        <div class="promo-banner-text">
          <h3>${sanitize(b.title)}</h3>
          <p>${sanitize(b.subtitle)}</p>
        </div>
        <div class="promo-banner-cta">${sanitize(b.cta)}</div>
      </div>`;
  });

  /* ── LOAD MENU (demo uses inline data; real tenants hit Firebase) ── */
  loadMenu(cfg);

  /* ── SEARCH ── */
  const searchInput = document.getElementById("menuSearch");
  const searchClear = document.getElementById("searchClear");

  searchInput.addEventListener("input", debounce(() => {
    const query = searchInput.value.trim();
    searchClear.classList.toggle("visible", query.length > 0);
    renderMenu(cfg, query, MenuState.activeCategory);
  }, 220));

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.classList.remove("visible");
    renderMenu(cfg, "", MenuState.activeCategory);
  });

  /* ── FADE OBSERVER ── */
  initFadeObserver();
});

/* ─────────────────────────────────────────
   MENU STATE
───────────────────────────────────────── */
const MenuState = {
  activeCategory: "all",
  menu: []
};

/* ─────────────────────────────────────────
   LOAD & RENDER MENU
───────────────────────────────────────── */
function loadMenu(cfg) {
  // For demo configs, use inline data
  if (cfg._isDemo) {
    MenuState.menu = cfg.menu || [];
    buildCategoryTabs(cfg);
    renderMenu(cfg, "", "all");
    document.getElementById("menuSkeleton").style.display = "none";
    return;
  }

  // Real tenant: load from Firebase
  const db = firebase.database();
  const menuRef = db.ref(`tenants/${cfg.tenantId}/menu`);

  document.getElementById("menuSkeleton").innerHTML = `
    <div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:12px"></div>
    <div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:12px"></div>
    <div class="skeleton" style="height:80px;border-radius:12px"></div>`;

  menuRef.on("value", (snap) => {
    const data = snap.val() || {};
    // Normalize Firebase object to array
    MenuState.menu = Object.entries(data).map(([id, item]) => ({ id, ...item }));
    buildCategoryTabs(cfg);
    renderMenu(cfg, document.getElementById("menuSearch").value.trim(), MenuState.activeCategory);
    document.getElementById("menuSkeleton").style.display = "none";
  }, (err) => {
    console.error("Menu load error:", err);
    document.getElementById("menuSkeleton").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load menu</h3>
        <p>Please refresh the page or contact the restaurant.</p>
      </div>`;
  });
}

function buildCategoryTabs(cfg) {
  const tabsWrap = document.getElementById("categoryTabs");
  if (!tabsWrap) return;
  tabsWrap.innerHTML = "";

  // "All" tab
  tabsWrap.innerHTML += `
    <button class="cat-tab active" data-cat="all" onclick="setCategory(event, 'all')">
      <span class="cat-tab-icon">🍽️</span> All
    </button>`;

  (cfg.categories || []).forEach(cat => {
    tabsWrap.innerHTML += `
      <button class="cat-tab" data-cat="${cat.id}"
        onclick="setCategory(event, '${cat.id}')">
        <span class="cat-tab-icon">${cat.icon || "🍽️"}</span> ${sanitize(cat.name)}
      </button>`;
  });
}

// Store cfg reference globally so tabs can call renderMenu
let _menuCfg = null;

function setCategory(event, catId, cfg) {
  if (cfg) _menuCfg = cfg;
  if (!_menuCfg) _menuCfg = TenantEngine.getConfig();
  MenuState.activeCategory = catId;

  document.querySelectorAll(".cat-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.cat === catId);
  });

  // Scroll to category section or filter
  const query = document.getElementById("menuSearch")?.value.trim() || "";
  renderMenu(_menuCfg, query, catId);

  // Scroll the tab into view
  if (event && event.target) {
    const btn = event.target.closest(".cat-tab");
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
}

function renderMenu(cfg, searchQuery = "", categoryFilter = "all") {
  if (cfg) _menuCfg = cfg;
  const menu    = MenuState.menu;
  const body    = document.getElementById("menuBody");
  const q       = searchQuery.toLowerCase();

  // Filter items
  const filtered = menu.filter(item => {
    const inCat  = categoryFilter === "all" || item.cat === categoryFilter;
    const inSearch = !q || item.name.toLowerCase().includes(q)
                       || (item.desc || "").toLowerCase().includes(q);
    return inCat && inSearch;
  });

  if (filtered.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No items found</h3>
        <p>${q ? `No results for "${sanitize(q)}"` : "No items in this category."}</p>
      </div>`;
    return;
  }

  // Group by category
  const groups = {};
  if (categoryFilter === "all") {
    (cfg.categories || []).forEach(cat => { groups[cat.id] = []; });
  }
  filtered.forEach(item => {
    if (!groups[item.cat]) groups[item.cat] = [];
    groups[item.cat].push(item);
  });

  const catMap = {};
  (cfg.categories || []).forEach(c => { catMap[c.id] = c; });

  let html = "";
  Object.entries(groups).forEach(([catId, items]) => {
    if (!items.length) return;
    const cat = catMap[catId] || { name: catId, icon: "🍽️" };
    html += `
      <section class="menu-category-section fade-in" id="cat-${catId}">
        <h2 class="menu-cat-title">${cat.icon} ${sanitize(cat.name)}</h2>
        <div class="food-cards-grid">
          ${items.map(item => renderFoodCard(item, cfg)).join("")}
        </div>
      </section>`;
  });

  body.innerHTML = html;
  initFadeObserver();
  initLazyImages();
}

function renderFoodCard(item, cfg) {
  const inCart    = CartManager.getItemQty(item.id);
  const currencySymbol = cfg.currencySymbol || "₹";
  const isUnavail = item.available === false;

  return `
    <article class="food-card${isUnavail ? " unavailable" : ""}" data-id="${item.id}">
      ${isUnavail ? `<div class="unavailable-badge">Unavailable</div>` : ""}
      <div class="food-card-img-wrap">
        <img class="food-card-img skeleton"
          data-src="${item.img || ""}"
          src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          alt="${sanitize(item.name)}"
          loading="lazy"
        />
      </div>
      <div class="food-card-body">
        <div>
          <div class="food-card-header">
            <div class="food-card-badges">
              ${item.veg
                ? `<span class="badge badge-veg">● Veg</span>`
                : `<span class="badge badge-nonveg">● Non-Veg</span>`}
              ${item.popular ? `<span class="badge badge-popular">⭐ Popular</span>` : ""}
            </div>
          </div>
          <div class="food-card-name">${sanitize(item.name)}</div>
          <div class="food-card-desc">${sanitize(item.desc || "")}</div>
        </div>
        <div class="food-card-footer">
          <div>
            <span class="food-card-price">${currencySymbol}${Number(item.price).toLocaleString("en-IN")}</span>
            ${item.unit ? `<span class="food-card-unit"> / ${sanitize(item.unit)}</span>` : ""}
          </div>
          ${inCart > 0
            ? `<div class="food-qty-control">
                <button class="qty-btn" onclick="CartManager.changeQty('${item.id}', -1)" aria-label="Decrease quantity">−</button>
                <span class="qty-display" id="qty-${item.id}">${inCart}</span>
                <button class="qty-btn" onclick="CartManager.changeQty('${item.id}', 1)" aria-label="Increase quantity">+</button>
              </div>`
            : `<button class="add-to-cart-btn" onclick="CartManager.addItemById('${item.id}')">Add +</button>`
          }
        </div>
      </div>
    </article>`;
}

/* ─────────────────────────────────────────
   CART MANAGER
───────────────────────────────────────── */
const CartManager = (() => {
  const CART_KEY   = () => `rg_cart_${TenantEngine.getConfig()?.tenantId || "demo"}`;
  let items        = [];
  let discount     = 0;
  let couponCode   = "";
  let orderType    = "dine-in";
  let isOpen       = false;

  function load() {
    items = Store.get(CART_KEY(), []);
  }

  function save() {
    Store.set(CART_KEY(), items);
  }

  function updateCount() {
    const total = items.reduce((s, i) => s + i.qty, 0);
    const el = document.getElementById("cartCount");
    if (el) {
      el.textContent = total;
      el.classList.toggle("hidden", total === 0);
    }
    const btn = document.getElementById("placeOrderBtn");
    if (btn) btn.disabled = items.length === 0;
  }

  function addItemById(id) {
    load();
    const item = MenuState.menu.find(i => i.id === id);
    if (!item) return;

    const existing = items.find(i => i.id === item.id);
    if (existing) {
      existing.qty++;
    } else {
      items.push({ id: item.id, name: item.name, price: item.price, img: item.img, qty: 1 });
    }
    save();
    updateCount();
    renderCartItems();
    if (_menuCfg) renderMenu(_menuCfg, document.getElementById("menuSearch")?.value.trim() || "", MenuState.activeCategory);
    Toast.success(`${item.name} added to cart`);
  }

  function addItem(itemJSON) {
    load();
    let item;
    try { item = JSON.parse(itemJSON); } catch { return; }

    const existing = items.find(i => i.id === item.id);
    if (existing) {
      existing.qty++;
    } else {
      items.push({ id: item.id, name: item.name, price: item.price, img: item.img, qty: 1 });
    }
    save();
    updateCount();
    renderCartItems();
    // Re-render card to show qty control
    if (_menuCfg) renderMenu(_menuCfg, document.getElementById("menuSearch").value.trim(), MenuState.activeCategory);
    Toast.success(`${item.name} added to cart`);
  }

  function changeQty(id, delta) {
    load();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    items[idx].qty += delta;
    if (items[idx].qty <= 0) items.splice(idx, 1);
    save();
    updateCount();
    renderCartItems();
    // Update qty display in menu without full re-render
    const qtyEl = document.getElementById(`qty-${id}`);
    if (qtyEl) {
      const newQty = getItemQty(id);
      if (newQty > 0) {
        qtyEl.textContent = newQty;
      } else {
        if (_menuCfg) renderMenu(_menuCfg, document.getElementById("menuSearch").value.trim(), MenuState.activeCategory);
      }
    }
  }

  function getItemQty(id) {
    load();
    return items.find(i => i.id === id)?.qty || 0;
  }

  function renderCartItems() {
    const list = document.getElementById("cartItemsList");
    if (!list) return;
    const cfg = TenantEngine.getConfig();
    const sym = cfg?.currencySymbol || "₹";

    if (items.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h3>Cart is empty</h3>
          <p>Add items from the menu to get started.</p>
        </div>`;
      renderTotals(sym);
      return;
    }

    list.innerHTML = items.map(item => `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.img || ''}" alt="${sanitize(item.name)}" onerror="this.src=''"/>
        <div class="cart-item-info">
          <div class="cart-item-name">${sanitize(item.name)}</div>
          <div class="cart-item-price">${sym}${(item.price * item.qty).toLocaleString("en-IN")}</div>
        </div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" onclick="CartManager.changeQty('${item.id}', -1)">−</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" onclick="CartManager.changeQty('${item.id}', 1)">+</button>
        </div>
      </div>`).join("");

    renderTotals(sym);
  }

  function renderTotals(sym) {
    const totalsEl = document.getElementById("cartTotals");
    if (!totalsEl) return;
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const grand    = Math.max(0, subtotal - discount);

    totalsEl.innerHTML = `
      <div class="cart-total-row"><span>Subtotal</span><span>${sym}${subtotal.toLocaleString("en-IN")}</span></div>
      ${discount > 0 ? `<div class="cart-total-row discount"><span>Coupon (${couponCode})</span><span>−${sym}${discount}</span></div>` : ""}
      <div class="cart-total-row grand"><span>Total</span><span>${sym}${grand.toLocaleString("en-IN")}</span></div>`;
  }

  function setOrderType(type) {
    orderType = type;
    document.querySelectorAll(".order-type-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.type === type);
    });
  }

  function applyCoupon() {
    const code = document.getElementById("couponInput")?.value.trim().toUpperCase();
    if (!code) return;
    // Demo coupons
    const COUPONS = { "WELCOME10": 10, "RESTROGODEMO": 50, "SAVE100": 100 };
    if (COUPONS[code] !== undefined) {
      couponCode = code;
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      discount = Math.min(COUPONS[code], subtotal);
      Toast.success(`Coupon applied! Saved ₹${discount}`);
      renderCartItems();
    } else {
      Toast.error("Invalid coupon code");
    }
  }

  async function placeOrder() {
    load();
    if (items.length === 0) return;

    const cfg    = TenantEngine.getConfig();
    const tableNum = getParam("table") || (orderType === "dine-in" ? "—" : "Takeaway");
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const total    = Math.max(0, subtotal - discount);
    const orderId  = generateOrderId();

    const order = {
      orderId,
      tableNumber:  tableNum,
      orderType,
      items:        items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal,
      discount,
      total,
      coupon:       couponCode || null,
      instructions: document.getElementById("specialInstructions")?.value.trim() || null,
      status:       "new",
      createdAt:    Date.now(),
      tenantId:     cfg.tenantId
    };

    const btn = document.getElementById("placeOrderBtn");
    btn.textContent = "Placing order...";
    btn.disabled = true;

    try {
      // For demo mode: save locally and show success
      if (cfg._isDemo) {
        await new Promise(r => setTimeout(r, 800));
        onOrderSuccess(orderId);
        return;
      }

      // Real Firebase write
      const db = firebase.database();
      const orderRef = db.ref(`tenants/${cfg.tenantId}/orders/${orderId}`);
      await orderRef.set(order);
      onOrderSuccess(orderId);

    } catch (err) {
      console.error("Order error:", err);
      Toast.error("Could not place order. Please try again.");
      btn.textContent = "Place Order →";
      btn.disabled = false;
    }
  }

  function onOrderSuccess(orderId) {
    document.getElementById("successOrderId").textContent = orderId;
    document.getElementById("orderSuccessOverlay").classList.add("show");
    closeCart();
    // Clear cart
    items     = [];
    discount  = 0;
    couponCode = "";
    save();
    updateCount();
    renderCartItems();
    if (_menuCfg) renderMenu(_menuCfg, "", "all");
  }

  function dismissSuccess() {
    document.getElementById("orderSuccessOverlay").classList.remove("show");
    const btn = document.getElementById("placeOrderBtn");
    if (btn) { btn.textContent = "Place Order →"; btn.disabled = true; }
  }

  function openCart() {
    load();
    isOpen = true;
    document.getElementById("cartDrawer").classList.add("open");
    document.getElementById("cartBackdrop").classList.add("open");
    document.body.style.overflow = "hidden";
    renderCartItems();
  }

  function closeCart() {
    isOpen = false;
    document.getElementById("cartDrawer").classList.remove("open");
    document.getElementById("cartBackdrop").classList.remove("open");
    document.body.style.overflow = "";
  }

  // Init
  load();
  updateCount();

  return { addItem, addItemById, changeQty, getItemQty, openCart, closeCart, setOrderType, applyCoupon, placeOrder, dismissSuccess };
})();

// Make globally accessible from onclick attributes
window.CartManager = CartManager;
window.setCategory = setCategory;
