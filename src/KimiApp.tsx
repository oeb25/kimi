import * as React from "react";
import { toBalanced, extractElements } from "./calc";
import { parse, parseFormulaTerm } from "./parse";
import { KimiElement } from "./data";
import { PeriodicTable } from "./PeriodicTable";
import { Oxidation } from "./components/Oxidation";
import { CompoundInfo } from "./components/CompoundInfo";
import { BalanceEquation } from "./components/Balance";
import { Equilibrium2 } from "./components/Equilibrium";

export const KimiApp: React.FC<{}> = ({}) => {
  const [focus, setFocus] = React.useState<KimiElement[]>([]);
  const [showTable, setShowTable] = React.useState(false);

  // const [input, setInput] = React.useState(
  //   "H2O + MnO-4 + SO2-3 = MnO2 + SO2-4 + OH-"
  // );
  const [input, setInput] = React.useState("Cu + NO-3 = NO + Cu2+");
  // const [input, setInput] = React.useState("TiCl4 + Mg = Ti + MgCl2");
  // const [input, setInput] = React.useState("HCOOH = HCOO- + H+");
  // const [input, setInput] = React.useState("C10H12N2O");
  // const [input, setInput] = React.useState("C");
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

    let eq = parsed.eq;

    if (soulvent == "acidic") {
      return {
        eq: {
          left: { terms: [parseFormulaTerm("H+"), ...eq.left.terms] },
          right: { terms: [...eq.right.terms, parseFormulaTerm("H2O")] },
        },
      };
    } else if (soulvent == "basic") {
      return {
        eq: {
          left: { terms: [parseFormulaTerm("H2O"), ...eq.left.terms] },
          right: { terms: [...eq.right.terms, parseFormulaTerm("OH-")] },
        },
      };
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

      {inSolvent?.eq && (
        <div className="grid grid-cols-2 gap-x-4 place-items-center">
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

          <div className="col-span-2">
            {balanced ? (
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
        </div>
      )}
      {inSolvent?.term && <CompoundInfo ft={inSolvent.term} />}
      {inSolvent?.eq && (
        <BalanceEquation eq={(doBalance && balanced) || inSolvent.eq} />
      )}

      {inSolvent?.eq && (
        <Section title="Equilibrium">
          <Equilibrium2 eq={(doBalance && balanced) || inSolvent.eq} />
        </Section>
      )}

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
