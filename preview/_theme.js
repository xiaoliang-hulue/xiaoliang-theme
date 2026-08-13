/* _theme.js — 小亮主题预览页公共明暗切换
 * 用法：在 <head> 引入（异步即可），自动在页面右上角注入切换按钮。
 * 仅用于 preview/ 下的预览页，不属于主题产物（不入 package.json files）。
 * 与主题三种深色触发（[data-theme="dark"] / .dark / prefers-color-scheme）兼容：
 * 手动点击后写 data-theme 属性并覆盖系统偏好（:root:not([data-theme="light"]) 守卫）。
 */
(function () {
  'use strict';
  if (window.__xlPreviewTheme) return;
  window.__xlPreviewTheme = true;

  var SUN =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
  var MOON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>';

  var root = document.documentElement;

  // 注入样式（与 index.html 的 .theme-toggle 一致）
  var style = document.createElement('style');
  style.textContent =
    '#xl-theme-toggle{position:fixed;top:12px;right:12px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:6px 10px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);color:var(--color-text);font-family:var(--font-sans);font-size:var(--text-sm);cursor:pointer;transition:background .2s ease;box-shadow:0 1px 3px rgba(0,0,0,.12)}#xl-theme-toggle:hover{background:var(--color-surface-muted)}#xl-theme-toggle svg{flex-shrink:0}';
  (document.head || document.documentElement).appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'xl-theme-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', '切换明暗模式');
  btn.innerHTML = '<span class="xl-theme-icon">' + MOON + '</span><span class="xl-theme-label">切换深色</span>';
  document.body.appendChild(btn);

  var iconEl = btn.querySelector('.xl-theme-icon');
  var labelEl = btn.querySelector('.xl-theme-label');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(isDark) {
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    iconEl.innerHTML = isDark ? SUN : MOON;
    labelEl.textContent = isDark ? '切换浅色' : '切换深色';
    // 通知 preview 页面刷新依赖 getComputedStyle 的静态文本
    root.dispatchEvent(new CustomEvent('xl-theme-changed', {
      detail: { isDark: isDark, mode: isDark ? 'dark' : 'light' }
    }));
  }

  // 初始化：尊重页面已有的显式 data-theme（如手动写过 light/dark），
  // 没有时才跟随系统偏好；点击切换后以按钮状态为准
  var existing = root.getAttribute('data-theme');
  var currentDark =
    existing === 'dark' || existing === 'light' ? existing === 'dark' : mq.matches;
  applyTheme(currentDark);

  btn.addEventListener('click', function () {
    currentDark = !currentDark;
    applyTheme(currentDark);
  });

  mq.addEventListener('change', function (e) {
    currentDark = e.matches;
    applyTheme(currentDark);
  });
})();
