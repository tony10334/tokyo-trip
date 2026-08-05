/* ============================================================
   內容資料 —— 之後你給我實際行程,我改這個檔就好
   ============================================================ */

/* ---------- 行程 ----------
   day    第幾天
   tag    日卡右上的小標（待定 / 星期幾 / 主題）
   title  這天的大標
   area   這天的區域
   items  時間軸,欄位說明看 README
   type   move交通 / food吃 / see景點 / shop買 / stay住 / free自由 / cafe咖啡 / night夜
*/
const ITINERARY = [
  {
    day: 1, tag: '待定', title: '抵達東京', area: '成田 / 新宿',
    items: [
      { time: '下午', type: 'move', title: '抵達成田 / 羽田機場', todo: true, note: '（請填入航班資訊）' },
      { time: '傍晚', type: 'stay', title: '入住飯店', todo: true, note: '新宿區 —— （待填入飯店名稱）' },
      { time: '晚上', type: 'food', title: '新宿初探', note: '歌舞伎町、拉麵一番街,好好感受一下東京夜晚' },
    ],
  },
  {
    day: 2, tag: '待定', title: '第二天', area: '待填區域',
    items: [
      { time: '上午', type: 'see', title: '行程待填', todo: true, note: '' },
      { time: '下午', type: 'free', title: '行程待填', todo: true, note: '' },
      { time: '晚上', type: 'food', title: '晚餐待填', todo: true, note: '' },
    ],
  },
  {
    day: 3, tag: '待定', title: '第三天', area: '待填區域',
    items: [
      { time: '上午', type: 'see', title: '行程待填', todo: true, note: '' },
      { time: '下午', type: 'shop', title: '行程待填', todo: true, note: '' },
      { time: '晚上', type: 'food', title: '晚餐待填', todo: true, note: '' },
    ],
  },
  {
    day: 4, tag: '待定', title: '第四天', area: '待填區域',
    items: [
      { time: '上午', type: 'see', title: '行程待填', todo: true, note: '' },
      { time: '下午', type: 'free', title: '行程待填', todo: true, note: '' },
      { time: '晚上', type: 'food', title: '晚餐待填', todo: true, note: '' },
    ],
  },
  {
    day: 5, tag: '待定', title: '第五天', area: '待填區域',
    items: [
      { time: '上午', type: 'see', title: '行程待填', todo: true, note: '' },
      { time: '下午', type: 'shop', title: '行程待填', todo: true, note: '' },
      { time: '晚上', type: 'food', title: '晚餐待填', todo: true, note: '' },
    ],
  },
  {
    day: 6, tag: '待定', title: '第六天', area: '待填區域',
    items: [
      { time: '上午', type: 'see', title: '行程待填', todo: true, note: '' },
      { time: '下午', type: 'shop', title: '最後採買', todo: true, note: '藥妝、伴手禮,先秤一下行李重量' },
      { time: '晚上', type: 'free', title: '整理行李', note: '液體、行動電源記得分好託運和隨身' },
    ],
  },
  {
    day: 7, tag: '回程', title: '回台灣', area: '飯店 → 機場',
    items: [
      { time: '上午', type: 'stay', title: '退房 / 寄放行李', todo: true, note: '' },
      { time: '中午', type: 'move', title: '前往機場', note: '從市區抓 3 小時比較保險' },
      { time: '下午', type: 'move', title: '搭機返台', todo: true, note: '（請填入航班資訊）' },
    ],
  },
];

/* ---------- 行前清單 ---------- */
const CHECKLIST = [
  {
    cat: '證件 · 錢', icon: '🛂',
    items: [
      '護照（效期 6 個月以上）', '護照影本 / 拍照存手機', '機票電子檔',
      '日幣現金', '信用卡（出國前開通國外交易）',
      'Visit Japan Web 入境登錄', '旅遊保險', '駕照日文譯本（要租車才需要）',
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
    cat: '衣物', icon: '👕',
    items: [
      '上衣 ×7', '褲子 ×3', '內衣褲 ×7', '襪子 ×7', '外套（先查當地氣溫）',
      '好走的鞋（東京一天走 2 萬步很正常）', '睡衣', '雨傘 / 輕便雨衣',
    ],
  },
  {
    cat: '盥洗 · 藥品', icon: '💊',
    items: [
      '牙刷牙膏', '洗面乳 / 保養品（分裝 100ml 以下）', '防曬',
      '常備藥（腸胃、止痛、感冒）', '個人處方藥 + 藥單', 'OK 繃', '口罩',
    ],
  },
  {
    cat: '其他', icon: '🎒',
    items: [
      '行李秤（回程買太多會用到）', '摺疊袋 / 預留行李空間', '環保袋（日本超商袋子要錢）',
      '小包面紙', '頸枕', '行李鎖',
    ],
  },
];

/* ---------- 實用資訊 ---------- */
const INFO = [
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
    cat: '住宿', icon: '🏨',
    rows: [['飯店名稱', '待填'], ['地址', '待填'], ['電話', '待填'], ['Check-in / out', '待填']],
  },
  {
    cat: '航班', icon: '✈️',
    rows: [['去程', '待填'], ['回程', '待填'], ['訂位代號', '待填']],
  },
  {
    cat: '小提醒', icon: '💡',
    rows: [
      ['電壓', '100V,台灣電器可直接用,插頭同樣兩腳扁插'],
      ['小費', '不用給'],
      ['垃圾', '路上幾乎沒垃圾桶,自己收好帶回飯店'],
      ['電車', '尖峰時間不要講電話,後背包背前面'],
    ],
  },
];
