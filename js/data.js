/* ============================================================
   內容資料 —— 方案 A：寬鬆悠閒版
   2026/12/23 (三) – 12/29 (二)　高雄 ⇄ 成田
   ------------------------------------------------------------
   吃跟住確定後,把 todo: true 拿掉並補上店名 / 飯店名即可。
   ============================================================ */

/* ---------- 行程 ----------
   type: move交通 / food吃 / see景點 / shop買 / stay住 / free自由 / cafe咖啡 / night夜
   todo: true 會顯示灰色「待填」標籤
   place: 填了會出現「📍 地圖」    link: 填了會出現「🔗 官網」
*/
const ITINERARY = [
  {
    day: 1, tag: '平安夜前', title: '抵達東京 · 丸之內聖誕浪漫', area: '成田 → 東京車站 / 丸之內',
    items: [
      { time: '中午', type: 'move', title: '11:25 抵達成田機場',
        note: '入境後搭車進市區,先把行李放飯店', place: '成田国際空港' },
      { time: '下午', type: 'see', title: '東京車站周邊商圈巡禮',
        note: 'KITTE 丸之內 → 新丸之內大廈 → 皇居外苑散步',
        place: 'KITTE 丸の内', link: 'https://marunouchi.jp-kitte.jp/tw/' },
      { time: '傍晚', type: 'shop', title: '新丸之內大廈',
        link: 'https://www.marunouchi.com/tw/' },
      { time: '晚上', type: 'night', title: '丸之內仲通 香檳金聖誕點燈',
        note: '整條街的香檳金燈海,這趟最經典的聖誕畫面之一',
        place: '丸の内仲通り', link: 'https://www.gotokyo.org/tc/spot/ev144/index.html' },
      { time: '晚餐', type: 'food', title: '壽喜燒', todo: true,
        note: '推薦：人形町今半（黑毛和牛 + 專人桌邊服務）· 需提前訂位',
        link: 'https://www.imahan.com/guide/shop/ningyocho_shop.html' },
      { time: '住宿', type: 'stay', title: '東京飯店', todo: true, note: '（待訂）' },
    ],
  },
  {
    day: 2, tag: '平安夜', title: '淺草下町 · 上野主力採買', area: '淺草 / 上野 / 押上',
    items: [
      { time: '早上', type: 'see', title: '淺草寺參拜 · 仲見世通',
        note: '雷門拍照,仲見世通吃特色小吃',
        place: '浅草寺', link: 'https://www.gotokyo.org/tc/spot/45/index.html' },
      { time: '下午', type: 'shop', title: '上野阿美橫町',
        note: '主力採買日：藥妝、零食、伴手禮。買完先提回飯店再出門',
        place: 'アメヤ横丁', link: 'https://matcha-jp.com/tw/1269' },
      { time: '晚上', type: 'see', title: '東京晴空塔',
        note: '觀景台 + 塔下 Solamachi 的聖誕市集',
        place: '東京スカイツリー',
        link: 'https://www.klook.com/zh-TW/activity/2336-tokyo-skytree-observatory-ticket-tokyo/' },
      { time: '晚餐', type: 'food', title: '和牛燒肉', todo: true,
        note: '推薦：敘敘苑 晴空塔分店（高樓層景觀）· 平安夜是旺季,務必訂位' },
    ],
  },
  {
    day: 3, tag: '聖誕節', title: '時尚逛街 · 澀谷高空夜景', area: '明治神宮 / 表參道 / 澀谷',
    items: [
      { time: '早上', type: 'see', title: '明治神宮散步',
        place: '明治神宮', link: 'https://www.meijijingu.or.jp/tw/' },
      { time: '下午', type: 'shop', title: '表參道一路逛到澀谷',
        note: '服飾、潮牌、美妝主力採買', place: '表参道' },
      { time: '15:30', type: 'see', title: 'SHIBUYA SKY 展望台', todo: true,
        note: '夕陽轉夜景的黃金時段。開賣日要第一時間搶票',
        place: 'SHIBUYA SKY', link: 'https://www.klook.com/activity/70672-shibuya-sky-tokyo/' },
      { time: '晚上', type: 'night', title: '澀谷「青之洞窟」聖誕藍色燈海',
        place: '青の洞窟 SHIBUYA', link: 'https://matcha-jp.com/tw/22272' },
      { time: '晚餐', type: 'food', title: '厚切牛舌定食', todo: true,
        note: '推薦：牛舌的檸檬（新宿爆紅）或 利久牛舌（連鎖安全牌）' },
    ],
  },
  {
    day: 4, tag: '彈性日', title: '台場悠閒午後 · 彩虹煙火大會', area: '台場',
    items: [
      { time: '早上', type: 'cafe', title: '悠閒起床,吃早午餐',
        note: '這天刻意不排滿,補一下前三天的體力' },
      { time: '下午', type: 'see', title: '台場海濱 · 1:1 獨角獸鋼彈',
        note: '海濱公園放空、商圈漫步,鋼彈變形秀記得查當天場次',
        place: 'ユニコーンガンダム立像 お台場' },
      { time: '19:00', type: 'night', title: '台場彩虹煙火大會',
        note: '這趟的重頭戲。建議提早卡位,海邊風大要穿夠',
        place: 'お台場海浜公園', link: 'https://www.gotokyo.org/tc/spot/ev125/index.html' },
      { time: '晚餐', type: 'food', title: '鰻魚飯', todo: true,
        note: '推薦：銀座 備長（酥脆關西風）· 或直接在台場商場內解決' },
    ],
  },
  {
    day: 5, tag: '跟團 Day 1', title: '富士山箱根兩日遊', area: '富士吉田 / 忍野 / 河口湖',
    items: [
      { time: '07:45', type: 'move', title: '集合出發', todo: true,
        note: '東京車站 或 新宿（確認你們這團是哪個集合點）· 前一晚先查好路線,不要遲到',
        link: 'https://www.kkday.com/zh-tw/product/268226' },
      { time: '白天', type: 'see', title: '新倉山淺間公園',
        note: '五重塔 + 富士山的經典明信片角度', place: '新倉山浅間公園' },
      { time: '白天', type: 'see', title: '日川時計店 · 忍野八海',
        note: '本町通拍富士山街景,忍野八海看湧泉池', place: '忍野八海' },
      { time: '白天', type: 'see', title: '河口湖羅森 · 大石公園',
        note: '網紅打卡的富士山便利商店,大石公園看湖景富士山', place: '大石公園 河口湖' },
      { time: '傍晚', type: 'stay', title: '入住河口湖溫泉飯店', todo: true, note: '（團體安排,待確認飯店名）' },
      { time: '晚餐', type: 'food', title: '飯店晚餐 + 泡湯', note: '團費已含' },
    ],
  },
  {
    day: 6, tag: '跟團 Day 2', title: '大室山 · 蘆之湖', area: '伊東 / 箱根',
    items: [
      { time: '早上', type: 'see', title: '大室山纜車登頂',
        note: '山頂可以繞火口一圈,天氣好看得到富士山與伊豆七島', place: '大室山' },
      { time: '下午', type: 'see', title: '蘆之湖 · 海賊觀光船',
        note: '湖上看箱根神社的水中鳥居', place: '芦ノ湖' },
      { time: '17:30', type: 'move', title: '返抵東京市區解散', note: '約 17:30–18:30 之間' },
      { time: '晚上', type: 'food', title: '解散地附近吃拉麵 / 居酒屋', todo: true,
        note: '不用排太遠,吃完早點回飯店' },
      { time: '晚上', type: 'free', title: '打包行李',
        note: '藥妝、液體、行動電源分好託運跟隨身。行李秤先秤一下' },
    ],
  },
  {
    day: 7, tag: '回程', title: '滿載而歸', area: '東京 → 成田 → 高雄',
    items: [
      { time: '早上', type: 'food', title: '飯店附近吃早餐', note: '最後放鬆一下' },
      { time: '09:30', type: 'move', title: '出發前往成田機場',
        note: '09:30 前一定要出發,成田從市區要抓 1.5–2 小時', place: '成田国際空港' },
      { time: '12:25', type: 'move', title: '搭機返回高雄', todo: true, note: '（班機編號待填）' },
    ],
  },
];

