/* morph-icons.js — 小亮主题 · 图标形变适配器
 * ─────────────────────────────────────────────────────────────
 * 让两个 Lucide 图标之间做路径形变（morph），介于「静态图标」与「Lottie 动画图标」之间。
 * 图标源仍只有 assets/icons/lucide.min.js（v1.8.0），不新增任何图标文件。
 *
 * 依赖（按顺序引入）：
 *   <script src="assets/icons/lucide.min.js"></script>
 *   <script src="assets/icons/morph.min.js"></script>
 *   <script src="assets/morph-icons.js"></script>
 *
 * 用法：
 *   <i class="morph-icon" data-morph-icon="menu-x"></i>
 *   <button class="morph-icon" data-morph-icon="bell-bell-off" aria-label="关闭通知"></button>
 *
 * 属性：
 *   data-morph-icon    必填，白名单键（见下方 PAIRS）
 *   data-morph-trigger click（默认）| hover | view | state
 *   data-morph-speed   fast | base（默认）| slow | emphasis
 *   data-morph-label   可访问名；不传则整块按装饰处理（aria-hidden）
 *
 * 暴露：window.XLMorph = { init, refresh, to, pairs, version }
 * ─────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var ENGINE = typeof window !== 'undefined' ? window.MorphIcons : null;
  var LUCIDE = typeof window !== 'undefined' ? window.lucide : null;
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* 策展白名单 — 严禁在此表之外开放任意配对。
   * 每对都经过「批量关键帧 + 塌陷指标 + 人眼复核」，判定流程见 docs/icon-morph.md。 */
  var PAIRS = {
    'menu-x': { from: 'Menu', to: 'X' },                          /* 移动端抽屉 / 菜单开关 */
    'plus-minus': { from: 'Plus', to: 'Minus' },                  /* 折叠面板 / 展开更多 */
    'play-pause': { from: 'Play', to: 'Pause' },                  /* 媒体播放 */
    'lock-unlock': { from: 'Lock', to: 'Unlock' },                /* 表单锁定 / 只读 */
    'eye-eye-off': { from: 'Eye', to: 'EyeOff' },                 /* 密码可见性 */
    'bell-bell-off': { from: 'Bell', to: 'BellOff' },             /* 通知订阅 */
    'volume-volume-x': { from: 'Volume2', to: 'VolumeX' },        /* 静音切换 */
    'download-upload': { from: 'Download', to: 'Upload' },        /* 上传 / 下载方向 */
    'maximize-minimize': { from: 'Maximize2', to: 'Minimize2' },  /* 全屏切换 */
    'smile-frown': { from: 'Smile', to: 'Frown' },                /* 评分 / 反馈 */
    'star-heart': { from: 'Star', to: 'Heart' },                  /* 收藏 / 喜欢 */
    'square-circle': { from: 'Square', to: 'Circle' },            /* 形状选择器 */
    'rotate-ccw-cw': { from: 'RotateCcw', to: 'RotateCw' },       /* 撤销 / 重做 */
    'folder-folder-open': { from: 'Folder', to: 'FolderOpen' },   /* 目录展开 */
    'panel-left-right': { from: 'PanelLeft', to: 'PanelRight' },  /* 布局方向 */
    'toggle-left-right': { from: 'ToggleLeft', to: 'ToggleRight' }, /* 开关方向 */
    'check-alert': { from: 'CircleCheck', to: 'AlertCircle' },    /* 校验状态 */
    'copy-check': { from: 'Copy', to: 'Check' },                   /* 复制 / 已复制（C 档经人眼复核后开放） */
    'trending-up-down': { from: 'TrendingUp', to: 'TrendingDown' }, /* 指标升降 */
    'mic-mic-off': { from: 'Mic', to: 'MicOff' },                 /* 麦克风 */
    'wifi-wifi-off': { from: 'Wifi', to: 'WifiOff' },             /* 网络状态 */
    'user-users': { from: 'User', to: 'Users' },                  /* 成员视图 */
    'arrow-right-left': { from: 'ArrowRight', to: 'ArrowLeft' }   /* 前进 / 后退 */
  };

  /* spring 参数 → 主题 motion token（按 90% 时刻标定，见 docs/icon-morph.md）
   * 刻意不提供 bouncy：过冲后长时间振荡，不适合图标形变。 */
  var SPRINGS = {
    fast: { stiffness: 420, damping: 30 },      /* → duration-fast / duration-base（180ms） */
    base: { stiffness: 420, damping: 30 },      /* → duration-base（180ms） */
    slow: { stiffness: 300, damping: 30 },      /* → duration-slow（280ms） */
    emphasis: { stiffness: 170, damping: 26 }   /* → duration-emphasis（420ms） */
  };

  var instances = [];
  var swapInstances = [];
  /* 最近一次 init 的挂载数，供测试与调试查看（形变数 / 换图标数） */
  var lastCounts = { morph: 0, swap: 0 };

  function warn(message) {
    if (window.console && window.console.warn) window.console.warn('[XLMorph] ' + message);
  }

  /* 依赖缺失诊断：必须区分「引擎」与「Lucide」——两者都缺失时只报「引擎未加载」
     会把排查方向带偏（§4.2：本次就因缺 Lucide 而被误导过一次）。 */
  function depsHint() {
    var missing = [];
    if (!ENGINE) missing.push('assets/icons/morph.min.js（形变引擎）');
    if (!LUCIDE) missing.push('assets/icons/lucide.min.js（Lucide 图标数据）');
    return '缺少 ' + missing.join(' 与 ') + '。';
  }

  /* 无障碍与动效契约：data-motion="off" 直接禁用补间；
   * 其余情况交给 "user"（库默认值 "never" 会忽略系统偏好，必须显式覆盖）。 */
  function motionMode() {
    var root = document.documentElement;
    return root && root.getAttribute('data-motion') === 'off' ? 'always' : 'user';
  }

  function isNativeButton(el) {
    return el.tagName === 'BUTTON' || el.tagName === 'A' && el.hasAttribute('href');
  }

  /* 交互宿主若不是原生按钮，补 role/tabindex，并绑定 Enter / Space */
  function makeInteractive(el, onActivate) {
    if (!isNativeButton(el)) {
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    }
    el.addEventListener('click', function (event) {
      event.preventDefault();
      onActivate();
    });
    el.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        onActivate();
      }
    });
  }

  function applyA11y(el, options) {
    var label = el.getAttribute('data-morph-label');
    if (label) {
      el.setAttribute('aria-label', label);
      if (!isNativeButton(el) && !el.hasAttribute('role')) el.setAttribute('role', 'img');
      return;
    }
    /* 作者若已在 HTML 里写好 aria-label / 可见文本，就不要覆盖，也不必警告 */
    var named = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') ||
      (el.textContent || '').trim().length > 0;
    if (options.interactive) {
      if (!named) warn('交互式形变图标缺少可访问名（aria-label 或 data-morph-label）：' + (el.getAttribute('data-morph-icon') || '?'));
      return;
    }
    /* 纯装饰：整块对 AT 隐藏，避免读出一个没有语义的图形 */
    if (!isNativeButton(el) && !named) el.setAttribute('aria-hidden', 'true');
  }

  function mount(el) {
    if (el.__xlMorph) return el.__xlMorph;

    var key = el.getAttribute('data-morph-icon');
    var pair = PAIRS[key];
    if (!pair) {
      warn('未知的形变配对「' + key + '」。仅支持白名单内的配对，见 docs/icon-morph.md。');
      return null;
    }
    if (!ENGINE || !LUCIDE) {
      warn(depsHint() + '已跳过「' + key + '」。');
      return null;
    }
    var fromIcon = LUCIDE[pair.from];
    var toIcon = LUCIDE[pair.to];
    if (!fromIcon || !toIcon) {
      warn('Lucide 中找不到「' + pair.from + '」或「' + pair.to + '」。');
      return null;
    }

    var trigger = el.getAttribute('data-morph-trigger') || 'click';
    var speed = el.getAttribute('data-morph-speed') || 'base';
    var spring = SPRINGS[speed] || SPRINGS.base;
    var interactive = trigger === 'click' || trigger === 'state';

    /* SVG 由运行时创建：源码中不留任何 <path d>，因此不参与图标审计的几何签名比对，
     * 也从根本上杜绝「内联路径 / data-lucide 二选一」的冲突（见 SKILL.md）。 */
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = document.createElementNS(SVGNS, 'path');
    svg.appendChild(path);
    el.appendChild(svg);

    var morph = ENGINE.createMorph(path, fromIcon, { reducedMotion: motionMode() });

    var record = {
      el: el,
      key: key,
      morph: morph,
      spring: spring,
      trigger: trigger,
      fromIcon: fromIcon,
      toIcon: toIcon,
      showing: 'from',
      observer: null
    };

    function go(target) {
      morph.morphTo(target === 'to' ? toIcon : fromIcon, spring);
      record.showing = target;
    }

    if (trigger === 'hover') {
      el.addEventListener('pointerenter', function () { go('to'); });
      el.addEventListener('pointerleave', function () { go('from'); });
      /* 键盘焦点与 hover 等价，避免只有鼠标用户能看到状态 */
      el.addEventListener('focusin', function () { go('to'); });
      el.addEventListener('focusout', function () { go('from'); });
    } else if (trigger === 'view') {
      if (typeof IntersectionObserver === 'function') {
        record.observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              go('to');
              record.observer.disconnect();
              record.observer = null;
            }
          });
        }, { threshold: 0.5 });
        record.observer.observe(el);
      } else {
        go('to');
      }
    } else if (trigger === 'state') {
      /* 与 aria-pressed 双向绑定：外部改属性跟着动，点击也回写属性 */
      var syncFromPressed = function () {
        go(el.getAttribute('aria-pressed') === 'true' ? 'to' : 'from');
      };
      if (!el.hasAttribute('aria-pressed')) el.setAttribute('aria-pressed', 'false');
      makeInteractive(el, function () {
        el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      });
      new MutationObserver(syncFromPressed).observe(el, { attributes: true, attributeFilter: ['aria-pressed'] });
      syncFromPressed();
    } else {
      makeInteractive(el, function () { go(record.showing === 'from' ? 'to' : 'from'); });
    }

    applyA11y(el, { interactive: interactive });

    el.__xlMorph = record;
    instances.push(record);
    return record;
  }

  /* data-motion 切换时同步所有实例（无需重载页面） */
  function watchMotion() {
    if (document.documentElement.__xlMorphMotionWatch) return;
    document.documentElement.__xlMorphMotionWatch = true;
    new MutationObserver(function () {
      var mode = motionMode();
      instances.forEach(function (record) { record.morph.reducedMotion = mode; });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  }

  /* ===== 换图标过渡（Icon Swap） =====
   * 与形变互补：形变是「同一轮廓改变形状」，换图标是「两个不同图标之间过渡」。
   * 交叉淡化不做子路径插值，因此**不需要白名单**——任意 Lucide 图标名均可配对
   * （形变必须策展是因为中间态会塌陷，换图标没有这个风险）。
   * 之所以放在本文件而非另起一个运行时：Lucide 取用、触发器、无障碍、
   * data-motion 接线全部共用，省掉一整套重复基建。 */

  /* 时长直接读主题 motion token，保持 Token 单一真值 */
  var SWAP_SPEED_TOKEN = {
    fast: '--motion-duration-fast',
    base: '--motion-duration-base',
    slow: '--motion-duration-slow'
  };

  function swapDuration(el) {
    var speed = el.getAttribute('data-swap-speed') || 'base';
    var token = SWAP_SPEED_TOKEN[speed] || SWAP_SPEED_TOKEN.base;
    var n = parseFloat(window.getComputedStyle(el).getPropertyValue(token));
    return isNaN(n) ? 180 : n;
  }

  /* 与引擎的 motionMode() 同源：data-motion="off" 或系统 reduce 时立即跳变 */
  function swapReduced() {
    if (document.documentElement.getAttribute('data-motion') === 'off') return true;
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function mountSwap(el) {
    if (el.__xlSwap) return true;
    var names = (el.getAttribute('data-icon-swap') || '').split('|');
    if (names.length !== 2 || !LUCIDE[names[0]] || !LUCIDE[names[1]]) {
      warn('data-icon-swap 需要「图标A|图标B」两个有效的 Lucide 图标名，已跳过。');
      return false;
    }

    var trigger = el.getAttribute('data-swap-trigger') || 'click';
    var style = el.getAttribute('data-swap-style') || 'fade';
    var interactive = trigger === 'click' || trigger === 'state';
    var showing = 0;

    function build(name) {
      /* 交给 Lucide 运行时构建，源码里不出现任何 <path d>（见 SKILL.md 图标纪律
       * 第 6 条）；createElement 自带 Lucide 默认属性与 viewBox。 */
      var node = LUCIDE.createElement(LUCIDE[name]);
      node.setAttribute('aria-hidden', 'true');
      node.setAttribute('focusable', 'false');
      return node;
    }

    el.classList.add('icon-swap');
    if (style !== 'fade') el.classList.add('is-' + style);
    var current = build(names[0]);
    el.appendChild(current);

    function show(idx, animate) {
      if (idx === showing) return;
      showing = idx;
      var next = build(names[idx]);
      /* reduced-motion 判定放在这里而不是各调用点：触发器与编程式 API 一次覆盖，
       * 避免「点击仍播过渡」这类漏判（曾由测试 swap: reduce 用例抓到）。 */
      if (!animate || swapReduced()) {
        el.replaceChild(next, current);
        current = next;
        return;
      }
      var dur = swapDuration(el);
      el.style.setProperty('--swap-dur', dur + 'ms');
      el.classList.add('is-out');
      window.setTimeout(function () {
        el.classList.remove('is-out');
        el.replaceChild(next, current);
        current = next;
        el.classList.add('is-in');
        window.setTimeout(function () { el.classList.remove('is-in'); }, dur);
      }, dur / 2);
    }

    if (trigger === 'hover') {
      el.addEventListener('pointerenter', function () { show(1, true); });
      el.addEventListener('pointerleave', function () { show(0, true); });
      /* 键盘焦点与 hover 等效，避免只有鼠标用户能看到状态变化 */
      el.addEventListener('focusin', function () { show(1, true); });
      el.addEventListener('focusout', function () { show(0, true); });
    } else if (trigger === 'state') {
      if (!el.hasAttribute('aria-pressed')) el.setAttribute('aria-pressed', 'false');
      var syncFromPressed = function () {
        show(el.getAttribute('aria-pressed') === 'true' ? 1 : 0, true);
      };
      makeInteractive(el, function () {
        el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      });
      new MutationObserver(syncFromPressed).observe(el, { attributes: true, attributeFilter: ['aria-pressed'] });
      syncFromPressed();
    } else {
      makeInteractive(el, function () { show(showing === 0 ? 1 : 0, true); });
    }

    applyA11y(el, { interactive: interactive });

    el.__xlSwap = {
      el: el,
      names: names,
      showing: function () { return showing; },
      to: function (iconName, animate) {
        var idx = names.indexOf(iconName);
        if (idx < 0) {
          warn('XLMorph.swapTo：图标「' + iconName + '」不在 data-icon-swap 的配对内。');
          return false;
        }
        show(idx, animate !== false);
        return true;
      }
    };
    swapInstances.push(el.__xlSwap);
    return el.__xlSwap;
  }

  function init(root) {
    if (!ENGINE || !LUCIDE) {
      warn(depsHint() + 'XLMorph.init 已跳过。');
      return 0;
    }
    var scope = root || document;
    var nodes = scope.querySelectorAll('[data-morph-icon]');
    var count = 0;
    Array.prototype.forEach.call(nodes, function (el) {
      if (mount(el)) count++;
    });
    var swapNodes = scope.querySelectorAll('[data-icon-swap]');
    var swapCount = 0;
    Array.prototype.forEach.call(swapNodes, function (el) {
      if (mountSwap(el)) swapCount++;
    });
    watchMotion();
    lastCounts.morph = count;
    lastCounts.swap = swapCount;
    return count + swapCount;
  }

  function refresh(root) {
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll('[data-morph-icon]'), function (el) {
      if (!el.__xlMorph) mount(el);
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-icon-swap]'), function (el) {
      if (!el.__xlSwap) mountSwap(el);
    });
    return init(root);
  }

  /* 编程式控制：XLMorph.to(el, 'X') —— 供组件内部状态驱动。
   * iconName 必须是本主题白名单中涉及的 Lucide 图标，随意配对观感不可控。 */
  function to(el, iconName, options) {
    var record = el && el.__xlMorph;
    var icon = LUCIDE && LUCIDE[iconName];
    if (!record || !icon) {
      warn('XLMorph.to 需要已挂载的形变图标与有效的 Lucide 图标名。');
      return false;
    }
    var spring = (options && options.spring) || record.spring;
    record.morph.morphTo(icon, spring);
    record.showing = iconName === record.key ? 'to' : 'custom';
    return true;
  }

  /* 编程式控制：换图标过渡。XLMorph.swapTo(el, 'BellOff') —— 与 to() 同构，
   * 但换图标不走形变引擎，图标名只需在 data-icon-swap 的配对内即可。 */
  function swapTo(el, iconName, animate) {
    var record = el && el.__xlSwap;
    if (!record) {
      warn('XLMorph.swapTo 需要已挂载的换图标元素（data-icon-swap）。');
      return false;
    }
    return record.to(iconName, animate);
  }

  window.XLMorph = {
    init: init,
    refresh: refresh,
    to: to,
    swapTo: swapTo,
    counts: lastCounts,
    pairs: PAIRS,
    version: 'morphicons@1.7.1'
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})();
