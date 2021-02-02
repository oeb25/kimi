import * as React from "react";
import {
  toBalanced,
  calculateAtomicMass,
  extractElements,
  equibThing,
  determineOxidations,
  tallyElements,
} from "./calc";
import {
  Compound,
  latexCompoundTop,
  parse,
  setMulti,
  Equation,
  latexCompound,
} from "./parse";
import { Katex } from "./Katex";
import { intersperse, keys, mapValues, values } from "./util";
import * as data from "./data";
import { KimiElement } from "./data";
import { PeriodicTable } from "./PeriodicTable";
import * as mathjs from "mathjs";

export const Precision = React.createContext(3);

export const KimiApp: React.FC<{}> = ({}) => {
  const [focus, setFocus] = React.useState<KimiElement[]>([]);
  const [showTable, setShowTable] = React.useState(false);

  // const [input, setInput] = React.useState("TiCl4 + Mg = Ti + MgCl2");
  // const [input, setInput] = React.useState("HCOOH = HCOO- + H+");
  const [input, setInput] = React.useState("C10H12N2O");
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
      (parsed?.compound?.compound?.length == 1 &&
        parsed?.compound.compound[0].element)
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
      {parsed?.compound ? <CompoundInfo c={parsed.compound} /> : null}
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
        <details>
          <summary className="w-full outline-none cursor-pointer">
            Equilibrium
          </summary>

          <Equilibrium2 eq={(doBalance && balanced) || parsed.eq} />
        </details>
      )}

      {parsed?.compound ? (
        <details>
          <summary className="w-full outline-none cursor-pointer">
            Oxidation
          </summary>

          <div className="grid items-start grid-flow-col gap-4 justify-items-start">
            {determineOxidations(parsed.compound)
              // .filter((c) => c.oxidation == 0)
              .map((c) => (
                <Katex src={latexCompoundTop({ ...c, charge: c.oxidation })} />
              ))}
          </div>
        </details>
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
          <summary className="w-full outline-none cursor-pointer">
            Periodic Table
          </summary>
          <PeriodicTable focus={focus} onClick={onClickElement} />
        </details>
      }
    </div>
  );
};

