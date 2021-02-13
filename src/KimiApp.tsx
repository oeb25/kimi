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

export const KimiApp: React.FC<{}> = ({}) => {
  const [focus, setFocus] = React.useState<KimiElement[]>([]);
  const [showTable, setShowTable] = React.useState(false);

  const [input, setInput] = React.useState(
    // "Ba2+ + Cr2O2-7 + H2O = BaCrO4 + H+"
    // "MnO-4 + O2-2 + H2O = MnO2 + O2 + OH-"
    // "H2O + MnO-4 + SO2-3 = MnO2 + SO2-4 + OH-"
    // "H2O + HgCl2 + NH3 = HgNH2Cl + Cl- + OH-"
    "KNO3 + S + C = K2CO3 + K2SO4 + CO2 + N2" // Has multiple solutions
    // "10KNO3 + 3S + 8C = 2K2CO3 + 3K2SO4 + 6CO2 + 5N2"
    // "Cu + NO-3 = NO + Cu2+"
    // "TiCl4 + Mg = Ti + MgCl2"
    // "HCOOH = HCOO- + H+"
    // "C10H12N2O"
    // "C"
  );
  const parsed = React.useMemo(() => {
    try {
      return parse(input);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [input]);

  React.useEffect(() => {
    if (!parsed) return setFocus([]);

    const compounds =
      parsed.term?.compound ||
      parsed.formula?.terms ||
      parsed.eq?.left.terms.concat(parsed.eq.right.terms);

    if (!compounds) return setFocus([]);

    const xs = extractElements(compounds);

    setFocus(Array.from(xs));
  }, [setFocus, parsed]);

  const [soulvent, setSoulvent] = React.useState<null | "acidic" | "basic">(
    null
  );

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

  const isAlreadyBalanced = React.useMemo(
    () =>
      inSolvent?.eq &&
      JSON.stringify(summarize(inSolvent.eq.left)) ==
        JSON.stringify(summarize(inSolvent.eq.right)),
    [inSolvent?.eq]
  );

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

  React.useEffect(() => {
    if (!inSolvent || inSolvent?.term?.compound.element) {
      setShowTable(true);
    } else {
      setShowTable(false);
    }
  }, [inSolvent, setShowTable]);

  const onClickElement = React.useCallback(
    (e: KimiElement) => {
      if (showTable) setInput(e.symbol);
    },
    [setInput, showTable]
  );

  const eq = inSolvent?.eq && ((doBalance && balanced) || inSolvent.eq);

  return (
    <div className="grid grid-cols-1 gap-4 p-2 border border-gray-900 shadow place-items-center">
      <input
        className="w-full p-2 text-center bg-transparent bg-gray-900 border border-gray-900"
        style={{
          fontFamily:
            '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {eq && (
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
            {isAlreadyBalanced ? (
              <label className="font-bold text-gray-400">
                Equation balanced
              </label>
            ) : balanced ? (
              <label
                className={
                  "select-none " +
                  (balanced
                    ? "cursor-pointer"
                    : "line-through cursor-not-allowed")
                }
              >
                Balance:{" "}
                <input
                  disabled={!balanced}
                  type="checkbox"
                  checked={doBalance && !!balanced}
                  onChange={(e) => setDoBalance(e.target.checked)}
                />
              </label>
            ) : (
              <label className="italic text-gray-400">Cannot balance</label>
            )}
          </div>
          <div className="px-4">
            <Katex
              src={latexFormula(eq.left) + " \\;=\\; " + latexFormula(eq.right)}
            />
          </div>
        </div>
      )}
      {eq && (
        <Section title="Mass Calculation">
          <BalanceEquation eq={eq} />
        </Section>
      )}
      {eq && (
        <Section title="Equilibrium">
          <Equilibrium2 eq={eq} />
        </Section>
      )}

      {inSolvent?.term && <CompoundInfo ft={inSolvent.term} />}

      {inSolvent?.term && (
        <Section title="Oxidation">
          <Oxidation c={inSolvent.term.compound} />
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
          const didOpen = !((e.target as HTMLElement)
            .parentElement as HTMLDetailsElement).open;
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
