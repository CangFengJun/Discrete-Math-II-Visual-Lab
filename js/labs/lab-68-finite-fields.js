/* 6.8 Finite Fields GF(p^n) Lab:
 * 1) 3-Step Quotient Construction Pipeline R_p[x] / (psi(x)R_p[x])
 * 2) Dual-Geometry Morph Canvas: Additive Vector Space (3D Cube / Lattice / Tesseract) <-> Multiplicative Cyclic Ring
 * 3) Interactive Addition/Multiplication Tables + Element Power Explorer
 * 4) Theorem 6.8.5 Subfield Divisor Hasse Lattice & Nested Venn Rings (GF(p^m) ⊆ GF(p^n) <=> m | n)
 */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  DM2.Labs = DM2.Labs || {};
  const M = DM2.Math;
  const { el, createSvg, htmlEl, PALETTE, animateTween, bindTooltip } = DM2.Svg;
  const { renderTex } = DM2.KaTeX;

  const GF_OPTIONS = [
    { key: '2_2', p: 2, n: 2, label: 'GF(2²) = GF(4)' },
    { key: '2_3', p: 2, n: 3, label: 'GF(2³) = GF(8) [课件经典例]' },
    { key: '3_2', p: 3, n: 2, label: 'GF(3²) = GF(9)' },
    { key: '2_4', p: 2, n: 4, label: 'GF(2⁴) = GF(16)' },
    { key: '5_2', p: 5, n: 2, label: 'GF(5²) = GF(25)' },
  ];

  const SUBFIELD_CASES = [
    { key: '2_6', p: 2, n: 6, label: 'GF(2⁶) = GF(64)' },
    { key: '2_8', p: 2, n: 8, label: 'GF(2⁸) = GF(256)' },
    { key: '2_12', p: 2, n: 12, label: 'GF(2¹²) = GF(4096)' },
    { key: '3_6', p: 3, n: 6, label: 'GF(3⁶) = GF(729)' },
  ];

  function render(container, ctx) {
    let tab = 'morph'; // 'morph' | 'subfields'
    let gfKey = '2_3';
    let psiIdx = 0;
    let morphT = 0; // 0 = Additive Vector Space, 1 = Multiplicative Cyclic Ring
    let cancelMorph = null;
    let cubeYaw = 0.55;
    let cubePitch = 0.42;
    let elemA = 2; // xi
    let elemB = 4; // xi^2 in GF(8)
    let tableOp = 'mul'; // 'add' | 'mul'

    let sfKey = '2_12';
    let sfSelectedM = 4;

    function getCurrentGF() {
      const opt = GF_OPTIONS.find((o) => o.key === gfKey) || GF_OPTIONS[1];
      const factors = M.getPrimitivePolynomials(opt.p, opt.n);
      if (psiIdx >= factors.length) psiIdx = 0;
      const gf = M.buildGF(opt.p, opt.n, factors[psiIdx]);
      if (elemA >= gf.q) elemA = 1;
      if (elemB >= gf.q) elemB = Math.min(2, gf.q - 1);
      return { opt, factors, gf };
    }

    function applyPreset(p) {
      if (!p) return;
      if (p === 'gf-subfields') {
        tab = 'subfields';
      } else if (p === 'gf-triangle') {
        tab = 'triangle';
      } else if (p === 'gf8-mul-ring') {
        tab = 'morph';
        gfKey = '2_3';
        morphT = 1;
      } else {
        tab = 'morph';
        gfKey = '2_3';
        morphT = 0;
      }
      renderAll();
    }

    function renderAll() {
      container.innerHTML = '';

      const header = htmlEl('div', { className: 'lab-header' }, [
        htmlEl('div', { className: 'lab-title-wrap' }, [
          htmlEl('h1', {}, [
            '6.8 有限域（Galois 域 GF(pⁿ)）',
            htmlEl('span', { className: 'lab-badge' }, '6.8 课件 p.1–27 · 向量空间 ↔ 循环圆环'),
          ]),
          htmlEl('p', { className: 'lab-desc' }, '同一个有限域同时长着两副面孔：加法下是 pⁿ 格点/立方体向量空间，乘法下非零元是 (q-1) 元循环圆环——通过模去质式 ψ(x) 浑然一体。'),
        ]),
        htmlEl('div', { className: 'lab-tabs' }, [
          htmlEl('button', {
            className: `lab-tab ${tab === 'morph' ? 'active' : ''}`,
            onClick: () => { tab = 'morph'; renderAll(); },
          }, '构造流水线 & 空间↔圆环变形'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'triangle' ? 'active' : ''}`,
            onClick: () => { tab = 'triangle'; renderAll(); },
          }, 'Rₚ[x] → GF(pⁿ) 三圆同态构造三角'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'subfields' ? 'active' : ''}`,
            onClick: () => { tab = 'subfields'; renderAll(); },
          }, '子域整除格 & 嵌套 Venn 环 (m|n)'),
        ]),
      ]);
      container.appendChild(header);

      if (tab === 'morph') renderMorphTab();
      else if (tab === 'triangle') {
        const host = htmlEl('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
        container.appendChild(host);
        DM2.HomTriangle.mount(host, 'gf_8');
      } else renderSubfieldsTab();
    }

    // -------------------------------------------------------------------------
    // Tab 1: Construction Pipeline + Dual Geometry Morph + Tables
    // -------------------------------------------------------------------------
    function renderMorphTab() {
      const { opt, factors, gf } = getCurrentGF();

      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '选择有限域：'),
          ...GF_OPTIONS.map((o) => htmlEl('button', {
            className: `btn btn-sm ${gfKey === o.key ? 'active' : ''}`,
            onClick: () => {
              gfKey = o.key;
              psiIdx = 0;
              elemA = Math.min(o.p, Math.pow(o.p, o.n) - 1);
              elemB = Math.min(o.p + 1, Math.pow(o.p, o.n) - 1);
              renderAll();
            },
          }, o.label)),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          (() => {
            const toSub = (num) => String(num).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
            const toSup = (num) => String(num).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);
            return htmlEl('label', {}, `选择 Φ${toSub(gf.q - 1)}(x) 的 ${gf.n} 次质式 ψ(x)：`);
          })(),
          (() => {
            const toSub = (num) => String(num).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
            const toSup = (num) => String(num).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);
            const sel = htmlEl('select', { className: 'ctrl-select' });
            factors.forEach((fac, idx) => {
              const txt = fac.map((c, i) => {
                const pow = fac.length - 1 - i;
                if (c === 0) return '';
                if (pow === 0) return String(c);
                return (c === 1 ? '' : String(c)) + (pow === 1 ? 'x' : `x${toSup(pow)}`);
              }).filter(Boolean).join(' + ');
              const o = htmlEl('option', { value: idx }, `ψ${toSub(idx + 1)}(x) = ${txt}`);
              if (idx === psiIdx) o.selected = true;
              sel.appendChild(o);
            });
            sel.addEventListener('change', () => { psiIdx = Number(sel.value); renderAll(); });
            return sel;
          })(),
        ]),
      ]);
      container.appendChild(bar);

      // 3-Step PPT Construction Summary Strip
      const psiTex = M.polyToLatex(gf.psi, 'x', false);
      const stepStrip = htmlEl('div', { className: 'grid-3' }, [
        htmlEl('div', { className: 'formula-banner info' }, [
          htmlEl('strong', {}, '① 取分圆多项式之质因式'),
          htmlEl('div', { innerHTML: renderTex(`\\psi(x) = ${psiTex} \\mid \\Phi_{${gf.q - 1}}(x)\\text{ in } R_{${gf.p}}[x]`) }),
          htmlEl('span', { style: { fontSize: '11.5px', color: 'var(--text-muted)' } }, `共找到 ${factors.length} 个 ${gf.n} 次质式，选任意一个都同构于唯一 GF(${gf.q})！`),
        ]),
        htmlEl('div', { className: 'formula-banner' }, [
          htmlEl('strong', {}, '② 商环折返降次规则'),
          htmlEl('div', { innerHTML: renderTex(`\\psi(\\xi)=0 \\implies \\xi^{${gf.n}} = ${gf.xiNReductionLatex}`) }),
          htmlEl('span', {
            style: { fontSize: '11.5px', color: 'var(--text-muted)' },
            innerHTML: `所有元素唯一写成 a<sub>0</sub>+a<sub>1</sub>ξ+…+a<sub>n-1</sub>ξ<sup>n-1</sup>（共 ${gf.p}<sup>${gf.n}</sup>=${gf.q} 个）`,
          }),
        ]),
        htmlEl('div', { className: 'formula-banner' }, [
          htmlEl('strong', {}, '③ 同构与单位根刻画'),
          htmlEl('div', { innerHTML: renderTex(`R_{${gf.p}}[x]/(\\psi(x)) \\cong GF(${gf.q})`) }),
          htmlEl('span', {
            style: { fontSize: '11.5px', color: 'var(--text-muted)' },
            innerHTML: `${renderTex(`x^{${gf.q}}-x=0`)}；ξ = x̄ 周期恰为 ${gf.q - 1}，生成全部非零元`,
          }),
        ]),
      ]);
      container.appendChild(stepStrip);

      // Morph Controls Bar
      const morphBar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('button', {
          className: 'btn btn-sm btn-primary',
          onClick: () => {
            if (cancelMorph) cancelMorph();
            const target = morphT < 0.5 ? 1 : 0;
            const start = morphT;
            cancelMorph = animateTween(800, (t) => {
              morphT = start + (target - start) * t;
              drawMorphCanvas();
            }, () => {
              morphT = target;
              renderAll();
            });
          },
        }, morphT < 0.5 ? '▶ 变形至「乘法循环圆环」视图' : '↺ 变形回「加法向量空间」视图'),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, `空间↔圆环插值 ${Math.round(morphT * 100)}%：`),
          (() => {
            const r = htmlEl('input', { className: 'ctrl-range', type: 'range', min: 0, max: 1, step: 0.02, value: morphT });
            r.addEventListener('input', () => {
              if (cancelMorph) cancelMorph();
              morphT = Number(r.value);
              drawMorphCanvas();
            });
            return r;
          })(),
        ]),
        (gf.p === 2 && gf.n === 3)
          ? htmlEl('div', { className: 'ctrl-group' }, [
              htmlEl('label', {}, '3D 立方体旋转视角：'),
              (() => {
                const r = htmlEl('input', { className: 'ctrl-range', type: 'range', min: -1.5, max: 1.5, step: 0.05, value: cubeYaw });
                r.addEventListener('input', () => { cubeYaw = Number(r.value); drawMorphCanvas(); });
                return r;
              })(),
            ])
          : null,
      ]);
      container.appendChild(morphBar);

      // Main Split: Left Morph SVG, Right Interactive Operation + Addition/Multiplication Table
      const split = htmlEl('div', { className: 'split-wide' });
      container.appendChild(split);

      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' },
          morphT < 0.5
            ? `加法向量空间视图（${gf.n} 维坐标平移）`
            : `乘法循环圆环视图（0 居圆心，外圈为 ${gf.q - 1} 元巡回群）`),
        htmlEl('span', { className: 'chip' }, '点击圆点轮流选定元素 A 与 B'),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(430, 360);
      box.appendChild(svg);
      leftBody.appendChild(box);
      leftPanel.appendChild(leftBody);
      split.appendChild(leftPanel);

      // Compute Additive Space Coordinates & Multiplicative Ring Coordinates for every element
      function getAddCoords(idx) {
        const vec = gf.elements[idx].vec;
        const cx = 215, cy = 178;
        if (gf.p === 2 && gf.n === 2) {
          return { x: cx + (vec[0] - 0.5) * 160, y: cy - (vec[1] - 0.5) * 150 };
        }
        if (gf.p === 2 && gf.n === 3) {
          // 3D rotation projection
          const ux = vec[0] - 0.5, uy = vec[1] - 0.5, uz = vec[2] - 0.5;
          const x1 = ux * Math.cos(cubeYaw) - uz * Math.sin(cubeYaw);
          const z1 = ux * Math.sin(cubeYaw) + uz * Math.cos(cubeYaw);
          const y2 = uy * Math.cos(cubePitch) - z1 * Math.sin(cubePitch);
          return { x: cx + x1 * 175, y: cy - y2 * 165 };
        }
        if (gf.p === 2 && gf.n === 4) {
          // 4D tesseract projection
          const x = (vec[0] - 0.5) * 135 + (vec[2] - 0.5) * 72;
          const y = -(vec[1] - 0.5) * 135 - (vec[3] - 0.5) * 72;
          return { x: cx + x, y: cy + y };
        }
        // p x p grid (GF(9) or GF(25))
        const span = gf.p === 3 ? 85 : 54;
        const mid = (gf.p - 1) / 2;
        return { x: cx + (vec[0] - mid) * span, y: cy - (vec[1] - mid) * span };
      }

      function getMulCoords(idx) {
        const cx = 215, cy = 178, R = 132;
        if (idx === 0) return { x: cx, y: cy };
        const exp = gf.elements[idx].powerExp;
        const ang = -Math.PI / 2 + (2 * Math.PI * exp) / (gf.q - 1);
        return { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
      }

      function getCoords(idx) {
        const a = getAddCoords(idx);
        const m = getMulCoords(idx);
        return {
          x: a.x + (m.x - a.x) * morphT,
          y: a.y + (m.y - a.y) * morphT,
        };
      }

      let pickTurn = 0; // alternates setting elemA and elemB on node click

      function drawMorphCanvas() {
        while (svg.childNodes.length > 1) svg.removeChild(svg.lastChild);

        const coords = gf.elements.map((e) => getCoords(e.idx));

        // Draw Additive lattice / cube edges when morphT < 0.75
        if (morphT < 0.75) {
          const edgeAlpha = (1 - morphT / 0.75) * 0.45;
          for (let i = 0; i < gf.q; i++) {
            for (let j = i + 1; j < gf.q; j++) {
              // Connect elements differing in 1 coordinate by 1 (mod p)
              let diffCoord = 0;
              for (let k = 0; k < gf.n; k++) {
                if (gf.elements[i].vec[k] !== gf.elements[j].vec[k]) diffCoord++;
              }
              if (diffCoord === 1) {
                svg.appendChild(el('line', {
                  x1: coords[i].x, y1: coords[i].y, x2: coords[j].x, y2: coords[j].y,
                  stroke: 'var(--border-strong)', 'stroke-width': 1.4, 'stroke-opacity': edgeAlpha,
                }));
              }
            }
          }
        }

        // Draw Multiplicative orbit circle when morphT > 0.25
        if (morphT > 0.25) {
          const ringAlpha = Math.min(1, (morphT - 0.25) / 0.5);
          svg.appendChild(el('circle', {
            cx: 215, cy: 178, r: 132, fill: 'none',
            stroke: 'var(--accent-teal)', 'stroke-width': 1.6, 'stroke-dasharray': '4 4',
            'stroke-opacity': ringAlpha * 0.65,
          }));
        }

        const sumIdx = gf.addTable[elemA][elemB];
        const prodIdx = gf.mulTable[elemA][elemB];

        // Operation vectors!
        if (morphT < 0.5) {
          // Vector addition parallelogram: 0->A, 0->B, A->A+B, 0->A+B
          const p0 = coords[0], pA = coords[elemA], pB = coords[elemB], pSum = coords[sumIdx];
          svg.appendChild(el('line', { x1: p0.x, y1: p0.y, x2: pA.x, y2: pA.y, stroke: 'var(--accent-blue)', 'stroke-width': 2.8, 'marker-end': 'url(#arrow-blue)' }));
          svg.appendChild(el('line', { x1: p0.x, y1: p0.y, x2: pB.x, y2: pB.y, stroke: 'var(--accent-amber)', 'stroke-width': 2.8, 'marker-end': 'url(#arrow-amber)' }));
          svg.appendChild(el('line', { x1: pA.x, y1: pA.y, x2: pSum.x, y2: pSum.y, stroke: 'var(--accent-amber)', 'stroke-width': 2, 'stroke-dasharray': '4 3', 'marker-end': 'url(#arrow-amber)' }));
          svg.appendChild(el('line', { x1: p0.x, y1: p0.y, x2: pSum.x, y2: pSum.y, stroke: 'var(--accent-green)', 'stroke-width': 2.8, 'marker-end': 'url(#arrow-green)' }));
        } else {
          // Multiplicative rotation arc when both non-zero
          if (elemA > 0 && elemB > 0) {
            const expA = gf.elements[elemA].powerExp;
            const expB = gf.elements[elemB].powerExp;
            const pA = coords[elemA], pB = coords[elemB], pProd = coords[prodIdx];
            svg.appendChild(el('line', { x1: 215, y1: 178, x2: pA.x, y2: pA.y, stroke: 'var(--accent-blue)', 'stroke-width': 2.2 }));
            svg.appendChild(el('line', { x1: 215, y1: 178, x2: pB.x, y2: pB.y, stroke: 'var(--accent-amber)', 'stroke-width': 2.2 }));
            svg.appendChild(el('line', { x1: 215, y1: 178, x2: pProd.x, y2: pProd.y, stroke: 'var(--accent-green)', 'stroke-width': 2.8, 'marker-end': 'url(#arrow-green)' }));
          }
        }

        // Draw all q nodes
        for (const elem of gf.elements) {
          const pt = coords[elem.idx];
          const isA = elem.idx === elemA;
          const isB = elem.idx === elemB;
          const isRes = (morphT < 0.5 ? sumIdx : prodIdx) === elem.idx;
          const isZero = elem.idx === 0;

          const fill = isA ? 'var(--accent-blue)'
            : isB ? 'var(--accent-amber)'
            : isRes ? 'var(--accent-green)'
            : isZero ? 'var(--accent-slate)'
            : 'var(--svg-node-fill)';
          const stroke = isA ? 'var(--accent-blue)'
            : isB ? 'var(--accent-amber)'
            : isRes ? 'var(--accent-green)'
            : 'var(--accent-teal)';

          const nodeR = gf.q >= 25 ? 13 : gf.q >= 16 ? 15 : 18;
          const g = el('g', { class: 'svg-clickable' });
          g.appendChild(el('circle', {
            cx: pt.x, cy: pt.y, r: (isA || isB || isRes) ? nodeR + 2 : nodeR,
            fill, stroke, 'stroke-width': 2.2,
          }));

          const labelTxt = morphT > 0.65 && elem.idx > 0
            ? (elem.powerExp === 0 ? '1' : `ξ^${elem.powerExp}`)
            : elem.plain;

          g.appendChild(el('text', {
            x: pt.x, y: pt.y + 4, 'text-anchor': 'middle',
            fill: (isA || isB || isRes || isZero) ? '#FFFFFF' : 'var(--text-primary)',
            'font-size': gf.q >= 16 ? 9.5 : 10.5, 'font-weight': 700,
          }, labelTxt));

          g.addEventListener('click', () => {
            if (pickTurn % 2 === 0) elemA = elem.idx;
            else elemB = elem.idx;
            pickTurn++;
            renderAll();
          });

          bindTooltip(g, () => `<strong>${elem.plain}</strong><br>向量坐标：(${elem.vec.join(', ')})<br>${elem.idx === 0 ? '加法零元 0' : `本原幂次：ξ^${elem.powerExp} · 乘法周期：${elem.mulOrder}`}`);
          svg.appendChild(g);
        }

        const pAObj = gf.elements[elemA], pBObj = gf.elements[elemB];
        const resObj = gf.elements[morphT < 0.5 ? sumIdx : prodIdx];
        svg.appendChild(el('text', {
          x: 215, y: 348, 'text-anchor': 'middle',
          fill: 'var(--text-primary)', 'font-size': 11.5, 'font-weight': 800,
        }, morphT < 0.5
          ? `加法向量平移：(${pAObj.plain}) + (${pBObj.plain}) = ${resObj.plain}`
          : `乘法角度相加：(${pAObj.idx === 0 ? '0' : 'ξ^' + pAObj.powerExp}) · (${pBObj.idx === 0 ? '0' : 'ξ^' + pBObj.powerExp}) = ${resObj.idx === 0 ? '0' : 'ξ^' + resObj.powerExp} (${resObj.plain})`));
      }
      drawMorphCanvas();

      // Right Panel: Live Calculator + Interactive Add/Mul Cayley Table
      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '三视角对照表 & 完整加/乘运算表'),
        htmlEl('div', { style: { display: 'flex', gap: '4px' } }, [
          htmlEl('button', {
            className: `btn btn-sm ${tableOp === 'add' ? 'active' : ''}`,
            onClick: () => { tableOp = 'add'; renderAll(); },
          }, '加法表 (+)'),
          htmlEl('button', {
            className: `btn btn-sm ${tableOp === 'mul' ? 'active' : ''}`,
            onClick: () => { tableOp = 'mul'; renderAll(); },
          }, '乘法表 (·)'),
        ]),
      ]));
      const rightBody = htmlEl('div', { className: 'panel-body' });

      const eA = gf.elements[elemA], eB = gf.elements[elemB];
      const sumE = gf.elements[gf.addTable[elemA][elemB]];
      const mulE = gf.elements[gf.mulTable[elemA][elemB]];

      rightBody.appendChild(htmlEl('div', { className: 'formula-banner info', style: { marginBottom: '10px' } }, [
        htmlEl('div', {
          innerHTML: renderTex(
            `A = ${eA.latex}\\ (${eA.idx === 0 ? '0' : '\\xi^{' + eA.powerExp + '}'}),\\quad `
            + `B = ${eB.latex}\\ (${eB.idx === 0 ? '0' : '\\xi^{' + eB.powerExp + '}'})`
          ),
        }),
        htmlEl('div', {
          innerHTML: renderTex(
            `A+B = ${sumE.latex},\\quad A\\cdot B = ${mulE.latex}\\ (${mulE.idx === 0 ? '0' : '\\xi^{' + mulE.powerExp + '}'})`
          ),
        }),
      ]));

      if (gf.q <= 16) {
        const mat = tableOp === 'add' ? gf.addTable : gf.mulTable;
        const tbl = htmlEl('table', { className: 'alg-table' });
        tbl.appendChild(htmlEl('thead', {}, htmlEl('tr', {}, [
          htmlEl('th', {}, tableOp === 'add' ? '+' : '·'),
          ...gf.elements.map((e) => htmlEl('th', { className: e.idx === elemB ? 'hl-amber' : '' }, e.plain)),
        ])));
        const tbody = htmlEl('tbody');
        for (let i = 0; i < gf.q; i++) {
          const tr = htmlEl('tr', {}, [htmlEl('th', { className: i === elemA ? 'hl-blue' : '' }, gf.elements[i].plain)]);
          for (let j = 0; j < gf.q; j++) {
            const res = mat[i][j];
            const isSel = i === elemA && j === elemB;
            const td = htmlEl('td', {
              className: `clickable ${isSel ? 'hl-ok' : ''}`,
              title: `${gf.elements[i].plain} ${tableOp === 'add' ? '+' : '·'} ${gf.elements[j].plain} = ${gf.elements[res].plain}`,
            }, gf.elements[res].plain);
            td.addEventListener('click', () => {
              elemA = i;
              elemB = j;
              renderAll();
            });
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        tbl.appendChild(tbody);
        rightBody.appendChild(htmlEl('div', { className: 'alg-table-wrap', style: { maxHeight: '250px', overflowY: 'auto' } }, tbl));
      } else {
        // For GF(25), show complete 25-element three-view table (compact & clean!)
        const tbl = htmlEl('table', { className: 'alg-table' });
        tbl.appendChild(htmlEl('thead', {}, htmlEl('tr', {}, [
          htmlEl('th', {}, '多项式'),
          htmlEl('th', {}, '向量'),
          htmlEl('th', {}, 'ξ 幂次'),
          htmlEl('th', {}, '乘阶'),
        ])));
        const tbody = htmlEl('tbody');
        for (const e of gf.elements) {
          const tr = htmlEl('tr', {}, [
            htmlEl('td', { className: 'clickable' }, e.plain),
            htmlEl('td', {}, `(${e.vec.join(',')})`),
            htmlEl('td', {}, e.idx === 0 ? '—' : `ξ^${e.powerExp}`),
            htmlEl('td', {}, e.idx === 0 ? '—' : String(e.mulOrder)),
          ]);
          tr.addEventListener('click', () => { elemA = e.idx; renderAll(); });
          tbody.appendChild(tr);
        }
        tbl.appendChild(tbody);
        rightBody.appendChild(htmlEl('div', { className: 'alg-table-wrap', style: { maxHeight: '250px', overflowY: 'auto' } }, tbl));
      }

      rightPanel.appendChild(rightBody);
      split.appendChild(rightPanel);
    }

    // -------------------------------------------------------------------------
    // Tab 2: Theorem 6.8.5 Subfield Divisor Hasse Lattice & Nested Venn Rings
    // -------------------------------------------------------------------------
    function renderSubfieldsTab() {
      const spec = SUBFIELD_CASES.find((c) => c.key === sfKey) || SUBFIELD_CASES[2];
      const { p, n } = spec;
      const divs = M.divisors(n);
      if (!divs.includes(sfSelectedM)) sfSelectedM = divs[Math.min(1, divs.length - 1)];

      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('span', { style: { fontWeight: 700, fontSize: '12.5px' } }, '选择母域 GF(pⁿ)：'),
        ...SUBFIELD_CASES.map((sc) => htmlEl('button', {
          className: `btn btn-sm ${sfKey === sc.key ? 'active' : ''}`,
          onClick: () => { sfKey = sc.key; sfSelectedM = M.divisors(sc.n)[1] || sc.n; renderAll(); },
        }, sc.label)),
      ]);
      container.appendChild(bar);

      const nonDivs = [];
      for (let m = 2; m < n; m++) if (n % m !== 0) nonDivs.push(m);

      const grid = htmlEl('div', { className: 'grid-2' });
      container.appendChild(grid);

      // Left SVG: Divisor Hasse Lattice + Forbidden Non-Divisors
      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, `子域整除 Hasse 格：GF(${p}ᵐ) ⊆ GF(${p}^${n}) ⟺ m | ${n}`),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });
      const box1 = htmlEl('div', { className: 'canvas-box' });
      const svg1 = createSvg(400, 310);
      box1.appendChild(svg1);

      const primeFactorsCount = (num) => {
        let cnt = 0, x = num;
        for (let d = 2; d * d <= x; d++) while (x % d === 0) { cnt++; x /= d; }
        if (x > 1) cnt++;
        return cnt;
      };
      const maxLvl = primeFactorsCount(n);
      const levels = new Map();
      for (const d of divs) {
        const l = primeFactorsCount(d);
        if (!levels.has(l)) levels.set(l, []);
        levels.get(l).push(d);
      }
      const pos = new Map();
      for (const [lvl, arr] of levels.entries()) {
        const y = 264 - (lvl * 212) / Math.max(1, maxLvl);
        arr.forEach((d, idx) => {
          pos.set(d, { x: ((idx + 1) * 400) / (arr.length + 1), y });
        });
      }

      for (const d1 of divs) {
        for (const d2 of divs) {
          if (d2 > d1 && d2 % d1 === 0 && M.isPrime(d2 / d1)) {
            const p1 = pos.get(d1), p2 = pos.get(d2);
            svg1.appendChild(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: 'var(--border-strong)', 'stroke-width': 2 }));
          }
        }
      }

      for (const d of divs) {
        const pt = pos.get(d);
        const isSel = d === sfSelectedM;
        const g = el('g', { class: 'svg-clickable' });
        g.appendChild(el('rect', {
          x: pt.x - 42, y: pt.y - 16, width: 84, height: 32, rx: 16,
          fill: isSel ? 'var(--accent-blue)' : 'var(--svg-node-fill)',
          stroke: isSel ? 'var(--accent-blue)' : 'var(--accent-teal)',
          'stroke-width': isSel ? 2.6 : 1.8,
        }));
        g.appendChild(el('text', {
          x: pt.x, y: pt.y + 4.5, 'text-anchor': 'middle',
          fill: isSel ? '#FFFFFF' : 'var(--text-primary)', 'font-size': 11.5, 'font-weight': 700,
        }, `GF(${p}^${d})`));
        g.addEventListener('click', () => { sfSelectedM = d; renderAll(); });
        svg1.appendChild(g);
      }

      // Show prohibited non-divisors at bottom
      if (nonDivs.length > 0) {
        svg1.appendChild(el('text', {
          x: 200, y: 298, 'text-anchor': 'middle', fill: 'var(--accent-rose)', 'font-size': 11, 'font-weight': 700,
        }, `禁区（非因子 ∤ ${n}，绝对不含子域）：${nonDivs.map((m) => `GF(${p}^${m})`).join('、')}`));
      }

      leftBody.appendChild(box1);
      leftPanel.appendChild(leftBody);
      grid.appendChild(leftPanel);

      // Right SVG: Nested Venn Domain Circles
      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '子域包含 Venn 嵌套图（每条整除链对应一组同心圆）'),
      ]));
      const rightBody = htmlEl('div', { className: 'panel-body' });
      const box2 = htmlEl('div', { className: 'canvas-box' });
      const svg2 = createSvg(400, 310);
      box2.appendChild(svg2);

      // Draw outer mother field GF(p^n), then nested ellipses for divisors sorted descending
      const cx = 200, cy = 160;
      const descDivs = divs.slice().reverse();
      descDivs.forEach((d, idx) => {
        const col = PALETTE[idx % PALETTE.length];
        const rx = 168 - idx * (132 / Math.max(1, descDivs.length));
        const ry = 132 - idx * (102 / Math.max(1, descDivs.length));
        // Offset slightly if multiple incomparable divisors exist (e.g., 4 vs 6 in 12)
        const xShift = (d === 4 && n === 12) ? -22 : (d === 6 && n === 12) ? 22 : (d === 2 && n === 6) ? -18 : (d === 3 && n === 6) ? 18 : 0;
        const isSel = d === sfSelectedM;
        const g = el('g', { class: 'svg-clickable' });
        g.appendChild(el('ellipse', {
          cx: cx + xShift, cy, rx: Math.max(24, rx), ry: Math.max(20, ry),
          fill: col, 'fill-opacity': isSel ? 0.25 : 0.08,
          stroke: col, 'stroke-width': isSel ? 2.8 : 1.6,
        }));
        g.appendChild(el('text', {
          x: cx + xShift, y: cy - Math.max(20, ry) + 16, 'text-anchor': 'middle',
          fill: col, 'font-size': 11, 'font-weight': 800,
        }, `GF(${p}^${d})`));
        g.addEventListener('click', () => { sfSelectedM = d; renderAll(); });
        svg2.appendChild(g);
      });

      rightBody.appendChild(box2);
      rightPanel.appendChild(rightBody);
      grid.appendChild(rightPanel);

      // Bottom Diagnostic Banner
      const subSize = Math.pow(p, sfSelectedM);
      const bigSize = Math.pow(p, n);
      const step = (bigSize - 1) / (subSize - 1);
      container.appendChild(htmlEl('div', {
        className: 'formula-banner',
        innerHTML: renderTex(
          `GF(${p}^{${sfSelectedM}}) \\subseteq GF(${p}^{${n}})\\quad (\\text{元数 } ${subSize.toLocaleString()} \\mid ${bigSize.toLocaleString()}),\\quad `
          + `\\text{恰好由方程 } x^{${p}^{${sfSelectedM}}} - x = 0 \\text{ 的全部 } ${subSize.toLocaleString()} \\text{ 个根组成，乘法生成步长为 } \\frac{${p}^{${n}}-1}{${p}^{${sfSelectedM}}-1} = ${step.toLocaleString()}`
        ),
      }));
    }

    renderAll();
    return { applyPreset };
  }

  DM2.Labs.ch68 = {
    id: 'ch68',
    title: '6.8 有限域 GF(pⁿ)',
    badge: '立方体 ↔ 圆环',
    subtitle: '商环构造流水线、加法空间↔乘法圆环 Morph 变形与子域 Venn 格',
    render,
  };
})(window);
