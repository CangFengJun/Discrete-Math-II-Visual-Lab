/* Pure algebraic computation kernel for 《离散数学II》 第六章 群、环、域
 * Works both in browser (attaches to window.DM2.Math) and Node.js (globalThis.DM2.Math / CommonJS).
 */
(function (root) {
  'use strict';

  const DM2 = (root.DM2 = root.DM2 || {});

  // ---------------------------------------------------------------------------
  // 1. Number Theory Helpers
  // ---------------------------------------------------------------------------
  function mod(a, m) {
    return ((a % m) + m) % m;
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }

  function egcd(a, b) {
    let oldR = a, r = b;
    let oldS = 1, s = 0;
    let oldT = 0, t = 1;
    while (r !== 0) {
      const q = Math.trunc(oldR / r);
      [oldR, r] = [r, oldR - q * r];
      [oldS, s] = [s, oldS - q * s];
      [oldT, t] = [t, oldT - q * t];
    }
    if (oldR < 0) {
      oldR = -oldR;
      oldS = -oldS;
      oldT = -oldT;
    }
    return { g: oldR, x: oldS, y: oldT };
  }

  function lcm(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs((a / gcd(a, b)) * b);
  }

  function modInv(a, m) {
    const aMod = mod(a, m);
    if (m <= 1) return null;
    const { g, x } = egcd(aMod, m);
    if (g !== 1) return null;
    return mod(x, m);
  }

  function isPrime(n) {
    if (n < 2 || !Number.isInteger(n)) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let d = 3; d * d <= n; d += 2) {
      if (n % d === 0) return false;
    }
    return true;
  }

  function divisors(n) {
    n = Math.abs(n);
    if (n === 0) return [];
    const small = [];
    const large = [];
    for (let d = 1; d * d <= n; d++) {
      if (n % d === 0) {
        small.push(d);
        if (d * d !== n) large.push(n / d);
      }
    }
    return small.concat(large.reverse());
  }

  function eulerPhi(n) {
    if (n <= 0) return 0;
    let result = n;
    let temp = n;
    for (let p = 2; p * p <= temp; p++) {
      if (temp % p === 0) {
        while (temp % p === 0) temp /= p;
        result -= result / p;
      }
    }
    if (temp > 1) result -= result / temp;
    return Math.round(result);
  }

  // ---------------------------------------------------------------------------
  // 2. Exact Rationals (for R_0[x])
  // ---------------------------------------------------------------------------
  function frac(n, d = 1) {
    if (d === 0) throw new Error('Division by zero in rational');
    if (n === 0) return { n: 0, d: 1 };
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  function fracAdd(a, b) {
    return frac(a.n * b.d + b.n * a.d, a.d * b.d);
  }

  function fracSub(a, b) {
    return frac(a.n * b.d - b.n * a.d, a.d * b.d);
  }

  function fracMul(a, b) {
    return frac(a.n * b.n, a.d * b.d);
  }

  function fracDiv(a, b) {
    if (b.n === 0) throw new Error('Division by zero rational');
    return frac(a.n * b.d, a.d * b.n);
  }

  function fracNeg(a) {
    return { n: -a.n, d: a.d };
  }

  function fracIsZero(a) {
    return a.n === 0;
  }

  function fracEq(a, b) {
    return a.n === b.n && a.d === b.d;
  }

  function fracToString(a) {
    if (a.d === 1) return String(a.n);
    return `${a.n}/${a.d}`;
  }

  function fracToLatex(a) {
    if (a.d === 1) return String(a.n);
    if (a.n < 0) return `-\\frac{${-a.n}}{${a.d}}`;
    return `\\frac{${a.n}}{${a.d}}`;
  }

  // ---------------------------------------------------------------------------
  // 3. Permutations & Symmetric Group S_n (Right-to-Left Composition!)
  //    p is 1-based array: p[i - 1] = sigma(i) for i = 1..n
  // ---------------------------------------------------------------------------
  function permIdentity(n) {
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = i + 1;
    return out;
  }

  // (sigma * tau)(x) = sigma(tau(x)) — PPT right-to-left rule
  function permCompose(sigma, tau) {
    const n = sigma.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      out[i] = sigma[tau[i] - 1];
    }
    return out;
  }

  function permInverse(p) {
    const n = p.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      out[p[i] - 1] = i + 1;
    }
    return out;
  }

  function permEquals(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function permPow(p, k) {
    const n = p.length;
    if (k === 0) return permIdentity(n);
    let base = k < 0 ? permInverse(p) : p.slice();
    let exp = Math.abs(k);
    let res = permIdentity(n);
    while (exp > 0) {
      if (exp & 1) res = permCompose(base, res);
      base = permCompose(base, base);
      exp >>= 1;
    }
    return res;
  }

  function permToDisjointCycles(p, includeFixed = false) {
    const n = p.length;
    const visited = new Array(n).fill(false);
    const cycles = [];
    for (let i = 1; i <= n; i++) {
      if (visited[i - 1]) continue;
      const cyc = [];
      let cur = i;
      while (!visited[cur - 1]) {
        visited[cur - 1] = true;
        cyc.push(cur);
        cur = p[cur - 1];
      }
      if (includeFixed || cyc.length > 1) {
        cycles.push(cyc);
      }
    }
    return cycles;
  }

  function permFromCycles(n, cycles) {
    // Compose right-to-left: product of disjoint/non-disjoint cycles
    let res = permIdentity(n);
    for (let idx = cycles.length - 1; idx >= 0; idx--) {
      const cyc = cycles[idx];
      if (!cyc || cyc.length <= 1) continue;
      const single = permIdentity(n);
      for (let j = 0; j < cyc.length; j++) {
        const a = cyc[j];
        const b = cyc[(j + 1) % cyc.length];
        single[a - 1] = b;
      }
      res = permCompose(single, res);
    }
    return res;
  }

  // PPT formula (3) p.64: (a1 a2 ... ar) = (a1 ar)(a1 a_{r-1})...(a1 a2)
  function permToTranspositions(p) {
    const cycles = permToDisjointCycles(p, false);
    const trans = [];
    for (const cyc of cycles) {
      for (let j = cyc.length - 1; j >= 1; j--) {
        trans.push([cyc[0], cyc[j]]);
      }
    }
    return trans;
  }

  function permInversions(p) {
    const pairs = [];
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        if (p[i] > p[j]) pairs.push([i + 1, j + 1, p[i], p[j]]);
      }
    }
    return { count: pairs.length, pairs };
  }

  function permOrder(p) {
    const cycles = permToDisjointCycles(p, false);
    if (cycles.length === 0) return 1;
    return cycles.reduce((acc, c) => lcm(acc, c.length), 1);
  }

  function permParity(p) {
    const inv = permInversions(p).count;
    const allCycles = permToDisjointCycles(p, true);
    const nMinusK = p.length - allCycles.length;
    return {
      isEven: inv % 2 === 0,
      label: inv % 2 === 0 ? '偶置换' : '奇置换',
      inversions: inv,
      nMinusK,
    };
  }

  function permFormatCycle(p) {
    const cycles = permToDisjointCycles(p, false);
    if (cycles.length === 0) return '(1)';
    return cycles.map((c) => `(${c.join(' ')})`).join('');
  }

  function generateSn(n) {
    const results = [];
    const used = new Array(n + 1).fill(false);
    const cur = [];
    function backtrack() {
      if (cur.length === n) {
        results.push(cur.slice());
        return;
      }
      for (let v = 1; v <= n; v++) {
        if (!used[v]) {
          used[v] = true;
          cur.push(v);
          backtrack();
          cur.pop();
          used[v] = false;
        }
      }
    }
    backtrack();
    // Put identity first, then sort by cycle order & lexicographically
    results.sort((a, b) => {
      const oa = permOrder(a), ob = permOrder(b);
      if (oa !== ob) return oa - ob;
      const ca = permToDisjointCycles(a, false).length;
      const cb = permToDisjointCycles(b, false).length;
      if (ca !== cb) return ca - cb;
      for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i] - b[i];
      return 0;
    });
    return results;
  }

  // ---------------------------------------------------------------------------
  // 4. Finite Group Factory, Subgroups, Cosets (PPT convention!) & Quotient
  // ---------------------------------------------------------------------------
  function buildGroupFromTable(spec) {
    const n = spec.labels.length;
    const mul = spec.mul;
    const identityIdx = spec.identityIdx !== undefined ? spec.identityIdx : 0;
    const invArr = new Array(n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (mul(i, j) === identityIdx && mul(j, i) === identityIdx) {
          invArr[i] = j;
          break;
        }
      }
    }
    let isAbelian = true;
    for (let i = 0; i < n && isAbelian; i++) {
      for (let j = i + 1; j < n; j++) {
        if (mul(i, j) !== mul(j, i)) {
          isAbelian = false;
          break;
        }
      }
    }
    function elementOrder(i) {
      let cur = i;
      let k = 1;
      while (cur !== identityIdx && k <= n) {
        cur = mul(cur, i);
        k++;
      }
      return k;
    }
    return {
      id: spec.id,
      name: spec.name,
      opSymbol: spec.opSymbol || '·',
      isAdditive: !!spec.isAdditive,
      isAbelian,
      order: n,
      labels: spec.labels,
      latexLabels: spec.latexLabels || spec.labels,
      identityIdx,
      mul,
      inv: (i) => invArr[i],
      elementOrder,
    };
  }

  function createZnAddGroup(n) {
    const labels = Array.from({ length: n }, (_, i) => String(i));
    return buildGroupFromTable({
      id: `Z${n}`,
      name: `(Z_${n}, +)`,
      opSymbol: '+',
      isAdditive: true,
      labels,
      identityIdx: 0,
      mul: (a, b) => (a + b) % n,
    });
  }

  function createZpMulGroup(p) {
    const elems = [];
    for (let i = 1; i < p; i++) elems.push(i);
    return buildGroupFromTable({
      id: `Z${p}_mul`,
      name: `(Z_${p}^*, ·)`,
      opSymbol: '·',
      isAdditive: false,
      labels: elems.map(String),
      identityIdx: 0,
      mul: (i, j) => {
        const val = (elems[i] * elems[j]) % p;
        return elems.indexOf(val);
      },
    });
  }

  function createV4Group() {
    // Elements: 1, a, b, c with a^2=b^2=c^2=1, ab=c
    const table = [
      [0, 1, 2, 3],
      [1, 0, 3, 2],
      [2, 3, 0, 1],
      [3, 2, 1, 0],
    ];
    return buildGroupFromTable({
      id: 'V4',
      name: 'Klein 四元群 V₄',
      opSymbol: '·',
      labels: ['1', 'a', 'b', 'c'],
      identityIdx: 0,
      mul: (i, j) => table[i][j],
    });
  }

  function createSnGroup(n) {
    const perms = generateSn(n);
    const labels = perms.map((p) => (permOrder(p) === 1 ? '1' : permFormatCycle(p)));
    const keyMap = new Map(perms.map((p, idx) => [p.join(','), idx]));
    return buildGroupFromTable({
      id: `S${n}`,
      name: `${n} 次对称群 S_${n}`,
      opSymbol: '·',
      labels,
      identityIdx: 0,
      mul: (i, j) => {
        const comp = permCompose(perms[i], perms[j]);
        return keyMap.get(comp.join(','));
      },
      perms,
    });
  }

  function createD4Group() {
    // D4 as permutations of square vertices 1,2,3,4
    // r = (1 2 3 4), s = (2 4) reflection across diagonal 1-3
    const r = [2, 3, 4, 1];
    const s = [1, 4, 3, 2];
    const r0 = [1, 2, 3, 4];
    const r2 = permCompose(r, r);
    const r3 = permCompose(r2, r);
    const sr = permCompose(s, r);
    const sr2 = permCompose(s, r2);
    const sr3 = permCompose(s, r3);
    const elems = [r0, r, r2, r3, s, sr, sr2, sr3];
    const labels = ['1', 'r', 'r²', 'r³', 's', 'sr', 'sr²', 'sr³'];
    const latexLabels = ['1', 'r', 'r^2', 'r^3', 's', 'sr', 'sr^2', 'sr^3'];
    const keyMap = new Map(elems.map((p, idx) => [p.join(','), idx]));
    return buildGroupFromTable({
      id: 'D4',
      name: '二面体群 D₄',
      opSymbol: '·',
      labels,
      latexLabels,
      identityIdx: 0,
      mul: (i, j) => keyMap.get(permCompose(elems[i], elems[j]).join(',')),
    });
  }

  function analyzeSubset(G, subsetIndices) {
    const set = new Set(subsetIndices);
    const arr = Array.from(set).sort((a, b) => a - b);
    const nonEmpty = arr.length > 0;
    let closed = true;
    const closureWitness = [];
    for (const a of arr) {
      for (const b of arr) {
        const prod = G.mul(a, b);
        if (!set.has(prod)) {
          closed = false;
          if (closureWitness.length < 3) closureWitness.push([a, b, prod]);
        }
      }
    }
    const hasIdentity = set.has(G.identityIdx);
    let closedInverse = true;
    const invWitness = [];
    for (const a of arr) {
      const invA = G.inv(a);
      if (!set.has(invA)) {
        closedInverse = false;
        if (invWitness.length < 3) invWitness.push([a, invA]);
      }
    }
    let abInvClosed = true;
    for (const a of arr) {
      for (const b of arr) {
        if (!set.has(G.mul(a, G.inv(b)))) {
          abInvClosed = false;
          break;
        }
      }
      if (!abInvClosed) break;
    }
    const isSubgroup = nonEmpty && closed && closedInverse;
    return {
      elements: arr,
      nonEmpty,
      closed,
      hasIdentity,
      closedInverse,
      abInvClosed,
      isSubgroup,
      closureWitness,
      invWitness,
    };
  }

  function generateClosure(G, seedIndices) {
    const set = new Set([G.identityIdx]);
    for (const s of seedIndices) set.add(s);
    let changed = true;
    while (changed) {
      changed = false;
      const cur = Array.from(set);
      for (const a of cur) {
        for (const b of cur) {
          const p = G.mul(a, b);
          if (!set.has(p)) {
            set.add(p);
            changed = true;
          }
        }
      }
    }
    return Array.from(set).sort((a, b) => a - b);
  }

  // PPT convention:
  // 右陪集 (Right Coset) = aH = { a · h | h ∈ H } ("以 H 的元素右乘 a")
  // 左陪集 (Left Coset)  = Ha = { h · a | h ∈ H }
  function analyzeCosets(G, HIndices) {
    const H = HIndices.slice().sort((a, b) => a - b);
    const hKey = (arr) => arr.slice().sort((a, b) => a - b).join(',');

    const rightCosets = [];
    const seenRight = new Set();
    for (let g = 0; g < G.order; g++) {
      if (seenRight.has(g)) continue;
      const elems = Array.from(new Set(H.map((h) => G.mul(g, h)))).sort((a, b) => a - b);
      for (const x of elems) seenRight.add(x);
      rightCosets.push({
        rep: g,
        repLabel: G.labels[g],
        notation: G.isAdditive ? `${G.labels[g]} + H` : `${g === G.identityIdx ? '' : G.labels[g]}H`,
        elements: elems,
      });
    }

    const leftCosets = [];
    const seenLeft = new Set();
    for (let g = 0; g < G.order; g++) {
      if (seenLeft.has(g)) continue;
      const elems = Array.from(new Set(H.map((h) => G.mul(h, g)))).sort((a, b) => a - b);
      for (const x of elems) seenLeft.add(x);
      leftCosets.push({
        rep: g,
        repLabel: G.labels[g],
        notation: G.isAdditive ? `H + ${G.labels[g]}` : `H${g === G.identityIdx ? '' : G.labels[g]}`,
        elements: elems,
      });
    }

    const conjugations = [];
    let isNormal = true;
    for (let g = 0; g < G.order; g++) {
      const aH = Array.from(new Set(H.map((h) => G.mul(g, h)))).sort((a, b) => a - b);
      const Ha = Array.from(new Set(H.map((h) => G.mul(h, g)))).sort((a, b) => a - b);
      const gInv = G.inv(g);
      const gHgInv = Array.from(new Set(H.map((h) => G.mul(G.mul(g, h), gInv)))).sort((a, b) => a - b);
      const eq = hKey(aH) === hKey(Ha);
      if (!eq) isNormal = false;
      conjugations.push({ g, gLabel: G.labels[g], aH, Ha, gHgInv, equal: eq });
    }

    return {
      H,
      index: rightCosets.length,
      rightCosets,
      leftCosets,
      rightReps: rightCosets.map((c) => c.rep),
      isNormal,
      conjugations,
    };
  }

  function enumerateSubgroups(G) {
    const byKey = new Map();
    const queue = [];

    const idOnly = [G.identityIdx];
    byKey.set(idOnly.join(','), idOnly);
    queue.push(idOnly);

    // Seed with cyclic subgroups first
    for (let i = 0; i < G.order; i++) {
      const cyc = generateClosure(G, [i]);
      const k = cyc.join(',');
      if (!byKey.has(k)) {
        byKey.set(k, cyc);
        queue.push(cyc);
      }
    }

    // Close under pairwise join ⟨H1, H2⟩
    let idx = 0;
    while (idx < queue.length) {
      const cur = queue[idx++];
      const snap = Array.from(byKey.values());
      for (const other of snap) {
        const joined = generateClosure(G, cur.concat(other));
        const k = joined.join(',');
        if (!byKey.has(k)) {
          byKey.set(k, joined);
          queue.push(joined);
        }
      }
    }

    const list = Array.from(byKey.values()).map((elems) => {
      const cosetInfo = analyzeCosets(G, elems);
      return {
        key: elems.join(','),
        elements: elems,
        order: elems.length,
        index: G.order / elems.length,
        isNormal: cosetInfo.isNormal,
        isTrivial: elems.length === 1 || elems.length === G.order,
        label: elems.length === 1
          ? `{${G.labels[G.identityIdx]}}`
          : elems.length === G.order
            ? G.id
            : `{${elems.map((e) => G.labels[e]).join(', ')}}`,
      };
    });

    list.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
    list.forEach((sg, i) => { sg.idx = i; });

    // Build Hasse diagram cover edges
    const isSubset = (A, B) => {
      const setB = new Set(B);
      return A.every((x) => setB.has(x));
    };
    const edges = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (list[j].order % list[i].order !== 0) continue;
        if (!isSubset(list[i].elements, list[j].elements)) continue;
        let hasMid = false;
        for (let k = i + 1; k < j; k++) {
          if (
            isSubset(list[i].elements, list[k].elements) &&
            isSubset(list[k].elements, list[j].elements)
          ) {
            hasMid = true;
            break;
          }
        }
        if (!hasMid) edges.push([i, j]);
      }
    }

    return { subgroups: list, edges };
  }

  function buildQuotientGroup(G, NIndices) {
    const info = analyzeCosets(G, NIndices);
    if (!info.isNormal) return null;
    const cosets = info.rightCosets;
    const elemToCoset = new Array(G.order);
    cosets.forEach((c, ci) => {
      for (const e of c.elements) elemToCoset[e] = ci;
    });
    // Verify well-definedness across ALL representative pairs
    let wellDefined = true;
    for (let ci = 0; ci < cosets.length && wellDefined; ci++) {
      for (let cj = 0; cj < cosets.length && wellDefined; cj++) {
        let target = -1;
        for (const a of cosets[ci].elements) {
          for (const b of cosets[cj].elements) {
            const cProd = elemToCoset[G.mul(a, b)];
            if (target === -1) target = cProd;
            else if (target !== cProd) wellDefined = false;
          }
        }
      }
    }
    const labels = cosets.map((c) => c.notation);
    const quotient = buildGroupFromTable({
      id: `${G.id}/N`,
      name: `商群 ${G.id}/N`,
      opSymbol: G.opSymbol,
      isAdditive: G.isAdditive,
      labels,
      identityIdx: elemToCoset[G.identityIdx],
      mul: (ci, cj) => elemToCoset[G.mul(cosets[ci].rep, cosets[cj].rep)],
    });
    return { quotient, cosets, elemToCoset, wellDefined };
  }

  // ---------------------------------------------------------------------------
  // 5. Descending Polynomials over R_0 (exact Frac) and R_p (mod p)
  //    Representation: [a_0, a_1, ..., a_n] = a_0 x^n + a_1 x^{n-1} + ... + a_n
  //    Zero polynomial: [] (degree -Infinity)
  // ---------------------------------------------------------------------------
  function polyDeg(p) {
    return p.length === 0 ? -Infinity : p.length - 1;
  }

  // --- Over R_0 (rational coefficients) ---
  function polyFromIntR0(arr) {
    return polyNormR0(arr.map((x) => (typeof x === 'number' ? frac(x, 1) : x)));
  }

  function polyNormR0(p) {
    let i = 0;
    while (i < p.length && fracIsZero(p[i])) i++;
    return p.slice(i);
  }

  function polyAddR0(a, b) {
    const len = Math.max(a.length, b.length);
    const out = new Array(len);
    for (let i = 0; i < len; i++) {
      const ca = i >= len - a.length ? a[i - (len - a.length)] : frac(0, 1);
      const cb = i >= len - b.length ? b[i - (len - b.length)] : frac(0, 1);
      out[i] = fracAdd(ca, cb);
    }
    return polyNormR0(out);
  }

  function polySubR0(a, b) {
    const len = Math.max(a.length, b.length);
    const out = new Array(len);
    for (let i = 0; i < len; i++) {
      const ca = i >= len - a.length ? a[i - (len - a.length)] : frac(0, 1);
      const cb = i >= len - b.length ? b[i - (len - b.length)] : frac(0, 1);
      out[i] = fracSub(ca, cb);
    }
    return polyNormR0(out);
  }

  function polyMulR0(a, b) {
    if (a.length === 0 || b.length === 0) return [];
    const out = Array.from({ length: a.length + b.length - 1 }, () => frac(0, 1));
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        out[i + j] = fracAdd(out[i + j], fracMul(a[i], b[j]));
      }
    }
    return polyNormR0(out);
  }

  function polyDivModR0(f, g) {
    f = polyNormR0(f);
    g = polyNormR0(g);
    if (g.length === 0) throw new Error('Polynomial division by zero');
    if (f.length < g.length) return { q: [], r: f, steps: [] };

    let rem = f.slice();
    const qDeg = f.length - g.length;
    const q = Array.from({ length: qDeg + 1 }, () => frac(0, 1));
    const steps = [];

    while (rem.length >= g.length && rem.length > 0) {
      const degDiff = rem.length - g.length;
      const coeff = fracDiv(rem[0], g[0]);
      q[qDeg - degDiff] = coeff;
      const term = [coeff].concat(Array.from({ length: degDiff }, () => frac(0, 1)));
      const subPoly = polyMulR0(term, g);
      const nextRem = polySubR0(rem, subPoly);
      steps.push({
        remBefore: rem.slice(),
        qTermDeg: degDiff,
        qTermCoeff: coeff,
        subPoly,
        remAfter: nextRem.slice(),
      });
      rem = nextRem;
    }
    return { q: polyNormR0(q), r: polyNormR0(rem), steps };
  }

  function polyMakeMonicR0(p) {
    p = polyNormR0(p);
    if (p.length === 0) return [];
    const lc = p[0];
    return p.map((c) => fracDiv(c, lc));
  }

  function polyGcdExtR0(f, g) {
    f = polyNormR0(f);
    g = polyNormR0(g);
    let r0 = f, r1 = g;
    let s0 = [frac(1, 1)], s1 = [];
    let t0 = [], t1 = [frac(1, 1)];
    const steps = [];

    while (r1.length > 0) {
      const { q, r } = polyDivModR0(r0, r1);
      steps.push({ dividend: r0, divisor: r1, q, r });
      const s2 = polySubR0(s0, polyMulR0(q, s1));
      const t2 = polySubR0(t0, polyMulR0(q, t1));
      r0 = r1; r1 = r;
      s0 = s1; s1 = s2;
      t0 = t1; t1 = t2;
    }

    if (r0.length === 0) {
      return { d: [], lambda: [], mu: [], steps };
    }
    const lc = r0[0];
    return {
      d: r0.map((c) => fracDiv(c, lc)),
      lambda: s0.map((c) => fracDiv(c, lc)),
      mu: t0.map((c) => fracDiv(c, lc)),
      steps,
    };
  }

  function polyDerivR0(f) {
    f = polyNormR0(f);
    if (f.length <= 1) return [];
    const deg = f.length - 1;
    const out = [];
    for (let i = 0; i < deg; i++) {
      out.push(fracMul(f[i], frac(deg - i, 1)));
    }
    return polyNormR0(out);
  }

  function polyEvalR0(f, x) {
    let acc = frac(0, 1);
    for (const c of f) {
      acc = fracAdd(fracMul(acc, x), c);
    }
    return acc;
  }

  // Exact cyclotomic polynomial Phi_n(x) using x^n - 1 = prod_{d|n} Phi_d(x)
  const _cycloCache = new Map();
  function cyclotomicPoly(n) {
    if (_cycloCache.has(n)) return _cycloCache.get(n).slice();
    // x^n - 1 in descending order
    const xnMinus1 = Array.from({ length: n + 1 }, (_, i) =>
      i === 0 ? frac(1, 1) : i === n ? frac(-1, 1) : frac(0, 1)
    );
    let denom = [frac(1, 1)];
    for (const d of divisors(n)) {
      if (d < n) {
        denom = polyMulR0(denom, polyFromIntR0(cyclotomicPoly(d)));
      }
    }
    const { q, r } = polyDivModR0(xnMinus1, denom);
    if (r.length !== 0) {
      throw new Error(`Cyclotomic division remainder non-zero for n=${n}`);
    }
    const ints = q.map((c) => {
      if (c.d !== 1) throw new Error(`Non-integer coefficient in Phi_${n}`);
      return c.n;
    });
    _cycloCache.set(n, ints);
    return ints.slice();
  }

  // --- Over R_p (prime p) ---
  function polyNormFp(pArr, p) {
    const norm = pArr.map((c) => mod(c, p));
    let i = 0;
    while (i < norm.length && norm[i] === 0) i++;
    return norm.slice(i);
  }

  function polyAddFp(a, b, p) {
    const len = Math.max(a.length, b.length);
    const out = new Array(len);
    for (let i = 0; i < len; i++) {
      const ca = i >= len - a.length ? a[i - (len - a.length)] : 0;
      const cb = i >= len - b.length ? b[i - (len - b.length)] : 0;
      out[i] = mod(ca + cb, p);
    }
    return polyNormFp(out, p);
  }

  function polySubFp(a, b, p) {
    const len = Math.max(a.length, b.length);
    const out = new Array(len);
    for (let i = 0; i < len; i++) {
      const ca = i >= len - a.length ? a[i - (len - a.length)] : 0;
      const cb = i >= len - b.length ? b[i - (len - b.length)] : 0;
      out[i] = mod(ca - cb, p);
    }
    return polyNormFp(out, p);
  }

  function polyMulFp(a, b, p) {
    a = polyNormFp(a, p);
    b = polyNormFp(b, p);
    if (a.length === 0 || b.length === 0) return [];
    const out = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        out[i + j] = mod(out[i + j] + a[i] * b[j], p);
      }
    }
    return polyNormFp(out, p);
  }

  function polyDivModFp(f, g, p) {
    f = polyNormFp(f, p);
    g = polyNormFp(g, p);
    if (g.length === 0) throw new Error('Polynomial division by zero in Fp');
    if (f.length < g.length) return { q: [], r: f, steps: [] };

    let rem = f.slice();
    const qDeg = f.length - g.length;
    const q = new Array(qDeg + 1).fill(0);
    const invLc = modInv(g[0], p);
    const steps = [];

    while (rem.length >= g.length && rem.length > 0) {
      const degDiff = rem.length - g.length;
      const coeff = mod(rem[0] * invLc, p);
      q[qDeg - degDiff] = coeff;
      const term = [coeff].concat(new Array(degDiff).fill(0));
      const subPoly = polyMulFp(term, g, p);
      const nextRem = polySubFp(rem, subPoly, p);
      steps.push({
        remBefore: rem.slice(),
        qTermDeg: degDiff,
        qTermCoeff: coeff,
        subPoly,
        remAfter: nextRem.slice(),
      });
      rem = nextRem;
    }
    return { q: polyNormFp(q, p), r: polyNormFp(rem, p), steps };
  }

  function polyMakeMonicFp(f, p) {
    f = polyNormFp(f, p);
    if (f.length === 0) return [];
    const inv = modInv(f[0], p);
    return f.map((c) => mod(c * inv, p));
  }

  function polyGcdExtFp(f, g, p) {
    let r0 = polyNormFp(f, p), r1 = polyNormFp(g, p);
    let s0 = [1], s1 = [];
    let t0 = [], t1 = [1];
    const steps = [];
    while (r1.length > 0) {
      const { q, r } = polyDivModFp(r0, r1, p);
      steps.push({ dividend: r0, divisor: r1, q, r });
      const s2 = polySubFp(s0, polyMulFp(q, s1, p), p);
      const t2 = polySubFp(t0, polyMulFp(q, t1, p), p);
      r0 = r1; r1 = r;
      s0 = s1; s1 = s2;
      t0 = t1; t1 = t2;
    }
    if (r0.length === 0) return { d: [], lambda: [], mu: [], steps };
    const inv = modInv(r0[0], p);
    return {
      d: r0.map((c) => mod(c * inv, p)),
      lambda: polyNormFp(s0.map((c) => mod(c * inv, p)), p),
      mu: polyNormFp(t0.map((c) => mod(c * inv, p)), p),
      steps,
    };
  }

  function polyDerivFp(f, p) {
    f = polyNormFp(f, p);
    if (f.length <= 1) return [];
    const deg = f.length - 1;
    const out = [];
    for (let i = 0; i < deg; i++) {
      out.push(mod(f[i] * (deg - i), p));
    }
    return polyNormFp(out, p);
  }

  function polyEvalFp(f, x, p) {
    let acc = 0;
    for (const c of f) acc = mod(acc * x + c, p);
    return acc;
  }

  function polyEqFp(a, b, p) {
    a = polyNormFp(a, p);
    b = polyNormFp(b, p);
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  // Monic polynomials of exact degree d over R_p
  function allMonicPolysDegFp(d, p) {
    if (d === 0) return [[1]];
    const total = Math.pow(p, d);
    const out = [];
    for (let idx = 0; idx < total; idx++) {
      const arr = new Array(d + 1);
      arr[0] = 1;
      let v = idx;
      for (let k = d; k >= 1; k--) {
        arr[k] = v % p;
        v = Math.floor(v / p);
      }
      out.push(arr);
    }
    return out;
  }

  function polyPowModFp(base, exp, modPoly, p) {
    let res = [1];
    let b = polyDivModFp(base, modPoly, p).r;
    let e = exp;
    while (e > 0) {
      if (e % 2 === 1) res = polyDivModFp(polyMulFp(res, b, p), modPoly, p).r;
      b = polyDivModFp(polyMulFp(b, b, p), modPoly, p).r;
      e = Math.floor(e / 2);
    }
    return res;
  }

  // Rabin irreducibility test over R_p (supports arbitrary degree fast)
  function polyIsIrreducibleFp(f, p) {
    f = polyNormFp(f, p);
    const n = polyDeg(f);
    if (n <= 0) return false;
    if (n === 1) return true;
    f = polyMakeMonicFp(f, p);

    // Distinct prime factors of n
    const primes = [];
    let tmp = n;
    for (let d = 2; d * d <= tmp; d++) {
      if (tmp % d === 0) {
        primes.push(d);
        while (tmp % d === 0) tmp /= d;
      }
    }
    if (tmp > 1) primes.push(tmp);

    // Check gcd(f, x^{p^{n/q}} - x) === 1
    for (const q of primes) {
      const exp = Math.pow(p, n / q);
      const xPow = polyPowModFp([1, 0], exp, f, p);
      const diff = polySubFp(xPow, [1, 0], p);
      const { d } = polyGcdExtFp(f, diff, p);
      if (polyDeg(d) > 0) return false;
    }
    // Check x^{p^n} - x === 0 (mod f)
    const xPn = polyPowModFp([1, 0], Math.pow(p, n), f, p);
    return polyEqFp(xPn, [1, 0], p);
  }

  // Exact factorization over R_p for practical degrees (<= 16)
  function polyFactorFp(f, p) {
    f = polyNormFp(f, p);
    if (f.length === 0) return { lead: 0, factors: [] };
    if (f.length === 1) return { lead: f[0], factors: [] };

    const lead = f[0];
    let rem = polyMakeMonicFp(f, p);
    const factors = [];

    for (let d = 1; d <= Math.floor(polyDeg(rem) / 2); d++) {
      // Distinct-degree guard: rem has a degree-d irreducible factor iff gcd(rem, x^{p^d} - x) != 1
      const xPd = polyPowModFp([1, 0], Math.pow(p, d), rem, p);
      const ddfGcd = polyGcdExtFp(rem, polySubFp(xPd, [1, 0], p), p).d;
      if (polyDeg(ddfGcd) === 0) continue;
      const candidates = allMonicPolysDegFp(d, p);
      for (const cand of candidates) {
        if (polyDeg(rem) < 2 * d) break;
        if (!polyIsIrreducibleFp(cand, p)) continue;
        while (polyDeg(rem) >= d) {
          const { q, r } = polyDivModFp(rem, cand, p);
          if (r.length === 0) {
            factors.push(cand);
            rem = q;
          } else {
            break;
          }
        }
      }
    }
    if (polyDeg(rem) >= 1) {
      factors.push(polyMakeMonicFp(rem, p));
    }
    // Group identical factors with multiplicities
    const grouped = [];
    for (const fac of factors) {
      const key = fac.join(',');
      const found = grouped.find((g) => g.poly.join(',') === key);
      if (found) found.mult++;
      else grouped.push({ poly: fac, mult: 1 });
    }
    return { lead, factors: grouped };
  }

  function eisensteinCheck(intCoeffs, p) {
    // intCoeffs descending: [a_0, a_1, ..., a_n]
    if (!isPrime(p) || intCoeffs.length < 2) {
      return { applicable: false, reasons: ['需要质数 p 且多项式次数 ≥ 1'] };
    }
    const a0 = intCoeffs[0];
    const an = intCoeffs[intCoeffs.length - 1];
    const condLead = a0 % p !== 0;
    const midChecks = intCoeffs.slice(1).map((c, idx) => ({
      coeff: c,
      deg: intCoeffs.length - 2 - idx,
      divisible: c % p === 0,
    }));
    const condAllTail = midChecks.every((m) => m.divisible);
    const condSquare = an % (p * p) !== 0;
    return {
      applicable: condLead && condAllTail && condSquare,
      p,
      condLead,
      condAllTail,
      condSquare,
      midChecks,
    };
  }

  function rationalRootsCheck(intCoeffs) {
    const a0 = Math.abs(intCoeffs[0]);
    const an = Math.abs(intCoeffs[intCoeffs.length - 1]);
    const fR0 = polyFromIntR0(intCoeffs);
    if (a0 === 0) return { candidates: [], roots: [] };
    if (an === 0) {
      // x = 0 is a root
      return { candidates: [frac(0, 1)], roots: [frac(0, 1)] };
    }
    const bList = divisors(an);
    const cList = divisors(a0);
    const seen = new Set();
    const candidates = [];
    const roots = [];
    for (const b of bList) {
      for (const c of cList) {
        if (gcd(b, c) !== 1) continue;
        for (const sign of [1, -1]) {
          const cand = frac(sign * b, c);
          const key = `${cand.n}/${cand.d}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const val = polyEvalR0(fR0, cand);
          const isRoot = fracIsZero(val);
          candidates.push({ cand, isRoot });
          if (isRoot) roots.push(cand);
        }
      }
    }
    return { candidates, roots };
  }

  // ---------------------------------------------------------------------------
  // 6. Polynomial Formatting Helpers (Strict Descending Order!)
  // ---------------------------------------------------------------------------
  function polyToLatex(coeffs, varName = 'x', isFrac = false) {
    if (!coeffs || coeffs.length === 0) return '0';
    const deg = coeffs.length - 1;
    const terms = [];
    for (let i = 0; i <= deg; i++) {
      const power = deg - i;
      const c = coeffs[i];
      if (isFrac) {
        if (fracIsZero(c)) continue;
        const isNeg = c.n < 0;
        const absFrac = frac(Math.abs(c.n), c.d);
        const isOne = absFrac.n === 1 && absFrac.d === 1;
        let coefStr = '';
        if (power === 0 || !isOne) coefStr = fracToLatex(absFrac);
        const varStr = power === 0 ? '' : power === 1 ? varName : `${varName}^{${power}}`;
        const body = coefStr + varStr;
        if (terms.length === 0) terms.push(isNeg ? `-${body}` : body);
        else terms.push(isNeg ? ` - ${body}` : ` + ${body}`);
      } else {
        if (c === 0) continue;
        const isNeg = c < 0;
        const absC = Math.abs(c);
        let coefStr = '';
        if (power === 0 || absC !== 1) coefStr = String(absC);
        const varStr = power === 0 ? '' : power === 1 ? varName : `${varName}^{${power}}`;
        const body = coefStr + varStr;
        if (terms.length === 0) terms.push(isNeg ? `-${body}` : body);
        else terms.push(isNeg ? ` - ${body}` : ` + ${body}`);
      }
    }
    return terms.length ? terms.join('') : '0';
  }

  // Format GF(p^n) element ascending in xi: a_0 + a_1 xi + ... + a_{n-1} xi^{n-1} (PPT Lemma p.11)
  function gfElementToLatex(vec, varName = '\\xi') {
    const terms = [];
    for (let i = 0; i < vec.length; i++) {
      const c = vec[i];
      if (c === 0) continue;
      if (i === 0) terms.push(String(c));
      else if (i === 1) terms.push(c === 1 ? varName : `${c}${varName}`);
      else terms.push(c === 1 ? `${varName}^{${i}}` : `${c}${varName}^{${i}}`);
    }
    return terms.length ? terms.join(' + ') : '0';
  }

  function gfElementToPlain(vec) {
    const terms = [];
    for (let i = 0; i < vec.length; i++) {
      const c = vec[i];
      if (c === 0) continue;
      if (i === 0) terms.push(String(c));
      else if (i === 1) terms.push(c === 1 ? 'ξ' : `${c}ξ`);
      else terms.push(c === 1 ? `ξ^${i}` : `${c}ξ^${i}`);
    }
    return terms.length ? terms.join('+') : '0';
  }

  // ---------------------------------------------------------------------------
  // 7. Finite Field GF(p^n) Engine via R_p[x] / (psi(x) R_p[x])
  // ---------------------------------------------------------------------------
  function getPrimitivePolynomials(p, n) {
    const q = Math.pow(p, n);
    if (n === 1) return [[1, 0]]; // deg 1 placeholder
    const phiQMinus1 = cyclotomicPoly(q - 1).map((c) => mod(c, p));
    const fac = polyFactorFp(phiQMinus1, p);
    return fac.factors
      .map((f) => f.poly)
      .filter((poly) => polyDeg(poly) === n);
  }

  function buildGF(p, n, psiOverride = null) {
    const q = Math.pow(p, n);
    let psi = psiOverride ? polyMakeMonicFp(psiOverride, p) : null;
    let phiFactors = [];

    if (n === 1) {
      // Prime field R_p directly (all elements 0..p-1)
      const elements = [];
      for (let i = 0; i < p; i++) {
        elements.push({
          idx: i,
          vec: [i],
          descPoly: i === 0 ? [] : [i],
          plain: String(i),
          latex: String(i),
          addOrder: i === 0 ? 1 : p,
          mulOrder: 0,
          powerExp: null,
        });
      }
      const addTable = Array.from({ length: p }, (_, i) =>
        Array.from({ length: p }, (_, j) => (i + j) % p)
      );
      const mulTable = Array.from({ length: p }, (_, i) =>
        Array.from({ length: p }, (_, j) => (i * j) % p)
      );
      // Find primitive root mod p
      let genIdx = 1;
      for (let g = 1; g < p; g++) {
        let cur = 1, ord = 0;
        do {
          cur = (cur * g) % p;
          ord++;
        } while (cur !== 1 && ord <= p);
        if (ord === p - 1) {
          genIdx = g;
          break;
        }
      }
      const powerRing = [];
      let cur = 1;
      for (let k = 0; k < p - 1; k++) {
        elements[cur].powerExp = k;
        powerRing.push({ exp: k, idx: cur });
        cur = (cur * genIdx) % p;
      }
      for (let i = 1; i < p; i++) {
        let x = i, ord = 1;
        while (x !== 1) { x = (x * i) % p; ord++; }
        elements[i].mulOrder = ord;
      }
      return {
        p, n, q,
        psi: [1, 0],
        phiFactors: [],
        generatorIdx: genIdx,
        xiIdx: genIdx,
        xiIsPrimitive: true,
        elements,
        addTable,
        mulTable,
        powerRing,
        subfields: [{ m: 1, size: p, elemIndices: Array.from({ length: p }, (_, i) => i) }],
      };
    }

    phiFactors = getPrimitivePolynomials(p, n);
    if (!psi) {
      psi = phiFactors[0];
    }
    if (!polyIsIrreducibleFp(psi, p)) {
      throw new Error(`Polynomial is not irreducible over R_${p}`);
    }

    // Enumerate q elements via ascending coefficient vector [a_0, a_1, ..., a_{n-1}]
    // corresponding to descending polynomial [a_{n-1}, ..., a_1, a_0]
    const elements = [];
    const vecToIdx = new Map();
    for (let idx = 0; idx < q; idx++) {
      const vec = new Array(n);
      let tmp = idx;
      for (let k = 0; k < n; k++) {
        vec[k] = tmp % p;
        tmp = Math.floor(tmp / p);
      }
      const descPoly = polyNormFp(vec.slice().reverse(), p);
      const key = vec.join(',');
      vecToIdx.set(key, idx);
      elements.push({
        idx,
        vec,
        descPoly,
        plain: gfElementToPlain(vec),
        latex: gfElementToLatex(vec, '\\xi'),
        addOrder: idx === 0 ? 1 : p,
        mulOrder: 0,
        powerExp: null,
      });
    }

    function descPolyToIdx(desc) {
      const rem = polyDivModFp(desc, psi, p).r;
      const vec = new Array(n).fill(0);
      for (let i = 0; i < rem.length; i++) {
        const power = rem.length - 1 - i;
        vec[power] = rem[i];
      }
      return vecToIdx.get(vec.join(','));
    }

    const addTable = Array.from({ length: q }, (_, i) =>
      Array.from({ length: q }, (_, j) => {
        const vec = elements[i].vec.map((v, k) => (v + elements[j].vec[k]) % p);
        return vecToIdx.get(vec.join(','));
      })
    );

    const mulTable = Array.from({ length: q }, (_, i) =>
      Array.from({ length: q }, (_, j) => {
        const prod = polyMulFp(elements[i].descPoly, elements[j].descPoly, p);
        return descPolyToIdx(prod);
      })
    );

    // Compute multiplicative orders of all non-zero elements
    for (let i = 1; i < q; i++) {
      let cur = i;
      let ord = 1;
      while (cur !== 1 && ord <= q) {
        cur = mulTable[cur][i];
        ord++;
      }
      elements[i].mulOrder = ord;
    }

    // xi = bar{x} = vec [0, 1, 0, ...] (idx === p)
    const xiIdx = p;
    const xiIsPrimitive = elements[xiIdx].mulOrder === q - 1;
    let generatorIdx = xiIsPrimitive ? xiIdx : -1;
    if (generatorIdx === -1) {
      for (let i = 1; i < q; i++) {
        if (elements[i].mulOrder === q - 1) {
          generatorIdx = i;
          break;
        }
      }
    }

    const powerRing = [];
    let cur = 1;
    for (let k = 0; k < q - 1; k++) {
      elements[cur].powerExp = k;
      powerRing.push({ exp: k, idx: cur });
      cur = mulTable[cur][generatorIdx];
    }

    // Compute all subfields GF(p^m) for m | n using x^{p^m} - x = 0 root characterization
    const subfields = divisors(n).map((m) => {
      const targetSize = Math.pow(p, m);
      const elemIndices = [0];
      for (let i = 1; i < q; i++) {
        // Check a^{p^m} === a in GF(p^n), i.e., a^{p^m - 1} === 1, i.e., mulOrder | (p^m - 1)
        if ((targetSize - 1) % elements[i].mulOrder === 0) {
          elemIndices.push(i);
        }
      }
      return {
        m,
        size: targetSize,
        elemIndices,
      };
    });

    // Reduction rule: xi^n = -(psi[1]*xi^{n-1} + ... + psi[n]) mod p
    const xiNReductionVec = psi.slice(1).reverse().map((c) => mod(-c, p));

    return {
      p,
      n,
      q,
      psi,
      phiFactors,
      xiNReductionVec,
      xiNReductionLatex: gfElementToLatex(xiNReductionVec, '\\xi'),
      generatorIdx,
      xiIdx,
      xiIsPrimitive,
      elements,
      addTable,
      mulTable,
      powerRing,
      subfields,
    };
  }

  DM2.Math = {
    mod, gcd, egcd, lcm, modInv, isPrime, divisors, eulerPhi,
    frac, fracAdd, fracSub, fracMul, fracDiv, fracNeg, fracIsZero, fracEq, fracToString, fracToLatex,
    permIdentity, permCompose, permInverse, permEquals, permPow,
    permToDisjointCycles, permFromCycles, permToTranspositions,
    permInversions, permOrder, permParity, permFormatCycle, generateSn,
    buildGroupFromTable, createZnAddGroup, createZpMulGroup, createV4Group, createSnGroup, createD4Group,
    analyzeSubset, generateClosure, analyzeCosets, enumerateSubgroups, buildQuotientGroup,
    polyDeg, polyFromIntR0, polyNormR0, polyAddR0, polySubR0, polyMulR0, polyDivModR0,
    polyMakeMonicR0, polyGcdExtR0, polyDerivR0, polyEvalR0, cyclotomicPoly,
    polyNormFp, polyAddFp, polySubFp, polyMulFp, polyDivModFp, polyMakeMonicFp,
    polyGcdExtFp, polyDerivFp, polyEvalFp, polyEqFp, allMonicPolysDegFp,
    polyPowModFp, polyIsIrreducibleFp, polyFactorFp, eisensteinCheck, rationalRootsCheck,
    polyToLatex, gfElementToLatex, gfElementToPlain,
    getPrimitivePolynomials, buildGF,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DM2.Math;
  }
})(typeof window !== 'undefined' ? window : globalThis);
