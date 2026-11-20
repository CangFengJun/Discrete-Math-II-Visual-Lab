/* 6.4 Group Homomorphism, Isomorphism & First/Second/Third Theorems + Subgroup Correspondence HN Lab */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  DM2.Labs = DM2.Labs || {};
  const M = DM2.Math;
  const { el, createSvg, htmlEl, PALETTE, animateTween, bindTooltip } = DM2.Svg;
  const { renderTex } = DM2.KaTeX;

  function buildHomPresets() {
    const z12 = M.createZnAddGroup(12);
    const z4 = M.createZnAddGroup(4);
    const s3 = M.createSnGroup(3);
    const z2sgn = M.buildGroupFromTable({
      id: '{+1,-1}',
      name: '({+1, -1}, ×)',
      opSymbol: '·',
      labels: ['+1', '-1'],
      identityIdx: 0,
      mul: (a, b) => (a + b) % 2,
    });
    const d4 = M.createD4Group();
    const v4 = M.createV4Group();
    const i4 = M.buildGroupFromTable({
      id: '{1,i,-1,-i}',
      name: '({1, i, -1, -i}, ×)',
      opSymbol: '·',
      labels: ['1', 'i', '-1', '-i'],
      identityIdx: 0,
      mul: (a, b) => (a + b) % 4,
    });

    return {
      z12_z4: {
        name: '模 4 同态：σ: (Z₁₂, +) → (Z₄, +), x ↦ x mod 4',
        G: z12,
        Gp: z4,
        map: Array.from({ length: 12 }, (_, x) => x % 4),
        isIso: false,
        desc: '同态核 N = {0, 4, 8}（3元正规子群），Z₁₂ 被切成 4 条各含 3 个元素的纤维陪集。',
      },
      s3_sgn: {
        name: '奇偶符号同态：σ: S₃ → ({+1, -1}, ×)',
        G: s3,
        Gp: z2sgn,
        map: M.generateSn(3).map((p) => (M.permParity(p).isEven ? 0 : 1)),
        isIso: false,
        desc: '同态核 N = A₃ = {1, (1 2 3), (1 3 2)}（偶置换交代群），3 个偶置换折叠到 +1，3 个奇置换折叠到 -1。',
      },
      d4_v4: {
        name: '正方形对称商群：σ: D₄ → V₄ (模去中心 {1, r²})',
        G: d4,
        Gp: v4,
        // D4 labels: ['1','r','r²','r³','s','sr','sr²','sr³'] -> V4: ['1','a','b','c']
        // map 1,r^2 -> 0('1'), r,r^3 -> 1('a'), s,sr^2 -> 2('b'), sr,sr^3 -> 3('c')
        map: [0, 1, 0, 1, 2, 3, 2, 3],
        isIso: false,
        desc: '同态核 N = {1, r²}（旋转180°构成的正规子群），4 条纤维塌缩为 4 元 Klein 群 V₄。',
      },
      z4_i4: {
        name: '同构对照（1-1）：σ: (Z₄, +) ≅ ({1, i, -1, -i}, ×), k ↦ i^k',
        G: z4,
        Gp: i4,
        map: [0, 1, 2, 3],
        isIso: true,
        desc: '同态核仅含单位元 N = {0}：每条纤维只有 1 个元素，加法群 Z₄ 与 4 次单位根乘法群结构完全同构！',
      },
    };
  }

  function render(container, ctx) {
    const HOMS = buildHomPresets();
    let tab = 'collapse'; // 'collapse' | 'correspond'
    let homKey = 'z12_z4';
    let collapseT = 0; // 0 .. 1
    let cancelAnim = null;
    let cosetPickA = 1;
    let cosetPickB = 2;

    let selectedHIdx = 0;

    function applyPreset(p) {
      if (!p) return;
      if (p === 'subgroups-hn') {
        tab = 'correspond';
        homKey = 'z12_z4';
        const h = HOMS[homKey];
        const subs = M.enumerateSubgroups(h.G).subgroups;
        // Pick H = {0, 6} so N={0,4,8} is NOT contained in H -> HN expands!
        const idx = subs.findIndex((s) => s.order === 2 && !s.elements.includes(4));
        selectedHIdx = idx >= 0 ? idx : 1;
      } else if (p === 'collapse-quotient') {
        tab = 'collapse';
        homKey = 'z12_z4';
        collapseT = 1;
      } else if (p === 'isomorphism-z4') {
        tab = 'collapse';
        homKey = 'z4_i4';
        collapseT = 0;
      } else if (p === 'hom-triangle') {
        tab = 'triangle';
      } else {
        tab = 'collapse';
        homKey = 'z12_z4';
        collapseT = 0;
      }
      renderAll();
    }

    function renderAll() {
      container.innerHTML = '';

      const header = htmlEl('div', { className: 'lab-header' }, [
        htmlEl('div', { className: 'lab-title-wrap' }, [
          htmlEl('h1', {}, [
            '6.4 群的同态、同构与三大同态定理',
            htmlEl('span', { className: 'lab-badge' }, 'p.109–144 · 纤维塌缩与对应格'),
          ]),
          htmlEl('p', { className: 'lab-desc' }, '同态即“把同态核 N 及其陪集看成一个点”。按 PPT 编号：第一定理建纤维、第二定理成商群、第三定理证 G/N ≅ G\'。'),
        ]),
        htmlEl('div', { className: 'lab-tabs' }, [
          htmlEl('button', {
            className: `lab-tab ${tab === 'collapse' ? 'active' : ''}`,
            onClick: () => { tab = 'collapse'; renderAll(); },
          }, '纤维塌缩动画（第一 / 二 / 三同态定理）'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'triangle' ? 'active' : ''}`,
            onClick: () => { tab = 'triangle'; renderAll(); },
          }, '三圆同态交换三角图（群·环·有限域）'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'correspond' ? 'active' : ''}`,
            onClick: () => { tab = 'correspond'; renderAll(); },
          }, '子群对应定理 & 易错 HN 吸核膨胀'),
        ]),
      ]);
      container.appendChild(header);

      if (tab === 'triangle') {
        const host = htmlEl('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
        container.appendChild(host);
        DM2.HomTriangle.mount(host, 'grp_z12_z4');
        return;
      }

      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '选择同态映射 σ：'),
          (() => {
            const sel = htmlEl('select', { className: 'ctrl-select' });
            for (const [k, v] of Object.entries(HOMS)) {
              const o = htmlEl('option', { value: k }, v.name);
              if (k === homKey) o.selected = true;
              sel.appendChild(o);
            }
            sel.addEventListener('change', () => {
              homKey = sel.value;
              collapseT = 0;
              cosetPickA = 0;
              cosetPickB = Math.min(1, HOMS[homKey].Gp.order - 1);
              selectedHIdx = 0;
              renderAll();
            });
            return sel;
          })(),
        ]),
      ]);
      container.appendChild(bar);

      if (tab === 'collapse') renderCollapseTab(bar);
      else renderCorrespondTab();
    }

    // -------------------------------------------------------------------------
    // Tab 1: Fiber Collapse (Theorems 6.4.2, 6.4.3, 6.4.4)
    // -------------------------------------------------------------------------
    function renderCollapseTab(bar) {
      const h = HOMS[homKey];
      const { G, Gp, map } = h;
      const kernel = [];
      for (let i = 0; i < G.order; i++) {
        if (map[i] === Gp.identityIdx) kernel.push(i);
      }
      // Group elements into fibers keyed by image index in Gp
      const fibers = Array.from({ length: Gp.order }, (_, imgIdx) => {
        const elems = [];
        for (let i = 0; i < G.order; i++) if (map[i] === imgIdx) elems.push(i);
        const rep = elems[0];
        const notation = G.isAdditive
          ? `${G.labels[rep]} + N`
          : `${rep === G.identityIdx ? '' : G.labels[rep]}N`;
        return { imgIdx, imgLabel: Gp.labels[imgIdx], elems, rep, notation };
      });
      // Put identity fiber (kernel N) first
      fibers.sort((a, b) => (a.imgIdx === Gp.identityIdx ? -1 : b.imgIdx === Gp.identityIdx ? 1 : a.imgIdx - b.imgIdx));

      // Append collapse controls into bar
      const sliderWrap = htmlEl('div', { className: 'ctrl-group' }, [
        htmlEl('label', {}, `商群压缩进度 ${Math.round(collapseT * 100)}%：`),
        (() => {
          const r = htmlEl('input', { className: 'ctrl-range', type: 'range', min: 0, max: 1, step: 0.02, value: collapseT });
          r.addEventListener('input', () => {
            if (cancelAnim) cancelAnim();
            collapseT = Number(r.value);
            redrawStage();
          });
          return r;
        })(),
      ]);
      bar.appendChild(sliderWrap);
      bar.appendChild(htmlEl('button', {
        className: 'btn btn-sm btn-primary',
        onClick: () => {
          if (cancelAnim) cancelAnim();
          const target = collapseT < 0.5 ? 1 : 0;
          const start = collapseT;
          cancelAnim = animateTween(750, (t) => {
            collapseT = start + (target - start) * t;
            redrawStage();
          }, () => {
            collapseT = target;
            renderAll();
          });
        },
      }, collapseT < 0.5 ? '▶ 启动商群压缩机 (塌缩成 G/N)' : '↺ 展开纤维还原原群 G'));

      // Three Theorems Progress Strip
      const thmStrip = htmlEl('div', { className: 'grid-3' }, [
        htmlEl('div', { className: 'formula-banner' }, [
          htmlEl('strong', {}, '① 第一同态定理 (p.124)'),
          htmlEl('span', {}, `核 N = σ⁻¹(${Gp.labels[Gp.identityIdx]}) = {${kernel.map((i) => G.labels[i]).join(', ')}} 是正规子群；每个像元的原像恰是一条 N 陪集纤维。`),
        ]),
        htmlEl('div', { className: 'formula-banner info' }, [
          htmlEl('strong', {}, '② 第二同态定理 (p.129)'),
          htmlEl('span', {}, `按陪集乘法 (aN)(bN)=abN，全部 ${fibers.length} 条纤维压缩成商群 G/N，自然同态 a ↦ aN。`),
        ]),
        htmlEl('div', { className: 'formula-banner' }, [
          htmlEl('strong', {}, '③ 第三同态定理 (p.132)'),
          htmlEl('span', {}, `把纤维压成单点后，商群 G/N 与像群 ${Gp.id} 之间建立完美 1-1 双射：G/N ≅ ${Gp.id}！`),
        ]),
      ]);
      container.appendChild(thmStrip);

      const panel = htmlEl('div', { className: 'panel' });
      const body = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(780, 320);
      box.appendChild(svg);
      body.appendChild(box);
      panel.appendChild(body);
      container.appendChild(panel);

      function redrawStage() {
        while (svg.childNodes.length > 1) svg.removeChild(svg.lastChild);

        svg.appendChild(el('text', { x: 185, y: 24, 'text-anchor': 'middle', fill: 'var(--accent-blue)', 'font-size': 13, 'font-weight': 800 },
          collapseT > 0.85 ? `商群 ${G.id}/N（每条陪集纤维塌缩为 1 个点）` : `原群 ${G.id}（按核 N 的陪集纤维分层）`));
        svg.appendChild(el('text', { x: 605, y: 24, 'text-anchor': 'middle', fill: 'var(--accent-teal)', 'font-size': 13, 'font-weight': 800 },
          `同态像群 G' = ${Gp.id}`));

        const nFibers = fibers.length;
        const rowH = 265 / nFibers;

        fibers.forEach((fib, fi) => {
          const col = PALETTE[fi % PALETTE.length];
          const cy = 44 + (fi + 0.5) * rowH;
          const isKernel = fib.imgIdx === Gp.identityIdx;

          // Fiber box shrinks horizontally as collapseT -> 1
          const spreadW = Math.max(82, (1 - collapseT) * 240 + 82);
          const boxX = 185 - spreadW / 2;
          const boxH = Math.min(54, rowH - 10);

          svg.appendChild(el('rect', {
            x: boxX, y: cy - boxH / 2, width: spreadW, height: boxH, rx: 10 + collapseT * 14,
            fill: col, 'fill-opacity': 0.14 + collapseT * 0.12,
            stroke: col, 'stroke-width': isKernel ? 2.5 : 1.7,
          }));

          // Image node on right
          const rx = 605;
          svg.appendChild(el('line', {
            x1: boxX + spreadW + 6, y1: cy, x2: rx - 24, y2: cy,
            stroke: col, 'stroke-width': 2 + collapseT * 1.2,
            'stroke-dasharray': collapseT > 0.85 ? 'none' : '5 3',
            'marker-end': `url(#arrow-${['blue', 'teal', 'amber', 'purple', 'rose'][fi % 5]})`,
          }));

          if (collapseT > 0.85) {
            svg.appendChild(el('text', {
              x: (boxX + spreadW + rx - 24) / 2, y: cy - 7, 'text-anchor': 'middle',
              fill: col, 'font-size': 11, 'font-weight': 700,
            }, '1-1 双射'));
          }

          // Elements inside fiber interpolate toward center (185, cy)
          const kLen = fib.elems.length;
          if (collapseT < 0.85) {
            fib.elems.forEach((elemIdx, ei) => {
              const offset = kLen === 1 ? 0 : ((ei / (kLen - 1)) - 0.5) * (spreadW - 44);
              const ex = 185 + offset * (1 - collapseT);
              svg.appendChild(el('circle', {
                cx: ex, cy, r: 14,
                fill: 'var(--bg-panel)', stroke: col, 'stroke-width': 1.8,
                'fill-opacity': 1 - collapseT * 0.6,
              }));
              svg.appendChild(el('text', {
                x: ex, y: cy + 4, 'text-anchor': 'middle',
                fill: 'var(--text-primary)', 'font-size': 11, 'font-weight': 700,
                opacity: 1 - collapseT * 0.75,
              }, G.labels[elemIdx]));
            });
          } else {
            // Collapsed quotient super-node
            svg.appendChild(el('text', {
              x: 185, y: cy + 4.5, 'text-anchor': 'middle',
              fill: col, 'font-size': 12.5, 'font-weight': 800,
            }, isKernel ? `N (单位元)` : fib.notation));
          }

          // Fiber label on far left
          svg.appendChild(el('text', {
            x: 12, y: cy + 4, fill: col, 'font-size': 11, 'font-weight': 700,
          }, isKernel ? '核 N' : fib.notation));

          // Target node on right
          svg.appendChild(el('circle', {
            cx: rx, cy, r: 18,
            fill: col, stroke: '#FFFFFF', 'stroke-width': 2,
          }));
          svg.appendChild(el('text', {
            x: rx, y: cy + 5, 'text-anchor': 'middle',
            fill: '#FFFFFF', 'font-size': 12.5, 'font-weight': 800,
          }, fib.imgLabel));
        });
      }
      redrawStage();

      // Interactive Quotient Multiplication Sandbox (Lemma 1 & Handwritten NN=N)
      if (cosetPickA >= fibers.length) cosetPickA = 0;
      if (cosetPickB >= fibers.length) cosetPickB = 0;
      const fA = fibers[cosetPickA];
      const fB = fibers[cosetPickB];
      const prodRep = G.mul(fA.rep, fB.rep);
      const prodImg = map[prodRep];
      const fProd = fibers.find((f) => f.imgIdx === prodImg);

      const mulBox = htmlEl('div', { className: 'panel' }, [
        htmlEl('div', { className: 'panel-head' }, [
          htmlEl('span', { className: 'panel-title' }, '引理 1 & 手写重点（p.128）：商群陪集乘法验证（任意选代表结果不变，NN = N）'),
        ]),
        htmlEl('div', { className: 'panel-body' }, [
          htmlEl('div', { className: 'controls-bar' }, [
            htmlEl('div', { className: 'ctrl-group' }, [
              htmlEl('label', {}, '陪集 A：'),
              (() => {
                const s = htmlEl('select', { className: 'ctrl-select' });
                fibers.forEach((f, idx) => {
                  const o = htmlEl('option', { value: idx }, `${f.notation} = {${f.elems.map((i) => G.labels[i]).join(',')}}`);
                  if (idx === cosetPickA) o.selected = true;
                  s.appendChild(o);
                });
                s.addEventListener('change', () => { cosetPickA = Number(s.value); renderAll(); });
                return s;
              })(),
            ]),
            htmlEl('div', { className: 'ctrl-group' }, [
              htmlEl('label', {}, '陪集 B：'),
              (() => {
                const s = htmlEl('select', { className: 'ctrl-select' });
                fibers.forEach((f, idx) => {
                  const o = htmlEl('option', { value: idx }, `${f.notation} = {${f.elems.map((i) => G.labels[i]).join(',')}}`);
                  if (idx === cosetPickB) o.selected = true;
                  s.appendChild(o);
                });
                s.addEventListener('change', () => { cosetPickB = Number(s.value); renderAll(); });
                return s;
              })(),
            ]),
          ]),
          htmlEl('div', {
            className: 'formula-banner info',
            style: { marginTop: '10px' },
            innerHTML: renderTex(`(${fA.notation}) ${G.isAdditive ? '+' : '\\cdot'} (${fB.notation}) = ${fProd.notation} \\quad\\longleftrightarrow\\quad ${fA.imgLabel} ${Gp.isAdditive ? '+' : '\\cdot'} ${fB.imgLabel} = ${fProd.imgLabel}`),
          }),
        ]),
      ]);
      container.appendChild(mulBox);
    }

    // -------------------------------------------------------------------------
    // Tab 2: Subgroup Correspondence Theorem (Theorem 6.4.5) & HN Expansion
    // -------------------------------------------------------------------------
    function renderCorrespondTab() {
      const h = HOMS[homKey];
      const { G, Gp, map } = h;
      const kernel = [];
      for (let i = 0; i < G.order; i++) if (map[i] === Gp.identityIdx) kernel.push(i);
      const kernelSet = new Set(kernel);

      const latG = M.enumerateSubgroups(G);
      const latGp = M.enumerateSubgroups(Gp);
      if (selectedHIdx >= latG.subgroups.length) selectedHIdx = 0;

      const H = latG.subgroups[selectedHIdx];
      const containsKernel = kernel.every((k) => H.elements.includes(k));
      // Image sigma(H) in G'
      const imgSet = Array.from(new Set(H.elements.map((e) => map[e]))).sort((a, b) => a - b);
      const imgKey = imgSet.join(',');
      const matchingHp = latGp.subgroups.find((sg) => sg.key === imgKey);

      // Preimage sigma^-1(sigma(H)) = HN in G
      const preImgSet = [];
      const imgLookup = new Set(imgSet);
      for (let i = 0; i < G.order; i++) {
        if (imgLookup.has(map[i])) preImgSet.push(i);
      }
      const hnSg = latG.subgroups.find((sg) => sg.key === preImgSet.join(','));

      const escSet = (s) => (s || '').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
      const banner = htmlEl('div', {
        className: `formula-banner ${containsKernel ? '' : 'warn'}`,
      }, [
        htmlEl('strong', {}, containsKernel
          ? `✓ 此子群 H 包含核 N：处于 G 与 N 之间（N ⊆ H ⊆ G），呈现完美 1-1 对应！`
          : `⚠ 易错现象（p.137–140）：此子群 H 不包含核 N！原像拉回发生“吸核膨胀”：σ⁻¹(σ(H)) = HN ≠ H`),
        htmlEl('div', {
          innerHTML: renderTex(`H = ${escSet(H.label)} \\xrightarrow{\\sigma} H' = ${escSet(matchingHp ? matchingHp.label : '')} \\xrightarrow{\\sigma^{-1}} \\sigma^{-1}(\\sigma(H)) = HN = ${escSet(hnSg ? hnSg.label : '')}`),
        }),
      ]);
      container.appendChild(banner);

      const panel = htmlEl('div', { className: 'panel' });
      panel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '点击左侧 G 的任意子群 H（紫框=所选 H，琥珀脉冲=回拉膨胀后的 HN，绿标签=含 N 子群）'),
      ]));
      const body = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(780, 340);
      box.appendChild(svg);

      // Layout Hasse diagram helper inside a side rectangle
      function layoutLattice(lat, xStart, xWidth, title, checkKernel = false) {
        svg.appendChild(el('text', {
          x: xStart + xWidth / 2, y: 24, 'text-anchor': 'middle',
          fill: 'var(--text-primary)', 'font-size': 13, 'font-weight': 800,
        }, title));

        const orders = Array.from(new Set(lat.subgroups.map((s) => s.order))).sort((a, b) => a - b);
        const pos = new Map();
        orders.forEach((ordVal, lvl) => {
          const row = lat.subgroups.filter((s) => s.order === ordVal);
          const y = 304 - (lvl * 246) / Math.max(1, orders.length - 1);
          row.forEach((sg, idx) => {
            const x = xStart + ((idx + 1) * xWidth) / (row.length + 1);
            pos.set(sg.idx, { x, y });
          });
        });

        for (const [u, v] of lat.edges) {
          const p1 = pos.get(u), p2 = pos.get(v);
          svg.appendChild(el('line', {
            x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
            stroke: 'var(--border-strong)', 'stroke-width': 1.6,
          }));
        }

        return pos;
      }

      const posG = layoutLattice(latG, 18, 355, `${G.id} 子群格（共 ${latG.subgroups.length} 个）`, true);
      const posGp = layoutLattice(latGp, 445, 315, `${Gp.id} 子群格（共 ${latGp.subgroups.length} 个）`, false);

      // Draw round-trip correspondence curves!
      if (matchingHp && hnSg) {
        const pH = posG.get(H.idx);
        const pHp = posGp.get(matchingHp.idx);
        const pHN = posG.get(hnSg.idx);

        // Forward arrow H -> H'
        svg.appendChild(el('path', {
          d: `M ${pH.x + 36} ${pH.y} C ${pH.x + 160} ${pH.y - 24}, ${pHp.x - 160} ${pHp.y - 24}, ${pHp.x - 38} ${pHp.y}`,
          fill: 'none', stroke: 'var(--accent-blue)', 'stroke-width': 2.5, 'marker-end': 'url(#arrow-blue)',
        }));

        // Return arrow H' -> HN
        svg.appendChild(el('path', {
          d: `M ${pHp.x - 38} ${pHp.y + 8} C ${pHp.x - 160} ${pHp.y + 34}, ${pHN.x + 160} ${pHN.y + 34}, ${pHN.x + 38} ${pHN.y + 6}`,
          fill: 'none',
          stroke: containsKernel ? 'var(--accent-green)' : 'var(--accent-rose)',
          'stroke-width': 2.5,
          'stroke-dasharray': containsKernel ? 'none' : '5 3',
          'marker-end': containsKernel ? 'url(#arrow-green)' : 'url(#arrow-rose)',
        }));
      }

      // Draw G nodes
      for (const sg of latG.subgroups) {
        const pt = posG.get(sg.idx);
        const hasN = kernel.every((k) => sg.elements.includes(k));
        const isH = sg.idx === H.idx;
        const isHN = hnSg && sg.idx === hnSg.idx && !containsKernel;
        const g = el('g', { class: 'svg-clickable' });
        const strokeCol = isH ? 'var(--accent-purple)' : isHN ? 'var(--accent-rose)' : hasN ? 'var(--accent-green)' : 'var(--border-strong)';
        const fillCol = isH ? 'var(--accent-purple)' : isHN ? 'var(--accent-rose-soft)' : hasN ? 'var(--accent-green-soft)' : 'var(--svg-node-fill)';

        g.appendChild(el('rect', {
          x: pt.x - 34, y: pt.y - 14, width: 68, height: 28, rx: 8,
          fill: fillCol, stroke: strokeCol, 'stroke-width': (isH || isHN) ? 2.6 : 1.5,
        }));
        g.appendChild(el('text', {
          x: pt.x, y: pt.y + 4, 'text-anchor': 'middle',
          fill: isH ? '#FFFFFF' : 'var(--text-primary)',
          'font-size': 10.5, 'font-weight': 700,
        }, `${sg.order}元${sg.isNormal ? '★' : ''}`));
        g.addEventListener('click', () => { selectedHIdx = sg.idx; renderAll(); });
        bindTooltip(g, () => `<strong>${sg.label}</strong><br>元数：${sg.order} | ${sg.isNormal ? '正规子群' : '非正规'}<br>${hasN ? '✓ 包含同态核 N' : '✗ 不包含同态核 N'}`);
        svg.appendChild(g);
      }

      // Draw G' nodes
      for (const sg of latGp.subgroups) {
        const pt = posGp.get(sg.idx);
        const isHp = matchingHp && sg.idx === matchingHp.idx;
        const g = el('g', { class: 'svg-clickable' });
        g.appendChild(el('rect', {
          x: pt.x - 34, y: pt.y - 14, width: 68, height: 28, rx: 8,
          fill: isHp ? 'var(--accent-teal)' : 'var(--svg-node-fill)',
          stroke: isHp ? 'var(--accent-teal)' : 'var(--border-strong)',
          'stroke-width': isHp ? 2.5 : 1.5,
        }));
        g.appendChild(el('text', {
          x: pt.x, y: pt.y + 4, 'text-anchor': 'middle',
          fill: isHp ? '#FFFFFF' : 'var(--text-primary)',
          'font-size': 10.5, 'font-weight': 700,
        }, `${sg.order}元${sg.isNormal ? '★' : ''}`));
        // Clicking G' subgroup jumps directly to its unique upper-lattice preimage!
        g.addEventListener('click', () => {
          const setHp = new Set(sg.elements);
          const pre = [];
          for (let i = 0; i < G.order; i++) if (setHp.has(map[i])) pre.push(i);
          const targetIdx = latG.subgroups.findIndex((x) => x.key === pre.join(','));
          if (targetIdx >= 0) {
            selectedHIdx = targetIdx;
            renderAll();
          }
        });
        bindTooltip(g, () => `<strong>G' 子群 ${sg.label}</strong><br>点击跳转到其在 G 中的对应含核子群`);
        svg.appendChild(g);
      }

      body.appendChild(box);
      panel.appendChild(body);
      container.appendChild(panel);
    }

    renderAll();
    return { applyPreset };
  }

  DM2.Labs.ch64 = {
    id: 'ch64',
    title: '6.4 群的同态及同构',
    badge: '纤维塌缩 · HN',
    subtitle: '第一/二/三同态定理动画、商群压缩机与子群对应格',
    render,
  };
})(window);
