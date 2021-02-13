import * as data from "./data";
import { findIntegerSolutions } from "./matrix";
import { Compound, Equation, FormulaTerm, setCount } from "./parse";
import { keys, mapValues } from "./util";

const ERROR_FACTOR = 1000000000;

export const calculateAtomicMass = (cs: Compound[]): number =>
  Math.round(
    ERROR_FACTOR *
      cs
        .map((c) =>
          c.element
            ? c.element.atomicMass * c.multi
            : calculateAtomicMass(c.group) * c.multi
        )
        .reduce((a, b) => a + b, 0)
  ) / ERROR_FACTOR;

export const extractElements = (
  cs: FormulaTerm[] | Compound
): Set<data.KimiElement> => {
  const res = new Set<data.KimiElement>();

  for (const c of Array.isArray(cs) ? cs : [cs]) {
    if ("compound" in c) {
      extractElements(c.compound).forEach((e) => res.add(e));
    } else if (c.element) {
      res.add(c.element);
    } else {
      for (const x of c.group.map(tallyElements)) {
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
    for (const x of c.group.map(tallyElements)) {
      for (const k of Object.keys(x)) {
        res[k] = (res[k] || 0) + x[k];
      }
    }
    return mapValues(res, (_, v) => v * c.multi);
  }
};

const balance = ({
  left,
  right,
}: Equation): { left: number[]; right: number[] } => {
  const leftT = left.terms.map((e) => tallyElements(e.compound));
  const rightT = right.terms.map((e) => tallyElements(e.compound));

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
    leftT.map((l) => l[e] || 0).concat(rightT.map((l) => -l[e] || 0))
  );
  // Add oxidation row
  rows.push(
    left.terms
      .map((t) => t.charge || 0)
      .concat(right.terms.map((t) => -(t.charge || 0)))
  );

  const solutions = Array.from(findIntegerSolutions(rows));

  const solution = solutions[0];

  return {
    left: left.terms.map((_, i) => solution[i]),
    right: right.terms.map((_, i) => solution[left.terms.length + i]),
  };
};

export const toBalanced = (eq: Equation): Equation => {
  const { left, right } = balance(eq);
  return {
    left: { terms: eq.left.terms.map((c, i) => setCount(c, left[i])) },
    right: { terms: eq.right.terms.map((c, i) => setCount(c, right[i])) },
  };
};

// (u+x)(v+x)/(a-x)=b
// (u+x)(v+x) = a*b - x*b
// (u+x)(v+x) + x*b - a*b = 0
// x^2 + (u+v)*x + x*b + u*v - a*b = 0
// x^2 + (u+v+b)*x + u*v - a*b = 0

export const equibThing = (a: number, b: number, u: number, v: number) => {
  const res = solveQuadratic(1, u + v + b, u * v - a * b);
  if (!res) return null;
  const x = Math.max(...res);
  return { x, pH: 14 + Math.log10(x) };
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
