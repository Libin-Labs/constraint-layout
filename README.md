# @lp-labs/constraint-layout

Resolve deterministic bounds on named scalar layout variables. The deliberately limited solver intersects independent equality/minimum/maximum constraints and clamps preferred values; it does not pretend to solve general relational layout equations.

- No runtime or peer dependencies.
- Explicit infeasibility diagnostics and source constraint indexes.
- ESM, CommonJS, and TypeScript declarations.

## Install

```sh
npm install @lp-labs/constraint-layout
```

Requires Node.js 18+ or an ESM-aware bundler.

## Quickstart

```js
import { solveLayoutConstraints } from '@lp-labs/constraint-layout';

const solution = solveLayoutConstraints({ x: 10, width: 120 }, [
  { variable: 'x', relation: 'atLeast', value: 24 },
  { variable: 'width', relation: 'atLeast', value: 180 },
  { variable: 'width', relation: 'atMost', value: 320 },
]);
console.log(solution.feasible, solution.values);
```

CommonJS users can call `require('@lp-labs/constraint-layout')`.

## Runtime API and types

Runtime export: `solveLayoutConstraints`.

- `solveLayoutConstraints(preferred, constraints)` accepts a plain record of variable names to finite preferred values and an iterable of constraints.
- Each `LayoutConstraint` contains `variable`, `relation` (`equal`, `atLeast`, or `atMost`), and finite `value`.
- A feasible `ConstraintSolution` has `feasible: true`, resolved `values`, and no diagnostics. An infeasible result has `feasible: false`, `values: null`, and one diagnostic per contradictory variable.
- `ConstraintDiagnostic` identifies `conflicting-equality` or `empty-interval`, the variable, contributing `constraintIndexes`, and a message.
- Type exports: `ConstraintRelation`, `LayoutConstraint`, `ConstraintDiagnostic`, and `ConstraintSolution`.

For each variable, equalities pin a value, `atLeast` raises the lower bound, and `atMost` lowers the upper bound. With no constraints, the preferred value is retained. Otherwise, a feasible preferred value is retained or clamped to the nearest interval edge. Conflicting equalities get their own diagnostic; an empty interval from opposing bounds is reported rather than silently approximated. Invalid input and unknown variable references throw `TypeError`; capacity errors throw `RangeError`.

## Bounds and limitations

Provide 1..256 variables and at most 10,000 constraints. Names are nonempty strings up to 128 UTF-16 units. Values are finite JavaScript numbers. The algorithm is deterministic and linear in the number of variables plus constraints.

This package supports **independent scalar bounds only**. Constraints such as `left + width <= right`, ratios, priorities, strengths, intrinsic measurement, inequality optimization, and responsive breakpoints are outside the model. Compose this narrow solver with your own geometry model or use a full constraint solver where cross-variable relationships are required.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
