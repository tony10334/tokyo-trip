/* ============================================================
   畫面邏輯
   ============================================================ */

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

const TYPE_ICON = {
  move: '✈️', food: '🍜', see: '⛩️', shop: '🛍️',
  stay: '🏨', free: '🚶', cafe: '☕', night: '🌃',
};
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

let currentDay = 1;

/* ------------------------------------------------------------
   啟動
   ------------------------------------------------------------ */
(async function boot() {
  try {
    await start();
  } catch (err) {
    // 不要留給使用者一片空白 —— 通常是瀏覽器拿到新舊混用的檔案造成的
    console.error(err);
    $('#dayContent').innerHTML = `
      <div class="card">
        <div class="card-head"><h3>畫面載入失敗</h3></div>
        <p class="hint">通常是瀏覽器抓到舊的檔案。請重新整理一次；
          如果還是一樣,長按重新整理選「強制重新載入」,或關掉分頁重開。</p>
        <div class="btn-row">
          <button class="btn-line" onclick="location.reload(true)">重新整理</button>
        </div>
        <p class="hint" style="margin-top:12px">錯誤訊息：${esc(err && err.message)}</p>
      </div>`;
  }
})();

async function start() {
  const nights = ITINERARY.length - 1;
  const daysText = `${ITINERARY.length}日${nights}夜`;
  document.title = `東京 ${daysText}`;
  $('#tripDays').textContent = daysText;
  $('#eyebrowDays').textContent = daysText;

  bindTabs();
  $('#tripPill').addEventListener('click', () => {
    if ($('#tripPill').classList.contains('is-cta')) goTab('info');
  });
  bindDayNav();
  bindExpenseForm();
  bindChecklistForm();
  bindDataButtons();

  Store.onChange(renderAll);
  await Store.init();

  // 第一次打開跳編輯教學,之後從「❓ 編輯教學」隨時看
  if (!localStorage.getItem(TOUR_KEY)) showEditTour(false);
}

function renderAll() {
  renderBrand();
  renderItinerary();
  renderFood();
  renderExpenses();
  renderChecklist();
  renderInfo();
}

/* ------------------------------------------------------------
   頂部
   ------------------------------------------------------------ */
function renderBrand() {
  const n = Store.state.members.length || CONFIG.members.length;
  $('#tripSub').textContent = `${n}人旅遊手冊`;

  const pill = $('#tripPill');
  const st = Store.status;
  if (st.mode === 'cloud') {
    if (st.code === 404) {
      // 房間被雲端清掉了 —— 點一下去「資訊」分頁重建
      pill.textContent = '房間失效,點我重建 ›';
      pill.classList.remove('is-cloud');
      pill.classList.add('is-cta');
    } else {
      pill.textContent = st.ok ? '4人共享中' : (st.msg || '離線中');
      pill.classList.toggle('is-cloud', st.ok);
      pill.classList.remove('is-cta');
    }
  } else if (CONFIG.mode === 'shared') {
    // 還沒開房 —— 點一下直接跳去開
    pill.textContent = '尚未共享 ›';
    pill.classList.remove('is-cloud');
    pill.classList.add('is-cta');
  } else {
    pill.classList.remove('is-cloud', 'is-cta');
    pill.textContent = CONFIG.startDate ? `${fmtDate(dayDate(1))} 出發` : '待定出發';
  }
}

function goTab(name) {
  const btn = document.querySelector(`.tab[data-page="${name}"]`);
  if (btn) btn.click();
}

function dayDate(day) {
  if (!CONFIG.startDate) return null;
  const d = new Date(CONFIG.startDate + 'T00:00:00');
  d.setDate(d.getDate() + day - 1);
  return d;
}
function fmtDate(d) { return d ? `${d.getMonth() + 1}/${d.getDate()}` : ''; }

/* ------------------------------------------------------------
   分頁切換
   ------------------------------------------------------------ */
function bindTabs() {
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab').forEach(b => b.classList.toggle('active', b === btn));
      $$('.page').forEach(p => p.classList.add('hidden'));
      $('#page-' + btn.dataset.page).classList.remove('hidden');
      window.scrollTo({ top: 0 });
    });
  });
}

/* ------------------------------------------------------------
   行程
   ------------------------------------------------------------ */
