/* ============================================================
   app.js — 主邏輯
   依賴：STEPS（js/steps.js 必須先載入）
============================================================ */

/* ── 狀態管理 ── */
let currentStep = 0;
const TOTAL = STEPS.length;

/* ============================================================
   渲染步驟內容
============================================================ */
function renderStep(index) {
  const step = STEPS[index];
  const card  = document.getElementById('stepCard');

  const sameSessionBadge = step.sameSession
    ? `<div class="same-session-notice">
        <span class="ss-icon">💬</span>
        ${step.sameSessionNote
          ? step.sameSessionNote
          : '以下操作請在<strong>同一個 Bob 對話</strong>中連續執行，不要開新對話'}
       </div>`
    : '';

  /* ── 雙 Prompt 欄（prompts 陣列）──────────────────── */
  let promptSection;
  if (step.prompts) {
    promptSection = `<div class="dual-prompt-row">` +
      step.prompts.map((p, si) => `
        <div class="section-block block-prompt dual-prompt-col">
          <div class="section-label">
            <span class="icon icon-prompt">⌨</span>
            ${escHtml(p.label)}
            <span class="label-spacer"></span>
            <button class="copy-btn" id="copyBtn-${index}-${si}" onclick="copyPromptByKey(${index},${si})">複製</button>
          </div>
          <div class="prompt-wrap">
            <pre class="prompt-code" id="promptCode-${index}-${si}">${escHtml(p.text)}</pre>
          </div>
        </div>`).join('') +
      `</div>`;
  } else {
    /* ── 單 Prompt 欄（原有邏輯）──────────────────────── */
    const promptLabel = step.isIntro
      ? '說明'
      : step.isAuto
        ? '自動執行（無需輸入）'
        : '在 Bob 對話框中輸入此 Prompt';

    promptSection = `
      <div class="section-block ${step.isIntro || step.isAuto ? 'block-desc' : 'block-prompt'}">
        <div class="section-label">
          <span class="icon icon-prompt">⌨</span>
          ${escHtml(promptLabel)}
          ${!step.isIntro && !step.isAuto
            ? `<span class="label-spacer"></span><button class="copy-btn" id="copyBtn-${index}" onclick="copyPrompt(${index})">複製</button>`
            : ''}
        </div>
        <div class="prompt-wrap">
          ${step.isIntro || step.isAuto
            ? `<div class="prompt-desc" id="promptCode-${index}">${escHtml(step.prompt)}</div>`
            : `<pre class="prompt-code" id="promptCode-${index}">${escHtml(step.prompt)}</pre>`}
        </div>
      </div>`;
  }

  let html = `
    <div class="step-header">
      <div class="step-number-badge">${index + 1}</div>
      <div class="step-title-group">
        <span class="step-tag">${escHtml(step.tag)}</span>
        <div class="step-title">${escHtml(step.title)}</div>
        <div class="step-desc">${escHtml(step.desc)}</div>
      </div>
    </div>
    ${sameSessionBadge}
    <div class="sections-wrap">

      ${promptSection}

      <!-- ── 下方兩欄：預期結果 + 驗收清單 ── -->
      <div class="bottom-row">

        <!-- 預期結果（左欄） -->
        <div class="section-block">
          <div class="section-label">
            <span class="icon icon-result">▶</span>
            預期結果
          </div>
          <div class="result-body">${step.result}</div>
        </div>

        <!-- 驗收清單（右欄） -->
        <div class="section-block">
          <div class="section-label">
            <span class="icon icon-check">✓</span>
            驗收清單
          </div>
          <div class="checklist-body" id="checklist-${index}">`;

  step.checklist.forEach((item, i) => {
    const savedKey = `step-${index}-item-${i}`;
    const isChecked = localStorage.getItem(savedKey) === '1';
    html += `
            <label class="checklist-item${isChecked ? ' checked' : ''}" id="cl-${index}-${i}">
              <input type="checkbox" ${isChecked ? 'checked' : ''}
                     onchange="toggleCheck(${index}, ${i}, this)">
              <span class="item-text">${escHtml(item)}</span>
            </label>`;
  });

  html += `</div></div></div></div>`;

  card.innerHTML = html;
}

/* ============================================================
   複製 Prompt 功能
============================================================ */
function _doCopy(text, btn) {
  /* 過濾掉 # 開頭的說明行 */
  const clean = text.split('\n').filter(l => !l.startsWith('#')).join('\n').trim();
  const payload = clean || text;

  const flash = () => {
    btn.textContent = '已複製！';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '複製'; btn.classList.remove('copied'); }, 2000);
  };

  navigator.clipboard.writeText(payload).then(flash).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = payload;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    flash();
  });
}

/* 單 prompt 步驟 */
function copyPrompt(index) {
  _doCopy(STEPS[index].prompt, document.getElementById(`copyBtn-${index}`));
}

/* 雙 prompts 步驟：subIndex = 0 或 1 */
function copyPromptByKey(index, subIndex) {
  _doCopy(STEPS[index].prompts[subIndex].text, document.getElementById(`copyBtn-${index}-${subIndex}`));
}

