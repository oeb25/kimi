import * as React from "react";
import { Katex } from "./components/Katex";
import { UnitInput } from "./components/UnitInput";

export type PHConverterProps = {};
export const PHConverter = ({}: PHConverterProps) => {
  const [pH, setpH] = React.useState(7);

  const pOH = 14 - pH;
  const setpOH = (pOH: number) => setpH(14 - pOH);
  const Ka = Math.pow(10, -pH);
  const setKa = (Ka: number) => setpH(-Math.log10(Ka));

  const OH = Math.pow(10, -pOH);
  const setOH = (OH: number) => setpOH(-Math.log10(OH));

  return (
    <div className="grid grid-flow-row grid-cols-2">
      <Katex src="\text{pH}" />
      <UnitInput placeholder="pH" value={pH} onChange={setpH} />
      <Katex src="\text{pOH}" />
      <UnitInput placeholder="pOH" value={pOH} onChange={setpOH} />
      <Katex src="[\text{H}^+] \;/\; [\text{H}_3\text{O}^+]" />
      <UnitInput placeholder="Ka" value={Ka} onChange={setKa} />
      <Katex src="[\text{OH}^-]" />
      <UnitInput placeholder="[OH]" value={OH} onChange={setOH} />
    </div>
  );
};