function bindDayNav() {
  $('#dayPrev').addEventListener('click', () => goDay(currentDay - 1));
  $('#dayNext').addEventListener('click', () => goDay(currentDay + 1));
}
function goDay(n) {
  if (n < 1 || n > ITINERARY.length) return;
  currentDay = n;
  renderItinerary();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderItinerary() {
  /* --- 日期橫捲列 --- */
  const bar = $('#dayBar');
  bar.innerHTML = '';
  ITINERARY.forEach(d => {
    const b = document.createElement('button');
    b.className = 'daybtn' + (d.day === currentDay ? ' active' : '');
    const dt = dayDate(d.day);
    // 有出發日期就顯示成日曆（週三 / 23）,沒有就退回 D1 D2
    b.innerHTML = dt
      ? `<span class="dw">${WEEK[dt.getDay()]}</span><span class="dn">${dt.getDate()}</span>`
      : `<span class="dw">D</span><span class="dn">${d.day}</span>`;
    b.addEventListener('click', () => goDay(d.day));
    bar.appendChild(b);
  });

  /* --- 日卡 --- */
  const day = ITINERARY.find(d => d.day === currentDay) || ITINERARY[0];
  const dt = dayDate(day.day);
  const tag = dt ? `${fmtDate(dt)}（週${WEEK[dt.getDay()]}）` : (day.tag || '待定');

  $('#dayContent').innerHTML = `
    <article class="daycard">
      <div class="daycard-head">
        <div class="dc-label">Day ${day.day} · ${esc(tag)}</div>
        <h3>${esc(day.title)}</h3>
        <p>${esc(day.area || '')}</p>
      </div>
      <div class="daycard-body">${dayItems(day).map(rowHTML).join('')}</div>
      <div class="edit-row">
        <button type="button" class="btn-add-item" id="btnAddItem">＋ 新增行程</button>
        <button type="button" class="btn-tour" id="btnEditTour">❓ 編輯教學</button>
      </div>
    </article>`;

  bindRowEditing(day);
  renderDayMap();

  /* --- 上一天 / 下一天 --- */
  const prev = $('#dayPrev'), next = $('#dayNext');
  prev.disabled = currentDay === 1;
  next.disabled = currentDay === ITINERARY.length;
  prev.textContent = currentDay === 1 ? '← 第一天' : `← Day ${currentDay - 1}`;
  next.textContent = currentDay === ITINERARY.length ? '最後一天 →' : `Day ${currentDay + 1} →`;
}

/* ------------------------------------------------------------
   地圖（自己畫的示意圖,不連外、不用金鑰、離線也看得到）
   ------------------------------------------------------------ */
const MAP = { latMax: 35.740, latMin: 35.620, lngMin: 139.670, lngMax: 139.820, w: 1000, h: 980 };
const DAY_COLOR = ['#a3123c', '#d4691e', '#2e8b64', '#2b6cb0', '#7c3aed', '#b45309', '#64748b'];

function proj(lat, lng) {
  return [
    (lng - MAP.lngMin) / (MAP.lngMax - MAP.lngMin) * MAP.w,
    (MAP.latMax - lat) / (MAP.latMax - MAP.latMin) * MAP.h,
  ];
}

/** 這一天有座標的點,依行程順序（含使用者新增、套用過補丁的項目） */
function dayPins(day) {
  return dayItems(day)
    .map(it => ({ it, g: (it.place && GEO[it.place]) || it.geo }))
    .filter(x => x.it.place && x.g)
    .map(x => ({ title: x.it.title, place: x.it.place, time: x.it.time, xy: proj(...x.g) }));
}

function renderDayMap() {
  const day = ITINERARY.find(d => d.day === currentDay) || ITINERARY[0];
  const pins = dayPins(day);
  const color = DAY_COLOR[(day.day - 1) % DAY_COLOR.length];

  if (!pins.length) {
    $('#dayMap').innerHTML = `<div class="card map-card"><div class="map-empty">
      這天不在東京市區（${esc(day.area)}）,示意圖只畫市區範圍</div></div>`;
    return;
  }

  // 其他天的點：畫成淡灰小點當背景參考
  const others = ITINERARY.filter(d => d.day !== day.day).flatMap(dayPins);

  const loop = YAMANOTE.map(([, la, ln]) => proj(la, ln).map(Math.round).join(',')).join(' ');
  const stations = YAMANOTE.filter(([n]) => MAP_STATIONS.includes(n)).map(([n, la, ln]) => {
    const [x, y] = proj(la, ln);
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7" class="mp-stn"/>
            <text x="${(x + 12).toFixed(0)}" y="${(y + 6).toFixed(0)}" class="mp-stn-t">${n}</text>`;
  }).join('');

  // 太近的點合併成一顆,不然圓圈會疊在一起看不出有幾個地方
  const clusters = clusterPins(pins);

  const path = clusters.length > 1
    ? `<polyline points="${clusters.map(c => `${Math.round(c.x)},${Math.round(c.y)}`).join(' ')}"
         fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="10 8"
         stroke-linejoin="round" opacity=".55"/>` : '';

  // 只畫編號,名稱放地圖下面的對照表 —— 直接標在圖上會互相疊住看不清楚
  const dots = clusters.map(c => {
    const label = clusterLabel(c.idx);
    const r = 22 + (label.length - 1) * 3.5;
    const fs = label.length <= 1 ? 26 : label.length <= 3 ? 22 : 18;
    return `<circle cx="${c.x.toFixed(0)}" cy="${c.y.toFixed(0)}" r="${r.toFixed(0)}" fill="${color}"
              stroke="#faf8f5" stroke-width="4"/>
            <text x="${c.x.toFixed(0)}" y="${(c.y + fs * 0.34).toFixed(0)}"
              class="mp-num" style="font-size:${fs}px">${label}</text>`;
  }).join('');

  const legend = pins.map((p, i) => `
    <a class="mp-leg" target="_blank" rel="noopener"
       href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.place)}">
      <span class="mp-leg-n" style="background:${color}">${i + 1}</span>
      <span class="mp-leg-t">${esc(p.title)}</span>
      ${p.time ? `<span class="mp-leg-time">${esc(p.time)}</span>` : ''}
    </a>`).join('');

  const open = localStorage.getItem(MAP_OPEN_KEY) === '1';

  $('#dayMap').innerHTML = `
    <div class="card map-card${open ? ' open' : ''}">
      <button type="button" class="map-head" id="mapToggle">
        <span class="map-title">Day ${day.day} 大概在哪</span>
        <span class="map-count">${pins.length} 個地方</span>
        <span class="map-chev">${open ? '▴' : '▾'}</span>
      </button>
      <div class="map-body">
      <div class="map-route">
        <a class="map-btn" target="_blank" rel="noopener" href="${dayRouteURL(pins)}">用 Google 地圖看路線 ↗</a>
      </div>
      <svg viewBox="0 0 ${MAP.w} ${MAP.h}" class="map-svg" role="img"
           aria-label="Day ${day.day} 景點相對位置示意圖">
        <path class="mp-bay" d="M520,980 L560,900 L640,865 L700,870 L760,905 L840,895 L1000,915 L1000,980 Z"/>
        <text x="880" y="955" class="mp-bay-t">東京灣</text>
        <polygon points="${loop}" class="mp-loop"/>
        <text x="150" y="430" class="mp-loop-t">山手線</text>
        ${others.map(o => `<circle cx="${o.xy[0].toFixed(0)}" cy="${o.xy[1].toFixed(0)}" r="6" class="mp-other"/>`).join('')}
        ${stations}
        ${path}
        ${dots}
      </svg>
      <div class="mp-legend">${legend}</div>
      <div class="map-foot">
        編號是這天的順序,點名稱可開 Google 地圖 · 灰點是其他天的地方<br>
        這是相對位置示意圖,只用來抓方向感,不是精確地圖
      </div>
      </div>
    </div>`;

  $('#mapToggle').addEventListener('click', () => {
    localStorage.setItem(MAP_OPEN_KEY, open ? '0' : '1');
    renderDayMap();
  });
}
const MAP_OPEN_KEY = 'tokyo-trip-map-open';

/** 把距離 50px 以內的點併成一顆,回傳 [{x, y, idx:[0-based 序號]}] */
function clusterPins(pins) {
  const MIN = 50;
  const out = [];
  pins.forEach((p, i) => {
    const hit = out.find(c => Math.hypot(c.x - p.xy[0], c.y - p.xy[1]) < MIN);
    if (hit) {
      hit.idx.push(i);
      hit.x = (hit.x * (hit.idx.length - 1) + p.xy[0]) / hit.idx.length;
      hit.y = (hit.y * (hit.idx.length - 1) + p.xy[1]) / hit.idx.length;
    } else {
      out.push({ x: p.xy[0], y: p.xy[1], idx: [i] });
    }
  });
  return out;
}

/** [0,1,2] → "1-3"　[0,2] → "1·3" */
function clusterLabel(idx) {
  const n = idx.map(i => i + 1);
  if (n.length === 1) return String(n[0]);
  const consecutive = n.every((v, i) => i === 0 || v === n[i - 1] + 1);
  return consecutive ? `${n[0]}-${n[n.length - 1]}` : n.join('·');
}

/** 用 Google 地圖開這一天的路線（免金鑰,直接開網頁或 App） */
function dayRouteURL(pins) {
  const names = pins.map(p => encodeURIComponent(p.place));
  if (names.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${names[0]}`;
  }
  const origin = names[0];
  const destination = names[names.length - 1];
  const way = names.slice(1, -1).slice(0, 9).join('%7C');   // Google 上限 9 個中繼點
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
       + (way ? `&waypoints=${way}` : '') + `&travelmode=transit`;
}

