/*
 * 小亮主题 — 自定义下拉组件 (Custom Select)
 *
 * 完全替代原生 <select>，弹层用 CSS 变量主题化（圆角/阴影/配色/暗色同步可控），
 * 不依赖任何第三方库。具备完整键盘无障碍（WAI-ARIA combobox + listbox 模式）。
 *
 * 标记约定：
 *   <div class="select-wrap">
 *     <button type="button" class="select select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="sel-1">
 *       <span class="select-value">请选择</span>
 *       [caret: Lucide chevron-down SVG]
 *     </button>
 *     <ul id="sel-1" class="select-list" role="listbox" hidden>
 *       <li class="select-option" role="option" data-value="a" aria-selected="false">选项 A</li>
 *       <li class="select-option is-disabled" role="option" aria-disabled="true" data-value="">占位</li>
 *     </ul>
 *   </div>
 *
 * 行为：点击/键盘打开，点击外部或 Esc 关闭；上下键移动、Enter/Space 选择、Home/End 跳首尾；
 * 选中后触发 trigger 上的 'select:change' 事件（detail = {value,label}），并同步 value 到同容器内隐藏 input。
 */
(function () {
  'use strict';

  function ensureId(el, prefix) {
    if (!el.id) el.id = prefix + '-' + Math.random().toString(36).slice(2, 8);
    return el.id;
  }

  function init(wrap) {
    var trigger = wrap.querySelector('.select-trigger');
    var list = wrap.querySelector('.select-list');
    if (!trigger || !list || wrap.__xlSelectReady) return;
    wrap.__xlSelectReady = true;

    var valueEl = trigger.querySelector('.select-value');
    var options = Array.prototype.slice.call(list.querySelectorAll('.select-option'));
    var listId = ensureId(list, 'xls');
    var activeIndex = -1;
    var open = false;

    trigger.setAttribute('aria-haspopup', 'listbox');
    list.setAttribute('role', 'listbox');
    trigger.setAttribute('aria-controls', listId);

    // 选项唯一 id（供 aria-activedescendant）
    options.forEach(function (opt, i) {
      opt.setAttribute('role', 'option');
      ensureId(opt, listId + '-o');
      if (opt.getAttribute('aria-selected') === 'true') {
        if (valueEl) valueEl.textContent = opt.textContent.trim();
      }
    });

    function enabledOptions() {
      return options.filter(function (o) {
        return !o.hasAttribute('aria-disabled') && !o.classList.contains('is-disabled');
      });
    }

    function setActive(opt) {
      options.forEach(function (o) {
        o.classList.remove('is-active');
        o.removeAttribute('aria-selected-temp');
      });
      if (!opt) { list.removeAttribute('aria-activedescendant'); activeIndex = -1; return; }
      opt.classList.add('is-active');
      list.setAttribute('aria-activedescendant', opt.id);
      activeIndex = options.indexOf(opt);
      // 滚动可见
      if (opt.scrollIntoView) opt.scrollIntoView({ block: 'nearest' });
    }

    function openMenu() {
      if (trigger.disabled) return;
      open = true;
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      wrap.classList.add('is-open');
      var sel = list.querySelector('.select-option[aria-selected="true"]:not([aria-disabled="true"])');
      var firstEnabled = enabledOptions()[0];
      setActive(sel || firstEnabled || options[0]);
    }

    function closeMenu(focusTrigger) {
      open = false;
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      wrap.classList.remove('is-open');
      setActive(null);
      if (focusTrigger !== false) trigger.focus();
    }

    function select(opt) {
      if (!opt || opt.hasAttribute('aria-disabled') || opt.classList.contains('is-disabled')) return;
      options.forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
      opt.setAttribute('aria-selected', 'true');
      if (valueEl) valueEl.textContent = opt.textContent.trim();
      trigger.dataset.value = opt.getAttribute('data-value') || '';
      // 同步隐藏 input（用于真实表单提交）
      var hidden = wrap.querySelector('input[type="hidden"]');
      if (hidden) hidden.value = trigger.dataset.value;
      // 派发事件
      var evt = new CustomEvent('select:change', {
        bubbles: true,
        detail: { value: trigger.dataset.value, label: opt.textContent.trim() }
      });
      trigger.dispatchEvent(evt);
      closeMenu();
    }

    function move(delta) {
      var en = enabledOptions();
      if (!en.length) return;
      var cur = en.indexOf(options[activeIndex]);
      if (cur < 0) cur = 0;
      var next = (cur + delta + en.length) % en.length;
      setActive(en[next]);
    }

    trigger.addEventListener('click', function () {
      if (open) closeMenu(false); else openMenu();
    });

    trigger.addEventListener('keydown', function (e) {
      if (trigger.disabled) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!open) openMenu(); else move(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!open) openMenu(); else move(-1);
          break;
        case 'Home':
          if (open) { e.preventDefault(); setActive(enabledOptions()[0]); }
          break;
        case 'End':
          if (open) { e.preventDefault(); var en = enabledOptions(); setActive(en[en.length - 1]); }
          break;
        case 'Enter':
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          if (!open) openMenu();
          else if (activeIndex >= 0) select(options[activeIndex]);
          break;
        case 'Escape':
          if (open) { e.preventDefault(); closeMenu(); }
          break;
        default:
          // 简单首字母快速定位
          if (open && e.key.length === 1 && /\S/.test(e.key)) {
            var hit = en = enabledOptions().find(function (o) {
              return o.textContent.trim().charAt(0).toLowerCase() === e.key.toLowerCase();
            });
            if (hit) setActive(hit);
          }
      }
    });

    list.addEventListener('click', function (e) {
      var opt = e.target.closest('.select-option');
      if (opt) select(opt);
    });

    // 点击外部关闭
    document.addEventListener('click', function (e) {
      if (open && !wrap.contains(e.target)) closeMenu(false);
    });
  }

  function boot() {
    var wraps = document.querySelectorAll('.select-wrap');
    for (var i = 0; i < wraps.length; i++) init(wraps[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 暴露手动初始化（供动态插入内容后调用）
  window.XLSelect = { initAll: boot, init: function (el) { init(el); } };
})();
