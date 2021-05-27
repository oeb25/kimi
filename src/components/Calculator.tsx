import * as React from "react";
import * as mathjs from "mathjs";
import { Katex } from "./Katex";
import { keys } from "../util";
import { parseCompound, parseFormulaTerm } from "../parse";
import { calculateAtomicMass } from "../calc";

const math = mathjs.create(mathjs.all) as typeof mathjs;

const idealGas = (
  _args: mathjs.MathNode[],
  math: typeof mathjs,
  scope: Record<string, any>
) => {
  const target = _args[0].toString();

  switch (target) {
    case "V":
      return math.evaluate("n R T / p", scope);
    case "p":
      return math.evaluate("n R T / V", scope);
    case "n":
      return math.evaluate("p V / (R T)", scope);
    case "T":
      return math.evaluate("p V / (R n)", scope);
    default:
      return NaN;
  }
};
idealGas.rawArgs = true;

const massOf = (args: mathjs.MathNode[]) => {
  console.log(args[0].toString().replace(/ /g, ""));
  const parsed = parseFormulaTerm(args[0].toString().replace(/ /g, ""));
  return mathjs.evaluate(
    parsed.count * calculateAtomicMass([parsed.compound]) + "g/mol"
  );
};
massOf.rawArgs = true;

try {
  math.createUnit("amu", "0.000000000000000000000001660539g");
  math.createUnit("M", "1 mol/l");
  math.createUnit("AA", "1e-10 m");
  math.import({ idealGas, ig: idealGas, massOf }, {});
} catch (e) {
  console.error(e);
}
const constants = {
  Na: math.evaluate("avogadro"),
  R: math.evaluate("gasConstant"),
  c: math.evaluate("speedOfLight"),
  h: math.evaluate("planckConstant"),
  E: math.evaluate("null"),
};
export const Calculator: React.FC<{ precision: number }> = ({ precision }) => {
  const [input, setInput] = React.useState("");

  const [evalulated, scope] = React.useMemo(() => {
    const scope: object = {
      ...constants,
    };

    const frompH = "pOH = 14 - pH; OH = 10^(-pOH); H3O = 10^(-pH)";

    return [
      input.split("\n").map((line) => {
        let res = null;
        try {
          res = math.evaluate(line, scope);
          const l = line.replace(/ /g, "");
          if (l.startsWith("pH=")) {
            math.evaluate(frompH, scope);
          } else if (l.startsWith("pOH=")) {
            math.evaluate(
              `
              pH = 14 - pOH
              ${frompH}
              `,
              scope
            );
          } else if (l.startsWith("OH=")) {
            math.evaluate(
              `
              pOH = -log10(OH)
              pH = 14 - pOH
              ${frompH}
              `,
              scope
            );
          } else if (l.startsWith("H3O=")) {
            math.evaluate(
              `
              pH = -log10(H3O)
              ${frompH}
              `,
              scope
            );
          }
        } catch (e) {
          console.error(e);
        }

        return [line, res] as const;
      }),
      scope,
    ] as const;
  }, [input]);

  return (
    <div className="grid grid-flow-col gap-2 border-gray-900 shadow place-self-center place-items-center">
      <div className="relative font-mono">
        <div
          className="z-0 p-2 break-words whitespace-pre-wrap pointer-events-none opacity-20"
          style={{ minWidth: "10em" }}
        >
          {evalulated.map(([line, res], i) => (
            <div key={i}>
              {res ? (
                <>
                  <span className="pointer-events-none">{line}</span>
                  <span> = </span>
                  <span className="select-all">
                    {math.format(res, { precision })}
                  </span>
                </>
              ) : (
                line || "..."
              )}
            </div>
          ))}
        </div>
        <textarea
          className="absolute top-0 left-0 z-10 w-full h-full p-2 text-left bg-transparent resize-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Calculator"
        />
      </div>
      {/* <div>
        {Object.entries(scope)
          .filter(([key]) => !["Na", "R"].includes(key))
          .map(([key, value]) => {
            let tex = "nope";
            try {
              const parsed = mathjs.parse(mathjs.format(value));
              console.log(parsed);

              tex = parsed.toTex();
            } catch (e) {
              console.error(e);
            }

            return (
              <div>
                <Katex src={`${key} = ${tex}`} />
              </div>
            );
          })}
      </div> */}
    </div>
  );
};
