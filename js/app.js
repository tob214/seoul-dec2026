/* ==========================================================
   旅行規劃網站 · 主程式
   資料：window.TRIP_SOURCE（data/trip-data.js）→ 本機草稿 localStorage
   ========================================================== */
(function () {
  "use strict";

  // ---------- 小工具 ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const toMin = (hhmm) => { const [h, m] = String(hhmm).split(":").map(Number); return h * 60 + (m || 0); };
  const fmtHM = (min) => { min = Math.max(0, Math.round(min)); const h = Math.floor(min / 60) % 24, m = min % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };
  const fmtDur = (min) => { min = Math.round(min); if (min < 60) return `${min} 分鐘`; const h = Math.floor(min / 60), m = min % 60; return m ? `${h} 小時 ${m} 分鐘` : `${h} 小時`; };
  const snap = (min, step = 15) => Math.round(min / step) * step;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const uid = (p = "it") => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const WD = ["日", "一", "二", "三", "四", "五", "六"];
  const CAT = {
    sight: { name: "景點", color: "#F6D27A" }, food: { name: "餐飲", color: "#F2A497" },
    stay: { name: "住宿", color: "#A8D3E6" }, transit: { name: "交通", color: "#B9DAA5" }, flight: { name: "航班", color: "#B9DAA5" }
  };
  const EXP_CAT = {
    transport: { name: "交通與機票", color: "#B9DAA5", desc: "機票、機場交通、地鐵、計程車" },
    sight: { name: "景點門票", color: "#F6D27A", desc: "門票、演唱會、體驗" },
    stay: { name: "住宿", color: "#A8D3E6", desc: "酒店" },
    food: { name: "餐飲", color: "#F2A497", desc: "正餐、小食、Cafe" },
    shopping: { name: "購物與手信", color: "#DED2ED", desc: "紀念品、伴手禮、藥妝、服飾" },
    misc: { name: "其他雜費", color: "#F4C7AA", desc: "旅遊保險、網卡等" }
  };
  const itemExpCat = (it) => it.expenseCat && EXP_CAT[it.expenseCat] ? it.expenseCat : ((it.category === "transit" || it.category === "flight") ? "transport" : it.category);
  const MODE = {
    walk: { name: "步行", color: "#84909E" }, subway: { name: "地鐵", color: "#9266C2" }, train: { name: "火車", color: "#4678C5" },
    arex: { name: "機場鐵路", color: "#4678C5" }, ktx: { name: "KTX", color: "#D8902C" }, bus: { name: "巴士", color: "#3A9B80" },
    taxi: { name: "計程車", color: "#D77968" }
  };
  const BASIS = { person: "每人", vehicle: "每車", group: "全團" };
  const STATUS = { confirmed: "已確認", estimate: "估算", tbc: "待確認" };
  const CUR_SYMBOL = { KRW: "₩", SGD: "S$", HKD: "HK$", TWD: "NT$", JPY: "¥", USD: "US$", MYR: "RM" };

  // 交通小圖示（原創 16×16 平塗路徑）
  const ICON = {
    walk: '<svg viewBox="0 0 16 16"><circle cx="9" cy="2.5" r="1.8"/><path d="M8 5.2 5.3 7v3h1.5V8l1.2-.7-.8 3.7L5 15h1.8l1.6-3.2 1.4 1.4V15h1.5v-2.4l-1.7-1.8.5-2.3.9 1.2H13V8.2h-1.4L9.7 5.6z"/></svg>',
    subway: '<svg viewBox="0 0 16 16"><path d="M4 1h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2l1.5 2h-1.8L10 13H6l-1.7 2H2.5L4 13a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm0 2v4h8V3zm1 6.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>',
    bus: '<svg viewBox="0 0 16 16"><path d="M3 1h10a2 2 0 0 1 2 2v9a1 1 0 0 1-1 1v2h-2v-2H4v2H2v-2a1 1 0 0 1-1-1V3a2 2 0 0 1 2-2zm0 2v5h10V3zm1 6.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>',
    taxi: '<svg viewBox="0 0 16 16"><path d="M6 1h4v2h1.5l1.6 4H14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1v2h-2v-2H4v2H2v-2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h.9l1.6-4H6zm-.4 4-.9 2h6.6l-.9-2zM4 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>',
    train: '<svg viewBox="0 0 16 16"><path d="M5 1h6c2 0 3 1 3 3v7a2 2 0 0 1-2 2l1.5 2h-1.8L10 13H6l-1.7 2H2.5L4 13a2 2 0 0 1-2-2V4c0-2 1-3 3-3zm-1 3v3h3.4V4zm4.6 0v3H12V4zM5 9.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>',
    plane: '<svg viewBox="0 0 16 16"><path d="M15 7.2c0-.7-.6-1.2-1.3-1.2H10L6.7 1H5l1.6 5H3.4L2 4.3H.8L1.6 8 .8 11.7H2L3.4 10h3.2L5 15h1.7L10 10h3.7c.7 0 1.3-.5 1.3-1.2z"/></svg>'
  };
  ICON.arex = ICON.train; ICON.ktx = ICON.train;

  // ---------- 狀態 ----------
  const STORE_KEY = `tripplanner:${(window.TRIP_SOURCE && window.TRIP_SOURCE.meta.id) || "trip"}`;
  const UI_KEY = STORE_KEY + ":ui";
  let trip = loadTrip();
  const history = [];
  const ui = Object.assign({ page: "plan", view: "week", day: 0, showTotal: false, legFocus: null, selectedId: null, packFilter: "all", packSearch: "" }, loadUI());
  let prevDay = ui.day;

  function loadTrip() {
    try { const s = localStorage.getItem(STORE_KEY); if (s) { const t = JSON.parse(s); if (t && Array.isArray(t.items)) return normalize(t); } } catch (e) { /* 私密模式或沒有儲存空間 */ }
    return normalize(clone(window.TRIP_SOURCE));
  }
  function loadUI() { try { return JSON.parse(localStorage.getItem(UI_KEY) || "{}"); } catch (e) { return {}; } }
  function saveUI() { try { localStorage.setItem(UI_KEY, JSON.stringify({ page: ui.page, view: ui.view, day: ui.day, showTotal: ui.showTotal, packFilter: ui.packFilter, viewer: ui.viewer || null })); } catch (e) { } }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(trip)); } catch (e) { toast("無法寫入本機草稿（瀏覽器儲存空間不可用）"); } }
  function normalize(t) {
    t.meta = Object.assign({ travelers: 1, settlementCurrency: "SGD", rates: { SGD: 1 }, timezone: "Asia/Seoul" }, t.meta || {});
    t.legs = t.legs || {};
    if (!Array.isArray(t.expenses)) t.expenses = clone((window.TRIP_SOURCE && window.TRIP_SOURCE.expenses) || []);
    t.expenses.forEach(e => { e.cost = Object.assign({ amount: null, currency: "KRW", basis: "person", status: "tbc" }, e.cost || {}); if (!EXP_CAT[e.cat]) e.cat = "misc"; });
    if (!Array.isArray(t.meta.members) || !t.meta.members.length) {
      const n = Math.max(1, Number(t.meta.travelers) || 1);
      t.meta.members = Array.from({ length: n }, (_, i) => ({ id: `m${i + 1}`, name: i === 0 ? "Tobey" : `團員 ${i + 1}` }));
    }
    t.meta.travelers = t.meta.members.length;
    t.packing = t.packing || { categories: [], items: [] };
    const src = {}; ((window.TRIP_SOURCE && window.TRIP_SOURCE.items) || []).forEach(i => { src[i.id] = i; });
    t.items.forEach(it => {
      if (!it.naverQuery && src[it.id] && src[it.id].naverQuery) it.naverQuery = src[it.id].naverQuery; // 舊草稿補上新欄位
      if (it.expenseCat === undefined && src[it.id] && src[it.id].expenseCat) it.expenseCat = src[it.id].expenseCat;
      it.cost = Object.assign({ amount: null, currency: "KRW", basis: "person", status: "tbc" }, it.cost || {});
      it.duration = Number(it.duration) || 60;
      it.locked = !!it.locked;
    });
    return t;
  }
  // ---------- 實體（雲端同步與復原的最小單位） ----------
  // 旅程拆成：meta、items{id}、legs{key}、expenses{id}、packCats{id}、packItems{id}、root{其他頂層欄位}。
  // 有次序的陣列（expenses、packing）以 _o 記錄位置。
  const KNOWN_TOP = ["meta", "items", "legs", "expenses", "packing"];
  function stable(v) {
    if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
    if (v && typeof v === "object") return `{${Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`;
    return JSON.stringify(v === undefined ? null : v);
  }
  function toEntities(t) {
    const byId = (arr, ordered) => { const o = {}; (arr || []).forEach((x, i) => { if (x && x.id != null) o[x.id] = ordered ? Object.assign({}, clone(x), { _o: i }) : clone(x); }); return o; };
    const root = {}; Object.keys(t).forEach(k => { if (!KNOWN_TOP.includes(k)) root[k] = clone(t[k]); });
    const pk = t.packing || {};
    const packRoot = {}; Object.keys(pk).forEach(k => { if (k !== "categories" && k !== "items") packRoot[k] = clone(pk[k]); });
    if (Object.keys(packRoot).length) root.__packing = packRoot;
    return { meta: clone(t.meta || {}), items: byId(t.items), legs: clone(t.legs || {}), expenses: byId(t.expenses, true), packCats: byId(pk.categories, true), packItems: byId(pk.items, true), root };
  }
  function fromEntities(e) {
    const list = (o) => Object.values(o || {}).map(clone).sort((a, b) => (a._o ?? 0) - (b._o ?? 0) || String(a.id).localeCompare(String(b.id))).map(x => { delete x._o; return x; });
    const root = clone(e.root || {}); const packRoot = root.__packing || {}; delete root.__packing;
    const t = Object.assign(root, { meta: clone(e.meta || {}), items: list(e.items).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start) || String(a.id).localeCompare(String(b.id))), legs: clone(e.legs || {}), expenses: list(e.expenses), packing: Object.assign(packRoot, { categories: list(e.packCats), items: list(e.packItems) }) });
    return t;
  }
  const COLLS = ["items", "legs", "expenses", "packCats", "packItems", "root"];
  /** 比較兩組實體，回傳改動：[{ coll, key, value }]，value === null 代表刪除；meta 的 key 為 null */
  function diffEntities(a, b) {
    const ops = [];
    if (stable(a.meta) !== stable(b.meta)) ops.push({ coll: "meta", key: null, value: clone(b.meta) });
    COLLS.forEach(c => {
      const A = a[c] || {}, B = b[c] || {};
      new Set([...Object.keys(A), ...Object.keys(B)]).forEach(k => {
        if (!(k in B)) ops.push({ coll: c, key: k, value: null });
        else if (!(k in A) || stable(A[k]) !== stable(B[k])) ops.push({ coll: c, key: k, value: clone(B[k]) });
      });
    });
    return ops;
  }
  function inverseOps(before, ops) {
    return ops.map(op => op.coll === "meta" ? { coll: "meta", key: null, value: clone(before.meta) } : { coll: op.coll, key: op.key, value: op.key in (before[op.coll] || {}) ? clone(before[op.coll][op.key]) : null });
  }
  function applyOps(ent, ops) {
    ops.forEach(op => {
      if (op.coll === "meta") { ent.meta = clone(op.value); return; }
      ent[op.coll] = ent[op.coll] || {};
      if (op.value === null) delete ent[op.coll][op.key]; else ent[op.coll][op.key] = clone(op.value);
    });
    return ent;
  }

  // ---------- 雲端同步（data/firebase-config.js 有設定時啟用；js/sync.js 負責連線） ----------
  const CLOUD_ON = !!(window.FIREBASE_CONFIG && (window.FIREBASE_CONFIG.projectId || window.FIREBASE_CONFIG.mock));
  const cloud = { on: CLOUD_ON, api: null, user: null, ready: false, localOnly: false, status: CLOUD_ON ? "loading" : "off", pending: null, firstLoad: true };
  const cloudActive = () => cloud.on && cloud.ready && !cloud.localOnly && cloud.api;
  /** 正在拖移、調時長或開著表單時，暫緩套用對方的更新 */
  const isBusy = () => (dlg() && dlg().open) || !!document.querySelector(".wcard.dragging, .wcard.holding") || resizing;
  let resizing = false;

  /** 所有資料變更都經過 commit：可復原、存草稿、上傳雲端、重繪 */
  function commit(mutator, message) {
    const before = toEntities(trip);
    mutator(trip);
    trip = normalize(trip);
    const ops = diffEntities(before, toEntities(trip));
    if (ops.length) {
      history.push(inverseOps(before, ops));
      if (history.length > 80) history.shift();
      pushCloud(ops);
    }
    save();
    renderAll();
    if (message) toast(message);
  }
  function undo() {
    if (!history.length) { toast("沒有可復原的操作"); return; }
    const inv = history.pop();
    const ent = applyOps(toEntities(trip), inv);
    trip = normalize(fromEntities(ent));
    pushCloud(inv);
    save(); renderAll(); toast("已復原上一步");
  }
  function pushCloud(ops) {
    if (!cloudActive() || !ops.length) return;
    cloud.api.write(ops).catch(err => { setCloudStatus("error", err && err.message); toast(`雲端寫入失敗：${(err && err.message) || err}`); });
  }

  /** sync.js 收到雲端資料時呼叫（包括自己剛寫入的回聲） */
  function receiveRemote(ent) {
    cloud.pending = ent;
    if (cloud.firstLoad) { flushRemote(); return; }
    if (isBusy()) {
      const editing = dlg() && dlg().open && dlg().dataset.editId;
      if (editing && cloud.pending.items && stable(cloud.pending.items[editing]) !== stable(toEntities(trip).items[editing])) toast("同伴剛更新了這個行程；你儲存的話會以你的版本為準");
      return;
    }
    flushRemote();
  }
  function flushRemote() {
    const ent = cloud.pending; if (!ent) return;
    cloud.pending = null;
    const next = normalize(fromEntities(clone(ent)));
    const changed = diffEntities(toEntities(trip), toEntities(next));
    const first = cloud.firstLoad;
    cloud.firstLoad = false;
    if (!changed.length && !first) return;
    trip = next;
    if (first) history.length = 0; // 本機草稿的復原紀錄不適用於雲端版本
    save();
    if (getDays().length && ui.day >= getDays().length) ui.day = 0;
    renderAll();
    if (first && ui.page === "plan") renderMap(true);
    if (!first) {
      const n = changed.length;
      toast(`已同步同伴的更新（${n} 項）`);
    }
  }
  function maybeFlushRemote() { if (cloud.pending && !isBusy()) flushRemote(); }
  function setCloudStatus(status, detail) {
    cloud.status = status; cloud.detail = detail || "";
    renderSyncPill(); renderGate();
  }
  function renderSyncPill() {
    const p = $("#syncpill"); if (!p) return;
    if (!cloud.on) { p.hidden = true; return; }
    const map = {
      loading: ["連線中…", "busy"], signedout: ["未登入", "warn"], denied: ["沒有權限", "warn"], empty: ["雲端未有資料", "warn"],
      synced: ["已同步", "ok"], saving: ["同步中…", "busy"], offline: ["離線，稍後同步", "warn"], error: ["同步出錯", "warn"], local: ["本機模式", "warn"]
    };
    const [label, kind] = map[cloud.localOnly ? "local" : cloud.status] || ["", ""];
    p.hidden = false; p.className = `syncpill ${kind}`; p.textContent = label;
    p.title = cloud.user ? `已登入：${cloud.user.email}` : label;
  }
  function renderGate() {
    const g = $("#cloudgate"); if (!g) return;
    const hide = !cloud.on || cloud.localOnly || (cloud.ready && ["synced", "saving", "offline", "error"].includes(cloud.status));
    g.hidden = hide; document.body.classList.toggle("gated", !hide);
    if (hide) return;
    const hasLocal = trip.items.length > 0;
    const localBtn = hasLocal ? `<button type="button" class="btn" data-gate="local">暫時只用本機草稿</button>` : "";
    const email = cloud.user ? esc(cloud.user.email) : "";
    const body = {
      loading: `<p>正在連線雲端…</p>${localBtn ? `<div class="gatebtns">${localBtn}</div>` : ""}`,
      signedout: `<p>這個旅程只限團員查看和編輯，請用 Google 帳戶登入。</p><div class="gatebtns"><button type="button" class="btn primary" data-gate="signin">用 Google 登入</button>${localBtn}</div>`,
      denied: `<p>帳戶 <b>${email}</b> 沒有權限查看這個旅程。</p><div class="gatebtns"><button type="button" class="btn" data-gate="signout">換帳戶登入</button>${localBtn}</div>`,
      empty: hasLocal
        ? `<p>雲端還沒有這個旅程的資料。要把這部裝置上的資料（${trip.items.length} 個項目）上傳作為共用版本嗎？</p><div class="gatebtns"><button type="button" class="btn primary" data-gate="seed">上傳到雲端</button><button type="button" class="btn" data-gate="signout">登出</button></div>`
        : `<p>雲端還沒有這個旅程的資料，這部裝置也沒有資料可上傳。請先在本機版（localhost）登入並上傳。</p><div class="gatebtns"><button type="button" class="btn" data-gate="signout">登出</button></div>`,
      error: `<p>連線失敗：${esc(cloud.detail)}</p><div class="gatebtns"><button type="button" class="btn primary" data-gate="retry">重試</button>${localBtn}</div>`
    }[cloud.status] || `<p>${esc(cloud.detail || cloud.status)}</p>`;
    g.innerHTML = `<div class="gatecard frame"><h2>${esc(trip.meta.name || "旅行規劃")}</h2>${body}${cloud.detail && cloud.status !== "error" ? `<p class="gatedetail">${esc(cloud.detail)}</p>` : ""}</div>`;
  }
  function onGateClick(e) {
    const b = e.target.closest("[data-gate]"); if (!b) return;
    const act = b.dataset.gate;
    if (act === "local") { cloud.localOnly = true; renderSyncPill(); renderGate(); renderAll(); toast("本機模式：修改只存在這部裝置，不會同步"); return; }
    if (!cloud.api) { toast("雲端模組未載入"); return; }
    if (act === "signin") cloud.api.signIn().catch(err => { cloud.detail = (err && (err.code || err.message)) || String(err); renderGate(); });
    if (act === "signout") cloud.api.signOut();
    if (act === "retry") location.reload();
    if (act === "seed") { b.disabled = true; cloud.api.seed(toEntities(trip)).catch(err => { b.disabled = false; setCloudStatus("error", err && err.message); }); }
  }
  function openAccount() {
    if (!cloud.on) return;
    if (cloud.localOnly) { confirmDialog("本機模式", "目前只用這部裝置的草稿，修改不會同步。重新整理頁面即可再次連線雲端。", "重新整理", () => location.reload()); return; }
    if (!cloud.user) return;
    confirmDialog("雲端同步", `已登入：${cloud.user.email}。修改會即時同步給所有團員。`, "登出", () => cloud.api && cloud.api.signOut());
  }

  // ---------- 衍生資料 ----------
  function dateAdd(ymd, n) { const d = new Date(ymd + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function getDays() {
    let start = trip.meta.startDate, end = trip.meta.endDate;
    trip.items.forEach(it => { if (!start || it.date < start) start = it.date; if (!end || it.date > end) end = it.date; });
    const days = [];
    for (let d = start; d <= end && days.length < 60; d = dateAdd(d, 1)) days.push(d);
    return days;
  }
  const dayItems = (date) => trip.items.filter(i => i.date === date).sort((a, b) => toMin(a.start) - toMin(b.start) || a.id.localeCompare(b.id));
  const itemById = (id) => trip.items.find(i => i.id === id);
  const wdOf = (ymd) => WD[new Date(ymd + "T00:00:00Z").getUTCDay()];
  const dm = (ymd) => `${Number(ymd.slice(8))}/${Number(ymd.slice(5, 7))}`;

  function km(a, b) {
    if (a.lat == null || b.lat == null) return null;
    const R = 6371, r = Math.PI / 180;
    const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  /** 依直線距離估算交通（僅作預設，標記 auto/估算） */
  function estimateLeg(a, b) {
    const d = km(a, b);
    const base = { auto: true, manual: false, note: "程式依直線距離估算", cost: { amount: 0, currency: "KRW", basis: "person", status: "estimate" } };
    if (d == null) return Object.assign(base, { mode: "walk", minutes: 15, segments: [{ mode: "walk", minutes: 15, label: "缺座標，暫估" }], note: "缺少座標，請手動填寫" });
    if (d < 0.08) return Object.assign(base, { mode: "walk", minutes: 0, segments: [], same: true });
    if (d <= 1.2) { const m = Math.max(3, Math.round(d * 1.3 / 4.5 * 60)); return Object.assign(base, { mode: "walk", minutes: m, segments: [{ mode: "walk", minutes: m, label: "步行" }] }); }
    if (d <= 30) {
      const ride = Math.round(d * 1.3 / 28 * 60) + 4;
      return Object.assign(base, { mode: "subway", minutes: ride + 10, segments: [{ mode: "walk", minutes: 5, label: "步行到站" }, { mode: "subway", minutes: ride, label: "地鐵（含候車）" }, { mode: "walk", minutes: 5, label: "步行" }], cost: { amount: 1550, currency: "KRW", basis: "person", status: "estimate" } });
    }
    const ride = Math.round(d / 45 * 60);
    return Object.assign(base, { mode: "arex", minutes: ride + 10, segments: [{ mode: "walk", minutes: 5, label: "步行到站" }, { mode: "arex", minutes: ride, label: "機場鐵路" }, { mode: "walk", minutes: 5, label: "步行" }], cost: { amount: 4450, currency: "KRW", basis: "person", status: "estimate" } });
  }
  const legMainMode = (leg) => { const s = (leg.segments || []).find(x => x.mode !== "walk"); return s ? s.mode : (leg.mode || "walk"); };

  /** 一天的路段，含由住宿出發的第一段 */
  function dayLegs(date, dayIndex) {
    const items = dayItems(date);
    const out = [];
    const stay = itemById(trip.meta.stayId);
    if (items.length && dayIndex > 0 && stay && items[0].category !== "flight") {
      const first = items[0];
      const key = `@stay>${first.id}`;
      const stayPt = { id: "@stay", name: "酒店", lat: stay.lat, lng: stay.lng };
      const leg = trip.legs[key] || estimateLeg(stayPt, first);
      if (!leg.same && (km(stayPt, first) ?? 1) >= 0.08) {
        const arrive = toMin(first.start);
        out.push({ key, from: stayPt, to: first, leg, depart: arrive - leg.minutes, arrive, late: 0, overlap: false, implicit: true });
      }
    }
    for (let i = 0; i < items.length - 1; i++) {
      const a = items[i], b = items[i + 1];
      const key = `${a.id}>${b.id}`;
      const leg = trip.legs[key] || estimateLeg(a, b);
      const aEnd = toMin(a.start) + a.duration;
      const depart = aEnd, arrive = aEnd + (leg.minutes || 0);
      const bStart = toMin(b.start);
      out.push({ key, from: a, to: b, leg, depart, arrive, overlap: aEnd > bStart, late: Math.max(0, arrive - bStart) });
    }
    return out;
  }
  function dayWarnings(date, idx) { return dayLegs(date, idx).filter(l => !l.implicit && (l.late > 0 || l.overlap)); }

  // ---------- 費用 ----------
  function rateOf(cur) {
    const m = trip.meta; if (cur === m.settlementCurrency) return 1;
    const r = m.rates && m.rates[cur]; return typeof r === "number" && r > 0 ? r : null;
  }
  const members = () => trip.meta.members;
  const memberName = (id) => (members().find(m => m.id === id) || {}).name;
  /** 參與分攤的團員；未指定（空陣列）＝全部團員，之後新增的團員也會自動加入 */
  function participantsOf(cost) {
    const ids = ((cost.pay && cost.pay.participants) || []).filter(id => memberName(id) != null);
    return ids.length ? ids : members().map(m => m.id);
  }
  function payerOf(cost) { const p = cost.pay; return p && p.mode === "payer" && memberName(p.payer) != null ? p.payer : null; }
  function payLabel(cost) {
    const parts = participantsOf(cost), all = parts.length === members().length;
    const who = all ? "" : `（${parts.map(memberName).join("、")}）`;
    const payer = payerOf(cost);
    if (payer) return `${memberName(payer)} 代付${who}`;
    return members().length > 1 ? `各付各${who}` : "";
  }
  function groupAmount(cost) {
    if (cost.amount == null || cost.amount === "") return null;
    const n = participantsOf(cost).length;
    if (cost.basis === "person") return cost.amount * n;
    if (cost.basis === "vehicle") return cost.amount * Math.ceil(n / 4);
    return Number(cost.amount);
  }
  function expenseLines() {
    const lines = [];
    trip.items.forEach(it => lines.push({ id: it.id, kind: "item", cat: itemExpCat(it), name: it.name, date: it.date, cost: it.cost }));
    trip.expenses.forEach(e => lines.push({ id: e.id, kind: "expense", cat: e.cat, name: e.name, date: e.date || null, cost: e.cost }));
    getDays().forEach((d, i) => dayLegs(d, i).forEach(l => {
      if (l.leg.same || !l.leg.minutes) return;
      lines.push({ id: l.key, kind: "leg", cat: "transport", name: `${l.from.name} → ${l.to.name}`, date: d, cost: l.leg.cost || { amount: null, currency: "KRW", basis: "person", status: "tbc" }, auto: !!l.leg.auto });
    }));
    lines.forEach(L => {
      L.group = groupAmount(L.cost);
      const r = rateOf(L.cost.currency);
      L.converted = L.group == null || r == null ? null : L.group * r;
    });
    return lines;
  }
  /** 目前查看的旅客（null＝全團） */
  const currentViewer = () => (ui.viewer && memberName(ui.viewer) != null ? ui.viewer : null);
  /** 依查看對象調整：選了旅客時，只留他參與的項目，金額改為他分攤的份額 */
  function viewLines() {
    const lines = expenseLines(), v = currentViewer();
    if (!v) return lines;
    return lines.filter(L => participantsOf(L.cost).includes(v)).map(L => {
      const n = participantsOf(L.cost).length;
      return Object.assign({}, L, { group: L.group == null ? null : L.group / n, converted: L.converted == null ? null : L.converted / n, personal: true });
    });
  }
  const viewerLabel = () => currentViewer() ? `${memberName(currentViewer())} 個人` : "全團";
  function expenseSummary() {
    const lines = viewLines();
    const byCur = {}, byCat = Object.fromEntries(Object.keys(EXP_CAT).map(k => [k, 0]));
    let grand = 0, pending = 0, est = 0, noRate = new Set();
    lines.forEach(L => {
      if (L.group == null) { pending++; return; }
      byCur[L.cost.currency] = (byCur[L.cost.currency] || 0) + L.group;
      if (L.converted == null) { noRate.add(L.cost.currency); return; }
      byCat[L.cat] = (byCat[L.cat] || 0) + L.converted;
      grand += L.converted; // 先逐項換算，再合計，最後顯示時取整
      if (L.cost.status !== "confirmed") est++;
    });
    return { lines, byCur, byCat, grand, pending, est, noRate: [...noRate] };
  }
  /** 結算：已付（代付人付全額；各付各＝各自付自己那份）− 應付（平均分攤） */
  function settlement() {
    const bal = {}; members().forEach(m => { bal[m.id] = { paid: 0, share: 0 }; });
    expenseLines().forEach(L => {
      if (L.converted == null) return;
      const parts = participantsOf(L.cost), share = L.converted / parts.length, payer = payerOf(L.cost);
      parts.forEach(p => { bal[p].share += share; if (!payer) bal[p].paid += share; });
      if (payer) bal[payer].paid += L.converted;
    });
    const rows = members().map(m => ({ id: m.id, name: m.name, paid: bal[m.id].paid, share: bal[m.id].share, net: bal[m.id].paid - bal[m.id].share }));
    // 最少轉帳：欠最多的付給應收最多的（先取整到分）
    const cr = rows.filter(r => r.net > 0.005).map(r => ({ ...r, left: Math.round(r.net * 100) })).sort((a, b) => b.left - a.left);
    const db = rows.filter(r => r.net < -0.005).map(r => ({ ...r, left: Math.round(-r.net * 100) })).sort((a, b) => b.left - a.left);
    const transfers = []; let i = 0, j = 0;
    while (i < db.length && j < cr.length) {
      const x = Math.min(db[i].left, cr[j].left);
      if (x > 0) transfers.push({ from: db[i].name, to: cr[j].name, amount: x / 100 });
      db[i].left -= x; cr[j].left -= x;
      if (!db[i].left) i++; if (!cr[j].left) j++;
    }
    return { rows, transfers };
  }
  function money(v, cur, digits) {
    if (v == null) return "未填";
    const d = digits ?? (cur === "KRW" || cur === "JPY" ? 0 : 2);
    const s = Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
    return `${CUR_SYMBOL[cur] || cur + " "}${s}`;
  }

  // ---------- 時區 ----------
  function nowLocalMin() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: trip.meta.timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const h = Number(parts.find(p => p.type === "hour").value), m = Number(parts.find(p => p.type === "minute").value);
    return h * 60 + m;
  }

  // ---------- 提示 ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 4000);
  }

  // ==========================================================
  // 頁首與導覽
  // ==========================================================
  const EYE_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="#3E3A39" stroke-width="2.2" stroke-linecap="round"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_SHUT = '<svg viewBox="0 0 24 24" fill="none" stroke="#3E3A39" stroke-width="2.2" stroke-linecap="round"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><path d="M4 4l16 16"/></svg>';
  function renderHeader() {
    const m = trip.meta, days = getDays();
    document.title = `${m.name} · 旅行規劃`;
    $("#brand").innerHTML = Illustrations.BRAND;
    $("#tripname").textContent = m.name;
    $("#tripsubtitle").textContent = `${m.subtitle || ""}`;
    $("#statdest").textContent = m.destination;
    $("#statdays").textContent = `${days.length} 天 ${Math.max(0, days.length - 1)} 夜 · ${dm(days[0])}–${dm(days[days.length - 1])}`;
    const places = new Set(trip.items.filter(i => i.category !== "transit").map(i => (i.address || i.name).replace(/（.*?）/g, "").trim()));
    $("#statplaces").textContent = `${places.size} 個`;
    const s = expenseSummary();
    const tot = $("#stattotal");
    $(".totalstat .label").textContent = currentViewer() ? `${memberName(currentViewer())} 的花費` : "總花費";
    tot.textContent = ui.showTotal ? `${money(s.grand, m.settlementCurrency)}${s.pending ? `（另有 ${s.pending} 項待估）` : ""}` : "••••";
    tot.classList.toggle("masked", !ui.showTotal);
    const eye = $("#eyetoggle");
    eye.innerHTML = ui.showTotal ? EYE_SHUT : EYE_OPEN;
    eye.setAttribute("aria-pressed", String(ui.showTotal));
    eye.setAttribute("aria-label", ui.showTotal ? "隱藏總花費" : "顯示總花費");
  }
  function renderNav() {
    $$("#pagenav [role=tab]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.page === ui.page)));
    $("#workspace").hidden = ui.page !== "plan";
    $("#expensespage").hidden = ui.page !== "expenses";
    $("#packingpage").hidden = ui.page !== "packing";
  }

  // ==========================================================
  // 日期站點列 + 插圖
  // ==========================================================
  let dayPicks = [];
  function renderDates(animate) {
    const days = getDays();
    ui.day = clamp(ui.day, 0, days.length - 1);
    dayPicks = Illustrations.pickAllDays(days.map(d => ({ date: d, items: dayItems(d) })));
    const host = $("#timeline-dates");
    host.innerHTML = `<div class="track" aria-hidden="true"></div>
      <div class="rider" aria-hidden="false"></div>
      <div class="stations" role="tablist" aria-label="日期" style="grid-template-columns:repeat(${days.length},1fr)">
      ${days.map((d, i) => {
        const w = dayWarnings(d, i).length;
        return `<button class="station" role="tab" data-day="${i}" aria-selected="${i === ui.day}" aria-label="第 ${i + 1} 天 ${dm(d)}（${wdOf(d)}）${dayPicks[i].title}${w ? `，${w} 個時間警告` : ""}">
          <span class="dot">${Number(d.slice(8))}</span><span class="wd">D${i + 1} · ${wdOf(d)}</span>${w ? `<span class="warncount">⚠ ${w}</span>` : ""}</button>`;
      }).join("")}</div>`;
    const ym = days[ui.day];
    $("#calmonth").textContent = `${ym.slice(0, 4)} 年 ${Number(ym.slice(5, 7))} 月`;
    placeRider(animate);
  }
  function stationX(i) {
    const st = $("#timeline-dates .stations"); const n = getDays().length;
    return st.offsetLeft + (i + 0.5) * st.clientWidth / n;
  }
  function placeRider(animate) {
    const rider = $("#timeline-dates .rider"); if (!rider) return;
    const pick = dayPicks[ui.day];
    rider.innerHTML = Illustrations.dayArtSVG(pick);
    const x = stationX(ui.day);
    rider.style.transform = `translateX(${x}px)`;
    const dot = $(`#timeline-dates .station[data-day="${ui.day}"] .dot`);
    if (animate && !reduceMotion()) {
      const px = stationX(prevDay);
      rider.animate([{ transform: `translateX(${px}px)` }, { transform: `translate(${px + (x - px) * 0.45}px,-4px)`, offset: 0.45 }, { transform: `translateX(${x}px)` }],
        { duration: 550, easing: "cubic-bezier(.3,.1,.25,1)" });
      if (dot) { dot.classList.remove("datebounce"); void dot.offsetWidth; dot.classList.add("datebounce"); }
    }
  }
  function selectDay(i) {
    if (i === ui.day) return;
    prevDay = ui.day; ui.day = i; ui.legFocus = null; ui.selectedId = null; saveUI();
    renderDates(true); renderCalendar(); renderMap(true); renderRoutes(); renderDayCosts();
  }

  // ==========================================================
  // 行事曆：週視圖
  // ==========================================================
  let calRange = { min: 8 * 60, max: 24 * 60 };
  const pxPerMin = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hour")) / 60;

  function renderCalendar() {
    const ws = $("#workspace");
    ws.classList.toggle("timelinepreview", ui.view === "day");
    $$("#calendar-viewtoggle button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === ui.view)));
    $("#undobtn").disabled = !history.length;
    if (ui.view === "day") renderDayTimeline(); else renderWeek();
  }

  function laneLayout(items) {
    const res = {}; let cluster = [], clusterEnd = -1;
    const flush = () => { const lanes = []; cluster.forEach(it => { const s = toMin(it.start); let l = lanes.findIndex(e => e <= s); if (l < 0) { l = lanes.length; lanes.push(0); } lanes[l] = s + it.duration; res[it.id] = { lane: l }; }); cluster.forEach(it => res[it.id].count = lanes.length); cluster = []; };
    items.forEach(it => { const s = toMin(it.start); if (s >= clusterEnd && cluster.length) flush(); cluster.push(it); clusterEnd = Math.max(clusterEnd, s + it.duration); });
    if (cluster.length) flush();
    return res;
  }

  function renderWeek() {
    const days = getDays();
    let mn = 24 * 60, mx = 0;
    days.forEach((d, i) => {
      dayItems(d).forEach(it => { mn = Math.min(mn, toMin(it.start)); mx = Math.max(mx, toMin(it.start) + it.duration); });
      dayLegs(d, i).forEach(l => { mn = Math.min(mn, l.depart); });
    });
    if (mn > mx) { mn = 8 * 60; mx = 22 * 60; }
    calRange = { min: Math.max(0, Math.floor(mn / 60) * 60 - 60), max: Math.min(26 * 60, Math.ceil(mx / 60) * 60 + 30) };
    const ppm = pxPerMin(), H = (calRange.max - calRange.min) * ppm;
    const y = (min) => (min - calRange.min) * ppm;

    let html = `<div class="weekgrid" style="--days:${days.length}" tabindex="-1">`;
    html += `<div class="weekhead corner"></div>`;
    days.forEach((d, i) => { html += `<div class="weekhead ${i === ui.day ? "sel" : ""}" data-day="${i}">${dm(d)}（${wdOf(d)}）</div>`; });
    html += `<div class="hourscol" style="height:${H}px">`;
    for (let m = Math.ceil(calRange.min / 60) * 60; m <= calRange.max; m += 60) html += `<span class="hourlabel" style="top:${y(m)}px">${fmtHM(m)}</span>`;
    html += `</div>`;
    days.forEach((d, di) => {
      const items = dayItems(d), lanes = laneLayout(items), legs = dayLegs(d, di);
      const flagged = {}; legs.forEach(l => { if (l.overlap) { flagged[l.from.id] = flagged[l.to.id] = "overlap"; } else if (l.late) flagged[l.to.id] = flagged[l.to.id] || "late"; });
      html += `<div class="daycol ${di === ui.day ? "sel" : ""}" data-day="${di}" data-date="${d}" style="height:${H}px">`;
      legs.forEach(l => {
        if (l.leg.same || !l.leg.minutes) return;
        const top = y(l.depart), h = Math.max(10, l.leg.minutes * ppm);
        html += `<div class="wleg ${l.late ? "late" : ""}" data-leg="${esc(l.key)}" style="top:${top}px;height:${h}px" title="${esc(MODE[legMainMode(l.leg)]?.name || "")} ${fmtDur(l.leg.minutes)}">${l.leg.minutes >= 20 ? `${esc(MODE[legMainMode(l.leg)]?.name || "")} ${l.leg.minutes}′` : ""}</div>`;
      });
      items.forEach(it => {
        const s = toMin(it.start), L = lanes[it.id];
        const w = 100 / L.count;
        const st = `top:${y(s)}px;height:${Math.max(18, it.duration * ppm - 2)}px;left:calc(${L.lane * w}% + 3px);right:auto;width:calc(${w}% - 6px)`;
        html += `<div class="wcard ${it.category} ${it.locked ? "locked" : ""} ${flagged[it.id] || ""} ${ui.selectedId === it.id ? "selected" : ""}" data-id="${esc(it.id)}" tabindex="0" role="button" aria-label="${esc(`${it.start} ${it.name}，${fmtDur(it.duration)}${it.locked ? "，已鎖定" : ""}`)}" style="${st}">
          <span class="wt">${it.start}–${fmtHM(s + it.duration)}</span><span class="wn">${esc(it.name)}</span><span class="resizer" aria-hidden="true"></span></div>`;
      });
      html += `</div>`;
    });
    html += `<div class="nowline" hidden><span></span></div></div>`;
    $("#calendar").innerHTML = html;
    bindWeek();
    updateNow();
  }

  let clickTimer = null, suppressClick = false;
  function bindWeek() {
    const grid = $("#calendar .weekgrid");
    $$(".weekhead[data-day]", grid).forEach(h => h.addEventListener("click", () => selectDay(Number(h.dataset.day))));
    $$(".wleg", grid).forEach(el => {
      el.addEventListener("click", () => focusLeg(el.dataset.leg));
      el.addEventListener("dblclick", () => openLegEditor(el.dataset.leg));
    });
    $$(".wcard", grid).forEach(card => {
      const id = card.dataset.id;
      card.addEventListener("click", (e) => {
        if (suppressClick) { suppressClick = false; return; }
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => showPreview(id, card), 230);
      });
      card.addEventListener("dblclick", () => { clearTimeout(clickTimer); hidePreview(); openItemEditor(id); });
      card.addEventListener("keydown", (e) => { if (e.key === "Enter") openItemEditor(id); if (e.key === " ") { e.preventDefault(); showPreview(id, card); } });
      card.addEventListener("pointerdown", (e) => onCardPointerDown(e, card, id));
    });
  }

  /** 按住 3 秒才拖移；未滿 3 秒放開或移動超過 6px → 維持一般點擊 */
  function onCardPointerDown(e, card, id) {
    if (e.button !== 0) return;
    const it = itemById(id); if (!it) return;
    if (e.target.classList.contains("resizer")) { startResize(e, card, it); return; }
    const sx = e.clientX, sy = e.clientY;
    let dragging = false, ghost = null, grabOffset = 0, target = null;
    card.classList.add("holding");
    const timer = setTimeout(() => {
      card.classList.remove("holding");
      if (it.locked) { card.classList.add("shake"); setTimeout(() => card.classList.remove("shake"), 320); toast("已預約時段已鎖定，請先在編輯中取消鎖定"); return; }
      dragging = true; suppressClick = true; hidePreview();
      card.classList.add("dragging");
      try { card.setPointerCapture(e.pointerId); } catch (err) { }
      if (navigator.vibrate) navigator.vibrate(20);
      grabOffset = sy - card.getBoundingClientRect().top;
      toast("拖移中：放開即可改時間或日期");
    }, 3000);
    const cancelHold = () => { clearTimeout(timer); card.classList.remove("holding"); };
    const move = (ev) => {
      if (!dragging) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) { cancelHold(); cleanup(); } return; }
      ev.preventDefault();
      const cols = $$("#calendar .daycol");
      const col = cols.find(c => { const r = c.getBoundingClientRect(); return ev.clientX >= r.left && ev.clientX <= r.right; }) || cols.find(c => c.dataset.date === it.date);
      const r = col.getBoundingClientRect();
      const min = clamp(snap(calRange.min + (ev.clientY - r.top - grabOffset) / pxPerMin()), 0, 24 * 60 - 15);
      target = { date: col.dataset.date, min };
      if (!ghost) { ghost = document.createElement("div"); ghost.className = "dropghost"; }
      if (ghost.parentNode !== col) col.appendChild(ghost);
      ghost.style.top = `${(min - calRange.min) * pxPerMin()}px`;
      ghost.style.height = `${it.duration * pxPerMin()}px`;
      ghost.textContent = fmtHM(min);
      card.style.transform = `translate(${ev.clientX - sx}px, ${ev.clientY - sy}px)`;
    };
    const up = () => {
      cancelHold();
      if (dragging && target) {
        const changed = target.date !== it.date || fmtHM(target.min) !== it.start;
        if (changed) commit(t => { const x = t.items.find(i => i.id === id); x.date = target.date; x.start = fmtHM(target.min); }, `已移到 ${dm(target.date)} ${fmtHM(target.min)}，已更新相鄰交通`);
        else renderCalendar();
      } else if (dragging) renderCalendar();
      cleanup();
    };
    function cleanup() { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); if (ghost) ghost.remove(); setTimeout(maybeFlushRemote, 0); }
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }
  function startResize(e, card, it) {
    e.preventDefault(); e.stopPropagation();
    if (it.locked) { toast("已預約時段已鎖定"); return; }
    suppressClick = true; resizing = true;
    const sy = e.clientY, orig = it.duration;
    let dur = orig;
    const move = (ev) => { dur = Math.max(15, snap(orig + (ev.clientY - sy) / pxPerMin())); card.style.height = `${dur * pxPerMin() - 2}px`; card.querySelector(".wt").textContent = `${it.start}–${fmtHM(toMin(it.start) + dur)}`; };
    const up = () => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
      setTimeout(() => { suppressClick = false; }, 50);
      resizing = false; setTimeout(maybeFlushRemote, 0);
      if (dur !== orig) commit(t => { t.items.find(i => i.id === it.id).duration = dur; }, `時長改為 ${fmtDur(dur)}`);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }

  // ---------- 預覽浮窗 ----------
  function showPreview(id, anchor) {
    const it = itemById(id); if (!it) return;
    ui.selectedId = id;
    $$(".wcard.selected").forEach(c => c.classList.remove("selected")); anchor.classList.add("selected");
    const p = $("#preview");
    const s = toMin(it.start);
    p.innerHTML = `<h3>${esc(it.name)}</h3>
      <div class="pm">${dm(it.date)}（${wdOf(it.date)}）${it.start}–${fmtHM(s + it.duration)} · ${fmtDur(it.duration)}</div>
      <div class="pm">${CAT[it.category]?.name || ""} ${it.locked ? '<span class="badge lock">🔒 已預約</span>' : ""} ${costBadge(it.cost)}</div>
      ${it.address ? `<div class="pm">📍 ${esc(it.address)}</div>` : ""}
      ${it.note ? `<div class="pm" style="margin-top:4px">${linkify(it.note)}</div>` : ""}
      <div class="pactions"><button class="btn primary" data-a="edit">編輯</button><button class="btn deskonly" data-a="map">地圖</button>${naverLink(it, "地圖", "btn")}<button class="btn" data-a="close">關閉</button></div>`;
    p.hidden = false;
    const r = anchor.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
    let left = r.right + 8; if (left + pw > innerWidth - 8) left = Math.max(8, r.left - pw - 8);
    let top = clamp(r.top, 8, innerHeight - ph - 8);
    if (innerWidth < 600) { left = (innerWidth - pw) / 2; top = clamp(r.bottom + 6, 8, innerHeight - ph - 8); }
    p.style.left = `${left}px`; p.style.top = `${top}px`;
    p.querySelector('[data-a="edit"]').onclick = () => { hidePreview(); openItemEditor(id); };
    p.querySelector('[data-a="map"]').onclick = () => { hidePreview(); highlightOnMap(id); };
    p.querySelector('[data-a="close"]').onclick = hidePreview;
    p.querySelector('[data-a="edit"]').focus({ preventScroll: true });
    highlightOnMap(id, true);
  }
  function hidePreview() { $("#preview").hidden = true; }
  /** Naver Map 搜尋連結：優先用 naverQuery（韓文名稱），否則用地址 */
  function naverUrl(it) {
    const q = (it.naverQuery || (it.address || it.name).replace(/（.*?）|\(.*?\)/g, "")).trim();
    return `https://map.naver.com/p/search/${encodeURIComponent(q)}`;
  }
  const naverLink = (it, label, cls) => `<a class="${cls} phoneonly" href="${naverUrl(it)}" target="_blank" rel="noopener" aria-label="在 Naver Map 開啟 ${esc(it.name)}">${label}</a>`;
  function linkify(s) { return esc(s).replace(/https?:\/\/[^\s）)]+/g, u => `<a href="${u}" target="_blank" rel="noopener">${u.length > 40 ? u.slice(0, 40) + "…" : u}</a>`); }
  function costBadge(c) {
    if (!c) return "";
    if (c.amount == null) return `<span class="badge tbc">金額待填</span>`;
    const cls = c.status === "confirmed" ? "ok" : c.status === "estimate" ? "est" : "tbc";
    return `<span class="badge ${cls}">${money(c.amount, c.currency)} ${BASIS[c.basis] || ""}${c.status !== "confirmed" ? " · " + STATUS[c.status] : ""}</span>`;
  }

  // ==========================================================
  // 行事曆：單日時間軸
  // ==========================================================
  let tl = null; // 目前時間軸的幾何資料
  function renderDayTimeline() {
    const days = getDays(), date = days[ui.day];
    const items = dayItems(date), legs = dayLegs(date, ui.day);
    const warns = legs.filter(l => !l.implicit && (l.late || l.overlap));
    const cal = $("#calendar");
    const prevScroll = cal.querySelector(".timeline-cards")?.scrollTop;
    const pick = dayPicks[ui.day];
    let start = items.length ? toMin(items[0].start) : 9 * 60;
    legs.forEach(l => { start = Math.min(start, l.depart); });
    let end = items.length ? Math.max(...items.map(i => toMin(i.start) + i.duration)) : 18 * 60;
    if (end <= start) end = start + 60;
    tl = { start, end };

    // 卡片列（行程 + 交通）
    const rows = [];
    const legByTo = {}; legs.forEach(l => { legByTo[l.to.id] = l; });
    items.forEach(it => {
      const l = legByTo[it.id];
      if (l && !l.leg.same && l.leg.minutes) rows.push({ type: "leg", l, min: l.depart });
      rows.push({ type: "item", it, min: toMin(it.start) });
    });

    const scaleH = () => cal.querySelector(".day-time-scale")?.clientHeight || 1;
    const frac = (m) => (m - start) / (end - start);

    cal.innerHTML = `
      <div id="timeline-intro" class="timeline-intro">
        <h3>Day ${ui.day + 1} · ${dm(date)}（${wdOf(date)}）</h3>
        <span class="meta">${pick.title} · ${items.length} 個行程 · ${fmtHM(start)}–${fmtHM(end)}</span>
        ${warns.length ? `<span class="meta warn">⚠ ${warns.length} 處可能遲到或重疊</span>` : ""}
      </div>
      ${items.length ? `<div id="timeline-list" class="timeline-list">
        <div class="day-time-scale" aria-hidden="true">
          <div class="bar"></div>
          ${items.map(it => `<div class="seg-block" style="top:${frac(toMin(it.start)) * 100}%;height:${Math.max(0.6, it.duration / (end - start) * 100)}%;background:${CAT[it.category].color}"></div>`).join("")}
          ${itemTicks(items, start, end)}
          <span class="lbl" style="top:0">${fmtHM(start)}</span>
          <span class="lbl" style="top:100%">${fmtHM(end)}</span>
          <div class="nowmark" hidden><span></span></div>
          <div class="tracker"></div>
        </div>
        <div class="timeline-cards" tabindex="0" aria-label="當日行程，可上下捲動">
          ${rows.map(r => r.type === "item" ? itemRow(r.it, legByTo[r.it.id]) : legRow(r.l)).join("")}
        </div>
      </div>` : `<div class="emptyday">這天還沒有行程。按「＋」新增。</div>`}`;

    const scroller = cal.querySelector(".timeline-cards");
    if (!scroller) return;
    tl.scroller = scroller; tl.scaleH = scaleH;
    $$(".timeline-time-row", scroller).forEach(row => {
      const id = row.dataset.id, leg = row.dataset.leg;
      row.addEventListener("dblclick", () => id ? openItemEditor(id) : openLegEditor(leg));
      row.querySelector(".timeline-card").addEventListener("keydown", e => { if (e.key === "Enter") id ? openItemEditor(id) : openLegEditor(leg); });
      row.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        const a = e.target.closest("[data-act]");
        if (a) { e.stopPropagation(); if (a.dataset.act === "edit") id ? openItemEditor(id) : openLegEditor(leg); if (a.dataset.act === "map") id ? highlightOnMap(id) : focusLeg(leg); return; }
        if (id) highlightOnMap(id, true); else focusLeg(leg);
      });
    });
    scroller.addEventListener("scroll", () => requestAnimationFrame(updateFocus), { passive: true });
    scroller.addEventListener("wheel", (e) => {
      if (e.ctrlKey) return;
      let dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? scroller.clientHeight : 1);
      const atTop = scroller.scrollTop <= 0, atEnd = scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 1;
      if ((dy < 0 && atTop) || (dy > 0 && atEnd)) return; // 讓頁面繼續捲動
      e.preventDefault();
      scroller.scrollTop += clamp(dy, -32, 32);
    }, { passive: false });
    if (prevScroll != null && ui._keepScroll) scroller.scrollTop = prevScroll; else scroller.scrollTop = 0;
    ui._keepScroll = false;
    updateFocus();
    updateNow();
  }
  /** 每項行程的開始及完結時間刻度；太擠時優先保留開始時間，其餘只畫刻度 */
  function itemTicks(items, start, end) {
    const H = innerHeight * 0.4, span = end - start, GAP = 13;
    const cand = new Map(); // 分鐘 → 優先度（開始 1、完結 2）
    items.forEach(it => {
      const s = toMin(it.start), e = s + it.duration;
      cand.set(s, Math.min(cand.get(s) ?? 9, 1));
      cand.set(e, Math.min(cand.get(e) ?? 9, 2));
    });
    const y = (m) => (m - start) / span * H;
    const placed = [start, end]; // 起訖由 .lbl 顯示
    let out = "";
    [...cand.entries()].sort((a, b) => a[1] - b[1] || a[0] - b[0]).forEach(([m]) => {
      const f = (m - start) / span;
      if (m === start || m === end) return;
      out += `<div class="tick" style="top:${f * 100}%"></div>`;
      if (placed.every(p => Math.abs(y(p) - y(m)) >= GAP)) { placed.push(m); out += `<span class="ticklbl" style="top:${f * 100}%">${fmtHM(m)}</span>`; }
    });
    return out;
  }
  function itemRow(it, legIn) {
    const s = toMin(it.start);
    const late = legIn && !legIn.implicit && (legIn.late || legIn.overlap);
    return `<div class="timeline-time-row" data-id="${esc(it.id)}" data-min="${s}">
      <div class="tt">${it.start}</div>
      <div class="timeline-card ${it.category}" tabindex="0" role="button" aria-label="${esc(`${it.start} ${it.name}`)}">
        <div class="cn">${esc(it.name)} ${it.locked ? '<span class="badge lock">🔒 已預約</span>' : ""}</div>
        <div class="cm">${it.start}–${fmtHM(s + it.duration)} · ${fmtDur(it.duration)} · ${CAT[it.category].name} ${costBadge(it.cost)}</div>
        ${late ? `<div class="cm warn">⚠ ${legIn.overlap ? "與上一個行程時間重疊" : `可能遲到約 ${legIn.late} 分鐘`}</div>` : ""}
        ${it.address ? `<div class="cm">📍 ${esc(it.address)}</div>` : ""}
        ${it.note ? `<div class="cnote">${linkify(it.note)}</div>` : ""}
        <div class="cactions"><button data-act="edit" type="button">編輯</button><button data-act="map" type="button" class="deskonly">地圖</button>${naverLink(it, "地圖", "")}</div>
      </div></div>`;
  }
  function segChips(leg) {
    return (leg.segments || []).map(s => `<span class="seg" style="background:${MODE[s.mode]?.color || "#888"}" title="${esc(s.label || "")}">${ICON[s.mode] || ""}${s.minutes}′</span>`).join("");
  }
  function legRow(l) {
    const walkOnly = (l.leg.segments || []).every(s => s.mode === "walk");
    const c = l.leg.cost;
    return `<div class="timeline-time-row transitrow" data-leg="${esc(l.key)}" data-min="${l.depart}">
      <div class="tt">${fmtHM(l.depart)}</div>
      <div class="timeline-card transitcard ${walkOnly ? "walk" : "transit"}" tabindex="0" role="button" aria-label="${esc(`交通 ${l.from.name} 到 ${l.to.name}，${fmtDur(l.leg.minutes)}`)}">
        ${walkOnly ? `<div class="cn">${ICON.walk.replace("<svg", '<svg width="14" height="14" fill="#3E3A39"')} 步行 ${fmtDur(l.leg.minutes)} ${l.leg.auto ? '<span class="badge est">估算</span>' : ""}</div>
          <div class="cm">${esc(l.from.name)} → ${esc(l.to.name)}</div>`
        : `<div class="cm">${esc(l.from.name)} → ${esc(l.to.name)}</div>
          <div class="segs">${segChips(l.leg)}</div>
          <div class="cm">共 ${fmtDur(l.leg.minutes)} · ${c && c.amount != null ? money(c.amount, c.currency) + " " + BASIS[c.basis] : "車費待填"} ${l.leg.auto ? '<span class="badge est">估算</span>' : c && c.status !== "confirmed" ? `<span class="badge ${c.status === "tbc" ? "tbc" : "est"}">${STATUS[c.status]}</span>` : ""}</div>`}
        ${l.late && !l.implicit ? `<div class="cm warn">⚠ 抵達 ${fmtHM(l.arrive)}，晚了 ${l.late} 分鐘</div>` : ""}
        <div class="cactions"><button data-act="edit" type="button">編輯交通</button><button data-act="map" type="button" class="deskonly">路線</button>${l.to.lat != null ? naverLink(l.to, "Naver 地圖", "") : ""}</div>
      </div></div>`;
  }
  /** 焦點列：最接近可視中央；捲到兩端時指向起訖 */
  function updateFocus() {
    if (!tl || !tl.scroller || !tl.scroller.isConnected) return;
    const sc = tl.scroller, rows = $$(".timeline-time-row", sc);
    if (!rows.length) return;
    const rect = sc.getBoundingClientRect(), mid = rect.top + rect.height / 2;
    const atTop = sc.scrollTop <= 1, atEnd = sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 1;
    let focus;
    if (atTop) focus = rows[0];
    else if (atEnd) focus = rows[rows.length - 1];
    else {
      let best = Infinity;
      rows.forEach(r => { const b = r.getBoundingClientRect(); const d = Math.abs(b.top + b.height / 2 - mid); if (d < best) { best = d; focus = r; } });
    }
    const fb = focus.getBoundingClientRect(), fc = fb.top + fb.height / 2;
    rows.forEach(r => {
      const b = r.getBoundingClientRect(), c = b.top + b.height / 2;
      const d = r === focus ? 0 : Math.min(1, Math.abs(c - fc) / (rect.height * 0.55));
      r.style.setProperty("--fade", d.toFixed(3));
      r.classList.toggle("timeline-current", r === focus);
      r.classList.toggle("above", c < fc); r.classList.toggle("below", c > fc);
    });
    const tracker = $("#calendar .tracker"), H = tl.scaleH();
    let top;
    if (atTop) top = 0; else if (atEnd) top = H;
    else top = clamp((Number(focus.dataset.min) - tl.start) / (tl.end - tl.start), 0, 1) * H;
    if (tracker) tracker.style.top = `${top}px`;
  }

  // ---------- 目前時間紅線（每 15 秒，依旅程時區，只比對當地時分） ----------
  function updateNow() {
    const now = nowLocalMin(), label = fmtHM(now);
    const nl = $("#calendar .nowline");
    if (nl) {
      const inRange = now >= calRange.min && now <= calRange.max;
      nl.hidden = !inRange;
      if (inRange) { const head = $("#calendar .weekhead")?.offsetHeight || 0; nl.style.top = `${head + (now - calRange.min) * pxPerMin()}px`; nl.querySelector("span").textContent = label; }
    }
    const nm = $("#calendar .nowmark");
    if (nm && tl) {
      const inRange = now >= tl.start && now <= tl.end;
      nm.hidden = !inRange;
      if (inRange) { nm.style.top = `${(now - tl.start) / (tl.end - tl.start) * 100}%`; nm.querySelector("span").textContent = label; }
    }
  }

  // ==========================================================
  // 地圖
  // ==========================================================
  let map = null, mapLayer = null, mapFailed = false, tileErrors = 0, markerRefs = {};
  let leafletCssOk = null;
  function hasLeaflet() {
    if (mapFailed || typeof window.L === "undefined") return false;
    if (leafletCssOk === null) { // 樣式表被封鎖（例如沙盒預覽）時改用示意圖
      const t = document.createElement("div"); t.className = "leaflet-pane"; document.body.appendChild(t);
      leafletCssOk = getComputedStyle(t).position === "absolute"; t.remove();
    }
    return leafletCssOk;
  }
  function dayPoints() {
    const date = getDays()[ui.day];
    const items = dayItems(date).filter(i => i.lat != null);
    const legs = dayLegs(date, ui.day).filter(l => !l.leg.same && l.from.lat != null && l.to.lat != null);
    return { date, items, legs };
  }
  function renderMap(refit) {
    const { items, legs } = dayPoints();
    $("#previewroute").classList.toggle("active", ui.legFocus != null);
    $("#fit").classList.toggle("active", ui.legFocus == null);
    // 外部地圖連結（API 或底圖不可用時仍可用）
    const pts = items.map(i => `${i.lat},${i.lng}`);
    const uniq = pts.filter((p, i) => p !== pts[i - 1]);
    $("#maplinks").innerHTML = uniq.length ? `<a href="https://www.google.com/maps/dir/${uniq.slice(0, 10).join("/")}" target="_blank" rel="noopener">在 Google 地圖開啟當日路線 ↗</a><a href="https://map.naver.com/" target="_blank" rel="noopener">Naver Map ↗</a><span class="hint">座標與路線為估算</span>` : "";
    if (hasLeaflet()) return renderLeaflet(items, legs, refit);
    renderSchematic(items, legs);
  }
  function renderLeaflet(items, legs, refit) {
    if (!map) {
      map = L.map("map", { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
      const tiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 19, attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
      tiles.on("tileerror", () => { if (++tileErrors > 6 && !mapFailed) { mapFailed = true; map.remove(); map = null; $("#map").innerHTML = ""; renderMap(true); toast("底圖無法載入，已改用示意圖"); } });
      map.setView([37.5665, 126.978], 12);
    }
    if (mapLayer) mapLayer.remove();
    mapLayer = L.layerGroup().addTo(map); markerRefs = {};
    const focusKey = ui.legFocus != null ? legs[ui.legFocus]?.key : null;
    legs.forEach(l => {
      const mode = legMainMode(l.leg);
      const line = L.polyline([[l.from.lat, l.from.lng], [l.to.lat, l.to.lng]], { color: MODE[mode]?.color || "#888", weight: l.key === focusKey ? 7 : 4, opacity: focusKey && l.key !== focusKey ? .35 : .9, dashArray: l.leg.auto ? "6 8" : null, lineCap: "round" }).addTo(mapLayer);
      line.bindTooltip(`${MODE[mode]?.name || ""} ${fmtDur(l.leg.minutes)}`);
      line.on("click", () => focusLeg(l.key));
    });
    const seen = {};
    items.forEach((it, i) => {
      const k = `${it.lat},${it.lng}`; const n = (seen[k] = (seen[k] || []).concat(i + 1));
      const icon = L.divIcon({ className: "", html: `<div class="mapmarker ${ui.selectedId === it.id ? "sel" : ""}">${n.join("·")}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });
      const m = L.marker([it.lat, it.lng], { icon, title: it.name, keyboard: true }).addTo(mapLayer);
      m.bindPopup(`<b>${esc(it.start)} ${esc(it.name)}</b><br>${esc(it.address || "")}`);
      markerRefs[it.id] = m;
    });
    if (refit) fitMap(items, legs);
  }
  function fitMap(items, legs) {
    if (!map) return;
    let pts = items.map(i => [i.lat, i.lng]);
    if (ui.legFocus != null && legs[ui.legFocus]) { const l = legs[ui.legFocus]; pts = [[l.from.lat, l.from.lng], [l.to.lat, l.to.lng]]; }
    if (!pts.length) return;
    setTimeout(() => { map.invalidateSize(); map.fitBounds(L.latLngBounds(pts).pad(0.25), { maxZoom: 15, animate: !reduceMotion() }); }, 30);
  }
  function renderSchematic(items, legs) {
    const box = $("#map"); const W = 400, H = 300, P = 30;
    const all = items.concat(legs.map(l => l.from));
    if (!all.length) { box.innerHTML = `<div class="emptyday">沒有座標</div>`; return; }
    let pts = all;
    if (ui.legFocus != null && legs[ui.legFocus]) pts = [legs[ui.legFocus].from, legs[ui.legFocus].to];
    const lats = pts.map(p => p.lat), lngs = pts.map(p => p.lng);
    let minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const kx = Math.cos(37.5 * Math.PI / 180);
    let spanX = (maxLng - minLng) * kx || 0.01, spanY = (maxLat - minLat) || 0.01;
    const s = Math.min((W - 2 * P) / spanX, (H - 2 * P) / spanY);
    const cx = (minLng + maxLng) / 2, cy = (minLat + maxLat) / 2;
    const X = (lng) => W / 2 + (lng - cx) * kx * s, Y = (lat) => H / 2 - (lat - cy) * s;
    const focusKey = ui.legFocus != null ? legs[ui.legFocus]?.key : null;
    // 漢江（極度簡化示意）
    const han = [[37.5585, 126.88], [37.548, 126.93], [37.515, 126.99], [37.523, 127.02], [37.532, 127.06], [37.535, 127.11]];
    let svg = `<svg class="schematic" viewBox="0 0 ${W} ${H}" role="img" aria-label="當日路線示意圖">
      <rect width="${W}" height="${H}" fill="#F1F1EF"/>
      <path class="water" d="M${han.map(p => `${X(p[1]).toFixed(1)} ${Y(p[0]).toFixed(1)}`).join(" L")}" stroke="#A8D3E6" stroke-width="${clamp(s * 0.006, 4, 40)}" fill="none" stroke-linecap="round" opacity=".9"/>`;
    legs.forEach(l => {
      const mode = legMainMode(l.leg);
      svg += `<line x1="${X(l.from.lng)}" y1="${Y(l.from.lat)}" x2="${X(l.to.lng)}" y2="${Y(l.to.lat)}" stroke="${MODE[mode]?.color}" stroke-width="${l.key === focusKey ? 6 : 3.5}" stroke-linecap="round" ${l.leg.auto ? 'stroke-dasharray="6 7"' : ""} opacity="${focusKey && l.key !== focusKey ? .3 : .9}"><title>${esc(MODE[mode]?.name)} ${fmtDur(l.leg.minutes)}</title></line>`;
    });
    const seen = {};
    items.forEach((it, i) => {
      const k = `${it.lat},${it.lng}`; seen[k] = (seen[k] || []).concat(i + 1);
    });
    Object.entries(seen).forEach(([k, nums]) => {
      const [la, ln] = k.split(",").map(Number); const it = items[nums[0] - 1];
      const sel = items.some(x => x.id === ui.selectedId && `${x.lat},${x.lng}` === k);
      svg += `<g><circle cx="${X(ln)}" cy="${Y(la)}" r="${sel ? 15 : 13}" fill="#fff" stroke="${sel ? "#3E3A39" : "#555555"}" stroke-width="${sel ? 3 : 2}"/><text x="${X(ln)}" y="${Y(la) + 4}" font-size="11" text-anchor="middle" fill="#3E3A39">${nums.join("·")}</text><title>${esc(it.name)}</title></g>`;
    });
    svg += `</svg><span class="mapnote">離線示意圖（底圖服務未載入）· 直線為估算</span>`;
    box.innerHTML = svg;
  }
  function highlightOnMap(id, quiet) {
    ui.selectedId = id;
    const it = itemById(id);
    if (it && it.date !== getDays()[ui.day]) { prevDay = ui.day; ui.day = getDays().indexOf(it.date); renderDates(true); renderCalendar(); }
    if (hasLeaflet() && map && markerRefs[id]) { renderMap(false); const m = markerRefs[id]; if (!quiet) { map.setView(m.getLatLng(), 15, { animate: !reduceMotion() }); m.openPopup(); } }
    else renderMap(false);
    if (!quiet && innerWidth <= 850 && $("#mappanel").offsetParent) $("#mappanel").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  }
  function focusLeg(key) {
    const { legs } = dayPoints();
    const idx = legs.findIndex(l => l.key === key);
    ui.legFocus = idx >= 0 ? idx : null;
    renderMap(true); renderRoutes(); renderDayCosts();
  }

  // ==========================================================
  // 交通明細
  // ==========================================================
  function renderRoutes() {
    const date = getDays()[ui.day];
    const legs = dayLegs(date, ui.day).filter(l => !l.leg.same && l.leg.minutes);
    const totalMin = legs.reduce((a, l) => a + l.leg.minutes, 0);
    $("#routesum").textContent = legs.length ? `D${ui.day + 1} · ${legs.length} 段 · 共 ${fmtDur(totalMin)}` : `D${ui.day + 1} · 沒有交通段`;
    const { legs: mapLegs } = dayPoints();
    const focusKey = ui.legFocus != null ? mapLegs[ui.legFocus]?.key : null;
    $("#routelist").innerHTML = legs.map(l => {
      const c = l.leg.cost;
      return `<div class="routeitem ${l.key === focusKey ? "focus" : ""}" data-leg="${esc(l.key)}" style="border-left-color:${MODE[legMainMode(l.leg)]?.color}">
        <div class="rtop"><span>${fmtHM(l.depart)} → ${fmtHM(l.arrive)} · ${fmtDur(l.leg.minutes)}</span><button type="button" data-act="edit">編輯</button></div>
        <div class="rnames">${esc(l.from.name)} → ${esc(l.to.name)}</div>
        <div class="segs">${segChips(l.leg)}</div>
        <div class="rnames">${c && c.amount != null ? `${money(c.amount, c.currency)} ${BASIS[c.basis]}` : "車費待填"}
          ${l.leg.auto ? '<span class="badge est">估算</span>' : c ? `<span class="badge ${c.status === "confirmed" ? "ok" : c.status === "tbc" ? "tbc" : "est"}">${STATUS[c.status]}</span>` : ""}
          ${l.late && !l.implicit ? `<span class="warn"> ⚠ 晚 ${l.late} 分鐘</span>` : ""} ${l.overlap ? '<span class="warn"> ⚠ 行程重疊</span>' : ""}</div>
        ${l.leg.note ? `<div class="hint">${esc(l.leg.note)}</div>` : ""}
      </div>`;
    }).join("") || `<div class="hint">這天沒有需要移動的路段。</div>`;
    $$("#routelist .routeitem").forEach(el => {
      el.addEventListener("click", (e) => { if (e.target.closest("[data-act=edit]")) openLegEditor(el.dataset.leg); else focusLeg(el.dataset.leg); });
      el.addEventListener("dblclick", () => openLegEditor(el.dataset.leg));
    });
  }

  function openCostEditor(kind, id) {
    if (kind === "item") openItemEditor(id); else if (kind === "expense") openExpenseEditor(id); else openLegEditor(id);
  }
  /** 與行程無關的費用（購物、保險、網卡…），date 留空＝全程 */
  function openExpenseEditor(id, presetDate) {
    const isNew = !id, days = getDays();
    const e = isNew ? { id: uid("ex"), date: presetDate ?? days[ui.day], name: "", cat: "shopping", cost: { amount: null, currency: "KRW", basis: "group", status: "estimate" }, note: "" } : clone(trip.expenses.find(x => x.id === id));
    if (!e) return;
    openDialog(`${dlgHead(isNew ? "新增費用" : "編輯費用")}
      <div class="dlgbody">
        <label class="full">項目<input name="name" value="${esc(e.name)}" placeholder="例如：Olive Young 藥妝"></label>
        <label>分類<select name="cat">${Object.entries(EXP_CAT).map(([k, v]) => `<option value="${k}" ${k === e.cat ? "selected" : ""}>${v.name}</option>`).join("")}</select></label>
        <label>日期<select name="date"><option value="" ${!e.date ? "selected" : ""}>全程（不屬於某一天）</option>${days.map((d, i) => `<option value="${d}" ${d === e.date ? "selected" : ""}>D${i + 1} ${dm(d)}（${wdOf(d)}）</option>`).join("")}</select></label>
        <p class="hint full catdesc">${esc(EXP_CAT[e.cat].desc)}</p>
        ${costFields(e.cost)}
        <label class="full">備註<textarea name="note">${esc(e.note || "")}</textarea></label>
        <p class="formerr full" role="alert"></p>
      </div>
      <div class="dlgfoot">
        ${isNew ? "" : `<button class="btn danger left" value="delete">刪除</button>`}
        <button class="btn" value="cancel" formnovalidate>取消</button>
        <button class="btn primary" value="save">儲存</button>
      </div>`, (action, f) => {
      if (action === "delete") { commit(t => { t.expenses = t.expenses.filter(x => x.id !== id); }, `已刪除「${e.name}」，可按復原`); return; }
      const name = f.name.value.trim(); if (!name) return "請輸入項目名稱";
      const next = Object.assign(e, { name, cat: f.cat.value, date: f.date.value || null, cost: readCost(f), note: f.note.value });
      commit(t => { if (isNew) t.expenses.push(next); else t.expenses[t.expenses.findIndex(x => x.id === id)] = next; }, isNew ? `已新增費用「${name}」` : `已更新「${name}」`);
    });
    const sel = dlg().querySelector('select[name="cat"]');
    sel.addEventListener("change", () => { dlg().querySelector(".catdesc").textContent = EXP_CAT[sel.value].desc; });
  }

  // ---------- 當日費用明細（交通明細下面） ----------
  function renderDayCosts() {
    const date = getDays()[ui.day], sc = trip.meta.settlementCurrency;
    const lines = viewLines().filter(L => L.date === date && !(L.kind === "leg" && L.cost.amount === 0 && L.auto));
    const filled = lines.filter(L => L.converted != null);
    const total = filled.reduce((a, L) => a + L.converted, 0);
    const pending = lines.filter(L => L.group == null).length;
    const n = members().length;
    $("#daycostsum").textContent = `D${ui.day + 1} · ${currentViewer() ? memberName(currentViewer()) + " " : ""}${money(total, sc)}${n > 1 && !currentViewer() ? ` · 每人約 ${money(total / n, sc)}` : ""}${pending ? ` · ${pending} 項待填` : ""}`;
    $("#daycostlist").innerHTML = lines.map(L => {
      const c = L.cost, tag = payLabel(c);
      const badge = L.auto ? '<span class="badge est">程式估算</span>' : `<span class="badge ${c.status === "confirmed" ? "ok" : c.status === "estimate" ? "est" : "tbc"}">${STATUS[c.status]}</span>`;
      return `<div class="routeitem costitem" data-kind="${L.kind}" data-id="${esc(L.id)}" style="border-left-color:${EXP_CAT[L.cat].color}" tabindex="0" role="button" aria-label="${esc(L.name)}，雙擊編輯">
        <div class="rtop"><span class="cname">${esc(L.name)}</span><span class="camt">${c.amount == null ? '<span class="badge tbc">未填</span>' : withSgd(c.amount, c.currency, sc)}</span></div>
        <div class="rnames">${EXP_CAT[L.cat].name} · ${BASIS[c.basis] || ""}${L.group != null && L.group !== c.amount ? ` · ${L.personal ? "個人分攤" : "全團"} ${money(L.converted ?? L.group, L.converted != null ? sc : c.currency)}` : ""} ${badge}${tag ? ` <span class="paytag inline ${payerOf(c) ? "payer" : ""}">${esc(tag)}</span>` : ""}</div>
      </div>`;
    }).join("") || `<div class="hint">這天沒有費用項目。</div>`;
    $$("#daycostlist .costitem").forEach(el => {
      const open = () => openCostEditor(el.dataset.kind, el.dataset.id);
      el.addEventListener("dblclick", open);
      el.addEventListener("keydown", e => { if (e.key === "Enter") open(); });
      el.addEventListener("click", () => { if (el.dataset.kind === "item") highlightOnMap(el.dataset.id, true); else if (el.dataset.kind === "leg") focusLeg(el.dataset.id); });
    });
  }

  // ==========================================================
  // 表單：行程
  // ==========================================================
  const dlg = () => $("#editdialog");
  function openDialog(html, onSubmit, editId) {
    const d = dlg();
    d.dataset.editId = editId || "";
    d.innerHTML = `<form method="dialog" novalidate>${html}</form>`;
    const form = d.querySelector("form");
    form.addEventListener("submit", (e) => {
      const btn = e.submitter;
      if (!btn || btn.value === "cancel") return;
      e.preventDefault();
      const err = onSubmit(btn.value, form);
      if (err) { const el = form.querySelector(".formerr"); if (el) el.textContent = err; return; }
      d.close();
    });
    d.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => d.close()));
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
    const first = d.querySelector("input,select,textarea"); if (first) first.focus();
  }
  function dlgHead(title) { return `<div class="dlghead"><h2>${esc(title)}</h2><button type="button" data-close aria-label="關閉">×</button></div>`; }
  function currencyOptions(sel) {
    const set = new Set(["KRW", trip.meta.settlementCurrency, "SGD", "HKD", "TWD", "USD", ...Object.keys(trip.meta.rates || {})]);
    return [...set].map(c => `<option ${c === sel ? "selected" : ""}>${c}</option>`).join("");
  }
  function costFields(c) {
    return `<label>費用<input name="amount" type="number" min="0" step="any" inputmode="decimal" value="${c.amount ?? ""}" placeholder="留空 = 未填"></label>
      <label>幣別<select name="currency">${currencyOptions(c.currency)}</select></label>
      <label>計算方式<select name="basis">${Object.entries(BASIS).map(([k, v]) => `<option value="${k}" ${k === c.basis ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label>狀態<select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === c.status ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      ${payFields(c)}`;
  }
  function payFields(c) {
    const pay = c.pay || {}, mode = payerOf(c) ? "payer" : "each", parts = participantsOf(c);
    return `<label>付款方式<select name="paymode"><option value="each" ${mode === "each" ? "selected" : ""}>各付各</option><option value="payer" ${mode === "payer" ? "selected" : ""}>由一位團員代付</option></select></label>
      <label>代付人<select name="payer">${members().map(m => `<option value="${m.id}" ${m.id === (pay.payer || members()[0].id) ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></label>
      <fieldset class="full partbox"><legend>參與分攤</legend>${members().map(m => `<label class="check"><input type="checkbox" name="part" value="${m.id}" ${parts.includes(m.id) ? "checked" : ""}> ${esc(m.name)}</label>`).join("")}
        <span class="hint">「每人」計價會按勾選人數計算全團金額。團員可在「旅客與匯率」設定。</span></fieldset>`;
  }
  function readCost(f) {
    const a = f.amount.value.trim();
    const parts = [...f.querySelectorAll('input[name="part"]:checked')].map(x => x.value);
    const allIds = members().map(m => m.id);
    const pay = { mode: f.paymode.value, payer: f.payer.value, participants: parts.length === allIds.length || !parts.length ? [] : parts };
    return { amount: a === "" ? null : Number(a), currency: f.currency.value, basis: f.basis.value, status: f.status.value, pay };
  }
  function openItemEditor(id, presetDate) {
    hidePreview();
    const isNew = !id;
    const days = getDays();
    const it = isNew ? { id: uid("it"), date: presetDate || days[ui.day], start: "10:00", duration: 60, category: "sight", name: "", address: "", lat: null, lng: null, cost: { amount: null, currency: "KRW", basis: "person", status: "tbc" }, note: "", locked: false } : clone(itemById(id));
    if (!it) return;
    const dis = it.locked ? "disabled" : "";
    openDialog(`${dlgHead(isNew ? "新增行程" : "編輯行程")}
      <div class="dlgbody">
        <label class="full">名稱<input name="name" required value="${esc(it.name)}" placeholder="例如：景福宮"></label>
        <label>類別<select name="category">${Object.entries(CAT).map(([k, v]) => `<option value="${k}" ${k === it.category ? "selected" : ""}>${v.name}</option>`).join("")}</select></label>
        <label>支出分類<select name="expenseCat"><option value="">依類別自動</option>${Object.entries(EXP_CAT).map(([k, v]) => `<option value="${k}" ${k === it.expenseCat ? "selected" : ""}>${v.name}</option>`).join("")}</select></label>
        <label>日期（當地）<select name="date" ${dis}>${days.map((d, i) => `<option value="${d}" ${d === it.date ? "selected" : ""}>D${i + 1} ${dm(d)}（${wdOf(d)}）</option>`).join("")}</select></label>
        <label>開始時間<input name="start" type="time" step="300" value="${it.start}" ${dis}></label>
        <label>時長（分鐘）<input name="duration" type="number" min="5" step="5" value="${it.duration}" ${dis}></label>
        <label class="full">地址<input name="address" value="${esc(it.address || "")}"></label>
        <label>緯度<input name="lat" type="number" step="any" value="${it.lat ?? ""}"></label>
        <label>經度<input name="lng" type="number" step="any" value="${it.lng ?? ""}"></label>
        ${costFields(it.cost)}
        <label class="full">備註<textarea name="note">${esc(it.note || "")}</textarea></label>
        <label class="check full"><input type="checkbox" name="locked" ${it.locked ? "checked" : ""}> 已預約（鎖定時段，不能拖移）</label>
        <p class="hint full">ID：${esc(it.id)}${it.locked ? " · 取消鎖定並儲存後才可改時間。" : ""}${it.coordEstimated ? " · 座標為估算。" : ""}</p>
        <p class="formerr full" role="alert"></p>
      </div>
      <div class="dlgfoot">
        ${isNew ? "" : `<button class="btn danger left" value="delete">刪除</button>`}
        <button class="btn" value="cancel" formnovalidate>取消</button>
        <button class="btn primary" value="save">儲存</button>
      </div>`, (action, f) => {
      if (action === "delete") {
        commit(t => { t.items = t.items.filter(x => x.id !== id); Object.keys(t.legs).forEach(k => { if (k.split(">").includes(id) && !t.legs[k].manual) delete t.legs[k]; }); }, `已刪除「${it.name}」，可按復原`);
        return;
      }
      const name = f.name.value.trim(); if (!name) return "請輸入名稱";
      const start = f.start.value; if (!/^\d{2}:\d{2}$/.test(start)) return "請輸入開始時間";
      const dur = Number(f.duration.value); if (!(dur > 0)) return "時長必須大於 0";
      const lat = f.lat.value === "" ? null : Number(f.lat.value), lng = f.lng.value === "" ? null : Number(f.lng.value);
      const moved = !isNew && (lat !== it.lat || lng !== it.lng);
      const next = Object.assign(it, { name, category: f.category.value, expenseCat: f.expenseCat.value || undefined, date: f.date.value, start, duration: dur, address: f.address.value.trim(), lat, lng, cost: readCost(f), note: f.note.value, locked: f.locked.checked });
      if (moved) next.coordEstimated = false;
      commit(t => {
        if (isNew) t.items.push(next); else { const i = t.items.findIndex(x => x.id === id); t.items[i] = next; }
        // 地點改變 → 只重算與此行程相鄰、未手動設定的路段
        if (moved) Object.keys(t.legs).forEach(k => { if (k.replace("@stay", "").split(">").includes(next.id) && !t.legs[k].manual) delete t.legs[k]; });
      }, isNew ? `已新增「${name}」` : `已更新「${name}」`);
      ui.day = getDays().indexOf(next.date); ui.selectedId = next.id;
      renderAll();
    }, id);
  }

  // ---------- 表單：交通段 ----------
  function findLeg(key) {
    for (const [i, d] of getDays().entries()) { const l = dayLegs(d, i).find(x => x.key === key); if (l) return l; }
    return null;
  }
  function openLegEditor(key) {
    const L = findLeg(key); if (!L) return;
    const leg = clone(L.leg);
    const segText = (leg.segments || []).map(s => `${s.mode}:${s.minutes}${s.label ? ":" + s.label : ""}`).join("\n");
    openDialog(`${dlgHead("編輯交通")}
      <div class="dlgbody">
        <p class="full">${esc(L.from.name)} → ${esc(L.to.name)}<br><span class="hint">${fmtHM(L.depart)} 出發 ${leg.auto ? "· 目前為估算值" : "· 已手動設定"}</span></p>
        <label class="full">分段（每行：方式:分鐘:說明）<textarea name="segs" rows="4">${esc(segText)}</textarea>
          <span class="hint">方式：${Object.entries(MODE).map(([k, v]) => `${k}=${v.name}`).join("、")}。總時長＝各段相加。</span></label>
        ${costFields(leg.cost || { amount: null, currency: "KRW", basis: "person", status: "tbc" })}
        <label class="full">備註<textarea name="note">${esc(leg.note || "")}</textarea></label>
        <p class="formerr full" role="alert"></p>
      </div>
      <div class="dlgfoot">
        <button class="btn left" value="reset">重設為估算</button>
        <button class="btn" value="cancel" formnovalidate>取消</button>
        <button class="btn primary" value="save">儲存</button>
      </div>`, (action, f) => {
      if (action === "reset") { commit(t => { delete t.legs[key]; }, "已改回程式估算"); return; }
      const segs = [];
      for (const line of f.segs.value.split("\n").map(s => s.trim()).filter(Boolean)) {
        const [mode, min, ...rest] = line.split(/[:：]/);
        if (!MODE[mode?.trim()]) return `未知的交通方式「${mode}」`;
        const m = Number(min); if (!(m >= 0)) return `「${line}」的分鐘數不正確`;
        segs.push({ mode: mode.trim(), minutes: m, label: rest.join(":").trim() });
      }
      const minutes = segs.reduce((a, s) => a + s.minutes, 0);
      const main = segs.find(s => s.mode !== "walk");
      commit(t => { t.legs[key] = { mode: main ? main.mode : "walk", minutes, segments: segs, cost: readCost(f), note: f.note.value, manual: true }; }, `交通已更新（${fmtDur(minutes)}）`);
    });
  }

  // ---------- 設定、待查 ----------
  function openSettings() {
    const m = trip.meta;
    const curs = new Set(trip.items.map(i => i.cost.currency).concat(Object.values(trip.legs).map(l => l.cost?.currency).filter(Boolean)));
    curs.delete(m.settlementCurrency);
    openDialog(`${dlgHead("旅程設定")}
      <div class="dlgbody">
        <label class="full">旅程名稱<input name="name" value="${esc(m.name)}"></label>
        <label class="full">目的地<input name="destination" value="${esc(m.destination)}"></label>
        <label>開始日期<input name="startDate" type="date" value="${m.startDate}"></label>
        <label>結束日期<input name="endDate" type="date" value="${m.endDate}"></label>
        <label>時區（IANA）<input name="timezone" value="${esc(m.timezone)}"></label>
        <label class="full">團員（每行一位，旅客人數＝行數）<textarea name="members" rows="3">${esc(m.members.map(x => x.name).join("\n"))}</textarea></label>
        <label>結算幣別<input name="settlementCurrency" value="${esc(m.settlementCurrency)}" maxlength="3"></label>
        ${[...curs].map(c => `<label>1 ${esc(m.settlementCurrency)} = ? ${c}<input name="rate_${c}" type="number" step="any" min="0" value="${rateOf(c) ? +(1 / rateOf(c)).toFixed(4) : ""}"></label>`).join("")}
        <p class="hint full">${esc(m.ratesNote || "")}</p>
        <p class="formerr full" role="alert"></p>
      </div>
      <div class="dlgfoot"><button class="btn" value="cancel" formnovalidate>取消</button><button class="btn primary" value="save">儲存</button></div>`, (a, f) => {
      if (f.endDate.value < f.startDate.value) return "結束日期不能早於開始日期";
      const nm = f.members.value.split("\n").map(x => x.trim()).filter(Boolean);
      if (new Set(nm).size !== nm.length) return "團員名稱不能重複";
      try { new Intl.DateTimeFormat("en", { timeZone: f.timezone.value }); } catch (e) { return "時區名稱不正確，例如 Asia/Seoul"; }
      commit(t => {
        const mm = t.meta;
        Object.assign(mm, { name: f.name.value.trim() || mm.name, destination: f.destination.value.trim(), startDate: f.startDate.value, endDate: f.endDate.value, timezone: f.timezone.value.trim(), settlementCurrency: f.settlementCurrency.value.trim().toUpperCase() || mm.settlementCurrency });
        const names = f.members.value.split("\n").map(x => x.trim()).filter(Boolean);
        if (names.length) {
          const old = mm.members.slice();
          mm.members = names.map((nm, i) => old.find(o => o.name === nm) || { id: old[i] && !names.includes(old[i].name) ? old[i].id : uid("m"), name: nm });
          mm.travelers = mm.members.length;
        }
        mm.rates = mm.rates || {};
        [...curs].forEach(c => { const v = Number(f[`rate_${c}`]?.value); if (v > 0) mm.rates[c] = 1 / v; });
        mm.ratesNote = `匯率由使用者於 ${new Date().toISOString().slice(0, 10)} 更新`;
      }, "設定已更新，費用已重算");
    });
  }
  function todoList() {
    const out = [];
    trip.items.forEach(it => {
      (it.verify || []).forEach(v => out.push(`${dm(it.date)} ${it.name}：${v}`));
      if (it.cost.amount == null) out.push(`${dm(it.date)} ${it.name}：金額未填`);
      else if (it.cost.status === "estimate") out.push(`${dm(it.date)} ${it.name}：金額為估算（${money(it.cost.amount, it.cost.currency)}）`);
    });
    trip.expenses.forEach(e => {
      const d = e.date ? dm(e.date) : "全程";
      if (e.cost.amount == null) out.push(`${d} ${e.name}：金額未填`);
      else if (e.cost.status === "estimate") out.push(`${d} ${e.name}：金額為估算（${money(e.cost.amount, e.cost.currency)}）`);
    });
    getDays().forEach((d, i) => dayLegs(d, i).forEach(l => {
      if (l.leg.same || !l.leg.minutes) return;
      if (l.leg.auto) out.push(`${dm(d)} ${l.from.name} → ${l.to.name}：交通時間與車費為程式估算`);
      else if (l.leg.cost?.status !== "confirmed") out.push(`${dm(d)} ${l.from.name} → ${l.to.name}：${l.leg.cost?.amount == null ? "車費未填" : "車費" + STATUS[l.leg.cost.status]}`);
      if (!l.implicit && (l.late || l.overlap)) out.push(`⚠ ${dm(d)} ${l.to.name}：${l.overlap ? "時間重疊" : `可能遲到 ${l.late} 分鐘`}`);
    }));
    if (trip.items.some(i => i.coordEstimated)) out.push(`座標：${trip.items.filter(i => i.coordEstimated).length} 個地點的座標為估算`);
    out.push(`匯率：${trip.meta.ratesNote || "未註明"}`);
    return out;
  }
  function openTodo() {
    const list = todoList();
    openDialog(`${dlgHead(`待查項目（${list.length}）`)}<div class="dlgbody"><ol class="todolist full">${list.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>
      <div class="dlgfoot"><button class="btn" value="copy">複製清單</button><button class="btn primary" value="cancel">關閉</button></div>`, (a) => {
      if (a === "copy") { navigator.clipboard?.writeText(list.map((x, i) => `${i + 1}. ${x}`).join("\n")).then(() => toast("已複製")); return "已複製到剪貼簿"; }
    });
  }
  function confirmDialog(title, text, okLabel, onOk) {
    openDialog(`${dlgHead(title)}<div class="dlgbody"><p class="full">${esc(text)}</p></div>
      <div class="dlgfoot"><button class="btn" value="cancel">取消</button><button class="btn danger" value="ok">${esc(okLabel)}</button></div>`, () => { onOk(); });
  }

  // ==========================================================
  // 匯入匯出
  // ==========================================================
  function download(name, text, type) {
    const blob = new Blob([text], { type }); const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportJSON() { download(`${trip.meta.id}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(trip, null, 2), "application/json"); toast("已匯出 JSON 備份"); }
  function importJSON(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const t = JSON.parse(r.result);
        if (!t || !Array.isArray(t.items) || !t.meta) throw new Error("格式不符：需要 meta 與 items");
        const ids = new Set(); for (const it of t.items) { if (!it.id || ids.has(it.id)) throw new Error(`行程 ID 缺少或重複：${it.id}`); ids.add(it.id); if (!/^\d{4}-\d{2}-\d{2}$/.test(it.date) || !/^\d{2}:\d{2}$/.test(it.start)) throw new Error(`「${it.name}」日期或時間格式不正確`); }
        const doImport = () => commit(x => { Object.keys(x).forEach(k => delete x[k]); Object.assign(x, normalize(t)); }, `已匯入 ${t.items.length} 個行程（可按復原）`);
        if (cloudActive()) confirmDialog("匯入 JSON", `會用檔案內容（${t.items.length} 個行程）取代雲端的共用版本，所有團員都會看到改動。可按「復原」還原。`, "匯入", doImport); else doImport();
      } catch (e) { toast(`匯入失敗：${e.message}`); }
    };
    r.readAsText(file);
  }
  function icsEscape(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function icsFold(line) {
    const out = []; let cur = "", bytes = 0; const enc = new TextEncoder();
    for (const ch of line) { const b = enc.encode(ch).length; if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; bytes = 0; } cur += ch; bytes += b; }
    out.push(cur); return out.join("\r\n ");
  }
  function exportICS() {
    const m = trip.meta, tz = m.timezone;
    const off = (m.utcOffset || "+09:00").replace(":", "");
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const dt = (date, min) => { let d = date, mm = min; while (mm >= 1440) { d = dateAdd(d, 1); mm -= 1440; } return `${d.replace(/-/g, "")}T${fmtHM(mm).replace(":", "")}00`; };
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Trip Planner//ZH-HANT", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${icsEscape(m.name)}`, `X-WR-TIMEZONE:${tz}`,
      "BEGIN:VTIMEZONE", `TZID:${tz}`, "BEGIN:STANDARD", "DTSTART:19700101T000000", `TZOFFSETFROM:${off}`, `TZOFFSETTO:${off}`, "END:STANDARD", "END:VTIMEZONE"];
    trip.items.slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).forEach(it => {
      const s = toMin(it.start);
      L.push("BEGIN:VEVENT", `UID:${it.id}@${m.id}`, `DTSTAMP:${stamp}`, `DTSTART;TZID=${tz}:${dt(it.date, s)}`, `DTEND;TZID=${tz}:${dt(it.date, s + it.duration)}`,
        `SUMMARY:${icsEscape(it.name)}`, `LOCATION:${icsEscape(it.address)}`, `DESCRIPTION:${icsEscape([it.note, it.locked ? "已預約" : ""].filter(Boolean).join("\n"))}`,
        `CATEGORIES:${icsEscape(CAT[it.category]?.name)}`);
      if (it.lat != null) L.push(`GEO:${it.lat};${it.lng}`);
      L.push("END:VEVENT");
    });
    L.push("END:VCALENDAR");
    download(`${m.id}.ics`, L.map(icsFold).join("\r\n") + "\r\n", "text/calendar");
    toast("已匯出 ICS，可匯入 Google／Apple 行事曆");
  }

  // ==========================================================
  // 費用頁
  // ==========================================================
  function pieSVG(byCat, total) {
    const R = 90, C = 110; let a0 = -Math.PI / 2, paths = "";
    const entries = Object.entries(byCat).filter(([, v]) => v > 0);
    if (!total) return `<svg class="pie" viewBox="0 0 220 220" role="img" aria-label="尚無支出"><circle cx="${C}" cy="${C}" r="${R}" fill="#fff" stroke="#3E3A39" stroke-width="3" stroke-dasharray="8 8"/></svg>`;
    if (entries.length === 1) paths = `<circle cx="${C}" cy="${C}" r="${R}" fill="${EXP_CAT[entries[0][0]].color}" stroke="#3E3A39" stroke-width="3"/>`;
    else entries.forEach(([k, v]) => {
      const a1 = a0 + v / total * Math.PI * 2, large = a1 - a0 > Math.PI ? 1 : 0;
      paths += `<path d="M${C} ${C} L${C + R * Math.cos(a0)} ${C + R * Math.sin(a0)} A${R} ${R} 0 ${large} 1 ${C + R * Math.cos(a1)} ${C + R * Math.sin(a1)}Z" fill="${EXP_CAT[k].color}" stroke="#3E3A39" stroke-width="3" stroke-linejoin="round"><title>${EXP_CAT[k].name} ${(v / total * 100).toFixed(1)}%</title></path>`;
      a0 = a1;
    });
    return `<svg class="pie" viewBox="0 0 220 220" role="img" aria-label="支出組成圓餅圖">${paths}<circle cx="${C}" cy="${C}" r="38" fill="#FFFCF6" stroke="#3E3A39" stroke-width="3"/></svg>`;
  }
  /** 原幣金額，下一行括號顯示結算幣別金額 */
  function withSgd(v, cur, sc) {
    if (cur === sc) return money(v, sc);
    const r = rateOf(cur);
    return `${money(v, cur)}<span class="subsgd">（${r == null ? "缺匯率" : money(v * r, sc)}）</span>`;
  }
  function renderExpenses() {
    const m = trip.meta, S = expenseSummary(), sc = m.settlementCurrency;
    const foreign = Object.entries(S.byCur).filter(([c]) => c !== sc);
    const settleOnly = S.byCur[sc] || 0;
    const rows = S.lines.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.cat.localeCompare(b.cat));
    const n = members().length, ST = settlement();
    $("#expensespage").innerHTML = `
      <section class="frame exp-card">
        <h2>合計（${currentViewer() ? `${esc(memberName(currentViewer()))} 個人分攤` : `${n} 位團員`}）</h2>
        <div class="totals">
          ${foreign.map(([c, v]) => `<div class="totalbox"><div class="tl">外幣合計 · ${c}</div><div class="tv">${money(v, c)}</div><div class="hint">1 ${sc} = ${rateOf(c) ? (1 / rateOf(c)).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "?"} ${c}</div></div>`).join("") || `<div class="totalbox"><div class="tl">外幣合計</div><div class="tv">—</div></div>`}
          <div class="totalbox"><div class="tl">結算幣別合計 · ${sc}（原本就以 ${sc} 計價）</div><div class="tv">${money(settleOnly, sc)}</div></div>
          <div class="totalbox grand"><div class="tl">換算總額 · ${sc}（先逐項換算再合計）</div><div class="tv">${money(S.grand, sc)}</div><div class="hint">每人約 ${money(S.grand / n, sc)}</div></div>
        </div>
        <div class="settings">
          <label>團員<button type="button" class="btn" id="set-members">${esc(members().map(x => x.name).join("、"))} ✎</button></label>
          ${foreign.map(([c]) => `<label>1 ${sc} = ? ${c}<input type="number" step="any" min="0" data-rate="${c}" value="${rateOf(c) ? +(1 / rateOf(c)).toFixed(4) : ""}"></label>`).join("")}
        </div>
        <div class="budgetnote">⚠ ${S.pending} 項金額未填（機票、酒店、李玟雨門票等），${S.est} 項為估算。${S.noRate.length ? `缺少匯率：${S.noRate.join("、")}。` : ""}總額只計已填金額。<br><span class="hint">${esc(m.ratesNote || "")}</span></div>
      </section>
      <section class="frame exp-card">
        <h2>支出組成</h2>
        ${pieSVG(S.byCat, S.grand)}
        <ul class="legend">${Object.entries(EXP_CAT).map(([k, v]) => `<li><span class="sw" style="background:${v.color}"></span>${v.name}<span class="lv">${money(S.byCat[k] || 0, sc)} · ${S.grand ? ((S.byCat[k] || 0) / S.grand * 100).toFixed(1) : 0}%</span></li>`).join("")}</ul>
      </section>
      <section class="frame exp-card expwide" id="settlement">
        <h2>結算</h2>
        ${n < 2 ? `<p class="hint">目前只有 1 位團員。按上方「團員 ✎」加入同行團員，再在各項費用選「代付」或「各付各」。</p>` : ""}
        <div style="overflow-x:auto"><table class="exptable settletable">
          <thead><tr><th>團員</th><th class="num">已付</th><th class="num">應付</th><th class="num">差額</th></tr></thead>
          <tbody>${ST.rows.map(r => `<tr class="${r.id === currentViewer() ? "me" : ""}"><td>${esc(r.name)}</td><td class="num">${money(r.paid, sc)}</td><td class="num">${money(r.share, sc)}</td><td class="num ${r.net < -0.005 ? "neg" : r.net > 0.005 ? "pos" : ""}">${r.net > 0.005 ? "應收 " : r.net < -0.005 ? "應付 " : ""}${money(Math.abs(r.net), sc)}</td></tr>`).join("")}</tbody>
        </table></div>
        <ul class="transfers">${ST.transfers.filter(t => !currentViewer() || [t.from, t.to].includes(memberName(currentViewer()))).map(t => `<li><b>${esc(t.from)}</b> → <b>${esc(t.to)}</b>　${money(t.amount, sc)}</li>`).join("") || `<li class="hint">${n < 2 ? "" : "目前不需要轉帳。"}</li>`}</ul>
        <p class="hint">已付：代付人計全額，各付各按人數平分；應付：每項按參與人數平均分攤。只計已填金額，按 ${sc} 結算。</p>
      </section>
      <section class="frame exp-card expwide">
        <div class="exphead"><h2>明細</h2><button type="button" class="btn primary" id="exp-add">＋ 新增費用</button></div>
        <div style="overflow-x:auto"><table class="exptable">
          <thead><tr><th>日期</th><th>項目</th><th>類別</th><th class="num">單價<span class="subsgd">（${sc}）</span></th><th>方式</th><th class="num">${currentViewer() ? "個人分攤" : "全團"}<span class="subsgd">（${sc}）</span></th><th>狀態</th></tr></thead>
          <tbody>${rows.map(L => `<tr class="cat-${L.cat}" data-kind="${L.kind}" data-id="${esc(L.id)}">
            <td>${L.date ? dm(L.date) : "全程"}</td><td>${esc(L.name)}${payLabel(L.cost) ? `<span class="paytag ${payerOf(L.cost) ? "payer" : ""}">${esc(payLabel(L.cost))}</span>` : ""}</td><td>${EXP_CAT[L.cat].name}</td>
            <td class="num">${L.cost.amount == null ? '<span class="badge tbc">未填</span>' : withSgd(L.cost.amount, L.cost.currency, sc)}</td>
            <td>${BASIS[L.cost.basis] || ""}</td><td class="num">${L.group == null ? "—" : withSgd(L.group, L.cost.currency, sc)}</td>
            <td>${L.auto ? '<span class="badge est">程式估算</span>' : `<span class="badge ${L.cost.status === "confirmed" ? "ok" : L.cost.status === "estimate" ? "est" : "tbc"}">${STATUS[L.cost.status]}</span>`}</td></tr>`).join("")}</tbody>
        </table></div>
        <p class="hint">雙擊任一列可編輯。</p>
      </section>`;
    $("#set-members").addEventListener("click", openSettings);
    $$("#expensespage [data-rate]").forEach(inp => inp.addEventListener("change", () => { const v = Number(inp.value); if (v > 0) commit(t => { t.meta.rates[inp.dataset.rate] = 1 / v; t.meta.ratesNote = `匯率由使用者於 ${new Date().toISOString().slice(0, 10)} 更新：1 ${t.meta.settlementCurrency} = ${v} ${inp.dataset.rate}`; }, "匯率已更新"); }));
    $$("#expensespage tbody tr[data-kind]").forEach(tr => tr.addEventListener("dblclick", () => openCostEditor(tr.dataset.kind, tr.dataset.id)));
    $("#exp-add").addEventListener("click", () => openExpenseEditor(null, null));
  }

  // ==========================================================
  // 用品頁
  // ==========================================================
  const PACK_COLORS = ["#F6D27A", "#A8D3E6", "#F2A497", "#B9DAA5", "#DED2ED", "#F4C7AA"];
  function renderPacking() {
    const P = trip.packing, q = ui.packSearch.trim().toLowerCase();
    const total = P.items.length, done = P.items.filter(i => i.done).length;
    const host = $("#packingpage");
    const hadFocus = document.activeElement && document.activeElement.id === "packsearch";
    host.innerHTML = `
      <section class="frame packtop">
        <div class="progress"><div>完成 ${done} / ${total}（${total ? Math.round(done / total * 100) : 0}%）</div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><div class="fill" style="width:${total ? done / total * 100 : 0}%"></div></div></div>
        <input type="search" id="packsearch" placeholder="搜尋用品或備註" value="${esc(ui.packSearch)}" aria-label="搜尋用品">
        <div class="filtergroup" role="group" aria-label="篩選">${[["all", "全部"], ["todo", "未完成"], ["done", "已完成"]].map(([k, v]) => `<button type="button" data-f="${k}" aria-pressed="${ui.packFilter === k}">${v}</button>`).join("")}</div>
      </section>
      <div class="packgrid">${P.categories.map((c, ci) => {
        const items = P.items.filter(i => i.cat === c.id).filter(i => ui.packFilter === "all" || (ui.packFilter === "done" ? i.done : !i.done)).filter(i => !q || `${i.name} ${i.note}`.toLowerCase().includes(q));
        const all = P.items.filter(i => i.cat === c.id);
        return `<section class="frame packcat"><div class="panelhead" style="background:${PACK_COLORS[ci % 6]}"><h2>${esc(c.name)}</h2><span>${all.filter(i => i.done).length}/${all.length}</span></div>
          <ul>${items.map(i => `<li class="packitem ${i.done ? "done" : ""}" data-id="${esc(i.id)}">
            <input type="checkbox" ${i.done ? "checked" : ""} aria-label="完成：${esc(i.name)}">
            <span><span class="pn">${esc(i.name)}</span>${i.note ? `<span class="pnote">${esc(i.note)}</span>` : ""}</span>
            <span class="qty">×${i.qty}</span>
            <span><button type="button" data-a="edit" aria-label="編輯 ${esc(i.name)}">✎</button><button type="button" data-a="del" aria-label="刪除 ${esc(i.name)}">✕</button></span></li>`).join("") || `<li class="hint">沒有符合的項目</li>`}</ul>
          <form class="packadd" data-cat="${esc(c.id)}"><input name="name" placeholder="新增用品…" aria-label="新增到${esc(c.name)}"><input name="qty" class="qtyin" type="number" min="1" value="1" aria-label="數量"><button class="btn primary" type="submit">加</button></form></section>`;
      }).join("")}</div>`;
    const s = $("#packsearch");
    s.addEventListener("input", () => { ui.packSearch = s.value; const pos = s.selectionStart; renderPacking(); const ns = $("#packsearch"); ns.focus(); ns.setSelectionRange(pos, pos); });
    if (hadFocus) s.focus();
    $$(".filtergroup button", host).forEach(b => b.addEventListener("click", () => { ui.packFilter = b.dataset.f; saveUI(); renderPacking(); }));
    $$(".packitem", host).forEach(li => {
      const id = li.dataset.id;
      li.querySelector("input[type=checkbox]").addEventListener("change", e => commit(t => { t.packing.items.find(i => i.id === id).done = e.target.checked; }));
      li.querySelector('[data-a="del"]').addEventListener("click", () => commit(t => { t.packing.items = t.packing.items.filter(i => i.id !== id); }, "已刪除用品，可按復原"));
      li.querySelector('[data-a="edit"]').addEventListener("click", () => openPackEditor(id));
      li.addEventListener("dblclick", (e) => { if (e.target.tagName !== "INPUT") openPackEditor(id); });
    });
    $$(".packadd", host).forEach(f => f.addEventListener("submit", e => {
      e.preventDefault(); const name = f.name.value.trim(); if (!name) return;
      commit(t => t.packing.items.push({ id: uid("p"), cat: f.dataset.cat, name, qty: Math.max(1, Number(f.qty.value) || 1), note: "", done: false }), `已新增「${name}」`);
    }));
  }
  function openPackEditor(id) {
    const it = trip.packing.items.find(i => i.id === id); if (!it) return;
    openDialog(`${dlgHead("編輯用品")}<div class="dlgbody">
        <label class="full">名稱<input name="name" value="${esc(it.name)}"></label>
        <label>分類<select name="cat">${trip.packing.categories.map(c => `<option value="${c.id}" ${c.id === it.cat ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>
        <label>數量<input name="qty" type="number" min="1" value="${it.qty}"></label>
        <label class="full">備註<input name="note" value="${esc(it.note || "")}"></label>
        <p class="formerr full" role="alert"></p></div>
      <div class="dlgfoot"><button class="btn" value="cancel" formnovalidate>取消</button><button class="btn primary" value="save">儲存</button></div>`, (a, f) => {
      const name = f.name.value.trim(); if (!name) return "請輸入名稱";
      commit(t => Object.assign(t.packing.items.find(i => i.id === id), { name, cat: f.cat.value, qty: Math.max(1, Number(f.qty.value) || 1), note: f.note.value.trim() }), "已更新");
    });
  }

  // ==========================================================
  // 工具籤
  // ==========================================================
  function renderViewerSelect() {
    const sel = $("#viewersel"); if (!sel) return;
    sel.innerHTML = `<option value="">全團</option>${members().map(m => `<option value="${m.id}" ${m.id === currentViewer() ? "selected" : ""}>${esc(m.name)}</option>`).join("")}`;
  }
  function toggleMenu(open) {
    const menu = $("#toolmenu"), btn = $("#fabbtn");
    const willOpen = open ?? menu.hidden;
    if (willOpen) renderViewerSelect();
    menu.hidden = !willOpen; btn.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) menu.querySelector("button").focus();
  }
  function runAction(act) {
    toggleMenu(false);
    ({
      add: () => openItemEditor(null),
      undo,
      "export-json": exportJSON,
      "import-json": () => $("#importfile").click(),
      "export-ics": exportICS,
      settings: openSettings,
      todo: openTodo,
      reset: () => !(window.TRIP_SOURCE && window.TRIP_SOURCE.items && window.TRIP_SOURCE.items.length) ? toast("這個版本沒有原始資料（只在本機版提供）") : confirmDialog("重設為原始資料", cloudActive() ? "會用 data/trip-data.js 的內容取代雲端的共用版本，所有團員都會看到改動。之前的修改可用「復原」找回（重新整理頁面前）。" : "會用 data/trip-data.js 的內容取代目前的本機草稿。之前的修改可用「復原」找回（重新整理頁面前）。", "重設", () => commit(t => { Object.keys(t).forEach(k => delete t[k]); Object.assign(t, normalize(clone(window.TRIP_SOURCE))); }, "已重設為原始資料"))
    })[act]?.();
  }

  // ==========================================================
  // 綁定與啟動
  // ==========================================================
  function renderAll() {
    renderHeader(); renderNav();
    if (ui.page === "plan") { renderDates(false); ui._keepScroll = true; renderCalendar(); renderMap(false); renderRoutes(); renderDayCosts(); }
    if (ui.page === "expenses") renderExpenses();
    if (ui.page === "packing") renderPacking();
    $("#undobtn").disabled = !history.length;
    renderSyncPill();
    saveUI();
  }
  function bind() {
    $("#eyetoggle").addEventListener("click", () => { ui.showTotal = !ui.showTotal; saveUI(); renderHeader(); });
    $$("#pagenav [role=tab]").forEach(b => b.addEventListener("click", () => { ui.page = b.dataset.page; hidePreview(); renderAll(); if (ui.page === "plan") renderMap(true); }));
    $("#pagenav").addEventListener("keydown", e => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const tabs = $$("#pagenav [role=tab]"); const i = tabs.indexOf(document.activeElement);
      const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click();
    });
    $$("#calendar-viewtoggle button").forEach(b => b.addEventListener("click", () => { ui.view = b.dataset.view; saveUI(); hidePreview(); renderCalendar(); }));
    $("#timeline-dates").addEventListener("click", e => { const s = e.target.closest(".station"); if (s) selectDay(Number(s.dataset.day)); });
    $("#timeline-dates").addEventListener("keydown", e => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const n = getDays().length; selectDay((ui.day + (e.key === "ArrowRight" ? 1 : n - 1)) % n);
      $(`#timeline-dates .station[data-day="${ui.day}"]`).focus();
    });
    $("#undobtn").addEventListener("click", undo);
    dlg().addEventListener("close", () => { dlg().dataset.editId = ""; setTimeout(maybeFlushRemote, 0); });
    if ($("#cloudgate")) $("#cloudgate").addEventListener("click", onGateClick);
    if ($("#syncpill")) $("#syncpill").addEventListener("click", openAccount);
    $("#daycostadd").addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openExpenseEditor(null, getDays()[ui.day]); });
    $("#addbtn").addEventListener("click", () => openItemEditor(null));
    $("#previewroute").addEventListener("click", () => {
      const { legs } = dayPoints(); if (!legs.length) { toast("這天沒有路段"); return; }
      ui.legFocus = ui.legFocus == null ? 0 : (ui.legFocus + 1) % legs.length;
      renderMap(true); renderRoutes(); renderDayCosts();
      const l = legs[ui.legFocus]; toast(`路段 ${ui.legFocus + 1}/${legs.length}：${l.from.name} → ${l.to.name}（${fmtDur(l.leg.minutes)}）`);
    });
    $("#fit").addEventListener("click", () => { ui.legFocus = null; renderMap(true); renderRoutes(); renderDayCosts(); });
    $("#fabbtn").addEventListener("click", () => toggleMenu());
    $("#toolmenu").addEventListener("click", e => { const b = e.target.closest("[data-act]"); if (b) runAction(b.dataset.act); });
    $("#toolmenu").addEventListener("keydown", e => {
      const items = $$("#toolmenu button"); const i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      if (e.key === "Escape") { toggleMenu(false); $("#fabbtn").focus(); }
    });
    $("#viewersel").addEventListener("change", (e) => {
      ui.viewer = e.target.value || null; saveUI(); toggleMenu(false); renderAll();
      toast(currentViewer() ? `只顯示 ${memberName(currentViewer())} 分攤的費用` : "顯示全團費用");
    });
    $("#importfile").addEventListener("change", e => { const f = e.target.files[0]; if (f) importJSON(f); e.target.value = ""; });
    document.addEventListener("click", e => {
      if (!e.target.closest("#toolfab") && !$("#toolmenu").hidden) toggleMenu(false);
      if (!e.target.closest("#preview") && !e.target.closest(".wcard")) hidePreview();
    });
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !dlg().open) { e.preventDefault(); undo(); }
      if (e.key === "Escape") hidePreview();
    });
    let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { placeRider(false); if (ui.page === "plan") { if (ui.view === "day") updateFocus(); if (map) map.invalidateSize(); } }, 120); });
    setInterval(updateNow, 15000);
  }

  // 對外：方便在 Console 或 AI 協助時操作資料
  window.TripApp = {
    get data() { return trip; },
    update(mutator, msg) { commit(mutator, msg || "已更新"); },
    undo, exportJSON, exportICS, todoList,
    reset() { runAction("reset"); },
    // 給 js/sync.js 用的掛鉤
    _cloud: {
      enabled: CLOUD_ON,
      attach(api) { cloud.api = api; },
      setUser(user) { cloud.user = user; if (!user) { cloud.ready = false; cloud.firstLoad = true; } renderSyncPill(); },
      setReady(v) { cloud.ready = !!v; },
      setStatus: setCloudStatus,
      receive: receiveRemote,
      get localOnly() { return cloud.localOnly; },
      _test: { toEntities, fromEntities, diffEntities, applyOps, inverseOps, stable }
    }
  };

  bind();
  renderAll();
  renderGate();
  renderMap(true);
  if (!hasLeaflet()) setTimeout(() => renderMap(true), 0);
})();
