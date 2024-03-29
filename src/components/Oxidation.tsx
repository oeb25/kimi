import * as React from "react";
import { Katex } from "./Katex";
import { Compound, latexFormulaTerm } from "../parse";

export const Oxidation: React.FC<{ c: Compound }> = ({ c }) => {
  const [targetOxidationStr, setTargetOxidationStr] = React.useState("0");
  const targetOxidation = targetOxidationStr
    ? parseInt(targetOxidationStr)
    : void 0;
  const [includeUncommon, setIncludeUncommon] = React.useState(false);

  const oxidations = React.useMemo(
    () =>
      determineOxidations(c, {
        includeUncommon,
      }),
    [c, includeUncommon]
  );

  const filtered = React.useMemo(
    () =>
      oxidations
        .filter((o) => targetOxidation == void 0 || targetOxidation == o.charge)
        .map((o) => ({
          compound: applyOxidation(c, o.oxidations).applied,
          charge: o.charge,
        })),
    [c, oxidations, targetOxidation]
  );

  return (
    <div className="grid place-items-center">
      <div>
        <label className="text-gray-500">Target Oxidation:</label>
        <input
          className="w-6 p-1 ml-2 text-center bg-transparent border-b border-gray-900"
          placeholder="?"
          value={targetOxidationStr}
          onChange={(e) => setTargetOxidationStr(e.target.value)}
        />
      </div>
      <div>
        <label className="text-gray-500" htmlFor="includeUncommon">
          Include uncommon oxidations:
        </label>
        <input
          id="includeUncommon"
          className="w-6 p-1 ml-2 text-center bg-transparent border-b border-gray-900"
          type="checkbox"
          checked={includeUncommon}
          onChange={(e) => setIncludeUncommon(e.target.checked)}
        />
      </div>
      <div className="grid items-start grid-flow-col gap-4 justify-items-start">
        {filtered.map((o, i) => (
          <Katex
            key={i}
            src={latexFormulaTerm({
              compound: o.compound,
              charge: o.charge,
              count: 1,
            })}
          />
        ))}
      </div>
    </div>
  );
};

// LaTeX for oxidation indication \stackrel{!}{=}

const cartesianProduct = (arr: number[][]) =>
  arr.reduce(
    (acc, val) =>
      acc
        .map((el) => val.map((element) => el.concat(element)))
        .reduce((acc, val) => acc.concat(val), []),
    [[]] as number[][]
  );

const oxidationSelection = (
  c: Compound,
  includeUncommon: boolean
): number[][] => {
  if (c.group) {
    return c.group
      .map((x) => oxidationSelection(x, includeUncommon))
      .reduce(
        (a, b) => a.concat(b.map((os) => os.map((o) => o * c.multi))),
        []
      );
  } else {
    return [
      c.element.oxidationStates
        .filter((x) => x.common || includeUncommon)
        .map((o) => o.ions * c.multi),
    ];
  }
};

const applyOxidation = (
  c: Compound,
  oxidation: number[]
): { applied: Compound; numberUsed: number } => {
  if (c.group) {
    const newGroup: Compound[] = [];
    let numberUsed = 0;

    for (const g of c.group) {
      const res = applyOxidation(
        g,
        oxidation.slice(numberUsed).map((x) => x / c.multi)
      );
      numberUsed += res.numberUsed;
      newGroup.push(res.applied);
    }

    return {
      applied: { ...c, group: newGroup, oxidation: void 0 },
      numberUsed,
    };
  } else {
    return {
      applied: { ...c, oxidation: oxidation[0] / c.multi },
      numberUsed: 1,
    };
  }
};

const determineOxidations = (
  c: Compound,
  {
    includeUncommon = false,
    target,
  }: {
    includeUncommon?: boolean;
    target?: number;
  } = {}
): { oxidations: number[]; charge: number }[] => {
  /*
  // Hydrogen in a binary composition with metal:
  if (
    c.group &&
    c.group.length == 2 &&
    ((c.group[0].element?.symbol == "H" &&
      c.group[0].multi == 1 &&
      c.group[1].element?.metal) ||
      (c.group[1].element?.symbol == "H" &&
        c.group[1].multi == 1 &&
        c.group[0].element?.metal))
  ) {
    const [h, metal] = c.group[0].element.metal
      ? [c.group[1], c.group[0]]
      : [c.group[0], c.group[1]];

    return determineOxidations(metal, {
      includeUncommon,
      target: typeof target == "number" ? target + 1 : target,
    })
      .map((m) => ({
        oxidations: [
          c.group[0] == h ? -1 : m.oxidations[0],
          c.group[1] == h ? -1 : m.oxidations[0],
        ],
        charge: m.charge - 1,
      }))
      .filter((o) => target === void 0 || target == o.charge);
  }
  */

  // General
  return cartesianProduct(oxidationSelection(c, includeUncommon))
    .map((oxidations) => ({
      oxidations,
      charge: oxidations.reduce((a, b) => a + b, 0),
    }))
    .filter((o) => target === void 0 || target == o.charge);
};

export const oxidate = (c: Compound, target: number): Compound | null => {
  const oxidations = determineOxidations(c, { target });
  if (oxidations.length == 0) return null;
  return applyOxidation(c, oxidations[0].oxidations).applied;
};
