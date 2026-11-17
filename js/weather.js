/* ==========================================================
   天氣（Open-Meteo，免費、不需 API 金鑰）
   - 出發前 16 天內：用天氣預報（api.open-meteo.com/v1/forecast）。
   - 更早：用過去 10 年同日的實測資料計平均（archive-api.open-meteo.com/v1/archive）。
   - 結果暫存在瀏覽器（預報 3 小時、往年平均 30 天），不寫入雲端。
   - 讀不到（離線、被封鎖）時安靜地不顯示。
   ========================================================== */
(function () {
  "use strict";
  const FORECAST_DAYS = 16;
  const YEARS = 10;
  const TTL = { forecast: 3 * 3600e3, climate: 30 * 86400e3 };
  const KEY = "tripplanner:weather:v1:";

  // WMO 天氣代碼 → 圖示類別與中文
  function describe(code) {
    if (code == null) return { kind: "cloud", label: "" };
    if (code === 0) return { kind: "sun", label: "晴" };
    if (code === 1) return { kind: "sun", label: "大致晴朗" };
    if (code === 2) return { kind: "partly", label: "局部多雲" };
    if (code === 3) return { kind: "cloud", label: "陰天" };
    if (code === 45 || code === 48) return { kind: "fog", label: "有霧" };
    if (code >= 51 && code <= 55) return { kind: "rain", label: "毛毛雨" };
    if (code === 56 || code === 57 || code === 66 || code === 67) return { kind: "sleet", label: "凍雨" };
    if (code >= 61 && code <= 65) return { kind: "rain", label: code === 65 ? "大雨" : "雨" };
    if (code >= 71 && code <= 77) return { kind: "snow", label: code === 75 ? "大雪" : "雪" };
    if (code >= 80 && code <= 82) return { kind: "rain", label: "陣雨" };
    if (code === 85 || code === 86) return { kind: "snow", label: "陣雪" };
    if (code >= 95) return { kind: "storm", label: "雷雨" };
    return { kind: "cloud", label: "" };
  }

  // 原創 20×20 小圖示（與網站同一套描邊風格）
  const S = 'stroke="#3E3A39" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  const CLOUD = (y = 0, fill = "#fff") => `<path d="M5.5 ${15 + y}h9a3.2 3.2 0 0 0 .3-6.4 4.6 4.6 0 0 0-8.8 1.2A2.6 2.6 0 0 0 5.5 ${15 + y}z" fill="${fill}" ${S}/>`;
  const ICONS = {
    sun: `<circle cx="10" cy="10" r="4" fill="#F6D27A" ${S}/><path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" ${S} fill="none"/>`,
    partly: `<circle cx="7.5" cy="7.5" r="3.4" fill="#F6D27A" ${S}/><path d="M7.5 1.6v1.3M1.6 7.5h1.3M3.3 3.3l.9.9M11.7 3.3l-.9.9" ${S} fill="none"/>${CLOUD(1.5)}`,
    cloud: CLOUD(-1.5),
    fog: `${CLOUD(-3.5)}<path d="M4 15h12M6 18h9" ${S} fill="none"/>`,
    rain: `${CLOUD(-4)}<path d="M7 14l-1 3M10.5 14l-1 3M14 14l-1 3" stroke="#4678C5" stroke-width="1.7" stroke-linecap="round" fill="none"/>`,
    sleet: `${CLOUD(-4)}<path d="M7 14l-1 3M13.5 14l-1 3" stroke="#4678C5" stroke-width="1.7" stroke-linecap="round" fill="none"/><circle cx="10.2" cy="15.6" r="1.1" fill="#A8D3E6" ${S}/>`,
    snow: `${CLOUD(-4)}<g fill="#fff" ${S}><circle cx="6.8" cy="15.2" r="1.2"/><circle cx="10.4" cy="17" r="1.2"/><circle cx="14" cy="15.2" r="1.2"/></g>`,
    storm: `${CLOUD(-4, "#DED2ED")}<path d="M10.8 12.5 8.6 15.8h2.4l-1.6 3" stroke="#D8902C" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  };
  const icon = (kind, label) => `<svg class="wxicon" viewBox="0 0 20 20" role="img" aria-label="${label || kind}">${ICONS[kind] || ICONS.cloud}</svg>`;

  // ---------- 小工具 ----------
  function seoulToday(tz) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz || "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }
  function addDays(ymd, n) { const d = new Date(ymd + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function readCache(k, ttl) {
    try { const o = JSON.parse(localStorage.getItem(KEY + k) || "null"); if (o && Date.now() - o.t < ttl) return o.d; } catch (e) { }
    return null;
  }
  function writeCache(k, d) { try { localStorage.setItem(KEY + k, JSON.stringify({ t: Date.now(), d })); } catch (e) { } }

  const mem = {};       // key → 資料
  const inflight = {};  // key → Promise
  const failed = {};    // key → 失敗時間（避免一直重試）

  function load(key, url, ttl, parse, onDone) {
    if (mem[key]) return mem[key];
    const c = readCache(key, ttl);
    if (c) { mem[key] = c; return c; }
    if (inflight[key] || (failed[key] && Date.now() - failed[key] < 5 * 60e3)) return null;
    inflight[key] = fetch(url).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(j => { const d = parse(j); mem[key] = d; writeCache(key, d); delete inflight[key]; onDone && onDone(); })
      .catch(() => { failed[key] = Date.now(); delete inflight[key]; });
    return null;
  }

  /** 預報：date → { code, tmax, tmin, pop } */
  function parseForecast(j) {
    const d = j.daily || {}, out = {};
    (d.time || []).forEach((t, i) => {
      out[t] = { code: d.weather_code?.[i], tmax: d.temperature_2m_max?.[i], tmin: d.temperature_2m_min?.[i], pop: d.precipitation_probability_max?.[i] };
    });
    return out;
  }
  /** 往年：MM-DD → { tmax, tmin, years, rainYears, snowYears } */
  function parseClimate(j) {
    const d = j.daily || {}, acc = {};
    (d.time || []).forEach((t, i) => {
      const md = t.slice(5), a = acc[md] || (acc[md] = { mx: 0, mn: 0, n: 0, rain: 0, snow: 0 });
      const mx = d.temperature_2m_max?.[i], mn = d.temperature_2m_min?.[i];
      if (mx == null || mn == null) return;
      a.mx += mx; a.mn += mn; a.n++;
      if ((d.precipitation_sum?.[i] || 0) >= 1) a.rain++;
      if ((d.snowfall_sum?.[i] || 0) >= 0.2) a.snow++;
    });
    const out = {};
    Object.entries(acc).forEach(([md, a]) => { if (a.n) out[md] = { tmax: a.mx / a.n, tmin: a.mn / a.n, years: a.n, rainYears: a.rain, snowYears: a.snow }; });
    return out;
  }

  /**
   * 取得各日天氣。先回傳已有的資料；缺的會在背景下載，完成後呼叫 onChange。
   * @returns { [date]: { src: "forecast"|"climate", kind, label, tmax, tmin, pop?, years?, rainYears?, snowYears? } }
   */
  function forDays(days, pt, tz, onChange) {
    const out = {};
    if (!days.length || !pt || pt.lat == null || pt.lng == null || typeof fetch !== "function") return out;
    const lat = Number(pt.lat).toFixed(2), lng = Number(pt.lng).toFixed(2);
    const today = seoulToday(tz), last = addDays(today, FORECAST_DAYS - 1);
    const inWindow = days.filter(d => d >= today && d <= last);
    let fc = null, fcKey = null;
    if (inWindow.length) {
      const k = fcKey = `fc:${lat},${lng}:${today}`;
      fc = load(k, `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(tz || "Asia/Seoul")}&forecast_days=${FORECAST_DAYS}`, TTL.forecast, parseForecast, onChange);
    }
    // 全部日子都在預報範圍內、預報仍在下載時，不必再下載往年資料
    const waitFc = fcKey && !fc && inWindow.length === days.length && !failed[fcKey];
    const needClimate = waitFc ? [] : days.filter(d => !(fc && fc[d]));
    let cl = null;
    if (needClimate.length) {
      // 過去 10 年、涵蓋同一段日期（只取行程的月日）
      const first = days[0], end = days[days.length - 1];
      const y = Number(today.slice(0, 4)) - (today.slice(5) > first.slice(5) ? 0 : 1); // 最近一個已完整過去的同期
      const span = end.slice(0, 4) !== first.slice(0, 4) ? 1 : 0;                        // 跨年行程
      const s = `${y - YEARS + 1 - span}-${first.slice(5)}`, e = `${y}-${end.slice(5)}`;
      const k = `cl:${lat},${lng}:${s}:${e}`;
      cl = load(k, `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${s}&end_date=${e}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum&timezone=${encodeURIComponent(tz || "Asia/Seoul")}`, TTL.climate, parseClimate, onChange);
    }
    days.forEach(d => {
      const f = fc && fc[d];
      if (f && f.tmax != null) { const ds = describe(f.code); out[d] = { src: "forecast", kind: ds.kind, label: ds.label, tmax: f.tmax, tmin: f.tmin, pop: f.pop }; return; }
      const c = cl && cl[d.slice(5)];
      if (c) {
        const kind = c.snowYears / c.years >= 0.4 ? "snow" : c.rainYears / c.years >= 0.4 ? "rain" : (c.snowYears + c.rainYears) / c.years >= 0.3 ? "cloud" : "partly";
        out[d] = Object.assign({ src: "climate", kind, label: "往年平均" }, c);
      }
    });
    return out;
  }

  window.Weather = { forDays, icon, describe, FORECAST_DAYS, _mem: mem };
})();
