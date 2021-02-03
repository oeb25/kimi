import * as React from "react";
import { determineOxidations } from "../calc";
import { Katex } from "../Katex";
import { Compound, latexCompound } from "../parse";

export const Oxidation: React.FC<{ c: Compound }> = ({ c }) => {
  return (
    <div className="grid items-start grid-flow-col gap-4 justify-items-start">
      {determineOxidations(c)
        // .filter((c) => c.oxidation == 0)
        .map((c) => (
          <Katex src={latexCompound(c)} />
          // <Katex src={latexFormula({ ...c, charge: c.oxidation })} />
        ))}
    </div>
  );
};
