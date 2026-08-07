// theme.js — 小亮主题零依赖交互增强
// 仅提供交互组件所需的最小 JS：Modal / Drawer（ESC / 焦点陷阱 / 点击遮罩关闭 / 多层栈）、Toast（固定容器 / 自动消失 / 关闭）、Tabs（ARIA 标签切换 + 键盘导航）。
// 纯 CSS 组件（Button / Input / Card / Tag / Alert / Table / Tooltip / Dropdown / Pagination / Nav / Breadcrumb / Accordion / Progress / Avatar / Badge / Stepper）无需本文件。
// 全局命名空间：window.XL
(function () {
  'use strict';

  var ICONS = {
    success:
      '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error:
      '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:
      '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
  };

  function getFocusable(el) {
    return Array.prototype.slice
      .call(
        el.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (n) {
        return n.offsetParent !== null;
      });
  }

  /* ── Overlay 基座（Modal / Drawer 共用） ── */
  var OVERLAY_SELECTOR = '.modal-overlay:not([hidden]), .drawer-overlay:not([hidden])';
  var PANEL_SELECTOR = '.modal, .drawer';

  // 取最上层（DOM 顺序最后）的可见浮层，支持 Modal 与 Drawer 叠加
  function topOverlay() {
    var list = document.querySelectorAll(OVERLAY_SELECTOR);
    return list.length ? list[list.length - 1] : null;
  }

  // 允许传入元素或 CSS 选择器字符串
  function resolveOverlay(target) {
    if (!target) return null;
    return typeof target === 'string' ? document.querySelector(target) : target;
  }

  function openOverlay(target) {
    var overlay = resolveOverlay(target);
    if (!overlay) return;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var f = getFocusable(overlay);
    if (f[0]) f[0].focus();
    document.addEventListener('keydown', onKeydown, true);
    document.addEventListener('mousedown', onOutside, true);
  }

  function closeOverlay(target) {
    var overlay = resolveOverlay(target);
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    // 仅当没有其他浮层时才恢复滚动并卸载全局监听
    if (!topOverlay()) {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown, true);
      document.removeEventListener('mousedown', onOutside, true);
    }
    if (overlay._trigger && typeof overlay._trigger.focus === 'function') overlay._trigger.focus();
  }

  function onKeydown(e) {
    var overlay = topOverlay();
    if (!overlay) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeOverlay(overlay);
      return;
    }
    if (e.key === 'Tab') {
      var f = getFocusable(overlay);
      if (f.length === 0) return;
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // 点击遮罩（面板之外）关闭
  function onOutside(e) {
    var overlay = topOverlay();
    if (!overlay) return;
    var panel = overlay.querySelector(PANEL_SELECTOR);
    if (panel && !panel.contains(e.target)) closeOverlay(overlay);
  }

  /* ── Toast ── */
  function toastContainer() {
    var c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.className = 'toast-container';
      c.setAttribute('role', 'region');
      c.setAttribute('aria-live', 'polite');
      c.setAttribute('aria-label', '通知');
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(opts) {
    opts = opts || {};
    var type = opts.type || 'info';
    var el = document.createElement('div');
    el.className = 'toast ' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML =
      (ICONS[type] || ICONS.info) +
      '<div class="toast-content"><div class="toast-title"></div><div class="toast-message"></div></div>' +
      '<button class="toast-close" type="button" aria-label="关闭">' + ICONS.close + '</button>';
    el.querySelector('.toast-title').textContent = opts.title || '';
    el.querySelector('.toast-message').textContent = opts.message || '';
    el.querySelector('.toast-close').addEventListener('click', function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    toastContainer().appendChild(el);
    var duration = opts.duration == null ? 4000 : opts.duration;
    if (duration > 0) {
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, duration);
    }
    return el;
  }

  /* ── Tabs ── */
  function initTabs(root) {
    var tablist = root.querySelector('[role="tablist"]');
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function selectTab(tab, setFocus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      if (setFocus && typeof tab.focus === 'function') tab.focus();
    }

    tablist.addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (tab && tablist.contains(tab)) selectTab(tab, false);
    });

    tablist.addEventListener('keydown', function (e) {
      var idx = tabs.indexOf(document.activeElement);
      if (idx < 0) return;
      var next = -1;
      if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next >= 0) {
        e.preventDefault();
        selectTab(tabs[next], true);
      }
    });
  }

  function initAllTabs() {
    var roots = document.querySelectorAll('[data-tabs]');
    Array.prototype.forEach.call(roots, initTabs);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllTabs);
  } else {
    initAllTabs();
  }

  /* ── 事件委托：data-modal-open|close / data-drawer-open|close ── */
  document.addEventListener('click', function (e) {
    if (!e.target || typeof e.target.closest !== 'function') return;

    var opener = e.target.closest('[data-modal-open], [data-drawer-open]');
    if (opener) {
      var sel = opener.getAttribute('data-modal-open') || opener.getAttribute('data-drawer-open');
      var overlay = sel ? document.querySelector(sel) : null;
      if (overlay) {
        overlay._trigger = opener;
        openOverlay(overlay);
      }
      return;
    }

    var closer = e.target.closest('[data-modal-close], [data-drawer-close]');
    if (closer) {
      var host = closer.closest('.modal-overlay, .drawer-overlay');
      if (host) closeOverlay(host);
    }
  });

  window.XL = {
    // Modal / Drawer 共用同一套浮层实现，保留语义化别名
    openModal: openOverlay,
    closeModal: closeOverlay,
    openDrawer: openOverlay,
    closeDrawer: closeOverlay,
    showToast: showToast,
    initTabs: initTabs
  };
})();
