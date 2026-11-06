import { solveLayoutConstraints, type LayoutConstraint } from '@lp-labs/constraint-layout';

const constraints: LayoutConstraint[] = [{ variable: 'width', relation: 'atLeast', value: 240 }];
const result = solveLayoutConstraints({ width: 180 }, constraints);
console.log(result.feasible, result.values?.width);
