import * as data from "./data";
import { findIntegerSolution } from "./matrix";
import { Compound, Equation, parseCompound, setMulti } from "./parse";
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

const balance = ({ left, right }: Equation) => {
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

export const toBalanced = (eq: Equation) => {
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

console.log(equibThing(0.25, 1.4e-11, 0, 0));

/** OXIDATION */

// interface Oxidation {
//   compound: Compound,
//   o
// }

// LaTeX for oxidation indication \stackrel{!}{=}

export const determineOxidations = (
  c: Compound,
  includeUncommon: boolean = false
): Compound[] => {
  // If the parsed compound has a fixed oxidation respect it
  // if (typeof c.charge == "number") return [{ ...c, oxidation: c.charge }];

  if (c.element) {
    return c.element.oxidationStates
      .filter((o) => includeUncommon || o.common)
      .map((o) => ({
        ...c,
        oxidation: o.ions,
      }))
      .filter((o) =>
        typeof c.charge == "number" ? o.oxidation == c.charge : true
      );
  } else {
    const possibilites: Compound[] = [{ ...c, compound: [] }];

    for (const x of c.compound) {
      const prev = possibilites.slice();
      for (const oxi of determineOxidations(x, includeUncommon)) {
        for (const p of prev) {
          // This can never happen
          if (!p.compound) throw "It happened anyway";
          possibilites.push({ ...p, compound: [...p.compound!, oxi] });
        }
      }
      possibilites.splice(0, prev.length);
    }
    return possibilites
      .map((o) => {
        const oxidation = o.compound
          ? o.compound.reduce((acc, x) => acc + x.multi * (x.oxidation || 0), 0)
          : o.oxidation;
        return { ...o, oxidation };
      })
      .filter((o) =>
        typeof c.charge == "number" ? o.oxidation == c.charge : true
      );
  }
};

console.log(determineOxidations(parseCompound("HCl(NaO2ClP)2+")));
