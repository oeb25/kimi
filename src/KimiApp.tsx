import * as React from "react";
import { toBalanced, extractElements, tallyElements } from "./calc";
import { Formula, latexFormula, parse, parseFormulaTerm } from "./parse";
import { KimiElement } from "./data";
import { PeriodicTable } from "./PeriodicTable";
import { Oxidation } from "./components/Oxidation";
import { CompoundInfo } from "./components/CompoundInfo";
import { BalanceEquation } from "./components/Balance";
import { Equilibrium2 } from "./components/Equilibrium";
import { Katex } from "./components/Katex";

const useFormularInput = ({ source }: { source: string }) => {
  const parsed = React.useMemo(() => {
    try {
      return parse(source);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [source]);

  const [soulvent, setSoulvent] =
    React.useState<null | "acidic" | "basic">(null);

  const inSolvent = React.useMemo<typeof parsed>(() => {
    if (!parsed || !parsed.eq) return parsed;

    let { left, right } = parsed.eq;

    const leftCharge = left.terms.reduce((c, t) => c + (t.charge || 0), 0);
    const rightCharge = right.terms.reduce((c, t) => c + (t.charge || 0), 0);

    if (soulvent == "acidic") {
      if (leftCharge > rightCharge) {
        return {
          eq: {
            left: { terms: [...left.terms, parseFormulaTerm("H2O")] },
            right: { terms: [parseFormulaTerm("H+"), ...right.terms] },
          },
        };
      } else {
        return {
          eq: {
            left: { terms: [parseFormulaTerm("H+"), ...left.terms] },
            right: { terms: [...right.terms, parseFormulaTerm("H2O")] },
          },
        };
      }
    } else if (soulvent == "basic") {
      if (leftCharge > rightCharge) {
        return {
          eq: {
            left: { terms: [...left.terms, parseFormulaTerm("OH-")] },
            right: { terms: [parseFormulaTerm("H2O"), ...right.terms] },
          },
        };
      } else {
        return {
          eq: {
            left: { terms: [parseFormulaTerm("H2O"), ...left.terms] },
            right: { terms: [...right.terms, parseFormulaTerm("OH-")] },
          },
        };
      }
    } else {
      return parsed;
    }
  }, [parsed, soulvent]);

  const [doBalance, setDoBalance] = React.useState(false);
  const balanced = React.useMemo(() => {
    if (!inSolvent || !inSolvent.eq) return null;

    try {
      return toBalanced(inSolvent.eq);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [inSolvent]);

  const eq = inSolvent?.eq && ((doBalance && balanced) || inSolvent.eq);

  const isBalanced = React.useMemo(
    () =>
      eq &&
      JSON.stringify(summarize(eq.left)) == JSON.stringify(summarize(eq.right)),
    [eq]
  );

  return {
    canBalance: balanced || isBalanced,
    doBalance,
    input: eq ? { eq } : parsed,
    isBalanced,
    setDoBalance,
    setSoulvent,
    soulvent,
  };
};

export const KimiApp: React.FC<{}> = ({}) => {
  const [focus, setFocus] = React.useState<KimiElement[]>([]);
  const [showTable, setShowTable] = React.useState(false);

  const [source, setSource] = React.useState(
    // "Ba2+ + Cr2O2-7 + H2O = BaCrO4 + H+"
    "C6H12O6 + O2 = CO2 + H2O"
    // "MnO-4 + O2-2 + H2O = MnO2 + O2 + OH-"
    // "H2O + MnO-4 + SO2-3 = MnO2 + SO2-4 + OH-"
    // "H2O + HgCl2 + NH3 = HgNH2Cl + Cl- + OH-"
    // "KNO3 + S + C = K2CO3 + K2SO4 + CO2 + N2" // Has multiple solutions
    // "10KNO3 + 3S + 8C = 2K2CO3 + 3K2SO4 + 6CO2 + 5N2"
    // "Cu + NO-3 = NO + Cu2+"
    // "TiCl4 + Mg = Ti + MgCl2"
    // "HCOOH = HCOO- + H+"
    // "C10H12N2O"
    // "C"
  );
  const {
    canBalance,
    doBalance,
    input,
    isBalanced,
    setDoBalance,
    setSoulvent,
    soulvent,
  } = useFormularInput({ source });

  React.useEffect(() => {
    if (!input) return setFocus([]);

    const compounds =
      input.term?.compound ||
      input.formula?.terms ||
      input.eq?.left.terms.concat(input.eq.right.terms);

    if (!compounds) return setFocus([]);

    const xs = extractElements(compounds);

    setFocus(Array.from(xs));
  }, [JSON.stringify(input), setFocus]);

  React.useEffect(() => {
    if (!input || input?.term?.compound.element) {
      setShowTable(true);
    } else {
      setShowTable(false);
    }
  }, [JSON.stringify(input), setShowTable]);

  const onClickElement = React.useCallback(
    (e: KimiElement) => {
      if (showTable) setSource(e.symbol);
    },
    [setSource, showTable]
  );

  return (
    <div className="grid grid-cols-1 gap-4 p-2 border border-gray-900 shadow place-items-center">
      <input
        className="w-full p-2 text-center bg-transparent bg-gray-900 border border-gray-900"
        style={{
          fontFamily:
            '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />
      {input?.eq && (
        <>
          <div className="grid grid-cols-1 place-items-center">
            <div className="grid grid-cols-2 gap-x-4">
              <label className="select-none">
                Acidic:{" "}
                <input
                  type="checkbox"
                  checked={soulvent == "acidic"}
                  onChange={(e) =>
                    e.target.checked ? setSoulvent("acidic") : setSoulvent(null)
                  }
                />
              </label>
              <label className="select-none">
                Basic:{" "}
                <input
                  type="checkbox"
                  checked={soulvent == "basic"}
                  onChange={(e) =>
                    e.target.checked ? setSoulvent("basic") : setSoulvent(null)
                  }
                />
              </label>
            </div>

            <div>
              {canBalance ? (
                <label
                  className={
                    "select-none " +
                    (canBalance
                      ? "cursor-pointer"
                      : "line-through cursor-not-allowed")
                  }
                >
                  Balance:{" "}
                  <input
                    disabled={!canBalance}
                    type="checkbox"
                    checked={doBalance && !!canBalance}
                    onChange={(e) => setDoBalance(e.target.checked)}
                  />
                </label>
              ) : isBalanced ? (
                <label className="font-bold text-gray-400">
                  Equation balanced
                </label>
              ) : (
                <label className="italic text-gray-400">Cannot balance</label>
              )}
            </div>
            <div className="px-4">
              <Katex
                src={
                  latexFormula(input.eq.left) +
                  " \\;=\\; " +
                  latexFormula(input.eq.right)
                }
              />
            </div>
          </div>
          <Section title="Mass Calculation">
            <BalanceEquation eq={input.eq} />
          </Section>
          <Section title="Equilibrium">
            <Equilibrium2 eq={input.eq} />
          </Section>
        </>
      )}

      {input?.term && <CompoundInfo ft={input.term} />}

      {input?.term && (
        <Section title="Oxidation">
          <Oxidation c={input.term.compound} />
        </Section>
      )}

      <Section
        title="Periodic Table"
        open={showTable}
        onClick={() => {
          setFocus([]);
          requestAnimationFrame(() => {
            setFocus(focus);
          });
        }}
      >
        <PeriodicTable focus={focus} onClick={onClickElement} />
      </Section>
    </div>
  );
};

const Section: React.FC<{
  title: React.ReactNode;
  open?: boolean;
  onClick?: () => void;
}> = ({ title, children, open, onClick }) => {
  const [internalOpen, setInternalOpen] = React.useState(open);

  React.useEffect(() => {
    setInternalOpen(open);
  }, [setInternalOpen, open]);

  return (
    <details open={open} onClick={onClick}>
      <summary
        className="w-full outline-none cursor-pointer"
        onClick={(e) => {
          const didOpen = !(
            (e.target as HTMLElement).parentElement as HTMLDetailsElement
          ).open;
          setInternalOpen(didOpen);
        }}
      >
        {title}
      </summary>
      {internalOpen && children}
    </details>
  );
};

const summarize = (f: Formula) =>
  Object.entries(
    tallyElements({
      group: f.terms.map((t) => ({
        ...t.compound,
        multi: t.count * t.compound.multi,
      })),
      multi: 1,
    })
  )
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .concat([
      ["e", f.terms.reduce((acc, t) => acc + (t.charge || 0) * t.count, 0)],
    ]);