function rowHTML(it) {
  const q = encodeURIComponent(it.place || '');
  return `
    <div class="row" data-id="${esc(it._id || '')}">
      <span class="row-drag" title="按住上下拖曳可以改順序">⠿</span>
      <div class="row-time">${esc(it.time || '')}</div>
      <div class="row-ico">${TYPE_ICON[it.type] || '•'}</div>
      <div class="row-main">
        <div class="row-title">${esc(it.title)}${it.todo ? '<span class="badge">待填</span>' : ''}${it.dur ? `<span class="dur">⏱ ${esc(it.dur)}</span>` : ''}</div>
        ${it.go ? `<div class="row-go">🚃 ${esc(it.go)}</div>` : ''}
        ${it.note ? `<div class="row-note">${esc(it.note)}</div>` : ''}
        ${it.buy ? `<div class="row-buy">🛍️ ${esc(it.buy)}</div>` : ''}
        ${it.cost ? `<div class="row-cost">💰 ${esc(it.cost)}</div>` : ''}
        ${it.place || it.link ? `<div class="row-links">
          ${it.place ? `<a target="_blank" rel="noopener"
            href="https://www.google.com/maps/search/?api=1&query=${q}">📍 地圖</a>` : ''}
          ${it.link ? `<a target="_blank" rel="noopener" href="${esc(it.link)}">🔗 官網</a>` : ''}
        </div>` : ''}
      </div>
      <button type="button" class="row-menu" data-menu="${esc(it._id || '')}" title="編輯 / 刪除">⋯</button>
    </div>`;
}

/* ------------------------------------------------------------
   行程編輯（4 人共用,走 Store.itinEdits 補丁同步）
   ------------------------------------------------------------
   data.js 的行程是「底版」,所有人的增刪改存成補丁,畫面 = 底版 + 補丁。
   底版項目的 id 由「天數 + 標題」推出來,所以之後改 data.js 的標題
   會讓大家對這筆的編輯脫鉤 —— 盡量別改底版標題。
   ------------------------------------------------------------ */

/** 這一天套用補丁後的實際項目（每筆帶 _id） */
function dayItems(day) {
  const edits = new Map();      // itemId -> edit 紀錄（mergeById 已保證是最新一筆）
  const adds = [];
  let orderRec = null;
  (Store.state.itinEdits || []).forEach(r => {
    if (!r || !r.id) return;
    if (r.id.startsWith('edit:')) edits.set(r.id.slice(5), r);
    else if (r.id.startsWith('order:')) { if (r.id === 'order:d' + day.day) orderRec = r; }
    else if (r.day === day.day && !r.deleted && r.item) adds.push(r);
  });

  const seen = {};
  let items = day.items.map(it => {
    let id = 'b:' + day.day + ':' + (it.title || '');
    if (seen[id] != null) id += '#' + (++seen[id]);
    else seen[id] = 1;
    return { ...it, _id: id };
  });
  items = items.concat(adds.map(a => ({ ...a.item, _id: a.id })));

  items = items.map(it => {
    const e = edits.get(it._id);
    if (!e) return it;
    if (e.removed) return null;
    return e.full ? { ...e.full, _id: it._id } : it;
  }).filter(Boolean);

  if (orderRec && Array.isArray(orderRec.order)) {
    const pos = new Map(orderRec.order.map((id, i) => [id, i]));
    items = items.map((it, i) => [it, pos.has(it._id) ? pos.get(it._id) : 1e6 + i])
                 .sort((a, b) => a[1] - b[1]).map(x => x[0]);
  }
  return items;
}

/** 存一筆補丁：同 id 直接覆蓋（省得陣列越長越大） */
async function putEdit(rec) {
  await Store.commit(s => {
    const i = s.itinEdits.findIndex(x => x.id === rec.id);
    if (i >= 0) s.itinEdits[i] = rec; else s.itinEdits.push(rec);
  });
}

function bindRowEditing(day) {
  $$('#dayContent [data-menu]').forEach(b =>
    b.addEventListener('click', () => openItemModal(day, b.dataset.menu)));
  const add = $('#btnAddItem');
  if (add) add.addEventListener('click', () => openItemModal(day, null));
  const tour = $('#btnEditTour');
  if (tour) tour.addEventListener('click', () => showEditTour(true));
  $$('#dayContent .row-drag').forEach(h =>
    h.addEventListener('pointerdown', e => startDrag(e, h.closest('.row'), day.day)));
}

/* --- 拖曳排序 --- */
function startDrag(e, row, dayNo) {
  e.preventDefault();
  const body = row.parentElement;
  row.classList.add('dragging');
  const move = ev => {
    ev.preventDefault();
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const over = el && el.closest ? el.closest('.row') : null;
    if (over && over !== row && over.parentElement === body) {
      const r = over.getBoundingClientRect();
      body.insertBefore(row, ev.clientY < r.top + r.height / 2 ? over : over.nextSibling);
    }
  };
  const up = async () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    row.classList.remove('dragging');
    const order = [...body.querySelectorAll('.row')].map(r => r.dataset.id);
    await putEdit({ id: 'order:d' + dayNo, day: dayNo, order, ts: Date.now() });
    toast('順序已更新');
  };
  document.addEventListener('pointermove', move, { passive: false });
  document.addEventListener('pointerup', up);
}

/* --- 新增 / 編輯表單 --- */
const TYPE_OPTIONS = [
  ['see', '⛩️ 景點'], ['food', '🍜 吃的'], ['shop', '🛍️ 購物'], ['move', '✈️ 移動'],
  ['night', '🌃 夜景'], ['cafe', '☕ 咖啡'], ['stay', '🏨 住宿'], ['free', '🚶 自由'],
];