/* ---------- 行前清單 ---------- */
const CHECKLIST = [
  {
    cat: '訂位 · 訂票（最優先）', icon: '🎫',
    items: [
      '訂 人形町今半（Day1 壽喜燒,提前一個月）',
      '訂 敘敘苑 晴空塔店（Day2 平安夜,超級旺季）',
      '搶 SHIBUYA SKY 12/25 15:30 門票（開賣日第一時間）',
      '訂 KKday 富士山箱根兩日遊（Day5–6）',
      '訂 牛舌的檸檬 / 利久牛舌（Day3）',
      '訂 銀座備長 鰻魚飯（Day4）',
      '訂東京飯店（12/23、24、25、26、28 共 5 晚）',
      '機票開票確認（高雄 ⇄ 成田）',
      '查台場彩虹煙火 12/26 確切時間與場地',
      '查鋼彈變形秀當天場次',
    ],
  },
  {
    cat: '證件 · 錢', icon: '🛂',
    items: [
      '護照（效期 6 個月以上）', '護照影本 / 拍照存手機', '機票電子檔',
      '日幣現金', '信用卡（出國前開通國外交易）',
      'Visit Japan Web 入境登錄', '旅遊保險',
      '各餐廳 / 景點訂位confirmation 截圖存離線',
    ],
  },
  {
    cat: '3C', icon: '🔌',
    items: [
      '手機 + 充電線', '行動電源（一定要隨身,不能託運）', '充電器 / 萬用轉接頭',
      'WiFi 分享器 或 eSIM', '相機 + 記憶卡 + 備用電池', '耳機',
    ],
  },
  {
    cat: '衣物（12 月東京 3–10°C）', icon: '🧥',
    items: [
      '厚外套 / 羽絨衣（一定要,晚上很冷）', '發熱衣 ×4', '毛帽 · 圍巾 · 手套',
      '上衣 ×7', '褲子 ×3', '內衣褲 ×7', '厚襪 ×7',
      '好走的鞋（東京一天走 2 萬步很正常）', '睡衣',
      '溫泉用：河口湖那晚要泡湯,綁頭髮的東西 / 隱形眼鏡盒',
      '雨傘 / 輕便雨衣',
    ],
  },
  {
    cat: '盥洗 · 藥品', icon: '💊',
    items: [
      '牙刷牙膏', '洗面乳 / 保養品（分裝 100ml 以下）',
      '護唇膏 · 乳液（日本冬天超乾）', '暖暖包',
      '常備藥（腸胃、止痛、感冒）', '個人處方藥 + 藥單', 'OK 繃', '口罩',
    ],
  },
  {
    cat: '其他', icon: '🎒',
    items: [
      '行李秤（Day2 上野掃完就會用到）', '摺疊袋 / 預留行李空間',
      '環保袋（日本超商袋子要錢）', '小包面紙', '頸枕', '行李鎖',
      '西瓜卡 Suica / PASMO（或手機加卡）',
    ],
  },
];

