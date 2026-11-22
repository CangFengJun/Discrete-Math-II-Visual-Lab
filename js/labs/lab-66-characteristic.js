/* 6.6 Field Characteristic & Prime Fields Lab:
 * 1) Integer Line Homomorphism Wrapper sigma: I -> F, n |-> ne (P=0, P=prime, P=6 composite contradiction)
 * 2) Pascal's Triangle mod p Dissolution ((a+b)^p = a^p + b^p & Fermat's Theorem)
 */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  DM2.Labs = DM2.Labs || {};
  const M = DM2.Math;
  const { el, createSvg, htmlEl } = DM2.Svg;
  const { renderTex } = DM2.KaTeX;

  function render(container, ctx) {
    let tab = 'wrap'; // 'wrap' | 'pascal'
    let charMode = 5; // 0, 2, 3, 5, 7, or 6 (composite contradiction)
    let highlightInt = 7;

    let pascalChar = 5;
    let pascalExp = 5;
    let modApplied = true;

    function applyPreset(p) {
      if (!p) return;
      if (p === 'pascal-modp') {
        tab = 'pascal';
        pascalChar = 5;
        pascalExp = 5;
        modApplied = true;
      } else if (p === 'numberline-char0') {
        tab = 'wrap';
        charMode = 0;
      } else if (p === 'numberline-composite') {
        tab = 'wrap';
        charMode = 6;
      } else {
        tab = 'wrap';
        charMode = 5;
      }
      renderAll();
    }

    function renderAll() {
      container.innerHTML = '';

      const header = htmlEl('div', { className: 'lab-header' }, [
        htmlEl('div', { className: 'lab-title-wrap' }, [
          htmlEl('h1', {}, [
            '6.6 域的特征与素域',
            htmlEl('span', { className: 'lab-badge' }, 'p.215–234 · R₀ 与 Rₚ = I/pI'),
          ]),
          htmlEl('p', { className: 'lab-desc' }, '用同态 σ(n)=ne 把整数环 I 卷进任意域 F：要么笔直嵌入特征 0 素域 R₀，要么每质数 p 步卷绕重合生成素域 Rₚ；杨辉三角在质数行全消融！'),
        ]),
        htmlEl('div', { className: 'lab-tabs' }, [
          htmlEl('button', {
            className: `lab-tab ${tab === 'wrap' ? 'active' : ''}`,
            onClick: () => { tab = 'wrap'; renderAll(); },
          }, '整数数轴同态卷绕机 (σ: n ↦ ne)'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'pascal' ? 'active' : ''}`,
            onClick: () => { tab = 'pascal'; renderAll(); },
          }, '特征 p 杨辉三角消融：(a+b)ᵖ = aᵖ+bᵖ'),
        ]),
      ]);
      container.appendChild(header);

      if (tab === 'wrap') renderWrapTab();
      else renderPascalTab();
    }

    // -------------------------------------------------------------------------
    // Tab 1: Integer Line Wrapping Machine + Composite P=6 Contradiction
    // -------------------------------------------------------------------------
    function renderWrapTab() {
      const isComposite = charMode > 0 && !M.isPrime(charMode);

      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('span', { style: { fontWeight: 700, fontSize: '12.5px' } }, '设定乘法单位元 e 的加法周期 P：'),
        ...[
          [0, 'P = 0（特征 0 · 素域 R₀）'],
          [2, 'P = 2（R₂）'],
          [3, 'P = 3（R₃）'],
          [5, 'P = 5（R₅）'],
          [7, 'P = 7（R₇）'],
          [6, '⚠ 强行尝试合数 P = 6（反证）'],
        ].map(([val, lbl]) => htmlEl('button', {
          className: `btn btn-sm ${charMode === val ? (val === 6 ? 'btn-primary' : 'active') : ''}`,
          style: val === 6 && charMode === 6 ? { background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' } : null,
          onClick: () => { charMode = val; renderAll(); },
        }, lbl)),
      ]);
      container.appendChild(bar);

      const bar2 = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, `追踪整数环元素 n = ${highlightInt} ∈ I：`),
          (() => {
            const r = htmlEl('input', { className: 'ctrl-range', type: 'range', min: -6, max: 14, value: highlightInt });
            r.addEventListener('input', () => { highlightInt = Number(r.value); renderAll(); });
            return r;
          })(),
        ]),
        htmlEl('span', { className: `chip ${isComposite ? 'bad' : 'ok'}` },
          charMode === 0
            ? `σ(${highlightInt}) = ${highlightInt}e（单射无折返，核 N = (0)）`
            : isComposite
              ? `反证崩溃！(2e)·(3e) = 6e = 0，但 2e≠0 且 3e≠0`
              : `σ(${highlightInt}) = ${M.mod(highlightInt, charMode)}e（模 ${charMode} 卷绕，核 N = ${charMode}I）`),
      ]);
      container.appendChild(bar2);

      const panel = htmlEl('div', { className: 'panel' });
      const body = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(780, 320);
      box.appendChild(svg);

      // Top: Integer Number Line (-6 .. 14)
      svg.appendChild(el('text', { x: 24, y: 24, fill: 'var(--text-primary)', 'font-size': 12.5, 'font-weight': 800 }, '原像：整数环 I = { …, -2, -1, 0, 1, 2, … }'));
      svg.appendChild(el('line', { x1: 24, y1: 62, x2: 756, y2: 62, stroke: 'var(--border-strong)', 'stroke-width': 2 }));

      const xForInt = (n) => 44 + ((n + 6) * 692) / 20;

      // Bottom target: either flat line (P=0) or wrapped circle (P>0)
      if (charMode === 0) {
        svg.appendChild(el('text', { x: 24, y: 196, fill: 'var(--accent-blue)', 'font-size': 12.5, 'font-weight': 800 },
          '同态像：特征 0 → 直线嵌入 F，再经商记号 a/b 扩展出最小子域（素域 R₀ ≅ 有理数域）'));
        svg.appendChild(el('line', { x1: 24, y1: 244, x2: 756, y2: 244, stroke: 'var(--accent-blue)', 'stroke-width': 2.5 }));

        for (let n = -6; n <= 14; n++) {
          const x = xForInt(n);
          const isHl = n === highlightInt;
          const isKernel = n === 0;
          svg.appendChild(el('line', {
            x1: x, y1: 76, x2: x, y2: 228,
            stroke: isHl ? 'var(--accent-blue)' : isKernel ? 'var(--accent-teal)' : 'var(--svg-line-muted)',
            'stroke-width': isHl ? 2.6 : 1.2,
            'marker-end': isHl ? 'url(#arrow-blue)' : 'none',
          }));
          svg.appendChild(el('circle', {
            cx: x, cy: 244, r: isHl ? 13 : 10,
            fill: isHl ? 'var(--accent-blue)' : isKernel ? 'var(--accent-teal)' : 'var(--svg-node-fill)',
            stroke: 'var(--accent-blue)', 'stroke-width': 1.6,
          }));
          svg.appendChild(el('text', {
            x, y: 248, 'text-anchor': 'middle',
            fill: (isHl || isKernel) ? '#FFFFFF' : 'var(--text-primary)',
            'font-size': 10, 'font-weight': 700,
          }, n === 0 ? '0' : `${n}e`));
        }
      } else {
        const P = charMode;
        const cx = 390, cy = 204, R = 82;
        svg.appendChild(el('circle', {
          cx, cy, r: R, fill: 'none',
          stroke: isComposite ? 'var(--accent-rose)' : 'var(--accent-teal)',
          'stroke-width': 2.5,
        }));
        svg.appendChild(el('text', {
          x: cx, y: 306, 'text-anchor': 'middle',
          fill: isComposite ? 'var(--accent-rose)' : 'var(--accent-teal)',
          'font-size': 12.5, 'font-weight': 800,
        }, isComposite
          ? `合数环 I/6I 存在零因子 2e·3e = 0，不是域！（违反定理 6.6.1）`
          : `数轴每 ${P} 步绕圆一圈，同余类落入同一节点 → 最小子域（素域）R_${P} ≅ I/${P}I`));

        const ptForResidue = (r) => {
          const ang = -Math.PI / 2 + (2 * Math.PI * r) / P;
          return { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
        };

        // Mapping arrows from top number line onto circle residues!
        const targetRes = M.mod(highlightInt, P);
        for (let n = -6; n <= 14; n++) {
          const r = M.mod(n, P);
          const pt = ptForResidue(r);
          const isHl = n === highlightInt;
          const isKer = r === 0;
          if (isHl || isKer) {
            svg.appendChild(el('path', {
              d: `M ${xForInt(n)} 76 Q ${(xForInt(n) + pt.x) / 2} 118, ${pt.x} ${pt.y - 14}`,
              fill: 'none',
              stroke: isHl ? 'var(--accent-blue)' : 'var(--accent-green)',
              'stroke-width': isHl ? 2.6 : 1.5,
              'stroke-dasharray': isHl ? 'none' : '4 3',
              'marker-end': isHl ? 'url(#arrow-blue)' : 'none',
            }));
          }
        }

        // Contradiction laser line for P=6
        if (isComposite) {
          const p2 = ptForResidue(2);
          const p3 = ptForResidue(3);
          const p0 = ptForResidue(0);
          svg.appendChild(el('line', { x1: p2.x, y1: p2.y, x2: p3.x, y2: p3.y, stroke: 'var(--accent-rose)', 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }));
          svg.appendChild(el('line', { x1: (p2.x + p3.x) / 2, y1: (p2.y + p3.y) / 2, x2: p0.x, y2: p0.y + 18, stroke: 'var(--accent-rose)', 'stroke-width': 2.5, 'marker-end': 'url(#arrow-rose)' }));
          svg.appendChild(el('text', { x: cx, y: cy + 6, 'text-anchor': 'middle', fill: 'var(--accent-rose)', 'font-size': 12, 'font-weight': 800 }, '2e · 3e = 6e = 0 !'));
        }

        for (let r = 0; r < P; r++) {
          const pt = ptForResidue(r);
          const isHl = r === targetRes;
          const isZero = r === 0;
          svg.appendChild(el('circle', {
            cx: pt.x, cy: pt.y, r: isHl ? 17 : 15,
            fill: isHl ? 'var(--accent-blue)' : isZero ? 'var(--accent-green)' : 'var(--svg-node-fill)',
            stroke: isComposite && (r === 2 || r === 3) ? 'var(--accent-rose)' : 'var(--accent-teal)',
            'stroke-width': 2.2,
          }));
          svg.appendChild(el('text', {
            x: pt.x, y: pt.y + 4.5, 'text-anchor': 'middle',
            fill: (isHl || isZero) ? '#FFFFFF' : 'var(--text-primary)',
            'font-size': 11.5, 'font-weight': 800,
          }, r === 0 ? '0' : r === 1 ? 'e' : `${r}e`));
        }
      }

      // Draw top number line nodes last so they sit crisp on top
      for (let n = -6; n <= 14; n++) {
        const x = xForInt(n);
        const isHl = n === highlightInt;
        const isKernel = charMode === 0 ? n === 0 : M.mod(n, charMode) === 0;
        const g = el('g', { class: 'svg-clickable' });
        g.appendChild(el('circle', {
          cx: x, cy: 62, r: isHl ? 14 : 11,
          fill: isHl ? 'var(--accent-blue)' : isKernel ? 'var(--accent-green)' : 'var(--svg-node-fill)',
          stroke: isKernel ? 'var(--accent-green)' : 'var(--border-strong)',
          'stroke-width': 1.8,
        }));
        g.appendChild(el('text', {
          x, y: 66, 'text-anchor': 'middle',
          fill: (isHl || isKernel) ? '#FFFFFF' : 'var(--text-primary)',
          'font-size': 10.5, 'font-weight': 700,
        }, String(n)));
        g.addEventListener('click', () => { highlightInt = n; renderAll(); });
        svg.appendChild(g);
      }

      body.appendChild(box);
      body.appendChild(htmlEl('div', {
        className: `formula-banner ${isComposite ? 'warn' : ''}`,
        style: { marginTop: '10px' },
        innerHTML: renderTex(
          charMode === 0
            ? '\\ker\\sigma = (0),\\quad \\text{特征 } P=0 \\implies F \\supseteq R_0 \\text{（有理数域，必为无限域）}'
            : isComposite
              ? 'P=6=2\\times 3 \\implies (2e)(3e)=6e=0 \\implies \\text{存在零因子，与域无零因子矛盾！}'
              : `\\ker\\sigma = (${charMode}) = ${charMode}I,\\quad F \\text{ 的最小子域（素域）} \\cong I/${charMode}I = R_{${charMode}}`
        ),
      }));
      panel.appendChild(body);
      container.appendChild(panel);

      if (charMode > 0 && M.isPrime(charMode)) {
        const sqMap = new Map();
        for (let x = 0; x < charMode; x++) {
          const sq = (x * x) % charMode;
          if (!sqMap.has(sq)) sqMap.set(sq, []);
          sqMap.get(sq).push(x);
        }
        const negOne = charMode - 1;
        const sqrtNegOne = sqMap.get(negOne) || [];
        const negTwo = M.mod(-2, charMode);
        const sqrtNegTwo = sqMap.get(negTwo) || [];
        const sqList = Array.from({ length: charMode }, (_, c) =>
          sqMap.has(c) ? `√${c}={${sqMap.get(c).join(',')}}` : `${c}:无平方根`
        ).join(' · ');
        container.appendChild(htmlEl('div', { className: 'formula-banner info' }, [
          htmlEl('strong', {}, `素域 I/${charMode}I（p.232 例题）：负元 -a = ${charMode}-a 与平方根分布`),
          htmlEl('span', {}, `在 R_${charMode} 中 -1 = ${negOne}（${sqrtNegOne.length ? `√(-1) = ${sqrtNegOne.join(' 或 ')}` : '无 √(-1)'}），-2 = ${negTwo}（${sqrtNegTwo.length ? `√(-2) = ${sqrtNegTwo.join(' 或 ')}` : '无平方根 √(-2)'}）。全部元素：${sqList}`),
        ]));
      }
    }

    // -------------------------------------------------------------------------
    // Tab 2: Pascal's Triangle mod p Dissolution
    // -------------------------------------------------------------------------
    function renderPascalTab() {
      const bar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '域特征 p（质数）：'),
          ...[2, 3, 5, 7].map((p) => htmlEl('button', {
            className: `btn btn-sm ${pascalChar === p ? 'active' : ''}`,
            onClick: () => { pascalChar = p; pascalExp = p; renderAll(); },
          }, `p = ${p}`)),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '测试幂次 m（可与 p 对比）：'),
          ...[2, 3, 4, 5, 6, 7].map((m) => htmlEl('button', {
            className: `btn btn-sm ${pascalExp === m ? 'active' : ''}`,
            onClick: () => { pascalExp = m; renderAll(); },
          }, `m = ${m}`)),
        ]),
        htmlEl('button', {
          className: `btn btn-sm ${modApplied ? 'btn-primary' : ''}`,
          onClick: () => { modApplied = !modApplied; renderAll(); },
        }, modApplied ? '✓ 已开启模 p 约化消融' : '▶ 一键模 p 约化消融'),
      ]);
      container.appendChild(bar);

      // Compute Pascal rows 0..7
      const rows = [[1]];
      for (let r = 1; r <= 7; r++) {
        const prev = rows[r - 1];
        const row = [1];
        for (let k = 1; k < r; k++) row.push(prev[k - 1] + prev[k]);
        row.push(1);
        rows.push(row);
      }

      const targetRow = rows[pascalExp];
      const modRow = targetRow.map((v) => v % pascalChar);
      const midZero = modRow.slice(1, -1).every((v) => v === 0);

      const panel = htmlEl('div', { className: 'panel' });
      panel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, `杨辉三角第 0–7 行（高亮第 m=${pascalExp} 行，特征 p=${pascalChar}）`),
        htmlEl('span', { className: `chip ${midZero ? 'ok' : 'warn'}` },
          midZero ? `✓ 中间项全部被 ${pascalChar} 整除而消融！(a+b)^${pascalExp} = a^${pascalExp}+b^${pascalExp}` : `⚠ m=${pascalExp} 非 ${pascalChar} 的幂，中间仍有非零交叉项`),
      ]));
      const body = htmlEl('div', { className: 'panel-body' });

      const triWrap = htmlEl('div', {
        style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 6px' },
      });

      rows.forEach((row, rIdx) => {
        const rowEl = htmlEl('div', {
          style: {
            display: 'flex', gap: '8px', alignItems: 'center',
            padding: '4px 10px', borderRadius: '10px',
            border: rIdx === pascalExp ? '2px solid var(--accent-blue)' : '1px solid transparent',
            background: rIdx === pascalExp ? 'var(--accent-blue-soft)' : 'transparent',
          },
        }, [
          htmlEl('span', { style: { width: '54px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' } }, `m = ${rIdx}`),
          ...row.map((val, cIdx) => {
            const rem = val % pascalChar;
            const dissolved = modApplied && rem === 0;
            const shown = modApplied ? rem : val;
            return htmlEl('span', {
              style: {
                minWidth: '34px', height: '30px', borderRadius: '7px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '12.5px', fontFamily: 'var(--font-mono)',
                border: '1px solid var(--border-color)',
                background: dissolved
                  ? 'transparent'
                  : (cIdx === 0 || cIdx === row.length - 1)
                    ? 'var(--accent-teal-soft)'
                    : 'var(--bg-panel)',
                color: dissolved
                  ? 'var(--text-muted)'
                  : (cIdx === 0 || cIdx === row.length - 1)
                    ? 'var(--accent-teal)'
                    : 'var(--accent-amber)',
                opacity: dissolved ? 0.3 : 1,
                textDecoration: dissolved ? 'line-through' : 'none',
              },
              title: `C(${rIdx},${cIdx}) = ${val} ≡ ${rem} (mod ${pascalChar})`,
            }, String(shown));
          }),
        ]);
        triWrap.appendChild(rowEl);
      });

      body.appendChild(triWrap);

      // Symbolic expansion readout
      const terms = [];
      for (let k = 0; k <= pascalExp; k++) {
        const coeff = modApplied ? modRow[k] : targetRow[k];
        if (coeff === 0) continue;
        const pa = pascalExp - k;
        const pb = k;
        const cStr = coeff === 1 ? '' : String(coeff);
        const aStr = pa === 0 ? '' : pa === 1 ? 'a' : `a^{${pa}}`;
        const bStr = pb === 0 ? '' : pb === 1 ? 'b' : `b^{${pb}}`;
        terms.push(`${cStr}${aStr}${bStr}`);
      }
      body.appendChild(htmlEl('div', {
        className: `formula-banner ${midZero && modApplied ? '' : 'info'}`,
        style: { marginTop: '10px' },
        innerHTML: `${renderTex(`(a + b)^{${pascalExp}} = ${terms.join(' + ')} \\quad (\\text{在特征 } ${pascalChar} \\text{ 的域中})`)}
          <span style="font-size:12px;">推论（p.234 性质 5）：取 a₁=…=aₙ=1 得 n^${pascalChar} = n，当 n≠0 时 n^${pascalChar - 1} = 1 —— 这正是 Fermat 小定理的域论证明！</span>`,
      }));
      panel.appendChild(body);
      container.appendChild(panel);
    }

    renderAll();
    return { applyPreset };
  }

  DM2.Labs.ch66 = {
    id: 'ch66',
    title: '6.6 域的特征与素域',
    badge: '卷绕 · 杨辉消融',
    subtitle: '整数环同态卷绕素域 Rₚ、合数反证与特征 p 二项式消融',
    render,
  };
})(window);
