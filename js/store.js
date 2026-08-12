/* ============================================================
   資料層
   ------------------------------------------------------------
   整個 App 只透過 Store 存取資料。要換共享方式時,只動這個檔,
   畫面(app.js)完全不用改。

   兩種模式（js/config.js 的 CONFIG.mode）：
     'shared'  有房號就走雲端,4 個人即時同步；沒房號時自動退回本機
     'local'   只存這台裝置

   不需要帳號,也不需要任何金鑰 —— 原始碼裡不會有私人資料。
   規則：每次改動【一定先寫本機】,再嘗試推雲端。所以飛機上、
   地鐵沒訊號時照樣能用,有網路時自動補上。
   ============================================================ */

const Store = {

  /* ---------- 全部資料都放這裡 ---------- */
  state: {
    members: [],        // ['我','A','B','C']
    rate: 4.7,          // 1 TWD = ? JPY
    expenses: [],       // {id, item, amount, payer, share:[], day, ts}
    checked: {},        // { '清單項目文字': true }
    customCl: [],       // { id, cat, text }
    itinEdits: [],      // 行程補丁,三種：
                        //   {id:'edit:<itemId>', full:{...}|undefined, removed?, ts}  改/刪(整筆覆蓋)
                        //   {id:<uid>, day, item:{...}, ts, deleted?}                 新增
                        //   {id:'order:d<day>', day, order:[itemId...], ts}           排序
    updatedAt: 0,
  },

  _backend: null,
  _timer: null,
  _listeners: [],

  /* ---------- 對外 API ---------- */

  async init() {
    this._backend = pickBackend();
    let remote = null;
    try {
      remote = await this._backend.load();
      Store.status = { mode: this._backend.name, ok: true };
    } catch (err) {
      console.warn('讀取失敗,改用本機資料', err);
      Store.status = { mode: this._backend.name, ok: false,
        msg: err.status === 404 ? '房間失效' : '連線失敗', code: err.status };
      remote = LocalBackend.readRaw();
    }
    // 共享模式：把這台裝置本來就有的資料併進雲端資料,不要直接蓋掉
    this.state = this._backend.shared
      ? merge(normalize(remote), normalize(LocalBackend.readRaw()))
      : normalize(remote);
    if (!this.state.members.length) this.state.members = CONFIG.members.slice();
    if (!this.state.rate) this.state.rate = CONFIG.defaultRate;

    // 雲端房間被清掉（回空資料)但這台手機有資料 → 自動推回去,房間原地復活
    if (this._backend.shared && !remote && this.state.updatedAt) {
      try { await this._backend.save(this.state); Store.status = { mode: 'cloud', ok: true }; }
      catch (err) { console.warn('自動復活房間失敗', err); }
    }

    // 雲端模式在背景定時拉新資料
    if (this._backend.shared) {
      this._timer = setInterval(() => this.pull(), 15000);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.pull();
      });
    }
    this._emit();
  },

  /** 改完資料呼叫這個：立刻存、立刻重畫 */
  async commit(mutator) {
    if (typeof mutator === 'function') mutator(this.state);
    this.state.updatedAt = Date.now();
    this._emit();
    LocalBackend.writeRaw(this.state);           // 永遠留一份本機備份
    if (this._backend.shared) {
      try {
        const remote = await this._backend.load();
        this.state = merge(normalize(remote), this.state);
        await this._backend.save(this.state);
        Store.status = { mode: this._backend.name, ok: true };
        this._emit();
      } catch (err) {
        console.warn('同步失敗,資料先存在本機', err);
        Store.status = { mode: this._backend.name, ok: false,
          msg: err.status === 404 ? '房間失效' : '同步失敗', code: err.status };
        this._emit();
      }
    }
  },

  /** 從雲端拉最新資料 */
  async pull() {
    if (!this._backend.shared) return;
    try {
      const remote = normalize(await this._backend.load());
      this.state = merge(remote, this.state);
      Store.status = { mode: this._backend.name, ok: true };
      LocalBackend.writeRaw(this.state);
      this._emit();
    } catch (err) {
      Store.status = { mode: this._backend.name, ok: false,
        msg: err.status === 404 ? '房間失效' : '連線失敗', code: err.status };
      this._emit();
    }
  },

  onChange(fn) { this._listeners.push(fn); },
  _emit() { this._listeners.forEach(fn => fn(this.state)); },

  status: { mode: 'local', ok: true },

  /* ---------- 備份 / 還原 ---------- */
  exportJSON() {
    return JSON.stringify({ _app: 'tokyo-trip', ...this.state }, null, 2);
  },
  async importJSON(text) {
    const obj = JSON.parse(text);
    if (obj._app !== 'tokyo-trip') throw new Error('這不是本站的備份檔');
    await this.commit(s => Object.assign(s, normalize(obj)));
  },
  async wipe() {
    localStorage.removeItem(LS_KEY);
    await this.commit(s => Object.assign(s, normalize(null), {
      members: CONFIG.members.slice(), rate: CONFIG.defaultRate,
    }));
  },
};


/* ============================================================
   資料整形 & 合併
   ============================================================ */

