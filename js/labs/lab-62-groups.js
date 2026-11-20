/* 6.2 Group Definition & Permutation Groups Lab:
 * 1) 5-Axiom Inspector (Z_8+, Z_8*, {2^n}, Z_7*) + Divisibility Latin Square
 * 2) S_n Braid Composition (Right-to-Left!) + Disjoint Cycle Orbits + Inversions T & Transpositions
 * 3) S_3 Triangle Geometric Symmetry & Alternating Group A_3
 */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  DM2.Labs = DM2.Labs || {};
  const M = DM2.Math;
  const { el, createSvg, htmlEl, PALETTE, bindTooltip } = DM2.Svg;
  const { renderTex, permMatrixTex, cycleListTex, transpositionsTex } = DM2.KaTeX;

  const AXIOM_CASES = {
    z8add: {
      name: '(Z₈, ⊕) 模8加法',
      labels: ['0', '1', '2', '3', '4', '5', '6', '7'],
      op: '⊕',
      mul: (i, j) => (i + j) % 8,
      nonEmpty: true,
      closed: true,
      assoc: true,
      identityIdx: 0,
      idempotents: [0],
      missingInv: [],
      isGroup: true,
      note: '易错结论 p.29：(Z₈, ⊕) 是群！单位元 0，a 的逆元为 (8-a) mod 8，仅有一个幂等元 0，每行每列无重复（可除条件成立）。',
    },
    z8mul: {
      name: '(Z₈, ⊙) 模8乘法',
      labels: ['0', '1', '2', '3', '4', '5', '6', '7'],
      op: '⊙',
      mul: (i, j) => (i * j) % 8,
      nonEmpty: true,
      closed: true,
      assoc: true,
      identityIdx: 1,
      idempotents: [0, 1],
      missingInv: [0, 2, 4, 6],
      isGroup: false,
      note: '易错结论 p.30：虽封闭、结合且有单位元 1，但 0 与偶数 2,4,6 无逆元，且存在多余幂等元 0，不是群！',
    },
    z7mul: {
      name: '(Z₇*, ⊙) 模7非零乘法',
      labels: ['1', '2', '3', '4', '5', '6'],
      op: '⊙',
      mul: (i, j) => ((i + 1) * (j + 1) % 7) - 1,
      nonEmpty: true,
      closed: true,
      assoc: true,
      identityIdx: 0,
      idempotents: [0],
      missingInv: [],
      isGroup: true,
      note: '手写补充 p.41–42：p 为质数时，{1,…,p-1} 模 p 乘法每个元素都有唯一逆元，构成 (p-1) 元交换群！',
    },
    pow2: {
      name: '({2ⁿ | n∈ℕ}, ×) 半群反例（前6项）',
      labels: ['1', '2', '4', '8', '16', '32'],
      op: '×',
      mul: (i, j) => Math.min(5, i + j),
      nonEmpty: true,
      closed: true,
      assoc: true,
      identityIdx: 0,
      idempotents: [0],
      missingInv: [1, 2, 3, 4, 5],
      isGroup: false,
      note: '易错结论 p.25：{2ⁿ} 在完整自然数上封闭且结合（是半群），但除 1=2⁰ 外其余元素均无乘法逆元，不是群。（注：表格受限于尺寸以 ≥32 截断示意）',
    },
  };

  function render(container, ctx) {
    let tab = 'perm'; // 'axioms' | 'perm' | 's3'
    let axiomKey = 'z8add';

    let sn = 4;
    let sigma = [2, 3, 4, 1]; // (1 2 3 4)
    let tau = [2, 1, 4, 3];   // (1 2)(3 4)
    let traceElem = 1;
    let orbitPow = 1;

    let s3State = [1, 2, 3]; // current vertex mapping of triangle
    let s3History = [];

    function applyPreset(p) {
      if (!p) return;
      if (p === 'semigroup-check') {
        tab = 'axioms';
        axiomKey = 'pow2';
      } else if (p === 'group-z8-compare') {
        tab = 'axioms';
        axiomKey = 'z8mul';
      } else if (p === 'perm-cycles') {
        tab = 'perm';
        sn = 4;
        sigma = [2, 3, 1, 4]; // (1 2 3)
        tau = [1, 2, 4, 3];   // (3 4)
        orbitPow = 1;
      } else if (p === 'perm-parity' || p === 'perm-braid') {
        tab = 'perm';
        sn = 4;
        sigma = [2, 3, 4, 1];
        tau = [2, 1, 3, 4];
        orbitPow = 1;
      } else if (p === 's3-triangle') {
        tab = 's3';
      }
      renderAll();
    }

    function renderAll() {
      container.innerHTML = '';

      const header = htmlEl('div', { className: 'lab-header' }, [
        htmlEl('div', { className: 'lab-title-wrap' }, [
          htmlEl('h1', {}, [
            '6.2 群的定义、对称群与置换轮换',
            htmlEl('span', { className: 'lab-badge' }, 'p.23–69 · 自右向左复合'),
          ]),
          htmlEl('p', { className: 'lab-desc' }, '检验群公理 5 条件与可除拉丁方；用编织连线、不相杂轮换闭环与逆序对交叉点直觉掌握 Sₙ 置换乘法与奇偶性。'),
        ]),
        htmlEl('div', { className: 'lab-tabs' }, [
          htmlEl('button', {
            className: `lab-tab ${tab === 'axioms' ? 'active' : ''}`,
            onClick: () => { tab = 'axioms'; renderAll(); },
          }, '群公理 5 步体检仪'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'perm' ? 'active' : ''}`,
            onClick: () => { tab = 'perm'; renderAll(); },
          }, 'Sₙ 编织复合 · 轮换轨道 · 逆序对'),
          htmlEl('button', {
            className: `lab-tab ${tab === 's3' ? 'active' : ''}`,
            onClick: () => { tab = 's3'; renderAll(); },
          }, 'S₃ 正三角形对称 & 交代群 A₃'),
        ]),
      ]);
      container.appendChild(header);

      if (tab === 'axioms') renderAxiomsTab();
      else if (tab === 'perm') renderPermTab();
      else renderS3Tab();
    }

    // -------------------------------------------------------------------------
    // Tab 1: Group Axioms 5-Step Inspector
    // -------------------------------------------------------------------------
    function renderAxiomsTab() {
      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('span', { style: { fontWeight: 700, fontSize: '12.5px' } }, '切换对比案例：'),
        ...Object.entries(AXIOM_CASES).map(([k, v]) => htmlEl('button', {
          className: `btn btn-sm ${axiomKey === k ? 'active' : ''}`,
          onClick: () => { axiomKey = k; renderAll(); },
        }, v.name)),
      ]);
      container.appendChild(bar);

      const cs = AXIOM_CASES[axiomKey];
      const grid = htmlEl('div', { className: 'split-wide' });
      container.appendChild(grid);

      // Left: Cayley table with inverse / idempotent highlights
      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, `${cs.name} 运算表（绿=单位元 1，红=缺失逆元行）`),
        htmlEl('span', { className: `chip ${cs.isGroup ? 'ok' : 'bad'}` }, cs.isGroup ? '✓ 构成群' : '✗ 不是群'),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });

      const tbl = htmlEl('table', { className: 'alg-table' });
      const head = htmlEl('tr', {}, [
        htmlEl('th', {}, cs.op),
        ...cs.labels.map((l) => htmlEl('th', {}, l)),
      ]);
      tbl.appendChild(htmlEl('thead', {}, head));

      const tbody = htmlEl('tbody');
      const n = cs.labels.length;
      for (let i = 0; i < n; i++) {
        const missingRow = cs.missingInv.includes(i);
        const tr = htmlEl('tr', {}, [htmlEl('th', { className: missingRow ? 'hl-bad' : '' }, cs.labels[i])]);
        for (let j = 0; j < n; j++) {
          const val = cs.mul(i, j);
          let cls = '';
          if (val === cs.identityIdx) cls = 'hl-ok';
          else if (missingRow) cls = 'hl-bad';
          else if (i === j && cs.idempotents.includes(i) && i !== cs.identityIdx) cls = 'hl-amber';
          tr.appendChild(htmlEl('td', { className: cls }, cs.labels[val]));
        }
        tbody.appendChild(tr);
      }
      tbl.appendChild(tbody);
      leftBody.appendChild(htmlEl('div', { className: 'alg-table-wrap' }, tbl));
      leftPanel.appendChild(leftBody);
      grid.appendChild(leftPanel);

      // Right: 5-step checklist & divisibility equivalence
      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '手写 5 条件 & 定理 6.2.3 可除性体检'),
      ]));
      const rightBody = htmlEl('div', { className: 'panel-body' }, [
        htmlEl('div', { className: 'stat-chips', style: { flexDirection: 'column', alignItems: 'stretch' } }, [
          htmlEl('span', { className: 'chip ok' }, '1. 非空性：集合包含元素'),
          htmlEl('span', { className: 'chip ok' }, '2. 封闭性：a · b 落回集合内'),
          htmlEl('span', { className: 'chip ok' }, '3. 结合律：(a · b) · c = a · (b · c)'),
          htmlEl('span', { className: 'chip ok' }, `4. 单位元（1）：存在 ${cs.labels[cs.identityIdx]} 使 1·a = a·1 = a`),
          htmlEl('span', { className: `chip ${cs.missingInv.length === 0 ? 'ok' : 'bad'}` },
            cs.missingInv.length === 0
              ? '5. 逆元素：每个元素都存在逆元（每行必出现绿色单位元）'
              : `5. 逆元素缺失：元素 ${cs.missingInv.map((x) => cs.labels[x]).join(', ')} 所在行找不到单位元！`),
          htmlEl('span', { className: `chip ${cs.idempotents.length === 1 ? 'ok' : 'warn'}` },
            `手写判定（等幂元唯一性）：幂等元共 ${cs.idempotents.length} 个 (${cs.idempotents.map((x) => cs.labels[x]).join(', ')})`),
        ]),
        htmlEl('div', { className: `formula-banner ${cs.isGroup ? '' : 'warn'}`, style: { marginTop: '12px' } }, [
          htmlEl('strong', {}, '结论解析'),
          htmlEl('span', {}, cs.note),
        ]),
      ]);
      rightPanel.appendChild(rightBody);
      grid.appendChild(rightPanel);
    }

    // -------------------------------------------------------------------------
    // Tab 2: S_n Braid Composition, Disjoint Cycles, Inversions & Transpositions
    // -------------------------------------------------------------------------
    function renderPermTab() {
      const resizePerm = (newN) => {
        sn = newN;
        sigma = M.permIdentity(newN);
        tau = M.permIdentity(newN);
        if (newN >= 3) {
          sigma = M.permFromCycles(newN, [Array.from({ length: newN }, (_, i) => i + 1)]);
          tau = M.permFromCycles(newN, [[1, 2]]);
        }
        traceElem = 1;
        orbitPow = 1;
      };

      const compST = M.permCompose(sigma, tau);
      const compTS = M.permCompose(tau, sigma);
      const commutes = M.permEquals(compST, compTS);
      const cycles = M.permToDisjointCycles(compST, true);
      const nonTrivCycles = M.permToDisjointCycles(compST, false);
      const trans = M.permToTranspositions(compST);
      const inv = M.permInversions(compST);
      const ord = M.permOrder(compST);
      const parity = M.permParity(compST);

      // Controls
      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '对称群 Sₙ 阶数 n：'),
          ...[3, 4, 5].map((k) => htmlEl('button', {
            className: `btn btn-sm ${sn === k ? 'active' : ''}`,
            onClick: () => { resizePerm(k); renderAll(); },
          }, `S_${k} (${[1, 1, 2, 6, 24, 120][k]}元)`)),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '追踪输入元素 x：'),
          ...Array.from({ length: sn }, (_, i) => i + 1).map((x) => htmlEl('button', {
            className: `btn btn-sm ${traceElem === x ? 'btn-primary' : ''}`,
            onClick: () => { traceElem = x; renderAll(); },
          }, String(x))),
        ]),
        htmlEl('button', {
          className: 'btn btn-sm',
          onClick: () => {
            const snAll = M.generateSn(sn);
            sigma = snAll[Math.floor(Math.random() * snAll.length)];
            tau = snAll[Math.floor(Math.random() * snAll.length)];
            orbitPow = 1;
            renderAll();
          },
        }, '随机生成 σ, τ'),
      ]);
      container.appendChild(bar);

      // Interactive Editors for sigma and tau
      const editRow = htmlEl('div', { className: 'grid-2' });
      function makePermEditor(title, pArr, onChange, color) {
        const card = htmlEl('div', { className: 'panel' });
        card.appendChild(htmlEl('div', { className: 'panel-head' }, [
          htmlEl('span', { className: 'panel-title', style: { color } }, title),
          htmlEl('span', { innerHTML: renderTex(cycleListTex(M.permToDisjointCycles(pArr, false))) }),
        ]));
        const body = htmlEl('div', { className: 'panel-body' });
        const tbl = htmlEl('table', { className: 'alg-table' });
        const r1 = htmlEl('tr', {}, Array.from({ length: sn }, (_, i) => htmlEl('th', {}, String(i + 1))));
        const r2 = htmlEl('tr', {}, Array.from({ length: sn }, (_, i) => {
          const td = htmlEl('td', { className: 'clickable hl-blue', title: '点击调整像或直接换位' }, String(pArr[i]));
          td.addEventListener('click', () => {
            // Swap pArr[i] with next number mod n so permutation stays valid 1-1!
            const nextVal = (pArr[i] % sn) + 1;
            const otherIdx = pArr.indexOf(nextVal);
            const nextArr = pArr.slice();
            nextArr[otherIdx] = pArr[i];
            nextArr[i] = nextVal;
            onChange(nextArr);
            renderAll();
          });
          return td;
        }));
        tbl.appendChild(r1);
        tbl.appendChild(r2);
        body.appendChild(tbl);
        body.appendChild(htmlEl('div', { style: { marginTop: '6px', fontSize: '11.5px', color: 'var(--text-muted)' } }, '点击第二行任意数字自动对换调整，始终保持 1-1 双射'));
        card.appendChild(body);
        return card;
      }

      editRow.appendChild(makePermEditor('外层置换 σ（第二作用）', sigma, (p) => { sigma = p; orbitPow = 1; }, 'var(--accent-blue)'));
      editRow.appendChild(makePermEditor('内层置换 τ（自右向左：最先作用）', tau, (p) => { tau = p; orbitPow = 1; }, 'var(--accent-teal)'));
      container.appendChild(editRow);

      // Middle: Braid Composition SVG + Disjoint Cycle Orbit Ring SVG
      const vizGrid = htmlEl('div', { className: 'grid-2' });
      container.appendChild(vizGrid);

      // Left SVG: Two-stage Right-to-Left Braid Diagram
      const braidPanel = htmlEl('div', { className: 'panel' });
      braidPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '自右向左复合编织图：(στ)(x) = σ(τ(x))'),
        htmlEl('span', { className: `chip ${commutes ? 'ok' : 'warn'}` }, commutes ? '此例恰巧 στ = τσ' : 'στ ≠ τσ（不交换）'),
      ]));
      const braidBody = htmlEl('div', { className: 'panel-body' });
      const braidBox = htmlEl('div', { className: 'canvas-box' });
      const bSvg = createSvg(420, 290);
      braidBox.appendChild(bSvg);

      const xPos = (i) => 70 + ((i - 1) * 280) / (sn - 1);
      const yTop = 44, yMid = 144, yBot = 244;

      bSvg.appendChild(el('text', { x: 14, y: yTop + 4, fill: 'var(--text-muted)', 'font-size': 11, 'font-weight': 700 }, '输入 x'));
      bSvg.appendChild(el('text', { x: 14, y: (yTop + yMid) / 2 + 4, fill: 'var(--accent-teal)', 'font-size': 11, 'font-weight': 700 }, '① τ(x)'));
      bSvg.appendChild(el('text', { x: 14, y: yMid + 4, fill: 'var(--text-muted)', 'font-size': 11, 'font-weight': 700 }, '中间态'));
      bSvg.appendChild(el('text', { x: 14, y: (yMid + yBot) / 2 + 4, fill: 'var(--accent-blue)', 'font-size': 11, 'font-weight': 700 }, '② σ(·)'));
      bSvg.appendChild(el('text', { x: 14, y: yBot + 4, fill: 'var(--text-muted)', 'font-size': 11, 'font-weight': 700 }, '(στ)(x)'));

      const tauOfTrace = tau[traceElem - 1];
      const finalOfTrace = sigma[tauOfTrace - 1];

      // Draw connections
      for (let i = 1; i <= sn; i++) {
        const isTracedTop = i === traceElem;
        const ti = tau[i - 1];
        bSvg.appendChild(el('path', {
          d: `M ${xPos(i)} ${yTop + 14} C ${xPos(i)} ${yTop + 56}, ${xPos(ti)} ${yMid - 56}, ${xPos(ti)} ${yMid - 14}`,
          fill: 'none',
          stroke: isTracedTop ? 'var(--accent-teal)' : 'var(--svg-line-muted)',
          'stroke-width': isTracedTop ? 3.2 : 1.6,
          'marker-end': isTracedTop ? 'url(#arrow-teal)' : 'none',
        }));

        const isTracedMid = i === tauOfTrace;
        const si = sigma[i - 1];
        bSvg.appendChild(el('path', {
          d: `M ${xPos(i)} ${yMid + 14} C ${xPos(i)} ${yMid + 56}, ${xPos(si)} ${yBot - 56}, ${xPos(si)} ${yBot - 14}`,
          fill: 'none',
          stroke: isTracedMid ? 'var(--accent-blue)' : 'var(--svg-line-muted)',
          'stroke-width': isTracedMid ? 3.2 : 1.6,
          'marker-end': isTracedMid ? 'url(#arrow-blue)' : 'none',
        }));
      }

      // Draw crossing red dots for final permutation compST inversions
      // (visualizing inverse pairs T on a compact mini-bar or overlay)
      for (let i = 1; i <= sn; i++) {
        const drawCircle = (x, y, val, active, strokeCol) => {
          const g = el('g', { class: 'svg-clickable' });
          g.appendChild(el('circle', {
            cx: x, cy: y, r: 14,
            fill: active ? strokeCol : 'var(--svg-node-fill)',
            stroke: strokeCol, 'stroke-width': 2,
          }));
          g.appendChild(el('text', {
            x, y: y + 4.5, 'text-anchor': 'middle',
            fill: active ? '#FFFFFF' : 'var(--text-primary)',
            'font-size': 12.5, 'font-weight': 800,
          }, String(val)));
          return g;
        };
        const gTop = drawCircle(xPos(i), yTop, i, i === traceElem, 'var(--accent-teal)');
        gTop.addEventListener('click', () => { traceElem = i; renderAll(); });
        bSvg.appendChild(gTop);
        bSvg.appendChild(drawCircle(xPos(i), yMid, i, i === tauOfTrace, 'var(--accent-purple)'));
        bSvg.appendChild(drawCircle(xPos(i), yBot, i, i === finalOfTrace, 'var(--accent-blue)'));
      }

      braidBody.appendChild(braidBox);
      braidBody.appendChild(htmlEl('div', {
        className: 'formula-banner info',
        style: { marginTop: '8px' },
        innerHTML: renderTex(`(\\sigma\\tau)(${traceElem}) = \\sigma(\\tau(${traceElem})) = \\sigma(${tauOfTrace}) = ${finalOfTrace}, \\quad \\sigma\\tau = ${permMatrixTex(compST)}`),
      }));
      braidPanel.appendChild(braidBody);
      vizGrid.appendChild(braidPanel);

      // Right SVG: Disjoint Cycles + Orbit Stepping (Period = lcm)
      const orbPanel = htmlEl('div', { className: 'panel' });
      orbPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '不相杂轮换轨道环（周期=lcm）'),
        htmlEl('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } }, [
          htmlEl('button', {
            className: 'btn btn-sm',
            onClick: () => { orbitPow = Math.max(0, orbitPow - 1); renderAll(); },
          }, '幂次 -1'),
          htmlEl('button', {
            className: 'btn btn-sm btn-primary',
            onClick: () => { orbitPow += 1; renderAll(); },
          }, `幂次 +1 (k=${orbitPow})`),
        ]),
      ]));
      const orbBody = htmlEl('div', { className: 'panel-body' });
      const orbBox = htmlEl('div', { className: 'canvas-box' });
      const oSvg = createSvg(420, 290);
      orbBox.appendChild(oSvg);

      const numRings = cycles.length;
      cycles.forEach((cyc, cIdx) => {
        const cx = ((cIdx + 0.5) * 420) / numRings;
        const cy = 140;
        const r = Math.min(72, Math.max(26, (210 / numRings) * 0.45));
        const col = PALETTE[cIdx % PALETTE.length];

        if (cyc.length === 1) {
          oSvg.appendChild(el('circle', {
            cx, cy, r: 22, fill: 'none', stroke: col, 'stroke-width': 2, 'stroke-dasharray': '3 3',
          }));
          oSvg.appendChild(el('circle', { cx, cy, r: 14, fill: 'var(--svg-node-fill)', stroke: col, 'stroke-width': 2.2 }));
          oSvg.appendChild(el('text', { x: cx, y: cy + 4.5, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 12.5, 'font-weight': 800 }, String(cyc[0])));
          oSvg.appendChild(el('text', { x: cx, y: cy + 44, 'text-anchor': 'middle', fill: col, 'font-size': 11, 'font-weight': 700 }, '不动点 (长1)'));
        } else {
          oSvg.appendChild(el('circle', {
            cx, cy, r, fill: 'none', stroke: col, 'stroke-width': 1.5, 'stroke-opacity': 0.35,
          }));
          const pts = cyc.map((_, idx) => {
            const ang = -Math.PI / 2 + (2 * Math.PI * idx) / cyc.length;
            return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
          });
          // Directed arrows between consecutive elements
          for (let j = 0; j < cyc.length; j++) {
            const p1 = pts[j];
            const p2 = pts[(j + 1) % cyc.length];
            const dx = p2.x - p1.x, dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy);
            const sx = p1.x + (16 * dx) / len, sy = p1.y + (16 * dy) / len;
            const ex = p2.x - (16 * dx) / len, ey = p2.y - (16 * dy) / len;
            oSvg.appendChild(el('line', {
              x1: sx, y1: sy, x2: ex, y2: ey,
              stroke: col, 'stroke-width': 2.2,
              'marker-end': `url(#arrow-${['blue', 'teal', 'amber', 'purple', 'rose'][cIdx % 5]})`,
            }));
          }
          // Nodes & stepped marker for element cyc[0] under (compST)^orbitPow
          const activePos = orbitPow % cyc.length;
          pts.forEach((pt, j) => {
            const isActive = j === activePos;
            oSvg.appendChild(el('circle', {
              cx: pt.x, cy: pt.y, r: isActive ? 16 : 13,
              fill: isActive ? col : 'var(--svg-node-fill)',
              stroke: col, 'stroke-width': 2.2,
            }));
            oSvg.appendChild(el('text', {
              x: pt.x, y: pt.y + 4.5, 'text-anchor': 'middle',
              fill: isActive ? '#FFFFFF' : 'var(--text-primary)',
              'font-size': 12.5, 'font-weight': 800,
            }, String(cyc[j])));
          });
          oSvg.appendChild(el('text', {
            x: cx, y: 248, 'text-anchor': 'middle', fill: col, 'font-size': 11.5, 'font-weight': 700,
          }, `(${cyc.join(' ')}) · 长 ${cyc.length}`));
        }
      });

      const powCycle = M.permPow(compST, orbitPow);
      const isBackToId = M.permEquals(powCycle, M.permIdentity(sn));
      oSvg.appendChild(el('text', {
        x: 210, y: 274, 'text-anchor': 'middle',
        fill: isBackToId ? 'var(--accent-green)' : 'var(--text-secondary)',
        'font-size': 12, 'font-weight': 700,
      }, isBackToId && orbitPow > 0
        ? `★ (στ)^${orbitPow} = (1) 全部轨道同步归位！周期 = ${ord}`
        : `当前 (στ)^${orbitPow} = ${M.permFormatCycle(powCycle)} | 周期 lcm = ${ord}`));

      orbBody.appendChild(orbBox);
      orbBody.appendChild(htmlEl('div', {
        className: 'formula-banner',
        style: { marginTop: '8px' },
        innerHTML: renderTex(`\\sigma\\tau = ${cycleListTex(nonTrivCycles)},\\quad \\text{周期} = \\mathrm{lcm}(${cycles.map((c) => c.length).join(',')}) = ${ord}`),
      }));
      orbPanel.appendChild(orbBody);
      vizGrid.appendChild(orbPanel);

      // Bottom: Transpositions & Inversion Crossings (Parity Invariance)
      const parityPanel = htmlEl('div', { className: 'panel' });
      parityPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '对换展开恒等式 & 双行表逆序对 T（红点交叉计数）'),
        htmlEl('span', { className: `chip ${parity.isEven ? 'ok' : 'bad'}` }, `${parity.label} · 逆序对 T=${inv.count} · Σ(rⱼ-1)=n-k=${parity.nMinusK}`),
      ]));
      const parityBody = htmlEl('div', { className: 'panel-body' });
      const pGrid = htmlEl('div', { className: 'split-wide' });

      // Single-stage crossing SVG showing exact T crossings!
      const crossBox = htmlEl('div', { className: 'canvas-box' });
      const cSvg = createSvg(400, 145);
      crossBox.appendChild(cSvg);
      const cxPos = (i) => 55 + ((i - 1) * 290) / (sn - 1);
      for (let i = 1; i <= sn; i++) {
        cSvg.appendChild(el('line', {
          x1: cxPos(i), y1: 30, x2: cxPos(compST[i - 1]), y2: 115,
          stroke: 'var(--accent-purple)', 'stroke-width': 2.2,
        }));
      }
      // Compute exact intersections of straight segments (i -> compST[i-1]) and (j -> compST[j-1])
      for (const [i, j, pi, pj] of inv.pairs) {
        const x1 = cxPos(i), x2 = cxPos(pi);
        const x3 = cxPos(j), x4 = cxPos(pj);
        // Solve linear intersection t in (0,1): x1 + t*(x2-x1) = x3 + t*(x4-x3)
        const denom = (x2 - x1) - (x4 - x3);
        const t = (x3 - x1) / denom;
        const ix = x1 + t * (x2 - x1);
        const iy = 30 + t * (115 - 30);
        cSvg.appendChild(el('circle', { cx: ix, cy: iy, r: 5, fill: 'var(--accent-rose)', stroke: '#FFFFFF', 'stroke-width': 1.2 }));
      }
      for (let i = 1; i <= sn; i++) {
        cSvg.appendChild(el('circle', { cx: cxPos(i), cy: 30, r: 12, fill: 'var(--svg-node-fill)', stroke: 'var(--accent-purple)', 'stroke-width': 2 }));
        cSvg.appendChild(el('text', { x: cxPos(i), y: 34, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 11.5, 'font-weight': 700 }, String(i)));
        cSvg.appendChild(el('circle', { cx: cxPos(i), cy: 115, r: 12, fill: 'var(--svg-node-fill)', stroke: 'var(--accent-blue)', 'stroke-width': 2 }));
        cSvg.appendChild(el('text', { x: cxPos(i), y: 119, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 11.5, 'font-weight': 700 }, String(i)));
      }
      cSvg.appendChild(el('text', { x: 200, y: 139, 'text-anchor': 'middle', fill: 'var(--accent-rose)', 'font-size': 11, 'font-weight': 700 }, `红点交点共 ${inv.count} 个 = 逆序对 T (奇偶性与对换数同奇偶)`));

      const formulaSide = htmlEl('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
        htmlEl('div', {
          className: 'formula-banner info',
          innerHTML: renderTex(`\\text{对换展开式（p.64 公式 3）：} ${cycleListTex(nonTrivCycles)} = ${transpositionsTex(trans)} \\quad (\\text{共 } ${trans.length}\\text{ 个对换})`),
        }),
        htmlEl('div', { className: 'formula-banner' }, [
          htmlEl('span', {}, `σ 的奇偶：${M.permParity(sigma).label} | τ 的奇偶：${M.permParity(tau).label} → 乘积 στ 必为【${parity.label}】（偶×偶=偶，奇×奇=偶，偶×奇=奇）`),
        ]),
      ]);

      pGrid.appendChild(crossBox);
      pGrid.appendChild(formulaSide);
      parityBody.appendChild(pGrid);
      parityPanel.appendChild(parityBody);
      container.appendChild(parityPanel);
    }

    // -------------------------------------------------------------------------
    // Tab 3: S_3 Triangle Symmetry & Alternating Group A_3
    // -------------------------------------------------------------------------
    function renderS3Tab() {
      const s3Elems = M.generateSn(3);
      const grid = htmlEl('div', { className: 'split-wide' });
      container.appendChild(grid);

      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '正三角形刚体对称变换（S₃ 几何化身）'),
        htmlEl('button', {
          className: 'btn btn-sm',
          onClick: () => { s3State = [1, 2, 3]; s3History = []; renderAll(); },
        }, '复位至恒等位置 (1,2,3)'),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(400, 290);
      box.appendChild(svg);

      const cx = 200, cy = 152, R = 95;
      // Fixed slot positions: Top(slot 1), Bottom-Right(slot 2), Bottom-Left(slot 3)
      const slots = [
        { x: cx, y: cy - R },
        { x: cx + R * Math.cos(Math.PI / 6), y: cy + R * Math.sin(Math.PI / 6) },
        { x: cx - R * Math.cos(Math.PI / 6), y: cy + R * Math.sin(Math.PI / 6) },
      ];
      // Symmetry axes
      slots.forEach((s, idx) => {
        svg.appendChild(el('line', {
          x1: cx - (s.x - cx) * 0.72, y1: cy - (s.y - cy) * 0.72,
          x2: s.x + (s.x - cx) * 0.25, y2: s.y + (s.y - cy) * 0.25,
          stroke: 'var(--border-strong)', 'stroke-dasharray': '4 4', 'stroke-width': 1.2,
        }));
        svg.appendChild(el('text', {
          x: s.x + (s.x - cx) * 0.34, y: s.y + (s.y - cy) * 0.34 + 4,
          'text-anchor': 'middle', fill: 'var(--text-muted)', 'font-size': 10.5,
        }, `位置 ${idx + 1}`));
      });

      const isEven = M.permParity(s3State).isEven;
      svg.appendChild(el('polygon', {
        points: slots.map((s) => `${s.x},${s.y}`).join(' '),
        fill: isEven ? 'var(--accent-green-soft)' : 'var(--accent-rose-soft)',
        stroke: isEven ? 'var(--accent-green)' : 'var(--accent-rose)',
        'stroke-width': 2.6,
      }));

      const vertexColors = ['', 'var(--accent-blue)', 'var(--accent-amber)', 'var(--accent-teal)'];
      // s3State[i] gives which original corner sits at slot i+1? Wait: if sigma maps corner i -> slot sigma(i),
      // let's render slot k holding label inv(s3State)[k-1] so applying sigma moves corner i to slot sigma(i)!
      const slotOccupant = M.permInverse(s3State);
      slots.forEach((pt, idx) => {
        const corner = slotOccupant[idx];
        svg.appendChild(el('circle', {
          cx: pt.x, cy: pt.y, r: 18,
          fill: vertexColors[corner], stroke: '#FFFFFF', 'stroke-width': 2.5,
        }));
        svg.appendChild(el('text', {
          x: pt.x, y: pt.y + 5, 'text-anchor': 'middle',
          fill: '#FFFFFF', 'font-size': 14, 'font-weight': 800,
        }, String(corner)));
      });

      svg.appendChild(el('text', {
        x: cx, y: 274, 'text-anchor': 'middle',
        fill: isEven ? 'var(--accent-green)' : 'var(--accent-rose)',
        'font-size': 12.5, 'font-weight': 700,
      }, `当前姿态：${M.permFormatCycle(s3State)}（${isEven ? '偶置换 ∈ 交代群 A₃ · 纯旋转保朝向' : '奇置换 ∉ A₃ · 空间翻转'}）`));

      leftBody.appendChild(box);
      leftPanel.appendChild(leftBody);
      grid.appendChild(leftPanel);

      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '点击左乘操作 σ（自右向左累乘：σ · 当前状态）'),
      ]));
      const rightBody = htmlEl('div', { className: 'panel-body' }, [
        htmlEl('div', { style: { fontWeight: 700, fontSize: '12.5px', color: 'var(--accent-green)', marginBottom: '6px' } }, '交代群 A₃（全体偶置换，共 3!/2 = 3 个 · 旋转对称）'),
        htmlEl('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' } },
          s3Elems.filter((p) => M.permParity(p).isEven).map((p) => htmlEl('button', {
            className: 'btn',
            onClick: () => {
              s3State = M.permCompose(p, s3State);
              s3History.push(M.permFormatCycle(p));
              renderAll();
            },
          }, `${M.permFormatCycle(p)}`))
        ),
        htmlEl('div', { style: { fontWeight: 700, fontSize: '12.5px', color: 'var(--accent-rose)', marginBottom: '6px' } }, '奇置换（共 3 个 · 轴镜面翻转）'),
        htmlEl('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' } },
          s3Elems.filter((p) => !M.permParity(p).isEven).map((p) => htmlEl('button', {
            className: 'btn',
            onClick: () => {
              s3State = M.permCompose(p, s3State);
              s3History.push(M.permFormatCycle(p));
              renderAll();
            },
          }, `${M.permFormatCycle(p)}`))
        ),
        htmlEl('div', { className: 'formula-banner info' }, [
          htmlEl('strong', {}, '交互体验建议（验证 S₃ 非交换）'),
          htmlEl('span', {}, '依次点击 (1 2) 再点 (1 3) 得 (1 2 3)；复位后反向依次点击 (1 3) 再点 (1 2) 得 (1 3 2) —— 翻折与旋转次序不可交换！'),
          htmlEl('span', { style: { fontSize: '12px', color: 'var(--text-muted)' } },
            `操作历史（自右向左）：${s3History.length ? s3History.slice().reverse().join(' · ') : '尚未操作'}`),
        ]),
      ]);
      rightPanel.appendChild(rightBody);
      grid.appendChild(rightPanel);
    }

    renderAll();
    return { applyPreset };
  }

  DM2.Labs.ch62 = {
    id: 'ch62',
    title: '6.2 群的定义与置换',
    badge: 'Sₙ 编织 · 轮换',
    subtitle: '公理体检、自右向左置换编织、不相杂轮换轨道与 S₃ 对称',
    render,
  };
})(window);
