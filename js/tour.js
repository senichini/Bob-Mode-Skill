/* ============================================================
   tour.js — Onboarding Tour Engine
   依賴：TOUR_STEPS（js/tour-steps.js 必須先載入）
============================================================ */

/* ── 狀態變數 ── */
let tourActive = false;   /* 導覽是否正在執行 */
let tourIndex  = 0;       /* 目前顯示第幾步（0-based） */

/* 儲存用的 localStorage 金鑰 */
const TOUR_SEEN_KEY = 'tour_seen_v1';

/* ── 取得目標 DOM 元素 ── */
function tourGetTarget(step) {
  return document.querySelector(`[data-tour-step="${step.target}"]`);
}

/* ── 計算 Spotlight 鏤空位置
   原理：將 box-shadow 的 inset 設定為目標元素的 getBoundingClientRect，
   使 box-shadow 的邊界恰好夾住目標元素，形成鏤空效果。
── */
function tourUpdateSpotlight(el) {
  const overlay = document.getElementById('tourOverlay');
  if (!overlay || !el) return;

  const PAD = 8;   /* spotlight 周圍留白（px） */
  const r   = el.getBoundingClientRect();
  const top    = r.top    - PAD;
  const left   = r.left   - PAD;
  const bottom = r.bottom + PAD;
  const right  = r.right  + PAD;
  const w      = right  - left;
  const h      = bottom - top;

  /* 使 overlay 的尺寸與位置剛好等於 spotlight 鏤空區域 */
  overlay.style.top    = top    + 'px';
  overlay.style.left   = left   + 'px';
  overlay.style.width  = w      + 'px';
  overlay.style.height = h      + 'px';
}

/* ── 計算 Tooltip 的最佳顯示位置（RWD 邊界自適應） ── */
function tourPositionTooltip(tooltip, el) {
  const MARGIN   = 12;   /* tooltip 與目標元素的間距 */
  const TT_W     = tooltip.offsetWidth  || 320;
  const TT_H     = tooltip.offsetHeight || 160;
  const VW       = window.innerWidth;
  const VH       = window.innerHeight;
  const r        = el.getBoundingClientRect();

  let top, left;
  let arrowClass = '';

  const fitsBelow = r.bottom + MARGIN + TT_H <= VH - MARGIN;
  const fitsAbove = r.top    - MARGIN - TT_H >= MARGIN;
  const fitsLeft  = r.left   - MARGIN - TT_W >= MARGIN;
  const fitsRight = r.right  + MARGIN + TT_W <= VW - MARGIN;
  /* 上下排列時，tooltip 左緣對齊目標左緣；若超出右邊緣則水平夾持 */
  const hAlignOk  = r.left + TT_W <= VW - MARGIN;

  /* 優先順序：下（可水平對齊）→ 上（可水平對齊）→ 左 → 右 → 中央懸浮 */
  let arrowOffset = null;   /* 左右排列時箭頭的垂直偏移（相對 tooltip 頂部） */

  if (fitsBelow && hAlignOk) {
    top        = r.bottom + MARGIN;
    left       = r.left;
    arrowClass = 'arrow-top';
  } else if (fitsAbove && hAlignOk) {
    top        = r.top - MARGIN - TT_H;
    left       = r.left;
    arrowClass = 'arrow-bottom';
  } else if (fitsLeft) {
    left        = r.left - MARGIN - TT_W;
    top         = r.top + (r.height - TT_H) / 2;   /* 垂直置中對齊目標 */
    arrowClass  = 'arrow-right';
    arrowOffset = r.top + r.height / 2;             /* 目標元素垂直中心（viewport 座標） */
  } else if (fitsRight) {
    left        = r.right + MARGIN;
    top         = r.top + (r.height - TT_H) / 2;
    arrowClass  = 'arrow-left';
    arrowOffset = r.top + r.height / 2;
  } else {
    /* 視窗中央懸浮 */
    top        = (VH - TT_H) / 2;
    left       = (VW - TT_W) / 2;
    arrowClass = '';
  }

  /* 水平邊界保護 */
  if (left + TT_W > VW - MARGIN) left = VW - TT_W - MARGIN;
  if (left < MARGIN) left = MARGIN;

  /* 垂直邊界保護 */
  if (top + TT_H > VH - MARGIN) top = VH - TT_H - MARGIN;
  if (top < MARGIN) top = MARGIN;

  tooltip.style.top  = top  + 'px';
  tooltip.style.left = left + 'px';

  /* 箭頭垂直對齊：左右排列時讓箭頭指向目標元素中心 */
  if (arrowOffset !== null) {
    const offset = Math.round(arrowOffset - top - 6);   /* -6 補償箭頭半高 */
    tooltip.style.setProperty('--arrow-offset', Math.max(8, offset) + 'px');
  } else {
    tooltip.style.removeProperty('--arrow-offset');
  }

  /* 更新箭頭方向 class */
  tooltip.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');
  if (arrowClass) tooltip.classList.add(arrowClass);
}

