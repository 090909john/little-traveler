# 小小旅行家：環遊台灣（v1）

給 5 歲孩子玩的台灣地圖旅行網頁遊戲：從「我家」出發，點選目的地，每段路選交通工具（火車／汽車／船），沿途過「數數看」「比多少」小關卡，抵達後看煙火、蓋護照章、聽小知識。

▶ 線上玩：https://090909john.github.io/little-traveler/

## 特色
- 平板優先、只用點選、大按鈕；禁止雙指縮放、雙擊縮放與長按選字。
- 沒有失敗：選錯交通工具會溫柔說明並自動換成可用的；答錯時正確答案會發亮，不扣分、不倒數、不重來。
- 音效使用 WebAudio；語音用瀏覽器 Web Speech API（zh-TW）暫代，畫面文字一律顯示（v2 改預錄 mp3）。
- 護照章存在本機 localStorage，key 為 `littleTraveler.v1.<profile>.passport`（目前 profile 為 `default`，日後可擴充多人／多平板）。
- 純 HTML/CSS/JS，無建置步驟、無外部網路相依。

## 內容資料（改內容不用改程式）
| 檔案 | 內容 |
|---|---|
| `data/stops.json` | 出發點「我家」（`home.lonlat` 可改位置）、6 個地標、小知識、關卡主題 |
| `data/routes.json` | 每個目的地 2–3 段路線、途經點、每段可用交通工具（第一個是自動替換的預設） |
| `data/vehicles.json` | 交通工具名稱、圖示、選錯時的說明 |
| `data/levels.json` | 關卡題數、數字範圍、提示語、稱讚語 |
| `data/map.json` | 簡化台灣輪廓座標與投影參數 |

## 地圖來源
台灣輪廓為本專案依經緯度自行手繪的簡化近似多邊形（非精確地理資料），以 CC0 釋出。

## 本機執行
```bash
python3 -m http.server 8000
# 開 http://localhost:8000/ （加 ?fast=1 可加速動畫，供測試用）
```

## 程式結構
- `js/main.js` 主流程（地圖、選目的地、選交通工具、行駛、關卡、抵達、護照）
- `js/path.js` 共用的沿路徑移動邏輯
- `js/levels.js` 數數看／比多少
- `js/fireworks.js` Canvas 煙火
- `js/audio.js` 音效與語音
- `js/storage.js` 護照存檔

## Video credits (Pexels License — free for commercial use, no attribution required)
- `assets/video/train.mp4` — "Scenic Train Journey through Countryside Fields" by Michal Petráš — https://www.pexels.com/video/scenic-train-journey-through-countryside-fields-34759849/
- `assets/video/car.mp4` — "Car on Road" by Daniel Narinian — https://www.pexels.com/video/car-on-road-11775720/
- `assets/video/ship.mp4` — "Ship Sailing on Sea" by Glenn Langhorst — https://www.pexels.com/video/ship-sailing-on-sea-11395713/
