import { Compound, parseCompound } from "../parse";
import { oxidate } from "./Oxidation";

const suffixTable = [
  null,
  "mono",
  "di",
  "tri",
  "tetra",
  "penta",
  "hexa",
  "septa",
  "octa",
  "NINE",
  "deci",
  "DECA",
] as const;

const roman = [
  null,
  "I",
  "II",
  "II",
  "IV",
  "V",
  "VI",
  "VII",
  "IIX",
  "IX",
  "X",
] as const;

export const nameCompound = (c: Compound, first = true): string => {
  if (first) {
    const oxidated = oxidate(c, 0);
    if (oxidated) c = oxidated;
  }

  const suffix = c.multi == 1 ? "" : suffixTable[c.multi];

  if (c.element?.symbol == "O") return suffix + "oxide";
  if (c.element?.symbol == "S") return suffix + "sulfide";

  if (c.element) {
    return (
      suffix +
      c.element.name +
      (c.element.type == "Transition Metal"
        ? `(${c.oxidation ? roman[c.oxidation!] : "?"})`
        : "")
    );
  } else {
    return c.group.map((x) => nameCompound(x, false)).join(" ");
  }
};

const naming = [
  ["KCl", "Kaliumklorid"],
  ["LiI", "Lithiumiodid"],
  ["MgS", "Magnesiumsulfid"],
  ["TiO", "Titanium(II)oxid"],
  ["TiO2", "Titanium(IV)oxid"],
] as const;

for (const [c, n] of naming) {
  try {
    console.log(c + ", " + nameCompound(parseCompound(c)) + ", " + n);
  } catch (e) {
    console.error(c + " failed", e);
  }
}
