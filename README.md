# 東京 7日6夜

4 人共用的旅遊手冊。純靜態網站,沒有套件、不用安裝、不用打包,丟 GitHub Pages 就能用,手機開起來像 App。

- **行程** — 7 天日卡時間軸,可切換日期、直接跳 Google Maps
- **分帳** — 4 人記帳,自動算出「誰要付給誰」轉帳次數最少,日幣台幣雙顯示
- **清單** — 出國要帶什麼,分類勾選 + 進度條,可自己加項目
- **資訊** — 緊急電話、飯店航班、旅遊提醒

**4 個人即時共享**:誰改了什麼,其他人 15 秒內就看到。不用註冊、不用密碼、不用匯出匯入檔案。

---

## 隱私

這個 repo 是公開的,所以裡面**不放任何密碼、token 或私人資料**,程式碼裡也沒有讀取這類東西的地方。

共享房號是你在網站上按按鈕當場產生的,只存在你們 4 個人的手機和那條分享網址裡,**不會進到原始碼**。

> 一件要知道的事:拿到分享網址的人都能編輯內容。網址只丟給你們 4 個人就好,
> 不要在裡面填信用卡卡號、護照號碼這類東西。

---

## 檔案結構

```
tokyo-trip/
├─ index.html
├─ css/style.css
└─ js/
   ├─ config.js   ← 出發日期、成員、匯率
   ├─ data.js     ← 行程 / 清單 / 資訊的實際內容（之後要改的就是這個）
   ├─ store.js    ← 資料層：本機儲存 + 雲端同步 + 衝突合併
   └─ app.js      ← 畫面邏輯
```

---

## 本機預覽

直接用瀏覽器開 `index.html` 就會動。想模擬正式環境:

```bash
npx http-server -p 8123 -c-1
```

然後開 http://localhost:8123

---

## 放上 GitHub Pages

先到 https://github.com/new 開一個**空的 Public repo**(免費帳號的 Pages 只吃 public),
不要勾 Add README / .gitignore / license。然後:

```bash
git remote add origin https://github.com/<你的帳號>/tokyo-trip.git && git push -u origin main
```

推上去後到 repo 的 **Settings → Pages**,Source 選 `Deploy from a branch`,
Branch 選 `main` / `/ (root)`,按 Save。等 1–2 分鐘,網址會是:

```
https://<你的帳號>.github.io/tokyo-trip/
```

手機開這個網址 → 分享 → **加到主畫面**,就跟 App 一樣。

---

## 開啟 4 人共享

1. **你**打開網站 → **資訊** 分頁 → 按 **建立共享房間**
2. 按 **複製分享網址**,丟到你們的群組
3. 另外 3 個人打開那條網址就進來了,一樣可以加到主畫面

網址長這樣:`https://你的帳號.github.io/tokyo-trip/?room=019fcfc8-…`

之後不管誰記帳、誰勾清單、誰改成員名字,大家都會看到。

### 同步規則

- 每次改動**一定先存自己手機**,再推雲端 → 飛機上、地鐵沒訊號照樣能記,回到有訊號自動補傳
- 推之前會先拉雲端資料合併,支出和自訂清單用 id 聯集 → **兩個人同時記帳不會互相蓋掉**
- 刪除用「刪除記號」同步出去 → 你刪掉的帳不會被別人手機上的舊資料救回來
- 每 15 秒自動拉一次,切回 App 畫面時也會立刻拉一次
- 右上角膠囊:`4人共享中` = 正常,`離線中` = 暫時連不上(資料還在,不會掉)

### 想關掉共享

`js/config.js` 把 `mode` 改成 `'local'`。

### 備份

**資訊 → 備份** 可以把資料存成一個檔案。這只是保險,平常不需要用 —— 同步是自動的。

---

## ⚠️ 改完 css/js 一定要做的事

`index.html` 裡引用 css 與 js 的網址都帶著 `?v=7`：

```html
<link rel="stylesheet" href="css/style.css?v=7">
<script src="js/config.js?v=7"></script>
...
```

**每次改動 css 或 js,把這 5 個 `v` 一起 +1 再 push。**

GitHub Pages 給靜態檔的快取是 10 分鐘。沒有版本號的話,瀏覽器可能拿到
「新的 index.html + 舊的 app.js」,兩邊對不起來就會整個畫面空白。
版本號一改,瀏覽器就會視為不同檔案而重新下載。

---

## 之後要改什麼

| 想改的東西 | 改哪裡 |
|---|---|
| 行程內容 | `js/data.js` 的 `ITINERARY` |
| 行前清單預設項目 | `js/data.js` 的 `CHECKLIST` |
| 飯店 / 航班 / 緊急電話 | `js/data.js` 的 `INFO` |
| 出發日期(自動算每天日期星期) | `js/config.js` 的 `startDate` |
| 成員名字、匯率 | `js/config.js`,或直接在網站上改 |

`ITINERARY` 一天長這樣:

```js
{
  day: 2,
  tag: '待定',            // 日卡右上小標。有填 startDate 會自動變成日期+星期
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