function normalize(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  return {
    members: Array.isArray(o.members) ? o.members : [],
    rate: Number(o.rate) || 0,
    expenses: Array.isArray(o.expenses) ? o.expenses : [],
    checked: o.checked && typeof o.checked === 'object' ? o.checked : {},
    customCl: Array.isArray(o.customCl) ? o.customCl : [],
    itinEdits: Array.isArray(o.itinEdits) ? o.itinEdits : [],
    updatedAt: Number(o.updatedAt) || 0,
  };
}

/**
 * 合併遠端與本地。
 * 陣列(支出、自訂清單)用 id 聯集,兩邊新增的都留下;
 * 刪除用墓碑標記(deleted)才不會被對方的舊資料復活。
 * 其他純量欄位由較新的那份勝出。
 */
function merge(remote, local) {
  const newer = local.updatedAt >= remote.updatedAt ? local : remote;
  const older = newer === local ? remote : local;
  return {
    members: newer.members.length ? newer.members : older.members,
    rate: newer.rate || older.rate,
    expenses: mergeById(remote.expenses, local.expenses),
    customCl: mergeById(remote.customCl, local.customCl),
    itinEdits: mergeById(remote.itinEdits, local.itinEdits),
    checked: mergeChecked(remote.checked, local.checked, remote.updatedAt, local.updatedAt),
    updatedAt: Math.max(remote.updatedAt, local.updatedAt),
  };
}

function mergeById(a, b) {
  const map = new Map();
  [...a, ...b].forEach(x => {
    if (!x || !x.id) return;
    const prev = map.get(x.id);
    if (!prev || (x.ts || 0) >= (prev.ts || 0)) map.set(x.id, x);
  });
  // 刪除記號要保留下來一起同步,否則對方裝置上的舊資料會把它復活。
  // 畫面端負責過濾 deleted,這裡不能濾掉。
  return [...map.values()].sort((x, y) => (x.ts || 0) - (y.ts || 0));
}

function mergeChecked(a, b, ta, tb) {
  // 勾選狀態沒有逐項時間戳,由整份較新的那邊決定
  return tb >= ta ? { ...a, ...b } : { ...b, ...a };
}


/* ============================================================
   後端實作
   ============================================================ */

const LS_KEY = 'tokyo-trip-data';

const LocalBackend = {
  name: 'local', shared: false,
  readRaw() { try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch { return null; } },
  writeRaw(v) { try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {} },
  async load() { return this.readRaw(); },
  async save(v) { this.writeRaw(v); },
};

/* --- 雲端共享：完全免註冊、免金鑰,用「房號」加入 ---
   後端是 textdb.online（2026/8 起。原本的 jsonblob 停止開放新建 blob,403）。
   textdb 的 key 是自己取的、「寫入即建立」,所以：
   - 舊 jsonblob 房號字串直接沿用,變成 textdb 上同名的 key,大家不用換網址
   - 房間 30 天沒動被清掉也沒關係 —— 下次任何人寫入,同一個房號自動復活
   限制：單筆 20 萬字元、每 IP 每天 500 次寫入（讀取不限）。 */
const CloudBackend = {
  name: 'cloud', shared: true,
  base: 'https://textdb.online',
  get _id() { return roomId(); },
  async load() {
    const r = await fetch(`${this.base}/${encodeURIComponent(this._id)}`, { cache: 'no-store' });
    if (!r.ok) { const e = new Error('讀取失敗 ' + r.status); e.status = r.status; throw e; }
    const t = (await r.text()).trim();
    if (!t) return null;   // 房間過期被清或還沒建 → 當空資料,寫入時自動復活
    try { return JSON.parse(t); } catch { return null; }
  },
  async save(v) {
    const json = JSON.stringify(v);
    if (json.length > 190000) throw new Error('資料量超過免費空間上限(20萬字),先匯出備份並清掉舊支出');
    // ⚠️ /update 結尾不能加斜線：/update/ 會觸發轉址,POST 的資料會在轉址時掉光
    const r = await fetch(`${this.base}/update`, {
      method: 'POST',
      body: new URLSearchParams({ key: this._id, value: json }),
    });
    if (!r.ok) { const e = new Error('寫入失敗 ' + r.status); e.status = r.status; throw e; }
    const res = await r.json().catch(() => null);
    if (!res || res.status !== 1) throw new Error('寫入被拒絕');
  },
  /** 第一次開房：自己產生房號,把目前資料丟上去 */
  async createRoom(v) {
    const id = 'tokyo-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    setRoomId(id);
    try { await this.save(v); } catch (err) { localStorage.removeItem(ROOM_KEY); throw err; }
    return id;
  },
};

/* 房號：網址 ?room=xxx 優先（別人分享給你）,其次記在本機 */
const ROOM_KEY = 'tokyo-trip-room';
function roomId() {
  const q = new URLSearchParams(location.search).get('room');
  if (q) { localStorage.setItem(ROOM_KEY, q); return q; }
  return localStorage.getItem(ROOM_KEY) || '';
}
function setRoomId(id) { localStorage.setItem(ROOM_KEY, id); }

function pickBackend() {
  return (CONFIG.mode === 'shared' && roomId()) ? CloudBackend : LocalBackend;
}
