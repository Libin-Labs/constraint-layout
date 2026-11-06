import test from 'node:test';
import assert from 'node:assert/strict';
import { solveLayoutConstraints } from '../dist/esm/index.js';

test('clamps preferred values into explicit intervals deterministically', () => {
  const result = solveLayoutConstraints({ left: 12, width: 3 }, [
    { variable: 'left', relation: 'atLeast', value: 20 },
    { variable: 'width', relation: 'atLeast', value: 8 },
    { variable: 'width', relation: 'atMost', value: 16 },
  ]);
  assert.deepEqual(result, {
    feasible: true,
    values: { left: 20, width: 8 },
    diagnostics: [],
  });
});

test('applies exact equalities', () => {
  const result = solveLayoutConstraints({ x: 4 }, [{ variable: 'x', relation: 'equal', value: 9 }]);
  assert.equal(result.values.x, 9);
});

test('safely resolves special object property names', () => {
  const preferred = Object.create(null);
  preferred.__proto__ = 1;
  const result = solveLayoutConstraints(preferred, [
    { variable: '__proto__', relation: 'equal', value: 2 },
  ]);
  assert.equal(Object.hasOwn(result.values, '__proto__'), true);
  assert.equal(result.values.__proto__, 2);
});

test('reports contradictory equality diagnostics with source indexes', () => {
  const result = solveLayoutConstraints({ x: 0 }, [
    { variable: 'x', relation: 'equal', value: 2 },
    { variable: 'x', relation: 'equal', value: 3 },
  ]);
  assert.equal(result.feasible, false);
  assert.equal(result.values, null);
  assert.deepEqual(result.diagnostics[0].constraintIndexes, [0, 1]);
  assert.equal(result.diagnostics[0].code, 'conflicting-equality');
});

test('reports empty intervals from opposing bounds', () => {
  const result = solveLayoutConstraints({ width: 5 }, [
    { variable: 'width', relation: 'atLeast', value: 10 },
    { variable: 'width', relation: 'atMost', value: 4 },
  ]);
  assert.equal(result.diagnostics[0].code, 'empty-interval');
});

test('equal bounds are feasible', () => {
  const result = solveLayoutConstraints({ x: 0 }, [
    { variable: 'x', relation: 'atLeast', value: 5 },
    { variable: 'x', relation: 'atMost', value: 5 },
  ]);
  assert.equal(result.values.x, 5);
});

test('does not mutate caller-owned values or constraints', () => {
  const preferred = { x: 8 };
  const constraints = [{ variable: 'x', relation: 'atMost', value: 4 }];
  solveLayoutConstraints(preferred, constraints);
  assert.deepEqual(preferred, { x: 8 });
  assert.equal(constraints[0].value, 4);
});

test('rejects invalid records, variables, relations and numbers', () => {
  assert.throws(() => solveLayoutConstraints({}, []), RangeError);
  assert.throws(
    () => solveLayoutConstraints({ x: 1 }, [{ variable: 'y', relation: 'equal', value: 1 }]),
    /Unknown/,
  );
  assert.throws(
    () => solveLayoutConstraints({ x: 1 }, [{ variable: 'x', relation: 'between', value: 1 }]),
    /Unsupported/,
  );
  assert.throws(() => solveLayoutConstraints({ x: Infinity }, []), TypeError);
});

test('enforces the documented constraint capacity', () => {
  const tooMany = Array.from({ length: 10_001 }, () => ({
    variable: 'x',
    relation: 'atLeast',
    value: 0,
  }));
  assert.throws(() => solveLayoutConstraints({ x: 0 }, tooMany), /capacity/);
});