/* ── 渲染 Tooltip 內容 ── */
function tourRenderTooltip() {
  const step    = TOUR_STEPS[tourIndex];
  const total   = TOUR_STEPS.length;
  const tooltip = document.getElementById('tourTooltip');
  if (!tooltip) return;

  tooltip.innerHTML = `
    <div class="tour-tt-header">
      <div class="tour-tt-title">${step.title}</div>
      <div class="tour-tt-progress">${tourIndex + 1} / ${total}</div>
    </div>
    <div class="tour-tt-body">${step.body}</div>
    <div class="tour-tt-actions">
      <button class="tour-btn tour-btn-prev" id="tourBtnPrev" ${tourIndex === 0 ? 'disabled' : ''}>← 上一步</button>
      <button class="tour-btn tour-btn-next" id="tourBtnNext">
        ${tourIndex === total - 1 ? '完成 ✓' : '下一步 →'}
      </button>
    </div>`;

  /* 綁定按鈕事件 */
  document.getElementById('tourBtnPrev').onclick = () => tourGo(tourIndex - 1);
  document.getElementById('tourBtnNext').onclick = () => {
    if (tourIndex === total - 1) tourEnd();
    else tourGo(tourIndex + 1);
  };

  /* 重設動畫（每次重新渲染都播放入場效果）
     注意：不碰 style.animation 以外的 inline style，
     避免覆蓋 tourGo 設置的 top/left/visibility */
  tooltip.classList.add('tour-tt-reflow');
  void tooltip.offsetWidth;
  tooltip.classList.remove('tour-tt-reflow');
}

/* ── 跳轉到指定步驟 ── */
function tourGo(idx) {
  if (idx < 0 || idx >= TOUR_STEPS.length) return;

  /* 移除舊目標元素的 spotlight class */
  const prevTarget = tourGetTarget(TOUR_STEPS[tourIndex]);
  if (prevTarget) prevTarget.classList.remove('tour-spotlight-target');

  tourIndex = idx;
  const step = TOUR_STEPS[tourIndex];
  const el   = tourGetTarget(step);

  /* 先渲染 tooltip 內容（此時尚未定位，隱藏在畫面外避免閃爍） */
  const tooltip = document.getElementById('tourTooltip');
  if (tooltip) tooltip.style.visibility = 'hidden';
  tourRenderTooltip();

  if (el) {
    /* fixed 元素不需要捲動；非 fixed 元素才執行 scrollIntoView */
    const elPos = window.getComputedStyle(el).position;
    if (elPos !== 'fixed') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    el.classList.add('tour-spotlight-target');
    /* 等 DOM 佈局完成後，再計算並套用位置 */
    setTimeout(() => {
      const tt = document.getElementById('tourTooltip');
      if (!tt) return;
      /* 先移到畫面外讓瀏覽器 reflow，確保 offsetHeight 量到真實高度 */
      tt.style.top  = '-9999px';
      tt.style.left = '0px';
      void tt.offsetHeight;   /* 強制 reflow */
      tourUpdateSpotlight(el);
      tourPositionTooltip(tt, el);
      tt.style.visibility = '';   /* 定位完成才顯示 */
    }, 120);
  } else {
    /* 無目標元素時直接顯示（置中懸浮） */
    if (tooltip) tooltip.style.visibility = '';
  }
}

