/* ============================================================
   設定檔 —— 平常只會動最上面那幾行
   ============================================================ */

const CONFIG = {

  /* ---------- 旅程基本資料 ---------- */
  tripTitle: '東京 7天6夜',
  startDate: '',        // 例：'2026-11-15'。填了每天會自動顯示日期與星期
  members: ['我', '同伴A', '同伴B', '同伴C'],   // App 裡也能改
  defaultRate: 4.7,     // 1 TWD = ? JPY,App 裡也能改


  /* ---------- 4 人共享設定 ----------
     預設 local = 資料只存在自己這台裝置。
     想開共享時,改 mode,兩種都不用辦新帳號：

     A) mode: 'gist'  ← 推薦,穩定
        1. 到 gist.github.com 建一個 Secret gist,
           檔名打 tokyo-trip.json,內容打 {}
        2. 網址列 gist.github.com/你的帳號/<這串就是 gistId>
        3. 到 github.com/settings/tokens 產生
           Fine-grained token,Permissions 只勾 Gists = Read and write
        4. 填到下面 gistId / token

     B) mode: 'jsonblob'  ← 完全免註冊
        改成 'jsonblob' 後,到「資訊」分頁按「建立共享房間」,
        會產生一組共享碼,把網址丟給另外 3 個人就好。
  */
  share: {
    mode: 'local',      // 'local' | 'gist' | 'jsonblob'

    // mode:'gist' 時要填
    gistId: '',
    token: '',

    // mode:'jsonblob' 時通常留空,按鈕產生後會自己記住
    roomId: '',
  },
};
