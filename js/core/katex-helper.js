/* Offline KaTeX helper & PPT-aligned algebraic TeX formatters */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});

  function renderTex(tex, displayMode = false) {
    if (root.katex && typeof root.katex.renderToString === 'function') {
      try {
        return root.katex.renderToString(String(tex), {
          displayMode: !!displayMode,
          throwOnError: false,
          strict: 'ignore',
        });
      } catch (e) {
        return escapeHtml(String(tex));
      }
    }
    return `<code>${escapeHtml(String(tex))}</code>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setTex(el, tex, displayMode = false) {
    if (!el) return;
    el.innerHTML = renderTex(tex, displayMode);
  }

  function permMatrixTex(p) {
    const top = Array.from({ length: p.length }, (_, i) => i + 1).join(' & ');
    const bot = p.join(' & ');
    return `\\begin{pmatrix} ${top} \\\\ ${bot} \\end{pmatrix}`;
  }

  function cycleListTex(cycles) {
    if (!cycles || cycles.length === 0) return '(1)';
    return cycles.map((c) => `(${c.join('\\ ')})`).join('');
  }

  function transpositionsTex(trans) {
    if (!trans || trans.length === 0) return '(1)';
    return trans.map((t) => `(${t[0]}\\ ${t[1]})`).join('');
  }

  DM2.KaTeX = {
    renderTex,
    setTex,
    escapeHtml,
    permMatrixTex,
    cycleListTex,
    transpositionsTex,
  };
})(window);
