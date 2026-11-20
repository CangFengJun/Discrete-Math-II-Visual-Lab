/* Overview Lab: Dual-line Venn/Euler Algebra Hierarchy + Finite Collapse + Counterexample Probes + Unification Map */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  DM2.Labs = DM2.Labs || {};
  const { el, createSvg, htmlEl, animateTween, bindTooltip } = DM2.Svg;
  const { renderTex } = DM2.KaTeX;

  const REGIONS = {
    alg: {
      title: '代数系统 (S, f₁, …, fₘ)',
      lab: 'ch61',
      preset: 'cayley-z6',
      tag: '6.1 单/多运算总起点',
      axioms: ['非空集合 S', '封闭的二元代数运算 f: S×S → S'],
      missing: '无任何算律要求（未必结合、未必交换）',
      desc: '决定代数系统结构的是运算（p.14）。任何运算表只要保证结果落在 S 内就是一个代数系统。',
    },
    semi: {
      title: '半群 (G, ·)',
      lab: 'ch62',
      preset: 'semigroup-check',
      tag: '6.2.1 结合律入场',
      axioms: ['非空封闭', '满足结合律 (a·b)·c = a·(b·c)'],
      missing: '不要求有单位元 1，也不要求有逆元',
      desc: '有了结合律，多个元素连乘才有唯一意义（广义结合律），但运算表中允许出现重复元素或不可逆元。',
    },
    group: {
      title: '群 (G, ·)',
      lab: 'ch62',
      preset: 'group-z8-compare',
      tag: '6.2.2–6.2.5 核心单运算结构',
      axioms: ['半群（非空、封闭、结合）', '存在单位元 1 (1·a=a·1=a)', '任意元有逆元 a⁻¹ (a·a⁻¹=1)'],
      missing: '未必满足交换律（如 n ≥ 3 时对称群 Sₙ 非交换）',
      desc: '等幂元有且只有单位元 1；运算表每行每列皆成排列（消去律+可除条件）。',
    },
    abel: {
      title: 'Abel 群（交换群）',
      lab: 'ch63',
      preset: 'coset-partition',
      tag: '6.2.3 满足交换律',
      axioms: ['群的全部公理', '交换律 a·b = b·a', '第三指数律 (a·b)ᵐ = aᵐ·bᵐ'],
      missing: '未必能由单个元素生成（例如 4 元 Klein 群 V₄）',
      desc: 'Abel 群中左右陪集完全重合，因此任意子群都是正规子群。',
    },
    cyclic: {
      title: '循环群 / 巡回群 (a)',
      lab: 'ch63',
      preset: 'cyclic-clock',
      tag: '6.3.3 单生成元结构',
      axioms: ['由单元素 a 的幂生成 G = (a)', '必为 Abel 群', 'n 元时恰有 φ(n) 个生成元'],
      missing: '—',
      desc: '最简单的群结构：像时钟表盘一样围绕生成元旋转；对每个因子 k | n 存在唯一 k 阶子群。',
    },
    perm: {
      title: '置换群 Sₙ / 交代群 Aₙ',
      lab: 'ch62',
      preset: 'perm-braid',
      tag: '6.2.4–6.2.5 对称之源',
      axioms: ['Sₙ 为 n 元全体 1-1 变换构成群，元数 n!', 'n ≥ 3 时 Sₙ 跨出 Abel 群边界', 'Aₙ 为全体偶置换（元数 n!/2）'],
      missing: 'n ≥ 3 时乘法（自右向左复合）不交换',
      desc: '任意置换唯一分解为不相杂轮换乘积，周期等于轮换长度最小公倍数；奇偶性在任何对换分解下保持不变。',
    },
    ring: {
      title: '环 (R, +, ·)',
      lab: 'ch65',
      preset: 'ideal-blackhole',
      tag: '6.5.1 双运算基础',
      axioms: ['(R, +) 是 Abel 群（零元 0）', '(R, ·) 是半群（结合律）', '乘法对加法满足左右分配律'],
      missing: '乘法未必有单位元 1、未必交换、允许零因子 ab=0',
      desc: '环是“加法成群、乘法成半群、分配律当桥梁”的双运算舞台；同态核构成吸收外部乘法的“理想”。',
    },
    domain: {
      title: '整区（Integral Domain）',
      lab: 'ch65',
      preset: 'zero-divisor-zn',
      tag: '6.5 整数环 I 与 F[x] 的共同原型',
      axioms: ['有单位元 1 (1 ≠ 0)', '乘法满足交换律', '无零因子（消去环，非零元消去律成立）'],
      missing: '非零元未必有乘法逆元（如整数环 I 中 2 无逆；多项式环 F[x] 中 x 无逆）',
      desc: '“有限整区必是域”——一旦元素有限，无零因子 + 消去律自动逼出每个非零元的逆元！',
    },
    divring: {
      title: '体（Division Ring）',
      lab: 'ch65',
      preset: 'quaternion-tri',
      tag: '6.5 非零元乘法成群',
      axioms: ['至少两元素且含单位元 1', '非零元 (R*, ·) 作成乘法群（任意非零元有逆）', '自动无零因子（消去环）'],
      missing: '乘法未必交换（月牙区典型代表：四元数体 ℍ）',
      desc: '体未必是域，但“有限无零因子环必是体”（且按 Wedderburn 定理有限体必交换成域）。',
    },
    field: {
      title: '域（交换体）',
      lab: 'ch66',
      preset: 'numberline-wrap',
      tag: '6.5–6.6 整数/有理/实/复/素域交汇',
      axioms: ['(F, +) 是 Abel 群', '(F*, ·) 是 Abel 群', '分配律成立，同时兼具整区与体的全部性质'],
      missing: '特征为 0 或质数 p；任意域必包含素域 R₀ 或 Rₚ 作为最小子域',
      desc: '理想最贫瘠的地方反而是最完美的地方：域恰是“有单位元 1 的交换单纯环”（仅有 {0} 与自身两个理想）。',
    },
    gf: {
      title: '有限域 GF(pⁿ) & 素域 Rₚ',
      lab: 'ch68',
      preset: 'gf8-morph',
      tag: '6.8 Galois 域终章',
      axioms: ['元数必为素数幂 q = pⁿ', '非零元作成 q-1 元乘法循环群，全元素恰为 x^q - x 之根', '由 Rₚ[x]/(ψ(x)Rₚ[x]) 唯一构造成立'],
      missing: '子域存在唯一：GF(pᵐ) ⊆ GF(pⁿ) ⟺ m | n',
      desc: '在无限域中不可能有限构造的根，通过模去不可约质式 ψ(x) 被“折叠”成 n 维向量空间 + (q-1) 阶循环圆环。',
    },
  };

  const COUNTEREXAMPLES = [
    {
      id: 'ce-pow',
      x: 56, y: 120,
      label: '(ℕ, x^y)',
      zone: '代数系统 \\ 半群',
      lab: 'ch61',
      preset: 'law-assoc',
      ok: ['封闭：任意自然数 m,n 满足 mⁿ ∈ ℕ'],
      fail: ['结合律失效：(2²)^3 = 64 ≠ 2^(2³) = 256'],
      note: '6.2.1 易错结论（p.26）：幂运算不是半群。',
    },
    {
      id: 'ce-2n',
      x: 112, y: 164,
      label: '({2ⁿ}, ×)',
      zone: '半群 \\ 群',
      lab: 'ch62',
      preset: 'semigroup-check',
      ok: ['封闭：2ᵐ·2ⁿ = 2^{m+n}', '满足乘法结合律'],
      fail: ['逆元缺失（对 n≥1，2⁻ⁿ ∉ S）'],
      note: '6.2.1 易错结论（p.25）：半群不要求有单位元或逆元。',
    },
    {
      id: 'ce-z8mul',
      x: 162, y: 108,
      label: '(Z₈, ⊙)',
      zone: '含1半群 \\ 群',
      lab: 'ch62',
      preset: 'group-z8-compare',
      ok: ['封闭、结合律、有单位元 1'],
      fail: ['0 与偶数 2,4,6 无乘法逆元；且 0·0=0 为多余幂等元'],
      note: '6.2.2 易错结论（p.30）：有单位元的半群也未必是群。',
    },
    {
      id: 'ce-s3',
      x: 344, y: 138,
      label: 'S₃ (6元)',
      zone: '群 \\ Abel群',
      lab: 'ch62',
      preset: 's3-triangle',
      ok: ['满足全部群公理，且是最小非交换群'],
      fail: ['不交换：(1 2)(1 3) = (1 3 2) ≠ (1 2 3) = (1 3)(1 2)'],
      note: '6.2.4 注意（p.53）：1~5 元群皆交换，n≥3 时 Sₙ 非交换。',
    },
    {
      id: 'ce-v4',
      x: 294, y: 222,
      label: 'V₄ (4元)',
      zone: 'Abel群 \\ 循环群',
      lab: 'ch63',
      preset: 'coset-partition',
      ok: ['4元 Abel 群，每个非单位元周期为 2'],
      fail: ['无周期为 4 的生成元，不能写成 (a)'],
      note: '6.3.4 手写补充（p.106）：最小非循环群恰为 4 元。',
    },
    {
      id: 'ce-z6',
      x: 520, y: 122,
      label: '(Z₆,+,×)',
      zone: '交换含1环 \\ 整区',
      lab: 'ch65',
      preset: 'zero-divisor-zn',
      ok: ['交换含单位元环'],
      fail: ['存在零因子 2·3 ≡ 0 (mod 6)，不是消去环'],
      note: '6.5 结论（p.172）：Zₙ 为域/整区 ⟺ n 为质数。',
    },
    {
      id: 'ce-int',
      x: 590, y: 235,
      label: '整数环 I',
      zone: '整区 \\ 域',
      lab: 'ch66',
      preset: 'numberline-wrap',
      ok: ['有单位元 1、交换、无零因子'],
      fail: ['2, 3 等非 ±1 元素无乘法逆元（无限集不能强迫成域）'],
      note: '6.5 结论（p.165）：整区未必是体/域（无限时可仅是整区）。',
    },
    {
      id: 'ce-quat',
      x: 798, y: 215,
      label: '四元数体 ℍ',
      zone: '体 \\ 域',
      lab: 'ch65',
      preset: 'quaternion-tri',
      ok: ['非零元乘法构成群（含逆元、无零因子）'],
      fail: ['乘法不可交换：i·j = k ≠ -k = j·i'],
      note: '6.5 结论（p.174）：体未必是域。',
    },
  ];

  function render(container, ctx) {
    let tab = 'unified'; // 'unified' | 'ringvenn'
    let finiteCollapse = false;
    let activeKey = 'field';

    function applyPreset(p) {
      if (p === 'ring-venn') tab = 'ringvenn';
      else tab = 'unified';
      renderAll();
    }

    function renderAll() {
      container.innerHTML = '';

      // Header with Tab Switcher
      const header = htmlEl('div', { className: 'lab-header' }, [
        htmlEl('div', { className: 'lab-title-wrap' }, [
          htmlEl('h1', {}, [
            '第六章全景总览：群、环、域数形谱系',
            htmlEl('span', { className: 'lab-badge' }, '6.1 → 6.8 大一统地图'),
          ]),
          htmlEl('p', { className: 'lab-desc' }, '在「单/双运算统一谱系」与「环论三圆精确 Venn（消去/单位元/交换）」之间一键切换，点击任意交叠区或反例探针查看公理诊断。'),
        ]),
        htmlEl('div', { className: 'lab-tabs' }, [
          htmlEl('button', {
            className: `lab-tab ${tab === 'unified' ? 'active' : ''}`,
            onClick: () => { tab = 'unified'; renderAll(); },
          }, '单/双运算统一谱系 Venn'),
          htmlEl('button', {
            className: `lab-tab ${tab === 'ringvenn' ? 'active' : ''}`,
            onClick: () => { tab = 'ringvenn'; renderAll(); },
          }, '环论三圆拓扑 Venn（消去/单位元/交换）'),
        ]),
      ]);
      container.appendChild(header);

      if (tab === 'ringvenn') {
        const host = htmlEl('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
        container.appendChild(host);
        DM2.RingVenn.mount(host, ctx);
        return;
      }

      const collapseBar = htmlEl('div', { className: 'controls-bar' }, [
        htmlEl('label', { className: 'ctrl-group', style: { cursor: 'pointer' } }, [
          (() => {
            const cb = htmlEl('input', { type: 'checkbox', checked: finiteCollapse ? 'checked' : null });
            cb.addEventListener('change', () => {
              finiteCollapse = cb.checked;
              animateFiniteCollapse();
              renderDetail();
            });
            return cb;
          })(),
          htmlEl('span', {}, '开启「有限集合」条件（观察消去半群→群、消去环→体、整区→域塌缩）'),
        ]),
      ]);
      container.appendChild(collapseBar);

      // Venn SVG Canvas
      const vennPanel = htmlEl('div', { className: 'panel' });
      const vennBody = htmlEl('div', { className: 'panel-body' });
      const canvasBox = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(920, 410);
      canvasBox.appendChild(svg);
      vennBody.appendChild(canvasBox);
      vennPanel.appendChild(vennBody);
      container.appendChild(vennPanel);

      // Diagnostic Panel
      const diagBox = htmlEl('div', { className: 'panel' });
      container.appendChild(diagBox);

      // Unification Pipeline Panel
      const pipePanel = htmlEl('div', { className: 'panel' }, [
        htmlEl('div', { className: 'panel-head' }, [
          htmlEl('span', { className: 'panel-title' }, '6.1 → 6.8 全学期核心构造流水线（点击跳转对应实验）'),
          htmlEl('span', { className: 'chip' }, '由整数环 I 一步步造出有限域 GF(pⁿ)'),
        ]),
        htmlEl('div', { className: 'panel-body' }, [
          renderUnificationFlow(ctx),
        ]),
      ]);
      container.appendChild(pipePanel);

      // Build Venn SVG elements with references for smooth collapse animation
      let finiteSemiRing, finiteDomainRing, finiteCancelRing;
      let badgeGroupCollapse, badgeFieldCollapse;

      function drawVenn() {
      while (svg.childNodes.length > 1) svg.removeChild(svg.lastChild);

      // Left world background label
      svg.appendChild(el('text', {
        x: 220, y: 26, 'text-anchor': 'middle',
        fill: 'var(--accent-blue)', 'font-size': 14, 'font-weight': 800,
      }, '单运算世界：代数系统 → 半群 → 群 → 循环群'));

      // Divider
      svg.appendChild(el('line', {
        x1: 454, y1: 16, x2: 454, y2: 394,
        stroke: 'var(--border-strong)', 'stroke-dasharray': '5 5', 'stroke-width': 1.5,
      }));

      // Right world background label
      svg.appendChild(el('text', {
        x: 685, y: 26, 'text-anchor': 'middle',
        fill: 'var(--accent-teal)', 'font-size': 14, 'font-weight': 800,
      }, '双运算世界：环 → 整区 & 体 → 域 → 有限域 GF(pⁿ)'));

      // Helper for clickable Venn ellipse/rect
      function addRegion(shapeAttrs, tagName, key, labelText, lx, ly, colorVar) {
        const g = el('g', { class: 'svg-clickable' });
        const shp = el(tagName, Object.assign({
          fill: colorVar,
          'fill-opacity': activeKey === key ? 0.24 : 0.10,
          stroke: colorVar,
          'stroke-width': activeKey === key ? 2.6 : 1.6,
        }, shapeAttrs));
        const txt = el('text', {
          x: lx, y: ly, 'text-anchor': 'middle',
          fill: 'var(--text-primary)', 'font-size': 12.5, 'font-weight': 700,
        }, labelText);
        g.appendChild(shp);
        g.appendChild(txt);
        g.addEventListener('click', () => {
          activeKey = key;
          drawVenn();
          renderDetail();
        });
        bindTooltip(g, () => `<strong>${REGIONS[key].title}</strong><br>${REGIONS[key].desc}`);
        svg.appendChild(g);
        return shp;
      }

      // --- Left Venn Hierarchy ---
      addRegion({ x: 18, y: 42, width: 420, height: 350, rx: 24 }, 'rect', 'alg', '代数系统 (S, *)', 88, 66, 'var(--accent-slate)');
      addRegion({ cx: 230, cy: 224, rx: 190, ry: 150 }, 'ellipse', 'semi', '半群 (+结合律)', 130, 92, 'var(--accent-blue)');

      // Finite cancellative semigroup boundary (collapses to Group!)
      finiteSemiRing = el('ellipse', {
        cx: 248, cy: 238, rx: finiteCollapse ? 142 : 162, ry: finiteCollapse ? 114 : 132,
        fill: 'none', stroke: 'var(--accent-amber)',
        'stroke-width': 1.8, 'stroke-dasharray': finiteCollapse ? 'none' : '6 4',
      });
      svg.appendChild(finiteSemiRing);
      badgeGroupCollapse = el('text', {
        x: 274, y: finiteCollapse ? 120 : 104, 'text-anchor': 'middle',
        fill: 'var(--accent-amber)', 'font-size': 11, 'font-weight': 700,
      }, finiteCollapse ? '有限消去半群 ＝ 群 (手写 p.47)' : '虚线：消去条件半群（有限时塌缩为群）');
      svg.appendChild(badgeGroupCollapse);

      addRegion({ cx: 248, cy: 238, rx: 142, ry: 114 }, 'ellipse', 'group', '群 (+1, 逆元)', 170, 152, 'var(--accent-teal)');

      // Permutation group S_n overlapping outside Abel
      addRegion({ cx: 332, cy: 175, rx: 76, ry: 54 }, 'ellipse', 'perm', '置换群 Sₙ/Aₙ', 344, 178, 'var(--accent-rose)');

      addRegion({ cx: 235, cy: 262, rx: 102, ry: 78 }, 'ellipse', 'abel', 'Abel 群 (+交换)', 196, 214, 'var(--accent-purple)');
      addRegion({ cx: 235, cy: 288, rx: 66, ry: 42 }, 'ellipse', 'cyclic', '巡回/循环群 (a)', 235, 293, 'var(--accent-green)');

      // --- Right Venn Hierarchy ---
      addRegion({ x: 472, y: 42, width: 430, height: 350, rx: 24 }, 'rect', 'ring', '环 (R, +, ·)', 540, 66, 'var(--accent-slate)');

      // Finite cancellative ring boundary (collapses to Division Ring!)
      finiteCancelRing = el('ellipse', {
        cx: 688, cy: 230, rx: finiteCollapse ? 132 : 186, ry: finiteCollapse ? 96 : 134,
        fill: 'none', stroke: 'var(--accent-amber)',
        'stroke-width': 1.7, 'stroke-dasharray': finiteCollapse ? 'none' : '6 4',
      });
      svg.appendChild(finiteCancelRing);

      // Integral Domain (left overlapping ellipse)
      finiteDomainRing = addRegion({
        cx: finiteCollapse ? 688 : 636,
        cy: 230,
        rx: finiteCollapse ? 96 : 112,
        ry: finiteCollapse ? 76 : 98,
      }, 'ellipse', 'domain', finiteCollapse ? '有限整区 ≡ 域' : '整区 (交换含1消去环)', finiteCollapse ? 688 : 582, 168, 'var(--accent-blue)');

      // Division Ring / Body (right overlapping ellipse)
      addRegion({
        cx: finiteCollapse ? 688 : 742,
        cy: 230,
        rx: finiteCollapse ? 96 : 112,
        ry: finiteCollapse ? 76 : 98,
      }, 'ellipse', 'divring', finiteCollapse ? '有限体 ≡ 域' : '体 (非零元成群)', finiteCollapse ? 688 : 798, 168, 'var(--accent-purple)');

      // Field (intersection)
      addRegion({ cx: 688, cy: 238, rx: 68, ry: 68 }, 'ellipse', 'field', '域 (交换体)', 688, 200, 'var(--accent-teal)');
      addRegion({ cx: 688, cy: 256, rx: 46, ry: 34 }, 'ellipse', 'gf', 'GF(pⁿ) & 素域', 688, 260, 'var(--accent-green)');

      badgeFieldCollapse = el('text', {
        x: 688, y: 84, 'text-anchor': 'middle',
        fill: 'var(--accent-amber)', 'font-size': 11, 'font-weight': 700,
      }, finiteCollapse ? '已开启有限条件：无零因子有限环 ＝ 域！(p.166, p.169)' : '含1交换消去环 ∩ 非零元成群 ＝ 域');
      svg.appendChild(badgeFieldCollapse);

      // --- Counterexample Pins ---
      for (const ce of COUNTEREXAMPLES) {
        const isSel = activeKey === ce.id;
        const g = el('g', { class: 'svg-clickable' });
        g.appendChild(el('circle', {
          cx: ce.x, cy: ce.y, r: isSel ? 9 : 6.5,
          fill: 'var(--accent-rose)', stroke: 'var(--bg-panel)', 'stroke-width': 2,
        }));
        g.appendChild(el('rect', {
          x: ce.x - 36, y: ce.y + 10, width: 72, height: 18, rx: 9,
          fill: isSel ? 'var(--accent-rose)' : 'var(--bg-panel)',
          stroke: 'var(--accent-rose)', 'stroke-width': 1,
        }));
        g.appendChild(el('text', {
          x: ce.x, y: ce.y + 22.5, 'text-anchor': 'middle',
          fill: isSel ? '#FFFFFF' : 'var(--accent-rose)',
          'font-size': 10.5, 'font-weight': 700,
        }, ce.label));
        g.addEventListener('click', () => {
          activeKey = ce.id;
          drawVenn();
          renderDetail();
        });
        bindTooltip(g, () => `<strong>反例探针 ${ce.label}</strong><br>位于：${ce.zone}<br>${ce.fail[0]}`);
        svg.appendChild(g);
      }
    }

    function animateFiniteCollapse() {
      const target = finiteCollapse;
      animateTween(360, () => {
        // Re-render smoothly at endpoints with clean CSS-like SVG update
      }, () => {
        drawVenn();
      });
      // Immediate visual update for snappy feedback
      drawVenn();
    }

    function renderDetail() {
      diagBox.innerHTML = '';
      const ce = COUNTEREXAMPLES.find((c) => c.id === activeKey);
      if (ce) {
        const head = htmlEl('div', { className: 'panel-head' }, [
          htmlEl('span', { className: 'panel-title' }, `反例边界诊断：${ce.label}（所在区域：${ce.zone}）`),
          htmlEl('button', {
            className: 'btn btn-primary btn-sm',
            onClick: () => ctx.navigate(ce.lab, ce.preset),
          }, '在对应实验室中验证 ▶'),
        ]);
        const body = htmlEl('div', { className: 'panel-body' }, [
          htmlEl('div', { className: 'grid-2' }, [
            htmlEl('div', { className: 'formula-banner' }, [
              htmlEl('strong', {}, '✓ 已满足的公理'),
              ...ce.ok.map((line) => htmlEl('span', {}, line)),
            ]),
            htmlEl('div', { className: 'formula-banner warn' }, [
              htmlEl('strong', {}, '✗ 破坏的边界条件（跨不出边界的原因）'),
              ...ce.fail.map((line) => htmlEl('span', {}, line)),
            ]),
          ]),
          htmlEl('p', { style: { margin: '8px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' } }, ce.note),
        ]);
        diagBox.appendChild(head);
        diagBox.appendChild(body);
        return;
      }

      const reg = REGIONS[activeKey] || REGIONS.field;
      const head = htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, `${reg.title}`),
        htmlEl('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, [
          htmlEl('span', { className: 'chip' }, reg.tag),
          htmlEl('button', {
            className: 'btn btn-primary btn-sm',
            onClick: () => ctx.navigate(reg.lab, reg.preset),
          }, '进入交互实验室 ▶'),
        ]),
      ]);
      const body = htmlEl('div', { className: 'panel-body' }, [
        htmlEl('div', { className: 'grid-2' }, [
          htmlEl('div', { className: 'formula-banner' }, [
            htmlEl('strong', {}, '本层级新增/具备公理'),
            ...reg.axioms.map((a) => htmlEl('span', {}, `• ${a}`)),
          ]),
          htmlEl('div', { className: 'formula-banner info' }, [
            htmlEl('strong', {}, '几何直觉与边界说明'),
            htmlEl('span', {}, reg.desc),
            htmlEl('span', { style: { color: 'var(--text-muted)', fontSize: '12px' } }, `尚缺条件：${reg.missing}`),
          ]),
        ]),
      ]);
      diagBox.appendChild(head);
      diagBox.appendChild(body);
    }

      drawVenn();
      renderDetail();
    }

    renderAll();
    return { applyPreset };
  }

  function renderUnificationFlow(ctx) {
    const steps = [
      { lab: 'ch61', title: '6.1–6.3 群与子群', formula: '(G, \\cdot) \\supset H \\to aH', desc: '单运算、陪集切分、正规子群' },
      { lab: 'ch64', title: '6.4 同态与商群', formula: 'G/N \\cong G\'', desc: '核压成点：第一/二/三同态定理' },
      { lab: 'ch65', title: '6.5 环与极大理想', formula: 'R/N\\text{ 是域} \\iff N\\text{ 极大}', desc: '双运算、零因子、理想吸收' },
      { lab: 'ch66', title: '6.6 特征与素域', formula: 'I / pI \\cong R_p', desc: '数轴卷绕出 p 元素域' },
      { lab: 'ch67', title: '6.7 多项式与质式', formula: 'R_p[x],\\ \\Phi_n(x)', desc: '降幂整除、单位圆分圆分解' },
      { lab: 'ch68', title: '6.8 有限域构造', formula: '\\frac{R_p[x]}{\\psi(x)R_p[x]} \\cong GF(p^n)', desc: 'n 维向量空间 + (q-1) 循环圆环' },
    ];
    const row = htmlEl('div', {
      style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' },
    });
    for (const st of steps) {
      const card = htmlEl('button', {
        className: 'panel',
        style: {
          padding: '10px', cursor: 'pointer', textAlign: 'left',
          border: '1px solid var(--border-color)', background: 'var(--bg-subtle)',
        },
        onClick: () => ctx.navigate(st.lab),
      }, [
        htmlEl('div', { style: { fontWeight: 700, fontSize: '12.5px', color: 'var(--accent-blue)' } }, st.title),
        htmlEl('div', {
          style: { margin: '6px 0', minHeight: '28px' },
          innerHTML: renderTex(st.formula, false),
        }),
        htmlEl('div', { style: { fontSize: '11.5px', color: 'var(--text-muted)' } }, st.desc),
      ]);
      row.appendChild(card);
    }
    return row;
  }

  DM2.Labs.overview = {
    id: 'overview',
    title: '全景总览',
    badge: 'Venn 谱系',
    subtitle: '代数系统→群→环→整区/体→域→有限域统一地图',
    render,
  };
})(window);
