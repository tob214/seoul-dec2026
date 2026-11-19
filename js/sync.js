/* ==========================================================
   雲端同步（Firebase Auth + Cloud Firestore）
   - data/firebase-config.js 有 FIREBASE_CONFIG 才會啟用；沒有就維持本機草稿模式。
   - 整個旅程存在一份文件：trips/<tripId>
       { schema, meta, items{id}, legs{key}, expenses{id}, packCats{id}, packItems{id}, wish{id}, fund{id}, root{}, updatedAt, updatedBy }
   - 每次只更新改動了的欄位（FieldPath），兩人同時改不同項目不會互相覆蓋。
   - 介面與合併邏輯在 app.js（TripApp._cloud）；這裡只負責連線。
   ========================================================== */
(function () {
  "use strict";
  const cfg = window.FIREBASE_CONFIG;
  const hooks = window.TripApp && window.TripApp._cloud;
  if (!cfg || !hooks || !hooks.enabled || cfg.mock) return;

  const VER = window.FIREBASE_SDK_VERSION || "12.18.0";
  const TRIP_ID = window.FIREBASE_TRIP_ID || "seoul-dec2026";
  const url = (m) => `https://www.gstatic.com/firebasejs/${VER}/firebase-${m}.js`;
  const COLLS = ["items", "legs", "expenses", "packCats", "packItems", "wish", "fund", "root"];

  (async function start() {
    let appMod, authMod, fs;
    try {
      [appMod, authMod, fs] = await Promise.all([import(url("app")), import(url("auth")), import(url("firestore"))]);
    } catch (e) {
      hooks.setStatus("error", "無法載入 Firebase（請檢查網絡）");
      return;
    }
    const app = appMod.initializeApp(cfg);
    const auth = authMod.getAuth(app);
    let db;
    try {
      // 離線快取：沒有信號時照常讀寫，連線後自動補傳；多個分頁共用
      db = fs.initializeFirestore(app, { ignoreUndefinedProperties: true, localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
    } catch (e) {
      db = fs.getFirestore(app); // 私密瀏覽等不支援 IndexedDB 的情況
    }
    const ref = fs.doc(db, "trips", TRIP_ID);
    let unsub = null;

    hooks.attach({
      signIn() { return authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider()); },
      signOut() { return authMod.signOut(auth); },
      /** ops: [{ coll, key, value }]，value === null = 刪除 */
      write(ops) {
        const args = [];
        ops.forEach(op => {
          const path = op.coll === "meta" ? new fs.FieldPath("meta") : new fs.FieldPath(op.coll, String(op.key));
          args.push(path, op.value === null ? fs.deleteField() : op.value);
        });
        args.push(new fs.FieldPath("updatedAt"), fs.serverTimestamp(), new fs.FieldPath("updatedBy"), (auth.currentUser && auth.currentUser.email) || "");
        hooks.setStatus("saving");
        return fs.updateDoc(ref, ...args);
      },
      seed(ent) {
        const data = { schema: 1, meta: ent.meta, updatedAt: fs.serverTimestamp(), updatedBy: (auth.currentUser && auth.currentUser.email) || "" };
        COLLS.forEach(c => { data[c] = ent[c] || {}; });
        return fs.setDoc(ref, data);
      }
    });

    authMod.onAuthStateChanged(auth, (user) => {
      if (unsub) { unsub(); unsub = null; }
      hooks.setUser(user ? { email: user.email, name: user.displayName } : null);
      if (!user) { hooks.setStatus("signedout"); return; }
      hooks.setStatus("loading");
      unsub = fs.onSnapshot(ref, { includeMetadataChanges: true }, (snap) => {
        const m = snap.metadata;
        if (!snap.exists()) {
          if (m.fromCache) return; // 離線時未能確定雲端有沒有資料，等連線
          hooks.setReady(false); hooks.setStatus("empty"); return;
        }
        hooks.setReady(true);
        // 自己仍有未上傳的改動時，畫面已是最新，只更新狀態，不覆蓋本機資料
        if (!m.hasPendingWrites) {
          const d = snap.data();
          const ent = { meta: d.meta || {} };
          COLLS.forEach(c => { ent[c] = d[c] || {}; });
          hooks.receive(ent);
        }
        hooks.setStatus(m.hasPendingWrites ? (navigator.onLine === false || m.fromCache ? "offline" : "saving") : (m.fromCache && navigator.onLine === false ? "offline" : "synced"));
      }, (err) => {
        hooks.setReady(false);
        if (err && err.code === "permission-denied") hooks.setStatus("denied");
        else hooks.setStatus("error", (err && (err.code || err.message)) || String(err));
      });
    });
  })();
})();
