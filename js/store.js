/* ============================================================
   資料層
   ------------------------------------------------------------
   整個 App 只透過 Store 存取資料。要換共享方式時,只動這個檔,
   畫面(app.js)完全不用改。

   目前支援三種模式,在 js/config.js 的 CONFIG.share.mode 切換：
     'local'    只存這台裝置（預設,免設定）
     'gist'     用 GitHub Gist 當資料庫（不用辦新帳號）
     'jsonblob' 用 jsonblob.com（完全免註冊,按鈕產生共享碼）
   ============================================================ */

const Store = {

  /* ---------- 全部資料都放這裡 ---------- */
  state: {
    members: [],        // ['我','A','B','C']
    rate: 4.7,          // 1 TWD = ? JPY
    expenses: [],       // {id, item, amount, payer, share:[], day, ts}
    checked: {},        // { '清單項目文字': true }
    customCl: [],       // { id, cat, text }
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
      Store.status = { mode: this._backend.name, ok: false, msg: '連線失敗' };
      remote = LocalBackend.readRaw();
    }
    this.state = normalize(remote);
    if (!this.state.members.length) this.state.members = CONFIG.members.slice();
    if (!this.state.rate) this.state.rate = CONFIG.defaultRate;

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
        Store.status = { mode: this._backend.name, ok: false, msg: '同步失敗' };
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
      Store.status = { mode: this._backend.name, ok: false, msg: '連線失敗' };
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
  return [...map.values()].filter(x => !x.deleted).sort((x, y) => (x.ts || 0) - (y.ts || 0));
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

/* --- GitHub Gist：不用辦新帳號,穩定度最高 --- */
const GistBackend = {
  name: 'gist', shared: true,
  get _cfg() { return CONFIG.share; },
  async load() {
    const r = await fetch(`https://api.github.com/gists/${this._cfg.gistId}`, {
      headers: { Authorization: `Bearer ${this._cfg.token}`, Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    });
    if (!r.ok) throw new Error('Gist 讀取失敗 ' + r.status);
    const gist = await r.json();
    const file = gist.files[GIST_FILE];
    if (!file) return null;
    // 檔案太大時 GitHub 會截斷,改抓 raw_url
    const content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
    try { return JSON.parse(content); } catch { return null; }
  },
  async save(v) {
    const r = await fetch(`https://api.github.com/gists/${this._cfg.gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this._cfg.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(v) } } }),
    });
    if (!r.ok) throw new Error('Gist 寫入失敗 ' + r.status);
  },
};
const GIST_FILE = 'tokyo-trip.json';

/* --- jsonblob：完全免註冊,用「共享碼」加入 --- */
const JsonBlobBackend = {
  name: 'jsonblob', shared: true,
  base: 'https://jsonblob.com/api/jsonBlob',
  get _id() { return roomId(); },
  async load() {
    const r = await fetch(`${this.base}/${this._id}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('讀取失敗 ' + r.status);
    return r.json();
  },
  async save(v) {
    const r = await fetch(`${this.base}/${this._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    });
    if (!r.ok) throw new Error('寫入失敗 ' + r.status);
  },
  /** 第一次開房：把目前資料丟上去,拿到共享碼 */
  async createRoom(v) {
    const r = await fetch(this.base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(v),
    });
    if (!r.ok) throw new Error('建立失敗 ' + r.status);
    const loc = r.headers.get('Location') || r.headers.get('location') || '';
    const id = loc.split('/').pop();
    if (!id) throw new Error('拿不到共享碼(瀏覽器擋掉了回應標頭)');
    setRoomId(id);
    return id;
  },
};

/* 共享碼：網址 ?room=xxx 優先,其次記在本機 */
const ROOM_KEY = 'tokyo-trip-room';
function roomId() {
  const q = new URLSearchParams(location.search).get('room');
  if (q) { localStorage.setItem(ROOM_KEY, q); return q; }
  return CONFIG.share.roomId || localStorage.getItem(ROOM_KEY) || '';
}
function setRoomId(id) { localStorage.setItem(ROOM_KEY, id); }

function pickBackend() {
  const mode = (CONFIG.share && CONFIG.share.mode) || 'local';
  if (mode === 'gist' && CONFIG.share.token && CONFIG.share.gistId) return GistBackend;
  if (mode === 'jsonblob' && roomId()) return JsonBlobBackend;
  return LocalBackend;
}
