# 專案脈絡

東京 7日6夜（2026/12/23–12/29）4 人旅遊手冊。純靜態網站,部署在 GitHub Pages。

- 線上網址：https://tony10334.github.io/tokyo-trip/
- Repo：https://github.com/tony10334/tokyo-trip

---

## ⚠️ 改完 css/js 一定要做的事

`index.html` 裡 5 個引用網址都帶 `?v=N`：

```html
<link rel="stylesheet" href="css/style.css?v=11">
<script src="js/config.js?v=11"></script>
<script src="js/data.js?v=11"></script>
<script src="js/store.js?v=11"></script>
<script src="js/app.js?v=11"></script>
```

**每次改動 css 或 js,把這 5 個 `v` 一起 +1 再 push。**

GitHub Pages 對靜態檔的快取是 10 分鐘。沒有版本號的話,使用者可能拿到
「新的 index.html + 舊的 app.js」,兩邊對不起來會整個畫面空白,而且不噴任何錯誤。
這個坑已經踩過一次了。

---

## 硬性限制

1. **絕對不放任何 token、API 金鑰、密碼、私人資料進 repo。** 使用者明確要求過。
   因為這條,Google Maps 內嵌（要金鑰）和 GitHub Gist 同步（token 要寫進原始碼）
   都被排除了,不要再提議。
2. **沒有 build step。** 純 HTML/CSS/JS,不要引入 npm 套件、打包工具或框架。
3. **不連外部 CDN。** 使用者旅途中可能沒網路,所有東西都要內建。

---

## 檔案結構

```
index.html        版面骨架 + 5 個分頁容器
css/style.css     全部樣式。暖米色底 #f3f0ea,深緋紅 #a3123c,玫瑰色 #fdeef1
js/config.js      出發日期、成員、匯率、共享開關
js/data.js        ★ 內容都在這：ITINERARY / FOOD / GEO / YAMANOTE / CHECKLIST / INFO
js/store.js       資料層：本機儲存 + 雲端同步 + 衝突合併
js/app.js         畫面邏輯
```

改行程內容 99% 只要動 `js/data.js`。

### 行程編輯機制（2026/8 加入）

使用者可以在網站上直接增刪改行程、拖曳排序。`data.js` 的 ITINERARY 是「底版」,
所有人的改動存成補丁（`Store.state.itinEdits`,走 jsonblob 同步）,畫面 = 底版 + 補丁：

- `{id:'edit:<itemId>', full:{...}, removed?, ts}` — 改（整筆覆蓋）/ 刪
- `{id:<uid>, day, item:{...}, ts}` — 新增（item 可帶 geo:[lat,lng] 畫進地圖）
- `{id:'order:d<day>', order:[itemId...], ts}` — 該天排序

⚠️ **底版項目的 id 是「b:天數:標題」推出來的。改 data.js 裡任何一筆的 title,
使用者對那筆的編輯就會脫鉤（畫面變回底版 + 使用者那筆變孤兒）。**
要改底版文案就改 note/go/cost 等欄位,title 盡量不要動。

第一次開站會跳「編輯教學」（localStorage `tokyo-trip-edit-tour-v1`）,
之後從每天行程最下面的「❓ 編輯教學」可以再看。

### ITINERARY 每個項目的欄位

```js
{
  time:  '14:00',        // 顯示在左邊
  type:  'see',          // 決定 icon：move✈️ food🍜 see⛩️ shop🛍️ stay🏨 free🚶 cafe☕ night🌃
  title: '皇居東御苑',
  go:    '東京站 → …',    // 🚃 交通提示（從哪搭、哪條線、幾分、要不要換車）
  note:  '⚠️ 冬季…',      // 一般備註
  buy:   '鬼塚虎在…',      // 🛍️ 綠色購物備註
  todo:  true,           // 顯示灰色「待填」標籤
  place: '皇居東御苑',     // 有值才會出現「📍 地圖」,且必須在 GEO 裡才會畫進地圖
  link:  'https://…',    // 有值才會出現「🔗 官網」
}
```

**加了 `place` 就要在 `GEO` 加對應座標**,key 要一字不差,否則地圖上不會出現那個點。

---

## 共享機制

- `CONFIG.mode = 'shared'`,使用者在「資訊」分頁按鈕建立房間,存 localStorage
- 後端是 jsonblob.com（免註冊、免金鑰）,房號只存在使用者裝置與分享網址
- 每次改動**先寫本機再推雲端**,所以沒網路照樣能用
- 支出與自訂清單用 id 聯集合併,刪除用「墓碑」標記同步,不會被別人舊資料復活
- 展開狀態、地圖開合等**顯示偏好存本機,不同步**

---

## 本機測試

Windows 上 `python -m http.server` 和 `npx http-server` 都踩過坑（exit code 5/49、
起在錯的目錄）。最穩的方式是寫個 node 靜態伺服器：

```js
// serve.js
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname;
const T={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8'};
http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';
fs.readFile(path.join(ROOT,p),(e,b)=>{if(e){s.writeHead(404).end();return;}
s.writeHead(200,{'Content-Type':T[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});s.end(b);});
}).listen(8123,'127.0.0.1',()=>console.log('http://127.0.0.1:8123'));
```

```bash
node serve.js
```

---

## 工作方式（使用者的期待）

- **用繁體中文溝通。**
- **不要憑記憶寫餐廳地址、營業時間、公休日。** 一律查證後再寫,查不到就明說查不到,
  不要猜。使用者要拿這份東西在東京實際走,寫錯會害他們跑錯地方。
- 已經因為查證而修正過的事：蔦已從巢鴨搬到代代木上原、皇居東御苑週一週五休園、
  築地場外市場週三多半休市、On 在 Alpen TOKYO 另有日本最大旗艦專區。
- **改完要實際驗證**,不是只看程式碼。用瀏覽器跑起來檢查 DOM/數值。
  分帳算式、日期星期換算、地圖座標這類東西尤其要驗。
- 發現使用者原本規劃裡的問題（時間排不完、景點當天公休）要主動講,
  但不要自作主張刪掉他要的東西。

---

## 目前待補

- 東京飯店（12/23、24、25、26、28 共 5 晚）未訂,訂了要重算 Day 1/2/5/7 交通
- 桃園組 2 人的航班時間未定,兩組在成田的會合方式未討論
- 各餐廳實際訂位結果（今半、敘敘苑、牛舌、鰻魚飯）
- 富士山團的集合點是東京站還是新宿未確認
- 使用者給過一份 110 家拉麵清單,目前只查證定位了 6 家,其餘未處理

## 已知待確認的行程風險

- **Day 1 偏滿**：07:00 的飛機,晚上還排到東京鐵塔。麻布台之丘與東京鐵塔已標「體力不夠就移到別天」
- **Day 3 最滿**：09:30 到 22:00。若當天覺得趕,建議砍「表參道逛街」,
  因為鬼塚虎表參道店的貨在貓街店與新宿旗艦店都買得到
- **Day 6 移動量大**：大室山在伊東、蘆之湖在箱根,兩地開車約 1.5 小時,
  是跟團行程,建議出發前跟旅行社確認實際順序
