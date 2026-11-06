import layout = require('@lp-labs/constraint-layout');

const result: layout.ConstraintSolution = layout.solveLayoutConstraints({ x: 1 }, []);
console.log(result.feasible);
