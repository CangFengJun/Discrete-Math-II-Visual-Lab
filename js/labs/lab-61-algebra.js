/* 6.1 Algebra Systems Lab: Interactive Cayley Heatmap + 6 Laws Geometric Probes + Set Venn Laws */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  DM2.Labs = DM2.Labs || {};
  const { el, createSvg, htmlEl, bindTooltip } = DM2.Svg;
  const { renderTex } = DM2.KaTeX;

  const PRESET_TABLES = {
    z6add: {
      name: '(Z₆, +) 模6加法',
      op: '+',
      labels: ['0', '1', '2', '3', '4', '5'],
      table: Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => (i + j) % 6)),
      editable: false,
    },
    z6mul: {
      name: '(Z₆, ×) 模6乘法',
      op: '×',
      labels: ['0', '1', '2', '3', '4', '5'],
      table: Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => (i * j) % 6)),
      editable: false,
    },
    noncomm: {
      name: '非交换 4 元系统 (左投影 a*b=a 等变体)',
      op: '*',
      labels: ['a', 'b', 'c', 'd'],
      table: [
        [0, 1, 2, 3],
        [1, 0, 3, 2],
        [2, 2, 2, 2],
        [3, 1, 0, 2],
      ],
      editable: false,
    },
    custom4: {
      name: '自定义 4×4 运算表（点击单元格循环改值）',
      op: '*',
      labels: ['e', 'a', 'b', 'c'],
      table: [
        [0, 1, 2, 3],
        [1, 2, 3, 0],
        [2, 3, 0, 1],
        [3, 0, 1, 2],
      ],
      editable: true,
    },
  };

  function inspectTable(labels, table) {
    const n = labels.length;
    const commViolations = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (table[i][j] !== table[j][i]) {
          commViolations.push([i, j]);
        }
      }
    }
    const idempotents = [];
    for (let i = 0; i < n; i++) {
      if (table[i][i] === i) idempotents.push(i);
    }
    const rowDupCells = [];
    const colDupCells = [];
    for (let i = 0; i < n; i++) {
      const rowSeen = new Map();
      for (let j = 0; j < n; j++) {
        const v = table[i][j];
        if (rowSeen.has(v)) {
          rowDupCells.push([i, rowSeen.get(v)], [i, j]);
        } else rowSeen.set(v, j);
      }
    }
    for (let j = 0; j < n; j++) {
      const colSeen = new Map();
      for (let i = 0; i < n; i++) {
        const v = table[i][j];
        if (colSeen.has(v)) {
          colDupCells.push([colSeen.get(v), j], [i, j]);
        } else colSeen.set(v, i);
      }
    }
    const assocViolations = [];
    for (let a = 0; a < n; a++) {
      for (let b = 0; b < n; b++) {
        for (let c = 0; c < n; c++) {
          const lhs = table[table[a][b]][c];
          const rhs = table[a][table[b][c]];
          if (lhs !== rhs) {
            assocViolations.push([a, b, c, lhs, rhs]);
          }
        }
      }
    }
    return {
      isCommutative: commViolations.length === 0,
      commViolations,
      idempotents,
      isAllIdempotent: idempotents.length === n,
      isCancellative: rowDupCells.length === 0 && colDupCells.length === 0,
      rowDupCells,
      colDupCells,
      isAssociative: assocViolations.length === 0,
      assocViolations,
    };
  }

  function render(container, ctx) {
    let tab = 'cayley'; // 'cayley' | 'venn'
    let tableKey = 'z6add';
    let probe = 'comm'; // 'comm' | 'idem' | 'cancel' | 'assoc'
    let customTable = PRESET_TABLES.custom4.table.map((r) => r.slice());
    let assocTriple = [0, 1, 2];
    let usePowerCounterexample = false;
    let vennLaw = 'dist1';

    function applyPreset(p) {
      if (!p) return;
      if (p === 'venn-laws') {
        tab = 'venn';
      } else if (p === 'law-comm') {
        tab = 'cayley';
        tableKey = 'noncomm';
        probe = 'comm';
      } else if (p === 'law-idem') {
        tab = 'cayley';
        tableKey = 'z6mul';
        probe = 'idem';
      } else if (p === 'law-cancel') {
        tab = 'cayley';
        tableKey = 'z6mul';
        probe = 'cancel';
      } else if (p === 'law-assoc') {
        tab = 'cayley';
        probe = 'assoc';
        usePowerCounterexample = true;
      } else {
        tab = 'cayley';
        tableKey = 'z6add';
        probe = 'comm';
      }
      renderAll();
    }

    function renderAll() {
      container.innerHTML = '';

      const header = htmlEl('div', { className: 'lab-header' }, [
        htmlEl('div', { className: 'lab-title-wrap' }, [
          htmlEl('h1', {}, [
            '6.1 代数系统：运算表与六大算律',
            htmlEl('span', { className: 'lab-badge' }, 'p.9–22 · 几何探针'),
          ]),
          htmlEl('p', { className: 'lab-desc' }, '运算表是有限代数系统的指纹：交换看主对角镜像，幂等看主对角命中，消去看行/列拉丁方无重色，分配/吸收看 Venn 区域重合。'),
        ]),
        htmlEl('div', { className: 'lab-tabs' }, [
          htmlEl('button', {
            className: `lab-tab ${tab === 'cayley' ? 'active' : ''}`,
            onClick: () => { tab = 'cayley'; renderAll(); },
          }, 'Cayley 运算表 & 单运算律探针'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'venn' ? 'active' : ''}`,
            onClick: () => { tab = 'venn'; renderAll(); },
          }, '三圆集合 Venn 图：分配律 / 吸收律'),
        ]),
      ]);
      container.appendChild(header);

      if (tab === 'cayley') {
        renderCayleyTab();
      } else {
        renderVennTab();
      }
    }

    function renderCayleyTab() {
      const spec = PRESET_TABLES[tableKey];
      const table = tableKey === 'custom4' ? customTable : spec.table;
      const labels = spec.labels;
      const n = labels.length;
      const info = inspectTable(labels, table);

      const controls = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '预设代数系统：'),
          (() => {
            const sel = htmlEl('select', { className: 'ctrl-select' });
            for (const [k, v] of Object.entries(PRESET_TABLES)) {
              const opt = htmlEl('option', { value: k }, v.name);
              if (k === tableKey) opt.selected = true;
              sel.appendChild(opt);
            }
            sel.addEventListener('change', () => {
              tableKey = sel.value;
              usePowerCounterexample = false;
              assocTriple = [0, 1, Math.min(2, PRESET_TABLES[tableKey].labels.length - 1)];
              renderAll();
            });
            return sel;
          })(),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '几何探针：'),
          ...[
            ['comm', '交换律（镜像对称）'],
            ['idem', '等幂律（主对角线）'],
            ['cancel', '消去律（拉丁方无重）'],
            ['assoc', '结合律（计算树对比）'],
          ].map(([pk, pl]) => htmlEl('button', {
            className: `btn btn-sm ${probe === pk ? 'active' : ''}`,
            onClick: () => { probe = pk; renderAll(); },
          }, pl)),
        ]),
      ]);
      container.appendChild(controls);

      const grid = htmlEl('div', { className: 'split-wide' });
      container.appendChild(grid);

      // Left: Cayley Table Heatmap + Symmetry SVG overlay
      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, `运算表 (${spec.op})`),
        htmlEl('span', { className: 'chip' }, spec.editable ? '点击任意结果格可循环改值' : '悬停查看运算坐标'),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });

      const tableEl = htmlEl('table', { className: 'alg-table' });
      const theadRow = htmlEl('tr', {}, [
        htmlEl('th', {}, spec.op),
        ...labels.map((l) => htmlEl('th', {}, l)),
      ]);
      tableEl.appendChild(htmlEl('thead', {}, theadRow));

      const commBadSet = new Set(info.commViolations.flatMap(([i, j]) => [`${i},${j}`, `${j},${i}`]));
      const dupSet = new Set(
        info.rowDupCells.concat(info.colDupCells).map(([i, j]) => `${i},${j}`)
      );

      const tbody = htmlEl('tbody');
      for (let i = 0; i < n; i++) {
        const tr = htmlEl('tr', {}, [htmlEl('th', {}, labels[i])]);
        for (let j = 0; j < n; j++) {
          const val = table[i][j];
          let cls = spec.editable ? 'clickable' : '';
          if (probe === 'comm') {
            if (i === j) cls += ' hl-blue';
            else if (commBadSet.has(`${i},${j}`)) cls += ' hl-bad';
            else cls += ' hl-ok';
          } else if (probe === 'idem') {
            if (i === j) cls += val === i ? ' hl-ok' : ' hl-bad';
          } else if (probe === 'cancel') {
            cls += dupSet.has(`${i},${j}`) ? ' hl-bad' : ' hl-ok';
          } else if (probe === 'assoc' && !usePowerCounterexample) {
            if (i === assocTriple[0] && j === assocTriple[1]) cls += ' hl-blue';
          }
          const td = htmlEl('td', {
            className: cls.trim(),
            title: `${labels[i]} ${spec.op} ${labels[j]} = ${labels[val]}`,
          }, labels[val]);
          if (spec.editable) {
            td.addEventListener('click', () => {
              customTable[i][j] = (customTable[i][j] + 1) % n;
              renderAll();
            });
          }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      tableEl.appendChild(tbody);
      leftBody.appendChild(htmlEl('div', { className: 'alg-table-wrap' }, tableEl));

      // Quick Axiom Summary Chips
      leftBody.appendChild(htmlEl('div', { className: 'stat-chips', style: { marginTop: '12px' } }, [
        htmlEl('span', { className: `chip ${info.isCommutative ? 'ok' : 'bad'}` },
          info.isCommutative ? '✓ 交换律成立' : `✗ 不满足交换律 (${info.commViolations.length} 对失配)`),
        htmlEl('span', { className: `chip ${info.isAssociative ? 'ok' : 'bad'}` },
          info.isAssociative ? '✓ 结合律成立' : `✗ 不满足结合律 (${info.assocViolations.length} 组反例)`),
        htmlEl('span', { className: `chip ${info.isCancellative ? 'ok' : 'bad'}` },
          info.isCancellative ? '✓ 消去律成立 (拉丁方)' : '✗ 不满足消去律 (行/列有重)'),
        htmlEl('span', { className: `chip ${info.isAllIdempotent ? 'ok' : 'warn'}` },
          `幂等元: ${info.idempotents.length ? info.idempotents.map((x) => labels[x]).join(', ') : '无'}`),
      ]));
      leftPanel.appendChild(leftBody);
      grid.appendChild(leftPanel);

      // Right: Geometric Probe Canvas
      const rightPanel = htmlEl('div', { className: 'panel' });
      rightPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '数形体检与反例计算树'),
        probe === 'assoc'
          ? htmlEl('button', {
              className: `btn btn-sm ${usePowerCounterexample ? 'btn-primary' : ''}`,
              onClick: () => { usePowerCounterexample = !usePowerCounterexample; renderAll(); },
            }, usePowerCounterexample ? '返回当前表三元组' : '查看 (ℕ, x^y) 经典反例')
          : null,
      ]));
      const rightBody = htmlEl('div', { className: 'panel-body' });

      if (probe === 'assoc') {
        if (!usePowerCounterexample) {
          const tripleBar = htmlEl('div', { className: 'controls-bar', style: { marginBottom: '10px' } }, [
            htmlEl('span', { style: { fontWeight: 600, fontSize: '12px' } }, '选择三元组 (a, b, c)：'),
            ...[0, 1, 2].map((pos) => {
              const s = htmlEl('select', { className: 'ctrl-select' });
              labels.forEach((lbl, idx) => {
                const o = htmlEl('option', { value: idx }, lbl);
                if (assocTriple[pos] === idx) o.selected = true;
                s.appendChild(o);
              });
              s.addEventListener('change', () => {
                assocTriple[pos] = Number(s.value);
                renderAll();
              });
              return s;
            }),
            info.assocViolations.length > 0
              ? htmlEl('button', {
                  className: 'btn btn-sm',
                  onClick: () => {
                    const [a, b, c] = info.assocViolations[0];
                    assocTriple = [a, b, c];
                    renderAll();
                  },
                }, '定位首个失效三元组')
              : null,
          ]);
          rightBody.appendChild(tripleBar);
        }
        rightBody.appendChild(renderAssocTreeCanvas(
          usePowerCounterexample,
          labels, spec.op, table, assocTriple
        ));
      } else {
        rightBody.appendChild(renderGeometricMatrixProbe(probe, labels, spec.op, table, info));
      }

      rightPanel.appendChild(rightBody);
      grid.appendChild(rightPanel);
    }

    function renderGeometricMatrixProbe(probeMode, labels, op, table, info) {
      const wrap = htmlEl('div');
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(400, 290);
      box.appendChild(svg);

      const n = labels.length;
      const cell = Math.min(36, Math.floor(210 / n));
      const ox = (400 - n * cell) / 2;
      const oy = 34;

      if (probeMode === 'comm') {
        // Draw diagonal mirror line
        svg.appendChild(el('line', {
          x1: ox - 10, y1: oy - 10, x2: ox + n * cell + 10, y2: oy + n * cell + 10,
          stroke: 'var(--accent-blue)', 'stroke-width': 2.2, 'stroke-dasharray': '5 4',
        }));
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            const sym = table[i][j] === table[j][i];
            const fill = i === j
              ? 'var(--accent-blue-soft)'
              : sym ? 'var(--accent-green-soft)' : 'var(--accent-rose-soft)';
            const stroke = i === j ? 'var(--accent-blue)' : sym ? 'var(--accent-green)' : 'var(--accent-rose)';
            const r = el('rect', {
              x: ox + j * cell + 1.5, y: oy + i * cell + 1.5,
              width: cell - 3, height: cell - 3, rx: 4,
              fill, stroke, 'stroke-width': 1.2,
            });
            svg.appendChild(r);
            svg.appendChild(el('text', {
              x: ox + j * cell + cell / 2, y: oy + i * cell + cell / 2 + 4,
              'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 11, 'font-weight': 700,
            }, labels[table[i][j]]));
          }
        }
        // Arc connecting first violation pair
        if (info.commViolations.length > 0) {
          const [vi, vj] = info.commViolations[0];
          const x1 = ox + vj * cell + cell / 2, y1 = oy + vi * cell + cell / 2;
          const x2 = ox + vi * cell + cell / 2, y2 = oy + vj * cell + cell / 2;
          svg.appendChild(el('line', {
            x1, y1, x2, y2, stroke: 'var(--accent-rose)', 'stroke-width': 2,
          }));
          svg.appendChild(el('text', {
            x: 200, y: 274, 'text-anchor': 'middle', fill: 'var(--accent-rose)', 'font-size': 12, 'font-weight': 700,
          }, `失配例：${labels[vi]} ${op} ${labels[vj]} = ${labels[table[vi][vj]]} ≠ ${labels[table[vj][vi]]} = ${labels[vj]} ${op} ${labels[vi]}`));
        } else {
          svg.appendChild(el('text', {
            x: 200, y: 274, 'text-anchor': 'middle', fill: 'var(--accent-green)', 'font-size': 12, 'font-weight': 700,
          }, '沿主对角线折纸完全重合：a * b = b * a 对所有元素成立！'));
        }
      } else if (probeMode === 'idem') {
        for (let i = 0; i < n; i++) {
          const x = ox + i * cell + cell / 2;
          const y = oy + i * cell + cell / 2;
          const hit = table[i][i] === i;
          svg.appendChild(el('rect', {
            x: ox + i * cell + 2, y: oy + i * cell + 2, width: cell - 4, height: cell - 4, rx: 6,
            fill: hit ? 'var(--accent-green-soft)' : 'var(--bg-subtle)',
            stroke: hit ? 'var(--accent-green)' : 'var(--border-color)',
            'stroke-width': hit ? 2.2 : 1,
          }));
          svg.appendChild(el('text', {
            x, y: y + 4, 'text-anchor': 'middle',
            fill: hit ? 'var(--accent-green)' : 'var(--text-muted)',
            'font-size': 11.5, 'font-weight': 700,
          }, `${labels[i]}→${labels[table[i][i]]}`));
        }
        svg.appendChild(el('text', {
          x: 200, y: 274, 'text-anchor': 'middle', fill: 'var(--text-secondary)', 'font-size': 12, 'font-weight': 700,
        }, `主对角线自反命中即幂等元：a * a = a（共 ${info.idempotents.length}/${n} 个）`));
      } else {
        // Cancel: highlight rows & cols with duplicates
        const dupSet = new Set(info.rowDupCells.concat(info.colDupCells).map(([i, j]) => `${i},${j}`));
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            const bad = dupSet.has(`${i},${j}`);
            svg.appendChild(el('rect', {
              x: ox + j * cell + 1.5, y: oy + i * cell + 1.5, width: cell - 3, height: cell - 3, rx: 4,
              fill: bad ? 'var(--accent-rose-soft)' : 'var(--accent-green-soft)',
              stroke: bad ? 'var(--accent-rose)' : 'var(--accent-green)',
              'stroke-width': bad ? 1.8 : 1,
            }));
            svg.appendChild(el('text', {
              x: ox + j * cell + cell / 2, y: oy + i * cell + cell / 2 + 4,
              'text-anchor': 'middle', fill: bad ? 'var(--accent-rose)' : 'var(--text-primary)',
              'font-size': 11, 'font-weight': 700,
            }, labels[table[i][j]]));
          }
        }
        svg.appendChild(el('text', {
          x: 200, y: 274, 'text-anchor': 'middle',
          fill: info.isCancellative ? 'var(--accent-green)' : 'var(--accent-rose)',
          'font-size': 12, 'font-weight': 700,
        }, info.isCancellative
          ? '每行每列无重复（拉丁方），满足左右消去律'
          : '红框处同列/同行出现相同值（例如 a*b = a*c 但 b≠c），消去律失效'));
      }

      wrap.appendChild(box);
      return wrap;
    }

    function renderAssocTreeCanvas(isPowEx, labels, op, table, triple) {
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(420, 250);
      box.appendChild(svg);

      let aLbl, bLbl, cLbl, abLbl, bcLbl, lhsLbl, rhsLbl, eq;
      if (isPowEx) {
        aLbl = '2'; bLbl = '2'; cLbl = '3';
        abLbl = '2² = 4'; bcLbl = '2³ = 8';
        lhsLbl = '4³ = 64'; rhsLbl = '2⁸ = 256';
        eq = false;
      } else {
        const [a, b, c] = triple;
        const ab = table[a][b];
        const bc = table[b][c];
        const lhs = table[ab][c];
        const rhs = table[a][bc];
        aLbl = labels[a]; bLbl = labels[b]; cLbl = labels[c];
        abLbl = `${aLbl}${op}${bLbl}=${labels[ab]}`;
        bcLbl = `${bLbl}${op}${cLbl}=${labels[bc]}`;
        lhsLbl = labels[lhs];
        rhsLbl = labels[rhs];
        eq = lhs === rhs;
      }

      const col = eq ? 'var(--accent-green)' : 'var(--accent-rose)';
      // Left Tree: (a*b)*c
      function drawNode(x, y, text, stroke = 'var(--accent-blue)', w = 68) {
        svg.appendChild(el('rect', {
          x: x - w / 2, y: y - 14, width: w, height: 28, rx: 14,
          fill: 'var(--svg-node-fill)', stroke, 'stroke-width': 1.8,
        }));
        svg.appendChild(el('text', {
          x, y: y + 4.5, 'text-anchor': 'middle',
          fill: 'var(--text-primary)', 'font-size': 11.5, 'font-weight': 700,
        }, text));
      }

      // Left tree edges
      svg.appendChild(el('text', { x: 105, y: 22, 'text-anchor': 'middle', fill: 'var(--accent-blue)', 'font-size': 12.5, 'font-weight': 700 }, '(a * b) * c'));
      svg.appendChild(el('line', { x1: 42, y1: 68, x2: 75, y2: 120, stroke: 'var(--border-strong)', 'stroke-width': 2 }));
      svg.appendChild(el('line', { x1: 108, y1: 68, x2: 75, y2: 120, stroke: 'var(--border-strong)', 'stroke-width': 2 }));
      svg.appendChild(el('line', { x1: 75, y1: 120, x2: 112, y2: 184, stroke: col, 'stroke-width': 2.2 }));
      svg.appendChild(el('line', { x1: 162, y1: 68, x2: 112, y2: 184, stroke: col, 'stroke-width': 2.2 }));
      drawNode(42, 68, aLbl, 'var(--accent-blue)', 42);
      drawNode(108, 68, bLbl, 'var(--accent-blue)', 42);
      drawNode(162, 68, cLbl, 'var(--accent-blue)', 42);
      drawNode(75, 120, abLbl, 'var(--accent-teal)', 82);
      drawNode(112, 184, lhsLbl, col, 86);

      // Comparison symbol in middle
      svg.appendChild(el('text', {
        x: 210, y: 189, 'text-anchor': 'middle', fill: col, 'font-size': 22, 'font-weight': 800,
      }, eq ? '=' : '≠'));

      // Right tree: a*(b*c)
      svg.appendChild(el('text', { x: 315, y: 22, 'text-anchor': 'middle', fill: 'var(--accent-purple)', 'font-size': 12.5, 'font-weight': 700 }, 'a * (b * c)'));
      svg.appendChild(el('line', { x1: 312, y1: 68, x2: 345, y2: 120, stroke: 'var(--border-strong)', 'stroke-width': 2 }));
      svg.appendChild(el('line', { x1: 378, y1: 68, x2: 345, y2: 120, stroke: 'var(--border-strong)', 'stroke-width': 2 }));
      svg.appendChild(el('line', { x1: 258, y1: 68, x2: 308, y2: 184, stroke: col, 'stroke-width': 2.2 }));
      svg.appendChild(el('line', { x1: 345, y1: 120, x2: 308, y2: 184, stroke: col, 'stroke-width': 2.2 }));
      drawNode(258, 68, aLbl, 'var(--accent-purple)', 42);
      drawNode(312, 68, bLbl, 'var(--accent-purple)', 42);
      drawNode(378, 68, cLbl, 'var(--accent-purple)', 42);
      drawNode(345, 120, bcLbl, 'var(--accent-teal)', 82);
      drawNode(308, 184, rhsLbl, col, 86);

      svg.appendChild(el('text', {
        x: 210, y: 234, 'text-anchor': 'middle', fill: col, 'font-size': 12, 'font-weight': 700,
      }, isPowEx
        ? '易错反例 p.26：(ℕ, x^y) 中先算左边得 64，先算右边得 256，不满足结合律！'
        : (eq ? '两条加括号路径抵达同一个结果' : '加括号次序改变导致树根分叉，破坏结合律！')));
      return box;
    }

    function renderVennTab() {
      const laws = {
        dist1: {
          title: '分配律 (∩ 对 ∪)',
          tex: 'A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)',
          logic: 'G \\land (H \\lor S) = (G \\land H) \\lor (G \\land S)',
          evalLeft: (inA, inB, inC) => inA && (inB || inC),
          evalRight: (inA, inB, inC) => (inA && inB) || (inA && inC),
        },
        dist2: {
          title: '分配律 (∪ 对 ∩)',
          tex: 'A \\cup (B \\cap C) = (A \\cup B) \\cap (A \\cup C)',
          logic: 'G \\lor (H \\land S) = (G \\lor H) \\land (G \\lor S)',
          evalLeft: (inA, inB, inC) => inA || (inB && inC),
          evalRight: (inA, inB, inC) => (inA || inB) && (inA || inC),
        },
        abs1: {
          title: '吸收律 (∩ 与 ∪)',
          tex: 'A \\cap (A \\cup B) = A',
          logic: 'G \\land (G \\lor H) = G',
          evalLeft: (inA, inB) => inA && (inA || inB),
          evalRight: (inA) => inA,
        },
        abs2: {
          title: '吸收律 (∪ 与 ∩)',
          tex: 'A \\cup (A \\cap B) = A',
          logic: 'G \\lor (G \\land H) = G',
          evalLeft: (inA, inB) => inA || (inA && inB),
          evalRight: (inA) => inA,
        },
      };

      const cur = laws[vennLaw];
      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('span', { style: { fontWeight: 700, fontSize: '12.5px' } }, '切换几何算律：'),
        ...Object.entries(laws).map(([k, v]) => htmlEl('button', {
          className: `btn btn-sm ${vennLaw === k ? 'active' : ''}`,
          onClick: () => { vennLaw = k; renderAll(); },
        }, v.title)),
      ]);
      container.appendChild(bar);

      const banner = htmlEl('div', { className: 'formula-banner info' }, [
        htmlEl('div', { innerHTML: `集合论：${renderTex(cur.tex)} &nbsp;&nbsp;|&nbsp;&nbsp; 数理逻辑对偶：${renderTex(cur.logic)}` }),
      ]);
      container.appendChild(banner);

      const panel = htmlEl('div', { className: 'panel' });
      const body = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(760, 290);
      box.appendChild(svg);

      // Render left-side Venn & right-side Venn using atomic pixel-sampled SVG regions (7 regions on 3-circle Venn!)
      function drawThreeCircleVenn(cx0, cy0, sideLabel, evalFn, colorVar) {
        const twoCircleOnly = vennLaw.startsWith('abs');
        const cA = { x: cx0 - 42, y: cy0 - 20, r: 66 };
        const cB = { x: cx0 + 42, y: cy0 - 20, r: 66 };
        const cC = { x: cx0, y: cy0 + 44, r: 66 };

        svg.appendChild(el('text', {
          x: cx0, y: 26, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 13, 'font-weight': 700,
        }, sideLabel));

        // Sample small grid of dots inside bounding box to color region unambiguously and vividly
        const step = 6;
        for (let px = cx0 - 114; px <= cx0 + 114; px += step) {
          for (let py = cy0 - 92; py <= cy0 + 114; py += step) {
            const inA = Math.hypot(px - cA.x, py - cA.y) <= cA.r;
            const inB = Math.hypot(px - cB.x, py - cB.y) <= cB.r;
            const inC = !twoCircleOnly && Math.hypot(px - cC.x, py - cC.y) <= cC.r;
            if (!inA && !inB && !inC) continue;
            if (evalFn(inA, inB, inC)) {
              svg.appendChild(el('rect', {
                x: px - step / 2, y: py - step / 2, width: step, height: step,
                fill: colorVar, 'fill-opacity': 0.36,
              }));
            }
          }
        }

        const circles = twoCircleOnly
          ? [[cA, 'A'], [cB, 'B']]
          : [[cA, 'A'], [cB, 'B'], [cC, 'C']];
        circles.forEach(([c, name], idx) => {
          svg.appendChild(el('circle', {
            cx: c.x, cy: c.y, r: c.r, fill: 'none',
            stroke: 'var(--text-secondary)', 'stroke-width': 1.8,
          }));
          const lx = idx === 0 ? c.x - 52 : idx === 1 ? c.x + 52 : c.x;
          const ly = idx === 2 ? c.y + 52 : c.y - 52;
          svg.appendChild(el('text', {
            x: lx, y: ly, 'text-anchor': 'middle', fill: 'var(--text-primary)', 'font-size': 13, 'font-weight': 800,
          }, name));
        });
      }

      drawThreeCircleVenn(190, 146, '左端运算区域染色', cur.evalLeft, 'var(--accent-blue)');
      svg.appendChild(el('text', {
        x: 380, y: 154, 'text-anchor': 'middle', fill: 'var(--accent-green)', 'font-size': 28, 'font-weight': 800,
      }, '≡'));
      drawThreeCircleVenn(570, 146, '右端运算区域染色（几何完全重合）', cur.evalRight, 'var(--accent-teal)');

      body.appendChild(box);
      panel.appendChild(body);
      container.appendChild(panel);
    }

    renderAll();
    return { applyPreset };
  }

  DM2.Labs.ch61 = {
    id: 'ch61',
    title: '6.1 代数系统',
    badge: '运算表 · 6大算律',
    subtitle: 'Cayley 热力图、对称轴/对角线/拉丁方/Venn 算律探针',
    render,
  };
})(window);
