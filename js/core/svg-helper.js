/* Declarative SVG helper, arrow markers, smooth tweening, and floating tooltips */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs = {}, children = []) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined) continue;
      if (k === 'textContent') {
        node.textContent = String(v);
      } else if (k === 'class') {
        node.setAttribute('class', String(v));
      } else {
        node.setAttribute(k, String(v));
      }
    }
    if (!Array.isArray(children)) children = [children];
    for (const ch of children) {
      if (ch === null || ch === undefined) continue;
      if (typeof ch === 'string') node.appendChild(document.createTextNode(ch));
      else node.appendChild(ch);
    }
    return node;
  }

  function createSvg(width, height, viewBox = null) {
    const svg = el('svg', {
      viewBox: viewBox || `0 0 ${width} ${height}`,
      width: '100%',
      preserveAspectRatio: 'xMidYMid meet',
    });
    ensureDefs(svg);
    return svg;
  }

  function ensureDefs(svg) {
    const defs = el('defs');
    const markerColors = [
      ['arrow-blue', 'var(--accent-blue)'],
      ['arrow-teal', 'var(--accent-teal)'],
      ['arrow-purple', 'var(--accent-purple)'],
      ['arrow-amber', 'var(--accent-amber)'],
      ['arrow-rose', 'var(--accent-rose)'],
      ['arrow-green', 'var(--accent-green)'],
      ['arrow-muted', 'var(--text-muted)'],
    ];
    for (const [id, fill] of markerColors) {
      const m = el('marker', {
        id,
        viewBox: '0 0 10 10',
        refX: '8.5',
        refY: '5',
        markerWidth: '6.5',
        markerHeight: '6.5',
        orient: 'auto-start-reverse',
      }, [
        el('path', { d: 'M 0 1.5 L 9 5 L 0 8.5 z', fill }),
      ]);
      defs.appendChild(m);
    }
    svg.appendChild(defs);
    return defs;
  }

  function htmlEl(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined) continue;
      if (k === 'className') node.className = v;
      else if (k === 'innerHTML') node.innerHTML = v;
      else if (k === 'textContent') node.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, String(v));
    }
    if (!Array.isArray(children)) children = [children];
    for (const ch of children) {
      if (ch === null || ch === undefined) continue;
      if (typeof ch === 'string') node.appendChild(document.createTextNode(ch));
      else node.appendChild(ch);
    }
    return node;
  }

  function animateTween(durationMs, onStep, onDone) {
    const start = performance.now();
    let rafId = null;
    function frame(now) {
      const raw = Math.min(1, (now - start) / durationMs);
      // easeInOutCubic
      const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      onStep(t, raw);
      if (raw < 1) {
        rafId = requestAnimationFrame(frame);
      } else if (onDone) {
        onDone();
      }
    }
    rafId = requestAnimationFrame(frame);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }

  let tooltipNode = null;
  function getTooltip() {
    if (!tooltipNode) {
      tooltipNode = document.getElementById('svg-tooltip');
    }
    return tooltipNode;
  }

  function bindTooltip(target, htmlContentFn) {
    target.addEventListener('mouseenter', (ev) => {
      const tip = getTooltip();
      if (!tip) return;
      const content = typeof htmlContentFn === 'function' ? htmlContentFn() : htmlContentFn;
      if (!content) return;
      tip.innerHTML = content;
      tip.style.display = 'block';
      moveTooltip(ev);
    });
    target.addEventListener('mousemove', moveTooltip);
    target.addEventListener('mouseleave', () => {
      const tip = getTooltip();
      if (tip) tip.style.display = 'none';
    });
  }

  function moveTooltip(ev) {
    const tip = getTooltip();
    if (!tip || tip.style.display === 'none') return;
    const pad = 14;
    let x = ev.clientX + pad;
    let y = ev.clientY + pad;
    const rect = tip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 10) x = ev.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 10) y = ev.clientY - rect.height - pad;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  }

  const PALETTE = [
    'var(--pal-0)',
    'var(--pal-1)',
    'var(--pal-2)',
    'var(--pal-3)',
    'var(--pal-4)',
    'var(--pal-5)',
    'var(--pal-6)',
    'var(--pal-7)',
  ];

  DM2.Svg = {
    el,
    createSvg,
    ensureDefs,
    htmlEl,
    animateTween,
    bindTooltip,
    PALETTE,
  };
})(window);
