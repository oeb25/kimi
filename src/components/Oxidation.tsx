import * as React from "react";
import { determineOxidations } from "../calc";
import { Katex } from "../Katex";
import { Compound, latexCompound, latexFormulaTerm } from "../parse";

export const Oxidation: React.FC<{ c: Compound }> = ({ c }) => {
  const [targetOxidationStr, setTargetOxidationStr] = React.useState("0");
  const targetOxidation = targetOxidationStr
    ? parseInt(targetOxidationStr)
    : null;

  const oxidation = React.useMemo(() => determineOxidations(c), [c]);

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
      <div className="grid items-start grid-flow-col gap-4 justify-items-start">
        {oxidation
          .filter(
            (c) => targetOxidation === null || c.oxidation == targetOxidation
          )
          .map((c) => (
            // <Katex src={latexCompound(c)} />
            <Katex
              src={latexFormulaTerm({
                compound: c,
                charge: c.oxidation,
                count: 1,
              })}
            />
          ))}
      </div>
    </div>
  );
};
