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
  const nights = ITINERARY.length - 1;
  const daysText = `${ITINERARY.length}日${nights}夜`;
  document.title = `東京 ${daysText}`;
  $('#tripDays').textContent = daysText;
  $('#eyebrowDays').textContent = daysText;

  bindTabs();
  bindDayNav();
  bindExpenseForm();
  bindChecklistForm();
  bindDataButtons();

  Store.onChange(renderAll);
  await Store.init();
})();

function renderAll() {
  renderBrand();
  renderItinerary();
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
  if (st.mode !== 'local') {
    pill.textContent = st.ok ? '已同步' : (st.msg || '未同步');
    pill.classList.toggle('is-cloud', st.ok);
  } else {
    pill.classList.remove('is-cloud');
    pill.textContent = CONFIG.startDate
      ? `${fmtDate(dayDate(1))} 出發`
      : '待定出發';
  }
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
    b.innerHTML = `<span class="d">D</span><span class="n">${d.day}</span>`;
    b.addEventListener('click', () => goDay(d.day));
    bar.appendChild(b);
  });
  const active = bar.children[currentDay - 1];
  if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });

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
      <div class="daycard-body">${day.items.map(rowHTML).join('')}</div>
    </article>`;

  /* --- 上一天 / 下一天 --- */
  const prev = $('#dayPrev'), next = $('#dayNext');
  prev.disabled = currentDay === 1;
  next.disabled = currentDay === ITINERARY.length;
  prev.textContent = currentDay === 1 ? '← 第一天' : `← Day ${currentDay - 1}`;
  next.textContent = currentDay === ITINERARY.length ? '最後一天 →' : `Day ${currentDay + 1} →`;
}

function rowHTML(it) {
  const q = encodeURIComponent(it.place || '');
  return `
    <div class="row">
      <div class="row-time">${esc(it.time || '')}</div>
      <div class="row-ico">${TYPE_ICON[it.type] || '•'}</div>
      <div class="row-main">
        <div class="row-title">${esc(it.title)}${it.todo ? '<span class="badge">待填</span>' : ''}</div>
        ${it.note ? `<div class="row-note">${esc(it.note)}</div>` : ''}
        ${it.place ? `<a class="row-map" target="_blank" rel="noopener"
          href="https://www.google.com/maps/search/?api=1&query=${q}">在地圖開啟 ↗</a>` : ''}
      </div>
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
  const { members, expenses, rate } = Store.state;

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
      // 標記為刪除（而非直接移除）,同步時才不會被別人的舊資料復活
      await Store.commit(s => {
        const t = s.expenses.find(x => x.id === b.dataset.del);
        if (t) { t.deleted = true; t.ts = Date.now(); }
        s.expenses = s.expenses.filter(x => !x.deleted);
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
  const groups = CHECKLIST.map(g => ({
    cat: g.cat, icon: g.icon || '•',
    items: g.items.map(t => ({ key: g.cat + '::' + t, text: t, custom: false })),
  }));
  Store.state.customCl.forEach(c => {
    let g = groups.find(x => x.cat === c.cat);
    if (!g) { g = { cat: c.cat, icon: '📝', items: [] }; groups.push(g); }
    g.items.push({ key: c.cat + '::' + c.text, text: c.text, custom: true, id: c.id });
  });
  return groups;
}

function renderChecklist() {
  const groups = allChecklistGroups();
  const checked = Store.state.checked;

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
        ${it.custom ? `<button class="cl-del" data-clr="${it.id}" title="刪除">✕</button>` : ''}
      </div>`;
    }).join('');
    return `<div class="card">
      <div class="cl-cat"><span>${g.icon}</span>${esc(g.cat)}
        <span class="n">${gDone}/${g.items.length}</span></div>
      ${rows}
    </div>`;
  }).join('');

  $('#checklistWrap').innerHTML = html;
  $('#clCount').textContent = `${done} / ${total}`;
  $('#clBar').style.width = total ? (done / total * 100) + '%' : '0%';

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
        s.customCl = s.customCl.filter(x => !x.deleted);
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

/** 電話號碼自動變成可撥打的連結 */
function linkify(v) {
  const s = esc(v);
  return /^[+\d][\d\-\s]{5,}$/.test(String(v).trim())
    ? `<a href="tel:${String(v).replace(/[\s-]/g, '')}">${s}</a>` : s;
}

/* --- 共享狀態卡 --- */
function renderShare() {
  const mode = (CONFIG.share && CONFIG.share.mode) || 'local';
  const box = $('#shareBody');

  if (mode === 'local') {
    box.innerHTML = `<p class="hint">目前是<b>單機模式</b>,資料只存在這台裝置,另外 3 個人看不到。
      要開共享請改 <code>js/config.js</code> 的 <code>share.mode</code>,做法寫在 README。</p>`;
    return;
  }

  if (mode === 'gist') {
    const ok = CONFIG.share.gistId && CONFIG.share.token;
    box.innerHTML = ok
      ? `<p class="hint">已接上 <b>GitHub Gist</b>,4 個人打開同一個網址就會自動同步（每 15 秒更新）。</p>
         <div class="btn-row"><button class="btn-line" id="btnPull">立即重新整理</button></div>`
      : `<p class="hint">模式設成 gist,但 <code>gistId</code> 或 <code>token</code> 還沒填,請看 README。</p>`;
    if (ok) $('#btnPull').addEventListener('click', async () => { await Store.pull(); toast('已更新'); });
    return;
  }

  const id = localStorage.getItem('tokyo-trip-room') || CONFIG.share.roomId;
  if (id) {
    const url = location.origin + location.pathname + '?room=' + id;
    box.innerHTML = `<p class="hint">共享中。把下面的網址丟給另外 3 個人,他們打開就會同步。</p>
      <div class="field"><input type="text" id="shareUrl" readonly value="${esc(url)}"></div>
      <div class="btn-row">
        <button class="btn-line" id="btnCopyUrl">複製網址</button>
        <button class="btn-line" id="btnPull">立即重新整理</button>
      </div>`;
    $('#btnCopyUrl').addEventListener('click', () => {
      const i = $('#shareUrl'); i.select();
      navigator.clipboard?.writeText(i.value).then(() => toast('已複製')).catch(() => toast('請長按複製'));
    });
    $('#btnPull').addEventListener('click', async () => { await Store.pull(); toast('已更新'); });
  } else {
    box.innerHTML = `<p class="hint">按一下建立共享房間,會產生一個網址,丟給另外 3 個人就能一起看、一起記帳,免註冊。</p>
      <div class="btn-row">
        <button class="btn-line" id="btnCreateRoom">建立共享房間</button>
        <button class="btn-line" id="btnJoinRoom">用共享碼加入</button>
      </div>`;
    $('#btnCreateRoom').addEventListener('click', async () => {
      try {
        await JsonBlobBackend.createRoom(Store.state);
        toast('建立成功,重新載入中…');
        setTimeout(() => location.reload(), 700);
      } catch (err) { toast('建立失敗：' + err.message); }
    });
    $('#btnJoinRoom').addEventListener('click', () => {
      const code = prompt('貼上共享碼');
      if (code && code.trim()) {
        localStorage.setItem('tokyo-trip-room', code.trim());
        location.reload();
      }
    });
  }
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
