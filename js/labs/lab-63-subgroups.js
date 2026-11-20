/* 6.3 Subgroups, Cyclic Groups & Cosets Lab:
 * 1) Cyclic Group Clock Star Polygon + phi(n) Generators + Unique Divisor Subgroup Hasse Lattice
 * 2) Coset "Cake Slicing" (Lagrange), PPT Right Coset aH vs Left Coset Ha Overlay, Normal Subgroups & Cauchy Probe
 * 3) Interactive Subgroup Criterion I / II / III Checker
 */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  DM2.Labs = DM2.Labs || {};
  const M = DM2.Math;
  const { el, createSvg, htmlEl, PALETTE, bindTooltip } = DM2.Svg;
  const { renderTex } = DM2.KaTeX;

  function makeGroup(key) {
    if (key === 'Z12') return M.createZnAddGroup(12);
    if (key === 'V4') return M.createV4Group();
    if (key === 'S3') return M.createSnGroup(3);
    return M.createD4Group();
  }

  function render(container, ctx) {
    let tab = 'cyclic'; // 'cyclic' | 'coset' | 'subset'
    let cycN = 12;
    let cycK = 5;

    let grpKey = 'S3';
    let subIdx = 1; // index into enumerateSubgroups
    let showLeftCosets = true;
    let cauchyPrime = null;

    let customSet = new Set([0]);

    function applyPreset(p) {
      if (!p) return;
      if (p === 'cyclic-clock') {
        tab = 'cyclic';
        cycN = 12;
        cycK = 5;
      } else if (p === 'coset-normal-s3') {
        tab = 'coset';
        grpKey = 'S3';
        const G = makeGroup('S3');
        const subs = M.enumerateSubgroups(G).subgroups;
        subIdx = subs.findIndex((s) => !s.isNormal);
        if (subIdx < 0) subIdx = 1;
        showLeftCosets = true;
      } else if (p === 'coset-partition') {
        tab = 'coset';
        grpKey = 'D4';
        const G = makeGroup('D4');
        const subs = M.enumerateSubgroups(G).subgroups;
        subIdx = subs.findIndex((s) => s.order === 4 && s.isNormal);
        if (subIdx < 0) subIdx = 1;
        showLeftCosets = true;
      } else if (p === 'subgroup-check') {
        tab = 'subset';
        grpKey = 'Z12';
        customSet = new Set([0, 4, 8]);
      }
      renderAll();
    }

    function renderAll() {
      container.innerHTML = '';

      const header = htmlEl('div', { className: 'lab-header' }, [
        htmlEl('div', { className: 'lab-title-wrap' }, [
          htmlEl('h1', {}, [
            '6.3 子群、巡回（循环）群与陪集',
            htmlEl('span', { className: 'lab-badge' }, 'p.70–108 · Lagrange & Cauchy'),
          ]),
          htmlEl('p', { className: 'lab-desc' }, '巡回群的生成元即时钟盘上走满全部格点的步长；陪集是把群“等面积切蛋糕”；正规子群则要求左右陪集块严丝合缝对齐。'),
        ]),
        htmlEl('div', { className: 'lab-tabs' }, [
          htmlEl('button', {
            className: `lab-tab ${tab === 'cyclic' ? 'active' : ''}`,
            onClick: () => { tab = 'cyclic'; renderAll(); },
          }, '巡回群时钟星形 & φ(n) 生成元'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'coset' ? 'active' : ''}`,
            onClick: () => { tab = 'coset'; renderAll(); },
          }, '陪集切蛋糕 · 左右对齐 · 正规子群'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'subset' ? 'active' : ''}`,
            onClick: () => { tab = 'subset'; renderAll(); },
          }, '子群判别条件一 / 二 / 三实验'),
        ]),
      ]);
      container.appendChild(header);

      if (tab === 'cyclic') renderCyclicTab();
      else if (tab === 'coset') renderCosetTab();
      else renderSubsetTab();
    }

    // -------------------------------------------------------------------------
    // Tab 1: Cyclic Group Clock Star Polygon & Unique Divisor Lattice
    // -------------------------------------------------------------------------
    function renderCyclicTab() {
      const phi = M.eulerPhi(cycN);
      const stepGcd = M.gcd(cycN, cycK);
      const ord = cycK === 0 ? 1 : cycN / stepGcd;
      const visited = [];
      for (let t = 0; t < ord; t++) visited.push((t * cycK) % cycN);
      const isGen = stepGcd === 1;

      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, `群元数 n = ${cycN}`),
          (() => {
            const r = htmlEl('input', { className: 'ctrl-range', type: 'range', min: 2, max: 16, value: cycN });
            r.addEventListener('input', () => {
              cycN = Number(r.value);
              if (cycK >= cycN) cycK = cycN - 1;
              renderAll();
            });
            return r;
          })(),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, `生成元候选步长 k = ${cycK}`),
          (() => {
            const r = htmlEl('input', { className: 'ctrl-range', type: 'range', min: 0, max: cycN - 1, value: cycK });
            r.addEventListener('input', () => {
              cycK = Number(r.value);
              renderAll();
            });
            return r;
          })(),
        ]),
        htmlEl('span', { className: `chip ${isGen ? 'ok' : 'warn'}` },
          isGen ? `★ (n,k)=1：k=${cycK} 是生成元，遍历全圆` : `生成子群元数 ${ord} | ${cycN}（仅踩中 ${ord} 点）`),
        htmlEl('span', { className: 'chip' }, `φ(${cycN}) = ${phi} 个生成元`),
      ]);
      container.appendChild(bar);

      const grid = htmlEl('div', { className: 'grid-2' });
      container.appendChild(grid);

      // Left SVG: Clock Star
      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '巡回群时钟星形图（绿圈标注所有生成元）'),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });
      const box1 = htmlEl('div', { className: 'canvas-box' });
      const svg1 = createSvg(400, 320);
      box1.appendChild(svg1);

      const cx = 200, cy = 152, R = 112;
      svg1.appendChild(el('circle', {
        cx, cy, r: R, fill: 'none', stroke: 'var(--border-strong)', 'stroke-width': 1.4, 'stroke-dasharray': '4 4',
      }));

      const ptOf = (idx) => {
        const ang = -Math.PI / 2 + (2 * Math.PI * idx) / cycN;
        return { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
      };

      // Draw star trajectory 0 -> k -> 2k -> ... -> 0
      if (ord > 1) {
        for (let t = 0; t < ord; t++) {
          const p1 = ptOf(visited[t]);
          const p2 = ptOf(visited[(t + 1) % ord]);
          const dx = p2.x - p1.x, dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy);
          svg1.appendChild(el('line', {
            x1: p1.x + (14 * dx) / len, y1: p1.y + (14 * dy) / len,
            x2: p2.x - (16 * dx) / len, y2: p2.y - (16 * dy) / len,
            stroke: isGen ? 'var(--accent-green)' : 'var(--accent-blue)',
            'stroke-width': 2.2,
            'marker-end': isGen ? 'url(#arrow-green)' : 'url(#arrow-blue)',
          }));
        }
      }

      const visitedSet = new Set(visited);
      for (let i = 0; i < cycN; i++) {
        const pt = ptOf(i);
        const coprime = M.gcd(cycN, i) === 1;
        const inSub = visitedSet.has(i);
        const isCurrent = i === cycK;
        const g = el('g', { class: 'svg-clickable' });
        if (coprime) {
          g.appendChild(el('circle', {
            cx: pt.x, cy: pt.y, r: 19, fill: 'none', stroke: 'var(--accent-green)', 'stroke-width': 1.8, 'stroke-dasharray': '3 2',
          }));
        }
        g.appendChild(el('circle', {
          cx: pt.x, cy: pt.y, r: isCurrent ? 15 : 13,
          fill: isCurrent ? 'var(--accent-blue)' : inSub ? 'var(--accent-teal)' : 'var(--svg-node-fill)',
          stroke: inSub ? 'var(--accent-teal)' : 'var(--border-strong)',
          'stroke-width': 2,
        }));
        g.appendChild(el('text', {
          x: pt.x, y: pt.y + 4.5, 'text-anchor': 'middle',
          fill: (isCurrent || inSub) ? '#FFFFFF' : 'var(--text-muted)',
          'font-size': 11.5, 'font-weight': 800,
        }, String(i)));
        g.addEventListener('click', () => { cycK = i; renderAll(); });
        bindTooltip(g, () => `元素 ${i}（点击切换为步长）<br>周期 = ${i === 0 ? 1 : cycN / M.gcd(cycN, i)}<br>${coprime ? '✓ 与 ' + cycN + ' 互质（生成元）' : '非生成元'}`);
        svg1.appendChild(g);
      }

      svg1.appendChild(el('text', {
        x: cx, y: 304, 'text-anchor': 'middle', fill: 'var(--text-secondary)', 'font-size': 12, 'font-weight': 700,
      }, `生成子群 (${cycK}) = { ${visited.slice().sort((a, b) => a - b).join(', ')} } · 周期 ${ord}`));

      leftBody.appendChild(box1);
      leftPanel.appendChild(leftBody);
      grid.appendChild(leftPanel);

      // Right SVG: Unique Subgroup Lattice by Divisors of n (Handwritten p.106)
      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '手写重点（p.106）：每个正因子 d|n 对应唯一 d 阶子群'),
      ]));
      const rightBody = htmlEl('div', { className: 'panel-body' });
      const box2 = htmlEl('div', { className: 'canvas-box' });
      const svg2 = createSvg(400, 320);
      box2.appendChild(svg2);

      const divs = M.divisors(cycN);
      // Group divisors by number of prime factors (level in Hasse diagram)
      const primeFactorCount = (num) => {
        let cnt = 0, x = num;
        for (let d = 2; d * d <= x; d++) {
          while (x % d === 0) { cnt++; x /= d; }
        }
        if (x > 1) cnt++;
        return cnt;
      };
      const maxLevel = primeFactorCount(cycN);
      const byLevel = new Map();
      for (const d of divs) {
        const lvl = primeFactorCount(d);
        if (!byLevel.has(lvl)) byLevel.set(lvl, []);
        byLevel.get(lvl).push(d);
      }
      const posMap = new Map();
      for (const [lvl, arr] of byLevel.entries()) {
        const y = 278 - (lvl * 236) / Math.max(1, maxLevel);
        arr.forEach((d, idx) => {
          const x = ((idx + 1) * 400) / (arr.length + 1);
          posMap.set(d, { x, y });
        });
      }

      // Cover edges
      for (const d1 of divs) {
        for (const d2 of divs) {
          if (d2 <= d1 || d2 % d1 !== 0) continue;
          const ratio = d2 / d1;
          if (M.isPrime(ratio)) {
            const p1 = posMap.get(d1), p2 = posMap.get(d2);
            svg2.appendChild(el('line', {
              x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
              stroke: 'var(--border-strong)', 'stroke-width': 1.8,
            }));
          }
        }
      }

      for (const d of divs) {
        const pt = posMap.get(d);
        const isActive = d === ord;
        const g = el('g', { class: 'svg-clickable' });
        const step = cycN / d;
        g.appendChild(el('rect', {
          x: pt.x - 36, y: pt.y - 16, width: 72, height: 32, rx: 16,
          fill: isActive ? 'var(--accent-blue)' : 'var(--svg-node-fill)',
          stroke: isActive ? 'var(--accent-blue)' : 'var(--accent-teal)',
          'stroke-width': isActive ? 2.6 : 1.8,
        }));
        g.appendChild(el('text', {
          x: pt.x, y: pt.y + 4, 'text-anchor': 'middle',
          fill: isActive ? '#FFFFFF' : 'var(--text-primary)',
          'font-size': 11.5, 'font-weight': 700,
        }, `${d}元 (${step % cycN})`));
        g.addEventListener('click', () => {
          cycK = step % cycN;
          renderAll();
        });
        svg2.appendChild(g);
      }

      rightBody.appendChild(box2);
      rightPanel.appendChild(rightBody);
      grid.appendChild(rightPanel);
    }

    // -------------------------------------------------------------------------
    // Tab 2: Cosets Cake Slicing, Right aH vs Left Ha Overlay, Normal & Cauchy
    // -------------------------------------------------------------------------
    function renderCosetTab() {
      const G = makeGroup(grpKey);
      const { subgroups } = M.enumerateSubgroups(G);
      if (subIdx >= subgroups.length) subIdx = Math.min(1, subgroups.length - 1);
      const chosen = subgroups[subIdx];
      const cInfo = M.analyzeCosets(G, chosen.elements);

      // Prime factors of |G| for Cauchy probe
      const primesOfG = [];
      let tmpOrd = G.order;
      for (let d = 2; d <= tmpOrd; d++) {
        if (tmpOrd % d === 0 && M.isPrime(d)) primesOfG.push(d);
      }

      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '选择群 G：'),
          ...['Z12', 'V4', 'S3', 'D4'].map((k) => htmlEl('button', {
            className: `btn btn-sm ${grpKey === k ? 'active' : ''}`,
            onClick: () => {
              grpKey = k;
              subIdx = 1;
              cauchyPrime = null;
              renderAll();
            },
          }, k === 'Z12' ? 'Z₁₂ (循环)' : k === 'V4' ? 'V₄ (交换非循环)' : k === 'S3' ? 'S₃ (非交换6元)' : 'D₄ (非交换8元)')),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '选择子群 H：'),
          (() => {
            const sel = htmlEl('select', { className: 'ctrl-select' });
            subgroups.forEach((sg, i) => {
              const tag = sg.isNormal ? '★正规' : '非正规';
              const o = htmlEl('option', { value: i }, `${sg.label} (阶 ${sg.order}, 指数 ${sg.index} · ${tag})`);
              if (i === subIdx) o.selected = true;
              sel.appendChild(o);
            });
            sel.addEventListener('change', () => {
              subIdx = Number(sel.value);
              renderAll();
            });
            return sel;
          })(),
        ]),
        htmlEl('label', { className: 'ctrl-group', style: { cursor: 'pointer' } }, [
          (() => {
            const cb = htmlEl('input', { type: 'checkbox', checked: showLeftCosets ? 'checked' : null });
            cb.addEventListener('change', () => { showLeftCosets = cb.checked; renderAll(); });
            return cb;
          })(),
          htmlEl('span', {}, '对比左陪集 Ha 与右陪集 aH（PPT约定）'),
        ]),
      ]);
      container.appendChild(bar);

      // Cauchy Probe bar
      const cauchyBar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('span', { style: { fontWeight: 700, fontSize: '12px' } }, `Cauchy 定理探针（p | |G|=${G.order} 必存在周期为 p 的元素）：`),
        ...primesOfG.map((p) => htmlEl('button', {
          className: `btn btn-sm ${cauchyPrime === p ? 'btn-primary' : ''}`,
          onClick: () => { cauchyPrime = cauchyPrime === p ? null : p; renderAll(); },
        }, `点亮周期 p = ${p} 的元素`)),
        htmlEl('span', { className: 'chip ok' }, `Lagrange：|G|=${G.order} = (G:H)·|H| = ${cInfo.index} × ${chosen.order}`),
        htmlEl('span', { className: `chip ${cInfo.isNormal ? 'ok' : 'bad'}` },
          cInfo.isNormal
            ? (cInfo.index === 2 ? '✓ 指数为 2 必正规！gH = Hg' : '✓ 正规子群：∀g∈G 恒有 gH = Hg')
            : '✗ 非正规子群：存在 g 使 gH ≠ Hg（左右陪集错位）'),
      ]);
      container.appendChild(cauchyBar);

      // Cake Slicing SVG
      const panel = htmlEl('div', { className: 'panel' });
      panel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '陪集等面积“切蛋糕”划分（按本课程 PPT 约定：aH 称右陪集，Ha 称左陪集）'),
      ]));
      const body = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const hSvg = showLeftCosets ? 320 : 190;
      const svg = createSvg(760, hSvg);
      box.appendChild(svg);

      const renderCosetRow = (cosets, yBase, titleLabel) => {
        svg.appendChild(el('text', {
          x: 18, y: yBase - 12, fill: 'var(--text-primary)', 'font-size': 12.5, 'font-weight': 800,
        }, titleLabel));
        const totalGap = (cosets.length - 1) * 12;
        const availW = 724 - totalGap;
        const blockW = availW / cosets.length;
        cosets.forEach((cos, ci) => {
          const col = PALETTE[ci % PALETTE.length];
          const bx = 18 + ci * (blockW + 12);
          svg.appendChild(el('rect', {
            x: bx, y: yBase, width: blockW, height: 108, rx: 10,
            fill: col, 'fill-opacity': 0.13, stroke: col, 'stroke-width': 2,
          }));
          svg.appendChild(el('text', {
            x: bx + blockW / 2, y: yBase + 22, 'text-anchor': 'middle',
            fill: col, 'font-size': 12.5, 'font-weight': 800,
          }, `${cos.notation} (${cos.elements.length}元)`));

          const cols = Math.min(cos.elements.length, Math.max(1, Math.floor((blockW - 12) / 48)));
          const cellW = (blockW - 16) / cols;
          cos.elements.forEach((elemIdx, ei) => {
            const rowIdx = Math.floor(ei / cols);
            const colIdx = ei % cols;
            const ex = bx + 8 + (colIdx + 0.5) * cellW;
            const ey = yBase + 48 + rowIdx * 32;
            const isRep = elemIdx === cos.rep;
            const elemOrd = G.elementOrder(elemIdx);
            const isCauchyHit = cauchyPrime !== null && elemOrd === cauchyPrime;
            const pillW = Math.min(48, cellW - 4);
            svg.appendChild(el('rect', {
              x: ex - pillW / 2, y: ey - 12, width: pillW, height: 24, rx: 6,
              fill: isCauchyHit ? 'var(--accent-amber)' : 'var(--bg-panel)',
              stroke: isRep ? col : 'var(--border-strong)',
              'stroke-width': isRep ? 2.2 : 1,
            }));
            svg.appendChild(el('text', {
              x: ex, y: ey + 4, 'text-anchor': 'middle',
              fill: isCauchyHit ? '#FFFFFF' : 'var(--text-primary)',
              'font-size': 11, 'font-weight': isRep ? 800 : 600,
            }, G.labels[elemIdx]));
          });
        });
      };

      renderCosetRow(cInfo.rightCosets, 38, `右陪集划分：G = ${cInfo.rightCosets.map((c) => c.notation).join(' ∪ ')} （加粗边框为右代表系：{ ${cInfo.rightReps.map((r) => G.labels[r]).join(', ')} }）`);
      if (showLeftCosets) {
        renderCosetRow(cInfo.leftCosets, 186, `左陪集划分：G = ${cInfo.leftCosets.map((c) => c.notation).join(' ∪ ')} ${cInfo.isNormal ? '（与上方划分完全一致！）' : '（划分边界与上方发生错位！）'}`);
      }

      body.appendChild(box);

      // Conjugation witness table
      const badConj = cInfo.conjugations.filter((c) => !c.equal);
      body.appendChild(htmlEl('div', {
        className: `formula-banner ${cInfo.isNormal ? '' : 'warn'}`,
        style: { marginTop: '10px' },
      }, [
        htmlEl('strong', {}, cInfo.isNormal
          ? '正规子群验证（结论 p.104–105）：对任意 g ∈ G，gHg⁻¹ = H'
          : `非正规见证：共有 ${badConj.length} 个元素导致 gH ≠ Hg`),
        badConj.length > 0
          ? htmlEl('span', {}, `例如取 g = ${badConj[0].gLabel}：gH = {${badConj[0].aH.map((i) => G.labels[i]).join(', ')}} ≠ Hg = {${badConj[0].Ha.map((i) => G.labels[i]).join(', ')}}，且 gHg⁻¹ = {${badConj[0].gHgInv.map((i) => G.labels[i]).join(', ')}} ⊈ H。`)
          : htmlEl('span', {}, `任意元素 a ∈ G 都满足 a^${G.order} = ${G.labels[G.identityIdx]}（定理 6.3.8）。`),
      ]));

      panel.appendChild(body);
      container.appendChild(panel);
    }

    // -------------------------------------------------------------------------
    // Tab 3: Subgroup Criteria I, II, III Interactive Lab
    // -------------------------------------------------------------------------
    function renderSubsetTab() {
      const G = makeGroup(grpKey);
      const filtered = Array.from(customSet).filter((i) => i < G.order);
      customSet = new Set(filtered);
      const analysis = M.analyzeSubset(G, filtered);

      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '底群 G：'),
          ...['Z12', 'V4', 'S3', 'D4'].map((k) => htmlEl('button', {
            className: `btn btn-sm ${grpKey === k ? 'active' : ''}`,
            onClick: () => { grpKey = k; customSet = new Set([0]); renderAll(); },
          }, k)),
        ]),
        htmlEl('button', {
          className: 'btn btn-sm',
          onClick: () => { customSet = new Set(M.generateClosure(G, Array.from(customSet))); renderAll(); },
        }, '一键求生成子群 ⟨H⟩'),
        htmlEl('button', {
          className: 'btn btn-sm',
          onClick: () => { customSet = new Set([0]); renderAll(); },
        }, '仅留单位元'),
      ]);
      container.appendChild(bar);

      const grid = htmlEl('div', { className: 'split-wide' });
      container.appendChild(grid);

      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '勾选集合 H 的元素（实时检验三条子群判别定理）'),
        htmlEl('span', { className: `chip ${analysis.isSubgroup ? 'ok' : 'bad'}` }, analysis.isSubgroup ? '✓ H 是 G 的子群' : '✗ H 不是子群'),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' }, [
        htmlEl('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' } },
          G.labels.map((lbl, idx) => {
            const active = customSet.has(idx);
            return htmlEl('button', {
              className: `btn ${active ? 'btn-primary' : ''}`,
              onClick: () => {
                if (active) customSet.delete(idx);
                else customSet.add(idx);
                renderAll();
              },
            }, lbl);
          })
        ),
        htmlEl('div', { className: 'formula-banner info' }, [
          htmlEl('strong', {}, `当前子集 H = { ${analysis.elements.map((i) => G.labels[i]).join(', ') || '∅'} } （|H| = ${analysis.elements.length}）`),
          htmlEl('span', {}, `G 的元数 |G| = ${G.order}；${G.order % Math.max(1, analysis.elements.length) === 0 ? `${analysis.elements.length} 整除 ${G.order}` : `${analysis.elements.length} 不整除 ${G.order}（违反 Lagrange 定理，必非子群）`}`),
        ]),
      ]);
      leftPanel.appendChild(leftBody);
      grid.appendChild(leftPanel);

      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '定理 6.3.1 / 6.3.2 / 6.3.3 实时诊断'),
      ]));
      rightPanel.appendChild(htmlEl('div', { className: 'panel-body' }, [
        htmlEl('div', { className: 'stat-chips', style: { flexDirection: 'column', alignItems: 'stretch' } }, [
          htmlEl('span', { className: `chip ${analysis.nonEmpty ? 'ok' : 'bad'}` }, `条件(3) 非空性 H ≠ ∅：${analysis.nonEmpty ? '✓ 满足' : '✗ 为空集'}`),
          htmlEl('span', { className: `chip ${analysis.closed ? 'ok' : 'bad'}` },
            analysis.closed ? '条件(1) 运算封闭 a·b ∈ H：✓ 满足'
              : `条件(1) 不封闭：${G.labels[analysis.closureWitness[0][0]]} ${G.opSymbol} ${G.labels[analysis.closureWitness[0][1]]} = ${G.labels[analysis.closureWitness[0][2]]} ∉ H`),
          htmlEl('span', { className: `chip ${analysis.closedInverse ? 'ok' : 'bad'}` },
            analysis.closedInverse ? '条件(2) 逆元封闭 a⁻¹ ∈ H：✓ 满足'
              : `条件(2) 缺逆元：${G.labels[analysis.invWitness[0][0]]}⁻¹ = ${G.labels[analysis.invWitness[0][1]]} ∉ H`),
          htmlEl('span', { className: `chip ${analysis.abInvClosed ? 'ok' : 'bad'}` },
            `判别条件二（定理 6.3.2）：a·b⁻¹ ∈ H → ${analysis.abInvClosed ? '✓ 满足' : '✗ 不满足'}`),
          htmlEl('span', { className: `chip ${analysis.nonEmpty && analysis.closed ? 'ok' : 'bad'}` },
            `判别条件三（定理 6.3.3 有限群特权）：非空且封闭即可 → ${analysis.nonEmpty && analysis.closed ? '✓ 满足（自动导出逆元封闭！）' : '✗ 不满足'}`),
        ]),
      ]));
      grid.appendChild(rightPanel);
    }

    renderAll();
    return { applyPreset };
  }

  DM2.Labs.ch63 = {
    id: 'ch63',
    title: '6.3 子群及其陪集',
    badge: '巡回群 · 陪集',
    subtitle: '时钟星形、Hasse 子群格、陪集切蛋糕与正规性对齐',
    render,
  };
})(window);