function openItemModal(day, itemId) {
  const editing = itemId ? dayItems(day).find(x => x._id === itemId) : null;
  const v = editing || {};
  showModal(editing ? '編輯行程' : `新增行程 · Day ${day.day}`, `
    <div class="field">
      <label>🔗 貼上 Google 地圖連結,自動帶入名稱（可跳過）</label>
      <input type="text" id="fUrl" placeholder="https://www.google.com/maps/place/…" inputmode="url">
      <p class="hint" style="margin:4px 0 0">手機分享的短網址（maps.app.goo.gl）讀不到內容 ——
        用瀏覽器開啟地點後複製網址列的完整網址,或直接在下面打名稱</p>
    </div>
    <div class="field-2col">
      <div class="field"><label>時間</label>
        <input type="text" id="fTime" value="${esc(v.time || '')}" placeholder="14:00 / 白天"></div>
      <div class="field"><label>大概逛多久</label>
        <input type="text" id="fDur" value="${esc(v.dur || '')}" placeholder="約 1 小時"></div>
    </div>
    <div class="field-2col">
      <div class="field"><label>類型</label>
        <select id="fType">${TYPE_OPTIONS.map(([k, l]) =>
          `<option value="${k}"${(v.type || 'see') === k ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label style="display:flex;align-items:center;gap:6px;margin-top:26px">
        <input type="checkbox" id="fTodo" style="width:auto"${v.todo ? ' checked' : ''}> 標成「待填」</label></div>
    </div>
    <div class="field"><label>標題（必填）</label>
      <input type="text" id="fTitle" value="${esc(v.title || '')}" placeholder="例：豐洲市場"></div>
    <div class="field"><label>🚃 交通（怎麼去）</label>
      <textarea id="fGo" rows="2" placeholder="上野站 →〔銀座線〕→ …">${esc(v.go || '')}</textarea></div>
    <div class="field"><label>備註</label>
      <textarea id="fNote" rows="3">${esc(v.note || '')}</textarea></div>
    <div class="field"><label>🛍️ 購物備註</label>
      <textarea id="fBuy" rows="2">${esc(v.buy || '')}</textarea></div>
    <div class="field"><label>💰 花費</label>
      <input type="text" id="fCost" value="${esc(v.cost || '')}" placeholder="門票 ¥1,000"></div>
    <div class="field-2col">
      <div class="field"><label>📍 地點名（開地圖用）</label>
        <input type="text" id="fPlace" value="${esc(v.place || '')}"></div>
      <div class="field"><label>🔗 官網連結</label>
        <input type="text" id="fLink" value="${esc(v.link || '')}" inputmode="url"></div>
    </div>
    <input type="hidden" id="fGeo" value="${esc(v.geo ? JSON.stringify(v.geo) : '')}">
    <div class="btn-row">
      <button class="btn-primary" id="fSave" style="flex:1">儲存</button>
      ${editing ? '<button class="btn-line" id="fDelete" style="color:#c0392b;border-color:#c0392b">刪除</button>' : ''}
    </div>
  `);

  $('#fUrl').addEventListener('change', () => applyGmapsUrl($('#fUrl').value));
  $('#fUrl').addEventListener('paste', () => setTimeout(() => applyGmapsUrl($('#fUrl').value), 50));

  $('#fSave').addEventListener('click', async () => {
    const item = {
      time: $('#fTime').value.trim(),
      type: $('#fType').value,
      title: $('#fTitle').value.trim(),
      dur: $('#fDur').value.trim() || undefined,
      go: $('#fGo').value.trim() || undefined,
      note: $('#fNote').value.trim() || undefined,
      buy: $('#fBuy').value.trim() || undefined,
      cost: $('#fCost').value.trim() || undefined,
      place: $('#fPlace').value.trim() || undefined,
      link: $('#fLink').value.trim() || undefined,
      todo: $('#fTodo').checked || undefined,
    };
    try { const g = JSON.parse($('#fGeo').value); if (Array.isArray(g)) item.geo = g; } catch {}
    if (!item.title) return toast('標題要填');
    if (editing) {
      await putEdit({ id: 'edit:' + itemId, full: item, ts: Date.now() });
    } else {
      await Store.commit(s => s.itinEdits.push({ id: uid(), day: day.day, item, ts: Date.now() }));
    }
    closeModal();
    toast(editing ? '已更新' : '已加進 Day ' + day.day);
  });

  const del = $('#fDelete');
  if (del) del.addEventListener('click', async () => {
    if (!confirm('確定刪除「' + (v.title || '') + '」？4 個人都會看到它消失。')) return;
    await putEdit({ id: 'edit:' + itemId, removed: true, ts: Date.now() });
    closeModal();
    toast('已刪除');
  });
}

/** 解析 Google 地圖完整網址：/place/名稱/@緯度,經度 或 !3d..!4d.. */
function applyGmapsUrl(raw) {
  raw = (raw || '').trim();
  if (!raw) return;
  let u;
  try { u = new URL(raw); } catch { return; }
  if (/(^|\.)goo\.gl$/.test(u.hostname)) {
    toast('短網址讀不到內容 —— 請用瀏覽器開啟後複製完整網址');
    return;
  }
  const m = u.pathname.match(/\/place\/([^/]+)/);
  const name = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  const d3 = raw.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const at = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const lat = d3 ? +d3[1] : at ? +at[1] : null;
  const lng = d3 ? +d3[2] : at ? +at[2] : null;
  if (name) {
    if (!$('#fTitle').value.trim()) $('#fTitle').value = name;
    $('#fPlace').value = name;
  }
  if (lat != null && lng != null) $('#fGeo').value = JSON.stringify([+lat.toFixed(4), +lng.toFixed(4)]);
  if (name || lat != null) toast('已帶入' + (name ? '「' + name + '」' : '座標'));
  else toast('這個網址裡沒有地點資訊,請確認是地點頁的完整網址');
}

/* --- 編輯教學 --- */
const TOUR_KEY = 'tokyo-trip-edit-tour-v1';
function showEditTour(manual) {
  localStorage.setItem(TOUR_KEY, '1');
  showModal('📝 行程可以自己改了', `
    <div class="tour">
      <div class="tour-step"><span class="tour-ico">⋯</span>
        <div><b>編輯 / 刪除</b><br>每筆行程右邊的「⋯」,點開就能改內容或刪掉</div></div>
      <div class="tour-step"><span class="tour-ico">＋</span>
        <div><b>新增行程</b><br>每天最下面的「＋ 新增行程」</div></div>
      <div class="tour-step"><span class="tour-ico">🔗</span>
        <div><b>貼地圖連結自動帶入</b><br>新增時把 Google 地圖的<b>完整網址</b>貼進最上面那格,
          名稱和座標自動填好。<br><small>⚠️ 手機分享的短網址不行 ——
          用瀏覽器開啟地點後複製網址列,或直接打店名</small></div></div>
      <div class="tour-step"><span class="tour-ico">⠿</span>
        <div><b>拖曳排序</b><br>按住每筆左邊的「⠿」上下拖,就能改順序</div></div>
      <div class="tour-step"><span class="tour-ico">☁️</span>
        <div><b>四個人同步</b><br>改動會同步給所有人（15 秒內）;沒網路照樣能改,回線自動補傳</div></div>
      <div class="tour-step"><span class="tour-ico">❓</span>
        <div><b>忘記了?</b><br>每天行程最下面有「❓ 編輯教學」,隨時點開複習</div></div>
    </div>
    <button class="btn-primary" id="tourOk" style="width:100%">開始使用</button>
  `);
  $('#tourOk').addEventListener('click', closeModal);
}

/* ------------------------------------------------------------
   美食
   ------------------------------------------------------------ */
const FOOD_AREA_KEY = 'tokyo-trip-food-area';

/** 底版 FOOD + 大家新增的店,合成完整分區清單 */
function foodGroups() {
  const groups = FOOD.map(g => ({ ...g, shops: g.shops.slice() }));
  (Store.state.customFood || []).filter(c => !c.deleted).forEach(c => {
    let g = groups.find(x => x.area === c.area);
    if (!g) { g = { area: c.area, when: '自訂', shops: [] }; groups.push(g); }
    g.shops.push({ ...c, _custom: true });
  });
  return groups;
}

function renderFood() {
  const groups = foodGroups();
  let sel = localStorage.getItem(FOOD_AREA_KEY) || '';
  if (sel && !groups.some(g => g.area === sel)) sel = '';
  const shown = sel ? groups.filter(g => g.area === sel) : groups;

  $('#foodWrap').innerHTML = `
    <div class="card food-filter">
      <div class="field" style="margin:0 0 10px">
        <label>📍 選地點,看那附近有什麼吃的</label>
        <select id="foodAreaSel">
          <option value="">全部地點（${groups.length} 區）</option>
          ${groups.map(g => `<option value="${esc(g.area)}"${g.area === sel ? ' selected' : ''}>${esc(g.area)}　·　${esc(g.when)}</option>`).join('')}
        </select>
      </div>
      <button type="button" class="btn-add-item" id="btnAddFood" style="width:100%">＋ 新增店家</button>
    </div>` +
    shown.map(g => `
    <div class="card food-card${g.far ? ' far' : ''}">
      <div class="food-head">
        <h3>${esc(g.area)}</h3>
        <span class="food-when">${esc(g.when)}</span>
      </div>
      ${g.shops.map(shopHTML).join('')}
    </div>`).join('');

  $('#foodAreaSel').addEventListener('change', e => {
    localStorage.setItem(FOOD_AREA_KEY, e.target.value);
    renderFood();
    window.scrollTo({ top: 0 });
  });
  $('#btnAddFood').addEventListener('click', openFoodModal);

  $$('#foodWrap [data-fdel]').forEach(b =>
    b.addEventListener('click', async () => {
      if (!confirm('確定刪掉這家店？')) return;
      await Store.commit(s => {
        const t = s.customFood.find(x => x.id === b.dataset.fdel);
        if (t) { t.deleted = true; t.ts = Date.now(); }
      });
    }));
}

function openFoodModal() {
  const areas = foodGroups().map(g => g.area);
  const cur = localStorage.getItem(FOOD_AREA_KEY) || '';
  showModal('新增店家', `
    <div class="field"><label>地區</label>
      <select id="cfArea">
        ${areas.map(a => `<option${a === cur ? ' selected' : ''}>${esc(a)}</option>`).join('')}
        <option value="__new">＋ 新地區…</option>
      </select></div>
    <div class="field hidden" id="cfNewAreaWrap"><label>新地區名稱</label>
      <input type="text" id="cfNewArea" placeholder="例：河口湖"></div>
    <div class="field"><label>店名（必填）</label><input type="text" id="cfName"></div>
    <div class="field-2col">
      <div class="field"><label>類型</label><input type="text" id="cfKind" placeholder="拉麵 / 燒肉 / 咖啡…"></div>
      <div class="field"><label>價位</label><input type="text" id="cfPrice" placeholder="¥1,000–2,000"></div>
    </div>
    <div class="field"><label>📍 位置（怎麼走）</label><input type="text" id="cfWhere"></div>
    <div class="field"><label>🕐 營業時間</label><input type="text" id="cfOpen"></div>
    <div class="field"><label>備註</label><textarea id="cfNote" rows="2"></textarea></div>
    <button class="btn-primary" id="cfSave" style="width:100%">加進美食清單</button>
  `);

  $('#cfArea').addEventListener('change', () =>
    $('#cfNewAreaWrap').classList.toggle('hidden', $('#cfArea').value !== '__new'));

  $('#cfSave').addEventListener('click', async () => {
    const area = $('#cfArea').value === '__new'
      ? $('#cfNewArea').value.trim() : $('#cfArea').value;
    const name = $('#cfName').value.trim();
    if (!area) return toast('地區要填');
    if (!name) return toast('店名要填');
    await Store.commit(s => s.customFood.push({
      id: uid(), area, name,
      kind: $('#cfKind').value.trim() || undefined,
      price: $('#cfPrice').value.trim() || undefined,
      where: $('#cfWhere').value.trim() || undefined,
      open: $('#cfOpen').value.trim() || undefined,
      note: $('#cfNote').value.trim() || undefined,
      ts: Date.now(),
    }));
    closeModal();
    toast('已加進「' + area + '」');
  });
}

function shopHTML(s) {
  const q = encodeURIComponent(s.place || s.name);
  return `
    <div class="shop">
      <div class="shop-top">
        <a class="shop-name" target="_blank" rel="noopener"
           href="https://www.google.com/maps/search/?api=1&query=${q}">${esc(s.name)} ↗</a>
        <span class="shop-kind">${esc(s.kind || '')}</span>
        ${s._custom ? `<button class="cl-del" data-fdel="${s.id}" title="刪除">✕</button>` : ''}
      </div>
      <div class="shop-meta">
        ${s.score && s.score !== '—' ? `<span class="star">★ ${esc(s.score)}</span>` : ''}
        ${s.price ? `<span>${esc(s.price)}</span>` : ''}
      </div>
      ${s.where ? `<div class="shop-where">📍 ${esc(s.where)}</div>` : ''}
      ${s.open ? `<div class="shop-open">🕐 ${esc(s.open)}</div>` : ''}
      ${s.note ? `<div class="shop-note">${esc(s.note)}</div>` : ''}
      ${s.link ? `<a class="shop-link" target="_blank" rel="noopener" href="${esc(s.link)}">官網 ↗</a>` : ''}
    </div>`;
}

/* ------------------------------------------------------------
   分帳
   ------------------------------------------------------------ */
function bindExpenseForm() {
  $('#expenseForm').addEventListener('submit', async e => {
    e.preventDefault();
    const share = $$('#expShare .chip.on').map(c => c.dataset.name);
    if (!share.length) return toast('至少要選一個分攤的人');

    const exp = {
      id: uid(),
      item: $('#expItem').value.trim(),
      amount: Math.round(Number($('#expAmount').value)),
      payer: $('#expPayer').value,
      share,
      day: Number($('#expDay').value),
      ts: Date.now(),
    };
    if (!exp.item || !(exp.amount > 0)) return;

    await Store.commit(s => s.expenses.push(exp));
    $('#expItem').value = '';
    $('#expAmount').value = '';
    $('#expItem').focus();
    toast('已加入');
  });

  $('#btnAllShare').addEventListener('click', () => {
    const chips = $$('#expShare .chip');
    const allOn = chips.every(c => c.classList.contains('on'));
    chips.forEach(c => c.classList.toggle('on', !allOn));
  });

  $('#rateInput').addEventListener('change', async e => {
    const v = Number(e.target.value);
    if (v > 0) await Store.commit(s => { s.rate = v; });
  });

  $('#btnMembers').addEventListener('click', openMembersModal);
}

function renderExpenses() {
  const { members, rate } = Store.state;
  const expenses = Store.state.expenses.filter(e => !e.deleted);

  /* --- 表單控制項（保留使用者已選狀態）--- */
  const payer = $('#expPayer');
  const prevPayer = payer.value;
  payer.innerHTML = members.map(m => `<option>${esc(m)}</option>`).join('');
  if (members.includes(prevPayer)) payer.value = prevPayer;

  const daySel = $('#expDay');
  const prevDay = daySel.value;
  daySel.innerHTML = ITINERARY.map(d => {
    const dt = dayDate(d.day);
    return `<option value="${d.day}">Day ${d.day}${dt ? ' · ' + fmtDate(dt) : ''}</option>`;
  }).join('');
  daySel.value = prevDay || currentDay;

  const chipWrap = $('#expShare');
  const firstRender = chipWrap.children.length === 0;
  const on = new Set($$('#expShare .chip.on').map(c => c.dataset.name));
  chipWrap.innerHTML = members.map(m =>
    `<button type="button" class="chip${firstRender || on.has(m) ? ' on' : ''}" data-name="${esc(m)}">${esc(m)}</button>`
  ).join('');
  $$('#expShare .chip').forEach(c =>
    c.addEventListener('click', () => c.classList.toggle('on')));

  $('#rateInput').value = rate;

  /* --- 結餘 --- */
  const bal = balances(expenses, members);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  $('#totalChip').textContent = `總計 ¥${nf(total)}`;

  $('#balanceList').innerHTML = members.map(m => {
    const v = Math.round(bal[m] || 0);
    const cls = v > 0 ? 'plus' : v < 0 ? 'minus' : '';
    const sign = v > 0 ? '+' : v < 0 ? '−' : '';
    return `<div class="bal">
      <div class="bal-name">${esc(m)}</div>
      <div class="bal-num ${cls}">${sign}¥${nf(Math.abs(v))}</div>
      <div class="bal-sub">${v > 0 ? '可收回' : v < 0 ? '要付出' : '剛好打平'}${
        rate ? ' · 約 NT$' + nf(Math.round(Math.abs(v) / rate)) : ''}</div>
    </div>`;
  }).join('');

  /* --- 誰付給誰 --- */
  const tx = settle(bal);
  $('#settleList').innerHTML = tx.length
    ? tx.map(t => `<div class="settle">
        <b>${esc(t.from)}</b><span class="arrow">→</span><b>${esc(t.to)}</b>
        <span class="amt">¥${nf(t.amount)}${
          rate ? ` <small>NT$${nf(Math.round(t.amount / rate))}</small>` : ''}</span>
      </div>`).join('')
    : '<div class="empty">目前不用找錢</div>';

  /* --- 明細 --- */
  const list = $('#expenseList');
  if (!expenses.length) {
    list.innerHTML = '<div class="empty">還沒有任何支出</div>';
    return;
  }
  list.innerHTML = [...expenses].reverse().map(e => `
    <div class="exp">
      <div class="exp-main">
        <div class="exp-title">${esc(e.item)}</div>
        <div class="exp-meta">Day ${e.day} · ${esc(e.payer)} 付 · 分 ${e.share.length} 人（${
          e.share.map(esc).join('、')}）</div>
      </div>
      <div class="exp-amt">
        <div class="exp-jpy">¥${nf(e.amount)}</div>
        ${rate ? `<div class="exp-twd">NT$${nf(Math.round(e.amount / rate))}</div>` : ''}
      </div>
      <button class="exp-del" data-del="${e.id}" title="刪除">✕</button>
    </div>`).join('');

  $$('#expenseList [data-del]').forEach(b =>
    b.addEventListener('click', async () => {
      if (!confirm('確定刪除這筆？')) return;
      // 只標記,不真的移除。刪除記號要同步出去,別人裝置上的舊資料才不會把它復活。
      await Store.commit(s => {
        const t = s.expenses.find(x => x.id === b.dataset.del);
        if (t) { t.deleted = true; t.ts = Date.now(); }
      });
    }));
}

/** 每個人的淨額：正數 = 別人欠他,負數 = 他要付 */
function balances(expenses, members) {
  const bal = Object.fromEntries(members.map(m => [m, 0]));
  expenses.forEach(e => {
    if (!e.share || !e.share.length) return;
    const each = e.amount / e.share.length;
    if (bal[e.payer] !== undefined) bal[e.payer] += e.amount;
    e.share.forEach(m => { if (bal[m] !== undefined) bal[m] -= each; });
  });
  return bal;
}

/** 用最少的轉帳次數把帳結清 */
function settle(bal) {
  const debtors = [], creditors = [];
  Object.entries(bal).forEach(([name, v]) => {
    const amt = Math.round(v);
    if (amt < 0) debtors.push({ name, amt: -amt });
    else if (amt > 0) creditors.push({ name, amt });
  });
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);

  const tx = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0) tx.push({ from: debtors[i].name, to: creditors[j].name, amount: pay });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }
  return tx;
}

/* --- 成員設定 --- */
function openMembersModal() {
  const ms = Store.state.members;
  showModal('成員設定', `
    <p class="hint">改名字之後,已經記錄的支出會跟著改,不用重記。</p>
    ${ms.map((m, i) => `<div class="field">
      <label>第 ${i + 1} 位</label>
      <input type="text" data-m="${i}" value="${esc(m)}">
    </div>`).join('')}
    <button class="btn-primary" id="saveMembers">儲存</button>
  `);

  $('#saveMembers').addEventListener('click', async () => {
    const next = $$('#modalBody [data-m]').map(i => i.value.trim()).filter(Boolean);
    if (next.length < 2) return toast('至少要 2 個人');
    const old = Store.state.members;
    const map = Object.fromEntries(old.map((o, i) => [o, next[i] || o]));
    await Store.commit(s => {
      s.members = next;
      s.expenses.forEach(e => {
        e.payer = map[e.payer] || e.payer;
        e.share = e.share.map(x => map[x] || x);
      });
    });
    closeModal();
    toast('已更新');
  });
}

/* ------------------------------------------------------------
   行前清單
   ------------------------------------------------------------ */
function bindChecklistForm() {
  $('#clAddForm').addEventListener('submit', async e => {
    e.preventDefault();
    const text = $('#clAddText').value.trim();
    if (!text) return;
    const cat = $('#clAddCat').value;
    await Store.commit(s => s.customCl.push({ id: uid(), cat, text, ts: Date.now() }));
    $('#clAddText').value = '';
    toast('已新增');
  });

  $('#btnResetCl').addEventListener('click', async () => {
    if (!confirm('把所有勾選取消？')) return;
    await Store.commit(s => { s.checked = {}; });
  });
}

function allChecklistGroups() {
  const hidden = Store.state.clHidden || {};
  const groups = CHECKLIST.map(g => ({
    cat: g.cat, icon: g.icon || '•',
    items: g.items.map(t => ({ key: g.cat + '::' + t, text: t, custom: false }))
                  .filter(it => !hidden[it.key]),
  }));
  Store.state.customCl.filter(c => !c.deleted).forEach(c => {
    let g = groups.find(x => x.cat === c.cat);
    if (!g) { g = { cat: c.cat, icon: '📝', items: [] }; groups.push(g); }
    g.items.push({ key: c.cat + '::' + c.text, text: c.text, custom: true, id: c.id });
  });
  return groups;
}

/* 哪些分類是展開的。這是「這台裝置的顯示偏好」,不同步給別人 */
const OPEN_KEY = 'tokyo-trip-open-cats';
function getOpenCats() {
  try { return new Set(JSON.parse(localStorage.getItem(OPEN_KEY)) || []); }
  catch { return new Set(); }
}
function toggleCat(cat) {
  const s = getOpenCats();
  s.has(cat) ? s.delete(cat) : s.add(cat);
  localStorage.setItem(OPEN_KEY, JSON.stringify([...s]));
  renderChecklist();
}

function renderChecklist() {
  const groups = allChecklistGroups();
  const checked = Store.state.checked;
  const openCats = getOpenCats();

  const sel = $('#clAddCat');
  const prev = sel.value;
  sel.innerHTML = groups.map(g => `<option>${esc(g.cat)}</option>`).join('');
  if (prev) sel.value = prev;

  let done = 0, total = 0;
  const html = groups.map(g => {
    let gDone = 0;
    const rows = g.items.map(it => {
      total++;
      const on = !!checked[it.key];
      if (on) { done++; gDone++; }
      return `<div class="cl-item${on ? ' done' : ''}" data-key="${esc(it.key)}">
        <div class="cl-box">${on ? '✓' : ''}</div>
        <div class="cl-text">${esc(it.text)}</div>
        ${it.custom
          ? `<button class="cl-del" data-clr="${it.id}" title="刪除">✕</button>`
          : `<button class="cl-del" data-clhide="${esc(it.key)}" title="刪除">✕</button>`}
      </div>`;
    }).join('');
    const open = openCats.has(g.cat);
    const allDone = g.items.length && gDone === g.items.length;
    return `<div class="card cl-card${open ? ' open' : ''}">
      <button type="button" class="cl-cat" data-cat="${esc(g.cat)}">
        <span class="cl-cat-ico">${g.icon}</span>
        <span class="cl-cat-name">${esc(g.cat)}</span>
        <span class="n${allDone ? ' all' : ''}">${allDone ? '✓ 完成' : gDone + '/' + g.items.length}</span>
        <span class="chev">${open ? '▴' : '▾'}</span>
      </button>
      <div class="cl-body">${rows}</div>
    </div>`;
  }).join('');

  const hiddenCount = Object.keys(Store.state.clHidden || {}).length;
  $('#checklistWrap').innerHTML = html + (hiddenCount ? `
    <button type="button" class="btn-tour" id="btnClRestore" style="margin:4px auto;display:block">
      ↩︎ 還原 ${hiddenCount} 個被刪掉的預設項目</button>` : '');
  $('#clCount').textContent = `${done} / ${total}`;
  $('#clBar').style.width = total ? (done / total * 100) + '%' : '0%';

  const restore = $('#btnClRestore');
  if (restore) restore.addEventListener('click', async () => {
    if (!confirm('把所有被刪掉的預設項目找回來？')) return;
    await Store.commit(s => { s.clHidden = {}; });
  });

  $$('#checklistWrap [data-clhide]').forEach(b =>
    b.addEventListener('click', async ev => {
      ev.stopPropagation();
      await Store.commit(s => { s.clHidden[b.dataset.clhide] = true; });
    }));

  $$('#checklistWrap .cl-cat').forEach(b =>
    b.addEventListener('click', () => toggleCat(b.dataset.cat)));

  $$('#checklistWrap .cl-item').forEach(el =>
    el.addEventListener('click', async ev => {
      if (ev.target.closest('[data-clr]')) return;
      const k = el.dataset.key;
      await Store.commit(s => {
        if (s.checked[k]) delete s.checked[k]; else s.checked[k] = true;
      });
    }));

  $$('#checklistWrap [data-clr]').forEach(b =>
    b.addEventListener('click', async ev => {
      ev.stopPropagation();
      await Store.commit(s => {
        const t = s.customCl.find(x => x.id === b.dataset.clr);
        if (t) { t.deleted = true; t.ts = Date.now(); }
      });
    }));
}

/* ------------------------------------------------------------
   資訊
   ------------------------------------------------------------ */
function renderInfo() {
  $('#infoWrap').innerHTML = INFO.map(sec => `
    <div class="card">
      <div class="card-head"><h3>${sec.icon || ''} ${esc(sec.cat)}</h3></div>
      ${sec.rows.map(([k, v]) => `<div class="info-row">
        <div class="info-k">${esc(k)}</div>
        <div class="info-v">${linkify(v)}</div>
      </div>`).join('')}
    </div>`).join('');
  renderShare();
}

/** 電話自動變成可撥打、網址自動變成可點的連結 */
function linkify(v) {
  const raw = String(v).trim();
  if (/^https?:\/\/\S+$/.test(raw)) {
    const label = raw.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    return `<a href="${esc(raw)}" target="_blank" rel="noopener">${esc(
      label.length > 34 ? label.slice(0, 34) + '…' : label)} ↗</a>`;
  }
  if (/^[+\d][\d\-\s]{5,}$/.test(raw)) {
    return `<a href="tel:${raw.replace(/[\s-]/g, '')}">${esc(raw)}</a>`;
  }
  return esc(raw);
}

/* --- 共享狀態卡 --- */
function renderShare() {
  const box = $('#shareBody');

  if (CONFIG.mode !== 'shared') {
    box.innerHTML = `<p class="hint">共享已在 <code>js/config.js</code> 關閉
      （<code>mode: 'local'</code>）,資料只存在這台裝置。</p>`;
    return;
  }

  const id = roomId();

  /* --- 還沒開房 --- */
  if (!id) {
    box.innerHTML = `
      <p class="hint">現在資料只存在這台裝置。開一個共享房間,4 個人就能同時看、同時記帳
        —— 誰改了什麼,其他人 15 秒內都會看到。<b>不用註冊、不用密碼。</b></p>
      <div class="btn-row">
        <button class="btn-line" id="btnCreateRoom" style="background:var(--crimson);color:#fff;border-color:var(--crimson)">建立共享房間</button>
        <button class="btn-line" id="btnJoinRoom">我有房號,加入</button>
      </div>`;
    $('#btnCreateRoom').addEventListener('click', async () => {
      const btn = $('#btnCreateRoom');
      btn.disabled = true; btn.textContent = '建立中…';
      try {
        await CloudBackend.createRoom(Store.state);
        toast('建立成功,重新載入中…');
        setTimeout(() => { location.href = location.origin + location.pathname; }, 600);
      } catch (err) {
        btn.disabled = false; btn.textContent = '建立共享房間';
        toast('建立失敗：' + err.message);
      }
    });
    $('#btnJoinRoom').addEventListener('click', () => {
      const code = prompt('貼上房號（或整段分享網址）');
      if (!code) return;
      const m = code.match(/room=([\w-]+)/);
      setRoomId((m ? m[1] : code).trim());
      location.reload();
    });
    return;
  }

  /* --- 房間失效（雲端 404）--- */
  if (Store.status.code === 404) {
    box.innerHTML = `
      <p class="hint">⚠️ <b>共享房間失效了。</b>免費雲端空間太久沒人開啟會自動清掉,
        大家手機裡的資料都還在,不會不見 —— 重建一個新房間就好。</p>
      <p class="hint"><b>誰的資料最新、最齊,就用誰的手機按這顆按鈕</b>,
        然後把新網址丟到群組給其他人。</p>
      <div class="btn-row">
        <button class="btn-line" id="btnRebuildRoom"
          style="background:var(--crimson);color:#fff;border-color:var(--crimson)">用這台的資料重建房間</button>
      </div>
      <p class="hint" style="margin-top:12px">重建後網址會變,舊的分享網址就不能用了。
        其他人打開新網址後,他們手機裡的支出、勾選也會自動併進來,不會被蓋掉。</p>`;
    $('#btnRebuildRoom').addEventListener('click', async () => {
      const btn = $('#btnRebuildRoom');
      btn.disabled = true; btn.textContent = '重建中…';
      try {
        await CloudBackend.createRoom(Store.state);
        toast('重建成功,重新載入中…');
        // ⚠️ 一定要用「乾淨網址」重載：如果現在的網址帶著舊的 ?room=,
        // 重新整理時網址參數會把剛存好的新房號蓋回死房號,重建等於白做
        setTimeout(() => { location.href = location.origin + location.pathname; }, 600);
      } catch (err) {
        btn.disabled = false; btn.textContent = '用這台的資料重建房間';
        toast('重建失敗：' + err.message);
      }
    });
    return;
  }

  /* --- 共享中 --- */
  const url = location.origin + location.pathname + '?room=' + id;
  box.innerHTML = `
    <p class="hint">共享中 ✅ 把下面的網址丟到群組,另外 3 個人打開就會同步。
      他們也可以「加到主畫面」當 App 用。</p>
    <div class="field"><input type="text" id="shareUrl" readonly value="${esc(url)}"></div>
    <div class="btn-row">
      <button class="btn-line" id="btnCopyUrl" style="background:var(--crimson);color:#fff;border-color:var(--crimson)">複製分享網址</button>
      <button class="btn-line" id="btnPull">立即抓最新</button>
    </div>
    <p class="hint" style="margin:12px 0 0">
      沒網路時照樣能記帳,回到有訊號會自動補傳。<br>
      知道這個網址的人都能編輯,所以不要放信用卡卡號之類的東西。</p>`;

  $('#btnCopyUrl').addEventListener('click', () => {
    const i = $('#shareUrl'); i.select(); i.setSelectionRange(0, 999);
    navigator.clipboard?.writeText(i.value)
      .then(() => toast('已複製,貼到群組吧'))
      .catch(() => toast('請長按選取複製'));
  });
  $('#btnPull').addEventListener('click', async () => { await Store.pull(); toast('已更新'); });
}

/* ------------------------------------------------------------
   備份 / 還原
   ------------------------------------------------------------ */
function bindDataButtons() {
  $('#btnExport').addEventListener('click', () => {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tokyo-trip-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('#btnImport').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      await Store.importJSON(await f.text());
      toast('匯入完成');
    } catch (err) {
      toast('匯入失敗：' + err.message);
    }
    e.target.value = '';
  });

  $('#btnWipe').addEventListener('click', async () => {
    if (!confirm('所有支出、勾選都會清掉,確定嗎？')) return;
    await Store.wipe();
    toast('已清空');
  });

  $('#modalClose').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
}

/* ------------------------------------------------------------
   小工具
   ------------------------------------------------------------ */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function nf(n) { return Number(n || 0).toLocaleString('en-US'); }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showModal(title, html) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = html;
  $('#modal').classList.remove('hidden');
}
function closeModal() { $('#modal').classList.add('hidden'); }

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 1800);
}
