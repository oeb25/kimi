import * as React from "react";
import * as mathjs from "mathjs";
import { Equation, FormulaTerm, latexFormulaTerm } from "../parse";
import { Precision, UnitInput } from "./UnitInput";
import { intersperse } from "../util";
import { Katex } from "./Katex";
import { equibThing } from "../calc";

import * as nerdamer from "nerdamer";
import "nerdamer/Solve";

const newtonApproximate = (
  s: string,
  degree: number,
  tolerance = 0.00000001
) => {
  try {
    const fParsed = mathjs.parse(s);
    const dfParsed = mathjs.derivative(s, "x");

    const f = (x: number) => fParsed.evaluate({ x });
    const df = (x: number) => dfParsed.evaluate({ x });

    const maxCount = 1000;

    // C6H12O6 + 6O2 = 6CO2 + 6H2O

    const results: number[] = [];
    for (let i = 0; i < degree * 5 && results.length < degree; i++) {
      const guess = Math.sin(Math.exp(i));
      let x = guess;

      if (!Number.isFinite(f(x)) || Number.isNaN(f(x)) || df(x) == 0) {
        continue;
      }

      for (
        let count = 1;
        Math.abs(f(x)) > tolerance && count < maxCount;
        count++
      ) {
        if (Number.isNaN(f(x)) || Number.isNaN(df(x))) {
          continue;
        }

        x -= f(x) / df(x); //Newtons method.
        // console.log("Step: " + count + " x:" + x + " Value:" + f(x));
      }

      if (results.findIndex((y) => Math.abs(x - y) < 0.00001) == -1) {
        results.push(x);
      }
    }

    results.sort((a, b) => a - b);

    return results;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const Equilibrium2: React.FC<{ eq: Equation }> = ({ eq }) => {
  return <Equilibrium />;

  const numCols = eq.left.terms.length + eq.right.terms.length;

  const [initial, setInitial] = React.useState(
    eq.left.terms
      .concat(eq.right.terms)
      .map((_x, i) => (i < 2 ? (0.75 as number) : 0))
  );
  const [equibConst, setEquibConst] = React.useState(56.3);

  const denom = eq.left.terms
    .map((c, i) => {
      const init = initial[i];
      return `(${init} - ${c.count}x)^${c.count}`;
    })
    .join(" * ");
  const num = eq.right.terms
    .map((c, i) => {
      const init = initial[i + eq.left.terms.length];
      return `(${init} + ${c.count}x)^${c.count}`;
    })
    .join(" * ");

  const degree =
    Math.max(
      eq.left.terms.reduce((acc, t) => acc + t.count, 0),
      eq.right.terms.reduce((acc, t) => acc + t.count, 0)
    ) + 1;

  const equationForX = `${equibConst} * (${denom}) - (${num})`;

  const x = React.useMemo(
    () => newtonApproximate(equationForX, degree).filter((x) => x >= 0),
    [equationForX, degree]
  );

  const foundItLeft = eq.left.terms.findIndex(
    (c) =>
      c.charge == 1 &&
      // c.compound[0].charge == 1 &&
      c.compound.element?.symbol == "H"
  );
  const foundItRight = eq.right.terms.findIndex(
    (c) =>
      // c.compound[0].charge == 1 &&
      c.compound.element?.symbol == "H"
  );
  console.log(foundItLeft, eq.left, foundItRight, eq.right);

  const renderInitial = (
    _c: FormulaTerm,
    _side: "left" | "right",
    i: number
  ) => (
    <UnitInput
      key={i}
      value={initial[i]}
      placeholder="a"
      onChange={(v) =>
        setInitial((init) => [...init.slice(0, i), v, ...init.slice(i + 1)])
      }
      unit="M"
    />
  );
  const renderChange = (c: FormulaTerm, side: "left" | "right", i: number) => (
    <UnitInput
      key={i}
      value={`${side == "left" ? "-" : "+"}${c.count}x`}
      placeholder="a"
      unit="M"
    />
  );
  const renderEquilibrium = (
    c: FormulaTerm,
    side: "left" | "right",
    i: number
  ) => (
    <UnitInput
      value={initial[i] + (side == "left" ? -1 : 1) * c.count * x[0]}
      placeholder="a"
      unit="M"
      key={i}
    />
  );

  return (
    <div>
      <div
        className="grid justify-center"
        style={{ gridTemplateColumns: `auto repeat(${numCols * 2 - 1}, auto)` }}
      >
        <span></span>
        {intersperse(
          eq.left.terms.map((c, i) => (
            <div key={i} className="text-center">
              <Katex src={latexFormulaTerm(c)} />
            </div>
          )),
          <div className="text-center">
            <Katex src="+" />
          </div>
        )}
        <Katex src={"="} />
        {intersperse(
          eq.right.terms.map((c, i) => (
            <div key={i} className="text-center">
              <Katex src={latexFormulaTerm(c)} />
            </div>
          )),
          <div className="text-center">
            <Katex src="+" />
          </div>
        )}

        <span>Initial</span>
        {intersperse(
          eq.left.terms.map((c, i) => renderInitial(c, "left", i)),
          <span />
        )}
        <span />
        {intersperse(
          eq.right.terms.map((c, i) =>
            renderInitial(c, "right", i + eq.left.terms.length)
          ),
          <span />
        )}

        <span>Change</span>
        {intersperse(
          eq.left.terms.map((c, i) => renderChange(c, "left", i)),
          <span />
        )}
        <span />
        {intersperse(
          eq.right.terms.map((c, i) =>
            renderChange(c, "right", i + eq.left.terms.length)
          ),
          <span />
        )}

        <span>Equilibrium</span>
        {intersperse(
          eq.left.terms.map((c, i) => renderEquilibrium(c, "left", i)),
          <span />
        )}
        <span />
        {intersperse(
          eq.right.terms.map((c, i) =>
            renderEquilibrium(c, "right", i + eq.left.terms.length)
          ),
          <span />
        )}
      </div>
      <div className="flex items-start">
        <div className="grid grid-flow-col-dense">
          <Katex src="K_* =" />
          <UnitInput
            placeholder="Value of K*"
            value={equibConst}
            onChange={(v) => setEquibConst(v || 0)}
          />
        </div>
        <div className="grid grid-flow-col-dense">
          <Katex src="x =" />
          <UnitInput placeholder="Solution for x" value={x as any} unit="M" />
        </div>
        <Katex
          src={mathjs.parse(`(${equibConst}) = (${num}) / (${denom})`).toTex()}
        />
      </div>
    </div>
  );
};

const equib = (k: number, lhs: [number, number][], rhs: [number, number][]) => {
  try {
    const fmt = (xs: [number, number][]) =>
      mathjs
        .simplify(xs.map(([a, e]) => `(${a} - x)^${e}`).join(" * "))
        .toString();

    const eq = `${k} = (${fmt(rhs)}) / (${fmt(lhs)})`;

    let tex = `${mathjs
      .simplify(`(${fmt(rhs).toString()}) / (${fmt(lhs).toString()})`)
      .toTex()}`;

    if (tex.startsWith("\\frac")) {
      tex = "\\d" + tex.slice(1);
    }

    let s: string[];

    try {
      // @ts-ignore
      s = [].concat(nerdamer.solveEquations(eq)).map((x) => x.toString());
    } catch (e) {
      console.error(e);
      return { tex };
    }

    const solved: number[] = s
      .map((x) => mathjs.parse(x).evaluate())
      .filter((c) => mathjs.isNumeric(c));

    console.log(solved);

    if (solved.length == 0) return { tex };

    const x = Math.max(...solved);
    return { tex, res: { x, pH: -Math.log10(x) } };
  } catch (e) {
    return { tex: "\\text{Parse error}" };
  }
};

const Equilibrium: React.FC<{}> = ({}) => {
  const precision = React.useContext(Precision);

  const [coef, setCoef] = React.useState([1, 1, 1]);

  const [a, setA] = React.useState(0.25);
  const [k, setK] = React.useState(1.4e-11);
  const [u, setU] = React.useState(0);
  const [v, setV] = React.useState(0);

  const pK = -Math.log10(k);
  const setpK = (pK: number) => setK(Math.pow(10, -pK));

  // const res = equibThing(a, k, u, v);
  const lc = coef.map((c) => Math.min(c, 10));
  const { tex, res } = equib(
    k,
    [[a, lc[0]]],
    [
      [u, lc[1]],
      [v, lc[2]],
    ]
  );

  // console.log({ a, k, u, v }, res);

  return (
    <div>
      <div
        className="grid border-b"
        style={{ gridTemplateColumns: "auto repeat(3, auto)" }}
      >
        <span>Coeif</span>
        <UnitInput
          value={coef[0]}
          placeholder="a"
          onChange={(x) => setCoef((k) => [x, k[1], k[2]])}
          unit=""
        />
        <UnitInput
          value={coef[1]}
          placeholder="u"
          onChange={(x) => setCoef((k) => [k[0], x, k[2]])}
          unit=""
        />
        <UnitInput
          value={coef[2]}
          placeholder="v"
          onChange={(x) => setCoef((k) => [k[0], k[1], x])}
          unit=""
        />
        <span>Initial</span>
        <UnitInput value={a} placeholder="a" onChange={setA} unit="M" />
        <UnitInput value={u} placeholder="u" onChange={setU} unit="M" />
        <UnitInput value={v} placeholder="v" onChange={setV} unit="M" />
        <span>Change</span>
        <UnitInput
          value={res ? -res.x : NaN}
          placeholder="res ? -res.x : NaN"
          unit="M"
        />
        <UnitInput
          value={res ? res.x : NaN}
          placeholder="res ? res.x : NaN"
          unit="M"
        />
        <UnitInput
          value={res ? res.x : NaN}
          placeholder="res ? res.x : NaN"
          unit="M"
        />
        <span>Equilibrium</span>
        <UnitInput
          value={res ? a - res.x : NaN}
          placeholder="res ? -res.x : NaN"
          unit="M"
        />
        <UnitInput
          value={res ? res.x : NaN}
          placeholder="res ? res.x : NaN"
          unit="M"
        />
        <UnitInput
          value={res ? res.x : NaN}
          placeholder="res ? res.x : NaN"
          unit="M"
        />
      </div>
      <div className="flex">
        <div className="w-52">
          <UnitInput value={k} placeholder="b" onChange={setK} unit="Ka/Kb" />
          <UnitInput
            value={pK}
            placeholder="b"
            onChange={setpK}
            unit="pKa/pKb"
          />
          <UnitInput
            value={res ? res.pH : NaN}
            placeholder="res ? res.pH : NaN"
            unit="pH/pOH"
          />
          <UnitInput
            value={res ? (res.x / a) * 100 : NaN}
            placeholder="res ? res.x : NaN"
            unit="%"
          />
        </div>

        <div className="grid flex-1 col-start-2 row-span-full place-items-center">
          {/* `(${k}) = ((x - ${u})*(x - ${v}) / (${a} - x))` */}
          <Katex
            src={`${mathjs
              .simplify((k as any as string) || "0")
              .toTex({ precision })} = ${tex}`}
          />
          {/* <Katex
            src={`${mathjs
              .simplify((k as any as string) || "0")
              .toTex({ precision })} = \\cfrac{${mathjs
              .simplify(`(x - ${u})*(x - ${v})`)
              .toTex({ precision })}}{${mathjs
              .simplify(`(${a} - x)`)
              .toTex({ precision })}}`}
          /> */}
        </div>
      </div>
    </div>
  );
};