/* ---------- 實用資訊 ---------- */
const INFO = [
  {
    cat: '航班', icon: '✈️',
    rows: [
      ['去程', '12/23 (三) 高雄 → 成田,11:25 抵達'],
      ['回程', '12/29 (二) 成田 → 高雄,12:25 起飛'],
      ['班機編號', '待填'],
      ['訂位代號', '待填'],
    ],
  },
  {
    cat: '住宿', icon: '🏨',
    rows: [
      ['東京飯店', '待訂（12/23、24、25、26、28 共 5 晚）'],
      ['地址', '待填'],
      ['電話', '待填'],
      ['河口湖溫泉飯店', '12/27,跟團安排,待確認'],
    ],
  },
  {
    cat: '緊急聯絡', icon: '🚨',
    rows: [
      ['日本報警', '110'],
      ['救護 / 消防', '119'],
      ['台北駐日經濟文化代表處', '+81-3-3280-7811'],
      ['急難救助（日本境內直撥）', '080-1009-7179'],
      ['外交部旅外急難救助', '+886-800-085-095'],
    ],
  },
  {
    cat: '訂票連結', icon: '🔗',
    rows: [
      ['SHIBUYA SKY', 'https://www.klook.com/activity/70672-shibuya-sky-tokyo/'],
      ['東京晴空塔', 'https://www.klook.com/zh-TW/activity/2336-tokyo-skytree-observatory-ticket-tokyo/'],
      ['KKday 富士山兩日遊', 'https://www.kkday.com/zh-tw/product/268226'],
      ['人形町今半', 'https://www.imahan.com/guide/shop/ningyocho_shop.html'],
      ['台場彩虹煙火', 'https://www.gotokyo.org/tc/spot/ev125/index.html'],
      ['丸之內聖誕點燈', 'https://www.gotokyo.org/tc/spot/ev144/index.html'],
      ['澀谷青之洞窟', 'https://matcha-jp.com/tw/22272'],
    ],
  },
  {
    cat: '備選餐廳', icon: '🍽️',
    rows: [
      ['壽喜燒', '人形町今半 / 淺草今半 / 伊吹（新宿,必比登）'],
      ['和牛燒肉', '敘敘苑（挑高樓層店,晴空塔店景觀最好）'],
      ['牛舌', '牛舌的檸檬（新宿）/ 利久牛舌（各大商圈）'],
      ['鰻魚飯', '備長（銀座·晴空塔,關西風）/ 尾花（米其林一星,關東風）/ 鰻禪（淺草,必比登）'],
    ],
  },
  {
    cat: '小提醒', icon: '💡',
    rows: [
      ['12 月底旺季', '忘年會 + 聖誕聚餐,熱門餐廳請提前一個月訂'],
      ['天氣', '東京 12 月約 3–10°C,體感更冷,外套要夠厚'],
      ['電壓', '100V,台灣電器可直接用,插頭同樣兩腳扁插'],
      ['小費', '不用給'],
      ['垃圾', '路上幾乎沒垃圾桶,自己收好帶回飯店'],
      ['電車', '尖峰時間不要講電話,後背包背前面'],
    ],
  },
];
