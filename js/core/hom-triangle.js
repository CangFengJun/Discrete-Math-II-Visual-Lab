/* Shared Interactive 3-Circle Commutative Homomorphism Triangle Component (DM2.HomTriangle)
 * Faithfully merges:
 *  - Blackboard 3-Circle Ring/Group Homomorphism Triangle (Source R/G -> Target R'/G', Quotient R/N or G/N)
 *  - 6.8 Finite Field Slide (R_p[x] -> F, R_p[x]/psi(x)R_p[x] ~= F with nested R_p & psi(x) kernel!)
 * Shows First, Second, and Third Homomorphism Theorems interactively!
 */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  const M = DM2.Math;
  const { el, createSvg, htmlEl, PALETTE, bindTooltip } = DM2.Svg;
  const { renderTex } = DM2.KaTeX;

  const SCENARIOS = {
    grp_z12_z4: {
      kind: 'group',
      name: '群同态 (6.4)：σ: (Z₁₂, +) → (Z₄, +), x ↦ x mod 4',
      srcTitle: 'G = (Z₁₂, +)',
      dstTitle: "G' = (Z₄, +)",
      quoTitle: 'G/N = Z₁₂/N',
      mapLabel: '同态映射 σ(x) = x mod 4',
      natLabel: '自然同态 x ↦ x+N',
      isoTex: '\\frac{Z_{12}}{\\{0,4,8\\}} \\cong Z_4',
      kernelLabel: '核 N = {0, 4, 8}',
      opSym: '+',
      sectors: [
        { label: 'N', elems: ['0', '4', '8'], rep: '0', target: "0'", quo: 'N', isKernel: true },
        { label: '1+N', elems: ['1', '5', '9'], rep: '1', target: "1'", quo: '1+N' },
        { label: '2+N', elems: ['2', '6', '10'], rep: '2', target: "2'", quo: '2+N' },
        { label: '3+N', elems: ['3', '7', '11'], rep: '3', target: "3'", quo: '3+N' },
      ],
      combine: (i, j) => (i + j) % 4,
    },
    grp_s3_sgn: {
      kind: 'group',
      name: '群同态 (6.4)：σ: S₃ → ({+1, -1}, ×) 奇偶符号映射',
      srcTitle: 'G = S₃ (6元)',
      dstTitle: "G' = {+1, -1}",
      quoTitle: 'S₃ / A₃',
      mapLabel: '奇偶同态 σ(π) = sgn(π)',
      natLabel: '自然同态 π ↦ πA₃',
      isoTex: '\\frac{S_3}{A_3} \\cong \\{+1, -1\\}',
      kernelLabel: '核 N = A₃',
      opSym: '·',
      sectors: [
        { label: 'A₃', elems: ['1', '(1 2 3)', '(1 3 2)'], rep: '1', target: '+1', quo: 'A₃', isKernel: true },
        { label: '(1 2)A₃', elems: ['(1 2)', '(1 3)', '(2 3)'], rep: '(1 2)', target: '-1', quo: '(1 2)A₃' },
      ],
      combine: (i, j) => (i + j) % 2,
    },
    ring_z12_z4: {
      kind: 'ring',
      name: '环同态 (6.5 黑板原图)：σ: I/12I → I/4I, [a]₁₂ ↦ [a]₄',
      srcTitle: 'R = I/12I',
      dstTitle: "R' = I/4I",
      quoTitle: 'R / N',
      mapLabel: '环同态 σ([a]₁₂) = [a]₄',
      natLabel: '自然同态 a ↦ a+N',
      isoTex: '\\frac{R}{N} \\cong R\' \\ (N=4R)',
      kernelLabel: '核理想 N = {0, 4, 8}',
      opSym: '·',
      sectors: [
        { label: 'N', elems: ['0', '4', '8'], rep: '0', target: "0'", quo: 'N', isKernel: true },
        { label: '1+N', elems: ['1', '5', '9'], rep: '1', target: "1'", quo: '1+N' },
        { label: '2+N', elems: ['2', '6', '10'], rep: '2', target: "2'", quo: '2+N' },
        { label: '3+N', elems: ['3', '7', '11'], rep: '3', target: "3'", quo: '3+N' },
      ],
      combine: (i, j) => (i * j) % 4,
    },
    ring_z12_z3_max: {
      kind: 'ring',
      name: '极大理想环同态 (6.5)：σ: I/12I → I/3I (商出 3 元域！)',
      srcTitle: 'R = I/12I',
      dstTitle: "R' = I/3I (域!)",
      quoTitle: 'R / N (域)',
      mapLabel: '环同态 σ([a]₁₂) = [a]₃',
      natLabel: '自然同态 a ↦ a+N',
      isoTex: '\\frac{I/12I}{3I/12I} \\cong Z_3\\ (\\text{域})',
      kernelLabel: '极大理想 N = {0, 3, 6, 9}',
      opSym: '·',
      sectors: [
        { label: 'N', elems: ['0', '3', '6', '9'], rep: '0', target: "0'", quo: 'N', isKernel: true },
        { label: '1+N', elems: ['1', '4', '7', '10'], rep: '1', target: "1'", quo: '1+N' },
        { label: '2+N', elems: ['2', '5', '8', '11'], rep: '2', target: "2'", quo: '2+N' },
      ],
      combine: (i, j) => (i * j) % 3,
    },
    gf_4: {
      kind: 'gf',
      p: 2,
      n: 2,
      psi: [1, 1, 1], // x^2 + x + 1
      name: '有限域构造 (6.8 课件图)：σ: R₂[x] → GF(4), f(x) ↦ f(ξ) [ψ=x²+x+1]',
      srcTitle: 'R₂[x]',
      dstTitle: 'F = GF(4)',
      quoTitle: 'R₂[x] / (ψ(x)R₂[x])',
      mapLabel: '代值同态 σ(f(x)) = f(ξ)',
      natLabel: '自然同态 f(x) ↦ f̄(x)',
      isoTex: '\\frac{R_2[x]}{(x^2+x+1)R_2[x]} \\cong GF(4)',
      kernelLabel: '核 ψ(x)R₂[x]',
    },
    gf_8: {
      kind: 'gf',
      p: 2,
      n: 3,
      psi: [1, 0, 1, 1], // x^3 + x + 1
      name: '有限域构造 (6.8 经典 8 元域)：σ: R₂[x] → GF(8), f(x) ↦ f(ξ) [ψ=x³+x+1]',
      srcTitle: 'R₂[x]',
      dstTitle: 'F = GF(8)',
      quoTitle: 'R₂[x] / (ψ(x)R₂[x])',
      mapLabel: '代值同态 σ(f(x)) = f(ξ)',
      natLabel: '自然同态 f(x) ↦ r̄(x)',
      isoTex: '\\frac{R_2[x]}{(x^3+x+1)R_2[x]} \\cong GF(8)',
      kernelLabel: '核 ψ(x)R₂[x]',
    },
  };

  function buildGfSectors(sc) {
    const gf = M.buildGF(sc.p, sc.n, sc.psi);
    const sectors = gf.elements.map((e) => {
      if (e.idx === 0) {
        return {
          label: 'ψ(x)Rₚ[x]',
          elems: ['0', 'ψ(x)', 'x·ψ(x)'],
          rep: '0',
          target: '0 (=ψ(ξ))',
          quo: '[0]=[ψ]',
          isKernel: true,
          elemIdx: 0,
        };
      }
      const rPolyStr = e.plain.replace(/ξ/g, 'x');
      // Find representative higher power matching this element if any
      const powMatch = gf.powerRing.find((pr) => pr.idx === e.idx);
      const xPowStr = powMatch && powMatch.exp >= sc.n ? `x^${powMatch.exp}` : null;
      const elems = xPowStr ? [rPolyStr, xPowStr] : [rPolyStr];
      return {
        label: `${rPolyStr}+N`,
        elems,
        rep: rPolyStr,
        target: e.plain,
        quo: `[${rPolyStr}]`,
        elemIdx: e.idx,
      };
    });
    return { gf, sectors };
  }

  function mount(hostEl, initialScenario = 'grp_z12_z4') {
    let scKey = SCENARIOS[initialScenario] ? initialScenario : 'grp_z12_z4';
    let thmMode = 'all'; // 'all' | 'thm1' | 'thm2' | 'thm3'
    let activeSector = 1;
    let mulA = 1;
    let mulB = 1;
    let customPolyStr = '1, 0, 1, 1, 0'; // x^4 + x^2 + x in R_2[x]

    function render() {
      hostEl.innerHTML = '';
      const sc = SCENARIOS[scKey];
      let gfObj = null;
      let sectors = sc.sectors;
      let combineFn = sc.combine;
      if (sc.kind === 'gf') {
        const built = buildGfSectors(sc);
        gfObj = built.gf;
        sectors = built.sectors;
        combineFn = (i, j) => gfObj.mulTable[i][j];
      }
      if (activeSector >= sectors.length) activeSector = 0;
      if (mulA >= sectors.length) mulA = 1 % sectors.length;
      if (mulB >= sectors.length) mulB = 1 % sectors.length;

      // Top Controls Bar
      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '选择同态体系：'),
          (() => {
            const sel = htmlEl('select', { className: 'ctrl-select' });
            for (const [k, v] of Object.entries(SCENARIOS)) {
              const o = htmlEl('option', { value: k }, v.name);
              if (k === scKey) o.selected = true;
              sel.appendChild(o);
            }
            sel.addEventListener('change', () => {
              scKey = sel.value;
              activeSector = 1;
              mulA = 1;
              mulB = Math.min(2, (SCENARIOS[scKey].sectors ? SCENARIOS[scKey].sectors.length : 4) - 1);
              render();
            });
            return sel;
          })(),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '聚焦三角定理边：'),
          ...[
            ['all', '交换三角全貌'],
            ['thm1', '① 第一同态定理 (σ)'],
            ['thm2', '② 第二同态定理 (自然同态)'],
            ['thm3', '③ 第三同态定理 (同构 ≅)'],
          ].map(([mk, ml]) => htmlEl('button', {
            className: `btn btn-sm ${thmMode === mk ? 'btn-primary' : ''}`,
            onClick: () => { thmMode = mk; render(); },
          }, ml)),
        ]),
      ]);
      hostEl.appendChild(bar);

      // Custom polynomial evaluation probe in 6.8 Finite Field mode!
      let customProbeInfo = null;
      if (sc.kind === 'gf') {
        const rawArr = customPolyStr
          .split(/[\s,，]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map(Number)
          .filter((v) => Number.isInteger(v));
        const polyBar = htmlEl('div', { className: 'controls-bar' }, [
          htmlEl('div', { className: 'ctrl-group' }, [
            htmlEl('label', {}, `投射任意多项式 f(x) ∈ R_${sc.p}[x]（降幂系数）：`),
            (() => {
              const inp = htmlEl('input', { className: 'ctrl-input', value: customPolyStr, style: { width: '130px' } });
              inp.addEventListener('input', () => {
                customPolyStr = inp.value;
              });
              inp.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') {
                  customPolyStr = inp.value;
                  render();
                }
              });
              return inp;
            })(),
            htmlEl('button', {
              className: 'btn btn-sm',
              onClick: () => {
                const parsed = customPolyStr
                  .split(/[\s,，]+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map(Number)
                  .filter((v) => Number.isInteger(v));
                if (parsed.length > 0) {
                  const fNorm = M.polyNormFp(parsed, sc.p);
                  const { r } = M.polyDivModFp(fNorm, sc.psi, sc.p);
                  // Convert descending r to ascending vec index
                  let idx = 0;
                  for (let i = 0; i < r.length; i++) {
                    const pow = r.length - 1 - i;
                    idx += r[i] * Math.pow(sc.p, pow);
                  }
                  activeSector = idx;
                  render();
                }
              },
            }, '▶ 追踪 f(x) 落入的陪集与像'),
          ]),
        ]);
        if (rawArr.length > 0) {
          const fNorm = M.polyNormFp(rawArr, sc.p);
          const { q, r } = M.polyDivModFp(fNorm, sc.psi, sc.p);
          customProbeInfo = {
            fTex: M.polyToLatex(fNorm, 'x', false),
            qTex: M.polyToLatex(q, 'x', false),
            rTex: M.polyToLatex(r, 'x', false),
            rXiTex: M.polyToLatex(r, '\\xi', false),
          };
          polyBar.appendChild(htmlEl('span', {
            className: 'chip ok',
            innerHTML: renderTex(`f(x) = (${customProbeInfo.qTex})\\psi(x) + (${customProbeInfo.rTex}) \\implies f(\\xi) = ${customProbeInfo.rXiTex}`),
          }));
        }
        hostEl.appendChild(polyBar);
      }

      // Main 3-Circle Commutative Triangle SVG
      const panel = htmlEl('div', { className: 'panel' });
      panel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '三圆同态基本定理可交互三角图（点击左上圆任一扇区/内核、下方商点或右上像点）'),
        htmlEl('span', { className: 'chip' }, `当前追踪：${sectors[activeSector].label} → ${sectors[activeSector].quo} ↔ ${sectors[activeSector].target}`),
      ]));
      const body = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(780, 425);
      box.appendChild(svg);

      const srcC = { x: 185, y: 148, R: 112, rIn: 42 };
      const dstC = { x: 595, y: 148, R: 102 };
      const quoC = { x: 390, y: 332, R: 76 };

      // 1. Draw Triangle Arrows FIRST (so circle nodes draw cleanly over endpoints)
      const op1 = (thmMode === 'all' || thmMode === 'thm1') ? 1 : 0.14;
      const op2 = (thmMode === 'all' || thmMode === 'thm2') ? 1 : 0.14;
      const op3 = (thmMode === 'all' || thmMode === 'thm3') ? 1 : 0.14;

      // Top edge label (First Theorem)
      svg.appendChild(el('text', {
        x: 390, y: 24, 'text-anchor': 'middle', fill: 'var(--accent-rose)', 'font-size': 13, 'font-weight': 800, opacity: op1,
      }, `① ${sc.mapLabel}（第一同态定理）`));

      // Left-bottom edge label (Second Theorem)
      svg.appendChild(el('text', {
        x: 205, y: 318, 'text-anchor': 'middle', fill: 'var(--accent-amber)', 'font-size': 12.5, 'font-weight': 800, opacity: op2,
      }, `② ${sc.natLabel}`));
      svg.appendChild(el('text', {
        x: 205, y: 335, 'text-anchor': 'middle', fill: 'var(--text-muted)', 'font-size': 11, opacity: op2,
      }, '（第二同态定理：陪集压成点）'));

      // Right-bottom edge label (Third Theorem)
      svg.appendChild(el('text', {
        x: 580, y: 318, 'text-anchor': 'middle', fill: 'var(--accent-green)', 'font-size': 12.5, 'font-weight': 800, opacity: op3,
      }, '③ 同构 1-1 双射 ≅'));
      svg.appendChild(el('text', {
        x: 580, y: 335, 'text-anchor': 'middle', fill: 'var(--text-muted)', 'font-size': 11, opacity: op3,
      }, '（第三同态定理）'));

      // Compute coordinates for outer sectors (index 1..k) and kernel (index 0)
      const outerSectors = sectors.slice(1);
      const mOut = outerSectors.length;
      const srcPoints = new Map();
      const dstPoints = new Map();
      const quoPoints = new Map();

      // Kernel coords (index 0)
      srcPoints.set(0, { x: srcC.x, y: srcC.y, isKernel: true });
      dstPoints.set(0, { x: dstC.x, y: dstC.y - (sc.kind === 'gf' ? 14 : 0) });
      quoPoints.set(0, { x: quoC.x, y: quoC.y - 8 });

      outerSectors.forEach((sec, oi) => {
        const idx = oi + 1;
        const midAng = -Math.PI / 2 + ((oi + 0.5) * 2 * Math.PI) / mOut;
        const rMid = (srcC.rIn + srcC.R) / 2 + 4;
        srcPoints.set(idx, {
          x: srcC.x + rMid * Math.cos(midAng),
          y: srcC.y + rMid * Math.sin(midAng),
          ang: midAng,
        });

        const dstAng = -Math.PI / 2 + (oi * 2 * Math.PI) / mOut;
        const dstR = mOut <= 3 ? 52 : 66;
        dstPoints.set(idx, {
          x: dstC.x + dstR * Math.cos(dstAng),
          y: dstC.y + dstR * Math.sin(dstAng),
        });

        const quoAng = -Math.PI / 2 + ((oi + 0.5) * 2 * Math.PI) / mOut;
        const quoR = mOut <= 3 ? 40 : 48;
        quoPoints.set(idx, {
          x: quoC.x + quoR * Math.cos(quoAng),
          y: quoC.y + quoR * Math.sin(quoAng),
        });
      });

      // Draw ALL mapping arrows (muted for inactive, vibrant glowing rays for activeSector!)
      for (let i = 0; i < sectors.length; i++) {
        const isAct = i === activeSector;
        const sp = srcPoints.get(i);
        const dp = dstPoints.get(i);
        const qp = quoPoints.get(i);

        // Edge 1: Source -> Target (Sigma)
        svg.appendChild(el('path', {
          d: `M ${sp.x} ${sp.y} Q ${(sp.x + dp.x) / 2} ${Math.min(sp.y, dp.y) - 42}, ${dp.x} ${dp.y}`,
          fill: 'none',
          stroke: isAct ? 'var(--accent-rose)' : 'var(--svg-line-muted)',
          'stroke-width': isAct ? 2.8 : 1.1,
          'stroke-opacity': isAct ? op1 : op1 * 0.45,
          'marker-end': isAct ? 'url(#arrow-rose)' : 'none',
        }));

        // Edge 2: Source -> Quotient (Natural Homomorphism)
        svg.appendChild(el('path', {
          d: `M ${sp.x} ${sp.y} Q ${sp.x + 28} ${(sp.y + qp.y) / 2 + 20}, ${qp.x} ${qp.y}`,
          fill: 'none',
          stroke: isAct ? 'var(--accent-amber)' : 'var(--svg-line-muted)',
          'stroke-width': isAct ? 2.8 : 1.1,
          'stroke-opacity': isAct ? op2 : op2 * 0.45,
          'marker-end': isAct ? 'url(#arrow-amber)' : 'none',
        }));

        // Edge 3: Quotient <-> Target (Isomorphism)
        svg.appendChild(el('path', {
          d: `M ${qp.x} ${qp.y} Q ${(qp.x + dp.x) / 2 + 30} ${(qp.y + dp.y) / 2 + 16}, ${dp.x} ${dp.y}`,
          fill: 'none',
          stroke: isAct ? 'var(--accent-green)' : 'var(--svg-line-muted)',
          'stroke-width': isAct ? 2.8 : 1.2,
          'stroke-opacity': isAct ? op3 : op3 * 0.5,
          'marker-start': isAct ? 'url(#arrow-green)' : 'none',
          'marker-end': isAct ? 'url(#arrow-green)' : 'none',
        }));
      }

      // 2. Top-Left Circle: Radial Pie + Kernel Circle (+ Nested R_p in 6.8!)
      svg.appendChild(el('text', {
        x: srcC.x, y: 24, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 13.5, 'font-weight': 800,
      }, sc.srcTitle));

      // Draw outer radial pie sectors
      outerSectors.forEach((sec, oi) => {
        const idx = oi + 1;
        const a0 = -Math.PI / 2 + (oi * 2 * Math.PI) / mOut;
        const a1 = -Math.PI / 2 + ((oi + 1) * 2 * Math.PI) / mOut;
        const x1o = srcC.x + srcC.R * Math.cos(a0), y1o = srcC.y + srcC.R * Math.sin(a0);
        const x2o = srcC.x + srcC.R * Math.cos(a1), y2o = srcC.y + srcC.R * Math.sin(a1);
        const x1i = srcC.x + srcC.rIn * Math.cos(a1), y1i = srcC.y + srcC.rIn * Math.sin(a1);
        const x2i = srcC.x + srcC.rIn * Math.cos(a0), y2i = srcC.y + srcC.rIn * Math.sin(a0);
        const largeArc = (a1 - a0) > Math.PI ? 1 : 0;

        const dSector = `M ${x1o.toFixed(1)} ${y1o.toFixed(1)} `
          + `A ${srcC.R} ${srcC.R} 0 ${largeArc} 1 ${x2o.toFixed(1)} ${y2o.toFixed(1)} `
          + `L ${x1i.toFixed(1)} ${y1i.toFixed(1)} `
          + `A ${srcC.rIn} ${srcC.rIn} 0 ${largeArc} 0 ${x2i.toFixed(1)} ${y2i.toFixed(1)} Z`;

        const col = PALETTE[(idx) % PALETTE.length];
        const isSel = activeSector === idx;
        const gSec = el('g', { class: 'svg-clickable' });
        gSec.appendChild(el('path', {
          d: dSector,
          fill: col,
          'fill-opacity': isSel ? 0.30 : 0.10,
          stroke: isSel ? col : 'var(--border-strong)',
          'stroke-width': isSel ? 2.4 : 1.2,
        }));
        const pt = srcPoints.get(idx);
        gSec.appendChild(el('text', {
          x: pt.x, y: pt.y - 2, 'text-anchor': 'middle',
          fill: isSel ? 'var(--text-primary)' : col, 'font-size': mOut > 6 ? 9.5 : 11, 'font-weight': 800,
        }, sec.rep));
        if (mOut <= 6) {
          gSec.appendChild(el('text', {
            x: pt.x, y: pt.y + 12, 'text-anchor': 'middle',
            fill: 'var(--text-muted)', 'font-size': 9,
          }, sec.elems.slice(0, 3).join(', ')));
        }
        gSec.addEventListener('click', () => { activeSector = idx; render(); });
        bindTooltip(gSec, () => `<strong>陪集扇区 ${sec.label}</strong><br>代表元素：${sec.elems.join(', ')}<br>全部射向 ${sec.target}`);
        svg.appendChild(gSec);
      });

      // Draw Inner Kernel Circle N
      const kerSel = activeSector === 0;
      const gKer = el('g', { class: 'svg-clickable' });
      gKer.appendChild(el('circle', {
        cx: srcC.x, cy: srcC.y, r: srcC.rIn,
        fill: kerSel ? 'var(--accent-amber-soft)' : 'var(--bg-panel)',
        stroke: 'var(--accent-amber)',
        'stroke-width': kerSel ? 3 : 2,
      }));
      gKer.appendChild(el('text', {
        x: srcC.x, y: srcC.y - 4, 'text-anchor': 'middle',
        fill: 'var(--accent-amber)', 'font-size': 11, 'font-weight': 800,
      }, sc.kind === 'gf' ? 'ψ(x)Rₚ[x]' : '核 N'));
      gKer.appendChild(el('text', {
        x: srcC.x, y: srcC.y + 11, 'text-anchor': 'middle',
        fill: 'var(--text-muted)', 'font-size': 9.5, 'font-weight': 600,
      }, sectors[0].elems.slice(0, 2).join(', ')));
      gKer.addEventListener('click', () => { activeSector = 0; render(); });
      bindTooltip(gKer, () => `<strong>${sc.kernelLabel}</strong><br>元素：${sectors[0].elems.join(', ')}<br>全部塌缩到 ${sectors[0].target}`);
      svg.appendChild(gKer);

      // In 6.8 Finite Field mode, add the nested R_p badge just like PPT slide!
      if (sc.kind === 'gf') {
        svg.appendChild(el('circle', {
          cx: srcC.x - 36, cy: srcC.y + 52, r: 24,
          fill: 'var(--accent-teal-soft)', stroke: 'var(--accent-teal)', 'stroke-width': 1.4, 'stroke-dasharray': '3 2',
        }));
        svg.appendChild(el('text', {
          x: srcC.x - 36, y: srcC.y + 56, 'text-anchor': 'middle',
          fill: 'var(--accent-teal)', 'font-size': 10.5, 'font-weight': 800,
        }, `R_${sc.p}`));
      }

      // 3. Top-Right Circle: Target Structure
      svg.appendChild(el('text', {
        x: dstC.x, y: 24, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 13.5, 'font-weight': 800,
      }, sc.dstTitle));
      svg.appendChild(el('circle', {
        cx: dstC.x, cy: dstC.y, r: dstC.R,
        fill: 'var(--accent-teal-soft)', 'fill-opacity': 0.35,
        stroke: 'var(--accent-teal)', 'stroke-width': 2.2,
      }));
      if (sc.kind === 'gf') {
        // Nested prime subfield R_p inside F
        svg.appendChild(el('circle', {
          cx: dstC.x, cy: dstC.y - 12, r: 34,
          fill: 'var(--bg-panel)', 'fill-opacity': 0.55,
          stroke: 'var(--accent-rose)', 'stroke-width': 1.4,
        }));
        svg.appendChild(el('text', {
          x: dstC.x + 18, y: dstC.y + 8, fill: 'var(--accent-rose)', 'font-size': 9.5, 'font-weight': 700,
        }, `R_${sc.p}`));
      }
      for (let i = 0; i < sectors.length; i++) {
        const dp = dstPoints.get(i);
        const isAct = i === activeSector;
        const col = i === 0 ? 'var(--accent-amber)' : PALETTE[i % PALETTE.length];
        const txt = i === 0 && sc.kind === 'gf' ? '0' : sectors[i].target;
        const rxW = Math.max(24, txt.length * 6.5 + 10);
        const gDst = el('g', { class: 'svg-clickable' });
        gDst.appendChild(el('rect', {
          x: dp.x - rxW / 2, y: dp.y - 12, width: rxW, height: 24, rx: 12,
          fill: isAct ? col : 'var(--bg-panel)',
          stroke: col, 'stroke-width': isAct ? 2.4 : 1.8,
        }));
        gDst.appendChild(el('text', {
          x: dp.x, y: dp.y + 3.5, 'text-anchor': 'middle',
          fill: isAct ? '#FFFFFF' : 'var(--text-primary)',
          'font-size': mOut > 6 ? 8.5 : 10, 'font-weight': 800,
        }, txt));
        gDst.addEventListener('click', () => { activeSector = i; render(); });
        svg.appendChild(gDst);
      }

      // 4. Bottom-Center Circle: Quotient Structure G/N, R/N, or R_p[x]/(psi(x))
      svg.appendChild(el('circle', {
        cx: quoC.x, cy: quoC.y, r: quoC.R,
        fill: 'var(--accent-cyan)', 'fill-opacity': 0.22,
        stroke: 'var(--accent-blue)', 'stroke-width': 2.4,
      }));
      svg.appendChild(el('text', {
        x: quoC.x, y: quoC.y + quoC.R + 16, 'text-anchor': 'middle',
        fill: 'var(--accent-blue)', 'font-size': 12.5, 'font-weight': 800,
      }, sc.quoTitle));

      for (let i = 0; i < sectors.length; i++) {
        const qp = quoPoints.get(i);
        const isAct = i === activeSector;
        const col = i === 0 ? 'var(--accent-amber)' : PALETTE[i % PALETTE.length];
        const qTxt = sectors[i].quo;
        const qW = Math.max(24, qTxt.length * 6.2 + 10);
        const gQuo = el('g', { class: 'svg-clickable' });
        gQuo.appendChild(el('rect', {
          x: qp.x - qW / 2, y: qp.y - 11.5, width: qW, height: 23, rx: 11.5,
          fill: isAct ? col : 'var(--bg-panel)',
          stroke: col, 'stroke-width': isAct ? 2.4 : 1.8,
        }));
        gQuo.appendChild(el('text', {
          x: qp.x, y: qp.y + 3.5, 'text-anchor': 'middle',
          fill: isAct ? '#FFFFFF' : 'var(--text-primary)',
          'font-size': mOut > 6 ? 8.2 : 9.5, 'font-weight': 800,
        }, qTxt));
        gQuo.addEventListener('click', () => { activeSector = i; render(); });
        svg.appendChild(gQuo);
      }

      body.appendChild(box);

      // Interactive Operation Preservation Verifier across the 3 circles!
      const sA = sectors[mulA], sB = sectors[mulB];
      const resIdx = combineFn(mulA, mulB);
      const sRes = sectors[resIdx];
      body.appendChild(htmlEl('div', { className: 'controls-bar', style: { marginTop: '10px' } }, [
        htmlEl('span', { style: { fontWeight: 700, fontSize: '12px' } }, '三圆同步运算验证（同态保持运算）：'),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, 'A ='),
          (() => {
            const s = htmlEl('select', { className: 'ctrl-select' });
            sectors.forEach((sec, idx) => {
              const o = htmlEl('option', { value: idx }, `${sec.rep} ∈ ${sec.label}`);
              if (idx === mulA) o.selected = true;
              s.appendChild(o);
            });
            s.addEventListener('change', () => { mulA = Number(s.value); activeSector = combineFn(mulA, mulB); render(); });
            return s;
          })(),
        ]),
        htmlEl('span', { style: { fontWeight: 800 } }, sc.opSym || '·'),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, 'B ='),
          (() => {
            const s = htmlEl('select', { className: 'ctrl-select' });
            sectors.forEach((sec, idx) => {
              const o = htmlEl('option', { value: idx }, `${sec.rep} ∈ ${sec.label}`);
              if (idx === mulB) o.selected = true;
              s.appendChild(o);
            });
            s.addEventListener('change', () => { mulB = Number(s.value); activeSector = combineFn(mulA, mulB); render(); });
            return s;
          })(),
        ]),
        htmlEl('span', { className: 'chip ok' },
          `商圆：(${sA.quo})${sc.opSym || '·'}(${sB.quo}) = ${sRes.quo}  ≅  像圆：${sA.target}${sc.opSym || '·'}${sB.target} = ${sRes.target}`),
      ]));

      const toTexSafe = (str) => String(str)
        .replace(/ξ/g, '\\xi ')
        .replace(/ψ/g, '\\psi ')
        .replace(/\[([^\]]+)\]/g, '\\overline{$1}');
      body.appendChild(htmlEl('div', {
        className: 'formula-banner info',
        style: { marginTop: '8px' },
        innerHTML: renderTex(`${sc.isoTex} \\quad | \\quad \\sigma(${toTexSafe(sectors[activeSector].rep)}) = ${toTexSafe(sectors[activeSector].target)} \\longleftrightarrow ${toTexSafe(sectors[activeSector].quo)}`),
      }));

      panel.appendChild(body);
      hostEl.appendChild(panel);
    }

    render();
  }

  DM2.HomTriangle = { mount };
})(window);
