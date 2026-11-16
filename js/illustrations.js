/*
 * 原創 SVG 插圖。墨灰 #3E3A39 圓端描邊、平塗、短高光。
 * 日期列插圖：40 × 30 viewBox、線寬 1.7。品牌插圖：251 × 66 viewBox、線寬 3。
 * 題材由 pickDayArt(dayItems) 依當日行程自動挑選。
 */
(function () {
  const INK = "#3E3A39";
  const C = { yellow: "#F6D27A", coral: "#F2A497", water: "#A8D3E6", green: "#B9DAA5", white: "#FFFFFF",
    lilac: "#DED2ED", apricot: "#F4C7AA", brown: "#B98A62", roof: "#8E9DA8", red: "#E2705A" };

  // 每個題材：title（可及名稱）、svg 內容（40×30 座標）
  const ART = {
    plane: { title: "飛機", body: `
      <path d="M2 10h6M1 14.5h4M3 23h6" stroke="${C.water}"/>
      <path d="M17.5 14.5 13 6.5h4l7.5 7.2z" fill="${C.white}"/>
      <path d="M6.5 17.6 30 12.6c4-.8 6.3.4 6.3 2.1 0 1.6-1.6 2.5-4.6 3.1L9 22.4c-2.4.4-3.9-.6-3.9-2.2 0-1.2.5-2.2 1.4-2.6z" fill="${C.white}"/>
      <path d="M8.7 19.6 32.6 14.8" stroke="${C.coral}"/>
      <path d="M18 19.6 15 26h4l6.2-7.4z" fill="${C.white}"/>
      <circle cx="27" cy="15.6" r=".6" fill="${INK}" stroke="none"/><circle cx="24" cy="16.2" r=".6" fill="${INK}" stroke="none"/>
      <path d="M31.5 14.2h1.5" stroke="${C.white}"/>` },
    hanok: { title: "韓屋", body: `
      <rect x="9" y="15" width="22" height="11" fill="${C.white}"/>
      <path d="M3 13.5c4 1 8 .3 10-3.5h14c2 3.8 6 4.5 10 3.5-2.5 2.8-5.5 3.3-8 2.5H11c-2.5.8-5.5.3-8-2.5z" fill="${C.roof}"/>
      <path d="M12 16v10M28 16v10" stroke="${C.brown}"/>
      <rect x="17" y="18" width="6" height="8" fill="${C.yellow}"/>
      <path d="M15 12h4" stroke="${C.white}"/>` },
    crab: { title: "醬油蟹", body: `
      <path d="M8 13c-3-1-4-5-2-7 1 2 3 2 4 1 0 3-1 5-2 6zM32 13c3-1 4-5 2-7-1 2-3 2-4 1 0 3 1 5 2 6z" fill="${C.red}"/>
      <path d="M11 22l-4 3M12 24l-2 3M29 22l4 3M28 24l2 3" />
      <ellipse cx="20" cy="19" rx="10" ry="6.5" fill="${C.red}"/>
      <path d="M17 11v3M23 11v3"/><circle cx="17" cy="10.5" r="1.2" fill="${C.white}"/><circle cx="23" cy="10.5" r="1.2" fill="${C.white}"/>
      <path d="M14 17h3" stroke="${C.apricot}"/>` },
    market: { title: "綠豆煎餅", body: `
      <path d="M31 17l7-4" stroke="${INK}"/>
      <ellipse cx="18" cy="18" rx="14" ry="8" fill="#6C6866"/>
      <ellipse cx="18" cy="17" rx="10" ry="5.3" fill="${C.yellow}"/>
      <circle cx="14" cy="16" r="1" fill="${C.green}"/><circle cx="20" cy="18.5" r="1" fill="${C.coral}"/><circle cx="22" cy="15" r="1" fill="${C.green}"/>
      <path d="M11 14.5l2-1" stroke="${C.white}"/>` },
    lightstick: { title: "演唱會手燈", body: `
      <path d="M6 6l2 2M5 14h3M34 6l-2 2M35 14h-3" stroke="${C.yellow}"/>
      <rect x="17.5" y="17" width="5" height="11" rx="1.5" fill="${C.white}"/>
      <circle cx="20" cy="11" r="7" fill="${C.water}"/>
      <path d="M17 8.5c.8-1.2 2-1.8 3-1.8" stroke="${C.white}"/>
      <path d="M20 9.3c-1-1.4-3.2-.4-2.3 1.4L20 13l2.3-2.3c.9-1.8-1.3-2.8-2.3-1.4z" fill="${C.coral}" stroke-width="1"/>` },
    fish: { title: "海鮮市場", body: `
      <path d="M5 15c4-7 15-8 22 0-7 8-18 7-22 0z" fill="${C.water}"/>
      <path d="M27 15l7-6v12z" fill="${C.water}"/>
      <circle cx="11" cy="13.5" r="1.4" fill="${C.white}"/>
      <path d="M17 11v8" stroke="${C.white}"/>
      <circle cx="33" cy="4.5" r="1.4" fill="${C.white}"/><circle cx="37" cy="8" r="1" fill="${C.white}"/>` },
    bag: { title: "購物袋", body: `
      <path d="M15 11c0-5 10-5 10 0" fill="none"/>
      <path d="M9 11h22l2 16H7z" fill="${C.coral}"/>
      <path d="M13 15h3" stroke="${C.white}"/>
      <circle cx="20" cy="19" r="2.5" fill="${C.yellow}"/>` },
    cart: { title: "超市購物車", body: `
      <rect x="12" y="6" width="8" height="7" fill="${C.yellow}"/><rect x="20" y="8" width="8" height="5" fill="${C.green}"/>
      <path d="M3 5h4l3 14h20l3-10H8" fill="none"/>
      <path d="M8.5 9H33l-3 10H10.5z" fill="${C.white}"/>
      <circle cx="13" cy="24" r="2.2" fill="${C.white}"/><circle cx="27" cy="24" r="2.2" fill="${C.white}"/>` },
    suitcase: { title: "行李箱", body: `
      <path d="M15 9V5h10v4"/>
      <rect x="9" y="9" width="22" height="16" rx="3" fill="${C.water}"/>
      <path d="M15 9v16M25 9v16" stroke="${C.white}"/>
      <circle cx="13" cy="27" r="1.4" fill="${C.white}"/><circle cx="27" cy="27" r="1.4" fill="${C.white}"/>` },
    hotel: { title: "酒店", body: `
      <rect x="10" y="5" width="20" height="21" fill="${C.water}"/>
      <rect x="13" y="8" width="4" height="4" fill="${C.white}"/><rect x="23" y="8" width="4" height="4" fill="${C.white}"/>
      <rect x="13" y="14" width="4" height="4" fill="${C.white}"/><rect x="23" y="14" width="4" height="4" fill="${C.white}"/>
      <rect x="18" y="20" width="4" height="6" fill="${C.yellow}"/>
      <path d="M4 26h32"/>` },
    bbq: { title: "韓式烤肉", body: `
      <path d="M14 27c-2-3 1-4 0-7 3 2 3 4 2 7zM24 27c-2-3 1-4 0-7 3 2 3 4 2 7z" fill="${C.yellow}" stroke-width="1.2"/>
      <ellipse cx="20" cy="15" rx="15" ry="6" fill="#6C6866"/>
      <path d="M10 14c3-2 6-2 8 0M22 16c3-2 6-2 8 0" stroke="${C.coral}" stroke-width="2.6"/>
      <path d="M12 12.5h2" stroke="${C.white}"/>` },
    cafe: { title: "咖啡店", body: `
      <path d="M16 3c-1 2 1 3 0 5M21 3c-1 2 1 3 0 5" stroke="${C.roof}"/>
      <path d="M9 11h20v6a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="${C.white}"/>
      <path d="M29 13h2a3 3 0 0 1 0 6h-2.5"/>
      <path d="M12 14h12" stroke="${C.apricot}" stroke-width="2.4"/>` },
    walk: { title: "散步", body: `
      <path d="M8 22c-2-4 0-10 3-10s3 6 1 10z" fill="${C.green}"/><path d="M22 18c-2-4 0-10 3-10s3 6 1 10z" fill="${C.green}"/>
      <circle cx="10" cy="25" r="1.6" fill="${C.green}"/><circle cx="24" cy="21" r="1.6" fill="${C.green}"/>` },
    tower: { title: "南山塔", body: `
      <path d="M4 27c6-9 26-9 32 0z" fill="${C.green}"/>
      <path d="M20 19V9"/>
      <rect x="16" y="9" width="8" height="4" rx="1.5" fill="${C.white}"/>
      <path d="M20 9V3" stroke="${C.coral}"/>` }
  };

  // 關鍵字 → 題材與權重
  const RULES = [
    { art: "lightstick", w: 6, re: /演唱會|ASIA TOUR|CONTINUE|Art Hall|體育館|Arena|concert|fan ?meeting/i },
    { art: "crab", w: 5, re: /醬油蟹|게장|蟹/ },
    { art: "fish", w: 5, re: /海鮮|魚|Garak|可樂市場/i },
    { art: "market", w: 4, re: /廣藏|煎餅|(?<!可樂)市場/ },
    { art: "hanok", w: 4, re: /韓屋|仁寺洞|北村|景福宮|宮/ },
    { art: "cart", w: 5, re: /超市|Mart|Zettaplex|樂天/i },
    { art: "bbq", w: 4, re: /烤肉|韓牛|BBQ/i },
    { art: "bag", w: 4, re: /行街|購物|明洞|IPark|周邊|手信|弘大|聖水/i },
    { art: "cafe", w: 2, re: /Cafe|咖啡/i },
    { art: "tower", w: 5, re: /南山|N Seoul Tower|首爾塔/i },
    { art: "suitcase", w: 2, re: /Check-out|行李/i }
  ];

  function scoreDay(items, ctx) {
    const s = {};
    const add = (k, v) => { s[k] = (s[k] || 0) + v; };
    let concerts = 0;
    items.forEach(it => {
      const text = `${it.name} ${it.note || ""}`;
      if (it.category === "flight" && (ctx.isFirst || ctx.isLast)) add("plane", ctx.isFirst ? 7 : 4);
      RULES.forEach(r => { if (r.re.test(text)) { if (!s[r.art] || r.w > 0) s[r.art] = Math.max(s[r.art] || 0, r.w); if (r.art === "lightstick") concerts++; } });
    });
    if (concerts >= 2) add("lightstick", 1);
    // 前幾日已用作主圖的題材降低分數，讓每日插圖有辨識度
    Object.keys(s).forEach(k => { s[k] -= 3 * (ctx.used[k] || 0); });
    return s;
  }

  /** 逐日挑選插圖。days: [{date, items}] → [{arts:[k] , title}] */
  function pickAllDays(days) {
    const used = {};
    return days.map((d, i) => {
      const sc = scoreDay(d.items, { isFirst: i === 0, isLast: i === days.length - 1, used });
      const ranked = Object.entries(sc).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
      let arts;
      if (!ranked.length) arts = d.items.some(x => x.category === "stay") ? ["hotel"] : ["walk"];
      else if (ranked[1] && ranked[1][1] >= ranked[0][1] * 0.8) arts = [ranked[0][0], ranked[1][0]];
      else arts = [ranked[0][0]];
      arts.forEach(a => { used[a] = (used[a] || 0) + 1; });
      return { arts, title: arts.map(a => ART[a].title).join("與") };
    });
  }

  function dayArtSVG(pick, cls = "dayart") {
    const wrap = (inner) => `<svg class="${cls}" viewBox="0 0 40 30" role="img" aria-label="${pick.title}" xmlns="http://www.w3.org/2000/svg"><title>${pick.title}</title><g fill="none" stroke="${INK}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
    if (pick.arts.length === 1) return wrap(ART[pick.arts[0]].body);
    const [a, b] = pick.arts;
    return wrap(`<g transform="translate(-1 6) scale(.62)">${ART[a].body}</g><g transform="translate(16 6) scale(.62)">${ART[b].body}</g>`);
  }

  // 品牌插圖：東大門城門、南山塔、地鐵列車（可獨立動作）、手燈
  const BRAND = `<svg class="brand-art" viewBox="0 0 251 66" role="img" aria-label="首爾城門、南山塔、地鐵與演唱會手燈" xmlns="http://www.w3.org/2000/svg">
  <title>首爾城門、南山塔、地鐵與演唱會手燈</title>
  <g fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M70 58c10-22 50-30 66 0z" fill="${C.green}"/>
    <path d="M101 40V18"/><rect x="94" y="18" width="14" height="8" rx="3" fill="${C.white}"/><path d="M101 18V8" stroke="${C.coral}"/>
    <rect x="12" y="34" width="44" height="24" fill="#EFE3CF"/>
    <path d="M27 58V48a7 7 0 0 1 14 0v10" fill="${C.white}"/>
    <path d="M6 32c6 1.5 11 .5 14-5h28c3 5.5 8 6.5 14 5-4 4-9 4.5-13 3.5H19c-4 1-9 .5-13-3.5z" fill="${C.roof}"/>
    <path d="M20 26c2-4 4-6 6-7h16c2 1 4 3 6 7z" fill="${C.roof}"/>
    <path d="M24 30h6" stroke="${C.white}"/>
    <path d="M4 58h243"/>
    <g class="brand-train">
      <path d="M126 54V42a4 4 0 0 1 4-4h30v16z" fill="${C.yellow}"/>
      <rect x="163" y="38" width="34" height="16" rx="4" fill="${C.yellow}"/>
      <rect x="132" y="42" width="8" height="6" rx="1.5" fill="${C.white}"/><rect x="144" y="42" width="8" height="6" rx="1.5" fill="${C.white}"/>
      <rect x="168" y="42" width="8" height="6" rx="1.5" fill="${C.white}"/><rect x="181" y="42" width="8" height="6" rx="1.5" fill="${C.white}"/>
      <path d="M126 50h71" stroke="${C.coral}"/>
      <circle cx="136" cy="56" r="3" fill="${C.white}"/><circle cx="152" cy="56" r="3" fill="${C.white}"/>
      <circle cx="172" cy="56" r="3" fill="${C.white}"/><circle cx="188" cy="56" r="3" fill="${C.white}"/>
    </g>
    <path d="M211 12l3 3M209 24h4M239 12l-3 3M241 24h-4" stroke="${C.yellow}"/>
    <rect x="221" y="31" width="8" height="22" rx="2" fill="${C.white}"/>
    <circle cx="225" cy="21" r="10" fill="${C.water}"/>
    <path d="M220 17c1-2 3-3 5-3" stroke="${C.white}"/>
  </g></svg>`;

  window.Illustrations = { ART, pickAllDays, dayArtSVG, BRAND, COLORS: C };
})();
