/**
 * RestroGo v2 — Kitchen Display JS
 * Real-time order stream from Firebase per tenant.
 */

const KitchenApp = (() => {

  let cfg;
  let soundEnabled  = true;
  let dbListener    = null;
  let tickerInterval = null;
  let orders        = {};   // orderId -> order object
  const orderTimers = {};   // orderId -> start timestamp

  /* ─── INIT ─── */
  function init() {
    cfg = TenantEngine.init();

    // Kitchen always uses dark theme override
    document.documentElement.style.setProperty("--primary", "#3b82f6");

    function updateKitchenBranding(c) {
      const name = c.businessName || "Kitchen Display";
      document.title = `Kitchen — ${name}`;
      const nameEl = document.getElementById("kitchenRestaurantName");
      const iconEl = document.getElementById("kitchenLogoIcon");
      if (nameEl) nameEl.textContent = name;
      if (iconEl) iconEl.textContent = c.logo || "🍳";
    }

    updateKitchenBranding(cfg);

    // If real tenant, listen for profile/config
    if (!cfg._isDemo && cfg.tenantId && typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) {
      try {
        const db = firebase.database();
        db.ref(`tenants/${cfg.tenantId}`).on("value", (snap) => {
          const val = snap.val() || {};
          const profile = val.profile || {};
          const config  = val.config || {};
          cfg = { ...cfg, ...profile, ...config, _isDemo: false };
          updateKitchenBranding(cfg);
        });
      } catch (e) {
        console.warn("Kitchen tenant listener notice:", e);
      }
    }

    // Clock
    updateClock();
    setInterval(updateClock, 1000);

    // Update timers every 30s
    tickerInterval = setInterval(updateTimers, 30000);

    // Demo mode
    if (cfg._isDemo) {
      document.getElementById("kitchenDemoBar").style.display = "flex";
      loadDemoOrders();
      return;
    }

    // Firebase listener
    subscribeToOrders();
  }

  function updateClock() {
    const now  = new Date();
    const time = now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false });
    const date = now.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
    const clockEl = document.getElementById("kitchenClock");
    const dateEl  = document.getElementById("kitchenDate");
    if (clockEl) clockEl.textContent = time;
    if (dateEl)  dateEl.textContent  = date;
  }

  /* ─── FIREBASE LISTENER ─── */
  let isFirstLoad = true;
  function subscribeToOrders() {
    if (!cfg || !cfg.tenantId) return;
    const db  = firebase.database();
    // Subscribe to last 100 orders ordered by createdAt
    const ref = db.ref(`tenants/${cfg.tenantId}/orders`)
                  .orderByChild("createdAt")
                  .limitToLast(100);

    dbListener = ref.on("value", (snap) => {
      const data = snap.val() || {};
      let hasNewIncoming = false;
      const prevIds = Object.keys(orders);
      orders = {};
      Object.entries(data).forEach(([id, order]) => {
        // Show today's orders or any active non-completed orders from the last 24 hours
        const cutoff = Date.now() - (24 * 60 * 60 * 1000);
        if (order.createdAt >= cutoff || order.status !== "completed") {
          orders[id] = order;
          if (!orderTimers[id]) orderTimers[id] = order.createdAt;
          if (!isFirstLoad && !prevIds.includes(id) && order.status === "new") {
            hasNewIncoming = true;
          }
        }
      });
      if (hasNewIncoming) {
        playAlert();
        Toast.info("🔔 New order received!");
      }
      isFirstLoad = false;
      renderBoard();
    }, (err) => {
      console.error("Kitchen listener error:", err);
      Toast.error("Lost connection to order stream");
    });
  }

  /* ─── DEMO DATA ─── */
  let demoOrderCounter = 1;
  function loadDemoOrders() {
    // Start with 2 demo orders
    const demo1 = makeDemoOrder("Table 4", ["Truffle Risotto × 2", "Burrata Caprese × 1"], 1450, "No dairy for seat 2");
    const demo2 = makeDemoOrder("Table 7", ["Beef Wellington × 1", "Cacio e Pepe × 2"], 4890, null);
    demo2.status = "preparing";

    orders[demo1.orderId] = demo1;
    orders[demo2.orderId] = demo2;
    orderTimers[demo1.orderId] = demo1.createdAt;
    orderTimers[demo2.orderId] = demo2.createdAt - 480000;

    renderBoard();
  }

  function makeDemoOrder(table, itemStrings, total, note) {
    const id = generateOrderId();
    return {
      orderId:      id,
      tableNumber:  table,
      orderType:    "dine-in",
      items:        itemStrings.map((s, i) => ({ id:`demo${i}`, name: s.split(" × ")[0], qty: parseInt(s.split("× ")[1]) || 1 })),
      total,
      instructions: note,
      status:       "new",
      createdAt:    Date.now()
    };
  }

  function injectDemoOrder() {
    const tables   = ["Table 1","Table 2","Table 3","Table 5","Table 6","Table 8","Table 9","Takeaway"];
    const items    = [
      "Soufflé au Chocolat × 2",
      "Lobster Linguine × 1",
      "Foie Gras Torchon × 1",
      "Château Margaux × 2",
      "Burrata Caprese × 3"
    ];
    const table    = tables[Math.floor(Math.random() * tables.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const picked   = items.sort(() => 0.5 - Math.random()).slice(0, numItems);
    const order    = makeDemoOrder(table, picked, 800 + Math.floor(Math.random() * 2400), null);

    orders[order.orderId] = order;
    orderTimers[order.orderId] = order.createdAt;
    renderBoard();
    playAlert();
    Toast.success(`New order — ${table}`);
    demoOrderCounter++;
  }

  /* ─── RENDER BOARD ─── */
  function renderBoard() {
    const buckets = { new:[], preparing:[], ready:[], completed:[] };

    Object.values(orders).forEach(order => {
      const status = order.status || "new";
      if (buckets[status]) buckets[status].push(order);
    });

    // Sort each bucket by createdAt asc
    Object.values(buckets).forEach(arr => arr.sort((a,b) => a.createdAt - b.createdAt));

    // Render each column
    renderColumn("new",       buckets.new);
    renderColumn("preparing", buckets.preparing);
    renderColumn("ready",     buckets.ready);
    renderColumn("completed", buckets.completed);

    // Update stats
    updateStats(buckets);
  }

  function renderColumn(status, orderList) {
    const container = document.getElementById(`tickets-${status}`);
    const countEl   = document.getElementById(`count-${status}`);
    if (!container) return;

    countEl.textContent = orderList.length;

    if (orderList.length === 0) {
      const labels = { new:"Waiting for orders...", preparing:"No orders preparing", ready:"No orders ready", completed:"No completed orders yet" };
      container.innerHTML = `<div class="k-empty">${labels[status]}</div>`;
      return;
    }

    container.innerHTML = orderList.map(order => renderTicket(order, status)).join("");
  }

  function renderTicket(order, status) {
    const elapsed  = elapsedMinutes(order.orderId, order.createdAt);
    const urgent   = elapsed >= 20 && status !== "completed";
    const cfg      = TenantEngine.getConfig();
    const sym      = cfg?.currencySymbol || "₹";

    const items = (order.items || []).map(item =>
      `<div class="k-ticket-item">
        <span>${sanitize(item.name)}</span>
        <span class="k-ticket-item-qty">× ${item.qty || 1}</span>
      </div>`).join("");

    const actions = {
      new:       `<button class="k-action-btn accept" onclick="KitchenApp.updateStatus('${order.orderId}','preparing')">Accept & Start</button>`,
      preparing: `<button class="k-action-btn done"   onclick="KitchenApp.updateStatus('${order.orderId}','ready')">Mark Ready</button>`,
      ready:     `<button class="k-action-btn complete" onclick="KitchenApp.updateStatus('${order.orderId}','completed')">Serve & Complete</button>`,
      completed: ``
    };

    return `
      <div class="k-ticket ${status}-ticket" id="ticket-${order.orderId}">
        <div class="k-ticket-header">
          <div>
            <div class="k-ticket-table">${sanitize(String(order.tableNumber || "—"))}</div>
            <div class="k-ticket-type">${order.orderType === "takeaway" ? "🥡 Takeaway" : "🍽️ Dine-in"}</div>
            <div class="k-ticket-order-id">${order.orderId}</div>
          </div>
          <div class="k-ticket-meta">
            <div class="k-ticket-time${urgent ? " urgent" : ""}">${elapsed}m</div>
          </div>
        </div>
        <div class="k-ticket-items">${items}</div>
        ${order.instructions ? `<div class="k-ticket-note">📝 ${sanitize(order.instructions)}</div>` : ""}
        <div class="k-ticket-total">
          <span>Order Total</span>
          <span>${sym}${Number(order.total || 0).toLocaleString("en-IN")}</span>
        </div>
        ${actions[status] ? `<div class="k-ticket-actions">${actions[status]}</div>` : ""}
      </div>`;
  }

  function updateStats(buckets) {
    document.getElementById("kStatNew").textContent       = buckets.new.length;
    document.getElementById("kStatPreparing").textContent = buckets.preparing.length;
    document.getElementById("kStatReady").textContent     = buckets.ready.length;
    document.getElementById("kStatCompleted").textContent = buckets.completed.length;
  }

  function elapsedMinutes(orderId, createdAt) {
    const start = orderTimers[orderId] || createdAt || Date.now();
    return Math.floor((Date.now() - start) / 60000);
  }

  function updateTimers() {
    renderBoard();
  }

  /* ─── STATUS CHANGE ─── */
  function updateStatus(orderId, newStatus) {
    // Demo mode: update local
    if (cfg._isDemo) {
      if (orders[orderId]) {
        orders[orderId].status = newStatus;
        if (newStatus === "preparing" && !orderTimers[orderId]) {
          orderTimers[orderId] = Date.now();
        }
      }
      renderBoard();
      const labels = { preparing:"Preparing", ready:"Ready to serve!", completed:"Order complete" };
      Toast.success(labels[newStatus] || newStatus);
      return;
    }

    // Real Firebase update
    const db = firebase.database();
    db.ref(`tenants/${cfg.tenantId}/orders/${orderId}/status`)
      .set(newStatus)
      .then(() => {
        if (newStatus === "preparing") {
          db.ref(`tenants/${cfg.tenantId}/orders/${orderId}/acceptedAt`).set(Date.now());
        }
        if (newStatus === "ready") {
          db.ref(`tenants/${cfg.tenantId}/orders/${orderId}/readyAt`).set(Date.now());
        }
        if (newStatus === "completed") {
          db.ref(`tenants/${cfg.tenantId}/orders/${orderId}/completedAt`).set(Date.now());
        }
      })
      .catch(err => {
        console.error("Status update error:", err);
        Toast.error("Failed to update order status");
      });
  }

  /* ─── SOUND ─── */
  function playAlert() {
    if (!soundEnabled) return;
    const audio = document.getElementById("orderAlert");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Auto-play blocked — user must interact first; that's fine.
      });
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById("soundToggle");
    if (btn) {
      btn.textContent = soundEnabled ? "🔔 Sound ON" : "🔕 Sound OFF";
      btn.classList.toggle("sound-off", !soundEnabled);
    }
    Toast.info(soundEnabled ? "Sound notifications ON" : "Sound notifications OFF");
  }

  /* ─── FULLSCREEN ─── */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  /* ─── CLEANUP ─── */
  window.addEventListener("beforeunload", () => {
    if (dbListener && cfg && !cfg._isDemo) {
      const db = firebase.database();
      db.ref(`tenants/${cfg.tenantId}/orders`).off("value", dbListener);
    }
    clearInterval(tickerInterval);
  });

  // Init on DOM ready
  document.addEventListener("DOMContentLoaded", init);

  return { updateStatus, toggleSound, toggleFullscreen, injectDemoOrder };
})();

window.KitchenApp = KitchenApp;
