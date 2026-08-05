# 東京 7天6夜

純靜態網站,沒有任何套件、不用安裝、不用打包。直接丟 GitHub Pages 就能用,手機開起來像 App。

- **行程** — 7 天分頁時間軸,每個點可以直接跳 Google Maps
- **分帳** — 4 人記帳,自動算「誰要付給誰」,同時顯示日幣和台幣
- **清單** — 出國要帶什麼,分類勾選 + 進度條,可自己加項目
- **資訊** — 緊急電話、飯店航班、旅遊小提醒

---

## 檔案結構

```
tokyo-trip/
├─ index.html
├─ css/style.css
└─ js/
   ├─ config.js   ← 旅程名稱、成員、匯率、共享設定
   ├─ data.js     ← 行程 / 清單 / 資訊的實際內容（之後要改的就是這個）
   ├─ store.js    ← 資料存取層（換共享方式只動這裡）
   └─ app.js      ← 畫面邏輯
```

---

## 本機預覽

直接用瀏覽器開 `index.html` 就會動。想模擬正式環境的話:

```bash
python -m http.server 8000
```

然後開 http://localhost:8000

---

## 放上 GitHub Pages

```bash
git init
git add .
git commit -m "東京行程網站"
git branch -M main
git remote add origin https://github.com/<你的帳號>/tokyo-trip.git
git push -u origin main
```

推上去之後到 repo 的 **Settings → Pages**,Source 選 `Deploy from a branch`,
Branch 選 `main` / `/ (root)`,按 Save。等一兩分鐘,網址會是:

```
https://<你的帳號>.github.io/tokyo-trip/
```

手機瀏覽器開這個網址,再「加到主畫面」就跟 App 一樣。

---

## 4 人共享（選一種,兩種都不用辦新帳號）

預設是 **單機模式**:資料只存在自己這台裝置的瀏覽器。4 個人要互通,改 `js/config.js` 裡的 `share.mode`。

### A. GitHub Gist（推薦 — 穩定,你本來就有 GitHub）

1. 到 https://gist.github.com 建一個 **Secret gist**
   - 檔名填 `tokyo-trip.json`
   - 內容填 `{}`
   - 按 Create secret gist
2. 建好後看網址 `gist.github.com/你的帳號/**abc123...**`,後面那串就是 **gistId**
3. 到 https://github.com/settings/tokens?type=beta 產生 **Fine-grained token**
   - Expiration 設到旅程結束之後
   - Account permissions → **Gists** 選 `Read and write`
   - **其他權限全部不要勾**(這樣 token 碰不到你任何 repo)
4. 填進 `js/config.js`:

```js
share: {
  mode: 'gist',
  gistId: '貼上那串 id',
  token:  '貼上 token',
  roomId: '',
},
```

5. push 上去,4 個人打開同一個網址就會自動同步(每 15 秒拉一次)。

> ⚠️ 提醒:token 會出現在網頁原始碼裡,任何看得到網站的人都能改這份 gist 的資料。
> 因為只勾了 Gists 權限,影響範圍僅止於這個 gist,不會動到你的 repo。
> 若不放心,可以把 repo 設 private 並改用其他部署方式,或用下面的 B 方案。

### B. jsonblob（完全免註冊,按鈕產生共享碼）

1. `js/config.js` 改成 `mode: 'jsonblob'`
2. 打開網站 → **資訊** 分頁 → 按 **建立共享房間**
3. 複製產生的網址丟到群組,另外 3 個人打開就同步了

> ⚠️ 這是第三方免費服務,沒有服務保證。萬一旅途中它掛掉就沒得同步
> (資料仍會留在各自裝置上,不會消失)。

### C. 都不想弄

**資訊 → 匯出備份** 會下載一個 JSON 檔,丟到群組,別人用 **匯入備份** 讀進去。
不即時,但零依賴。

---

## 同步怎麼運作

- 每次改資料都會**先存本機**,再嘗試推到雲端 → 就算飛機上沒網路也照常用
- 推之前會先拉遠端資料做合併,支出和自訂清單用 id 聯集,**兩個人同時新增不會互相蓋掉**
- 刪除用「墓碑」標記,不會被別人的舊資料復活
- 右上角小圓點:灰=單機、綠=已同步、橘=連不上

---

## 之後要改什麼

| 想改的東西 | 改哪裡 |
|---|---|
| 行程內容 | `js/data.js` 的 `ITINERARY` |
| 行前清單預設項目 | `js/data.js` 的 `CHECKLIST` |
| 飯店 / 航班 / 緊急電話 | `js/data.js` 的 `INFO` |
| 出發日期(自動算每天日期) | `js/config.js` 的 `startDate` |
| 成員名字、匯率 | `js/config.js`,或直接在網站上改 |

`ITINERARY` 一天長這樣:

```js
{
  day: 2,
  tag: '待定',            // 日卡右上小標。有填 startDate 的話會自動變成日期+星期
  title: '淺草 · 晴空塔',  // 這天的大標
  area: '淺草 / 押上',     // 這天的區域
  items: [
    {
      time:  '上午',                 // 上午 / 下午 / 09:30 都可以,留空也行
      type:  'see',                  // 決定左邊那顆 icon
      title: '淺草寺',
      place: '浅草寺 東京',           // 填了才會出現「在地圖開啟」連結
      note:  '雷門拍照,仲見世通逛街',
      todo:  true,                   // 加了會顯示灰色「待填」標籤,內容確定後拿掉
    },
  ],
}
```

`type` 對應的 icon:

| type | icon | 用途 |
|---|---|---|
| `move` | ✈️ | 交通、移動 |
| `food` | 🍜 | 吃飯 |
| `see` | ⛩️ | 景點 |
| `shop` | 🛍️ | 購物 |
| `stay` | 🏨 | 住宿、check-in/out |
| `free` | 🚶 | 自由活動 |
| `cafe` | ☕ | 咖啡廳、下午茶 |
| `night` | 🌃 | 夜景、夜生活 |
