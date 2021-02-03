import * as React from "react";
import { calculateAtomicMass } from "../calc";
import { Katex } from "../Katex";
import { Equation, FormulaTerm, latexFormulaTerm } from "../parse";
import { intersperse, mapValues, values } from "../util";
import { AnnotatedInput, UnitInput } from "./UnitInput";

export const BalanceEquation: React.FC<{
  eq: Equation;
}> = ({ eq }) => {
  const [molesBases, setMolesBases] = React.useState<{
    [k: number]: { fixed: boolean; last: number };
  }>({});

  let molesBaseLimit = Math.min(...values(molesBases).map((x) => x.last)) || 0;
  molesBaseLimit = molesBaseLimit == Infinity ? 0 : molesBaseLimit;

  const molesBase = React.useCallback(
    (i: number) => molesBases[i]?.last || molesBaseLimit,
    [molesBases]
  );
  const fixed = React.useCallback(
    (i: number) => molesBases[i]?.fixed || false,
    [molesBases]
  );
  const setMolesBase = React.useCallback(
    (i: number, molesBase: number) =>
      setMolesBases((prev) => ({
        ...mapValues(prev, (k, v) =>
          v.fixed ? { ...v } : { ...v, last: molesBase }
        ),
        [i]: { ...prev[i], last: molesBase },
      })),
    [setMolesBases]
  );
  const setFixed = React.useCallback(
    (i: number, fixed: boolean) =>
      setMolesBases((prev) => ({
        ...prev,
        [i]: { ...prev[i], fixed, last: molesBaseLimit },
      })),
    [setMolesBases, molesBaseLimit]
  );

  return (
    <div className="grid grid-flow-col-dense">
      {intersperse(
        eq.left.terms.map((c, i) => (
          <CompoundMessure
            key={i}
            ft={c}
            molesBase={molesBase(i)}
            setMolesBase={(b) => setMolesBase(i, b)}
            fixed={fixed(i)}
            setFixed={(f) => setFixed(i, f)}
            molesBaseLimit={molesBaseLimit}
          />
        )),
        (i) => (
          <Katex src="+" key={"plus-" + i} />
        )
      )}
      <Katex src="=" />
      {intersperse(
        eq.right.terms.map((c, i) => (
          <CompoundMessure
            key={i}
            ft={c}
            molesBase={molesBase(i + eq.left.terms.length)}
            setMolesBase={(b) => setMolesBase(i + eq.left.terms.length, b)}
            fixed={fixed(i + eq.left.terms.length)}
            setFixed={(f) => setFixed(i + eq.left.terms.length, f)}
            molesBaseLimit={molesBaseLimit}
          />
        )),
        (i) => (
          <Katex src="+" key={"plus-" + i} />
        )
      )}
    </div>
  );
};
const CompoundMessure: React.FC<{
  ft: FormulaTerm;
  setMolesBase: (x: number) => void;
  fixed: boolean;
  setFixed: (x: boolean) => void;
  molesBase: number;
  molesBaseLimit: number;
}> = ({ ft, setMolesBase, molesBase, fixed, setFixed, molesBaseLimit }) => {
  const digits = 1000;
  const round = (x: number) => Math.round(x * digits) / digits;
  const mass = React.useMemo(() => calculateAtomicMass([ft.compound]), [ft]);

  const moles = molesBase * ft.count;
  const grams = moles * mass;

  const setMoles = React.useCallback(
    (moles: number) => setMolesBase(moles / ft.count),
    [setMolesBase, ft.count, fixed]
  );
  const setGrams = React.useCallback(
    (grams: number) => setMoles(grams / mass),
    [setMoles, mass]
  );

  return (
    <div className="flex flex-col items-center">
      <Katex src={latexFormulaTerm(ft)} />
      <AnnotatedInput
        value={round(grams)}
        annotation="g"
        placeholder="Number of grams"
        onChange={setGrams}
      />
      <AnnotatedInput
        value={round(moles)}
        annotation="mol"
        placeholder="Number of moles"
        onChange={setMoles}
      />
      <label className="text-gray-400 cursor-pointer select-none">
        Fixed{" "}
        <input
          type="checkbox"
          checked={!!fixed}
          onChange={(e) => setFixed(e.target.checked)}
        />
      </label>
      {fixed ? (
        <p className="flex justify-between w-full">
          Excess:{" "}
          <UnitInput
            value={round((molesBase - molesBaseLimit) * ft.count * mass)}
            unit="g"
            placeholder=""
            minWidth={true}
          />
        </p>
      ) : null}
    </div>
  );
};
