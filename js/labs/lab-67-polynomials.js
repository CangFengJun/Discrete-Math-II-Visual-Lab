/* 6.7 Polynomials & Cyclotomic Polynomials Lab:
 * 1) Descending Division & Euclidean Bezout Stepper (R_0 and R_p)
 * 2) Equal vs Identical (R_p) + Derivative f'(x) Multiple Root Geometry (char 0 vs char p)
 * 3) Four-Field Factorization (C / R / R_0 / R_p) + Eisenstein Spotlight + Rational Roots
 * 4) Complex Unit Circle Cyclotomic Explorer Phi_n(x) & mod p Projection
 */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  DM2.Labs = DM2.Labs || {};
  const M = DM2.Math;
  const { el, createSvg, htmlEl, PALETTE, bindTooltip } = DM2.Svg;
  const { renderTex } = DM2.KaTeX;

  function parseCoeffs(str) {
    return str
      .split(/[\s,，]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n) && Number.isInteger(n));
  }

  function render(container, ctx) {
    let tab = 'cyclotomic'; // 'euclid' | 'deriv' | 'eisenstein' | 'cyclotomic'

    // Tab 1 state
    let eucChar = 0; // 0, 2, 3, 5
    let fStr = '1, 0, 0, -1'; // x^3 - 1
    let gStr = '1, 0, -1';    // x^2 - 1

    // Tab 2 state
    let identP = 3;
    let derivMode = 'real_double'; // 'real_double' | 'real_triple' | 'real_simple' | 'char_p'

    // Tab 3 state
    let eisKey = 'x3_2';
    let eisPrime = 2;
    let modTestP = 2;

    // Tab 4 state
    let cycN = 12;
    let cycFocusD = null; // null = all divisors, or specific d | cycN
    let cycProjP = 0;     // 0 = Z/R_0, or 2, 3, 5

    function applyPreset(p) {
      if (!p) return;
      if (p === 'poly-euclid') tab = 'euclid';
      else if (p === 'equal-vs-ident') {
        tab = 'deriv';
        identP = 3;
      } else if (p === 'deriv-multroot') {
        tab = 'deriv';
        derivMode = 'char_p';
      } else if (p === 'four-field-eisenstein') {
        tab = 'eisenstein';
        eisKey = 'x3_2';
        eisPrime = 2;
      } else if (p === 'cyclotomic-circle') {
        tab = 'cyclotomic';
        cycN = 12;
        cycFocusD = 12;
      }
      renderAll();
    }

    function renderAll() {
      container.innerHTML = '';

      const header = htmlEl('div', { className: 'lab-header' }, [
        htmlEl('div', { className: 'lab-title-wrap' }, [
          htmlEl('h1', {}, [
            '6.7 多项式、微商与分圆多项式',
            htmlEl('span', { className: 'lab-badge' }, 'p.235–321 · 严格降幂体系'),
          ]),
          htmlEl('p', { className: 'lab-desc' }, '全节严格按降幂 a₀xⁿ+a₁xⁿ⁻¹+…+aₙ 演算：涵盖带余/辗转相除、相等与恒等辨析、微商重根特征退化、四域分解与单位圆分圆仪。'),
        ]),
        htmlEl('div', { className: 'lab-tabs' }, [
          htmlEl('button', { className: `lab-tab ${tab === 'euclid' ? 'active' : ''}`, onClick: () => { tab = 'euclid'; renderAll(); } }, '带余除法 & 辗转 Bézout'),
          htmlEl('button', { className: `lab-tab ${tab === 'deriv' ? 'active' : ''}`, onClick: () => { tab = 'deriv'; renderAll(); } }, '相等vs恒等 & 微商重根'),
          htmlEl('button', { className: `lab-tab ${tab === 'eisenstein' ? 'active' : ''}`, onClick: () => { tab = 'eisenstein'; renderAll(); } }, '四域分解 & Eisenstein'),
          htmlEl('button', { className: `lab-tab ${tab === 'cyclotomic' ? 'active' : ''}`, onClick: () => { tab = 'cyclotomic'; renderAll(); } }, '单位圆分圆仪 Φₙ(x)'),
        ]),
      ]);
      container.appendChild(header);

      if (tab === 'euclid') renderEuclidTab();
      else if (tab === 'deriv') renderDerivTab();
      else if (tab === 'eisenstein') renderEisensteinTab();
      else renderCyclotomicTab();
    }

    // -------------------------------------------------------------------------
    // Tab 1: Division Algorithm & Extended Euclidean Bezout Stepper
    // -------------------------------------------------------------------------
    function renderEuclidTab() {
      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '底域 F：'),
          ...[
            [0, '有理数域 R₀'],
            [2, 'R₂ (mod 2)'],
            [3, 'R₃ (mod 3)'],
            [5, 'R₅ (mod 5)'],
          ].map(([p, lbl]) => htmlEl('button', {
            className: `btn btn-sm ${eucChar === p ? 'active' : ''}`,
            onClick: () => { eucChar = p; renderAll(); },
          }, lbl)),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, 'f(x) 降幂系数：'),
          (() => {
            const inp = htmlEl('input', { className: 'ctrl-input', value: fStr, style: { width: '130px' } });
            inp.addEventListener('change', () => { fStr = inp.value; renderAll(); });
            return inp;
          })(),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, 'g(x) 降幂系数：'),
          (() => {
            const inp = htmlEl('input', { className: 'ctrl-input', value: gStr, style: { width: '110px' } });
            inp.addEventListener('change', () => { gStr = inp.value; renderAll(); });
            return inp;
          })(),
        ]),
        htmlEl('button', {
          className: 'btn btn-sm',
          onClick: () => { fStr = '1, 0, 1, 1'; gStr = '1, 1, 0'; renderAll(); },
        }, '预设互质例'),
      ]);
      container.appendChild(bar);

      const fInt = parseCoeffs(fStr);
      const gInt = parseCoeffs(gStr);
      if (fInt.length === 0 || gInt.length === 0) {
        container.appendChild(htmlEl('div', { className: 'formula-banner warn' }, '请输入有效的非零整数系数（逗号分隔，从高次到常数项）'));
        return;
      }

      let divRes, eucRes, fTex, gTex, qTex, rTex, dTex, lamTex, muTex;
      if (eucChar === 0) {
        const f0 = M.polyFromIntR0(fInt);
        const g0 = M.polyFromIntR0(gInt);
        if (g0.length === 0) {
          container.appendChild(htmlEl('div', { className: 'formula-banner warn' }, '除式 g(x) 不能为零多项式！'));
          return;
        }
        divRes = M.polyDivModR0(f0, g0);
        eucRes = M.polyGcdExtR0(f0, g0);
        fTex = M.polyToLatex(f0, 'x', true);
        gTex = M.polyToLatex(g0, 'x', true);
        qTex = M.polyToLatex(divRes.q, 'x', true);
        rTex = M.polyToLatex(divRes.r, 'x', true);
        dTex = M.polyToLatex(eucRes.d, 'x', true);
        lamTex = M.polyToLatex(eucRes.lambda, 'x', true);
        muTex = M.polyToLatex(eucRes.mu, 'x', true);
      } else {
        const fp = M.polyNormFp(fInt, eucChar);
        const gp = M.polyNormFp(gInt, eucChar);
        if (gp.length === 0) {
          container.appendChild(htmlEl('div', { className: 'formula-banner warn' }, `除式 g(x) 在 R_${eucChar} 下模约化为零多项式！`));
          return;
        }
        divRes = M.polyDivModFp(fp, gp, eucChar);
        eucRes = M.polyGcdExtFp(fp, gp, eucChar);
        fTex = M.polyToLatex(fp, 'x', false);
        gTex = M.polyToLatex(gp, 'x', false);
        qTex = M.polyToLatex(divRes.q, 'x', false);
        rTex = M.polyToLatex(divRes.r, 'x', false);
        dTex = M.polyToLatex(eucRes.d, 'x', false);
        lamTex = M.polyToLatex(eucRes.lambda, 'x', false);
        muTex = M.polyToLatex(eucRes.mu, 'x', false);
      }

      const grid = htmlEl('div', { className: 'grid-2' });
      container.appendChild(grid);

      // Left: Band Division Steps
      const p1 = htmlEl('div', { className: 'panel' });
      p1.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '带余除法定理（f = qg + r，次 r < 次 g）'),
        htmlEl('span', { className: `chip ${divRes.r.length === 0 ? 'ok' : 'warn'}` },
          divRes.r.length === 0 ? '余式 r(x) = 0 ⇒ g(x) 整除 f(x)' : `余式次数 = ${M.polyDeg(divRes.r)}`),
      ]));
      const b1 = htmlEl('div', { className: 'panel-body' });
      b1.appendChild(htmlEl('div', {
        className: 'formula-banner info',
        innerHTML: renderTex(`(${fTex}) = (${qTex})(${gTex}) + (${rTex})`, true),
      }));
      const stepList1 = htmlEl('div', { style: { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' } });
      if (divRes.steps.length === 0) {
        stepList1.appendChild(htmlEl('span', { style: { fontSize: '12.5px', color: 'var(--text-muted)' } }, '被除式次数已小于除式，商式 q = 0，余式 r = f。'));
      } else {
        divRes.steps.forEach((st, idx) => {
          const isFrac = eucChar === 0;
          const qCoeffTex = isFrac ? M.fracToLatex(st.qTermCoeff) : String(st.qTermCoeff);
          const qTermTex = st.qTermDeg === 0 ? qCoeffTex : st.qTermDeg === 1 ? `${qCoeffTex}x` : `${qCoeffTex}x^{${st.qTermDeg}}`;
          stepList1.appendChild(htmlEl('div', {
            style: { padding: '6px 10px', borderRadius: '7px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', fontSize: '12.5px' },
            innerHTML: `<strong>消元第 ${idx + 1} 步</strong>：商项 ${renderTex(qTermTex)} &nbsp;⇒&nbsp; 余式变为 ${renderTex(M.polyToLatex(st.remAfter, 'x', isFrac))}`,
          }));
        });
      }
      b1.appendChild(stepList1);
      p1.appendChild(b1);
      grid.appendChild(p1);

      // Right: Euclidean GCD & Bezout Combination
      const p2 = htmlEl('div', { className: 'panel' });
      p2.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '最高公因 d(x) 与倍式和表示（定理 6.7.3–6.7.4）'),
        htmlEl('span', { className: `chip ${M.polyDeg(eucRes.d) === 0 ? 'ok' : ''}` },
          M.polyDeg(eucRes.d) === 0 ? '互质（最高公因为 1）' : `公因次数 = ${M.polyDeg(eucRes.d)}`),
      ]));
      const b2 = htmlEl('div', { className: 'panel-body' });
      b2.appendChild(htmlEl('div', {
        className: 'formula-banner',
        innerHTML: renderTex(`d(x) = ${dTex} = (${lamTex})\\,f(x) + (${muTex})\\,g(x)`, true),
      }));
      const stepList2 = htmlEl('div', { style: { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' } });
      eucRes.steps.forEach((st, idx) => {
        const isFrac = eucChar === 0;
        stepList2.appendChild(htmlEl('div', {
          style: { padding: '6px 10px', borderRadius: '7px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', fontSize: '12px' },
          innerHTML: `<strong>第 ${idx + 1} 轮</strong>：${renderTex(`${M.polyToLatex(st.dividend, 'x', isFrac)} = (${M.polyToLatex(st.q, 'x', isFrac)})(${M.polyToLatex(st.divisor, 'x', isFrac)}) + (${M.polyToLatex(st.r, 'x', isFrac)})`)}`,
        }));
      });
      b2.appendChild(stepList2);
      p2.appendChild(b2);
      grid.appendChild(p2);
    }

    // -------------------------------------------------------------------------
    // Tab 2: Equal vs Identical + Derivative Multiple Root (char 0 vs char p)
    // -------------------------------------------------------------------------
    function renderDerivTab() {
      const grid = htmlEl('div', { className: 'grid-2' });
      container.appendChild(grid);

      // Left: Equal vs Identical on R_p
      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '概念辨析（p.268–270）：形式相等（=）vs 函数恒等（≡）'),
        htmlEl('div', { style: { display: 'flex', gap: '4px' } }, [2, 3, 5].map((p) => htmlEl('button', {
          className: `btn btn-sm ${identP === p ? 'active' : ''}`,
          onClick: () => { identP = p; renderAll(); },
        }, `R_${p}`))),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });
      const box1 = htmlEl('div', { className: 'canvas-box' });
      const svg1 = createSvg(400, 260);
      box1.appendChild(svg1);

      svg1.appendChild(el('text', { x: 200, y: 24, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 12.5, 'font-weight': 800 },
        `在有限域 R_${identP} 上对比 f(x) = x^${identP} 与 g(x) = x`));

      for (let a = 0; a < identP; a++) {
        const y = 62 + (a * 165) / Math.max(1, identP - 1);
        const fa = Math.pow(a, identP) % identP;
        const ga = a % identP;
        const yf = 62 + (fa * 165) / Math.max(1, identP - 1);

        // Input node on left
        svg1.appendChild(el('circle', { cx: 65, cy: y, r: 14, fill: 'var(--svg-node-fill)', stroke: 'var(--accent-blue)', 'stroke-width': 2 }));
        svg1.appendChild(el('text', { x: 65, y: y + 4.5, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 12, 'font-weight': 800 }, String(a)));

        // Output node in center-right
        svg1.appendChild(el('circle', { cx: 295, cy: yf, r: 14, fill: 'var(--accent-teal)', stroke: '#FFFFFF', 'stroke-width': 1.8 }));
        svg1.appendChild(el('text', { x: 295, y: yf + 4.5, 'text-anchor': 'middle', fill: '#FFFFFF', 'font-size': 12, 'font-weight': 800 }, String(fa)));

        // Overlap arrows f(a) & g(a)
        svg1.appendChild(el('line', { x1: 82, y1: y - 3, x2: 278, y2: yf - 3, stroke: 'var(--accent-blue)', 'stroke-width': 2.2, 'marker-end': 'url(#arrow-blue)' }));
        svg1.appendChild(el('line', { x1: 82, y1: y + 3, x2: 278, y2: yf + 3, stroke: 'var(--accent-amber)', 'stroke-width': 2.2, 'stroke-dasharray': '4 3', 'marker-end': 'url(#arrow-amber)' }));

        svg1.appendChild(el('text', { x: 348, y: yf + 4, fill: 'var(--accent-green)', 'font-size': 11, 'font-weight': 700 }, `${fa} = ${ga} ✓`));
      }

      svg1.appendChild(el('text', { x: 200, y: 248, 'text-anchor': 'middle', fill: 'var(--accent-rose)', 'font-size': 11.5, 'font-weight': 700 },
        `代入所有元素取值全同（f ≡ g），但次数 ${identP} ≠ 1，形式不等（f ≠ g）！`));

      leftBody.appendChild(box1);
      leftBody.appendChild(htmlEl('div', {
        className: 'formula-banner warn',
        style: { marginTop: '8px' },
        innerHTML: renderTex(`\\text{在 } R_{${identP}} \\text{ 上：} x^{${identP}} \\equiv x \\text{（函数恒等）}\\quad\\text{但}\\quad x^{${identP}} \\neq x \\text{（形式不相等）}`),
      }));
      leftPanel.appendChild(leftBody);
      grid.appendChild(leftPanel);

      // Right: Formal Derivative f'(x) & Multiple Root Criterion (char 0 vs char p)
      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '微商 f\'(x) 与重根判定（定理 6.7.11–6.7.12）'),
      ]));
      const rightBody = htmlEl('div', { className: 'panel-body' });

      const dBtns = htmlEl('div', { className: 'controls-bar', style: { marginBottom: '10px' } }, [
        ['real_double', 'ℝ 上 2 重根 (x-1)²(x+1.5)'],
        ['real_triple', 'ℝ 上 3 重根 (x-1)³'],
        ['real_simple', 'ℝ 上无重根 (x-1)(x+1)(x-2)'],
        ['char_p', '⚠ 特征 p=2 奇异例：x²+1=(x+1)²'],
      ].map(([k, lbl]) => htmlEl('button', {
        className: `btn btn-sm ${derivMode === k ? 'active' : ''}`,
        onClick: () => { derivMode = k; renderAll(); },
      }, lbl)));
      rightBody.appendChild(dBtns);

      if (derivMode === 'char_p') {
        const boxChar = htmlEl('div', { className: 'formula-banner warn', style: { marginBottom: '10px' } }, [
          htmlEl('strong', {}, '定理 6.7.11 精确讨论（p.273–274）特征 p 奇异现象！'),
          htmlEl('div', { innerHTML: renderTex(`f(x) = x^2 + 1 = (x + 1)^2 \\in R_2[x]\\text{，重数 } k = 2 \\text{ 恰为特征 } p=2 \\text{ 的倍数}`) }),
          htmlEl('div', { innerHTML: renderTex(`\\implies f'(x) = 2x \\equiv 0 \\in R_2[x]`) }),
          htmlEl('span', {}, 'α = 1 是 f(x) 的 2 重根，但在特征 2 下由于 2 = 0，它竟成了微商 f\'(x) = 0 的 ∞ 重根（至少是 k 重根而非 k-1 重根）！不过定理 6.7.12“重根 ⟺ f 与 f\' 的公共根”依然完美成立！'),
        ]);
        rightBody.appendChild(boxChar);
      } else {
        const box2 = htmlEl('div', { className: 'canvas-box' });
        const svg2 = createSvg(400, 230);
        box2.appendChild(svg2);

        const fnSpec = {
          real_double: { f: (x) => (x - 1) * (x - 1) * (x + 1.5), df: (x) => 2 * (x - 1) * (x + 1.5) + (x - 1) * (x - 1), tex: 'f(x)=(x-1)^2(x+1.5),\\ f\'(1)=0', note: 'x=1 处曲线与 x 轴相切（2重根），恰好穿过导数零点 f\'(1)=0（f\' 有 2-1=1 重根）' },
          real_triple: { f: (x) => Math.pow(x - 1, 3), df: (x) => 3 * Math.pow(x - 1, 2), tex: 'f(x)=(x-1)^3,\\ f\'(x)=3(x-1)^2', note: 'x=1 是 3 重根，导数 f\'(x) 在 x=1 处仍有 3-1=2 重根' },
          real_simple: { f: (x) => (x - 1) * (x + 1) * (x - 2), df: (x) => 3 * x * x - 4 * x - 1, tex: 'f(x)=(x-1)(x+1)(x-2),\\ \\gcd(f,f\')=1', note: '三个互异单根处曲线皆斜穿 x 轴，f\'(x) 在各根处均非零（无公共根）' },
        }[derivMode];

        // Axes x in [-2.2, 2.6], y in [-4, 4]
        const mapX = (x) => 40 + ((x + 2.2) * 320) / 4.8;
        const mapY = (y) => 115 - (y * 92) / 4.5;
        svg2.appendChild(el('line', { x1: 20, y1: mapY(0), x2: 380, y2: mapY(0), stroke: 'var(--border-strong)', 'stroke-width': 1.5 }));
        svg2.appendChild(el('line', { x1: mapX(0), y1: 12, x2: mapX(0), y2: 215, stroke: 'var(--border-strong)', 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }));

        const buildPath = (fn) => {
          const pts = [];
          for (let i = 0; i <= 120; i++) {
            const x = -2.1 + (i * 4.5) / 120;
            const y = Math.max(-4.8, Math.min(4.8, fn(x)));
            pts.push(`${i === 0 ? 'M' : 'L'} ${mapX(x).toFixed(1)} ${mapY(y).toFixed(1)}`);
          }
          return pts.join(' ');
        };
        svg2.appendChild(el('path', { d: buildPath(fnSpec.f), fill: 'none', stroke: 'var(--accent-blue)', 'stroke-width': 2.6 }));
        svg2.appendChild(el('path', { d: buildPath(fnSpec.df), fill: 'none', stroke: 'var(--accent-teal)', 'stroke-width': 2, 'stroke-dasharray': '5 3' }));

        // Mark x=1
        svg2.appendChild(el('circle', { cx: mapX(1), cy: mapY(0), r: 5.5, fill: derivMode === 'real_simple' ? 'var(--accent-blue)' : 'var(--accent-rose)' }));
        svg2.appendChild(el('text', { x: mapX(1), y: mapY(0) + 16, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 11, 'font-weight': 700 }, 'x=1'));
        svg2.appendChild(el('text', { x: 24, y: 24, fill: 'var(--accent-blue)', 'font-size': 11, 'font-weight': 700 }, '实线 f(x)'));
        svg2.appendChild(el('text', { x: 96, y: 24, fill: 'var(--accent-teal)', 'font-size': 11, 'font-weight': 700 }, '虚线 f\'(x)'));

        rightBody.appendChild(box2);
        rightBody.appendChild(htmlEl('div', {
          className: 'formula-banner info',
          style: { marginTop: '8px' },
          innerHTML: `${renderTex(fnSpec.tex)}<span style="font-size:12px;">${fnSpec.note}</span>`,
        }));
      }

      rightPanel.appendChild(rightBody);
      grid.appendChild(rightPanel);
    }

    // -------------------------------------------------------------------------
    // Tab 3: 4-Field Irreducibility & Eisenstein Spotlight + Rational Roots
    // -------------------------------------------------------------------------
    function renderEisensteinTab() {
      const PRESETS = {
        x3_2: {
          name: 'x³ - 2',
          coeffs: [1, 0, 0, -2],
          cDesc: '3 个不同一次质式：(x - ∛2)(x - ω∛2)(x - ω²∛2)',
          rDesc: '1 个一次式 + 1 个判别式<0二次质式：(x - ∛2)(x² + ∛2x + ∛4)',
        },
        x4_1: {
          name: 'x⁴ - 1',
          coeffs: [1, 0, 0, 0, -1],
          cDesc: '4 个一次质式：(x-1)(x+1)(x-i)(x+i)',
          rDesc: '(x-1)(x+1)(x²+1)（二次式判别式 -4 < 0）',
        },
        phi5: {
          name: 'Φ₅(x) = x⁴+x³+x²+x+1',
          coeffs: [1, 1, 1, 1, 1],
          cDesc: '4 个复一次质式 (x-ξ)(x-ξ²)(x-ξ³)(x-ξ⁴)',
          rDesc: '两个实二次质式乘积（无实根）',
        },
        x3_x_1: {
          name: 'x³ + x + 1（Eisenstein 失效但 R₂ 不可约！）',
          coeffs: [1, 0, 1, 1],
          cDesc: '3 个复一次质式',
          rDesc: '1 个实一次式 × 1 个实二次质式',
        },
        prod6: {
          name: '(x²+7)(x⁴+5) = x⁶+7x⁴+5x²+35（无有理根却可约！）',
          coeffs: [1, 0, 7, 0, 5, 0, 35],
          cDesc: '6 个复一次质式',
          rDesc: '(x²+7)(x²-√5i? 等) 拆为 3 个实二次质式',
        },
      };

      const cur = PRESETS[eisKey];
      const eis = M.eisensteinCheck(cur.coeffs, eisPrime);
      const rat = M.rationalRootsCheck(cur.coeffs);
      const modCoeffs = M.polyNormFp(cur.coeffs, modTestP);
      const leadNotDivP = cur.coeffs[0] % modTestP !== 0;
      const modFac = M.polyFactorFp(modCoeffs, modTestP);
      const modIrred = leadNotDivP && modFac.factors.length === 1 && modFac.factors[0].mult === 1;

      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '经典试金石多项式：'),
          ...Object.entries(PRESETS).map(([k, v]) => htmlEl('button', {
            className: `btn btn-sm ${eisKey === k ? 'active' : ''}`,
            onClick: () => { eisKey = k; renderAll(); },
          }, v.name.split('（')[0])),
        ]),
      ]);
      container.appendChild(bar);

      const grid = htmlEl('div', { className: 'grid-2' });
      container.appendChild(grid);

      // Left: Eisenstein Spotlight & Rational Root Filter
      const p1 = htmlEl('div', { className: 'panel' });
      p1.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, 'Eisenstein 探照灯（定理 6.7.18）& 有理根筛（6.7.20）'),
        htmlEl('div', { style: { display: 'flex', gap: '4px' } }, [2, 3, 5, 7].map((p) => htmlEl('button', {
          className: `btn btn-sm ${eisPrime === p ? 'active' : ''}`,
          onClick: () => { eisPrime = p; renderAll(); },
        }, `p=${p}`))),
      ]));
      const b1 = htmlEl('div', { className: 'panel-body' });
      b1.appendChild(htmlEl('div', {
        className: 'formula-banner info',
        innerHTML: renderTex(`f(x) = ${M.polyToLatex(cur.coeffs, 'x', false)}`),
      }));
      b1.appendChild(htmlEl('div', { className: 'stat-chips', style: { marginTop: '10px', flexDirection: 'column', alignItems: 'stretch' } }, [
        htmlEl('span', { className: `chip ${eis.condLead ? 'ok' : 'bad'}` }, `① 首系数 p=${eisPrime} ∤ a₀ (${cur.coeffs[0]})：${eis.condLead ? '✓ 满足' : '✗ 不满足'}`),
        htmlEl('span', { className: `chip ${eis.condAllTail ? 'ok' : 'bad'}` }, `② 其余系数 p=${eisPrime} | a₁,…,aₙ：${eis.condAllTail ? '✓ 全部整除' : '✗ 存在不整除项'}`),
        htmlEl('span', { className: `chip ${eis.condSquare ? 'ok' : 'bad'}` }, `③ 常数项 p²=${eisPrime * eisPrime} ∤ aₙ (${cur.coeffs[cur.coeffs.length - 1]})：${eis.condSquare ? '✓ 满足' : '✗ 不满足'}`),
        htmlEl('span', { className: `chip ${eis.applicable ? 'ok' : 'warn'}` },
          eis.applicable ? `★ 三灯全绿！f(x) 在有理域 R₀ 上必为质式（不可约）！` : `手写提醒 (p.290)：未满足充分条件时不能判可约，需换质数或改用模 p 法！`),
      ]));

      b1.appendChild(htmlEl('div', { className: 'formula-banner', style: { marginTop: '10px' } }, [
        htmlEl('strong', {}, `定理 6.7.20 有理根筛 (b|aₙ, c|a₀)`),
        htmlEl('span', {}, `候选有理根：${rat.candidates.map((c) => M.fracToString(c.cand)).slice(0, 12).join(', ')}${rat.candidates.length > 12 ? '…' : ''}`),
        htmlEl('span', { style: { color: rat.roots.length ? 'var(--accent-rose)' : 'var(--accent-teal)', fontWeight: 700 } },
          rat.roots.length ? `命中实际有理根：${rat.roots.map(M.fracToString).join(', ')}` : '无任何有理根（注意 p.296 易错：无有理根未必不可约！如 (x²+7)(x⁴+5)）'),
      ]));
      p1.appendChild(b1);
      grid.appendChild(p1);

      // Right: Four-Field Comparison + Mod p Reduction Theorem (Red Box p.294)
      const p2 = htmlEl('div', { className: 'panel' });
      p2.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '四域质式分解对照（ℂ / ℝ / R₀ / Rₚ 模约化红框定理）'),
        htmlEl('div', { style: { display: 'flex', gap: '4px' } }, [2, 3, 5].map((p) => htmlEl('button', {
          className: `btn btn-sm ${modTestP === p ? 'active' : ''}`,
          onClick: () => { modTestP = p; renderAll(); },
        }, `模 ${p}`))),
      ]));
      const b2 = htmlEl('div', { className: 'panel-body' }, [
        htmlEl('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, [
          htmlEl('div', { className: 'formula-banner info' }, [
            htmlEl('strong', {}, '1. 复数域 ℂ（只有一次式是质式）'),
            htmlEl('span', {}, cur.cDesc),
          ]),
          htmlEl('div', { className: 'formula-banner info' }, [
            htmlEl('strong', {}, '2. 实数域 ℝ（仅一次式与 Δ<0 二次式是质式）'),
            htmlEl('span', {}, cur.rDesc),
          ]),
          htmlEl('div', { className: 'formula-banner' }, [
            htmlEl('strong', {}, `3. 模质数 p=${modTestP} 约化到素域 R_${modTestP}[x]` + (leadNotDivP ? '' : '（⚠ 首项被 p 整除，不能直接用 p.294 定理）')),
            htmlEl('div', {
              innerHTML: renderTex(`f_{${modTestP}}(x) \\equiv ${modFac.factors.map((f) => {
                const pt = M.polyToLatex(f.poly, 'x', false);
                return f.mult > 1 ? `(${pt})^{${f.mult}}` : `(${pt})`;
              }).join('') || '0'} \\pmod{${modTestP}}`),
            }),
            htmlEl('span', { style: { fontWeight: 700, color: modIrred ? 'var(--accent-green)' : 'var(--accent-amber)' } },
              modIrred
                ? `★ 红框重点（p.294）：在 R_${modTestP} 上不可约 ⇒ 在有理域 R₀ 上必然不可约！`
                : `在 R_${modTestP} 上可约（若本身在 R₀ 不可约如 x⁴-1? 不，x⁴-1 可约；注意 x⁴+1 在任意素域皆可约但在 R₀ 不可约！）`),
          ]),
        ]),
      ]);
      p2.appendChild(b2);
      grid.appendChild(p2);
    }

    // -------------------------------------------------------------------------
    // Tab 4: Complex Unit Circle Cyclotomic Explorer Phi_n(x)
    // -------------------------------------------------------------------------
    function renderCyclotomicTab() {
      const divs = M.divisors(cycN);
      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, `等分圆阶数 n = ${cycN}（共 ${cycN} 个单位根，φ(${cycN})=${M.eulerPhi(cycN)} 个本原根）：`),
          (() => {
            const r = htmlEl('input', { className: 'ctrl-range', type: 'range', min: 1, max: 16, value: cycN });
            r.addEventListener('input', () => {
              cycN = Number(r.value);
              if (cycFocusD !== null && cycN % cycFocusD !== 0) cycFocusD = null;
              renderAll();
            });
            return r;
          })(),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '投射域：'),
          ...[0, 2, 3, 5].map((p) => htmlEl('button', {
            className: `btn btn-sm ${cycProjP === p ? 'active' : ''}`,
            onClick: () => { cycProjP = p; renderAll(); },
          }, p === 0 ? '复数/整数域 R₀' : `任意域 R_${p} (mod ${p})`)),
        ]),
      ]);
      container.appendChild(bar);

      // Divisor pills for highlighting individual Phi_d(x)
      const divBar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('span', { style: { fontWeight: 700, fontSize: '12px' } }, '点击因子 d | n 高亮对应 Φ_d(x) 轨道：'),
        htmlEl('button', {
          className: `btn btn-sm ${cycFocusD === null ? 'btn-primary' : ''}`,
          onClick: () => { cycFocusD = null; renderAll(); },
        }, '全部一起显示'),
        ...divs.map((d, idx) => htmlEl('button', {
          className: `btn btn-sm ${cycFocusD === d ? 'btn-primary' : ''}`,
          style: { borderColor: PALETTE[idx % PALETTE.length] },
          onClick: () => { cycFocusD = d; renderAll(); },
        }, `Φ_${d}(x) [φ=${M.eulerPhi(d)}]`)),
      ]);
      container.appendChild(divBar);

      const grid = htmlEl('div', { className: 'split-wide' });
      container.appendChild(grid);

      // Left SVG: Complex Unit Circle
      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '复平面单位圆：xⁿ - 1 的根按周期 d | n 彩色分层'),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(400, 340);
      box.appendChild(svg);

      const cx = 200, cy = 166, R = 122;
      svg.appendChild(el('line', { x1: 24, y1: cy, x2: 376, y2: cy, stroke: 'var(--border-color)', 'stroke-width': 1.2 }));
      svg.appendChild(el('line', { x1: cx, y1: 18, x2: cx, y2: 314, stroke: 'var(--border-color)', 'stroke-width': 1.2 }));
      svg.appendChild(el('circle', { cx, cy, r: R, fill: 'none', stroke: 'var(--border-strong)', 'stroke-width': 1.8 }));

      // Compute exact order of each k/n root: d = n / gcd(n, k)
      const roots = Array.from({ length: cycN }, (_, k) => {
        const ang = -(2 * Math.PI * k) / cycN; // standard CCW from (1,0) in SVG (y down => negative angle!)
        const d = cycN / M.gcd(cycN, k);
        const dIdx = divs.indexOf(d);
        return {
          k, d, dIdx,
          x: cx + R * Math.cos(ang),
          y: cy + R * Math.sin(ang),
        };
      });

      // If a specific d is focused, draw connecting polygon / star of its roots
      if (cycFocusD !== null && cycFocusD >= 3) {
        const focRoots = roots.filter((r) => r.d === cycFocusD);
        const col = PALETTE[divs.indexOf(cycFocusD) % PALETTE.length];
        for (let i = 0; i < focRoots.length; i++) {
          const p1 = focRoots[i], p2 = focRoots[(i + 1) % focRoots.length];
          svg.appendChild(el('line', {
            x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
            stroke: col, 'stroke-width': 1.8, 'stroke-opacity': 0.55,
          }));
        }
      }

      for (const rt of roots) {
        const col = PALETTE[rt.dIdx % PALETTE.length];
        const dim = cycFocusD !== null && rt.d !== cycFocusD;
        const g = el('g', { class: 'svg-clickable', opacity: dim ? 0.25 : 1 });
        g.appendChild(el('line', { x1: cx, y1: cy, x2: rt.x, y2: rt.y, stroke: col, 'stroke-width': dim ? 0.8 : 1.5, 'stroke-opacity': 0.5 }));
        g.appendChild(el('circle', { cx: rt.x, cy: rt.y, r: rt.d === cycN ? 9.5 : 7.5, fill: col, stroke: '#FFFFFF', 'stroke-width': 1.6 }));
        const lx = cx + (R + 20) * Math.cos(-(2 * Math.PI * rt.k) / cycN);
        const ly = cy + (R + 20) * Math.sin(-(2 * Math.PI * rt.k) / cycN);
        g.appendChild(el('text', {
          x: lx, y: ly + 4, 'text-anchor': 'middle', fill: col, 'font-size': 10.5, 'font-weight': 700,
        }, rt.k === 0 ? '1' : `ξ^${rt.k}`));
        g.addEventListener('click', () => { cycFocusD = cycFocusD === rt.d ? null : rt.d; renderAll(); });
        bindTooltip(g, () => `<strong>ξ^${rt.k}</strong><br>乘法周期 d = ${rt.d}（属于 Φ_${rt.d}(x) 的根）<br>${rt.d === cycN ? '★ 本原 ' + cycN + ' 次单位根！' : ''}`);
        svg.appendChild(g);
      }

      svg.appendChild(el('text', { x: 200, y: 332, 'text-anchor': 'middle', fill: 'var(--text-secondary)', 'font-size': 11.5, 'font-weight': 700 },
        cycFocusD ? `已聚焦 Φ_${cycFocusD}(x) 的 ${M.eulerPhi(cycFocusD)} 个本原 ${cycFocusD} 次根` : `点击任意单位根圆点，分离它的周期族群`));

      leftBody.appendChild(box);
      leftPanel.appendChild(leftBody);
      grid.appendChild(leftPanel);

      // Right: Exact Formula Breakdown x^n - 1 = prod Phi_d(x) & R_p projection
      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '定理 6.7.22–6.7.24：分圆多项式精确分解'),
      ]));
      const rightBody = htmlEl('div', { className: 'panel-body' });

      const prodExpr = divs.map((d) => `\\Phi_{${d}}(x)`).join('');
      const expandedProd = divs.map((d) => `(${M.polyToLatex(M.cyclotomicPoly(d), 'x', false)})`).join('');

      rightBody.appendChild(htmlEl('div', {
        className: 'formula-banner',
        innerHTML: renderTex(`x^{${cycN}} - 1 = ${prodExpr} = ${expandedProd}`, true),
      }));

      const listWrap = htmlEl('div', { style: { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '235px', overflowY: 'auto' } });
      divs.forEach((d, idx) => {
        const phiCoeffs = M.cyclotomicPoly(d);
        const col = PALETTE[idx % PALETTE.length];
        let extra = '';
        if (cycProjP > 0) {
          const modC = M.polyNormFp(phiCoeffs, cycProjP);
          if (cycN % cycProjP === 0) {
            // Note when p | n!
            const fac = M.polyFactorFp(modC, cycProjP);
            extra = ` &nbsp;⇒&nbsp; R_${cycProjP}: ${renderTex(fac.factors.map((f) => {
              const pt = M.polyToLatex(f.poly, 'x', false);
              return f.mult > 1 ? `(${pt})^{${f.mult}}` : `(${pt})`;
            }).join(''))}`;
          } else {
            const fac = M.polyFactorFp(modC, cycProjP);
            extra = ` &nbsp;⇒&nbsp; R_${cycProjP}: ${renderTex(fac.factors.map((f) => `(${M.polyToLatex(f.poly, 'x', false)})`).join(''))}`;
          }
        }
        listWrap.appendChild(htmlEl('div', {
          style: {
            padding: '6px 10px', borderRadius: '7px',
            border: `1.5px solid ${cycFocusD === d ? col : 'var(--border-color)'}`,
            background: cycFocusD === d ? 'var(--bg-subtle)' : 'var(--bg-panel)',
            fontSize: '12.5px', cursor: 'pointer',
          },
          onClick: () => { cycFocusD = d; renderAll(); },
          innerHTML: `<strong style="color:${col};">Φ_${d}(x)</strong> = ${renderTex(M.polyToLatex(phiCoeffs, 'x', false))}${extra}`,
        }));
      });
      rightBody.appendChild(listWrap);

      if (cycProjP > 0 && cycN % cycProjP === 0) {
        rightBody.appendChild(htmlEl('div', {
          className: 'formula-banner warn',
          style: { marginTop: '8px', fontSize: '12px' },
        }, `注意（p.311）：此时 n=${cycN} 是特征 p=${cycProjP} 的倍数，x^n - 1 = (x^k - 1)^{p^m} 出现重根，域中不再有 n 个相异 n 次单位根！`));
      }

      rightPanel.appendChild(rightBody);
      grid.appendChild(rightPanel);
    }

    renderAll();
    return { applyPreset };
  }

  DM2.Labs.ch67 = {
    id: 'ch67',
    title: '6.7 多项式与分圆',
    badge: '降幂 · 微商 · Φₙ',
    subtitle: '带余/辗转相除、相等vs恒等、微商重根、四域分解与单位圆分圆仪',
    render,
  };
})(window);
