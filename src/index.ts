export type ConstraintRelation = 'equal' | 'atLeast' | 'atMost';

export interface LayoutConstraint {
  variable: string;
  relation: ConstraintRelation;
  value: number;
}

export interface ConstraintDiagnostic {
  code: 'conflicting-equality' | 'empty-interval';
  variable: string;
  constraintIndexes: number[];
  message: string;
}

export interface ConstraintSolution {
  feasible: boolean;
  values: Record<string, number> | null;
  diagnostics: ConstraintDiagnostic[];
}

function finite(value: number, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be finite.`);
  }
}

function plainRecord(value: unknown, name: string): asserts value is Record<string, number> {
  if (
    !value ||
    typeof value !== 'object' ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  ) {
    throw new TypeError(`${name} must be a plain record.`);
  }
}

export function solveLayoutConstraints(
  preferred: Readonly<Record<string, number>>,
  constraints: Iterable<LayoutConstraint>,
): ConstraintSolution {
  plainRecord(preferred, 'Preferred values');
  const variables = new Map<string, number>();
  const keys = Reflect.ownKeys(preferred);
  if (keys.length === 0 || keys.length > 256) {
    throw new RangeError('Expected 1..256 layout variables.');
  }
  for (const key of keys) {
    if (typeof key !== 'string' || key.length === 0 || key.length > 128) {
      throw new TypeError('Variable names must be nonempty strings up to 128 units.');
    }
    const descriptor = Object.getOwnPropertyDescriptor(preferred, key)!;
    if (!descriptor.enumerable || !('value' in descriptor)) {
      throw new TypeError('Preferred values must use enumerable data properties.');
    }
    finite(descriptor.value, `Preferred value for ${key}`);
    variables.set(key, descriptor.value);
  }
  if (constraints == null || typeof constraints[Symbol.iterator] !== 'function') {
    throw new TypeError('Constraints must be iterable.');
  }
  const bounds = new Map(
    [...variables.keys()].map((key) => [
      key,
      { min: -Infinity, max: Infinity, indexes: [] as number[] },
    ]),
  );
  const equalities = new Map<string, Array<{ value: number; index: number }>>();
  let index = 0;
  for (const constraint of constraints) {
    if (!constraint || typeof constraint !== 'object') {
      throw new TypeError('Constraints must be objects.');
    }
    const { variable, relation, value } = constraint;
    if (typeof variable !== 'string' || !variables.has(variable)) {
      throw new TypeError(`Unknown layout variable: ${String(variable)}.`);
    }
    if (!['equal', 'atLeast', 'atMost'].includes(relation)) {
      throw new TypeError(`Unsupported constraint relation: ${String(relation)}.`);
    }
    finite(value, 'Constraint value');
    const range = bounds.get(variable)!;
    range.indexes.push(index);
    if (relation === 'equal') {
      const list = equalities.get(variable) ?? [];
      list.push({ value, index });
      equalities.set(variable, list);
      range.min = Math.max(range.min, value);
      range.max = Math.min(range.max, value);
    } else if (relation === 'atLeast') {
      range.min = Math.max(range.min, value);
    } else {
      range.max = Math.min(range.max, value);
    }
    index++;
    if (index > 10_000) throw new RangeError('Constraint capacity exceeded.');
  }
  const diagnostics: ConstraintDiagnostic[] = [];
  for (const [variable, range] of bounds) {
    const exact = equalities.get(variable) ?? [];
    const distinct = new Set(exact.map((item) => item.value));
    if (distinct.size > 1) {
      diagnostics.push({
        code: 'conflicting-equality',
        variable,
        constraintIndexes: exact.map((item) => item.index),
        message: `Conflicting equalities constrain ${variable} to different values.`,
      });
    } else if (range.min > range.max) {
      diagnostics.push({
        code: 'empty-interval',
        variable,
        constraintIndexes: range.indexes,
        message: `Constraints leave no feasible value for ${variable}.`,
      });
    }
  }
  if (diagnostics.length) return { feasible: false, values: null, diagnostics };
  const values: Record<string, number> = {};
  for (const [variable, preferredValue] of variables) {
    const range = bounds.get(variable)!;
    Object.defineProperty(values, variable, {
      value: Math.min(range.max, Math.max(range.min, preferredValue)),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  return { feasible: true, values, diagnostics: [] };
}
