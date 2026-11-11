/**
 * RestroGo v2 — Owner Dashboard JS
 * Features: Overview analytics, Orders, Menu CRUD,
 *           Branding control (logo/colors/banner), Tables & QR, Settings
 */

document.addEventListener("DOMContentLoaded", () => { OwnerApp.init(); });

const OwnerApp = (() => {

  let cfg;
  let allOrders = [];
  let menuItems = [];
  let tables    = [];
  let dbRef     = null;

  /* ─── INIT ─── */
  function init() {
    cfg = TenantEngine.init();

    // Set page branding
    function updateOwnerBranding(c) {
      const name = c.businessName || "Owner Panel";
      const icon = c.logo || "🍽️";
      const sbIcon = document.getElementById("sbLogoIcon");
      const sbName = document.getElementById("sbRestaurantName");
      if (sbIcon) sbIcon.textContent = icon;
      if (sbName) sbName.textContent = name;
      document.title = `Owner Panel — ${name}`;
    }

    updateOwnerBranding(cfg);

    // If real tenant, listen for live profile & branding updates
    if (!cfg._isDemo && cfg.tenantId && typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) {
      try {
        const db = firebase.database();
        db.ref(`tenants/${cfg.tenantId}`).on("value", (snap) => {
          const val = snap.val() || {};
          const profile = val.profile || {};
          const config  = val.config || {};
          cfg = { ...cfg, ...profile, ...config, _isDemo: false };
          updateOwnerBranding(cfg);
          loadBrandingFields();
          renderLivePreview();
        });
      } catch (e) {
        console.warn("Owner tenant listener notice:", e);
      }
    }

    document.getElementById("topbarTitle").textContent = "Overview";

    // Greeting
    const hour = new Date().getHours();
    const greet = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const greetEl = document.getElementById("greetingTime");
    if (greetEl) greetEl.textContent = greet;

    const greetNameEl = document.getElementById("greetingName");
    if (greetNameEl) {
      let name = "Partner";
      if (typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) {
        const u = firebase.auth().currentUser;
        name = u.displayName || u.email?.split("@")[0] || cfg.businessName || "Partner";
      } else if (cfg.businessName) {
        name = cfg.businessName;
      }
      greetNameEl.textContent = name;
    }

    // Currency setting init
    const currEl = document.getElementById("settingCurrency");
    if (currEl && cfg.currencySymbol) currEl.value = cfg.currencySymbol;

    // Preview links
    const previewUrl = `menu.html?demo=${cfg._isDemo ? Object.keys(TenantEngine.DEMO_CONFIGS).find(k => TenantEngine.DEMO_CONFIGS[k].tenantId === cfg.tenantId) || "restaurant" : `restaurant=${cfg.tenantId}`}`;
    document.getElementById("sbPreviewLink")?.setAttribute("href", previewUrl);
    document.getElementById("topbarPreviewBtn")?.setAttribute("href", previewUrl);
    document.getElementById("openPreviewLink")?.setAttribute("href", previewUrl);

    // Sidebar navigation
    document.querySelectorAll(".sb-link[data-tab]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(link.dataset.tab);
      });
    });

    // Mobile sidebar — with overlay
    const sidebar = document.getElementById("ownerSidebar");

    // Create overlay element
    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.id = "sidebarOverlay";
    overlay.addEventListener("click", closeSidebar);
    document.body.appendChild(overlay);

    document.getElementById("sidebarToggle")?.addEventListener("click", () => {
      const isOpen = sidebar.classList.contains("open");
      if (isOpen) { closeSidebar(); } else { openSidebar(); }
    });

    document.getElementById("sbCloseBtn")?.addEventListener("click", closeSidebar);

    function openSidebar() {
      sidebar.classList.add("open");
      overlay.classList.add("show");
      document.body.style.overflow = "hidden";
    }
    function closeSidebar() {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
      document.body.style.overflow = "";
    }

    // Keyboard shortcuts (Escape closes modals and sidebar drawer)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeSidebar();
        closeItemModal();
      }
    });

    // Load data
    loadOrders();
    loadMenu();
    loadTables();
    loadBrandingFields();
    renderLivePreview();
    initDateFilter();
  }

  /* ─── TAB SWITCHING ─── */
  function switchTab(tabName) {
    document.querySelectorAll(".owner-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".sb-link[data-tab]").forEach(l => l.classList.remove("active"));

    const tabEl  = document.getElementById(`tab-${tabName}`);
    const linkEl = document.querySelector(`.sb-link[data-tab="${tabName}"]`);
    if (tabEl)  tabEl.classList.add("active");
    if (linkEl) linkEl.classList.add("active");

    const labels = { overview:"Overview", orders:"Orders", menu:"Menu", branding:"Branding", tables:"Tables & QR", settings:"Settings" };
    const topEl  = document.getElementById("topbarTitle");
    if (topEl) topEl.textContent = labels[tabName] || tabName;

    // Close mobile sidebar
    const sidebar = document.getElementById("ownerSidebar");
    const overlay = document.getElementById("sidebarOverlay");
    sidebar?.classList.remove("open");
    overlay?.classList.remove("show");
    document.body.style.overflow = "";
  }

  /* ─── LOAD ORDERS ─── */
  function loadOrders() {
    if (cfg._isDemo) {
      allOrders = generateDemoOrders();
      renderOverviewStats();
      renderRecentOrders();
      renderAllOrders();
      renderBestSellers();
      return;
    }

    // Real Firebase
    const db  = firebase.database();
    const ref = db.ref(`tenants/${cfg.tenantId}/orders`).orderByChild("createdAt").limitToLast(200);
    ref.on("value", (snap) => {
      const data = snap.val() || {};
      allOrders  = Object.values(data).sort((a,b) => b.createdAt - a.createdAt);
      renderOverviewStats();
      renderRecentOrders();
      renderAllOrders();
      renderBestSellers();
    });
  }

  function generateDemoOrders() {
    const sym  = cfg.currencySymbol || "₹";
    const statuses = ["completed","completed","completed","preparing","ready","new"];
    return Array.from({ length: 18 }, (_, i) => ({
      orderId:     `RG-DEMO-${(i+1).toString().padStart(3,"0")}`,
      tableNumber: `Table ${(i % 8) + 1}`,
      orderType:   i % 5 === 0 ? "takeaway" : "dine-in",
      items:       [
        { name: cfg.menu?.[i % cfg.menu.length]?.name || "Item", qty: Math.ceil(Math.random() * 3) }
      ],
      total:       Math.floor(400 + Math.random() * 2200),
      status:      statuses[i % statuses.length],
      createdAt:   Date.now() - i * 900000
    }));
  }

  function renderOverviewStats() {
    const today     = new Date().setHours(0,0,0,0);
    const todayOrds = allOrders.filter(o => o.createdAt >= today);
    const revenue   = todayOrds.reduce((s,o) => s + (o.total||0), 0);
    const active    = allOrders.filter(o => ["new","preparing","ready"].includes(o.status)).length;
    const avg       = todayOrds.length ? Math.round(revenue / todayOrds.length) : 0;
    const sym       = cfg.currencySymbol || "₹";

    document.getElementById("statRevenue").textContent  = `${sym}${revenue.toLocaleString("en-IN")}`;
    document.getElementById("statOrders").textContent   = todayOrds.length;
    document.getElementById("statActive").textContent   = active;
    document.getElementById("statAvgOrder").textContent = `${sym}${avg.toLocaleString("en-IN")}`;
  }

  function renderRecentOrders(orders = allOrders.slice(0, 10)) {
    const sym  = cfg.currencySymbol || "₹";
    const body = document.getElementById("recentOrdersBody");
    if (!body) return;
    if (!orders.length) {
      body.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:32px">No orders yet. Share your QR code!</td></tr>`;
      return;
    }
    body.innerHTML = orders.map(o => `
      <tr>
        <td><code class="order-id-code">${sanitize(o.orderId)}</code></td>
        <td>${sanitize(String(o.tableNumber || "—"))}</td>
        <td>${(o.items||[]).map(i => `${i.qty}× ${sanitize(i.name)}`).join(", ")}</td>
        <td style="font-weight:700">${sym}${Number(o.total||0).toLocaleString("en-IN")}</td>
        <td><span class="status-pill ${o.status}">${o.status}</span></td>
        <td style="color:var(--muted);font-size:12px">${formatTime(o.createdAt)}</td>
      </tr>`).join("");
  }

  function renderAllOrders() {
    // Actually render to the all-orders table
    const sym  = cfg.currencySymbol || "₹";
    const body = document.getElementById("allOrdersBody");
    if (!body) return;
    const orders = getFilteredOrders();
    if (!orders.length) {
      body.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:32px">No orders match the filter.</td></tr>`;
      return;
    }
    body.innerHTML = orders.map(o => `
      <tr>
        <td><code class="order-id-code">${sanitize(o.orderId)}</code></td>
        <td>${sanitize(String(o.tableNumber || "—"))}</td>
        <td>${o.orderType === "takeaway" ? "🥡 Takeaway" : "🍽️ Dine-in"}</td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(o.items||[]).map(i => `${i.qty}× ${sanitize(i.name)}`).join(", ")}</td>
        <td style="font-weight:700">${sym}${Number(o.total||0).toLocaleString("en-IN")}</td>
        <td><span class="status-pill ${o.status}">${o.status}</span></td>
        <td style="color:var(--muted);font-size:12px">${formatDate(o.createdAt)} ${formatTime(o.createdAt)}</td>
      </tr>`).join("");
  }

  function getFilteredOrders() {
    const statusFilter = document.getElementById("orderStatusFilter")?.value || "all";
    const dateFilter   = document.getElementById("orderDateFilter")?.value || "";
    return allOrders.filter(o => {
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchDate   = !dateFilter || new Date(o.createdAt).toISOString().slice(0,10) === dateFilter;
      return matchStatus && matchDate;
    });
  }

  function filterOrders() { renderAllOrders(); }

  function resetFilters() {
    const statusEl = document.getElementById("orderStatusFilter");
    const dateEl   = document.getElementById("orderDateFilter");
    if (statusEl) statusEl.value = "all";
    if (dateEl)   dateEl.value = "";
    renderAllOrders();
  }

  function renderBestSellers() {
    const grid   = document.getElementById("bestSellersGrid");
    if (!grid) return;
    const counts = {};
    allOrders.forEach(o => {
      (o.items||[]).forEach(item => {
        counts[item.name] = (counts[item.name]||0) + (item.qty||1);
      });
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5);
    if (!sorted.length) {
      grid.innerHTML = `<div class="text-muted">No sales data yet.</div>`;
      return;
    }
    grid.innerHTML = sorted.map(([name,count],i) => `
      <div class="bs-card">
        <div class="bs-rank">#${i+1}</div>
        <div>
          <div class="bs-name">${sanitize(name)}</div>
          <div class="bs-orders">${count} sold</div>
        </div>
      </div>`).join("");
  }

  function initDateFilter() {
    const today = new Date().toISOString().slice(0,10);
    const el = document.getElementById("orderDateFilter");
    if (el) el.value = today;
  }

  function exportOrders() {
    const orders = getFilteredOrders();
    if (!orders.length) { Toast.warning("No orders to export"); return; }
    const rows = [
      ["Order ID","Table","Type","Items","Total","Status","Date","Time"],
      ...orders.map(o => [
        o.orderId,
        o.tableNumber || "—",
        o.orderType || "dine-in",
        (o.items||[]).map(i => `${i.qty}x ${i.name}`).join("; "),
        o.total || 0,
        o.status,
        formatDate(o.createdAt),
        formatTime(o.createdAt)
      ])
    ];
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `orders-${cfg.tenantId}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success("CSV exported");
  }

  /* ─── MENU MANAGEMENT ─── */
  function loadMenu() {
    if (cfg._isDemo) {
      menuItems = cfg.menu || [];
      renderMenuMgmt();
      populateCategorySelect();
      return;
    }
    const db  = firebase.database();
    const ref = db.ref(`tenants/${cfg.tenantId}/menu`);
    ref.on("value", (snap) => {
      const data = snap.val() || {};
      menuItems  = Object.entries(data).map(([id,item]) => ({ id, ...item }));
      renderMenuMgmt();
      populateCategorySelect();
    });
  }

  function renderMenuMgmt() {
    const grid = document.getElementById("menuMgmtGrid");
    if (!grid) return;
    const sym = cfg.currencySymbol || "₹";
    if (!menuItems.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🍽️</div><h3>No items yet</h3><p>Add your first menu item.</p></div>`;
      return;
    }
    grid.innerHTML = menuItems.map(item => `
      <div class="menu-item-mgmt-card ${item.available === false ? "is-hidden" : ""}">
        <div class="mim-img-wrap">
          ${item.img
            ? `<img class="mim-img" src="${item.img}" alt="${sanitize(item.name)}" onerror="this.parentElement.innerHTML='<div class=\\'mim-img-placeholder\\'>${item.veg !== false ? "🟢" : "🔴"}</div>'"/>`
            : `<div class="mim-img-placeholder">${item.veg !== false ? "🟢" : "🔴"}</div>`}
        </div>
        <div class="mim-body">
          <div class="mim-name">${sanitize(item.name)}</div>
          <div class="mim-price">${sym}${Number(item.price).toLocaleString("en-IN")}</div>
          <div class="mim-meta">
            ${item.veg !== false ? `<span class="badge badge-veg">Veg</span>` : `<span class="badge badge-nonveg">Non-Veg</span>`}
            ${item.popular ? `<span class="badge badge-popular">Popular</span>` : ""}
            ${item.available === false ? `<span class="badge badge-hidden">Hidden</span>` : ""}
          </div>
          <div class="mim-actions">
            <button class="mim-edit-btn" onclick="OwnerApp.openEditItemModal('${item.id}')">✏️ Edit</button>
            <button class="mim-del-btn"  onclick="OwnerApp.deleteItem('${item.id}')">🗑️ Delete</button>
          </div>
        </div>
      </div>`).join("");
  }

  function populateCategorySelect() {
    const sel = document.getElementById("itemCategory");
    if (!sel) return;
    sel.innerHTML = (cfg.categories || []).map(c =>
      `<option value="${c.id}">${c.icon} ${c.name}</option>`
    ).join("");
  }

  function openAddItemModal() {
    document.getElementById("itemModalTitle").textContent = "Add Menu Item";
    document.getElementById("editItemId").value = "";
    ["itemName","itemPrice","itemDesc","itemImg"].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = "";
    });
    document.getElementById("itemVeg").value = "true";
    document.getElementById("itemPopular").value = "false";
    document.getElementById("itemAvailable").value = "true";
    openModal("itemModal");
  }

  function openEditItemModal(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    document.getElementById("itemModalTitle").textContent  = "Edit Menu Item";
    document.getElementById("editItemId").value            = itemId;
    document.getElementById("itemName").value              = item.name || "";
    document.getElementById("itemPrice").value             = item.price || "";
    document.getElementById("itemDesc").value              = item.desc || "";
    document.getElementById("itemImg").value               = item.img || "";
    document.getElementById("itemCategory").value          = item.cat || "";
    document.getElementById("itemVeg").value               = String(item.veg !== false);
    document.getElementById("itemPopular").value           = String(!!item.popular);
    document.getElementById("itemAvailable").value         = String(item.available !== false);
    openModal("itemModal");
  }

  function closeItemModal() { closeModal("itemModal"); }

  async function saveItem() {
    const name    = document.getElementById("itemName")?.value.trim();
    const price   = parseFloat(document.getElementById("itemPrice")?.value);
    const desc    = document.getElementById("itemDesc")?.value.trim();
    const img     = document.getElementById("itemImg")?.value.trim();
    const cat     = document.getElementById("itemCategory")?.value;
    const veg     = document.getElementById("itemVeg")?.value === "true";
    const popular = document.getElementById("itemPopular")?.value === "true";
    const avail   = document.getElementById("itemAvailable")?.value === "true";
    const editId  = document.getElementById("editItemId")?.value;

    if (!name || isNaN(price) || price < 0) {
      Toast.error("Name and valid price are required");
      return;
    }

    const item = { name, price, desc, img, cat, veg, popular, available: avail };

    if (cfg._isDemo) {
      if (editId) {
        const idx = menuItems.findIndex(i => i.id === editId);
        if (idx > -1) menuItems[idx] = { id: editId, ...item };
      } else {
        menuItems.push({ id: `demo-${Date.now()}`, ...item });
      }
      renderMenuMgmt();
      closeItemModal();
      Toast.success(editId ? "Item updated (demo)" : "Item added (demo)");
      return;
    }

    try {
      const db  = firebase.database();
      const id  = editId || db.ref(`tenants/${cfg.tenantId}/menu`).push().key;
      await db.ref(`tenants/${cfg.tenantId}/menu/${id}`).set(item);
      closeItemModal();
      Toast.success(editId ? "Item updated" : "Item added");
    } catch (err) {
      console.error(err);
      Toast.error("Failed to save item");
    }
  }

  async function deleteItem(itemId) {
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    if (cfg._isDemo) {
      menuItems = menuItems.filter(i => i.id !== itemId);
      renderMenuMgmt();
      Toast.success("Item deleted (demo)");
      return;
    }
    try {
      const db = firebase.database();
      await db.ref(`tenants/${cfg.tenantId}/menu/${itemId}`).remove();
      Toast.success("Item deleted");
    } catch (err) {
      Toast.error("Could not delete item");
    }
  }

  /* ─── BRANDING ─── */
  function loadBrandingFields() {
    document.getElementById("colorPrimary").value  = cfg.primaryColor  || "#e05c1a";
    document.getElementById("colorBg").value       = cfg.bgColor       || "#111111";
    document.getElementById("colorCard").value     = cfg.cardColor     || "#1e1e1e";
    document.getElementById("colorText").value     = cfg.textColor     || "#f8f8f8";
    document.getElementById("colorPrimaryHex").value = cfg.primaryColor  || "#e05c1a";
    document.getElementById("colorBgHex").value      = cfg.bgColor       || "#111111";
    document.getElementById("colorCardHex").value    = cfg.cardColor     || "#1e1e1e";
    document.getElementById("colorTextHex").value    = cfg.textColor     || "#f8f8f8";

    document.getElementById("brandingBusinessName").value = cfg.businessName || "";
    document.getElementById("brandingTagline").value      = cfg.tagline      || "";
    document.getElementById("brandingAddress").value      = cfg.address      || "";
    document.getElementById("brandingPhone").value        = cfg.phone        || "";
    document.getElementById("brandingHours").value        = cfg.hours        || "";

    if (cfg.heroImage) {
      document.getElementById("bannerPreviewImg").src            = cfg.heroImage;
      document.getElementById("bannerPreviewImg").style.display  = "block";
      document.getElementById("bannerPlaceholder").style.display = "none";
    }

    // Logo preview
    document.getElementById("logoPreviewIcon").textContent = cfg.logo || "🍽️";
    document.getElementById("logoEmojiInput").value        = cfg.logo || "";
  }

  function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById("logoPreview");
      preview.innerHTML = `<img src="${e.target.result}" alt="Logo"/>`;
      cfg._pendingLogo = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function saveLogo() {
    const emoji  = document.getElementById("logoEmojiInput").value.trim();
    const pending = cfg._pendingLogo;

    if (emoji) {
      document.getElementById("logoPreviewIcon").textContent = emoji;
      cfg.logo = emoji;
      if (cfg._isDemo) {
        document.getElementById("sbLogoIcon").textContent = emoji;
        renderLivePreview();
        Toast.success("Logo emoji saved (demo)");
        return;
      }
      saveBrandingFieldToFirebase("logo", emoji);
    } else if (pending) {
      // In production: upload to Firebase Storage
      cfg.heroLogo = pending;
      Toast.success("Logo saved (demo — real upload needs Firebase Storage)");
      renderLivePreview();
    } else {
      Toast.warning("No changes to save");
    }
  }

  function handleBannerUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      showBannerPreview(e.target.result);
      cfg._pendingBanner = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function applyBannerUrl() {
    const url = document.getElementById("bannerUrlInput")?.value.trim();
    if (!url) return;
    showBannerPreview(url);
    cfg._pendingBannerUrl = url;
  }

  function showBannerPreview(src) {
    const img = document.getElementById("bannerPreviewImg");
    const ph  = document.getElementById("bannerPlaceholder");
    img.src   = src;
    img.style.display = "block";
    ph.style.display  = "none";
    renderLivePreview();
  }

  function saveBanner() {
    const src = cfg._pendingBanner || cfg._pendingBannerUrl;
    if (!src) { Toast.warning("No banner to save"); return; }
    cfg.heroImage = src;
    if (cfg._isDemo) { Toast.success("Banner saved (demo)"); renderLivePreview(); return; }
    saveBrandingFieldToFirebase("heroImage", src);
  }

  function previewColor() {
    const primary = document.getElementById("colorPrimary").value;
    const bg      = document.getElementById("colorBg").value;
    const card    = document.getElementById("colorCard").value;
    const text    = document.getElementById("colorText").value;

    document.getElementById("colorPrimaryHex").value = primary;
    document.getElementById("colorBgHex").value      = bg;
    document.getElementById("colorCardHex").value    = card;
    document.getElementById("colorTextHex").value    = text;

    renderLivePreview({ primary, bg, card, text });
  }

  function syncColorFromHex(field) {
    const hexMap = {
      primary: { inputId:"colorPrimaryHex", pickerId:"colorPrimary" },
      bg:      { inputId:"colorBgHex",      pickerId:"colorBg" },
      card:    { inputId:"colorCardHex",    pickerId:"colorCard" },
      text:    { inputId:"colorTextHex",    pickerId:"colorText" }
    };
    const m   = hexMap[field];
    const hex = document.getElementById(m.inputId)?.value.trim();
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
      document.getElementById(m.pickerId).value = hex;
      previewColor();
    }
  }

  function saveColors() {
    const primary = document.getElementById("colorPrimary").value;
    const bg      = document.getElementById("colorBg").value;
    const card    = document.getElementById("colorCard").value;
    const text    = document.getElementById("colorText").value;

    cfg.primaryColor = primary;
    cfg.bgColor      = bg;
    cfg.cardColor    = card;
    cfg.textColor    = text;

    TenantEngine.applyTheme(cfg);

    if (cfg._isDemo) {
      Toast.success("Colors saved (demo — reflected in preview)");
      return;
    }
    saveBrandingFieldToFirebase("colors", { primaryColor:primary, bgColor:bg, cardColor:card, textColor:text });
  }

  function applyPreset(demoKey) {
    const presetCfg = TenantEngine.DEMO_CONFIGS[demoKey];
    if (!presetCfg) return;
    document.getElementById("colorPrimary").value    = presetCfg.primaryColor;
    document.getElementById("colorBg").value         = presetCfg.bgColor;
    document.getElementById("colorCard").value       = presetCfg.cardColor;
    document.getElementById("colorText").value       = presetCfg.textColor;
    document.getElementById("colorPrimaryHex").value = presetCfg.primaryColor;
    document.getElementById("colorBgHex").value      = presetCfg.bgColor;
    document.getElementById("colorCardHex").value    = presetCfg.cardColor;
    document.getElementById("colorTextHex").value    = presetCfg.textColor;
    previewColor();
    Toast.info(`Preset applied: ${presetCfg.businessName}`);
  }

  function saveBusinessInfo() {
    const name    = document.getElementById("brandingBusinessName")?.value.trim();
    const tagline = document.getElementById("brandingTagline")?.value.trim();
    const address = document.getElementById("brandingAddress")?.value.trim();
    const phone   = document.getElementById("brandingPhone")?.value.trim();
    const hours   = document.getElementById("brandingHours")?.value.trim();

    if (!name) { Toast.error("Business name is required"); return; }

    cfg.businessName = name;
    cfg.tagline      = tagline;
    cfg.address      = address;
    cfg.phone        = phone;
    cfg.hours        = hours;

    document.getElementById("sbRestaurantName").textContent = name;
    renderLivePreview();

    if (cfg._isDemo) {
      Toast.success("Business info saved (demo)");
      return;
    }
    saveBrandingFieldToFirebase("profile", { businessName:name, tagline, address, phone, hours });
  }

  async function saveBrandingFieldToFirebase(field, value) {
    try {
      const db = firebase.database();
      if (typeof value === "object") {
        await db.ref(`tenants/${cfg.tenantId}/config`).update(value);
      } else {
        await db.ref(`tenants/${cfg.tenantId}/config/${field}`).set(value);
      }
      Toast.success("Saved successfully");
    } catch (err) {
      console.error(err);
      Toast.error("Failed to save. Please try again.");
    }
  }

  /* ─── LIVE PREVIEW ─── */
  function renderLivePreview(colorOverride = null) {
    const frame  = document.getElementById("livePreviewFrame");
    if (!frame) return;

    const primary = colorOverride?.primary || cfg.primaryColor || "#e05c1a";
    const bg      = colorOverride?.bg      || cfg.bgColor      || "#111111";
    const card    = colorOverride?.card    || cfg.cardColor    || "#1e1e1e";
    const text    = colorOverride?.text    || cfg.textColor    || "#f8f8f8";
    const logo    = cfg.logo || "🍽️";
    const name    = document.getElementById("brandingBusinessName")?.value || cfg.businessName;
    const tagline = document.getElementById("brandingTagline")?.value || cfg.tagline;
    const banner  = cfg._pendingBanner || cfg._pendingBannerUrl || cfg.heroImage || "";
    const sym     = cfg.currencySymbol || "₹";
    const items   = (cfg.menu || menuItems).slice(0,3);

    frame.innerHTML = `
      <div style="background:${bg};color:${text};font-family:var(--font-body);min-height:520px">
        <!-- Nav -->
        <div style="background:rgba(0,0,0,0.8);padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
          <div style="font-weight:800;font-size:14px">${logo} ${sanitize(name)}</div>
          <div style="background:${primary};color:#fff;padding:5px 10px;border-radius:20px;font-size:11px;font-weight:700">🛒 Cart</div>
        </div>
        <!-- Banner -->
        <div style="height:120px;overflow:hidden;position:relative">
          ${banner
            ? `<img src="${banner}" style="width:100%;height:100%;object-fit:cover" alt="Banner"/>`
            : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${primary}33,${primary}11);display:flex;align-items:center;justify-content:center;font-size:40px">${logo}</div>`}
          <div style="position:absolute;bottom:0;left:0;right:0;padding:10px 14px;background:linear-gradient(to top,rgba(0,0,0,0.7),transparent)">
            <div style="font-weight:800;font-size:16px;color:#fff">${sanitize(name)}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.7)">${sanitize(tagline || "")}</div>
          </div>
        </div>
        <!-- Search -->
        <div style="padding:10px 14px">
          <div style="background:${card};border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:8px 14px;font-size:12px;color:rgba(255,255,255,0.4)">🔍 Search items...</div>
        </div>
        <!-- Items -->
        <div style="padding:0 14px">
          ${items.map(item => `
            <div style="background:${card};border:1px solid rgba(255,255,255,0.07);border-radius:10px;display:flex;gap:0;margin-bottom:8px;overflow:hidden">
              <div style="width:64px;height:64px;flex-shrink:0;background:rgba(255,255,255,0.06)">
                ${item.img ? `<img src="${item.img}" style="width:64px;height:64px;object-fit:cover" alt=""/>` : `<div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:24px">🍽️</div>`}
              </div>
              <div style="flex:1;padding:8px 10px;display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-size:13px;font-weight:700">${sanitize(item.name)}</div>
                  <div style="font-size:12px;color:${primary};font-weight:800">${sym}${Number(item.price).toLocaleString("en-IN")}</div>
                </div>
                <div style="background:${primary};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700">+</div>
              </div>
            </div>`).join("")}
        </div>
      </div>`;
  }

  /* ─── TABLES & QR ─── */
  function loadTables() {
    if (cfg._isDemo) {
      tables = [1,2,3,4,5,6,7,8].map(n => ({ id:`table-${n}`, number: n, label:`Table ${n}` }));
      renderTables();
      return;
    }
    const db  = firebase.database();
    const ref = db.ref(`tenants/${cfg.tenantId}/tables`);
    ref.on("value", (snap) => {
      const data = snap.val() || {};
      tables = Object.entries(data).map(([id, t]) => ({ id, ...t }));
      if (!tables.length) {
        tables = [1,2,3,4].map(n => ({ id:`t${n}`, number:n, label:`Table ${n}` }));
      }
      renderTables();
    });
  }

  function renderTables() {
    const grid = document.getElementById("tablesGrid");
    if (!grid) return;
    const demoKey = Object.keys(TenantEngine.DEMO_CONFIGS).find(k => TenantEngine.DEMO_CONFIGS[k].tenantId === cfg.tenantId);
    const baseUrl = window.location.origin + window.location.pathname.replace("owner.html","menu.html");

    grid.innerHTML = tables.map(t => {
      const url = cfg._isDemo
        ? `${baseUrl}?demo=${demoKey || "restaurant"}&table=${t.number}`
        : `${baseUrl}?restaurant=${cfg.tenantId}&table=${t.number}`;
      return `
        <div class="table-qr-card">
          <h3>${sanitize(t.label || `Table ${t.number}`)}</h3>
          <div class="qr-code-wrap" id="qr-${t.id}"></div>
          <div class="table-qr-url">${url}</div>
          <div class="table-qr-actions">
            <button class="tqa-btn" onclick="OwnerApp.downloadQR('${t.id}','${sanitize(t.label || `Table ${t.number}`)}')">⬇️ Download</button>
            <button class="tqa-btn" onclick="copyToClipboard('${url}').then(()=>Toast.success('Link copied!'))">🔗 Copy Link</button>
            <button class="tqa-btn del" onclick="OwnerApp.deleteTable('${t.id}')">🗑️</button>
          </div>
        </div>`;
    }).join("");

    // Generate QR codes after DOM is ready
    setTimeout(() => {
      tables.forEach(t => {
        const demoKey = Object.keys(TenantEngine.DEMO_CONFIGS).find(k => TenantEngine.DEMO_CONFIGS[k].tenantId === cfg.tenantId);
        const baseUrl = window.location.origin + window.location.pathname.replace("owner.html","menu.html");
        const url = cfg._isDemo
          ? `${baseUrl}?demo=${demoKey || "restaurant"}&table=${t.number}`
          : `${baseUrl}?restaurant=${cfg.tenantId}&table=${t.number}`;
        generateQR(`qr-${t.id}`, url, 140);
      });
    }, 100);
  }

  function addTable() {
    const num = tables.length + 1;
    const newTable = { id: `t${Date.now()}`, number: num, label: `Table ${num}` };
    if (cfg._isDemo) {
      tables.push(newTable);
      renderTables();
      Toast.success(`Table ${num} added`);
      return;
    }
    const db = firebase.database();
    db.ref(`tenants/${cfg.tenantId}/tables/${newTable.id}`).set(newTable)
      .then(() => Toast.success(`Table ${num} added`))
      .catch(() => Toast.error("Failed to add table"));
  }

  function deleteTable(tableId) {
    if (!confirm("Remove this table and its QR code?")) return;
    if (cfg._isDemo) {
      tables = tables.filter(t => t.id !== tableId);
      renderTables();
      Toast.success("Table removed");
      return;
    }
    const db = firebase.database();
    db.ref(`tenants/${cfg.tenantId}/tables/${tableId}`).remove()
      .then(() => Toast.success("Table removed"))
      .catch(() => Toast.error("Failed to remove table"));
  }

  function downloadQR(tableId, label) {
    const wrap  = document.getElementById(`qr-${tableId}`);
    if (!wrap) return;
    const canvas = wrap.querySelector("canvas");
    const img    = wrap.querySelector("img");
    if (canvas) {
      const a    = document.createElement("a");
      a.href     = canvas.toDataURL("image/png");
      a.download = `qr-${label.replace(/\s+/g,"-").toLowerCase()}.png`;
      a.click();
      Toast.success("QR code downloaded");
    } else if (img) {
      // Fallback: open in new tab
      window.open(img.src, "_blank");
    }
  }

  /* ─── SETTINGS ─── */
  async function saveSettings() {
    const sym = document.getElementById("settingCurrency")?.value.trim() || "₹";
    cfg.currencySymbol = sym;
    renderOverviewStats();
    renderRecentOrders();
    renderAllOrders();
    renderMenuMgmt();
    renderLivePreview();
    if (cfg._isDemo) {
      Toast.success("Preferences saved (demo)");
      return;
    }
    try {
      const db = firebase.database();
      await db.ref(`tenants/${cfg.tenantId}/config/currencySymbol`).set(sym);
      Toast.success("Preferences saved");
    } catch (e) {
      console.error(e);
      Toast.error("Failed to save preferences");
    }
  }

  /* ─── MODAL HELPERS ─── */
  function openModal(id) {
    document.getElementById(id)?.classList.add("open");
    document.getElementById(`${id}Backdrop`)?.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal(id) {
    document.getElementById(id)?.classList.remove("open");
    document.getElementById(`${id}Backdrop`)?.classList.remove("open");
    document.body.style.overflow = "";
  }

  return {
    init, switchTab,
    // Orders
    filterOrders, resetFilters, exportOrders,
    // Menu
    openAddItemModal, openEditItemModal, closeItemModal, saveItem, deleteItem,
    // Branding
    handleLogoUpload, saveLogo, handleBannerUpload, applyBannerUrl, saveBanner,
    previewColor, syncColorFromHex, saveColors, applyPreset, saveBusinessInfo,
    // Tables
    addTable, deleteTable, downloadQR,
    // Settings
    saveSettings
  };
})();

window.OwnerApp = OwnerApp;
