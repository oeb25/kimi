import { elements, KimiElement } from "./data";

export type FormulaTerm = {
  charge?: number;
  count: number;
  compound: Compound;
};

export type Formula = {
  terms: FormulaTerm[];
};

type Base = {
  multi: number;
};

type Voided<T> = { [K in keyof T]?: undefined };

type Group = { group: Compound[]; oxidation?: number };
type Molecule = { element: KimiElement; oxidation?: number };

export type Compound = (
  | (Omit<Voided<Molecule>, keyof Group> & Group)
  | (Omit<Voided<Group>, keyof Molecule> & Molecule)
) &
  Base;

export type Equation = { left: Formula; right: Formula };

const parseCharge = (s?: string) => {
  if (!s) return void 0;

  const n = parseInt(s);
  const m = Number.isNaN(n) ? 1 : n;
  return s.endsWith("-") ? -m : m;
};

const recurse = (s: string): [Compound, undefined | number] => {
  // const re = /\(.*\)(\d*)|([A-Z][a-z]*)(\d*)/g;
  const re = /\(.*\)(\d*[\+\-])?(\d*)|([A-Z][a-z]*)(\d*[\+\-])?(\d*)/g;

  // console.log("recurse on", s);
  try {
    const res = s.match(re)!.map((x): [Compound, undefined | number] => {
      // const re = /\((.*)\)(\d*)/g;
      const re = /\((.*)\)(\d*[\+\-])?(\d*)/g;
      const m = re.exec(x);
      // console.log(x, m);
      if (m) {
        const [compound, charge] = recurse(m[1]);

        const outerCharge = parseCharge(m[2]);

        if (charge != void 0 && outerCharge != void 0) {
          throw "Can't have multiple charges per compound";
        }

        // TODO: Oxidation

        return [
          {
            group: [compound],
            // charge: parseCharge(m[2]),
            multi: parseInt(m[3] || "1"),
          },
          charge == void 0 ? outerCharge : charge,
        ];
      } else {
        // const re = /([a-zA-Z]*)(\d*)/g;
        const re = /([a-zA-Z]*)(\d*[\+\-])?(\d*)/g;

        const m = re.exec(x)!;
        // console.log(x, m);

        if (!(m[1] in elements)) {
          console.error(m);
          throw new Error("Unknown element " + m[1]);
        }

        // TODO: Oxidation

        return [
          {
            element: elements[m[1]],
            // charge: parseCharge(m[2]),
            multi: parseInt(m[3] || "1", 10),
          },
          parseCharge(m[2]),
        ];
      }
    });
    // console.log("recurse on", s, "into", res);
    return res.length == 1
      ? res[0]
      : [{ group: res.map((x) => x[0]), multi: 1 }, res[res.length - 1][1]];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const parseCompoundInternal = (s: string): [Compound, undefined | number] => {
  s = s.trim();
  return recurse(s);
};
export const parseCompound = (s: string): Compound =>
  parseCompoundInternal(s)[0];

export const parseFormulaTerm = (s: string): FormulaTerm => {
  s = s.trim();
  const n = parseInt(s.trim(), 10);
  const combi = s.slice((n || "").toString().length);
  const count = Number.isNaN(n) ? 1 : n;
  // TODO: Charge
  // const charge = 0;
  const [compound, charge] = parseCompoundInternal(combi);
  return { compound, count, charge };
};
export const parseFormula = (s: string): Formula => ({
  terms: s.split(" + ").map(parseFormulaTerm),
});

export const parseEquation = (s: string): Equation => {
  const [lhs, rhs] = s.split("=");
  const left = parseFormula(lhs);
  const right = parseFormula(rhs);
  return { left, right };
};

export const parse = (s: string) => {
  try {
    const eq = parseEquation(s);
    return { eq };
  } catch (e) {}
  try {
    const compounds = s.split(" + ");
    if (compounds.length < 2) {
      const term = parseFormulaTerm(s);
      return { term };
    } else {
      const formula = parseFormula(s);
      return { formula };
    }
  } catch (e) {}
};

export const formatCompound = (c: Compound | Compound[]): string => {
  const comp = Array.isArray(c) ? c : [c];
  return comp
    .map((c) => {
      const m = c.multi == 1 ? "" : c.multi;
      if (c.element) {
        return c.element.symbol + m;
      } else {
        return m ? `(${formatCompound(c.group)})${m}` : formatCompound(c.group);
      }
    })
    .join("");
};

export const latexCompound = (c: Compound): string => {
  const m = c.multi == 1 ? "" : `_{${c.multi}}`;
  const oxi =
    typeof c.oxidation == "number"
      ? `\\htmlStyle{color: red;}{${
          c.oxidation > 0 ? "+" + c.oxidation : c.oxidation
        }}`
      : "";
  if (c.element) {
    // const e = `\\text{${c.element.symbol}}${m}${charge}`;
    // return oxi ? `{${oxi} \\above 0pt ${e}}` : e;
    return `\\stackrel{${oxi}}{\\text{${c.element.symbol}}${m}}`;
  } else {
    const self = c.group.map(latexCompound).join(" ");
    return m ? `(${self})${m}` : `${self}${m}`;
  }
};

export const latexFormulaTerm = (ft: FormulaTerm): string => {
  const m = ft.count == 1 ? "" : ft.count;
  const charge = ft.charge
    ? `^{${Math.abs(ft.charge) == 1 ? "" : Math.abs(ft.charge)}${
        ft.charge > 0 ? "+" : "-"
      }}`
    : "";

  const c = ft.compound;
  const lastInGroup = c.group && c.group[c.group.length - 1];

  if (c.multi != 1) {
    return m + latexCompound(setMulti(c, 1)) + charge + `_{${c.multi}}`;
  } else if (c.group && lastInGroup && lastInGroup.multi != 1) {
    return (
      m +
      latexCompound({
        multi: 1,
        group: c.group.map((x, i) =>
          i == c.group!.length - 1 ? setMulti(x, 1) : x
        ),
      }) +
      charge +
      `_{${lastInGroup.multi}}`
    );
  } else {
    return m + latexCompound(c) + charge;
  }
};

export const latexFormula = (f: Formula): string =>
  f.terms.map(latexFormulaTerm).join(" + ");

export const setCount = (c: FormulaTerm, count: number): FormulaTerm => ({
  ...c,
  count,
});

export const setMulti = (c: Compound, multi: number): Compound => ({
  ...c,
  multi,
});
