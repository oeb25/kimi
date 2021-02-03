import * as React from "react";
import { toBalanced, extractElements, equibThing } from "./calc";
import { parse, Equation, latexFormulaTerm, FormulaTerm } from "./parse";
import { Katex } from "./Katex";
import { intersperse } from "./util";
import { KimiElement } from "./data";
import { PeriodicTable } from "./PeriodicTable";
import * as mathjs from "mathjs";
import { Oxidation } from "./components/Oxidation";
import { CompoundInfo } from "./components/CompoundInfo";
import { BalanceEquation } from "./components/Balance";
import { Equilibrium2 } from "./components/Equilibrium";

export const KimiApp: React.FC<{}> = ({}) => {
  const [focus, setFocus] = React.useState<KimiElement[]>([]);
  const [showTable, setShowTable] = React.useState(false);

  const [input, setInput] = React.useState("TiCl4 + Mg = Ti + MgCl2");
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

  const [doBalance, setDoBalance] = React.useState(false);
  const balanced = React.useMemo(() => {
    if (!parsed || !parsed.eq) return null;

    try {
      return toBalanced(parsed.eq);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [parsed]);

  React.useEffect(() => {
    if (!parsed || parsed?.term?.compound.element) {
      setShowTable(true);
    } else {
      setShowTable(false);
    }
  }, [parsed, setShowTable]);

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
      <div>
        {parsed?.eq &&
          (balanced ? (
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
          ))}
      </div>
      {parsed?.term ? <CompoundInfo ft={parsed.term} /> : null}
      {parsed?.eq ? (
        <BalanceEquation eq={(doBalance && balanced) || parsed.eq} />
      ) : null}

      {/* <details>
        <summary className="w-full outline-none cursor-pointer">
          Equilibrium
        </summary>

        <Equilibrium />
      </details> */}
      {parsed?.eq && (
        <Section title="Equilibrium">
          <Equilibrium2 eq={(doBalance && balanced) || parsed.eq} />
        </Section>
      )}

      {/* {parsed?.term ? (
        <details>
          <summary className="w-full outline-none cursor-pointer">
            Oxidation
          </summary>

          <Oxidation c={parsed.term.compound} />
        </details>
      ) : null} */}

      {parsed?.term && (
        <Section title="Oxidation">
          <Oxidation c={parsed.term.compound} />
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

      {/* <details
        open={showTable}
        onClick={() => {
          setFocus([]);
          requestAnimationFrame(() => {
            setFocus(focus);
          });
        }}
        // className={showTable ? "" : "pointer-events-none h-0"}
      >
        <summary className="w-full outline-none cursor-pointer">
          Periodic Table
        </summary>
        <PeriodicTable focus={focus} onClick={onClickElement} />
      </details> */}
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
    <details
      open={open}
      onClick={onClick}
      // className={showTable ? "" : "pointer-events-none h-0"}
    >
      <summary
        className="w-full outline-none cursor-pointer"
        onClick={(e) => {
          setInternalOpen((e) => !e);
        }}
      >
        {title}
      </summary>
      {internalOpen && children}
    </details>
  );
};