const newtonApproximate = (s: string, tolerance = 0.00000001) => {
  try {
    const fParsed = mathjs.parse(s);
    const dfParsed = mathjs.derivative(s, "x");

    const f = (x: number) => fParsed.evaluate({ x });
    const df = (x: number) => dfParsed.evaluate({ x });

    const maxCount = 1000;

    let deriv = fParsed;
    let degree = 0;
    while (!deriv.equals(mathjs.parse("0"))) {
      deriv = mathjs.derivative(deriv, "x");
      degree += 1;
      if (degree > 10) throw "fuck degree explodes";
    }

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

const Equilibrium2: React.FC<{ eq: Equation }> = ({ eq }) => {
  const numCols = eq.left.length + eq.right.length;

  const [initial, setInitial] = React.useState(
    eq.left.concat(eq.right).map((x, i) => (i < 2 ? (0.75 as number) : 0))
  );
  const [equibConst, setEquibConst] = React.useState(56.3);

  const denom = eq.left
    .map((c, i) => {
      const init = initial[i];
      return `(${init} - ${c.multi}x)^${c.multi}`;
    })
    .join(" * ");
  const num = eq.right
    .map((c, i) => {
      const init = initial[i + eq.left.length];
      return `(${init} + ${c.multi}x)^${c.multi}`;
    })
    .join(" * ");
  const frac = `(${num})/(${denom})`;

  const equationForX = `${equibConst} * (${denom}) - (${num})`;

  // const x = newtonApproximate(`${frac} - ${equibConst}`);
  const x = newtonApproximate(equationForX).filter((x) => x >= 0);

  const foundItLeft = eq.left.findIndex(
    (c) =>
      c.charge == 1 &&
      c.compound?.length === 0 &&
      c.compound[0].element?.symbol == "H"
  );
  const foundItRight = eq.right.findIndex(
    (c) =>
      c.compound?.length === 1 &&
      c.compound[0].charge == 1 &&
      c.compound[0].element?.symbol == "H"
  );
  console.log(foundItLeft, eq.left, foundItRight, eq.right);

  const renderInitial = (c: Compound, side: "left" | "right", i: number) => (
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
  const renderChange = (c: Compound, side: "left" | "right", i: number) => (
    <UnitInput
      key={i}
      value={`${side == "left" ? "-" : "+"}${c.multi}x`}
      placeholder="a"
      unit="M"
    />
  );
  const renderEquilibrium = (
    c: Compound,
    side: "left" | "right",
    i: number
  ) => (
    <UnitInput
      value={initial[i] + (side == "left" ? -1 : 1) * c.multi * x[0]}
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
          eq.left.map((c, i) => (
            <div key={i} className="text-center">
              <Katex src={latexCompoundTop(c)} />
            </div>
          )),
          (idx) => (
            <div key={"sep-" + idx} className="text-center">
              <Katex src="+" />
            </div>
          )
        )}
        <Katex src={"="} />
        {intersperse(
          eq.right.map((c, i) => (
            <div key={i} className="text-center">
              <Katex src={latexCompoundTop(c)} />
            </div>
          )),
          (idx) => (
            <div key={"sep-" + idx} className="text-center">
              <Katex src="+" />
            </div>
          )
        )}

        <span>Initial</span>
        {intersperse(
          eq.left.map((c, i) => renderInitial(c, "left", i)),
          (idx) => (
            <span key={"sep-" + idx} />
          )
        )}
        <span />
        {intersperse(
          eq.right.map((c, i) => renderInitial(c, "right", i + eq.left.length)),
          (idx) => (
            <span key={"sep-" + idx} />
          )
        )}

        <span>Change</span>
        {intersperse(
          eq.left.map((c, i) => renderChange(c, "left", i)),
          (idx) => (
            <span key={"sep-" + idx} />
          )
        )}
        <span />
        {intersperse(
          eq.right.map((c, i) => renderChange(c, "right", i + eq.left.length)),
          (idx) => (
            <span key={"sep-" + idx} />
          )
        )}

        <span>Equilibrium</span>
        {intersperse(
          eq.left.map((c, i) => renderEquilibrium(c, "left", i)),
          (idx) => (
            <span key={"sep-" + idx} />
          )
        )}
        <span />
        {intersperse(
          eq.right.map((c, i) =>
            renderEquilibrium(c, "right", i + eq.left.length)
          ),
          (idx) => (
            <span key={"sep-" + idx} />
          )
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
        <Katex src={mathjs.parse(frac).toTex()} />
      </div>
    </div>
  );
};

const Equilibrium: React.FC<{}> = ({}) => {
  const [a, setA] = React.useState(0.25);
  const [b, setB] = React.useState(1.4e-11);
  const [u, setU] = React.useState(0);
  const [v, setV] = React.useState(0);

  const res = equibThing(a, b, u, v);

  console.log({ a, b, u, v }, res);

  return (
    <div>
      <div
        className="grid border-b"
        style={{ gridTemplateColumns: "auto repeat(3, auto)" }}
      >
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
      <UnitInput value={b} placeholder="b" onChange={setB} unit="Ka/Kb" />
      <UnitInput
        value={res ? res.pH : NaN}
        placeholder="res ? res.pH : NaN"
        unit="pH"
      />
      <UnitInput
        value={res ? (res.x / a) * 100 : NaN}
        placeholder="res ? res.x : NaN"
        unit="%"
      />
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

const countMolesIn = (c: Compound) =>
  values(tallyElements(c)).reduce((a, b) => a + b, 0);

const CompoundInfo: React.FC<{ c: Compound }> = ({ c }) => {
  const e =
    c.compound && c.compound.length == 1 && c.compound[0].element
      ? c.compound[0]
      : null;

  const cData = e ? e.element : null;

  const atomicMass = calculateAtomicMass([c]);

  // const [moles, setMoles] = React.useState(1);
  const totalMoles = countMolesIn(c);

  return (
    <div className="grid gap-2 place-items-center">
      {c.compound && c.compound.length > 1 && (
        <div
          className="grid pb-1 border-b border-gray-900 gap-x-4 place-items-end"
          style={{
            gridTemplateColumns: `repeat(${c.compound!.length + 1}, auto)`,
          }}
        >
          <span />
          {c.compound!.map((c, i) => (
            <div key={i} className="text-center place-self-center">
              <Katex src={latexCompound(c)} />
            </div>
          ))}

          <b className="text-right">Moles in 1 mol:</b>
          {c.compound!.map((x, i) => (
            <UnitInput
              key={i}
              placeholder="Ehh"
              unit={<Katex src="mol" />}
              value={(countMolesIn(x) / totalMoles) * c.multi}
              minWidth={true}
            />
          ))}

          <b>Atomic Mass:</b>
          {c.compound!.map((c, i) => (
            <UnitInput
              key={i}
              placeholder="Ehh"
              unit={<Katex src="{g \over mol}" />}
              value={calculateAtomicMass([c])}
              minWidth={true}
            />
          ))}
          <span />
          {c.compound!.map((x, i) => (
            <UnitInput
              key={i}
              placeholder="Ehh"
              unit={<Katex src="\%" />}
              value={(calculateAtomicMass([x]) / atomicMass) * c.multi * 100}
              minWidth={true}
            />
          ))}
        </div>
      )}

      <Katex src={latexCompoundTop(c)} />

      <div
        className="grid text-right"
        style={{ gridTemplateColumns: "auto auto", columnGap: "2em" }}
      >
        <DataRow title="Atomic Mass:">
          <Katex src={`${atomicMass} {g \\over mol}`} />
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
                <Katex
                  src={cData.oxidationStates
                    .filter((o) => o.ions)
                    .map((o) => {
                      const ions = o.ions < 0 ? o.ions : "+" + o.ions;
                      return o.common
                        ? // ? `\\htmlStyle{color: gray;}{\\bm{${ions}}}`
                          `\\bm{${ions}}`
                        : `\\htmlStyle{opacity: 0.3;}{${ions}}`;
                    })
                    .join(", ")}
                />
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
                ? v.map((x) => x.ions).join(", ")
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
        <DataRow key={i++} title={<Katex src={sym} />}>
          <Katex
            src={(next.electronicConfiguration || "").replace(/ /g, "\\;")}
          />
        </DataRow>
      );

      m = re.exec(next.electronicConfiguration);
    }
  }

  return <React.Fragment key={"idk-" + i}>{entries}</React.Fragment>;
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
      <Katex src="=" />
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
  return (
    <UnitInput
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      unit={annotation}
    />
  );
};

const UnitInput: React.FC<
  | {
      value: number;
      onChange?: (x: number) => void;
      placeholder: string;
      precision?: number;
      unit?: React.ReactNode;
      minWidth?: boolean;
    }
  | {
      value: string;
      onChange?: undefined;
      placeholder: string;
      precision?: number;
      unit?: React.ReactNode;
      minWidth?: boolean;
    }
> = (args) => {
  const { placeholder, precision: prec, unit, minWidth = false } = args;

  const [focus, setFocus] = React.useState(false);
  const [ownValue, setOwnValue] = React.useState("");

  const ctxPrec = React.useContext(Precision);
  const precision =
    typeof prec == "number" ? prec : typeof ctxPrec == "number" ? ctxPrec : 3;

  React.useEffect(() => {
    if (!args.onChange) return;

    if (!focus) {
      if (evaluate(ownValue) != args.value)
        setOwnValue(prettyNumber(args.value, precision));
    }
  }, [focus, args.value]);

  return (
    <div className="flex font-mono">
      {args.onChange ? (
        <input
          // type="number"
          className={"w-32 text-right bg-transparent border-b border-gray-700"}
          placeholder={placeholder}
          value={
            focus || evaluate(ownValue) == args.value
              ? ownValue
              : prettyNumber(args.value, precision)
          }
          onChange={(e) => {
            if (!args.onChange) return;
            setOwnValue(e.target.value);
            args.onChange(evaluate(e.target.value));
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
      ) : (
        <span
          // type="number"
          className={
            "italic text-right text-gray-400 bg-transparent " +
            (minWidth ? "" : "w-32")
          }
        >
          {focus || evaluate(ownValue) == args.value
            ? ownValue
            : typeof args.value == "string"
            ? args.value
            : prettyNumber(args.value, precision)}
        </span>
      )}
      <div className={"pl-1 " + (minWidth && false ? "" : "w-10")}>{unit}</div>
    </div>
  );
};

// const prettyNumber = (x: number, precision: number) =>
//   10 > x && x >= 1
//     ? x.toFixed(precision)
//     : ((10000 > Math.abs(x) && Math.abs(x) > 0.0001) || x == 0) &&
//       (Math.abs(x) % 1).toString().length <= precision + 3
//     ? x.toString()
//     : x.toExponential(precision);
// const prettyNumber = (x: number, precision: number) =>
//   10 > x && x >= 1
//     ? x.toFixed(precision)
//     : (10000 > Math.abs(x) && Math.abs(x) > 0.0001) || x == 0
//     ? (Math.abs(x) % 1).toString().length > precision + 3
//       ? x.toFixed(precision)
//       : x.toString()
//     : x.toExponential(precision);
// const DANGER = true;
// const evaluate = (x: string) => (DANGER ? eval(x) : parseFloat(x));

const prettyNumber = (x: number, precision: number) =>
  mathjs.format(x, { precision });
const evaluate = (x: string) => mathjs.evaluate(x) as number;
