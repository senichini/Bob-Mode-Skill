/* ============================================================
   教學步驟資料定義（共 9 步）
   步驟順序：
     1. 介紹
     2. 建立專案資料夾（修正問題 1）
     3. 建立 Moving Planner Mode（修正問題 4：補齊 execute group）
     4. 建立 moving-plan-pdf Skill（修正問題 2：附 HTML 模板）
     5. 安裝 Playwright（修正問題 3：指定在 skill 目錄安裝）
     6. 驗證環境
     7. 切換至 Moving Planner Mode
     8. 填寫搬家資訊 → 回答確認問題（★ 同一對話中連續執行）
     9. 確認計畫草稿 → 產生 PDF（★ 同一對話中連續執行）
============================================================ */

const STEPS = [
  /* ── 步驟 1：介紹 ── */
  {
    tag: "介紹",
    title: "什麼是 Moving Planner？",
    desc: "了解這套工具能幫你做什麼，以及完成後會取得哪些成果。",
    prompt: `# 這個步驟不需要輸入 Prompt
# 請先閱讀下方的預期結果，了解整體流程後再繼續。`,
    isIntro: true,
    result: `<p><strong>Moving Planner</strong> 是在 Bob 自訂的搬家規劃 Mode ，結合 <code>moving-plan-pdf</code> Skill，可以：</p>
<ul class="result-info-list">
  <li>根據你的搬家情境，自動產生七個階段的詳細待辦清單</li>
  <li>將計畫整理成結構化的 JSON 資料</li>
  <li>透過 Python 腳本將資料轉換成精美的 HTML 文件</li>
  <li>使用 Playwright（Chromium）將 HTML 轉換成 A4 PDF 清單</li>
</ul>
<div class="result-mock">📄 最終輸出：
   output/moving-plan.json   ← 計畫資料
   output/moving-plan.html   ← HTML 版本
   output/moving-plan.pdf    ← 可列印的 PDF 清單</div>
<p style="margin-top:12px"><strong>步驟順序：</strong><br>
先建立資料夾與結構 → 建立 Mode 與 Skill → 安裝依賴 → 驗證環境 → 執行規劃</p>`,
    checklist: [
      "我已了解 Moving Planner 是用於搬家規劃的 Bob 模式",
      "我知道最終會產出 JSON、HTML、PDF 三個檔案",
      "我了解本教學的正確步驟順序",
    ],
  },

  /* ── 步驟 2：建立專案資料夾 ── */
  {
    tag: "建立資料夾",
    title: "建立並開啟專案資料夾",
    desc: "在開始一切操作前，必須先建立一個專屬的專案資料夾，並以此作為 Bob 的工作目錄。",
    isIntro: true,
    prompt: `這個步驟不需要輸入 Prompt，請手動操作：

1. 在電腦上建立一個新資料夾，例如 C:\\Projects\\my-move（Windows）或 ~/Projects/my-move（macOS / Linux）
   （資料夾名稱「my-move」可自行替換，但只能使用英數字、連字號 - 或底線 _，不可含中文或空格）

2. 開啟 Bob 應用程式，點擊左上角「開啟資料夾」，選擇剛才建立的資料夾

3. 確認 Bob 視窗標題或側邊欄顯示的根目錄已更新為你剛才選擇的資料夾路徑

這個資料夾將作為整個教學的工作根目錄，後續所有 Bob 建立的設定與輸出檔案都會放在這裡。`,
    result: `<p>完成後，Bob 的工作目錄已設定完成，資料夾目前只有你建立的空目錄：</p>
<div class="result-mock">✅ 資料夾已建立：C:\\Projects\\my-move（名稱可自訂）
✅ Bob 已開啟此資料夾作為工作區
✅ 目前工作目錄：C:\\Projects\\my-move（名稱可自訂）

現在可以開始建立 Mode 與 Skill 設定。</div>
<div class="result-mock mock-warn" style="margin-top:10px">⚠️  常見錯誤：
若在沒有開啟資料夾的情況下操作 Bob，
所有路徑將無法正確對應，
導致 .bob/ 目錄位置不確定。</div>`,
    checklist: [
      "已在電腦上建立專案資料夾（如 C:\\Projects\\my-move，名稱可自訂）",
      "已在 Bob 介面使用「開啟資料夾」選擇此目錄",
      "Bob 的工作目錄顯示為剛才建立的資料夾",
    ],
  },

  /* ── 步驟 3：建立 Moving Planner Mode ── */
  {
    tag: "建立 Mode",
    title: "向 Bob 請求建立 Moving Planner Mode",
    desc: "告訴 Bob 建立搬家規劃模式，並確保設定中包含 execute 工具（否則無法執行腳本）。",
    prompt: `我想建立一個 Bob 自訂模式，專門用於規劃搬家。
這個模式要叫做「Moving Planner」（slug: moving-planner）。

模式的主要功能是：
- 收集使用者的搬家資訊（日期、住所類型、家庭人數、大型家具等）
- 評估目前搬家準備狀況
- 建立七個階段的搬家任務清單：
  搬家前 4 週、2 週、1 週、3 天、前一天、當天、搬家後 1 週
- 完成規劃後呼叫 moving-plan-pdf skill 產生 PDF

重要：這個 Mode 必須包含以下所有工具群組：
  groups: [read, edit, execute, skill]

其中 execute 不可省略，否則無法執行 Python 與 Node.js 腳本。

請幫我建立這個 Mode 的完整設定並寫入 .bob/custom_modes.yaml。`,
    result: `<p>Bob 會建立 <code>.bob/custom_modes.yaml</code>，其中關鍵是 <code>groups</code> 必須包含 <code>execute</code>：</p>
<div class="result-mock mock-code">customModes:
  - slug: moving-planner
    name: Moving Planner
    description: Plans residential moves and produces a structured PDF.
    roleDefinition: >-
      You are a residential moving planning assistant.
    whenToUse: |-
      Use this mode when the user wants to plan a residential move...
    customInstructions: >-
      Follow this workflow: Collect moving information → Assess
      preparation status → Create plan → Invoke moving-plan-pdf Skill
    groups:
      - read
      - edit
      - execute   ← 此項必須存在，否則無法執行腳本
      - skill</div>
<div class="result-mock mock-warn" style="margin-top:10px">⚠️  常見錯誤：
若 groups 中缺少 execute，
Bob 在 Moving Planner 模式下將無法執行
generate_html.py 或 generate_pdf.js，
整個 PDF 產生流程會卡住。</div>`,
    checklist: [
      ".bob/custom_modes.yaml 檔案已建立",
      "YAML 中確認包含 slug: moving-planner",
      "YAML 的 groups 清單包含 read、edit、skill、execute",
      "Bob 介面的模式選單已出現「Moving Planner」選項",
    ],
  },

  /* ── 步驟 4：建立 moving-plan-pdf Skill ── */
  {
    tag: "建立 Skill",
    title: "向 Bob 請求建立 moving-plan-pdf Skill",
    desc: "建立 Skill 時必須同時建立 HTML 模板，否則 generate_html.py 無法讀取版面並產生 HTML。",
    prompt: `我需要一個 Bob skill，負責將已完成的搬家計畫轉換成 PDF 文件。

這個 skill 要叫做「moving-plan-pdf」，功能：
1. 接收搬家計畫資料，產生 output/moving-plan.json
2. 使用 Python 腳本（generate_html.py）將 JSON 轉換成 HTML
3. 使用 Node.js + Playwright（generate_pdf.js）將 HTML 轉成 A4 PDF
4. 驗證三個輸出檔案均正確產生

PDF 必須包含七個固定章節（搬家前 4 週、2 週、1 週、3 天、前一天、當天、搬家後 1 週）。

請幫我建立這個 Skill 的完整設定、所有腳本，以及 HTML 模板。
特別注意：
- templates/moving-plan.html 這個模板檔案必須一起建立，
  generate_html.py 在執行時需要讀取這個模板。
- package.json 必須一起建立，並在 dependencies 中宣告 playwright 依賴，
  例如：{ "dependencies": { "playwright": "^1.40.0" } }
  這樣 npm install 才能正確安裝 Playwright 套件。`,
    result: `<p>Bob 會建立 Skill 所需的完整檔案，其中 <code>templates/moving-plan.html</code> 是關鍵：</p>
<ul class="result-info-list">
  <li><code>SKILL.md</code> — Skill 說明與流程定義</li>
  <li><code>scripts/generate_html.py</code> — JSON → HTML 轉換腳本</li>
  <li><code>scripts/generate_pdf.js</code> — HTML → PDF 轉換腳本</li>
  <li><code>templates/moving-plan.html</code> — PDF 版面模板</li>
  <li><code>package.json</code> — 宣告 playwright 依賴</li>
</ul>
<p style="margin-top:8px">HTML 模板的最小必要結構（須包含以下替換變數）：</p>
<div class="result-mock mock-code">&lt;!DOCTYPE html&gt;
&lt;html lang="zh-Hant-TW"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8"&gt;
  &lt;title&gt;{{TITLE}}&lt;/title&gt;
  &lt;!-- CSS 樣式（@page A4、繁體中文字型等）--&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;h1&gt;{{TITLE}}&lt;/h1&gt;
  &lt;p&gt;搬家日期：{{MOVING_DATE}}&lt;/p&gt;
  &lt;p&gt;產生日期：{{GENERATED_DATE}}&lt;/p&gt;
  {{SUMMARY_TABLE}}
  {{CONFIRMATIONS}}
  {{STAGES}}
  {{TOP_PRIORITIES}}
&lt;/body&gt;
&lt;/html&gt;</div>
<div class="result-mock mock-warn" style="margin-top:10px">⚠️  常見錯誤：
若 templates/moving-plan.html 不存在，
generate_html.py 執行時會報錯：
「找不到 HTML 模板：templates/moving-plan.html」
整個 HTML/PDF 產生流程會中斷。</div>`,
    checklist: [
      ".bob/skills/moving-plan-pdf/SKILL.md 已建立",
      ".bob/skills/moving-plan-pdf/scripts/generate_html.py 已建立",
      ".bob/skills/moving-plan-pdf/scripts/generate_pdf.js 已建立",
      ".bob/skills/moving-plan-pdf/templates/moving-plan.html 已建立",
      ".bob/skills/moving-plan-pdf/package.json 已建立並包含 playwright 依賴",
      "HTML 模板包含 {{TITLE}}、{{STAGES}} 等必要替換變數",
    ],
  },

  /* ── 步驟 5：安裝 Playwright ── */
  {
    tag: "安裝依賴",
    title: "在 Skill 目錄下安裝 Playwright",
    desc: "⚠️ 重要：Playwright 套件必須安裝在 .bob/skills/moving-plan-pdf/ 目錄下，絕對不可使用 npm install -g 全域安裝，否則 Node.js 執行時將找不到套件。",
    prompt: `請幫我安裝 moving-plan-pdf skill 所需的 Playwright 套件。

重要限制：
- 必須在 .bob/skills/moving-plan-pdf/ 目錄下執行 npm install
- 禁止使用 npm install -g playwright 全域安裝
- 套件必須安裝到該目錄的 node_modules/ 下，generate_pdf.js 才能正確 require

防呆步驟（執行 npm install 前請先確認）：
1. 確認 .bob/skills/moving-plan-pdf/ 目錄存在
2. 確認該目錄下有 package.json 檔案；若不存在，先在該目錄建立以下內容的 package.json：
   {
     "name": "moving-plan-pdf",
     "version": "1.0.0",
     "dependencies": {
       "playwright": "^1.40.0"
     }
   }
3. package.json 建立後，再切換到該目錄執行 npm install

其他注意事項：
1. Chromium 瀏覽器需額外透過 npx playwright install chromium 安裝
2. 請先確認 Node.js 與 Python 3 已安裝

請按照以下步驟執行：
- 切換到 .bob/skills/moving-plan-pdf/ 目錄（cd .bob/skills/moving-plan-pdf）
- 確認或建立 package.json（內容如上）
- 在該目錄執行 npm install（不是在專案根目錄）
- 執行 npx playwright install chromium
- 確認安裝成功

使用 cmd 執行命令，不要用 PowerShell。`,
    result: `
<p>安裝步驟說明（以下為說明，不須實際操作，Bob 會協助建立）：</p>
<div class="result-mock mock-code"># 第一步：切換到 Skill 目錄（必須在此目錄下安裝，不可在專案根目錄）
cd .bob/skills/moving-plan-pdf

# 第二步（防呆）：若 package.json 不存在，先建立它
# 確認是否存在：
#   Windows: if not exist package.json (...)
#   macOS/Linux: [ ! -f package.json ] && ...
# 手動建立內容（存為 package.json）：
# {
#   "name": "moving-plan-pdf",
#   "version": "1.0.0",
#   "dependencies": {
#     "playwright": "^1.40.0"
#   }
# }

# 第三步：安裝 npm 套件（playwright 會安裝在此目錄的 node_modules 下）
npm install

# 第四步：安裝 Chromium 瀏覽器
npx playwright install chromium

# 第五步：驗證 Playwright 可被找到
node -e "require('./node_modules/playwright')"</div>
<p style="margin-top:8px">package.json 範本（若目錄下不存在時建立）：</p>
<div class="result-mock mock-code">{
  "name": "moving-plan-pdf",
  "version": "1.0.0",
  "dependencies": {
    "playwright": "^1.40.0"
  }
}</div>
<p style="margin-top:8px">安裝成功後的目錄結構：</p>
<div class="result-mock">✅ .bob/skills/moving-plan-pdf/
     ├── node_modules/
     │   ├── playwright/        ← 套件必須在此（非全域）
     │   └── playwright-core/
     ├── package.json
     └── package-lock.json</div>
<div class="result-mock mock-warn" style="margin-top:10px">⚠️  常見錯誤：
若從專案根目錄執行 npm install（而非 skill 目錄），
node_modules 會建立在錯誤位置，
generate_pdf.js 的 require('playwright')
將找不到套件，報錯：Cannot find module 'playwright'。

解決方法：cd .bob/skills/moving-plan-pdf 後再執行 npm install。</div>`,
    checklist: [
      "已確認 Node.js 已安裝（node -v 應顯示 v18 以上版本）",
      "已確認 Python 3 已安裝（python --version 或 python3 --version）",
      ".bob/skills/moving-plan-pdf/node_modules/playwright/ 目錄已存在",
      "Chromium 瀏覽器安裝完成（無報錯）",
    ],
  },

  /* ── 步驟 6：驗證環境 ── */
  {
    tag: "驗證環境",
    title: "驗證環境完整性",
    desc: "在所有結構與依賴安裝完成後，執行完整的環境驗證，確認一切就緒。",
    prompt: `請幫我驗證目前的環境是否已完整準備好，可以產生搬家計畫 PDF。

請依序檢查：
1. Node.js 版本（應為 v18 以上）
2. Python 3 版本（應為 3.8 以上）
3. .bob/custom_modes.yaml 是否存在且包含 moving-planner mode
4. .bob/skills/moving-plan-pdf/SKILL.md 是否存在
5. .bob/skills/moving-plan-pdf/templates/moving-plan.html 是否存在
6. .bob/skills/moving-plan-pdf/node_modules/playwright 是否存在
7. Playwright Chromium 是否已安裝

請用 cmd 執行命令，逐一確認並回報結果。`,
    result: `<p>全部通過後，Bob 會顯示完整的環境驗證報告：</p>
<div class="result-mock">環境驗證報告
─────────────────────────────────────
✅ Node.js v20.11.0           — 已安裝（≥ v18）
✅ Python 3.11.4              — 已安裝（≥ 3.8）
✅ custom_modes.yaml          — 包含 moving-planner mode
✅ SKILL.md                   — 存在
✅ templates/moving-plan.html — 存在（含必要替換變數）
✅ node_modules/playwright    — 已安裝在 skill 目錄下
✅ Playwright Chromium        — 已安裝

所有環境需求均已滿足。
可以開始使用 Moving Planner 模式。</div>`,
    checklist: [
      "Node.js 版本（驗證通過）",
      "Python 版本（驗證通過）",
      "custom_modes.yaml",
      "SKILL.md",
      "templates/moving-plan.html",
      "node_modules/playwright",
      "Chromium 已安裝（驗證通過）",
    ],
  },

  /* ── 步驟 7：切換 Mode ── */
  {
    tag: "啟動工具",
    title: "切換到 Moving Planner Mode",
    desc: "從 Bob 介面的模式選單，手動切換到專屬的搬家規劃模式。",
    isIntro: true,
    prompt: `# 這個步驟不需要輸入 Prompt
# 請依照右方說明，從介面選單切換至 Moving Planner 模式。`,
    result: `<p>請依照以下步驟，從 Bob 介面手動切換至 Moving Planner 模式：</p>
<ul class="result-info-list">
  <li>在 Bob 聊天介面左下角找到 <strong>模式切換按鈕</strong>（顯示目前模式名稱）</li>
  <li>點擊後會展開模式選單，從清單中選擇 <strong>Moving Planner</strong></li>
  <li>切換成功後，模式按鈕會顯示「Moving Planner」</li>
  <li>此時即可開始輸入搬家資訊，Bob 會以搬家規劃助手的角色回應</li>
</ul>
<div class="result-mock">切換至 Moving Planner 模式後 🏠

- 直接進入下一步驟
- 有提供 Prompt 範例</div>`,
    checklist: [
      "已從 Bob 介面的模式選單切換至 Moving Planner 模式",
      "介面顯示「Moving Planner」模式標籤",
    ],
  },

  /* ── 步驟 8：填寫搬家資訊 + 回答確認問題 ── */
  {
    tag: "輸入資訊",
    title: "填寫搬家資訊並回答 Bob 的確認問題",
    desc: "在同一個對話中，先提供搬家基本資訊，再回答 Bob 提出的補充問題，確保計畫涵蓋所有重要細節。",
    sameSession: true,
    prompts: [
      {
        label: "第 1 則訊息　先傳送這則",
        text: `我預計在 2025 年 10 月 30 日搬家。
目前住所是兩房一廳，新住所也是兩房一廳。
家庭有 2 個人。沒有小孩或寵物。
大型家具有沙發、雙人床、書桌，不需要搬冰箱和洗衣機（新住所已有）。
我們打算自己租車搬，不請搬家公司。
搬家距離大約 5 公里，兩邊都有電梯。
目前還沒開始打包。`,
      },
      {
        label: "第 2 則訊息　等 Bob 提出問題後再傳送",
        text: `1. 停車和裝卸部分：兩邊大樓門口都可以停車，不需要申請。
2. 新住所鑰匙：搬家前一週可以取得。
3. 水電和網路：網路需要重新申請，水電沿用原帳戶。
4. 地址變更：需要更新身分證地址和銀行帳戶。
5. 清潔：舊住所需要做退租清潔，新住所搬進去前也想掃一次。`,
      },
    ],
    result: `<p>Bob 收到基本資訊後會提出補充問題，回答後整合所有資訊，準備產生七階段計畫草稿。</p>
<div class="result-mock">已收到搬家資訊 ✓

搬家日期：2025-10-30（距今約 X 週）
住所類型：兩房一廳 → 兩房一廳
家庭人數：2 人
搬家方式：自行租車搬運
大型家具：沙發、雙人床、書桌

⚠️  注意：目前尚未開始打包，
    建議盡早開始整理不常用物品。

我還需要確認幾個細節...</div>
<div class="result-mock" style="margin-top:8px">確認問題已完整回答 ✓

額外任務已加入計畫：
+ 申請新住所網路（HIGH 優先）
+ 辦理地址變更—身分證（MEDIUM 優先）
+ 辦理地址變更—銀行帳戶（MEDIUM 優先）
+ 舊住所退租清潔（MEDIUM 優先）
+ 新住所入住前清潔（MEDIUM 優先）

正在建立七階段搬家計畫草稿...</div>`,
    checklist: [
      "已輸入第一則訊息（搬家基本資訊）",
      "已等待 Bob 提出確認問題",
      "已在同一對話中回答停車、鑰匙、水電網路、地址變更、清潔等細節",
      "Bob 已回覆「正在建立七階段搬家計畫草稿」",
    ],
  },

  /* ── 步驟 9：確認計畫草稿 + 產生 PDF ── */
  {
    tag: "確認並產生",
    title: "確認七階段計畫並產生 PDF",
    desc: "在同一個對話中確認 Bob 展示的七階段任務清單（可要求修改），確認後 Bob 自動執行 JSON → HTML → PDF 整個流程。",
    sameSession: true,
    sameSessionNote: "請繼續在<strong>步驟 8 的同一個 Bob 對話</strong>中輸入，不要開新對話",
    prompt: `這份計畫草稿看起來很完整，我確認內容正確。
請幫我把搬家前 2 週的「整理書房雜物」改成高優先，
並在搬家前 1 週加上「拍照記錄家具位置」這個任務。
修改完成後，請幫我產生搬家計畫 PDF。`,
    result: `<p>Bob 更新草稿後立即呼叫 Skill，依序自動執行完整轉換流程：</p>
<div class="result-mock">計畫草稿更新完成 ✓

📋 七階段任務摘要：
  搬家前 4 週  ▸ 6 個任務（2 HIGH / 3 MEDIUM / 1 LOW）
  搬家前 2 週  ▸ 8 個任務（3 HIGH / 4 MEDIUM / 1 LOW）
  搬家前 1 週  ▸ 9 個任務（4 HIGH / 4 MEDIUM / 1 LOW）
  搬家前 3 天  ▸ 5 個任務（3 HIGH / 2 MEDIUM）
  搬家前一天  ▸ 6 個任務（4 HIGH / 2 MEDIUM）
  搬家當天    ▸ 7 個任務（5 HIGH / 2 MEDIUM）
  搬家後 1 週  ▸ 5 個任務（2 HIGH / 2 MEDIUM / 1 LOW）

共 46 個任務。開始產生 PDF...</div>
<div class="result-mock" style="margin-top:8px">✅ 已建立 output/ 目錄
✅ 已寫入 output/moving-plan.json（2.4 KB）
✅ JSON 結構驗證通過（7 個階段均存在）

✅ 執行 generate_html.py...
✅ 已產生 output/moving-plan.html（48.7 KB）
✅ HTML 驗證通過（包含全部 7 個階段）

✅ 啟動 Playwright Chromium...
✅ 等待字型載入完成（中文字型）
✅ 已產生 output/moving-plan.pdf（185 KB）
✅ PDF 驗證通過（檔案大小 > 0）

Moving Planner Status: COMPLETED

PDF:         output/moving-plan.pdf
Source Data: output/moving-plan.json
Top Priorities:
- 申請新住所網路（搬家前 4 週）
- 確認新住所鑰匙取得時間
- 訂購或租用搬家車輛</div>
<ul class="result-info-list" style="margin-top:10px">
  <li>直接開啟 PDF 閱讀或列印作為紙本清單</li>
  <li>分享給家庭成員共同追蹤進度</li>
  <li>每完成一項任務，在 Bob 中更新狀態並重新產生 PDF</li>
</ul>`,
    checklist: [
      "已閱讀所有七個階段的任務清單",
      "已確認各任務的優先級（HIGH / MEDIUM / LOW）合理",
      "已提出需要修改的任務（若有）並獲得 Bob 更新",
      "output/moving-plan.json 已成功產生",
      "output/moving-plan.html 已成功產生",
      "output/moving-plan.pdf 已成功產生",
      "已開啟 PDF 確認包含七個搬家階段與正確日期",
    ],
  },
];
