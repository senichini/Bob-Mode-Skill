# Bob — Mode & Skill 動手做教學

互動式步驟教學網頁，引導使用者親手完成 Bob 自訂 **Mode** 與 **Skill** 的完整建立流程，最終產出一份可列印的 A4 PDF 搬家計畫清單。

---

## 目錄結構

```
Bob-Mode-Skill/
├── index.html            # 頁面入口（全靜態，無後端）
├── css/
│   ├── style.css         # 匯總入口（@import 各模組）
│   ├── base.css          # CSS 變數、Reset、全域排版
│   ├── layout.css        # Header、進度條、步驟計數器
│   ├── step-card.css     # 核心卡片與三欄版面
│   ├── prompt.css        # Prompt 區塊（複製按鈕、code 區）
│   ├── nav.css           # 左右導覽按鈕、鍵盤提示
│   ├── finish.css        # 完成遮罩、Modal、彩帶動畫
│   └── tour.css          # Spotlight Onboarding 導覽
└── js/
    ├── steps.js          # 教學步驟資料（STEPS 陣列，共 9 步）
    ├── tour-steps.js     # 導覽說明資料（TOUR_STEPS 陣列，共 5 步）
    ├── app.js            # 主邏輯（渲染、翻頁、複製、清單、彩帶）
    └── tour.js           # Spotlight Tour Engine
```

---

## 教學流程（9 步）

| # | 標籤 | 類型 | 說明 |
|---|------|------|------|
| 1 | 介紹 | 說明 | 了解 Moving Planner 的功能與最終三份輸出（JSON / HTML / PDF） |
| 2 | 建立資料夾 | 說明 | 建立專案目錄並以 Bob 開啟作為工作區；路徑不可含中文或空格 |
| 3 | 建立 Mode | Prompt | 向 Bob 請求建立 Moving Planner Mode，`groups` 必須包含 `execute` |
| 4 | 建立 Skill | Prompt | 建立 `moving-plan-pdf` Skill（含 HTML 模板、腳本、`package.json`） |
| 5 | 安裝依賴 | Prompt | 在 `.bob/skills/moving-plan-pdf/` 目錄下安裝 Playwright 與 Chromium |
| 6 | 驗證環境 | Prompt | 確認 Node.js ≥ v18、Python 3 ≥ 3.8、檔案結構與套件均就緒 |
| 7 | 啟動工具 | 說明 | 從 Bob 介面的模式選單，手動切換至 Moving Planner 模式 |
| 8 | 輸入資訊 | 雙 Prompt | 先傳送搬家基本資訊，等 Bob 提問後再回答停車、鑰匙、水電等確認細節 |
| 9 | 確認並產生 | 雙 Prompt | 在同一對話審閱七階段草稿並提出修改，確認後 Bob 自動執行 JSON → HTML → PDF |

> **步驟 8 與 9 均包含兩則訊息（雙 Prompt）**，需在同一對話內依序傳送，不可開新對話。

---

## 本地執行

這個教學是純靜態 HTML，不需要任何建置工具。

**方法一：直接開啟（部分瀏覽器限制 `@import` 跨檔讀取）**

```
直接雙擊 index.html
```

**方法二：本地靜態伺服器（推薦）**

```bash
# Node.js（任一即可）
npx serve .
npx http-server .

# Python 3
python -m http.server 8080
```

開啟後瀏覽 `http://localhost:8080/`

---

## 核心架構

### 資料驅動設計

所有教學內容集中在[`js/steps.js`](js/steps.js)，以 `STEPS` 陣列定義每個步驟物件：

```js
{
  tag:            "建立 Mode",          // 左上角標籤
  title:          "向 Bob 請求建立...", // 標題
  desc:           "...",               // 副標題說明
  prompt:         `...`,               // 單一可複製的 Prompt（一般步驟）
  prompts:        [...],               // 雙 Prompt 陣列（步驟 8、9 使用）
  result:         `<p>...</p>`,        // 預期結果（允許 HTML）
  checklist:      ["...", "..."],      // 驗收清單項目
  isIntro:        true,                // 可選：說明步驟，無須輸入 Prompt（步驟 1、2、7）
  sameSession:    true,                // 可選：需在同一對話中連續傳送訊息（步驟 8、9）
  sameSessionNote: "...",              // 可選：同一對話提示文字（步驟 9）
}
```

### 雙 Prompt 設計

步驟 8（輸入資訊）與步驟 9（確認並產生）採用 `prompts` 陣列，每個物件包含：

```js
prompts: [
  { label: "第 1 則訊息　先傳送這則", text: `...` },
  { label: "第 2 則訊息　等 Bob 提出問題後再傳送", text: `...` },
]
```

UI 會依序呈現兩個可複製的 Prompt 區塊，並顯示傳送順序提示，避免使用者跳過中間步驟。

### 使用者體驗功能

- **進度條** — 即時反映目前完成比例
- **點狀導覽** — 可點擊直接跳轉任意步驟
- **鍵盤支援** — `←` / `→` 方向鍵翻頁
- **複製按鈕** — 一鍵複製 Prompt（自動過濾 `#` 說明行）
- **驗收清單** — 勾選狀態透過 `localStorage` 持久化
- **Spotlight 導覽** — 首次開啟時觸發互動式功能說明（可隨時重啟）
- **完成動畫** — 彩帶特效 + 恭喜 Modal

### 樣式架構

[`css/style.css`](css/style.css) 作為入口，透過 `@import` 載入各功能模組，每個 CSS 檔案對應單一職責，便於維護與擴充。

---

## 新增或修改步驟

只需編輯 [`js/steps.js`](js/steps.js)：

1. 在 `STEPS` 陣列中新增或修改步驟物件
2. 確保 `checklist` 至少包含一個項目
3. 若為純說明步驟（不需複製），加上 `isIntro: true`
4. 若需要在同一對話傳送兩則訊息，使用 `prompts` 陣列取代 `prompt` 字串，並加上 `sameSession: true`

其餘 UI 邏輯（進度、計數、動畫）由 [`js/app.js`](js/app.js) 自動處理，無需修改。

---

## Onboarding 導覽

導覽步驟定義在 [`js/tour-steps.js`](js/tour-steps.js)，透過 `data-tour-step` 屬性對應 HTML 元素：

| `data-tour-step` 值 | 對應元素 |
|--------------------|--------|
| `header` | 頁面頂部標題列 |
| `progress` | 進度條 |
| `stepcounter` | 步驟計數器與點狀指示 |
| `card` | 核心內容卡片 |
| `navbtns` | 右側導覽按鈕 |

初次進入頁面自動觸發，完成後記錄於 `localStorage`（key: `tour_seen_v1`）避免重複顯示。右上角開關可隨時重新開啟。