/* ============================================================
   驗收清單勾選功能（含 localStorage 持久化）
============================================================ */
function toggleCheck(stepIdx, itemIdx, checkbox) {
  const label = document.getElementById(`cl-${stepIdx}-${itemIdx}`);
  const key   = `step-${stepIdx}-item-${itemIdx}`;

  if (checkbox.checked) {
    label.classList.add('checked');
    localStorage.setItem(key, '1');
  } else {
    label.classList.remove('checked');
    localStorage.removeItem(key);
  }
}

/* ============================================================
   更新頁頭 UI（進度條、步驟計數器、點狀指示）
============================================================ */
function updateUI() {
  const pct = ((currentStep + 1) / TOTAL) * 100;
  document.getElementById('progressFill').style.width = pct + '%';

  document.getElementById('stepLabel').textContent = `步驟 ${currentStep + 1} / ${TOTAL}`;

  const dots = document.getElementById('stepDots');
  dots.innerHTML = '';
  for (let i = 0; i < TOTAL; i++) {
    const d = document.createElement('div');
    d.className = 'step-dot'
      + (i === currentStep ? ' active' : '')
      + (i < currentStep   ? ' done'   : '');
    d.title = `步驟 ${i + 1}`;
    d.onclick = () => goToStep(i);
    dots.appendChild(d);
  }

  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');

  btnPrev.disabled = (currentStep === 0);

  if (currentStep === TOTAL - 1) {
    btnNext.textContent = '✓';
    btnNext.classList.remove('nav-btn-next');
    btnNext.classList.add('nav-btn-finish');
    btnNext.disabled = false;
    btnNext.onclick = showFinish;
  } else {
    btnNext.textContent = '→';
    btnNext.classList.remove('nav-btn-finish');
    btnNext.classList.add('nav-btn-next');
    btnNext.onclick = () => navigate(1);
    btnNext.disabled = false;
  }
}

/* ============================================================
   翻頁動畫與導覽
============================================================ */
function navigate(dir) {
  const next = currentStep + dir;
  if (next < 0 || next >= TOTAL) return;
  goToStep(next, dir);
}

function goToStep(next, dir) {
  if (next === currentStep) return;
  if (dir === undefined) dir = next > currentStep ? 1 : -1;

  const card = document.getElementById('stepCard');

  card.classList.add(dir > 0 ? 'slide-out-left' : 'slide-out-right');

  setTimeout(() => {
    currentStep = next;
    renderStep(currentStep);
    updateUI();

    card.classList.remove('slide-out-left', 'slide-out-right');
    card.classList.add(dir > 0 ? 'slide-in-left' : 'slide-in-right');

    void card.offsetWidth;

    card.classList.remove('slide-in-left', 'slide-in-right');
  }, 250);
}

/* ============================================================
   完成畫面
============================================================ */
function showFinish() {
  document.getElementById('progressFill').style.width = '100%';

  if (document.getElementById('finishOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'finishOverlay';
  overlay.className = 'finish-overlay';
  overlay.innerHTML = `
    <div class="finish-modal">
      <div class="finish-check" onclick="launchConfetti()">🎉</div>
      <div class="finish-title">恭喜完成教學！</div>
      <div class="finish-desc">
        你已學會如何親手建立 Bob 的自訂 Mode 與 Skill，<br>
        包含設定角色、工具群組、Skill 腳本與依賴安裝。<br><br>
        現在打開 Bob，建立屬於你自己的 Mode 與 Skill！
      </div>
      <button class="restart-btn" onclick="restart()">↩ 重新開始教學</button>
    </div>`;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('show'));
  launchConfetti();
}

/* ============================================================
   彩帶動畫
============================================================ */
function launchConfetti() {
  const emojis = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🩷', '🩵', '💖', '💗', '💓', '💝'];
  const count  = 36;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'confetti-piece';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + 'vw';
    const size = 16 + Math.random() * 18;
    el.style.fontSize = size + 'px';
    const duration = 2.2 + Math.random() * 2.0;
    const delay    = Math.random() * 1.2;
    el.style.animationDuration = duration + 's';
    el.style.animationDelay   = delay + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function restart() {
  const overlay = document.getElementById('finishOverlay');
  if (overlay) overlay.remove();

  currentStep = 0;

  const btnNext = document.getElementById('btnNext');
  btnNext.textContent = '→';
  btnNext.classList.remove('nav-btn-finish');
  btnNext.classList.add('nav-btn-next');
  btnNext.onclick = () => navigate(1);

  renderStep(0);
  updateUI();
}

/* ============================================================
   HTML 跳脫輔助函式
============================================================ */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   鍵盤支援（← →）
============================================================ */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  navigate(-1);
  if (e.key === 'ArrowRight') {
    if (currentStep === TOTAL - 1) showFinish();
    else navigate(1);
  }
});

/* ============================================================
   初始化
============================================================ */
renderStep(0);
updateUI();
