/* Shared Interactive 3-Circle Ring Theory Venn Diagram Component (DM2.RingVenn)
 * Exact Euler Topology using SVG <clipPath> (matching d:\Downloads\venn.html geometry):
 *   Base Universe: Ring (R, +, ·)
 *   3 Circles: K = 消去环 (300,260,180), U = 单位元环 (500,260,180), C = 交换环 (400,395,180)
 *   Triple Intersection (C ∩ U ∩ K) = 整区 (Integral Domain)
 *   Division Ring 体 (400,265,rx=66,ry=92) ⊂ U ∩ K
 *   Field 域 = 体 ∩ 交换环(C) = 体 ∩ 整区 (clipped directly by C!)
 */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});
  const { el, createSvg, htmlEl } = DM2.Svg;

  const BASE_W = 800;
  const BASE_H = 600;
  const CIRCLE_K = { x: 300, y: 260, r: 180 };
  const CIRCLE_U = { x: 500, y: 260, r: 180 };
  const CIRCLE_C = { x: 400, y: 395, r: 180 };
  const ELLIPSE_DIV = { x: 400, y: 265, rx: 66, ry: 92 };

  const ALGEBRAIC_DATA = {
    field: {
      id: 'field',
      name: '域（交换体 / Field）',
      enName: 'Field',
      formula: '域 = 体 ∩ 交换环(C) = 体 ∩ 整区',
      desc: '体落在交换环（整区）内部的部分：加法构成 Abel 群，非零元乘法也构成 Abel 群。既是整区又是体。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: true, identity: true, cancellation: true, invertible: true },
      examples: [
        { name: 'ℚ, ℝ, ℂ', desc: '特征 0 无限数域' },
        { name: '素域 Rₚ = I/pI', desc: '模质数 p 剩余类域' },
        { name: '有限域 GF(pⁿ)', desc: '商域 Rₚ[x]/(ψ(x)Rₚ[x])' },
      ],
      lab: 'ch66', preset: 'numberline-wrap', jumpLabel: '去 6.6 素域实验室 ▶',
    },
    division_ring: {
      id: 'division_ring',
      name: '体 / 除环 (Division Ring)',
      enName: 'Division Ring / Skew Field',
      formula: '体 ⊂ U ∩ K（非零元乘法成群）',
      desc: '含单位元且任意非零元均有乘法逆元的环，自动无零因子（故必属 K ∩ U）。跨入交换环 C 的部分即“域”，留在 C 外的月牙区为非交换体。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: false, identity: true, cancellation: true, invertible: true },
      examples: [
        { name: '四元数体 ℍ', desc: 'ij=k ≠ -k=ji，是体但不是域（p.174）' },
        { name: '任意域 F', desc: '满足交换律的体' },
      ],
      lab: 'ch65', preset: 'quaternion-tri', jumpLabel: '去 6.5 四元数体实验 ▶',
    },
    skew_field_strict: {
      id: 'skew_field_strict',
      name: '非交换体（真除环）',
      enName: 'Strict Skew Field',
      formula: '体 \\ 交换环(C)（体在整区之外的部分）',
      desc: '非零元全可逆、但乘法不交换的纯粹体（如四元数体 ℍ）。由有限无零因子环及 Wedderburn 定理知，有限阶下该区域为空集。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: false, identity: true, cancellation: true, invertible: true },
      examples: [
        { name: '哈密顿四元数体 ℍ', desc: 'i²=j²=k²=-1, ij=k, ji=-k' },
      ],
      lab: 'ch65', preset: 'quaternion-tri', jumpLabel: '去 6.5 四元数体实验 ▶',
    },
    domain: {
      id: 'domain',
      name: '整区（Integral Domain）',
      enName: 'Integral Domain',
      formula: '整区 = 交换环(C) ∩ 单位元环(U) ∩ 消去环(K)',
      desc: '三圆正中心交叠区：有单位元 1≠0、交换且无零因子的环。内部包含“域”（体∩整区）以及非域的整区（如整数环 I、F[x]）。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: true, identity: true, cancellation: true, invertible: false },
      examples: [
        { name: '整数环 I (ℤ)', desc: '仅 ±1 可逆，整区非域' },
        { name: '多项式环 F[x]', desc: '定理 6.7.1：域上多项式环是整区' },
        { name: '任意域', desc: '域是整区（结论 2 p.168）' },
      ],
      lab: 'ch67', preset: 'poly-euclid', jumpLabel: '去 6.7 F[x] 实验室 ▶',
    },
    domain_not_field: {
      id: 'domain_not_field',
      name: '非域整区（整区 \\ 体）',
      enName: 'Integral Domain (Not a Field)',
      formula: '整区 \\ 域 = (C ∩ U ∩ K) \\ 体',
      desc: '位于三圆交集内但位于“体”椭圆之外：虽有 1、交换、无零因子，但并非所有非零元都可逆。有限阶时该区域为空（有限整区必是域）。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: true, identity: true, cancellation: true, invertible: false },
      examples: [
        { name: '整数环 I (ℤ)', desc: '2 无乘法逆元（p.165 整区未必是体）' },
        { name: '多项式环 F[x]', desc: '非常数多项式均无逆元' },
      ],
      lab: 'ch67', preset: 'poly-euclid', jumpLabel: '去 6.7 多项式环 ▶',
    },
    cancellation: {
      id: 'cancellation',
      name: '消去环 (K)（无零因子环）',
      enName: 'Cancellation Ring',
      formula: 'a≠0 且 b≠0 ⇒ ab≠0（非零元消去律成立）',
      desc: '无零因子环（性质 12 p.158）。未必有单位元（如 2ℤ）也未必交换。但有限无零因子环（≥2元）必为体/域（p.166）。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: false, identity: false, cancellation: true, invertible: false },
      examples: [
        { name: '偶数环 2ℤ', desc: '属 (C∩K)\\U：无单位元 1' },
        { name: '整数环 I / 域', desc: '含单位元的消去环' },
      ],
      lab: 'ch65', preset: 'zero-divisor-zn', jumpLabel: '去 6.5 零因子雷达 ▶',
    },
    unital: {
      id: 'unital',
      name: '含单位元环 (U)',
      enName: 'Unital Ring',
      formula: '∃1∈R 使 1a = a1 = a（且 1 ≠ 0）',
      desc: '至少两元且含乘法单位元 1 的环。可能不交换且含零因子（矩阵环），或交换含零因子（Z₆）。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: false, identity: true, cancellation: false, invertible: false },
      examples: [
        { name: '矩阵环 Mₙ(ℝ)', desc: '含 Iₙ，不交换且有零因子' },
        { name: 'Z₆ = I/6I', desc: '含 1 交换，但 2·3≡0' },
      ],
      lab: 'ch65', preset: 'zero-divisor-zn', jumpLabel: '去 6.5 对比 Zₙ ▶',
    },
    commutative: {
      id: 'commutative',
      name: '交换环 (C)',
      enName: 'Commutative Ring',
      formula: '∀a, b ∈ R, a · b = b · a',
      desc: '乘法满足交换律，第三指数律 (ab)ⁿ=aⁿbⁿ 与二项式定理成立；但仍可能缺单位元或有零因子。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: true, identity: false, cancellation: false, invertible: false },
      examples: [
        { name: '2ℤ/12ℤ', desc: '交换、无 1、有零因子 (4·6≡0)' },
        { name: 'Z₆ = I/6I', desc: '含 1 交换环' },
      ],
      lab: 'ch65', preset: 'ideal-blackhole', jumpLabel: '去 6.5 理想实验室 ▶',
    },
    cu_not_k: {
      id: 'cu_not_k',
      name: '交换含 1 非消去环',
      enName: 'Commutative Unital with Zero Divisors',
      formula: '(C ∩ U) \\ K',
      desc: '同时满足交换律与含单位元 1，但存在非零零因子（因此不是整区）。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: true, identity: true, cancellation: false, invertible: false },
      examples: [
        { name: 'Z₆ = I/6I', desc: '2·3 ≡ 0 (mod 6)，零因子' },
      ],
      lab: 'ch65', preset: 'zero-divisor-zn', jumpLabel: '去 6.5 零因子雷达 ▶',
    },
    ck_not_u: {
      id: 'ck_not_u',
      name: '交换无单位元消去环',
      enName: 'Commutative Cancellation without 1',
      formula: '(C ∩ K) \\ U',
      desc: '交换且无零因子，但集合中缺失乘法单位元 1。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: true, identity: false, cancellation: true, invertible: false },
      examples: [
        { name: '偶数环 2ℤ', desc: '任意非零偶数乘积非零，但无 1' },
      ],
      lab: 'ch65', preset: 'ideal-blackhole', jumpLabel: '去 6.5 环与理想 ▶',
    },
    u_only: {
      id: 'u_only',
      name: '一般单位元环（非交换有零因子）',
      enName: 'Pure Unital Ring',
      formula: 'U \\ (C ∪ K)',
      desc: '有乘法单位元，但既不交换、又存在大量零因子。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: false, identity: true, cancellation: false, invertible: false },
      examples: [
        { name: '矩阵环 M₂(ℝ)', desc: '奇异矩阵互乘可为零，AB≠BA' },
      ],
      lab: 'ch65', preset: 'ideal-blackhole', jumpLabel: '去 6.5 环与理想 ▶',
    },
    ring_general: {
      id: 'ring_general',
      name: '一般环 (R, +, ·)',
      enName: 'General Ring',
      formula: '(R, +) Abel 群 · (R, ·) 半群 · 左右分配律',
      desc: '全集外框：仅满足环最基本 6 条公理，可同时无单位元、不交换且有零因子。',
      axioms: { abelianAdd: true, multAssoc: true, multComm: false, identity: false, cancellation: false, invertible: false },
      examples: [
        { name: '严格上三角矩阵 𝒩₃(ℝ)', desc: '无 1、非交换、全元素幂零' },
      ],
      lab: 'ch65', preset: 'ideal-blackhole', jumpLabel: '去 6.5 环与理想 ▶',
    },
  };

  const PRESET_EXAMPLES = [
    { name: 'ℚ, ℝ, ℂ（实/有理/复数域）', target: 'field', desc: '域 = 体 ∩ 整区' },
    { name: 'Rₚ, GF(pⁿ)（素域/有限域）', target: 'field', desc: '有限 Galois 域' },
    { name: 'ℍ（四元数体）', target: 'skew_field_strict', desc: '体 \\ 域（非交换体）' },
    { name: 'I (ℤ), F[x]（整数环/多项式环）', target: 'domain_not_field', desc: '整区 \\ 体（非域整区）' },
    { name: 'Z₆ = I/6I（模 6 剩余类环）', target: 'cu_not_k', desc: '(C∩U)\\K：有零因子' },
    { name: '2ℤ（偶数环）', target: 'ck_not_u', desc: '(C∩K)\\U：无单位元 1' },
    { name: 'M₂(ℝ)（2 阶矩阵环）', target: 'u_only', desc: 'U\\(C∪K)：含1非交换有零因子' },
    { name: '2ℤ/12ℤ', target: 'commutative', desc: 'C\\(K∪U)：交换无1有零因子' },
    { name: '严格上三角矩阵 𝒩₃(ℝ)', target: 'ring_general', desc: '三圈外一般环' },
  ];

  function getRegionUnderPoint(nx, ny) {
    const inK = Math.hypot(nx - CIRCLE_K.x, ny - CIRCLE_K.y) <= CIRCLE_K.r;
    const inU = Math.hypot(nx - CIRCLE_U.x, ny - CIRCLE_U.y) <= CIRCLE_U.r;
    const inC = Math.hypot(nx - CIRCLE_C.x, ny - CIRCLE_C.y) <= CIRCLE_C.r;

    if (inK && inU) {
      const dx = nx - ELLIPSE_DIV.x;
      const dy = ny - ELLIPSE_DIV.y;
      const inDiv = ((dx * dx) / (ELLIPSE_DIV.rx * ELLIPSE_DIV.rx) + (dy * dy) / (ELLIPSE_DIV.ry * ELLIPSE_DIV.ry)) <= 1;
      if (inC) {
        return inDiv ? 'field' : 'domain_not_field';
      }
      return inDiv ? 'skew_field_strict' : 'unital';
    }
    if (inC && inU && !inK) return 'cu_not_k';
    if (inC && inK && !inU) return 'ck_not_u';
    if (inU && !inC && !inK) return 'u_only';
    if (inC && !inU && !inK) return 'commutative';
    if (inK && !inU && !inC) return 'cancellation';
    if (nx >= 20 && nx <= BASE_W - 20 && ny >= 20 && ny <= BASE_H - 20) return 'ring_general';
    return null;
  }

  function mount(hostEl, ctx) {
    let selectedId = 'domain';
    let hoveredId = null;
    let isFinite = false;

    function getActiveId() {
      return hoveredId || selectedId || 'domain';
    }

    function renderAll() {
      hostEl.innerHTML = '';

      // Top Controls Bar
      const bar = htmlEl('div', { className: 'controls-bar', style: { justifyContent: 'space-between' } }, [
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('label', {}, '高亮结构：'),
          ...[
            ['field', '域 (Field)'],
            ['division_ring', '体 (Division Ring)'],
            ['domain', '整区 (Integral Domain)'],
            ['cancellation', '消去环 (K)'],
            ['unital', '单位元环 (U)'],
            ['commutative', '交换环 (C)'],
            ['ring_general', '全集：环 (R)'],
          ].map(([k, lbl]) => htmlEl('button', {
            className: `btn btn-sm ${selectedId === k ? 'btn-primary' : ''}`,
            onClick: () => { selectedId = k; renderAll(); },
          }, lbl)),
        ]),
        htmlEl('div', { className: 'ctrl-group' }, [
          htmlEl('button', {
            className: `btn btn-sm ${isFinite ? 'btn-primary' : ''}`,
            style: isFinite ? { background: 'var(--accent-amber)', borderColor: 'var(--accent-amber)', color: '#06101F' } : null,
            onClick: () => { isFinite = !isFinite; renderAll(); },
          }, isFinite ? '✓ 已开启：有限阶定理（Wedderburn 坍缩）' : '● 有限阶定理（Wedderburn 坍缩）'),
          htmlEl('button', {
            className: 'btn btn-sm',
            onClick: () => { selectedId = 'domain'; hoveredId = null; isFinite = false; renderAll(); },
          }, '重置选择'),
        ]),
      ]);
      hostEl.appendChild(bar);

      const split = htmlEl('div', { className: 'split-wide' });
      hostEl.appendChild(split);

      // Left Panel: Exact <clipPath> Euler Topology SVG
      const leftPanel = htmlEl('div', { className: 'panel' });
      leftPanel.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '近世代数 · 环论谱系 Venn 图（整区 = K∩U∩C，域 = 体∩整区）'),
        htmlEl('span', { className: 'chip' }, '悬停探索精确子区域，点击固定详情'),
      ]));
      const leftBody = htmlEl('div', { className: 'panel-body' });
      const box = htmlEl('div', { className: 'canvas-box' });
      const svg = createSvg(BASE_W, BASE_H);
      svg.style.cursor = 'crosshair';
      box.appendChild(svg);

      // Build clipPaths inside SVG <defs>
      const defs = svg.querySelector('defs');
      const addClip = (id, cx, cy, r) => {
        const cp = el('clipPath', { id }, [el('circle', { cx, cy, r })]);
        defs.appendChild(cp);
      };
      addClip('rv-clip-k', CIRCLE_K.x, CIRCLE_K.y, CIRCLE_K.r);
      addClip('rv-clip-u', CIRCLE_U.x, CIRCLE_U.y, CIRCLE_U.r);
      addClip('rv-clip-c', CIRCLE_C.x, CIRCLE_C.y, CIRCLE_C.r);

      const svgLayer = el('g');
      svg.appendChild(svgLayer);

      function redrawSvg() {
        while (svgLayer.firstChild) svgLayer.removeChild(svgLayer.firstChild);
        const act = getActiveId();

        // 1. Universe Container
        const isRingAct = act === 'ring_general';
        svgLayer.appendChild(el('rect', {
          x: 20, y: 20, width: BASE_W - 40, height: BASE_H - 40, rx: 24,
          fill: isRingAct ? 'var(--accent-blue-soft)' : 'transparent',
          stroke: isRingAct ? 'var(--accent-blue)' : 'var(--border-strong)',
          'stroke-width': isRingAct ? 2.6 : 1.6,
        }));
        svgLayer.appendChild(el('text', {
          x: 38, y: 48, fill: isRingAct ? 'var(--accent-blue)' : 'var(--text-muted)',
          'font-size': 14, 'font-weight': 700,
        }, '全集：环 (Ring, (R, +, ·))'));

        // 2. Base 3 Circles soft fills
        const baseFill = (c, col, activeKey) => el('circle', {
          cx: c.x, cy: c.y, r: c.r,
          fill: col, 'fill-opacity': act === activeKey ? 0.19 : 0.08,
        });
        svgLayer.appendChild(baseFill(CIRCLE_K, 'var(--accent-teal)', 'cancellation'));
        svgLayer.appendChild(baseFill(CIRCLE_U, 'var(--accent-blue)', 'unital'));
        svgLayer.appendChild(baseFill(CIRCLE_C, 'var(--accent-rose)', 'commutative'));

        // 3. EXACT Triple Intersection (整区 = C ∩ U ∩ K) using nested <clipPath> (zero arc bugs!)
        const isDomAct = act === 'domain' || act === 'domain_not_field' || act === 'field';
        const gDomClip = el('g', { 'clip-path': 'url(#rv-clip-k)' }, [
          el('g', { 'clip-path': 'url(#rv-clip-u)' }, [
            el('g', { 'clip-path': 'url(#rv-clip-c)' }, [
              el('rect', {
                x: 200, y: 180, width: 400, height: 280,
                fill: isFinite ? 'var(--text-muted)' : 'var(--accent-cyan)',
                'fill-opacity': isFinite ? 0.14 : (isDomAct ? 0.34 : 0.16),
              }),
            ]),
          ]),
        ]);
        svgLayer.appendChild(gDomClip);

        // 4. Division Ring (体) dashed ellipse strictly inside K ∩ U, straddling C top edge
        const isDivAct = act === 'division_ring' || act === 'skew_field_strict' || act === 'field';
        svgLayer.appendChild(el('ellipse', {
          cx: ELLIPSE_DIV.x, cy: ELLIPSE_DIV.y, rx: ELLIPSE_DIV.rx, ry: ELLIPSE_DIV.ry,
          fill: 'var(--accent-purple)',
          'fill-opacity': isFinite ? 0.06 : (isDivAct ? 0.30 : 0.15),
          stroke: 'var(--accent-purple)',
          'stroke-width': isDivAct ? 2.6 : 1.7,
          'stroke-dasharray': '6 4',
        }));

        // Upper crescent label inside (体 \ C)
        if (!isFinite) {
          svgLayer.appendChild(el('text', {
            x: 400, y: 196, 'text-anchor': 'middle',
            fill: 'var(--accent-purple)', 'font-size': 12.5, 'font-weight': 800,
          }, '体 (除环)'));
          svgLayer.appendChild(el('text', {
            x: 400, y: 211, 'text-anchor': 'middle',
            fill: 'var(--accent-purple)', 'font-size': 10.5, 'font-weight': 600,
          }, 'ℍ (四元数体)'));
        } else {
          svgLayer.appendChild(el('text', {
            x: 400, y: 202, 'text-anchor': 'middle',
            fill: 'var(--text-muted)', 'font-size': 11, 'font-weight': 600,
          }, '非交换体坍缩为空'));
        }

        // 5. EXACT Field (域 = 体 ∩ 交换环 C = 体 ∩ 整区): Ellipse clipped directly by Circle C!
        const isFieldAct = act === 'field';
        const gFieldClip = el('g', { 'clip-path': 'url(#rv-clip-c)' }, [
          el('ellipse', {
            cx: ELLIPSE_DIV.x, cy: ELLIPSE_DIV.y, rx: ELLIPSE_DIV.rx, ry: ELLIPSE_DIV.ry,
            fill: 'var(--accent-green)',
            'fill-opacity': (isFieldAct || isFinite) ? 0.45 : 0.28,
            stroke: 'var(--accent-green)',
            'stroke-width': (isFieldAct || isFinite) ? 2.8 : 2,
          }),
        ]);
        svgLayer.appendChild(gFieldClip);

        svgLayer.appendChild(el('text', {
          x: 400, y: 278, 'text-anchor': 'middle',
          fill: 'var(--text-primary)', 'font-size': 14, 'font-weight': 800,
        }, '域 (Field)'));
        svgLayer.appendChild(el('text', {
          x: 400, y: 298, 'text-anchor': 'middle',
          fill: 'var(--text-secondary)', 'font-size': 11, 'font-weight': 700,
        }, 'ℚ, ℝ, ℂ, Rₚ, GF(pⁿ)'));
        if (isFinite) {
          svgLayer.appendChild(el('text', {
            x: 400, y: 318, 'text-anchor': 'middle',
            fill: 'var(--accent-amber)', 'font-size': 11.5, 'font-weight': 800,
          }, '★ 有限整区 = 域'));
        }

        // 6. Integral Domain (Non-Field) label inside C∩U∩K below Field
        if (!isFinite) {
          svgLayer.appendChild(el('text', {
            x: 400, y: 379, 'text-anchor': 'middle',
            fill: 'var(--accent-cyan)', 'font-size': 11.5, 'font-weight': 800,
          }, '整区 (非域)'));
          svgLayer.appendChild(el('text', {
            x: 400, y: 394, 'text-anchor': 'middle',
            fill: 'var(--text-secondary)', 'font-size': 10.5, 'font-weight': 600,
          }, 'ℤ, F[x]'));
        } else {
          svgLayer.appendChild(el('text', {
            x: 400, y: 386, 'text-anchor': 'middle',
            fill: 'var(--accent-amber)', 'font-size': 10.5, 'font-weight': 700,
          }, '[有限阶下为空集]'));
        }

        // 7. Crisp Circle Outlines & Boundary Labels
        const drawBorder = (c, col, key) => {
          const on = act === key;
          svgLayer.appendChild(el('circle', {
            cx: c.x, cy: c.y, r: c.r, fill: 'none',
            stroke: col, 'stroke-width': on ? 3.2 : 1.9,
          }));
        };
        drawBorder(CIRCLE_K, 'var(--accent-teal)', 'cancellation');
        drawBorder(CIRCLE_U, 'var(--accent-blue)', 'unital');
        drawBorder(CIRCLE_C, 'var(--accent-rose)', 'commutative');

        svgLayer.appendChild(el('text', { x: 206, y: 196, 'text-anchor': 'middle', fill: 'var(--accent-teal)', 'font-size': 14, 'font-weight': 800 }, '消去环 (K)'));
        svgLayer.appendChild(el('text', { x: 206, y: 214, 'text-anchor': 'middle', fill: 'var(--text-muted)', 'font-size': 11.5 }, '（无零因子）'));

        svgLayer.appendChild(el('text', { x: 594, y: 196, 'text-anchor': 'middle', fill: 'var(--accent-blue)', 'font-size': 14, 'font-weight': 800 }, '单位元环 (U)'));
        svgLayer.appendChild(el('text', { x: 594, y: 214, 'text-anchor': 'middle', fill: 'var(--text-muted)', 'font-size': 11.5 }, '（含 1 ≠ 0）'));

        svgLayer.appendChild(el('text', { x: 400, y: 544, 'text-anchor': 'middle', fill: 'var(--accent-rose)', 'font-size': 14, 'font-weight': 800 }, '交换环 (C)'));
        svgLayer.appendChild(el('text', { x: 400, y: 561, 'text-anchor': 'middle', fill: 'var(--text-muted)', 'font-size': 11.5 }, '（ab = ba）'));

        // 8. Pure Subset Example Markers
        const markers = [
          { t: '2ℤ (无单位元)', x: 235, y: 356, col: 'var(--accent-teal)', region: 'ck_not_u' },
          { t: 'Z₆ = I/6I (有零因子)', x: 528, y: 396, col: 'var(--accent-rose)', region: 'cu_not_k' },
          { t: 'Mₙ(ℝ) (矩阵环)', x: 582, y: 306, col: 'var(--accent-blue)', region: 'u_only' },
          { t: '2ℤ / 12ℤ', x: 400, y: 492, col: 'var(--accent-rose)', region: 'commutative' },
        ];
        for (const m of markers) {
          const isM = act === m.region;
          if (isM) {
            svgLayer.appendChild(el('rect', {
              x: m.x - 62, y: m.y - 14, width: 124, height: 22, rx: 11,
              fill: m.col, 'fill-opacity': 0.16, stroke: m.col, 'stroke-width': 1.4,
            }));
          }
          svgLayer.appendChild(el('text', {
            x: m.x, y: m.y + 1, 'text-anchor': 'middle', fill: m.col, 'font-size': 11.5, 'font-weight': 700,
          }, m.t));
        }

        svgLayer.appendChild(el('text', {
          x: 38, y: BASE_H - 34, fill: 'var(--text-muted)', 'font-size': 11,
        }, '三圈外一般环：严格上三角矩阵 𝒩₃(ℝ)'));
      }

      // Mouse hit testing on SVG
      const tipNode = document.getElementById('svg-tooltip');
      svg.addEventListener('mousemove', (ev) => {
        const rect = svg.getBoundingClientRect();
        const nx = ((ev.clientX - rect.left) * BASE_W) / rect.width;
        const ny = ((ev.clientY - rect.top) * BASE_H) / rect.height;
        const hit = getRegionUnderPoint(nx, ny);
        if (hit !== hoveredId) {
          hoveredId = hit;
          redrawSvg();
        }
        if (tipNode && hit && ALGEBRAIC_DATA[hit]) {
          const d = ALGEBRAIC_DATA[hit];
          tipNode.innerHTML = `<strong>${d.name}</strong><br>${d.formula}`;
          tipNode.style.display = 'block';
          tipNode.style.left = `${Math.min(ev.clientX + 14, window.innerWidth - 290)}px`;
          tipNode.style.top = `${Math.max(ev.clientY - 12, 10)}px`;
        } else if (tipNode) {
          tipNode.style.display = 'none';
        }
      });

      svg.addEventListener('mouseleave', () => {
        hoveredId = null;
        if (tipNode) tipNode.style.display = 'none';
        redrawSvg();
      });

      svg.addEventListener('click', (ev) => {
        const rect = svg.getBoundingClientRect();
        const nx = ((ev.clientX - rect.left) * BASE_W) / rect.width;
        const ny = ((ev.clientY - rect.top) * BASE_H) / rect.height;
        const hit = getRegionUnderPoint(nx, ny);
        if (hit) {
          selectedId = hit;
          renderAll();
        }
      });

      redrawSvg();
      leftBody.appendChild(box);
      if (isFinite) {
        leftBody.appendChild(htmlEl('div', { className: 'formula-banner', style: { marginTop: '8px' } }, [
          htmlEl('strong', {}, '有限阶约束已激活（Wedderburn 定理 + 6.5 结论 p.166 / p.169）'),
          htmlEl('span', {}, '1. 有限整区必为域：整区\\体为空集，整区 = 域。  2. 有限除环必交换：非交换体不存在，体 = 域。'),
        ]));
      }
      leftPanel.appendChild(leftBody);
      split.appendChild(leftPanel);

      // Right Panel: Concept Perspective + Axiom Matrix + Preset Examples
      const data = ALGEBRAIC_DATA[selectedId] || ALGEBRAIC_DATA.domain;
      const rightCol = htmlEl('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });

      const p1 = htmlEl('div', { className: 'panel' });
      p1.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, `概念透视：${data.name}`),
        htmlEl('button', {
          className: 'btn btn-sm btn-primary',
          onClick: () => ctx.navigate(data.lab, data.preset),
        }, data.jumpLabel),
      ]));

      const axiomDefs = [
        ['abelianAdd', '加法交换群 (Abelian +)'],
        ['multAssoc', '乘法结合律 (Assoc ·)'],
        ['multComm', '乘法交换律 (Comm ·)'],
        ['identity', '乘法单位元 (1 ≠ 0)'],
        ['cancellation', '消去律 (无零因子)'],
        ['invertible', '非零元全可逆 (Invertible)'],
      ];

      p1.appendChild(htmlEl('div', { className: 'panel-body' }, [
        htmlEl('div', { className: 'formula-banner info' }, [
          htmlEl('strong', {}, data.formula),
          htmlEl('span', {}, data.desc),
        ]),
        htmlEl('div', { style: { fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', margin: '10px 0 6px' } }, '公理满足矩阵 (AXIOMS)'),
        htmlEl('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' } },
          axiomDefs.map(([k, lbl]) => {
            const ok = !!data.axioms[k];
            return htmlEl('span', {
              className: `chip ${ok ? 'ok' : ''}`,
              style: { justifyContent: 'space-between', borderRadius: '7px', padding: '4px 8px', opacity: ok ? 1 : 0.65 },
            }, [
              htmlEl('span', {}, lbl),
              htmlEl('strong', {}, ok ? '✓' : '✕'),
            ]);
          })
        ),
        htmlEl('div', { style: { fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', margin: '10px 0 6px' } }, '典型实例 (EXAMPLES)'),
        htmlEl('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
          data.examples.map((ex) => htmlEl('div', {
            style: {
              flex: '1 1 130px', padding: '6px 9px', borderRadius: '7px',
              background: 'var(--bg-subtle)', border: '1px solid var(--border-color)',
            },
          }, [
            htmlEl('div', { style: { fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' } }, ex.name),
            htmlEl('div', { style: { fontSize: '11px', color: 'var(--text-muted)' } }, ex.desc),
          ]))
        ),
      ]));
      rightCol.appendChild(p1);

      // Quick Case Locator
      const p2 = htmlEl('div', { className: 'panel' });
      p2.appendChild(htmlEl('div', { className: 'panel-head' }, [
        htmlEl('span', { className: 'panel-title' }, '经典案例快速定位（点击定位到精确 Venn 子区域）'),
      ]));
      p2.appendChild(htmlEl('div', {
        className: 'panel-body',
        style: { maxHeight: '210px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' },
      }, PRESET_EXAMPLES.map((item) => htmlEl('button', {
        className: `btn ${selectedId === item.target ? 'active' : ''}`,
        style: { width: '100%', height: 'auto', padding: '6px 10px', justifyContent: 'space-between', textAlign: 'left' },
        onClick: () => { selectedId = item.target; renderAll(); },
      }, [
        htmlEl('div', { style: { display: 'flex', flexDirection: 'column' } }, [
          htmlEl('strong', { style: { fontSize: '12px' } }, item.name),
          htmlEl('span', { style: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 } }, item.desc),
        ]),
        htmlEl('span', { style: { fontSize: '11px', color: 'var(--accent-blue)' } }, '定位 →'),
      ]))));
      rightCol.appendChild(p2);

      split.appendChild(rightCol);
    }

    renderAll();
  }

  DM2.RingVenn = { mount };
})(window);
