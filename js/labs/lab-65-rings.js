/* 6.5 Rings, Zero Divisors, Quaternions, Ideal Black Hole & Maximal Ideal Collapse Lab */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  DM2.Labs = DM2.Labs || {};
  const M = DM2.Math;
  const { el, createSvg, htmlEl, animateTween, bindTooltip } = DM2.Svg;
  const { renderTex } = DM2.KaTeX;

  const QUAT_UNITS = ['1', 'i', 'j', 'k'];
  const QUAT_SIGN = {
    '1,1': '+1', '1,i': '+i', '1,j': '+j', '1,k': '+k',
    'i,1': '+i', 'i,i': '-1', 'i,j': '+k', 'i,k': '-j',
    'j,1': '+j', 'j,i': '-k', 'j,j': '-1', 'j,k': '+i',
    'k,1': '+k', 'k,i': '+j', 'k,j': '-i', 'k,k': '-1',
  };

  function render(container, ctx) {
    let tab = 'zn'; // 'zn' | 'ideal' | 'maximal'
    let znN = 6;
    let qLeft = 'i';
    let qRight = 'j';

    let extElem = 4; // external ring elem x in Z_12
    let inElem = 3;  // ideal elem a in 3Z_12
    let ratFactor = '1/2';
    let intElem = 3;

    let maxCase = 'z12_4'; // 'z12_4' | 'z12_3' | 'r2x_red' | 'r2x_irr'
    let collapsed = false;

    function applyPreset(p) {
      if (!p) return;
      if (p === 'zero-divisor-zn') {
        tab = 'zn';
        znN = 6;
      } else if (p === 'quaternion-tri') {
        tab = 'zn';
        qLeft = 'i';
        qRight = 'j';
      } else if (p === 'ideal-blackhole') {
        tab = 'ideal';
      } else if (p === 'maximal-ideal') {
        tab = 'maximal';
        maxCase = 'z12_4';
        collapsed = false;
      } else if (p === 'ring-venn') {
        tab = 'ringvenn';
      } else if (p === 'ring-hom-triangle') {
        tab = 'triangle';
      }
      renderAll();
    }

    function renderAll() {
      container.innerHTML = '';

      const header = htmlEl('div', { className: 'lab-header' }, [
        htmlEl('div', { className: 'lab-title-wrap' }, [
          htmlEl('h1', {}, [
            '6.5 环、整区、体与极大理想',
            htmlEl('span', { className: 'lab-badge' }, 'p.145–214 · 零因子与黑洞吸收'),
          ]),
          htmlEl('p', { className: 'lab-desc' }, '观察 Zₙ 零因子随质合数切换而闪现/消失；用“黑洞吸收”直觉理解理想，并在理想格塌缩中看穿“极大理想 ⇔ 单纯环 ⇔ 域”。'),
        ]),
        htmlEl('div', { className: 'lab-tabs' }, [
          htmlEl('button', {
            className: `lab-tab ${tab === 'zn' ? 'active' : ''}`,
            onClick: () => { tab = 'zn'; renderAll(); },
          }, 'Zₙ 零因子雷达 & 四元数体'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'ringvenn' ? 'active' : ''}`,
            onClick: () => { tab = 'ringvenn'; renderAll(); },
          }, '环论三圆 Venn 谱系'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'ideal' ? 'active' : ''}`,
            onClick: () => { tab = 'ideal'; renderAll(); },
          }, '理想“黑洞”吸收 vs 子环逃逸'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'triangle' ? 'active' : ''}`,
            onClick: () => { tab = 'triangle'; renderAll(); },
          }, '三圆环同态三角图（黑板原图）'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'maximal' ? 'active' : ''}`,
            onClick: () => { tab = 'maximal'; renderAll(); },
          }, '极大理想 ⇔ 单纯环 ⇔ 域 塌缩机'),
        ]),
      ]);
      container.appendChild(header);

      if (tab === 'zn') renderZnTab();
      else if (tab === 'ringvenn') {
        const host = htmlEl('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
        container.appendChild(host);
        DM2.RingVenn.mount(host, ctx);
      } else if (tab === 'triangle') {
        const host = htmlEl('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
        container.appendChild(host);
        DM2.HomTriangle.mount(host, 'ring_z12_z4');
      } else if (tab === 'ideal') renderIdealTab();
      else renderMaximalTab();
    }

    // -------------------------------------------------------------------------
    // Tab 1: Zero Divisor Radar & Quaternion Non-Commutative Division Ring
    // -------------------------------------------------------------------------
    function renderZnTab() {
      const prime = M.isPrime(znN);
      const zeroDivisors = new Set();
      const units = new Set();
      for (let a = 1; a < znN; a++) {
        let isZd = false;
        let hasInv = false;
        for (let b = 1; b < znN; b++) {
          if ((a * b) % znN === 0) isZd = true;
          if ((a * b) % znN === 1) hasInv = true;
        }
        if (isZd) zeroDivisors.add(a);
        if (hasInv) units.add(a);
      }

      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, `剩余类环 Zₙ 模数 n = ${znN}（${prime ? '质数' : '合数'}）：`),
          (() => {
            const r = htmlEl('input', { className: 'ctrl-range', type: 'range', min: 2, max: 12, value: znN });
            r.addEventListener('input', () => { znN = Number(r.value); renderAll(); });
            return r;
          })(),
        ]),
        htmlEl('span', { className: `chip ${prime ? 'ok' : 'bad'}` },
          prime
            ? `✓ p=${znN} 为质数：无零因子（消去环），所有非零元有逆 → 构成域！`
            : `✗ ${znN} 为合数：存在 ${zeroDivisors.size} 个零因子 (${Array.from(zeroDivisors).join(', ')})`),
      ]);
      container.appendChild(bar);

      const grid = htmlEl('div', { className: 'split-wide' });
      container.appendChild(grid);

      // Left: Z_n multiplication table radar
      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, `Z_${znN} 乘法表雷达（红=零因子对 ab≡0，绿=可逆元 1）`),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });

      const tbl = htmlEl('table', { className: 'alg-table' });
      tbl.appendChild(htmlEl('thead', {}, htmlEl('tr', {}, [
        htmlEl('th', {}, '·'),
        ...Array.from({ length: znN }, (_, j) => htmlEl('th', { className: zeroDivisors.has(j) ? 'hl-bad' : '' }, String(j))),
      ])));
      const tbody = htmlEl('tbody');
      for (let i = 0; i < znN; i++) {
        const tr = htmlEl('tr', {}, [htmlEl('th', { className: zeroDivisors.has(i) ? 'hl-bad' : '' }, String(i))]);
        for (let j = 0; j < znN; j++) {
          const val = (i * j) % znN;
          let cls = '';
          if (i > 0 && j > 0 && val === 0) cls = 'hl-bad';
          else if (val === 1) cls = 'hl-ok';
          tr.appendChild(htmlEl('td', { className: cls }, String(val)));
        }
        tbody.appendChild(tr);
      }
      tbl.appendChild(tbody);
      leftBody.appendChild(htmlEl('div', { className: 'alg-table-wrap' }, tbl));

      leftBody.appendChild(htmlEl('div', { className: 'formula-banner info', style: { marginTop: '10px' } }, [
        htmlEl('span', {}, prime
          ? `性质 13–14 (p.159–161) 与结论 (p.172)：Z_${znN} 中每个非零元的加法周期都等于质数 ${znN}，且有限整区必为域。`
          : `反例见证：在 Z_${znN} 中非零元加法周期仍是 ${znN}（合数），这恰好证明存在零因子的环不是消去环！`),
      ]));
      leftPanel.appendChild(leftBody);
      grid.appendChild(leftPanel);

      // Right: Quaternion Oriented Triangle (体未必是域)
      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '四元数体 ℍ：是“体”但不是“域”（p.174–176）'),
      ]));
      const rightBody = htmlEl('div', { className: 'panel-body' });

      const qCtrl = htmlEl('div', { className: 'controls-bar', style: { marginBottom: '10px' } }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '左因子 a：'),
          ...QUAT_UNITS.map((u) => htmlEl('button', {
            className: `btn btn-sm ${qLeft === u ? 'active' : ''}`,
            onClick: () => { qLeft = u; renderAll(); },
          }, u)),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '右因子 b：'),
          ...QUAT_UNITS.map((u) => htmlEl('button', {
            className: `btn btn-sm ${qRight === u ? 'active' : ''}`,
            onClick: () => { qRight = u; renderAll(); },
          }, u)),
        ]),
      ]);
      rightBody.appendChild(qCtrl);

      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(380, 220);
      box.appendChild(svg);

      const cx = 190, cy = 114, r = 74;
      const pts = {
        i: { x: cx, y: cy - r },
        j: { x: cx + r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) },
        k: { x: cx - r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) },
      };

      // Circle orientation arrow
      svg.appendChild(el('circle', { cx, cy: cy + 8, r: r * 0.72, fill: 'none', stroke: 'var(--accent-purple)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
      const pairs = [['i', 'j'], ['j', 'k'], ['k', 'i']];
      for (const [u, v] of pairs) {
        const p1 = pts[u], p2 = pts[v];
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        svg.appendChild(el('line', {
          x1: p1.x + (20 * dx) / len, y1: p1.y + (20 * dy) / len,
          x2: p2.x - (20 * dx) / len, y2: p2.y - (20 * dy) / len,
          stroke: 'var(--accent-teal)', 'stroke-width': 2.5, 'marker-end': 'url(#arrow-teal)',
        }));
      }

      for (const u of ['i', 'j', 'k']) {
        const pt = pts[u];
        const isSel = u === qLeft || u === qRight;
        svg.appendChild(el('circle', {
          cx: pt.x, cy: pt.y, r: 19,
          fill: isSel ? 'var(--accent-purple)' : 'var(--svg-node-fill)',
          stroke: 'var(--accent-purple)', 'stroke-width': 2.2,
        }));
        svg.appendChild(el('text', {
          x: pt.x, y: pt.y + 5, 'text-anchor': 'middle',
          fill: isSel ? '#FFFFFF' : 'var(--text-primary)', 'font-size': 15, 'font-weight': 800,
        }, u));
      }
      svg.appendChild(el('text', { x: cx, y: cy + 12, 'text-anchor': 'middle', fill: 'var(--accent-teal)', 'font-size': 11, 'font-weight': 700 }, '顺箭乘得正，逆箭乘得负'));
      rightBody.appendChild(box);

      const ab = QUAT_SIGN[`${qLeft},${qRight}`];
      const ba = QUAT_SIGN[`${qRight},${qLeft}`];
      rightBody.appendChild(htmlEl('div', {
        className: `formula-banner ${ab === ba ? '' : 'warn'}`,
        style: { marginTop: '10px' },
        innerHTML: `${renderTex(`${qLeft} \\cdot ${qRight} = ${ab}, \\qquad ${qRight} \\cdot ${qLeft} = ${ba}`)}
          <span style="font-size:12px;">${ab === ba ? '此对可交换；任意非零元 q = a+bi+cj+dk 均有逆元 q⁻¹ = (a-bi-cj-dk)/(a²+b²+c²+d²)，故为体。' : '乘法顺序颠倒变号！违反交换律，故四元数体是体但不是域。'}</span>`,
      }));
      rightPanel.appendChild(rightBody);
      grid.appendChild(rightPanel);
    }

    // -------------------------------------------------------------------------
    // Tab 2: Ideal "Black Hole" Absorption vs Subring Escape
    // -------------------------------------------------------------------------
    function renderIdealTab() {
      const idealElems = [0, 3, 6, 9];
      const prodZ12 = (extElem * inElem) % 12;

      const ratMap = { '1/2': 0.5, '2/3': 2 / 3, '2': 2, '-1/5': -0.2 };
      const prodRat = ratMap[ratFactor] * intElem;
      const staysInZ = Number.isInteger(prodRat);

      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, 'Z₁₂ 外部环元 x：'),
          (() => {
            const s = htmlEl('select', { className: 'ctrl-select' });
            for (let x = 0; x < 12; x++) {
              const o = htmlEl('option', { value: x }, `${x} ∈ Z₁₂`);
              if (x === extElem) o.selected = true;
              s.appendChild(o);
            }
            s.addEventListener('change', () => { extElem = Number(s.value); renderAll(); });
            return s;
          })(),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '理想内元素 a ∈ 3Z₁₂：'),
          ...idealElems.map((a) => htmlEl('button', {
            className: `btn btn-sm ${inElem === a ? 'active' : ''}`,
            onClick: () => { inElem = a; renderAll(); },
          }, String(a))),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, 'ℚ 中外部元素 x：'),
          ...Object.keys(ratMap).map((rk) => htmlEl('button', {
            className: `btn btn-sm ${ratFactor === rk ? 'active' : ''}`,
            onClick: () => { ratFactor = rk; renderAll(); },
          }, rk)),
        ]),
      ]);
      container.appendChild(bar);

      const grid = htmlEl('div', { className: 'grid-2' });
      container.appendChild(grid);

      // Left SVG: Ideal 3Z_12 inside Z_12 (Black Hole Pulls Back!)
      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '理想 N = 3Z₁₂ = {0, 3, 6, 9} ⊂ Z₁₂（黑洞吸收！）'),
        htmlEl('span', { className: 'chip ok' }, `x·a = ${extElem}×${inElem} ≡ ${prodZ12} ∈ N`),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });
      const box1 = htmlEl('div', { className: 'canvas-box' });
      const svg1 = createSvg(400, 260);
      box1.appendChild(svg1);

      // Outer ring R = Z_12
      svg1.appendChild(el('rect', { x: 16, y: 16, width: 368, height: 228, rx: 18, fill: 'var(--accent-blue-soft)', stroke: 'var(--accent-blue)', 'stroke-width': 1.8 }));
      svg1.appendChild(el('text', { x: 32, y: 38, fill: 'var(--accent-blue)', 'font-size': 12.5, 'font-weight': 800 }, '大环 R = Z₁₂'));

      // Inner Black Hole N
      svg1.appendChild(el('circle', { cx: 200, cy: 138, r: 78, fill: 'var(--accent-teal-soft)', stroke: 'var(--accent-teal)', 'stroke-width': 2.5 }));
      svg1.appendChild(el('text', { x: 200, y: 78, 'text-anchor': 'middle', fill: 'var(--accent-teal)', 'font-size': 12, 'font-weight': 800 }, '理想 N = {0, 3, 6, 9}'));

      // Place ideal elements inside circle
      const inPos = new Map();
      idealElems.forEach((v, idx) => {
        const ang = (Math.PI * 2 * idx) / 4 - Math.PI / 4;
        const px = 200 + 38 * Math.cos(ang);
        const py = 142 + 38 * Math.sin(ang);
        inPos.set(v, { x: px, y: py });
        const hit = v === prodZ12;
        svg1.appendChild(el('circle', { cx: px, cy: py, r: 15, fill: hit ? 'var(--accent-green)' : v === inElem ? 'var(--accent-teal)' : 'var(--bg-panel)', stroke: 'var(--accent-teal)', 'stroke-width': 2 }));
        svg1.appendChild(el('text', { x: px, y: py + 4.5, 'text-anchor': 'middle', fill: (hit || v === inElem) ? '#FFFFFF' : 'var(--text-primary)', 'font-size': 12, 'font-weight': 800 }, String(v)));
      });

      // External element x outside
      const extPt = { x: 64, y: 138 };
      svg1.appendChild(el('circle', { cx: extPt.x, cy: extPt.y, r: 16, fill: 'var(--accent-blue)', stroke: '#FFFFFF', 'stroke-width': 2 }));
      svg1.appendChild(el('text', { x: extPt.x, y: extPt.y + 4.5, 'text-anchor': 'middle', fill: '#FFFFFF', 'font-size': 12, 'font-weight': 800 }, String(extElem)));
      svg1.appendChild(el('text', { x: extPt.x, y: extPt.y + 30, 'text-anchor': 'middle', fill: 'var(--accent-blue)', 'font-size': 11, 'font-weight': 700 }, '外部元 x'));

      const srcPt = inPos.get(inElem);
      const dstPt = inPos.get(prodZ12);
      svg1.appendChild(el('path', {
        d: `M ${extPt.x + 16} ${extPt.y} Q 130 92, ${dstPt.x} ${dstPt.y - 16}`,
        fill: 'none', stroke: 'var(--accent-green)', 'stroke-width': 2.5, 'marker-end': 'url(#arrow-green)',
      }));
      svg1.appendChild(el('text', { x: 200, y: 234, 'text-anchor': 'middle', fill: 'var(--accent-green)', 'font-size': 11.5, 'font-weight': 700 },
        `无论外部 x 取谁，x·${inElem} = ${prodZ12} 都被牢牢吸回理想 N 内部！`));

      leftBody.appendChild(box1);
      leftPanel.appendChild(leftBody);
      grid.appendChild(leftPanel);

      // Right SVG: Subring Z inside Q (Escapes!)
      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '子环 ℤ ⊂ ℚ：是子环，但不是理想（外部乘积会逃逸！）'),
        htmlEl('span', { className: `chip ${staysInZ ? 'ok' : 'bad'}` }, `(${ratFactor}) × ${intElem} = ${Number.isInteger(prodRat) ? prodRat : prodRat.toFixed(2)} ${staysInZ ? '∈ ℤ' : '∉ ℤ'}`),
      ]));
      const rightBody = htmlEl('div', { className: 'panel-body' });
      const box2 = htmlEl('div', { className: 'canvas-box' });
      const svg2 = createSvg(400, 260);
      box2.appendChild(svg2);

      svg2.appendChild(el('rect', { x: 16, y: 16, width: 368, height: 228, rx: 18, fill: 'var(--accent-amber-soft)', stroke: 'var(--accent-amber)', 'stroke-width': 1.8 }));
      svg2.appendChild(el('text', { x: 32, y: 38, fill: 'var(--accent-amber)', 'font-size': 12.5, 'font-weight': 800 }, '大环 R = 有理数域 ℚ'));

      svg2.appendChild(el('circle', { cx: 180, cy: 138, r: 72, fill: 'var(--bg-panel)', stroke: 'var(--accent-purple)', 'stroke-width': 2.2 }));
      svg2.appendChild(el('text', { x: 180, y: 86, 'text-anchor': 'middle', fill: 'var(--accent-purple)', 'font-size': 12, 'font-weight': 800 }, '子环 S = 整数环 ℤ'));

      svg2.appendChild(el('circle', { cx: 166, cy: 142, r: 16, fill: 'var(--accent-purple)' }));
      svg2.appendChild(el('text', { x: 166, y: 146.5, 'text-anchor': 'middle', fill: '#FFFFFF', 'font-size': 12, 'font-weight': 800 }, String(intElem)));

      const outTarget = staysInZ ? { x: 214, y: 142 } : { x: 324, y: 120 };
      svg2.appendChild(el('circle', { cx: 64, cy: 138, r: 16, fill: 'var(--accent-amber)' }));
      svg2.appendChild(el('text', { x: 64, y: 142.5, 'text-anchor': 'middle', fill: '#FFFFFF', 'font-size': 11, 'font-weight': 800 }, ratFactor));

      svg2.appendChild(el('path', {
        d: `M 82 132 Q 190 48, ${outTarget.x} ${outTarget.y - 16}`,
        fill: 'none',
        stroke: staysInZ ? 'var(--accent-green)' : 'var(--accent-rose)',
        'stroke-width': 2.6,
        'marker-end': staysInZ ? 'url(#arrow-green)' : 'url(#arrow-rose)',
      }));

      svg2.appendChild(el('circle', {
        cx: outTarget.x, cy: outTarget.y, r: 18,
        fill: staysInZ ? 'var(--accent-green)' : 'var(--accent-rose)',
      }));
      svg2.appendChild(el('text', {
        x: outTarget.x, y: outTarget.y + 4.5, 'text-anchor': 'middle',
        fill: '#FFFFFF', 'font-size': 11, 'font-weight': 800,
      }, Number.isInteger(prodRat) ? String(prodRat) : prodRat.toFixed(1)));

      svg2.appendChild(el('text', {
        x: 200, y: 234, 'text-anchor': 'middle',
        fill: staysInZ ? 'var(--accent-green)' : 'var(--accent-rose)', 'font-size': 11.5, 'font-weight': 700,
      }, staysInZ ? '乘以整数 2 碰巧留存，但换分数立刻逃逸！' : '粒子冲破 ℤ 边界逃逸至 ℚ \\ ℤ，无法定义剩余环乘法！'));

      rightBody.appendChild(box2);
      rightPanel.appendChild(rightBody);
      grid.appendChild(rightPanel);
    }

    // -------------------------------------------------------------------------
    // Tab 3: Maximal Ideal <=> Simple Quotient Ring <=> Field
    // -------------------------------------------------------------------------
    function renderMaximalTab() {
      const CASES = {
        z12_4: {
          name: 'R = I/12I，取理想 N = 4I/12I（非极大理想！）',
          isMaximal: false,
          nodes: [
            { id: 'R', label: 'R = I/12I (12元)', x: 210, y: 40, aboveN: true },
            { id: 'M', label: '中间理想 2I/12I (6元)', x: 210, y: 120, aboveN: true, mid: true },
            { id: 'N', label: 'N = 4I/12I (3元)', x: 210, y: 200, isN: true },
            { id: '0', label: '{0}', x: 210, y: 270, aboveN: false },
          ],
          edges: [['R', 'M'], ['M', 'N'], ['N', '0']],
          quotientName: 'R/N ≅ Z₄ (4元环)',
          quotientResult: '✗ 非域！因存在夹层理想 2I/12I，塌缩后 R/N 仍残余真理想 {0, 2}（不是单纯环），且 2·2≡0 为零因子！',
        },
        z12_3: {
          name: 'R = I/12I，取理想 N = 3I/12I（极大理想！）',
          isMaximal: true,
          nodes: [
            { id: 'R', label: 'R = I/12I (12元)', x: 210, y: 46, aboveN: true },
            { id: 'N', label: 'N = 3I/12I (4元 · 极大)', x: 210, y: 155, isN: true },
            { id: '0', label: '{0}', x: 210, y: 264, aboveN: false },
          ],
          edges: [['R', 'N'], ['N', '0']],
          quotientName: 'R/N ≅ Z₃ (3元域！)',
          quotientResult: '✓ 是域！R 与 N 之间无任何夹层理想，塌缩后 R/N 仅有 {0\'} 与自身（单纯环）→ 有 1 交换单纯环必为域！',
        },
        r2x_red: {
          name: 'R = R₂[x]，取 N = (x²+1)R₂[x]（可约式，非极大！）',
          isMaximal: false,
          nodes: [
            { id: 'R', label: 'R₂[x]', x: 210, y: 40, aboveN: true },
            { id: 'M', label: '夹层主理想 (x+1)R₂[x]', x: 210, y: 120, aboveN: true, mid: true },
            { id: 'N', label: 'N = (x²+1)R₂[x] = ((x+1)²)', x: 210, y: 200, isN: true },
            { id: '0', label: '{0}', x: 210, y: 270, aboveN: false },
          ],
          edges: [['R', 'M'], ['M', 'N'], ['N', '0']],
          quotientName: 'R₂[x]/(x²+1)',
          quotientResult: '✗ 非域！在 R₂ 中 x²+1=(x+1)² 可约，夹层理想 (x+1) 导致商环出现零因子 (x̄+1)² = 0！',
        },
        r2x_irr: {
          name: 'R = R₂[x]，取质式 N = (x²+x+1)R₂[x]（极大理想！）',
          isMaximal: true,
          nodes: [
            { id: 'R', label: 'R₂[x]', x: 210, y: 46, aboveN: true },
            { id: 'N', label: 'N = (x²+x+1)R₂[x]（质式生成）', x: 210, y: 155, isN: true },
            { id: '0', label: '{0}', x: 210, y: 264, aboveN: false },
          ],
          edges: [['R', 'N'], ['N', '0']],
          quotientName: 'R₂[x]/(x²+x+1) ≅ GF(4)（4元有限域！）',
          quotientResult: '✓ 是域！x²+x+1 是 R₂ 上质式，无真因式 = 无夹层理想 = 极大理想 → 直通第 6.8 节有限域构造！',
        },
      };

      const cur = CASES[maxCase];
      const bar = htmlEl('div', { className: 'controls-bar' }, [
        ...Object.entries(CASES).map(([k, v]) => htmlEl('button', {
          className: `btn btn-sm ${maxCase === k ? 'active' : ''}`,
          onClick: () => { maxCase = k; collapsed = false; renderAll(); },
        }, v.name)),
        htmlEl('button', {
          className: 'btn btn-sm btn-primary',
          onClick: () => { collapsed = !collapsed; renderAll(); },
        }, collapsed ? '↺ 恢复原环理想格 R' : '▶ 作商环 R/N 塌缩'),
      ]);
      container.appendChild(bar);

      const panel = htmlEl('div', { className: 'panel' });
      panel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '定理 6.5.7 – 6.5.11：理想格对应与极大理想判定（R/N 是域 ⟺ R/N 单纯 ⟺ N 极大）'),
        htmlEl('span', { className: `chip ${cur.isMaximal ? 'ok' : 'bad'}` }, cur.isMaximal ? '✓ 极大理想 → 商环为域' : '✗ 存在夹层 → 商环非域'),
      ]));
      const body = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(760, 310);
      box.appendChild(svg);

      // Left: Original Ring Ideal Lattice
      svg.appendChild(el('text', { x: 210, y: 20, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 12.5, 'font-weight': 800 }, '原环 R 的理想包含链'));
      const nMap = new Map(cur.nodes.map((nd) => [nd.id, nd]));
      for (const [u, v] of cur.edges) {
        const p1 = nMap.get(u), p2 = nMap.get(v);
        svg.appendChild(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: 'var(--border-strong)', 'stroke-width': 2 }));
      }
      for (const nd of cur.nodes) {
        const col = nd.isN ? 'var(--accent-blue)' : nd.mid ? 'var(--accent-rose)' : 'var(--accent-teal)';
        svg.appendChild(el('rect', {
          x: nd.x - 108, y: nd.y - 16, width: 216, height: 32, rx: 10,
          fill: nd.isN ? 'var(--accent-blue)' : nd.mid ? 'var(--accent-rose-soft)' : 'var(--svg-node-fill)',
          stroke: col, 'stroke-width': 2,
          opacity: collapsed && !nd.aboveN && !nd.isN ? 0.3 : 1,
        }));
        svg.appendChild(el('text', {
          x: nd.x, y: nd.y + 4.5, 'text-anchor': 'middle',
          fill: nd.isN ? '#FFFFFF' : nd.mid ? 'var(--accent-rose)' : 'var(--text-primary)',
          'font-size': 11.5, 'font-weight': 700,
        }, nd.label));
      }

      // Middle correspondence arrows
      svg.appendChild(el('path', {
        d: 'M 330 46 L 456 60', fill: 'none', stroke: 'var(--accent-teal)', 'stroke-width': 2, 'marker-end': 'url(#arrow-teal)',
      }));
      svg.appendChild(el('path', {
        d: 'M 330 155 L 456 250', fill: 'none', stroke: 'var(--accent-blue)', 'stroke-width': 2, 'stroke-dasharray': '5 3', 'marker-end': 'url(#arrow-blue)',
      }));

      // Right: Quotient Ring R/N Ideal Lattice
      svg.appendChild(el('text', { x: 580, y: 20, 'text-anchor': 'middle', fill: 'var(--accent-teal)', 'font-size': 12.5, 'font-weight': 800 },
        collapsed ? `塌缩后商环：${cur.quotientName}` : '右侧：商环 R/N 的理想格映射'));

      const qNodes = cur.isMaximal
        ? [
            { label: cur.quotientName, y: 60, col: 'var(--accent-teal)' },
            { label: "{0'}（原理想 N 塌缩为零元）", y: 250, col: 'var(--accent-blue)' },
          ]
        : [
            { label: cur.quotientName, y: 60, col: 'var(--accent-teal)' },
            { label: '残余非平凡真理想（来自夹层）', y: 155, col: 'var(--accent-rose)' },
            { label: "{0'}（原理想 N 塌缩为零元）", y: 250, col: 'var(--accent-blue)' },
          ];
      for (let i = 0; i < qNodes.length - 1; i++) {
        svg.appendChild(el('line', { x1: 580, y1: qNodes[i].y, x2: 580, y2: qNodes[i + 1].y, stroke: 'var(--border-strong)', 'stroke-width': 2 }));
      }
      for (const qn of qNodes) {
        svg.appendChild(el('rect', {
          x: 462, y: qn.y - 18, width: 236, height: 36, rx: 10,
          fill: collapsed ? 'var(--bg-subtle)' : 'var(--svg-node-fill)',
          stroke: qn.col, 'stroke-width': 2.2,
          opacity: collapsed ? 1 : 0.65,
        }));
        svg.appendChild(el('text', {
          x: 580, y: qn.y + 4.5, 'text-anchor': 'middle',
          fill: qn.col, 'font-size': 11.5, 'font-weight': 700,
        }, qn.label));
      }

      body.appendChild(box);
      body.appendChild(htmlEl('div', {
        className: `formula-banner ${cur.isMaximal ? '' : 'warn'}`,
        style: { marginTop: '10px' },
      }, [
        htmlEl('strong', {}, cur.isMaximal ? '定理 6.5.8–6.5.11 验证成功' : '非极大理想反例说明'),
        htmlEl('span', {}, cur.quotientResult),
      ]));
      panel.appendChild(body);
      container.appendChild(panel);
    }

    renderAll();
    return { applyPreset };
  }

  DM2.Labs.ch65 = {
    id: 'ch65',
    title: '6.5 环与理想',
    badge: '零因子 · 黑洞',
    subtitle: 'Zₙ 零因子雷达、四元数体、理想黑洞吸收与极大理想塌缩',
    render,
  };
})(window);
