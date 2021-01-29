import * as data from "./data";
import { findIntegerSolution } from "./matrix";
import { Compound, setMulti } from "./parse";
import { keys, mapValues } from "./util";

const ERROR_FACTOR = 1000000000;

export const calculateAtomicMass = (cs: Compound[]): number =>
  Math.round(
    ERROR_FACTOR *
      cs
        .map((c) =>
          c.element
            ? c.element.atomicMass * c.multi
            : calculateAtomicMass(c.compound) * c.multi
        )
        .reduce((a, b) => a + b, 0)
  ) / ERROR_FACTOR;

export const extractElements = (
  cs: Compound | Compound[]
): Set<data.KimiElement> => {
  const res = new Set<data.KimiElement>();

  for (const c of Array.isArray(cs) ? cs : [cs]) {
    if (c.element) {
      res.add(c.element);
    } else {
      for (const x of c.compound.map(tallyElements)) {
        for (const k of Object.keys(x)) {
          res.add(data.elements[k]);
        }
      }
    }
  }

  return res;
};
export const tallyElements = (c: Compound): Record<string, number> => {
  if (c.element) {
    return { [c.element.symbol]: c.multi };
  } else {
    const res: Record<string, number> = {};
    for (const x of c.compound.map(tallyElements)) {
      for (const k of Object.keys(x)) {
        res[k] = (res[k] || 0) + x[k];
      }
    }
    return mapValues(res, (_, v) => v * c.multi);
  }
};

const balance = ({ left, right }: { left: Compound[]; right: Compound[] }) => {
  const leftT = left.map((e) => tallyElements(setMulti(e, 1)));
  const rightT = right.map((e) => tallyElements(setMulti(e, 1)));

  const numberElements: Record<string, number> = {};
  let index = 0;

  for (const x of leftT.concat(rightT)) {
    for (const key in x) {
      if (!(key in numberElements)) {
        numberElements[key] = index++;
      }
    }
  }

  const rows = keys(numberElements).map((e) =>
    leftT.map((l) => l[e] || 0).concat(rightT.map((l) => -l[e] || 0).concat(0))
  );
  rows.push(rows[0].map(() => 0));

  const solution = findIntegerSolution(rows);

  return {
    left: left.map((_, i) => solution[i]),
    right: right.map((_, i) => solution[left.length + i]),
  };
};

export const toBalanced = (eq: { left: Compound[]; right: Compound[] }) => {
  const { left, right } = balance(eq);
  return {
    left: eq.left.map((c, i) => setMulti(c, left[i])),
    right: eq.right.map((c, i) => setMulti(c, right[i])),
  };
};

// (u+x)(v+x)/(a-x)=b
// (u+x)(v+x) = a*b - x*b
// (u+x)(v+x) + x*b - a*b = 0
// x^2 + (u+v)*x + x*b + u*v - a*b = 0
// x^2 + (u+v+b)*x + u*v - a*b = 0

const equibThing = (a: number, b: number, u: number, v: number) => {
  const res = solveQuadratic(1, u + v + b, u * v - a * b);
  return res ? { pH: 14 + Math.log10(Math.max(...res)) } : null;
};

const solveQuadratic = (a: number, b: number, c: number) => {
  const d = b * b - 4 * a * c;

  if (d > 0) {
    return [(-b + Math.sqrt(d)) / (2 * a), (-b - Math.sqrt(d)) / (2 * a)];
  } else if (d == 0) {
    return [-b / (2 * a)];
  } else {
    return null;
  }
};

console.log(equibThing(0.25, 1.4e-11, 0, 0));