/* ── 啟動導覽 ── */
function tourStart(forceRestart) {
  /* 強制重啟時先清理現有狀態，避免 tourActive 保護卡死 */
  if (forceRestart && tourActive) {
    tourEnd();
  }

  if (tourActive) return;

  /* 若不是強制重啟，且已看過，則跳過 */
  if (!forceRestart && localStorage.getItem(TOUR_SEEN_KEY)) return;

  tourActive = true;
  tourIndex  = 0;

  /* 同步 Toggle 狀態 */
  syncTourToggle(true);

  /* 建立遮罩底層（backdrop，負責接收點擊以關閉） */
  const backdrop = document.createElement('div');
  backdrop.id = 'tourBackdrop';
  backdrop.className = 'tour-backdrop';
  document.body.appendChild(backdrop);

  /* 建立 spotlight overlay（box-shadow 打暗效果） */
  const overlay = document.createElement('div');
  overlay.id = 'tourOverlay';
  overlay.className = 'tour-overlay';
  document.body.appendChild(overlay);

  /* 建立 tooltip 說明框 */
  const tooltip = document.createElement('div');
  tooltip.id = 'tourTooltip';
  tooltip.className = 'tour-tooltip';
  document.body.appendChild(tooltip);

  /* 顯示第一步 */
  tourGo(0);

  /* 監聽視窗 resize，動態更新 spotlight 與 tooltip 位置 */
  window._tourResizeHandler = () => {
    const el = tourGetTarget(TOUR_STEPS[tourIndex]);
    if (el) {
      tourUpdateSpotlight(el);
      tourPositionTooltip(document.getElementById('tourTooltip'), el);
    }
  };
  window.addEventListener('resize', window._tourResizeHandler);
}

/* ── 結束導覽 ── */
function tourEnd() {
  if (!tourActive) return;
  tourActive = false;

  /* 移除 spotlight 目標 class */
  const currentTarget = tourGetTarget(TOUR_STEPS[tourIndex]);
  if (currentTarget) currentTarget.classList.remove('tour-spotlight-target');

  /* 移除所有導覽 DOM 元素 */
  ['tourBackdrop', 'tourOverlay', 'tourTooltip'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  /* 移除 resize 監聽 */
  if (window._tourResizeHandler) {
    window.removeEventListener('resize', window._tourResizeHandler);
    delete window._tourResizeHandler;
  }

  /* 記錄「已看過」並同步 Toggle 回關閉狀態 */
  localStorage.setItem(TOUR_SEEN_KEY, '1');
  syncTourToggle(false);
}

/* ── 同步 Toggle 開關的視覺狀態 ──
   直接設 input.checked 不會觸發 onchange（onchange 僅在使用者互動時觸發），
   所以不需要額外防護。
── */
function syncTourToggle(isOn) {
  const input = document.getElementById('tourToggleInput');
  const label = document.getElementById('tourToggleLabel');
  if (!input || !label) return;

  input.checked = isOn;
  label.textContent = isOn ? '關閉導覽' : '開啟導覽';
  label.classList.toggle('active', isOn);
}

/* ── Toggle 開關切換時的處理函式（由 HTML onchange 呼叫） ── */
function onTourToggleChange(checked) {
  if (checked) {
    /* 無論 localStorage 記錄，強制重啟導覽 */
    tourStart(/* forceRestart = */ true);
  } else {
    tourEnd();
  }
}

/* ── 頁面初次載入時：若未看過則自動啟動 ── */
window.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem(TOUR_SEEN_KEY)) {
    /* 略延 600ms 等頁面完全渲染後再啟動，避免元素位置計算不準 */
    setTimeout(() => tourStart(false), 600);
  }
});
