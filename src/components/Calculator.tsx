import * as React from "react";
import * as mathjs from "mathjs";

mathjs.createUnit("amu", "0.000000000000000000000001660539g");
mathjs.createUnit("M", "1 mol/l");
const Na = mathjs.evaluate("6.02214076e23 mol^-1");
const R = mathjs.evaluate("0.0821 L atm/(K mol)");

export const Calculator: React.FC<{ precision: number }> = ({ precision }) => {
  const [input, setInput] = React.useState("");

  let res = null;
  try {
    res = mathjs.evaluate(input, {
      Na,
      R,
    });
  } catch (e) {}

  return (
    <div className="grid grid-flow-col gap-2 border-gray-900 shadow place-self-center place-items-center">
      <div className="relative p-2 pr-0">
        <input
          type="text"
          className="absolute top-0 left-0 right-0 w-full p-2 text-center bg-transparent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Calculator"
        />
        <span className="text-transparent">{input || "Calculator"}w</span>
      </div>
      {res != null && (
        <>
          <span>=</span>
          <span>{mathjs.format(res, { precision })}</span>
        </>
      )}
    </div>
  );
};
