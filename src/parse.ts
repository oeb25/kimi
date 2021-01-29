import { elements, KimiElement } from "./data";

export type Compound =
  | {
      compound: Compound[];
      element?: undefined;
      oxidation?: number;
      multi: number;
    }
  | {
      compound?: undefined;
      element: KimiElement;
      oxidation?: number;
      multi: number;
    };

const parseOxidation = (s?: string) => {
  if (!s) return void 0;

  const n = parseInt(s);
  const m = Number.isNaN(n) ? 1 : n;
  return s.endsWith("-") ? -m : m;
};

const recurse = (s: string): Compound[] => {
  // const re = /\(.*\)(\d*)|([A-Z][a-z]*)(\d*)/g;
  const re = /\(.*\)(\d*[\+\-])?(\d*)|([A-Z][a-z]*)(\d*[\+\-])?(\d*)/g;

  // console.log("recurse on", s);
  try {
    const res = s.match(re)!.map(
      (x): Compound => {
        // const re = /\((.*)\)(\d*)/g;
        const re = /\((.*)\)(\d*[\+\-])?(\d*)/g;
        const m = re.exec(x);
        // console.log(x, m);
        if (m) {
          const compound = recurse(m[1]);
          return {
            compound,
            oxidation: parseOxidation(m[2]),
            multi: parseInt(m[3] || "1"),
          };
        } else {
          // const re = /([a-zA-Z]*)(\d*)/g;
          const re = /([a-zA-Z]*)(\d*[\+\-])?(\d*)/g;

          const m = re.exec(x)!;
          // console.log(x, m);

          if (!(m[1] in elements)) {
            console.error(m);
            throw new Error("Unknown element " + m[1]);
          }

          return {
            element: elements[m[1]],
            oxidation: parseOxidation(m[2]),
            multi: parseInt(m[3] || "1", 10),
          };
        }
      }
    );
    // console.log("recurse on", s, "into", res);
    return res;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const parseCompound = (s: string): Compound => {
  s = s.trim();
  const n = parseInt(s.trim(), 10);
  const combi = s.slice((n || "").toString().length);
  const multi = Number.isNaN(n) ? 1 : n;
  return { compound: recurse(combi), multi };
};

export const parseFormula = (s: string) => s.split(" + ").map(parseCompound);

export const parseEquation = (s: string) => {
  const [lhs, rhs] = s.split("->");
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
    const formula = parseFormula(s);
    return { formula };
  } catch (e) {}
  try {
    const compound = parseCompound(s);
    return { compound };
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
        return m
          ? `(${formatCompound(c.compound)})${m}`
          : formatCompound(c.compound);
      }
    })
    .join("");
};

export const latexCompound = (c: Compound): string => {
  const m = c.multi == 1 ? "" : `_{${c.multi}}`;
  const oxi = c.oxidation
    ? c.oxidation == 1
      ? "^+"
      : c.oxidation == -1
      ? "^-"
      : `^{${Math.abs(c.oxidation)}${c.oxidation > 0 ? "+" : "-"}}`
    : "";
  if (c.element) {
    return `\\text{${c.element.symbol}}` + m + oxi;
  } else {
    const self = c.compound.map(latexCompound).join(" ");
    return m ? `(${self})${m}${oxi}` : `${self}${m}${oxi}`;
  }
};

export const latexCompoundTop = (c: Compound): string => {
  const m = c.multi == 1 ? "" : c.multi;
  if (c.element) {
    return m + `\\text{${c.element.symbol}}`;
  } else {
    const self = c.compound.map(latexCompound).join(" ");
    return m + self;
  }
};

export const setMulti = (c: Compound, multi: number): Compound => ({
  ...c,
  multi,
});
