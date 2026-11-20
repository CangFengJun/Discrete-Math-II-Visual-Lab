import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const M = require(path.resolve(__dirname, '../js/core/math-engine.js'));

function run() {
  // 1. Permutation right-to-left & S_n identities
  const s = M.permFromCycles(3, [[1, 3]]);
  const t = M.permFromCycles(3, [[1, 2]]);
  assert.deepEqual(M.permCompose(s, t), [2, 3, 1], 'Right-to-left (1 3)(1 2) must equal (1 2 3)');
  const c123 = [2, 3, 1];
  assert.deepEqual(M.permPow(c123, 2), M.permInverse(c123), '(a,b,c)^2 === (a,b,c)^{-1}');
  assert.deepEqual(M.permPow(c123, 4), c123, '(a,b,c)^4 === (a,b,c)');

  for (const n of [3, 4, 5]) {
    const sn = M.generateSn(n);
    const fact = [1, 1, 2, 6, 24, 120][n];
    assert.equal(sn.length, fact);
    let evenCount = 0;
    let oddCount = 0;
    for (const p of sn) {
      const trans = M.permToTranspositions(p);
      let acc = M.permIdentity(n);
      for (let i = trans.length - 1; i >= 0; i--) {
        acc = M.permCompose(M.permFromCycles(n, [trans[i]]), acc);
      }
      assert.deepEqual(acc, p);
      const parity = M.permParity(p);
      assert.equal(parity.inversions % 2, parity.nMinusK % 2);
      assert.equal(trans.length % 2, parity.nMinusK % 2);
      if (parity.isEven) evenCount++;
      else oddCount++;
      assert.deepEqual(M.permPow(p, M.permOrder(p)), M.permIdentity(n));
    }
    assert.equal(evenCount, fact / 2);
    assert.equal(oddCount, fact / 2);
  }

  // 2. Groups, Subgroups, Cosets & Quotient Groups
  assert.equal(M.enumerateSubgroups(M.createZnAddGroup(12)).subgroups.length, 6);
  const s3Subs = M.enumerateSubgroups(M.createSnGroup(3));
  assert.equal(s3Subs.subgroups.length, 6);
  assert.equal(s3Subs.subgroups.filter((sg) => sg.isNormal).length, 3);

  const d4 = M.createD4Group();
  const d4Subs = M.enumerateSubgroups(d4);
  assert.equal(d4Subs.subgroups.length, 10);
  assert.equal(d4Subs.subgroups.filter((sg) => sg.isNormal).length, 6);
  for (const sg of d4Subs.subgroups) {
    assert.equal(d4.order % sg.order, 0);
    if (sg.isNormal) {
      const q = M.buildQuotientGroup(d4, sg.elements);
      assert.ok(q && q.wellDefined);
      assert.equal(q.quotient.order, sg.index);
    }
  }

  // 3. Descending Polynomials & Cyclotomic Phi_n(x)
  const f0 = M.polyFromIntR0([1, 0, -3, 2]);
  const f0d = M.polyDerivR0(f0);
  const g0 = M.polyGcdExtR0(f0, f0d);
  assert.equal(M.polyDeg(g0.d), 1);
  const bez0 = M.polyAddR0(M.polyMulR0(g0.lambda, f0), M.polyMulR0(g0.mu, f0d));
  assert.equal(bez0.length, g0.d.length);
  for (let i = 0; i < bez0.length; i++) assert.ok(M.fracEq(bez0[i], g0.d[i]));

  for (let n = 1; n <= 16; n++) {
    const phi = M.cyclotomicPoly(n);
    assert.equal(phi.length - 1, M.eulerPhi(n));
    let prod = [M.frac(1, 1)];
    for (const d of M.divisors(n)) prod = M.polyMulR0(prod, M.polyFromIntR0(M.cyclotomicPoly(d)));
    const target = Array.from({ length: n + 1 }, (_, i) =>
      i === 0 ? M.frac(1, 1) : i === n ? M.frac(-1, 1) : M.frac(0, 1)
    );
    assert.equal(prod.length, target.length);
    for (let i = 0; i < prod.length; i++) assert.ok(M.fracEq(prod[i], target[i]));
  }

  // 4. Finite Fields GF(4), GF(8), GF(9), GF(16), GF(25), GF(64)
  for (const [p, n] of [[2, 2], [2, 3], [3, 2], [2, 4], [5, 2], [2, 6]]) {
    const gf = M.buildGF(p, n);
    assert.equal(gf.q, Math.pow(p, n));
    assert.equal(gf.xiIsPrimitive, true);
    assert.equal(gf.powerRing.length, gf.q - 1);
    for (let a = 0; a < gf.q; a++) {
      assert.equal(gf.addTable[a][0], a);
      assert.equal(gf.mulTable[a][0], 0);
      assert.equal(gf.mulTable[a][1], a);
    }
    if (gf.q <= 25) {
      for (let a = 0; a < gf.q; a++) {
        for (let b = 0; b < gf.q; b++) {
          for (let c = 0; c < gf.q; c++) {
            assert.equal(
              gf.mulTable[a][gf.addTable[b][c]],
              gf.addTable[gf.mulTable[a][b]][gf.mulTable[a][c]]
            );
          }
        }
      }
    }
    assert.equal(gf.subfields.length, M.divisors(n).length);
  }

  console.log('ALL_MATH_ENGINE_TESTS_PASSED');
}

run();
