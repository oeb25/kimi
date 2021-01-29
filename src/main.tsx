import * as React from "react";
import * as ReactDOM from "react-dom";
import { toBalanced, calculateAtomicMass, extractElements } from "./calc";
import { Compound, latexCompoundTop, parse, setMulti } from "./parse";
import {} from "katex";
import { Katex } from "./Katex";
import { intersperse, keys, mapValues, values } from "./util";
import * as data from "./data";
import { KimiElement } from "./data";
import { PeriodicTable } from "./PeriodicTable";

const App: React.FC<{}> = ({}) => {
  const [focus, setFocus] = React.useState<KimiElement[]>([]);
  const [showTable, setShowTable] = React.useState(false);

  return (
    <div className="grid min-h-screen grid-flow-col text-white bg-gray-800 min-w-screen place-items-center">
      <div className="grid items-center grid-flow-col-dense gap-4">
        {/* <KimiApp /> */}
        <KimiApp setFocus={setFocus} setShowTable={setShowTable} />
      </div>
    </div>
  );
};

const KimiApp: React.FC<{
  setFocus: (focus: KimiElement[]) => void;
  setShowTable: (showTable: boolean) => void;
}> = ({}) => {
  const [focus, setFocus] = React.useState<KimiElement[]>([]);
  const [showTable, setShowTable] = React.useState(false);

  const [input, setInput] = React.useState("TiCl4 + 2Mg -> Ti + 2MgCl2");
  // const [input, setInput] = React.useState("Ti");
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
      parsed.compound ||
      parsed.formula ||
      parsed.eq.left.concat(parsed.eq.right);

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
    if (
      !parsed ||
      (parsed?.formula &&
        parsed?.formula.length == 1 &&
        parsed?.formula[0].compound &&
        parsed?.formula[0].compound.length == 1 &&
        parsed?.formula[0].compound[0].element)
    ) {
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
        {parsed?.eq && (
          <label
            className={
              "select-none " +
              (balanced ? "cursor-pointer" : "line-through cursor-not-allowed")
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
        )}
      </div>
      {parsed?.formula ? <CompoundInfo cs={parsed.formula} /> : null}
      {/* {balanced && (
          <Katex
            src={
              balanced.left.map(latexCompoundTop).join(" + ") +
              " \\Longrightarrow " +
              balanced.right.map(latexCompoundTop).join(" + ")
            }
          />
        )} */}
      {doBalance && balanced ? (
        <BalanceEquation eq={balanced} />
      ) : parsed && parsed.eq ? (
        <BalanceEquation eq={parsed.eq} />
      ) : null}

      {
        <details
          open={showTable}
          onClick={() => {
            setFocus([]);
            requestAnimationFrame(() => {
              setFocus(focus);
            });
          }}
          // className={showTable ? "" : "pointer-events-none h-0"}
        >
          <summary className="outline-none cursor-pointer">
            PeriodicTable
          </summary>
          <PeriodicTable focus={focus} onClick={onClickElement} />
        </details>
      }
    </div>
  );
};

const DataRow: React.FC<{ title: React.ReactChild; className?: string }> = ({
  title,
  children,
  className,
}) => {
  return (
    <>
      <label className={"font-bold " + className}>{title}</label>
      {React.Children.only(children)}
    </>
  );
};

const CompoundInfo: React.FC<{ cs: Compound[] }> = ({ cs }) => {
  const c =
    cs.length == 1 &&
    cs[0].compound &&
    cs[0].compound.length == 1 &&
    cs[0].compound[0].element
      ? cs[0].compound[0]
      : null;

  const cData = c ? c.element : null;

  return (
    <div className="grid gap-2 place-items-center">
      <Katex src={cs.map(latexCompoundTop).join(" + ")} />
      <div
        className="grid text-right"
        style={{ gridTemplateColumns: "auto auto", columnGap: "2em" }}
      >
        <DataRow title="Atomic Mass:">
          <Katex src={`${calculateAtomicMass(cs)} {g \\over mol}`} />
        </DataRow>

        {cData ? (
          <>
            <DataRow title="Atomic Nr:">
              <Katex src={`\\text{${cData.atomicNumber}}`} />
            </DataRow>
            <DataRow title="Name:">
              <Katex src={`\\text{${cData.name}}`} />
            </DataRow>
            <DataRow title="Period:">
              <Katex src={`\\text{${cData.period}}`} />
            </DataRow>
            <DataRow title="Group:">
              <Katex src={`\\text{${cData.group}}`} />
            </DataRow>
            <ElectronConfigList base={cData} />
            <DataRow title="Oxidation States:">
              {cData.oxidationStates ? (
                <Katex src={cData.oxidationStates.join(", ")} />
              ) : (
                <p>Missing</p>
              )}
            </DataRow>
          </>
        ) : null}
      </div>
      {cData ? (
        <details className="w-full">
          <summary className="outline-none cursor-pointer">Details:</summary>
          <div
            className="grid gap-1 text-xs"
            style={{ gridTemplateColumns: "auto auto" }}
          >
            {keys(cData).map((k) => {
              const v = cData[k];

              const latex = Array.isArray(v)
                ? v.join(", ")
                : typeof v == "boolean"
                ? v
                  ? "\\text{Yes}"
                  : ""
                : typeof v == "string"
                ? `\\text{${v}}`
                : v?.toString();

              return (
                <React.Fragment key={k}>
                  <div className="font-bold">{k}</div>
                  <div className="text-right">
                    {latex ? <Katex src={latex} /> : <p />}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {/* <pre>{JSON.stringify(cData, null, 2)}</pre> */}
        </details>
      ) : null}
    </div>
  );
};

const ElectronConfigList: React.FC<{ base: KimiElement }> = ({ base }) => {
  const [expand, setExpand] = React.useState(false);
  let i = 0;
  const entries = [
    <DataRow
      key={i++}
      title={
        <>
          <input
            type="checkbox"
            checked={expand}
            onChange={(e) => setExpand(e.target.checked)}
          />{" "}
          Election Config:
        </>
      }
      className="cursor-pointer select-none"
    >
      <Katex src={(base.electronicConfiguration || "").replace(/ /g, "\\;")} />
    </DataRow>,
  ];

  if (expand) {
    const re = /\[([a-z]*)\] (.*)/i;
    let m = re.exec(base.electronicConfiguration);
    while (m) {
      const sym = m[1];
      const next = data.elements[sym];
      entries.push(
        <DataRow title={<Katex src={sym} key={i++} />}>
          <Katex
            src={(next.electronicConfiguration || "").replace(/ /g, "\\;")}
          />
        </DataRow>
      );

      m = re.exec(next.electronicConfiguration);
    }
  }

  return <>{entries}</>;
};

const BalanceEquation: React.FC<{
  eq: { left: Compound[]; right: Compound[] };
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
        eq.left.map((c, i) => (
          <CompoundMessure
            key={i}
            c={c}
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
      <Katex src="\Longrightarrow" />
      {intersperse(
        eq.right.map((c, i) => (
          <CompoundMessure
            key={i}
            c={c}
            molesBase={molesBase(i + eq.left.length)}
            setMolesBase={(b) => setMolesBase(i + eq.left.length, b)}
            fixed={fixed(i + eq.left.length)}
            setFixed={(f) => setFixed(i + eq.left.length, f)}
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
  c: Compound;
  setMolesBase: (x: number) => void;
  fixed: boolean;
  setFixed: (x: boolean) => void;
  molesBase: number;
  molesBaseLimit: number;
}> = ({ c, setMolesBase, molesBase, fixed, setFixed, molesBaseLimit }) => {
  const digits = 1000;
  const round = (x: number) => Math.round(x * digits) / digits;
  const mass = React.useMemo(() => calculateAtomicMass([setMulti(c, 1)]), [c]);

  const moles = molesBase * c.multi;
  const grams = moles * mass;

  const setMoles = React.useCallback(
    (moles: number) => setMolesBase(moles / c.multi),
    [setMolesBase, c.multi, fixed]
  );
  const setGrams = React.useCallback(
    (grams: number) => setMoles(grams / mass),
    [setMoles, mass]
  );

  return (
    <div className="flex flex-col items-center">
      <Katex src={latexCompoundTop(c)} />
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
      <p>Excess: {round((molesBase - molesBaseLimit) * c.multi * mass)}g</p>
    </div>
  );
};

const AnnotatedInput: React.FC<{
  value: number;
  onChange: (newValue: number) => void;
  placeholder: string;
  annotation: React.ReactNode;
}> = ({ value, onChange, placeholder, annotation }) => {
  const [focus, setFocus] = React.useState(false);
  const [ownValue, setOwnValue] = React.useState("");

  React.useEffect(() => {
    if (!focus) setOwnValue(value.toString());
  }, [focus, value]);

  return (
    <div className="grid" style={{ gridTemplateColumns: "7em 2em" }}>
      <input
        type="number"
        className="font-mono text-right bg-transparent"
        placeholder={placeholder}
        value={focus ? ownValue : value}
        onChange={(e) => {
          setOwnValue(e.target.value);
          onChange(parseFloat(e.target.value));
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      <span>{annotation}</span>
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector("#app")!);
