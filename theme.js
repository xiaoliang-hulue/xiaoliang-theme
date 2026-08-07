// theme.js — 小亮主题零依赖交互增强
// 仅提供交互组件所需的最小 JS：Modal（ESC / 焦点陷阱 / 点击外部关闭）、Toast（固定容器 / 自动消失 / 关闭）。
// 纯 CSS 组件（Button / Input / Card / Tag / Alert / Table / Tooltip / Dropdown / Pagination / Nav）无需本文件。
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

  /* ── Modal ── */
  function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var f = getFocusable(modal);
    (f[0] || modal).focus();
    document.addEventListener('keydown', onKeydown, true);
    document.addEventListener('mousedown', onOutside, true);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown, true);
    document.removeEventListener('mousedown', onOutside, true);
    if (modal._trigger && typeof modal._trigger.focus === 'function') modal._trigger.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      var m = document.querySelector('.modal-overlay:not([hidden])');
      if (m) closeModal(m);
      return;
    }
    if (e.key === 'Tab') {
      var modal = document.querySelector('.modal-overlay:not([hidden])');
      if (!modal) return;
      var f = getFocusable(modal);
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

  function onOutside(e) {
    var modal = document.querySelector('.modal-overlay:not([hidden])');
    if (modal && !modal.contains(e.target)) closeModal(modal);
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

  /* ── 事件委托：data-modal-open / data-modal-close ── */
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-modal-open]');
    if (opener) {
      var sel = opener.getAttribute('data-modal-open');
      var modal = document.querySelector(sel);
      if (modal) {
        modal._trigger = opener;
        openModal(modal);
      }
      return;
    }
    var closer = e.target.closest('[data-modal-close]');
    if (closer) {
      var overlay = closer.closest('.modal-overlay');
      if (overlay) closeModal(overlay);
    }
  });

  window.XL = {
    openModal: openModal,
    closeModal: closeModal,
    showToast: showToast
  };
})();
