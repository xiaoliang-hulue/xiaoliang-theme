/* ============================================================================
 * icon-animations.js —— 动画图标的极薄运行时（配合 icon-animations.css）
 *
 * 定位：动画规格由 build-icon-animations.mjs 从 lucide-animated 提取并翻译成
 * CSS keyframes，**动画本身完全由 CSS 驱动**。本文件只做两件 CSS 做不到的事：
 *
 *   1. 按 data-anim 的图标名构建 Lucide SVG（多子路径整体替换）
 *   2. 给每个描边元素加 pathLength="1"
 *
 * 为什么需要 pathLength：CSS 的 stroke-dasharray / stroke-dashoffset 用的是
 * 「用户单位长度」，而每个图标的路径周长各不相同。SVG 的 pathLength 属性能把
 * 周长归一化成 1，于是同一套 keyframes 对所有图标都成立，不必逐个算周长。
 *
 * 无障碍：动画完全交给 CSS，`prefers-reduced-motion: reduce` 由主题全局兜底
 * （animation-duration 归零），本文件不参与、也无法绕过。
 * ========================================================================== */
(function () {
  'use strict';

  var LUCIDE = typeof window !== 'undefined' ? window.lucide : null;
  var SVGNS = 'http://www.w3.org/2000/svg';
  /* 需要归一化周长的描边元素：path/line/circle/rect/polyline/polygon/ellipse */
  var STROKE = { path: 1, line: 1, circle: 1, rect: 1, polyline: 1, polygon: 1, ellipse: 1 };

  function warn(message) {
    if (window.console && window.console.warn) window.console.warn('[XLAnim] ' + message);
  }

  function mount(el) {
    if (el.__xlAnim) return el.__xlAnim;
    var name = el.getAttribute('data-anim');
    var node = name && LUCIDE && LUCIDE[name];
    if (!node) {
      warn('data-anim="' + (name || '') + '" 不是有效的 Lucide 图标名，已跳过。');
      return false;
    }

    /* 交给 Lucide 运行时构建，源码里不出现任何 <path d>（守住图标审计纪律）。 */
    var svg = LUCIDE.createElement(node);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    Array.prototype.forEach.call(svg.children, function (child) {
      if (STROKE[child.tagName]) child.setAttribute('pathLength', '1');
    });
    el.appendChild(svg);

    el.__xlAnim = {
      el: el,
      name: name,
      /* 主动播放一次：加 .is-playing，动画结束后移除以便再次触发 */
      play: function () {
        el.classList.remove('is-playing');
        /* 强制重排，使连续两次 play() 也能重新播放 */
        void el.offsetWidth;
        el.classList.add('is-playing');
      }
    };
    return el.__xlAnim;
  }

  function init(root) {
    if (!LUCIDE) {
      warn('缺少 assets/icons/lucide.min.js，XLAnim.init 已跳过。');
      return 0;
    }
    var scope = root || document;
    var nodes = scope.querySelectorAll('[data-anim]');
    var count = 0;
    Array.prototype.forEach.call(nodes, function (el) {
      if (mount(el)) count++;
    });
    return count;
  }

  function play(el) {
    var record = el && el.__xlAnim;
    if (!record) {
      warn('XLAnim.play 需要已挂载的动画图标（data-anim）。');
      return false;
    }
    record.play();
    return true;
  }

  window.XLAnim = { init: init, play: play };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})();